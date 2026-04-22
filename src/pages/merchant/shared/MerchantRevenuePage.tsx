import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RevenueStats {
  totalRevenue: number;
  thisMonth: number;
  lastMonth: number;
  pendingPayout: number;
  monthlyGrowth: number;
}

const MerchantRevenuePage = () => {
  const { convertPrice } = useCurrency();
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    thisMonth: 0,
    lastMonth: 0,
    pendingPayout: 0,
    monthlyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevenue();
  }, []);

  const loadRevenue = async () => {
    try {
      // Mock revenue data
      setStats({
        totalRevenue: 45000,
        thisMonth: 5200,
        lastMonth: 4800,
        pendingPayout: 1850,
        monthlyGrowth: 8.3,
      });
    } catch (error) {
      console.error("Error loading revenue:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Revenue</h1>
          <p className="text-sm text-muted-foreground">
            Track your earnings and payouts
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={convertPrice(stats.totalRevenue)}
          icon={DollarSign}
        />
        <StatCard
          title="This Month"
          value={convertPrice(stats.thisMonth)}
          icon={Calendar}
          trend={{ value: stats.monthlyGrowth, positive: stats.monthlyGrowth > 0 }}
        />
        <StatCard
          title="Last Month"
          value={convertPrice(stats.lastMonth)}
          icon={TrendingUp}
        />
        <StatCard
          title="Pending Payout"
          value={convertPrice(stats.pendingPayout)}
          icon={Wallet}
          highlight
        />
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-40">
            {[3200, 4100, 3800, 4500, 4200, 5000, 4800, 5200].map((value, i) => (
              <div
                key={i}
                className="flex-1 bg-primary rounded-t relative group cursor-pointer hover:bg-primary/80 transition-colors"
                style={{ height: `${(value / 5200) * 100}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {convertPrice(value)}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Jun</span>
            <span>Sep</span>
            <span>Jan</span>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { name: "Direct Bookings", amount: 3800, percentage: 73 },
            { name: "Agent Bookings", amount: 1100, percentage: 21 },
            { name: "Corporate", amount: 300, percentage: 6 },
          ].map((source) => (
            <div key={source.name}>
              <div className="flex justify-between text-sm mb-1">
                <span>{source.name}</span>
                <span className="font-medium">{convertPrice(source.amount)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${source.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payout Info */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Next Payout</p>
              <p className="text-2xl font-bold mt-1">
                {convertPrice(stats.pendingPayout)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Scheduled for February 5, 2026
              </p>
            </div>
            <Button>Request Early Payout</Button>
          </div>
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
  highlight,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
  highlight?: boolean;
}) => (
  <Card className={cn(highlight && "border-primary/50 bg-primary/5")}>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={cn("p-2 rounded-full", highlight ? "bg-primary/20" : "bg-muted")}>
          <Icon className={cn("h-4 w-4", highlight ? "text-primary" : "text-muted-foreground")} />
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
      <p className="text-xs text-muted-foreground">{title}</p>
    </CardContent>
  </Card>
);

export default MerchantRevenuePage;
