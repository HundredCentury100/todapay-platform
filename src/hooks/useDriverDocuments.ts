import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type DocumentType = 
  | 'drivers_license'
  | 'vehicle_registration'
  | 'insurance'
  | 'id_document'
  | 'background_check'
  | 'vehicle_inspection';

export interface DriverDocument {
  id: string;
  driver_id: string;
  document_type: DocumentType;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  expires_at: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface UseDriverDocumentsOptions {
  driverId: string;
}

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  drivers_license: "Driver's License",
  vehicle_registration: "Vehicle Registration",
  insurance: "Vehicle Insurance",
  id_document: "ID Document / Passport",
  background_check: "Background Check Certificate",
  vehicle_inspection: "Vehicle Inspection Report",
};

export function useDriverDocuments({ driverId }: UseDriverDocumentsOptions) {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Fetch documents
  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['driver-documents', driverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_documents')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DriverDocument[];
    },
    enabled: !!driverId,
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ 
      file, 
      documentType, 
      expiresAt 
    }: { 
      file: File; 
      documentType: DocumentType; 
      expiresAt?: Date;
    }) => {
      setUploadProgress(10);

      // Validate file
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File must be JPEG, PNG, WebP, or PDF');
      }

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentType}_${Date.now()}.${fileExt}`;
      const filePath = `${driverId}/${fileName}`;

      setUploadProgress(30);

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('driver-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(60);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('driver-documents')
        .getPublicUrl(filePath);

      setUploadProgress(80);

      // Upsert document record
      const { data, error } = await supabase
        .from('driver_documents')
        .upsert({
          driver_id: driverId,
          document_type: documentType,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          status: 'pending',
          expires_at: expiresAt?.toISOString() || null,
        }, {
          onConflict: 'driver_id,document_type',
        })
        .select()
        .single();

      if (error) throw error;

      setUploadProgress(100);
      return data as DriverDocument;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-documents', driverId] });
      toast.success('Document uploaded successfully');
      setUploadProgress(0);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload document');
      setUploadProgress(0);
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      // Get document details first
      const { data: doc, error: fetchError } = await supabase
        .from('driver_documents')
        .select('file_url')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      // Extract file path from URL
      const url = new URL(doc.file_url);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(-2).join('/'); // driverId/filename

      // Delete from storage
      await supabase.storage
        .from('driver-documents')
        .remove([filePath]);

      // Delete record
      const { error } = await supabase
        .from('driver_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-documents', driverId] });
      toast.success('Document deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete document');
    },
  });

  // Get document by type
  const getDocumentByType = (type: DocumentType): DriverDocument | undefined => {
    return documents?.find(d => d.document_type === type);
  };

  // Check if all required documents are uploaded
  const requiredTypes: DocumentType[] = [
    'drivers_license',
    'vehicle_registration',
    'insurance',
    'id_document',
  ];

  const completedDocuments = requiredTypes.filter(type => {
    const doc = getDocumentByType(type);
    return doc && doc.status !== 'rejected';
  });

  const completionPercentage = Math.round(
    (completedDocuments.length / requiredTypes.length) * 100
  );

  const allApproved = requiredTypes.every(type => {
    const doc = getDocumentByType(type);
    return doc?.status === 'approved';
  });

  return {
    documents,
    isLoading,
    error,
    uploadDocument: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadProgress,
    deleteDocument: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    getDocumentByType,
    completionPercentage,
    allApproved,
    requiredTypes,
  };
}
