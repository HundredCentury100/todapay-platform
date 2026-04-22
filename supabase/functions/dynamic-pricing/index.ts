import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PricingFactors {
  currentCapacity: number;
  totalCapacity: number;
  daysUntilEvent: number;
  bookingVelocity: number; // bookings per day in last 7 days
  historicalDemand: number;
  competitorPrices: number[];
  basePrice: number;
  seasonalFactor: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { itemId, itemType, basePrice, currentDate } = await req.json();

    console.log('Calculating dynamic price for:', itemType, itemId);

    let pricingFactors: PricingFactors;

    if (itemType === 'event') {
      // Get event details
      const { data: event } = await supabase
        .from('events')
        .select('*, event_ticket_tiers(*)')
        .eq('id', itemId)
        .single();

      if (!event) {
        throw new Error('Event not found');
      }

      // Calculate total capacity
      const totalCapacity = event.event_ticket_tiers.reduce(
        (sum: number, tier: any) => sum + tier.total_tickets,
        0
      );

      // Calculate current bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('booking_date, ticket_quantity')
        .eq('item_id', itemId)
        .eq('status', 'confirmed');

      const currentBookings = bookings?.reduce(
        (sum, b) => sum + (b.ticket_quantity || 0),
        0
      ) || 0;

      // Calculate days until event
      const eventDate = new Date(event.event_date);
      const now = new Date(currentDate || Date.now());
      const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate booking velocity (last 7 days)
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: recentBookings } = await supabase
        .from('bookings')
        .select('ticket_quantity')
        .eq('item_id', itemId)
        .gte('booking_date', sevenDaysAgo.toISOString())
        .eq('status', 'confirmed');

      const recentTicketsSold = recentBookings?.reduce(
        (sum, b) => sum + (b.ticket_quantity || 0),
        0
      ) || 0;
      const bookingVelocity = recentTicketsSold / 7;

      // Get historical demand (similar events)
      const { data: historicalEvents } = await supabase
        .from('bookings')
        .select('ticket_quantity')
        .eq('booking_type', 'event')
        .eq('status', 'confirmed')
        .limit(100);

      const avgHistoricalDemand = historicalEvents
        ? historicalEvents.reduce((sum, b) => sum + (b.ticket_quantity || 0), 0) / historicalEvents.length
        : 0;

      // Get competitor prices (similar events in same location)
      const { data: competitorEvents } = await supabase
        .from('events')
        .select('event_ticket_tiers(price)')
        .eq('location', event.location)
        .neq('id', itemId)
        .limit(5);

      const competitorPrices = competitorEvents?.flatMap(
        (e: any) => e.event_ticket_tiers.map((t: any) => t.price)
      ) || [];

      // Seasonal factor (weekends = higher, weekdays = lower)
      const dayOfWeek = eventDate.getDay();
      const seasonalFactor = (dayOfWeek === 5 || dayOfWeek === 6) ? 1.2 : 0.9;

      pricingFactors = {
        currentCapacity: currentBookings,
        totalCapacity,
        daysUntilEvent,
        bookingVelocity,
        historicalDemand: avgHistoricalDemand,
        competitorPrices,
        basePrice: basePrice || event.event_ticket_tiers[0]?.price || 50,
        seasonalFactor,
      };

    } else {
      // Bus pricing logic
      const { data: schedule } = await supabase
        .from('bus_schedules')
        .select('*, buses(*)')
        .eq('id', itemId)
        .single();

      if (!schedule) {
        throw new Error('Schedule not found');
      }

      const totalCapacity = schedule.buses.total_seats;

      const { data: bookings } = await supabase
        .from('bookings')
        .select('booking_date, number_of_adults, number_of_children')
        .eq('item_id', itemId)
        .eq('status', 'confirmed');

      const currentBookings = bookings?.reduce(
        (sum, b) => sum + (b.number_of_adults || 0) + (b.number_of_children || 0),
        0
      ) || 0;

      const travelDate = new Date(schedule.available_date);
      const now = new Date(currentDate || Date.now());
      const daysUntilTravel = Math.ceil((travelDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: recentBookings } = await supabase
        .from('bookings')
        .select('number_of_adults, number_of_children')
        .eq('item_id', itemId)
        .gte('booking_date', sevenDaysAgo.toISOString())
        .eq('status', 'confirmed');

      const recentSeats = recentBookings?.reduce(
        (sum, b) => sum + (b.number_of_adults || 0) + (b.number_of_children || 0),
        0
      ) || 0;

      // Get competitor prices (same route)
      const { data: competitorSchedules } = await supabase
        .from('bus_schedules')
        .select('base_price')
        .eq('from_location', schedule.from_location)
        .eq('to_location', schedule.to_location)
        .neq('id', itemId)
        .limit(5);

      const competitorPrices = competitorSchedules?.map((s: any) => s.base_price) || [];

      pricingFactors = {
        currentCapacity: currentBookings,
        totalCapacity,
        daysUntilEvent: daysUntilTravel,
        bookingVelocity: recentSeats / 7,
        historicalDemand: 20, // Default
        competitorPrices,
        basePrice: basePrice || schedule.base_price,
        seasonalFactor: 1.0,
      };
    }

    // Prepare AI prompt with pricing factors
    const systemPrompt = `You are an expert dynamic pricing analyst for the travel and events industry. 
Your task is to analyze market conditions and recommend optimal pricing strategies that maximize revenue while remaining competitive.

Consider:
- Supply/demand dynamics (capacity utilization)
- Time-based pricing (early bird vs last minute)
- Competitive positioning
- Historical performance
- Market seasonality

Provide pricing recommendations with clear rationale.`;

    const userPrompt = `Analyze these pricing factors and recommend optimal price adjustments:

Current Situation:
- Base Price: $${pricingFactors.basePrice}
- Capacity Utilization: ${((pricingFactors.currentCapacity / pricingFactors.totalCapacity) * 100).toFixed(1)}% (${pricingFactors.currentCapacity}/${pricingFactors.totalCapacity})
- Days Until ${itemType === 'event' ? 'Event' : 'Departure'}: ${pricingFactors.daysUntilEvent}
- Booking Velocity: ${pricingFactors.bookingVelocity.toFixed(2)} per day (last 7 days)
- Seasonal Factor: ${pricingFactors.seasonalFactor}x
- Competitor Prices: $${pricingFactors.competitorPrices.join(', $')}
- Historical Demand: ${pricingFactors.historicalDemand.toFixed(1)} bookings avg

Provide recommendations with the following structure:
{
  "recommendedPrice": number,
  "priceChange": number,
  "priceChangePercentage": number,
  "strategy": "surge" | "discount" | "standard" | "early_bird" | "last_minute",
  "confidence": "high" | "medium" | "low",
  "rationale": "string explaining the decision",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "recommendations": ["action 1", "action 2"],
  "competitivePosition": "above_market" | "at_market" | "below_market",
  "urgencyLevel": "high" | "medium" | "low"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'recommend_pricing',
              description: 'Generate dynamic pricing recommendation',
              parameters: {
                type: 'object',
                properties: {
                  recommendedPrice: { type: 'number' },
                  priceChange: { type: 'number' },
                  priceChangePercentage: { type: 'number' },
                  strategy: { 
                    type: 'string', 
                    enum: ['surge', 'discount', 'standard', 'early_bird', 'last_minute'] 
                  },
                  confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                  rationale: { type: 'string' },
                  insights: { type: 'array', items: { type: 'string' } },
                  recommendations: { type: 'array', items: { type: 'string' } },
                  competitivePosition: { 
                    type: 'string', 
                    enum: ['above_market', 'at_market', 'below_market'] 
                  },
                  urgencyLevel: { type: 'string', enum: ['high', 'medium', 'low'] }
                },
                required: [
                  'recommendedPrice', 'priceChange', 'priceChangePercentage', 
                  'strategy', 'confidence', 'rationale', 'insights', 
                  'recommendations', 'competitivePosition', 'urgencyLevel'
                ]
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'recommend_pricing' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI API error: ${errorText}`);
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices[0].message.tool_calls?.[0];
    const pricing = JSON.parse(toolCall.function.arguments);

    console.log('Dynamic pricing calculated:', pricing.recommendedPrice);

    return new Response(
      JSON.stringify({
        success: true,
        pricing,
        factors: pricingFactors,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Dynamic pricing error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Pricing calculation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
