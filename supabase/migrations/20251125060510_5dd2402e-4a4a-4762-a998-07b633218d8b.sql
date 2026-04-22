-- Add travel_agent and booking_agent roles to merchant_role enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'merchant_role' AND e.enumlabel = 'travel_agent') THEN
    ALTER TYPE merchant_role ADD VALUE 'travel_agent';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'merchant_role' AND e.enumlabel = 'booking_agent') THEN
    ALTER TYPE merchant_role ADD VALUE 'booking_agent';
  END IF;
END $$;

-- Extend merchant_profiles with agent-specific fields
ALTER TABLE merchant_profiles 
  ADD COLUMN IF NOT EXISTS agent_license_number text,
  ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS agent_tier text DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- Create agent_commissions table for tracking earnings
CREATE TABLE IF NOT EXISTS agent_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_profile_id uuid REFERENCES merchant_profiles(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  commission_amount numeric NOT NULL,
  commission_rate numeric NOT NULL,
  booking_amount numeric NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  payment_method text,
  payment_reference text,
  notes text,
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  paid_at timestamptz,
  approved_by uuid,
  paid_by uuid
);

-- Create agent_clients table for client management
CREATE TABLE IF NOT EXISTS agent_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_profile_id uuid REFERENCES merchant_profiles(id) ON DELETE CASCADE NOT NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text,
  client_company text,
  client_passport text,
  total_bookings integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  last_booking_date timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_profile_id, client_email)
);

-- Extend bookings table with agent tracking
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS booked_by_agent_id uuid REFERENCES merchant_profiles(id),
  ADD COLUMN IF NOT EXISTS agent_commission_rate numeric,
  ADD COLUMN IF NOT EXISTS agent_client_id uuid REFERENCES agent_clients(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_commissions_agent ON agent_commissions(agent_profile_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_booking ON agent_commissions(booking_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_status ON agent_commissions(status);
CREATE INDEX IF NOT EXISTS idx_agent_clients_agent ON agent_clients(agent_profile_id);
CREATE INDEX IF NOT EXISTS idx_bookings_agent ON bookings(booked_by_agent_id);

-- Enable RLS
ALTER TABLE agent_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_commissions
CREATE POLICY "Agents can view their own commissions"
ON agent_commissions FOR SELECT
USING (agent_profile_id IN (
  SELECT id FROM merchant_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "System can insert commissions"
ON agent_commissions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all commissions"
ON agent_commissions FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update commissions"
ON agent_commissions FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for agent_clients
CREATE POLICY "Agents can view their own clients"
ON agent_clients FOR SELECT
USING (agent_profile_id IN (
  SELECT id FROM merchant_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Agents can create clients"
ON agent_clients FOR INSERT
WITH CHECK (agent_profile_id IN (
  SELECT id FROM merchant_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Agents can update their own clients"
ON agent_clients FOR UPDATE
USING (agent_profile_id IN (
  SELECT id FROM merchant_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Agents can delete their own clients"
ON agent_clients FOR DELETE
USING (agent_profile_id IN (
  SELECT id FROM merchant_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can view all clients"
ON agent_clients FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add policy for agents to view their bookings
CREATE POLICY "Agents can view their bookings"
ON bookings FOR SELECT
USING (booked_by_agent_id IN (
  SELECT id FROM merchant_profiles WHERE user_id = auth.uid()
));

-- Trigger to update agent_clients stats
CREATE OR REPLACE FUNCTION update_agent_client_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.agent_client_id IS NOT NULL THEN
    UPDATE agent_clients
    SET 
      total_bookings = total_bookings + 1,
      total_revenue = total_revenue + NEW.total_price,
      last_booking_date = NEW.created_at,
      updated_at = now()
    WHERE id = NEW.agent_client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_agent_client_stats
AFTER INSERT ON bookings
FOR EACH ROW
WHEN (NEW.agent_client_id IS NOT NULL)
EXECUTE FUNCTION update_agent_client_stats();

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_agent_referral_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  result text := 'AGT-';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code for agents
CREATE OR REPLACE FUNCTION set_agent_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.role = 'travel_agent' OR NEW.role = 'booking_agent') AND NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_agent_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_set_agent_referral_code
BEFORE INSERT ON merchant_profiles
FOR EACH ROW
EXECUTE FUNCTION set_agent_referral_code();