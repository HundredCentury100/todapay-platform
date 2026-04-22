import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Users, DollarSign, MapPin, Clock } from "lucide-react";
import { getOperatorBookings, getOperatorRevenue } from "@/services/operatorService";
import { useCurrency } from "@/contexts/CurrencyContext";
import RevenueForecast from "@/components/merchant/RevenueForecast";
import DynamicPricingEngine from "@/components/merchant/DynamicPricingEngine";

const AnalyticsPage = () => {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [bookingTrends, setBookingTrends] = useState<any[]>([]);
  const [routePerformance, setRoutePerformance] = useState<any[]>([]);
  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [revenueTrend, setRevenueTrend] = useState({ value: 0, isUp: true });
  const [bookingTrend, setBookingTrend] = useState({ value: 0, isUp: true });
  const { convertPrice } = useCurrency();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const computeTrend = (data: any[], dateField: string, valueField?: string) => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    let currentVal = 0, prevVal = 0;
    data.forEach((item: any) => {
      const d = new Date(item[dateField]);
      const m = d.getMonth();
      const y = d.getFullYear();
      const v = valueField ? Number(item[valueField]) || 0 : 1;
      if (m === thisMonth && y === thisYear) currentVal += v;
      if (m === lastMonth && y === lastMonthYear) prevVal += v;
    });

    if (prevVal === 0) return { value: currentVal > 0 ? 100 : 0, isUp: true };
    const pct = ((currentVal - prevVal) / prevVal) * 100;
    return { value: Math.abs(pct), isUp: pct >= 0 };
  };

  const loadAnalytics = async () => {
    try {
      const [bookings, revenue] = await Promise.all([
        getOperatorBookings(),
        getOperatorRevenue(),
      ]);

      // Compute real trends
      setRevenueTrend(computeTrend(revenue, 'created_at', 'total_price'));
      setBookingTrend(computeTrend(bookings, 'created_at'));

      // Process revenue trends (fixed: created_at + total_price)
      const revenueByDate = revenue.reduce((acc: any, item: any) => {
        const date = new Date(item.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + Number(item.total_price);
        return acc;
      }, {});

      setRevenueData(
        Object.entries(revenueByDate).map(([date, amount]) => ({
          date,
          revenue: amount,
        }))
      );

      // Process booking trends (fixed: created_at)
      const bookingsByDate = bookings.reduce((acc: any, booking: any) => {
        const date = new Date(booking.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      setBookingTrends(
        Object.entries(bookingsByDate).map(([date, count]) => ({
          date,
          bookings: count,
        }))
      );

      // Process route performance (fixed: total_price)
      const routeStats = bookings.reduce((acc: any, booking: any) => {
        const route = `${booking.from_location} → ${booking.to_location}`;
        if (!acc[route]) {
          acc[route] = { route, bookings: 0, revenue: 0 };
        }
        acc[route].bookings += 1;
        acc[route].revenue += Number(booking.total_price) || 0;
        return acc;
      }, {});

      setRoutePerformance(Object.values(routeStats).slice(0, 10));

      // Process peak hours (use created_at since bookings don't have departure_time directly)
      const hourStats = bookings.reduce((acc: any, booking: any) => {
        const timeStr = booking.departure_time || booking.created_at;
        const hour = new Date(timeStr).getHours();
        if (!isNaN(hour)) {
          acc[hour] = (acc[hour] || 0) + 1;
        }
        return acc;
      }, {});

      setPeakHours(
        Object.entries(hourStats).map(([hour, count]) => ({
          hour: `${hour}:00`,
          bookings: count,
        }))
      );
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  const totalRevenue = revenueData.reduce((sum, item) => sum + (item.revenue as number), 0);
  const totalBookings = bookingTrends.reduce((sum, item) => sum + (item.bookings as number), 0);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Advanced Analytics</h1>
        <p className="text-muted-foreground">Detailed insights and performance metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">
                {convertPrice(totalRevenue)}
              </p>
              <p className={`text-xs flex items-center mt-1 ${revenueTrend.isUp ? 'text-green-600' : 'text-red-600'}`}>
                {revenueTrend.isUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {revenueTrend.isUp ? '+' : '-'}{revenueTrend.value.toFixed(1)}% vs last month
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
              <p className="text-2xl font-bold">{totalBookings}</p>
              <p className={`text-xs flex items-center mt-1 ${bookingTrend.isUp ? 'text-green-600' : 'text-red-600'}`}>
                {bookingTrend.isUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {bookingTrend.isUp ? '+' : '-'}{bookingTrend.value.toFixed(1)}% vs last month
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <MapPin className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Active Routes</p>
              <p className="text-2xl font-bold">{routePerformance.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Popular destinations</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Clock className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Peak Hours</p>
              <p className="text-2xl font-bold">{peakHours.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Active time slots</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="bookings">Booking Patterns</TabsTrigger>
          <TabsTrigger value="routes">Route Performance</TabsTrigger>
          <TabsTrigger value="hours">Peak Hours</TabsTrigger>
          <TabsTrigger value="forecast">AI Forecast</TabsTrigger>
          <TabsTrigger value="pricing">Dynamic Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Booking Trends</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={bookingTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Performing Routes</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={routePerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="route" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="hsl(var(--primary))" />
                <Bar dataKey="revenue" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Peak Booking Hours</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <RevenueForecast merchantType="bus_operator" merchantId="current-merchant" />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <DynamicPricingEngine itemType="bus" merchantId="current-merchant" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
