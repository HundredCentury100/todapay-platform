import { supabase } from "@/integrations/supabase/client";

export interface UserReferral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  referrer_reward_amount: number;
  referred_reward_amount: number;
  referrer_reward_credited: boolean;
  referred_reward_credited: boolean;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  completed_at?: string;
  created_at: string;
}

export interface ReferralStats {
  total_referrals: number;
  completed_referrals: number;
  pending_referrals: number;
  total_earnings: number;
}

export async function getUserReferralCode(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching referral code:', error);
    return null;
  }

  // Access referral_code from the data - may not be in types yet
  return (data as any)?.referral_code || null;
}

export async function applyReferralCode(code: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Please sign in first' };
  }

  // Find the referrer by code using raw query approach
  const { data: profiles, error: referrerError } = await supabase
    .from('profiles')
    .select('*')
    .limit(100);

  if (referrerError) {
    return { success: false, error: 'Failed to find referrer' };
  }

  // Find referrer with matching code
  const referrer = (profiles as any[])?.find(p => p.referral_code === code.toUpperCase());

  if (!referrer) {
    return { success: false, error: 'Invalid referral code' };
  }

  if (referrer.id === user.id) {
    return { success: false, error: 'You cannot refer yourself' };
  }

  // Check if user already has a referral using raw approach
  const { data: existingReferrals } = await (supabase as any)
    .from('user_referrals')
    .select('id')
    .eq('referred_id', user.id)
    .limit(1);

  if (existingReferrals && existingReferrals.length > 0) {
    return { success: false, error: 'You have already used a referral code' };
  }

  // Create the referral record
  const { error: insertError } = await (supabase as any)
    .from('user_referrals')
    .insert({
      referrer_id: referrer.id,
      referred_id: user.id,
      referral_code: code.toUpperCase(),
      status: 'pending'
    });

  if (insertError) {
    console.error('Error creating referral:', insertError);
    return { success: false, error: 'Failed to apply referral code' };
  }

  // Update the profile with referred_by
  await supabase
    .from('profiles')
    .update({ referred_by: referrer.id } as any)
    .eq('id', user.id);

  return { success: true };
}

export async function getMyReferrals(): Promise<UserReferral[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  const { data, error } = await (supabase as any)
    .from('user_referrals')
    .select('*')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching referrals:', error);
    return [];
  }

  return data as UserReferral[];
}

export async function getReferralStats(): Promise<ReferralStats> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { total_referrals: 0, completed_referrals: 0, pending_referrals: 0, total_earnings: 0 };
  }

  const { data, error } = await (supabase as any)
    .from('user_referrals')
    .select('*')
    .eq('referrer_id', user.id);

  if (error) {
    console.error('Error fetching referral stats:', error);
    return { total_referrals: 0, completed_referrals: 0, pending_referrals: 0, total_earnings: 0 };
  }

  const referrals = data || [];
  const completed = referrals.filter((r: any) => r.status === 'completed');
  const pending = referrals.filter((r: any) => r.status === 'pending');
  const totalEarnings = completed.reduce((sum: number, r: any) => sum + (r.referrer_reward_amount || 0), 0);

  return {
    total_referrals: referrals.length,
    completed_referrals: completed.length,
    pending_referrals: pending.length,
    total_earnings: totalEarnings
  };
}

export async function completeReferral(): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase.rpc('complete_referral' as any, {
    p_referred_user_id: user.id
  });

  if (error) {
    console.error('Error completing referral:', error);
    return { success: false, error: 'Failed to complete referral' };
  }

  return data as { success: boolean; error?: string };
}
