
-- FIX 4: split_payment_contributions - Restrict SELECT to own contributions
DROP POLICY IF EXISTS "Anyone can view contributions by email" ON public.split_payment_contributions;
CREATE POLICY "Users can view own contributions"
ON public.split_payment_contributions FOR SELECT TO authenticated
USING (
  participant_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR split_request_id IN (
    SELECT id FROM public.split_payment_requests WHERE organizer_user_id = auth.uid()
  )
);
