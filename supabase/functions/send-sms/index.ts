import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SENDAI_API_KEY = Deno.env.get("SENDAI_API_KEY");
const SENDAI_BASE_URL = "https://api.sendai.co.zw/api/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendSmsRequest {
  action: "send" | "batch";
  to: string | string[];
  message: string;
  from?: string;
  context?: string;
  reference_id?: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Format a phone number to the 263... international format required by Sendai.
 * Handles: 07xx, +2637xx, 2637xx
 */
function formatPhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
  if (cleaned.startsWith("0")) cleaned = "263" + cleaned.slice(1);
  if (!cleaned.startsWith("263")) cleaned = "263" + cleaned;
  return cleaned;
}

async function sendViaSendai(to: string | string[], message: string, from: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!SENDAI_API_KEY) {
    console.error("SENDAI_API_KEY not configured");
    return { success: false, error: "SMS service not configured" };
  }

  const isArray = Array.isArray(to);
  const endpoint = isArray ? "/sms/batch" : "/sms";
  const formattedTo = isArray ? (to as string[]).map(formatPhone) : formatPhone(to as string);
  const url = `${SENDAI_BASE_URL}${endpoint}`;

  console.log(`Sendai request: ${url}`);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SENDAI_API_KEY}`,
        "x-api-key": SENDAI_API_KEY,
      },
      body: JSON.stringify({ to: formattedTo, message, from }),
    });

    const text = await res.text();
    console.log(`Sendai response (${res.status}):`, text);

    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!res.ok) {
      return { success: false, error: data?.message || `HTTP ${res.status}` };
    }

    return { success: true, messageId: data?.id || data?.messageId || "sent" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Sendai fetch error:", msg);
    return { success: false, error: msg };
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: SendSmsRequest = await req.json();
    const { action = "send", to, message, from = "fulticket", context, reference_id, user_id, metadata } = body;

    if (!to || !message) {
      return new Response(JSON.stringify({ error: "Missing 'to' or 'message'" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`SMS ${action}: to=${JSON.stringify(to)}, context=${context}`);

    const result = await sendViaSendai(to, message, from);

    // Log to sms_logs table
    const recipients = Array.isArray(to) ? to : [to];
    for (const recipient of recipients) {
      await supabase.from("sms_logs").insert({
        recipient_phone: formatPhone(recipient),
        message,
        sender_id: from,
        status: result.success ? "sent" : "failed",
        context: context || null,
        reference_id: reference_id || null,
        user_id: user_id || null,
        metadata: metadata || null,
        sendai_message_id: result.messageId || null,
      });
    }

    return new Response(
      JSON.stringify({
        success: result.success,
        message_id: result.messageId,
        error: result.error,
        recipients: recipients.length,
      }),
      {
        status: result.success ? 200 : 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("send-sms error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
