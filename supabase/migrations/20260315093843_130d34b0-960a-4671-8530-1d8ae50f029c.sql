-- Agent Float Accounts
CREATE TABLE public.agent_float_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  balance_usd NUMERIC NOT NULL DEFAULT 0,
  balance_zwg NUMERIC NOT NULL DEFAULT 0,
  total_loaded_usd NUMERIC NOT NULL DEFAULT 0,
  total_loaded_zwg NUMERIC NOT NULL DEFAULT 0,
  total_deducted_usd NUMERIC NOT NULL DEFAULT 0,
  total_deducted_zwg NUMERIC NOT NULL DEFAULT 0,
  low_balance_threshold_usd NUMERIC NOT NULL DEFAULT 20,
  low_balance_threshold_zwg NUMERIC NOT NULL DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_profile_id)
);

ALTER TABLE public.agent_float_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own float account"
ON public.agent_float_accounts FOR SELECT TO authenticated
USING (
  agent_profile_id IN (
    SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all float accounts"
ON public.agent_float_accounts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage float accounts"
ON public.agent_float_accounts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Agent Float Transactions
CREATE TABLE public.agent_float_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  float_account_id UUID NOT NULL REFERENCES public.agent_float_accounts(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  balance_before NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  description TEXT,
  bill_payment_id UUID REFERENCES public.bill_payments(id),
  loaded_by_admin_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agent_float_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own float transactions"
ON public.agent_float_transactions FOR SELECT TO authenticated
USING (
  float_account_id IN (
    SELECT id FROM public.agent_float_accounts
    WHERE agent_profile_id IN (
      SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Admins can view all float transactions"
ON public.agent_float_transactions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert float transactions"
ON public.agent_float_transactions FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RPC: get_or_create_float_account
CREATE OR REPLACE FUNCTION public.get_or_create_float_account(p_agent_profile_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_account_id UUID;
BEGIN
  SELECT id INTO v_account_id FROM agent_float_accounts WHERE agent_profile_id = p_agent_profile_id;
  IF v_account_id IS NULL THEN
    INSERT INTO agent_float_accounts (agent_profile_id)
    VALUES (p_agent_profile_id)
    RETURNING id INTO v_account_id;
  END IF;
  RETURN v_account_id;
END;
$$;

-- RPC: load_agent_float
CREATE OR REPLACE FUNCTION public.load_agent_float(
  p_agent_profile_id UUID,
  p_amount NUMERIC,
  p_currency TEXT,
  p_admin_id UUID,
  p_description TEXT DEFAULT 'Float top-up'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_account_id UUID;
  v_balance_before NUMERIC;
  v_balance_after NUMERIC;
  v_threshold NUMERIC;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  v_account_id := get_or_create_float_account(p_agent_profile_id);

  IF p_currency = 'USD' THEN
    SELECT balance_usd, low_balance_threshold_usd INTO v_balance_before, v_threshold
    FROM agent_float_accounts WHERE id = v_account_id FOR UPDATE;
    v_balance_after := v_balance_before + p_amount;
    UPDATE agent_float_accounts SET
      balance_usd = v_balance_after,
      total_loaded_usd = total_loaded_usd + p_amount,
      updated_at = now()
    WHERE id = v_account_id;
  ELSE
    SELECT balance_zwg, low_balance_threshold_zwg INTO v_balance_before, v_threshold
    FROM agent_float_accounts WHERE id = v_account_id FOR UPDATE;
    v_balance_after := v_balance_before + p_amount;
    UPDATE agent_float_accounts SET
      balance_zwg = v_balance_after,
      total_loaded_zwg = total_loaded_zwg + p_amount,
      updated_at = now()
    WHERE id = v_account_id;
  END IF;

  INSERT INTO agent_float_transactions (float_account_id, transaction_type, amount, currency, balance_before, balance_after, description, loaded_by_admin_id)
  VALUES (v_account_id, 'load', p_amount, p_currency, v_balance_before, v_balance_after, p_description, p_admin_id);

  INSERT INTO agent_notifications (agent_profile_id, notification_type, title, body, data)
  VALUES (
    p_agent_profile_id,
    'float_loaded',
    'Float Loaded',
    p_currency || ' ' || p_amount || ' added to your float. New balance: ' || p_currency || ' ' || v_balance_after,
    jsonb_build_object('amount', p_amount, 'currency', p_currency, 'new_balance', v_balance_after)
  );

  RETURN jsonb_build_object(
    'success', true,
    'account_id', v_account_id,
    'balance_before', v_balance_before,
    'balance_after', v_balance_after,
    'currency', p_currency
  );
END;
$$;

-- RPC: deduct_agent_float
CREATE OR REPLACE FUNCTION public.deduct_agent_float(
  p_agent_profile_id UUID,
  p_amount NUMERIC,
  p_currency TEXT,
  p_bill_payment_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT 'Bill payment deduction'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_account_id UUID;
  v_balance_before NUMERIC;
  v_balance_after NUMERIC;
  v_threshold NUMERIC;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  v_account_id := get_or_create_float_account(p_agent_profile_id);

  IF p_currency = 'USD' THEN
    SELECT balance_usd, low_balance_threshold_usd INTO v_balance_before, v_threshold
    FROM agent_float_accounts WHERE id = v_account_id FOR UPDATE;
  ELSE
    SELECT balance_zwg, low_balance_threshold_zwg INTO v_balance_before, v_threshold
    FROM agent_float_accounts WHERE id = v_account_id FOR UPDATE;
  END IF;

  IF v_balance_before < p_amount THEN
    RAISE EXCEPTION 'Insufficient float balance. Available: % %, Required: % %', p_currency, v_balance_before, p_currency, p_amount;
  END IF;

  v_balance_after := v_balance_before - p_amount;

  IF p_currency = 'USD' THEN
    UPDATE agent_float_accounts SET
      balance_usd = v_balance_after,
      total_deducted_usd = total_deducted_usd + p_amount,
      updated_at = now()
    WHERE id = v_account_id;
  ELSE
    UPDATE agent_float_accounts SET
      balance_zwg = v_balance_after,
      total_deducted_zwg = total_deducted_zwg + p_amount,
      updated_at = now()
    WHERE id = v_account_id;
  END IF;

  INSERT INTO agent_float_transactions (float_account_id, transaction_type, amount, currency, balance_before, balance_after, description, bill_payment_id)
  VALUES (v_account_id, 'deduction', p_amount, p_currency, v_balance_before, v_balance_after, p_description, p_bill_payment_id);

  IF v_balance_after < v_threshold THEN
    INSERT INTO agent_notifications (agent_profile_id, notification_type, title, body, data)
    VALUES (
      p_agent_profile_id,
      'low_float_balance',
      'Low Float Balance',
      'Your ' || p_currency || ' float balance is low: ' || p_currency || ' ' || v_balance_after || '. Please request a top-up.',
      jsonb_build_object('currency', p_currency, 'balance', v_balance_after, 'threshold', v_threshold)
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'account_id', v_account_id,
    'balance_before', v_balance_before,
    'balance_after', v_balance_after,
    'currency', p_currency
  );
END;
$$;