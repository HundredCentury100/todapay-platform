import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, TrendingUp, Calendar, Download,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfWeek, startOfMonth, startOfDay } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";

const DriverEarningsPage = () => {
  const { user } = useAuth();
  const { convertPrice } = useCurrency();
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");
  const [earnings, setEarnings] = useState({
    total: 0,
    trips: 0,
    tips: 0,
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchEarnings = async () => {
      setLoading(true);

      const { data: driver } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (driver) {
        let dateFilter: Date;
        if (period === "today") {
          dateFilter = startOfDay(new Date());
        } else if (period === "week") {
          dateFilter = startOfWeek(new Date());
        } else {
          dateFilter = startOfMonth(new Date());
        }

        const { data: rides, count } = await supabase
          .from("active_rides")
          .select("final_price, tip_amount, pickup_time, dropoff_time", { count: "exact" })
          .eq("driver_id", driver.id)
          .eq("status", "completed")
          .gte("created_at", dateFilter.toISOString())
          .order("created_at", { ascending: false });

        const totalEarnings = rides?.reduce((sum, r) => sum + (r.final_price || 0), 0) || 0;
        const totalTips = rides?.reduce((sum, r) => sum + (r.tip_amount || 0), 0) || 0;

        setEarnings({
          total: totalEarnings,
          trips: count || 0,
          tips: totalTips,
        });

        setTransactions(rides || []);
      }

      setLoading(false);
    };

    fetchEarnings();
  }, [user, period]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-36 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Earnings</h1>
          <p className="text-sm text-muted-foreground">Track your income</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Period Selector */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="col-span-2 bg-gradient-to-br from-primary to-primary/80">
          <CardContent className="p-5 text-primary-foreground">
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="h-7 w-7 opacity-80" />
              {earnings.trips > 0 && (
                <div className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>{earnings.trips} trips</span>
                </div>
              )}
            </div>
            <p className="text-sm opacity-80 mb-0.5">Total Earnings</p>
            <p className="text-3xl font-bold">{convertPrice(earnings.total, 'USD')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Trips</span>
            </div>
            <p className="text-2xl font-bold">{earnings.trips}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tips</span>
            </div>
            <p className="text-2xl font-bold">{convertPrice(earnings.tips, 'USD')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Trips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No trips in this period
            </div>
          ) : (
            transactions.slice(0, 15).map((tx, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <ArrowDownRight className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Trip Completed</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.dropoff_time ? format(new Date(tx.dropoff_time), "MMM d, h:mm a") : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600 text-sm">
                    +{convertPrice(tx.final_price || 0, 'USD')}
                  </p>
                  {tx.tip_amount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      +{convertPrice(tx.tip_amount, 'USD')} tip
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverEarningsPage;
