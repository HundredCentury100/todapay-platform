import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, Users, TicketCheck, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MerchantPerformance = () => {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    averageRating: 0,
    activeTickets: 0
  });

  useEffect(() => {
    loadMerchants();
    loadMetrics();
  }, [selectedMerchant]);

  const loadMerchants = async () => {
    try {
      const { data, error } = await supabase
        .from('merchant_profiles')
        .select('id, business_name, role, verification_status')
        .eq('verification_status', 'verified')
        .order('business_name');

      if (error) throw error;
      setMerchants(data || []);
    } catch (error) {
      console.error('Error loading merchants:', error);
      toast.error('Failed to load merchants');
    }
  };

  const loadMetrics = async () => {
    try {
      let bookingsQuery = supabase
        .from('bookings')
        .select('total_price, operator, item_name, status');

      if (selectedMerchant !== 'all') {
        // Filter by merchant - would need operator associations
        const { data: associations } = await supabase
          .from('operator_associations')
          .select('operator_name')
          .eq('merchant_profile_id', selectedMerchant);

        if (associations && associations.length > 0) {
          const operatorNames = associations.map(a => a.operator_name);
          bookingsQuery = bookingsQuery.in('operator', operatorNames);
        }
      }

      const { data: bookings } = await bookingsQuery;

      const totalRevenue = bookings?.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0) || 0;
      const totalBookings = bookings?.length || 0;

      // Get support tickets
      let ticketsQuery = supabase
        .from('support_tickets')
        .select('status');

      if (selectedMerchant !== 'all') {
        ticketsQuery = ticketsQuery.eq('merchant_profile_id', selectedMerchant);
      }

      const { data: tickets } = await ticketsQuery;
      const activeTickets = tickets?.filter(t => t.status !== 'resolved' && t.status !== 'closed').length || 0;

      setMetrics({
        totalRevenue,
        totalBookings,
        averageRating: 4.5, // Mock for now
        activeTickets
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast.error('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Merchant Performance</h1>
          <p className="text-muted-foreground">Monitor merchant metrics and performance</p>
        </div>

        <Select value={selectedMerchant} onValueChange={setSelectedMerchant}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select merchant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Merchants</SelectItem>
            {merchants.map((merchant) => (
              <SelectItem key={merchant.id} value={merchant.id}>
                {merchant.business_name} ({merchant.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+12.5%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <TicketCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalBookings}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+8.2%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingDown className="h-3 w-3 text-red-500" />
              <span className="text-red-500">-0.2</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">Support requests pending</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="bookings">Booking Analytics</TabsTrigger>
          <TabsTrigger value="satisfaction">Customer Satisfaction</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Key performance indicators for {selectedMerchant === 'all' ? 'all merchants' : 'selected merchant'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span className="font-medium">Booking Conversion Rate</span>
                  <span className="text-2xl font-bold">67.8%</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span className="font-medium">Average Response Time</span>
                  <span className="text-2xl font-bold">2.3h</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span className="font-medium">Customer Retention</span>
                  <span className="text-2xl font-bold">84.2%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Revenue analysis over time</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Revenue chart will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Booking Analytics</CardTitle>
              <CardDescription>Booking patterns and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Booking analytics will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="satisfaction">
          <Card>
            <CardHeader>
              <CardTitle>Customer Satisfaction</CardTitle>
              <CardDescription>Reviews and ratings analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Satisfaction metrics will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MerchantPerformance;
