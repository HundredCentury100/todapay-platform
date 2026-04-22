import { supabase } from "@/integrations/supabase/client";
import { AgentCommission } from "@/types/merchant";
import {
  calculateVerticalCommission,
  mapBookingTypeToVertical,
  type BookingVertical,
  type AgentTier,
  type AgentType,
} from "@/config/agentCommissionConfig";

export const getAgentCommissions = async (agentProfileId: string): Promise<AgentCommission[]> => {
  const { data, error } = await supabase
    .from('agent_commissions')
    .select('*')
    .eq('agent_profile_id', agentProfileId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as AgentCommission[];
};

/**
 * Legacy flat-rate calculation (kept for backward compatibility).
 */
export const calculateCommission = (
  bookingAmount: number,
  commissionRate: number
): number => {
  return bookingAmount * (commissionRate / 100);
};

/**
 * Vertical-aware commission calculation using tier multipliers and role caps.
 */
export const calculateVerticalAwareCommission = (
  bookingAmount: number,
  bookingType: string,
  agentTier: AgentTier = 'standard',
  agentType: AgentType = 'internal'
) => {
  const vertical = mapBookingTypeToVertical(bookingType);
  return calculateVerticalCommission(bookingAmount, vertical, agentTier, agentType);
};

export const createCommissionRecord = async (
  agentProfileId: string,
  bookingId: string,
  bookingAmount: number,
  commissionRate: number,
  commissionAmount?: number
): Promise<AgentCommission> => {
  const finalAmount = commissionAmount ?? calculateCommission(bookingAmount, commissionRate);

  const { data, error } = await supabase
    .from('agent_commissions')
    .insert({
      agent_profile_id: agentProfileId,
      booking_id: bookingId,
      booking_amount: bookingAmount,
      commission_rate: commissionRate,
      commission_amount: finalAmount,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data as AgentCommission;
};

export const approveCommission = async (
  commissionId: string,
  adminId: string
): Promise<void> => {
  const { data: commission } = await supabase
    .from('agent_commissions')
    .select('*, merchant_profiles!agent_commissions_agent_profile_id_fkey(business_name, business_email)')
    .eq('id', commissionId)
    .single();

  const { error } = await supabase
    .from('agent_commissions')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: adminId,
    })
    .eq('id', commissionId);

  if (error) throw error;

  if (commission) {
    const profile = commission.merchant_profiles as any;
    
    await supabase.from('agent_notifications').insert({
      agent_profile_id: commission.agent_profile_id,
      notification_type: 'commission_approved',
      title: 'Commission Approved',
      body: `Your commission of R${commission.commission_amount.toFixed(2)} has been approved.`,
      data: { 
        amount: commission.commission_amount,
        status: 'approved',
        commissionId 
      }
    });

    await supabase.functions.invoke('send-agent-email', {
      body: {
        agentEmail: profile.business_email,
        agentName: profile.business_name,
        notificationType: 'commission_approved',
        title: 'Commission Approved',
        body: `Your commission of R${commission.commission_amount.toFixed(2)} has been approved.`,
        data: { 
          amount: commission.commission_amount,
          status: 'approved'
        }
      }
    });
  }
};

export const markCommissionAsPaid = async (
  commissionId: string,
  paymentMethod: string,
  paymentReference: string,
  adminId: string
): Promise<void> => {
  const { error } = await supabase
    .from('agent_commissions')
    .update({
      status: 'paid',
      payment_method: paymentMethod,
      payment_reference: paymentReference,
      paid_at: new Date().toISOString(),
      paid_by: adminId,
    })
    .eq('id', commissionId);

  if (error) throw error;
};

export const getCommissionSummary = async (agentProfileId: string) => {
  const { data: commissions } = await supabase
    .from('agent_commissions')
    .select('*')
    .eq('agent_profile_id', agentProfileId);

  if (!commissions) return {
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0,
    rejected: 0,
  };

  return {
    total: commissions.reduce((sum, c) => sum + Number(c.commission_amount), 0),
    pending: commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + Number(c.commission_amount), 0),
    approved: commissions
      .filter(c => c.status === 'approved')
      .reduce((sum, c) => sum + Number(c.commission_amount), 0),
    paid: commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + Number(c.commission_amount), 0),
    rejected: commissions
      .filter(c => c.status === 'rejected')
      .reduce((sum, c) => sum + Number(c.commission_amount), 0),
  };
};
