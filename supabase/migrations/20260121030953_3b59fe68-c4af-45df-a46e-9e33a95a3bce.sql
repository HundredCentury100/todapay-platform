-- Phase 1: Update Credit Pack Pricing (base rate $0.20/credit)
-- Only update price_cents as price_per_credit_cents is a generated column
UPDATE credit_packs SET price_cents = 1000 WHERE name = 'Starter';
UPDATE credit_packs SET price_cents = 1840 WHERE name = 'Basic';
UPDATE credit_packs SET price_cents = 4200 WHERE name = 'Popular';
UPDATE credit_packs SET price_cents = 7600 WHERE name = 'Professional';
UPDATE credit_packs SET price_cents = 14000 WHERE name = 'Business';
UPDATE credit_packs SET price_cents = 32000 WHERE name = 'Enterprise';
UPDATE credit_packs SET price_cents = 56000 WHERE name = 'Ultimate';

-- Phase 2: Add Overdraft Support to credit_wallets
ALTER TABLE credit_wallets 
ADD COLUMN IF NOT EXISTS overdraft_limit INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS overdraft_used INTEGER DEFAULT 0;

-- Phase 3: Create credit_purchase_requests table for EcoCash payments
CREATE TABLE IF NOT EXISTS credit_purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES credit_wallets(id) ON DELETE CASCADE,
  credit_pack_id UUID REFERENCES credit_packs(id),
  amount_usd NUMERIC NOT NULL,
  credits_amount INTEGER NOT NULL,
  payment_method TEXT DEFAULT 'ecocash',
  payment_reference TEXT NOT NULL,
  phone_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on credit_purchase_requests
ALTER TABLE credit_purchase_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for credit_purchase_requests
CREATE POLICY "Users can view their own purchase requests"
ON credit_purchase_requests FOR SELECT
USING (
  wallet_id IN (
    SELECT id FROM credit_wallets 
    WHERE merchant_profile_id IN (
      SELECT id FROM merchant_profiles WHERE user_id = auth.uid()
    )
    OR driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create their own purchase requests"
ON credit_purchase_requests FOR INSERT
WITH CHECK (
  wallet_id IN (
    SELECT id FROM credit_wallets 
    WHERE merchant_profile_id IN (
      SELECT id FROM merchant_profiles WHERE user_id = auth.uid()
    )
    OR driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  )
);

-- Phase 4: Update deduct_booking_credits function with overdraft support
CREATE OR REPLACE FUNCTION deduct_booking_credits(
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
  v_current_balance INTEGER;
  v_overdraft_limit INTEGER;
  v_overdraft_used INTEGER;
  v_credits_to_deduct INTEGER;
  v_new_balance INTEGER;
  v_new_overdraft_used INTEGER;
  v_low_balance_threshold INTEGER;
  v_credit_rate RECORD;
BEGIN
  -- Get credit rate for this booking type
  SELECT * INTO v_credit_rate
  FROM credit_rates
  WHERE booking_type = p_booking_type AND is_active = true
  LIMIT 1;

  -- Default to 2 credits if no rate found
  v_credits_to_deduct := COALESCE(v_credit_rate.default_credits, 2);

  -- Get current wallet info
  SELECT balance, COALESCE(overdraft_limit, 25), COALESCE(overdraft_used, 0), low_balance_threshold 
  INTO v_current_balance, v_overdraft_limit, v_overdraft_used, v_low_balance_threshold
  FROM credit_wallets
  WHERE id = p_wallet_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Wallet not found'
    );
  END IF;

  -- Check if we have enough credits (including overdraft)
  IF (v_current_balance + (v_overdraft_limit - v_overdraft_used)) < v_credits_to_deduct THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits (overdraft limit reached)',
      'required', v_credits_to_deduct,
      'available', v_current_balance,
      'overdraft_available', v_overdraft_limit - v_overdraft_used
    );
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance - v_credits_to_deduct;
  
  -- Calculate overdraft used (if balance goes negative)
  IF v_new_balance < 0 THEN
    v_new_overdraft_used := ABS(v_new_balance);
  ELSE
    v_new_overdraft_used := 0;
  END IF;

  -- Update wallet
  UPDATE credit_wallets
  SET 
    balance = v_new_balance,
    lifetime_credits_used = lifetime_credits_used + v_credits_to_deduct,
    overdraft_used = v_new_overdraft_used,
    updated_at = NOW()
  WHERE id = p_wallet_id;

  -- Record transaction
  INSERT INTO credit_transactions (
    wallet_id,
    transaction_type,
    credits,
    balance_before,
    balance_after,
    booking_id,
    booking_type,
    description
  ) VALUES (
    p_wallet_id,
    'deduction',
    -v_credits_to_deduct,
    v_current_balance,
    v_new_balance,
    p_booking_id,
    p_booking_type,
    'Credit deduction for ' || p_booking_type || ' booking'
  );

  RETURN jsonb_build_object(
    'success', true,
    'credits_deducted', v_credits_to_deduct,
    'new_balance', v_new_balance,
    'overdraft_used', v_new_overdraft_used,
    'low_balance', v_new_balance < COALESCE(v_low_balance_threshold, 10),
    'in_overdraft', v_new_balance < 0
  );
END;
$$;

-- Phase 5: Drop weekly billing tables
DROP TABLE IF EXISTS payment_submissions CASCADE;
DROP TABLE IF EXISTS platform_fee_bills CASCADE;
DROP TABLE IF EXISTS merchant_account_status CASCADE;