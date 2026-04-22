-- Drivers table for driver profiles and real-time status
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_profile_id UUID REFERENCES public.merchant_profiles(id),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  profile_photo_url TEXT,
  
  -- Vehicle info
  vehicle_type TEXT NOT NULL DEFAULT 'sedan',
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  vehicle_color TEXT,
  license_plate TEXT NOT NULL,
  vehicle_photo_url TEXT,
  
  -- Location and status
  current_lat NUMERIC,
  current_lng NUMERIC,
  last_location_update TIMESTAMP WITH TIME ZONE,
  is_online BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  current_ride_id UUID,
  
  -- Stats
  rating NUMERIC DEFAULT 5.0,
  total_rides INTEGER DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  acceptance_rate NUMERIC DEFAULT 100,
  cancellation_rate NUMERIC DEFAULT 0,
  
  -- Verification
  license_verified BOOLEAN DEFAULT false,
  insurance_verified BOOLEAN DEFAULT false,
  background_check_status TEXT DEFAULT 'pending',
  documents JSONB DEFAULT '{}',
  
  status TEXT NOT NULL DEFAULT 'pending_verification',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ride requests table
CREATE TABLE public.ride_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  passenger_id UUID REFERENCES auth.users(id),
  passenger_name TEXT NOT NULL,
  passenger_phone TEXT NOT NULL,
  
  -- Locations
  pickup_address TEXT NOT NULL,
  pickup_lat NUMERIC NOT NULL,
  pickup_lng NUMERIC NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_lat NUMERIC NOT NULL,
  dropoff_lng NUMERIC NOT NULL,
  
  -- Route info
  estimated_distance_km NUMERIC NOT NULL,
  estimated_duration_mins INTEGER NOT NULL,
  route_polyline TEXT,
  
  -- Pricing
  pricing_mode TEXT NOT NULL DEFAULT 'fixed', -- 'fixed' or 'negotiation'
  system_estimated_price NUMERIC NOT NULL,
  passenger_offered_price NUMERIC,
  final_price NUMERIC,
  surge_multiplier NUMERIC DEFAULT 1.0,
  currency TEXT DEFAULT 'ZAR',
  
  -- Vehicle preference
  vehicle_type TEXT DEFAULT 'any',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'searching',
  matched_driver_id UUID REFERENCES public.drivers(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ride bids for inDrive-style negotiation
CREATE TABLE public.ride_bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_request_id UUID NOT NULL REFERENCES public.ride_requests(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id),
  
  bid_amount NUMERIC NOT NULL,
  message TEXT,
  eta_minutes INTEGER NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, expired
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Active rides with real-time tracking
CREATE TABLE public.active_rides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_request_id UUID NOT NULL REFERENCES public.ride_requests(id),
  driver_id UUID NOT NULL REFERENCES public.drivers(id),
  passenger_id UUID REFERENCES auth.users(id),
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'driver_assigned', -- driver_assigned, driver_arriving, arrived_at_pickup, in_progress, completed, cancelled
  
  -- Times
  driver_assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  driver_arrived_at TIMESTAMP WITH TIME ZONE,
  pickup_time TIMESTAMP WITH TIME ZONE,
  dropoff_time TIMESTAMP WITH TIME ZONE,
  
  -- Real-time location
  current_driver_lat NUMERIC,
  current_driver_lng NUMERIC,
  
  -- Payment
  final_price NUMERIC,
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'pending',
  tip_amount NUMERIC DEFAULT 0,
  
  -- Safety
  share_code TEXT,
  emergency_triggered BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ride ratings (two-way)
CREATE TABLE public.ride_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.active_rides(id),
  rater_id UUID NOT NULL,
  ratee_id UUID NOT NULL,
  is_driver_rating BOOLEAN NOT NULL, -- true = passenger rating driver
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Driver earnings tracking
CREATE TABLE public.driver_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id),
  ride_id UUID REFERENCES public.active_rides(id),
  
  gross_amount NUMERIC NOT NULL,
  platform_fee_percentage NUMERIC NOT NULL DEFAULT 15,
  platform_fee_amount NUMERIC NOT NULL,
  net_amount NUMERIC NOT NULL,
  tip_amount NUMERIC DEFAULT 0,
  
  payout_status TEXT DEFAULT 'pending',
  payout_reference TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Surge pricing zones
CREATE TABLE public.surge_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_name TEXT NOT NULL,
  center_lat NUMERIC NOT NULL,
  center_lng NUMERIC NOT NULL,
  radius_km NUMERIC NOT NULL DEFAULT 5,
  
  current_multiplier NUMERIC DEFAULT 1.0,
  active_drivers INTEGER DEFAULT 0,
  active_requests INTEGER DEFAULT 0,
  
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surge_zones ENABLE ROW LEVEL SECURITY;

-- Drivers policies
CREATE POLICY "Drivers can view their own profile" ON public.drivers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Drivers can update their own profile" ON public.drivers
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Anyone can view online drivers" ON public.drivers
  FOR SELECT USING (is_online = true AND status = 'active');

CREATE POLICY "System can insert drivers" ON public.drivers
  FOR INSERT WITH CHECK (true);

-- Ride requests policies
CREATE POLICY "Passengers can create ride requests" ON public.ride_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Passengers can view their own requests" ON public.ride_requests
  FOR SELECT USING (passenger_id = auth.uid() OR passenger_id IS NULL);

CREATE POLICY "Drivers can view available requests" ON public.ride_requests
  FOR SELECT USING (status IN ('searching', 'bidding'));

CREATE POLICY "System can update ride requests" ON public.ride_requests
  FOR UPDATE USING (true);

-- Ride bids policies
CREATE POLICY "Drivers can create bids" ON public.ride_bids
  FOR INSERT WITH CHECK (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can view their bids" ON public.ride_bids
  FOR SELECT USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE POLICY "Passengers can view bids on their requests" ON public.ride_bids
  FOR SELECT USING (ride_request_id IN (SELECT id FROM public.ride_requests WHERE passenger_id = auth.uid()));

CREATE POLICY "System can update bids" ON public.ride_bids
  FOR UPDATE USING (true);

-- Active rides policies
CREATE POLICY "Participants can view their rides" ON public.active_rides
  FOR SELECT USING (
    passenger_id = auth.uid() OR 
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

CREATE POLICY "System can manage active rides" ON public.active_rides
  FOR ALL USING (true);

-- Ride ratings policies
CREATE POLICY "Anyone can create ratings for their rides" ON public.ride_ratings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view ratings" ON public.ride_ratings
  FOR SELECT USING (true);

-- Driver earnings policies
CREATE POLICY "Drivers can view their earnings" ON public.driver_earnings
  FOR SELECT USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE POLICY "System can manage earnings" ON public.driver_earnings
  FOR INSERT WITH CHECK (true);

-- Surge zones policies
CREATE POLICY "Anyone can view surge zones" ON public.surge_zones
  FOR SELECT USING (true);

CREATE POLICY "System can manage surge zones" ON public.surge_zones
  FOR ALL USING (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;

-- Function to update driver stats after ride completion
CREATE OR REPLACE FUNCTION public.update_driver_stats_after_ride()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.drivers
    SET 
      total_rides = total_rides + 1,
      total_earnings = total_earnings + COALESCE(NEW.final_price, 0),
      updated_at = now()
    WHERE id = NEW.driver_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_ride_completed
  AFTER UPDATE ON public.active_rides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_driver_stats_after_ride();

-- Function to update driver rating
CREATE OR REPLACE FUNCTION public.update_driver_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_driver_rating = true THEN
    UPDATE public.drivers
    SET rating = (
      SELECT AVG(rating)::NUMERIC(3,2)
      FROM public.ride_ratings rr
      JOIN public.active_rides ar ON rr.ride_id = ar.id
      WHERE ar.driver_id = (SELECT driver_id FROM public.active_rides WHERE id = NEW.ride_id)
      AND rr.is_driver_rating = true
    ),
    updated_at = now()
    WHERE id = (SELECT driver_id FROM public.active_rides WHERE id = NEW.ride_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;