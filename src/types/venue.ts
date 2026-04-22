// Event Space Rental (Venue) Types

export type VenueType = 
  | 'conference_center' 
  | 'banquet_hall' 
  | 'rooftop' 
  | 'garden' 
  | 'beach' 
  | 'warehouse' 
  | 'restaurant' 
  | 'hotel_ballroom' 
  | 'theater' 
  | 'museum' 
  | 'gallery' 
  | 'studio' 
  | 'outdoor';

export interface Venue {
  id: string;
  merchant_profile_id: string;
  name: string;
  description?: string;
  venue_type: VenueType;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  capacity_standing?: number;
  capacity_seated?: number;
  capacity_theater?: number;
  capacity_banquet?: number;
  size_sqm?: number;
  amenities: string[];
  catering_options: CateringOption[];
  equipment_available: VenueEquipment[];
  images: string[];
  hourly_rate?: number;
  half_day_rate?: number;
  full_day_rate?: number;
  min_hours: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CateringOption {
  id: string;
  name: string;
  description?: string;
  price_per_person: number;
  min_guests?: number;
  menu_items?: string[];
}

export interface VenueEquipment {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity_available: number;
}

export interface VenueBooking {
  id: string;
  booking_id: string;
  venue_id: string;
  event_type: string;
  event_name?: string;
  start_datetime: string;
  end_datetime: string;
  expected_guests?: number;
  setup_requirements?: string;
  catering_selection: SelectedCatering[];
  equipment_selection: SelectedEquipment[];
  created_at: string;
  // Joined
  venue?: Venue;
}

export interface SelectedCatering {
  catering_option_id: string;
  name: string;
  quantity: number;
  price_per_person: number;
}

export interface SelectedEquipment {
  equipment_id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface VenueSearchParams {
  city: string;
  date: string;
  event_type?: string;
  capacity?: number;
  venue_type?: VenueType[];
  amenities?: string[];
  min_price?: number;
  max_price?: number;
}

export const VENUE_EVENT_TYPES = [
  'wedding', 'corporate_event', 'conference', 'birthday',
  'anniversary', 'product_launch', 'gala', 'networking',
  'workshop', 'seminar', 'exhibition', 'photo_shoot',
  'film_shoot', 'concert', 'fashion_show', 'award_ceremony',
  'graduation', 'memorial', 'religious_ceremony', 'other'
] as const;

export const VENUE_AMENITIES = [
  'wifi', 'parking', 'air_conditioning', 'heating', 'stage',
  'dance_floor', 'sound_system', 'lighting', 'projector',
  'screen', 'microphone', 'podium', 'greenroom', 'bridal_suite',
  'kitchen', 'bar', 'coat_check', 'wheelchair_accessible',
  'outdoor_area', 'smoking_area', 'security', 'valet_parking',
  'generator_backup', 'natural_light', 'blackout_capability'
] as const;

export const VENUE_SETUP_STYLES = [
  { id: 'theater', name: 'Theater Style', description: 'Rows of chairs facing a stage' },
  { id: 'classroom', name: 'Classroom Style', description: 'Tables and chairs facing front' },
  { id: 'banquet', name: 'Banquet Style', description: 'Round tables with chairs' },
  { id: 'cocktail', name: 'Cocktail Style', description: 'High tables and standing room' },
  { id: 'boardroom', name: 'Boardroom Style', description: 'Central table with chairs around' },
  { id: 'u_shape', name: 'U-Shape', description: 'Tables arranged in U formation' },
  { id: 'hollow_square', name: 'Hollow Square', description: 'Tables in square with open center' },
  { id: 'cabaret', name: 'Cabaret Style', description: 'Half-round tables facing stage' }
] as const;
