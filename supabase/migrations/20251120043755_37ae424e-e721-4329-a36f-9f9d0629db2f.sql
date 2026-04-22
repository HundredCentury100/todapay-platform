-- Create merchant chatbot settings table
CREATE TABLE IF NOT EXISTS public.merchant_chatbot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  system_prompt TEXT DEFAULT 'You are a helpful customer service assistant.',
  faqs JSONB DEFAULT '[]'::jsonb,
  business_hours JSONB DEFAULT '{"monday": "9:00-17:00", "tuesday": "9:00-17:00", "wednesday": "9:00-17:00", "thursday": "9:00-17:00", "friday": "9:00-17:00"}'::jsonb,
  response_tone TEXT DEFAULT 'professional',
  auto_response_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_profile_id)
);

-- Create merchant chat messages table for manual responses
CREATE TABLE IF NOT EXISTS public.merchant_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  message TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'merchant', 'ai')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.merchant_chatbot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chatbot settings
CREATE POLICY "Merchants can view their own chatbot settings"
  ON public.merchant_chatbot_settings
  FOR SELECT
  USING (
    merchant_profile_id IN (
      SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can insert their own chatbot settings"
  ON public.merchant_chatbot_settings
  FOR INSERT
  WITH CHECK (
    merchant_profile_id IN (
      SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can update their own chatbot settings"
  ON public.merchant_chatbot_settings
  FOR UPDATE
  USING (
    merchant_profile_id IN (
      SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for chat messages
CREATE POLICY "Merchants can view their own chat messages"
  ON public.merchant_chat_messages
  FOR SELECT
  USING (
    merchant_profile_id IN (
      SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert chat messages"
  ON public.merchant_chat_messages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Merchants can update their own chat messages"
  ON public.merchant_chat_messages
  FOR UPDATE
  USING (
    merchant_profile_id IN (
      SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_chatbot_settings_merchant ON public.merchant_chatbot_settings(merchant_profile_id);
CREATE INDEX idx_chat_messages_merchant ON public.merchant_chat_messages(merchant_profile_id);
CREATE INDEX idx_chat_messages_customer ON public.merchant_chat_messages(customer_email);
CREATE INDEX idx_chat_messages_created ON public.merchant_chat_messages(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_chatbot_settings_updated_at
  BEFORE UPDATE ON public.merchant_chatbot_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();