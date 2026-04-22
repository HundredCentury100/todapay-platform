import { supabase } from "@/integrations/supabase/client";
import type { 
  CorporateAccount, 
  CorporateEmployee, 
  CorporateTravelPolicy, 
  CorporateBooking, 
  CorporateInvoice,
  CorporateInvoiceItem,
  PolicyViolation 
} from "@/types/corporate";

export type {
  CorporateAccount,
  CorporateEmployee,
  CorporateTravelPolicy,
  CorporateBooking,
  CorporateInvoice,
  CorporateInvoiceItem,
  PolicyViolation
};

// Account Management
export const getCorporateAccount = async (accountId: string): Promise<CorporateAccount | null> => {
  const { data, error } = await supabase
    .from('corporate_accounts')
    .select('*')
    .eq('id', accountId)
    .single();
  
  if (error) throw error;
  return data as CorporateAccount;
};

export const getCurrentEmployeeAccount = async (): Promise<{ account: CorporateAccount; employee: CorporateEmployee } | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: employee, error: empError } = await supabase
    .from('corporate_employees')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (empError || !employee) return null;

  const { data: account, error: accError } = await supabase
    .from('corporate_accounts')
    .select('*')
    .eq('id', employee.corporate_account_id)
    .single();

  if (accError || !account) return null;

  return { account: account as CorporateAccount, employee: employee as CorporateEmployee };
};

export const updateCorporateAccount = async (accountId: string, updates: Partial<CorporateAccount>): Promise<CorporateAccount> => {
  const { data, error } = await supabase
    .from('corporate_accounts')
    .update(updates)
    .eq('id', accountId)
    .select()
    .single();
  
  if (error) throw error;
  return data as CorporateAccount;
};

// Employee Management
export const getEmployees = async (accountId: string): Promise<CorporateEmployee[]> => {
  const { data, error } = await supabase
    .from('corporate_employees')
    .select('*')
    .eq('corporate_account_id', accountId)
    .order('employee_name');
  
  if (error) throw error;
  return (data || []) as CorporateEmployee[];
};

export const createEmployee = async (employee: Omit<CorporateEmployee, 'id' | 'created_at' | 'updated_at'>): Promise<CorporateEmployee> => {
  const { data, error } = await supabase
    .from('corporate_employees')
    .insert(employee)
    .select()
    .single();
  
  if (error) throw error;
  return data as CorporateEmployee;
};

export const updateEmployee = async (employeeId: string, updates: Partial<CorporateEmployee>): Promise<CorporateEmployee> => {
  const { data, error } = await supabase
    .from('corporate_employees')
    .update(updates)
    .eq('id', employeeId)
    .select()
    .single();
  
  if (error) throw error;
  return data as CorporateEmployee;
};

export const deleteEmployee = async (employeeId: string): Promise<void> => {
  const { error } = await supabase
    .from('corporate_employees')
    .delete()
    .eq('id', employeeId);
  
  if (error) throw error;
};

// Travel Policy Management
export const getPolicies = async (accountId: string): Promise<CorporateTravelPolicy[]> => {
  const { data, error } = await supabase
    .from('corporate_travel_policies')
    .select('*')
    .eq('corporate_account_id', accountId)
    .order('policy_name');
  
  if (error) throw error;
  return (data || []) as CorporateTravelPolicy[];
};

export const getDefaultPolicy = async (accountId: string): Promise<CorporateTravelPolicy | null> => {
  const { data, error } = await supabase
    .from('corporate_travel_policies')
    .select('*')
    .eq('corporate_account_id', accountId)
    .eq('is_default', true)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data as CorporateTravelPolicy | null;
};

export const createPolicy = async (policy: Omit<CorporateTravelPolicy, 'id' | 'created_at' | 'updated_at'>): Promise<CorporateTravelPolicy> => {
  const { data, error } = await supabase
    .from('corporate_travel_policies')
    .insert(policy)
    .select()
    .single();
  
  if (error) throw error;
  return data as CorporateTravelPolicy;
};

export const updatePolicy = async (policyId: string, updates: Partial<CorporateTravelPolicy>): Promise<CorporateTravelPolicy> => {
  const { data, error } = await supabase
    .from('corporate_travel_policies')
    .update(updates)
    .eq('id', policyId)
    .select()
    .single();
  
  if (error) throw error;
  return data as CorporateTravelPolicy;
};

export const deletePolicy = async (policyId: string): Promise<void> => {
  const { error } = await supabase
    .from('corporate_travel_policies')
    .delete()
    .eq('id', policyId);
  
  if (error) throw error;
};

// Policy Compliance Validation
export const validateBookingAgainstPolicy = (
  policy: CorporateTravelPolicy,
  employee: CorporateEmployee,
  bookingType: string,
  price: number,
  travelDate: Date
): PolicyViolation[] => {
  const violations: PolicyViolation[] = [];
  
  if (!policy.allowed_booking_types.includes(bookingType)) {
    violations.push({
      type: 'booking_type',
      message: `${bookingType} bookings are not allowed by company policy`,
      severity: 'error'
    });
  }
  
  if (!policy.apply_to_tiers.includes(employee.travel_tier)) {
    violations.push({
      type: 'tier',
      message: `This policy does not apply to ${employee.travel_tier} tier employees`,
      severity: 'warning'
    });
  }
  
  const priceLimit = getPriceLimitForBookingType(policy, bookingType);
  if (priceLimit && price > priceLimit) {
    violations.push({
      type: 'price_limit',
      message: `Booking price (${price}) exceeds the allowed limit (${priceLimit}) for ${bookingType}`,
      severity: 'error'
    });
  }
  
  if (policy.advance_booking_days > 0) {
    const daysDifference = Math.ceil((travelDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysDifference < policy.advance_booking_days) {
      violations.push({
        type: 'advance_booking',
        message: `Bookings must be made at least ${policy.advance_booking_days} days in advance`,
        severity: 'error'
      });
    }
  }
  
  return violations;
};

const getPriceLimitForBookingType = (policy: CorporateTravelPolicy, bookingType: string): number | null => {
  switch (bookingType) {
    case 'bus': return policy.max_bus_price || null;
    case 'event': return policy.max_event_price || null;
    case 'stay': return policy.max_stay_price_per_night || null;
    case 'workspace': return policy.max_workspace_price_per_hour || null;
    case 'venue': return policy.max_venue_price || null;
    case 'experience': return policy.max_experience_price || null;
    default: return null;
  }
};

export const requiresApproval = (policy: CorporateTravelPolicy, price: number): boolean => {
  if (!policy.approval_required_above) return false;
  return price > policy.approval_required_above;
};

// Corporate Bookings
export const getCorporateBookings = async (accountId: string, filters?: {
  status?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<CorporateBooking[]> => {
  let query = supabase
    .from('corporate_bookings')
    .select('*')
    .eq('corporate_account_id', accountId)
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('approval_status', filters.status);
  if (filters?.employeeId) query = query.eq('employee_id', filters.employeeId);
  if (filters?.startDate) query = query.gte('created_at', filters.startDate);
  if (filters?.endDate) query = query.lte('created_at', filters.endDate);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as CorporateBooking[];
};

export const createCorporateBooking = async (booking: Omit<CorporateBooking, 'id' | 'created_at' | 'updated_at'>): Promise<CorporateBooking> => {
  const { data, error } = await supabase
    .from('corporate_bookings')
    .insert(booking)
    .select()
    .single();
  
  if (error) throw error;
  return data as CorporateBooking;
};

export const approveBooking = async (bookingId: string, approverId: string): Promise<CorporateBooking> => {
  const { data, error } = await supabase
    .from('corporate_bookings')
    .update({ approval_status: 'approved', approved_by: approverId, approved_at: new Date().toISOString() })
    .eq('id', bookingId)
    .select()
    .single();
  
  if (error) throw error;
  return data as CorporateBooking;
};

export const rejectBooking = async (bookingId: string, approverId: string, reason: string): Promise<CorporateBooking> => {
  const { data, error } = await supabase
    .from('corporate_bookings')
    .update({ approval_status: 'rejected', approved_by: approverId, approved_at: new Date().toISOString(), rejection_reason: reason })
    .eq('id', bookingId)
    .select()
    .single();
  
  if (error) throw error;
  return data as CorporateBooking;
};

// Invoicing
export const getInvoices = async (accountId: string): Promise<CorporateInvoice[]> => {
  const { data, error } = await supabase
    .from('corporate_invoices')
    .select('*')
    .eq('corporate_account_id', accountId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as CorporateInvoice[];
};

export const getInvoiceWithItems = async (invoiceId: string) => {
  const { data: invoice, error: invError } = await supabase
    .from('corporate_invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();
  
  if (invError) throw invError;

  const { data: items, error: itemsError } = await supabase
    .from('corporate_invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at');
  
  if (itemsError) throw itemsError;

  return { invoice: invoice as CorporateInvoice, items: (items || []) as CorporateInvoiceItem[] };
};

export const generateInvoice = async (
  accountId: string,
  billingPeriodStart: string,
  billingPeriodEnd: string,
  paymentTermsDays: number = 30
): Promise<CorporateInvoice> => {
  const { data: bookings, error: bookingsError } = await supabase
    .from('corporate_bookings')
    .select(`*, bookings:booking_id (booking_reference, total_price, travel_date, passenger_name)`)
    .eq('corporate_account_id', accountId)
    .eq('invoiced', false)
    .eq('approval_status', 'approved')
    .gte('created_at', billingPeriodStart)
    .lte('created_at', billingPeriodEnd);

  if (bookingsError) throw bookingsError;
  if (!bookings || bookings.length === 0) throw new Error('No approved bookings to invoice');

  const subtotal = bookings.reduce((sum, b: any) => sum + (b.bookings?.total_price || 0), 0);
  const taxAmount = subtotal * 0.15;
  const totalAmount = subtotal + taxAmount;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + paymentTermsDays);

  const { data: invoice, error: invError } = await supabase
    .from('corporate_invoices')
    .insert({
      corporate_account_id: accountId,
      invoice_number: '',
      billing_period_start: billingPeriodStart,
      billing_period_end: billingPeriodEnd,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'draft'
    })
    .select()
    .single();

  if (invError) throw invError;

  const invoiceItems = bookings.map((b: any) => ({
    invoice_id: invoice.id,
    corporate_booking_id: b.id,
    description: `Booking ${b.bookings?.booking_reference || 'N/A'}`,
    quantity: 1,
    unit_price: b.bookings?.total_price || 0,
    total_price: b.bookings?.total_price || 0,
    booking_reference: b.bookings?.booking_reference,
    employee_name: b.bookings?.passenger_name,
    travel_date: b.bookings?.travel_date
  }));

  await supabase.from('corporate_invoice_items').insert(invoiceItems);
  await supabase.from('corporate_bookings').update({ invoiced: true, invoice_id: invoice.id }).in('id', bookings.map(b => b.id));

  return invoice as CorporateInvoice;
};

export const updateInvoiceStatus = async (invoiceId: string, status: CorporateInvoice['status'], paymentReference?: string): Promise<CorporateInvoice> => {
  const updates: any = { status };
  if (status === 'paid') {
    updates.paid_at = new Date().toISOString();
    if (paymentReference) updates.payment_reference = paymentReference;
  }

  const { data, error } = await supabase.from('corporate_invoices').update(updates).eq('id', invoiceId).select().single();
  if (error) throw error;
  return data as CorporateInvoice;
};

// Dashboard Stats
export const getCorporateDashboardStats = async (accountId: string) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

  const [employees, bookings, invoices, pendingApprovals] = await Promise.all([
    supabase.from('corporate_employees').select('id', { count: 'exact' }).eq('corporate_account_id', accountId).eq('is_active', true),
    supabase.from('corporate_bookings').select('id', { count: 'exact' }).eq('corporate_account_id', accountId).gte('created_at', startOfMonth).lte('created_at', endOfMonth),
    supabase.from('corporate_invoices').select('total_amount').eq('corporate_account_id', accountId).eq('status', 'paid').gte('paid_at', startOfMonth),
    supabase.from('corporate_bookings').select('id', { count: 'exact' }).eq('corporate_account_id', accountId).eq('approval_status', 'pending')
  ]);

  return {
    activeEmployees: employees.count || 0,
    monthlyBookings: bookings.count || 0,
    totalSpentThisMonth: invoices.data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
    pendingApprovals: pendingApprovals.count || 0
  };
};
