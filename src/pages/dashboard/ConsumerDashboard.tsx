import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { AnimatedCounter, BounceTap } from "@/components/ui/micro-interactions";
import {
  PremiumDashboardHeader,
  PremiumStatsCard,
  PremiumStatsGrid,
  PremiumQuickActionGrid,
  PremiumBookingList,
  PremiumEmptyState,
} from "@/components/premium";
import { 
  Calendar, Ticket, Clock, ArrowRight, Bus, Building2, 
  Briefcase, Wallet, TrendingUp, Car, MapPin, Plane
} from "lucide-react";

interface BookingStats {
  total: number;
  upcoming: number;
  completed: number;
}

interface SpendingStats {
  totalSpent: number;
  thisMonth: number;
  lastMonth: number;
}

const ConsumerDashboard = () => {
  const { user } = useAuth();
  const { convertPrice } = useCurrency();
  const [stats, setStats] = useState<BookingStats>({ total: 0, upcoming: 0, completed: 0 });
  const [spendingStats, setSpendingStats] = useState<SpendingStats>({
    totalSpent: 0,
    thisMonth: 0,
    lastMonth: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("*")
        .or(`user_id.eq.${user.id},guest_email.eq.${user.email}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const allBookings = bookings || [];

      const upcoming = allBookings.filter((b) => {
        const travelDate = b.travel_date || b.event_date;
        return travelDate && new Date(travelDate) > now && b.status !== "cancelled";
      }).length;

      const completed = allBookings.filter((b) => {
        const travelDate = b.travel_date || b.event_date;
        return travelDate && new Date(travelDate) <= now;
      }).length;

      setStats({ total: allBookings.length, upcoming, completed });

      const confirmedBookings = allBookings.filter(
        (b) => b.payment_status === "paid" || b.status === "confirmed"
      );
      const totalSpent = confirmedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

      const thisMonthBookings = confirmedBookings.filter(
        (b) => new Date(b.created_at) >= startOfMonth
      );
      const thisMonth = thisMonthBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

      const lastMonthBookings = confirmedBookings.filter((b) => {
        const date = new Date(b.created_at);
        return date >= startOfLastMonth && date <= endOfLastMonth;
      });
      const lastMonth = lastMonthBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

      setSpendingStats({ totalSpent, thisMonth, lastMonth });
      setRecentBookings(allBookings.slice(0, 5));
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  const quickActions = [
    { to: "/", icon: Bus, label: "Bus", color: "bg-blue-500/10 text-blue-600" },
    { to: "/?tab=event", icon: Calendar, label: "Event", color: "bg-purple-500/10 text-purple-600" },
    { to: "/?tab=stay", icon: Building2, label: "Stay", color: "bg-amber-500/10 text-amber-600" },
    { to: "/?tab=workspace", icon: Briefcase, label: "Work", color: "bg-green-500/10 text-green-600" },
    { to: "/rides", icon: Car, label: "Ride", color: "bg-cyan-500/10 text-cyan-600" },
  ];

  const spendingChange = spendingStats.lastMonth > 0 
    ? Math.round(((spendingStats.thisMonth - spendingStats.lastMonth) / spendingStats.lastMonth) * 100)
    : 0;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Header */}
      <PremiumDashboardHeader
        title=""
        greeting
        userName={userName}
        subtitle="Here's what's happening with your travels."
      />

      {/* Stats Grid */}
      <PremiumStatsGrid columns={4}>
        <PremiumStatsCard
          title="Total Bookings"
          value={loading ? "-" : stats.total.toString()}
          icon={Ticket}
          loading={loading}
          delay={0}
        />
        <PremiumStatsCard
          title="Upcoming"
          value={loading ? "-" : stats.upcoming.toString()}
          icon={Calendar}
          iconColor="bg-green-500/10 text-green-600"
          loading={loading}
          delay={0.1}
        />
        <PremiumStatsCard
          title="Completed"
          value={loading ? "-" : stats.completed.toString()}
          icon={Clock}
          iconColor="bg-blue-500/10 text-blue-600"
          loading={loading}
          delay={0.2}
        />
        <PremiumStatsCard
          title="Total Spent"
          value={loading ? "-" : convertPrice(spendingStats.totalSpent)}
          icon={Wallet}
          iconColor="bg-purple-500/10 text-purple-600"
          loading={loading}
          delay={0.3}
        />
      </PremiumStatsGrid>

      {/* Quick Actions */}
      <PremiumQuickActionGrid
        title="Quick Actions"
        actions={quickActions}
        columns={5}
      />

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 bg-gradient-to-r from-card to-muted/30">
              <CardTitle className="text-base">Recent Bookings</CardTitle>
              <Link to="/account/bookings">
                <Button variant="ghost" size="sm" className="gap-1 text-primary hover:bg-primary/10">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <PremiumBookingList
                  bookings={recentBookings}
                  formatPrice={convertPrice}
                  emptyState={
                    <PremiumEmptyState
                      icon={Ticket}
                      title="No bookings yet"
                      description="Start your journey by making your first booking"
                      action={
                        <Button asChild variant="default">
                          <Link to="/">Browse Options</Link>
                        </Button>
                      }
                    />
                  }
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Spending Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="overflow-hidden h-full">
            <CardHeader className="pb-3 bg-gradient-to-r from-card to-primary/5">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                Spending Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-3">
                <motion.div 
                  className="flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                   <span className="text-sm text-muted-foreground">This Month</span>
                   <span className="font-semibold">
                     {loading ? <Skeleton className="h-4 w-16" /> : <AnimatedCounter value={spendingStats.thisMonth} formatter={(v) => convertPrice(v)} />}
                   </span>
                </motion.div>
                <motion.div 
                  className="flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 }}
                >
                   <span className="text-sm text-muted-foreground">Last Month</span>
                   <span className="font-medium">
                     {loading ? <Skeleton className="h-4 w-16" /> : <AnimatedCounter value={spendingStats.lastMonth} formatter={(v) => convertPrice(v)} />}
                   </span>
                </motion.div>
                
                <div className="h-px bg-border" />
                
                <motion.div 
                  className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/10"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <span className="text-sm font-medium">All Time</span>
                  <div className="text-right">
                     <span className="font-bold text-primary text-lg">
                       {loading ? <Skeleton className="h-5 w-20" /> : <AnimatedCounter value={spendingStats.totalSpent} formatter={(v) => convertPrice(v)} />}
                     </span>
                    {!loading && spendingChange !== 0 && (
                      <p className={`text-xs ${spendingChange > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        {spendingChange > 0 ? '+' : ''}{spendingChange}% vs last month
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>

              <BounceTap>
                <Button asChild variant="outline" className="w-full hover:bg-primary/5">
                  <Link to="/pay">View Transactions</Link>
                </Button>
              </BounceTap>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ConsumerDashboard;
