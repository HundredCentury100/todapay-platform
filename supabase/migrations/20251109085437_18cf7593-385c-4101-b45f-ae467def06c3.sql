-- Create admin activity log table
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_resource_type TEXT,
  target_resource_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all activity logs
CREATE POLICY "Admins can view all activity logs"
ON public.admin_activity_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow system to insert activity logs
CREATE POLICY "System can insert activity logs"
ON public.admin_activity_log
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create index for performance
CREATE INDEX idx_admin_activity_log_admin_user ON public.admin_activity_log(admin_user_id);
CREATE INDEX idx_admin_activity_log_created_at ON public.admin_activity_log(created_at DESC);
CREATE INDEX idx_admin_activity_log_action_type ON public.admin_activity_log(action_type);

-- Create platform analytics view for admins
CREATE OR REPLACE VIEW public.platform_analytics AS
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.merchant_profiles WHERE verification_status = 'verified') as active_merchants,
  (SELECT COUNT(*) FROM public.merchant_profiles WHERE verification_status = 'pending') as pending_merchants,
  (SELECT COUNT(*) FROM public.bookings) as total_bookings,
  (SELECT COALESCE(SUM(total_price), 0) FROM public.bookings WHERE payment_status = 'paid') as total_revenue,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30d,
  (SELECT COUNT(*) FROM public.bookings WHERE created_at >= NOW() - INTERVAL '30 days') as bookings_30d,
  (SELECT COALESCE(SUM(total_price), 0) FROM public.bookings WHERE payment_status = 'paid' AND created_at >= NOW() - INTERVAL '30 days') as revenue_30d;

-- Allow admins to view analytics
GRANT SELECT ON public.platform_analytics TO authenticated;