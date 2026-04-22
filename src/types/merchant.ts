export type MerchantRole = 
  | 'bus_operator' 
  | 'event_organizer' 
  | 'admin' 
  | 'travel_agent' 
  | 'booking_agent' 
  | 'venue_owner'
  | 'property_owner'
  | 'airline_partner'
  | 'workspace_provider'
  | 'car_rental_company'
  | 'transfer_provider'
  | 'experience_host';

export interface MerchantProfile {
  id: string;
  user_id: string;
  role: MerchantRole;
  business_name: string;
  business_email: string;
  business_phone?: string;
  tax_id?: string;
  business_address?: string;
  logo_url?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_at?: string;
  created_at: string;
  updated_at: string;
  support_email?: string;
  support_phone?: string;
  website_url?: string;
  customer_agent_name?: string;
  customer_agent_email?: string;
  customer_agent_phone?: string;
  whatsapp_number?: string;
  social_media_links?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  agent_license_number?: string;
  commission_rate?: number;
  agent_tier?: 'standard' | 'silver' | 'gold' | 'platinum';
  referral_code?: string;
  agent_type?: 'internal' | 'external';
  agent_code?: string;
}

export interface AgentClient {
  id: string;
  agent_profile_id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_company?: string;
  client_passport?: string;
  total_bookings: number;
  total_revenue: number;
  notes?: string;
  created_at: string;
  last_booking_date?: string;
  updated_at: string;
}

export interface AgentCommission {
  id: string;
  agent_profile_id: string;
  booking_id: string;
  commission_amount: number;
  commission_rate: number;
  booking_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
  created_at: string;
  approved_at?: string;
  paid_at?: string;
  approved_by?: string;
  paid_by?: string;
}

export interface OperatorAssociation {
  id: string;
  merchant_profile_id: string;
  operator_name: string;
  created_at: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalBookings: number;
  activeRoutes?: number;
  activeEvents?: number;
  averageRating: number;
  revenueGrowth: number;
  bookingsGrowth: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
}
