
-- Fix column names in transfer_between_wallets to match user_notifications schema
CREATE OR REPLACE FUNCTION public.transfer_between_wallets(
  p_sender_wallet_id uuid,
  p_recipient_account_number text,
  p_amount numeric,
  p_description text DEFAULT 'Wallet transfer'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  INSERT INTO user_wallet_transactions (wallet_id, transaction_type, amount, description, reference, status)
  VALUES (p_sender_wallet_id, 'debit', p_amount, 'Transfer to ' || COALESCE(v_recipient_name, p_recipient_account_number), v_recipient_wallet_id::text, 'completed')
  RETURNING id INTO v_debit_txn_id;

  UPDATE user_wallets SET balance = balance - p_amount, updated_at = now() WHERE id = p_sender_wallet_id;

  INSERT INTO user_wallet_transactions (wallet_id, transaction_type, amount, description, reference, status)
  VALUES (v_recipient_wallet_id, 'credit', p_amount, 'Transfer from ' || COALESCE(v_sender_name, 'Unknown'), p_sender_wallet_id::text, 'completed')
  RETURNING id INTO v_credit_txn_id;

  UPDATE user_wallets SET balance = balance + p_amount, lifetime_earned = lifetime_earned + p_amount, updated_at = now() WHERE id = v_recipient_wallet_id;

  -- Notifications using correct column names: message, type, metadata
  INSERT INTO user_notifications (user_id, title, message, type, category, metadata)
  VALUES (
    v_sender_user_id,
    'Money Sent 💸',
    'You sent $' || p_amount || ' to ' || COALESCE(v_recipient_name, p_recipient_account_number),
    'wallet',
    'payment',
    jsonb_build_object('type', 'wallet_transfer_sent', 'amount', p_amount, 'recipient', p_recipient_account_number, 'transaction_id', v_debit_txn_id)
  );

  INSERT INTO user_notifications (user_id, title, message, type, category, metadata)
  VALUES (
    v_recipient_user_id,
    'Money Received 💰',
    'You received $' || p_amount || ' from ' || COALESCE(v_sender_name, 'Someone'),
    'wallet',
    'payment',
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
$$;
