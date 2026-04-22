import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Client with user's JWT to get user identity
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    // Admin client for deletions
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Anonymise profile (keep record for tax compliance)
    await adminClient.from('profiles').update({
      full_name: 'Deleted User',
      email: `deleted_${userId.substring(0, 8)}@removed.local`,
      phone: null,
      avatar_url: null,
      address: null,
      date_of_birth: null,
      next_of_kin_name: null,
      next_of_kin_phone: null,
    }).eq('id', userId);

    // 2. Delete wallet (zero balance check)
    const { data: wallet } = await adminClient
      .from('user_wallets')
      .select('id, balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (wallet && wallet.balance > 0) {
      return new Response(JSON.stringify({ 
        error: 'Please withdraw your wallet balance before deleting your account.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Delete notification preferences and tokens
    await adminClient.from('user_notifications').delete().eq('user_id', userId);
    await adminClient.from('user_push_tokens').delete().eq('user_id', userId);

    // 4. Delete consumer analytics
    await adminClient.from('consumer_analytics').delete().eq('user_id', userId);

    // 5. Remove user from auth (cascades profile deletion)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error('Auth deletion failed:', deleteError);
      return new Response(JSON.stringify({ error: 'Account deletion failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 6. Log the deletion for audit
    console.log(`Account deleted: ${userId} at ${new Date().toISOString()}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
