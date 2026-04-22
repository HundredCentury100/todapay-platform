
-- Add multi-day support columns to events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS is_multi_day boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS number_of_days integer DEFAULT 1;

-- Event staff table
CREATE TABLE public.event_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_email text,
  name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'volunteer',
  assigned_gate text,
  credential_code text UNIQUE DEFAULT 'STF-' || substr(md5(random()::text), 1, 8),
  status text NOT NULL DEFAULT 'invited',
  checked_in_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers manage own event staff"
ON public.event_staff FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.operator_associations oa ON e.organizer = oa.operator_name
    JOIN public.merchant_profiles mp ON oa.merchant_profile_id = mp.id
    WHERE e.id = event_staff.event_id AND mp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.operator_associations oa ON e.organizer = oa.operator_name
    JOIN public.merchant_profiles mp ON oa.merchant_profile_id = mp.id
    WHERE e.id = event_staff.event_id AND mp.user_id = auth.uid()
  )
);

-- Event sponsors table
CREATE TABLE public.event_sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sponsor_name text NOT NULL,
  logo_url text,
  tier text NOT NULL DEFAULT 'bronze',
  website_url text,
  contact_name text,
  contact_email text,
  contact_phone text,
  placement text[] DEFAULT '{}',
  deliverables jsonb DEFAULT '[]',
  amount_paid numeric DEFAULT 0,
  payment_status text DEFAULT 'pending',
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers manage own event sponsors"
ON public.event_sponsors FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.operator_associations oa ON e.organizer = oa.operator_name
    JOIN public.merchant_profiles mp ON oa.merchant_profile_id = mp.id
    WHERE e.id = event_sponsors.event_id AND mp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.operator_associations oa ON e.organizer = oa.operator_name
    JOIN public.merchant_profiles mp ON oa.merchant_profile_id = mp.id
    WHERE e.id = event_sponsors.event_id AND mp.user_id = auth.uid()
  )
);

-- Event stages table
CREATE TABLE public.event_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  location_within_venue text,
  capacity integer,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers manage own event stages"
ON public.event_stages FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.operator_associations oa ON e.organizer = oa.operator_name
    JOIN public.merchant_profiles mp ON oa.merchant_profile_id = mp.id
    WHERE e.id = event_stages.event_id AND mp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.operator_associations oa ON e.organizer = oa.operator_name
    JOIN public.merchant_profiles mp ON oa.merchant_profile_id = mp.id
    WHERE e.id = event_stages.event_id AND mp.user_id = auth.uid()
  )
);

-- Event schedule items table
CREATE TABLE public.event_schedule_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES public.event_stages(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  performer_name text,
  performer_image text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  day_number integer NOT NULL DEFAULT 1,
  item_type text NOT NULL DEFAULT 'performance',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_schedule_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers manage own schedule items"
ON public.event_schedule_items FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.operator_associations oa ON e.organizer = oa.operator_name
    JOIN public.merchant_profiles mp ON oa.merchant_profile_id = mp.id
    WHERE e.id = event_schedule_items.event_id AND mp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.operator_associations oa ON e.organizer = oa.operator_name
    JOIN public.merchant_profiles mp ON oa.merchant_profile_id = mp.id
    WHERE e.id = event_schedule_items.event_id AND mp.user_id = auth.uid()
  )
);

-- Public read access for schedule items (attendees can view schedules)
CREATE POLICY "Anyone can view schedule items"
ON public.event_schedule_items FOR SELECT
TO anon, authenticated
USING (true);

-- Public read access for stages
CREATE POLICY "Anyone can view stages"
ON public.event_stages FOR SELECT
TO anon, authenticated
USING (true);

-- Public read access for sponsors (shown on event pages)
CREATE POLICY "Anyone can view sponsors"
ON public.event_sponsors FOR SELECT
TO anon, authenticated
USING (status = 'confirmed');

-- Indexes
CREATE INDEX idx_event_staff_event_id ON public.event_staff(event_id);
CREATE INDEX idx_event_sponsors_event_id ON public.event_sponsors(event_id);
CREATE INDEX idx_event_stages_event_id ON public.event_stages(event_id);
CREATE INDEX idx_event_schedule_items_event_id ON public.event_schedule_items(event_id);
CREATE INDEX idx_event_schedule_items_stage_id ON public.event_schedule_items(stage_id);

-- Updated_at triggers
CREATE TRIGGER update_event_staff_updated_at
BEFORE UPDATE ON public.event_staff
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_sponsors_updated_at
BEFORE UPDATE ON public.event_sponsors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_stages_updated_at
BEFORE UPDATE ON public.event_stages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_schedule_items_updated_at
BEFORE UPDATE ON public.event_schedule_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate unique credential codes for staff
CREATE OR REPLACE FUNCTION public.generate_staff_credential_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'STF-';
  i INTEGER;
BEGIN
  IF NEW.credential_code IS NULL THEN
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    NEW.credential_code := result;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_staff_credential_code
BEFORE INSERT ON public.event_staff
FOR EACH ROW EXECUTE FUNCTION public.generate_staff_credential_code();
