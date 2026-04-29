-- Fix transactions RLS to allow authenticated users to create transactions
-- Issue: RLS policy hardening migration restricted transaction creation to service_role only
-- This prevents users from creating bookings since transactions are created during booking process

-- Add policy to allow authenticated users to create transactions for their own bookings
CREATE POLICY "Authenticated users can create transactions for their bookings"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (
  -- User must own the booking
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

-- Add policy to allow anonymous users to create transactions for guest bookings
CREATE POLICY "Anonymous users can create transactions for guest bookings"
ON public.transactions FOR INSERT
TO anon
WITH CHECK (
  -- Allow if booking exists (guest checkout scenario)
  booking_id IN (
    SELECT id FROM public.bookings WHERE guest_email IS NOT NULL
  )
);

-- Add helpful comment
COMMENT ON TABLE public.transactions IS
'Payment transactions linked to bookings. RLS allows:
- service_role: full access
- authenticated: can create transactions for their own bookings
- anon: can create transactions for guest bookings';
