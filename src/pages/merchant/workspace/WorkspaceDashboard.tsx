import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Laptop, CalendarCheck, DollarSign, Users, TrendingUp, Clock, ArrowUpRight, ArrowDownRight, LogIn, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, differenceInHours, parseISO, eachDayOfInterval, isToday, startOfDay, endOfDay, subDays } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const WorkspaceDashboard = () => {
  const { merchantProfile } = useMerchantAuth();
  const { convertPrice } = useCurrency();
  const [chartRange, setChartRange] = useState<'7d' | '30d'>('7d');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['workspace-dashboard-stats', merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return null;

      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      const weekStart = startOfWeek(now);
      const weekEnd = endOfWeek(now);
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);

      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id, operating_hours')
        .eq('merchant_profile_id', merchantProfile.id);

      const workspacesCount = workspaces?.length || 0;
      const workspaceIds = workspaces?.map(w => w.id) || [];

      if (workspaceIds.length === 0) {
        return { workspacesCount: 0, activeBookings: 0, thisMonthRevenue: 0, lastMonthRevenue: 0, avgDuration: 0, occupancyRate: 0, recentBookings: [], todayCheckIns: 0, todayCheckOuts: 0, currentUsers: 0, earningsData: [] };
      }

      const { count: activeBookings } = await supabase
        .from('workspace_bookings')
        .select('*', { count: 'exact', head: true })
        .in('workspace_id', workspaceIds)
        .lte('start_datetime', now.toISOString())
        .gte('end_datetime', now.toISOString());

      // Today stats
      const { count: todayCheckIns } = await supabase
        .from('workspace_bookings')
        .select('*', { count: 'exact', head: true })
        .in('workspace_id', workspaceIds)
        .gte('start_datetime', todayStart.toISOString())
        .lte('start_datetime', todayEnd.toISOString());

      const { count: todayCheckOuts } = await supabase
        .from('workspace_bookings')
        .select('*', { count: 'exact', head: true })
        .in('workspace_id', workspaceIds)
        .gte('end_datetime', todayStart.toISOString())
        .lte('end_datetime', todayEnd.toISOString());

      const { data: thisMonthBookings } = await supabase
        .from('workspace_bookings')
        .select('booking_id, start_datetime, end_datetime, bookings(total_price)')
        .in('workspace_id', workspaceIds)
        .gte('created_at', thisMonthStart.toISOString())
        .lte('created_at', thisMonthEnd.toISOString());

      const thisMonthRevenue = thisMonthBookings?.reduce((sum, b) => sum + ((b.bookings as any)?.total_price || 0), 0) || 0;

      const { data: lastMonthBookings } = await supabase
        .from('workspace_bookings')
        .select('booking_id, bookings(total_price)')
        .in('workspace_id', workspaceIds)
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString());

      const lastMonthRevenue = lastMonthBookings?.reduce((sum, b) => sum + ((b.bookings as any)?.total_price || 0), 0) || 0;

      let totalDuration = 0;
      let durationCount = 0;
      thisMonthBookings?.forEach(b => {
        if (b.start_datetime && b.end_datetime) {
          totalDuration += differenceInHours(parseISO(b.end_datetime), parseISO(b.start_datetime));
          durationCount++;
        }
      });
      const avgDuration = durationCount > 0 ? totalDuration / durationCount : 0;

      // Weekly occupancy
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd }).length;
      let weekAvailableHours = 0;
      workspaces?.forEach(ws => {
        const opHours = ws.operating_hours as Record<string, { open: string; close: string }> | null;
        if (opHours) {
          let weeklyHours = 0;
          Object.values(opHours).forEach(day => {
            if (day) weeklyHours += (parseInt(day.close.split(':')[0]) - parseInt(day.open.split(':')[0]));
          });
          weekAvailableHours += weeklyHours;
        } else {
          weekAvailableHours += 12 * weekDays;
        }
      });

      const { data: weekBookings } = await supabase
        .from('workspace_bookings')
        .select('start_datetime, end_datetime')
        .in('workspace_id', workspaceIds)
        .gte('start_datetime', weekStart.toISOString())
        .lte('end_datetime', weekEnd.toISOString());

      const weekBookedHours = (weekBookings || []).reduce((sum, b) => {
        if (b.start_datetime && b.end_datetime) return sum + differenceInHours(parseISO(b.end_datetime), parseISO(b.start_datetime));
        return sum;
      }, 0);

      const occupancyRate = weekAvailableHours > 0 ? (weekBookedHours / weekAvailableHours) * 100 : 0;

      // Earnings chart data (last 7 or 30 days)
      const days = chartRange === '7d' ? 7 : 30;
      const { data: chartBookings } = await supabase
        .from('workspace_bookings')
        .select('created_at, bookings(total_price)')
        .in('workspace_id', workspaceIds)
        .gte('created_at', subDays(now, days).toISOString());

      const earningsMap: Record<string, number> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = format(subDays(now, i), 'MMM d');
        earningsMap[d] = 0;
      }
      chartBookings?.forEach(b => {
        const d = format(parseISO(b.created_at), 'MMM d');
        if (earningsMap[d] !== undefined) earningsMap[d] += (b.bookings as any)?.total_price || 0;
      });

      const earningsData = Object.entries(earningsMap).map(([date, revenue]) => ({ date, revenue }));

      const { data: recentBookings } = await supabase
        .from('workspace_bookings')
        .select('*, workspace:workspaces(name), booking:bookings(passenger_name, passenger_email, total_price, status)')
        .in('workspace_id', workspaceIds)
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        workspacesCount,
        activeBookings: activeBookings || 0,
        thisMonthRevenue,
        lastMonthRevenue,
        avgDuration,
        occupancyRate: Math.min(occupancyRate, 100),
        recentBookings: recentBookings || [],
        todayCheckIns: todayCheckIns || 0,
        todayCheckOuts: todayCheckOuts || 0,
        currentUsers: activeBookings || 0,
        earningsData,
      };
    },
    enabled: !!merchantProfile?.id,
  });

  const revenueChange = stats && stats.lastMonthRevenue > 0 
    ? ((stats.thisMonthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue * 100).toFixed(1)
    : 0;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (<Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workspace Dashboard</h1>
          <p className="text-muted-foreground">Manage your coworking spaces and remote workspaces</p>
        </div>
        <Link to="/merchant/workspace/spaces"><Button>Manage Workspaces</Button></Link>
      </div>

      {/* Today View */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <LogIn className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold">{stats?.todayCheckIns || 0}</span>
              </div>
              <p className="text-xs text-muted-foreground">Check-ins</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold">{stats?.currentUsers || 0}</span>
              </div>
              <p className="text-xs text-muted-foreground">Active Users</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <LogOut className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold">{stats?.todayCheckOuts || 0}</span>
              </div>
              <p className="text-xs text-muted-foreground">Check-outs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
            <Laptop className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.workspacesCount || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.workspacesCount === 0 ? 'Add your first workspace' : 'Total listings'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeBookings || 0}</div>
            <p className="text-xs text-muted-foreground">Current users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertPrice(stats?.thisMonthRevenue || 0)}</div>
            <div className="flex items-center text-xs">
              {Number(revenueChange) > 0 ? (
                <><ArrowUpRight className="h-3 w-3 text-green-500 mr-1" /><span className="text-green-500">{revenueChange}%</span></>
              ) : Number(revenueChange) < 0 ? (
                <><ArrowDownRight className="h-3 w-3 text-red-500 mr-1" /><span className="text-red-500">{Math.abs(Number(revenueChange))}%</span></>
              ) : null}
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgDuration ? `${stats.avgDuration.toFixed(1)} hrs` : '-'}</div>
            <p className="text-xs text-muted-foreground">Hours per booking</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Earnings Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Earnings</CardTitle>
              <div className="flex gap-1">
                <Button variant={chartRange === '7d' ? 'default' : 'ghost'} size="sm" className="text-xs h-7" onClick={() => setChartRange('7d')}>7D</Button>
                <Button variant={chartRange === '30d' ? 'default' : 'ghost'} size="sm" className="text-xs h-7" onClick={() => setChartRange('30d')}>30D</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.earningsData && stats.earningsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.earningsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No earnings data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Occupancy + Recent */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Occupancy Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-primary">{stats?.occupancyRate?.toFixed(1) || '0'}%</div>
                <p className="text-sm text-muted-foreground mt-1">This week's average</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentBookings && stats.recentBookings.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentBookings.map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium text-sm">{booking.booking?.passenger_name}</p>
                        <p className="text-xs text-muted-foreground">{booking.workspace?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{convertPrice(booking.booking?.total_price || 0)}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(booking.start_datetime), 'MMM d')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No recent bookings</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceDashboard;
