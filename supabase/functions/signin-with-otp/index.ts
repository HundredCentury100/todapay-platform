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
  identifier: string; // email or phone
  password: string;
  brand?: string;
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

    // Find the user's email + phone from profiles
    let email: string | null = null;
    let phone: string | null = null;

    if (isEmail) {
      email = identifier.trim().toLowerCase();
      const { data: profile } = await admin
        .from('profiles')
        .select('phone, email')
        .eq('email', email)
        .maybeSingle();
      phone = profile?.phone || null;
    } else {
      // Look up by phone
      const cleanPhone = identifier.replace(/[\s\-]/g, '');
      const { data: profile } = await admin
        .from('profiles')
        .select('phone, email')
        .or(`phone.eq.${cleanPhone},phone.eq.${cleanPhone.replace(/^\+/, '')}`)
        .maybeSingle();
      email = profile?.email || null;
      phone = profile?.phone || cleanPhone;
    }

    if (!email) {
      return new Response(JSON.stringify({ error: 'Account not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!phone) {
      return new Response(JSON.stringify({ error: 'No phone number on file. Please contact support.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate password using anon client (does not affect calling session)
    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: pwErr } = await anon.auth.signInWithPassword({ email, password });
    if (pwErr) {
      return new Response(JSON.stringify({ error: 'Invalid email/phone or password' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Sign out the throwaway session immediately (defensive)
    await anon.auth.signOut();

    // Send OTP via BlueDotSMS
    if (!BLUEDOT_API_ID || !BLUEDOT_API_PASSWORD) {
      return new Response(JSON.stringify({ error: 'SMS service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanPhoneNumber = phone.replace(/[\s\-\+]/g, '');
    const verifyParams = new URLSearchParams({
      api_id: BLUEDOT_API_ID,
      api_password: BLUEDOT_API_PASSWORD,
      brand,
      sender_id: BLUEDOT_SENDER_ID,
      phonenumber: cleanPhoneNumber,
    });

    const response = await fetch(`${BLUEDOT_BASE_URL}/Verify?${verifyParams.toString()}`);
    const data = await response.json();
    console.log('BlueDotSMS Send Response:', data);

    if (data.status !== 'S') {
      return new Response(JSON.stringify({ error: data.remarks || 'Failed to send OTP' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mask phone for display
    const maskedPhone = cleanPhoneNumber.length > 4
      ? `${cleanPhoneNumber.slice(0, 4)}****${cleanPhoneNumber.slice(-2)}`
      : cleanPhoneNumber;

    return new Response(JSON.stringify({
      success: true,
      verificationId: data.verfication_id,
      email, // client uses this to call signInWithPassword after OTP verify
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