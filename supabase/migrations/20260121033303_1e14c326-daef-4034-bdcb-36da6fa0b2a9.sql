-- Create ride_cancellations table for tracking all cancellation events
CREATE TABLE public.ride_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_request_id UUID REFERENCES public.ride_requests(id),
  active_ride_id UUID REFERENCES public.active_rides(id),
  cancelled_by TEXT NOT NULL CHECK (cancelled_by IN ('passenger', 'driver')),
  cancellation_reason TEXT NOT NULL,
  cancellation_time TIMESTAMPTZ DEFAULT NOW(),
  ride_status_at_cancel TEXT NOT NULL,
  minutes_after_match INTEGER,
  penalty_applied BOOLEAN DEFAULT false,
  penalty_credits INTEGER DEFAULT 0,
  refund_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add cancellation columns to ride_requests
ALTER TABLE public.ride_requests ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE public.ride_requests ADD COLUMN IF NOT EXISTS cancelled_by TEXT;
ALTER TABLE public.ride_requests ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Add payment collection columns to active_rides for driver confirmation
ALTER TABLE public.active_rides ADD COLUMN IF NOT EXISTS payment_collected_by_driver BOOLEAN DEFAULT false;
ALTER TABLE public.active_rides ADD COLUMN IF NOT EXISTS payment_collected_amount NUMERIC;
ALTER TABLE public.active_rides ADD COLUMN IF NOT EXISTS payment_collected_method TEXT;
ALTER TABLE public.active_rides ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- Enable RLS on ride_cancellations
ALTER TABLE public.ride_cancellations ENABLE ROW LEVEL SECURITY;

-- Passengers can view their own cancellations
CREATE POLICY "Users can view their own cancellations as passenger"
ON public.ride_cancellations
FOR SELECT
USING (
  ride_request_id IN (
    SELECT id FROM public.ride_requests WHERE passenger_id = auth.uid()
  )
);

-- Drivers can view cancellations for their rides
CREATE POLICY "Drivers can view their ride cancellations"
ON public.ride_cancellations
FOR SELECT
USING (
  active_ride_id IN (
    SELECT id FROM public.active_rides WHERE driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  )
);

-- Users can insert cancellations for their rides
CREATE POLICY "Users can create cancellations"
ON public.ride_cancellations
FOR INSERT
WITH CHECK (
  (cancelled_by = 'passenger' AND ride_request_id IN (
    SELECT id FROM public.ride_requests WHERE passenger_id = auth.uid()
  ))
  OR
  (cancelled_by = 'driver' AND active_ride_id IN (
    SELECT id FROM public.active_rides WHERE driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  ))
);

-- Add driver cancellation tracking columns
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS cancellations_this_week INTEGER DEFAULT 0;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS last_cancellation_reset TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS suspension_until TIMESTAMPTZ;

-- Enable realtime for cancellations
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_cancellations;