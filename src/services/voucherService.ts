import { supabase } from "@/integrations/supabase/client";

export interface UserVoucher {
  id: string;
  user_id: string;
  code: string;
  source: 'promo' | 'referral' | 'reward' | 'gift' | 'campaign';
  source_reference_id?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_discount_amount?: number;
  min_order_amount: number;
  applicable_verticals: string[];
  description?: string;
  status: 'active' | 'used' | 'expired' | 'revoked';
  expires_at?: string;
  used_at?: string;
  used_on_booking_id?: string;
  created_at: string;
  updated_at: string;
}

export async function getUserVouchers(): Promise<UserVoucher[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await (supabase as any)
    .from('user_vouchers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vouchers:', error);
    return [];
  }

  return (data || []) as UserVoucher[];
}

export async function getActiveVouchersForCheckout(
  vertical: string,
  orderAmount: number
): Promise<UserVoucher[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await (supabase as any)
    .from('user_vouchers')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .lte('min_order_amount', orderAmount)
    .order('discount_value', { ascending: false });

  if (error) {
    console.error('Error fetching checkout vouchers:', error);
    return [];
  }

  // Filter by vertical and expiry client-side
  return ((data || []) as UserVoucher[]).filter(v => {
    if (v.expires_at && new Date(v.expires_at) < new Date()) return false;
    if (v.applicable_verticals.length > 0 && !v.applicable_verticals.includes(vertical)) return false;
    return true;
  });
}

export async function claimPromoAsVoucher(promoCode: string): Promise<{ success: boolean; error?: string; voucher?: UserVoucher }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Please sign in first' };

  // Fetch the promo code
  const { data: promo, error: promoError } = await (supabase as any)
    .from('promo_codes')
    .select('*')
    .eq('code', promoCode.toUpperCase())
    .eq('is_active', true)
    .single();

  if (promoError || !promo) {
    return { success: false, error: 'Invalid promo code' };
  }

  // Check if already claimed
  const { data: existing } = await (supabase as any)
    .from('user_vouchers')
    .select('id')
    .eq('user_id', user.id)
    .eq('source', 'promo')
    .eq('source_reference_id', promo.id)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'You have already claimed this promo' };
  }

  // Check expiry
  if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
    return { success: false, error: 'This promo code has expired' };
  }

  // Generate voucher code
  const voucherCode = 'VCH-' + Array.from({ length: 8 }, () => 
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]
  ).join('');

  const { data: voucher, error: insertError } = await (supabase as any)
    .from('user_vouchers')
    .insert({
      user_id: user.id,
      code: voucherCode,
      source: 'promo',
      source_reference_id: promo.id,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      max_discount_amount: promo.max_discount_amount,
      min_order_amount: promo.min_order_amount,
      applicable_verticals: promo.applicable_verticals,
      description: promo.description,
      expires_at: promo.valid_until,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error claiming promo:', insertError);
    return { success: false, error: 'Failed to claim promo code' };
  }

  return { success: true, voucher: voucher as UserVoucher };
}

export async function redeemRewardPoints(
  pointsToRedeem: number,
  rewardName: string,
  discountType: string = 'percentage',
  discountValue: number = 10,
  applicableVerticals: string[] = []
): Promise<{ success: boolean; error?: string; voucher_code?: string; points_remaining?: number }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Please sign in first' };

  const { data, error } = await supabase.rpc('redeem_reward_points' as any, {
    p_user_id: user.id,
    p_points_to_redeem: pointsToRedeem,
    p_reward_name: rewardName,
    p_discount_type: discountType,
    p_discount_value: discountValue,
    p_applicable_verticals: applicableVerticals,
  });

  if (error) {
    console.error('Error redeeming points:', error);
    return { success: false, error: 'Failed to redeem points' };
  }

  const result = data as any;
  return {
    success: result.success,
    error: result.error,
    voucher_code: result.voucher_code,
    points_remaining: result.points_remaining,
  };
}

export async function getActivePromoCodes() {
  const { data, error } = await (supabase as any)
    .from('promo_codes')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching promo codes:', error);
    return [];
  }

  // Filter expired ones client-side
  return (data || []).filter((p: any) => {
    if (p.valid_until && new Date(p.valid_until) < new Date()) return false;
    if (p.valid_from && new Date(p.valid_from) > new Date()) return false;
    return true;
  });
}
