import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CancellationRequest {
  rideRequestId?: string;
  activeRideId?: string;
  cancelledBy: 'passenger' | 'driver';
  reason: string;
}

// Cancellation policy constants
const FREE_CANCELLATION_MINUTES = 2; // Free cancellation within 2 minutes of match
const DRIVER_SUSPENSION_THRESHOLD = 3; // Suspend after 3 cancellations per week
const CANCELLATION_FEE_ZAR = 25; // Cancellation fee in ZAR

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { rideRequestId, activeRideId, cancelledBy, reason }: CancellationRequest = await req.json();

    if (!reason || !cancelledBy) {
      throw new Error('Missing required fields: reason, cancelledBy');
    }

    if (!rideRequestId && !activeRideId) {
      throw new Error('Either rideRequestId or activeRideId is required');
    }

    console.log(`Processing cancellation by ${cancelledBy} for ride: ${rideRequestId || activeRideId}`);

    let rideStatus = 'searching';
    let minutesAfterMatch: number | null = null;
    let driverId: string | null = null;
    let passengerId: string | null = null;
    let penaltyApplied = false;
    let penaltyCredits = 0;
    let refundAmount = 0;

    // Get ride details
    if (activeRideId) {
      const { data: activeRide, error } = await supabase
        .from('active_rides')
        .select('*, ride_requests(*)')
        .eq('id', activeRideId)
        .single();

      if (error || !activeRide) {
        throw new Error('Active ride not found');
      }

      rideStatus = activeRide.status;
      driverId = activeRide.driver_id;
      passengerId = activeRide.passenger_id;

      // Calculate minutes since match
      const matchTime = new Date(activeRide.driver_assigned_at);
      const now = new Date();
      minutesAfterMatch = Math.floor((now.getTime() - matchTime.getTime()) / 60000);

      // Determine if penalty applies for passenger cancellation
      if (cancelledBy === 'passenger' && minutesAfterMatch > FREE_CANCELLATION_MINUTES) {
        if (rideStatus !== 'completed' && rideStatus !== 'cancelled') {
          penaltyApplied = true;
          refundAmount = 0; // No refund after free cancellation window
          console.log(`Passenger cancellation after ${minutesAfterMatch} minutes - penalty applies`);
        }
      }

      // Update active ride status
      await supabase
        .from('active_rides')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', activeRideId);

      // Update the linked ride request
      if (activeRide.ride_request_id) {
        await supabase
          .from('ride_requests')
          .update({
            status: 'cancelled',
            cancelled_by: cancelledBy,
            cancellation_reason: reason,
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', activeRide.ride_request_id);
      }

      // Free up the driver
      if (driverId) {
        await supabase
          .from('drivers')
          .update({
            is_available: true,
            current_ride_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', driverId);
      }

    } else if (rideRequestId) {
      // Cancelling before driver match
      const { data: rideRequest, error } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('id', rideRequestId)
        .single();

      if (error || !rideRequest) {
        throw new Error('Ride request not found');
      }

      rideStatus = rideRequest.status;
      passengerId = rideRequest.passenger_id;

      // Update ride request
      await supabase
        .from('ride_requests')
        .update({
          status: 'cancelled',
          cancelled_by: cancelledBy,
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', rideRequestId);

      // Cancel any pending bids
      await supabase
        .from('ride_bids')
        .update({ status: 'expired' })
        .eq('ride_request_id', rideRequestId)
        .eq('status', 'pending');
    }

    // Handle driver cancellation tracking
    if (cancelledBy === 'driver' && driverId) {
      // Get driver's current cancellation stats
      const { data: driver } = await supabase
        .from('drivers')
        .select('cancellations_this_week, last_cancellation_reset, cancellation_rate, total_rides')
        .eq('id', driverId)
        .single();

      if (driver) {
        let cancellationsThisWeek = driver.cancellations_this_week || 0;
        const lastReset = driver.last_cancellation_reset ? new Date(driver.last_cancellation_reset) : new Date(0);
        const now = new Date();
        const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24);

        // Reset weekly counter if more than 7 days
        if (daysSinceReset >= 7) {
          cancellationsThisWeek = 0;
        }

        cancellationsThisWeek += 1;

        // Calculate new cancellation rate
        const totalRides = driver.total_rides || 0;
        const newCancellationRate = totalRides > 0 
          ? Math.min(((driver.cancellation_rate || 0) * totalRides + 1) / (totalRides + 1), 1)
          : 0;

        // Check for suspension
        let suspensionUntil = null;
        if (cancellationsThisWeek >= DRIVER_SUSPENSION_THRESHOLD) {
          suspensionUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24 hour suspension
          console.log(`Driver ${driverId} suspended until ${suspensionUntil} for ${cancellationsThisWeek} cancellations`);
        }

        // Update driver stats
        await supabase
          .from('drivers')
          .update({
            cancellations_this_week: cancellationsThisWeek,
            last_cancellation_reset: daysSinceReset >= 7 ? now.toISOString() : driver.last_cancellation_reset,
            cancellation_rate: newCancellationRate,
            suspension_until: suspensionUntil,
            is_available: suspensionUntil ? false : true,
            updated_at: now.toISOString()
          })
          .eq('id', driverId);
      }
    }

    // Create cancellation record
    const { data: cancellation, error: cancellationError } = await supabase
      .from('ride_cancellations')
      .insert({
        ride_request_id: rideRequestId || null,
        active_ride_id: activeRideId || null,
        cancelled_by: cancelledBy,
        cancellation_reason: reason,
        ride_status_at_cancel: rideStatus,
        minutes_after_match: minutesAfterMatch,
        penalty_applied: penaltyApplied,
        penalty_credits: penaltyCredits,
        refund_amount: refundAmount
      })
      .select()
      .single();

    if (cancellationError) {
      console.error('Error creating cancellation record:', cancellationError);
    }

    // Send notifications (fire and forget)
    try {
      if (cancelledBy === 'passenger' && driverId) {
        await supabase.functions.invoke('send-ride-notification', {
          body: {
            driverId,
            type: 'ride_cancelled',
            title: 'Ride Cancelled',
            body: `Passenger cancelled the ride. Reason: ${reason}`,
            data: { rideId: activeRideId || rideRequestId }
          }
        });
      } else if (cancelledBy === 'driver' && passengerId) {
        await supabase.functions.invoke('send-ride-notification', {
          body: {
            passengerId,
            type: 'ride_cancelled',
            title: 'Ride Cancelled by Driver',
            body: `Your driver cancelled the ride. Reason: ${reason}. We're finding you another driver.`,
            data: { rideId: activeRideId || rideRequestId }
          }
        });
      }
    } catch (notifError) {
      console.error('Error sending cancellation notification:', notifError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        cancellationId: cancellation?.id,
        penaltyApplied,
        refundAmount,
        message: cancelledBy === 'driver' 
          ? 'Ride cancelled. This affects your cancellation rate.'
          : penaltyApplied 
            ? 'Ride cancelled. A cancellation fee may apply.'
            : 'Ride cancelled successfully.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error processing cancellation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
