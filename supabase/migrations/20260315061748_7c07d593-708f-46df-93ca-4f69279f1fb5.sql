
CREATE TABLE public.commission_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type text NOT NULL,
  config_key text NOT NULL,
  rate_type text DEFAULT 'percentage',
  rate_value numeric NOT NULL,
  multiplier numeric DEFAULT 1.0,
  min_bookings integer DEFAULT 0,
  is_active boolean DEFAULT true,
  updated_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(config_type, config_key)
);

ALTER TABLE public.commission_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage commission config"
  ON public.commission_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.merchant_profiles
      WHERE user_id = auth.uid() AND role = 'admin' AND verification_status = 'verified'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.merchant_profiles
      WHERE user_id = auth.uid() AND role = 'admin' AND verification_status = 'verified'
    )
  );
