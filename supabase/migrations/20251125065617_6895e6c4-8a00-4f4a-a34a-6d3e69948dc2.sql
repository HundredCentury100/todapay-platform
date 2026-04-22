-- Add payment details to merchant profiles
ALTER TABLE public.merchant_profiles 
ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb;

-- Create payout requests table
CREATE TABLE IF NOT EXISTS public.agent_payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount >= 50),
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sub-agent relationships table
CREATE TABLE IF NOT EXISTS public.agent_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_agent_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  referred_agent_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(referred_agent_id)
);

-- Create override commissions table for sub-agents
CREATE TABLE IF NOT EXISTS public.agent_override_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_agent_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  sub_agent_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  override_amount NUMERIC NOT NULL,
  override_rate NUMERIC NOT NULL DEFAULT 2,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.agent_payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_override_commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payout requests
CREATE POLICY "Agents can view their own payout requests"
ON public.agent_payout_requests FOR SELECT
USING (agent_profile_id IN (
  SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Agents can create payout requests"
ON public.agent_payout_requests FOR INSERT
WITH CHECK (agent_profile_id IN (
  SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can view all payout requests"
ON public.agent_payout_requests FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payout requests"
ON public.agent_payout_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for agent referrals
CREATE POLICY "Agents can view their referrals"
ON public.agent_referrals FOR SELECT
USING (referrer_agent_id IN (
  SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "System can insert referrals"
ON public.agent_referrals FOR INSERT
WITH CHECK (true);

-- RLS Policies for override commissions
CREATE POLICY "Agents can view their override commissions"
ON public.agent_override_commissions FOR SELECT
USING (referrer_agent_id IN (
  SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can view all override commissions"
ON public.agent_override_commissions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert override commissions"
ON public.agent_override_commissions FOR INSERT
WITH CHECK (true);

-- Add trigger for updated_at on payout_requests
CREATE TRIGGER update_agent_payout_requests_updated_at
  BEFORE UPDATE ON public.agent_payout_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to check payout request limits (max 2 per month)
CREATE OR REPLACE FUNCTION check_payout_request_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO request_count
  FROM agent_payout_requests
  WHERE agent_profile_id = NEW.agent_profile_id
    AND requested_at >= date_trunc('month', CURRENT_DATE)
    AND status != 'rejected';
  
  IF request_count >= 2 THEN
    RAISE EXCEPTION 'Maximum 2 payout requests per month allowed';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_payout_request_limit
  BEFORE INSERT ON public.agent_payout_requests
  FOR EACH ROW
  EXECUTE FUNCTION check_payout_request_limit();