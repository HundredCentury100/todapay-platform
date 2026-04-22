import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, Receipt } from "lucide-react";

export default function AgentPerformance() {
  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['agent-performance'],
    queryFn: async () => {
      const { data: agentsData, error: agentsError } = await supabase
        .from('merchant_profiles')
        .select('*')
        .in('role', ['travel_agent', 'booking_agent'])
        .eq('verification_status', 'verified')
        .order('created_at', { ascending: false });

      if (agentsError) throw agentsError;

      // Get performance metrics for each agent
      const agentsWithMetrics = await Promise.all(
        (agentsData || []).map(async (agent) => {
          // Get total bookings
          const { count: bookingCount } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('booked_by_agent_id', agent.id);

          // Get total commissions
          const { data: commissionsData } = await supabase
            .from('agent_commissions')
            .select('commission_amount, status')
            .eq('agent_profile_id', agent.id);

          const totalEarned = commissionsData
            ?.filter(c => c.status === 'paid')
            .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

          const pendingCommissions = commissionsData
            ?.filter(c => c.status === 'pending' || c.status === 'approved')
            .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

          // Get client count
          const { count: clientCount } = await supabase
            .from('agent_clients')
            .select('*', { count: 'exact', head: true })
            .eq('agent_profile_id', agent.id);

          return {
            ...agent,
            metrics: {
              totalBookings: bookingCount || 0,
              totalEarned,
              pendingCommissions,
              clientCount: clientCount || 0,
            },
          };
        })
      );

      return agentsWithMetrics;
    },
  });

  // Calculate platform totals
  const platformTotals = agents.reduce(
    (acc, agent) => ({
      bookings: acc.bookings + agent.metrics.totalBookings,
      earned: acc.earned + agent.metrics.totalEarned,
      pending: acc.pending + agent.metrics.pendingCommissions,
      clients: acc.clients + agent.metrics.clientCount,
    }),
    { bookings: 0, earned: 0, pending: 0, clients: 0 }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Agent Performance</h1>
        <p className="text-muted-foreground mt-1">
          Monitor agent activity and performance metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformTotals.bookings}</div>
            <p className="text-xs text-muted-foreground">By all agents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R {platformTotals.earned.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Commission paid out</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R {platformTotals.pending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformTotals.clients}</div>
            <p className="text-xs text-muted-foreground">Managed by agents</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Performance Overview</CardTitle>
          <CardDescription>
            Individual agent metrics and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Commission Rate</TableHead>
                <TableHead>Total Bookings</TableHead>
                <TableHead>Clients</TableHead>
                <TableHead>Earned</TableHead>
                <TableHead>Pending</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No verified agents yet
                  </TableCell>
                </TableRow>
              ) : (
                agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">{agent.business_name}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{agent.agent_code || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={agent.role === 'travel_agent' ? 'border-primary text-primary' : 'border-orange-500 text-orange-600'}
                      >
                        {agent.role === 'travel_agent' ? 'Internal' : 'External'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="capitalize">{agent.agent_tier}</Badge>
                    </TableCell>
                    <TableCell>{agent.commission_rate}%</TableCell>
                    <TableCell>{agent.metrics.totalBookings}</TableCell>
                    <TableCell>{agent.metrics.clientCount}</TableCell>
                    <TableCell className="text-green-600 font-semibold">
                      R {agent.metrics.totalEarned.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-yellow-600">
                      R {agent.metrics.pendingCommissions.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
