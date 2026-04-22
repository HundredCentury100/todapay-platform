import { supabase } from "@/integrations/supabase/client";

export interface PropertyReview {
  id: string;
  user_id: string;
  property_id: string;
  booking_id?: string;
  rating: number;
  cleanliness_rating?: number;
  location_rating?: number;
  service_rating?: number;
  value_rating?: number;
  title: string;
  comment: string;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

export async function getPropertyReviews(propertyId: string): Promise<PropertyReview[]> {
  const { data, error } = await supabase
    .from('property_reviews')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching property reviews:', error);
    throw error;
  }

  // Fetch profiles separately
  const reviewsWithProfiles = await Promise.all(
    (data || []).map(async (review) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', review.user_id)
        .maybeSingle();
      return { ...review, profiles: profile };
    })
  );

  return reviewsWithProfiles as PropertyReview[];
}

export async function getPropertyReviewStats(propertyId: string) {
  const reviews = await getPropertyReviews(propertyId);

  if (reviews.length === 0) {
    return {
      average: 0,
      total: 0,
      cleanliness: 0,
      location: 0,
      service: 0,
      value: 0,
    };
  }

  const total = reviews.length;
  const sumRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const sumCleanliness = reviews.reduce((sum, r) => sum + (r.cleanliness_rating || r.rating), 0);
  const sumLocation = reviews.reduce((sum, r) => sum + (r.location_rating || r.rating), 0);
  const sumService = reviews.reduce((sum, r) => sum + (r.service_rating || r.rating), 0);
  const sumValue = reviews.reduce((sum, r) => sum + (r.value_rating || r.rating), 0);

  return {
    average: sumRating / total,
    total,
    cleanliness: sumCleanliness / total,
    location: sumLocation / total,
    service: sumService / total,
    value: sumValue / total,
  };
}

export async function createPropertyReview(review: {
  property_id: string;
  booking_id?: string;
  rating: number;
  cleanliness_rating?: number;
  location_rating?: number;
  service_rating?: number;
  value_rating?: number;
  title: string;
  comment: string;
}): Promise<PropertyReview> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to submit a review');
  }

  const { data, error } = await supabase
    .from('property_reviews')
    .insert({
      ...review,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating review:', error);
    throw error;
  }

  return data;
}

export async function hasUserReviewedProperty(propertyId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { data, error } = await supabase
    .from('property_reviews')
    .select('id')
    .eq('property_id', propertyId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error checking review:', error);
    return false;
  }

  return !!data;
}

export async function getUserStayBookingsForProperty(propertyId: string): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  const { data, error } = await supabase
    .from('stay_bookings')
    .select(`
      *,
      booking:booking_id (*)
    `)
    .eq('property_id', propertyId);

  if (error) {
    console.error('Error fetching user bookings:', error);
    return [];
  }

  // Filter by user_id in bookings
  return (data || []).filter(sb => sb.booking?.user_id === user.id && sb.booking?.status === 'completed');
}
