import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Database {
  public: {
    Tables: {
      agent_commissions: any;
      bookings: any;
    };
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify CRON_SECRET for scheduled job authentication
    const cronSecret = Deno.env.get('CRON_SECRET');
    const authHeader = req.headers.get('authorization');
    
    if (cronSecret) {
      const providedSecret = authHeader?.replace('Bearer ', '');
      if (providedSecret !== cronSecret) {
        console.error('Unauthorized cron job attempt');
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
    } else {
      console.warn('CRON_SECRET not configured - function is publicly accessible');
    }

    console.log('Starting auto-approval of commissions...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Get current timestamp for comparison
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Find pending commissions with completed bookings that occurred >24h ago
    const { data: commissions, error: commissionsError } = await supabase
      .from('agent_commissions')
      .select(`
        id,
        booking_id,
        bookings!inner (
          id,
          status,
          travel_date,
          event_date,
          booking_type
        )
      `)
      .eq('status', 'pending');

    if (commissionsError) {
      console.error('Error fetching commissions:', commissionsError);
      throw commissionsError;
    }

    console.log(`Found ${commissions?.length || 0} pending commissions`);

    if (!commissions || commissions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending commissions to process',
          approved: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Filter commissions that are eligible for auto-approval
    const eligibleCommissions = commissions.filter((commission: any) => {
      const booking = commission.bookings;
      
      // Only approve if booking is confirmed or completed
      if (booking.status !== 'confirmed' && booking.status !== 'completed') {
        return false;
      }

      // Get the relevant date based on booking type
      const relevantDate = booking.booking_type === 'event' 
        ? booking.event_date 
        : booking.travel_date;

      if (!relevantDate) {
        console.log(`Skipping commission ${commission.id}: No date found`);
        return false;
      }

      const eventDate = new Date(relevantDate);
      const isOlderThan24h = eventDate < twentyFourHoursAgo;

      if (isOlderThan24h) {
        console.log(`Commission ${commission.id} eligible: event/travel was ${eventDate}`);
      }

      return isOlderThan24h;
    });

    console.log(`${eligibleCommissions.length} commissions eligible for auto-approval`);

    if (eligibleCommissions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No commissions eligible for auto-approval yet',
          approved: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Update eligible commissions to approved status
    const commissionIds = eligibleCommissions.map((c: any) => c.id);
    
    const { data: updated, error: updateError } = await supabase
      .from('agent_commissions')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: null, // System auto-approval
        notes: 'Auto-approved 24h after trip/event completion',
      })
      .in('id', commissionIds)
      .select();

    if (updateError) {
      console.error('Error updating commissions:', updateError);
      throw updateError;
    }

    console.log(`Successfully approved ${updated?.length || 0} commissions`);

    // Log the activity
    for (const commission of eligibleCommissions) {
      console.log(`Auto-approved commission ${commission.id} for booking ${commission.booking_id}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Auto-approved ${updated?.length || 0} commissions`,
        approved: updated?.length || 0,
        commissionIds: updated?.map((c: any) => c.id) || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in auto-approve-commissions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});
