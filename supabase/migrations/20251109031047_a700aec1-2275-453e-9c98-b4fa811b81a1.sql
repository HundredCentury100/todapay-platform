-- Create buses table
CREATE TABLE public.buses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator text NOT NULL,
  type text NOT NULL CHECK (type IN ('national', 'crossborder')),
  amenities text[] DEFAULT '{}',
  image text,
  total_seats integer NOT NULL DEFAULT 40,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create bus_schedules table
CREATE TABLE public.bus_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id uuid REFERENCES public.buses(id) ON DELETE CASCADE NOT NULL,
  from_location text NOT NULL,
  to_location text NOT NULL,
  departure_time text NOT NULL,
  arrival_time text NOT NULL,
  duration text NOT NULL,
  base_price numeric NOT NULL,
  available_date date NOT NULL,
  stops text[] DEFAULT '{}',
  pickup_address text,
  dropoff_address text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create seats table
CREATE TABLE public.seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_schedule_id uuid REFERENCES public.bus_schedules(id) ON DELETE CASCADE NOT NULL,
  seat_number text NOT NULL,
  seat_row integer NOT NULL,
  seat_column integer NOT NULL,
  type text NOT NULL CHECK (type IN ('regular', 'premium')),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'selected')),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(bus_schedule_id, seat_number)
);

-- Enable RLS
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for buses
CREATE POLICY "Anyone can view buses"
ON public.buses
FOR SELECT
USING (true);

-- RLS Policies for bus_schedules
CREATE POLICY "Anyone can view bus schedules"
ON public.bus_schedules
FOR SELECT
USING (true);

-- RLS Policies for seats
CREATE POLICY "Anyone can view seats"
ON public.seats
FOR SELECT
USING (true);

CREATE POLICY "System can update seats"
ON public.seats
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX idx_bus_schedules_route ON public.bus_schedules(from_location, to_location, available_date);
CREATE INDEX idx_bus_schedules_bus_id ON public.bus_schedules(bus_id);
CREATE INDEX idx_seats_schedule_id ON public.seats(bus_schedule_id);
CREATE INDEX idx_seats_status ON public.seats(status);

-- Create function to update timestamps
CREATE TRIGGER update_buses_updated_at
BEFORE UPDATE ON public.buses
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_bus_schedules_updated_at
BEFORE UPDATE ON public.bus_schedules
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_seats_updated_at
BEFORE UPDATE ON public.seats
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();