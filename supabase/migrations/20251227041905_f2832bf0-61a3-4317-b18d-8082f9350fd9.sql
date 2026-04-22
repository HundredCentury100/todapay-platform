-- Corporate accounts table
CREATE TABLE public.corporate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  company_email TEXT NOT NULL UNIQUE,
  company_phone TEXT,
  billing_address TEXT,
  tax_id TEXT,
  logo_url TEXT,
  primary_contact_name TEXT NOT NULL,
  primary_contact_email TEXT NOT NULL,
  primary_contact_phone TEXT,
  account_status TEXT NOT NULL DEFAULT 'pending' CHECK (account_status IN ('pending', 'active', 'suspended', 'inactive')),
  credit_limit NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  payment_terms_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Corporate employees/travelers
CREATE TABLE public.corporate_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID NOT NULL REFERENCES public.corporate_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  employee_email TEXT NOT NULL,
  employee_phone TEXT,
  employee_id_number TEXT,
  department TEXT,
  job_title TEXT,
  travel_tier TEXT DEFAULT 'standard' CHECK (travel_tier IN ('standard', 'executive', 'vip')),
  is_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(corporate_account_id, employee_email)
);

-- Corporate travel policies
CREATE TABLE public.corporate_travel_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID NOT NULL REFERENCES public.corporate_accounts(id) ON DELETE CASCADE,
  policy_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  -- Budget limits
  max_bus_price NUMERIC,
  max_event_price NUMERIC,
  max_stay_price_per_night NUMERIC,
  max_workspace_price_per_hour NUMERIC,
  max_venue_price NUMERIC,
  max_experience_price NUMERIC,
  -- Approval thresholds
  approval_required_above NUMERIC,
  -- Allowed options
  allowed_bus_tiers TEXT[] DEFAULT ARRAY['budget', 'standard', 'premium'],
  allowed_stay_ratings INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5],
  allowed_booking_types TEXT[] DEFAULT ARRAY['bus', 'event', 'stay', 'workspace', 'venue', 'experience'],
  -- Time restrictions
  advance_booking_days INTEGER DEFAULT 0,
  max_trip_duration_days INTEGER,
  -- Other settings
  require_purpose BOOLEAN DEFAULT true,
  require_project_code BOOLEAN DEFAULT false,
  apply_to_tiers TEXT[] DEFAULT ARRAY['standard', 'executive', 'vip'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Corporate bookings tracking
CREATE TABLE public.corporate_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID NOT NULL REFERENCES public.corporate_accounts(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.corporate_employees(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES public.corporate_travel_policies(id) ON DELETE SET NULL,
  travel_purpose TEXT,
  project_code TEXT,
  cost_center TEXT,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
  approved_by UUID REFERENCES public.corporate_employees(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  policy_violations TEXT[],
  invoiced BOOLEAN DEFAULT false,
  invoice_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Corporate invoices
CREATE TABLE public.corporate_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID NOT NULL REFERENCES public.corporate_accounts(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'ZAR',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoice line items
CREATE TABLE public.corporate_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.corporate_invoices(id) ON DELETE CASCADE,
  corporate_booking_id UUID REFERENCES public.corporate_bookings(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  booking_reference TEXT,
  employee_name TEXT,
  travel_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.corporate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_travel_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for corporate_accounts
CREATE POLICY "Admins can manage all corporate accounts"
ON public.corporate_accounts FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Corporate admins can view their account"
ON public.corporate_accounts FOR SELECT
USING (id IN (
  SELECT corporate_account_id FROM public.corporate_employees 
  WHERE user_id = auth.uid() AND is_admin = true
));

CREATE POLICY "Corporate admins can update their account"
ON public.corporate_accounts FOR UPDATE
USING (id IN (
  SELECT corporate_account_id FROM public.corporate_employees 
  WHERE user_id = auth.uid() AND is_admin = true
));

-- RLS Policies for corporate_employees
CREATE POLICY "Corporate admins can manage employees"
ON public.corporate_employees FOR ALL
USING (corporate_account_id IN (
  SELECT corporate_account_id FROM public.corporate_employees 
  WHERE user_id = auth.uid() AND is_admin = true
));

CREATE POLICY "Employees can view their own record"
ON public.corporate_employees FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all employees"
ON public.corporate_employees FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for corporate_travel_policies
CREATE POLICY "Corporate admins can manage policies"
ON public.corporate_travel_policies FOR ALL
USING (corporate_account_id IN (
  SELECT corporate_account_id FROM public.corporate_employees 
  WHERE user_id = auth.uid() AND is_admin = true
));

CREATE POLICY "Employees can view their company policies"
ON public.corporate_travel_policies FOR SELECT
USING (corporate_account_id IN (
  SELECT corporate_account_id FROM public.corporate_employees 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage all policies"
ON public.corporate_travel_policies FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for corporate_bookings
CREATE POLICY "Employees can view their bookings"
ON public.corporate_bookings FOR SELECT
USING (employee_id IN (
  SELECT id FROM public.corporate_employees WHERE user_id = auth.uid()
));

CREATE POLICY "Employees can create bookings"
ON public.corporate_bookings FOR INSERT
WITH CHECK (employee_id IN (
  SELECT id FROM public.corporate_employees WHERE user_id = auth.uid()
));

CREATE POLICY "Corporate admins can manage all bookings"
ON public.corporate_bookings FOR ALL
USING (corporate_account_id IN (
  SELECT corporate_account_id FROM public.corporate_employees 
  WHERE user_id = auth.uid() AND is_admin = true
));

CREATE POLICY "Admins can manage all corporate bookings"
ON public.corporate_bookings FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for corporate_invoices
CREATE POLICY "Corporate admins can view invoices"
ON public.corporate_invoices FOR SELECT
USING (corporate_account_id IN (
  SELECT corporate_account_id FROM public.corporate_employees 
  WHERE user_id = auth.uid() AND is_admin = true
));

CREATE POLICY "Admins can manage all invoices"
ON public.corporate_invoices FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for corporate_invoice_items
CREATE POLICY "Corporate admins can view invoice items"
ON public.corporate_invoice_items FOR SELECT
USING (invoice_id IN (
  SELECT id FROM public.corporate_invoices WHERE corporate_account_id IN (
    SELECT corporate_account_id FROM public.corporate_employees 
    WHERE user_id = auth.uid() AND is_admin = true
  )
));

CREATE POLICY "Admins can manage all invoice items"
ON public.corporate_invoice_items FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add updated_at triggers
CREATE TRIGGER update_corporate_accounts_updated_at
  BEFORE UPDATE ON public.corporate_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_corporate_employees_updated_at
  BEFORE UPDATE ON public.corporate_employees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_corporate_policies_updated_at
  BEFORE UPDATE ON public.corporate_travel_policies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_corporate_bookings_updated_at
  BEFORE UPDATE ON public.corporate_bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_corporate_invoices_updated_at
  BEFORE UPDATE ON public.corporate_invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(
    (SELECT COALESCE(MAX(CAST(SPLIT_PART(invoice_number, '-', 3) AS INTEGER)), 0) + 1 
     FROM public.corporate_invoices 
     WHERE invoice_number LIKE 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-%')::TEXT, 
    4, '0'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON public.corporate_invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION public.generate_invoice_number();