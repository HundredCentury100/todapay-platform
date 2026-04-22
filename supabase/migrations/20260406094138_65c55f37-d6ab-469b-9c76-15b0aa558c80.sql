
-- Add booking_id and payment_link_code to venue_quotes
ALTER TABLE public.venue_quotes
  ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id),
  ADD COLUMN IF NOT EXISTS payment_link_code text UNIQUE;

-- Index for fast lookup by payment_link_code
CREATE INDEX IF NOT EXISTS idx_venue_quotes_payment_link_code
  ON public.venue_quotes(payment_link_code)
  WHERE payment_link_code IS NOT NULL;
