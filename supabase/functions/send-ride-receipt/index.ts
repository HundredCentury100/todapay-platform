import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildPremiumEmail } from "../_shared/email-template.ts";

const BRANDED_SENDER = "fulticket <support@notify.fulticket.com>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendReceiptRequest {
  ride_id: string;
  recipient_email?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { ride_id, recipient_email }: SendReceiptRequest = await req.json();

    const { data: receipt, error: receiptError } = await supabase
      .from('ride_receipts').select('*').eq('ride_id', ride_id).single();
    if (receiptError || !receipt) throw new Error('Receipt not found');

    let email = recipient_email;
    if (!email) {
      const { data: ride } = await supabase
        .from('active_rides').select('passenger_id, ride_request:ride_requests(*)').eq('id', ride_id).single();
      if (ride?.passenger_id) {
        const { data: profile } = await supabase.from('profiles').select('email').eq('id', ride.passenger_id).single();
        email = profile?.email;
      }
    }
    if (!email) throw new Error('No email address available');

    const tripDate = receipt.pickup_time
      ? new Date(receipt.pickup_time).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : 'N/A';
    const pickupTime = receipt.pickup_time ? new Date(receipt.pickup_time).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
    const dropoffTime = receipt.dropoff_time ? new Date(receipt.dropoff_time).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : 'N/A';

    const amounts = [
      { label: 'Base fare', value: `$${receipt.base_fare.toFixed(2)}` },
      { label: `Distance (${receipt.distance_km?.toFixed(1) || 0} km)`, value: `$${receipt.distance_fare.toFixed(2)}` },
      { label: `Time (${receipt.duration_mins || 0} min)`, value: `$${receipt.time_fare.toFixed(2)}` },
    ];
    if (receipt.surge_amount > 0) amounts.push({ label: 'Surge pricing', value: `$${receipt.surge_amount.toFixed(2)}` });
    if (receipt.tip_amount > 0) amounts.push({ label: 'Tip', value: `$${receipt.tip_amount.toFixed(2)}` });

    const htmlContent = buildPremiumEmail({
      type: 'receipt',
      title: 'Ride Receipt',
      subtitle: `Trip on ${tripDate}`,
      reference: receipt.receipt_number,
      details: [
        { label: 'Pickup', value: `${receipt.pickup_address} · ${pickupTime}` },
        { label: 'Dropoff', value: `${receipt.dropoff_address} · ${dropoffTime}` },
        { label: 'Driver', value: receipt.driver_name },
      ],
      amounts,
      totalLabel: 'Total',
      totalValue: `$${receipt.total_amount.toFixed(2)}`,
      totalBadge: receipt.payment_status === 'paid' ? 'PAID' : 'PENDING',
      ctaLabel: 'View Ride History',
      ctaUrl: 'https://fulticket.com/rides/history',
    });

    await supabase.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: { from: BRANDED_SENDER, to: [email], subject: `Your ride receipt - ${receipt.receipt_number}`, html: htmlContent },
    });
    console.log("Receipt email enqueued");

    await supabase.from('ride_receipts').update({ passenger_email: email }).eq('id', receipt.id);

    return new Response(JSON.stringify({ success: true, message: 'Receipt enqueued', email }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending receipt:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
