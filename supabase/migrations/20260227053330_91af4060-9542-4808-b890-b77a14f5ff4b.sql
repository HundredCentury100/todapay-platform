
-- Create a function that redeems a gift card and adds balance to user wallet
CREATE OR REPLACE FUNCTION public.redeem_gift_card_to_wallet(
  p_code TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_card RECORD;
  v_wallet_id UUID;
  v_amount NUMERIC;
  v_transaction_id UUID;
BEGIN
  -- Lock and fetch the gift card
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
  
  -- Get or create user wallet
  SELECT id INTO v_wallet_id FROM user_wallets WHERE user_id = p_user_id;
  IF v_wallet_id IS NULL THEN
    INSERT INTO user_wallets (user_id, balance) VALUES (p_user_id, 0)
    RETURNING id INTO v_wallet_id;
  END IF;
  
  -- Add balance to wallet
  UPDATE user_wallets
  SET balance = balance + v_amount,
      lifetime_earned = lifetime_earned + v_amount,
      updated_at = now()
  WHERE id = v_wallet_id;
  
  -- Create wallet transaction
  INSERT INTO user_wallet_transactions (
    wallet_id, transaction_type, amount, description, reference, status
  ) VALUES (
    v_wallet_id, 'credit', v_amount,
    'Gift card redeemed: ' || p_code,
    v_card.id::text, 'completed'
  ) RETURNING id INTO v_transaction_id;
  
  -- Update gift card status
  UPDATE gift_cards
  SET remaining_balance = 0,
      redeemed_by_user_id = p_user_id,
      redeemed_at = now(),
      status = 'redeemed'
  WHERE id = v_card.id;
  
  -- Record in gift card transactions
  INSERT INTO gift_card_transactions (
    gift_card_id, user_id, transaction_type, amount, balance_after, description
  ) VALUES (
    v_card.id, p_user_id, 'redemption', v_amount, 0,
    'Full balance transferred to wallet'
  );
  
  -- Create in-app notification
  INSERT INTO user_notifications (user_id, title, body, notification_type, data)
  VALUES (
    p_user_id,
    'Gift Card Redeemed! 🎁',
    'Gift card ' || p_code || ' redeemed. ' || v_amount || ' added to your wallet.',
    'wallet',
    jsonb_build_object(
      'type', 'gift_card_redemption',
      'amount', v_amount,
      'gift_card_code', p_code,
      'wallet_transaction_id', v_transaction_id
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'amount_added', v_amount,
    'wallet_balance', (SELECT balance FROM user_wallets WHERE id = v_wallet_id),
    'gift_card_id', v_card.id,
    'transaction_id', v_transaction_id
  );
END;
$$;
