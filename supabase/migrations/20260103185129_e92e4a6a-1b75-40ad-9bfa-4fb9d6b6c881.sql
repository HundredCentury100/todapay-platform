
-- Credit packs available for purchase (with volume discounts)
CREATE TABLE public.credit_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  price_per_credit_cents NUMERIC GENERATED ALWAYS AS (price_cents::numeric / credits) STORED,
  discount_percentage NUMERIC DEFAULT 0,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Merchant/Driver credit wallets
CREATE TABLE public.credit_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_profile_id UUID REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  lifetime_credits_purchased INTEGER NOT NULL DEFAULT 0,
  lifetime_credits_used INTEGER NOT NULL DEFAULT 0,
  low_balance_threshold INTEGER DEFAULT 10,
  auto_topup_enabled BOOLEAN DEFAULT false,
  auto_topup_pack_id UUID REFERENCES public.credit_packs(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT wallet_owner_check CHECK (
    (merchant_profile_id IS NOT NULL AND driver_id IS NULL) OR
    (merchant_profile_id IS NULL AND driver_id IS NOT NULL)
  )
);

-- Credit transaction history
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.credit_wallets(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'deduction', 'refund', 'bonus', 'adjustment')),
  credits INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  booking_id UUID REFERENCES public.bookings(id),
  booking_type TEXT,
  credit_pack_id UUID REFERENCES public.credit_packs(id),
  payment_reference TEXT,
  stripe_payment_intent_id TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Credit consumption rates by booking type
CREATE TABLE public.credit_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_type TEXT NOT NULL UNIQUE,
  min_credits INTEGER NOT NULL,
  max_credits INTEGER NOT NULL,
  default_credits INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_rates ENABLE ROW LEVEL SECURITY;

-- Credit packs policies (public read for pricing)
CREATE POLICY "Anyone can view active credit packs" ON public.credit_packs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage credit packs" ON public.credit_packs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Credit wallets policies
CREATE POLICY "Users can view their own wallet" ON public.credit_wallets
  FOR SELECT USING (
    merchant_profile_id IN (SELECT id FROM merchant_profiles WHERE user_id = auth.uid())
    OR driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own wallet settings" ON public.credit_wallets
  FOR UPDATE USING (
    merchant_profile_id IN (SELECT id FROM merchant_profiles WHERE user_id = auth.uid())
    OR driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
  );

CREATE POLICY "System can manage wallets" ON public.credit_wallets
  FOR ALL USING (true) WITH CHECK (true);

-- Credit transactions policies
CREATE POLICY "Users can view their own transactions" ON public.credit_transactions
  FOR SELECT USING (
    wallet_id IN (
      SELECT id FROM credit_wallets WHERE 
        merchant_profile_id IN (SELECT id FROM merchant_profiles WHERE user_id = auth.uid())
        OR driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "System can insert transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (true);

-- Credit rates policies
CREATE POLICY "Anyone can view credit rates" ON public.credit_rates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage credit rates" ON public.credit_rates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default credit packs with volume discounts
INSERT INTO public.credit_packs (name, credits, price_cents, discount_percentage, is_popular) VALUES
  ('Starter', 50, 1250, 0, false),
  ('Basic', 100, 2300, 8, false),
  ('Popular', 250, 5250, 16, true),
  ('Professional', 500, 9500, 24, false),
  ('Business', 1000, 17500, 30, false),
  ('Enterprise', 2500, 40000, 36, false),
  ('Ultimate', 5000, 70000, 44, false);

-- Insert default credit rates by booking type
INSERT INTO public.credit_rates (booking_type, min_credits, max_credits, default_credits, description) VALUES
  ('ride', 1, 2, 1, 'Taxi/ride bookings'),
  ('bus', 1, 2, 2, 'Bus ticket bookings'),
  ('event', 2, 3, 2, 'Event ticket bookings'),
  ('stay', 3, 5, 4, 'Accommodation bookings'),
  ('workspace', 2, 4, 3, 'Workspace bookings'),
  ('venue', 5, 10, 7, 'Venue hire bookings'),
  ('experience', 2, 4, 3, 'Experience bookings'),
  ('transfer', 1, 3, 2, 'Transfer service bookings'),
  ('car_rental', 3, 5, 4, 'Car rental bookings');

-- Function to get or create wallet
CREATE OR REPLACE FUNCTION public.get_or_create_wallet(
  p_merchant_profile_id UUID DEFAULT NULL,
  p_driver_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
BEGIN
  -- Check for existing wallet
  SELECT id INTO v_wallet_id FROM credit_wallets
  WHERE (p_merchant_profile_id IS NOT NULL AND merchant_profile_id = p_merchant_profile_id)
     OR (p_driver_id IS NOT NULL AND driver_id = p_driver_id);
  
  -- Create if not exists
  IF v_wallet_id IS NULL THEN
    INSERT INTO credit_wallets (merchant_profile_id, driver_id)
    VALUES (p_merchant_profile_id, p_driver_id)
    RETURNING id INTO v_wallet_id;
  END IF;
  
  RETURN v_wallet_id;
END;
$$;

-- Function to deduct credits for a booking
CREATE OR REPLACE FUNCTION public.deduct_booking_credits(
  p_wallet_id UUID,
  p_booking_id UUID,
  p_booking_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits_to_deduct INTEGER;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_rate RECORD;
BEGIN
  -- Get credit rate for booking type
  SELECT * INTO v_rate FROM credit_rates WHERE booking_type = p_booking_type AND is_active = true;
  
  IF v_rate IS NULL THEN
    v_credits_to_deduct := 2; -- Default fallback
  ELSE
    v_credits_to_deduct := v_rate.default_credits;
  END IF;
  
  -- Get current balance with lock
  SELECT balance INTO v_current_balance FROM credit_wallets WHERE id = p_wallet_id FOR UPDATE;
  
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  
  IF v_current_balance < v_credits_to_deduct THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits', 'required', v_credits_to_deduct, 'available', v_current_balance);
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_current_balance - v_credits_to_deduct;
  
  -- Update wallet balance
  UPDATE credit_wallets 
  SET balance = v_new_balance,
      lifetime_credits_used = lifetime_credits_used + v_credits_to_deduct,
      updated_at = now()
  WHERE id = p_wallet_id;
  
  -- Record transaction
  INSERT INTO credit_transactions (
    wallet_id, transaction_type, credits, balance_before, balance_after,
    booking_id, booking_type, description
  ) VALUES (
    p_wallet_id, 'deduction', -v_credits_to_deduct, v_current_balance, v_new_balance,
    p_booking_id, p_booking_type, 'Booking credit deduction for ' || p_booking_type
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'credits_deducted', v_credits_to_deduct, 
    'new_balance', v_new_balance,
    'low_balance', v_new_balance < 10
  );
END;
$$;

-- Function to add credits after purchase
CREATE OR REPLACE FUNCTION public.add_purchased_credits(
  p_wallet_id UUID,
  p_credit_pack_id UUID,
  p_payment_reference TEXT,
  p_stripe_payment_intent_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits INTEGER;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_pack_name TEXT;
BEGIN
  -- Get credit pack details
  SELECT credits, name INTO v_credits, v_pack_name FROM credit_packs WHERE id = p_credit_pack_id AND is_active = true;
  
  IF v_credits IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid credit pack');
  END IF;
  
  -- Get current balance with lock
  SELECT balance INTO v_current_balance FROM credit_wallets WHERE id = p_wallet_id FOR UPDATE;
  
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_current_balance + v_credits;
  
  -- Update wallet balance
  UPDATE credit_wallets 
  SET balance = v_new_balance,
      lifetime_credits_purchased = lifetime_credits_purchased + v_credits,
      updated_at = now()
  WHERE id = p_wallet_id;
  
  -- Record transaction
  INSERT INTO credit_transactions (
    wallet_id, transaction_type, credits, balance_before, balance_after,
    credit_pack_id, payment_reference, stripe_payment_intent_id, description
  ) VALUES (
    p_wallet_id, 'purchase', v_credits, v_current_balance, v_new_balance,
    p_credit_pack_id, p_payment_reference, p_stripe_payment_intent_id, 
    'Purchased ' || v_pack_name || ' credit pack'
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'credits_added', v_credits, 
    'new_balance', v_new_balance
  );
END;
$$;
