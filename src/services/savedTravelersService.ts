import { supabase } from "@/integrations/supabase/client";

export interface SavedTraveler {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  passport_number?: string;
  date_of_birth?: string;
  nationality?: string;
  preferences?: {
    seatPreference?: string;
    mealPreference?: string;
    specialAssistance?: string;
  };
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// NOTE: These functions will work once the database tables are created
// Temporarily returning empty data until migration is approved

export const savedTravelersService = {
  async getTravelers(): Promise<{ data: SavedTraveler[] | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Not authenticated" };

    // Temporarily return empty array until tables exist
    return { data: [], error: null };
  },

  async createTraveler(traveler: Omit<SavedTraveler, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<{ data: SavedTraveler | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Not authenticated" };

    // Temporarily return null until tables exist
    return { data: null, error: "Tables not created yet" };
  },

  async updateTraveler(id: string, updates: Partial<SavedTraveler>): Promise<{ data: SavedTraveler | null; error: any }> {
    // Temporarily return null until tables exist
    return { data: null, error: "Tables not created yet" };
  },

  async deleteTraveler(id: string): Promise<{ error: any }> {
    // Temporarily return success until tables exist
    return { error: null };
  },

  async setPrimaryTraveler(id: string): Promise<{ error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    // Temporarily return success until tables exist
    return { error: null };
  }
};
