
-- Function to check if a driver can go online (wallet balance >= $5)
CREATE OR REPLACE FUNCTION public.check_driver_can_go_online(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet_balance numeric;
  v_wallet_id uuid;
BEGIN
  SELECT id, balance INTO v_wallet_id, v_wallet_balance
  FROM user_wallets
  WHERE user_id = p_user_id;

  IF v_wallet_id IS NULL THEN
    -- Create wallet if it doesn't exist
    INSERT INTO user_wallets (user_id, balance)
    VALUES (p_user_id, 0)
    RETURNING id, balance INTO v_wallet_id, v_wallet_balance;
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_wallet_balance >= 5,
    'balance', v_wallet_balance,
    'wallet_id', v_wallet_id
  );
END;
$function$;

-- Function to deduct driver commission from wallet (allows overdraft to -$5)
CREATE OR REPLACE FUNCTION public.deduct_driver_commission(
  p_wallet_id uuid,
  p_amount numeric,
  p_reference text,
  p_description text DEFAULT 'Platform commission'
)
RETURNS user_wallet_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet_balance numeric;
  v_transaction user_wallet_transactions;
  v_overdraft_limit numeric := -5;
BEGIN
  SELECT balance INTO v_wallet_balance
  FROM user_wallets
  WHERE id = p_wallet_id
  FOR UPDATE;

  IF v_wallet_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  -- Allow overdraft down to -$5
  IF (v_wallet_balance - p_amount) < v_overdraft_limit THEN
    RAISE EXCEPTION 'Commission deduction would exceed overdraft limit';
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
    p_reference,
    'completed'
  )
  RETURNING * INTO v_transaction;

  UPDATE user_wallets
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE id = p_wallet_id;

  RETURN v_transaction;
END;
$function$;
