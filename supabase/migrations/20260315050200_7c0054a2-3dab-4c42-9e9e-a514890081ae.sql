
-- Add agent_type and agent_code columns to merchant_profiles
ALTER TABLE public.merchant_profiles 
  ADD COLUMN IF NOT EXISTS agent_type TEXT,
  ADD COLUMN IF NOT EXISTS agent_code TEXT UNIQUE;

-- Create trigger function to auto-generate agent_code
CREATE OR REPLACE FUNCTION public.generate_agent_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_prefix TEXT;
  v_seq_num INTEGER;
BEGIN
  -- Only generate for agent roles
  IF NEW.role NOT IN ('travel_agent', 'booking_agent') THEN
    NEW.agent_type := NULL;
    NEW.agent_code := NULL;
    RETURN NEW;
  END IF;

  -- Set agent_type based on role
  IF NEW.role = 'travel_agent' THEN
    NEW.agent_type := 'internal';
    v_prefix := '00';
  ELSIF NEW.role = 'booking_agent' THEN
    NEW.agent_type := 'external';
    v_prefix := '10';
  END IF;

  -- Only generate code if not already set
  IF NEW.agent_code IS NULL OR (OLD IS NOT NULL AND OLD.role IS DISTINCT FROM NEW.role) THEN
    INSERT INTO merchant_account_sequences (country_code, role_code, last_sequence)
    VALUES ('AG', v_prefix, 1)
    ON CONFLICT (country_code, role_code)
    DO UPDATE SET 
      last_sequence = merchant_account_sequences.last_sequence + 1,
      updated_at = now()
    RETURNING last_sequence INTO v_seq_num;

    NEW.agent_code := v_prefix || LPAD(v_seq_num::text, 5, '0');
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger (before insert or update)
DROP TRIGGER IF EXISTS trigger_generate_agent_code ON public.merchant_profiles;
CREATE TRIGGER trigger_generate_agent_code
  BEFORE INSERT OR UPDATE OF role ON public.merchant_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_agent_code();

-- Backfill existing agents
UPDATE public.merchant_profiles 
SET agent_type = 'internal'
WHERE role = 'travel_agent' AND agent_type IS NULL;

UPDATE public.merchant_profiles 
SET agent_type = 'external'
WHERE role = 'booking_agent' AND agent_type IS NULL;
