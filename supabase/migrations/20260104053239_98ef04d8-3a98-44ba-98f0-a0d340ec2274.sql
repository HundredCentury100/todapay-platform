-- Add credits_deducted tracking to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS credits_deducted INTEGER DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS merchant_wallet_id UUID REFERENCES public.credit_wallets(id);

-- Add credits tracking to active_rides for drivers
ALTER TABLE public.active_rides ADD COLUMN IF NOT EXISTS credits_deducted INTEGER DEFAULT 0;
ALTER TABLE public.active_rides ADD COLUMN IF NOT EXISTS driver_wallet_id UUID REFERENCES public.credit_wallets(id);

-- Create index for faster wallet lookups
CREATE INDEX IF NOT EXISTS idx_bookings_merchant_wallet ON public.bookings(merchant_wallet_id);
CREATE INDEX IF NOT EXISTS idx_active_rides_driver_wallet ON public.active_rides(driver_wallet_id);