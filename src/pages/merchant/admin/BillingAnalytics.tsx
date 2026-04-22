import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Receipt,
  PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BillingStats {
  totalCollected: number;
  pendingCollection: number;
  collectionRate: number;
  avgBillAmount: number;
  monthlyTrend: number;
}

const BillingAnalytics = () => {
  const { convertPrice } = useCurrency();
  const [stats, setStats] = useState<BillingStats>({
    totalCollected: 0,
    pendingCollection: 0,
    collectionRate: 0,
    avgBillAmount: 0,
    monthlyTrend: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Mock data
      setStats({
        totalCollected: 125000,
        pendingCollection: 18500,
        collectionRate: 87,
        avgBillAmount: 1250,
        monthlyTrend: 8.5,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
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
      <div>
        <h1 className="text-xl font-semibold">Billing Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Platform billing and collection metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Collected"
          value={convertPrice(stats.totalCollected)}
          icon={DollarSign}
          trend={stats.monthlyTrend}
        />
        <StatCard
          title="Pending Collection"
          value={convertPrice(stats.pendingCollection)}
          icon={Receipt}
        />
        <StatCard
          title="Collection Rate"
          value={`${stats.collectionRate}%`}
          icon={PieChart}
          trend={2.3}
        />
        <StatCard
          title="Avg Bill Amount"
          value={convertPrice(stats.avgBillAmount)}
          icon={Users}
        />
      </div>

      {/* Collection by Vertical */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Collection by Vertical</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Bus Operators", collected: 55000, pending: 8000 },
              { name: "Event Organizers", collected: 32000, pending: 5000 },
              { name: "Property Owners", collected: 22000, pending: 3500 },
              { name: "Venue Owners", collected: 16000, pending: 2000 },
            ].map((item) => {
              const total = item.collected + item.pending;
              const percentage = (item.collected / total) * 100;
              return (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.name}</span>
                    <span className="text-muted-foreground">
                      {convertPrice(item.collected)} / {convertPrice(total)}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Collection Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-40">
            {[65, 72, 58, 80, 75, 92, 85, 88, 78, 95, 102, 110].map(
              (value, i) => (
                <div
                  key={i}
                  className="flex-1 bg-primary/20 rounded-t relative group"
                  style={{ height: `${(value / 110) * 100}%` }}
                >
                  <div
                    className="absolute inset-0 bg-primary rounded-t opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              )
            )}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Jan</span>
            <span>Jun</span>
            <span>Dec</span>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Summary */}
      <Card className="border-yellow-500/50 bg-yellow-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-500/20">
              <Receipt className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium">12 Overdue Invoices</p>
              <p className="text-sm text-muted-foreground">
                Total outstanding: {convertPrice(8500)}
              </p>
            </div>
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
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: number;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 rounded-full bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              "flex items-center text-xs",
              trend > 0 ? "text-green-600" : "text-red-600"
            )}
          >
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{title}</p>
    </CardContent>
  </Card>
);

export default BillingAnalytics;
