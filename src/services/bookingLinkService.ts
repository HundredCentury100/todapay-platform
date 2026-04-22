import { supabase } from "@/integrations/supabase/client";

export interface BookingLink {
  id: string;
  merchant_profile_id: string | null;
  corporate_account_id: string | null;
  created_by_user_id: string;
  link_code: string;
  link_type: string;
  service_type: string;
  service_id: string;
  service_name: string;
  preset_config: Record<string, any>;
  fixed_amount: number | null;
  currency: string;
  max_uses: number | null;
  times_used: number;
  expires_at: string | null;
  is_active: boolean;
  custom_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingLinkParams {
  merchant_profile_id?: string;
  corporate_account_id?: string;
  link_type: 'booking' | 'payment';
  service_type: string;
  service_id: string;
  service_name: string;
  preset_config?: Record<string, any>;
  fixed_amount?: number;
  currency?: string;
  max_uses?: number;
  expires_at?: string;
  custom_message?: string;
}

function generateLinkCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'BL-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createBookingLink(params: CreateBookingLinkParams): Promise<BookingLink> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const linkCode = generateLinkCode();

  const { data, error } = await supabase
    .from('booking_links' as any)
    .insert({
      ...params,
      link_code: linkCode,
      created_by_user_id: user.id,
      preset_config: params.preset_config || {},
      currency: params.currency || 'USD',
    })
    .select()
    .single();

  if (error) throw error;
  return data as unknown as BookingLink;
}

export async function getBookingLinks(merchantProfileId?: string, corporateAccountId?: string): Promise<BookingLink[]> {
  let query = supabase.from('booking_links' as any).select('*').order('created_at', { ascending: false });

  if (merchantProfileId) {
    query = query.eq('merchant_profile_id', merchantProfileId);
  }
  if (corporateAccountId) {
    query = query.eq('corporate_account_id', corporateAccountId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as unknown as BookingLink[];
}

export async function getBookingLinkByCode(linkCode: string): Promise<BookingLink | null> {
  const { data, error } = await supabase
    .from('booking_links' as any)
    .select('*')
    .eq('link_code', linkCode)
    .eq('is_active', true)
    .single();

  if (error) return null;
  return data as unknown as BookingLink;
}

export async function incrementLinkUsage(linkId: string): Promise<void> {
  // Fetch current count then increment
  const { data } = await supabase
    .from('booking_links' as any)
    .select('times_used')
    .eq('id', linkId)
    .single();

  if (data) {
    await supabase
      .from('booking_links' as any)
      .update({ times_used: ((data as any).times_used || 0) + 1 })
      .eq('id', linkId);
  }
}

export async function toggleBookingLink(linkId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('booking_links' as any)
    .update({ is_active: isActive })
    .eq('id', linkId);

  if (error) throw error;
}

export async function deleteBookingLink(linkId: string): Promise<void> {
  const { error } = await supabase
    .from('booking_links' as any)
    .delete()
    .eq('id', linkId);

  if (error) throw error;
}

export function getBookingLinkUrl(linkCode: string): string {
  return `${window.location.origin}/book/${linkCode}`;
}
