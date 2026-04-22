// Flight Types (Meta-search)

export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';

export type TripType = 'oneway' | 'roundtrip' | 'multicity';

export interface FlightSearchParams {
  trip_type: TripType;
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  passengers: PassengerCount;
  cabin_class: CabinClass;
  direct_only?: boolean;
  flexible_dates?: boolean;
  // For multi-city
  segments?: FlightSegmentSearch[];
}

export interface FlightSegmentSearch {
  origin: string;
  destination: string;
  date: string;
}

export interface PassengerCount {
  adults: number;
  children: number;
  infants: number;
}

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  timezone?: string;
}

export interface FlightSearch {
  id: string;
  user_id?: string;
  origin_code: string;
  destination_code: string;
  departure_date: string;
  return_date?: string;
  passengers: PassengerCount;
  cabin_class: CabinClass;
  search_results?: FlightOffer[];
  created_at: string;
}

export interface FlightOffer {
  id: string;
  provider: string;
  price: number;
  currency: string;
  outbound: FlightSegment[];
  inbound?: FlightSegment[];
  total_duration_minutes: number;
  stops: number;
  cabin_class: CabinClass;
  baggage_included: BaggageAllowance;
  refundable: boolean;
  changeable: boolean;
  booking_url?: string;
  expires_at?: string;
}

export interface FlightSegment {
  departure_airport: string;
  arrival_airport: string;
  departure_datetime: string;
  arrival_datetime: string;
  airline_code: string;
  airline_name: string;
  flight_number: string;
  aircraft_type?: string;
  duration_minutes: number;
  cabin_class: CabinClass;
  operating_airline?: string;
}

export interface BaggageAllowance {
  cabin_bag: { quantity: number; weight_kg?: number };
  checked_bag: { quantity: number; weight_kg?: number };
}

export interface FlightBooking {
  id: string;
  booking_id: string;
  external_booking_ref?: string;
  provider: string;
  origin_code: string;
  destination_code: string;
  departure_datetime: string;
  arrival_datetime: string;
  airline_code?: string;
  flight_number?: string;
  cabin_class?: CabinClass;
  passengers: FlightPassenger[];
  segments: FlightSegment[];
  created_at: string;
}

export interface FlightPassenger {
  type: 'adult' | 'child' | 'infant';
  title: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  passport_number?: string;
  passport_expiry?: string;
  passport_country?: string;
  frequent_flyer_number?: string;
  seat_preference?: 'window' | 'aisle' | 'middle';
  meal_preference?: string;
  special_assistance?: string[];
}

export const CABIN_CLASS_OPTIONS = [
  { id: 'economy', name: 'Economy', description: 'Standard seating' },
  { id: 'premium_economy', name: 'Premium Economy', description: 'Extra legroom' },
  { id: 'business', name: 'Business', description: 'Lie-flat seats' },
  { id: 'first', name: 'First Class', description: 'Ultimate luxury' }
] as const;

export const MEAL_PREFERENCES = [
  'Regular', 'Vegetarian', 'Vegan', 'Kosher', 'Halal',
  'Hindu', 'Gluten-free', 'Diabetic', 'Low-sodium',
  'Child meal', 'Infant meal', 'Seafood', 'Asian vegetarian'
] as const;

export const SPECIAL_ASSISTANCE = [
  'wheelchair_required', 'wheelchair_own', 'blind', 'deaf',
  'mobility_aid', 'stretcher', 'oxygen', 'service_animal',
  'unaccompanied_minor', 'elderly_assistance', 'pregnant'
] as const;

// Popular airlines for display
export const POPULAR_AIRLINES = [
  { code: 'UM', name: 'Air Zimbabwe' },
  { code: 'FN', name: 'Fastjet Zimbabwe' },
  { code: 'SA', name: 'South African Airways' },
  { code: 'FA', name: 'FlySafair' },
] as const;
