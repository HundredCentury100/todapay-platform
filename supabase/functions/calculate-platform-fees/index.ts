import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { merchantProfileId, bookingAmount, bookingId } = await req.json();

    if (!merchantProfileId || bookingAmount === undefined) {
      return new Response(
        JSON.stringify({ error: 'merchantProfileId and bookingAmount are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const amount = Number(bookingAmount);
    const feePercentage = 10;
    const feeAmount = Math.round(amount * 0.10 * 100) / 100;
    const merchantAmount = Math.round((amount - feeAmount) * 100) / 100;
    const serviceFee = Math.floor(amount / 50); // $1 per $50

    return new Response(
      JSON.stringify({
        feePercentage,
        feeAmount,
        merchantAmount,
        serviceFee,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
