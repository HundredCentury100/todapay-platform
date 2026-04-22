import { supabase } from "@/integrations/supabase/client";
import type { 
  RideRequest, 
  RideBid, 
  ActiveRide, 
  Driver, 
  RideRating,
  DriverEarnings,
  RideBookingRequest,
  FareEstimate,
  NearbyDriver,
  VehicleType,
} from "@/types/ride";

// Flat pricing: $0.50/km for Go (base), other vehicles use multipliers
const PRICING = {
  first_km_rate: 0.50,
  first_km_threshold: 2,
  per_km_rate: 0.50,
  per_minute_rate: 0.02,
  minimum_fare: 2.00,
  booking_fee: 0.50,
  platform_fee_percentage: 10,
  negotiation_min_percentage: 0.7,
  negotiation_max_percentage: 1.5,
};

// Fetch surge pricing from edge function
export const getSurgePricing = async (
  pickupLat: number, 
  pickupLng: number
): Promise<{ multiplier: number; reason: string | null }> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ride-surge-pricing`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          pickup_lat: pickupLat,
          pickup_lng: pickupLng,
          radius_km: 5,
        }),
      }
    );

    const result = await response.json();
    return {
      multiplier: result.surge_multiplier || 1.0,
      reason: result.surge_reason || null,
    };
  } catch (error) {
    console.error('Error fetching surge pricing:', error);
    return { multiplier: 1.0, reason: null };
  }
};

// Calculate fare estimate with tiered pricing
export const calculateFareEstimate = (
  distanceKm: number, 
  durationMins: number, 
  surgeMultiplier: number = 1.0,
  vehicleMultiplier: number = 1.0
): FareEstimate => {
  // First 2 km at $1 each
  const firstKmDistance = Math.min(distanceKm, PRICING.first_km_threshold);
  const firstKmFare = firstKmDistance * PRICING.first_km_rate;
  
  // Remaining km at $0.50 each
  const remainingDistance = Math.max(0, distanceKm - PRICING.first_km_threshold);
  const remainingFare = remainingDistance * PRICING.per_km_rate;
  
  const distanceFare = (firstKmFare + remainingFare) * vehicleMultiplier;
  const timeFare = durationMins * PRICING.per_minute_rate;
  
  const subtotal = distanceFare + timeFare + PRICING.booking_fee;
  const surgeAmount = subtotal * (surgeMultiplier - 1);
  const totalEstimate = Math.max(subtotal + surgeAmount, PRICING.minimum_fare);
  
  return {
    base_fare: distanceFare,
    distance_fare: distanceFare,
    time_fare: timeFare,
    surge_multiplier: surgeMultiplier,
    surge_amount: surgeAmount,
    total_estimate: Math.round(totalEstimate * 100) / 100,
    currency: 'USD',
    distance_km: distanceKm,
    duration_mins: durationMins,
    min_offer: Math.round(totalEstimate * PRICING.negotiation_min_percentage * 100) / 100,
    max_offer: Math.round(totalEstimate * PRICING.negotiation_max_percentage * 100) / 100,
  };
};

// Create a new ride request
export const createRideRequest = async (request: RideBookingRequest): Promise<{ data: RideRequest | null; error: Error | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Calculate estimated distance and duration (simplified - in real app use mapping API)
    const distanceKm = calculateDistance(
      request.pickup_lat, 
      request.pickup_lng, 
      request.dropoff_lat, 
      request.dropoff_lng
    );
    const durationMins = Math.round(distanceKm * 2.5); // Rough estimate
    
    const fareEstimate = calculateFareEstimate(distanceKm, durationMins);
    
    const { data, error } = await supabase
      .from('ride_requests')
      .insert({
        passenger_id: user?.id,
        passenger_name: request.passenger_name,
        passenger_phone: request.passenger_phone,
        pickup_address: request.pickup_address,
        pickup_lat: request.pickup_lat,
        pickup_lng: request.pickup_lng,
        dropoff_address: request.dropoff_address,
        dropoff_lat: request.dropoff_lat,
        dropoff_lng: request.dropoff_lng,
        estimated_distance_km: distanceKm,
        estimated_duration_mins: durationMins,
        pricing_mode: request.pricing_mode,
        system_estimated_price: fareEstimate.total_estimate,
        passenger_offered_price: request.offered_price,
        vehicle_type: request.vehicle_type || 'any',
        status: request.pricing_mode === 'negotiation' ? 'bidding' : 'searching',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        recipient_name: request.recipient_name || null,
        recipient_phone: request.recipient_phone || null,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as RideRequest, error: null };
  } catch (error) {
    console.error('Error creating ride request:', error);
    return { data: null, error: error as Error };
  }
};

// Get nearby available drivers
export const getNearbyDrivers = async (
  lat: number, 
  lng: number, 
  radiusKm: number = 5
): Promise<{ data: NearbyDriver[]; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('is_online', true)
      .eq('is_available', true)
      .eq('status', 'active');

    if (error) throw error;

    // Filter by distance and calculate ETA
    const nearbyDrivers: NearbyDriver[] = (data || [])
      .map(driver => {
        const distance = calculateDistance(lat, lng, driver.current_lat || 0, driver.current_lng || 0);
        return {
          id: driver.id,
          full_name: driver.full_name,
          vehicle_type: driver.vehicle_type as VehicleType,
          vehicle_make: driver.vehicle_make,
          vehicle_model: driver.vehicle_model,
          license_plate: driver.license_plate,
          rating: driver.rating || 5,
          current_lat: driver.current_lat || 0,
          current_lng: driver.current_lng || 0,
          distance_km: distance,
          eta_minutes: Math.round(distance * 2.5), // Rough estimate
        };
      })
      .filter(d => d.distance_km <= radiusKm)
      .sort((a, b) => {
        // Primary: nearest first
        const distDiff = a.distance_km - b.distance_km;
        // Secondary: best rated first (within similar distance ~1km)
        if (Math.abs(distDiff) < 1) {
          return b.rating - a.rating;
        }
        return distDiff;
      });

    return { data: nearbyDrivers, error: null };
  } catch (error) {
    console.error('Error fetching nearby drivers:', error);
    return { data: [], error: error as Error };
  }
};

// Submit a bid (for drivers)
export const submitBid = async (
  rideRequestId: string,
  driverId: string,
  bidAmount: number,
  etaMinutes: number,
  message?: string
): Promise<{ data: RideBid | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('ride_bids')
      .insert({
        ride_request_id: rideRequestId,
        driver_id: driverId,
        bid_amount: bidAmount,
        eta_minutes: etaMinutes,
        message,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as RideBid, error: null };
  } catch (error) {
    console.error('Error submitting bid:', error);
    return { data: null, error: error as Error };
  }
};

// Accept a bid (for passengers)
export const acceptBid = async (
  bidId: string,
  rideRequestId: string
): Promise<{ data: ActiveRide | null; error: Error | null }> => {
  try {
    // Get the bid details
    const { data: bid, error: bidError } = await supabase
      .from('ride_bids')
      .select('*, driver:drivers(*)')
      .eq('id', bidId)
      .single();

    if (bidError) throw bidError;

    // Update the bid status
    await supabase
      .from('ride_bids')
      .update({ status: 'accepted' })
      .eq('id', bidId);

    // Reject other bids
    await supabase
      .from('ride_bids')
      .update({ status: 'rejected' })
      .eq('ride_request_id', rideRequestId)
      .neq('id', bidId);

    // Update ride request
    const { data: rideRequest } = await supabase
      .from('ride_requests')
      .update({ 
        status: 'matched',
        matched_driver_id: bid.driver_id,
        final_price: bid.bid_amount,
      })
      .eq('id', rideRequestId)
      .select()
      .single();

    // Create active ride
    const { data: activeRide, error: rideError } = await supabase
      .from('active_rides')
      .insert({
        ride_request_id: rideRequestId,
        driver_id: bid.driver_id,
        passenger_id: rideRequest?.passenger_id,
        final_price: bid.bid_amount,
        share_code: generateShareCode(),
      })
      .select()
      .single();

    if (rideError) throw rideError;

    // Update driver availability
    await supabase
      .from('drivers')
      .update({ is_available: false, current_ride_id: activeRide.id })
      .eq('id', bid.driver_id);

    return { data: activeRide as ActiveRide, error: null };
  } catch (error) {
    console.error('Error accepting bid:', error);
    return { data: null, error: error as Error };
  }
};

// Accept a fixed-price ride (for drivers)
export const acceptFixedRide = async (
  rideRequestId: string,
  driverId: string
): Promise<{ data: ActiveRide | null; error: Error | null }> => {
  try {
    const { data: rideRequest, error: reqError } = await supabase
      .from('ride_requests')
      .select('*')
      .eq('id', rideRequestId)
      .single();

    if (reqError) throw reqError;

    // Update ride request
    await supabase
      .from('ride_requests')
      .update({ 
        status: 'matched',
        matched_driver_id: driverId,
        final_price: rideRequest.system_estimated_price,
      })
      .eq('id', rideRequestId);

    // Create active ride
    const { data: activeRide, error: rideError } = await supabase
      .from('active_rides')
      .insert({
        ride_request_id: rideRequestId,
        driver_id: driverId,
        passenger_id: rideRequest.passenger_id,
        final_price: rideRequest.system_estimated_price,
        share_code: generateShareCode(),
      })
      .select()
      .single();

    if (rideError) throw rideError;

    // Update driver availability
    await supabase
      .from('drivers')
      .update({ is_available: false, current_ride_id: activeRide.id })
      .eq('id', driverId);

    return { data: activeRide as ActiveRide, error: null };
  } catch (error) {
    console.error('Error accepting ride:', error);
    return { data: null, error: error as Error };
  }
};

// Send ride notification
const sendRideNotification = async (
  rideId: string,
  notificationType: string,
  recipientType: 'passenger' | 'driver' | 'both' = 'passenger',
  etaMinutes?: number
) => {
  try {
    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-ride-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          ride_id: rideId,
          notification_type: notificationType,
          recipient_type: recipientType,
          eta_minutes: etaMinutes,
        }),
      }
    );
  } catch (error) {
    console.error('Error sending ride notification:', error);
  }
};

// Update ride status
export const updateRideStatus = async (
  rideId: string,
  status: string,
  etaMinutes?: number
): Promise<{ error: Error | null }> => {
  try {
    const updates: Record<string, unknown> = { status };
    
    if (status === 'arrived_at_pickup') {
      updates.driver_arrived_at = new Date().toISOString();
    } else if (status === 'in_progress') {
      updates.pickup_time = new Date().toISOString();
    } else if (status === 'completed') {
      updates.dropoff_time = new Date().toISOString();
    }

    const { error } = await supabase
      .from('active_rides')
      .update(updates)
      .eq('id', rideId);

    if (error) throw error;

    // Send notification based on status
    if (status === 'driver_arriving') {
      sendRideNotification(rideId, 'driver_arriving', 'passenger', etaMinutes);
    } else if (status === 'arrived_at_pickup') {
      sendRideNotification(rideId, 'driver_arrived', 'passenger');
    } else if (status === 'in_progress') {
      sendRideNotification(rideId, 'trip_started', 'passenger');
    } else if (status === 'completed') {
      sendRideNotification(rideId, 'trip_completed', 'both');
    } else if (status === 'cancelled') {
      sendRideNotification(rideId, 'trip_cancelled', 'both');
    }

    // If completed, free up the driver and credit their wallet
    if (status === 'completed') {
      const { data: ride } = await supabase
        .from('active_rides')
        .select('driver_id, final_price, payment_method')
        .eq('id', rideId)
        .single();

      if (ride) {
        await supabase
          .from('drivers')
          .update({ is_available: true, current_ride_id: null })
          .eq('id', ride.driver_id);

        // Create earnings record
        const grossAmount = ride.final_price || 0;
        const platformFeePercentage = 10;
        const platformFee = grossAmount * (platformFeePercentage / 100);
        const netAmount = grossAmount - platformFee;
        
        await supabase
          .from('driver_earnings')
          .insert({
            driver_id: ride.driver_id,
            ride_id: rideId,
            gross_amount: grossAmount,
            platform_fee_percentage: platformFeePercentage,
            platform_fee_amount: platformFee,
            net_amount: netAmount,
          });

        // Credit gross amount to driver wallet, then deduct commission
        try {
          const { data: driverData } = await supabase
            .from('drivers')
            .select('user_id')
            .eq('id', ride.driver_id)
            .single();

          if (driverData?.user_id) {
            const { data: walletId } = await supabase
              .rpc('get_or_create_user_wallet', { p_user_id: driverData.user_id });

            if (walletId) {
              // Credit full gross amount
              await supabase.rpc('topup_user_wallet', {
                p_wallet_id: walletId,
                p_amount: grossAmount,
                p_payment_reference: `ride-earning-${rideId}`,
                p_description: `Ride fare earned (gross)`,
              });

              // Deduct 10% commission
              await supabase.rpc('deduct_driver_commission' as any, {
                p_wallet_id: walletId,
                p_amount: platformFee,
                p_reference: `ride-commission-${rideId}`,
                p_description: `Platform commission (${platformFeePercentage}%) on ride`,
              });

              // Notify driver about earnings and commission
              await supabase.functions.invoke('send-user-notification', {
                body: {
                  userId: driverData.user_id,
                  type: 'wallet_topup',
                  title: 'Ride Earnings Received 🚗',
                  body: `Earned $${grossAmount.toFixed(2)} from ride. Commission: $${platformFee.toFixed(2)} (${platformFeePercentage}%). Net: $${netAmount.toFixed(2)}.`,
                  data: { grossAmount, platformFee, netAmount, rideId, type: 'ride_commission' },
                },
              }).catch(console.warn);

              // Check if balance is now below $5 and warn
              const { data: updatedWallet } = await supabase
                .from('user_wallets')
                .select('balance')
                .eq('id', walletId)
                .single();

              if (updatedWallet && updatedWallet.balance < 5) {
                await supabase.functions.invoke('send-user-notification', {
                  body: {
                    userId: driverData.user_id,
                    type: 'wallet_topup',
                    title: 'Low Wallet Balance ⚠️',
                    body: `Your driver wallet balance is $${updatedWallet.balance.toFixed(2)}. Top up to stay online (minimum $5.00 required).`,
                    data: { balance: updatedWallet.balance, type: 'low_balance_warning' },
                  },
                }).catch(console.warn);
              }
            }
          }
        } catch (walletError) {
          console.error('Error processing driver wallet:', walletError);
        }
      }
    }

    return { error: null };
  } catch (error) {
    console.error('Error updating ride status:', error);
    return { error: error as Error };
  }
};

// Update driver location
export const updateDriverLocation = async (
  driverId: string,
  lat: number,
  lng: number
): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('drivers')
      .update({
        current_lat: lat,
        current_lng: lng,
        last_location_update: new Date().toISOString(),
      })
      .eq('id', driverId);

    if (error) throw error;

    // Also update active ride if driver is on a ride
    await supabase
      .from('active_rides')
      .update({
        current_driver_lat: lat,
        current_driver_lng: lng,
      })
      .eq('driver_id', driverId)
      .in('status', ['driver_arriving', 'arrived_at_pickup', 'in_progress']);

    return { error: null };
  } catch (error) {
    console.error('Error updating driver location:', error);
    return { error: error as Error };
  }
};

// Get active ride for passenger
export const getPassengerActiveRide = async (): Promise<{ data: ActiveRide | null; error: Error | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: null };

    const { data, error } = await supabase
      .from('active_rides')
      .select('*, driver:drivers(*), ride_request:ride_requests(*)')
      .eq('passenger_id', user.id)
      .in('status', ['driver_assigned', 'driver_arriving', 'arrived_at_pickup', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return { data: data as ActiveRide | null, error: null };
  } catch (error) {
    console.error('Error fetching active ride:', error);
    return { data: null, error: error as Error };
  }
};

// Get bids for a ride request
export const getRideBids = async (rideRequestId: string): Promise<{ data: RideBid[]; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('ride_bids')
      .select('*, driver:drivers(*)')
      .eq('ride_request_id', rideRequestId)
      .eq('status', 'pending')
      .order('bid_amount', { ascending: true });

    if (error) throw error;
    return { data: data as RideBid[], error: null };
  } catch (error) {
    console.error('Error fetching bids:', error);
    return { data: [], error: error as Error };
  }
};

// Rate a ride
export const rateRide = async (
  rideId: string,
  rating: number,
  isDriverRating: boolean,
  reviewText?: string,
  tags?: string[]
): Promise<{ error: Error | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: ride } = await supabase
      .from('active_rides')
      .select('driver_id, passenger_id')
      .eq('id', rideId)
      .single();

    if (!ride) throw new Error('Ride not found');

    const { error } = await supabase
      .from('ride_ratings')
      .insert({
        ride_id: rideId,
        rater_id: user.id,
        ratee_id: isDriverRating ? ride.driver_id : ride.passenger_id,
        is_driver_rating: isDriverRating,
        rating,
        review_text: reviewText,
        tags: tags || [],
      });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error rating ride:', error);
    return { error: error as Error };
  }
};

// Tip driver
export const tipDriver = async (
  rideId: string,
  tipAmount: number
): Promise<{ success: boolean; error?: Error }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get the ride to find the driver
    const { data: ride } = await supabase
      .from('active_rides')
      .select('driver_id, final_price')
      .eq('id', rideId)
      .single();

    if (!ride) throw new Error('Ride not found');

    // Update the ride with tip amount
    const { error: updateError } = await supabase
      .from('active_rides')
      .update({ tip_amount: tipAmount })
      .eq('id', rideId);

    if (updateError) throw updateError;

    // Update driver earnings with tip
    const { error: earningsError } = await supabase
      .from('driver_earnings')
      .update({ tip_amount: tipAmount })
      .eq('ride_id', rideId);

    if (earningsError) {
      console.warn('Could not update driver earnings with tip:', earningsError);
      // Don't fail the whole operation if earnings update fails
    }

    return { success: true };
  } catch (error) {
    console.error('Error tipping driver:', error);
    return { success: false, error: error as Error };
  }
};

// Get driver's current ride
export const getDriverActiveRide = async (driverId: string): Promise<{ data: ActiveRide | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('active_rides')
      .select('*, ride_request:ride_requests(*)')
      .eq('driver_id', driverId)
      .in('status', ['driver_assigned', 'driver_arriving', 'arrived_at_pickup', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return { data: data as ActiveRide | null, error: null };
  } catch (error) {
    console.error('Error fetching driver active ride:', error);
    return { data: null, error: error as Error };
  }
};

// Get available ride requests for drivers
export const getAvailableRideRequests = async (
  driverLat: number,
  driverLng: number,
  radiusKm: number = 10
): Promise<{ data: RideRequest[]; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('ride_requests')
      .select('*')
      .in('status', ['searching', 'bidding'])
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter by distance, then sort by nearest first
    const nearbyRequests = (data || [])
      .map(req => ({
        ...req,
        _distance: calculateDistance(driverLat, driverLng, req.pickup_lat, req.pickup_lng),
      }))
      .filter(req => req._distance <= radiusKm)
      .sort((a, b) => a._distance - b._distance)
      .map(({ _distance, ...req }) => req) as RideRequest[];

    return { data: nearbyRequests, error: null };
  } catch (error) {
    console.error('Error fetching ride requests:', error);
    return { data: [], error: error as Error };
  }
};

// Get driver earnings
export const getDriverEarnings = async (
  driverId: string,
  startDate?: string,
  endDate?: string
): Promise<{ data: DriverEarnings[]; error: Error | null }> => {
  try {
    let query = supabase
      .from('driver_earnings')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: data as DriverEarnings[], error: null };
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return { data: [], error: error as Error };
  }
};

// Toggle driver online status
export const toggleDriverOnline = async (
  driverId: string,
  isOnline: boolean,
  lat?: number,
  lng?: number
): Promise<{ error: Error | null }> => {
  try {
    const updates: Record<string, unknown> = { is_online: isOnline };
    if (isOnline && lat && lng) {
      updates.current_lat = lat;
      updates.current_lng = lng;
      updates.last_location_update = new Date().toISOString();
    }

    const { error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', driverId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error toggling driver status:', error);
    return { error: error as Error };
  }
};

// Helper: Calculate distance between two points (Haversine formula)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal
};

const toRad = (deg: number): number => deg * (Math.PI / 180);

// Helper: Generate share code
const generateShareCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};
