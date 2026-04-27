import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import { buildPremiumEmail } from "../_shared/email-template.ts";

const BRANDED_SENDER = "TodaPay <support@notify.TodaPay.com>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, transactionType, amount, description, walletTransactionId } = await req.json();

    if (!userId || !transactionType || !amount) {
      return new Response(JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: profile } = await supabase.from("profiles").select("full_name, email, phone").eq("id", userId).single();
    if (!profile) {
      return new Response(JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const isCredit = ["credit", "topup", "refund", "gift_card_redemption"].includes(transactionType);
    const formattedAmount = Number(amount).toFixed(2);
    const verb = isCredit ? "credited to" : "debited from";

    const title = `Wallet ${isCredit ? "Credit" : "Debit"} ${isCredit ? "💰" : "💳"}`;
    const body = `$${formattedAmount} ${verb} your wallet. ${description || ""}`.trim();

    // 1. In-app notification
    await supabase.from("user_notifications").insert({
      user_id: userId, title, body,
      notification_type: "wallet",
      data: { type: transactionType, amount, wallet_transaction_id: walletTransactionId },
    });

    // 2. SMS notification
    if (profile.phone) {
      const sendaiApiKey = Deno.env.get("SENDAI_API_KEY");
      if (sendaiApiKey) {
        const phone = profile.phone.startsWith("0") ? "263" + profile.phone.substring(1)
          : profile.phone.startsWith("+") ? profile.phone.substring(1) : profile.phone;
        try {
          await fetch("https://api.sendai.co.zw/api/v1/sms/send", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${sendaiApiKey}` },
            body: JSON.stringify({ sender_id: "TodaPay", to: phone, message: `FulTicket Wallet: $${formattedAmount} ${verb} your wallet. ${description || ""}`.trim() }),
          });
          await supabase.from("sms_logs").insert({
            phone_number: phone, message_type: "wallet_notification", status: "sent", provider: "sendai",
            metadata: { transactionType, amount, walletTransactionId },
          });
        } catch (smsErr) {
          console.error("SMS failed:", smsErr);
        }
      }
    }

    // 3. Email via Lovable Email queue
    if (profile.email) {
      try {
        const htmlContent = buildPremiumEmail({
          type: 'notification',
          title,
          subtitle: 'Wallet Transaction',
          greeting: `Hi ${profile.full_name || "there"},`,
          details: [
            { label: 'Type', value: transactionType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) },
            ...(description ? [{ label: 'Description', value: description }] : []),
          ],
          totalLabel: isCredit ? 'Amount Credited' : 'Amount Debited',
          totalValue: `${isCredit ? '+' : '-'}$${formattedAmount}`,
          totalBadge: 'COMPLETED',
          ctaLabel: 'View Wallet',
          ctaUrl: 'https://TodaPay.com/wallet',
        });

        await supabase.rpc('enqueue_email', {
          queue_name: 'transactional_emails',
          payload: { from: BRANDED_SENDER, to: [profile.email], subject: title, html: htmlContent },
        });
      } catch (emailErr) {
        console.error("Email failed:", emailErr);
      }
    }

    return new Response(JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
