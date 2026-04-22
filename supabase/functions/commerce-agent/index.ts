import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VERTICALS = [
  "buses", "events", "stays", "experiences", "venues",
  "workspaces", "transfers", "car_rentals", "flights", "rides", "bills"
];

const tools = [
  {
    type: "function",
    function: {
      name: "search_inventory",
      description: "Search available inventory across any vertical (buses, events, stays, experiences, venues, workspaces, transfers, car_rentals, flights)",
      parameters: {
        type: "object",
        properties: {
          vertical: { type: "string", enum: VERTICALS, description: "Service vertical to search" },
          query: { type: "string", description: "Search query or destination" },
          date: { type: "string", description: "Travel/event date (YYYY-MM-DD)" },
          passengers: { type: "number", description: "Number of passengers/guests" },
          budget_max: { type: "number", description: "Maximum budget in USD" },
        },
        required: ["vertical", "query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_hold",
      description: "Place a temporary hold on an item (seat, room, ticket) for 10 minutes while user decides",
      parameters: {
        type: "object",
        properties: {
          vertical: { type: "string", enum: VERTICALS },
          item_id: { type: "string", description: "ID of the item to hold" },
          quantity: { type: "number", description: "Number of items to hold" },
        },
        required: ["vertical", "item_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate_fees",
      description: "Calculate total price including platform fees, taxes, and any applicable discounts",
      parameters: {
        type: "object",
        properties: {
          vertical: { type: "string", enum: VERTICALS },
          item_id: { type: "string" },
          quantity: { type: "number" },
          promo_code: { type: "string", description: "Optional promo code" },
        },
        required: ["vertical", "item_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "initiate_booking",
      description: "Create a booking after user confirms. Requires passenger details.",
      parameters: {
        type: "object",
        properties: {
          vertical: { type: "string", enum: VERTICALS },
          item_id: { type: "string" },
          passenger_name: { type: "string" },
          passenger_email: { type: "string" },
          passenger_phone: { type: "string" },
          quantity: { type: "number" },
          payment_method: { type: "string", enum: ["wallet", "ecocash", "innbucks", "card"] },
        },
        required: ["vertical", "item_id", "passenger_name", "passenger_email", "passenger_phone"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_booking_status",
      description: "Check the status of an existing booking by reference number",
      parameters: {
        type: "object",
        properties: {
          booking_reference: { type: "string" },
        },
        required: ["booking_reference"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "suggest_bundle",
      description: "Suggest complementary services to bundle with current selection for a discount",
      parameters: {
        type: "object",
        properties: {
          current_vertical: { type: "string", enum: VERTICALS },
          destination: { type: "string" },
          date: { type: "string" },
        },
        required: ["current_vertical", "destination"],
      },
    },
  },
];

async function executeToolCall(supabase: any, toolName: string, args: any, userId: string | null, sessionId: string) {
  switch (toolName) {
    case "search_inventory":
      return await searchInventory(supabase, args);
    case "create_hold":
      return await createHold(supabase, args, userId, sessionId);
    case "calculate_fees":
      return await calculateFees(supabase, args);
    case "initiate_booking":
      return await initiateBooking(supabase, args, userId);
    case "get_booking_status":
      return await getBookingStatus(supabase, args);
    case "suggest_bundle":
      return await suggestBundle(supabase, args);
    default:
      return { error: "Unknown tool" };
  }
}

async function searchInventory(supabase: any, args: any) {
  const { vertical, query, date, passengers, budget_max } = args;
  const tableMap: Record<string, string> = {
    buses: "bus_schedules", events: "events", stays: "properties",
    experiences: "experiences", venues: "venues", workspaces: "workspaces",
    transfers: "transfer_services", car_rentals: "vehicles", flights: "flight_searches",
  };
  const table = tableMap[vertical];
  if (!table) return { results: [], message: "Vertical not supported for search" };

  let q = supabase.from(table).select("*").limit(10);

  if (vertical === "buses" && date) {
    q = q.eq("available_date", date);
    if (query) q = q.or(`from_location.ilike.%${query}%,to_location.ilike.%${query}%`);
  } else if (vertical === "events") {
    if (query) q = q.ilike("title", `%${query}%`);
  } else if (vertical === "stays") {
    if (query) q = q.ilike("name", `%${query}%`);
  } else if (query) {
    q = q.or(`name.ilike.%${query}%,title.ilike.%${query}%`).limit(10);
  }

  if (budget_max && ["buses", "events"].includes(vertical)) {
    q = q.lte("base_price", budget_max);
  }

  const { data, error } = await q;
  if (error) return { results: [], error: error.message };

  return {
    results: (data || []).map((item: any) => ({
      id: item.id,
      name: item.title || item.name || item.operator || "Unknown",
      price: item.base_price || item.price_per_night || item.price || null,
      date: item.available_date || item.event_date || null,
      location: item.from_location || item.city || item.location || null,
      vertical,
    })),
    total: data?.length || 0,
  };
}

async function createHold(supabase: any, args: any, userId: string | null, sessionId: string) {
  const { vertical, item_id, quantity = 1 } = args;
  
  // Update session with held item
  const { data: session } = await supabase
    .from("commerce_sessions")
    .select("held_items")
    .eq("id", sessionId)
    .single();

  const heldItems = session?.held_items || [];
  heldItems.push({
    vertical, item_id, quantity,
    held_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });

  await supabase.from("commerce_sessions").update({ held_items: heldItems }).eq("id", sessionId);

  return {
    success: true,
    message: `Held ${quantity} item(s) for 10 minutes`,
    hold_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  };
}

async function calculateFees(supabase: any, args: any) {
  const { vertical, item_id, quantity = 1, promo_code } = args;
  // Simplified fee calculation
  const basePrice = 25; // Would look up actual price
  const platformFee = basePrice * 0.10;
  const serviceFee = Math.floor(basePrice / 50) * 1;
  const total = (basePrice + platformFee + serviceFee) * quantity;

  return {
    base_price: basePrice,
    quantity,
    platform_fee: platformFee,
    service_fee: serviceFee,
    discount: 0,
    total: Math.round(total * 100) / 100,
    currency: "USD",
  };
}

async function initiateBooking(supabase: any, args: any, userId: string | null) {
  const { vertical, item_id, passenger_name, passenger_email, passenger_phone, quantity = 1, payment_method = "wallet" } = args;
  
  const bookingRef = Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
  const ticketNum = `T-${Date.now().toString(36).toUpperCase()}`;

  const { data, error } = await supabase.from("bookings").insert({
    booking_type: vertical,
    vertical,
    item_id,
    item_name: `${vertical} booking`,
    passenger_name,
    passenger_email,
    passenger_phone,
    guest_email: passenger_email,
    ticket_number: ticketNum,
    booking_reference: bookingRef,
    base_price: 25,
    total_price: 27,
    ticket_quantity: quantity,
    payment_status: "pending",
    status: "confirmed",
    user_id: userId,
  }).select().single();

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    booking_reference: bookingRef,
    ticket_number: ticketNum,
    message: `Booking confirmed! Reference: ${bookingRef}`,
    rich_type: "booking_confirmation",
  };
}

async function getBookingStatus(supabase: any, args: any) {
  const { booking_reference } = args;
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("booking_reference", booking_reference)
    .single();

  if (error || !data) return { found: false, message: "Booking not found" };

  return {
    found: true,
    reference: data.booking_reference,
    status: data.status,
    payment_status: data.payment_status,
    item: data.item_name,
    passenger: data.passenger_name,
    date: data.travel_date || data.event_date,
    total: data.total_price,
  };
}

async function suggestBundle(supabase: any, args: any) {
  const { current_vertical, destination } = args;
  const suggestions: Record<string, string[]> = {
    buses: ["stays", "experiences", "car_rentals"],
    events: ["stays", "transfers", "experiences"],
    stays: ["experiences", "car_rentals", "events"],
    flights: ["stays", "car_rentals", "transfers"],
    experiences: ["stays", "transfers"],
    venues: ["transfers", "stays"],
  };

  const complementary = suggestions[current_vertical] || ["stays", "experiences"];
  return {
    suggestions: complementary.map(v => ({
      vertical: v,
      reason: `Complete your ${destination} trip with ${v}`,
      discount: "5% bundle discount available",
    })),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, session_id, user_id, channel } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get or create session
    let activeSessionId = session_id;
    if (!activeSessionId) {
      const { data: newSession } = await supabase
        .from("commerce_sessions")
        .insert({ user_id, session_type: "user_chat" })
        .select()
        .single();
      activeSessionId = newSession?.id;
    }

    // Get conversation history
    const { data: history } = await supabase
      .from("commerce_messages")
      .select("role, content, tool_calls, tool_results")
      .eq("session_id", activeSessionId)
      .order("created_at", { ascending: true })
      .limit(20);

    const messages = [
      {
        role: "system",
        content: channel === "telegram"
          ? `You are the fulticket Commerce Agent on Telegram. You help users search, book, and pay across all verticals: Buses, Events, Stays, Experiences, Venues, Workspaces, Transfers, Car Rentals, Flights, Rides.

TELEGRAM RULES:
- Use HTML formatting ONLY: <b>bold</b>, <i>italic</i>, <code>monospace</code>. NO markdown (* or **).
- Be extremely concise — max 3-4 short lines per response.
- Ask for ONE missing detail at a time in a conversational flow (e.g. "Where from?" → "Where to?" → "What date?" → "How many passengers?").
- Show prices as $X.XX USD.
- When search results come back, show max 3 options numbered with emoji.
- After booking confirmation, include the booking reference in <code>REF</code> format and say "Your receipt and QR code are on the way!"
- Always be friendly and use relevant emoji.
- If a user wants to book, collect name, email, phone ONE at a time.`
          : `You are the Suvat Commerce Agent - a conversational booking assistant for a super-app platform.
You can search inventory, hold items, calculate prices, and complete bookings across ALL verticals:
Buses, Events, Stays, Experiences, Venues, Workspaces, Transfers, Car Rentals, Flights, Rides.

Guidelines:
- Be proactive: suggest bundles when relevant
- Always confirm details before initiating bookings
- Show prices clearly with currency (USD)
- When showing search results, format them clearly with names, prices, and dates
- If a user wants to book, collect: name, email, phone before calling initiate_booking
- Do NOT use markdown formatting (no ** or *)
- Be concise and friendly
- When items are held, remind users of the 10-minute expiry`,
      },
      ...(history || []).map((m: any) => ({
        role: m.role,
        content: m.content,
        ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
      })),
      { role: "user", content: message },
    ];

    // Save user message
    await supabase.from("commerce_messages").insert({
      session_id: activeSessionId,
      role: "user",
      content: message,
      message_type: "text",
    });

    // AI call with tools
    let aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        tools,
        tool_choice: "auto",
      }),
    });

    let aiData = await aiResponse.json();
    let assistantMessage = aiData.choices?.[0]?.message;

    // Handle tool calls iteratively
    let iterations = 0;
    while (assistantMessage?.tool_calls && iterations < 5) {
      iterations++;
      const toolResults = [];

      for (const tc of assistantMessage.tool_calls) {
        const args = JSON.parse(tc.function.arguments);
        const result = await executeToolCall(supabase, tc.function.name, args, user_id, activeSessionId);
        toolResults.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }

      // Save tool interaction
      await supabase.from("commerce_messages").insert({
        session_id: activeSessionId,
        role: "assistant",
        content: assistantMessage.content || "",
        tool_calls: assistantMessage.tool_calls,
        message_type: "tool_call",
      });

      messages.push(assistantMessage);
      messages.push(...toolResults);

      aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages,
          tools,
          tool_choice: "auto",
        }),
      });

      aiData = await aiResponse.json();
      assistantMessage = aiData.choices?.[0]?.message;
    }

    const responseContent = assistantMessage?.content || "I apologize, I could not process that request.";

    // Detect rich message types from tool results
    let messageType = "text";
    let richData = null;
    if (assistantMessage?.tool_calls) {
      const lastToolCall = assistantMessage.tool_calls[assistantMessage.tool_calls.length - 1];
      if (lastToolCall?.function?.name === "search_inventory") messageType = "search_results";
      if (lastToolCall?.function?.name === "initiate_booking") {
        messageType = "booking_confirmation";
      }
    }

    // Save assistant response
    await supabase.from("commerce_messages").insert({
      session_id: activeSessionId,
      role: "assistant",
      content: responseContent,
      message_type: messageType,
      rich_data: richData,
    });

    return new Response(
      JSON.stringify({
        response: responseContent,
        session_id: activeSessionId,
        message_type: messageType,
        rich_data: richData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Commerce agent error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
