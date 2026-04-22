import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Common filter interface used across multiple services
 */
export interface DateRangeFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  search?: string;
}

/**
 * Apply date range filters to a Supabase query
 * Reduces code duplication in service files
 */
export function applyDateFilters(
  query: any,
  filters: DateRangeFilters | undefined,
  dateColumn: string = 'created_at'
): any {
  if (!filters) return query;

  if (filters.dateFrom) {
    query = query.gte(dateColumn, filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte(dateColumn, filters.dateTo);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.search) {
    query = query.or(
      `booking_reference.ilike.%${filters.search}%,passenger_name.ilike.%${filters.search}%`
    );
  }

  return query;
}

/**
 * Calculate revenue statistics from booking data
 * Consolidated from multiple service files
 */
export function calculateRevenueStats(bookings: any[]) {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisWeek = new Date(now);
  thisWeek.setDate(now.getDate() - 7);

  const totalRevenue = bookings
    .filter(b => b.payment_status === 'paid')
    .reduce((sum, b) => sum + Number(b.total_price || 0), 0);

  const monthlyRevenue = bookings
    .filter(b => new Date(b.created_at) >= thisMonth && b.payment_status === 'paid')
    .reduce((sum, b) => sum + Number(b.total_price || 0), 0);

  const weeklyRevenue = bookings
    .filter(b => new Date(b.created_at) >= thisWeek && b.payment_status === 'paid')
    .reduce((sum, b) => sum + Number(b.total_price || 0), 0);

  const pendingRevenue = bookings
    .filter(b => b.payment_status === 'pending')
    .reduce((sum, b) => sum + Number(b.total_price || 0), 0);

  return {
    totalRevenue,
    monthlyRevenue,
    weeklyRevenue,
    pendingRevenue,
  };
}

/**
 * Aggregate customer data from bookings
 * Consolidated from operatorService
 */
export function aggregateCustomerData(bookings: any[]) {
  const customerMap = new Map();
  
  bookings.forEach(booking => {
    const key = booking.passenger_email;
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        name: booking.passenger_name,
        email: booking.passenger_email,
        phone: booking.passenger_phone,
        totalBookings: 0,
        totalSpent: 0,
        lastBooking: booking.created_at,
      });
    }
    const customer = customerMap.get(key);
    customer.totalBookings++;
    customer.totalSpent += Number(booking.total_price || 0);
    if (new Date(booking.created_at) > new Date(customer.lastBooking)) {
      customer.lastBooking = booking.created_at;
    }
  });

  return Array.from(customerMap.values());
}

/**
 * Generate a unique transaction reference
 * Standardized format across the platform
 */
export function generateTransactionReference(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}
