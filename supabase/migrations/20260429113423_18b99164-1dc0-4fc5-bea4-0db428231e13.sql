DROP POLICY IF EXISTS "Authenticated users can create transactions for their bookings" ON public.transactions;
DROP POLICY IF EXISTS "Anonymous users can create transactions for guest bookings" ON public.transactions;

CREATE POLICY "Authenticated users can create transactions for their bookings"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Anonymous users can create transactions for guest bookings"
ON public.transactions FOR INSERT
TO anon
WITH CHECK (
  booking_id IN (
    SELECT id FROM public.bookings WHERE guest_email IS NOT NULL
  )
);

COMMENT ON TABLE public.transactions IS
'Payment transactions linked to bookings. RLS allows: service_role full access; authenticated can create transactions for their own bookings; anon can create transactions for guest bookings.';