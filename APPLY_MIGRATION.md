# Apply Database Migration

## Issue
Error: `new row for relation "bookings" violates check constraint "bookings_booking_type_check"`

This occurs when booking stays because the constraint only allowed 'bus' and 'event' booking types.

## Solution
Run the SQL migration to allow all booking types.

## Steps to Apply Migration:

### Option 1: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and run this SQL:**

```sql
-- Fix booking_type constraint to support all service types
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
```

4. **Click "Run"** button
5. **Verify** - You should see "Success. No rows returned"

### Option 2: Via Supabase CLI

If you have Supabase CLI installed:

```bash
cd d:\TodaP\todapay-platform-main
supabase db push
```

## Verify the Fix

After applying the migration:
1. Open the Android app
2. Try booking a stay
3. The error should no longer occur

## What This Does

The migration expands the `booking_type` check constraint to allow:
- `bus` - Bus travel bookings
- `event` - Event ticket bookings
- `stay` - Accommodation bookings
- `workspace` - Coworking/meeting room bookings
- `venue` - Venue rental bookings
- `experience` - Tour/experience bookings
- `car` - Car rental bookings
- `transfer` - Airport/city transfer bookings
- `flight` - Flight bookings
- `corporate` - Corporate bookings

This aligns with the database architecture where specialized booking tables (stay_bookings, workspace_bookings, etc.) reference the main bookings table.
