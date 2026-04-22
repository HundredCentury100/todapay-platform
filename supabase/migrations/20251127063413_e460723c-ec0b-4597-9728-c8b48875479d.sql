-- Phase 1: Critical Security Fixes (Final)

-- ========================================
-- Fix 1: Secure password_reset_tokens
-- ========================================
ALTER TABLE IF EXISTS public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Service role only access" ON public.password_reset_tokens;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Service role only access"
ON public.password_reset_tokens
FOR ALL 
USING (false)
WITH CHECK (false);

-- ========================================
-- Fix 2: Secure failed_login_attempts
-- ========================================
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins can view failed logins" ON public.failed_login_attempts;
  DROP POLICY IF EXISTS "System can log failures" ON public.failed_login_attempts;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Admins can view failed logins"
ON public.failed_login_attempts
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can log failures"
ON public.failed_login_attempts
FOR INSERT 
WITH CHECK (true);

-- ========================================
-- Fix 3: Lock down check-in functions
-- (Will be handled in edge function updates)
-- ========================================

-- Add comment for audit
COMMENT ON TABLE public.check_ins IS 'CHECK-IN SECURITY: Edge function must verify merchant/staff auth before allowing check-ins';
COMMENT ON TABLE public.check_outs IS 'CHECK-OUT SECURITY: Edge function must verify authorized staff before allowing check-outs';