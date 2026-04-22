-- Create booking policies table
CREATE TABLE IF NOT EXISTS public.booking_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_profile_id UUID REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  policy_type TEXT NOT NULL, -- 'bus' or 'event'
  cancellation_window_hours INTEGER NOT NULL DEFAULT 24, -- Hours before departure/event
  full_refund_percentage NUMERIC NOT NULL DEFAULT 100,
  partial_refund_percentage NUMERIC NOT NULL DEFAULT 50,
  partial_refund_window_hours INTEGER NOT NULL DEFAULT 48,
  no_refund_window_hours INTEGER NOT NULL DEFAULT 6,
  reschedule_fee NUMERIC NOT NULL DEFAULT 0,
  reschedule_allowed BOOLEAN NOT NULL DEFAULT true,
  max_reschedules INTEGER NOT NULL DEFAULT 2,
  automated_enforcement BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create booking actions history table
CREATE TABLE IF NOT EXISTS public.booking_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL, -- 'cancel', 'refund', 'reschedule', 'upgrade'
  action_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
  requested_by UUID REFERENCES auth.users(id),
  processed_by UUID REFERENCES auth.users(id),
  refund_amount NUMERIC,
  refund_percentage NUMERIC,
  reason TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.booking_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_policies
CREATE POLICY "Merchants can view their own policies"
  ON public.booking_policies FOR SELECT
  USING (
    merchant_profile_id IN (
      SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can create their own policies"
  ON public.booking_policies FOR INSERT
  WITH CHECK (
    merchant_profile_id IN (
      SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can update their own policies"
  ON public.booking_policies FOR UPDATE
  USING (
    merchant_profile_id IN (
      SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for booking_actions
CREATE POLICY "Users can view their own booking actions"
  ON public.booking_actions FOR SELECT
  USING (
    requested_by = auth.uid() OR
    booking_id IN (
      SELECT id FROM public.bookings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create booking actions for their bookings"
  ON public.booking_actions FOR INSERT
  WITH CHECK (
    booking_id IN (
      SELECT id FROM public.bookings WHERE user_id = auth.uid() OR auth.uid() IS NULL
    )
  );

CREATE POLICY "Merchants can update booking actions"
  ON public.booking_actions FOR UPDATE
  USING (
    booking_id IN (
      SELECT b.id FROM public.bookings b
      JOIN public.merchant_profiles mp ON mp.user_id = auth.uid()
    )
  );

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_booking_policies_updated_at
  BEFORE UPDATE ON public.booking_policies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_booking_actions_updated_at
  BEFORE UPDATE ON public.booking_actions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_booking_policies_merchant ON public.booking_policies(merchant_profile_id);
CREATE INDEX idx_booking_actions_booking ON public.booking_actions(booking_id);
CREATE INDEX idx_booking_actions_status ON public.booking_actions(action_status);
CREATE INDEX idx_booking_actions_type ON public.booking_actions(action_type);