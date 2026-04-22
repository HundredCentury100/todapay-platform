import { supabase } from "@/integrations/supabase/client";
import { AgentClient } from "@/types/merchant";

export const getAgentClients = async (agentProfileId: string): Promise<AgentClient[]> => {
  const { data, error } = await supabase
    .from('agent_clients')
    .select('*')
    .eq('agent_profile_id', agentProfileId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createAgentClient = async (
  agentProfileId: string,
  clientData: {
    client_name: string;
    client_email: string;
    client_phone?: string;
    client_company?: string;
    client_passport?: string;
    notes?: string;
  }
): Promise<AgentClient> => {
  const { data, error } = await supabase
    .from('agent_clients')
    .insert({
      agent_profile_id: agentProfileId,
      ...clientData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateAgentClient = async (
  clientId: string,
  updates: Partial<AgentClient>
): Promise<AgentClient> => {
  const { data, error } = await supabase
    .from('agent_clients')
    .update(updates)
    .eq('id', clientId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteAgentClient = async (clientId: string): Promise<void> => {
  const { error } = await supabase
    .from('agent_clients')
    .delete()
    .eq('id', clientId);

  if (error) throw error;
};

export const getAgentDashboardMetrics = async (agentProfileId: string) => {
  // Get total bookings
  const { count: totalBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('booked_by_agent_id', agentProfileId);

  // Get total commissions
  const { data: commissions } = await supabase
    .from('agent_commissions')
    .select('commission_amount, status')
    .eq('agent_profile_id', agentProfileId);

  const totalEarned = commissions
    ?.filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

  const pendingCommissions = commissions
    ?.filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

  // Get active clients
  const { count: activeClients } = await supabase
    .from('agent_clients')
    .select('*', { count: 'exact', head: true })
    .eq('agent_profile_id', agentProfileId);

  return {
    totalBookings: totalBookings || 0,
    totalEarned,
    pendingCommissions,
    activeClients: activeClients || 0,
  };
};

export const getAgentBookings = async (agentProfileId: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      agent_clients (
        client_name,
        client_email,
        client_company
      )
    `)
    .eq('booked_by_agent_id', agentProfileId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getAgentRevenueData = async (agentProfileId: string, days: number = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('bookings')
    .select('created_at, total_price')
    .eq('booked_by_agent_id', agentProfileId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Group by date
  const revenueByDate = (data || []).reduce((acc: any, booking) => {
    const date = new Date(booking.created_at).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { date, revenue: 0, bookings: 0 };
    }
    acc[date].revenue += Number(booking.total_price);
    acc[date].bookings += 1;
    return acc;
  }, {});

  return Object.values(revenueByDate);
};

export const getClientPerformance = async (agentProfileId: string) => {
  const { data, error } = await supabase
    .from('agent_clients')
    .select('*')
    .eq('agent_profile_id', agentProfileId)
    .order('total_revenue', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data || [];
};
