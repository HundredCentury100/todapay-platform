-- Money requests table
CREATE TABLE public.money_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payer_account_number TEXT NOT NULL,
  payer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'declined', 'cancelled', 'expired')),
  paid_transaction_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_money_requests_requester ON public.money_requests(requester_id);
CREATE INDEX idx_money_requests_payer_account ON public.money_requests(payer_account_number);
CREATE INDEX idx_money_requests_payer_user ON public.money_requests(payer_user_id);
CREATE INDEX idx_money_requests_status ON public.money_requests(status);

ALTER TABLE public.money_requests ENABLE ROW LEVEL SECURITY;

-- Requester can view their own requests
CREATE POLICY "Requesters can view own requests"
ON public.money_requests FOR SELECT
USING (auth.uid() = requester_id);

-- Payer can view requests addressed to them
CREATE POLICY "Payers can view requests to them"
ON public.money_requests FOR SELECT
USING (
  payer_user_id = auth.uid()
  OR payer_account_number IN (
    SELECT account_number FROM public.profiles WHERE id = auth.uid()
  )
);

-- Requester can create requests
CREATE POLICY "Requesters can create requests"
ON public.money_requests FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Requester can cancel/update own requests
CREATE POLICY "Requesters can update own requests"
ON public.money_requests FOR UPDATE
USING (auth.uid() = requester_id);

-- Payer can update status (pay / decline)
CREATE POLICY "Payers can update request status"
ON public.money_requests FOR UPDATE
USING (
  payer_user_id = auth.uid()
  OR payer_account_number IN (
    SELECT account_number FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE TRIGGER update_money_requests_updated_at
BEFORE UPDATE ON public.money_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Remittance orders table
CREATE TABLE public.remittance_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inward', 'outward')),
  recipient_name TEXT NOT NULL,
  recipient_country TEXT NOT NULL,
  recipient_method TEXT NOT NULL CHECK (recipient_method IN ('bank', 'mobile_wallet', 'cash_pickup', 'wallet')),
  recipient_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  send_amount NUMERIC(12,2) NOT NULL CHECK (send_amount > 0),
  send_currency TEXT NOT NULL DEFAULT 'USD',
  receive_amount NUMERIC(12,2) NOT NULL,
  receive_currency TEXT NOT NULL,
  fx_rate NUMERIC(14,6) NOT NULL DEFAULT 1,
  fee_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  reference_code TEXT NOT NULL UNIQUE,
  payment_method TEXT,
  payment_reference TEXT,
  notes TEXT,
  expected_delivery_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_remittance_orders_user ON public.remittance_orders(user_id);
CREATE INDEX idx_remittance_orders_status ON public.remittance_orders(status);
CREATE INDEX idx_remittance_orders_reference ON public.remittance_orders(reference_code);

ALTER TABLE public.remittance_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own remittance orders"
ON public.remittance_orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own remittance orders"
ON public.remittance_orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own remittance orders"
ON public.remittance_orders FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_remittance_orders_updated_at
BEFORE UPDATE ON public.remittance_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function to generate remittance reference codes
CREATE OR REPLACE FUNCTION public.generate_remittance_reference()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'RMT-';
  i INTEGER;
BEGIN
  result := result || TO_CHAR(NOW(), 'YYMMDD') || '-';
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;