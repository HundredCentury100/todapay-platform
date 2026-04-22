import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, TrendingUp, TrendingDown, 
  Calendar, Wallet, Gift, ArrowUpRight
} from "lucide-react";
import { DriverEarnings } from "@/types/ride";
import { getDriverEarnings } from "@/services/rideService";

interface DriverEarningsCardProps {
  driverId: string;
}

export const DriverEarningsCard = ({ driverId }: DriverEarningsCardProps) => {
  const [earnings, setEarnings] = useState<DriverEarnings[]>([]);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [loading, setLoading] = useState(true);

  const getDateRange = (period: string) => {
    const now = new Date();
    const start = new Date();
    
    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
    }
    
    return { start: start.toISOString(), end: now.toISOString() };
  };

  useEffect(() => {
    const fetchEarnings = async () => {
      setLoading(true);
      const { start, end } = getDateRange(period);
      const { data, error } = await getDriverEarnings(driverId, start, end);
      if (!error && data) {
        setEarnings(data);
      }
      setLoading(false);
    };

    fetchEarnings();
  }, [driverId, period]);

  const totalGross = earnings.reduce((sum, e) => sum + e.gross_amount, 0);
  const totalNet = earnings.reduce((sum, e) => sum + e.net_amount, 0);
  const totalTips = earnings.reduce((sum, e) => sum + (e.tip_amount || 0), 0);
  const totalPlatformFee = earnings.reduce((sum, e) => sum + e.platform_fee_amount, 0);
  const tripCount = earnings.length;

  const avgPerTrip = tripCount > 0 ? totalNet / tripCount : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Earnings
          </CardTitle>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as 'today' | 'week' | 'month')}>
            <TabsList className="h-8">
              <TabsTrigger value="today" className="text-xs px-2">Today</TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-2">Week</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-2">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Earnings */}
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-1">Net Earnings</p>
          <p className="text-4xl font-bold text-primary">R{totalNet.toFixed(0)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            from {tripCount} {tripCount === 1 ? 'trip' : 'trips'}
          </p>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-3 w-3" />
              <span className="text-xs">Gross</span>
            </div>
            <p className="font-semibold">R{totalGross.toFixed(0)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingDown className="h-3 w-3" />
              <span className="text-xs">Platform Fee</span>
            </div>
            <p className="font-semibold text-destructive">-R{totalPlatformFee.toFixed(0)}</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <Gift className="h-3 w-3" />
              <span className="text-xs">Tips</span>
            </div>
            <p className="font-semibold text-green-600">+R{totalTips.toFixed(0)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">Avg/Trip</span>
            </div>
            <p className="font-semibold">R{avgPerTrip.toFixed(0)}</p>
          </div>
        </div>

        {/* Payout Status */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div>
            <p className="text-sm font-medium">Available for payout</p>
            <p className="text-xs text-muted-foreground">Weekly payouts on Monday</p>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-600/30">
            R{totalNet.toFixed(0)}
          </Badge>
        </div>

        {/* View Details */}
        <Button variant="outline" className="w-full">
          <Calendar className="h-4 w-4 mr-2" />
          View Earnings History
          <ArrowUpRight className="h-4 w-4 ml-auto" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default DriverEarningsCard;
