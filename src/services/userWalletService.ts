import { supabase } from "@/integrations/supabase/client";

export interface UserWallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  lifetime_earned: number;
  lifetime_spent: number;
  rewards_points: number;
  auto_topup_enabled: boolean;
  auto_topup_amount: number | null;
  auto_topup_threshold: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserWalletTransaction {
  id: string;
  wallet_id: string;
  transaction_type: 'topup' | 'payment' | 'refund' | 'reward' | 'transfer' | 'credit' | 'debit';
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  booking_id: string | null;
  payment_reference: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export async function getUserWallet(userId: string): Promise<UserWallet | null> {
  const { data, error } = await supabase
    .from('user_wallets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user wallet:', error);
    return null;
  }

  return data as UserWallet;
}

export async function getOrCreateUserWallet(userId: string): Promise<UserWallet | null> {
  // First try to get existing wallet
  let wallet = await getUserWallet(userId);
  
  if (wallet) return wallet;

  // Create new wallet using RPC function
  const { data: walletId, error: createError } = await supabase
    .rpc('get_or_create_user_wallet', { p_user_id: userId });

  if (createError) {
    console.error('Error creating user wallet:', createError);
    return null;
  }

  // Fetch the created wallet
  return getUserWallet(userId);
}

export async function getWalletTransactions(
  walletId: string,
  limit: number = 20
): Promise<UserWalletTransaction[]> {
  const { data, error } = await supabase
    .from('user_wallet_transactions')
    .select('*')
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching wallet transactions:', error);
    return [];
  }

  return data as UserWalletTransaction[];
}

export async function topUpWallet(
  walletId: string,
  amount: number,
  paymentReference: string,
  description?: string
): Promise<UserWalletTransaction | null> {
  const { data, error } = await supabase.rpc('topup_user_wallet', {
    p_wallet_id: walletId,
    p_amount: amount,
    p_payment_reference: paymentReference,
    p_description: description || 'Wallet top-up',
  });

  if (error) {
    console.error('Error topping up wallet:', error);
    throw error;
  }

  return data as UserWalletTransaction;
}

export async function updateWalletSettings(
  walletId: string,
  settings: {
    auto_topup_enabled?: boolean;
    auto_topup_amount?: number;
    auto_topup_threshold?: number;
  }
): Promise<UserWallet | null> {
  const { data, error } = await supabase
    .from('user_wallets')
    .update(settings)
    .eq('id', walletId)
    .select()
    .single();

  if (error) {
    console.error('Error updating wallet settings:', error);
    throw error;
  }

  return data as UserWallet;
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', ZAR: 'R', KES: 'KSh', NGN: '₦',
    ZWL: 'Z$', BWP: 'P', MZN: 'MT', ZMW: 'K',
  };
  return symbols[currency] || currency + ' ';
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const TOP_UP_AMOUNTS = [5, 10, 20, 50, 100];
