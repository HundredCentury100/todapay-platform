import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plane, CalendarCheck, DollarSign, Users, TrendingUp, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { Link } from "react-router-dom";
import { format, startOfMonth, startOfDay, endOfDay, subDays, eachDayOfInterval } from "date-fns";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const AirlineDashboard = () => {
  const { merchantProfile } = useMerchantAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['airline-dashboard', merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return null;
      const now = new Date();
      const monthStart = startOfMonth(now);
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);

      // Get flight bookings via bookings table with vertical='flight'
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, total_price, status, payment_status, passenger_name, created_at, booking_reference, operator')
        .eq('vertical', 'flight')
        .order('created_at', { ascending: false })
        .limit(500);

      const allBookings = bookings || [];
      const monthlyBookings = allBookings.filter((b: any) => new Date(b.created_at) >= monthStart);
      const todayBookings = allBookings.filter((b: any) => {
        const d = new Date(b.created_at);
        return d >= todayStart && d <= todayEnd;
      });

      const monthlyRevenue = monthlyBookings
        .filter((b: any) => b.payment_status === 'paid')
        .reduce((sum: number, b: any) => sum + (b.total_price || 0), 0);

      // Chart data - last 7 days
      const days = eachDayOfInterval({ start: subDays(now, 6), end: now });
      const chartData = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayBookings = allBookings.filter((b: any) => format(new Date(b.created_at), 'yyyy-MM-dd') === dayStr);
        return {
          date: format(day, 'EEE'),
          bookings: dayBookings.length,
          revenue: dayBookings.filter((b: any) => b.payment_status === 'paid').reduce((s: number, b: any) => s + (b.total_price || 0), 0),
        };
      });

      return {
        totalBookings: allBookings.length,
        todayBookings: todayBookings.length,
        monthlyRevenue,
        totalPassengers: monthlyBookings.length,
        chartData,
        recentBookings: allBookings.slice(0, 5),
      };
    },
    enabled: !!merchantProfile?.id,
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Airline Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your flight operations and bookings</p>
        </div>
        <Button asChild size="sm">
          <Link to="/merchant/airline/flights">Manage Flights</Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Bookings</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold">{stats?.totalBookings || 0}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Today's Bookings</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold">{stats?.todayBookings || 0}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">New today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold">${(stats?.monthlyRevenue || 0).toFixed(2)}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Passengers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold">{stats?.totalPassengers || 0}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Weekly Booking Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(stats?.chartData?.some(d => d.bookings > 0)) ? (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={stats?.chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Legend />
                <Bar yAxisId="left" dataKey="bookings" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Bookings" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="Revenue ($)" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Add flights to see booking trends</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Bookings</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/merchant/airline/bookings">View All <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(stats?.recentBookings?.length || 0) === 0 ? (
            <p className="text-center text-muted-foreground py-6">No bookings yet</p>
          ) : (
            <div className="space-y-2">
              {stats?.recentBookings.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{b.passenger_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{b.booking_reference}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm">${(b.total_price || 0).toFixed(2)}</p>
                    <Badge variant={b.payment_status === 'paid' ? 'default' : 'secondary'} className="text-[10px]">
                      {b.payment_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AirlineDashboard;
