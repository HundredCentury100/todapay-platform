import { useQuery } from "@tanstack/react-query";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { getAgentDashboardMetrics } from "@/services/agentService";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, Users, Zap, FileText, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { QuickClientSearch } from "@/components/agent/QuickClientSearch";
import { getAgentClients } from "@/services/agentService";
import { AgentClient } from "@/types/merchant";
import { subscribeToWebPush } from "@/services/notificationService";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";
import { AgentFloatBalanceCard } from "@/components/agent/AgentFloatBalanceCard";
import { getFloatAccount } from "@/services/agentFloatService";

export default function TravelAgentDashboard() {
  const { merchantProfile } = useMerchantAuth();
  const navigate = useNavigate();
  const [showClientSearch, setShowClientSearch] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['agent-clients', merchantProfile?.id],
    queryFn: () => merchantProfile ? getAgentClients(merchantProfile.id) : Promise.resolve([]),
    enabled: !!merchantProfile?.id,
  });

  useEffect(() => {
    if (merchantProfile?.id) {
      subscribeToWebPush(merchantProfile.id);
    }
  }, [merchantProfile?.id]);

  const handleSelectClient = (client: AgentClient) => {
    setShowClientSearch(false);
    navigate('/', { state: { selectedClient: client } });
  };

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['agent-metrics', merchantProfile?.id],
    queryFn: () => merchantProfile ? getAgentDashboardMetrics(merchantProfile.id) : Promise.resolve(null),
    enabled: !!merchantProfile?.id,
  });

  const isExternalAgent = merchantProfile?.role === 'booking_agent';

  const { data: floatAccount, isLoading: floatLoading } = useQuery({
    queryKey: ['agent-float-account', merchantProfile?.id],
    queryFn: () => merchantProfile ? getFloatAccount(merchantProfile.id) : Promise.resolve(null),
    enabled: !!merchantProfile?.id && isExternalAgent,
  });

  const { data: billStats } = useQuery({
    queryKey: ['agent-bill-stats', merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return null;
      const today = new Date();
      const { data, error } = await supabase
        .from("bill_payments")
        .select("amount, status")
        .eq("agent_profile_id", merchantProfile.id)
        .gte("created_at", startOfDay(today).toISOString())
        .lte("created_at", endOfDay(today).toISOString());
      if (error) throw error;
      const todayTotal = (data || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      const todayCount = data?.length || 0;
      return { todayTotal, todayCount };
    },
    enabled: !!merchantProfile?.id,
  });

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = [
    {
      name: "Today's Bills",
      value: `$ ${(billStats?.todayTotal || 0).toFixed(2)}`,
      icon: Zap,
      change: `${billStats?.todayCount || 0} transactions`,
    },
    {
      name: "Total Bookings",
      value: metrics?.totalBookings || 0,
      icon: Receipt,
      change: `${metrics?.pendingCommissions ? 'Pending: $' + metrics.pendingCommissions.toFixed(2) : 'All time'}`,
    },
    {
      name: "Commission Earned",
      value: `$ ${(metrics?.totalEarned || 0).toFixed(2)}`,
      icon: DollarSign,
      change: `${metrics?.pendingCommissions ? '$' + metrics.pendingCommissions.toFixed(2) + ' pending' : 'No pending'}`,
    },
    {
      name: "Active Clients",
      value: metrics?.activeClients || 0,
      icon: Users,
      change: "Registered clients",
    },
  ];

  return (
    <>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pb-24 md:pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Agent Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back! Here's your performance overview.
            </p>
          </div>
          <Button 
            onClick={() => setShowClientSearch(true)}
            className="w-full sm:w-auto"
          >
            Book for Client
          </Button>
        </div>

        {isExternalAgent && (
          <AgentFloatBalanceCard floatAccount={floatAccount || null} isLoading={floatLoading} />
        )}

        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
                    {stat.name}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
                  <div className="text-lg sm:text-2xl font-bold truncate">{stat.value}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Staff Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="font-semibold">{merchantProfile?.business_name || 'Agent'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tier</span>
              <span className="font-semibold capitalize">{merchantProfile?.agent_tier || 'Standard'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Agent Code</span>
              <span className="font-mono text-sm font-bold">{merchantProfile?.agent_code || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Type</span>
              <Badge variant="outline" className={merchantProfile?.role === 'travel_agent' ? 'border-primary text-primary' : 'border-orange-500 text-orange-600'}>
                {merchantProfile?.role === 'travel_agent' ? 'Internal' : 'External'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Referral Code</span>
              <span className="font-mono text-sm">{merchantProfile?.referral_code || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" onClick={() => navigate('/merchant/agent/bill-pay')}>
              <Zap className="w-4 h-4 mr-2" /> Pay Bills
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              New Booking
            </Button>
            <Button variant="outline" onClick={() => navigate('/merchant/agent/clients')}>
              Manage Clients
            </Button>
            <Button variant="outline" onClick={() => navigate('/merchant/agent/bill-reconciliation')}>
              <FileText className="w-4 h-4 mr-2" /> Reconciliation
            </Button>
          </CardContent>
        </Card>
      </div>

      <QuickClientSearch
        open={showClientSearch}
        onClose={() => setShowClientSearch(false)}
        clients={clients}
        onSelectClient={handleSelectClient}
      />
    </>
  );
}