import { useQuery } from "@tanstack/react-query";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RevenueChart from "@/components/merchant/RevenueChart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAgentRevenueData, getClientPerformance, getAgentBookings } from "@/services/agentService";
import { TrendingUp, TrendingDown, Users, DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function AgentAnalyticsPage() {
  const { merchantProfile } = useMerchantAuth();

  const { data: revenueData = [] } = useQuery({
    queryKey: ['agent-revenue', merchantProfile?.id],
    queryFn: () => merchantProfile ? getAgentRevenueData(merchantProfile.id, 30) : Promise.resolve([]),
    enabled: !!merchantProfile?.id,
  });

  const { data: clientPerformance = [] } = useQuery({
    queryKey: ['client-performance', merchantProfile?.id],
    queryFn: () => merchantProfile ? getClientPerformance(merchantProfile.id) : Promise.resolve([]),
    enabled: !!merchantProfile?.id,
  });

  const { data: recentBookings = [] } = useQuery({
    queryKey: ['agent-bookings', merchantProfile?.id],
    queryFn: () => merchantProfile ? getAgentBookings(merchantProfile.id) : Promise.resolve([]),
    enabled: !!merchantProfile?.id,
  });

  const totalRevenue = revenueData.reduce((sum, day) => sum + day.revenue, 0);
  const totalBookings = revenueData.reduce((sum, day) => sum + day.bookings, 0);
  const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  const previousRevenue = revenueData
    .slice(0, Math.floor(revenueData.length / 2))
    .reduce((sum, day) => sum + day.revenue, 0);
  const recentRevenue = revenueData
    .slice(Math.floor(revenueData.length / 2))
    .reduce((sum, day) => sum + day.revenue, 0);
  const revenueGrowth = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Performance insights and trends (Last 30 Days)
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {revenueGrowth >= 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{revenueGrowth.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">{revenueGrowth.toFixed(1)}%</span>
                </>
              )}
              vs previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Booking Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R {avgBookingValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientPerformance.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              With bookings
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={revenueData} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Clients by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientPerformance.slice(0, 10).map((client) => (
                  <TableRow key={client.client_id}>
                    <TableCell className="font-medium">{client.client_name}</TableCell>
                    <TableCell className="text-right">R {Number(client.total_revenue).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{client.booking_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <div className="font-medium">{booking.item_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {booking.agent_clients?.client_name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">R {Number(booking.total_price).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(booking.created_at), 'MMM dd')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
