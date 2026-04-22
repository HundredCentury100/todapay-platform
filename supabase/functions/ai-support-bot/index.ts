import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { messages, userId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'messages array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gather user context if authenticated
    let userContext = '';

    if (userId) {
      // Fetch recent bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, booking_reference, booking_type, item_name, status, payment_status, travel_date, event_date, from_location, to_location, event_venue, total_price, passenger_name, selected_seats, departure_time, arrival_time, ticket_number, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch active rides
      const { data: activeRides } = await supabase
        .from('active_rides')
        .select('id, status, final_price, payment_status, created_at, driver_id')
        .eq('passenger_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch wallet balance
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', userId)
        .single();

      userContext = `
USER CONTEXT (verified authenticated user):
Name: ${profile?.full_name || 'Unknown'}
Email: ${profile?.email || 'N/A'}
Wallet Balance: $${wallet?.balance?.toFixed(2) || '0.00'}

Recent Bookings (${bookings?.length || 0}):
${bookings?.map(b => `- [${b.booking_reference}] ${b.booking_type}: ${b.item_name} | Status: ${b.status} | Payment: ${b.payment_status} | Date: ${b.travel_date || b.event_date || 'N/A'} | ${b.from_location ? `${b.from_location} → ${b.to_location}` : b.event_venue || ''} | Price: $${b.total_price} | Seats: ${b.selected_seats?.join(', ') || 'N/A'} | Ticket: ${b.ticket_number}`).join('\n') || 'No recent bookings'}

Active Rides (${activeRides?.length || 0}):
${activeRides?.map(r => `- Status: ${r.status} | Price: $${r.final_price || 'TBD'} | Payment: ${r.payment_status}`).join('\n') || 'No active rides'}`;
    }

    const systemPrompt = `You are the AI support assistant for fulticket, a travel and lifestyle super-app.
You have access to the user's real booking data, wallet balance, and ride history.

Your capabilities:
1. Look up booking status by reference number
2. Explain payment statuses and refund policies
3. Help with reschedule/cancellation inquiries
4. Provide trip details (seats, times, locations)
5. Answer wallet balance and transaction questions
6. Guide users through common issues

Rules:
- Always reference actual booking data when answering
- If a booking reference is mentioned, find it in the user's data
- Be specific: include dates, prices, seat numbers, locations
- For cancellations/refunds: explain the policy (full refund if 24h+ before departure, 50% if 12-24h, no refund <12h)
- For reschedules: explain they can reschedule once for free, $2 fee after that
- If you can't find information, say so clearly and suggest contacting support at +263 78 958 3003
- Keep responses concise and actionable
- Do NOT share internal system details or IDs
- Use plain text, no markdown formatting with asterisks

${userContext}`;

    const sanitizedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: typeof msg.content === 'string'
        ? msg.content
            .replace(/ignore (all )?(previous|above|prior) (instructions|prompts)/gi, '[filtered]')
            .replace(/you are now/gi, '[filtered]')
            .replace(/system:/gi, '[filtered]')
            .slice(0, 2000)
        : msg.content,
    }));

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...sanitizedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service temporarily unavailable.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('AI support bot error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Support bot error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
