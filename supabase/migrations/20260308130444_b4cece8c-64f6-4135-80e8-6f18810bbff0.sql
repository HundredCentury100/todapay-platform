
-- Allow authenticated users to insert their own vouchers
CREATE POLICY "Users can insert own vouchers" ON public.user_vouchers
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Allow service role to insert promo usage (via RPCs)
CREATE POLICY "Service can insert promo usage" ON public.promo_code_usage
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
