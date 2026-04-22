-- Fix payment_proofs SELECT: scope to user's own files
DROP POLICY IF EXISTS "Users can view their own payment proofs" ON storage.objects;
CREATE POLICY "Users can view their own payment proofs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment_proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Fix payment_proofs INSERT: scope to user's own folder
DROP POLICY IF EXISTS "Users can upload their payment proofs" ON storage.objects;
CREATE POLICY "Users can upload their payment proofs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment_proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Fix merchant-images DELETE: scope to merchant's own folder
DROP POLICY IF EXISTS "Merchants can delete their own images" ON storage.objects;
CREATE POLICY "Merchants can delete their own images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'merchant-images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM merchant_profiles WHERE user_id = auth.uid()
    )
  );

-- Fix merchant-images UPDATE: scope to merchant's own folder
DROP POLICY IF EXISTS "Merchants can update their own images" ON storage.objects;
CREATE POLICY "Merchants can update their own images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'merchant-images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM merchant_profiles WHERE user_id = auth.uid()
    )
  );

-- Fix merchant-images INSERT: scope to merchant's own folder
DROP POLICY IF EXISTS "Authenticated merchants can upload images" ON storage.objects;
CREATE POLICY "Authenticated merchants can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'merchant-images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM merchant_profiles WHERE user_id = auth.uid()
    )
  );