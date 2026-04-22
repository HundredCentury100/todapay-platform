
-- FIX: booking_actions - Remove unauthenticated access for guest bookings
DROP POLICY IF EXISTS "Users can request booking actions" ON public.booking_actions;
CREATE POLICY "Users can request booking actions"
ON public.booking_actions FOR INSERT TO authenticated
WITH CHECK (
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

-- FIX: event_waitlist - Don't expose anonymous entries
DROP POLICY IF EXISTS "Users can view own waitlist entries" ON public.event_waitlist;
CREATE POLICY "Users can view own waitlist entries"
ON public.event_waitlist FOR SELECT TO authenticated
USING (user_id = auth.uid());
