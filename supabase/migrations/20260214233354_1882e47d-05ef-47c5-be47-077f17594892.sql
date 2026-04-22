
-- Add account_number columns
ALTER TABLE public.profiles ADD COLUMN account_number TEXT UNIQUE;
ALTER TABLE public.corporate_accounts ADD COLUMN account_number TEXT UNIQUE;

-- User account number trigger function (format: CC-U-NNNNN)
CREATE OR REPLACE FUNCTION public.generate_user_account_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_seq_num integer;
BEGIN
  IF NEW.account_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO merchant_account_sequences (country_code, role_code, last_sequence)
  VALUES ('ZW', 'U', 1)
  ON CONFLICT (country_code, role_code)
  DO UPDATE SET
    last_sequence = merchant_account_sequences.last_sequence + 1,
    updated_at = now()
  RETURNING last_sequence INTO v_seq_num;

  NEW.account_number := 'ZW-U-' || LPAD(v_seq_num::text, 5, '0');
  RETURN NEW;
END;
$$;

-- Corporate account number trigger function (format: CC-C-NNNNN)
CREATE OR REPLACE FUNCTION public.generate_corporate_account_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_seq_num integer;
BEGIN
  IF NEW.account_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO merchant_account_sequences (country_code, role_code, last_sequence)
  VALUES ('ZW', 'C', 1)
  ON CONFLICT (country_code, role_code)
  DO UPDATE SET
    last_sequence = merchant_account_sequences.last_sequence + 1,
    updated_at = now()
  RETURNING last_sequence INTO v_seq_num;

  NEW.account_number := 'ZW-C-' || LPAD(v_seq_num::text, 5, '0');
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS generate_user_account_number_trigger ON public.profiles;
CREATE TRIGGER generate_user_account_number_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_user_account_number();

DROP TRIGGER IF EXISTS generate_corporate_account_number_trigger ON public.corporate_accounts;
CREATE TRIGGER generate_corporate_account_number_trigger
BEFORE INSERT ON public.corporate_accounts
FOR EACH ROW
EXECUTE FUNCTION public.generate_corporate_account_number();
