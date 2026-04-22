-- Add images array column to buses table
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

-- Add operator_code column to buses table (3-4 char abbreviation)
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS operator_code text;

-- Add images array column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

-- Add account_number and country_code to merchant_profiles
ALTER TABLE public.merchant_profiles ADD COLUMN IF NOT EXISTS account_number text UNIQUE;
ALTER TABLE public.merchant_profiles ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'ZA';

-- Create sequence table to track account numbers per country and role
CREATE TABLE IF NOT EXISTS public.merchant_account_sequences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code text NOT NULL,
  role_code text NOT NULL,
  last_sequence integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(country_code, role_code)
);

-- Enable RLS on sequences table
ALTER TABLE public.merchant_account_sequences ENABLE ROW LEVEL SECURITY;

-- Allow system to manage sequences
CREATE POLICY "System can manage sequences" ON public.merchant_account_sequences FOR ALL USING (true);

-- Function to generate merchant account number
CREATE OR REPLACE FUNCTION public.generate_merchant_account_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_code text;
  seq_num integer;
  country text;
BEGIN
  -- Get country code (default to ZA if not set)
  country := COALESCE(NEW.country_code, 'ZA');
  
  -- Determine role code based on merchant role
  CASE NEW.role
    WHEN 'bus_operator' THEN role_code := 'B';
    WHEN 'event_organizer' THEN role_code := 'E';
    WHEN 'travel_agent' THEN role_code := 'A';
    WHEN 'booking_agent' THEN role_code := 'A';
    ELSE role_code := 'M';
  END CASE;
  
  -- Get and increment sequence number atomically
  INSERT INTO merchant_account_sequences (country_code, role_code, last_sequence)
  VALUES (country, role_code, 1)
  ON CONFLICT (country_code, role_code)
  DO UPDATE SET 
    last_sequence = merchant_account_sequences.last_sequence + 1,
    updated_at = now()
  RETURNING last_sequence INTO seq_num;
  
  -- Generate account number in format: COUNTRY-ROLE-NNNNN
  NEW.account_number := country || '-' || role_code || '-' || LPAD(seq_num::text, 5, '0');
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate account number on insert
DROP TRIGGER IF EXISTS generate_account_number_trigger ON public.merchant_profiles;
CREATE TRIGGER generate_account_number_trigger
  BEFORE INSERT ON public.merchant_profiles
  FOR EACH ROW
  WHEN (NEW.account_number IS NULL)
  EXECUTE FUNCTION public.generate_merchant_account_number();