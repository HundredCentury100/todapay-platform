import { supabase } from "@/integrations/supabase/client";

export interface SavedLocation {
  id: string;
  user_id: string;
  name: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  icon: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export async function getSavedLocations(): Promise<SavedLocation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('saved_locations')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved locations:', error);
    return [];
  }

  return data as SavedLocation[];
}

export async function createSavedLocation(location: {
  name: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  icon?: string;
  is_default?: boolean;
}): Promise<SavedLocation | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('saved_locations')
    .insert({
      user_id: user.id,
      ...location,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating saved location:', error);
    throw error;
  }

  return data as SavedLocation;
}

export async function updateSavedLocation(
  id: string,
  updates: Partial<SavedLocation>
): Promise<SavedLocation | null> {
  const { data, error } = await supabase
    .from('saved_locations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating saved location:', error);
    throw error;
  }

  return data as SavedLocation;
}

export async function deleteSavedLocation(id: string): Promise<void> {
  const { error } = await supabase
    .from('saved_locations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting saved location:', error);
    throw error;
  }
}

export const LOCATION_LABELS = [
  { value: 'Home', icon: 'home' },
  { value: 'Work', icon: 'briefcase' },
  { value: 'Gym', icon: 'dumbbell' },
  { value: 'School', icon: 'graduation-cap' },
  { value: 'Other', icon: 'map-pin' },
] as const;
