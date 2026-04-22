
-- Promo codes table
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  max_discount_amount NUMERIC,
  min_order_amount NUMERIC NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_uses INTEGER,
  max_uses_per_user INTEGER NOT NULL DEFAULT 1,
  current_uses INTEGER NOT NULL DEFAULT 0,
  applicable_verticals TEXT[] NOT NULL DEFAULT '{}',
  first_time_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Promo code usage tracking
CREATE TABLE public.promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  discount_applied NUMERIC NOT NULL DEFAULT 0,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User vouchers (earned from promos, referrals, rewards)
CREATE TABLE public.user_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'promo' CHECK (source IN ('promo', 'referral', 'reward', 'gift', 'campaign')),
  source_reference_id UUID,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  max_discount_amount NUMERIC,
  min_order_amount NUMERIC NOT NULL DEFAULT 0,
  applicable_verticals TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  used_on_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vouchers ENABLE ROW LEVEL SECURITY;

-- Everyone can read active promo codes
CREATE POLICY "Anyone can read active promo codes" ON public.promo_codes
  FOR SELECT USING (is_active = true);

-- Users can see their own usage
CREATE POLICY "Users can read own promo usage" ON public.promo_code_usage
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Users can read own vouchers
CREATE POLICY "Users can read own vouchers" ON public.user_vouchers
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX idx_promo_code_usage_user ON public.promo_code_usage(user_id);
CREATE INDEX idx_user_vouchers_user ON public.user_vouchers(user_id);
CREATE INDEX idx_user_vouchers_status ON public.user_vouchers(user_id, status);

-- Generate voucher code function
CREATE OR REPLACE FUNCTION public.generate_voucher_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'VCH-';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Validate promo code RPC
CREATE OR REPLACE FUNCTION public.validate_promo_code(
  p_code TEXT,
  p_user_id UUID,
  p_order_amount NUMERIC,
  p_vertical TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_promo promo_codes;
  v_user_usage_count INTEGER;
  v_user_has_bookings BOOLEAN;
  v_discount NUMERIC;
BEGIN
  SELECT * INTO v_promo FROM promo_codes WHERE code = p_code AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid promo code');
  END IF;

  -- Check date validity
  IF v_promo.valid_from > now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This promo code is not yet active');
  END IF;
  
  IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This promo code has expired');
  END IF;

  -- Check max uses
  IF v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This promo code has reached its usage limit');
  END IF;

  -- Check per-user usage
  SELECT COUNT(*) INTO v_user_usage_count
  FROM promo_code_usage WHERE promo_code_id = v_promo.id AND user_id = p_user_id;
  
  IF v_user_usage_count >= v_promo.max_uses_per_user THEN
    RETURN jsonb_build_object('valid', false, 'error', 'You have already used this promo code');
  END IF;

  -- Check minimum order amount
  IF p_order_amount < v_promo.min_order_amount THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Minimum order amount is $' || v_promo.min_order_amount);
  END IF;

  -- Check vertical applicability
  IF array_length(v_promo.applicable_verticals, 1) > 0 AND NOT (p_vertical = ANY(v_promo.applicable_verticals)) THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This promo code is not valid for this service');
  END IF;

  -- Check first time only
  IF v_promo.first_time_only THEN
    SELECT EXISTS(SELECT 1 FROM bookings WHERE user_id = p_user_id AND status = 'confirmed') INTO v_user_has_bookings;
    IF v_user_has_bookings THEN
      RETURN jsonb_build_object('valid', false, 'error', 'This promo code is for first-time users only');
    END IF;
  END IF;

  -- Calculate discount
  IF v_promo.discount_type = 'percentage' THEN
    v_discount := p_order_amount * (v_promo.discount_value / 100);
    IF v_promo.max_discount_amount IS NOT NULL THEN
      v_discount := LEAST(v_discount, v_promo.max_discount_amount);
    END IF;
  ELSE
    v_discount := LEAST(v_promo.discount_value, p_order_amount);
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'promo_code_id', v_promo.id,
    'discount', v_discount,
    'discount_type', v_promo.discount_type,
    'discount_value', v_promo.discount_value,
    'description', v_promo.description
  );
END;
$$;

-- Apply promo code RPC
CREATE OR REPLACE FUNCTION public.apply_promo_code(
  p_promo_code_id UUID,
  p_user_id UUID,
  p_booking_id UUID,
  p_discount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO promo_code_usage (promo_code_id, user_id, booking_id, discount_applied)
  VALUES (p_promo_code_id, p_user_id, p_booking_id, p_discount);

  UPDATE promo_codes SET current_uses = current_uses + 1, updated_at = now()
  WHERE id = p_promo_code_id;

  RETURN true;
END;
$$;

-- Redeem reward points RPC
CREATE OR REPLACE FUNCTION public.redeem_reward_points(
  p_user_id UUID,
  p_points_to_redeem INTEGER,
  p_reward_name TEXT,
  p_discount_type TEXT DEFAULT 'percentage',
  p_discount_value NUMERIC DEFAULT 10,
  p_applicable_verticals TEXT[] DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_points INTEGER;
  v_voucher_code TEXT;
  v_voucher_id UUID;
BEGIN
  SELECT loyalty_points INTO v_current_points FROM profiles WHERE id = p_user_id FOR UPDATE;
  
  IF v_current_points IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  IF v_current_points < p_points_to_redeem THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient points');
  END IF;

  v_voucher_code := generate_voucher_code();

  INSERT INTO user_vouchers (
    user_id, code, source, discount_type, discount_value, 
    applicable_verticals, description, expires_at
  ) VALUES (
    p_user_id, v_voucher_code, 'reward', p_discount_type, p_discount_value,
    p_applicable_verticals, p_reward_name, now() + interval '30 days'
  ) RETURNING id INTO v_voucher_id;

  UPDATE profiles SET loyalty_points = loyalty_points - p_points_to_redeem, updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO user_notifications (user_id, title, body, notification_type, data)
  VALUES (
    p_user_id,
    'Reward Redeemed! 🎉',
    'You redeemed ' || p_points_to_redeem || ' points for ' || p_reward_name || '. Voucher code: ' || v_voucher_code,
    'reward',
    jsonb_build_object('type', 'reward_redemption', 'voucher_id', v_voucher_id, 'voucher_code', v_voucher_code)
  );

  RETURN jsonb_build_object(
    'success', true,
    'voucher_id', v_voucher_id,
    'voucher_code', v_voucher_code,
    'points_remaining', v_current_points - p_points_to_redeem
  );
END;
$$;

-- Seed starter promo codes
INSERT INTO public.promo_codes (code, description, discount_type, discount_value, max_discount_amount, min_order_amount, applicable_verticals, first_time_only, max_uses, valid_until) VALUES
  ('WELCOME20', 'Welcome! 20% off your first booking', 'percentage', 20, 50, 5, '{}', true, NULL, now() + interval '90 days'),
  ('FIRST10', '$10 off your first ride', 'fixed', 10, NULL, 15, '{rides}', true, NULL, now() + interval '60 days'),
  ('BUSWEEK20', '20% off bus tickets this week', 'percentage', 20, 30, 10, '{bus}', false, 200, now() + interval '7 days'),
  ('EARLYBIRD15', '15% off early event bookings', 'percentage', 15, 25, 20, '{event}', false, 500, now() + interval '14 days'),
  ('WEEKEND10', '10% off weekend stays', 'percentage', 10, 40, 30, '{stay}', false, NULL, now() + interval '30 days'),
  ('NEWUSER', '$5 off any booking for new users', 'fixed', 5, NULL, 10, '{}', true, NULL, now() + interval '180 days');
