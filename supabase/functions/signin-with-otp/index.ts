import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const BLUEDOT_API_ID = Deno.env.get('BLUEDOT_API_ID') || '';
const BLUEDOT_API_PASSWORD = Deno.env.get('BLUEDOT_API_PASSWORD') || '';
const BLUEDOT_SENDER_ID = Deno.env.get('BLUEDOT_SENDER_ID') || 'TODA';
const BLUEDOT_BASE_URL = 'https://rest.bluedotsms.com/api';

interface Body {
  identifier: string;
  password: string;
  brand?: string;
}

function generate6DigitCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] % 1_000_000).toString().padStart(6, '0');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { identifier, password, brand = 'TodaPay' }: Body = await req.json();

    if (!identifier || !password) {
      return new Response(JSON.stringify({ error: 'Identifier and password are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isEmail = identifier.includes('@');
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let email: string | null = null;
    let phone: string | null = null;

    // Step 1: Look up the account by email or phone
    if (isEmail) {
      email = identifier.trim().toLowerCase();
      const { data: profile } = await admin
        .from('profiles')
        .select('phone, email')
        .eq('email', email)
        .maybeSingle();

      if (!profile) {
        return new Response(JSON.stringify({
          error: 'No account found with this email. Please sign up first.'
        }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      phone = profile.phone || null;
    } else {
      // Clean phone: remove spaces and dashes, but keep the + if present
      const cleanPhone = identifier.replace(/[\s\-]/g, '');
      // Also prepare version without + prefix
      const phoneWithoutPlus = cleanPhone.replace(/^\+/, '');
      // And version with + prefix
      const phoneWithPlus = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

      const { data: profile } = await admin
        .from('profiles')
        .select('phone, email')
        .or(`phone.eq.${cleanPhone},phone.eq.${phoneWithoutPlus},phone.eq.${phoneWithPlus}`)
        .maybeSingle();

      if (!profile) {
        return new Response(JSON.stringify({
          error: 'No account found with this phone number. Please sign up first.'
        }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      email = profile.email || null;
      phone = profile.phone || cleanPhone;
    }

    // Step 2: Ensure account has both email and phone
    if (!email) {
      return new Response(JSON.stringify({
        error: 'Account setup incomplete. Please contact support.'
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!phone) {
      return new Response(JSON.stringify({
        error: 'No phone number registered with your account. Please update your profile or contact support.'
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Validate password
    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: pwErr } = await anon.auth.signInWithPassword({ email, password });
    if (pwErr) {
      // Check if it's an invalid credentials error or something else
      if (pwErr.message?.includes('Invalid login credentials')) {
        return new Response(JSON.stringify({
          error: 'Incorrect password. Please try again or reset your password.'
        }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else if (pwErr.message?.includes('Email not confirmed')) {
        return new Response(JSON.stringify({
          error: 'Please verify your email address before signing in.'
        }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({
          error: pwErr.message || 'Authentication failed. Please try again.'
        }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    await anon.auth.signOut();

    // Step 4: Check SMS service configuration
    if (!BLUEDOT_API_ID || !BLUEDOT_API_PASSWORD) {
      return new Response(JSON.stringify({
        error: 'SMS verification is temporarily unavailable. Please try again later or contact support.'
      }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanPhoneNumber = phone.replace(/[\s\-\+]/g, '');
    const code = generate6DigitCode();

    // Step 5: Store OTP code in database
    const { error: insertErr } = await admin.from('sms_otp_codes').insert({
      phone: cleanPhoneNumber,
      code,
      purpose: 'signin',
      email,
    });
    if (insertErr) {
      console.error('Failed to store OTP:', insertErr);
      return new Response(JSON.stringify({
        error: 'Unable to generate verification code. Please try again in a moment.'
      }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 6: Send SMS via BlueDotSMS
    const message = `Your ${brand} sign-in code is ${code}. Expires in 10 minutes. Do not share this code.`;
    const sendParams = new URLSearchParams({
      api_id: BLUEDOT_API_ID,
      api_password: BLUEDOT_API_PASSWORD,
      sms_type: 'T',
      encoding: 'T',
      sender_id: BLUEDOT_SENDER_ID,
      phonenumber: cleanPhoneNumber,
      textmessage: message,
    });

    const response = await fetch(`${BLUEDOT_BASE_URL}/SendSMS?${sendParams.toString()}`);
    const data = await response.json();
    console.log('BlueDotSMS SendSMS Response:', data);

    if (data.status !== 'S') {
      const errorMsg = data.remarks || 'Failed to send SMS';
      console.error('BlueDotSMS error:', errorMsg);
      return new Response(JSON.stringify({
        error: `Unable to send verification code: ${errorMsg}. Please check your phone number or try again later.`
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const maskedPhone = cleanPhoneNumber.length > 4
      ? `${cleanPhoneNumber.slice(0, 4)}****${cleanPhoneNumber.slice(-2)}`
      : cleanPhoneNumber;

    return new Response(JSON.stringify({
      success: true,
      verificationId: data.message_id || 0,
      email,
      phone: cleanPhoneNumber,
      maskedPhone,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('signin-with-otp error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
