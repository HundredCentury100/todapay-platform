
-- Add pricing fields to drivers table for transfer pricing
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS base_fare numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_per_km numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS minimum_fare numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_types text[] DEFAULT ARRAY['point_to_point', 'on_demand_taxi']::text[],
  ADD COLUMN IF NOT EXISTS service_areas jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS fixed_routes jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS payout_details jsonb;

-- fixed_routes schema: [{ name: "Airport to CBD", price: 25, from: "Airport", to: "CBD" }]
-- service_areas schema: [{ city: "Harare", country: "Zimbabwe" }]
