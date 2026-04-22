import { supabase } from "@/integrations/supabase/client";

export interface FavoriteRoute {
  id: string;
  user_id: string;
  from_location: string;
  to_location: string;
  route_type: 'bus' | 'event';
  search_count: number;
  last_searched: string;
  created_at: string;
}

export interface SearchHistory {
  id: string;
  user_id: string;
  from_location?: string;
  to_location?: string;
  event_type?: string;
  event_location?: string;
  search_date?: string;
  route_type: 'bus' | 'event';
  created_at: string;
}

// NOTE: These functions will work once the database tables are created
// Temporarily returning empty data until migration is approved

export const favoriteRoutesService = {
  async getFavorites(): Promise<{ data: FavoriteRoute[] | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Not authenticated" };

    // Temporarily return empty array until tables exist
    return { data: [], error: null };
  },

  async addFavorite(route: Omit<FavoriteRoute, 'id' | 'user_id' | 'search_count' | 'created_at'>): Promise<{ data: FavoriteRoute | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Not authenticated" };

    // Temporarily return null until tables exist
    return { data: null, error: "Tables not created yet" };
  },

  async removeFavorite(id: string): Promise<{ error: any }> {
    // Temporarily return success until tables exist
    return { error: null };
  },

  async getSearchHistory(): Promise<{ data: SearchHistory[] | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Not authenticated" };

    // Temporarily return empty array until tables exist
    return { data: [], error: null };
  },

  async recordSearch(search: Omit<SearchHistory, 'id' | 'user_id' | 'created_at'>): Promise<{ error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: null };

    // Temporarily do nothing until tables exist
    return { error: null };
  },

  async clearHistory(): Promise<{ error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    // Temporarily return success until tables exist
    return { error: null };
  }
};
