import { supabase } from "@/integrations/supabase/client";
import { MerchantPayout, PayoutStatus, PayoutItem } from "@/types/fundCollection";

/**
 * Payout Service
 * Manages merchant payouts for the platform
 */

// Get all payouts with optional filters
export const getMerchantPayouts = async (filters?: {
  status?: PayoutStatus;
  merchantProfileId?: string;
  limit?: number;
}) => {
  let query = supabase
    .from('merchant_payouts')
    .select(`
      *,
      merchant_profile:merchant_profiles(business_name, business_email)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.merchantProfileId) {
    query = query.eq('merchant_profile_id', filters.merchantProfileId);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as MerchantPayout[];
};

// Get payout by ID with items
export const getPayoutById = async (id: string) => {
  const { data: payout, error: payoutError } = await supabase
    .from('merchant_payouts')
    .select(`
      *,
      merchant_profile:merchant_profiles(business_name, business_email, payout_method, payout_details)
    `)
    .eq('id', id)
    .single();

  if (payoutError) throw payoutError;

  const { data: items, error: itemsError } = await supabase
    .from('payout_items')
    .select('*')
    .eq('payout_id', id);

  if (itemsError) throw itemsError;

  return { ...payout, items } as MerchantPayout & { items: PayoutItem[] };
};

// Create a new payout
export const createPayout = async (
  merchantProfileId: string,
  amount: number,
  feeDeducted: number,
  payoutMethod: string,
  payoutDetails: Record<string, any>,
  periodStart?: string,
  periodEnd?: string,
  notes?: string
) => {
  const { data, error } = await supabase
    .from('merchant_payouts')
    .insert({
      merchant_profile_id: merchantProfileId,
      amount,
      fee_deducted: feeDeducted,
      payout_method: payoutMethod,
      payout_details: payoutDetails,
      period_start: periodStart,
      period_end: periodEnd,
      notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data as MerchantPayout;
};

// Add items to payout
export const addPayoutItems = async (
  payoutId: string,
  items: { transaction_id?: string; escrow_hold_id?: string; amount: number }[]
) => {
  const { data, error } = await supabase
    .from('payout_items')
    .insert(items.map(item => ({
      payout_id: payoutId,
      ...item,
    })))
    .select();

  if (error) throw error;
  return data as PayoutItem[];
};

// Process payout (mark as processing)
export const processPayout = async (payoutId: string, processedBy: string) => {
  const { data, error } = await supabase
    .from('merchant_payouts')
    .update({
      status: 'processing' as PayoutStatus,
      processed_by: processedBy,
    })
    .eq('id', payoutId)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) throw error;
  return data as MerchantPayout;
};

// Complete payout
export const completePayout = async (
  payoutId: string,
  payoutReference: string,
  processedBy: string
) => {
  const { data, error } = await supabase
    .from('merchant_payouts')
    .update({
      status: 'completed' as PayoutStatus,
      payout_reference: payoutReference,
      processed_by: processedBy,
      processed_at: new Date().toISOString(),
    })
    .eq('id', payoutId)
    .in('status', ['pending', 'processing'])
    .select()
    .single();

  if (error) throw error;
  return data as MerchantPayout;
};

// Fail payout
export const failPayout = async (
  payoutId: string,
  failureReason: string,
  processedBy: string
) => {
  const { data, error } = await supabase
    .from('merchant_payouts')
    .update({
      status: 'failed' as PayoutStatus,
      failure_reason: failureReason,
      processed_by: processedBy,
      processed_at: new Date().toISOString(),
    })
    .eq('id', payoutId)
    .in('status', ['pending', 'processing'])
    .select()
    .single();

  if (error) throw error;
  return data as MerchantPayout;
};

// Get payout statistics for dashboard
export const getPayoutStats = async () => {
  const { data: pending } = await supabase
    .from('merchant_payouts')
    .select('amount')
    .eq('status', 'pending');

  const { data: processing } = await supabase
    .from('merchant_payouts')
    .select('amount')
    .eq('status', 'processing');

  const { data: completed } = await supabase
    .from('merchant_payouts')
    .select('amount, fee_deducted')
    .eq('status', 'completed');

  const { data: failed } = await supabase
    .from('merchant_payouts')
    .select('amount')
    .eq('status', 'failed');

  return {
    pendingCount: pending?.length || 0,
    pendingAmount: pending?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    processingCount: processing?.length || 0,
    processingAmount: processing?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    completedCount: completed?.length || 0,
    completedAmount: completed?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    totalFeesDeducted: completed?.reduce((sum, p) => sum + Number(p.fee_deducted), 0) || 0,
    failedCount: failed?.length || 0,
    failedAmount: failed?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
  };
};

// Get pending payout amount for a merchant
export const getMerchantPendingPayout = async (merchantProfileId: string) => {
  const { data, error } = await supabase
    .rpc('get_merchant_pending_payout', {
      p_merchant_profile_id: merchantProfileId,
    });

  if (error) throw error;
  return data as number;
};

// Get merchants with pending payouts
export const getMerchantsWithPendingPayouts = async () => {
  // Get released escrow holds not yet in a payout
  const { data: escrows, error } = await supabase
    .from('escrow_holds')
    .select(`
      merchant_profile_id,
      merchant_amount,
      merchant_profile:merchant_profiles(business_name, business_email, payout_method)
    `)
    .eq('status', 'released');

  if (error) throw error;

  // Get existing payout items to exclude
  const { data: payoutItems } = await supabase
    .from('payout_items')
    .select('escrow_hold_id');

  const paidEscrowIds = new Set(payoutItems?.map(p => p.escrow_hold_id) || []);

  // Group by merchant and sum amounts
  const merchantAmounts = new Map<string, {
    merchantProfileId: string;
    businessName: string;
    businessEmail: string;
    payoutMethod: string;
    pendingAmount: number;
    escrowCount: number;
  }>();

  escrows?.forEach(escrow => {
    if (paidEscrowIds.has(escrow.merchant_profile_id)) return;
    
    const existing = merchantAmounts.get(escrow.merchant_profile_id);
    if (existing) {
      existing.pendingAmount += Number(escrow.merchant_amount);
      existing.escrowCount += 1;
    } else {
      merchantAmounts.set(escrow.merchant_profile_id, {
        merchantProfileId: escrow.merchant_profile_id,
        businessName: (escrow.merchant_profile as any)?.business_name || 'Unknown',
        businessEmail: (escrow.merchant_profile as any)?.business_email || '',
        payoutMethod: (escrow.merchant_profile as any)?.payout_method || 'bank_transfer',
        pendingAmount: Number(escrow.merchant_amount),
        escrowCount: 1,
      });
    }
  });

  return Array.from(merchantAmounts.values())
    .filter(m => m.pendingAmount > 0)
    .sort((a, b) => b.pendingAmount - a.pendingAmount);
};
