import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SurgePricingRequest {
  pickup_lat: number;
  pickup_lng: number;
  radius_km?: number;
}

interface SurgePricingResponse {
  surge_multiplier: number;
  surge_reason: string | null;
  active_drivers: number;
  active_requests: number;
  is_peak_hour: boolean;
  is_weekend: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { pickup_lat, pickup_lng, radius_km = 5 }: SurgePricingRequest = await req.json();

    // Get current time info
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    // Define peak hours (7-9am and 5-7pm)
    const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isLateNight = hour >= 22 || hour <= 5;

    // Get active online drivers in the area
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('id, current_lat, current_lng')
      .eq('is_online', true)
      .eq('is_available', true)
      .eq('status', 'active');

    if (driversError) throw driversError;

    // Filter drivers within radius using Haversine formula
    const nearbyDrivers = (drivers || []).filter(driver => {
      if (!driver.current_lat || !driver.current_lng) return false;
      const distance = calculateDistance(
        pickup_lat, 
        pickup_lng, 
        driver.current_lat, 
        driver.current_lng
      );
      return distance <= radius_km;
    });

    // Get active ride requests in the area (pending/searching)
    const { data: requests, error: requestsError } = await supabase
      .from('ride_requests')
      .select('id, pickup_lat, pickup_lng')
      .in('status', ['searching', 'bidding'])
      .gte('expires_at', now.toISOString());

    if (requestsError) throw requestsError;

    // Filter requests within radius
    const nearbyRequests = (requests || []).filter(req => {
      const distance = calculateDistance(
        pickup_lat, 
        pickup_lng, 
        req.pickup_lat, 
        req.pickup_lng
      );
      return distance <= radius_km * 2; // Wider search for demand
    });

    const activeDrivers = nearbyDrivers.length;
    const activeRequests = nearbyRequests.length;

    // Calculate surge multiplier based on supply/demand
    let surgeMultiplier = 1.0;
    let surgeReason: string | null = null;

    // Supply/Demand ratio
    if (activeDrivers === 0) {
      surgeMultiplier = 2.5;
      surgeReason = 'No drivers available in your area';
    } else if (activeRequests > activeDrivers * 2) {
      // High demand: more than 2 requests per driver
      const demandRatio = activeRequests / activeDrivers;
      surgeMultiplier = Math.min(1 + (demandRatio - 1) * 0.3, 2.5);
      surgeReason = 'High demand in your area';
    } else if (activeDrivers < 3 && activeRequests > 0) {
      surgeMultiplier = 1.3;
      surgeReason = 'Limited drivers available';
    }

    // Time-based adjustments
    if (isPeakHour) {
      surgeMultiplier = Math.max(surgeMultiplier, 1.2);
      surgeMultiplier = Math.min(surgeMultiplier * 1.15, 2.5);
      if (!surgeReason) surgeReason = 'Peak hour pricing';
    }

    if (isLateNight) {
      surgeMultiplier = Math.max(surgeMultiplier, 1.3);
      surgeMultiplier = Math.min(surgeMultiplier * 1.2, 2.5);
      if (!surgeReason) surgeReason = 'Late night pricing';
    }

    // Weekend adjustment (slight increase for weekend nights)
    if (isWeekend && (hour >= 20 || hour <= 2)) {
      surgeMultiplier = Math.min(surgeMultiplier * 1.1, 2.5);
      if (!surgeReason) surgeReason = 'Weekend night pricing';
    }

    // Round to 1 decimal
    surgeMultiplier = Math.round(surgeMultiplier * 10) / 10;

    // If no surge, clear reason
    if (surgeMultiplier <= 1.0) {
      surgeMultiplier = 1.0;
      surgeReason = null;
    }

    const response: SurgePricingResponse = {
      surge_multiplier: surgeMultiplier,
      surge_reason: surgeReason,
      active_drivers: activeDrivers,
      active_requests: activeRequests,
      is_peak_hour: isPeakHour,
      is_weekend: isWeekend,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Surge pricing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Return default pricing on error
    return new Response(JSON.stringify({ 
      surge_multiplier: 1.0,
      surge_reason: null,
      active_drivers: 0,
      active_requests: 0,
      is_peak_hour: false,
      is_weekend: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
