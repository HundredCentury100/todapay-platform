import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Agent-to-Agent Protocol - stateful multi-turn transaction workflows
const A2A_VERSION = "1.0.0";

async function verifyAgentKey(supabase: any, apiKey: string) {
  // Hash the key and look it up
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  const { data: agent, error } = await supabase
    .from("registered_agents")
    .select("*")
    .eq("api_key_hash", hashHex)
    .eq("status", "active")
    .single();

  return agent;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const url = new URL(req.url);
  const action = url.pathname.split("/").pop();

  try {
    // Registration endpoint - no auth required
    if (action === "register" && req.method === "POST") {
      const { agent_name, agent_url, capabilities, registered_by_user_id } = await req.json();

      if (!agent_name || !agent_url) {
        return new Response(
          JSON.stringify({ error: "agent_name and agent_url are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate API key
      const apiKey = `suvat_a2a_${crypto.randomUUID().replace(/-/g, "")}`;
      const encoder = new TextEncoder();
      const keyData = encoder.encode(apiKey);
      const hashBuffer = await crypto.subtle.digest("SHA-256", keyData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      const { data, error } = await supabase.from("registered_agents").insert({
        agent_name,
        agent_url,
        api_key_hash: hashHex,
        capabilities: capabilities || [],
        status: "pending",
        registered_by: registered_by_user_id || null,
      }).select().single();

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          agent_id: data.id,
          api_key: apiKey, // Only shown once
          status: "pending",
          message: "Agent registered. API key will be active after admin approval.",
          ucp_manifest: `${SUPABASE_URL}/functions/v1/universal-commerce-protocol`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // All other endpoints require agent authentication
    const agentApiKey = req.headers.get("x-agent-api-key");
    if (!agentApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing x-agent-api-key header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const agent = await verifyAgentKey(supabase, agentApiKey);
    if (!agent) {
      return new Response(
        JSON.stringify({ error: "Invalid or inactive API key" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Negotiate: Start a transaction session ---
    if (action === "negotiate" && req.method === "POST") {
      const { intent, vertical, parameters, on_behalf_of } = await req.json();

      // Create commerce session for this agent
      const { data: session } = await supabase.from("commerce_sessions").insert({
        external_agent_id: agent.id,
        session_type: "a2a",
        context: { intent, on_behalf_of, agent_name: agent.agent_name },
      }).select().single();

      // Log transaction
      const { data: txn } = await supabase.from("a2a_transactions").insert({
        agent_id: agent.id,
        session_id: session.id,
        transaction_type: intent,
        vertical,
        status: "initiated",
        metadata: parameters,
        commission_chain: [
          { agent: agent.agent_name, rate: agent.commission_rate, role: "referring_agent" },
          { agent: "Suvat Platform", rate: 8, role: "platform" },
        ],
      }).select().single();

      return new Response(
        JSON.stringify({
          session_id: session.id,
          transaction_id: txn.id,
          status: "initiated",
          next_actions: ["search", "hold", "book", "cancel"],
          expires_in: 1800, // 30 minutes
          commission_structure: txn.commission_chain,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Execute: Perform an action within a session ---
    if (action === "execute" && req.method === "POST") {
      const { session_id, transaction_id, action: txnAction, parameters } = await req.json();

      // Verify session belongs to this agent
      const { data: session } = await supabase
        .from("commerce_sessions")
        .select("*")
        .eq("id", session_id)
        .eq("external_agent_id", agent.id)
        .single();

      if (!session) {
        return new Response(
          JSON.stringify({ error: "Session not found or access denied" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let result: any = {};

      switch (txnAction) {
        case "search": {
          const { vertical, query, date, limit = 10 } = parameters;
          const tableMap: Record<string, string> = {
            buses: "bus_schedules", events: "events", stays: "properties",
            experiences: "experiences", venues: "venues", workspaces: "workspaces",
          };
          const table = tableMap[vertical];
          if (!table) { result = { error: "Unsupported vertical" }; break; }

          let q = supabase.from(table).select("*").limit(limit);
          if (query) q = q.or(`from_location.ilike.%${query}%,to_location.ilike.%${query}%,title.ilike.%${query}%,name.ilike.%${query}%`);
          if (date) q = q.eq("available_date", date);

          const { data } = await q;
          result = { items: data || [], count: data?.length || 0 };
          break;
        }

        case "hold": {
          const { item_id, vertical, quantity = 1 } = parameters;
          const heldItems = session.held_items || [];
          heldItems.push({
            item_id, vertical, quantity,
            held_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          });
          await supabase.from("commerce_sessions").update({ held_items: heldItems }).eq("id", session_id);
          result = { held: true, expires_in: 600 };
          break;
        }

        case "book": {
          const { item_id, vertical, passenger_name, passenger_email, passenger_phone, quantity = 1 } = parameters;
          const bookingRef = Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

          const { data: booking, error } = await supabase.from("bookings").insert({
            booking_type: vertical,
            vertical,
            item_id,
            item_name: `A2A ${vertical} booking`,
            passenger_name,
            passenger_email,
            passenger_phone,
            guest_email: passenger_email,
            ticket_number: `A2A-${Date.now().toString(36).toUpperCase()}`,
            booking_reference: bookingRef,
            base_price: 25,
            total_price: 27,
            payment_status: "pending",
            status: "confirmed",
          }).select().single();

          if (error) { result = { error: error.message }; break; }

          // Update transaction status
          await supabase.from("a2a_transactions").update({
            status: "booked",
            amount: booking.total_price,
            metadata: { ...parameters, booking_reference: bookingRef },
          }).eq("id", transaction_id);

          result = {
            booking_reference: bookingRef,
            status: "confirmed",
            total_price: booking.total_price,
            currency: "USD",
          };
          break;
        }

        case "cancel": {
          await supabase.from("a2a_transactions").update({ status: "cancelled" }).eq("id", transaction_id);
          await supabase.from("commerce_sessions").update({ status: "closed" }).eq("id", session_id);
          result = { cancelled: true };
          break;
        }

        default:
          result = { error: "Unknown action", available: ["search", "hold", "book", "cancel"] };
      }

      return new Response(
        JSON.stringify({ session_id, transaction_id, action: txnAction, result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Status: Check transaction status ---
    if (action === "status" && req.method === "GET") {
      const txnId = url.searchParams.get("transaction_id");
      const { data: txn } = await supabase
        .from("a2a_transactions")
        .select("*")
        .eq("id", txnId)
        .eq("agent_id", agent.id)
        .single();

      if (!txn) {
        return new Response(
          JSON.stringify({ error: "Transaction not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(txn),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default: protocol info
    return new Response(
      JSON.stringify({
        protocol: "Agent-to-Agent Protocol",
        version: A2A_VERSION,
        endpoints: {
          register: "POST /register",
          negotiate: "POST /negotiate",
          execute: "POST /execute",
          status: "GET /status?transaction_id=...",
        },
        supported_verticals: ["buses", "events", "stays", "experiences", "venues", "workspaces", "transfers", "car_rentals"],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("A2A error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
