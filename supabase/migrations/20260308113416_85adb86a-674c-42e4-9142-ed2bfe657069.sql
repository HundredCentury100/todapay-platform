
ALTER TABLE public.bill_payments 
ADD COLUMN agent_profile_id UUID REFERENCES public.merchant_profiles(id),
ADD COLUMN customer_name TEXT,
ADD COLUMN customer_phone TEXT;

CREATE INDEX idx_bill_payments_agent_profile_id ON public.bill_payments(agent_profile_id);

CREATE POLICY "Agents can view own bill payments"
ON public.bill_payments
FOR SELECT
TO authenticated
USING (
  agent_profile_id IN (
    SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Agents can insert bill payments"
ON public.bill_payments
FOR INSERT
TO authenticated
WITH CHECK (
  agent_profile_id IS NULL OR
  agent_profile_id IN (
    SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
  )
);
