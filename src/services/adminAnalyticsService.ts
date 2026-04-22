import { supabase } from "@/integrations/supabase/client";

export interface PlatformAnalytics {
  total_users: number;
  active_merchants: number;
  pending_merchants: number;
  total_bookings: number;
  total_revenue: number;
  new_users_30d: number;
  bookings_30d: number;
  revenue_30d: number;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
  bookings: number;
}

export interface AdminActivityLog {
  id: string;
  admin_user_id: string;
  action_type: string;
  action_description: string;
  target_user_id: string | null;
  target_resource_type: string | null;
  target_resource_id: string | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/**
 * Get platform-wide analytics
 */
export const getPlatformAnalytics = async (): Promise<PlatformAnalytics> => {
  const { data, error } = await supabase.rpc('get_platform_analytics');

  if (error) throw error;
  
  // The RPC returns an array with one row
  const analytics = data[0];
  
  return {
    total_users: Number(analytics.total_users),
    active_merchants: Number(analytics.active_merchants),
    pending_merchants: Number(analytics.pending_merchants),
    total_bookings: Number(analytics.total_bookings),
    total_revenue: Number(analytics.total_revenue),
    new_users_30d: Number(analytics.new_users_30d),
    bookings_30d: Number(analytics.bookings_30d),
    revenue_30d: Number(analytics.revenue_30d),
  };
};

/**
 * Get revenue by month for the last 12 months
 */
export const getRevenueByMonth = async (): Promise<RevenueByMonth[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select('created_at, total_price')
    .eq('payment_status', 'paid')
    .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Group by month
  const monthlyData: Record<string, { revenue: number; bookings: number }> = {};

  data.forEach((booking) => {
    const date = new Date(booking.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { revenue: 0, bookings: 0 };
    }
    
    monthlyData[monthKey].revenue += Number(booking.total_price);
    monthlyData[monthKey].bookings += 1;
  });

  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    revenue: data.revenue,
    bookings: data.bookings,
  }));
};

/**
 * Get recent admin activity logs
 */
export const getAdminActivityLogs = async (limit: number = 50): Promise<AdminActivityLog[]> => {
  const { data, error } = await supabase
    .from('admin_activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as AdminActivityLog[];
};

/**
 * Log an admin activity
 */
export const logAdminActivity = async (
  actionType: string,
  actionDescription: string,
  targetUserId?: string,
  targetResourceType?: string,
  targetResourceId?: string,
  metadata?: Record<string, any>
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('admin_activity_log')
    .insert({
      admin_user_id: user.id,
      action_type: actionType,
      action_description: actionDescription,
      target_user_id: targetUserId || null,
      target_resource_type: targetResourceType || null,
      target_resource_id: targetResourceId || null,
      metadata: metadata || {},
      ip_address: null, // Could be populated from request headers
      user_agent: navigator.userAgent,
    });

  if (error) throw error;
};
