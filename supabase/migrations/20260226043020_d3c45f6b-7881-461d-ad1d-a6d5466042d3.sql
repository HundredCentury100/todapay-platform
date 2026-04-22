-- Gift Cards System

-- Gift card templates (merchant-created or platform)
CREATE TABLE public.gift_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  merchant_profile_id UUID REFERENCES public.merchant_profiles(id),
  created_by_user_id UUID REFERENCES auth.users(id),
  card_type TEXT NOT NULL DEFAULT 'platform' CHECK (card_type IN ('platform', 'merchant')),
  initial_amount NUMERIC(10,2) NOT NULL,
  remaining_balance NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,
  sender_name TEXT,
  sender_email TEXT,
  personal_message TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  redeemed_by_user_id UUID REFERENCES auth.users(id),
  redeemed_at TIMESTAMPTZ,
  design_template TEXT DEFAULT 'default',
  image_url TEXT,
  is_digital BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Gift card transactions (usage history)
CREATE TABLE public.gift_card_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_card_id UUID NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  booking_id UUID REFERENCES public.bookings(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'redemption', 'refund', 'topup')),
  amount NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;

-- Gift cards: users can see their own purchased/received cards
CREATE POLICY "Users can view own gift cards"
ON public.gift_cards FOR SELECT TO authenticated
USING (
  created_by_user_id = auth.uid() 
  OR redeemed_by_user_id = auth.uid()
  OR recipient_email IN (SELECT email FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can create gift cards"
ON public.gift_cards FOR INSERT TO authenticated
WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Users can update own gift cards"
ON public.gift_cards FOR UPDATE TO authenticated
USING (
  created_by_user_id = auth.uid() 
  OR redeemed_by_user_id = auth.uid()
  OR recipient_email IN (SELECT email FROM public.profiles WHERE id = auth.uid())
);

-- Service role full access for admin
CREATE POLICY "Service role full access on gift_cards"
ON public.gift_cards FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Gift card transactions: users can see transactions on their cards
CREATE POLICY "Users can view own gift card transactions"
ON public.gift_card_transactions FOR SELECT TO authenticated
USING (
  gift_card_id IN (
    SELECT id FROM public.gift_cards 
    WHERE created_by_user_id = auth.uid() OR redeemed_by_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create gift card transactions"
ON public.gift_card_transactions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role full access on gift_card_transactions"
ON public.gift_card_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_gift_cards_updated_at
BEFORE UPDATE ON public.gift_cards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate gift card codes
CREATE OR REPLACE FUNCTION public.generate_gift_card_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'GC-';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    IF i = 4 OR i = 8 THEN
      result := result || '-';
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

-- Auto-generate gift card code
CREATE OR REPLACE FUNCTION public.set_gift_card_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := public.generate_gift_card_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_gift_card_code_trigger
BEFORE INSERT ON public.gift_cards
FOR EACH ROW EXECUTE FUNCTION public.set_gift_card_code();

-- Function to redeem gift card at checkout
CREATE OR REPLACE FUNCTION public.redeem_gift_card(
  p_code TEXT,
  p_user_id UUID,
  p_amount NUMERIC,
  p_booking_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card gift_cards;
  v_deduct NUMERIC;
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
  
  v_deduct := LEAST(p_amount, v_card.remaining_balance);
  
  UPDATE gift_cards 
  SET remaining_balance = remaining_balance - v_deduct,
      redeemed_by_user_id = COALESCE(redeemed_by_user_id, p_user_id),
      redeemed_at = COALESCE(redeemed_at, now()),
      status = CASE WHEN remaining_balance - v_deduct <= 0 THEN 'redeemed' ELSE 'active' END
  WHERE id = v_card.id;
  
  INSERT INTO gift_card_transactions (gift_card_id, user_id, booking_id, transaction_type, amount, balance_after, description)
  VALUES (v_card.id, p_user_id, p_booking_id, 'redemption', v_deduct, v_card.remaining_balance - v_deduct, 'Redeemed at checkout');
  
  RETURN jsonb_build_object(
    'success', true,
    'amount_deducted', v_deduct,
    'remaining_balance', v_card.remaining_balance - v_deduct,
    'gift_card_id', v_card.id
  );
END;
$$;