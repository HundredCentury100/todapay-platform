-- Add venue_owner to merchant_role enum
ALTER TYPE merchant_role ADD VALUE IF NOT EXISTS 'venue_owner';

-- Create venue_quotes table for quote request system
CREATE TABLE public.venue_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  expected_guests INTEGER NOT NULL,
  message TEXT,
  quoted_price NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.venue_quotes ENABLE ROW LEVEL SECURITY;

-- Policies for venue_quotes
CREATE POLICY "Venue owners can view their venue quotes"
ON public.venue_quotes
FOR SELECT
USING (venue_id IN (
  SELECT v.id FROM venues v
  JOIN merchant_profiles mp ON v.merchant_profile_id = mp.id
  WHERE mp.user_id = auth.uid()
));

CREATE POLICY "Venue owners can update their venue quotes"
ON public.venue_quotes
FOR UPDATE
USING (venue_id IN (
  SELECT v.id FROM venues v
  JOIN merchant_profiles mp ON v.merchant_profile_id = mp.id
  WHERE mp.user_id = auth.uid()
));

CREATE POLICY "Anyone can create quote requests"
ON public.venue_quotes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all quotes"
ON public.venue_quotes
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_venue_quotes_updated_at
BEFORE UPDATE ON public.venue_quotes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();