-- Create enum for payment types
CREATE TYPE payment_method_type AS ENUM ('cash', 'bank_transfer', 'mobile_money', 'payment_gateway');

-- Create enum for payment status
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'pending_verification');

-- Create enum for bill payment status
CREATE TYPE bill_payment_status AS ENUM ('pending', 'paid', 'overdue');

-- Create enum for merchant account status
CREATE TYPE account_status AS ENUM ('active', 'suspended', 'warning');

-- Create merchant_payment_methods table
CREATE TABLE public.merchant_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  payment_type payment_method_type NOT NULL,
  is_active BOOLEAN DEFAULT true,
  configuration JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(merchant_profile_id, payment_type)
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  merchant_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  platform_fee_percentage NUMERIC NOT NULL,
  platform_fee_amount NUMERIC NOT NULL,
  merchant_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_proof_url TEXT,
  transaction_reference TEXT UNIQUE,
  payment_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create platform_fee_bills table
CREATE TABLE public.platform_fee_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  total_platform_fees NUMERIC NOT NULL DEFAULT 0,
  payment_status bill_payment_status NOT NULL DEFAULT 'pending',
  due_date TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create merchant_account_status table
CREATE TABLE public.merchant_account_status (
  merchant_profile_id UUID PRIMARY KEY REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  account_status account_status NOT NULL DEFAULT 'active',
  suspension_reason TEXT,
  suspended_at TIMESTAMPTZ,
  suspended_until TIMESTAMPTZ,
  outstanding_balance NUMERIC DEFAULT 0,
  last_payment_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment_proofs', 'payment_proofs', false);

-- RLS policies for merchant_payment_methods
ALTER TABLE public.merchant_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view their own payment methods"
ON public.merchant_payment_methods FOR SELECT
USING (merchant_profile_id IN (
  SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Merchants can insert their own payment methods"
ON public.merchant_payment_methods FOR INSERT
WITH CHECK (merchant_profile_id IN (
  SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Merchants can update their own payment methods"
ON public.merchant_payment_methods FOR UPDATE
USING (merchant_profile_id IN (
  SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Merchants can delete their own payment methods"
ON public.merchant_payment_methods FOR DELETE
USING (merchant_profile_id IN (
  SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
));

-- RLS policies for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
ON public.transactions FOR SELECT
USING (
  booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid())
  OR merchant_profile_id IN (SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "System can create transactions"
ON public.transactions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Merchants can update their transactions"
ON public.transactions FOR UPDATE
USING (merchant_profile_id IN (
  SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
));

-- RLS policies for platform_fee_bills
ALTER TABLE public.platform_fee_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view their own bills"
ON public.platform_fee_bills FOR SELECT
USING (merchant_profile_id IN (
  SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "System can create bills"
ON public.platform_fee_bills FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update bills"
ON public.platform_fee_bills FOR UPDATE
USING (true);

-- RLS policies for merchant_account_status
ALTER TABLE public.merchant_account_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view their own account status"
ON public.merchant_account_status FOR SELECT
USING (merchant_profile_id IN (
  SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "System can insert account status"
ON public.merchant_account_status FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update account status"
ON public.merchant_account_status FOR UPDATE
USING (true);

-- Storage policies for payment_proofs
CREATE POLICY "Users can upload their payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment_proofs' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view their own payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment_proofs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Merchants can view payment proofs for their transactions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment_proofs'
  AND (storage.foldername(name))[1] IN (
    SELECT t.id::text 
    FROM public.transactions t
    JOIN public.merchant_profiles mp ON t.merchant_profile_id = mp.id
    WHERE mp.user_id = auth.uid()
  )
);

-- Trigger to update updated_at on merchant_payment_methods
CREATE TRIGGER update_merchant_payment_methods_updated_at
BEFORE UPDATE ON public.merchant_payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to update updated_at on transactions
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to update updated_at on platform_fee_bills
CREATE TRIGGER update_platform_fee_bills_updated_at
BEFORE UPDATE ON public.platform_fee_bills
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to update updated_at on merchant_account_status
CREATE TRIGGER update_merchant_account_status_updated_at
BEFORE UPDATE ON public.merchant_account_status
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Function to initialize merchant account status
CREATE OR REPLACE FUNCTION public.initialize_merchant_account_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.merchant_account_status (merchant_profile_id)
  VALUES (NEW.id)
  ON CONFLICT (merchant_profile_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to auto-create account status when merchant profile is created
CREATE TRIGGER create_merchant_account_status
AFTER INSERT ON public.merchant_profiles
FOR EACH ROW
EXECUTE FUNCTION public.initialize_merchant_account_status();

-- Create indexes for better performance
CREATE INDEX idx_transactions_booking_id ON public.transactions(booking_id);
CREATE INDEX idx_transactions_merchant_profile_id ON public.transactions(merchant_profile_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX idx_platform_fee_bills_merchant_profile_id ON public.platform_fee_bills(merchant_profile_id);
CREATE INDEX idx_platform_fee_bills_due_date ON public.platform_fee_bills(due_date);
CREATE INDEX idx_platform_fee_bills_payment_status ON public.platform_fee_bills(payment_status);