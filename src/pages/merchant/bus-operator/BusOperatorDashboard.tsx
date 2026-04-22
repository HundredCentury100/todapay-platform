import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getMerchantOperatorNames } from "@/services/merchantService";
import StatCard from "@/components/merchant/StatCard";
import RevenueChart from "@/components/merchant/RevenueChart";
import { DollarSign, Ticket, Bus, Star, Plus, Calendar, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";

const BusOperatorDashboard = () => {
  const navigate = useNavigate();
  const { convertPrice } = useCurrency();
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    activeRoutes: 0,
    averageRating: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const operators = await getMerchantOperatorNames();
        
        if (operators.length === 0) {
          setLoading(false);
          return;
        }

        // Get bookings for this operator
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .in('operator', operators)
          .eq('booking_type', 'bus')
          .order('created_at', { ascending: false });

        if (bookingsError) throw bookingsError;

        // Get recent bookings (last 5)
        setRecentBookings(bookings?.slice(0, 5) || []);

        // Get unique routes count
        const { data: schedules, error: schedulesError } = await supabase
          .from('bus_schedules')
          .select('from_location, to_location, buses(operator)')
          .in('buses.operator', operators);

        if (schedulesError) throw schedulesError;

        // Get reviews
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating')
          .in('operator', operators);

        if (reviewsError) throw reviewsError;

        const totalRevenue = bookings?.reduce((sum, b) => sum + Number(b.total_price), 0) || 0;
        const avgRating = reviews?.length 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
          : 0;

        // Generate revenue data for last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return format(date, 'MMM dd');
        });

        const revenueByDay = last7Days.map(day => {
          const dayBookings = bookings?.filter(b => 
            format(new Date(b.created_at || ''), 'MMM dd') === day
          ) || [];
          return {
            date: day,
            revenue: dayBookings.reduce((sum, b) => sum + Number(b.total_price), 0),
            bookings: dayBookings.length,
          };
        });

        setRevenueData(revenueByDay);
        setMetrics({
          totalRevenue,
          totalBookings: bookings?.length || 0,
          activeRoutes: schedules?.length || 0,
          averageRating: avgRating,
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Bus Operator Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your business overview</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/merchant/bus-operator/schedules')}>
            <Calendar className="w-4 h-4 mr-2" />
            Add Schedule
          </Button>
          <Button variant="outline" onClick={() => navigate('/merchant/bus-operator/routes')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Route
          </Button>
        </div>
      </div>

      {/* Credit wallet status shown in sidebar */}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div 
          className="cursor-pointer transition-transform hover:scale-105"
          onClick={() => navigate('/merchant/bus-operator/revenue')}
        >
          <StatCard
            title="Total Revenue"
            value={convertPrice(metrics.totalRevenue)}
            icon={DollarSign}
          />
        </div>
        <div 
          className="cursor-pointer transition-transform hover:scale-105"
          onClick={() => navigate('/merchant/bus-operator/bookings')}
        >
          <StatCard
            title="Total Bookings"
            value={metrics.totalBookings}
            icon={Ticket}
          />
        </div>
        <div 
          className="cursor-pointer transition-transform hover:scale-105"
          onClick={() => navigate('/merchant/bus-operator/routes')}
        >
          <StatCard
            title="Active Routes"
            value={metrics.activeRoutes}
            icon={Bus}
          />
        </div>
        <div 
          className="cursor-pointer transition-transform hover:scale-105"
          onClick={() => navigate('/merchant/bus-operator/reviews')}
        >
          <StatCard
            title="Average Rating"
            value={metrics.averageRating.toFixed(1)}
            icon={Star}
          />
        </div>
      </div>

      {revenueData.length > 0 && <RevenueChart data={revenueData} type="line" />}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Bookings</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/merchant/bus-operator/bookings')}
            >
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="text-center py-8">
                <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  No bookings yet
                </p>
                <Button onClick={() => navigate('/merchant/bus-operator/schedules')}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Create Schedule
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div 
                    key={booking.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate('/merchant/bus-operator/bookings')}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {booking.from_location} → {booking.to_location}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {booking.passenger_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(booking.created_at || ''), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                        {booking.payment_status}
                      </Badge>
                      <p className="text-sm font-medium mt-1">
                        {convertPrice(Number(booking.total_price))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/merchant/bus-operator/schedules')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Manage Schedules
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/merchant/bus-operator/bookings')}
            >
              <Ticket className="w-4 h-4 mr-2" />
              View All Bookings
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/merchant/bus-operator/routes')}
            >
              <Bus className="w-4 h-4 mr-2" />
              Manage Fleet
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/merchant/bus-operator/customers')}
            >
              <MapPin className="w-4 h-4 mr-2" />
              View Customers
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/merchant/bus-operator/analytics')}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Analytics & Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusOperatorDashboard;
