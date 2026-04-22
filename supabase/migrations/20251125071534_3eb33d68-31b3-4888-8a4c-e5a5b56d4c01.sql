-- Create agent notifications table
CREATE TABLE IF NOT EXISTS public.agent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_profile_id UUID REFERENCES public.merchant_profiles(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('new_booking', 'payout_approved', 'payout_rejected', 'commission_approved', 'tier_upgraded', 'client_message')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create push tokens table for web push
CREATE TABLE IF NOT EXISTS public.agent_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_profile_id UUID REFERENCES public.merchant_profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL UNIQUE,
  device_type TEXT CHECK (device_type IN ('web', 'android', 'ios')),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_notifications
CREATE POLICY "Agents can view their own notifications"
  ON public.agent_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.merchant_profiles
      WHERE id = agent_notifications.agent_profile_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Agents can update their own notifications"
  ON public.agent_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.merchant_profiles
      WHERE id = agent_notifications.agent_profile_id
      AND user_id = auth.uid()
    )
  );

-- RLS policies for agent_push_tokens
CREATE POLICY "Agents can manage their own push tokens"
  ON public.agent_push_tokens FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.merchant_profiles
      WHERE id = agent_push_tokens.agent_profile_id
      AND user_id = auth.uid()
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_notifications_agent_id ON public.agent_notifications(agent_profile_id);
CREATE INDEX IF NOT EXISTS idx_agent_notifications_read ON public.agent_notifications(read);
CREATE INDEX IF NOT EXISTS idx_agent_notifications_created_at ON public.agent_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_push_tokens_agent_id ON public.agent_push_tokens(agent_profile_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_notifications;