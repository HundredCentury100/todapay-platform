import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CarTaxiFront, CalendarCheck, DollarSign, Users, TrendingUp, 
  MapPin, Plus, Truck, AlertCircle, CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { GoogleMapsLink } from "@/components/ui/GoogleMapsLink";

interface DashboardStats {
  activeRoutes: number;
  todayTransfers: number;
  monthlyRevenue: number;
  monthlyPassengers: number;
  totalVehicles: number;
  availableVehicles: number;
  pendingRequests: number;
}

const TransfersDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeRoutes: 0,
    todayTransfers: 0,
    monthlyRevenue: 0,
    monthlyPassengers: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    pendingRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentTransfers, setRecentTransfers] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      // Get merchant profile
      const { data: merchantProfile } = await supabase
        .from('merchant_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!merchantProfile) {
        setLoading(false);
        return;
      }

      const merchantId = merchantProfile.id;
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      // Fetch stats in parallel
      const [
        vehiclesRes,
        todayTransfersRes,
        monthTransfersRes,
        pendingRes,
        zonePricingRes
      ] = await Promise.all([
        // Total vehicles
        supabase
          .from('transfer_vehicles')
          .select('id, is_available, status')
          .eq('merchant_profile_id', merchantId),
        // Today's transfers
        supabase
          .from('transfer_requests')
          .select('id, num_passengers')
          .eq('merchant_profile_id', merchantId)
          .gte('created_at', today),
        // Monthly transfers with revenue
        supabase
          .from('transfer_requests')
          .select('id, price_final, num_passengers, status')
          .eq('merchant_profile_id', merchantId)
          .gte('created_at', monthStart)
          .eq('status', 'completed'),
        // Pending requests
        supabase
          .from('transfer_requests')
          .select('id')
          .eq('merchant_profile_id', merchantId)
          .eq('status', 'pending'),
        // Active zone pricing routes
        supabase
          .from('transfer_zone_pricing')
          .select('id')
          .eq('merchant_profile_id', merchantId)
          .eq('is_active', true)
      ]);

      // Fetch recent transfers
      const { data: recent } = await supabase
        .from('transfer_requests')
        .select('*, driver:drivers(full_name)')
        .eq('merchant_profile_id', merchantId)
        .order('created_at', { ascending: false })
        .limit(5);

      const vehicles = vehiclesRes.data || [];
      const todayData = todayTransfersRes.data || [];
      const monthData = monthTransfersRes.data || [];
      const pendingData = pendingRes.data || [];
      const routesData = zonePricingRes.data || [];

      setStats({
        activeRoutes: routesData.length,
        todayTransfers: todayData.length,
        monthlyRevenue: monthData.reduce((sum, t) => sum + (t.price_final || 0), 0),
        monthlyPassengers: monthData.reduce((sum, t) => sum + (t.num_passengers || 0), 0),
        totalVehicles: vehicles.length,
        availableVehicles: vehicles.filter(v => v.is_available && v.status === 'active').length,
        pendingRequests: pendingData.length
      });

      setRecentTransfers(recent || []);
      setLoading(false);
    };

    fetchStats();
  }, [user]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-600 border-amber-200',
      driver_assigned: 'bg-blue-500/10 text-blue-600 border-blue-200',
      in_progress: 'bg-primary/10 text-primary border-primary/20',
      completed: 'bg-green-500/10 text-green-600 border-green-200',
      cancelled: 'bg-destructive/10 text-destructive border-destructive/20'
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transfers Dashboard</h1>
          <p className="text-muted-foreground">Manage your airport transfers and shuttle services</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/merchant/transfers/vehicles">
              <Truck className="h-4 w-4 mr-2" />
              Manage Fleet
            </Link>
          </Button>
          <Button asChild>
            <Link to="/merchant/transfers/routes">
              <Plus className="h-4 w-4 mr-2" />
              Add Route
            </Link>
          </Button>
        </div>
      </div>

      {/* Pending Requests Alert */}
      {stats.pendingRequests > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-500/10">
          <CardContent className="p-4 flex items-center gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                {stats.pendingRequests} pending transfer request{stats.pendingRequests > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-300">
                Assign drivers to these requests
              </p>
            </div>
            <Button size="sm" asChild>
              <Link to="/merchant/transfers/bookings?status=pending">View Requests</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeRoutes}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeRoutes === 0 ? 'Add your first route' : 'Zone pricing active'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Transfers</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayTransfers}</div>
            <p className="text-xs text-muted-foreground">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passengers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyPassengers}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Status & Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CarTaxiFront className="h-5 w-5" />
              Fleet Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.totalVehicles === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">No vehicles configured</p>
                <Button asChild>
                  <Link to="/merchant/transfers/vehicles">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vehicle
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Vehicles</span>
                  <span className="font-semibold">{stats.totalVehicles}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Available Now</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {stats.availableVehicles}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">In Use / Unavailable</span>
                  <span className="font-semibold">{stats.totalVehicles - stats.availableVehicles}</span>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/merchant/transfers/vehicles">Manage Fleet</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Transfers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransfers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No transfers yet. Add routes and vehicles to start accepting bookings.
              </p>
            ) : (
              <div className="space-y-3">
                {recentTransfers.map((transfer) => (
                  <div key={transfer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        <GoogleMapsLink address={transfer.pickup_location} showIcon={false} /> → <GoogleMapsLink address={transfer.dropoff_location} showIcon={false} />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transfer.driver?.full_name || 'Unassigned'} • {transfer.num_passengers} pax
                      </p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(transfer.status)}>
                      {transfer.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                ))}
                <Button variant="ghost" className="w-full" asChild>
                  <Link to="/merchant/transfers/bookings">View All</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TransfersDashboard;
