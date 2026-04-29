-- Fix booking_type constraint to support all service types
-- The bookings table serves as the base table for all booking types
-- Each service type has its own specialized table (stay_bookings, workspace_bookings, etc.)
-- that references the main bookings table via booking_id foreign key

-- Drop the old constraint that only allowed 'bus' and 'event'
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_booking_type_check;

-- Add new constraint with all booking types supported by the platform
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_booking_type_check
CHECK (booking_type IN (
  'bus',         -- Bus travel bookings
  'event',       -- Event ticket bookings
  'stay',        -- Property/accommodation bookings (references stay_bookings)
  'workspace',   -- Coworking/meeting room bookings (references workspace_bookings)
  'venue',       -- Venue rental bookings (references venue_bookings)
  'experience',  -- Tour/experience bookings (references experience_bookings)
  'car',         -- Car rental bookings (references car_bookings)
  'transfer',    -- Airport/city transfer bookings (references transfer_bookings)
  'flight',      -- Flight bookings (references flight_bookings)
  'corporate'    -- Corporate bookings (references corporate_bookings)
));

-- Add helpful comment explaining the booking type system
COMMENT ON COLUMN public.bookings.booking_type IS
'Type of service being booked. The bookings table is the base table for all booking types.
Each service type may have an additional specialized table (e.g., stay_bookings) that
references this table via booking_id foreign key for service-specific data.';
