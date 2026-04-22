
-- Allow authenticated users to find pending telegram links by code
CREATE POLICY "Users can find pending links by code"
  ON public.telegram_user_links
  FOR SELECT TO authenticated
  USING (status = 'pending' AND link_code IS NOT NULL);

-- Allow authenticated users to claim pending telegram links
CREATE POLICY "Users can claim pending links"
  ON public.telegram_user_links
  FOR UPDATE TO authenticated
  USING (status = 'pending' AND link_code IS NOT NULL)
  WITH CHECK (user_id = auth.uid());
