-- Add agent payment tracking columns to transactions table
ALTER TABLE public.transactions
ADD COLUMN booked_by_agent_id uuid REFERENCES public.merchant_profiles(id),
ADD COLUMN agent_commission_deducted boolean DEFAULT false,
ADD COLUMN agent_remittance_amount numeric,
ADD COLUMN agent_payment_method text;

-- Add agent payment settings to merchant_profiles
ALTER TABLE public.merchant_profiles
ADD COLUMN agent_commission_model text DEFAULT 'platform_pays' CHECK (agent_commission_model IN ('platform_pays', 'agent_retains', 'merchant_pays')),
ADD COLUMN allow_agent_commission_deduction boolean DEFAULT true;

-- Create agent_payment_records table for tracking agent-to-merchant remittances
CREATE TABLE public.agent_payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_profile_id uuid NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  commission_id uuid REFERENCES public.agent_commissions(id) ON DELETE SET NULL,
  payment_type text NOT NULL CHECK (payment_type IN ('agent_to_merchant', 'client_to_agent', 'agent_to_client')),
  amount numeric NOT NULL,
  payment_method text NOT NULL,
  payment_reference text,
  payment_proof_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'disputed', 'completed')),
  notes text,
  verified_by uuid REFERENCES public.merchant_profiles(id),
  verified_at timestamp with time zone,
  due_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on agent_payment_records
ALTER TABLE public.agent_payment_records ENABLE ROW LEVEL SECURITY;

-- Agents can view their own payment records
CREATE POLICY "Agents can view their own payment records"
ON public.agent_payment_records
FOR SELECT
USING (
  agent_profile_id IN (
    SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
  )
);

-- Agents can create payment records
CREATE POLICY "Agents can create payment records"
ON public.agent_payment_records
FOR INSERT
WITH CHECK (
  agent_profile_id IN (
    SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
  )
);

-- Agents can update their own payment records
CREATE POLICY "Agents can update their own payment records"
ON public.agent_payment_records
FOR UPDATE
USING (
  agent_profile_id IN (
    SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
  )
);

-- Merchants can view payment records for their bookings
CREATE POLICY "Merchants can view payment records for their bookings"
ON public.agent_payment_records
FOR SELECT
USING (
  booking_id IN (
    SELECT b.id FROM public.bookings b
    JOIN public.merchant_profiles mp ON mp.user_id = auth.uid()
    WHERE b.operator IN (
      SELECT oa.operator_name FROM public.operator_associations oa
      WHERE oa.merchant_profile_id = mp.id
    )
  )
);

-- Merchants can update payment records (verify payments)
CREATE POLICY "Merchants can verify payment records"
ON public.agent_payment_records
FOR UPDATE
USING (
  booking_id IN (
    SELECT b.id FROM public.bookings b
    JOIN public.merchant_profiles mp ON mp.user_id = auth.uid()
    WHERE b.operator IN (
      SELECT oa.operator_name FROM public.operator_associations oa
      WHERE oa.merchant_profile_id = mp.id
    )
  )
);

-- Admins can view all payment records
CREATE POLICY "Admins can view all payment records"
ON public.agent_payment_records
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all payment records
CREATE POLICY "Admins can update all payment records"
ON public.agent_payment_records
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger for agent_payment_records
CREATE TRIGGER update_agent_payment_records_updated_at
  BEFORE UPDATE ON public.agent_payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX idx_agent_payment_records_agent_id ON public.agent_payment_records(agent_profile_id);
CREATE INDEX idx_agent_payment_records_booking_id ON public.agent_payment_records(booking_id);
CREATE INDEX idx_agent_payment_records_status ON public.agent_payment_records(status);