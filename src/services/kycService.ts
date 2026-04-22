import { supabase } from "@/integrations/supabase/client";
import { EntityType } from "@/components/kyc/KYCDocumentRequirements";

export interface KYCDocument {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id?: string | null;
  document_type: string;
  document_label: string;
  document_url: string;
  status: string;
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  expires_at?: string | null;
  uploaded_at: string;
}

// Legacy exports for backward compatibility
export const uploadKYCDocument = async (
  merchantProfileId: string,
  documentType: string,
  file: File
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('kyc_documents')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('kyc_documents')
    .getPublicUrl(fileName);

  const { data, error } = await supabase
    .from('user_kyc_documents')
    .insert({
      user_id: user.id,
      entity_type: 'merchant' as EntityType,
      entity_id: merchantProfileId,
      document_type: documentType,
      document_label: documentType,
      document_url: publicUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return data as KYCDocument;
};

export const getKYCDocuments = async (userId: string, entityType: EntityType) => {
  const { data, error } = await supabase
    .from('user_kyc_documents')
    .select('*')
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data as KYCDocument[];
};

export const getAllKYCDocuments = async (filters?: {
  status?: string;
  entityType?: string;
}) => {
  let query = supabase
    .from('user_kyc_documents')
    .select('*')
    .order('uploaded_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.entityType) query = query.eq('entity_type', filters.entityType);

  const { data, error } = await query;
  if (error) throw error;
  return data as KYCDocument[];
};

export const updateKYCStatus = async (
  documentId: string,
  status: 'verified' | 'rejected',
  rejectionReason?: string
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from('user_kyc_documents')
    .update({
      status,
      rejection_reason: status === 'rejected' ? rejectionReason : null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', documentId)
    .select()
    .single();

  if (error) throw error;
  return data as KYCDocument;
};

export const getMerchantKYCDocuments = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return getKYCDocuments(user.id, 'merchant');
};
