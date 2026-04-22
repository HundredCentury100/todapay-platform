import { supabase } from "@/integrations/supabase/client";
import { MerchantProfile } from "@/types/merchant";

/**
 * Admin Service
 * 
 * Admin roles are managed via the user_roles table.
 * The has_role() database function is used to check admin status securely.
 */

export const isAdmin = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  try {
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in isAdmin:', error);
    return false;
  }
};

export const getAllMerchantProfiles = async (status?: string) => {
  let query = supabase
    .from('merchant_profiles')
    .select('*, operator_associations(*)');
  
  if (status) {
    query = query.eq('verification_status', status);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as (MerchantProfile & { operator_associations: any[] })[];
};

export const updateMerchantVerificationStatus = async (
  merchantId: string, 
  status: 'verified' | 'rejected'
) => {
  const updates: any = {
    verification_status: status
  };
  
  if (status === 'verified') {
    updates.verified_at = new Date().toISOString();
  }
  
  const { data, error } = await supabase
    .from('merchant_profiles')
    .update(updates)
    .eq('id', merchantId)
    .select()
    .single();

  if (error) throw error;

  // Send notification email
  try {
    await supabase.functions.invoke('send-merchant-notification', {
      body: {
        merchantId,
        status,
        businessEmail: data.business_email,
        businessName: data.business_name,
      }
    });
  } catch (emailError) {
    console.error('Failed to send notification email:', emailError);
  }

  // Log activity
  try {
    await supabase.from('merchant_activity_logs').insert({
      merchant_profile_id: merchantId,
      activity_type: status === 'verified' ? 'account_approved' : 'account_rejected',
      activity_description: `Merchant account ${status} by admin`,
      metadata: { status, timestamp: new Date().toISOString() }
    });
  } catch (logError) {
    console.error('Failed to log activity:', logError);
  }

  return data as MerchantProfile;
};
