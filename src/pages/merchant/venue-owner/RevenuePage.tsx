import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DollarSign, TrendingUp, CalendarCheck, Percent } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, Legend } from "recharts";
import { format, subMonths, subDays, startOfMonth, endOfMonth, parseISO, differenceInHours } from "date-fns";

interface RevenueStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
  occupancyRate: number;
}

interface RevenueData {
  month: string;
  revenue: number;
  occupancy: number;
}

const RevenuePage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalBookings: 0,
    averageBookingValue: 0,
    occupancyRate: 0,
  });
  const [chartData, setChartData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("6");

  useEffect(() => {
    const fetchRevenue = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('merchant_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) return;

        // Get venues
        const { data: venues } = await supabase
          .from('venues')
          .select('id, min_hours')
          .eq('merchant_profile_id', profile.id);

        if (!venues || venues.length === 0) {
          setLoading(false);
          return;
        }

        const venueIds = venues.map(v => v.id);

        // Get all venue bookings with their main booking data
        const { data: venueBookings } = await supabase
          .from('venue_bookings')
          .select(`
            start_datetime,
            end_datetime,
            venue_id,
            booking:bookings(total_price, created_at, status)
          `)
          .in('venue_id', venueIds);

        const bookings = (venueBookings || [])
          .filter((vb: any) => vb.booking && vb.booking.status !== 'cancelled');

        const totalRevenue = bookings.reduce((sum: number, b: any) => sum + (b.booking.total_price || 0), 0);
        
        // Monthly revenue
        const currentMonth = new Date();
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        
        const monthlyBookings = bookings.filter((b: any) => {
          const date = new Date(b.booking.created_at);
          return date >= monthStart && date <= monthEnd;
        });
        const monthlyRevenue = monthlyBookings.reduce((sum: number, b: any) => sum + (b.booking.total_price || 0), 0);

        // Calculate occupancy: (total booked hours / total available hours) * 100
        // Assume venues are available 12 hours/day (8am-8pm) for the period
        const months = parseInt(period);
        const totalDays = months * 30;
        const hoursPerDay = 12; // Assuming 12 hours availability per venue per day
        const totalAvailableHours = venues.length * totalDays * hoursPerDay;

        let totalBookedHours = 0;
        bookings.forEach((b: any) => {
          if (b.start_datetime && b.end_datetime) {
            const hours = differenceInHours(new Date(b.end_datetime), new Date(b.start_datetime));
            totalBookedHours += Math.max(0, hours);
          }
        });

        const occupancyRate = totalAvailableHours > 0 
          ? Math.round((totalBookedHours / totalAvailableHours) * 100) 
          : 0;

        setStats({
          totalRevenue,
          monthlyRevenue,
          totalBookings: bookings.length,
          averageBookingValue: bookings.length > 0 ? totalRevenue / bookings.length : 0,
          occupancyRate,
        });

        // Generate chart data for last N months with occupancy
        const monthlyData: RevenueData[] = [];
        for (let i = months - 1; i >= 0; i--) {
          const month = subMonths(new Date(), i);
          const mStart = startOfMonth(month);
          const mEnd = endOfMonth(month);
          
          const monthBookings = bookings.filter((b: any) => {
            const date = new Date(b.booking.created_at);
            return date >= mStart && date <= mEnd;
          });

          const monthRevenue = monthBookings.reduce((sum: number, b: any) => sum + (b.booking.total_price || 0), 0);

          // Calculate monthly booked hours
          let monthBookedHours = 0;
          monthBookings.forEach((b: any) => {
            if (b.start_datetime && b.end_datetime) {
              const hours = differenceInHours(new Date(b.end_datetime), new Date(b.start_datetime));
              monthBookedHours += Math.max(0, hours);
            }
          });

          // Monthly available hours (30 days * 12 hours * number of venues)
          const monthAvailableHours = venues.length * 30 * hoursPerDay;
          const monthOccupancy = monthAvailableHours > 0 
            ? Math.round((monthBookedHours / monthAvailableHours) * 100) 
            : 0;

          monthlyData.push({
            month: format(month, 'MMM'),
            revenue: monthRevenue,
            occupancy: monthOccupancy,
          });
        }
        setChartData(monthlyData);
      } catch (error) {
        console.error('Error fetching revenue:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, [user, period]);

  const statCards = [
    { label: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-500" },
    { label: "This Month", value: `$${stats.monthlyRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-blue-500" },
    { label: "Total Bookings", value: stats.totalBookings, icon: CalendarCheck, color: "text-purple-500" },
    { label: "Avg. Booking Value", value: `$${stats.averageBookingValue.toFixed(0)}`, icon: Percent, color: "text-orange-500" },
    { label: "Occupancy Rate", value: `${stats.occupancyRate}%`, icon: TrendingUp, color: "text-chart-2" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Revenue</h1>
          <p className="text-muted-foreground">Track your venue earnings and occupancy</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue & Occupancy Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" tickFormatter={(value) => `$${value}`} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? `$${value.toLocaleString()}` : `${value}%`,
                    name === 'revenue' ? 'Revenue' : 'Occupancy'
                  ]}
                />
                <Legend />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.2)" 
                  name="Revenue"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="occupancy" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={false}
                  name="Occupancy"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenuePage;
