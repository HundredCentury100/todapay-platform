import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TierConfig {
  tier: 'standard' | 'silver' | 'gold' | 'platinum';
  minBookings: number;
  multiplier: number;
}

const TIER_CONFIGS: TierConfig[] = [
  { tier: 'platinum', minBookings: 500, multiplier: 1.8 },
  { tier: 'gold', minBookings: 200, multiplier: 1.5 },
  { tier: 'silver', minBookings: 50, multiplier: 1.2 },
  { tier: 'standard', minBookings: 0, multiplier: 1.0 },
];

// External agents are capped at Gold tier
const EXTERNAL_MAX_TIER = 'gold';
const TIER_ORDER = ['standard', 'silver', 'gold', 'platinum'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cronSecret = Deno.env.get('CRON_SECRET');
    const authHeader = req.headers.get('authorization');
    
    if (cronSecret) {
      const providedSecret = authHeader?.replace('Bearer ', '');
      if (providedSecret !== cronSecret) {
        console.error('Unauthorized cron job attempt');
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
    } else {
      console.warn('CRON_SECRET not configured - function is publicly accessible');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting agent tier update process...');

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get all agents (travel_agent and booking_agent roles)
    const { data: agents, error: agentsError } = await supabase
      .from('merchant_profiles')
      .select('id, business_name, agent_tier, agent_type, role')
      .in('role', ['travel_agent', 'booking_agent'])
      .eq('verification_status', 'verified');

    if (agentsError) {
      throw new Error(`Failed to fetch agents: ${agentsError.message}`);
    }

    console.log(`Found ${agents?.length || 0} verified agents`);

    const updates = [];

    for (const agent of agents || []) {
      // Count bookings for this agent in the current month
      const { count, error: countError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('booked_by_agent_id', agent.id)
        .gte('created_at', startOfMonth.toISOString());

      if (countError) {
        console.error(`Error counting bookings for agent ${agent.id}:`, countError);
        continue;
      }

      const bookingCount = count || 0;

      // Determine new tier based on booking count
      let newTierConfig = TIER_CONFIGS.find(
        config => bookingCount >= config.minBookings
      ) || TIER_CONFIGS[TIER_CONFIGS.length - 1];

      // Cap external agents at Gold tier
      const isExternal = agent.agent_type === 'external' || agent.role === 'booking_agent';
      if (isExternal) {
        const maxIndex = TIER_ORDER.indexOf(EXTERNAL_MAX_TIER);
        const currentIndex = TIER_ORDER.indexOf(newTierConfig.tier);
        if (currentIndex > maxIndex) {
          newTierConfig = TIER_CONFIGS.find(c => c.tier === EXTERNAL_MAX_TIER)!;
          console.log(`External agent ${agent.business_name} capped at ${EXTERNAL_MAX_TIER} tier`);
        }
      }

      // Update if tier has changed (no longer storing flat commission_rate — it's computed per booking)
      if (agent.agent_tier !== newTierConfig.tier) {
        const { error: updateError } = await supabase
          .from('merchant_profiles')
          .update({
            agent_tier: newTierConfig.tier,
            updated_at: new Date().toISOString()
          })
          .eq('id', agent.id);

        if (updateError) {
          console.error(`Error updating agent ${agent.id}:`, updateError);
        } else {
          console.log(`Updated ${agent.business_name}: ${agent.agent_tier} -> ${newTierConfig.tier} (${isExternal ? 'external' : 'internal'}, multiplier: ${newTierConfig.multiplier}x)`);
          updates.push({
            agent_id: agent.id,
            agent_name: agent.business_name,
            old_tier: agent.agent_tier,
            new_tier: newTierConfig.tier,
            multiplier: newTierConfig.multiplier,
            booking_count: bookingCount,
            is_external: isExternal
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updates.length} agent tiers`,
        updates
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in update-agent-tiers:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
