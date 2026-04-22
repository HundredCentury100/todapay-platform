import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CalendarCheck, DollarSign, MessageSquareQuote, TrendingUp, Users, Clock, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format, startOfDay, endOfDay } from "date-fns";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface DashboardStats {
  totalVenues: number;
  activeVenues: number;
  totalBookings: number;
  pendingQuotes: number;
  totalRevenue: number;
  upcomingBookings: number;
  todayBookings: number;
  weeklyData: { day: string; bookings: number; revenue: number }[];
}

const VenueOwnerDashboard = () => {
  const { user } = useAuth();
  const { convertPrice } = useCurrency();
  const [stats, setStats] = useState<DashboardStats>({
    totalVenues: 0, activeVenues: 0, totalBookings: 0, pendingQuotes: 0,
    totalRevenue: 0, upcomingBookings: 0, todayBookings: 0, weeklyData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const { data: profile } = await supabase.from('merchant_profiles').select('id').eq('user_id', user.id).single();
        if (!profile) return;

        const { data: venues } = await supabase.from('venues').select('id, status').eq('merchant_profile_id', profile.id);
        const venueIds = venues?.map(v => v.id) || [];
        const activeVenues = venues?.filter(v => v.status === 'active').length || 0;

        const { data: bookings } = await supabase.from('venue_bookings').select('id, created_at, booking:bookings(total_price, status)').in('venue_id', venueIds.length > 0 ? venueIds : ['']);
        const { count: quotesCount } = await supabase.from('venue_quotes').select('*', { count: 'exact', head: true }).in('venue_id', venueIds.length > 0 ? venueIds : ['']).eq('status', 'pending');

        const totalRevenue = bookings?.reduce((sum, b) => sum + ((b.booking as any)?.total_price || 0), 0) || 0;
        const now = new Date();
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);
        const todayBookings = bookings?.filter(b => new Date(b.created_at) >= todayStart && new Date(b.created_at) <= todayEnd).length || 0;

        const weeklyData = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - 6 + i);
          const dayStr = format(d, 'EEE');
          const dayBookings = (bookings || []).filter(b => format(new Date(b.created_at), 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd'));
          return { day: dayStr, bookings: dayBookings.length, revenue: dayBookings.reduce((s, b) => s + ((b.booking as any)?.total_price || 0), 0) };
        });

        setStats({
          totalVenues: venues?.length || 0, activeVenues, totalBookings: bookings?.length || 0,
          pendingQuotes: quotesCount || 0, totalRevenue, todayBookings,
          upcomingBookings: bookings?.filter(b => (b.booking as any)?.status === 'confirmed').length || 0,
          weeklyData,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Venue Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your venues and bookings</p>
        </div>
        <Link to="/merchant/venue-owner/venues"><Button>Manage Venues</Button></Link>
      </div>

      {/* Today View */}
      {stats.totalVenues > 0 && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Today</h3>
              <Badge variant="secondary" className="text-xs">{format(new Date(), 'EEEE, MMM d')}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-2xl font-bold">{stats.todayBookings}</p><p className="text-xs text-muted-foreground">New bookings</p></div>
              <div><p className="text-2xl font-bold">{stats.pendingQuotes}</p><p className="text-xs text-muted-foreground">Pending quotes</p></div>
              <div><p className="text-2xl font-bold">{stats.upcomingBookings}</p><p className="text-xs text-muted-foreground">Upcoming events</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3">
        {[
          { label: "Venues", value: stats.totalVenues, sub: `${stats.activeVenues} active`, icon: Building2, color: "text-primary" },
          { label: "Bookings", value: stats.totalBookings, sub: "Total", icon: CalendarCheck, color: "text-chart-2" },
          { label: "Quotes", value: stats.pendingQuotes, sub: "Pending", icon: MessageSquareQuote, color: "text-amber-500" },
          { label: "Revenue", value: convertPrice(stats.totalRevenue), sub: "All time", icon: DollarSign, color: "text-chart-1" },
          { label: "Upcoming", value: stats.upcomingBookings, sub: "Confirmed", icon: Users, color: "text-chart-4" },
          { label: "Avg Rating", value: "4.7", sub: "24 reviews", icon: Star, color: "text-amber-500" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-2">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${stat.color}`} />
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
              <div className="text-lg sm:text-2xl font-bold truncate">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Booking Trends (7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={stats.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" name="Bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(var(--chart-2))" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">Add venues to see trends</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 flex flex-col sm:flex-row flex-wrap gap-3">
          <Link to="/merchant/venue-owner/venues" className="text-sm text-primary hover:underline">Add New Venue →</Link>
          <Link to="/merchant/venue-owner/quotes" className="text-sm text-primary hover:underline">View Quote Requests →</Link>
          <Link to="/merchant/venue-owner/availability" className="text-sm text-primary hover:underline">Manage Availability →</Link>
          <Link to="/merchant/venue-owner/pricing" className="text-sm text-primary hover:underline">Manage Pricing →</Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default VenueOwnerDashboard;
