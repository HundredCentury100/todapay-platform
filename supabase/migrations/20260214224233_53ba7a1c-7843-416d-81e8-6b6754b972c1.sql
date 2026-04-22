-- Add merchant response columns to event_reviews
ALTER TABLE public.event_reviews ADD COLUMN IF NOT EXISTS merchant_response TEXT;
ALTER TABLE public.event_reviews ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;