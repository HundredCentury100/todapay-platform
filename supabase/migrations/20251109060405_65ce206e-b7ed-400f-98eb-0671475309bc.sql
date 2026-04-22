-- Add school-specific fields to events table
ALTER TABLE public.events
ADD COLUMN school_name text,
ADD COLUMN grade_levels text[],
ADD COLUMN school_contact_email text,
ADD COLUMN school_contact_phone text,
ADD COLUMN school_address text,
ADD COLUMN permission_slip_required boolean DEFAULT false,
ADD COLUMN supervision_ratio text,
ADD COLUMN reporting_time text;

-- Add school-specific fields to event_ticket_tiers
ALTER TABLE public.event_ticket_tiers
ADD COLUMN age_restriction text,
ADD COLUMN student_only boolean DEFAULT false,
ADD COLUMN requires_student_id boolean DEFAULT false;

-- Create check_outs table for school check-out tracking
CREATE TABLE public.check_outs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  checked_out_at timestamp with time zone NOT NULL DEFAULT now(),
  picked_up_by text,
  id_verified boolean DEFAULT false,
  relationship_to_student text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on check_outs
ALTER TABLE public.check_outs ENABLE ROW LEVEL SECURITY;

-- RLS policies for check_outs
CREATE POLICY "Users can view check-outs for their bookings"
ON public.check_outs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = check_outs.booking_id
    AND (bookings.user_id = auth.uid() OR auth.uid() IS NULL)
  )
);

CREATE POLICY "Anyone can create check-outs"
ON public.check_outs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update check-outs"
ON public.check_outs
FOR UPDATE
USING (true);

-- Add indexes for performance
CREATE INDEX idx_check_outs_booking_id ON public.check_outs(booking_id);
CREATE INDEX idx_events_school_name ON public.events(school_name);
CREATE INDEX idx_events_grade_levels ON public.events USING GIN(grade_levels);