import { supabase } from "@/integrations/supabase/client";

export interface AgentPaymentRecord {
  id: string;
  agent_profile_id: string;
  booking_id: string;
  transaction_id?: string;
  commission_id?: string;
  payment_type: 'agent_to_merchant' | 'client_to_agent' | 'agent_to_client';
  amount: number;
  payment_method: string;
  payment_reference?: string;
  payment_proof_url?: string;
  status: 'pending' | 'verified' | 'disputed' | 'completed';
  notes?: string;
  verified_by?: string;
  verified_at?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export const agentRemittanceService = {
  // Create payment record for agent-to-merchant remittance
  async createRemittanceRecord(
    agentProfileId: string,
    bookingId: string,
    transactionId: string,
    amount: number,
    paymentMethod: string,
    commissionId?: string,
    dueDate?: Date
  ): Promise<AgentPaymentRecord> {
    const { data, error } = await supabase
      .from('agent_payment_records')
      .insert({
        agent_profile_id: agentProfileId,
        booking_id: bookingId,
        transaction_id: transactionId,
        commission_id: commissionId,
        payment_type: 'agent_to_merchant' as const,
        amount,
        payment_method: paymentMethod,
        status: 'pending' as const,
        due_date: dueDate?.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as AgentPaymentRecord;
  },

  // Get pending remittances for an agent
  async getPendingRemittances(agentProfileId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('agent_payment_records')
      .select(`
        *,
        bookings:booking_id (
          booking_reference,
          item_name,
          passenger_name,
          travel_date,
          event_date,
          total_price
        )
      `)
      .eq('agent_profile_id', agentProfileId)
      .eq('payment_type', 'agent_to_merchant')
      .eq('status', 'pending')
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get all remittances for an agent
  async getAgentRemittances(
    agentProfileId: string,
    status?: 'pending' | 'verified' | 'disputed' | 'completed'
  ): Promise<any[]> {
    let query = supabase
      .from('agent_payment_records')
      .select(`
        *,
        bookings:booking_id (
          booking_reference,
          item_name,
          passenger_name,
          travel_date,
          event_date,
          total_price
        )
      `)
      .eq('agent_profile_id', agentProfileId)
      .eq('payment_type', 'agent_to_merchant')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Upload payment proof
  async uploadPaymentProof(recordId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${recordId}-${Date.now()}.${fileExt}`;
    const filePath = `payment-proofs/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('payment_proofs')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('payment_proofs')
      .getPublicUrl(filePath);

    // Update record with proof URL
    const { error: updateError } = await supabase
      .from('agent_payment_records')
      .update({ payment_proof_url: publicUrl })
      .eq('id', recordId);

    if (updateError) throw updateError;

    return publicUrl;
  },

  // Update remittance record with payment details
  async updateRemittancePayment(
    recordId: string,
    paymentReference: string,
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('agent_payment_records')
      .update({
        payment_reference: paymentReference,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId);

    if (error) throw error;
  },

  // Merchant verifies remittance payment
  async verifyRemittance(
    recordId: string,
    merchantProfileId: string,
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('agent_payment_records')
      .update({
        status: 'verified',
        verified_by: merchantProfileId,
        verified_at: new Date().toISOString(),
        notes: notes || null,
      })
      .eq('id', recordId);

    if (error) throw error;
  },

  // Mark remittance as completed
  async completeRemittance(recordId: string): Promise<void> {
    const { error } = await supabase
      .from('agent_payment_records')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId);

    if (error) throw error;
  },

  // Create client-to-agent payment record
  async createClientPaymentRecord(
    agentProfileId: string,
    bookingId: string,
    amount: number,
    paymentMethod: string
  ): Promise<AgentPaymentRecord> {
    const { data, error } = await supabase
      .from('agent_payment_records')
      .insert({
        agent_profile_id: agentProfileId,
        booking_id: bookingId,
        payment_type: 'client_to_agent' as const,
        amount,
        payment_method: paymentMethod,
        status: 'pending' as const,
      })
      .select()
      .single();

    if (error) throw error;
    return data as AgentPaymentRecord;
  },

  // Get remittance summary for agent
  async getRemittanceSummary(agentProfileId: string): Promise<{
    totalPending: number;
    totalVerified: number;
    totalCompleted: number;
    overdueCount: number;
  }> {
    const { data, error } = await supabase
      .from('agent_payment_records')
      .select('amount, status, due_date')
      .eq('agent_profile_id', agentProfileId)
      .eq('payment_type', 'agent_to_merchant');

    if (error) throw error;

    const summary = {
      totalPending: 0,
      totalVerified: 0,
      totalCompleted: 0,
      overdueCount: 0,
    };

    const now = new Date();

    data?.forEach((record) => {
      if (record.status === 'pending') {
        summary.totalPending += Number(record.amount);
        if (record.due_date && new Date(record.due_date) < now) {
          summary.overdueCount++;
        }
      } else if (record.status === 'verified') {
        summary.totalVerified += Number(record.amount);
      } else if (record.status === 'completed') {
        summary.totalCompleted += Number(record.amount);
      }
    });

    return summary;
  },
};
