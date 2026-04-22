import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PremiumDashboardHeader,
  PremiumStatsCard,
  PremiumStatsGrid,
  PremiumEmptyState,
} from "@/components/premium";
import {
  Bus, Calendar, Building2, Briefcase, Users, DollarSign,
  TrendingUp, Bell, Settings, Plus, ArrowUpRight, Clock,
  Package, AlertCircle, CheckCircle, XCircle, BarChart3, Wallet, Shield
} from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { OnboardingChecklist } from "@/components/merchant/OnboardingChecklist";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface MerchantStats {
  totalRevenue: number;
  totalBookings: number;
  pendingBookings: number;
  todayBookings: number;
  inventoryCount: number;
  avgRating: number | null;
  walletBalance: number;
  escrowHeld: number;
  pendingPayout: number;
}

interface RecentBooking {
  id: string;
  booking_reference: string;
  passenger_name: string;
  total_price: number;
  status: string;
  booking_type: string;
  created_at: string;
}

interface DailyRevenue {
  day: string;
  revenue: number;
}

const UnifiedMerchantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { convertPrice } = useCurrency();
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [revenueData, setRevenueData] = useState<DailyRevenue[]>([]);
  const [merchantProfile, setMerchantProfile] = useState<{ id: string; role: string; business_name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('merchant_profiles')
          .select('id, role, business_name')
          .eq('user_id', user.id)
          .single();

        if (!profile) {
          setIsLoading(false);
          return;
        }
        setMerchantProfile(profile);

        // Get operator names for bus operators to filter bookings
        let operatorNames: string[] = [];
        if (profile.role === 'bus_operator') {
          const { data: ops } = await supabase
            .from('operator_associations')
            .select('operator_name')
            .eq('merchant_profile_id', profile.id);
          operatorNames = (ops || []).map(o => o.operator_name);
        }

        // Fetch bookings filtered by merchant
        let bookingsQuery = supabase
          .from('bookings')
          .select('id, booking_reference, passenger_name, total_price, status, booking_type, created_at, payment_status')
          .order('created_at', { ascending: false });

        if (profile.role === 'bus_operator' && operatorNames.length > 0) {
          bookingsQuery = bookingsQuery.in('operator', operatorNames);
        } else if (profile.role !== 'bus_operator') {
          bookingsQuery = bookingsQuery.eq('booked_by_agent_id', profile.id);
        }

        const { data: bookings } = await bookingsQuery.limit(100);
        const allBookings = bookings || [];

        const today = new Date().toISOString().split('T')[0];
        const paidBookings = allBookings.filter(b => b.payment_status === 'paid');

        // Compute 7-day revenue chart
        const last7Days: DailyRevenue[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = subDays(new Date(), i);
          const dayStr = format(d, 'yyyy-MM-dd');
          const dayRevenue = paidBookings
            .filter(b => b.created_at?.startsWith(dayStr))
            .reduce((sum, b) => sum + (b.total_price || 0), 0);
          last7Days.push({ day: format(d, 'EEE'), revenue: dayRevenue });
        }
        setRevenueData(last7Days);

        // Inventory count per role
        let inventoryCount = 0;
        const roleInventoryMap: Record<string, { table: string; filter?: { key: string; value: string } }> = {
          bus_operator: { table: "bus_schedules" },
          venue_owner: { table: "venues", filter: { key: "merchant_profile_id", value: profile.id } },
          property_owner: { table: "properties", filter: { key: "merchant_profile_id", value: profile.id } },
          car_rental_company: { table: "vehicles", filter: { key: "merchant_profile_id", value: profile.id } },
          experience_host: { table: "experiences", filter: { key: "merchant_profile_id", value: profile.id } },
          workspace_provider: { table: "workspaces", filter: { key: "merchant_profile_id", value: profile.id } },
        };
        const invConfig = roleInventoryMap[profile.role];
        if (invConfig) {
          let q = supabase.from(invConfig.table as any).select("id", { count: "exact", head: true });
          if (invConfig.filter) q = q.eq(invConfig.filter.key, invConfig.filter.value);
          const { count } = await q;
          inventoryCount = count || 0;
        }

        // Fetch wallet balance and escrow
        let walletBalance = 0;
        let escrowHeld = 0;
        let pendingPayout = 0;

        const [walletRes, escrowRes] = await Promise.all([
          supabase.from('user_wallets').select('balance').eq('user_id', user.id).single(),
          supabase.from('escrow_holds' as any).select('merchant_amount, status').eq('merchant_profile_id', profile.id),
        ]);

        walletBalance = walletRes.data?.balance || 0;
        const escrowData = escrowRes.data || [];
        escrowHeld = (escrowData as any[]).filter((e: any) => e.status === 'pending').reduce((sum: number, e: any) => sum + (e.merchant_amount || 0), 0);
        pendingPayout = (escrowData as any[]).filter((e: any) => e.status === 'released').reduce((sum: number, e: any) => sum + (e.merchant_amount || 0), 0);

        setStats({
          totalRevenue: paidBookings.reduce((sum, b) => sum + (b.total_price || 0), 0),
          totalBookings: allBookings.length,
          pendingBookings: allBookings.filter(b => b.status === 'pending').length,
          todayBookings: allBookings.filter(b => b.created_at?.startsWith(today)).length,
          inventoryCount,
          avgRating: null,
          walletBalance,
          escrowHeld,
          pendingPayout,
        });
        setRecentBookings(allBookings.slice(0, 5) as RecentBooking[]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getRoleIcon = (role: string) => {
    const icons: Record<string, React.ReactNode> = {
      bus_operator: <Bus className="h-5 w-5" />,
      event_organizer: <Calendar className="h-5 w-5" />,
      property_owner: <Building2 className="h-5 w-5" />,
      workspace_provider: <Briefcase className="h-5 w-5" />,
    };
    return icons[role] || <Package className="h-5 w-5" />;
  };

  const getQuickActions = (role: string) => {
    const actions: Record<string, Array<{ label: string; href: string; icon: React.ReactNode; color: string }>> = {
      bus_operator: [
        { label: 'Add Route', href: '/merchant/bus-operator/routes', icon: <Plus className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-600' },
        { label: 'Schedules', href: '/merchant/bus-operator/schedules', icon: <Clock className="h-4 w-4" />, color: 'bg-purple-500/10 text-purple-600' },
        { label: 'Bookings', href: '/merchant/bus-operator/bookings', icon: <Package className="h-4 w-4" />, color: 'bg-amber-500/10 text-amber-600' },
        { label: 'Check-in', href: '/merchant/bus-operator/check-in', icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-500/10 text-green-600' },
      ],
      event_organizer: [
        { label: 'New Event', href: '/merchant/event-organizer/events', icon: <Plus className="h-4 w-4" />, color: 'bg-purple-500/10 text-purple-600' },
        { label: 'Tickets', href: '/merchant/event-organizer/tickets', icon: <Package className="h-4 w-4" />, color: 'bg-amber-500/10 text-amber-600' },
        { label: 'Attendees', href: '/merchant/event-organizer/attendees', icon: <Users className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-600' },
        { label: 'Check-in', href: '/merchant/event-organizer/check-in', icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-500/10 text-green-600' },
      ],
      venue_owner: [
        { label: 'My Venues', href: '/merchant/venue-owner/venues', icon: <Building2 className="h-4 w-4" />, color: 'bg-purple-500/10 text-purple-600' },
        { label: 'Availability', href: '/merchant/venue-owner/availability', icon: <Calendar className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-600' },
        { label: 'Bookings', href: '/merchant/venue-owner/bookings', icon: <Package className="h-4 w-4" />, color: 'bg-amber-500/10 text-amber-600' },
        { label: 'Quotes', href: '/merchant/venue-owner/quotes', icon: <ArrowUpRight className="h-4 w-4" />, color: 'bg-green-500/10 text-green-600' },
      ],
      property_owner: [
        { label: 'Properties', href: '/merchant/property-owner/properties', icon: <Plus className="h-4 w-4" />, color: 'bg-amber-500/10 text-amber-600' },
        { label: 'Rooms', href: '/merchant/property-owner/rooms', icon: <Building2 className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-600' },
        { label: 'Availability', href: '/merchant/property-owner/availability', icon: <Calendar className="h-4 w-4" />, color: 'bg-green-500/10 text-green-600' },
        { label: 'Bookings', href: '/merchant/property-owner/bookings', icon: <Package className="h-4 w-4" />, color: 'bg-purple-500/10 text-purple-600' },
      ],
      airline_partner: [
        { label: 'Flights', href: '/merchant/airline/flights', icon: <Plus className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-600' },
        { label: 'Bookings', href: '/merchant/airline/bookings', icon: <Package className="h-4 w-4" />, color: 'bg-amber-500/10 text-amber-600' },
        { label: 'Revenue', href: '/merchant/airline/revenue', icon: <DollarSign className="h-4 w-4" />, color: 'bg-green-500/10 text-green-600' },
      ],
      workspace_provider: [
        { label: 'Add Space', href: '/merchant/workspace/spaces', icon: <Plus className="h-4 w-4" />, color: 'bg-green-500/10 text-green-600' },
        { label: 'Availability', href: '/merchant/workspace/availability', icon: <Calendar className="h-4 w-4" />, color: 'bg-purple-500/10 text-purple-600' },
        { label: 'Bookings', href: '/merchant/workspace/bookings', icon: <Package className="h-4 w-4" />, color: 'bg-amber-500/10 text-amber-600' },
        { label: 'Check-in', href: '/merchant/workspace/check-in', icon: <CheckCircle className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-600' },
      ],
      car_rental_company: [
        { label: 'Vehicles', href: '/merchant/car-rental/vehicles', icon: <Plus className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-600' },
        { label: 'Rentals', href: '/merchant/car-rental/bookings', icon: <Package className="h-4 w-4" />, color: 'bg-amber-500/10 text-amber-600' },
        { label: 'Maintenance', href: '/merchant/car-rental/maintenance', icon: <Settings className="h-4 w-4" />, color: 'bg-purple-500/10 text-purple-600' },
        { label: 'Revenue', href: '/merchant/car-rental/revenue', icon: <DollarSign className="h-4 w-4" />, color: 'bg-green-500/10 text-green-600' },
      ],
      transfer_provider: [
        { label: 'Fleet', href: '/merchant/transfers/vehicles', icon: <Plus className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-600' },
        { label: 'Routes & Pricing', href: '/merchant/transfers/routes', icon: <ArrowUpRight className="h-4 w-4" />, color: 'bg-purple-500/10 text-purple-600' },
        { label: 'Services', href: '/merchant/transfers/services', icon: <Package className="h-4 w-4" />, color: 'bg-amber-500/10 text-amber-600' },
        { label: 'Bookings', href: '/merchant/transfers/bookings', icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-500/10 text-green-600' },
      ],
      experience_host: [
        { label: 'Experiences', href: '/merchant/experiences/experiences', icon: <Plus className="h-4 w-4" />, color: 'bg-purple-500/10 text-purple-600' },
        { label: 'Schedules', href: '/merchant/experiences/schedules', icon: <Calendar className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-600' },
        { label: 'Bookings', href: '/merchant/experiences/bookings', icon: <Package className="h-4 w-4" />, color: 'bg-amber-500/10 text-amber-600' },
        { label: 'Reviews', href: '/merchant/experiences/reviews', icon: <ArrowUpRight className="h-4 w-4" />, color: 'bg-green-500/10 text-green-600' },
      ],
    };
    return actions[role] || [];
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: React.ReactNode }> = {
      confirmed: { color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: <CheckCircle className="h-3 w-3" /> },
      pending: { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: <Clock className="h-3 w-3" /> },
      cancelled: { color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: <XCircle className="h-3 w-3" /> },
    };
    return configs[status] || configs.pending;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 md:h-32 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PremiumDashboardHeader
            title={merchantProfile?.business_name || 'Dashboard'}
            subtitle="Welcome back! Here's your business overview."
            actions={
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/merchant/settings')}
                  className="gap-2 hover:bg-primary/5"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Button>
                <Button variant="outline" size="sm" className="gap-2 hover:bg-primary/5">
                  <Bell className="h-4 w-4" /> Alerts
                </Button>
              </div>
            }
          />
        </div>

        {/* Onboarding Checklist */}
        {merchantProfile && (
          <OnboardingChecklist
            merchantProfileId={merchantProfile.id}
            verificationStatus="pending"
            role={merchantProfile.role}
          />
        )}

        {/* Stats Grid */}
        <PremiumStatsGrid columns={4}>
          <PremiumStatsCard
            title="Total Revenue"
            value={convertPrice(stats?.totalRevenue || 0)}
            icon={DollarSign}
            variant="gradient"
            iconColor="bg-green-500/10 text-green-600"
            delay={0}
          />
          <PremiumStatsCard
            title="Bookings"
            value={stats?.totalBookings || 0}
            icon={Package}
            changeLabel={`${stats?.todayBookings || 0} today`}
            iconColor="bg-blue-500/10 text-blue-600"
            delay={0.1}
          />
          <PremiumStatsCard
            title="Pending"
            value={stats?.pendingBookings || 0}
            icon={AlertCircle}
            changeLabel="Action needed"
            iconColor="bg-amber-500/10 text-amber-600"
            delay={0.2}
          />
          <PremiumStatsCard
            title="Inventory"
            value={stats?.inventoryCount || 0}
            icon={TrendingUp}
            changeLabel="Active listings"
            iconColor="bg-purple-500/10 text-purple-600"
            delay={0.3}
          />
        </PremiumStatsGrid>

        {/* Financial Summary Row */}
        <PremiumStatsGrid columns={3}>
          <PremiumStatsCard
            title="Wallet Balance"
            value={convertPrice(stats?.walletBalance || 0)}
            icon={Wallet}
            changeLabel="Available funds"
            iconColor="bg-emerald-500/10 text-emerald-600"
            delay={0.35}
          />
          <PremiumStatsCard
            title="Escrow Held"
            value={convertPrice(stats?.escrowHeld || 0)}
            icon={Shield}
            changeLabel="Pending release"
            iconColor="bg-cyan-500/10 text-cyan-600"
            delay={0.4}
          />
          <PremiumStatsCard
            title="Pending Payout"
            value={convertPrice(stats?.pendingPayout || 0)}
            icon={DollarSign}
            changeLabel="Ready for disbursement"
            iconColor="bg-orange-500/10 text-orange-600"
            delay={0.45}
          />
        </PremiumStatsGrid>

        {/* Quick Actions */}
        {merchantProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-card to-muted/30">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {getQuickActions(merchantProfile.role).map((action, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + idx * 0.05 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(action.href)}
                        className="gap-2 hover:bg-primary/5 hover:border-primary/30"
                      >
                        <span className={cn("p-1 rounded", action.color)}>
                          {action.icon}
                        </span>
                        {action.label}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="overflow-hidden h-full">
              <CardHeader className="bg-gradient-to-r from-card to-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  Revenue (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {revenueData.some(d => d.revenue > 0) ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={revenueData}>
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>No revenue data in the last 7 days</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Bookings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="overflow-hidden h-full">
              <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-card to-muted/30">
                <CardTitle className="text-base">Recent Bookings</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/merchant/bookings')}
                  className="text-primary hover:bg-primary/10"
                >
                  View All <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {recentBookings.length > 0 ? (
                    recentBookings.map((booking, idx) => {
                      const statusConfig = getStatusConfig(booking.status);
                      return (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + idx * 0.05 }}
                          className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                              {booking.passenger_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.booking_reference} • {format(new Date(booking.created_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <p className="font-semibold text-sm">{convertPrice(booking.total_price)}</p>
                            <Badge 
                              variant="outline" 
                              className={cn("text-[10px] gap-1", statusConfig.color)}
                            >
                              {statusConfig.icon}
                              {booking.status}
                            </Badge>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <PremiumEmptyState
                      icon={Package}
                      title="No bookings yet"
                      description="Your recent bookings will appear here"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedMerchantDashboard;
