CREATE TABLE public.sponsored_telegram_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_profile_id UUID REFERENCES public.merchant_profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  cta_url TEXT,
  target_roles TEXT[] DEFAULT '{consumer}',
  budget_remaining NUMERIC DEFAULT 0,
  cost_per_send NUMERIC DEFAULT 0.01,
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  total_sends INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sponsored_telegram_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage own ads" ON public.sponsored_telegram_ads
  FOR ALL TO authenticated
  USING (merchant_profile_id IN (SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()))
  WITH CHECK (merchant_profile_id IN (SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access to sponsored ads" ON public.sponsored_telegram_ads
  FOR ALL TO service_role USING (true) WITH CHECK (true);