import { supabase } from "@/integrations/supabase/client";

export interface PayoutRequest {
  id: string;
  agent_profile_id: string;
  amount: number;
  payment_method: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  payment_reference?: string;
  notes?: string;
}

export const getPayoutRequests = async (agentProfileId: string): Promise<PayoutRequest[]> => {
  const { data, error } = await supabase
    .from('agent_payout_requests')
    .select('*')
    .eq('agent_profile_id', agentProfileId)
    .order('requested_at', { ascending: false });

  if (error) throw error;
  return (data || []) as PayoutRequest[];
};

export const createPayoutRequest = async (
  agentProfileId: string,
  amount: number,
  paymentMethod: string
): Promise<PayoutRequest> => {
  const { data, error } = await supabase
    .from('agent_payout_requests')
    .insert({
      agent_profile_id: agentProfileId,
      amount,
      payment_method: paymentMethod,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data as PayoutRequest;
};

export const getApprovedCommissionsTotal = async (agentProfileId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('agent_commissions')
    .select('commission_amount')
    .eq('agent_profile_id', agentProfileId)
    .eq('status', 'approved');

  if (error) throw error;
  
  return data?.reduce((sum, commission) => sum + Number(commission.commission_amount), 0) || 0;
};

export const getPayoutRequestsThisMonth = async (agentProfileId: string): Promise<number> => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('agent_payout_requests')
    .select('id')
    .eq('agent_profile_id', agentProfileId)
    .neq('status', 'rejected')
    .gte('requested_at', startOfMonth.toISOString());

  if (error) throw error;
  return data?.length || 0;
};

// Admin functions
export const getAllPayoutRequests = async () => {
  const { data, error } = await supabase
    .from('agent_payout_requests')
    .select(`
      *,
      merchant_profiles!agent_payout_requests_agent_profile_id_fkey(business_name, business_email)
    `)
    .order('requested_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const approvePayoutRequest = async (requestId: string, adminId: string, paymentReference?: string) => {
  // Get request details
  const { data: request } = await supabase
    .from('agent_payout_requests')
    .select('*, merchant_profiles!agent_payout_requests_agent_profile_id_fkey(business_name, business_email)')
    .eq('id', requestId)
    .single();

  const { error } = await supabase
    .from('agent_payout_requests')
    .update({
      status: 'approved',
      processed_at: new Date().toISOString(),
      processed_by: adminId,
      payment_reference: paymentReference
    })
    .eq('id', requestId);

  if (error) throw error;

  // Send notification
  if (request) {
    const profile = request.merchant_profiles as any;
    
    await supabase.from('agent_notifications').insert({
      agent_profile_id: request.agent_profile_id,
      notification_type: 'payout_processed',
      title: 'Payout Approved',
       body: `Your payout request of $${request.amount.toFixed(2)} has been approved.`,
      data: { 
        amount: request.amount,
        paymentMethod: request.payment_method,
        reference: paymentReference
      }
    });

    // Send email
    await supabase.functions.invoke('send-agent-email', {
      body: {
        agentEmail: profile.business_email,
        agentName: profile.business_name,
        notificationType: 'payout_processed',
        title: 'Payout Approved',
        body: `Your payout request of $${request.amount.toFixed(2)} has been approved.`,
        data: { 
          amount: request.amount,
          paymentMethod: request.payment_method,
          reference: paymentReference
        }
      }
    });
  }
};

export const rejectPayoutRequest = async (requestId: string, adminId: string, notes: string) => {
  const { error } = await supabase
    .from('agent_payout_requests')
    .update({
      status: 'rejected',
      processed_at: new Date().toISOString(),
      processed_by: adminId,
      notes
    })
    .eq('id', requestId);

  if (error) throw error;
};

export const markPayoutAsPaid = async (requestId: string, adminId: string, paymentReference: string) => {
  // Get request details
  const { data: request } = await supabase
    .from('agent_payout_requests')
    .select('*, merchant_profiles!agent_payout_requests_agent_profile_id_fkey(business_name, business_email)')
    .eq('id', requestId)
    .single();

  const { error } = await supabase
    .from('agent_payout_requests')
    .update({
      status: 'paid',
      processed_at: new Date().toISOString(),
      processed_by: adminId,
      payment_reference: paymentReference
    })
    .eq('id', requestId);

  if (error) throw error;

  // Send notification
  if (request) {
    const profile = request.merchant_profiles as any;
    
    await supabase.from('agent_notifications').insert({
      agent_profile_id: request.agent_profile_id,
      notification_type: 'payout_processed',
      title: 'Payout Processed',
       body: `Your payout of $${request.amount.toFixed(2)} has been processed and paid.`,
      data: { 
        amount: request.amount,
        paymentMethod: request.payment_method,
        reference: paymentReference
      }
    });

    // Send email
    await supabase.functions.invoke('send-agent-email', {
      body: {
        agentEmail: profile.business_email,
        agentName: profile.business_name,
        notificationType: 'payout_processed',
        title: 'Payout Processed',
        body: `Your payout of $${request.amount.toFixed(2)} has been processed and paid.`,
        data: { 
          amount: request.amount,
          paymentMethod: request.payment_method,
          reference: paymentReference
        }
      }
    });
  }
};
