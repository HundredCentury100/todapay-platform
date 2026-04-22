import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, Calendar, BarChart3, BedDouble, Percent } from "lucide-react";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO, differenceInDays, eachDayOfInterval, isWithinInterval } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, ComposedChart, Legend } from "recharts";

interface RevenueData {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  bookingsCount: number;
  avgBookingValue: number;
  occupancyRate: number;
}

interface ChartData {
  date: string;
  revenue: number;
  bookings: number;
  occupancy: number;
}

const RevenuePage = () => {
  const { merchantProfile } = useMerchantAuth();
  const { convertPrice } = useCurrency();
  const [revenueData, setRevenueData] = useState<RevenueData>({
    today: 0, thisWeek: 0, thisMonth: 0, total: 0, 
    bookingsCount: 0, avgBookingValue: 0, occupancyRate: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [propertyBreakdown, setPropertyBreakdown] = useState<{name: string, revenue: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    if (merchantProfile?.id) {
      fetchRevenueData();
    }
  }, [merchantProfile?.id, period]);

  const fetchRevenueData = async () => {
    if (!merchantProfile?.id) return;

    try {
      // Get properties for this merchant
      const { data: properties } = await supabase
        .from('properties')
        .select('id, name')
        .eq('merchant_profile_id', merchantProfile.id);

      if (!properties || properties.length === 0) {
        setLoading(false);
        return;
      }

      const propertyIds = properties.map(p => p.id);

      // Fetch rooms and stay bookings in parallel
      const [roomsResult, stayBookingsResult] = await Promise.all([
        supabase
          .from('rooms')
          .select('id, property_id, quantity')
          .in('property_id', propertyIds)
          .eq('status', 'active'),
        supabase
          .from('stay_bookings')
          .select(`
            *,
            booking:bookings(total_price, payment_status, created_at, status)
          `)
          .in('property_id', propertyIds)
      ]);

      const rooms = roomsResult.data || [];
      const stayBookings = stayBookingsResult.data || [];

      const paidBookings = stayBookings.filter(
        b => b.booking?.payment_status === 'paid' && b.booking?.status !== 'cancelled'
      );

      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const weekStart = startOfWeek(now);
      const weekEnd = endOfWeek(now);
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // Calculate revenue metrics
      let today = 0, thisWeek = 0, thisMonth = 0, total = 0;
      
      paidBookings.forEach(b => {
        const amount = b.booking?.total_price || 0;
        const createdAt = parseISO(b.booking?.created_at || '');
        
        total += amount;
        
        if (createdAt >= todayStart) today += amount;
        if (createdAt >= weekStart && createdAt <= weekEnd) thisWeek += amount;
        if (createdAt >= monthStart && createdAt <= monthEnd) thisMonth += amount;
      });

      // Calculate property breakdown
      const breakdown = properties.map(prop => {
        const propBookings = paidBookings.filter(b => b.property_id === prop.id);
        const revenue = propBookings.reduce((sum, b) => sum + (b.booking?.total_price || 0), 0);
        return { name: prop.name, revenue };
      }).sort((a, b) => b.revenue - a.revenue);

      // Calculate total room inventory
      const totalRoomUnits = rooms.reduce((sum, room) => sum + (room.quantity || 1), 0);

      // Build chart data with occupancy for the selected period
      const days = parseInt(period);
      const periodStart = subDays(new Date(), days - 1);
      const periodEnd = new Date();
      
      const chartDataMap: Record<string, { revenue: number; bookings: number; occupancy: number }> = {};
      
      // Initialize all dates
      for (let i = days - 1; i >= 0; i--) {
        const currentDate = subDays(new Date(), i);
        const dateKey = format(currentDate, 'MMM d');
        chartDataMap[dateKey] = { revenue: 0, bookings: 0, occupancy: 0 };
      }

      // Calculate daily occupancy and revenue
      let totalBookedRoomNights = 0;
      const totalAvailableRoomNights = totalRoomUnits * days;

      paidBookings.forEach(b => {
        const checkIn = parseISO(b.check_in_date);
        const checkOut = parseISO(b.check_out_date);
        const numRooms = b.num_rooms || 1;
        const createdDate = format(parseISO(b.booking?.created_at || ''), 'MMM d');

        // Add revenue on creation date
        if (chartDataMap[createdDate]) {
          chartDataMap[createdDate].revenue += b.booking?.total_price || 0;
          chartDataMap[createdDate].bookings += 1;
        }

        // Calculate room nights for each day in the period
        for (let i = days - 1; i >= 0; i--) {
          const currentDate = subDays(new Date(), i);
          currentDate.setHours(0, 0, 0, 0);
          
          // Check if this date falls within the booking's check-in to check-out range
          if (currentDate >= checkIn && currentDate < checkOut) {
            totalBookedRoomNights += numRooms;
            const dateKey = format(currentDate, 'MMM d');
            if (chartDataMap[dateKey]) {
              chartDataMap[dateKey].occupancy += numRooms;
            }
          }
        }
      });

      // Convert occupancy counts to percentages
      Object.keys(chartDataMap).forEach(dateKey => {
        if (totalRoomUnits > 0) {
          chartDataMap[dateKey].occupancy = Math.round((chartDataMap[dateKey].occupancy / totalRoomUnits) * 100);
        }
      });

      const chartDataArray = Object.entries(chartDataMap).map(([date, data]) => ({
        date,
        ...data
      }));

      // Calculate overall occupancy rate for the period
      const occupancyRate = totalAvailableRoomNights > 0 
        ? Math.round((totalBookedRoomNights / totalAvailableRoomNights) * 100) 
        : 0;

      setRevenueData({
        today,
        thisWeek,
        thisMonth,
        total,
        bookingsCount: paidBookings.length,
        avgBookingValue: paidBookings.length > 0 ? total / paidBookings.length : 0,
        occupancyRate
      });
      setChartData(chartDataArray);
      setPropertyBreakdown(breakdown);
    } catch (error) {
      console.error('Error fetching revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Revenue</h1>
          <p className="text-muted-foreground">Track your property earnings</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertPrice(revenueData.today)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertPrice(revenueData.thisWeek)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertPrice(revenueData.thisMonth)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertPrice(revenueData.total)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <BedDouble className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenueData.bookingsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Booking Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertPrice(revenueData.avgBookingValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenueData.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">Based on room availability</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue & Occupancy Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            {chartData.length > 0 && (chartData.some(d => d.revenue > 0) || chartData.some(d => d.occupancy > 0)) ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                   <XAxis dataKey="date" className="text-xs" />
                   <YAxis yAxisId="left" className="text-xs" tickFormatter={(value) => convertPrice(value)} />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                   <Tooltip 
                     formatter={(value: number, name: string) => [
                       name === 'revenue' ? convertPrice(value) : `${value}%`,
                       name === 'revenue' ? 'Revenue' : 'Occupancy'
                     ]}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary)/0.2)" 
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
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">No data for this period</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Property</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {propertyBreakdown.length > 0 && propertyBreakdown.some(p => p.revenue > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={propertyBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(value) => convertPrice(value)} className="text-xs" />
                  <YAxis type="category" dataKey="name" width={120} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [convertPrice(value), 'Revenue']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">Add properties and receive bookings to see revenue data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenuePage;
