-- Create merchant role enum
CREATE TYPE public.merchant_role AS ENUM ('bus_operator', 'event_organizer', 'admin');

-- Create merchant_profiles table
CREATE TABLE public.merchant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.merchant_role NOT NULL,
  business_name TEXT NOT NULL,
  business_email TEXT NOT NULL,
  business_phone TEXT,
  tax_id TEXT,
  business_address TEXT,
  logo_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create operator_associations table (links merchants to their buses/events)
CREATE TABLE public.operator_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  operator_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(merchant_profile_id, operator_name)
);

-- Enable RLS
ALTER TABLE public.merchant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_associations ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check merchant role
CREATE OR REPLACE FUNCTION public.is_merchant(_user_id UUID, _role public.merchant_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.merchant_profiles
    WHERE user_id = _user_id 
    AND role = _role 
    AND verification_status = 'verified'
  )
$$;

-- Create function to get merchant's operator names
CREATE OR REPLACE FUNCTION public.get_merchant_operators(_user_id UUID)
RETURNS TABLE(operator_name TEXT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT oa.operator_name
  FROM public.operator_associations oa
  JOIN public.merchant_profiles mp ON oa.merchant_profile_id = mp.id
  WHERE mp.user_id = _user_id AND mp.verification_status = 'verified'
$$;

-- RLS Policies for merchant_profiles
CREATE POLICY "Users can view their own merchant profile"
  ON public.merchant_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own merchant profile"
  ON public.merchant_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own merchant profile"
  ON public.merchant_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for operator_associations
CREATE POLICY "Merchants can view their associations"
  ON public.operator_associations FOR SELECT
  TO authenticated
  USING (
    merchant_profile_id IN (
      SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can create their associations"
  ON public.operator_associations FOR INSERT
  TO authenticated
  WITH CHECK (
    merchant_profile_id IN (
      SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
    )
  );

-- Update trigger for merchant_profiles
CREATE TRIGGER update_merchant_profiles_updated_at
  BEFORE UPDATE ON public.merchant_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add indexes for performance
CREATE INDEX idx_merchant_profiles_user_id ON public.merchant_profiles(user_id);
CREATE INDEX idx_merchant_profiles_role ON public.merchant_profiles(role);
CREATE INDEX idx_operator_associations_merchant_id ON public.operator_associations(merchant_profile_id);
CREATE INDEX idx_operator_associations_operator_name ON public.operator_associations(operator_name);