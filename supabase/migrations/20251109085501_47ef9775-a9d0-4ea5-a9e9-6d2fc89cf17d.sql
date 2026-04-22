-- Drop the problematic view
DROP VIEW IF EXISTS public.platform_analytics;

-- Create a secure function to get platform analytics instead
CREATE OR REPLACE FUNCTION public.get_platform_analytics()
RETURNS TABLE (
  total_users BIGINT,
  active_merchants BIGINT,
  pending_merchants BIGINT,
  total_bookings BIGINT,
  total_revenue NUMERIC,
  new_users_30d BIGINT,
  bookings_30d BIGINT,
  revenue_30d NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM auth.users)::BIGINT as total_users,
    (SELECT COUNT(*) FROM public.merchant_profiles WHERE verification_status = 'verified')::BIGINT as active_merchants,
    (SELECT COUNT(*) FROM public.merchant_profiles WHERE verification_status = 'pending')::BIGINT as pending_merchants,
    (SELECT COUNT(*) FROM public.bookings)::BIGINT as total_bookings,
    (SELECT COALESCE(SUM(total_price), 0) FROM public.bookings WHERE payment_status = 'paid') as total_revenue,
    (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '30 days')::BIGINT as new_users_30d,
    (SELECT COUNT(*) FROM public.bookings WHERE created_at >= NOW() - INTERVAL '30 days')::BIGINT as bookings_30d,
    (SELECT COALESCE(SUM(total_price), 0) FROM public.bookings WHERE payment_status = 'paid' AND created_at >= NOW() - INTERVAL '30 days') as revenue_30d;
$$;

-- Revoke execute from public, grant only to authenticated
REVOKE EXECUTE ON FUNCTION public.get_platform_analytics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_platform_analytics() TO authenticated;