-- Add RLS policy for pending merchants to view their own profile and portal data
CREATE POLICY "Pending merchants can view their own profile"
ON public.merchant_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  AND verification_status IN ('pending', 'verified', 'rejected')
);

-- Update existing bookings policy to allow pending merchants to view bookings for their operators
CREATE POLICY "Pending merchants can view operator bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  operator IN (
    SELECT oa.operator_name
    FROM public.operator_associations oa
    JOIN public.merchant_profiles mp ON mp.id = oa.merchant_profile_id
    WHERE mp.user_id = auth.uid()
  )
);

-- Allow pending merchants to view events they organize
CREATE POLICY "Pending merchants can view their events"
ON public.events
FOR SELECT
TO authenticated
USING (
  organizer IN (
    SELECT oa.operator_name
    FROM public.operator_associations oa
    JOIN public.merchant_profiles mp ON mp.id = oa.merchant_profile_id
    WHERE mp.user_id = auth.uid()
  )
);