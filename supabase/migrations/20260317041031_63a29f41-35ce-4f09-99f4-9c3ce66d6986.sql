
-- Add last_active_at and account_status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';

-- Add account_status to drivers (they already have status but we need suspension tracking)
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

-- Add last_active_at to merchant_profiles
ALTER TABLE public.merchant_profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();
ALTER TABLE public.merchant_profiles ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';

-- Add last_active_at to corporate_accounts
ALTER TABLE public.corporate_accounts ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

-- Create account_lifecycle_log table for audit trail
CREATE TABLE IF NOT EXISTS public.account_lifecycle_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid,
  target_type text NOT NULL, -- 'user', 'merchant', 'driver', 'corporate'
  target_entity_id text NOT NULL,
  action text NOT NULL, -- 'suspended', 'deleted', 'reactivated', 'auto_suspended', 'auto_deleted'
  reason text,
  performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.account_lifecycle_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage lifecycle logs" ON public.account_lifecycle_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to update last_active_at on profile when user makes a booking
CREATE OR REPLACE FUNCTION public.update_user_last_active()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE profiles SET last_active_at = now() WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- Trigger on bookings to track activity
DROP TRIGGER IF EXISTS trg_update_user_last_active ON public.bookings;
CREATE TRIGGER trg_update_user_last_active
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  WHEN (NEW.user_id IS NOT NULL)
  EXECUTE FUNCTION public.update_user_last_active();
