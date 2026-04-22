
-- =====================================================
-- RLS POLICY HARDENING - PHASE 2 (Simplified)
-- Fix remaining public INSERT policies by checking parent booking
-- =====================================================

-- 1. Remove old group_bookings update policy
DROP POLICY IF EXISTS "Coordinators can update their group bookings" ON public.group_bookings;

-- 2. Fix car_bookings - link to parent booking ownership
DROP POLICY IF EXISTS "Users can create car bookings" ON public.car_bookings;
CREATE POLICY "Authenticated users can create car bookings"
ON public.car_bookings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = car_bookings.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

CREATE POLICY "Guest car bookings allowed"
ON public.car_bookings FOR INSERT
TO anon
WITH CHECK (true);

-- 3. Fix experience_bookings - link to parent booking
DROP POLICY IF EXISTS "Users can create experience bookings" ON public.experience_bookings;
CREATE POLICY "Authenticated experience bookings"
ON public.experience_bookings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = experience_bookings.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

CREATE POLICY "Guest experience bookings"
ON public.experience_bookings FOR INSERT
TO anon
WITH CHECK (true);

-- 4. Fix flight_bookings - link to parent booking
DROP POLICY IF EXISTS "Users can create flight bookings" ON public.flight_bookings;
CREATE POLICY "Authenticated flight bookings"
ON public.flight_bookings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = flight_bookings.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

CREATE POLICY "Guest flight bookings"
ON public.flight_bookings FOR INSERT
TO anon
WITH CHECK (true);

-- 5. Fix flight_searches
DROP POLICY IF EXISTS "Users can create flight searches" ON public.flight_searches;
CREATE POLICY "Authenticated flight searches"
ON public.flight_searches FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Guest flight searches"
ON public.flight_searches FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- 6. Fix group_bookings INSERT
DROP POLICY IF EXISTS "Anyone can create group bookings" ON public.group_bookings;
CREATE POLICY "Authenticated users can create group bookings"
ON public.group_bookings FOR INSERT
TO authenticated
WITH CHECK (true);

-- 7. Fix payment_plans - link to parent booking
DROP POLICY IF EXISTS "Users can create payment plans" ON public.payment_plans;
CREATE POLICY "Authenticated payment plans"
ON public.payment_plans FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = payment_plans.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- 8. Fix ride_ratings - already handled
DROP POLICY IF EXISTS "Anyone can create ratings for their rides" ON public.ride_ratings;

-- 9. Fix stay_bookings - link to parent booking
DROP POLICY IF EXISTS "Users can create stay bookings" ON public.stay_bookings;
CREATE POLICY "Authenticated stay bookings"
ON public.stay_bookings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = stay_bookings.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

CREATE POLICY "Guest stay bookings"
ON public.stay_bookings FOR INSERT
TO anon
WITH CHECK (true);

-- 10. Fix transfer_bookings - link to parent booking
DROP POLICY IF EXISTS "Users can create transfer bookings" ON public.transfer_bookings;
CREATE POLICY "Authenticated transfer bookings"
ON public.transfer_bookings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = transfer_bookings.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

CREATE POLICY "Guest transfer bookings"
ON public.transfer_bookings FOR INSERT
TO anon
WITH CHECK (true);

-- 11. Fix venue_bookings - link to parent booking
DROP POLICY IF EXISTS "Users can create venue bookings" ON public.venue_bookings;
CREATE POLICY "Authenticated venue bookings"
ON public.venue_bookings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = venue_bookings.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

CREATE POLICY "Guest venue bookings"
ON public.venue_bookings FOR INSERT
TO anon
WITH CHECK (true);

-- 12. Fix venue_quotes
DROP POLICY IF EXISTS "Anyone can create quote requests" ON public.venue_quotes;
CREATE POLICY "Authenticated venue quotes"
ON public.venue_quotes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Guest venue quotes"
ON public.venue_quotes FOR INSERT
TO anon
WITH CHECK (true);

-- 13. Fix workspace_bookings - link to parent booking
DROP POLICY IF EXISTS "Users can create workspace bookings" ON public.workspace_bookings;
CREATE POLICY "Authenticated workspace bookings"
ON public.workspace_bookings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = workspace_bookings.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

CREATE POLICY "Guest workspace bookings"
ON public.workspace_bookings FOR INSERT
TO anon
WITH CHECK (true);
