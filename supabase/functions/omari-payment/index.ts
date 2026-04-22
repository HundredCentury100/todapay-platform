import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function timedFetch(url: string, options: RequestInit, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
    }
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OMARI_API_KEY = Deno.env.get('OMARI_API_KEY');
    const OMARI_API_URL = Deno.env.get('OMARI_API_URL') || 'https://omari.v.co.zw/vsuite/omari/api/merchant/api/payment';

    if (!OMARI_API_KEY) {
      throw new Error('OMARI_API_KEY not configured');
    }

    const { action, ...params } = await req.json();

    switch (action) {
      // Step 1: POST /auth — initiate payment, get OTP reference
      case 'auth': {
        const { msisdn, amount, currency, reference } = params;

        if (!msisdn || !amount || !reference) {
          return new Response(
            JSON.stringify({ error: true, message: 'Missing required fields: msisdn, amount, reference' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let formattedPhone = msisdn.replace(/\s+/g, '').replace(/^0/, '263').replace(/^\+/, '');
        if (!formattedPhone.startsWith('263')) {
          formattedPhone = '263' + formattedPhone;
        }

        console.log(`O'mari AUTH: phone=${formattedPhone}, amount=${amount}, currency=${currency || 'USD'}, ref=${reference}`);

        const response = await timedFetch(`${OMARI_API_URL}/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Merchant-Key': OMARI_API_KEY,
          },
          body: JSON.stringify({
            msisdn: formattedPhone,
            reference,
            amount: parseFloat(amount),
            currency: currency || 'USD',
            channel: 'WEB',
          }),
        });

        const responseText = await response.text();
        console.log(`O'mari AUTH response: ${response.status}, body: ${responseText}`);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { error: true, message: responseText, rawResponse: responseText };
        }

        return new Response(
          JSON.stringify({
            success: !data.error,
            otpReference: data.otpReference || null,
            message: data.message || '',
            responseCode: data.responseCode || null,
            data,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Step 2: POST /request — submit OTP to complete payment
      case 'request': {
        const { msisdn, reference, otp } = params;

        if (!msisdn || !reference || !otp) {
          return new Response(
            JSON.stringify({ error: true, message: 'Missing required fields: msisdn, reference, otp' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let formattedPhone = msisdn.replace(/\s+/g, '').replace(/^0/, '263').replace(/^\+/, '');
        if (!formattedPhone.startsWith('263')) {
          formattedPhone = '263' + formattedPhone;
        }

        console.log(`O'mari REQUEST: phone=${formattedPhone}, ref=${reference}, otp=${otp}`);

        const response = await timedFetch(`${OMARI_API_URL}/request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Merchant-Key': OMARI_API_KEY,
          },
          body: JSON.stringify({
            msisdn: formattedPhone,
            reference,
            otp,
          }),
        });

        const responseText = await response.text();
        console.log(`O'mari REQUEST response: ${response.status}, body: ${responseText}`);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { error: true, message: responseText, rawResponse: responseText };
        }

        const isSuccess = !data.error && data.responseCode === '000';

        return new Response(
          JSON.stringify({
            success: isSuccess,
            paymentReference: data.paymentReference || null,
            debitReference: data.debitReference || null,
            message: data.message || '',
            responseCode: data.responseCode || null,
            data,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Step 3: GET /query/{reference} — check transaction status
      case 'query': {
        const { reference } = params;

        if (!reference) {
          return new Response(
            JSON.stringify({ error: true, message: 'Missing required field: reference' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`O'mari QUERY: ref=${reference}`);

        const response = await timedFetch(`${OMARI_API_URL}/query/${reference}`, {
          method: 'GET',
          headers: {
            'X-Merchant-Key': OMARI_API_KEY,
          },
        });

        const responseText = await response.text();
        console.log(`O'mari QUERY response: ${response.status}, body: ${responseText}`);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { error: true, message: responseText, rawResponse: responseText };
        }

        const isPaid = !data.error && 
          (data.status === 'Success' || data.responseCode === '000') && 
          !!data.paymentReference;

        return new Response(
          JSON.stringify({
            success: !data.error,
            isPaid,
            paymentReference: data.paymentReference || null,
            debitReference: data.debitReference || null,
            amount: data.amount || null,
            currency: data.currency || null,
            message: data.message || '',
            data,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Step 4: POST /void — void/refund a transaction
      case 'void': {
        const { reference } = params;

        if (!reference) {
          return new Response(
            JSON.stringify({ error: true, message: 'Missing required field: reference' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`O'mari VOID: ref=${reference}`);

        const response = await timedFetch(`${OMARI_API_URL}/void`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Merchant-Key': OMARI_API_KEY,
          },
          body: JSON.stringify({ reference }),
        });

        const responseText = await response.text();
        console.log(`O'mari VOID response: ${response.status}, body: ${responseText}`);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { error: true, message: responseText, rawResponse: responseText };
        }

        return new Response(
          JSON.stringify({
            success: !data.error,
            message: data.message || '',
            data,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: true, message: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('O\'mari payment error:', error);
    return new Response(
      JSON.stringify({ error: true, message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});