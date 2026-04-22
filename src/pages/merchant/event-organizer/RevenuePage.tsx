import { useEffect, useState } from "react";
import { getOrganizerRevenue } from "@/services/organizerService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/merchant/StatCard";
import { DollarSign, TrendingUp, CreditCard, Receipt } from "lucide-react";
import RevenueChart from "@/components/merchant/RevenueChart";
import { startOfMonth, endOfMonth, subMonths, format, subDays } from "date-fns";

const RevenuePage = () => {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    paidBookings: 0,
    pendingPayments: 0,
    averageTicketValue: 0,
  });
  const [chartData, setChartData] = useState<Array<{date: string; revenue: number; bookings: number}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRevenue = async () => {
      try {
        const data = await getOrganizerRevenue();
        
        const now = new Date();
        const thisMonthStart = startOfMonth(now);
        const thisMonthEnd = endOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        const totalRevenue = data.reduce((sum, b) => sum + Number(b.total_price), 0);
        const thisMonthRevenue = data
          .filter(b => {
            const date = new Date(b.created_at);
            return date >= thisMonthStart && date <= thisMonthEnd;
          })
          .reduce((sum, b) => sum + Number(b.total_price), 0);
        
        const lastMonthRevenue = data
          .filter(b => {
            const date = new Date(b.created_at);
            return date >= lastMonthStart && date <= lastMonthEnd;
          })
          .reduce((sum, b) => sum + Number(b.total_price), 0);

        const paidBookings = data.filter(b => b.payment_status === 'paid').length;
        const pendingPayments = data
          .filter(b => b.payment_status === 'pending')
          .reduce((sum, b) => sum + Number(b.total_price), 0);

        setMetrics({
          totalRevenue,
          thisMonthRevenue,
          lastMonthRevenue,
          paidBookings,
          pendingPayments,
          averageTicketValue: data.length > 0 ? totalRevenue / data.length : 0,
        });

        // Prepare chart data for last 30 days
        const last30Days = Array.from({ length: 30 }, (_, i) => {
          const date = subDays(now, 29 - i);
          const dateStr = format(date, 'MMM dd');
          const dayData = data.filter(b => 
            format(new Date(b.created_at), 'MMM dd') === dateStr
          );
          return {
            date: dateStr,
            revenue: dayData.reduce((sum, b) => sum + Number(b.total_price), 0),
            bookings: dayData.length
          };
        });
        setChartData(last30Days);
      } catch (error) {
        console.error('Error loading revenue:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRevenue();
  }, []);

  if (loading) {
    return <div>Loading revenue data...</div>;
  }

  const growth = metrics.lastMonthRevenue > 0
    ? ((metrics.thisMonthRevenue - metrics.lastMonthRevenue) / metrics.lastMonthRevenue) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Revenue & Analytics</h1>
        <p className="text-muted-foreground">Financial overview and insights</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`$${metrics.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
        />
        <StatCard
          title="This Month"
          value={`$${metrics.thisMonthRevenue.toFixed(2)}`}
          icon={TrendingUp}
          change={growth}
          changeLabel="vs last month"
        />
        <StatCard
          title="Average Ticket"
          value={`$${metrics.averageTicketValue.toFixed(2)}`}
          icon={Receipt}
        />
        <StatCard
          title="Pending Payments"
          value={`$${metrics.pendingPayments.toFixed(2)}`}
          icon={CreditCard}
        />
      </div>

      <RevenueChart data={chartData} type="bar" />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Paid Bookings</span>
                <span className="font-medium">{metrics.paidBookings}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">This Month Revenue</span>
                <span className="font-medium">${metrics.thisMonthRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Month Revenue</span>
                <span className="font-medium">${metrics.lastMonthRevenue.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending Amount</span>
                <span className="font-medium text-yellow-600">${metrics.pendingPayments.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Collection Rate</span>
                <span className="font-medium">
                  {metrics.totalRevenue > 0 
                    ? ((metrics.totalRevenue - metrics.pendingPayments) / metrics.totalRevenue * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenuePage;
