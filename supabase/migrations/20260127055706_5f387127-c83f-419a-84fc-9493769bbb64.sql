
-- =====================================================
-- RLS POLICY HARDENING MIGRATION (Corrected)
-- Fixes overly permissive INSERT/UPDATE policies
-- =====================================================

-- 1. Fix group_bookings - coordinators should only update their own
DROP POLICY IF EXISTS "Coordinators can update their own group bookings" ON public.group_bookings;
CREATE POLICY "Coordinators can update their own group bookings"
ON public.group_bookings FOR UPDATE
TO authenticated
USING (coordinator_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
WITH CHECK (coordinator_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 2. Fix ride_ratings - use rater_id column
DROP POLICY IF EXISTS "Users can rate their own rides" ON public.ride_ratings;
CREATE POLICY "Users can rate their own rides"
ON public.ride_ratings FOR INSERT
TO authenticated
WITH CHECK (rater_id = auth.uid());

-- 3. Fix ride_requests - use passenger_id column (correct column name)
DROP POLICY IF EXISTS "Authenticated passengers can create ride requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Passengers can create ride requests" ON public.ride_requests;
CREATE POLICY "Authenticated passengers can create ride requests"
ON public.ride_requests FOR INSERT
TO authenticated
WITH CHECK (passenger_id = auth.uid());

-- 4. Fix check_outs - require authenticated, not public
DROP POLICY IF EXISTS "Authenticated users can create check-outs" ON public.check_outs;
DROP POLICY IF EXISTS "Anyone can create check-outs" ON public.check_outs;
CREATE POLICY "Authenticated users can create check-outs"
ON public.check_outs FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. Fix event_waitlist - allow authenticated and anonymous with email
DROP POLICY IF EXISTS "Authenticated users can join waitlist" ON public.event_waitlist;
DROP POLICY IF EXISTS "Anonymous users can join waitlist with email" ON public.event_waitlist;
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.event_waitlist;

CREATE POLICY "Authenticated users can join waitlist"
ON public.event_waitlist FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Anonymous users can join waitlist with email"
ON public.event_waitlist FOR INSERT
TO anon
WITH CHECK (user_id IS NULL AND email IS NOT NULL);

-- 6. Fix merchant_chat_messages - require authenticated
DROP POLICY IF EXISTS "Authenticated users can insert chat messages" ON public.merchant_chat_messages;
DROP POLICY IF EXISTS "Anyone can insert chat messages" ON public.merchant_chat_messages;
CREATE POLICY "Authenticated users can insert chat messages"
ON public.merchant_chat_messages FOR INSERT
TO authenticated
WITH CHECK (true);

-- 7. Fix booking_addons - tighten to authenticated users
DROP POLICY IF EXISTS "Users can create booking addons for their bookings" ON public.booking_addons;
DROP POLICY IF EXISTS "Anonymous users can create booking addons" ON public.booking_addons;
DROP POLICY IF EXISTS "Users can create booking addons" ON public.booking_addons;

CREATE POLICY "Authenticated users can create booking addons"
ON public.booking_addons FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = booking_addons.booking_id 
    AND (bookings.user_id = auth.uid() OR bookings.guest_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
);

-- Allow anonymous booking addon creation for guest checkouts
CREATE POLICY "Anonymous booking addons allowed"
ON public.booking_addons FOR INSERT
TO anon
WITH CHECK (true);

-- 8. Fix ride_requests UPDATE - only passenger and service_role
DROP POLICY IF EXISTS "Service role can update ride requests" ON public.ride_requests;
DROP POLICY IF EXISTS "Passengers can update their own ride requests" ON public.ride_requests;
DROP POLICY IF EXISTS "System can update ride requests" ON public.ride_requests;

CREATE POLICY "Service role can update ride requests"
ON public.ride_requests FOR UPDATE
TO service_role
USING (true);

CREATE POLICY "Passengers can update their own ride requests"
ON public.ride_requests FOR UPDATE
TO authenticated
USING (passenger_id = auth.uid())
WITH CHECK (passenger_id = auth.uid());

-- 9. Fix ride_bids - only service_role should update
DROP POLICY IF EXISTS "Service role can update bids" ON public.ride_bids;
DROP POLICY IF EXISTS "System can update bids" ON public.ride_bids;
CREATE POLICY "Service role can update bids"
ON public.ride_bids FOR UPDATE
TO service_role
USING (true);

-- 10. Fix driver_earnings - only service_role
DROP POLICY IF EXISTS "Service role can manage earnings" ON public.driver_earnings;
DROP POLICY IF EXISTS "System can manage earnings" ON public.driver_earnings;
CREATE POLICY "Service role can manage earnings"
ON public.driver_earnings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 11. Fix drivers - only service_role should insert
DROP POLICY IF EXISTS "Service role can insert drivers" ON public.drivers;
DROP POLICY IF EXISTS "System can insert drivers" ON public.drivers;
CREATE POLICY "Service role can insert drivers"
ON public.drivers FOR INSERT
TO service_role
WITH CHECK (true);

-- 12. Fix transactions - only service_role
DROP POLICY IF EXISTS "Service role can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "System can create transactions" ON public.transactions;
CREATE POLICY "Service role can create transactions"
ON public.transactions FOR INSERT
TO service_role
WITH CHECK (true);

-- 13. Fix notification_log - only service_role
DROP POLICY IF EXISTS "System can insert notifications" ON public.notification_log;

-- 14. Remove overly permissive agent_commissions policy (keep service_role only)
DROP POLICY IF EXISTS "System can insert commissions" ON public.agent_commissions;
