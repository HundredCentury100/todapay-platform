import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch user's bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .eq('payment_status', 'paid');

    if (bookingsError) throw bookingsError;

    // Calculate analytics
    const totalSpent = bookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;
    const totalBookings = bookings?.length || 0;

    // Spending by category
    const spendingByCategory: Record<string, number> = {};
    bookings?.forEach(b => {
      const category = b.booking_type || 'other';
      spendingByCategory[category] = (spendingByCategory[category] || 0) + (b.total_price || 0);
    });

    // Travel patterns - destinations
    const destinations: Record<string, number> = {};
    bookings?.forEach(b => {
      if (b.to_location) {
        destinations[b.to_location] = (destinations[b.to_location] || 0) + 1;
      }
      if (b.event_venue) {
        destinations[b.event_venue] = (destinations[b.event_venue] || 0) + 1;
      }
    });

    // Sort and get top destinations
    const favoriteDestinations = Object.entries(destinations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Monthly spending trend
    const monthlySpending: Record<string, number> = {};
    bookings?.forEach(b => {
      if (b.created_at) {
        const month = b.created_at.substring(0, 7); // YYYY-MM
        monthlySpending[month] = (monthlySpending[month] || 0) + (b.total_price || 0);
      }
    });

    const travelPatterns = {
      monthlySpending,
      bookingsByType: Object.entries(spendingByCategory).map(([type, amount]) => ({
        type,
        count: bookings?.filter(b => b.booking_type === type).length || 0,
        amount
      })),
      averageBookingValue: totalBookings > 0 ? totalSpent / totalBookings : 0
    };

    // Upsert analytics
    const { error: upsertError } = await supabase
      .from('consumer_analytics')
      .upsert({
        user_id: userId,
        total_spent: totalSpent,
        total_bookings: totalBookings,
        favorite_destinations: favoriteDestinations,
        spending_by_category: spendingByCategory,
        travel_patterns: travelPatterns,
        last_calculated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ 
      success: true,
      analytics: {
        totalSpent,
        totalBookings,
        favoriteDestinations,
        spendingByCategory,
        travelPatterns
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Analytics calculation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
