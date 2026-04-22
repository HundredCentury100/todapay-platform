-- Security Fix: Add search_path to remaining functions without it
-- This fixes "Function Search Path Mutable" security warnings

-- First drop the trigger that depends on update_profile_completion
DROP TRIGGER IF EXISTS trigger_update_profile_completion ON profiles;

-- Fix calculate_profile_completion function (keep same return type: integer)
DROP FUNCTION IF EXISTS public.calculate_profile_completion(profiles) CASCADE;
CREATE FUNCTION public.calculate_profile_completion(profile_row profiles)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  completion integer := 0;
  total_fields integer := 6;
  filled_fields integer := 0;
BEGIN
  IF profile_row.full_name IS NOT NULL AND profile_row.full_name != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_row.email IS NOT NULL AND profile_row.email != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_row.phone IS NOT NULL AND profile_row.phone != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_row.avatar_url IS NOT NULL AND profile_row.avatar_url != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_row.emergency_contact_name IS NOT NULL AND profile_row.emergency_contact_name != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_row.emergency_contact_phone IS NOT NULL AND profile_row.emergency_contact_phone != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  completion := (filled_fields * 100) / total_fields;
  RETURN completion;
END;
$$;

-- Fix update_profile_completion function (keep same return type: trigger)
DROP FUNCTION IF EXISTS public.update_profile_completion() CASCADE;
CREATE FUNCTION public.update_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.profile_completion := calculate_profile_completion(NEW);
  RETURN NEW;
END;
$$;

-- Recreate the trigger for update_profile_completion
CREATE TRIGGER trigger_update_profile_completion
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_completion();

-- Fix deduct_user_wallet function (keep same return type: user_wallet_transactions)
DROP FUNCTION IF EXISTS public.deduct_user_wallet(uuid, numeric, uuid, text) CASCADE;
CREATE FUNCTION public.deduct_user_wallet(
  p_wallet_id uuid,
  p_amount numeric,
  p_booking_id uuid DEFAULT NULL,
  p_description text DEFAULT 'Payment'::text
)
RETURNS user_wallet_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_balance numeric;
  v_transaction user_wallet_transactions;
BEGIN
  SELECT balance INTO v_wallet_balance FROM user_wallets WHERE id = p_wallet_id FOR UPDATE;
  
  IF v_wallet_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  IF v_wallet_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  INSERT INTO user_wallet_transactions (
    wallet_id,
    transaction_type,
    amount,
    description,
    reference,
    status
  ) VALUES (
    p_wallet_id,
    'debit',
    p_amount,
    p_description,
    p_booking_id::text,
    'completed'
  )
  RETURNING * INTO v_transaction;

  UPDATE user_wallets
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE id = p_wallet_id;

  RETURN v_transaction;
END;
$$;

-- Fix get_or_create_user_wallet function (keep same return type: uuid)
DROP FUNCTION IF EXISTS public.get_or_create_user_wallet(uuid) CASCADE;
CREATE FUNCTION public.get_or_create_user_wallet(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id uuid;
BEGIN
  SELECT id INTO v_wallet_id FROM user_wallets WHERE user_id = p_user_id;
  
  IF v_wallet_id IS NULL THEN
    INSERT INTO user_wallets (user_id, balance)
    VALUES (p_user_id, 0)
    RETURNING id INTO v_wallet_id;
  END IF;
  
  RETURN v_wallet_id;
END;
$$;

-- Fix pay_ride_with_wallet function (keep same return type: jsonb)
DROP FUNCTION IF EXISTS public.pay_ride_with_wallet(uuid, uuid) CASCADE;
CREATE FUNCTION public.pay_ride_with_wallet(p_ride_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ride RECORD;
  v_wallet_id uuid;
  v_wallet_balance numeric;
  v_transaction_id uuid;
BEGIN
  SELECT * INTO v_ride FROM active_rides WHERE id = p_ride_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ride not found');
  END IF;
  
  SELECT id, balance INTO v_wallet_id, v_wallet_balance 
  FROM user_wallets 
  WHERE user_id = p_user_id;
  
  IF v_wallet_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  
  IF v_wallet_balance < COALESCE(v_ride.final_price, 0) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  INSERT INTO user_wallet_transactions (
    wallet_id,
    transaction_type,
    amount,
    description,
    reference,
    status
  ) VALUES (
    v_wallet_id,
    'debit',
    COALESCE(v_ride.final_price, 0),
    'Ride payment',
    p_ride_id::text,
    'completed'
  )
  RETURNING id INTO v_transaction_id;
  
  UPDATE user_wallets
  SET balance = balance - COALESCE(v_ride.final_price, 0),
      updated_at = now()
  WHERE id = v_wallet_id;
  
  UPDATE active_rides
  SET payment_status = 'paid',
      payment_method = 'wallet',
      wallet_transaction_id = v_transaction_id
  WHERE id = p_ride_id;
  
  RETURN jsonb_build_object('success', true, 'transaction_id', v_transaction_id);
END;
$$;

-- Fix topup_user_wallet function (keep same return type: user_wallet_transactions)
DROP FUNCTION IF EXISTS public.topup_user_wallet(uuid, numeric, text, text) CASCADE;
CREATE FUNCTION public.topup_user_wallet(
  p_wallet_id uuid,
  p_amount numeric,
  p_payment_reference text,
  p_description text DEFAULT 'Wallet top-up'::text
)
RETURNS user_wallet_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction user_wallet_transactions;
BEGIN
  INSERT INTO user_wallet_transactions (
    wallet_id,
    transaction_type,
    amount,
    description,
    reference,
    status
  ) VALUES (
    p_wallet_id,
    'credit',
    p_amount,
    p_description,
    p_payment_reference,
    'completed'
  )
  RETURNING * INTO v_transaction;

  UPDATE user_wallets
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE id = p_wallet_id;

  RETURN v_transaction;
END;
$$;