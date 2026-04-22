import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Static fallback rates (USD base)
const FALLBACK_RATES: Record<string, number> = {
  ZAR: 18.5, BWP: 13.5, ZMW: 27, ZWL: 322, NAD: 18.5, SZL: 18.5, LSL: 18.5,
  KES: 129, TZS: 2520, UGX: 3720, RWF: 1290, ETB: 123, MZN: 63.8, MWK: 1730,
  BIF: 2870, SOS: 571, DJF: 177, ERN: 15, SCR: 14.2, MUR: 45.7, KMF: 460, MGA: 4530,
  NGN: 1560, GHS: 15.8, XOF: 614, GMD: 71, GNF: 8600, LRD: 194, SLL: 22700,
  CVE: 103, MRU: 39.5, XAF: 614, CDF: 2830, AOA: 925, STN: 22.9,
  EGP: 49, MAD: 10, TND: 3.1, DZD: 134, LYD: 4.8, SDG: 601, SSP: 1305,
  USD: 1, EUR: 0.92, GBP: 0.79
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { base = 'USD', targets } = await req.json().catch(() => ({ base: 'USD', targets: null }));
    
    // Check for cached rates first
    const { data: cachedRates } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('base_currency', base)
      .gt('expires_at', new Date().toISOString());

    if (cachedRates && cachedRates.length > 0) {
      console.log('Using cached rates');
      const rates: Record<string, { rate: number; source: string; fetchedAt: string }> = {};
      cachedRates.forEach(r => {
        if (!targets || targets.includes(r.target_currency)) {
          rates[r.target_currency] = {
            rate: parseFloat(r.rate),
            source: r.source,
            fetchedAt: r.fetched_at
          };
        }
      });
      return new Response(JSON.stringify({ 
        success: true, 
        base, 
        rates,
        cached: true,
        expiresAt: cachedRates[0].expires_at
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Try to fetch fresh rates from API
    let freshRates: Record<string, number> = {};
    let source = 'fallback';

    try {
      // Using exchangerate-api.com free tier
      const response = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      if (response.ok) {
        const data = await response.json();
        if (data.result === 'success') {
          freshRates = data.rates;
          source = 'api';
          console.log('Fetched fresh rates from API');
        }
      }
    } catch (apiError) {
      console.log('API fetch failed, using fallback rates:', apiError);
    }

    // Fall back to static rates if API fails
    if (Object.keys(freshRates).length === 0) {
      freshRates = FALLBACK_RATES;
      // Adjust for non-USD base
      if (base !== 'USD' && FALLBACK_RATES[base]) {
        const baseRate = FALLBACK_RATES[base];
        Object.keys(freshRates).forEach(currency => {
          freshRates[currency] = freshRates[currency] / baseRate;
        });
      }
    }

    // Cache the rates in database
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    const ratesToInsert = Object.entries(freshRates).map(([currency, rate]) => ({
      base_currency: base,
      target_currency: currency,
      rate: rate,
      source,
      fetched_at: new Date().toISOString(),
      expires_at: expiresAt
    }));

    // Upsert rates
    for (const rateData of ratesToInsert) {
      await supabase
        .from('exchange_rates')
        .upsert(rateData, { onConflict: 'base_currency,target_currency' });
    }

    // Filter to requested targets
    const result: Record<string, { rate: number; source: string; fetchedAt: string }> = {};
    Object.entries(freshRates).forEach(([currency, rate]) => {
      if (!targets || targets.includes(currency)) {
        result[currency] = {
          rate: rate as number,
          source,
          fetchedAt: new Date().toISOString()
        };
      }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      base, 
      rates: result,
      cached: false,
      expiresAt
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Exchange rates error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      rates: FALLBACK_RATES 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
