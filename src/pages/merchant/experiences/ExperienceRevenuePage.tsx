import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, CalendarCheck, Users, BarChart3 } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const ExperienceRevenuePage = () => {
  const { merchantProfile } = useMerchantAuth();
  const { convertPrice } = useCurrency();
  const [period, setPeriod] = useState("6");

  const { data, isLoading } = useQuery({
    queryKey: ['experience-revenue', merchantProfile?.id, period],
    queryFn: async () => {
      if (!merchantProfile?.id) return null;

      const months = parseInt(period);
      const now = new Date();
      const startDate = startOfMonth(subMonths(now, months - 1));
      const endDate = endOfMonth(now);

      const { data: experiences } = await supabase
        .from('experiences')
        .select('id, name')
        .eq('merchant_profile_id', merchantProfile.id);

      if (!experiences || experiences.length === 0) {
        return { totalRevenue: 0, thisMonthRevenue: 0, totalBookings: 0, avgValue: 0, totalParticipants: 0, chartData: [] };
      }

      const experienceIds = experiences.map(e => e.id);

      // Get experience bookings in period
      const { data: expBookings } = await supabase
        .from('experience_bookings')
        .select('id, booking_id, num_participants, created_at')
        .in('experience_id', experienceIds)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const bookingIds = (expBookings || []).map(b => b.booking_id).filter(Boolean);

      let bookingDetails: any[] = [];
      if (bookingIds.length > 0) {
        const { data } = await supabase
          .from('bookings')
          .select('id, total_price, status, created_at')
          .in('id', bookingIds);
        bookingDetails = (data || []).filter(b => b.status !== 'cancelled');
      }

      const bookingPriceMap = new Map(bookingDetails.map(b => [b.id, b]));

      const totalRevenue = bookingDetails.reduce((sum, b) => sum + (b.total_price || 0), 0);
      const totalParticipants = (expBookings || []).reduce((sum, b) => sum + (b.num_participants || 0), 0);

      const thisMonthStart = startOfMonth(now);
      const thisMonthRevenue = bookingDetails
        .filter(b => new Date(b.created_at) >= thisMonthStart)
        .reduce((sum, b) => sum + (b.total_price || 0), 0);

      const avgValue = bookingDetails.length > 0 ? totalRevenue / bookingDetails.length : 0;

      // Chart data by month
      const monthIntervals = eachMonthOfInterval({ start: startDate, end: endDate });
      const chartData = monthIntervals.map(monthStart => {
        const monthEnd = endOfMonth(monthStart);
        const monthExpBookings = (expBookings || []).filter(b => {
          const d = new Date(b.created_at);
          return d >= monthStart && d <= monthEnd;
        });
        const monthBookingIds = monthExpBookings.map(b => b.booking_id);
        const monthRevenue = monthBookingIds.reduce((sum, id) => {
          const bk = bookingPriceMap.get(id);
          return sum + (bk?.total_price || 0);
        }, 0);
        const monthParticipants = monthExpBookings.reduce((sum, b) => sum + (b.num_participants || 0), 0);

        return {
          month: format(monthStart, 'MMM yyyy'),
          revenue: monthRevenue,
          participants: monthParticipants,
        };
      });

      return {
        totalRevenue,
        thisMonthRevenue,
        totalBookings: bookingDetails.length,
        avgValue,
        totalParticipants,
        chartData,
      };
    },
    enabled: !!merchantProfile?.id,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Revenue Analytics</h1>
          <p className="text-muted-foreground">Track your experience revenue and guest activity</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertPrice(data?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">Last {period} months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertPrice(data?.thisMonthRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">{format(new Date(), 'MMMM yyyy')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalBookings || 0}</div>
            <p className="text-xs text-muted-foreground">Last {period} months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Booking</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertPrice(data?.avgValue || 0)}</div>
            <p className="text-xs text-muted-foreground">Per booking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Guests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalParticipants || 0}</div>
            <p className="text-xs text-muted-foreground">Total participants</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue & Guest Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.chartData && data.chartData.length > 0 ? (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis
                    yAxisId="left"
                    className="text-xs"
                    tickFormatter={(value) => convertPrice(value)}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    className="text-xs"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? convertPrice(value) : value,
                      name === 'revenue' ? 'Revenue' : 'Guests'
                    ]}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    fill="hsl(var(--primary) / 0.2)"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="participants"
                    name="Guests"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-2))' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">No booking data available for this period</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExperienceRevenuePage;
