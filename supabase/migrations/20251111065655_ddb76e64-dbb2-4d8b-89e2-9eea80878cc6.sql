-- Allow admins to view all merchant profiles
CREATE POLICY "Admins can view all merchant profiles"
  ON public.merchant_profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update all merchant profiles
CREATE POLICY "Admins can update all merchant profiles"
  ON public.merchant_profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all operator associations
CREATE POLICY "Admins can view all operator associations"
  ON public.operator_associations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert operator associations
CREATE POLICY "Admins can insert operator associations"
  ON public.operator_associations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update operator associations
CREATE POLICY "Admins can update operator associations"
  ON public.operator_associations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete operator associations
CREATE POLICY "Admins can delete operator associations"
  ON public.operator_associations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));