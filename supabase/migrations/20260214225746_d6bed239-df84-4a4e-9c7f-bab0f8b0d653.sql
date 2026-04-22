-- Create experience reviews table
CREATE TABLE public.experience_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id),
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL DEFAULT '',
  comment TEXT NOT NULL DEFAULT '',
  merchant_response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.experience_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Experience reviews are publicly readable"
ON public.experience_reviews FOR SELECT USING (true);

-- Users can create their own reviews
CREATE POLICY "Users can create their own reviews"
ON public.experience_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.experience_reviews FOR UPDATE
USING (auth.uid() = user_id);

-- Merchants can respond to reviews on their experiences
CREATE POLICY "Merchants can respond to reviews"
ON public.experience_reviews FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.experiences e
    JOIN public.merchant_profiles mp ON mp.id = e.merchant_profile_id
    WHERE e.id = experience_reviews.experience_id
    AND mp.user_id = auth.uid()
  )
);

-- Index for performance
CREATE INDEX idx_experience_reviews_experience_id ON public.experience_reviews(experience_id);
CREATE INDEX idx_experience_reviews_user_id ON public.experience_reviews(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_experience_reviews_updated_at
BEFORE UPDATE ON public.experience_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();