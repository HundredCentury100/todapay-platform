import { supabase } from "@/integrations/supabase/client";
import { generateTransactionReference } from "@/utils/queryHelpers";
import { MerchantPaymentMethod, Transaction } from "@/types/payment";

export const getMerchantPaymentMethods = async (merchantProfileId: string) => {
  const { data, error } = await supabase
    .from('merchant_payment_methods')
    .select('*')
    .eq('merchant_profile_id', merchantProfileId)
    .eq('is_active', true);

  if (error) throw error;
  return data as MerchantPaymentMethod[];
};

export const createOrUpdatePaymentMethod = async (
  merchantProfileId: string,
  paymentType: string,
  configuration: any,
  isActive: boolean = true
) => {
  const { data, error } = await supabase
    .from('merchant_payment_methods')
    .upsert({
      merchant_profile_id: merchantProfileId,
      payment_type: paymentType as any,
      configuration,
      is_active: isActive,
    })
    .select()
    .single();

  if (error) throw error;
  return data as MerchantPaymentMethod;
};

export const uploadPaymentProof = async (
  transactionId: string,
  file: File
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${transactionId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('payment_proofs')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('payment_proofs')
    .getPublicUrl(fileName);

  return publicUrl;
};

export const createTransaction = async (
  bookingId: string,
  merchantProfileId: string,
  amount: number,
  paymentMethod: string,
  feePercentage: number,
  feeAmount: number,
  paymentMetadata: any = {},
  serviceFeeAmount: number = 0
): Promise<Transaction> => {
  const merchantAmount = amount - feeAmount;
  const userTotalCharged = amount + serviceFeeAmount;
  const transactionRef = generateTransactionReference();

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      booking_id: bookingId,
      merchant_profile_id: merchantProfileId,
      amount,
      platform_fee_percentage: feePercentage,
      platform_fee_amount: feeAmount,
      merchant_amount: merchantAmount,
      payment_method: paymentMethod,
      payment_status: 'pending',
      transaction_reference: transactionRef,
      payment_metadata: paymentMetadata,
      service_fee_amount: serviceFeeAmount,
      user_total_charged: userTotalCharged,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
};

export const updateTransactionStatus = async (
  transactionId: string,
  status: string,
  paymentProofUrl?: string
) => {
  const updates: any = {
    payment_status: status as any,
  };

  if (paymentProofUrl) {
    updates.payment_proof_url = paymentProofUrl;
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', transactionId)
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
};

export const getTransactionsByMerchant = async (
  merchantProfileId: string,
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }
) => {
  let query = supabase
    .from('transactions')
    .select('*, bookings(booking_reference, passenger_name)')
    .eq('merchant_profile_id', merchantProfileId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('payment_status', filters.status as any);
  }
  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const calculatePlatformFee = async (
  merchantProfileId: string,
  bookingAmount: number,
  bookingId: string
): Promise<{ feePercentage: number; feeAmount: number; merchantAmount: number }> => {
  const { data, error } = await supabase.functions.invoke('calculate-platform-fees', {
    body: { merchantProfileId, bookingAmount, bookingId }
  });

  if (error) throw error;
  return data;
};
