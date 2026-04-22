-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  operator TEXT NOT NULL,
  bus_id TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create saved_routes table
CREATE TABLE public.saved_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add booking management columns
ALTER TABLE public.bookings
ADD COLUMN refund_requested BOOLEAN DEFAULT false,
ADD COLUMN refund_status TEXT DEFAULT 'none',
ADD COLUMN reschedule_requested BOOLEAN DEFAULT false,
ADD COLUMN reschedule_status TEXT DEFAULT 'none',
ADD COLUMN upgrade_requested BOOLEAN DEFAULT false,
ADD COLUMN upgrade_status TEXT DEFAULT 'none',
ADD COLUMN cancellation_reason TEXT,
ADD COLUMN has_reviewed BOOLEAN DEFAULT false;

-- Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "Users can view all reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on saved_routes
ALTER TABLE public.saved_routes ENABLE ROW LEVEL SECURITY;

-- Saved routes policies
CREATE POLICY "Users can view their own saved routes"
  ON public.saved_routes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved routes"
  ON public.saved_routes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved routes"
  ON public.saved_routes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved routes"
  ON public.saved_routes FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for reviews updated_at
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for better performance
CREATE INDEX idx_reviews_operator ON public.reviews(operator);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_saved_routes_user ON public.saved_routes(user_id);
CREATE INDEX idx_bookings_user_refund ON public.bookings(user_id, refund_requested);
CREATE INDEX idx_bookings_user_reschedule ON public.bookings(user_id, reschedule_requested);