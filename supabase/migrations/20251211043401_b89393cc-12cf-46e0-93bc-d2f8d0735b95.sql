-- Create advertisements table
CREATE TABLE public.advertisements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('sponsored_card', 'banner')),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  destination_url TEXT,
  destination_type TEXT CHECK (destination_type IN ('bus', 'event', 'external')),
  destination_id UUID,
  
  -- Targeting options
  target_locations TEXT[] DEFAULT '{}',
  target_event_types TEXT[] DEFAULT '{}',
  target_route_types TEXT[] DEFAULT '{}',
  
  -- Budget and pricing (PPC model)
  daily_budget NUMERIC NOT NULL DEFAULT 10.00,
  cost_per_click NUMERIC NOT NULL DEFAULT 0.50,
  total_budget NUMERIC,
  amount_spent NUMERIC NOT NULL DEFAULT 0,
  
  -- Scheduling
  start_date DATE,
  end_date DATE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'active', 'paused', 'completed', 'archived')),
  rejection_reason TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad impressions table
CREATE TABLE public.ad_impressions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertisement_id UUID NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  placement TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad clicks table
CREATE TABLE public.ad_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertisement_id UUID NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  impression_id UUID REFERENCES public.ad_impressions(id),
  user_id UUID,
  session_id TEXT,
  cost NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_advertisements_merchant ON public.advertisements(merchant_profile_id);
CREATE INDEX idx_advertisements_status ON public.advertisements(status);
CREATE INDEX idx_advertisements_type ON public.advertisements(ad_type);
CREATE INDEX idx_ad_impressions_ad ON public.ad_impressions(advertisement_id);
CREATE INDEX idx_ad_impressions_created ON public.ad_impressions(created_at);
CREATE INDEX idx_ad_clicks_ad ON public.ad_clicks(advertisement_id);
CREATE INDEX idx_ad_clicks_created ON public.ad_clicks(created_at);

-- Enable RLS
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

-- RLS policies for advertisements
CREATE POLICY "Merchants can view their own ads"
  ON public.advertisements FOR SELECT
  USING (merchant_profile_id IN (
    SELECT id FROM merchant_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Merchants can create their own ads"
  ON public.advertisements FOR INSERT
  WITH CHECK (merchant_profile_id IN (
    SELECT id FROM merchant_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Merchants can update their own ads"
  ON public.advertisements FOR UPDATE
  USING (merchant_profile_id IN (
    SELECT id FROM merchant_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Merchants can delete draft ads"
  ON public.advertisements FOR DELETE
  USING (merchant_profile_id IN (
    SELECT id FROM merchant_profiles WHERE user_id = auth.uid()
  ) AND status = 'draft');

CREATE POLICY "Admins can view all ads"
  ON public.advertisements FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all ads"
  ON public.advertisements FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active ads"
  ON public.advertisements FOR SELECT
  USING (status = 'active');

-- RLS policies for impressions (system can insert, merchants can view their own)
CREATE POLICY "System can insert impressions"
  ON public.ad_impressions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Merchants can view their ad impressions"
  ON public.ad_impressions FOR SELECT
  USING (advertisement_id IN (
    SELECT id FROM advertisements WHERE merchant_profile_id IN (
      SELECT id FROM merchant_profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Admins can view all impressions"
  ON public.ad_impressions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for clicks
CREATE POLICY "System can insert clicks"
  ON public.ad_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Merchants can view their ad clicks"
  ON public.ad_clicks FOR SELECT
  USING (advertisement_id IN (
    SELECT id FROM advertisements WHERE merchant_profile_id IN (
      SELECT id FROM merchant_profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Admins can view all clicks"
  ON public.ad_clicks FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update updated_at
CREATE TRIGGER update_advertisements_updated_at
  BEFORE UPDATE ON public.advertisements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();