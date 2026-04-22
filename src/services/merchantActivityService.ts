import { supabase } from "@/integrations/supabase/client";

export interface MerchantActivity {
  id: string;
  merchant_profile_id: string;
  activity_type: string;
  activity_description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export const logMerchantActivity = async (
  merchantProfileId: string,
  activityType: string,
  activityDescription: string,
  metadata: Record<string, any> = {}
) => {
  const { data, error } = await supabase
    .from('merchant_activity_logs')
    .insert({
      merchant_profile_id: merchantProfileId,
      activity_type: activityType,
      activity_description: activityDescription,
      metadata,
    })
    .select()
    .single();

  if (error) throw error;
  return data as MerchantActivity;
};

export const getMerchantActivities = async (
  merchantProfileId: string,
  limit = 50
) => {
  const { data, error } = await supabase
    .from('merchant_activity_logs')
    .select('*')
    .eq('merchant_profile_id', merchantProfileId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as MerchantActivity[];
};

export const getAllMerchantActivities = async (limit = 100) => {
  const { data, error } = await supabase
    .from('merchant_activity_logs')
    .select('*, merchant_profiles(business_name, business_email)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};