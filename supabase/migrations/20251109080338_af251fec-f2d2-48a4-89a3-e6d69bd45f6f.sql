-- Create table for cron job execution history
CREATE TABLE public.cron_job_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  execution_status TEXT NOT NULL CHECK (execution_status IN ('success', 'failed', 'running')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  result_data JSONB DEFAULT '{}'::jsonb,
  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('manual', 'scheduled')),
  triggered_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_cron_job_history_job_name ON public.cron_job_history(job_name);
CREATE INDEX idx_cron_job_history_started_at ON public.cron_job_history(started_at DESC);

-- Create table for billing system settings
CREATE TABLE public.billing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default billing settings
INSERT INTO public.billing_settings (setting_key, setting_value) VALUES
  ('automated_billing_enabled', 'true'::jsonb),
  ('billing_schedule', '{"day": "friday", "time": "14:55", "timezone": "UTC"}'::jsonb),
  ('payment_check_schedule', '{"day": "friday", "time": "15:01", "timezone": "UTC"}'::jsonb);

-- Create table for payment proofs/submissions
CREATE TABLE public.payment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES public.platform_fee_bills(id),
  merchant_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id),
  amount_paid NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  payment_proof_url TEXT,
  submission_notes TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for payment submissions
CREATE INDEX idx_payment_submissions_bill_id ON public.payment_submissions(bill_id);
CREATE INDEX idx_payment_submissions_merchant ON public.payment_submissions(merchant_profile_id);
CREATE INDEX idx_payment_submissions_status ON public.payment_submissions(verification_status);

-- Enable RLS on new tables
ALTER TABLE public.cron_job_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for cron_job_history
CREATE POLICY "Admins can view job history"
  ON public.cron_job_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.merchant_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert job history"
  ON public.cron_job_history FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update job history"
  ON public.cron_job_history FOR UPDATE
  USING (true);

-- RLS policies for billing_settings
CREATE POLICY "Admins can view settings"
  ON public.billing_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.merchant_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update settings"
  ON public.billing_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.merchant_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for payment_submissions
CREATE POLICY "Merchants can view their submissions"
  ON public.payment_submissions FOR SELECT
  USING (
    merchant_profile_id IN (
      SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can create submissions"
  ON public.payment_submissions FOR INSERT
  WITH CHECK (
    merchant_profile_id IN (
      SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all submissions"
  ON public.payment_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.merchant_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update submissions"
  ON public.payment_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.merchant_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger to update updated_at on payment_submissions
CREATE TRIGGER update_payment_submissions_updated_at
  BEFORE UPDATE ON public.payment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();