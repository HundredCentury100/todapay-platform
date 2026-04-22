-- Create storage bucket for merchant images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'merchant-images',
  'merchant-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- RLS policies for merchant images bucket
CREATE POLICY "Public can view merchant images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'merchant-images');

CREATE POLICY "Authenticated merchants can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'merchant-images' AND
  EXISTS (
    SELECT 1 FROM merchant_profiles
    WHERE merchant_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Merchants can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'merchant-images' AND
  EXISTS (
    SELECT 1 FROM merchant_profiles
    WHERE merchant_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Merchants can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'merchant-images' AND
  EXISTS (
    SELECT 1 FROM merchant_profiles
    WHERE merchant_profiles.user_id = auth.uid()
  )
);