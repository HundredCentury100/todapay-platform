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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('Starting expired reservations release process...');

    // Find all expired cash reservations
    const { data: expiredBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, booking_reference, selected_seats, passenger_email')
      .eq('reservation_type', 'cash_reserved')
      .eq('status', 'pending')
      .lt('reservation_expires_at', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired bookings:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredBookings?.length || 0} expired reservations`);

    if (!expiredBookings || expiredBookings.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No expired reservations found', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Cancel each expired booking
    const results = await Promise.all(
      expiredBookings.map(async (booking) => {
        try {
          // Update booking status
          const { error: updateError } = await supabase
            .from('bookings')
            .update({
              status: 'cancelled',
              payment_status: 'cancelled',
            })
            .eq('id', booking.id);

          if (updateError) {
            console.error(`Error updating booking ${booking.booking_reference}:`, updateError);
            return { success: false, bookingId: booking.id, error: updateError.message };
          }

          console.log(`Successfully cancelled booking ${booking.booking_reference}`);
          
          // Note: Seat release would happen here if we had a seats table
          // For now, seats are managed through application logic
          
          return { success: true, bookingId: booking.id, reference: booking.booking_reference };
        } catch (error) {
          console.error(`Error processing booking ${booking.id}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { success: false, bookingId: booking.id, error: errorMessage };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Release complete: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        message: 'Expired reservations released',
        total: expiredBookings.length,
        successful: successCount,
        failed: failureCount,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in release-expired-reservations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
