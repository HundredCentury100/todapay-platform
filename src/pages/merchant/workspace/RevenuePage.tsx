import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, CalendarCheck, Percent, BarChart3 } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, differenceInHours, parseISO, eachDayOfInterval } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const WorkspaceRevenuePage = () => {
  const { merchantProfile } = useMerchantAuth();
  const { convertPrice } = useCurrency();
  const [period, setPeriod] = useState("6");

  const { data, isLoading } = useQuery({
    queryKey: ['workspace-revenue', merchantProfile?.id, period],
    queryFn: async () => {
      if (!merchantProfile?.id) return null;

      const months = parseInt(period);
      const now = new Date();
      const startDate = startOfMonth(subMonths(now, months - 1));
      const endDate = endOfMonth(now);

      // Get workspaces with operating hours
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id, name, operating_hours')
        .eq('merchant_profile_id', merchantProfile.id)
        .eq('status', 'active');

      if (!workspaces || workspaces.length === 0) {
        return { 
          totalRevenue: 0, 
          thisMonthRevenue: 0, 
          totalBookings: 0, 
          avgValue: 0, 
          occupancyRate: 0,
          chartData: [] 
        };
      }

      const workspaceIds = workspaces.map(w => w.id);

      // Get all bookings in the period
      const { data: bookings } = await supabase
        .from('workspace_bookings')
        .select(`
          *,
          booking:booking_id (total_price, status, created_at)
        `)
        .in('workspace_id', workspaceIds)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const validBookings = (bookings || []).filter(b => b.booking?.status !== 'cancelled');

      // Calculate totals
      const totalRevenue = validBookings.reduce((sum, b) => sum + (b.booking?.total_price || 0), 0);
      
      const thisMonthStart = startOfMonth(now);
      const thisMonthBookings = validBookings.filter(b => 
        new Date(b.created_at) >= thisMonthStart
      );
      const thisMonthRevenue = thisMonthBookings.reduce((sum, b) => sum + (b.booking?.total_price || 0), 0);
      
      const avgValue = validBookings.length > 0 ? totalRevenue / validBookings.length : 0;

      // Calculate occupancy rate
      // Available hours = workspaces * 12 hours/day (default) * days in period
      const daysInPeriod = eachDayOfInterval({ start: startDate, end: endDate }).length;
      let totalAvailableHours = 0;

      workspaces.forEach(ws => {
        const opHours = ws.operating_hours as Record<string, { open: string; close: string }> | null;
        if (opHours) {
          // Calculate weekly hours then multiply by weeks
          let weeklyHours = 0;
          Object.values(opHours).forEach(day => {
            if (day) {
              const openHour = parseInt(day.open.split(':')[0]);
              const closeHour = parseInt(day.close.split(':')[0]);
              weeklyHours += (closeHour - openHour);
            }
          });
          totalAvailableHours += (weeklyHours / 7) * daysInPeriod;
        } else {
          // Default 12 hours/day
          totalAvailableHours += 12 * daysInPeriod;
        }
      });

      // Booked hours
      const bookedHours = validBookings.reduce((sum, b) => {
        if (b.start_datetime && b.end_datetime) {
          return sum + differenceInHours(parseISO(b.end_datetime), parseISO(b.start_datetime));
        }
        return sum;
      }, 0);

      const occupancyRate = totalAvailableHours > 0 ? (bookedHours / totalAvailableHours) * 100 : 0;

      // Generate chart data by month
      const monthIntervals = eachMonthOfInterval({ start: startDate, end: endDate });
      
      const chartData = monthIntervals.map(monthStart => {
        const monthEnd = endOfMonth(monthStart);
        const monthBookings = validBookings.filter(b => {
          const createdAt = new Date(b.created_at);
          return createdAt >= monthStart && createdAt <= monthEnd;
        });
        
        const monthRevenue = monthBookings.reduce((sum, b) => sum + (b.booking?.total_price || 0), 0);
        
        // Calculate monthly occupancy
        const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd }).length;
        let monthAvailableHours = 0;
        workspaces.forEach(ws => {
          const opHours = ws.operating_hours as Record<string, { open: string; close: string }> | null;
          if (opHours) {
            let weeklyHours = 0;
            Object.values(opHours).forEach(day => {
              if (day) {
                const openHour = parseInt(day.open.split(':')[0]);
                const closeHour = parseInt(day.close.split(':')[0]);
                weeklyHours += (closeHour - openHour);
              }
            });
            monthAvailableHours += (weeklyHours / 7) * monthDays;
          } else {
            monthAvailableHours += 12 * monthDays;
          }
        });
        
        const monthBookedHours = monthBookings.reduce((sum, b) => {
          if (b.start_datetime && b.end_datetime) {
            return sum + differenceInHours(parseISO(b.end_datetime), parseISO(b.start_datetime));
          }
          return sum;
        }, 0);
        
        const monthOccupancy = monthAvailableHours > 0 ? (monthBookedHours / monthAvailableHours) * 100 : 0;
        
        return {
          month: format(monthStart, 'MMM yyyy'),
          revenue: monthRevenue,
          occupancy: Math.min(monthOccupancy, 100)
        };
      });

      return {
        totalRevenue,
        thisMonthRevenue,
        totalBookings: validBookings.length,
        avgValue,
        occupancyRate: Math.min(occupancyRate, 100),
        chartData
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
          <p className="text-muted-foreground">Track your workspace revenue and occupancy</p>
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

      {/* Stats Cards */}
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
            <CardTitle className="text-sm font-medium">Occupancy</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.occupancyRate.toFixed(1) || '0'}%</div>
            <p className="text-xs text-muted-foreground">Average rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue & Occupancy Trends</CardTitle>
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
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? convertPrice(value) : `${value.toFixed(1)}%`,
                      name === 'revenue' ? 'Revenue' : 'Occupancy'
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
                    dataKey="occupancy"
                    name="Occupancy"
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

export default WorkspaceRevenuePage;
