
-- Fix topup_user_wallet to use correct column names
CREATE OR REPLACE FUNCTION public.topup_user_wallet(p_wallet_id uuid, p_amount numeric, p_payment_reference text, p_description text DEFAULT 'Wallet top-up'::text)
 RETURNS user_wallet_transactions
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_balance_before numeric;
  v_transaction user_wallet_transactions;
BEGIN
  SELECT balance INTO v_balance_before FROM user_wallets WHERE id = p_wallet_id FOR UPDATE;
  
  IF v_balance_before IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  INSERT INTO user_wallet_transactions (
    wallet_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    description,
    payment_reference
  ) VALUES (
    p_wallet_id,
    'topup',
    p_amount,
    v_balance_before,
    v_balance_before + p_amount,
    p_description,
    p_payment_reference
  )
  RETURNING * INTO v_transaction;

  UPDATE user_wallets
  SET balance = balance + p_amount,
      lifetime_earned = lifetime_earned + p_amount,
      updated_at = now()
  WHERE id = p_wallet_id;

  RETURN v_transaction;
END;
$function$;

-- Fix deduct_user_wallet to use correct column names
CREATE OR REPLACE FUNCTION public.deduct_user_wallet(p_wallet_id uuid, p_amount numeric, p_booking_id uuid DEFAULT NULL::uuid, p_description text DEFAULT 'Payment'::text)
 RETURNS user_wallet_transactions
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    balance_before,
    balance_after,
    description,
    booking_id,
    payment_reference
  ) VALUES (
    p_wallet_id,
    'payment',
    p_amount,
    v_wallet_balance,
    v_wallet_balance - p_amount,
    p_description,
    p_booking_id,
    'WLT-' || gen_random_uuid()::text
  )
  RETURNING * INTO v_transaction;

  UPDATE user_wallets
  SET balance = balance - p_amount,
      lifetime_spent = lifetime_spent + p_amount,
      updated_at = now()
  WHERE id = p_wallet_id;

  RETURN v_transaction;
END;
$function$;

-- Fix deduct_driver_commission to use correct column names
CREATE OR REPLACE FUNCTION public.deduct_driver_commission(p_wallet_id uuid, p_amount numeric, p_reference text, p_description text DEFAULT 'Platform commission'::text)
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

  IF (v_wallet_balance - p_amount) < v_overdraft_limit THEN
    RAISE EXCEPTION 'Commission deduction would exceed overdraft limit';
  END IF;

  INSERT INTO user_wallet_transactions (
    wallet_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    description,
    payment_reference
  ) VALUES (
    p_wallet_id,
    'payment',
    p_amount,
    v_wallet_balance,
    v_wallet_balance - p_amount,
    p_description,
    p_reference
  )
  RETURNING * INTO v_transaction;

  UPDATE user_wallets
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE id = p_wallet_id;

  RETURN v_transaction;
END;
$function$;

-- Fix transfer_between_wallets to use correct column names
CREATE OR REPLACE FUNCTION public.transfer_between_wallets(p_sender_wallet_id uuid, p_recipient_account_number text, p_amount numeric, p_description text DEFAULT 'Wallet transfer'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sender_balance numeric;
  v_recipient_user_id uuid;
  v_recipient_wallet_id uuid;
  v_recipient_name text;
  v_sender_user_id uuid;
  v_sender_name text;
  v_debit_txn_id uuid;
  v_credit_txn_id uuid;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  SELECT id, full_name INTO v_recipient_user_id, v_recipient_name
  FROM profiles WHERE account_number = p_recipient_account_number;

  IF v_recipient_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recipient account not found');
  END IF;

  SELECT id INTO v_recipient_wallet_id FROM user_wallets WHERE user_id = v_recipient_user_id;
  IF v_recipient_wallet_id IS NULL THEN
    INSERT INTO user_wallets (user_id, balance) VALUES (v_recipient_user_id, 0) RETURNING id INTO v_recipient_wallet_id;
  END IF;

  SELECT user_id INTO v_sender_user_id FROM user_wallets WHERE id = p_sender_wallet_id;
  IF v_sender_user_id = v_recipient_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot transfer to yourself');
  END IF;

  SELECT full_name INTO v_sender_name FROM profiles WHERE id = v_sender_user_id;

  SELECT balance INTO v_sender_balance FROM user_wallets WHERE id = p_sender_wallet_id FOR UPDATE;
  IF v_sender_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sender wallet not found');
  END IF;
  IF v_sender_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  PERFORM id FROM user_wallets WHERE id = v_recipient_wallet_id FOR UPDATE;

  -- Debit sender
  INSERT INTO user_wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, description, payment_reference)
  VALUES (p_sender_wallet_id, 'transfer', p_amount, v_sender_balance, v_sender_balance - p_amount,
    'Transfer to ' || COALESCE(v_recipient_name, p_recipient_account_number), v_recipient_wallet_id::text)
  RETURNING id INTO v_debit_txn_id;

  UPDATE user_wallets SET balance = balance - p_amount, lifetime_spent = lifetime_spent + p_amount, updated_at = now() WHERE id = p_sender_wallet_id;

  -- Credit recipient
  DECLARE v_recipient_balance numeric;
  BEGIN
    SELECT balance INTO v_recipient_balance FROM user_wallets WHERE id = v_recipient_wallet_id;

    INSERT INTO user_wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, description, payment_reference)
    VALUES (v_recipient_wallet_id, 'topup', p_amount, v_recipient_balance, v_recipient_balance + p_amount,
      'Transfer from ' || COALESCE(v_sender_name, 'Unknown'), p_sender_wallet_id::text)
    RETURNING id INTO v_credit_txn_id;
  END;

  UPDATE user_wallets SET balance = balance + p_amount, lifetime_earned = lifetime_earned + p_amount, updated_at = now() WHERE id = v_recipient_wallet_id;

  -- Notifications
  INSERT INTO user_notifications (user_id, title, message, type, category, metadata)
  VALUES (
    v_sender_user_id,
    'Money Sent 💸',
    'You sent $' || p_amount || ' to ' || COALESCE(v_recipient_name, p_recipient_account_number),
    'wallet', 'payment',
    jsonb_build_object('type', 'wallet_transfer_sent', 'amount', p_amount, 'recipient', p_recipient_account_number, 'transaction_id', v_debit_txn_id)
  );

  INSERT INTO user_notifications (user_id, title, message, type, category, metadata)
  VALUES (
    v_recipient_user_id,
    'Money Received 💰',
    'You received $' || p_amount || ' from ' || COALESCE(v_sender_name, 'Someone'),
    'wallet', 'payment',
    jsonb_build_object('type', 'wallet_transfer_received', 'amount', p_amount, 'sender', v_sender_user_id, 'transaction_id', v_credit_txn_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'debit_transaction_id', v_debit_txn_id,
    'credit_transaction_id', v_credit_txn_id,
    'recipient_name', v_recipient_name,
    'amount', p_amount
  );
END;
$function$;

-- Fix pay_ride_with_wallet to use correct column names
CREATE OR REPLACE FUNCTION public.pay_ride_with_wallet(p_ride_id uuid, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_ride RECORD;
  v_wallet_id uuid;
  v_wallet_balance numeric;
  v_transaction_id uuid;
  v_amount numeric;
BEGIN
  SELECT * INTO v_ride FROM active_rides WHERE id = p_ride_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ride not found');
  END IF;
  
  v_amount := COALESCE(v_ride.final_price, 0);
  
  SELECT id, balance INTO v_wallet_id, v_wallet_balance 
  FROM user_wallets 
  WHERE user_id = p_user_id;
  
  IF v_wallet_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  
  IF v_wallet_balance < v_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  INSERT INTO user_wallet_transactions (
    wallet_id, transaction_type, amount, balance_before, balance_after,
    description, payment_reference
  ) VALUES (
    v_wallet_id, 'payment', v_amount, v_wallet_balance, v_wallet_balance - v_amount,
    'Ride payment', p_ride_id::text
  )
  RETURNING id INTO v_transaction_id;
  
  UPDATE user_wallets
  SET balance = balance - v_amount, updated_at = now()
  WHERE id = v_wallet_id;
  
  UPDATE active_rides
  SET payment_status = 'paid',
      payment_method = 'wallet',
      wallet_transaction_id = v_transaction_id
  WHERE id = p_ride_id;
  
  RETURN jsonb_build_object('success', true, 'transaction_id', v_transaction_id);
END;
$function$;

-- Fix redeem_gift_card_to_wallet to use correct column names
CREATE OR REPLACE FUNCTION public.redeem_gift_card_to_wallet(p_code text, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_card RECORD;
  v_wallet_id UUID;
  v_wallet_balance numeric;
  v_amount NUMERIC;
  v_transaction_id UUID;
BEGIN
  SELECT * INTO v_card FROM gift_cards WHERE code = p_code FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gift card not found');
  END IF;
  
  IF v_card.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gift card is ' || v_card.status);
  END IF;
  
  IF v_card.expires_at IS NOT NULL AND v_card.expires_at < now() THEN
    UPDATE gift_cards SET status = 'expired' WHERE id = v_card.id;
    RETURN jsonb_build_object('success', false, 'error', 'Gift card has expired');
  END IF;
  
  IF v_card.remaining_balance <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gift card has no balance');
  END IF;
  
  v_amount := v_card.remaining_balance;
  
  SELECT id, balance INTO v_wallet_id, v_wallet_balance FROM user_wallets WHERE user_id = p_user_id;
  IF v_wallet_id IS NULL THEN
    INSERT INTO user_wallets (user_id, balance) VALUES (p_user_id, 0)
    RETURNING id, 0 INTO v_wallet_id, v_wallet_balance;
  END IF;
  
  UPDATE user_wallets
  SET balance = balance + v_amount,
      lifetime_earned = lifetime_earned + v_amount,
      updated_at = now()
  WHERE id = v_wallet_id;
  
  INSERT INTO user_wallet_transactions (
    wallet_id, transaction_type, amount, balance_before, balance_after,
    description, payment_reference
  ) VALUES (
    v_wallet_id, 'reward', v_amount, v_wallet_balance, v_wallet_balance + v_amount,
    'Gift card redeemed: ' || p_code, v_card.id::text
  ) RETURNING id INTO v_transaction_id;
  
  UPDATE gift_cards
  SET remaining_balance = 0,
      redeemed_by_user_id = p_user_id,
      redeemed_at = now(),
      status = 'redeemed'
  WHERE id = v_card.id;
  
  INSERT INTO gift_card_transactions (
    gift_card_id, user_id, transaction_type, amount, balance_after, description
  ) VALUES (
    v_card.id, p_user_id, 'redemption', v_amount, 0, 'Full balance transferred to wallet'
  );
  
  INSERT INTO user_notifications (user_id, title, body, notification_type, data)
  VALUES (
    p_user_id,
    'Gift Card Redeemed! 🎁',
    'Gift card ' || p_code || ' redeemed. ' || v_amount || ' added to your wallet.',
    'wallet',
    jsonb_build_object(
      'type', 'gift_card_redemption', 'amount', v_amount,
      'gift_card_code', p_code, 'wallet_transaction_id', v_transaction_id
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'amount_added', v_amount,
    'wallet_balance', v_wallet_balance + v_amount,
    'gift_card_id', v_card.id,
    'transaction_id', v_transaction_id
  );
END;
$function$;
