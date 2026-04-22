
-- Create the missing merchant_account_status table referenced by the trigger
CREATE TABLE IF NOT EXISTS public.merchant_account_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_profile_id UUID NOT NULL UNIQUE REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  is_suspended BOOLEAN DEFAULT false,
  suspension_reason TEXT,
  suspended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.merchant_account_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage merchant account status"
  ON public.merchant_account_status
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Merchants can view own account status"
  ON public.merchant_account_status
  FOR SELECT
  TO authenticated
  USING (merchant_profile_id IN (SELECT id FROM merchant_profiles WHERE user_id = auth.uid()));
