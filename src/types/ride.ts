// Ride-hailing types (Uber + inDrive hybrid)

export type VehicleType = 'sedan' | 'suv' | 'van' | 'luxury' | 'economy' | 'any';
export type PricingMode = 'fixed' | 'negotiation';
export type RideStatus = 'searching' | 'bidding' | 'matched' | 'driver_arriving' | 'arrived_at_pickup' | 'in_progress' | 'completed' | 'cancelled';
export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
export type DriverStatus = 'pending_verification' | 'active' | 'suspended' | 'inactive';
export type ActiveRideStatus = 'driver_assigned' | 'driver_arriving' | 'arrived_at_pickup' | 'in_progress' | 'completed' | 'cancelled';

export interface Driver {
  id: string;
  user_id?: string;
  merchant_profile_id?: string;
  full_name: string;
  phone: string;
  email: string;
  profile_photo_url?: string;
  
  // Vehicle info
  vehicle_type: VehicleType;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_color?: string;
  license_plate: string;
  vehicle_photo_url?: string;
  
  // Location and status
  current_lat?: number;
  current_lng?: number;
  last_location_update?: string;
  is_online: boolean;
  is_available: boolean;
  current_ride_id?: string;
  
  // Stats
  rating: number;
  total_rides: number;
  total_earnings: number;
  acceptance_rate: number;
  cancellation_rate: number;
  
  // Verification
  license_verified: boolean;
  insurance_verified: boolean;
  background_check_status: string;
  documents?: Record<string, unknown>;
  
  status: DriverStatus;
  created_at: string;
  updated_at: string;
}

export interface RideRequest {
  id: string;
  passenger_id?: string;
  passenger_name: string;
  passenger_phone: string;
  
  // Locations
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  
  // Route info
  estimated_distance_km: number;
  estimated_duration_mins: number;
  route_polyline?: string;
  
  // Pricing
  pricing_mode: PricingMode;
  system_estimated_price: number;
  passenger_offered_price?: number;
  final_price?: number;
  surge_multiplier: number;
  currency: string;
  
  // Vehicle preference
  vehicle_type: VehicleType | 'any';
  
  // Status
  status: RideStatus;
  matched_driver_id?: string;
  expires_at?: string;
  
  created_at: string;
  updated_at: string;
  
  // Joined
  matched_driver?: Driver;
  bids?: RideBid[];
}

export interface RideBid {
  id: string;
  ride_request_id: string;
  driver_id: string;
  
  bid_amount: number;
  message?: string;
  eta_minutes: number;
  
  status: BidStatus;
  
  created_at: string;
  updated_at: string;
  
  // Joined
  driver?: Driver;
}

export interface ActiveRide {
  id: string;
  ride_request_id: string;
  driver_id: string;
  passenger_id?: string;
  
  status: ActiveRideStatus;
  
  // Times
  driver_assigned_at: string;
  driver_arrived_at?: string;
  pickup_time?: string;
  dropoff_time?: string;
  
  // Real-time location
  current_driver_lat?: number;
  current_driver_lng?: number;
  
  // Payment
  final_price?: number;
  payment_method: string;
  payment_status: string;
  tip_amount: number;
  
  // Safety
  share_code?: string;
  emergency_triggered: boolean;
  
  created_at: string;
  updated_at: string;
  
  // Joined
  driver?: Driver;
  ride_request?: RideRequest;
}

export interface RideRating {
  id: string;
  ride_id: string;
  rater_id: string;
  ratee_id: string;
  is_driver_rating: boolean;
  
  rating: number;
  review_text?: string;
  tags: string[];
  
  created_at: string;
}

export interface DriverEarnings {
  id: string;
  driver_id: string;
  ride_id?: string;
  
  gross_amount: number;
  platform_fee_percentage: number;
  platform_fee_amount: number;
  net_amount: number;
  tip_amount: number;
  
  payout_status: string;
  payout_reference?: string;
  paid_at?: string;
  
  created_at: string;
}

export interface SurgeZone {
  id: string;
  zone_name: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  
  current_multiplier: number;
  active_drivers: number;
  active_requests: number;
  
  updated_at: string;
}

// Request/Response types
export interface RideBookingRequest {
  passenger_name: string;
  passenger_phone: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  pricing_mode: PricingMode;
  offered_price?: number;
  vehicle_type?: VehicleType | 'any';
  recipient_name?: string;
  recipient_phone?: string;
}

export interface FareEstimate {
  base_fare: number;
  distance_fare: number;
  time_fare: number;
  surge_multiplier: number;
  surge_amount: number;
  total_estimate: number;
  currency: string;
  distance_km: number;
  duration_mins: number;
  min_offer?: number;
  max_offer?: number;
}

export interface NearbyDriver {
  id: string;
  full_name: string;
  vehicle_type: VehicleType;
  vehicle_make?: string;
  vehicle_model?: string;
  license_plate: string;
  rating: number;
  current_lat: number;
  current_lng: number;
  distance_km: number;
  eta_minutes: number;
}

// Pricing constants
// Flat pricing: $0.50/km for Go (base), other vehicles use multipliers
export const PRICING_CONFIG = {
  first_km_rate: 0.50,             // $0.50 per km (flat rate for Go)
  first_km_threshold: 2,          // First 2 km (same rate now)
  per_km_rate: 0.50,             // $0.50 per km after first 2 km
  per_minute_rate: 0.02,         // $0.02 per minute
  minimum_fare: 2.00,            // Minimum $2 fare
  booking_fee: 0.50,             // $0.50 booking fee
  cancellation_fee: 5.00,        // $5 cancellation fee
  platform_fee_percentage: 10,
  negotiation_min_percentage: 0.7,
  negotiation_max_percentage: 1.5,
  currency: 'USD',
} as const;

export const VEHICLE_TYPES = [
  { id: 'economy', name: 'Economy', capacity: 4, multiplier: 1.0 },
  { id: 'sedan', name: 'Sedan', capacity: 4, multiplier: 1.2 },
  { id: 'suv', name: 'SUV', capacity: 6, multiplier: 1.5 },
  { id: 'van', name: 'Van', capacity: 8, multiplier: 1.8 },
  { id: 'luxury', name: 'Luxury', capacity: 4, multiplier: 2.5 },
] as const;

export const RIDE_STATUS_LABELS: Record<RideStatus, string> = {
  searching: 'Looking for drivers',
  bidding: 'Receiving bids',
  matched: 'Driver matched',
  driver_arriving: 'Driver on the way',
  arrived_at_pickup: 'Driver arrived',
  in_progress: 'On trip',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
