
-- Delete test account data (cascades via foreign keys)
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@fulticket.test'
);

DELETE FROM public.merchant_profiles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@fulticket.test'
);

DELETE FROM public.profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@fulticket.test'
);

-- Delete auth users
DELETE FROM auth.users WHERE email LIKE '%@fulticket.test';
