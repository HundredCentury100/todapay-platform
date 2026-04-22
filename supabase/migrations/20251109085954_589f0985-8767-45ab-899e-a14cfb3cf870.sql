-- Ensure the admin user has the admin role
-- First check if the user exists and add admin role
DO $$
BEGIN
  -- Add admin role for the user if they exist
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'adonismhlanga@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'admin'::app_role
    FROM auth.users
    WHERE email = 'adonismhlanga@gmail.com'
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;