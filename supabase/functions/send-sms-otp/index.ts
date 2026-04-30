import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const BLUEDOT_API_ID = Deno.env.get('BLUEDOT_API_ID') || '';
const BLUEDOT_API_PASSWORD = Deno.env.get('BLUEDOT_API_PASSWORD') || '';
const BLUEDOT_SENDER_ID = Deno.env.get('BLUEDOT_SENDER_ID') || 'TODA';
const BLUEDOT_BASE_URL = 'https://rest.bluedotsms.com/api';

interface Body {
  action: 'send' | 'verify';
  phoneNumber: string;
  brand?: string;
  // For verify
  verificationCode?: string;
  purpose?: string; // 'signup' | 'signin'
  // Legacy field (ignored — kept for backwards compatibility)
  verificationId?: number;
}

function generate6DigitCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] % 1_000_000).toString().padStart(6, '0');
}

function cleanPhone(p: string): string {
  return p.replace(/[\s\-\+]/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body: Body = await req.json();
    const { action, phoneNumber, brand = 'TodaPay', purpose = 'signup', verificationCode } = body;

    if (!BLUEDOT_API_ID || !BLUEDOT_API_PASSWORD) {
      return new Response(JSON.stringify({ error: 'SMS service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!phoneNumber) {
      return new Response(JSON.stringify({ error: 'Phone number is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const phone = cleanPhone(phoneNumber);
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (action === 'send') {
      // Use BlueDotSMS Verify API (sends 4-digit code automatically)
      const verifyParams = new URLSearchParams({
        api_id: BLUEDOT_API_ID,
        api_password: BLUEDOT_API_PASSWORD,
        brand: brand,
        phonenumber: phone,
        sender_id: BLUEDOT_SENDER_ID,
      });

      const response = await fetch(`${BLUEDOT_BASE_URL}/Verify?${verifyParams.toString()}`);
      const data = await response.json();
      console.log('BlueDotSMS Verify Response:', data);

      if (data.status !== 'S') {
        return new Response(JSON.stringify({
          success: false,
          error: data.remarks || 'Failed to send OTP',
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({
        success: true,
        verificationId: data.verfication_id || 0,
        message: 'Code sent',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'verify') {
      const { verificationId } = body;

      if (!verificationId || !verificationCode) {
        return new Response(JSON.stringify({ error: 'Verification ID and code are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Verifying OTP:', { verificationId, verificationCode });

      // Use BlueDotSMS VerifyStatus API
      const verifyStatusParams = new URLSearchParams({
        verfication_id: verificationId.toString(),
        verfication_code: verificationCode,
      });

      const response = await fetch(`${BLUEDOT_BASE_URL}/VerifyStatus?${verifyStatusParams.toString()}`);
      const data = await response.json();
      console.log('BlueDotSMS VerifyStatus Response:', data);

      if (data.status === 'V') {
        return new Response(JSON.stringify({
          success: true,
          verified: true,
          message: 'Phone number verified successfully',
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } else {
        return new Response(JSON.stringify({
          success: false,
          verified: false,
          error: data.remarks || 'Invalid verification code',
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use "send" or "verify"' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('SMS OTP Error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
