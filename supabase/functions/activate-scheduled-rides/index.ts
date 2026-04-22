import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// This function runs on a cron schedule to activate scheduled rides
// It should be triggered every 5 minutes

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const activationWindow = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now

    console.log(`Checking for scheduled rides to activate. Current time: ${now.toISOString()}, Window: ${activationWindow.toISOString()}`);

    // Find scheduled rides within the activation window
    const { data: scheduledRides, error: fetchError } = await supabase
      .from('scheduled_rides')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_time', activationWindow.toISOString())
      .gte('scheduled_time', now.toISOString());

    if (fetchError) {
      throw new Error(`Failed to fetch scheduled rides: ${fetchError.message}`);
    }

    if (!scheduledRides || scheduledRides.length === 0) {
      console.log('No scheduled rides to activate');
      return new Response(
        JSON.stringify({ success: true, message: 'No rides to activate', activated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Found ${scheduledRides.length} rides to activate`);

    const activatedRides = [];
    const errors = [];

    for (const scheduledRide of scheduledRides) {
      try {
        // Get the user's profile for passenger info
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', scheduledRide.user_id)
          .single();

        // Create a ride request from the scheduled ride
        const { data: rideRequest, error: createError } = await supabase
          .from('ride_requests')
          .insert({
            passenger_id: scheduledRide.user_id,
            passenger_name: profile?.full_name || 'Scheduled Ride',
            passenger_phone: profile?.phone || '',
            pickup_address: scheduledRide.pickup_address,
            pickup_lat: scheduledRide.pickup_lat,
            pickup_lng: scheduledRide.pickup_lng,
            dropoff_address: scheduledRide.dropoff_address,
            dropoff_lat: scheduledRide.dropoff_lat,
            dropoff_lng: scheduledRide.dropoff_lng,
            pricing_mode: scheduledRide.pricing_mode || 'fixed',
            vehicle_type: scheduledRide.vehicle_type || 'any',
            status: 'searching',
            estimated_distance_km: 0, // Will be calculated by the system
            estimated_duration_mins: 0,
            system_estimated_price: 0,
            surge_multiplier: 1.0,
            currency: 'ZAR'
          })
          .select()
          .single();

        if (createError) {
          throw new Error(`Failed to create ride request: ${createError.message}`);
        }

        // Update scheduled ride status
        await supabase
          .from('scheduled_rides')
          .update({
            status: 'activated',
            ride_request_id: rideRequest.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', scheduledRide.id);

        activatedRides.push({
          scheduledRideId: scheduledRide.id,
          rideRequestId: rideRequest.id
        });

        // Send notification to passenger
        try {
          await supabase.functions.invoke('send-ride-notification', {
            body: {
              passengerId: scheduledRide.user_id,
              type: 'scheduled_ride_activated',
              title: 'Scheduled Ride Activated',
              body: `Your scheduled ride from ${scheduledRide.pickup_address} is now being matched with drivers.`,
              data: { 
                rideRequestId: rideRequest.id,
                scheduledRideId: scheduledRide.id 
              }
            }
          });
        } catch (notifError) {
          console.error('Failed to send activation notification:', notifError);
        }

        console.log(`Activated scheduled ride ${scheduledRide.id} -> ride request ${rideRequest.id}`);

      } catch (rideError) {
        console.error(`Error activating scheduled ride ${scheduledRide.id}:`, rideError);
        errors.push({
          scheduledRideId: scheduledRide.id,
          error: rideError instanceof Error ? rideError.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        activated: activatedRides.length,
        activatedRides,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in activate-scheduled-rides:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
