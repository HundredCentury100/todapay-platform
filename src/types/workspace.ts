// Workspace & Co-working Types

export type WorkspaceType = 
  | 'hot_desk' 
  | 'dedicated_desk' 
  | 'private_office' 
  | 'meeting_room' 
  | 'conference_room' 
  | 'virtual_office' 
  | 'event_space' 
  | 'podcast_studio' 
  | 'photo_studio';

export type WorkspaceBookingType = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface Workspace {
  id: string;
  merchant_profile_id: string;
  name: string;
  description?: string;
  workspace_type: WorkspaceType;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  amenities: string[];
  images: string[];
  hourly_rate?: number;
  daily_rate?: number;
  weekly_rate?: number;
  monthly_rate?: number;
  operating_hours: OperatingHours;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface OperatingHours {
  monday?: { open: string; close: string };
  tuesday?: { open: string; close: string };
  wednesday?: { open: string; close: string };
  thursday?: { open: string; close: string };
  friday?: { open: string; close: string };
  saturday?: { open: string; close: string };
  sunday?: { open: string; close: string };
}

export interface WorkspaceAvailability {
  id: string;
  workspace_id: string;
  date: string;
  start_time?: string;
  end_time?: string;
  is_available: boolean;
  price_override?: number;
}

export interface WorkspaceBooking {
  id: string;
  booking_id: string;
  workspace_id: string;
  start_datetime: string;
  end_datetime: string;
  booking_type: WorkspaceBookingType;
  num_attendees: number;
  equipment_requested: EquipmentItem[];
  catering_requested: CateringItem[];
  created_at: string;
  // Joined
  workspace?: Workspace;
}

export interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface CateringItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  dietary_notes?: string;
}

export interface WorkspaceSearchParams {
  city: string;
  date: string;
  start_time?: string;
  end_time?: string;
  workspace_type?: WorkspaceType[];
  capacity?: number;
  amenities?: string[];
  booking_type?: WorkspaceBookingType;
}

export const WORKSPACE_AMENITIES = [
  'wifi', 'power_outlets', 'monitor', 'webcam', 'whiteboard',
  'projector', 'video_conferencing', 'printer', 'scanner',
  'phone_booth', 'kitchen', 'coffee', 'tea', 'snacks',
  'locker', 'shower', 'bike_storage', 'parking', 
  'reception', 'mail_handling', '24_7_access', 'security',
  'standing_desk', 'ergonomic_chair', 'natural_light', 'quiet_zone'
] as const;

export const WORKSPACE_EQUIPMENT = [
  { id: 'monitor_4k', name: '4K External Monitor', price_per_hour: 5 },
  { id: 'webcam_hd', name: 'HD Webcam', price_per_hour: 3 },
  { id: 'ring_light', name: 'Ring Light', price_per_hour: 2 },
  { id: 'green_screen', name: 'Green Screen', price_per_hour: 5 },
  { id: 'microphone', name: 'Professional Microphone', price_per_hour: 4 },
  { id: 'headphones', name: 'Noise-Cancelling Headphones', price_per_hour: 2 },
  { id: 'whiteboard', name: 'Portable Whiteboard', price_per_hour: 3 },
  { id: 'flipchart', name: 'Flipchart & Markers', price_per_hour: 2 }
] as const;
