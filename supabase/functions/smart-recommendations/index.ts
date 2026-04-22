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

    const { userId } = await req.json();

    if (!userId) {
      throw new Error('userId is required');
    }

    // Fetch user's booking history (last 90 days, limit 50)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: bookings } = await supabase
      .from('bookings')
      .select('booking_type, item_name, from_location, to_location, event_venue, total_price, travel_date, event_date, status')
      .eq('user_id', userId)
      .gte('created_at', ninetyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    // Fetch user profile preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, preferred_currency')
      .eq('id', userId)
      .single();

    // Fetch trending/popular items across verticals
    const [
      { data: popularEvents },
      { data: popularExperiences },
      { data: popularStays },
      { data: popularVenues },
    ] = await Promise.all([
      supabase
        .from('events')
        .select('id, title, location, event_date, event_time, type, image_url')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('experiences')
        .select('id, title, location, price_per_person, duration_hours, difficulty_level, rating, image_url')
        .eq('status', 'active')
        .order('rating', { ascending: false })
        .limit(10),
      supabase
        .from('properties')
        .select('id, name, city, price_per_night, rating, images')
        .eq('status', 'active')
        .order('rating', { ascending: false })
        .limit(10),
      supabase
        .from('venues')
        .select('id, name, city, hourly_rate, capacity, rating, images')
        .eq('status', 'active')
        .order('rating', { ascending: false })
        .limit(10),
    ]);

    // Build context for AI
    const bookingHistory = bookings?.map(b => ({
      type: b.booking_type,
      item: b.item_name,
      route: b.from_location && b.to_location ? `${b.from_location} → ${b.to_location}` : null,
      venue: b.event_venue,
      price: b.total_price,
      date: b.travel_date || b.event_date,
      status: b.status,
    })) || [];

    const availableInventory = {
      events: popularEvents?.map(e => ({
        id: e.id, title: e.title, location: e.location,
        date: e.event_date, type: e.type, image: e.image_url,
      })) || [],
      experiences: popularExperiences?.map(e => ({
        id: e.id, title: e.title, location: e.location,
        price: e.price_per_person, rating: e.rating, image: e.image_url,
      })) || [],
      stays: popularStays?.map(s => ({
        id: s.id, name: s.name, city: s.city,
        price: s.price_per_night, rating: s.rating,
        image: s.images?.[0] || null,
      })) || [],
      venues: popularVenues?.map(v => ({
        id: v.id, name: v.name, city: v.city,
        price: v.hourly_rate, rating: v.rating,
        image: v.images?.[0] || null,
      })) || [],
    };

    const systemPrompt = `You are a personalization engine for a travel and lifestyle super-app.
Analyze the user's booking history and available inventory to generate highly relevant, personalized recommendations.

Consider:
- Frequently visited destinations and routes
- Preferred booking types (bus, events, stays, experiences)
- Price sensitivity based on historical spend
- Seasonal relevance and upcoming dates
- Cross-vertical discovery (if they book buses to a city, suggest events/stays there)

Return exactly 6 recommendations, mixing verticals for discovery.`;

    const userPrompt = `User: ${profile?.full_name || 'Anonymous'}
Currency: ${profile?.preferred_currency || 'USD'}

Recent Booking History (${bookingHistory.length} bookings):
${bookingHistory.length > 0
  ? bookingHistory.slice(0, 20).map(b => 
      `- ${b.type}: ${b.item}${b.route ? ` (${b.route})` : ''}${b.venue ? ` at ${b.venue}` : ''} - $${b.price} [${b.status}]`
    ).join('\n')
  : 'No recent bookings - suggest popular/trending items for new users'}

Available Inventory:
Events: ${JSON.stringify(availableInventory.events.slice(0, 5))}
Experiences: ${JSON.stringify(availableInventory.experiences.slice(0, 5))}
Stays: ${JSON.stringify(availableInventory.stays.slice(0, 5))}
Venues: ${JSON.stringify(availableInventory.venues.slice(0, 5))}

Generate 6 personalized recommendations.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_recommendations',
              description: 'Generate personalized recommendations for the user',
              parameters: {
                type: 'object',
                properties: {
                  recommendations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', description: 'Item ID from inventory' },
                        vertical: { type: 'string', enum: ['event', 'experience', 'stay', 'venue', 'bus'] },
                        title: { type: 'string' },
                        reason: { type: 'string', description: 'Short personalized reason (max 60 chars)' },
                        matchScore: { type: 'number', description: 'Relevance score 0-100' },
                        image: { type: 'string', description: 'Image URL from inventory data' },
                        price: { type: 'number' },
                        location: { type: 'string' },
                      },
                      required: ['vertical', 'title', 'reason', 'matchScore'],
                    },
                  },
                  userProfile: {
                    type: 'object',
                    properties: {
                      topInterests: { type: 'array', items: { type: 'string' } },
                      preferredPriceRange: { type: 'string' },
                      travelStyle: { type: 'string' },
                    },
                    required: ['topInterests', 'preferredPriceRange', 'travelStyle'],
                  },
                },
                required: ['recommendations', 'userProfile'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'generate_recommendations' } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        generatedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Recommendations error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate recommendations' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
