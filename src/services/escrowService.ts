import { supabase } from "@/integrations/supabase/client";
import { EscrowHold, EscrowStatus } from "@/types/fundCollection";

/**
 * Escrow Service
 * Manages escrow holds for the platform-first and escrow fund collection models
 */

// Get all escrow holds with optional filters
export const getEscrowHolds = async (filters?: {
  status?: EscrowStatus;
  merchantProfileId?: string;
  limit?: number;
}) => {
  let query = supabase
    .from('escrow_holds')
    .select(`
      *,
      merchant_profile:merchant_profiles(business_name, business_email),
      booking:bookings(booking_reference, item_name)
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
  return data as EscrowHold[];
};

// Get escrow hold by ID
export const getEscrowHoldById = async (id: string) => {
  const { data, error } = await supabase
    .from('escrow_holds')
    .select(`
      *,
      merchant_profile:merchant_profiles(business_name, business_email),
      booking:bookings(booking_reference, item_name, passenger_name, passenger_email)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as EscrowHold;
};

// Create escrow hold for a booking
export const createEscrowHold = async (
  bookingId: string,
  merchantProfileId: string,
  amount: number,
  platformFeePercentage: number = 5,
  serviceDate?: string
) => {
  const { data, error } = await supabase
    .rpc('create_escrow_hold', {
      p_booking_id: bookingId,
      p_merchant_profile_id: merchantProfileId,
      p_amount: amount,
      p_platform_fee_percentage: platformFeePercentage,
      p_service_date: serviceDate || null,
    });

  if (error) throw error;
  return data as string;
};

// Release escrow hold (funds go to merchant)
export const releaseEscrowHold = async (escrowId: string, releaseNotes?: string) => {
  const { data, error } = await supabase
    .rpc('release_escrow_hold', {
      p_escrow_id: escrowId,
      p_release_notes: releaseNotes || null,
    });

  if (error) throw error;
  return data as boolean;
};

// Dispute escrow hold
export const disputeEscrowHold = async (escrowId: string, disputeReason: string) => {
  const { data, error } = await supabase
    .from('escrow_holds')
    .update({
      status: 'disputed' as EscrowStatus,
      dispute_reason: disputeReason,
      disputed_at: new Date().toISOString(),
    })
    .eq('id', escrowId)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) throw error;
  return data as EscrowHold;
};

// Refund escrow hold (full or partial)
export const refundEscrowHold = async (escrowId: string, refundAmount?: number) => {
  const escrow = await getEscrowHoldById(escrowId);
  const finalRefundAmount = refundAmount || escrow.amount;

  const { data, error } = await supabase
    .from('escrow_holds')
    .update({
      status: 'refunded' as EscrowStatus,
      refund_amount: finalRefundAmount,
      refunded_at: new Date().toISOString(),
    })
    .eq('id', escrowId)
    .in('status', ['pending', 'disputed'])
    .select()
    .single();

  if (error) throw error;
  return data as EscrowHold;
};

// Get escrow statistics for dashboard
export const getEscrowStats = async () => {
  const { data: pending } = await supabase
    .from('escrow_holds')
    .select('amount, merchant_amount')
    .eq('status', 'pending');

  const { data: released } = await supabase
    .from('escrow_holds')
    .select('amount, merchant_amount, platform_fee_amount')
    .eq('status', 'released');

  const { data: disputed } = await supabase
    .from('escrow_holds')
    .select('amount')
    .eq('status', 'disputed');

  const { data: dueForRelease } = await supabase
    .from('escrow_holds')
    .select('amount, merchant_amount')
    .eq('status', 'pending')
    .lte('hold_until', new Date().toISOString());

  return {
    pendingCount: pending?.length || 0,
    pendingAmount: pending?.reduce((sum, e) => sum + Number(e.amount), 0) || 0,
    releasedCount: released?.length || 0,
    releasedAmount: released?.reduce((sum, e) => sum + Number(e.merchant_amount), 0) || 0,
    platformFeesCollected: released?.reduce((sum, e) => sum + Number(e.platform_fee_amount), 0) || 0,
    disputedCount: disputed?.length || 0,
    disputedAmount: disputed?.reduce((sum, e) => sum + Number(e.amount), 0) || 0,
    dueForReleaseCount: dueForRelease?.length || 0,
    dueForReleaseAmount: dueForRelease?.reduce((sum, e) => sum + Number(e.merchant_amount), 0) || 0,
  };
};

// Get escrow holds due for release
export const getEscrowsDueForRelease = async () => {
  const { data, error } = await supabase
    .from('escrow_holds')
    .select(`
      *,
      merchant_profile:merchant_profiles(business_name, business_email),
      booking:bookings(booking_reference, item_name)
    `)
    .eq('status', 'pending')
    .lte('hold_until', new Date().toISOString())
    .order('hold_until', { ascending: true });

  if (error) throw error;
  return data as EscrowHold[];
};

// Bulk release escrow holds
export const bulkReleaseEscrows = async (escrowIds: string[], releaseNotes?: string) => {
  const results = await Promise.all(
    escrowIds.map(id => releaseEscrowHold(id, releaseNotes))
  );
  return results.filter(Boolean).length;
};
