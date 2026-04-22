-- Create transfer_requests table (unified booking table for all transfer types)
CREATE TABLE public.transfer_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  merchant_profile_id UUID REFERENCES public.merchant_profiles(id),
  
  -- Booking type and service
  booking_type TEXT NOT NULL DEFAULT 'instant' CHECK (booking_type IN ('instant', 'scheduled')),
  service_type TEXT NOT NULL DEFAULT 'point_to_point' CHECK (service_type IN ('airport_pickup', 'airport_dropoff', 'point_to_point', 'hourly_hire', 'shuttle', 'tour_transfer', 'on_demand_taxi')),
  vehicle_category TEXT NOT NULL DEFAULT 'sedan' CHECK (vehicle_category IN ('economy_sedan', 'sedan', 'suv', 'van', 'minibus', 'luxury_sedan', 'luxury_suv', 'limousine', 'coach')),
  
  -- Locations
  pickup_location TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  dropoff_location TEXT NOT NULL,
  dropoff_lat DOUBLE PRECISION,
  dropoff_lng DOUBLE PRECISION,
  
  -- Scheduling
  scheduled_datetime TIMESTAMP WITH TIME ZONE,
  pickup_datetime TIMESTAMP WITH TIME ZONE,
  
  -- Airport-specific
  flight_number TEXT,
  flight_status TEXT,
  terminal TEXT,
  meet_and_greet BOOLEAN DEFAULT false,
  
  -- Passenger info
  num_passengers INTEGER NOT NULL DEFAULT 1,
  num_luggage INTEGER DEFAULT 0,
  passenger_name TEXT,
  passenger_phone TEXT,
  passenger_email TEXT,
  special_requirements TEXT,
  
  -- Pricing
  distance_km DOUBLE PRECISION,
  duration_minutes INTEGER,
  price_quoted DECIMAL(10,2),
  price_final DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  
  -- Assignment
  assigned_driver_id UUID REFERENCES public.drivers(id),
  assigned_vehicle_id UUID,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'driver_assigned', 'driver_en_route', 'driver_arrived', 'in_progress', 'completed', 'cancelled')),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  driver_assigned_at TIMESTAMP WITH TIME ZONE,
  pickup_time TIMESTAMP WITH TIME ZONE,
  dropoff_time TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Payment
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  payment_method TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transfer_vehicles table (fleet management for transfer providers)
CREATE TABLE public.transfer_vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id),
  
  -- Vehicle details
  vehicle_category TEXT NOT NULL CHECK (vehicle_category IN ('economy_sedan', 'sedan', 'suv', 'van', 'minibus', 'luxury_sedan', 'luxury_suv', 'limousine', 'coach')),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  color TEXT,
  license_plate TEXT NOT NULL,
  
  -- Capacity
  max_passengers INTEGER NOT NULL DEFAULT 4,
  max_luggage INTEGER DEFAULT 3,
  
  -- Features
  amenities TEXT[] DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  is_available BOOLEAN DEFAULT true,
  current_location_lat DOUBLE PRECISION,
  current_location_lng DOUBLE PRECISION,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create zone pricing table for fixed route pricing
CREATE TABLE public.transfer_zone_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  
  from_zone_name TEXT NOT NULL,
  from_zone_type TEXT CHECK (from_zone_type IN ('airport', 'city_center', 'suburb', 'region', 'hotel', 'station')),
  to_zone_name TEXT NOT NULL,
  to_zone_type TEXT CHECK (to_zone_type IN ('airport', 'city_center', 'suburb', 'region', 'hotel', 'station')),
  
  -- Pricing by vehicle category
  economy_sedan_price DECIMAL(10,2),
  sedan_price DECIMAL(10,2),
  suv_price DECIMAL(10,2),
  van_price DECIMAL(10,2),
  minibus_price DECIMAL(10,2),
  luxury_sedan_price DECIMAL(10,2),
  luxury_suv_price DECIMAL(10,2),
  limousine_price DECIMAL(10,2),
  coach_price DECIMAL(10,2),
  
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(merchant_profile_id, from_zone_name, to_zone_name)
);

-- Enable RLS
ALTER TABLE public.transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_zone_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transfer_requests
CREATE POLICY "Users can view their own transfer requests"
  ON public.transfer_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create transfer requests"
  ON public.transfer_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending requests"
  ON public.transfer_requests FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'confirmed'));

CREATE POLICY "Merchants can view requests for their services"
  ON public.transfer_requests FOR SELECT
  USING (merchant_profile_id IN (
    SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Merchants can update their assigned requests"
  ON public.transfer_requests FOR UPDATE
  USING (merchant_profile_id IN (
    SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Drivers can view their assigned requests"
  ON public.transfer_requests FOR SELECT
  USING (assigned_driver_id IN (
    SELECT id FROM public.drivers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Drivers can update their assigned requests"
  ON public.transfer_requests FOR UPDATE
  USING (assigned_driver_id IN (
    SELECT id FROM public.drivers WHERE user_id = auth.uid()
  ));

-- RLS Policies for transfer_vehicles
CREATE POLICY "Public can view active vehicles"
  ON public.transfer_vehicles FOR SELECT
  USING (status = 'active');

CREATE POLICY "Merchants can manage their vehicles"
  ON public.transfer_vehicles FOR ALL
  USING (merchant_profile_id IN (
    SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
  ));

-- RLS Policies for transfer_zone_pricing
CREATE POLICY "Public can view active zone pricing"
  ON public.transfer_zone_pricing FOR SELECT
  USING (is_active = true);

CREATE POLICY "Merchants can manage their zone pricing"
  ON public.transfer_zone_pricing FOR ALL
  USING (merchant_profile_id IN (
    SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX idx_transfer_requests_user ON public.transfer_requests(user_id);
CREATE INDEX idx_transfer_requests_merchant ON public.transfer_requests(merchant_profile_id);
CREATE INDEX idx_transfer_requests_driver ON public.transfer_requests(assigned_driver_id);
CREATE INDEX idx_transfer_requests_status ON public.transfer_requests(status);
CREATE INDEX idx_transfer_requests_scheduled ON public.transfer_requests(scheduled_datetime) WHERE booking_type = 'scheduled';
CREATE INDEX idx_transfer_vehicles_merchant ON public.transfer_vehicles(merchant_profile_id);
CREATE INDEX idx_transfer_vehicles_category ON public.transfer_vehicles(vehicle_category);
CREATE INDEX idx_transfer_zone_pricing_merchant ON public.transfer_zone_pricing(merchant_profile_id);

-- Add updated_at triggers
CREATE TRIGGER update_transfer_requests_updated_at
  BEFORE UPDATE ON public.transfer_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transfer_vehicles_updated_at
  BEFORE UPDATE ON public.transfer_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transfer_zone_pricing_updated_at
  BEFORE UPDATE ON public.transfer_zone_pricing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for transfer_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.transfer_requests;