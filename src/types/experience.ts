// Experience Types (Tours, Activities, Adventures)

export type ExperienceType = 
  | 'tour' 
  | 'adventure' 
  | 'food_drink' 
  | 'wellness' 
  | 'cultural' 
  | 'nature' 
  | 'water_sports' 
  | 'aerial' 
  | 'workshop' 
  | 'nightlife' 
  | 'photography' 
  | 'volunteer';

export type DifficultyLevel = 'easy' | 'moderate' | 'challenging' | 'expert' | 'extreme';

export interface Experience {
  id: string;
  merchant_profile_id: string;
  name: string;
  description?: string;
  experience_type: ExperienceType;
  duration_hours: number;
  location: string;
  meeting_point?: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  max_participants: number;
  min_participants: number;
  difficulty_level?: DifficultyLevel;
  age_restriction?: string;
  what_included: string[];
  what_to_bring: string[];
  languages: string[];
  images: string[];
  price_per_person: number;
  private_group_price?: number;
  cancellation_policy?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  // Computed
  schedules?: ExperienceSchedule[];
  review_score?: number;
  review_count?: number;
}

export interface ExperienceSchedule {
  id: string;
  experience_id: string;
  date: string;
  start_time: string;
  available_spots: number;
  price_override?: number;
  guide_assigned?: string;
  created_at: string;
}

export interface ExperienceBooking {
  id: string;
  booking_id: string;
  experience_id: string;
  schedule_id?: string;
  num_participants: number;
  participant_details: ParticipantDetail[];
  is_private: boolean;
  special_requests?: string;
  created_at: string;
  // Joined
  experience?: Experience;
  schedule?: ExperienceSchedule;
}

export interface ParticipantDetail {
  name: string;
  age?: number;
  dietary_restrictions?: string;
  medical_conditions?: string;
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface ExperienceSearchParams {
  city: string;
  date?: string;
  experience_type?: ExperienceType[];
  duration_min?: number;
  duration_max?: number;
  difficulty?: DifficultyLevel[];
  min_price?: number;
  max_price?: number;
  language?: string;
  participants?: number;
}

export const EXPERIENCE_CATEGORIES = [
  { id: 'tour', name: 'Tours & Sightseeing', icon: 'Map' },
  { id: 'adventure', name: 'Adventure & Outdoor', icon: 'Mountain' },
  { id: 'food_drink', name: 'Food & Drink', icon: 'Utensils' },
  { id: 'wellness', name: 'Wellness & Spa', icon: 'Heart' },
  { id: 'cultural', name: 'Cultural & Heritage', icon: 'Landmark' },
  { id: 'nature', name: 'Nature & Wildlife', icon: 'TreePine' },
  { id: 'water_sports', name: 'Water Sports', icon: 'Waves' },
  { id: 'aerial', name: 'Aerial Activities', icon: 'Plane' },
  { id: 'workshop', name: 'Classes & Workshops', icon: 'GraduationCap' },
  { id: 'nightlife', name: 'Nightlife & Entertainment', icon: 'Music' },
  { id: 'photography', name: 'Photography Tours', icon: 'Camera' },
  { id: 'volunteer', name: 'Volunteering', icon: 'HandHeart' }
] as const;

export const EXPERIENCE_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Swahili',
  'Dutch', 'Russian', 'Greek', 'Turkish', 'Thai', 'Vietnamese'
] as const;

export const COMMON_INCLUSIONS = [
  'Guide', 'Transport', 'Entrance fees', 'Equipment',
  'Snacks', 'Lunch', 'Dinner', 'Drinks', 'Water',
  'Photos', 'Insurance', 'Hotel pickup', 'Gratuities'
] as const;

export const COMMON_BRING_ITEMS = [
  'Comfortable shoes', 'Sunscreen', 'Hat', 'Sunglasses',
  'Camera', 'Water bottle', 'Snacks', 'Cash',
  'ID/Passport', 'Swimwear', 'Towel', 'Jacket',
  'Rain gear', 'Insect repellent', 'Medications'
] as const;
