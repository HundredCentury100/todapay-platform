import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface HistoricalDataPoint {
  date: string;
  revenue: number;
  bookings: number;
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

    const { merchantType, merchantId } = await req.json();

    console.log('Generating forecast for:', merchantType, merchantId);

    // Fetch historical data (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    let historicalData: HistoricalDataPoint[] = [];

    if (merchantType === 'bus_operator') {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('booking_date, total_amount')
        .eq('booking_type', 'bus')
        .gte('booking_date', ninetyDaysAgo.toISOString())
        .order('booking_date');

      if (bookings) {
        const grouped = bookings.reduce((acc: any, booking: any) => {
          const date = new Date(booking.booking_date).toISOString().split('T')[0];
          if (!acc[date]) {
            acc[date] = { revenue: 0, bookings: 0 };
          }
          acc[date].revenue += booking.total_amount || 0;
          acc[date].bookings += 1;
          return acc;
        }, {});

        historicalData = Object.entries(grouped).map(([date, data]: [string, any]) => ({
          date,
          revenue: data.revenue,
          bookings: data.bookings,
        }));
      }
    } else if (merchantType === 'event_organizer') {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('booking_date, total_amount')
        .eq('booking_type', 'event')
        .gte('booking_date', ninetyDaysAgo.toISOString())
        .order('booking_date');

      if (bookings) {
        const grouped = bookings.reduce((acc: any, booking: any) => {
          const date = new Date(booking.booking_date).toISOString().split('T')[0];
          if (!acc[date]) {
            acc[date] = { revenue: 0, bookings: 0 };
          }
          acc[date].revenue += booking.total_amount || 0;
          acc[date].bookings += 1;
          return acc;
        }, {});

        historicalData = Object.entries(grouped).map(([date, data]: [string, any]) => ({
          date,
          revenue: data.revenue,
          bookings: data.bookings,
        }));
      }
    }

    console.log('Historical data points:', historicalData.length);

    if (historicalData.length < 7) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient historical data. Need at least 7 days of data for forecasting.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare data for AI analysis
    const dataAnalysis = {
      totalDays: historicalData.length,
      totalRevenue: historicalData.reduce((sum, d) => sum + d.revenue, 0),
      totalBookings: historicalData.reduce((sum, d) => sum + d.bookings, 0),
      avgDailyRevenue: historicalData.reduce((sum, d) => sum + d.revenue, 0) / historicalData.length,
      avgDailyBookings: historicalData.reduce((sum, d) => sum + d.bookings, 0) / historicalData.length,
      recentTrend: historicalData.slice(-7),
    };

    const systemPrompt = `You are an expert data analyst specializing in revenue forecasting and time series analysis. 
Your task is to analyze historical booking and revenue data and generate realistic forecasts for the next 30 days.

Consider:
- Trends (upward, downward, or stable)
- Seasonality patterns (day of week, monthly cycles)
- Recent changes in the data
- Business context (${merchantType === 'bus_operator' ? 'bus transportation' : 'event ticketing'})

Provide structured JSON output with daily forecasts including revenue, bookings, and confidence levels.`;

    const userPrompt = `Analyze this historical data and forecast the next 30 days:

Historical Summary:
- Total days analyzed: ${dataAnalysis.totalDays}
- Total revenue: $${dataAnalysis.totalRevenue.toFixed(2)}
- Total bookings: ${dataAnalysis.totalBookings}
- Average daily revenue: $${dataAnalysis.avgDailyRevenue.toFixed(2)}
- Average daily bookings: ${dataAnalysis.avgDailyBookings.toFixed(1)}

Recent 7-day trend:
${dataAnalysis.recentTrend.map(d => `${d.date}: $${d.revenue.toFixed(2)}, ${d.bookings} bookings`).join('\n')}

Generate a 30-day forecast with the following structure for each day:
{
  "forecasts": [
    {
      "date": "YYYY-MM-DD",
      "predictedRevenue": number,
      "predictedBookings": number,
      "confidenceLevel": "high" | "medium" | "low",
      "lowerBound": number,
      "upperBound": number
    }
  ],
  "insights": [
    "Key insight 1",
    "Key insight 2",
    "Key insight 3"
  ],
  "summary": {
    "expectedTotalRevenue": number,
    "expectedTotalBookings": number,
    "trendDirection": "upward" | "stable" | "downward",
    "growthRate": number
  }
}`;

    // Call Lovable AI for forecasting
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
              name: 'generate_forecast',
              description: 'Generate revenue and booking forecasts',
              parameters: {
                type: 'object',
                properties: {
                  forecasts: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        date: { type: 'string' },
                        predictedRevenue: { type: 'number' },
                        predictedBookings: { type: 'number' },
                        confidenceLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
                        lowerBound: { type: 'number' },
                        upperBound: { type: 'number' }
                      },
                      required: ['date', 'predictedRevenue', 'predictedBookings', 'confidenceLevel', 'lowerBound', 'upperBound']
                    }
                  },
                  insights: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  summary: {
                    type: 'object',
                    properties: {
                      expectedTotalRevenue: { type: 'number' },
                      expectedTotalBookings: { type: 'number' },
                      trendDirection: { type: 'string', enum: ['upward', 'stable', 'downward'] },
                      growthRate: { type: 'number' }
                    },
                    required: ['expectedTotalRevenue', 'expectedTotalBookings', 'trendDirection', 'growthRate']
                  }
                },
                required: ['forecasts', 'insights', 'summary']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_forecast' } }
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
    console.log('AI response received');

    const toolCall = aiResult.choices[0].message.tool_calls?.[0];
    const forecast = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        success: true,
        forecast,
        historicalData: dataAnalysis,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Forecast error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Forecast generation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
