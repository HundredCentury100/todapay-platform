import { supabase } from "@/integrations/supabase/client";

export interface SplitPaymentRequest {
  id: string;
  booking_id: string | null;
  total_amount: number;
  amount_per_person: number;
  num_participants: number;
  organizer_user_id: string | null;
  organizer_email: string;
  status: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface SplitPaymentContribution {
  id: string;
  split_request_id: string;
  participant_email: string;
  participant_name: string | null;
  amount: number;
  payment_status: string;
  payment_method: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  payment_link: string | null;
  created_at: string;
  updated_at: string;
}

export const splitPaymentService = {
  async createSplitRequest(
    bookingId: string | null,
    totalAmount: number,
    participants: { email: string; name?: string }[],
    expiresInHours: number = 48
  ): Promise<{ request: SplitPaymentRequest; contributions: SplitPaymentContribution[] }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const amountPerPerson = Math.ceil((totalAmount / participants.length) * 100) / 100;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Create split payment request
    const { data: request, error: requestError } = await supabase
      .from('split_payment_requests')
      .insert({
        booking_id: bookingId,
        total_amount: totalAmount,
        amount_per_person: amountPerPerson,
        num_participants: participants.length,
        organizer_user_id: user.id,
        organizer_email: user.email || '',
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (requestError) throw requestError;

    // Create contribution records for each participant
    const contributionRecords = participants.map(p => ({
      split_request_id: request.id,
      participant_email: p.email,
      participant_name: p.name || null,
      amount: amountPerPerson,
      payment_status: 'pending',
      payment_link: `${window.location.origin}/pay/${request.id}?email=${encodeURIComponent(p.email)}`,
    }));

    const { data: contributions, error: contribError } = await supabase
      .from('split_payment_contributions')
      .insert(contributionRecords)
      .select();

    if (contribError) throw contribError;

    return { 
      request: request as SplitPaymentRequest, 
      contributions: contributions as SplitPaymentContribution[] 
    };
  },

  async getSplitRequest(requestId: string): Promise<SplitPaymentRequest | null> {
    const { data, error } = await supabase
      .from('split_payment_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as SplitPaymentRequest | null;
  },

  async getContributions(requestId: string): Promise<SplitPaymentContribution[]> {
    const { data, error } = await supabase
      .from('split_payment_contributions')
      .select('*')
      .eq('split_request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as SplitPaymentContribution[];
  },

  async markContributionPaid(
    contributionId: string,
    paymentMethod: string,
    paymentReference: string
  ): Promise<SplitPaymentContribution> {
    const { data, error } = await supabase
      .from('split_payment_contributions')
      .update({
        payment_status: 'paid',
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        paid_at: new Date().toISOString(),
      })
      .eq('id', contributionId)
      .select()
      .single();

    if (error) throw error;

    // Check if all contributions are paid
    const contributions = await this.getContributions(data.split_request_id);
    const allPaid = contributions.every(c => c.payment_status === 'paid');

    if (allPaid) {
      await supabase
        .from('split_payment_requests')
        .update({ status: 'completed' })
        .eq('id', data.split_request_id);
    }

    return data as SplitPaymentContribution;
  },

  async getMySplitRequests(): Promise<SplitPaymentRequest[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('split_payment_requests')
      .select('*')
      .eq('organizer_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SplitPaymentRequest[];
  },

  async getMyContributions(email: string): Promise<SplitPaymentContribution[]> {
    const { data, error } = await supabase
      .from('split_payment_contributions')
      .select('*')
      .eq('participant_email', email)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SplitPaymentContribution[];
  },

  getPaymentProgress(contributions: SplitPaymentContribution[]): {
    paid: number;
    total: number;
    percentage: number;
    amountCollected: number;
    amountRemaining: number;
  } {
    const paidContributions = contributions.filter(c => c.payment_status === 'paid');
    const totalAmount = contributions.reduce((sum, c) => sum + c.amount, 0);
    const paidAmount = paidContributions.reduce((sum, c) => sum + c.amount, 0);

    return {
      paid: paidContributions.length,
      total: contributions.length,
      percentage: Math.round((paidContributions.length / contributions.length) * 100),
      amountCollected: paidAmount,
      amountRemaining: totalAmount - paidAmount,
    };
  }
};
