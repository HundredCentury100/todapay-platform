// Car Rental Types

export type VehicleType = 
  | 'economy' 
  | 'compact' 
  | 'midsize' 
  | 'fullsize' 
  | 'suv' 
  | 'luxury' 
  | 'van' 
  | 'pickup' 
  | 'convertible' 
  | 'electric';

export type TransmissionType = 'automatic' | 'manual';

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid';

export interface Vehicle {
  id: string;
  merchant_profile_id: string;
  name: string;
  make: string;
  model: string;
  year?: number;
  vehicle_type: VehicleType;
  transmission: TransmissionType;
  fuel_type: FuelType;
  seats: number;
  doors: number;
  luggage_capacity: number;
  features: string[];
  images: string[];
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  deposit_amount?: number;
  mileage_limit?: number;
  extra_mileage_rate?: number;
  min_driver_age: number;
  pickup_locations: PickupLocation[];
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
}

export interface PickupLocation {
  id?: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  is_airport?: boolean;
  airport_code?: string;
  operating_hours?: OperatingHours;
}

export interface OperatingHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface VehicleAvailability {
  id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  is_available: boolean;
  price_override?: number;
}

export interface CarBooking {
  id: string;
  booking_id: string;
  vehicle_id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_datetime: string;
  dropoff_datetime: string;
  driver_details: DriverDetails;
  add_ons: CarAddOn[];
  insurance_type?: string;
  created_at: string;
  // Joined fields
  vehicle?: Vehicle;
}

export interface DriverDetails {
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  license_number: string;
  license_country: string;
  license_expiry: string;
  address?: string;
}

export interface CarAddOn {
  id: string;
  name: string;
  price_per_day: number;
  quantity: number;
}

export interface CarSearchParams {
  pickup_location: string;
  dropoff_location?: string;
  pickup_date: string;
  pickup_time: string;
  dropoff_date: string;
  dropoff_time: string;
  driver_age?: number;
  vehicle_type?: VehicleType[];
  transmission?: TransmissionType;
  min_price?: number;
  max_price?: number;
}

export const CAR_FEATURES = [
  'gps', 'bluetooth', 'usb', 'cruise_control', 'backup_camera',
  'parking_sensors', 'heated_seats', 'leather_seats', 'sunroof',
  'apple_carplay', 'android_auto', 'wifi', 'child_seat_compatible',
  'roof_rack', '4wd', 'tow_bar', 'all_wheel_drive'
] as const;

export const CAR_INSURANCE_TYPES = [
  { id: 'basic', name: 'Basic Coverage', description: 'Third party liability only' },
  { id: 'standard', name: 'Standard Coverage', description: 'Collision damage waiver included' },
  { id: 'premium', name: 'Premium Coverage', description: 'Full coverage with zero excess' },
  { id: 'super', name: 'Super Coverage', description: 'Full coverage + personal effects' }
] as const;

export const CAR_ADD_ONS = [
  { id: 'gps', name: 'GPS Navigation', price_per_day: 5 },
  { id: 'child_seat', name: 'Child Seat', price_per_day: 8 },
  { id: 'booster_seat', name: 'Booster Seat', price_per_day: 5 },
  { id: 'wifi', name: 'Mobile WiFi', price_per_day: 10 },
  { id: 'additional_driver', name: 'Additional Driver', price_per_day: 15 },
  { id: 'roadside_assistance', name: 'Premium Roadside Assistance', price_per_day: 7 }
] as const;
