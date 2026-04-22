import { supabase } from "@/integrations/supabase/client";

export interface Advertisement {
  id: string;
  merchant_profile_id: string;
  ad_type: 'sponsored_card' | 'banner' | 'featured_listing' | 'notification';
  title: string;
  description?: string;
  image_url?: string;
  destination_url?: string;
  destination_type?: 'bus' | 'event' | 'stay' | 'workspace' | 'venue' | 'external';
  destination_id?: string;
  target_locations: string[];
  target_event_types: string[];
  target_route_types: string[];
  target_property_types?: string[];
  target_workspace_types?: string[];
  target_venue_types?: string[];
  daily_budget: number;
  cost_per_click: number;
  total_budget?: number;
  amount_spent: number;
  start_date?: string;
  end_date?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'active' | 'paused' | 'completed' | 'archived';
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AdPerformance {
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  avgCpc: number;
}

// Fetch merchant's advertisements
export const getMerchantAds = async (merchantProfileId: string): Promise<Advertisement[]> => {
  const { data, error } = await supabase
    .from('advertisements')
    .select('*')
    .eq('merchant_profile_id', merchantProfileId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Advertisement[];
};

// Fetch all ads for admin
export const getAllAds = async (): Promise<Advertisement[]> => {
  const { data, error } = await supabase
    .from('advertisements')
    .select('*, merchant_profiles(business_name)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Advertisement[];
};

// Fetch pending ads for admin approval
export const getPendingAds = async (): Promise<Advertisement[]> => {
  const { data, error } = await supabase
    .from('advertisements')
    .select('*, merchant_profiles(business_name)')
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Advertisement[];
};

// Create new advertisement
export const createAdvertisement = async (
  ad: Omit<Advertisement, 'id' | 'created_at' | 'updated_at' | 'amount_spent' | 'approved_by' | 'approved_at' | 'rejection_reason'>
): Promise<Advertisement> => {
  const { data, error } = await supabase
    .from('advertisements')
    .insert(ad)
    .select()
    .single();

  if (error) throw error;
  return data as Advertisement;
};

// Update advertisement
export const updateAdvertisement = async (
  id: string,
  updates: Partial<Advertisement>
): Promise<Advertisement> => {
  const { data, error } = await supabase
    .from('advertisements')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Advertisement;
};

// Delete advertisement
export const deleteAdvertisement = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('advertisements')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Submit for approval
export const submitForApproval = async (id: string): Promise<Advertisement> => {
  return updateAdvertisement(id, { status: 'pending_approval' });
};

// Admin approve ad
export const approveAd = async (id: string, adminId: string): Promise<Advertisement> => {
  return updateAdvertisement(id, {
    status: 'approved',
    approved_by: adminId,
    approved_at: new Date().toISOString()
  });
};

// Admin reject ad
export const rejectAd = async (id: string, reason: string): Promise<Advertisement> => {
  return updateAdvertisement(id, {
    status: 'rejected',
    rejection_reason: reason
  });
};

// Activate ad (after approval)
export const activateAd = async (id: string): Promise<Advertisement> => {
  return updateAdvertisement(id, { status: 'active' });
};

// Pause ad
export const pauseAd = async (id: string): Promise<Advertisement> => {
  return updateAdvertisement(id, { status: 'paused' });
};

// Fetch active ads for display
export const getActiveAds = async (
  adType: 'sponsored_card' | 'banner' | 'featured_listing' | 'notification',
  filters?: {
    location?: string;
    eventType?: string;
    routeType?: string;
    propertyType?: string;
    workspaceType?: string;
    venueType?: string;
  }
): Promise<Advertisement[]> => {
  let query = supabase
    .from('advertisements')
    .select('*')
    .eq('status', 'active')
    .eq('ad_type', adType);

  const { data, error } = await query.order('daily_budget', { ascending: false });

  if (error) throw error;
  
  // Filter by targeting (client-side for flexibility)
  let ads = (data || []) as Advertisement[];
  
  if (filters?.location) {
    ads = ads.filter(ad => 
      ad.target_locations.length === 0 || 
      ad.target_locations.includes(filters.location!)
    );
  }
  
  if (filters?.eventType) {
    ads = ads.filter(ad => 
      ad.target_event_types.length === 0 || 
      ad.target_event_types.includes(filters.eventType!)
    );
  }
  
  if (filters?.routeType) {
    ads = ads.filter(ad => 
      ad.target_route_types.length === 0 || 
      ad.target_route_types.includes(filters.routeType!)
    );
  }

  if (filters?.propertyType) {
    ads = ads.filter(ad => 
      !ad.target_property_types || ad.target_property_types.length === 0 || 
      ad.target_property_types.includes(filters.propertyType!)
    );
  }

  if (filters?.workspaceType) {
    ads = ads.filter(ad => 
      !ad.target_workspace_types || ad.target_workspace_types.length === 0 || 
      ad.target_workspace_types.includes(filters.workspaceType!)
    );
  }

  if (filters?.venueType) {
    ads = ads.filter(ad => 
      !ad.target_venue_types || ad.target_venue_types.length === 0 || 
      ad.target_venue_types.includes(filters.venueType!)
    );
  }
  
  return ads;
};

// Record impression
export const recordImpression = async (
  advertisementId: string,
  placement: string,
  userId?: string,
  sessionId?: string
): Promise<void> => {
  const { error } = await supabase
    .from('ad_impressions')
    .insert({
      advertisement_id: advertisementId,
      placement,
      user_id: userId,
      session_id: sessionId || crypto.randomUUID()
    });

  if (error) console.error('Failed to record impression:', error);
};

// Record click and charge
export const recordClick = async (
  advertisementId: string,
  impressionId?: string,
  userId?: string,
  sessionId?: string
): Promise<void> => {
  // Get ad to determine cost
  const { data: ad, error: adError } = await supabase
    .from('advertisements')
    .select('cost_per_click, amount_spent, daily_budget')
    .eq('id', advertisementId)
    .single();

  if (adError || !ad) {
    console.error('Failed to get ad for click:', adError);
    return;
  }

  const cost = ad.cost_per_click;

  // Record the click
  const { error: clickError } = await supabase
    .from('ad_clicks')
    .insert({
      advertisement_id: advertisementId,
      impression_id: impressionId,
      user_id: userId,
      session_id: sessionId || crypto.randomUUID(),
      cost
    });

  if (clickError) {
    console.error('Failed to record click:', clickError);
    return;
  }

  // Update amount spent
  const { error: updateError } = await supabase
    .from('advertisements')
    .update({ amount_spent: (ad.amount_spent || 0) + cost })
    .eq('id', advertisementId);

  if (updateError) console.error('Failed to update spend:', updateError);
};

// Get ad performance metrics
export const getAdPerformance = async (
  advertisementId: string,
  startDate?: string,
  endDate?: string
): Promise<AdPerformance> => {
  let impressionsQuery = supabase
    .from('ad_impressions')
    .select('id', { count: 'exact' })
    .eq('advertisement_id', advertisementId);

  let clicksQuery = supabase
    .from('ad_clicks')
    .select('id, cost', { count: 'exact' })
    .eq('advertisement_id', advertisementId);

  if (startDate) {
    impressionsQuery = impressionsQuery.gte('created_at', startDate);
    clicksQuery = clicksQuery.gte('created_at', startDate);
  }

  if (endDate) {
    impressionsQuery = impressionsQuery.lte('created_at', endDate);
    clicksQuery = clicksQuery.lte('created_at', endDate);
  }

  const [impressionsResult, clicksResult] = await Promise.all([
    impressionsQuery,
    clicksQuery
  ]);

  const impressions = impressionsResult.count || 0;
  const clicks = clicksResult.count || 0;
  const spend = (clicksResult.data || []).reduce((sum, c) => sum + (c.cost || 0), 0);

  return {
    impressions,
    clicks,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    spend,
    avgCpc: clicks > 0 ? spend / clicks : 0
  };
};

// Get merchant's total ad spend
export const getMerchantAdSpend = async (merchantProfileId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('advertisements')
    .select('amount_spent')
    .eq('merchant_profile_id', merchantProfileId);

  if (error) throw error;
  return (data || []).reduce((sum, ad) => sum + (ad.amount_spent || 0), 0);
};
