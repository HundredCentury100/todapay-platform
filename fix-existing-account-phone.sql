-- Quick fix to add phone number to existing account
-- Run this in Supabase SQL Editor AFTER the migration is deployed

UPDATE public.profiles
SET phone = '+263785347065'
WHERE email = 'talk@hundredtechnologies.co.zw';

-- Verify it worked
SELECT id, email, full_name, phone
FROM public.profiles
WHERE email = 'talk@hundredtechnologies.co.zw';
