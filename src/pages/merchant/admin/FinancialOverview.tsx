import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialStats {
  totalRevenue: number;
  platformFees: number;
  pendingPayouts: number;
  monthlyGrowth: number;
}

const FinancialOverview = () => {
  const { convertPrice } = useCurrency();
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    platformFees: 0,
    pendingPayouts: 0,
    monthlyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancials();
  }, []);

  const loadFinancials = async () => {
    try {
      // Get total from paid bookings
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("total_price")
        .eq("payment_status", "paid");

      if (error) throw error;

      const totalRevenue = bookings?.reduce(
        (sum, b) => sum + (b.total_price || 0),
        0
      ) || 0;
      const platformFees = totalRevenue * 0.05; // 5% platform fee

      setStats({
        totalRevenue,
        platformFees,
        pendingPayouts: totalRevenue * 0.1, // Mock pending payouts
        monthlyGrowth: 12.5, // Mock growth
      });
    } catch (error) {
      console.error("Error loading financials:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Financial Overview</h1>
        <p className="text-sm text-muted-foreground">
          Platform-wide financial metrics and analytics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={convertPrice(stats.totalRevenue)}
          icon={DollarSign}
          trend={{ value: stats.monthlyGrowth, positive: true }}
        />
        <StatCard
          title="Platform Fees"
          value={convertPrice(stats.platformFees)}
          icon={Receipt}
          subtitle="5% of transactions"
        />
        <StatCard
          title="Pending Payouts"
          value={convertPrice(stats.pendingPayouts)}
          icon={CreditCard}
          subtitle="Awaiting disbursement"
        />
        <StatCard
          title="Monthly Growth"
          value={`${stats.monthlyGrowth}%`}
          icon={TrendingUp}
          trend={{ value: stats.monthlyGrowth, positive: stats.monthlyGrowth > 0 }}
        />
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue by Vertical</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Bus Tickets", percentage: 45 },
              { name: "Events", percentage: 25 },
              { name: "Ride-hailing", percentage: 15 },
              { name: "Stays", percentage: 10 },
              { name: "Workspaces", percentage: 5 },
            ].map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.name}</span>
                  <span className="font-medium">{item.percentage}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <button className="p-4 rounded-lg border hover:bg-muted/50 text-left transition-colors">
            <Receipt className="h-5 w-5 mb-2 text-primary" />
            <p className="font-medium text-sm">View Transactions</p>
            <p className="text-xs text-muted-foreground">All platform transactions</p>
          </button>
          <button className="p-4 rounded-lg border hover:bg-muted/50 text-left transition-colors">
            <CreditCard className="h-5 w-5 mb-2 text-primary" />
            <p className="font-medium text-sm">Process Payouts</p>
            <p className="text-xs text-muted-foreground">Merchant disbursements</p>
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
  subtitle?: string;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 rounded-full bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center text-xs",
              trend.positive ? "text-green-600" : "text-red-600"
            )}
          >
            {trend.positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">
        {subtitle || title}
      </p>
    </CardContent>
  </Card>
);

export default FinancialOverview;
