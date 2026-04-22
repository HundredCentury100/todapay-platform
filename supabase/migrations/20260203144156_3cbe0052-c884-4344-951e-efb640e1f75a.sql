-- =============================================
-- PHASE 1: Super Admin Service Management & Fund Collection Schema
-- =============================================

-- 1. Create fund_collection_model enum
CREATE TYPE public.fund_collection_model AS ENUM ('platform_first', 'merchant_collects', 'escrow');

-- 2. Create payout_frequency enum
CREATE TYPE public.payout_frequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly');

-- 3. Create escrow_status enum
CREATE TYPE public.escrow_status AS ENUM ('pending', 'released', 'refunded', 'disputed');

-- 4. Create payout_status enum
CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- 5. Add fund collection columns to merchant_profiles
ALTER TABLE public.merchant_profiles
ADD COLUMN IF NOT EXISTS fund_collection_model public.fund_collection_model DEFAULT 'merchant_collects',
ADD COLUMN IF NOT EXISTS escrow_release_days integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS auto_payout_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payout_frequency public.payout_frequency DEFAULT 'weekly',
ADD COLUMN IF NOT EXISTS payout_method text DEFAULT 'bank_transfer',
ADD COLUMN IF NOT EXISTS payout_details jsonb DEFAULT '{}';

-- 6. Add created_by_admin_id to service tables
ALTER TABLE public.bus_schedules
ADD COLUMN IF NOT EXISTS created_by_admin_id uuid REFERENCES auth.users(id);

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS created_by_admin_id uuid REFERENCES auth.users(id);

ALTER TABLE public.venues
ADD COLUMN IF NOT EXISTS created_by_admin_id uuid REFERENCES auth.users(id);

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS created_by_admin_id uuid REFERENCES auth.users(id);

ALTER TABLE public.workspaces
ADD COLUMN IF NOT EXISTS created_by_admin_id uuid REFERENCES auth.users(id);

ALTER TABLE public.experiences
ADD COLUMN IF NOT EXISTS created_by_admin_id uuid REFERENCES auth.users(id);

ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS created_by_admin_id uuid REFERENCES auth.users(id);

-- 7. Create admin_service_actions table for audit trail
CREATE TABLE public.admin_service_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  merchant_profile_id uuid NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  service_id uuid NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('create', 'update', 'delete')),
  action_reason text,
  previous_data jsonb,
  new_data jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- 8. Create escrow_holds table
CREATE TABLE public.escrow_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES public.transactions(id),
  booking_id uuid REFERENCES public.bookings(id),
  merchant_profile_id uuid NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  amount decimal(12,2) NOT NULL,
  platform_fee_amount decimal(12,2) NOT NULL DEFAULT 0,
  merchant_amount decimal(12,2) NOT NULL,
  service_date timestamp with time zone,
  hold_until timestamp with time zone NOT NULL,
  status public.escrow_status DEFAULT 'pending',
  released_at timestamp with time zone,
  release_notes text,
  dispute_reason text,
  disputed_at timestamp with time zone,
  refund_amount decimal(12,2),
  refunded_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 9. Create merchant_payouts table
CREATE TABLE public.merchant_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_profile_id uuid NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  amount decimal(12,2) NOT NULL,
  fee_deducted decimal(12,2) DEFAULT 0,
  payout_method text NOT NULL,
  payout_details jsonb DEFAULT '{}',
  payout_reference text,
  status public.payout_status DEFAULT 'pending',
  processed_by uuid REFERENCES auth.users(id),
  processed_at timestamp with time zone,
  failure_reason text,
  notes text,
  period_start timestamp with time zone,
  period_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 10. Create payout_items table to track which transactions are in each payout
CREATE TABLE public.payout_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id uuid NOT NULL REFERENCES public.merchant_payouts(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions(id),
  escrow_hold_id uuid REFERENCES public.escrow_holds(id),
  amount decimal(12,2) NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 11. Enable RLS on all new tables
ALTER TABLE public.admin_service_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_items ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies for admin_service_actions (admin-only)
CREATE POLICY "Admins can view all service actions"
ON public.admin_service_actions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert service actions"
ON public.admin_service_actions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 13. RLS Policies for escrow_holds
CREATE POLICY "Admins can view all escrow holds"
ON public.escrow_holds
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Merchants can view own escrow holds"
ON public.escrow_holds
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.merchant_profiles mp
    WHERE mp.id = escrow_holds.merchant_profile_id
    AND mp.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage escrow holds"
ON public.escrow_holds
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 14. RLS Policies for merchant_payouts
CREATE POLICY "Admins can view all payouts"
ON public.merchant_payouts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Merchants can view own payouts"
ON public.merchant_payouts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.merchant_profiles mp
    WHERE mp.id = merchant_payouts.merchant_profile_id
    AND mp.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage payouts"
ON public.merchant_payouts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 15. RLS Policies for payout_items
CREATE POLICY "Admins can view all payout items"
ON public.payout_items
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Merchants can view own payout items"
ON public.payout_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.merchant_payouts mp
    JOIN public.merchant_profiles mpr ON mp.merchant_profile_id = mpr.id
    WHERE mp.id = payout_items.payout_id
    AND mpr.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage payout items"
ON public.payout_items
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 16. Create updated_at triggers
CREATE TRIGGER update_escrow_holds_updated_at
  BEFORE UPDATE ON public.escrow_holds
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_merchant_payouts_updated_at
  BEFORE UPDATE ON public.merchant_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 17. Create function to log admin service actions
CREATE OR REPLACE FUNCTION public.log_admin_service_action(
  p_admin_id uuid,
  p_merchant_profile_id uuid,
  p_service_type text,
  p_service_id uuid,
  p_action_type text,
  p_action_reason text DEFAULT NULL,
  p_previous_data jsonb DEFAULT NULL,
  p_new_data jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action_id uuid;
BEGIN
  INSERT INTO public.admin_service_actions (
    admin_id,
    merchant_profile_id,
    service_type,
    service_id,
    action_type,
    action_reason,
    previous_data,
    new_data
  ) VALUES (
    p_admin_id,
    p_merchant_profile_id,
    p_service_type,
    p_service_id,
    p_action_type,
    p_action_reason,
    p_previous_data,
    p_new_data
  )
  RETURNING id INTO v_action_id;
  
  RETURN v_action_id;
END;
$$;

-- 18. Create function to create escrow hold
CREATE OR REPLACE FUNCTION public.create_escrow_hold(
  p_booking_id uuid,
  p_merchant_profile_id uuid,
  p_amount decimal,
  p_platform_fee_percentage decimal DEFAULT 5,
  p_service_date timestamp with time zone DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_escrow_id uuid;
  v_platform_fee decimal;
  v_merchant_amount decimal;
  v_release_days integer;
  v_hold_until timestamp with time zone;
BEGIN
  -- Calculate fees
  v_platform_fee := p_amount * (p_platform_fee_percentage / 100);
  v_merchant_amount := p_amount - v_platform_fee;
  
  -- Get merchant's escrow release days
  SELECT COALESCE(escrow_release_days, 3) INTO v_release_days
  FROM public.merchant_profiles
  WHERE id = p_merchant_profile_id;
  
  -- Calculate hold until date
  v_hold_until := COALESCE(p_service_date, now()) + (v_release_days || ' days')::interval;
  
  INSERT INTO public.escrow_holds (
    booking_id,
    merchant_profile_id,
    amount,
    platform_fee_amount,
    merchant_amount,
    service_date,
    hold_until
  ) VALUES (
    p_booking_id,
    p_merchant_profile_id,
    p_amount,
    v_platform_fee,
    v_merchant_amount,
    p_service_date,
    v_hold_until
  )
  RETURNING id INTO v_escrow_id;
  
  RETURN v_escrow_id;
END;
$$;

-- 19. Create function to release escrow
CREATE OR REPLACE FUNCTION public.release_escrow_hold(
  p_escrow_id uuid,
  p_release_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.escrow_holds
  SET 
    status = 'released',
    released_at = now(),
    release_notes = p_release_notes,
    updated_at = now()
  WHERE id = p_escrow_id
  AND status = 'pending';
  
  RETURN FOUND;
END;
$$;

-- 20. Create function to get pending payout amount for merchant
CREATE OR REPLACE FUNCTION public.get_merchant_pending_payout(p_merchant_profile_id uuid)
RETURNS decimal
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(merchant_amount), 0)
  FROM public.escrow_holds
  WHERE merchant_profile_id = p_merchant_profile_id
  AND status = 'released'
  AND id NOT IN (
    SELECT escrow_hold_id FROM public.payout_items WHERE escrow_hold_id IS NOT NULL
  );
$$;

-- 21. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_service_actions_admin_id ON public.admin_service_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_service_actions_merchant_id ON public.admin_service_actions(merchant_profile_id);
CREATE INDEX IF NOT EXISTS idx_admin_service_actions_service ON public.admin_service_actions(service_type, service_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_merchant_id ON public.escrow_holds(merchant_profile_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_status ON public.escrow_holds(status);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_hold_until ON public.escrow_holds(hold_until);
CREATE INDEX IF NOT EXISTS idx_merchant_payouts_merchant_id ON public.merchant_payouts(merchant_profile_id);
CREATE INDEX IF NOT EXISTS idx_merchant_payouts_status ON public.merchant_payouts(status);
CREATE INDEX IF NOT EXISTS idx_payout_items_payout_id ON public.payout_items(payout_id);