-- Create venue_blocked_dates table for manual availability blocks
CREATE TABLE public.venue_blocked_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT NOT NULL DEFAULT 'Unavailable',
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT, -- e.g., 'weekly', 'monthly'
  recurrence_day_of_week INTEGER, -- 0-6 for Sunday-Saturday
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure end is after start
  CONSTRAINT valid_datetime_range CHECK (end_datetime > start_datetime)
);

-- Create indexes for efficient lookups
CREATE INDEX idx_venue_blocked_dates_venue_id ON public.venue_blocked_dates(venue_id);
CREATE INDEX idx_venue_blocked_dates_datetime ON public.venue_blocked_dates(start_datetime, end_datetime);

-- Enable Row Level Security
ALTER TABLE public.venue_blocked_dates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view blocked dates (needed for availability checks)
CREATE POLICY "Anyone can view venue blocked dates"
ON public.venue_blocked_dates
FOR SELECT
USING (true);

-- Policy: Venue owners can manage their own blocked dates
CREATE POLICY "Venue owners can insert blocked dates"
ON public.venue_blocked_dates
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM venues v
    JOIN merchant_profiles mp ON v.merchant_profile_id = mp.id
    WHERE v.id = venue_id AND mp.user_id = auth.uid()
  )
);

CREATE POLICY "Venue owners can update blocked dates"
ON public.venue_blocked_dates
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM venues v
    JOIN merchant_profiles mp ON v.merchant_profile_id = mp.id
    WHERE v.id = venue_id AND mp.user_id = auth.uid()
  )
);

CREATE POLICY "Venue owners can delete blocked dates"
ON public.venue_blocked_dates
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM venues v
    JOIN merchant_profiles mp ON v.merchant_profile_id = mp.id
    WHERE v.id = venue_id AND mp.user_id = auth.uid()
  )
);