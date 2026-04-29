ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_booking_type_check;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_booking_type_check
CHECK (booking_type IN (
  'bus',
  'event',
  'stay',
  'workspace',
  'venue',
  'experience',
  'car',
  'transfer',
  'flight',
  'corporate'
));

COMMENT ON COLUMN public.bookings.booking_type IS
'Type of service being booked. The bookings table is the base table for all booking types. Each service type may have an additional specialized table (e.g., stay_bookings) that references this table via booking_id foreign key for service-specific data.';