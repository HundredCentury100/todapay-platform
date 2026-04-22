import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass, CalendarCheck, DollarSign, Users, TrendingUp, Star, Clock, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const ExperiencesDashboard = () => {
  const { merchantProfile } = useMerchantAuth();
  const { convertPrice } = useCurrency();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['experiences-dashboard-stats', merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return null;
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);

      const { data: experiences } = await supabase.from('experiences').select('id, status').eq('merchant_profile_id', merchantProfile.id);
      const experienceCount = experiences?.length || 0;
      const activeCount = experiences?.filter(e => e.status === 'active').length || 0;
      const experienceIds = experiences?.map(e => e.id) || [];

      if (experienceIds.length === 0) {
        return { experienceCount: 0, activeCount: 0, bookingsThisMonth: 0, revenueThisMonth: 0, avgRating: null, recentBookings: [], todayBookings: 0, totalGuests: 0, weeklyData: [] };
      }

      const { data: allExpBookings } = await supabase.from('experience_bookings').select('id, experience_id, num_participants, created_at, booking_id').in('experience_id', experienceIds);
      
      const monthBookings = (allExpBookings || []).filter(b => new Date(b.created_at) >= monthStart && new Date(b.created_at) <= monthEnd);
      const todayBookings = (allExpBookings || []).filter(b => new Date(b.created_at) >= todayStart && new Date(b.created_at) <= todayEnd);
      const totalGuests = monthBookings.reduce((sum, b) => sum + (b.num_participants || 0), 0);

      const bIds = monthBookings.map(b => b.booking_id).filter(Boolean) as string[];
      let revenueThisMonth = 0;
      if (bIds.length > 0) {
        const { data: bookingDetails } = await supabase.from('bookings').select('id, total_price, status').in('id', bIds);
        (bookingDetails || []).forEach(b => { if (b.status !== 'cancelled') revenueThisMonth += b.total_price || 0; });
      }

      // Recent bookings
      const recentBookings: any[] = [];
      const recentSlice = (allExpBookings || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
      for (const eb of recentSlice) {
        const { data: exp } = await supabase.from('experiences').select('name').eq('id', eb.experience_id).single();
        const { data: bk } = await supabase.from('bookings').select('passenger_name, total_price, status').eq('id', eb.booking_id).single();
        recentBookings.push({ ...eb, experience: exp, booking: bk });
      }

      // Weekly chart data
      const weeklyData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - 6 + i);
        const dayStr = format(d, 'EEE');
        const dayBookings = (allExpBookings || []).filter(b => format(new Date(b.created_at), 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd'));
        return { day: dayStr, bookings: dayBookings.length, guests: dayBookings.reduce((s, b) => s + (b.num_participants || 0), 0) };
      });

      return { experienceCount, activeCount, bookingsThisMonth: monthBookings.length, revenueThisMonth, avgRating: null, recentBookings, todayBookings: todayBookings.length, totalGuests, weeklyData };
    },
    enabled: !!merchantProfile?.id,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map(i => <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>)}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Experiences Dashboard</h1>
          <p className="text-muted-foreground">Manage your tours, activities, and local experiences</p>
        </div>
        <Link to="/merchant/experiences/list"><Button>Manage Experiences</Button></Link>
      </div>

      {/* Today View */}
      {stats && stats.experienceCount > 0 && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Today</h3>
              <Badge variant="secondary" className="text-xs">{format(new Date(), 'EEEE, MMM d')}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-2xl font-bold">{stats.todayBookings}</p><p className="text-xs text-muted-foreground">New bookings</p></div>
              <div><p className="text-2xl font-bold">{stats.activeCount}</p><p className="text-xs text-muted-foreground">Active experiences</p></div>
              <div><p className="text-2xl font-bold">{stats.totalGuests}</p><p className="text-xs text-muted-foreground">Guests this month</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Experiences</CardTitle>
            <Compass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.experienceCount || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.activeCount || 0} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.bookingsThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertPrice(stats?.revenueThisMonth || 0)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgRating ? stats.avgRating.toFixed(1) : '-'}</div>
            <p className="text-xs text-muted-foreground">From guest reviews</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Booking Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Booking Trends (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.weeklyData && stats.weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={stats.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="bookings" name="Bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="guests" name="Guests" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Add experiences to see trends</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Guests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Recent Guests</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentBookings && stats.recentBookings.length > 0 ? (
              <div className="space-y-3">
                {stats.recentBookings.map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between border-b border-border/30 pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{booking.booking?.passenger_name}</p>
                      <p className="text-xs text-muted-foreground">{booking.experience?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{convertPrice(booking.booking?.total_price || 0)}</p>
                      <p className="text-xs text-muted-foreground">{booking.num_participants} guest{booking.num_participants !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent guests</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExperiencesDashboard;
