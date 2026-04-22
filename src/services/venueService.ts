import { supabase } from "@/integrations/supabase/client";
import { Venue, VenueSearchParams, VenueType, CateringOption, VenueEquipment } from "@/types/venue";

export interface VenueWithMerchant extends Venue {
  merchant_profiles?: {
    business_name: string;
    business_phone: string | null;
  } | null;
}

export const getVenues = async (params?: VenueSearchParams): Promise<VenueWithMerchant[]> => {
  let query = supabase
    .from('venues')
    .select(`
      *,
      merchant_profiles (
        business_name,
        business_phone
      )
    `)
    .eq('status', 'active');

  if (params?.city) {
    query = query.ilike('city', `%${params.city}%`);
  }

  if (params?.venue_type && params.venue_type.length > 0) {
    query = query.in('venue_type', params.venue_type);
  }

  if (params?.capacity) {
    query = query.or(`capacity_standing.gte.${params.capacity},capacity_seated.gte.${params.capacity}`);
  }

  if (params?.min_price) {
    query = query.gte('hourly_rate', params.min_price);
  }

  if (params?.max_price) {
    query = query.lte('hourly_rate', params.max_price);
  }

  const { data, error } = await query;

  if (error) throw error;
  
  return (data || []).map(venue => ({
    ...venue,
    amenities: venue.amenities || [],
    catering_options: Array.isArray(venue.catering_options) ? venue.catering_options : [],
    equipment_available: Array.isArray(venue.equipment_available) ? venue.equipment_available : [],
    images: Array.isArray(venue.images) ? venue.images : [],
  })) as unknown as VenueWithMerchant[];
};

export const getVenueById = async (venueId: string): Promise<VenueWithMerchant | null> => {
  const { data, error } = await supabase
    .from('venues')
    .select(`
      *,
      merchant_profiles (
        business_name,
        business_phone
      )
    `)
    .eq('id', venueId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error('Error fetching venue:', error);
    throw error;
  }
  
  if (!data) return null;

  return {
    ...data,
    amenities: data.amenities || [],
    catering_options: Array.isArray(data.catering_options) ? data.catering_options : [],
    equipment_available: Array.isArray(data.equipment_available) ? data.equipment_available : [],
    images: Array.isArray(data.images) ? data.images : [],
  } as unknown as VenueWithMerchant;
};

export interface VenueAvailabilityResult {
  bookings: any[];
  blockedDates: any[];
  isAvailable: (datetime: Date) => boolean;
}

export const getVenueAvailability = async (
  venueId: string,
  startDate: string,
  endDate: string
): Promise<VenueAvailabilityResult> => {
  // Fetch both bookings and blocked dates in parallel
  const [bookingsResult, blockedResult] = await Promise.all([
    supabase
      .from('venue_bookings')
      .select('*')
      .eq('venue_id', venueId)
      .gte('start_datetime', startDate)
      .lte('end_datetime', endDate),
    supabase
      .from('venue_blocked_dates')
      .select('*')
      .eq('venue_id', venueId)
  ]);

  if (bookingsResult.error) throw bookingsResult.error;
  if (blockedResult.error) throw blockedResult.error;

  const bookings = bookingsResult.data || [];
  const blockedDates = blockedResult.data || [];

  // Helper function to check if a specific datetime is available
  const isAvailable = (datetime: Date): boolean => {
    // Check against bookings
    const isBooked = bookings.some(booking => {
      const bookingStart = new Date(booking.start_datetime);
      const bookingEnd = new Date(booking.end_datetime);
      return datetime >= bookingStart && datetime <= bookingEnd;
    });

    if (isBooked) return false;

    // Check against blocked dates
    const isBlocked = blockedDates.some(block => {
      const blockStart = new Date(block.start_datetime);
      const blockEnd = new Date(block.end_datetime);

      // For recurring blocks, check day of week
      if (block.is_recurring && block.recurrence_day_of_week !== null) {
        if (datetime.getDay() === block.recurrence_day_of_week && datetime >= blockStart) {
          return true;
        }
      }

      // For regular blocks, check if within range
      return datetime >= blockStart && datetime <= blockEnd;
    });

    return !isBlocked;
  };

  return { bookings, blockedDates, isAvailable };
};

// Simple check for blocked dates only (for quick lookups)
export const getVenueBlockedDates = async (venueId: string) => {
  const { data, error } = await supabase
    .from('venue_blocked_dates')
    .select('*')
    .eq('venue_id', venueId)
    .order('start_datetime', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createVenueBooking = async (bookingData: {
  venue_id: string;
  event_type: string;
  event_name?: string;
  start_datetime: string;
  end_datetime: string;
  expected_guests?: number;
  setup_requirements?: string;
  catering_selection?: any[];
  equipment_selection?: any[];
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string;
  total_price: number;
  base_price: number;
}): Promise<{ booking: any; venueBooking: any }> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Create main booking first
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      booking_type: 'venue',
      item_id: bookingData.venue_id,
      item_name: bookingData.event_name || 'Venue Booking',
      passenger_name: bookingData.passenger_name,
      passenger_email: bookingData.passenger_email,
      passenger_phone: bookingData.passenger_phone,
      guest_email: bookingData.passenger_email,
      total_price: bookingData.total_price,
      base_price: bookingData.base_price,
      user_id: user?.id,
      status: 'pending',
      payment_status: 'pending',
      ticket_number: `VEN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      event_date: bookingData.start_datetime.split('T')[0],
      event_time: bookingData.start_datetime.split('T')[1] || '00:00',
    })
    .select()
    .single();

  if (bookingError) throw bookingError;

  // Create venue-specific booking
  const { data: venueBooking, error: venueError } = await supabase
    .from('venue_bookings')
    .insert({
      booking_id: booking.id,
      venue_id: bookingData.venue_id,
      event_type: bookingData.event_type,
      event_name: bookingData.event_name,
      start_datetime: bookingData.start_datetime,
      end_datetime: bookingData.end_datetime,
      expected_guests: bookingData.expected_guests,
      setup_requirements: bookingData.setup_requirements,
      catering_selection: bookingData.catering_selection || [],
      equipment_selection: bookingData.equipment_selection || [],
    })
    .select()
    .single();

  if (venueError) throw venueError;

  return { booking, venueBooking };
};

export const getFeaturedVenues = async (limit = 6): Promise<VenueWithMerchant[]> => {
  const { data, error } = await supabase
    .from('venues')
    .select(`
      *,
      merchant_profiles (
        business_name,
        business_phone
      )
    `)
    .eq('status', 'active')
    .limit(limit);

  if (error) throw error;
  
  return (data || []).map(venue => ({
    ...venue,
    amenities: venue.amenities || [],
    catering_options: Array.isArray(venue.catering_options) ? venue.catering_options : [],
    equipment_available: Array.isArray(venue.equipment_available) ? venue.equipment_available : [],
    images: Array.isArray(venue.images) ? venue.images : [],
  })) as unknown as VenueWithMerchant[];
};

// ==================== MERCHANT CRUD FUNCTIONS ====================

// Get venues for a merchant
export async function getMerchantVenues(merchantProfileId: string): Promise<Venue[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('merchant_profile_id', merchantProfileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching merchant venues:', error);
    throw error;
  }

  return (data || []).map(venue => ({
    ...venue,
    amenities: venue.amenities || [],
    catering_options: Array.isArray(venue.catering_options) ? venue.catering_options : [],
    equipment_available: Array.isArray(venue.equipment_available) ? venue.equipment_available : [],
    images: Array.isArray(venue.images) ? venue.images : [],
  })) as unknown as Venue[];
}

// Create a new venue
export async function createVenue(data: {
  merchant_profile_id: string;
  name: string;
  description?: string;
  venue_type: VenueType;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  size_sqm?: number;
  capacity_standing?: number;
  capacity_seated?: number;
  capacity_theater?: number;
  capacity_banquet?: number;
  hourly_rate?: number;
  half_day_rate?: number;
  full_day_rate?: number;
  min_hours?: number;
  amenities?: string[];
  catering_options?: CateringOption[];
  equipment_available?: VenueEquipment[];
  images?: string[];
}): Promise<Venue> {
  // Use type assertion for the insert to work with Supabase's Json type
  const { data: venue, error } = await supabase
    .from('venues')
    .insert({
      merchant_profile_id: data.merchant_profile_id,
      name: data.name,
      description: data.description || null,
      venue_type: data.venue_type,
      address: data.address,
      city: data.city,
      country: data.country,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      size_sqm: data.size_sqm || null,
      capacity_standing: data.capacity_standing || null,
      capacity_seated: data.capacity_seated || null,
      capacity_theater: data.capacity_theater || null,
      capacity_banquet: data.capacity_banquet || null,
      hourly_rate: data.hourly_rate || null,
      half_day_rate: data.half_day_rate || null,
      full_day_rate: data.full_day_rate || null,
      min_hours: data.min_hours || 2,
      amenities: data.amenities || [],
      catering_options: JSON.parse(JSON.stringify(data.catering_options || [])),
      equipment_available: JSON.parse(JSON.stringify(data.equipment_available || [])),
      images: data.images || [],
      status: 'active' as const,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating venue:', error);
    throw error;
  }

  return {
    ...venue,
    amenities: venue.amenities || [],
    catering_options: Array.isArray(venue.catering_options) ? venue.catering_options : [],
    equipment_available: Array.isArray(venue.equipment_available) ? venue.equipment_available : [],
    images: Array.isArray(venue.images) ? venue.images : [],
  } as unknown as Venue;
}

// Update a venue
export async function updateVenue(
  venueId: string,
  data: Partial<Venue>
): Promise<Venue> {
  const updateData: Record<string, any> = {};
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.venue_type !== undefined) updateData.venue_type = data.venue_type;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.country !== undefined) updateData.country = data.country;
  if (data.latitude !== undefined) updateData.latitude = data.latitude;
  if (data.longitude !== undefined) updateData.longitude = data.longitude;
  if (data.size_sqm !== undefined) updateData.size_sqm = data.size_sqm;
  if (data.capacity_standing !== undefined) updateData.capacity_standing = data.capacity_standing;
  if (data.capacity_seated !== undefined) updateData.capacity_seated = data.capacity_seated;
  if (data.capacity_theater !== undefined) updateData.capacity_theater = data.capacity_theater;
  if (data.capacity_banquet !== undefined) updateData.capacity_banquet = data.capacity_banquet;
  if (data.hourly_rate !== undefined) updateData.hourly_rate = data.hourly_rate;
  if (data.half_day_rate !== undefined) updateData.half_day_rate = data.half_day_rate;
  if (data.full_day_rate !== undefined) updateData.full_day_rate = data.full_day_rate;
  if (data.min_hours !== undefined) updateData.min_hours = data.min_hours;
  if (data.amenities !== undefined) updateData.amenities = data.amenities;
  if (data.catering_options !== undefined) updateData.catering_options = data.catering_options;
  if (data.equipment_available !== undefined) updateData.equipment_available = data.equipment_available;
  if (data.images !== undefined) updateData.images = data.images;
  if (data.status !== undefined) updateData.status = data.status;

  const { data: venue, error } = await supabase
    .from('venues')
    .update(updateData)
    .eq('id', venueId)
    .select()
    .single();

  if (error) {
    console.error('Error updating venue:', error);
    throw error;
  }

  return {
    ...venue,
    amenities: venue.amenities || [],
    catering_options: Array.isArray(venue.catering_options) ? venue.catering_options : [],
    equipment_available: Array.isArray(venue.equipment_available) ? venue.equipment_available : [],
    images: Array.isArray(venue.images) ? venue.images : [],
  } as unknown as Venue;
}

// Delete a venue
export async function deleteVenue(venueId: string): Promise<void> {
  // First check if there are any bookings
  const { data: bookings, error: bookingsError } = await supabase
    .from('venue_bookings')
    .select('id')
    .eq('venue_id', venueId)
    .limit(1);

  if (bookingsError) {
    console.error('Error checking venue bookings:', bookingsError);
    throw bookingsError;
  }

  if (bookings && bookings.length > 0) {
    throw new Error('Cannot delete venue with existing bookings. Please cancel all bookings first.');
  }

  const { error } = await supabase
    .from('venues')
    .delete()
    .eq('id', venueId);

  if (error) {
    console.error('Error deleting venue:', error);
    throw error;
  }
}
