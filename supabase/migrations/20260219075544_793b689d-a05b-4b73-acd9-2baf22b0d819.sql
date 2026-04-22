
-- SMS audit log table for Sendai integration
CREATE TABLE public.sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  sender_id TEXT DEFAULT 'Suvat',
  status TEXT DEFAULT 'sent',
  context TEXT,
  reference_id TEXT,
  user_id UUID,
  metadata JSONB,
  sendai_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Only service_role can insert (edge functions)
CREATE POLICY "Service role can manage sms_logs"
  ON public.sms_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Users can view their own SMS logs
CREATE POLICY "Users can view own sms logs"
  ON public.sms_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Index for lookups
CREATE INDEX idx_sms_logs_reference ON public.sms_logs(reference_id);
CREATE INDEX idx_sms_logs_user ON public.sms_logs(user_id);
CREATE INDEX idx_sms_logs_context ON public.sms_logs(context);
