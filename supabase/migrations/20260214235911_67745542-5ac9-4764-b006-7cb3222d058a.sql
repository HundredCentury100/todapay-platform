-- Fix all recursive user_roles policies across all tables
-- Replace EXISTS(SELECT FROM user_roles) with has_role() SECURITY DEFINER function

-- admin_activity_log
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.admin_activity_log;
CREATE POLICY "Admins can view all activity logs" ON public.admin_activity_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "System can insert activity logs" ON public.admin_activity_log;
CREATE POLICY "System can insert activity logs" ON public.admin_activity_log
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- admin_impersonation_logs
DROP POLICY IF EXISTS "Admins can view impersonation logs" ON public.admin_impersonation_logs;
CREATE POLICY "Admins can view impersonation logs" ON public.admin_impersonation_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update impersonation logs" ON public.admin_impersonation_logs;
CREATE POLICY "Admins can update impersonation logs" ON public.admin_impersonation_logs
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can create impersonation logs" ON public.admin_impersonation_logs;
CREATE POLICY "Admins can create impersonation logs" ON public.admin_impersonation_logs
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- kyc_documents
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON public.kyc_documents;
CREATE POLICY "Admins can view all KYC documents" ON public.kyc_documents
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update KYC documents" ON public.kyc_documents;
CREATE POLICY "Admins can update KYC documents" ON public.kyc_documents
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- merchant_activity_logs
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.merchant_activity_logs;
CREATE POLICY "Admins can view all activity logs" ON public.merchant_activity_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- support_tickets
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
CREATE POLICY "Admins can view all tickets" ON public.support_tickets
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all tickets" ON public.support_tickets;
CREATE POLICY "Admins can update all tickets" ON public.support_tickets
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ticket_messages - more complex, need OR conditions
DROP POLICY IF EXISTS "Users can view messages for their tickets" ON public.ticket_messages;
CREATE POLICY "Users can view messages for their tickets" ON public.ticket_messages
  FOR SELECT TO authenticated
  USING (
    (ticket_id IN (
      SELECT support_tickets.id FROM support_tickets
      WHERE support_tickets.merchant_profile_id IN (
        SELECT merchant_profiles.id FROM merchant_profiles
        WHERE merchant_profiles.user_id = auth.uid()
      )
    ))
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Users can create messages for their tickets" ON public.ticket_messages;
CREATE POLICY "Users can create messages for their tickets" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    (ticket_id IN (
      SELECT support_tickets.id FROM support_tickets
      WHERE support_tickets.merchant_profile_id IN (
        SELECT merchant_profiles.id FROM merchant_profiles
        WHERE merchant_profiles.user_id = auth.uid()
      )
    ))
    OR public.has_role(auth.uid(), 'admin')
  );

-- storage.objects - KYC files
DROP POLICY IF EXISTS "Admins can view all KYC files" ON storage.objects;
CREATE POLICY "Admins can view all KYC files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'kyc_documents' AND public.has_role(auth.uid(), 'admin'));
