-- Saved payment methods for express checkout
CREATE TABLE public.user_saved_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL,
  provider TEXT,
  masked_reference TEXT,
  display_name TEXT,
  is_default BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_saved_payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS policies for saved payment methods
CREATE POLICY "Users can view their own saved payment methods"
  ON public.user_saved_payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved payment methods"
  ON public.user_saved_payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved payment methods"
  ON public.user_saved_payment_methods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved payment methods"
  ON public.user_saved_payment_methods FOR DELETE
  USING (auth.uid() = user_id);

-- Split payment requests for group bookings
CREATE TABLE public.split_payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  total_amount NUMERIC NOT NULL,
  amount_per_person NUMERIC NOT NULL,
  num_participants INT NOT NULL,
  organizer_user_id UUID REFERENCES auth.users(id),
  organizer_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.split_payment_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for split payment requests
CREATE POLICY "Users can view split requests they organized"
  ON public.split_payment_requests FOR SELECT
  USING (auth.uid() = organizer_user_id);

CREATE POLICY "Users can create split payment requests"
  ON public.split_payment_requests FOR INSERT
  WITH CHECK (auth.uid() = organizer_user_id);

CREATE POLICY "Users can update their split payment requests"
  ON public.split_payment_requests FOR UPDATE
  USING (auth.uid() = organizer_user_id);

-- Split payment contributions from participants
CREATE TABLE public.split_payment_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_request_id UUID NOT NULL REFERENCES public.split_payment_requests(id) ON DELETE CASCADE,
  participant_email TEXT NOT NULL,
  participant_name TEXT,
  amount NUMERIC NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  payment_link TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.split_payment_contributions ENABLE ROW LEVEL SECURITY;

-- RLS policies for contributions
CREATE POLICY "Anyone can view contributions by email"
  ON public.split_payment_contributions FOR SELECT
  USING (true);

CREATE POLICY "System can create contributions"
  ON public.split_payment_contributions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update contributions"
  ON public.split_payment_contributions FOR UPDATE
  USING (true);

-- Payment verification logs
CREATE TABLE public.payment_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id),
  booking_id UUID REFERENCES public.bookings(id),
  gateway_provider TEXT NOT NULL,
  gateway_reference TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  gateway_response JSONB DEFAULT '{}'::jsonb,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment verifications
CREATE POLICY "Users can view their payment verifications"
  ON public.payment_verifications FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert payment verifications"
  ON public.payment_verifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update payment verifications"
  ON public.payment_verifications FOR UPDATE
  USING (true);