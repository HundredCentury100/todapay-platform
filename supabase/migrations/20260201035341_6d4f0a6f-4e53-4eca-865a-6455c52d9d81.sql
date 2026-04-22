-- Drop existing policies on ride_requests first
DROP POLICY IF EXISTS "Drivers can view available requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Passengers can view their own requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Passengers can create ride requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Matched drivers can update ride status" ON public.ride_requests;

-- Create or replace the is_active_driver function with correct column reference
CREATE OR REPLACE FUNCTION public.is_active_driver(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.drivers
    WHERE user_id = _user_id
      AND status = 'active'
      AND is_online = true
  )
$$;

-- RLS Policy: Passengers can view their own requests
CREATE POLICY "Passengers can view their own requests"
ON public.ride_requests
FOR SELECT
TO authenticated
USING (passenger_id = auth.uid());

-- RLS Policy: Active drivers can view searching/bidding requests OR their matched requests
CREATE POLICY "Drivers can view available or matched requests"
ON public.ride_requests
FOR SELECT
TO authenticated
USING (
  (public.is_active_driver(auth.uid()) AND status IN ('searching', 'bidding'))
  OR matched_driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);

-- RLS Policy: Passengers can create ride requests
CREATE POLICY "Passengers can create ride requests"
ON public.ride_requests
FOR INSERT
TO authenticated
WITH CHECK (passenger_id = auth.uid() OR passenger_id IS NULL);

-- RLS Policy: Matched drivers can update ride status
CREATE POLICY "Matched drivers can update ride status"
ON public.ride_requests
FOR UPDATE
TO authenticated
USING (
  matched_driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);

-- Drop and recreate the secure view for available ride requests
DROP VIEW IF EXISTS public.available_ride_requests;

CREATE VIEW public.available_ride_requests
WITH (security_invoker = on)
AS
SELECT 
  id,
  -- Mask passenger info for drivers viewing unassigned requests
  CASE 
    WHEN public.is_active_driver(auth.uid()) AND matched_driver_id IS NULL 
    THEN LEFT(passenger_name, 1) || '***' 
    ELSE passenger_name 
  END as passenger_name,
  CASE 
    WHEN public.is_active_driver(auth.uid()) AND matched_driver_id IS NULL 
    THEN '***-***-' || RIGHT(passenger_phone, 4)
    ELSE passenger_phone 
  END as passenger_phone,
  passenger_id,
  pickup_address,
  pickup_lat,
  pickup_lng,
  dropoff_address,
  dropoff_lat,
  dropoff_lng,
  estimated_distance_km,
  estimated_duration_mins,
  route_polyline,
  pricing_mode,
  system_estimated_price,
  passenger_offered_price,
  final_price,
  surge_multiplier,
  currency,
  vehicle_type,
  status,
  matched_driver_id,
  expires_at,
  created_at,
  updated_at,
  -- Mask recipient info similarly
  CASE 
    WHEN public.is_active_driver(auth.uid()) AND matched_driver_id IS NULL 
    THEN LEFT(COALESCE(recipient_name, ''), 1) || '***'
    ELSE recipient_name 
  END as recipient_name,
  CASE 
    WHEN public.is_active_driver(auth.uid()) AND matched_driver_id IS NULL 
    THEN '***-***-' || RIGHT(COALESCE(recipient_phone, ''), 4)
    ELSE recipient_phone 
  END as recipient_phone
FROM public.ride_requests
WHERE 
  -- User is the passenger
  passenger_id = auth.uid()
  -- OR user is an active driver viewing available requests
  OR (public.is_active_driver(auth.uid()) AND status IN ('searching', 'bidding'))
  -- OR user is the matched driver
  OR matched_driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid());