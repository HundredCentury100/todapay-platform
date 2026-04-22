-- Phase 1: Global Super-App Foundation Schema

-- ============================================
-- 1. Expand merchant_role enum with new roles
-- ============================================
ALTER TYPE merchant_role ADD VALUE IF NOT EXISTS 'property_owner';
ALTER TYPE merchant_role ADD VALUE IF NOT EXISTS 'car_rental_company';
ALTER TYPE merchant_role ADD VALUE IF NOT EXISTS 'transfer_provider';
ALTER TYPE merchant_role ADD VALUE IF NOT EXISTS 'workspace_provider';
ALTER TYPE merchant_role ADD VALUE IF NOT EXISTS 'experience_host';
ALTER TYPE merchant_role ADD VALUE IF NOT EXISTS 'airline_partner';

-- ============================================
-- 2. Properties (Stays/Hotels/Lodges)
-- ============================================
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  property_type TEXT NOT NULL CHECK (property_type IN ('hotel', 'lodge', 'apartment', 'villa', 'hostel', 'guesthouse', 'resort', 'cottage', 'cabin', 'boutique_hotel')),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  star_rating INTEGER CHECK (star_rating BETWEEN 1 AND 5),
  amenities TEXT[] DEFAULT '{}',
  policies JSONB DEFAULT '{}',
  images JSONB DEFAULT '[]',
  check_in_time TEXT DEFAULT '14:00',
  check_out_time TEXT DEFAULT '11:00',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  room_type TEXT NOT NULL CHECK (room_type IN ('single', 'double', 'twin', 'suite', 'family', 'dormitory', 'studio', 'penthouse')),
  max_guests INTEGER NOT NULL DEFAULT 2,
  bed_configuration JSONB DEFAULT '{}',
  size_sqm DECIMAL(8, 2),
  amenities TEXT[] DEFAULT '{}',
  base_price DECIMAL(12, 2) NOT NULL,
  images JSONB DEFAULT '[]',
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.room_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available_units INTEGER NOT NULL,
  price_override DECIMAL(12, 2),
  min_stay INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, date)
);

CREATE TABLE public.stay_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id),
  room_id UUID NOT NULL REFERENCES public.rooms(id),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  num_guests INTEGER NOT NULL DEFAULT 1,
  num_rooms INTEGER NOT NULL DEFAULT 1,
  special_requests TEXT,
  guest_details JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 3. Vehicles (Car Rentals)
-- ============================================
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('economy', 'compact', 'midsize', 'fullsize', 'suv', 'luxury', 'van', 'pickup', 'convertible', 'electric')),
  transmission TEXT NOT NULL CHECK (transmission IN ('automatic', 'manual')),
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid')),
  seats INTEGER NOT NULL DEFAULT 5,
  doors INTEGER NOT NULL DEFAULT 4,
  luggage_capacity INTEGER DEFAULT 2,
  features TEXT[] DEFAULT '{}',
  images JSONB DEFAULT '[]',
  daily_rate DECIMAL(12, 2) NOT NULL,
  weekly_rate DECIMAL(12, 2),
  monthly_rate DECIMAL(12, 2),
  deposit_amount DECIMAL(12, 2),
  mileage_limit INTEGER,
  extra_mileage_rate DECIMAL(8, 2),
  min_driver_age INTEGER DEFAULT 21,
  pickup_locations JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.vehicle_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  price_override DECIMAL(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.car_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  pickup_datetime TIMESTAMPTZ NOT NULL,
  dropoff_datetime TIMESTAMPTZ NOT NULL,
  driver_details JSONB NOT NULL,
  add_ons JSONB DEFAULT '[]',
  insurance_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 4. Transfers (Airport Pickups, Taxi)
-- ============================================
CREATE TABLE public.transfer_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('airport_pickup', 'airport_dropoff', 'point_to_point', 'hourly_hire', 'shuttle', 'tour_transfer')),
  vehicle_type TEXT NOT NULL,
  max_passengers INTEGER NOT NULL DEFAULT 4,
  max_luggage INTEGER DEFAULT 2,
  base_price DECIMAL(12, 2) NOT NULL,
  price_per_km DECIMAL(8, 2),
  service_areas JSONB DEFAULT '[]',
  amenities TEXT[] DEFAULT '{}',
  images JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.transfer_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  zone_name TEXT NOT NULL,
  zone_type TEXT NOT NULL CHECK (zone_type IN ('airport', 'city_center', 'suburb', 'region')),
  coordinates JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.transfer_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transfer_service_id UUID NOT NULL REFERENCES public.transfer_services(id) ON DELETE CASCADE,
  from_zone_id UUID REFERENCES public.transfer_zones(id),
  to_zone_id UUID REFERENCES public.transfer_zones(id),
  fixed_price DECIMAL(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(transfer_service_id, from_zone_id, to_zone_id)
);

CREATE TABLE public.transfer_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  transfer_service_id UUID NOT NULL REFERENCES public.transfer_services(id),
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  pickup_datetime TIMESTAMPTZ NOT NULL,
  flight_number TEXT,
  num_passengers INTEGER NOT NULL DEFAULT 1,
  num_luggage INTEGER DEFAULT 1,
  special_requirements TEXT,
  meet_and_greet BOOLEAN DEFAULT false,
  driver_assigned UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 5. Workspaces (Remote Work, Co-working)
-- ============================================
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  workspace_type TEXT NOT NULL CHECK (workspace_type IN ('hot_desk', 'dedicated_desk', 'private_office', 'meeting_room', 'conference_room', 'virtual_office', 'event_space', 'podcast_studio', 'photo_studio')),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  capacity INTEGER NOT NULL DEFAULT 1,
  amenities TEXT[] DEFAULT '{}',
  images JSONB DEFAULT '[]',
  hourly_rate DECIMAL(12, 2),
  daily_rate DECIMAL(12, 2),
  weekly_rate DECIMAL(12, 2),
  monthly_rate DECIMAL(12, 2),
  operating_hours JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.workspace_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN NOT NULL DEFAULT true,
  price_override DECIMAL(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.workspace_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  booking_type TEXT NOT NULL CHECK (booking_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  num_attendees INTEGER DEFAULT 1,
  equipment_requested JSONB DEFAULT '[]',
  catering_requested JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 6. Event Space Rentals (Venues)
-- ============================================
CREATE TABLE public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  venue_type TEXT NOT NULL CHECK (venue_type IN ('conference_center', 'banquet_hall', 'rooftop', 'garden', 'beach', 'warehouse', 'restaurant', 'hotel_ballroom', 'theater', 'museum', 'gallery', 'studio', 'outdoor')),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  capacity_standing INTEGER,
  capacity_seated INTEGER,
  capacity_theater INTEGER,
  capacity_banquet INTEGER,
  size_sqm DECIMAL(10, 2),
  amenities TEXT[] DEFAULT '{}',
  catering_options JSONB DEFAULT '[]',
  equipment_available JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  hourly_rate DECIMAL(12, 2),
  half_day_rate DECIMAL(12, 2),
  full_day_rate DECIMAL(12, 2),
  min_hours INTEGER DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.venue_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id),
  event_type TEXT NOT NULL,
  event_name TEXT,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  expected_guests INTEGER,
  setup_requirements TEXT,
  catering_selection JSONB DEFAULT '[]',
  equipment_selection JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 7. Experiences (Tours, Activities)
-- ============================================
CREATE TABLE public.experiences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  experience_type TEXT NOT NULL CHECK (experience_type IN ('tour', 'adventure', 'food_drink', 'wellness', 'cultural', 'nature', 'water_sports', 'aerial', 'workshop', 'nightlife', 'photography', 'volunteer')),
  duration_hours DECIMAL(5, 2) NOT NULL,
  location TEXT NOT NULL,
  meeting_point TEXT,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  max_participants INTEGER NOT NULL DEFAULT 10,
  min_participants INTEGER DEFAULT 1,
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'moderate', 'challenging', 'expert')),
  age_restriction TEXT,
  what_included TEXT[] DEFAULT '{}',
  what_to_bring TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{English}',
  images JSONB DEFAULT '[]',
  price_per_person DECIMAL(12, 2) NOT NULL,
  private_group_price DECIMAL(12, 2),
  cancellation_policy TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.experience_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  available_spots INTEGER NOT NULL,
  price_override DECIMAL(12, 2),
  guide_assigned TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(experience_id, date, start_time)
);

CREATE TABLE public.experience_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES public.experiences(id),
  schedule_id UUID REFERENCES public.experience_schedules(id),
  num_participants INTEGER NOT NULL DEFAULT 1,
  participant_details JSONB DEFAULT '[]',
  is_private BOOLEAN DEFAULT false,
  special_requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 8. Flights (Meta-search references)
-- ============================================
CREATE TABLE public.flight_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  origin_code TEXT NOT NULL,
  destination_code TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE,
  passengers JSONB NOT NULL DEFAULT '{"adults": 1, "children": 0, "infants": 0}',
  cabin_class TEXT DEFAULT 'economy' CHECK (cabin_class IN ('economy', 'premium_economy', 'business', 'first')),
  search_results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.flight_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  external_booking_ref TEXT,
  provider TEXT NOT NULL,
  origin_code TEXT NOT NULL,
  destination_code TEXT NOT NULL,
  departure_datetime TIMESTAMPTZ NOT NULL,
  arrival_datetime TIMESTAMPTZ NOT NULL,
  airline_code TEXT,
  flight_number TEXT,
  cabin_class TEXT,
  passengers JSONB NOT NULL,
  segments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 9. Update bookings table for new verticals
-- ============================================
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vertical TEXT DEFAULT 'bus';

-- ============================================
-- 10. Enable RLS on all new tables
-- ============================================
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stay_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_bookings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 11. RLS Policies - Public read for listings
-- ============================================
CREATE POLICY "Anyone can view active properties" ON public.properties FOR SELECT USING (status = 'active');
CREATE POLICY "Anyone can view active rooms" ON public.rooms FOR SELECT USING (status = 'active');
CREATE POLICY "Anyone can view room availability" ON public.room_availability FOR SELECT USING (true);
CREATE POLICY "Anyone can view active vehicles" ON public.vehicles FOR SELECT USING (status = 'active');
CREATE POLICY "Anyone can view vehicle availability" ON public.vehicle_availability FOR SELECT USING (true);
CREATE POLICY "Anyone can view active transfer services" ON public.transfer_services FOR SELECT USING (status = 'active');
CREATE POLICY "Anyone can view transfer zones" ON public.transfer_zones FOR SELECT USING (true);
CREATE POLICY "Anyone can view transfer pricing" ON public.transfer_pricing FOR SELECT USING (true);
CREATE POLICY "Anyone can view active workspaces" ON public.workspaces FOR SELECT USING (status = 'active');
CREATE POLICY "Anyone can view workspace availability" ON public.workspace_availability FOR SELECT USING (true);
CREATE POLICY "Anyone can view active venues" ON public.venues FOR SELECT USING (status = 'active');
CREATE POLICY "Anyone can view active experiences" ON public.experiences FOR SELECT USING (status = 'active');
CREATE POLICY "Anyone can view experience schedules" ON public.experience_schedules FOR SELECT USING (true);

-- ============================================
-- 12. RLS Policies - Merchant management
-- ============================================
CREATE POLICY "Merchants can manage own properties" ON public.properties FOR ALL 
  USING (merchant_profile_id IN (SELECT id FROM merchant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Merchants can manage own rooms" ON public.rooms FOR ALL 
  USING (property_id IN (SELECT id FROM properties WHERE merchant_profile_id IN (SELECT id FROM merchant_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Merchants can manage room availability" ON public.room_availability FOR ALL 
  USING (room_id IN (SELECT r.id FROM rooms r JOIN properties p ON r.property_id = p.id WHERE p.merchant_profile_id IN (SELECT id FROM merchant_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Merchants can manage own vehicles" ON public.vehicles FOR ALL 
  USING (merchant_profile_id IN (SELECT id FROM merchant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Merchants can manage vehicle availability" ON public.vehicle_availability FOR ALL 
  USING (vehicle_id IN (SELECT id FROM vehicles WHERE merchant_profile_id IN (SELECT id FROM merchant_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Merchants can manage own transfer services" ON public.transfer_services FOR ALL 
  USING (merchant_profile_id IN (SELECT id FROM merchant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Merchants can manage own transfer zones" ON public.transfer_zones FOR ALL 
  USING (merchant_profile_id IN (SELECT id FROM merchant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Merchants can manage transfer pricing" ON public.transfer_pricing FOR ALL 
  USING (transfer_service_id IN (SELECT id FROM transfer_services WHERE merchant_profile_id IN (SELECT id FROM merchant_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Merchants can manage own workspaces" ON public.workspaces FOR ALL 
  USING (merchant_profile_id IN (SELECT id FROM merchant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Merchants can manage workspace availability" ON public.workspace_availability FOR ALL 
  USING (workspace_id IN (SELECT id FROM workspaces WHERE merchant_profile_id IN (SELECT id FROM merchant_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Merchants can manage own venues" ON public.venues FOR ALL 
  USING (merchant_profile_id IN (SELECT id FROM merchant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Merchants can manage own experiences" ON public.experiences FOR ALL 
  USING (merchant_profile_id IN (SELECT id FROM merchant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Merchants can manage experience schedules" ON public.experience_schedules FOR ALL 
  USING (experience_id IN (SELECT id FROM experiences WHERE merchant_profile_id IN (SELECT id FROM merchant_profiles WHERE user_id = auth.uid())));

-- ============================================
-- 13. RLS Policies - Booking access
-- ============================================
CREATE POLICY "Users can view own stay bookings" ON public.stay_bookings FOR SELECT 
  USING (booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()));
CREATE POLICY "Users can create stay bookings" ON public.stay_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own car bookings" ON public.car_bookings FOR SELECT 
  USING (booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()));
CREATE POLICY "Users can create car bookings" ON public.car_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own transfer bookings" ON public.transfer_bookings FOR SELECT 
  USING (booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()));
CREATE POLICY "Users can create transfer bookings" ON public.transfer_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own workspace bookings" ON public.workspace_bookings FOR SELECT 
  USING (booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()));
CREATE POLICY "Users can create workspace bookings" ON public.workspace_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own venue bookings" ON public.venue_bookings FOR SELECT 
  USING (booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()));
CREATE POLICY "Users can create venue bookings" ON public.venue_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own experience bookings" ON public.experience_bookings FOR SELECT 
  USING (booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()));
CREATE POLICY "Users can create experience bookings" ON public.experience_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own flight searches" ON public.flight_searches FOR SELECT 
  USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Users can create flight searches" ON public.flight_searches FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own flight bookings" ON public.flight_bookings FOR SELECT 
  USING (booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()));
CREATE POLICY "Users can create flight bookings" ON public.flight_bookings FOR INSERT WITH CHECK (true);

-- ============================================
-- 14. Update generate_merchant_account_number for new roles
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_merchant_account_number()
RETURNS TRIGGER AS $$
DECLARE
  v_role_code text;
  v_seq_num integer;
  v_country text;
BEGIN
  v_country := COALESCE(NEW.country_code, 'ZA');
  
  CASE NEW.role
    WHEN 'bus_operator' THEN v_role_code := 'B';
    WHEN 'event_organizer' THEN v_role_code := 'E';
    WHEN 'travel_agent' THEN v_role_code := 'A';
    WHEN 'booking_agent' THEN v_role_code := 'A';
    WHEN 'property_owner' THEN v_role_code := 'P';
    WHEN 'car_rental_company' THEN v_role_code := 'C';
    WHEN 'transfer_provider' THEN v_role_code := 'T';
    WHEN 'workspace_provider' THEN v_role_code := 'W';
    WHEN 'experience_host' THEN v_role_code := 'X';
    WHEN 'airline_partner' THEN v_role_code := 'F';
    ELSE v_role_code := 'M';
  END CASE;
  
  INSERT INTO merchant_account_sequences (country_code, role_code, last_sequence)
  VALUES (v_country, v_role_code, 1)
  ON CONFLICT (country_code, role_code)
  DO UPDATE SET 
    last_sequence = merchant_account_sequences.last_sequence + 1,
    updated_at = now()
  RETURNING last_sequence INTO v_seq_num;
  
  NEW.account_number := v_country || '-' || v_role_code || '-' || LPAD(v_seq_num::text, 5, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 15. Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_country ON public.properties(country);
CREATE INDEX IF NOT EXISTS idx_rooms_property ON public.rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_city ON public.vehicles((pickup_locations));
CREATE INDEX IF NOT EXISTS idx_workspaces_city ON public.workspaces(city);
CREATE INDEX IF NOT EXISTS idx_venues_city ON public.venues(city);
CREATE INDEX IF NOT EXISTS idx_experiences_city ON public.experiences(city);
CREATE INDEX IF NOT EXISTS idx_experiences_type ON public.experiences(experience_type);