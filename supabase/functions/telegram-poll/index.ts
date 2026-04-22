import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const MAX_RUNTIME_MS = 55_000;
const MIN_REMAINING_MS = 5_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
  if (!TELEGRAM_API_KEY) {
    return new Response(JSON.stringify({ error: "TELEGRAM_API_KEY is not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let totalProcessed = 0;
  let currentOffset: number;

  // Read initial offset
  const { data: state, error: stateErr } = await supabase
    .from("telegram_bot_state")
    .select("update_offset")
    .eq("id", 1)
    .single();

  if (stateErr) {
    console.error("Failed to read bot state:", stateErr);
    return new Response(JSON.stringify({ error: stateErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  currentOffset = state.update_offset;

  // Poll continuously until time runs out
  while (true) {
    const elapsed = Date.now() - startTime;
    const remainingMs = MAX_RUNTIME_MS - elapsed;

    if (remainingMs < MIN_REMAINING_MS) break;

    const timeout = Math.min(50, Math.floor(remainingMs / 1000) - 5);
    if (timeout < 1) break;

    try {
      const response = await fetch(`${GATEWAY_URL}/getUpdates`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": TELEGRAM_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offset: currentOffset,
          timeout,
          allowed_updates: ["message", "callback_query"],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("Telegram getUpdates failed:", data);
        return new Response(JSON.stringify({ error: data }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updates = data.result ?? [];
      if (updates.length === 0) continue;

      // Store messages
      const rows = updates
        .filter((u: any) => u.message || u.callback_query)
        .map((u: any) => ({
          update_id: u.update_id,
          chat_id: u.message?.chat?.id || u.callback_query?.message?.chat?.id,
          text: u.message?.text || u.callback_query?.data || null,
          raw_update: u,
          processed: false,
        }));

      if (rows.length > 0) {
        const { error: insertErr } = await supabase
          .from("telegram_messages")
          .upsert(rows, { onConflict: "update_id" });

        if (insertErr) {
          console.error("Failed to store messages:", insertErr);
        } else {
          totalProcessed += rows.length;

          // Trigger telegram-bot to process new messages
          try {
            await fetch(`${supabaseUrl}/functions/v1/telegram-bot`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({ trigger: "new_messages" }),
            });
          } catch (triggerErr) {
            console.error("Failed to trigger telegram-bot:", triggerErr);
          }
        }
      }

      // Advance offset
      const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;
      const { error: offsetErr } = await supabase
        .from("telegram_bot_state")
        .update({ update_offset: newOffset, updated_at: new Date().toISOString() })
        .eq("id", 1);

      if (offsetErr) {
        console.error("Failed to update offset:", offsetErr);
      }

      currentOffset = newOffset;
    } catch (err) {
      console.error("Poll loop error:", err);
      break;
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    processed: totalProcessed,
    finalOffset: currentOffset,
    runtime_ms: Date.now() - startTime,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
