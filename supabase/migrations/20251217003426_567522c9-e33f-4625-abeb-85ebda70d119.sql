-- Fix the ambiguous column reference in generate_merchant_account_number function
CREATE OR REPLACE FUNCTION public.generate_merchant_account_number()
RETURNS TRIGGER AS $$
DECLARE
  v_role_code text;
  v_seq_num integer;
  v_country text;
BEGIN
  -- Get country code (default to ZA if not set)
  v_country := COALESCE(NEW.country_code, 'ZA');
  
  -- Determine role code based on merchant role
  CASE NEW.role
    WHEN 'bus_operator' THEN v_role_code := 'B';
    WHEN 'event_organizer' THEN v_role_code := 'E';
    WHEN 'travel_agent' THEN v_role_code := 'A';
    WHEN 'booking_agent' THEN v_role_code := 'A';
    ELSE v_role_code := 'M';
  END CASE;
  
  -- Get and increment sequence number atomically
  INSERT INTO merchant_account_sequences (country_code, role_code, last_sequence)
  VALUES (v_country, v_role_code, 1)
  ON CONFLICT (country_code, role_code)
  DO UPDATE SET 
    last_sequence = merchant_account_sequences.last_sequence + 1,
    updated_at = now()
  RETURNING last_sequence INTO v_seq_num;
  
  -- Generate account number in format: COUNTRY-ROLE-NNNNN
  NEW.account_number := v_country || '-' || v_role_code || '-' || LPAD(v_seq_num::text, 5, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;