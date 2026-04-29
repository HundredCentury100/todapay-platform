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
      const code = generate6DigitCode();

      // Store code in DB (10-min expiry handled by default)
      const { error: insertErr } = await admin.from('sms_otp_codes').insert({
        phone,
        code,
        purpose,
      });
      if (insertErr) {
        console.error('Failed to store OTP:', insertErr);
        return new Response(JSON.stringify({ error: 'Failed to issue code' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Send via BlueDotSMS SendSMS API
      const message = `Your ${brand} verification code is ${code}. Expires in 10 minutes. Do not share this code.`;
      const sendParams = new URLSearchParams({
        api_id: BLUEDOT_API_ID,
        api_password: BLUEDOT_API_PASSWORD,
        sms_type: 'T',
        encoding: 'T',
        sender_id: BLUEDOT_SENDER_ID,
        phonenumber: phone,
        textmessage: message,
      });

      const response = await fetch(`${BLUEDOT_BASE_URL}/SendSMS?${sendParams.toString()}`);
      const data = await response.json();
      console.log('BlueDotSMS SendSMS Response:', data);

      if (data.status !== 'S') {
        return new Response(JSON.stringify({
          success: false,
          error: data.remarks || 'Failed to send SMS',
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({
        success: true,
        // Kept for backwards compat with client code; no longer used
        verificationId: data.message_id || 0,
        message: 'Code sent',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'verify') {
      if (!verificationCode) {
        return new Response(JSON.stringify({ error: 'Verification code is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get latest unverified, unexpired code for this phone
      const { data: rows, error: fetchErr } = await admin
        .from('sms_otp_codes')
        .select('id, code, attempts, expires_at, verified')
        .eq('phone', phone)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchErr) {
        console.error('Lookup error:', fetchErr);
        return new Response(JSON.stringify({ error: 'Verification failed' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const row = rows?.[0];
      if (!row) {
        return new Response(JSON.stringify({
          success: false, verified: false,
          error: 'Code expired or not found. Please request a new code.',
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (row.attempts >= 5) {
        return new Response(JSON.stringify({
          success: false, verified: false,
          error: 'Too many attempts. Please request a new code.',
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (row.code !== verificationCode.trim()) {
        await admin.from('sms_otp_codes').update({ attempts: row.attempts + 1 }).eq('id', row.id);
        return new Response(JSON.stringify({
          success: false, verified: false,
          error: 'Invalid verification code',
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      await admin.from('sms_otp_codes').update({ verified: true }).eq('id', row.id);

      return new Response(JSON.stringify({
        success: true, verified: true, message: 'Phone number verified successfully',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
