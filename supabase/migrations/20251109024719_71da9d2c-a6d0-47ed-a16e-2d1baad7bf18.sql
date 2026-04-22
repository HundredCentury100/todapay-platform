-- Create profiles table for authenticated users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  phone text,
  passport_number text,
  whatsapp_number text,
  next_of_kin_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- RLS Policies for profiles
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create trigger for profiles
create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Function to generate unique booking reference
create or replace function generate_booking_reference()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;
  return result;
end;
$$;

-- Create bookings table (supports both guest and authenticated bookings)
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  
  -- Guest identification
  guest_email text not null,
  
  -- Booking type and reference
  booking_type text not null check (booking_type in ('bus', 'event')),
  item_id text not null,
  item_name text not null,
  
  -- Passenger details
  passenger_name text not null,
  passenger_email text not null,
  passenger_phone text not null,
  passport_number text,
  next_of_kin_number text,
  whatsapp_number text,
  
  -- Bus-specific fields
  operator text,
  from_location text,
  to_location text,
  departure_time text,
  arrival_time text,
  travel_date date,
  selected_seats text[],
  final_destination_city text,
  is_return_ticket boolean default false,
  return_date date,
  number_of_adults integer default 1,
  number_of_children integer default 0,
  number_of_bags integer default 0,
  luggage_weight numeric(5,2),
  
  -- Event-specific fields
  ticket_quantity integer,
  event_date date,
  event_time text,
  event_venue text,
  
  -- Pricing
  base_price numeric(10,2) not null,
  total_price numeric(10,2) not null,
  group_discount numeric(10,2) default 0,
  
  -- Booking status
  status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_status text not null default 'paid' check (payment_status in ('pending', 'paid', 'refunded')),
  ticket_number text unique not null,
  
  -- Booking reference for guest retrieval
  booking_reference text unique not null default generate_booking_reference(),
  
  -- Additional data stored as JSONB
  seat_preferences jsonb,
  flexi_options jsonb,
  selected_meals jsonb,
  special_assistance jsonb,
  pet_travel jsonb,
  additional_passengers jsonb,
  
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  booking_timestamp timestamptz default now()
);

-- Indexes for better query performance
create index idx_bookings_user_id on public.bookings(user_id) where user_id is not null;
create index idx_bookings_guest_email on public.bookings(guest_email);
create index idx_bookings_booking_reference on public.bookings(booking_reference);
create index idx_bookings_status on public.bookings(status);
create index idx_bookings_booking_type on public.bookings(booking_type);
create index idx_bookings_travel_date on public.bookings(travel_date);
create index idx_bookings_created_at on public.bookings(created_at desc);

-- Enable RLS on bookings
alter table public.bookings enable row level security;

-- RLS Policies for bookings
-- Authenticated users can view their own bookings
create policy "Users can view own bookings"
  on public.bookings for select
  to authenticated
  using (auth.uid() = user_id);

-- Public can view bookings (we validate email + reference in app layer)
create policy "Anyone can view bookings"
  on public.bookings for select
  to anon
  using (true);

-- Anyone can create bookings (guest checkout)
create policy "Anyone can create bookings"
  on public.bookings for insert
  to anon, authenticated
  with check (true);

-- Only authenticated users can update their own bookings
create policy "Users can update own bookings"
  on public.bookings for update
  to authenticated
  using (auth.uid() = user_id);

-- Trigger for automatic timestamp updates on bookings
create trigger on_bookings_updated
  before update on public.bookings
  for each row execute procedure public.handle_updated_at();