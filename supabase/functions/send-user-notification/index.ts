import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildPremiumEmail } from "../_shared/email-template.ts";

const BRANDED_SENDER = "fulticket <support@notify.fulticket.com>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type NotificationType =
  | 'booking_confirmed' | 'booking_cancelled' | 'booking_reminder'
  | 'ride_update' | 'ride_completed' | 'ride_receipt'
  | 'payment_received' | 'refund_processed'
  | 'bill_payment' | 'bill_payment_pending'
  | 'wallet_topup' | 'promotional';

interface UserNotificationRequest {
  userId: string;
  userEmail?: string;
  notificationType: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  sendEmail?: boolean;
  sendPush?: boolean;
}

function buildNotificationEmail(notificationType: NotificationType, title: string, body: string, data: any): string {
  const typeMap: Record<string, 'confirmation' | 'receipt' | 'notification' | 'alert'> = {
    booking_confirmed: 'confirmation', booking_cancelled: 'alert', booking_reminder: 'notification',
    ride_update: 'notification', ride_completed: 'confirmation', ride_receipt: 'receipt',
    payment_received: 'confirmation', refund_processed: 'notification',
    bill_payment: 'confirmation', bill_payment_pending: 'notification',
    wallet_topup: 'confirmation', promotional: 'notification',
  };

  const details: { label: string; value: string }[] = [];
  if (data?.bookingReference) details.push({ label: 'Reference', value: data.bookingReference });
  if (data?.amount) details.push({ label: 'Amount', value: `$${Number(data.amount).toFixed(2)}` });
  if (data?.billerName) details.push({ label: 'Biller', value: data.billerName });
  if (data?.accountNumber) details.push({ label: 'Account', value: data.accountNumber });
  if (data?.receiptNumber) details.push({ label: 'Receipt', value: data.receiptNumber });
  if (data?.driverName) details.push({ label: 'Driver', value: data.driverName });
  if (data?.transactionReference) details.push({ label: 'Ref', value: data.transactionReference });

  let customHtml = '';
  if (data?.tokens && Array.isArray(data.tokens) && data.tokens.length > 0) {
    customHtml = `<div style="background:#fef3c7;border:2px solid #f59e0b;padding:16px;border-radius:8px;margin:16px 0;">
      <h3 style="color:#92400e;margin:0 0 8px 0;">⚡ Your ZESA Token(s)</h3>
      ${data.tokens.map((t: string) => `<p style="font-family:monospace;font-size:18px;font-weight:bold;margin:4px 0;color:#111;">${t}</p>`).join('')}
      ${data.kwh ? `<p style="margin:8px 0 0 0;color:#666;">Units: ${data.kwh} kWh</p>` : ''}
    </div>`;
  }

  return buildPremiumEmail({
    type: typeMap[notificationType] || 'notification',
    title,
    greeting: body,
    details: details.length > 0 ? details : undefined,
    customHtml: customHtml || undefined,
    ctaLabel: 'Open fulticket',
    ctaUrl: 'https://fulticket.com',
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const {
      userId, userEmail, notificationType, title, body, data = {},
      sendEmail = true, sendPush = true,
    }: UserNotificationRequest = await req.json();

    console.log(`Sending ${notificationType} notification to user ${userId}`);

    // 1. In-app notification
    const { error: notifError } = await supabase.from('user_notifications').insert({
      user_id: userId, type: notificationType, title, message: body, read: false, metadata: data,
    });
    if (notifError) console.error('Error creating notification:', notifError);

    // 2. Push notifications
    let pushSent = 0;
    if (sendPush) {
      const { data: pushSubs } = await supabase.from('push_subscriptions').select('*').eq('user_id', userId).eq('is_active', true);
      if (pushSubs?.length) {
        pushSent = pushSubs.length;
        await supabase.from('push_subscriptions').update({ last_used_at: new Date().toISOString() }).in('id', pushSubs.map(s => s.id));
      }
    }

    // 3. Email via Lovable Email queue
    let emailSent = false;
    let recipientEmail = userEmail;
    if (!recipientEmail) {
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', userId).single();
      recipientEmail = profile?.email;
    }

    if (sendEmail && recipientEmail && notificationType !== 'promotional') {
      try {
        const htmlContent = buildNotificationEmail(notificationType, title, body, data);
        await supabase.rpc('enqueue_email', {
          queue_name: 'transactional_emails',
          payload: {
            from: BRANDED_SENDER,
            to: [recipientEmail],
            subject: `${title} | fulticket`,
            html: htmlContent,
          },
        });
        emailSent = true;
        console.log(`Email enqueued for ${recipientEmail}`);
      } catch (emailErr) {
        console.error('Email error:', emailErr);
      }
    }

    // 4. SMS
    let smsSent = false;
    const { data: profileForPhone } = await supabase.from('profiles').select('phone').eq('id', userId).single();
    const recipientPhone = profileForPhone?.phone || null;

    if (recipientPhone && notificationType !== 'promotional') {
      try {
        const smsRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-sms`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
          body: JSON.stringify({
            action: "send", to: recipientPhone,
            message: `${title}: ${body}`.slice(0, 160),
            context: notificationType,
            reference_id: data.bookingReference || data.rideId || undefined,
            user_id: userId,
          }),
        });
        smsSent = (await smsRes.json()).success === true;
      } catch (smsErr) {
        console.error('SMS error:', smsErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, in_app: !notifError, push_sent: pushSent, email_sent: emailSent, sms_sent: smsSent }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending user notification:", error);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
