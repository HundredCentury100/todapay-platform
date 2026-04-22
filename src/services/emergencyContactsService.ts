import { supabase } from "@/integrations/supabase/client";

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relationship: string | null;
  is_primary: boolean;
  notify_on_ride: boolean;
  created_at: string;
  updated_at: string;
}

export async function getEmergencyContacts(): Promise<EmergencyContact[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', user.id)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching emergency contacts:', error);
    return [];
  }

  return data as EmergencyContact[];
}

export async function createEmergencyContact(contact: {
  name: string;
  phone: string;
  relationship?: string;
  is_primary?: boolean;
  notify_on_ride?: boolean;
}): Promise<EmergencyContact | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('emergency_contacts')
    .insert({
      user_id: user.id,
      ...contact,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating emergency contact:', error);
    throw error;
  }

  return data as EmergencyContact;
}

export async function updateEmergencyContact(
  id: string,
  updates: Partial<EmergencyContact>
): Promise<EmergencyContact | null> {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating emergency contact:', error);
    throw error;
  }

  return data as EmergencyContact;
}

export async function deleteEmergencyContact(id: string): Promise<void> {
  const { error } = await supabase
    .from('emergency_contacts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting emergency contact:', error);
    throw error;
  }
}

export async function getPrimaryEmergencyContact(): Promise<EmergencyContact | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching primary contact:', error);
    return null;
  }

  return data as EmergencyContact | null;
}

export const RELATIONSHIP_OPTIONS = [
  'Spouse',
  'Parent',
  'Sibling',
  'Child',
  'Friend',
  'Other',
] as const;
