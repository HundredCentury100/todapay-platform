import { supabase } from "@/integrations/supabase/client";
import { generateTicketNumber } from "@/utils/ticketNumberGenerator";
import { sendRideCompletedNotification } from "./notificationService";

export interface RideReceipt {
  id: string;
  ride_id: string;
  receipt_number: string;
  passenger_name: string;
  passenger_email: string | null;
  passenger_id?: string | null;
  driver_name: string;
  driver_photo?: string | null;
  driver_rating?: number | null;
  vehicle_type?: string | null;
  vehicle_plate?: string | null;
  pickup_address: string;
  dropoff_address: string;
  pickup_time: string | null;
  dropoff_time: string | null;
  distance_km: number | null;
  duration_mins: number | null;
  base_fare: number;
  distance_fare: number;
  time_fare: number;
  surge_amount: number;
  tip_amount: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  currency: string;
  pdf_url: string | null;
  created_at: string;
}

export async function createRideReceipt(rideId: string): Promise<RideReceipt | null> {
  // Get ride details with driver and request info
  const { data: ride, error: rideError } = await supabase
    .from('active_rides')
    .select('*, driver:drivers(*), ride_request:ride_requests(*)')
    .eq('id', rideId)
    .single();

  if (rideError || !ride) {
    console.error('Error fetching ride for receipt:', rideError);
    return null;
  }

  const request = ride.ride_request as any;
  const driver = ride.driver as any;

  // Calculate fare breakdown (simplified)
  const baseFare = 25;
  const distanceKm = request?.estimated_distance_km || 0;
  const durationMins = request?.estimated_duration_mins || 0;
  const distanceFare = distanceKm * 12;
  const timeFare = durationMins * 2;
  const surgeAmount = 0;
  const tipAmount = ride.tip_amount || 0;
  const totalAmount = ride.final_price || (baseFare + distanceFare + timeFare + surgeAmount + tipAmount);

  // Generate logical receipt number
  const receiptNumber = generateTicketNumber('RDE', new Date());

  const { data, error } = await supabase
    .from('ride_receipts')
    .insert({
      ride_id: rideId,
      receipt_number: receiptNumber,
      passenger_name: request?.passenger_name || 'Passenger',
      passenger_email: request?.passenger_email || null,
      driver_name: driver?.full_name || 'Driver',
      pickup_address: request?.pickup_address || '',
      dropoff_address: request?.dropoff_address || '',
      pickup_time: ride.pickup_time,
      dropoff_time: ride.dropoff_time,
      distance_km: distanceKm,
      duration_mins: durationMins,
      base_fare: baseFare,
      distance_fare: distanceFare,
      time_fare: timeFare,
      surge_amount: surgeAmount,
      tip_amount: tipAmount,
      total_amount: totalAmount,
      payment_method: ride.payment_method || 'cash',
      payment_status: ride.payment_status || 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating receipt:', error);
    return null;
  }

  // Send notification to user's inbox
  if (ride.passenger_id && request?.passenger_email) {
    try {
      await sendRideCompletedNotification(
        ride.passenger_id,
        request.passenger_email,
        rideId,
        receiptNumber,
        request.pickup_address || '',
        request.dropoff_address || '',
        totalAmount,
        driver?.full_name || 'Driver'
      );
    } catch (notifError) {
      console.error('Error sending ride notification:', notifError);
      // Don't fail receipt creation if notification fails
    }
  }

  return {
    ...data,
    driver_photo: driver?.profile_photo,
    driver_rating: driver?.rating,
    vehicle_type: request?.vehicle_type,
    vehicle_plate: driver?.vehicle_plate,
    passenger_id: ride.passenger_id,
  } as RideReceipt;
}

export async function getRideReceipt(rideId: string): Promise<RideReceipt | null> {
  const { data, error } = await supabase
    .from('ride_receipts')
    .select('*')
    .eq('ride_id', rideId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching receipt:', error);
    return null;
  }

  return data as RideReceipt | null;
}

export async function getUserReceipts(limit: number = 20): Promise<RideReceipt[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('ride_receipts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching receipts:', error);
    return [];
  }

  return data as RideReceipt[];
}

export async function sendReceiptEmail(rideId: string, email?: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-ride-receipt`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          ride_id: rideId,
          recipient_email: email,
        }),
      }
    );

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error sending receipt email:', error);
    return false;
  }
}
