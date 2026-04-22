export interface CorporateAccount {
  id: string;
  company_name: string;
  company_email: string;
  company_phone?: string;
  billing_address?: string;
  tax_id?: string;
  logo_url?: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone?: string;
  account_status: 'pending' | 'active' | 'suspended' | 'inactive';
  credit_limit: number;
  current_balance: number;
  payment_terms_days: number;
  account_number?: string;
  created_at: string;
  updated_at: string;
}

export interface CorporateEmployee {
  id: string;
  corporate_account_id: string;
  user_id?: string;
  employee_name: string;
  employee_email: string;
  employee_phone?: string;
  employee_id_number?: string;
  department?: string;
  job_title?: string;
  travel_tier: 'standard' | 'executive' | 'vip';
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CorporateTravelPolicy {
  id: string;
  corporate_account_id: string;
  policy_name: string;
  is_default: boolean;
  max_bus_price?: number;
  max_event_price?: number;
  max_stay_price_per_night?: number;
  max_workspace_price_per_hour?: number;
  max_venue_price?: number;
  max_experience_price?: number;
  approval_required_above?: number;
  allowed_bus_tiers: string[];
  allowed_stay_ratings: number[];
  allowed_booking_types: string[];
  advance_booking_days: number;
  max_trip_duration_days?: number;
  require_purpose: boolean;
  require_project_code: boolean;
  apply_to_tiers: string[];
  created_at: string;
  updated_at: string;
}

export interface CorporateBooking {
  id: string;
  corporate_account_id: string;
  employee_id: string;
  booking_id: string;
  policy_id?: string;
  travel_purpose?: string;
  project_code?: string;
  cost_center?: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  policy_violations?: string[];
  invoiced: boolean;
  invoice_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CorporateInvoice {
  id: string;
  corporate_account_id: string;
  invoice_number: string;
  billing_period_start: string;
  billing_period_end: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  paid_at?: string;
  payment_reference?: string;
  notes?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CorporateInvoiceItem {
  id: string;
  invoice_id: string;
  corporate_booking_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  booking_reference?: string;
  employee_name?: string;
  travel_date?: string;
  created_at: string;
}

export interface PolicyViolation {
  type: string;
  message: string;
  severity: 'warning' | 'error';
}
