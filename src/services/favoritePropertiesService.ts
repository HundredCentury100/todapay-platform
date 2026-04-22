import { supabase } from "@/integrations/supabase/client";

export interface FavoriteProperty {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
  property?: {
    id: string;
    name: string;
    city: string;
    country: string;
    property_type: string;
    star_rating: number;
    images: string[];
    min_price?: number;
  };
}

export const favoritePropertiesService = {
  async getFavorites(): Promise<FavoriteProperty[]> {
    const { data, error } = await supabase
      .from('favorite_properties')
      .select(`
        *,
        property:properties(
          id,
          name,
          city,
          country,
          property_type,
          star_rating,
          images
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as FavoriteProperty[];
  },

  async addFavorite(propertyId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to save favorites');

    const { error } = await supabase
      .from('favorite_properties')
      .insert({ user_id: user.id, property_id: propertyId });

    if (error) throw error;
  },

  async removeFavorite(propertyId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in');

    const { error } = await supabase
      .from('favorite_properties')
      .delete()
      .eq('user_id', user.id)
      .eq('property_id', propertyId);

    if (error) throw error;
  },

  async isFavorite(propertyId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('favorite_properties')
      .select('id')
      .eq('user_id', user.id)
      .eq('property_id', propertyId)
      .maybeSingle();

    if (error) return false;
    return !!data;
  }
};
