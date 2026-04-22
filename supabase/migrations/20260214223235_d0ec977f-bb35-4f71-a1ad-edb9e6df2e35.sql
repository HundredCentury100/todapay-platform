-- Add merchant response columns to reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS merchant_response TEXT,
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE;
