
-- Create booking_links table
CREATE TABLE public.booking_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_profile_id UUID REFERENCES public.merchant_profiles(id),
  corporate_account_id UUID REFERENCES public.corporate_accounts(id),
  created_by_user_id UUID NOT NULL,
  link_code TEXT NOT NULL UNIQUE,
  link_type TEXT NOT NULL DEFAULT 'booking' CHECK (link_type IN ('booking', 'payment')),
  service_type TEXT NOT NULL CHECK (service_type IN ('event', 'bus', 'venue', 'stay', 'workspace', 'experience', 'transfer')),
  service_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  preset_config JSONB DEFAULT '{}'::jsonb,
  fixed_amount NUMERIC,
  currency TEXT NOT NULL DEFAULT 'USD',
  max_uses INTEGER,
  times_used INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  custom_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_links ENABLE ROW LEVEL SECURITY;

-- Merchants can manage their own links
CREATE POLICY "Merchants can manage own links"
ON public.booking_links
FOR ALL
USING (
  merchant_profile_id IN (
    SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  merchant_profile_id IN (
    SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
  )
);

-- Corporate admins can manage links for their account
CREATE POLICY "Corporate admins can manage account links"
ON public.booking_links
FOR ALL
USING (
  corporate_account_id IN (
    SELECT corporate_account_id FROM public.corporate_employees 
    WHERE user_id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  corporate_account_id IN (
    SELECT corporate_account_id FROM public.corporate_employees 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Anyone can read active, non-expired links (for public resolution)
CREATE POLICY "Anyone can read active links"
ON public.booking_links
FOR SELECT
USING (
  is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
);

-- Function to generate link codes
CREATE OR REPLACE FUNCTION public.generate_booking_link_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'BL-';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_booking_links_updated_at
BEFORE UPDATE ON public.booking_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast link resolution
CREATE INDEX idx_booking_links_link_code ON public.booking_links(link_code);
CREATE INDEX idx_booking_links_merchant ON public.booking_links(merchant_profile_id);
CREATE INDEX idx_booking_links_corporate ON public.booking_links(corporate_account_id);
