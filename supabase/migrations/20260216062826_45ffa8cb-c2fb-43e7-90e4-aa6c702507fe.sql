
-- Add cleaning_fee to rooms table
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS cleaning_fee numeric DEFAULT 0;

-- Add review_sub_ratings to reviews table for Airbnb-style breakdown
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS sub_ratings jsonb DEFAULT NULL;

-- Add missing columns to existing seasonal_pricing_rules table
ALTER TABLE public.seasonal_pricing_rules ADD COLUMN IF NOT EXISTS rule_type TEXT NOT NULL DEFAULT 'percentage';
ALTER TABLE public.seasonal_pricing_rules ADD COLUMN IF NOT EXISTS adjustment numeric NOT NULL DEFAULT 0;
ALTER TABLE public.seasonal_pricing_rules ADD COLUMN IF NOT EXISTS days_of_week integer[] DEFAULT NULL;
ALTER TABLE public.seasonal_pricing_rules ADD COLUMN IF NOT EXISTS min_stay integer DEFAULT 1;

-- Create host_messages table for host-guest communication
CREATE TABLE IF NOT EXISTS public.host_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('host', 'guest')),
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_read boolean DEFAULT false,
  is_automated boolean DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.host_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can manage messages for their properties"
ON public.host_messages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    JOIN public.merchant_profiles mp ON p.merchant_profile_id = mp.id
    WHERE p.id = host_messages.property_id
    AND mp.user_id = auth.uid()
  )
);

CREATE POLICY "Guests can view and send messages for their bookings"
ON public.host_messages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = host_messages.booking_id
    AND b.user_id = auth.uid()
  )
);

-- Create message templates table
CREATE TABLE IF NOT EXISTS public.host_message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'manual',
  is_active boolean DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.host_message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage their message templates"
ON public.host_message_templates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.merchant_profiles mp
    WHERE mp.id = host_message_templates.merchant_profile_id
    AND mp.user_id = auth.uid()
  )
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_host_messages_booking_id ON public.host_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_host_messages_property_id ON public.host_messages(property_id);
