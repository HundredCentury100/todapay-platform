import { supabase } from "@/integrations/supabase/client";

export interface WorkspaceReview {
  id: string;
  workspace_id: string;
  user_id: string | null;
  booking_id: string | null;
  rating: number;
  space_rating: number | null;
  service_rating: number | null;
  value_rating: number | null;
  title: string;
  comment: string;
  merchant_response: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string | null } | null;
  workspace?: { name: string } | null;
}

export interface WorkspaceReviewStats {
  average: number;
  total: number;
  space: number;
  service: number;
  value: number;
  distribution: number[];
  responseRate: number;
  respondedCount: number;
}

export async function getWorkspaceReviews(workspaceId: string): Promise<WorkspaceReview[]> {
  const { data, error } = await supabase
    .from('workspace_reviews')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching workspace reviews:', error);
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

  return reviewsWithProfiles as WorkspaceReview[];
}

export async function getWorkspaceReviewStats(workspaceId: string): Promise<WorkspaceReviewStats> {
  const reviews = await getWorkspaceReviews(workspaceId);

  if (reviews.length === 0) {
    return {
      average: 0,
      total: 0,
      space: 0,
      service: 0,
      value: 0,
      distribution: [0, 0, 0, 0, 0],
      responseRate: 0,
      respondedCount: 0,
    };
  }

  const total = reviews.length;
  const sumRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const sumSpace = reviews.reduce((sum, r) => sum + (r.space_rating || r.rating), 0);
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
    space: sumSpace / total,
    service: sumService / total,
    value: sumValue / total,
    distribution,
    responseRate: (respondedCount / total) * 100,
    respondedCount,
  };
}

export async function getMerchantWorkspaceReviews(merchantProfileId: string): Promise<WorkspaceReview[]> {
  // First get all workspaces for this merchant
  const { data: workspaces, error: workspacesError } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('merchant_profile_id', merchantProfileId);

  if (workspacesError) {
    console.error('Error fetching merchant workspaces:', workspacesError);
    throw workspacesError;
  }

  if (!workspaces || workspaces.length === 0) {
    return [];
  }

  const workspaceIds = workspaces.map(w => w.id);

  // Fetch all reviews for these workspaces
  const { data: reviews, error: reviewsError } = await supabase
    .from('workspace_reviews')
    .select('*')
    .in('workspace_id', workspaceIds)
    .order('created_at', { ascending: false });

  if (reviewsError) {
    console.error('Error fetching workspace reviews:', reviewsError);
    throw reviewsError;
  }

  // Enrich with profiles and workspace names
  const enrichedReviews = await Promise.all(
    (reviews || []).map(async (review) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', review.user_id)
        .maybeSingle();
      
      const workspace = workspaces.find(w => w.id === review.workspace_id);
      
      return { 
        ...review, 
        profiles: profile,
        workspace: workspace ? { name: workspace.name } : null
      };
    })
  );

  return enrichedReviews as WorkspaceReview[];
}

export async function getMerchantReviewStats(merchantProfileId: string): Promise<WorkspaceReviewStats> {
  const reviews = await getMerchantWorkspaceReviews(merchantProfileId);

  if (reviews.length === 0) {
    return {
      average: 0,
      total: 0,
      space: 0,
      service: 0,
      value: 0,
      distribution: [0, 0, 0, 0, 0],
      responseRate: 0,
      respondedCount: 0,
    };
  }

  const total = reviews.length;
  const sumRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const sumSpace = reviews.reduce((sum, r) => sum + (r.space_rating || r.rating), 0);
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
    space: sumSpace / total,
    service: sumService / total,
    value: sumValue / total,
    distribution,
    responseRate: (respondedCount / total) * 100,
    respondedCount,
  };
}

export async function createWorkspaceReview(review: {
  workspace_id: string;
  booking_id?: string;
  rating: number;
  space_rating?: number;
  service_rating?: number;
  value_rating?: number;
  title: string;
  comment: string;
}): Promise<{ data: WorkspaceReview | null; error: Error | null }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('User must be authenticated to submit a review') };
  }

  const { data, error } = await supabase
    .from('workspace_reviews')
    .insert({
      ...review,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating workspace review:', error);
    return { data: null, error };
  }

  return { data: data as WorkspaceReview, error: null };
}

export async function respondToWorkspaceReview(
  reviewId: string, 
  response: string
): Promise<{ success: boolean; error: Error | null }> {
  const { data, error } = await supabase
    .rpc('respond_to_workspace_review', {
      p_review_id: reviewId,
      p_response: response
    });

  if (error) {
    console.error('Error responding to review:', error);
    return { success: false, error };
  }

  return { success: data === true, error: null };
}

export async function hasUserReviewedWorkspace(workspaceId: string, bookingId?: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  let query = supabase
    .from('workspace_reviews')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id);

  if (bookingId) {
    query = query.eq('booking_id', bookingId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Error checking workspace review:', error);
    return false;
  }

  return !!data;
}

export async function getUserWorkspaceBookings(workspaceId: string): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('workspace_bookings')
    .select(`
      *,
      booking:booking_id (*)
    `)
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('Error fetching user workspace bookings:', error);
    return [];
  }

  // Filter by user_id in bookings and completed status
  return (data || []).filter(
    wb => wb.booking?.user_id === user.id && wb.booking?.status === 'completed'
  );
}
