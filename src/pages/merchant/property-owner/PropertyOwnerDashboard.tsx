import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hotel, CalendarCheck, DollarSign, Star, TrendingUp, Users, ArrowRight, LogIn, LogOut } from "lucide-react";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { parseISO, isAfter, isBefore, isToday, format } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  totalProperties: number;
  activeBookings: number;
  revenue: number;
  avgRating: number;
  occupancyRate: number;
  recentGuests: { name: string; property: string; checkIn: string }[];
  checkInsToday: { name: string; property: string }[];
  checkOutsToday: { name: string; property: string }[];
  currentlyHosting: number;
  monthlyRevenue: { month: string; revenue: number }[];
}

const PropertyOwnerDashboard = () => {
  const { merchantProfile } = useMerchantAuth();
  const { convertPrice } = useCurrency();
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0, activeBookings: 0, revenue: 0,
    avgRating: 0, occupancyRate: 0, recentGuests: [],
    checkInsToday: [], checkOutsToday: [], currentlyHosting: 0,
    monthlyRevenue: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (merchantProfile?.id) fetchStats();
  }, [merchantProfile?.id]);

  const fetchStats = async () => {
    if (!merchantProfile?.id) return;
    try {
      const { data: properties } = await supabase
        .from('properties').select('id, name')
        .eq('merchant_profile_id', merchantProfile.id);

      if (!properties || properties.length === 0) { setLoading(false); return; }

      const propertyIds = properties.map(p => p.id);
      const propertyMap = new Map(properties.map(p => [p.id, p.name]));

      const [roomsRes, stayBookingsRes, reviewsRes] = await Promise.all([
        supabase.from('rooms').select('id, property_id, quantity')
          .in('property_id', propertyIds).eq('status', 'active'),
        supabase.from('stay_bookings').select(`
          *, booking:bookings(total_price, payment_status, status, passenger_name, created_at)
        `).in('property_id', propertyIds),
        supabase.from('reviews').select('rating, booking_id')
          .in('booking_id', 
            (await supabase.from('stay_bookings').select('booking_id').in('property_id', propertyIds))
              .data?.map(sb => sb.booking_id) || ['']
          ),
      ]);

      const rooms = roomsRes.data || [];
      const stayBookings = stayBookingsRes.data || [];
      const reviews = reviewsRes.data || [];
      const now = new Date();

      const paidBookings = stayBookings.filter(
        b => b.booking?.payment_status === 'paid' && b.booking?.status !== 'cancelled'
      );

      const activeBookings = stayBookings.filter(b => {
        const checkIn = parseISO(b.check_in_date);
        const checkOut = parseISO(b.check_out_date);
        return (isBefore(checkIn, now) || isToday(checkIn)) && 
               isAfter(checkOut, now) && b.booking?.status !== 'cancelled';
      });

      // Today's check-ins & check-outs
      const checkInsToday = stayBookings
        .filter(b => isToday(parseISO(b.check_in_date)) && b.booking?.status !== 'cancelled')
        .map(b => ({ name: b.booking?.passenger_name || 'Guest', property: propertyMap.get(b.property_id) || '' }));

      const checkOutsToday = stayBookings
        .filter(b => isToday(parseISO(b.check_out_date)) && b.booking?.status !== 'cancelled')
        .map(b => ({ name: b.booking?.passenger_name || 'Guest', property: propertyMap.get(b.property_id) || '' }));

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthRevenue = paidBookings
        .filter(b => parseISO(b.booking?.created_at || '') >= monthStart)
        .reduce((sum, b) => sum + (b.booking?.total_price || 0), 0);

      const avgRating = reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

      // Occupancy
      const totalRoomUnits = rooms.reduce((sum, r) => sum + (r.quantity || 1), 0);
      let bookedNights = 0;
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      paidBookings.forEach(b => {
        const ci = parseISO(b.check_in_date);
        const co = parseISO(b.check_out_date);
        const start = ci < thirtyDaysAgo ? thirtyDaysAgo : ci;
        const end = co > now ? now : co;
        if (end > start) {
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          bookedNights += days * (b.num_rooms || 1);
        }
      });
      const occupancyRate = totalRoomUnits > 0 
        ? Math.round((bookedNights / (totalRoomUnits * 30)) * 100) : 0;

      // Monthly revenue chart data (last 6 months)
      const monthlyRevData: { month: string; revenue: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const rev = paidBookings
          .filter(b => {
            const d = parseISO(b.booking?.created_at || '');
            return d >= m && d <= mEnd;
          })
          .reduce((sum, b) => sum + (b.booking?.total_price || 0), 0);
        monthlyRevData.push({ month: format(m, 'MMM'), revenue: rev });
      }

      const recentGuests = activeBookings.slice(0, 5).map(b => ({
        name: b.booking?.passenger_name || 'Guest',
        property: propertyMap.get(b.property_id) || 'Unknown',
        checkIn: b.check_in_date,
      }));

      setStats({
        totalProperties: properties.length,
        activeBookings: activeBookings.length,
        revenue: monthRevenue,
        avgRating,
        occupancyRate,
        recentGuests,
        checkInsToday,
        checkOutsToday,
        currentlyHosting: activeBookings.length,
        monthlyRevenue: monthlyRevData,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Property Dashboard</h1>
        <p className="text-muted-foreground">Manage your hotels, lodges, and accommodations</p>
      </div>

      {/* Today View */}
      {(stats.checkInsToday.length > 0 || stats.checkOutsToday.length > 0 || stats.currentlyHosting > 0) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <LogIn className="h-4 w-4 text-green-600" />
                  Check-ins ({stats.checkInsToday.length})
                </div>
                {stats.checkInsToday.length > 0 ? (
                  stats.checkInsToday.map((g, i) => (
                    <p key={i} className="text-sm text-muted-foreground pl-6">{g.name} • {g.property}</p>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground pl-6">No check-ins today</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <LogOut className="h-4 w-4 text-orange-600" />
                  Check-outs ({stats.checkOutsToday.length})
                </div>
                {stats.checkOutsToday.length > 0 ? (
                  stats.checkOutsToday.map((g, i) => (
                    <p key={i} className="text-sm text-muted-foreground pl-6">{g.name} • {g.property}</p>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground pl-6">No check-outs today</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4 text-primary" />
                  Currently Hosting
                </div>
                <p className="text-3xl font-bold pl-6">{stats.currentlyHosting}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Hotel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalProperties === 0 ? 'Add your first property' : 'Active listings'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBookings}</div>
            <p className="text-xs text-muted-foreground">Current guests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertPrice(stats.revenue)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '-'}
            </div>
            <p className="text-xs text-muted-foreground">From guest reviews</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Earnings Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Earnings (6 months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.monthlyRevenue.some(m => m.revenue > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [convertPrice(value), 'Revenue']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No revenue data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Occupancy Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Occupancy Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.totalProperties > 0 ? (
              <div>
                <div className="text-3xl font-bold">{stats.occupancyRate}%</div>
                <p className="text-sm text-muted-foreground mt-1">Last 30 days</p>
                <div className="w-full bg-muted rounded-full h-2 mt-3">
                  <div 
                    className="bg-primary rounded-full h-2 transition-all" 
                    style={{ width: `${Math.min(stats.occupancyRate, 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Add properties to see occupancy statistics</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Guests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Guests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentGuests.length > 0 ? (
            <div className="space-y-3">
              {stats.recentGuests.map((guest, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{guest.name}</p>
                    <p className="text-xs text-muted-foreground">{guest.property}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{guest.checkIn}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No recent guests</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyOwnerDashboard;
