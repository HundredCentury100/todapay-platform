import { supabase } from "@/integrations/supabase/client";

export interface PromoCode {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_discount_amount?: number;
  min_order_amount: number;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  max_uses?: number;
  max_uses_per_user: number;
  current_uses: number;
  applicable_verticals: string[];
  first_time_only: boolean;
}

export interface PromoValidationResult {
  valid: boolean;
  error?: string;
  promo_code_id?: string;
  discount?: number;
  discount_type?: string;
  discount_value?: number;
  description?: string;
}

export async function validatePromoCode(
  code: string,
  orderAmount: number,
  vertical: string
): Promise<PromoValidationResult> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { valid: false, error: 'Please sign in to use promo codes' };
  }

  // Use raw RPC call since function may not be in generated types yet
  const { data, error } = await supabase.rpc('validate_promo_code' as any, {
    p_code: code.toUpperCase(),
    p_user_id: user.id,
    p_order_amount: orderAmount,
    p_vertical: vertical
  });

  if (error) {
    console.error('Error validating promo code:', error);
    return { valid: false, error: 'Failed to validate promo code' };
  }

  return data as unknown as PromoValidationResult;
}

export async function applyPromoCode(
  promoCodeId: string,
  bookingId: string,
  discount: number
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { data, error } = await supabase.rpc('apply_promo_code' as any, {
    p_promo_code_id: promoCodeId,
    p_user_id: user.id,
    p_booking_id: bookingId,
    p_discount: discount
  });

  if (error) {
    console.error('Error applying promo code:', error);
    return false;
  }

  return Boolean(data);
}

export async function getPromoCodeUsage(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  // Query promo_code_usage table - may not be in types yet
  const { data, error } = await (supabase as any)
    .from('promo_code_usage')
    .select(`
      *,
      promo_codes (code, description, discount_type, discount_value)
    `)
    .eq('user_id', user.id)
    .order('used_at', { ascending: false });

  if (error) {
    console.error('Error fetching promo code usage:', error);
    return [];
  }

  return data || [];
}
