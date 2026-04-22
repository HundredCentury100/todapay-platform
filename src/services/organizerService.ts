import { supabase } from "@/integrations/supabase/client";
import { getMerchantNames } from "./merchantCacheService";
import { DateRangeFilters } from "@/utils/queryHelpers";

export const getOrganizerEvents = async () => {
  const organizers = await getMerchantNames();
  
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_ticket_tiers(id, name, price, available_tickets, total_tickets)
    `)
    .in('organizer', organizers)
    .order('event_date', { ascending: true });

  if (error) throw error;
  return data;
};

export const getOrganizerBookings = async (filters?: DateRangeFilters) => {
  const organizers = await getMerchantNames();
  
  // Get events first
  const { data: events } = await supabase
    .from('events')
    .select('id')
    .in('organizer', organizers);

  if (!events || events.length === 0) return [];

  const eventIds = events.map(e => e.id);

  let query = supabase
    .from('bookings')
    .select('*')
    .in('item_id', eventIds)
    .eq('booking_type', 'event');

  if (filters?.dateFrom) {
    query = query.gte('event_date', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('event_date', filters.dateTo);
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

export const getOrganizerRevenue = async () => {
  const organizers = await getMerchantNames();
  
  const { data: events } = await supabase
    .from('events')
    .select('id')
    .in('organizer', organizers);

  if (!events || events.length === 0) return [];

  const eventIds = events.map(e => e.id);

  const { data, error } = await supabase
    .from('bookings')
    .select('total_price, base_price, event_date, payment_status, status, created_at')
    .in('item_id', eventIds)
    .eq('booking_type', 'event');

  if (error) throw error;
  return data;
};

export const updateEvent = async (eventId: string, updates: any) => {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getOrganizerCheckIns = async (eventId?: string) => {
  const organizers = await getMerchantNames();
  
  const { data: events } = await supabase
    .from('events')
    .select('id')
    .in('organizer', organizers);

  if (!events || events.length === 0) return [];

  const eventIds = events.map(e => e.id);

  let query = supabase
    .from('bookings')
    .select(`
      *,
      check_ins(*)
    `)
    .in('item_id', eventIds)
    .eq('booking_type', 'event');

  if (eventId) {
    query = query.eq('item_id', eventId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const getSchoolEvents = async () => {
  const organizers = await getMerchantNames();
  
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      bookings:bookings(count)
    `)
    .in('organizer', organizers)
    .not('school_name', 'is', null)
    .order('event_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const getMarketingMetrics = async () => {
  const organizers = await getMerchantNames();
  
  const { data: events } = await supabase
    .from('events')
    .select('id')
    .in('organizer', organizers);

  if (!events || events.length === 0) return { bookings: [], reviews: [] };

  const eventIds = events.map(e => e.id);

  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('discount_code, total_price, created_at, item_name')
    .in('item_id', eventIds)
    .eq('booking_type', 'event')
    .not('discount_code', 'is', null);

  if (bookingsError) throw bookingsError;

  const { data: reviews, error: reviewsError } = await supabase
    .from('event_reviews')
    .select('rating, event_id')
    .in('event_id', eventIds)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (reviewsError) throw reviewsError;

  return { bookings, reviews };
};

// Get merchant contact info by organizer name
export const getMerchantByOrganizerName = async (organizerName: string) => {
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
    .eq('operator_name', organizerName)
    .single();

  if (error) {
    return { data: null, error };
  }
  
  return { data: data?.merchant_profiles, error: null };
};
