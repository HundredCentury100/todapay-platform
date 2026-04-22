import { supabase } from "@/integrations/supabase/client";
import { MerchantProfile, OperatorAssociation, MerchantRole } from "@/types/merchant";

export const createMerchantProfile = async (data: {
  role: MerchantRole;
  business_name: string;
  business_email: string;
  business_phone?: string;
  business_address?: string;
  agent_license_number?: string;
}) => {
  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('You must be logged in to create a merchant profile');
  }

  const insertData: any = {
    user_id: user.id,  // Critical: include user_id for RLS policy
    role: data.role,
    business_name: data.business_name,
    business_email: data.business_email,
    verification_status: 'pending'
  };
  
  if (data.business_phone) insertData.business_phone = data.business_phone;
  if (data.business_address) insertData.business_address = data.business_address;
  if (data.agent_license_number) insertData.agent_license_number = data.agent_license_number;

  const { data: profile, error } = await supabase
    .from('merchant_profiles')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return profile as MerchantProfile;
};

export const getMerchantProfile = async (role?: MerchantRole, retries: number = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      let query = supabase
        .from('merchant_profiles')
        .select('*');
      
      if (role) {
        query = query.eq('role', role);
      }
      
      // Use .limit(1) to safely handle users with multiple profiles
      // Order by verified first, then by created_at desc to get the most relevant profile
      const { data, error } = await query
        .order('verification_status', { ascending: true }) // 'verified' before 'pending'
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error(`[MerchantService] Attempt ${attempt} failed:`, error);
        if (attempt === retries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      return data as MerchantProfile | null;
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return null;
};

export const getAllMerchantProfiles = async (retries: number = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data, error } = await supabase
        .from('merchant_profiles')
        .select('*');
      
      if (error) {
        console.error(`[MerchantService] Attempt ${attempt} failed:`, error);
        if (attempt === retries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      return (data || []) as MerchantProfile[];
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return [];
};

export const updateMerchantProfile = async (id: string, updates: Partial<MerchantProfile>) => {
  const { data, error } = await supabase
    .from('merchant_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as MerchantProfile;
};

export const addOperatorAssociation = async (merchantProfileId: string, operatorName: string) => {
  const { data, error } = await supabase
    .from('operator_associations')
    .insert({
      merchant_profile_id: merchantProfileId,
      operator_name: operatorName
    })
    .select()
    .single();

  if (error) throw error;
  return data as OperatorAssociation;
};

export const getOperatorAssociations = async (merchantProfileId: string) => {
  const { data, error } = await supabase
    .from('operator_associations')
    .select('*')
    .eq('merchant_profile_id', merchantProfileId);

  if (error) throw error;
  return data as OperatorAssociation[];
};

export const getMerchantOperatorNames = async (): Promise<string[]> => {
  const { data, error } = await supabase.rpc('get_merchant_operators', {
    _user_id: (await supabase.auth.getUser()).data.user?.id
  });

  if (error) throw error;
  return (data || []).map((row: any) => row.operator_name);
};
