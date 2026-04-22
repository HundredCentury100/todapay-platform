import { supabase } from "@/integrations/supabase/client";

export async function getCitySuggestions(
  query: string,
  type: 'from' | 'to' | 'event'
): Promise<string[]> {
  if (!query || query.length < 2) return [];

  try {
    if (type === 'event') {
      // Get unique event locations
      const { data, error } = await supabase
        .from('events')
        .select('location')
        .ilike('location', `%${query}%`)
        .limit(10);

      if (error) throw error;
      return [...new Set(data?.map(e => e.location) || [])];
    } else {
      // Get unique bus route cities
      const column = type === 'from' ? 'from_location' : 'to_location';
      const { data, error } = await supabase
        .from('bus_schedules')
        .select(column)
        .ilike(column, `%${query}%`)
        .limit(10);

      if (error) throw error;
      return [...new Set(data?.map((s: any) => s[column]) || [])];
    }
  } catch (error) {
    console.error('Error fetching city suggestions:', error);
    return [];
  }
}
