import { supabase } from "@/integrations/supabase/client";

export interface Event {
  id: string;
  name: string;
  description: string;
  type: string;
  location: string;
  venue: string;
  event_date: string;
  event_time: string;
  image?: string;
  organizer?: string;
  status: string;
}

export interface EventTicketTier {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  price: number;
  available_tickets: number;
  total_tickets: number;
  features: string[];
}

export interface EventSeat {
  id: string;
  event_id: string;
  ticket_tier_id: string;
  seat_number: string;
  seat_row: number;
  seat_column: number;
  status: 'available' | 'selected' | 'booked' | 'cash_reserved';
  booking_id?: string;
}

export interface EventReview {
  id: string;
  event_id: string;
  user_id: string;
  booking_id?: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
}

// Public columns only - excludes sensitive school PII fields
const PUBLIC_EVENT_COLUMNS = `
  id,
  name,
  description,
  type,
  location,
  venue,
  event_date,
  event_time,
  image,
  images,
  organizer,
  organizer_code,
  status,
  is_recurring,
  recurrence_pattern,
  recurrence_days,
  recurrence_end_date,
  season_name,
  series_id,
  parent_event_id,
  event_instance_number,
  grade_levels,
  reporting_time,
  supervision_ratio,
  permission_slip_required,
  created_at,
  updated_at
`;

export const getEvents = async (filters?: {
  type?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
}) => {
  let query = supabase
    .from("events")
    .select(`
      ${PUBLIC_EVENT_COLUMNS},
      event_ticket_tiers (
        id,
        name,
        price,
        available_tickets,
        total_tickets
      )
    `)
    .eq("status", "active")
    .order("event_date", { ascending: true });

  if (filters?.location) {
    query = query.ilike("location", `%${filters.location}%`);
  }

  const { data, error } = await query;

  if (error) return { data: null, error };

  // Filter by price range if specified
  let filteredData = data;
  if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
    filteredData = data?.filter((event: any) => {
      const minTierPrice = Math.min(
        ...event.event_ticket_tiers.map((tier: any) => tier.price)
      );
      if (filters.minPrice !== undefined && minTierPrice < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== undefined && minTierPrice > filters.maxPrice) {
        return false;
      }
      return true;
    });
  }

  // Filter by type if specified
  if (filters?.type) {
    filteredData = filteredData?.filter(
      (event: any) => event.type === filters.type
    );
  }

  return { data: filteredData, error: null };
};

export const getEventById = async (eventId: string) => {
  const { data, error } = await supabase
    .from("events")
    .select(`
      ${PUBLIC_EVENT_COLUMNS},
      event_ticket_tiers (
        id,
        name,
        description,
        price,
        available_tickets,
        total_tickets,
        features
      )
    `)
    .eq("id", eventId)
    .single();

  return { data, error };
};

export const getEventTicketTiers = async (eventId: string) => {
  const { data, error } = await supabase
    .from("event_ticket_tiers")
    .select("*")
    .eq("event_id", eventId)
    .order("price", { ascending: true });

  return { data, error };
};

export const getEventSeats = async (eventId: string, ticketTierId?: string) => {
  let query = supabase
    .from("event_seats")
    .select("*")
    .eq("event_id", eventId);

  if (ticketTierId) {
    query = query.eq("ticket_tier_id", ticketTierId);
  }

  const { data, error } = await query.order("seat_row").order("seat_column");

  return { data, error };
};

export const getEventReviews = async (eventId: string) => {
  const { data, error } = await supabase
    .from("event_reviews")
    .select(`
      *,
      profiles:user_id (
        full_name
      )
    `)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  return { data, error };
};

export const createEventReview = async (review: {
  event_id: string;
  booking_id?: string;
  rating: number;
  title: string;
  comment: string;
}) => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { data: null, error: { message: "User not authenticated" } };
  }

  const { data, error } = await supabase
    .from("event_reviews")
    .insert({
      ...review,
      user_id: userData.user.id,
    })
    .select()
    .single();

  return { data, error };
};

export const joinWaitlist = async (params: {
  event_id: string;
  ticket_tier_id: string;
  email: string;
}) => {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("event_waitlist")
    .insert({
      event_id: params.event_id,
      ticket_tier_id: params.ticket_tier_id,
      email: params.email,
      user_id: userData.user?.id || null,
    })
    .select()
    .single();

  return { data, error };
};

export const checkWaitlistStatus = async (eventId: string, email: string) => {
  const { data, error } = await supabase
    .from("event_waitlist")
    .select("*")
    .eq("event_id", eventId)
    .eq("email", email)
    .maybeSingle();

  return { data, error };
};

export const bookEventSeats = async (params: {
  eventId: string;
  seatIds: string[];
  bookingId: string;
}) => {
  const { data, error } = await supabase
    .from("event_seats")
    .update({
      status: "booked",
      booking_id: params.bookingId,
    })
    .in("id", params.seatIds)
    .eq("event_id", params.eventId)
    .eq("status", "available")
    .select();

  return { data, error };
};
