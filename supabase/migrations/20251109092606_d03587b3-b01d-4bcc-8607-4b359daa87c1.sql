-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc_documents', 'kyc_documents', false);

-- Create KYC documents table
CREATE TABLE public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  notes TEXT
);

-- Enable RLS on KYC documents
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- Merchants can view their own documents
CREATE POLICY "Merchants can view own KYC documents"
ON public.kyc_documents
FOR SELECT
USING (
  merchant_profile_id IN (
    SELECT id FROM public.merchant_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Merchants can upload their own documents
CREATE POLICY "Merchants can upload own KYC documents"
ON public.kyc_documents
FOR INSERT
WITH CHECK (
  merchant_profile_id IN (
    SELECT id FROM public.merchant_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Admins can view all documents
CREATE POLICY "Admins can view all KYC documents"
ON public.kyc_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update documents
CREATE POLICY "Admins can update KYC documents"
ON public.kyc_documents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Storage policies for KYC documents
CREATE POLICY "Merchants can upload own KYC files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'kyc_documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Merchants can view own KYC files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'kyc_documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all KYC files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'kyc_documents' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create merchant activity logs table
CREATE TABLE public.merchant_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on activity logs
ALTER TABLE public.merchant_activity_logs ENABLE ROW LEVEL SECURITY;

-- Merchants can view their own activity logs
CREATE POLICY "Merchants can view own activity logs"
ON public.merchant_activity_logs
FOR SELECT
USING (
  merchant_profile_id IN (
    SELECT id FROM public.merchant_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs"
ON public.merchant_activity_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- System can insert activity logs
CREATE POLICY "System can insert activity logs"
ON public.merchant_activity_logs
FOR INSERT
WITH CHECK (true);

-- Add onboarding_completed field to merchant_profiles
ALTER TABLE public.merchant_profiles 
ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX idx_merchant_activity_logs_merchant_profile_id 
ON public.merchant_activity_logs(merchant_profile_id);

CREATE INDEX idx_merchant_activity_logs_created_at 
ON public.merchant_activity_logs(created_at DESC);

CREATE INDEX idx_kyc_documents_merchant_profile_id 
ON public.kyc_documents(merchant_profile_id);