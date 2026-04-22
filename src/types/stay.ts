// Stay/Accommodation Types

export type PropertyType = 
  | 'hotel' 
  | 'lodge' 
  | 'apartment' 
  | 'villa' 
  | 'hostel' 
  | 'guesthouse' 
  | 'resort' 
  | 'cottage' 
  | 'cabin' 
  | 'boutique_hotel';

export type RoomType = 
  | 'single' 
  | 'double' 
  | 'twin' 
  | 'suite' 
  | 'family' 
  | 'dormitory' 
  | 'studio' 
  | 'penthouse';

export interface Property {
  id: string;
  merchant_profile_id: string;
  name: string;
  description?: string;
  property_type: PropertyType;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  star_rating?: number;
  amenities: string[];
  policies: PropertyPolicies;
  images: string[];
  check_in_time: string;
  check_out_time: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
  // Computed/joined fields
  rooms?: Room[];
  min_price?: number;
  review_score?: number;
  review_count?: number;
}

export interface PropertyPolicies {
  cancellation?: string;
  check_in_instructions?: string;
  house_rules?: string[];
  pets_allowed?: boolean;
  smoking_allowed?: boolean;
  children_allowed?: boolean;
  deposit_required?: number;
}

export interface Room {
  id: string;
  property_id: string;
  name: string;
  description?: string;
  room_type: RoomType;
  max_guests: number;
  bed_configuration: BedConfiguration;
  size_sqm?: number;
  amenities: string[];
  base_price: number;
  images: string[];
  quantity: number;
  status: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  availability?: RoomAvailability[];
}

export interface BedConfiguration {
  single_beds?: number;
  double_beds?: number;
  queen_beds?: number;
  king_beds?: number;
  sofa_beds?: number;
  bunk_beds?: number;
}

export interface RoomAvailability {
  id: string;
  room_id: string;
  date: string;
  available_units: number;
  price_override?: number;
  min_stay: number;
}

export interface StayBooking {
  id: string;
  booking_id: string;
  property_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  num_rooms: number;
  special_requests?: string;
  guest_details: GuestDetail[];
  created_at: string;
  // Joined fields
  property?: Property;
  room?: Room;
}

export interface GuestDetail {
  name: string;
  email?: string;
  phone?: string;
  nationality?: string;
  id_type?: string;
  id_number?: string;
}

export interface StaySearchParams {
  city?: string;
  country?: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  rooms: number;
  property_type?: PropertyType[];
  min_price?: number;
  max_price?: number;
  star_rating?: number[];
  amenities?: string[];
}

export const PROPERTY_AMENITIES = [
  'wifi', 'parking', 'pool', 'gym', 'spa', 'restaurant', 'bar',
  'room_service', 'laundry', 'airport_shuttle', 'business_center',
  'pet_friendly', 'air_conditioning', 'heating', 'kitchen',
  'balcony', 'garden', 'beach_access', 'ski_access', 'ev_charging'
] as const;

export const ROOM_AMENITIES = [
  'wifi', 'tv', 'air_conditioning', 'heating', 'minibar', 'safe',
  'desk', 'iron', 'hairdryer', 'tea_coffee', 'bathtub', 'shower',
  'balcony', 'sea_view', 'city_view', 'garden_view', 'pool_view',
  'wheelchair_accessible', 'connecting_rooms', 'kitchenette'
] as const;
