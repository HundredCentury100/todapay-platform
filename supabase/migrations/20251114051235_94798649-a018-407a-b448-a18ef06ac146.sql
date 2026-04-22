-- Add cash reservation support to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS reservation_type text DEFAULT 'paid' CHECK (reservation_type IN ('paid', 'cash_reserved')),
ADD COLUMN IF NOT EXISTS reservation_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cash_payment_deadline timestamp with time zone;

-- Update seats status to include cash_reserved
-- Note: We'll handle seat status via application logic since modifying enum requires recreation

-- Create index for efficient expiry queries
CREATE INDEX IF NOT EXISTS idx_bookings_reservation_expiry 
ON public.bookings(reservation_expires_at) 
WHERE reservation_type = 'cash_reserved' AND status = 'pending';

-- Create trigger to ensure merchant profiles have proper roles
CREATE OR REPLACE FUNCTION public.set_initial_merchant_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS NULL THEN
    NEW.role := 'bus_operator';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER ensure_merchant_role
  BEFORE INSERT ON public.merchant_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_initial_merchant_role();

-- Add RLS policy for cash reservations
CREATE POLICY "Merchants can view cash reservations"
ON public.bookings
FOR SELECT
USING (
  reservation_type = 'cash_reserved' 
  AND EXISTS (
    SELECT 1 FROM public.merchant_profiles 
    WHERE user_id = auth.uid() 
    AND verification_status = 'verified'
  )
);