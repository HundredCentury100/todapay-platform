
-- Create universal KYC documents table
CREATE TABLE public.user_kyc_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'merchant', 'agent', 'corporate', 'driver')),
  entity_id UUID,
  document_type TEXT NOT NULL,
  document_label TEXT NOT NULL,
  document_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  expires_at DATE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_user_kyc_documents_user_id ON public.user_kyc_documents(user_id);
CREATE INDEX idx_user_kyc_documents_status ON public.user_kyc_documents(status);
CREATE INDEX idx_user_kyc_documents_entity ON public.user_kyc_documents(entity_type, entity_id);

-- Enable RLS
ALTER TABLE public.user_kyc_documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own documents
CREATE POLICY "Users can view own KYC documents"
ON public.user_kyc_documents FOR SELECT
USING (auth.uid() = user_id);

-- Users can upload their own documents
CREATE POLICY "Users can upload own KYC documents"
ON public.user_kyc_documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own pending documents
CREATE POLICY "Users can delete own pending KYC documents"
ON public.user_kyc_documents FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all documents
CREATE POLICY "Admins can view all KYC documents"
ON public.user_kyc_documents FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update document status
CREATE POLICY "Admins can update KYC documents"
ON public.user_kyc_documents FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));
