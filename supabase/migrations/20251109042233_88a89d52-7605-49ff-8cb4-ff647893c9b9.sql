-- Add check-in tracking to bookings table
ALTER TABLE public.bookings
ADD COLUMN checked_in BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN checked_in_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN qr_code_data TEXT;

-- Create index for faster QR code lookups
CREATE INDEX idx_bookings_qr_code ON public.bookings(qr_code_data) WHERE qr_code_data IS NOT NULL;

-- Create check-in logs table
CREATE TABLE public.check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  checked_in_by TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for check_ins
CREATE POLICY "Anyone can create check-ins"
  ON public.check_ins FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view check-ins for their bookings"
  ON public.check_ins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = check_ins.booking_id
      AND (bookings.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

-- Create index for check-ins
CREATE INDEX idx_check_ins_booking_id ON public.check_ins(booking_id);

-- Create trigger for check-ins
CREATE TRIGGER update_check_ins_created_at
  BEFORE INSERT ON public.check_ins
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();