
-- Fix: Remove overly permissive policy (service_role bypasses RLS anyway)
DROP POLICY IF EXISTS "Service role can manage sms_logs" ON public.sms_logs;
