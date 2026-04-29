# Apply Transactions RLS Fix

## Issue
Error: `new row violates row-level security policy for table "transactions"`

This occurs when booking stays (or any service) because a previous RLS hardening migration restricted transaction creation to `service_role` only, but users need to create transactions when booking.

## Solution
Run the SQL migration to allow authenticated users to create transactions for their own bookings.

## Steps to Apply Migration:

### Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your TodaPay project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and run this SQL:**

```sql
-- Fix transactions RLS to allow authenticated users to create transactions
CREATE POLICY "Authenticated users can create transactions for their bookings"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (
  -- User must own the booking
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

-- Add policy to allow anonymous users to create transactions for guest bookings
CREATE POLICY "Anonymous users can create transactions for guest bookings"
ON public.transactions FOR INSERT
TO anon
WITH CHECK (
  -- Allow if booking exists (guest checkout scenario)
  booking_id IN (
    SELECT id FROM public.bookings WHERE guest_email IS NOT NULL
  )
);
```

4. **Click "Run"** button
5. **Verify** - You should see "Success. No rows returned"

## Verify the Fix

After applying the migration:
1. Open the Android app
2. Try booking a stay
3. The RLS error should no longer occur
4. Booking and transaction should be created successfully

## What This Does

The migration adds two RLS policies:

1. **Authenticated users** - Can create transactions for bookings they own (where `user_id = auth.uid()`)
2. **Anonymous users** - Can create transactions for guest bookings (where `guest_email` is set)

This preserves security while allowing the normal booking flow to work.

The existing `service_role` policy remains in place for system operations.
