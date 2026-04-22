import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Universal Commerce Protocol - machine-readable catalog for AI agents
const UCP_VERSION = "1.0.0";

const VERTICAL_SCHEMAS = {
  buses: {
    table: "bus_schedules",
    join: "buses!bus_schedules_bus_id_fkey(operator, type, amenities, total_seats)",
    searchable_fields: ["from_location", "to_location", "available_date"],
    bookable: true,
    pricing_model: "fixed",
    required_fields: ["passenger_name", "passenger_email", "passenger_phone", "travel_date"],
  },
  events: {
    table: "events",
    join: null,
    searchable_fields: ["title", "category", "city", "event_date"],
    bookable: true,
    pricing_model: "tiered",
    required_fields: ["passenger_name", "passenger_email", "ticket_quantity"],
  },
  stays: {
    table: "properties",
    join: "rooms(id, name, price_per_night, max_guests)",
    searchable_fields: ["name", "city", "property_type"],
    bookable: true,
    pricing_model: "per_night",
    required_fields: ["passenger_name", "passenger_email", "check_in_date", "check_out_date"],
  },
  experiences: {
    table: "experiences",
    join: "experience_schedules(id, start_date, start_time, available_spots)",
    searchable_fields: ["title", "category", "city"],
    bookable: true,
    pricing_model: "per_person",
    required_fields: ["passenger_name", "passenger_email", "number_of_guests", "schedule_id"],
  },
  venues: {
    table: "venues",
    join: null,
    searchable_fields: ["name", "city", "venue_type"],
    bookable: true,
    pricing_model: "quote_based",
    required_fields: ["contact_name", "contact_email", "event_date", "guest_count"],
  },
  workspaces: {
    table: "workspaces",
    join: "workspace_availability(id, date, start_time, end_time, is_available)",
    searchable_fields: ["name", "city", "workspace_type"],
    bookable: true,
    pricing_model: "hourly_daily",
    required_fields: ["passenger_name", "passenger_email", "date", "duration"],
  },
  transfers: {
    table: "transfer_services",
    join: null,
    searchable_fields: ["name", "service_type", "coverage_area"],
    bookable: true,
    pricing_model: "distance_based",
    required_fields: ["passenger_name", "passenger_email", "pickup_location", "dropoff_location", "date"],
  },
  car_rentals: {
    table: "vehicles",
    join: "vehicle_availability(id, date, is_available)",
    searchable_fields: ["make", "model", "vehicle_type", "city"],
    bookable: true,
    pricing_model: "per_day",
    required_fields: ["driver_name", "driver_email", "pickup_date", "return_date", "license_number"],
  },
  flights: {
    table: "flight_searches",
    join: null,
    searchable_fields: ["origin", "destination", "departure_date"],
    bookable: false,
    pricing_model: "dynamic",
    required_fields: [],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  // Routes: GET / -> catalog manifest, GET /:vertical -> vertical inventory, POST /:vertical/search -> filtered search

  try {
    if (req.method === "GET" && pathParts.length <= 1) {
      // Return UCP manifest
      return new Response(
        JSON.stringify({
          protocol: "Universal Commerce Protocol",
          version: UCP_VERSION,
          platform: "Suvat",
          base_url: `${SUPABASE_URL}/functions/v1/universal-commerce-protocol`,
          verticals: Object.entries(VERTICAL_SCHEMAS).map(([key, schema]) => ({
            id: key,
            endpoint: `/${key}`,
            search_endpoint: `/${key}/search`,
            bookable: schema.bookable,
            pricing_model: schema.pricing_model,
            searchable_fields: schema.searchable_fields,
            required_booking_fields: schema.required_fields,
          })),
          capabilities: [
            "inventory_search",
            "real_time_availability",
            "price_calculation",
            "hold_reservation",
            "booking_creation",
            "bundle_discounts",
            "multi_currency",
          ],
          supported_currencies: ["USD", "ZWG"],
          payment_methods: ["wallet", "ecocash", "innbucks", "onemoney", "card"],
          a2a_endpoint: `${SUPABASE_URL}/functions/v1/a2a-protocol`,
          authentication: {
            type: "api_key",
            header: "x-agent-api-key",
            registration: `${SUPABASE_URL}/functions/v1/a2a-protocol/register`,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get vertical from path
    const vertical = pathParts[pathParts.length - 1] === "search" 
      ? pathParts[pathParts.length - 2] 
      : pathParts[pathParts.length - 1];
    
    const schema = VERTICAL_SCHEMAS[vertical as keyof typeof VERTICAL_SCHEMAS];
    if (!schema) {
      return new Response(
        JSON.stringify({ error: "Unknown vertical", available: Object.keys(VERTICAL_SCHEMAS) }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle search
    if (req.method === "POST") {
      const filters = await req.json();
      let query = supabase.from(schema.table).select(schema.join ? `*, ${schema.join}` : "*").limit(filters.limit || 20);

      // Apply filters dynamically
      for (const field of schema.searchable_fields) {
        if (filters[field]) {
          if (field.includes("date")) {
            query = query.eq(field, filters[field]);
          } else {
            query = query.ilike(field, `%${filters[field]}%`);
          }
        }
      }

      if (filters.price_max) query = query.lte("base_price", filters.price_max);
      if (filters.price_min) query = query.gte("base_price", filters.price_min);

      const { data, error } = await query;
      if (error) throw error;

      return new Response(
        JSON.stringify({
          vertical,
          results: data || [],
          total: data?.length || 0,
          schema: {
            pricing_model: schema.pricing_model,
            required_booking_fields: schema.required_fields,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET - return all items for vertical
    const selectClause = schema.join ? `*, ${schema.join}` : "*";
    const { data, error } = await supabase.from(schema.table).select(selectClause).limit(50);
    if (error) throw error;

    return new Response(
      JSON.stringify({
        vertical,
        items: data || [],
        total: data?.length || 0,
        bookable: schema.bookable,
        pricing_model: schema.pricing_model,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("UCP error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
