-- =============================================
-- PHASE 1 & 2: Enhanced Ride Features Tables
-- =============================================

-- 1. Saved Locations (Home, Work, Favorites)
CREATE TABLE public.saved_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Other', -- 'Home', 'Work', 'Other'
  address TEXT NOT NULL,
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  icon TEXT DEFAULT 'map-pin',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own saved locations"
  ON public.saved_locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved locations"
  ON public.saved_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved locations"
  ON public.saved_locations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved locations"
  ON public.saved_locations FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Scheduled Rides
CREATE TABLE public.scheduled_rides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pickup_address TEXT NOT NULL,
  pickup_lat NUMERIC(10, 7) NOT NULL,
  pickup_lng NUMERIC(10, 7) NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_lat NUMERIC(10, 7) NOT NULL,
  dropoff_lng NUMERIC(10, 7) NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  vehicle_type TEXT DEFAULT 'any',
  pricing_mode TEXT DEFAULT 'fixed',
  notes TEXT,
  status TEXT DEFAULT 'scheduled', -- scheduled, activated, completed, cancelled
  ride_request_id UUID REFERENCES public.ride_requests(id),
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_rides ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own scheduled rides"
  ON public.scheduled_rides FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled rides"
  ON public.scheduled_rides FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled rides"
  ON public.scheduled_rides FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled rides"
  ON public.scheduled_rides FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Ride Messages (In-App Chat)
CREATE TABLE public.ride_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.active_rides(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL, -- 'passenger' or 'driver'
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- text, quick_reply, location
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ride_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Ride participants can view messages"
  ON public.ride_messages FOR SELECT
  USING (
    ride_id IN (
      SELECT id FROM public.active_rides 
      WHERE passenger_id = auth.uid()
      OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Ride participants can send messages"
  ON public.ride_messages FOR INSERT
  WITH CHECK (
    ride_id IN (
      SELECT id FROM public.active_rides 
      WHERE passenger_id = auth.uid()
      OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    )
  );

-- 4. Emergency Contacts
CREATE TABLE public.emergency_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  is_primary BOOLEAN DEFAULT false,
  notify_on_ride BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own emergency contacts"
  ON public.emergency_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own emergency contacts"
  ON public.emergency_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emergency contacts"
  ON public.emergency_contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emergency contacts"
  ON public.emergency_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Ride Receipts
CREATE TABLE public.ride_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.active_rides(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL UNIQUE,
  passenger_name TEXT NOT NULL,
  passenger_email TEXT,
  driver_name TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  pickup_time TIMESTAMP WITH TIME ZONE,
  dropoff_time TIMESTAMP WITH TIME ZONE,
  distance_km NUMERIC(10, 2),
  duration_mins INTEGER,
  base_fare NUMERIC(10, 2) NOT NULL,
  distance_fare NUMERIC(10, 2) NOT NULL,
  time_fare NUMERIC(10, 2) NOT NULL,
  surge_amount NUMERIC(10, 2) DEFAULT 0,
  tip_amount NUMERIC(10, 2) DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ride_receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their ride receipts"
  ON public.ride_receipts FOR SELECT
  USING (
    ride_id IN (
      SELECT id FROM public.active_rides WHERE passenger_id = auth.uid()
    )
  );

CREATE POLICY "System can create receipts"
  ON public.ride_receipts FOR INSERT
  WITH CHECK (true);

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  result TEXT := 'RCP-';
BEGIN
  result := result || TO_CHAR(NOW(), 'YYYYMMDD') || '-';
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-generate receipt number
CREATE OR REPLACE FUNCTION public.set_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.receipt_number IS NULL THEN
    NEW.receipt_number := public.generate_receipt_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER tr_set_receipt_number
  BEFORE INSERT ON public.ride_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_receipt_number();

-- 6. Add payment_method and payment_status to active_rides if not exists
-- (These might already exist, adding conditionally)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'active_rides' 
    AND column_name = 'payment_completed_at'
  ) THEN
    ALTER TABLE public.active_rides ADD COLUMN payment_completed_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'active_rides' 
    AND column_name = 'wallet_transaction_id'
  ) THEN
    ALTER TABLE public.active_rides ADD COLUMN wallet_transaction_id UUID;
  END IF;
END $$;

-- Enable realtime for ride messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_messages;

-- Function to deduct from user wallet for ride payment
CREATE OR REPLACE FUNCTION public.pay_ride_with_wallet(
  p_ride_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ride RECORD;
  v_wallet RECORD;
  v_transaction RECORD;
  v_new_balance NUMERIC;
BEGIN
  -- Get ride details
  SELECT * INTO v_ride FROM public.active_rides WHERE id = p_ride_id;
  
  IF v_ride IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ride not found');
  END IF;
  
  IF v_ride.payment_status = 'paid' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ride already paid');
  END IF;
  
  -- Get user wallet
  SELECT * INTO v_wallet FROM public.user_wallets WHERE user_id = p_user_id FOR UPDATE;
  
  IF v_wallet IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  
  IF v_wallet.balance < v_ride.final_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance', 'required', v_ride.final_price, 'available', v_wallet.balance);
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_wallet.balance - v_ride.final_price;
  
  -- Update wallet
  UPDATE public.user_wallets
  SET balance = v_new_balance,
      lifetime_spent = lifetime_spent + v_ride.final_price,
      updated_at = now()
  WHERE id = v_wallet.id;
  
  -- Create transaction
  INSERT INTO public.user_wallet_transactions (
    wallet_id, transaction_type, amount, balance_before, balance_after, description
  ) VALUES (
    v_wallet.id, 'payment', -v_ride.final_price, v_wallet.balance, v_new_balance,
    'Ride payment'
  ) RETURNING * INTO v_transaction;
  
  -- Update ride payment status
  UPDATE public.active_rides
  SET payment_status = 'paid',
      payment_method = 'wallet',
      payment_completed_at = now(),
      wallet_transaction_id = v_transaction.id
  WHERE id = p_ride_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'amount_paid', v_ride.final_price,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction.id
  );
END;
$$;