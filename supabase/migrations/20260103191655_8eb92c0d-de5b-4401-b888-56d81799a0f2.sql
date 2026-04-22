-- =============================================
-- PHASE 1: Enhanced Profile & Wallet System
-- =============================================

-- 1.1 Enhance profiles table for consumers
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address jsonb DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contacts jsonb DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS loyalty_tier text DEFAULT 'bronze';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS loyalty_points integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completion_percentage integer DEFAULT 0;

-- 1.2 Create user_wallets table for consumer wallet
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance numeric(10,2) DEFAULT 0,
  currency text DEFAULT 'ZAR',
  lifetime_earned numeric(10,2) DEFAULT 0,
  lifetime_spent numeric(10,2) DEFAULT 0,
  rewards_points integer DEFAULT 0,
  auto_topup_enabled boolean DEFAULT false,
  auto_topup_amount numeric(10,2),
  auto_topup_threshold numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_wallets
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_wallets
CREATE POLICY "Users can view their own wallet"
  ON public.user_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
  ON public.user_wallets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallets"
  ON public.user_wallets FOR INSERT
  WITH CHECK (true);

-- 1.3 Create user_wallet_transactions table
CREATE TABLE IF NOT EXISTS public.user_wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES public.user_wallets(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL, -- 'topup', 'payment', 'refund', 'reward', 'transfer'
  amount numeric(10,2) NOT NULL,
  balance_before numeric(10,2) NOT NULL,
  balance_after numeric(10,2) NOT NULL,
  description text,
  booking_id uuid REFERENCES public.bookings(id),
  payment_reference text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on user_wallet_transactions
ALTER TABLE public.user_wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_wallet_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.user_wallet_transactions FOR SELECT
  USING (wallet_id IN (SELECT id FROM public.user_wallets WHERE user_id = auth.uid()));

CREATE POLICY "System can insert transactions"
  ON public.user_wallet_transactions FOR INSERT
  WITH CHECK (true);

-- 1.4 Add wallet_id to drivers table if not exists
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS wallet_id uuid REFERENCES public.credit_wallets(id);

-- 1.5 Create function to calculate profile completion
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(profile_row public.profiles)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  completion integer := 0;
  total_fields integer := 10;
  filled_fields integer := 0;
BEGIN
  IF profile_row.full_name IS NOT NULL AND profile_row.full_name != '' THEN filled_fields := filled_fields + 1; END IF;
  IF profile_row.phone IS NOT NULL AND profile_row.phone != '' THEN filled_fields := filled_fields + 1; END IF;
  IF profile_row.avatar_url IS NOT NULL AND profile_row.avatar_url != '' THEN filled_fields := filled_fields + 1; END IF;
  IF profile_row.passport_number IS NOT NULL AND profile_row.passport_number != '' THEN filled_fields := filled_fields + 1; END IF;
  IF profile_row.nationality IS NOT NULL AND profile_row.nationality != '' THEN filled_fields := filled_fields + 1; END IF;
  IF profile_row.date_of_birth IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF profile_row.address IS NOT NULL AND profile_row.address != '{}'::jsonb THEN filled_fields := filled_fields + 1; END IF;
  IF profile_row.whatsapp_number IS NOT NULL AND profile_row.whatsapp_number != '' THEN filled_fields := filled_fields + 1; END IF;
  IF profile_row.next_of_kin_number IS NOT NULL AND profile_row.next_of_kin_number != '' THEN filled_fields := filled_fields + 1; END IF;
  IF profile_row.emergency_contacts IS NOT NULL AND jsonb_array_length(profile_row.emergency_contacts) > 0 THEN filled_fields := filled_fields + 1; END IF;
  
  completion := (filled_fields * 100) / total_fields;
  RETURN completion;
END;
$$;

-- 1.6 Create trigger to update profile completion on changes
CREATE OR REPLACE FUNCTION public.update_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.profile_completion_percentage := public.calculate_profile_completion(NEW);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_profile_completion ON public.profiles;
CREATE TRIGGER trigger_update_profile_completion
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_completion();

-- 1.7 Create function to get or create user wallet
CREATE OR REPLACE FUNCTION public.get_or_create_user_wallet(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id uuid;
BEGIN
  SELECT id INTO v_wallet_id FROM public.user_wallets WHERE user_id = p_user_id;
  
  IF v_wallet_id IS NULL THEN
    INSERT INTO public.user_wallets (user_id)
    VALUES (p_user_id)
    RETURNING id INTO v_wallet_id;
  END IF;
  
  RETURN v_wallet_id;
END;
$$;

-- 1.8 Create function to add funds to user wallet
CREATE OR REPLACE FUNCTION public.topup_user_wallet(
  p_wallet_id uuid,
  p_amount numeric,
  p_payment_reference text,
  p_description text DEFAULT 'Wallet top-up'
)
RETURNS public.user_wallet_transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet public.user_wallets;
  v_transaction public.user_wallet_transactions;
BEGIN
  -- Get current wallet
  SELECT * INTO v_wallet FROM public.user_wallets WHERE id = p_wallet_id FOR UPDATE;
  
  IF v_wallet IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  -- Update wallet balance
  UPDATE public.user_wallets
  SET 
    balance = balance + p_amount,
    lifetime_earned = lifetime_earned + p_amount,
    updated_at = now()
  WHERE id = p_wallet_id;
  
  -- Create transaction record
  INSERT INTO public.user_wallet_transactions (
    wallet_id, transaction_type, amount, balance_before, balance_after,
    description, payment_reference
  ) VALUES (
    p_wallet_id, 'topup', p_amount, v_wallet.balance, v_wallet.balance + p_amount,
    p_description, p_payment_reference
  ) RETURNING * INTO v_transaction;
  
  RETURN v_transaction;
END;
$$;

-- 1.9 Create function to deduct from user wallet
CREATE OR REPLACE FUNCTION public.deduct_user_wallet(
  p_wallet_id uuid,
  p_amount numeric,
  p_booking_id uuid DEFAULT NULL,
  p_description text DEFAULT 'Payment'
)
RETURNS public.user_wallet_transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet public.user_wallets;
  v_transaction public.user_wallet_transactions;
BEGIN
  -- Get current wallet
  SELECT * INTO v_wallet FROM public.user_wallets WHERE id = p_wallet_id FOR UPDATE;
  
  IF v_wallet IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  IF v_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Update wallet balance
  UPDATE public.user_wallets
  SET 
    balance = balance - p_amount,
    lifetime_spent = lifetime_spent + p_amount,
    updated_at = now()
  WHERE id = p_wallet_id;
  
  -- Create transaction record
  INSERT INTO public.user_wallet_transactions (
    wallet_id, transaction_type, amount, balance_before, balance_after,
    description, booking_id
  ) VALUES (
    p_wallet_id, 'payment', -p_amount, v_wallet.balance, v_wallet.balance - p_amount,
    p_description, p_booking_id
  ) RETURNING * INTO v_transaction;
  
  RETURN v_transaction;
END;
$$;