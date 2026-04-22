-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  location TEXT NOT NULL,
  venue TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT NOT NULL,
  image TEXT,
  organizer TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event ticket tiers table
CREATE TABLE public.event_ticket_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  available_tickets INTEGER NOT NULL,
  total_tickets INTEGER NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event seats table
CREATE TABLE public.event_seats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_tier_id UUID NOT NULL REFERENCES public.event_ticket_tiers(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  seat_row INTEGER NOT NULL,
  seat_column INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event reviews table
CREATE TABLE public.event_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event waitlist table
CREATE TABLE public.event_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID,
  email TEXT NOT NULL,
  ticket_tier_id UUID REFERENCES public.event_ticket_tiers(id) ON DELETE CASCADE,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_ticket_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Anyone can view events"
  ON public.events FOR SELECT
  USING (true);

-- RLS Policies for event_ticket_tiers
CREATE POLICY "Anyone can view ticket tiers"
  ON public.event_ticket_tiers FOR SELECT
  USING (true);

-- RLS Policies for event_seats
CREATE POLICY "Anyone can view event seats"
  ON public.event_seats FOR SELECT
  USING (true);

CREATE POLICY "System can update event seats"
  ON public.event_seats FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policies for event_reviews
CREATE POLICY "Anyone can view event reviews"
  ON public.event_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own event reviews"
  ON public.event_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own event reviews"
  ON public.event_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event reviews"
  ON public.event_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for event_waitlist
CREATE POLICY "Users can view their own waitlist entries"
  ON public.event_waitlist FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can join waitlist"
  ON public.event_waitlist FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own waitlist entries"
  ON public.event_waitlist FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Create indexes
CREATE INDEX idx_event_ticket_tiers_event_id ON public.event_ticket_tiers(event_id);
CREATE INDEX idx_event_seats_event_id ON public.event_seats(event_id);
CREATE INDEX idx_event_seats_booking_id ON public.event_seats(booking_id);
CREATE INDEX idx_event_reviews_event_id ON public.event_reviews(event_id);
CREATE INDEX idx_event_reviews_user_id ON public.event_reviews(user_id);
CREATE INDEX idx_event_waitlist_event_id ON public.event_waitlist(event_id);
CREATE INDEX idx_event_waitlist_user_id ON public.event_waitlist(user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_event_ticket_tiers_updated_at
  BEFORE UPDATE ON public.event_ticket_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_event_seats_updated_at
  BEFORE UPDATE ON public.event_seats
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_event_reviews_updated_at
  BEFORE UPDATE ON public.event_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();