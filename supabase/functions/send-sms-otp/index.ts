import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// BlueDotSMS credentials from environment
const BLUEDOT_API_ID = Deno.env.get('BLUEDOT_API_ID') || '';
const BLUEDOT_API_PASSWORD = Deno.env.get('BLUEDOT_API_PASSWORD') || '';
const BLUEDOT_SENDER_ID = Deno.env.get('BLUEDOT_SENDER_ID') || 'TodaPay';
const BLUEDOT_BASE_URL = 'https://rest.bluedotsms.com/api';

interface VerifyRequest {
  action: 'send' | 'verify';
  phoneNumber: string;
  brand?: string;
  verificationId?: number;
  verificationCode?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: VerifyRequest = await req.json();
    const { action, phoneNumber, brand = 'TodaPay', verificationId, verificationCode } = body;

    // Validate credentials
    if (!BLUEDOT_API_ID || !BLUEDOT_API_PASSWORD) {
      throw new Error('BlueDotSMS credentials not configured');
    }

    if (action === 'send') {
      // Send OTP via BlueDotSMS Verify API
      if (!phoneNumber) {
        return new Response(
          JSON.stringify({ error: 'Phone number is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Format phone number (remove spaces, dashes, +)
      const cleanPhoneNumber = phoneNumber.replace(/[\s\-\+]/g, '');

      console.log('Sending OTP to:', cleanPhoneNumber);

      const verifyUrl = `${BLUEDOT_BASE_URL}/Verify`;
      const verifyParams = new URLSearchParams({
        api_id: BLUEDOT_API_ID,
        api_password: BLUEDOT_API_PASSWORD,
        brand: brand,
        phonenumber: cleanPhoneNumber,
        sender_id: BLUEDOT_SENDER_ID,
      });

      const response = await fetch(`${verifyUrl}?${verifyParams.toString()}`, {
        method: 'GET',
      });

      const data = await response.json();
      console.log('BlueDotSMS Verify Response:', data);

      if (data.status === 'S') {
        return new Response(
          JSON.stringify({
            success: true,
            verificationId: data.verfication_id,
            message: data.remarks,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            error: data.remarks || 'Failed to send OTP',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (action === 'verify') {
      // Verify OTP code
      if (!verificationId || !verificationCode) {
        return new Response(
          JSON.stringify({ error: 'Verification ID and code are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Verifying OTP:', { verificationId, verificationCode });

      const verifyStatusUrl = `${BLUEDOT_BASE_URL}/VerifyStatus`;
      const verifyStatusParams = new URLSearchParams({
        verfication_id: verificationId.toString(),
        verfication_code: verificationCode,
      });

      const response = await fetch(`${verifyStatusUrl}?${verifyStatusParams.toString()}`, {
        method: 'GET',
      });

      const data = await response.json();
      console.log('BlueDotSMS VerifyStatus Response:', data);

      if (data.status === 'V') {
        return new Response(
          JSON.stringify({
            success: true,
            verified: true,
            message: 'Phone number verified successfully',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            verified: false,
            error: data.remarks || 'Invalid verification code',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "send" or "verify"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('SMS OTP Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
