
-- Drop credit-related tables (cascade will handle FK dependencies)
DROP TABLE IF EXISTS public.credit_purchase_requests CASCADE;
DROP TABLE IF EXISTS public.credit_transactions CASCADE;
DROP TABLE IF EXISTS public.credit_wallets CASCADE;
DROP TABLE IF EXISTS public.credit_packs CASCADE;
DROP TABLE IF EXISTS public.credit_rates CASCADE;

-- Drop credit-related functions
DROP FUNCTION IF EXISTS public.add_purchased_credits(uuid, uuid, text, text);
DROP FUNCTION IF EXISTS public.deduct_booking_credits(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.get_or_create_wallet(uuid, uuid);

-- Remove credit columns from bookings table
ALTER TABLE public.bookings DROP COLUMN IF EXISTS credits_deducted;
ALTER TABLE public.bookings DROP COLUMN IF EXISTS merchant_wallet_id;

-- Remove credit columns from active_rides table
ALTER TABLE public.active_rides DROP COLUMN IF EXISTS credits_deducted;
ALTER TABLE public.active_rides DROP COLUMN IF EXISTS driver_wallet_id;
