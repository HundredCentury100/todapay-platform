import { supabase } from "@/integrations/supabase/client";

export interface VenueReview {
  id: string;
  venue_id: string;
  user_id: string | null;
  booking_id: string | null;
  rating: number;
  venue_rating: number | null;
  service_rating: number | null;
  value_rating: number | null;
  title: string;
  comment: string;
  merchant_response: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string | null } | null;
  venue?: { name: string } | null;
}

export interface VenueReviewStats {
  average: number;
  total: number;
  venue: number;
  service: number;
  value: number;
  distribution: number[];
  responseRate: number;
  respondedCount: number;
}

export async function getVenueReviews(venueId: string): Promise<VenueReview[]> {
  const { data, error } = await supabase
    .from('venue_reviews')
    .select('*')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching venue reviews:', error);
    throw error;
  }

  // Fetch profiles separately for each review
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

  return reviewsWithProfiles as VenueReview[];
}

export async function getVenueReviewStats(venueId: string): Promise<VenueReviewStats> {
  const reviews = await getVenueReviews(venueId);

  if (reviews.length === 0) {
    return {
      average: 0,
      total: 0,
      venue: 0,
      service: 0,
      value: 0,
      distribution: [0, 0, 0, 0, 0],
      responseRate: 0,
      respondedCount: 0,
    };
  }

  const total = reviews.length;
  const sumRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const sumVenue = reviews.reduce((sum, r) => sum + (r.venue_rating || r.rating), 0);
  const sumService = reviews.reduce((sum, r) => sum + (r.service_rating || r.rating), 0);
  const sumValue = reviews.reduce((sum, r) => sum + (r.value_rating || r.rating), 0);

  const distribution = [0, 0, 0, 0, 0];
  reviews.forEach(r => {
    distribution[r.rating - 1]++;
  });

  const respondedCount = reviews.filter(r => r.merchant_response).length;

  return {
    average: sumRating / total,
    total,
    venue: sumVenue / total,
    service: sumService / total,
    value: sumValue / total,
    distribution,
    responseRate: (respondedCount / total) * 100,
    respondedCount,
  };
}

export async function getMerchantVenueReviews(merchantProfileId: string): Promise<VenueReview[]> {
  // First get all venues for this merchant
  const { data: venues, error: venuesError } = await supabase
    .from('venues')
    .select('id, name')
    .eq('merchant_profile_id', merchantProfileId);

  if (venuesError) {
    console.error('Error fetching merchant venues:', venuesError);
    throw venuesError;
  }

  if (!venues || venues.length === 0) {
    return [];
  }

  const venueIds = venues.map(v => v.id);

  // Fetch all reviews for these venues
  const { data: reviews, error: reviewsError } = await supabase
    .from('venue_reviews')
    .select('*')
    .in('venue_id', venueIds)
    .order('created_at', { ascending: false });

  if (reviewsError) {
    console.error('Error fetching venue reviews:', reviewsError);
    throw reviewsError;
  }

  // Enrich with profiles and venue names
  const enrichedReviews = await Promise.all(
    (reviews || []).map(async (review) => {
      const [{ data: profile }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name')
          .eq('id', review.user_id)
          .maybeSingle(),
      ]);
      
      const venue = venues.find(v => v.id === review.venue_id);
      
      return { 
        ...review, 
        profiles: profile,
        venue: venue ? { name: venue.name } : null
      };
    })
  );

  return enrichedReviews as VenueReview[];
}

export async function getMerchantReviewStats(merchantProfileId: string): Promise<VenueReviewStats> {
  const reviews = await getMerchantVenueReviews(merchantProfileId);

  if (reviews.length === 0) {
    return {
      average: 0,
      total: 0,
      venue: 0,
      service: 0,
      value: 0,
      distribution: [0, 0, 0, 0, 0],
      responseRate: 0,
      respondedCount: 0,
    };
  }

  const total = reviews.length;
  const sumRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const sumVenue = reviews.reduce((sum, r) => sum + (r.venue_rating || r.rating), 0);
  const sumService = reviews.reduce((sum, r) => sum + (r.service_rating || r.rating), 0);
  const sumValue = reviews.reduce((sum, r) => sum + (r.value_rating || r.rating), 0);

  const distribution = [0, 0, 0, 0, 0];
  reviews.forEach(r => {
    distribution[r.rating - 1]++;
  });

  const respondedCount = reviews.filter(r => r.merchant_response).length;

  return {
    average: sumRating / total,
    total,
    venue: sumVenue / total,
    service: sumService / total,
    value: sumValue / total,
    distribution,
    responseRate: (respondedCount / total) * 100,
    respondedCount,
  };
}

export async function createVenueReview(review: {
  venue_id: string;
  booking_id?: string;
  rating: number;
  venue_rating?: number;
  service_rating?: number;
  value_rating?: number;
  title: string;
  comment: string;
}): Promise<{ data: VenueReview | null; error: Error | null }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('User must be authenticated to submit a review') };
  }

  const { data, error } = await supabase
    .from('venue_reviews')
    .insert({
      ...review,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating venue review:', error);
    return { data: null, error };
  }

  return { data: data as VenueReview, error: null };
}

export async function respondToVenueReview(
  reviewId: string, 
  response: string
): Promise<{ success: boolean; error: Error | null }> {
  const { data, error } = await supabase
    .rpc('respond_to_venue_review', {
      p_review_id: reviewId,
      p_response: response
    });

  if (error) {
    console.error('Error responding to review:', error);
    return { success: false, error };
  }

  return { success: data === true, error: null };
}

export async function hasUserReviewedVenue(venueId: string, bookingId?: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  let query = supabase
    .from('venue_reviews')
    .select('id')
    .eq('venue_id', venueId)
    .eq('user_id', user.id);

  if (bookingId) {
    query = query.eq('booking_id', bookingId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Error checking venue review:', error);
    return false;
  }

  return !!data;
}

export async function getUserVenueBookings(venueId: string): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('venue_bookings')
    .select(`
      *,
      booking:booking_id (*)
    `)
    .eq('venue_id', venueId);

  if (error) {
    console.error('Error fetching user venue bookings:', error);
    return [];
  }

  // Filter by user_id in bookings and completed status
  return (data || []).filter(
    vb => vb.booking?.user_id === user.id && vb.booking?.status === 'completed'
  );
}
