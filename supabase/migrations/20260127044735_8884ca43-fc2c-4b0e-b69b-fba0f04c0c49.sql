-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create venue_reviews table for customer feedback on event spaces
CREATE TABLE public.venue_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  venue_rating INTEGER CHECK (venue_rating >= 1 AND venue_rating <= 5),
  service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  title TEXT NOT NULL,
  comment TEXT NOT NULL,
  merchant_response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster venue lookup
CREATE INDEX idx_venue_reviews_venue_id ON public.venue_reviews(venue_id);
CREATE INDEX idx_venue_reviews_user_id ON public.venue_reviews(user_id);

-- Enable Row Level Security
ALTER TABLE public.venue_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read reviews (public visibility)
CREATE POLICY "Anyone can view venue reviews"
ON public.venue_reviews
FOR SELECT
USING (true);

-- Policy: Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
ON public.venue_reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.venue_reviews
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.venue_reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Create function for merchants to respond to reviews
CREATE OR REPLACE FUNCTION public.respond_to_venue_review(
  p_review_id UUID,
  p_response TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_venue_id UUID;
  v_merchant_id UUID;
BEGIN
  -- Get the venue_id from the review
  SELECT venue_id INTO v_venue_id 
  FROM venue_reviews 
  WHERE id = p_review_id;
  
  IF v_venue_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the current user owns this venue
  SELECT merchant_profile_id INTO v_merchant_id
  FROM venues
  WHERE id = v_venue_id;
  
  -- Verify the merchant owns this venue
  IF NOT EXISTS (
    SELECT 1 FROM merchant_profiles 
    WHERE id = v_merchant_id 
    AND user_id = auth.uid()
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Update the review with merchant response
  UPDATE venue_reviews
  SET 
    merchant_response = p_response,
    responded_at = now(),
    updated_at = now()
  WHERE id = p_review_id;
  
  RETURN TRUE;
END;
$$;

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_venue_reviews_updated_at
BEFORE UPDATE ON public.venue_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();