
-- Singleton table to track the getUpdates offset
CREATE TABLE public.telegram_bot_state (
  id INT PRIMARY KEY CHECK (id = 1),
  update_offset BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.telegram_bot_state (id, update_offset) VALUES (1, 0);

-- Table for storing incoming messages
CREATE TABLE public.telegram_messages (
  update_id BIGINT PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  text TEXT,
  raw_update JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telegram_messages_chat_id ON public.telegram_messages (chat_id);
CREATE INDEX idx_telegram_messages_unprocessed ON public.telegram_messages (processed) WHERE processed = false;

-- Maps Telegram chat_id to platform user accounts
CREATE TABLE public.telegram_user_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_chat_id BIGINT NOT NULL,
  user_id UUID NOT NULL,
  telegram_username TEXT,
  link_code TEXT,
  link_code_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'unlinked')),
  user_type TEXT NOT NULL DEFAULT 'consumer' CHECK (user_type IN ('consumer', 'merchant', 'agent', 'driver')),
  notification_preferences JSONB NOT NULL DEFAULT '{"bookings": true, "wallet": true, "promotions": true, "rides": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(telegram_chat_id),
  UNIQUE(user_id)
);

CREATE INDEX idx_telegram_user_links_chat_id ON public.telegram_user_links (telegram_chat_id);
CREATE INDEX idx_telegram_user_links_user_id ON public.telegram_user_links (user_id);
CREATE INDEX idx_telegram_user_links_link_code ON public.telegram_user_links (link_code) WHERE link_code IS NOT NULL;

-- Conversation session context per chat
CREATE TABLE public.telegram_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'general',
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telegram_sessions_chat_id ON public.telegram_sessions (chat_id);

-- Enable RLS
ALTER TABLE public.telegram_bot_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_user_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_sessions ENABLE ROW LEVEL SECURITY;

-- telegram_bot_state: service_role only (no user policies)
-- telegram_messages: service_role only (no user policies)
-- telegram_sessions: service_role only (no user policies)

-- telegram_user_links: users can read/update their own link
CREATE POLICY "Users can view their own telegram link"
  ON public.telegram_user_links
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own telegram link"
  ON public.telegram_user_links
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own telegram link"
  ON public.telegram_user_links
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own telegram link"
  ON public.telegram_user_links
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Enable realtime for telegram_messages so bot can react
ALTER PUBLICATION supabase_realtime ADD TABLE public.telegram_messages;
