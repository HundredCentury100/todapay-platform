import { supabase } from "@/integrations/supabase/client";
import { Property, Room, RoomAvailability, StaySearchParams, PropertyType, RoomType, BedConfiguration, PropertyPolicies } from "@/types/stay";

// Fetch all properties with optional filters
export async function searchProperties(params: StaySearchParams): Promise<Property[]> {
  let query = supabase
    .from('properties')
    .select(`
      *,
      rooms (*)
    `)
    .eq('status', 'active');

  if (params.city) {
    query = query.ilike('city', `%${params.city}%`);
  }

  if (params.country) {
    query = query.ilike('country', `%${params.country}%`);
  }

  if (params.property_type && params.property_type.length > 0) {
    query = query.in('property_type', params.property_type);
  }

  if (params.star_rating && params.star_rating.length > 0) {
    query = query.in('star_rating', params.star_rating);
  }

  if (params.min_price !== undefined) {
    query = query.gte('min_price', params.min_price);
  }

  if (params.max_price !== undefined) {
    query = query.lte('min_price', params.max_price);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }

  // Transform to match Property type
  return (data || []).map(p => ({
    ...p,
    property_type: p.property_type as PropertyType,
    amenities: (p.amenities || []) as string[],
    policies: (p.policies || {}) as unknown as PropertyPolicies,
    images: (p.images || []) as string[],
    rooms: (p.rooms || []).map((r: any) => ({
      ...r,
      room_type: r.room_type as RoomType,
      amenities: (r.amenities || []) as string[],
      images: (r.images || []) as string[],
      bed_configuration: (r.bed_configuration || {}) as BedConfiguration,
    })),
  })) as Property[];
}

// Fetch a single property by ID with rooms
export async function getPropertyById(propertyId: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      rooms (*)
    `)
    .eq('id', propertyId)
    .single();

  if (error) {
    console.error('Error fetching property:', error);
    throw error;
  }

  if (!data) return null;

  return {
    ...data,
    property_type: data.property_type as PropertyType,
    amenities: (data.amenities || []) as string[],
    policies: (data.policies || {}) as unknown as PropertyPolicies,
    images: (data.images || []) as string[],
    rooms: (data.rooms || []).map((r: any) => ({
      ...r,
      room_type: r.room_type as RoomType,
      amenities: (r.amenities || []) as string[],
      images: (r.images || []) as string[],
      bed_configuration: (r.bed_configuration || {}) as BedConfiguration,
    })),
  } as Property;
}

// Fetch featured properties for homepage
export async function getFeaturedProperties(limit: number = 6): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      rooms (*)
    `)
    .eq('status', 'active')
    .order('star_rating', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching featured properties:', error);
    throw error;
  }

  return (data || []).map(p => ({
    ...p,
    property_type: p.property_type as PropertyType,
    amenities: (p.amenities || []) as string[],
    policies: (p.policies || {}) as unknown as PropertyPolicies,
    images: (p.images || []) as string[],
    rooms: (p.rooms || []).map((r: any) => ({
      ...r,
      room_type: r.room_type as RoomType,
      amenities: (r.amenities || []) as string[],
      images: (r.images || []) as string[],
      bed_configuration: (r.bed_configuration || {}) as BedConfiguration,
    })),
    min_price: p.rooms?.length > 0 ? Math.min(...p.rooms.map((r: any) => r.base_price)) : undefined,
  })) as Property[];
}

// Fetch room availability for a date range
export async function getRoomAvailability(
  roomId: string,
  checkIn: string,
  checkOut: string
): Promise<RoomAvailability[]> {
  const { data, error } = await supabase
    .from('room_availability')
    .select('*')
    .eq('room_id', roomId)
    .gte('date', checkIn)
    .lt('date', checkOut)
    .order('date');

  if (error) {
    console.error('Error fetching room availability:', error);
    throw error;
  }

  return data || [];
}

// Check if a room is available for booking
export async function checkRoomAvailability(
  roomId: string,
  checkIn: string,
  checkOut: string,
  requestedUnits: number = 1
): Promise<boolean> {
  const availability = await getRoomAvailability(roomId, checkIn, checkOut);
  
  // If no availability records, assume available
  if (availability.length === 0) return true;
  
  // Check all dates have sufficient units
  return availability.every(a => a.available_units >= requestedUnits);
}

// Create a stay booking
export async function createStayBooking(bookingData: {
  propertyId: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number;
  numRooms: number;
  guestDetails: { name: string; email?: string; phone?: string }[];
  specialRequests?: string;
  totalPrice: number;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  userId?: string;
}) {
  const ticketNumber = `STY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  // Create the main booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      booking_type: 'stay',
      vertical: 'stays',
      item_id: bookingData.propertyId,
      item_name: 'Stay Booking',
      base_price: bookingData.totalPrice,
      total_price: bookingData.totalPrice,
      passenger_name: bookingData.passengerName,
      passenger_email: bookingData.passengerEmail,
      passenger_phone: bookingData.passengerPhone,
      guest_email: bookingData.passengerEmail,
      ticket_number: ticketNumber,
      user_id: bookingData.userId,
      status: 'confirmed',
      payment_status: 'pending',
    })
    .select()
    .single();

  if (bookingError) {
    console.error('Error creating booking:', bookingError);
    throw bookingError;
  }

  // Create the stay-specific booking record
  const { data: stayBooking, error: stayError } = await supabase
    .from('stay_bookings')
    .insert({
      booking_id: booking.id,
      property_id: bookingData.propertyId,
      room_id: bookingData.roomId,
      check_in_date: bookingData.checkInDate,
      check_out_date: bookingData.checkOutDate,
      num_guests: bookingData.numGuests,
      num_rooms: bookingData.numRooms,
      guest_details: bookingData.guestDetails,
      special_requests: bookingData.specialRequests,
    })
    .select()
    .single();

  if (stayError) {
    console.error('Error creating stay booking:', stayError);
    throw stayError;
  }

  return { booking, stayBooking };
}

// Get property types with counts
export async function getPropertyTypeCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('properties')
    .select('property_type')
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching property type counts:', error);
    return {};
  }

  return (data || []).reduce((acc, p) => {
    acc[p.property_type] = (acc[p.property_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

// Get cities with available properties
export async function getAvailableCities(): Promise<string[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('city')
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching cities:', error);
    return [];
  }

  const cities = [...new Set((data || []).map(p => p.city))];
  return cities.sort();
}

// ==================== MERCHANT CRUD FUNCTIONS ====================

// Get properties for a merchant
export async function getMerchantProperties(merchantProfileId: string): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      rooms (*)
    `)
    .eq('merchant_profile_id', merchantProfileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching merchant properties:', error);
    throw error;
  }

  return (data || []).map(p => ({
    ...p,
    property_type: p.property_type as PropertyType,
    amenities: (p.amenities || []) as string[],
    policies: (p.policies || {}) as unknown as PropertyPolicies,
    images: (p.images || []) as string[],
    rooms: (p.rooms || []).map((r: any) => ({
      ...r,
      room_type: r.room_type as RoomType,
      amenities: (r.amenities || []) as string[],
      images: (r.images || []) as string[],
      bed_configuration: (r.bed_configuration || {}) as BedConfiguration,
    })),
  })) as Property[];
}

// Create a new property
export async function createProperty(data: {
  merchant_profile_id: string;
  name: string;
  description?: string;
  property_type: PropertyType;
  address: string;
  city: string;
  country: string;
  star_rating?: number;
  amenities?: string[];
  policies?: any;
  images?: string[];
  check_in_time?: string;
  check_out_time?: string;
}): Promise<Property> {
  const { data: property, error } = await supabase
    .from('properties')
    .insert({
      merchant_profile_id: data.merchant_profile_id,
      name: data.name,
      description: data.description || null,
      property_type: data.property_type,
      address: data.address,
      city: data.city,
      country: data.country,
      star_rating: data.star_rating || null,
      amenities: data.amenities || [],
      policies: data.policies || {},
      images: data.images || [],
      check_in_time: data.check_in_time || '14:00',
      check_out_time: data.check_out_time || '11:00',
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating property:', error);
    throw error;
  }

  return {
    ...property,
    property_type: property.property_type as PropertyType,
    amenities: (property.amenities || []) as string[],
    policies: (property.policies || {}) as unknown as PropertyPolicies,
    images: (property.images || []) as string[],
    rooms: [],
  } as Property;
}

// Update a property
export async function updateProperty(
  propertyId: string,
  data: Partial<Property>
): Promise<Property> {
  const updateData: any = {};
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.property_type !== undefined) updateData.property_type = data.property_type;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.country !== undefined) updateData.country = data.country;
  if (data.star_rating !== undefined) updateData.star_rating = data.star_rating;
  if (data.amenities !== undefined) updateData.amenities = data.amenities;
  if (data.policies !== undefined) updateData.policies = data.policies;
  if (data.images !== undefined) updateData.images = data.images;
  if (data.check_in_time !== undefined) updateData.check_in_time = data.check_in_time;
  if (data.check_out_time !== undefined) updateData.check_out_time = data.check_out_time;
  if (data.status !== undefined) updateData.status = data.status;

  const { data: property, error } = await supabase
    .from('properties')
    .update(updateData)
    .eq('id', propertyId)
    .select(`
      *,
      rooms (*)
    `)
    .single();

  if (error) {
    console.error('Error updating property:', error);
    throw error;
  }

  return {
    ...property,
    property_type: property.property_type as PropertyType,
    amenities: (property.amenities || []) as string[],
    policies: (property.policies || {}) as unknown as PropertyPolicies,
    images: (property.images || []) as string[],
    rooms: (property.rooms || []).map((r: any) => ({
      ...r,
      room_type: r.room_type as RoomType,
      amenities: (r.amenities || []) as string[],
      images: (r.images || []) as string[],
      bed_configuration: (r.bed_configuration || {}) as BedConfiguration,
    })),
  } as Property;
}

// Delete a property
export async function deleteProperty(propertyId: string): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', propertyId);

  if (error) {
    console.error('Error deleting property:', error);
    throw error;
  }
}

// Get rooms for a property
export async function getPropertyRooms(propertyId: string): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching rooms:', error);
    throw error;
  }

  return (data || []).map(r => ({
    ...r,
    room_type: r.room_type as RoomType,
    amenities: (r.amenities || []) as string[],
    images: (r.images || []) as string[],
    bed_configuration: (r.bed_configuration || {}) as BedConfiguration,
  })) as Room[];
}

// Create a new room
export async function createRoom(data: {
  property_id: string;
  name: string;
  description?: string;
  room_type: RoomType;
  max_guests: number;
  bed_configuration?: BedConfiguration;
  size_sqm?: number;
  amenities?: string[];
  base_price: number;
  images?: string[];
  quantity?: number;
}): Promise<Room> {
  const { data: room, error } = await supabase
    .from('rooms')
    .insert({
      property_id: data.property_id,
      name: data.name,
      description: data.description || null,
      room_type: data.room_type,
      max_guests: data.max_guests,
      bed_configuration: data.bed_configuration || {},
      size_sqm: data.size_sqm || null,
      amenities: data.amenities || [],
      base_price: data.base_price,
      images: data.images || [],
      quantity: data.quantity || 1,
      status: 'active',
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating room:', error);
    throw error;
  }

  return {
    ...room,
    room_type: room.room_type as RoomType,
    amenities: (room.amenities || []) as string[],
    images: (room.images || []) as string[],
    bed_configuration: (room.bed_configuration || {}) as BedConfiguration,
  } as Room;
}

// Update a room
export async function updateRoom(
  roomId: string,
  data: Partial<Room>
): Promise<Room> {
  const updateData: any = {};
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.room_type !== undefined) updateData.room_type = data.room_type;
  if (data.max_guests !== undefined) updateData.max_guests = data.max_guests;
  if (data.bed_configuration !== undefined) updateData.bed_configuration = data.bed_configuration;
  if (data.size_sqm !== undefined) updateData.size_sqm = data.size_sqm;
  if (data.amenities !== undefined) updateData.amenities = data.amenities;
  if (data.base_price !== undefined) updateData.base_price = data.base_price;
  if (data.images !== undefined) updateData.images = data.images;
  if (data.quantity !== undefined) updateData.quantity = data.quantity;
  if (data.status !== undefined) updateData.status = data.status;

  const { data: room, error } = await supabase
    .from('rooms')
    .update(updateData)
    .eq('id', roomId)
    .select()
    .single();

  if (error) {
    console.error('Error updating room:', error);
    throw error;
  }

  return {
    ...room,
    room_type: room.room_type as RoomType,
    amenities: (room.amenities || []) as string[],
    images: (room.images || []) as string[],
    bed_configuration: (room.bed_configuration || {}) as BedConfiguration,
  } as Room;
}

// Delete a room
export async function deleteRoom(roomId: string): Promise<void> {
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', roomId);

  if (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
}
