import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildPremiumEmail } from "../_shared/email-template.ts";

const BRANDED_SENDER = "fulticket <support@notify.fulticket.com>";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const body = await req.json();
    const { provider, event, data } = body;
    console.log(`Payment webhook received from ${provider}:`, event);

    let transactionRef: string | null = null;
    let paymentStatus: string = 'pending';
    let gatewayResponse: Record<string, unknown> = {};

    switch (provider) {
      case 'flutterwave':
        transactionRef = data.tx_ref; paymentStatus = data.status === 'successful' ? 'completed' : 'failed'; gatewayResponse = data; break;
      case 'paystack':
        transactionRef = data.reference; paymentStatus = data.status === 'success' ? 'completed' : 'failed'; gatewayResponse = data; break;
      case 'dpo':
        transactionRef = data.TransactionToken; paymentStatus = data.Result === '000' ? 'completed' : 'failed'; gatewayResponse = data; break;
      case 'pesepay': case 'suvat_pay':
        transactionRef = data.referenceNumber || data.reference;
        paymentStatus = data.transactionStatus === 'SUCCESS' ? 'completed' : data.transactionStatus === 'FAILED' ? 'failed' : 'pending';
        gatewayResponse = data; break;
      default:
        return new Response(JSON.stringify({ error: 'Unknown provider' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!transactionRef) {
      return new Response(JSON.stringify({ error: 'No transaction reference' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: transaction, error: findError } = await supabase.from('transactions').select('id, booking_id, merchant_profile_id, amount').eq('transaction_reference', transactionRef).single();
    if (findError || !transaction) {
      return new Response(JSON.stringify({ error: 'Transaction not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await supabase.from('transactions').update({ payment_status: paymentStatus, payment_metadata: gatewayResponse, updated_at: new Date().toISOString() }).eq('id', transaction.id);

    await supabase.from('payment_verifications').insert({
      transaction_id: transaction.id, booking_id: transaction.booking_id, gateway_provider: provider,
      gateway_reference: transactionRef, verification_status: paymentStatus === 'completed' ? 'verified' : 'failed',
      gateway_response: gatewayResponse, verified_at: new Date().toISOString(),
    });

    if (paymentStatus === 'completed' && transaction.booking_id) {
      const { data: booking } = await supabase.from('bookings')
        .update({ payment_status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', transaction.booking_id)
        .select('passenger_email, passenger_name, passenger_phone, booking_reference, item_name, user_id, total_price')
        .single();

      if (booking) {
        // Email via Lovable queue
        try {
          const paymentHtml = buildPremiumEmail({
            type: 'receipt', title: 'Payment Confirmed', subtitle: booking.item_name,
            reference: booking.booking_reference,
            greeting: `Hi ${booking.passenger_name}, your payment has been successfully processed.`,
            details: [
              { label: 'Service', value: booking.item_name },
              { label: 'Payment Ref', value: transactionRef || 'N/A' },
            ],
            totalLabel: 'Amount Paid', totalValue: `$${booking.total_price.toFixed(2)}`, totalBadge: 'PAID',
            ctaLabel: 'View Booking', ctaUrl: 'https://fulticket.com/orders',
          });

          await supabase.rpc('enqueue_email', {
            queue_name: 'transactional_emails',
            payload: {
              from: BRANDED_SENDER, to: [booking.passenger_email],
              subject: `Payment Confirmed - ${booking.booking_reference} | fulticket`,
              html: paymentHtml,
            },
          });
        } catch (emailErr) {
          console.error('Email error:', emailErr);
        }

        // SMS
        if (booking.passenger_phone) {
          try {
            await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-sms`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
              body: JSON.stringify({
                action: "send", to: booking.passenger_phone,
                message: `Payment confirmed! Ref: ${booking.booking_reference}. Amount: $${booking.total_price.toFixed(2)}. ${booking.item_name}. Thank you for using fulticket!`.slice(0, 160),
                context: "payment_confirmed", reference_id: booking.booking_reference, user_id: booking.user_id,
              }),
            });
          } catch (smsErr) {
            console.error('SMS error:', smsErr);
          }
        }

        // In-app notification
        if (booking.user_id) {
          await supabase.from('user_notifications').insert({
            user_id: booking.user_id, type: 'payment_received', title: 'Payment Confirmed',
            message: `Your payment of $${booking.total_price.toFixed(2)} for ${booking.item_name} has been confirmed.`,
            read: false, metadata: { bookingReference: booking.booking_reference, transactionRef, amount: booking.total_price },
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, status: paymentStatus }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
