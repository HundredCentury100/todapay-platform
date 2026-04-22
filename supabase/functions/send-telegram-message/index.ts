import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendTelegramRequest {
  chat_id: number;
  text: string;
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
  reply_markup?: any;
  photo_url?: string; // If provided, sends a photo with caption instead of text
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
    if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");

    const { chat_id, text, parse_mode = "HTML", reply_markup, photo_url }: SendTelegramRequest = await req.json();

    if (!chat_id || !text) {
      return new Response(JSON.stringify({ error: "chat_id and text are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headers = {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TELEGRAM_API_KEY,
      "Content-Type": "application/json",
    };

    let response: Response;

    if (photo_url) {
      // Send as photo with caption
      const body: any = {
        chat_id,
        photo: photo_url,
        caption: text.slice(0, 1024), // Telegram caption limit
        parse_mode,
      };
      if (reply_markup) body.reply_markup = reply_markup;

      response = await fetch(`${GATEWAY_URL}/sendPhoto`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
    } else {
      // Send as text message
      const body: any = { chat_id, text, parse_mode };
      if (reply_markup) body.reply_markup = reply_markup;

      response = await fetch(`${GATEWAY_URL}/sendMessage`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Telegram ${photo_url ? 'sendPhoto' : 'sendMessage'} failed [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message_id: data.result?.message_id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending Telegram message:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
