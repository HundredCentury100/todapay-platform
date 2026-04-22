
-- First fix the broken trigger function
CREATE OR REPLACE FUNCTION public.update_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.profile_completion_percentage := calculate_profile_completion(NEW);
  RETURN NEW;
END;
$$;

-- Also fix calculate_profile_completion to handle missing emergency contact fields gracefully
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(profile_row profiles)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  filled_fields integer := 0;
  total_fields integer := 4;
BEGIN
  IF profile_row.full_name IS NOT NULL AND profile_row.full_name != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  IF profile_row.email IS NOT NULL AND profile_row.email != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  IF profile_row.phone IS NOT NULL AND profile_row.phone != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  IF profile_row.avatar_url IS NOT NULL AND profile_row.avatar_url != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  RETURN (filled_fields * 100) / total_fields;
END;
$$;

-- Now backfill profiles
DO $$
DECLARE
  r RECORD;
  v_seq integer;
BEGIN
  FOR r IN SELECT id FROM profiles WHERE account_number IS NULL ORDER BY created_at LOOP
    INSERT INTO merchant_account_sequences (country_code, role_code, last_sequence)
    VALUES ('ZW', 'U', 1)
    ON CONFLICT (country_code, role_code)
    DO UPDATE SET
      last_sequence = merchant_account_sequences.last_sequence + 1,
      updated_at = now()
    RETURNING last_sequence INTO v_seq;

    UPDATE profiles SET account_number = 'ZW-U-' || LPAD(v_seq::text, 5, '0') WHERE id = r.id;
  END LOOP;
END;
$$;

-- Backfill corporate_accounts
DO $$
DECLARE
  r RECORD;
  v_seq integer;
BEGIN
  FOR r IN SELECT id FROM corporate_accounts WHERE account_number IS NULL ORDER BY created_at LOOP
    INSERT INTO merchant_account_sequences (country_code, role_code, last_sequence)
    VALUES ('ZW', 'C', 1)
    ON CONFLICT (country_code, role_code)
    DO UPDATE SET
      last_sequence = merchant_account_sequences.last_sequence + 1,
      updated_at = now()
    RETURNING last_sequence INTO v_seq;

    UPDATE corporate_accounts SET account_number = 'ZW-C-' || LPAD(v_seq::text, 5, '0') WHERE id = r.id;
  END LOOP;
END;
$$;
