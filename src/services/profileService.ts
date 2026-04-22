import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  passport_number: string | null;
  whatsapp_number: string | null;
  next_of_kin_number: string | null;
  avatar_url: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: Record<string, string>;
  preferences: Record<string, unknown>;
  emergency_contacts: EmergencyContact[];
  loyalty_tier: string;
  loyalty_points: number;
  email_verified: boolean;
  phone_verified: boolean;
  profile_completion_percentage: number;
  account_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface ProfileUpdateData {
  full_name?: string;
  phone?: string;
  passport_number?: string;
  whatsapp_number?: string;
  next_of_kin_number?: string;
  avatar_url?: string;
  nationality?: string;
  date_of_birth?: string;
  gender?: string;
  address?: Json;
  preferences?: Json;
  emergency_contacts?: Json;
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  // Parse JSON fields safely
  const parseJsonArray = (val: unknown): EmergencyContact[] => {
    if (Array.isArray(val)) return val as EmergencyContact[];
    return [];
  };

  const parseJsonObject = (val: unknown): Record<string, string> => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return val as Record<string, string>;
    }
    return {};
  };

  return {
    ...data,
    address: parseJsonObject(data.address),
    preferences: parseJsonObject(data.preferences),
    emergency_contacts: parseJsonArray(data.emergency_contacts),
  } as UserProfile;
}

export async function updateProfile(
  userId: string,
  updates: ProfileUpdateData
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return getProfile(userId);
}

export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/avatar.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('kyc_documents')
    .upload(fileName, file, { upsert: true });

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('kyc_documents')
    .getPublicUrl(fileName);

  // Update profile with new avatar URL
  await updateProfile(userId, { avatar_url: data.publicUrl });

  return data.publicUrl;
}

export function calculateCompletionFields(profile: UserProfile): {
  completed: string[];
  missing: string[];
  percentage: number;
} {
  const fields = [
    { key: 'full_name', label: 'Full Name', value: profile.full_name },
    { key: 'phone', label: 'Phone Number', value: profile.phone },
    { key: 'avatar_url', label: 'Profile Photo', value: profile.avatar_url },
    { key: 'passport_number', label: 'Passport Number', value: profile.passport_number },
    { key: 'nationality', label: 'Nationality', value: profile.nationality },
    { key: 'date_of_birth', label: 'Date of Birth', value: profile.date_of_birth },
    { key: 'address', label: 'Address', value: Object.keys(profile.address || {}).length > 0 },
    { key: 'whatsapp_number', label: 'WhatsApp Number', value: profile.whatsapp_number },
    { key: 'next_of_kin_number', label: 'Next of Kin', value: profile.next_of_kin_number },
    { key: 'emergency_contacts', label: 'Emergency Contact', value: profile.emergency_contacts?.length > 0 },
  ];

  const completed = fields.filter(f => f.value).map(f => f.label);
  const missing = fields.filter(f => !f.value).map(f => f.label);
  const percentage = Math.round((completed.length / fields.length) * 100);

  return { completed, missing, percentage };
}

export const NATIONALITIES = [
  'Zimbabwean', 'South African', 'Mozambican', 'Botswanan', 'Namibian',
  'Zambian', 'Malawian', 'Other'
];

export const LOYALTY_TIERS = {
  bronze: { name: 'Bronze', minPoints: 0, benefits: ['Basic rewards'] },
  silver: { name: 'Silver', minPoints: 500, benefits: ['5% booking discount', 'Priority support'] },
  gold: { name: 'Gold', minPoints: 2000, benefits: ['10% booking discount', 'Free cancellations', 'VIP support'] },
  platinum: { name: 'Platinum', minPoints: 5000, benefits: ['15% booking discount', 'Free upgrades', 'Concierge service'] },
};
