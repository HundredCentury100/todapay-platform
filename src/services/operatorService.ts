import { supabase } from "@/integrations/supabase/client";
import { getMerchantNames } from "./merchantCacheService";
import { aggregateCustomerData } from "@/utils/queryHelpers";

export interface BusScheduleWithDetails {
  id: string;
  bus_id: string;
  from_location: string;
  to_location: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  base_price: number;
  available_date: string;
  pickup_address?: string;
  dropoff_address?: string;
  stops?: string[];
  buses?: {
    operator: string;
    type: string;
    total_seats: number;
    amenities?: string[];
  };
  available_seats?: number;
}

export interface DateRangeFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  search?: string;
}

export const getOperatorSchedules = async () => {
  const operators = await getMerchantNames();
  
  const { data, error } = await supabase
    .from('bus_schedules')
    .select(`
      *,
      buses!inner(operator, type, total_seats, amenities)
    `)
    .in('buses.operator', operators)
    .order('available_date', { ascending: true });

  if (error) throw error;
  
  // Count available seats for each schedule
  const scheduleIds = data.map(s => s.id);
  const { data: seatsData } = await supabase
    .from('seats')
    .select('bus_schedule_id, status')
    .in('bus_schedule_id', scheduleIds);

  const seatCounts = seatsData?.reduce((acc: any, seat) => {
    if (!acc[seat.bus_schedule_id]) acc[seat.bus_schedule_id] = 0;
    if (seat.status === 'available') acc[seat.bus_schedule_id]++;
    return acc;
  }, {});

  return data.map(schedule => ({
    ...schedule,
    available_seats: seatCounts?.[schedule.id] || 0
  })) as BusScheduleWithDetails[];
};

export const getOperatorBookings = async (filters?: DateRangeFilters) => {
  const operators = await getMerchantNames();
  
  let query = supabase
    .from('bookings')
    .select('*')
    .in('operator', operators)
    .eq('booking_type', 'bus');

  if (filters?.dateFrom) {
    query = query.gte('travel_date', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('travel_date', filters.dateTo);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.search) {
    query = query.or(`booking_reference.ilike.%${filters.search}%,passenger_name.ilike.%${filters.search}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const getOperatorRevenue = async () => {
  const operators = await getMerchantNames();
  
  const { data, error } = await supabase
    .from('bookings')
    .select('total_price, base_price, travel_date, payment_status, status, created_at')
    .in('operator', operators)
    .eq('booking_type', 'bus');

  if (error) throw error;
  return data;
};

export const getOperatorCustomers = async () => {
  const operators = await getMerchantNames();
  
  const { data, error } = await supabase
    .from('bookings')
    .select('passenger_name, passenger_email, passenger_phone, created_at, total_price, status')
    .in('operator', operators)
    .eq('booking_type', 'bus')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return aggregateCustomerData(data || []);
};

export const getOperatorFleet = async () => {
  const operators = await getMerchantNames();
  
  const { data, error } = await supabase
    .from('buses')
    .select('*')
    .in('operator', operators);

  if (error) throw error;
  return data;
};

// CRUD Operations for Schedules
export const createSchedule = async (scheduleData: any) => {
  const { data, error } = await supabase
    .from('bus_schedules')
    .insert(scheduleData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateSchedule = async (id: string, scheduleData: any) => {
  const { data, error } = await supabase
    .from('bus_schedules')
    .update(scheduleData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteSchedule = async (id: string) => {
  const { error } = await supabase
    .from('bus_schedules')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// CRUD Operations for Buses
export const createBus = async (busData: any) => {
  const { data, error } = await supabase
    .from('buses')
    .insert(busData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateBus = async (id: string, busData: any) => {
  const { data, error } = await supabase
    .from('buses')
    .update(busData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteBus = async (id: string) => {
  const { error } = await supabase
    .from('buses')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// CRUD Operations for Bookings
export const updateBooking = async (id: string, bookingData: any) => {
  const { data, error } = await supabase
    .from('bookings')
    .update(bookingData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Get merchant contact info by operator name
export const getMerchantByOperatorName = async (operatorName: string) => {
  const { data, error } = await supabase
    .from('operator_associations')
    .select(`
      merchant_profiles (
        id,
        business_name,
        website_url,
        whatsapp_number,
        business_address,
        support_phone,
        support_email
      )
    `)
    .eq('operator_name', operatorName)
    .single();

  if (error) {
    return { data: null, error };
  }
  
  return { data: data?.merchant_profiles, error: null };
};
