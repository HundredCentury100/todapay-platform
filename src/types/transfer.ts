// Transfer & Taxi Types

export type TransferBookingType = 'instant' | 'scheduled';

export type TransferServiceType = 
  | 'airport_pickup' 
  | 'airport_dropoff' 
  | 'point_to_point' 
  | 'hourly_hire' 
  | 'shuttle' 
  | 'tour_transfer'
  | 'on_demand_taxi';

export type TransferZoneType = 'airport' | 'city_center' | 'suburb' | 'region' | 'hotel' | 'station';

export type VehicleCategory = 
  | 'economy_sedan'
  | 'sedan'
  | 'suv'
  | 'van'
  | 'minibus'
  | 'luxury_sedan'
  | 'luxury_suv'
  | 'limousine'
  | 'coach';

export type TransferRequestStatus = 
  | 'pending'
  | 'confirmed'
  | 'driver_assigned'
  | 'driver_en_route'
  | 'driver_arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type VehicleStatus = 'active' | 'maintenance' | 'inactive';

export interface TransferRequest {
  id: string;
  user_id?: string;
  merchant_profile_id?: string;
  
  // Booking type and service
  booking_type: TransferBookingType;
  service_type: TransferServiceType;
  vehicle_category: VehicleCategory;
  
  // Locations
  pickup_location: string;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_location: string;
  dropoff_lat?: number;
  dropoff_lng?: number;
  
  // Scheduling
  scheduled_datetime?: string;
  pickup_datetime?: string;
  
  // Airport-specific
  flight_number?: string;
  flight_status?: string;
  terminal?: string;
  meet_and_greet: boolean;
  
  // Passenger info
  num_passengers: number;
  num_luggage: number;
  passenger_name?: string;
  passenger_phone?: string;
  passenger_email?: string;
  special_requirements?: string;
  
  // Pricing
  distance_km?: number;
  duration_minutes?: number;
  price_quoted?: number;
  price_final?: number;
  currency: string;
  
  // Assignment
  assigned_driver_id?: string;
  assigned_vehicle_id?: string;
  
  // Status
  status: TransferRequestStatus;
  confirmed_at?: string;
  driver_assigned_at?: string;
  pickup_time?: string;
  dropoff_time?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  
  // Payment
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  payment_method?: string;
  
  created_at: string;
  updated_at: string;
}

export interface TransferVehicle {
  id: string;
  merchant_profile_id: string;
  driver_id?: string;
  
  // Vehicle details
  vehicle_category: VehicleCategory;
  make: string;
  model: string;
  year?: number;
  color?: string;
  license_plate: string;
  
  // Capacity
  max_passengers: number;
  max_luggage: number;
  
  // Features
  amenities: string[];
  photos: string[];
  
  // Status
  status: VehicleStatus;
  is_available: boolean;
  current_location_lat?: number;
  current_location_lng?: number;
  
  created_at: string;
  updated_at: string;
}

export interface TransferZonePricing {
  id: string;
  merchant_profile_id: string;
  from_zone_name: string;
  from_zone_type?: TransferZoneType;
  to_zone_name: string;
  to_zone_type?: TransferZoneType;
  
  economy_sedan_price?: number;
  sedan_price?: number;
  suv_price?: number;
  van_price?: number;
  minibus_price?: number;
  luxury_sedan_price?: number;
  luxury_suv_price?: number;
  limousine_price?: number;
  coach_price?: number;
  
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Legacy types for backward compatibility
export interface TransferService {
  id: string;
  merchant_profile_id: string;
  name: string;
  service_type: TransferServiceType;
  vehicle_type: string;
  max_passengers: number;
  max_luggage: number;
  base_price: number;
  price_per_km?: number;
  service_areas: ServiceArea[];
  amenities: string[];
  images: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface ServiceArea {
  city: string;
  country: string;
  airports?: string[];
}

export interface TransferZone {
  id: string;
  merchant_profile_id: string;
  zone_name: string;
  zone_type: TransferZoneType;
  coordinates?: ZoneCoordinates;
  created_at: string;
}

export interface ZoneCoordinates {
  center_lat: number;
  center_lng: number;
  radius_km?: number;
  polygon?: [number, number][];
}

export interface TransferPricing {
  id: string;
  transfer_service_id: string;
  from_zone_id?: string;
  to_zone_id?: string;
  fixed_price?: number;
  created_at: string;
  from_zone?: TransferZone;
  to_zone?: TransferZone;
}

export interface TransferBooking {
  id: string;
  booking_id: string;
  transfer_service_id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_datetime: string;
  flight_number?: string;
  num_passengers: number;
  num_luggage: number;
  special_requirements?: string;
  meet_and_greet: boolean;
  driver_assigned?: string;
  created_at: string;
  transfer_service?: TransferService;
}

export interface TransferSearchParams {
  pickup_location: string;
  dropoff_location: string;
  pickup_date: string;
  pickup_time: string;
  passengers: number;
  luggage?: number;
  service_type?: TransferServiceType;
  flight_number?: string;
}

export interface TransferQuote {
  service_id: string;
  service_name: string;
  vehicle_type: string;
  max_passengers: number;
  price: number;
  currency: string;
  duration_minutes: number;
  distance_km: number;
  amenities: string[];
  images: string[];
  merchant_name?: string;
}

// Vehicle category details for UI
export const VEHICLE_CATEGORIES: {
  id: VehicleCategory;
  name: string;
  passengers: number;
  luggage: number;
  description: string;
  icon: string;
  multiplier: number;
}[] = [
  { id: 'economy_sedan', name: 'Economy', passengers: 3, luggage: 2, description: 'Budget-friendly sedan', icon: '🚗', multiplier: 1.0 },
  { id: 'sedan', name: 'Sedan', passengers: 4, luggage: 3, description: 'Standard sedan', icon: '🚙', multiplier: 1.2 },
  { id: 'suv', name: 'SUV', passengers: 6, luggage: 5, description: 'Spacious SUV', icon: '🚐', multiplier: 1.5 },
  { id: 'van', name: 'Van', passengers: 8, luggage: 8, description: 'Minivan for groups', icon: '🚐', multiplier: 1.8 },
  { id: 'minibus', name: 'Minibus', passengers: 16, luggage: 14, description: 'Small bus for groups', icon: '🚌', multiplier: 2.5 },
  { id: 'luxury_sedan', name: 'Luxury Sedan', passengers: 3, luggage: 2, description: 'Premium sedan', icon: '🚘', multiplier: 2.0 },
  { id: 'luxury_suv', name: 'Luxury SUV', passengers: 5, luggage: 4, description: 'Executive SUV', icon: '🚙', multiplier: 2.5 },
  { id: 'limousine', name: 'Limousine', passengers: 8, luggage: 4, description: 'Stretch limousine', icon: '🚎', multiplier: 3.5 },
  { id: 'coach', name: 'Coach', passengers: 50, luggage: 50, description: 'Full-size coach bus', icon: '🚌', multiplier: 5.0 },
];

// Service type details for UI
export const SERVICE_TYPES: {
  id: TransferServiceType;
  name: string;
  description: string;
  icon: string;
  isAirport: boolean;
}[] = [
  { id: 'airport_pickup', name: 'Airport Pickup', description: 'Meet & greet at arrivals', icon: '✈️', isAirport: true },
  { id: 'airport_dropoff', name: 'Airport Dropoff', description: 'Drop at departures', icon: '🛫', isAirport: true },
  { id: 'point_to_point', name: 'City Transfer', description: 'A to B transfer', icon: '🚗', isAirport: false },
  { id: 'hourly_hire', name: 'Hourly Hire', description: 'Driver at disposal', icon: '⏰', isAirport: false },
  { id: 'shuttle', name: 'Shuttle', description: 'Shared transfer', icon: '🚐', isAirport: false },
  { id: 'tour_transfer', name: 'Day Trip', description: 'Full day with driver', icon: '🗺️', isAirport: false },
  { id: 'on_demand_taxi', name: 'Taxi', description: 'Instant pickup', icon: '🚕', isAirport: false },
];

// Legacy constants for backward compatibility
export const TRANSFER_VEHICLE_TYPES = [
  { id: 'sedan', name: 'Sedan', passengers: 3, luggage: 2 },
  { id: 'suv', name: 'SUV', passengers: 5, luggage: 4 },
  { id: 'van', name: 'Van', passengers: 7, luggage: 6 },
  { id: 'minibus', name: 'Minibus', passengers: 12, luggage: 10 },
  { id: 'luxury_sedan', name: 'Luxury Sedan', passengers: 3, luggage: 2 },
  { id: 'luxury_suv', name: 'Luxury SUV', passengers: 5, luggage: 4 },
  { id: 'limousine', name: 'Limousine', passengers: 6, luggage: 4 },
  { id: 'coach', name: 'Coach', passengers: 50, luggage: 50 }
] as const;

export const TRANSFER_AMENITIES = [
  'wifi', 'water', 'child_seat', 'wheelchair_accessible',
  'meet_and_greet', 'flight_tracking', 'luggage_assistance',
  'charging_ports', 'newspapers', 'snacks'
] as const;
