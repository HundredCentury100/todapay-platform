-- Create event_addons table for merchandise, upgrades, packages
CREATE TABLE IF NOT EXISTS public.event_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  type text NOT NULL, -- 'merchandise', 'upgrade', 'service', 'package'
  price numeric NOT NULL,
  available_quantity integer,
  image text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create booking_addons junction table
CREATE TABLE IF NOT EXISTS public.booking_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  addon_id uuid REFERENCES public.event_addons(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price_at_booking numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create group_bookings table
CREATE TABLE IF NOT EXISTS public.group_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_name text NOT NULL,
  coordinator_email text NOT NULL,
  coordinator_phone text NOT NULL,
  group_name text,
  total_tickets integer NOT NULL,
  discount_percentage numeric DEFAULT 0,
  split_payment boolean DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create payment_plans table
CREATE TABLE IF NOT EXISTS public.payment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  total_amount numeric NOT NULL,
  installments integer NOT NULL,
  amount_per_installment numeric NOT NULL,
  next_payment_date date NOT NULL,
  payments_completed integer DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create event_pricing_tiers table for early bird/last-minute pricing
CREATE TABLE IF NOT EXISTS public.event_pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  tier_name text NOT NULL, -- 'early_bird', 'regular', 'last_minute'
  discount_percentage numeric NOT NULL,
  valid_from timestamp with time zone NOT NULL,
  valid_until timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Add new columns to bookings table
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS group_booking_id uuid REFERENCES public.group_bookings(id),
  ADD COLUMN IF NOT EXISTS payment_plan_id uuid REFERENCES public.payment_plans(id),
  ADD COLUMN IF NOT EXISTS discount_code text,
  ADD COLUMN IF NOT EXISTS event_category text,
  ADD COLUMN IF NOT EXISTS category_specific_data jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS accessibility_needs jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ticket_upgrade_from text;

-- Enable RLS on new tables
ALTER TABLE public.event_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_pricing_tiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_addons
CREATE POLICY "Anyone can view event addons"
  ON public.event_addons FOR SELECT
  USING (true);

-- RLS Policies for booking_addons
CREATE POLICY "Anyone can view booking addons"
  ON public.booking_addons FOR SELECT
  USING (true);

CREATE POLICY "Users can create booking addons"
  ON public.booking_addons FOR INSERT
  WITH CHECK (true);

-- RLS Policies for group_bookings
CREATE POLICY "Anyone can create group bookings"
  ON public.group_bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Coordinators can view their group bookings"
  ON public.group_bookings FOR SELECT
  USING (true);

CREATE POLICY "Coordinators can update their group bookings"
  ON public.group_bookings FOR UPDATE
  USING (true);

-- RLS Policies for payment_plans
CREATE POLICY "Users can view their payment plans"
  ON public.payment_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = payment_plans.booking_id
      AND (bookings.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

CREATE POLICY "Users can create payment plans"
  ON public.payment_plans FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their payment plans"
  ON public.payment_plans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = payment_plans.booking_id
      AND (bookings.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

-- RLS Policies for event_pricing_tiers
CREATE POLICY "Anyone can view pricing tiers"
  ON public.event_pricing_tiers FOR SELECT
  USING (true);

-- Create updated_at trigger for new tables
CREATE TRIGGER update_event_addons_updated_at
  BEFORE UPDATE ON public.event_addons
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_group_bookings_updated_at
  BEFORE UPDATE ON public.group_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_payment_plans_updated_at
  BEFORE UPDATE ON public.payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();