
-- Admin (service_role) can read all vouchers and usage for management
-- Since admins use has_role, create policies for admin access
CREATE POLICY "Admins can read all promo codes" ON public.promo_codes
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage promo codes" ON public.promo_codes
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read all vouchers" ON public.user_vouchers
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read all promo usage" ON public.promo_code_usage
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
