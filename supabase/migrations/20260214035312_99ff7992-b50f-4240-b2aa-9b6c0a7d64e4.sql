
-- Create bill_payments table for tracking bill payment transactions
CREATE TABLE public.bill_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  biller_type TEXT NOT NULL, -- 'zetdc', 'bcc', 'econet', 'netone', 'telecel', 'nyaradzo', 'moonlight', 'edgars', 'jet'
  biller_name TEXT NOT NULL,
  account_number TEXT NOT NULL, -- meter number for ZESA, account number for others
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  tokens JSONB, -- for ZESA tokens
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
  transaction_reference TEXT,
  payment_method TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bill payments"
  ON public.bill_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bill payments"
  ON public.bill_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bill payments"
  ON public.bill_payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_bill_payments_updated_at
  BEFORE UPDATE ON public.bill_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
