-- Create notification_log table for tracking sent notifications
CREATE TABLE IF NOT EXISTS public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- Admin can view all notifications
CREATE POLICY "Admins can view all notifications"
ON public.notification_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.merchant_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- System can insert notifications
CREATE POLICY "System can insert notifications"
ON public.notification_log FOR INSERT
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_notification_log_updated_at
BEFORE UPDATE ON public.notification_log
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX idx_notification_log_recipient ON public.notification_log(recipient_email);
CREATE INDEX idx_notification_log_created_at ON public.notification_log(created_at);
CREATE INDEX idx_notification_log_status ON public.notification_log(status);