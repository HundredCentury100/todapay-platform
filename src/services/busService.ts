import { supabase } from "@/integrations/supabase/client";

export interface BusSchedule {
  id: string;
  bus_id: string;
  from_location: string;
  to_location: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  base_price: number;
  available_date: string;
  stops: string[];
  pickup_address?: string;
  dropoff_address?: string;
  buses: {
    id: string;
    operator: string;
    type: string;
    amenities: string[];
    image?: string;
    total_seats: number;
  };
}

export interface Seat {
  id: string;
  bus_schedule_id: string;
  seat_number: string;
  seat_row: number;
  seat_column: number;
  type: string;
  status: string;
  booking_id?: string;
}

export async function searchBuses(from: string, to: string, date?: string) {
  const query = supabase
    .from('bus_schedules')
    .select(`
      *,
      buses:bus_id (
        id,
        operator,
        type,
        amenities,
        image,
        total_seats
      )
    `)
    .eq('from_location', from)
    .eq('to_location', to);

  if (date) {
    query.eq('available_date', date);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching bus schedules:', error);
    return { data: [], error };
  }

  // Calculate available seats for each schedule
  const schedulesWithSeats = await Promise.all(
    (data || []).map(async (schedule) => {
      const { count } = await supabase
        .from('seats')
        .select('*', { count: 'exact', head: true })
        .eq('bus_schedule_id', schedule.id)
        .eq('status', 'available');

      return {
        ...schedule,
        availableSeats: count || 0,
      };
    })
  );

  return { data: schedulesWithSeats, error: null };
}

export async function getBusSchedule(scheduleId: string) {
  const { data, error } = await supabase
    .from('bus_schedules')
    .select(`
      *,
      buses:bus_id (
        id,
        operator,
        type,
        amenities,
        image,
        total_seats
      )
    `)
    .eq('id', scheduleId)
    .single();

  return { data, error };
}

export async function getSeatsForSchedule(scheduleId: string) {
  const { data, error } = await supabase
    .from('seats')
    .select('*')
    .eq('bus_schedule_id', scheduleId)
    .order('seat_row')
    .order('seat_column');

  return { data, error };
}

export async function bookSeats(scheduleId: string, seatIds: string[], bookingId: string) {
  const { error } = await supabase
    .from('seats')
    .update({ 
      status: 'booked',
      booking_id: bookingId 
    })
    .in('id', seatIds)
    .eq('bus_schedule_id', scheduleId)
    .eq('status', 'available');

  return { error };
}

export async function createBusWithScheduleAndSeats(
  operator: string,
  type: 'national' | 'crossborder',
  amenities: string[],
  from: string,
  to: string,
  departureTime: string,
  arrivalTime: string,
  duration: string,
  price: number,
  availableDate: string,
  stops: string[] = [],
  pickupAddress?: string,
  dropoffAddress?: string
) {
  // Create bus
  const { data: bus, error: busError } = await supabase
    .from('buses')
    .insert({
      operator,
      type,
      amenities,
      total_seats: 40,
    })
    .select()
    .single();

  if (busError || !bus) {
    return { error: busError };
  }

  // Create schedule
  const { data: schedule, error: scheduleError } = await supabase
    .from('bus_schedules')
    .insert({
      bus_id: bus.id,
      from_location: from,
      to_location: to,
      departure_time: departureTime,
      arrival_time: arrivalTime,
      duration,
      base_price: price,
      available_date: availableDate,
      stops,
      pickup_address: pickupAddress,
      dropoff_address: dropoffAddress,
    })
    .select()
    .single();

  if (scheduleError || !schedule) {
    return { error: scheduleError };
  }

  // Generate seats (8 rows x 5 columns = 40 seats)
  const seats = [];
  for (let row = 1; row <= 8; row++) {
    for (let col = 1; col <= 5; col++) {
      const seatNumber = `${row}${String.fromCharCode(64 + col)}`; // 1A, 1B, etc.
      seats.push({
        bus_schedule_id: schedule.id,
        seat_number: seatNumber,
        seat_row: row,
        seat_column: col,
        type: row <= 2 ? 'premium' : 'regular',
        status: 'available',
      });
    }
  }

  const { error: seatsError } = await supabase
    .from('seats')
    .insert(seats);

  if (seatsError) {
    return { error: seatsError };
  }

  return { data: { bus, schedule }, error: null };
}
