-- Create driver_documents table for structured document tracking
CREATE TABLE public.driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('drivers_license', 'vehicle_registration', 'insurance', 'id_document', 'background_check', 'vehicle_inspection')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(driver_id, document_type)
);

-- Enable RLS
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own documents
CREATE POLICY "Drivers can view their own documents"
ON public.driver_documents FOR SELECT
USING (
  driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);

-- Drivers can insert their own documents
CREATE POLICY "Drivers can insert their own documents"
ON public.driver_documents FOR INSERT
WITH CHECK (
  driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);

-- Drivers can update their own documents
CREATE POLICY "Drivers can update their own documents"
ON public.driver_documents FOR UPDATE
USING (
  driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);

-- Create storage bucket for driver documents if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-documents',
  'driver-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for driver documents
CREATE POLICY "Drivers can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'driver-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.drivers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Drivers can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'driver-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.drivers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Drivers can update their own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'driver-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.drivers WHERE user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_driver_documents_driver_id ON public.driver_documents(driver_id);
CREATE INDEX idx_driver_documents_status ON public.driver_documents(status);

-- Trigger to update updated_at
CREATE TRIGGER update_driver_documents_updated_at
  BEFORE UPDATE ON public.driver_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();