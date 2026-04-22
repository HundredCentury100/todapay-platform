import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getMerchantOperatorNames } from "@/services/merchantService";
import StatCard from "@/components/merchant/StatCard";
import { DollarSign, Ticket, Calendar, Star, Plus, MapPin, Users, ArrowRight, CheckCircle, TrendingUp, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const EventOrganizerDashboard = () => {
  const navigate = useNavigate();
  const { convertPrice } = useCurrency();
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalTicketsSold: 0,
    activeEvents: 0,
    averageRating: 0,
    totalTickets: 0,
    soldTickets: 0,
  });
  const [todayData, setTodayData] = useState({ eventsToday: 0, checkInsToday: 0, ticketsSoldToday: 0 });
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [chartRange, setChartRange] = useState<'7d' | '30d'>('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const organizers = await getMerchantOperatorNames();
        if (organizers.length === 0) { setLoading(false); return; }

        const { data: events } = await supabase
          .from('events')
          .select('*, event_ticket_tiers(id, total_tickets, available_tickets)')
          .in('organizer', organizers)
          .order('event_date', { ascending: true });

        const upcoming = events?.filter(e => new Date(e.event_date) >= new Date()).slice(0, 3) || [];
        setUpcomingEvents(upcoming);

        // Today's events
        const today = format(new Date(), 'yyyy-MM-dd');
        const eventsToday = events?.filter(e => e.event_date === today).length || 0;

        const eventIds = events?.map(e => e.id) || [];
        const { data: bookings } = await supabase
          .from('bookings')
          .select('*')
          .in('item_id', eventIds)
          .eq('booking_type', 'event')
          .order('created_at', { ascending: false });

        setRecentBookings(bookings?.slice(0, 5) || []);

        // Today's stats
        const todayBookings = bookings?.filter(b => b.created_at && format(new Date(b.created_at), 'yyyy-MM-dd') === today) || [];
        const checkInsToday = bookings?.filter(b => b.checked_in && b.checked_in_at && format(new Date(b.checked_in_at), 'yyyy-MM-dd') === today).length || 0;

        setTodayData({
          eventsToday,
          checkInsToday,
          ticketsSoldToday: todayBookings.reduce((s, b) => s + (b.ticket_quantity || 1), 0),
        });

        const { data: reviews } = await supabase
          .from('event_reviews')
          .select('rating')
          .in('event_id', eventIds);

        const totalRevenue = bookings?.reduce((sum, b) => sum + Number(b.total_price), 0) || 0;
        const totalTicketsSold = bookings?.reduce((sum, b) => sum + (b.ticket_quantity || 0), 0) || 0;
        const avgRating = reviews?.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

        // Sell-through rate
        let totalTickets = 0, soldTickets = 0;
        events?.forEach(e => {
          e.event_ticket_tiers?.forEach((t: any) => {
            totalTickets += t.total_tickets;
            soldTickets += (t.total_tickets - t.available_tickets);
          });
        });

        // Revenue chart data
        const days = chartRange === '7d' ? 7 : 30;
        const chartDays = Array.from({ length: days }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
          return format(d, 'MMM dd');
        });
        const revenueByDay = chartDays.map(day => {
          const dayBookings = bookings?.filter(b => format(new Date(b.created_at || ''), 'MMM dd') === day) || [];
          return {
            date: day,
            revenue: dayBookings.reduce((s, b) => s + Number(b.total_price), 0),
            bookings: dayBookings.length,
          };
        });
        setRevenueData(revenueByDay);

        setMetrics({ totalRevenue, totalTicketsSold, activeEvents: events?.filter(e => e.status === 'active').length || 0, averageRating: avgRating, totalTickets, soldTickets });
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [chartRange]);

  if (loading) return <div>Loading dashboard...</div>;

  const sellThroughRate = metrics.totalTickets > 0 ? Math.round((metrics.soldTickets / metrics.totalTickets) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Event Organizer Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Manage your events and ticket sales</p>
        </div>
        <Button onClick={() => navigate('/merchant/event-organizer/events')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Today View */}
      {(todayData.eventsToday > 0 || todayData.ticketsSoldToday > 0) && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{todayData.eventsToday}</p>
                <p className="text-xs text-muted-foreground">Events Today</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{todayData.checkInsToday}</p>
                <p className="text-xs text-muted-foreground">Check-ins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{todayData.ticketsSoldToday}</p>
                <p className="text-xs text-muted-foreground">Tickets Sold</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="cursor-pointer transition-transform hover:scale-105" onClick={() => navigate('/merchant/event-organizer/revenue')}>
          <StatCard title="Total Revenue" value={convertPrice(metrics.totalRevenue)} icon={DollarSign} />
        </div>
        <div className="cursor-pointer transition-transform hover:scale-105" onClick={() => navigate('/merchant/event-organizer/tickets')}>
          <StatCard title="Tickets Sold" value={metrics.totalTicketsSold} icon={Ticket} />
        </div>
        <div className="cursor-pointer transition-transform hover:scale-105" onClick={() => navigate('/merchant/event-organizer/events')}>
          <StatCard title="Active Events" value={metrics.activeEvents} icon={Calendar} />
        </div>
        <div className="cursor-pointer transition-transform hover:scale-105" onClick={() => navigate('/merchant/event-organizer/reviews')}>
          <StatCard title="Average Rating" value={metrics.averageRating.toFixed(1)} icon={Star} />
        </div>
      </div>

      {/* Sell-through Rate */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Sell-through Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={sellThroughRate} className="flex-1 h-3" />
            <span className="text-2xl font-bold">{sellThroughRate}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.soldTickets} of {metrics.totalTickets} total tickets sold across all events
          </p>
        </CardContent>
      </Card>

      {/* Enhanced Revenue Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Revenue & Bookings</CardTitle>
          <div className="flex gap-1">
            <Button variant={chartRange === '7d' ? 'default' : 'outline'} size="sm" onClick={() => setChartRange('7d')}>7 Days</Button>
            <Button variant={chartRange === '30d' ? 'default' : 'outline'} size="sm" onClick={() => setChartRange('30d')}>30 Days</Button>
          </div>
        </CardHeader>
        <CardContent>
          {revenueData.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" className="text-xs" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="right" dataKey="bookings" fill="hsl(var(--primary) / 0.3)" name="Bookings" radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Revenue" />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Events</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/merchant/event-organizer/events')}>
              View All <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No upcoming events</p>
                <Button onClick={() => navigate('/merchant/event-organizer/events')}>
                  <Plus className="w-4 h-4 mr-2" /> Create Event
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate('/merchant/event-organizer/events')}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">{event.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{event.venue}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(event.event_date), 'MMM dd, yyyy')} at {event.event_time}</p>
                    </div>
                    <Badge variant="outline">{event.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Bookings</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/merchant/event-organizer/tickets')}>
              View All <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="text-center py-8">
                <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No bookings yet</p>
                <Button onClick={() => navigate('/merchant/event-organizer/events')}>
                  <Plus className="w-4 h-4 mr-2" /> Create Event
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate('/merchant/event-organizer/tickets')}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Ticket className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{booking.item_name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{booking.passenger_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Users className="w-3 h-3" />
                        <span>{booking.ticket_quantity || 1} ticket(s)</span>
                        <span>•</span>
                        <span>{format(new Date(booking.created_at || ''), 'MMM dd')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>{booking.payment_status}</Badge>
                      <p className="text-sm font-medium mt-1">{convertPrice(Number(booking.total_price))}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto flex-col py-4" onClick={() => navigate('/merchant/event-organizer/events')}>
              <Calendar className="w-5 h-5 mb-2" /><span className="text-sm">Manage Events</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4" onClick={() => navigate('/merchant/event-organizer/check-in')}>
              <CheckCircle className="w-5 h-5 mb-2" /><span className="text-sm">Check-In</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4" onClick={() => navigate('/merchant/event-organizer/pricing')}>
              <DollarSign className="w-5 h-5 mb-2" /><span className="text-sm">Pricing</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4" onClick={() => navigate('/merchant/event-organizer/messages')}>
              <TrendingUp className="w-5 h-5 mb-2" /><span className="text-sm">Messages</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventOrganizerDashboard;
