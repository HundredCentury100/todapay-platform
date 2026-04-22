import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const suspensionThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const deletionThreshold = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString();

    let totalSuspended = 0;
    let totalDeleted = 0;

    // Process each table: profiles, merchant_profiles, drivers, corporate_accounts
    const tables = [
      { name: "profiles", type: "user" },
      { name: "merchant_profiles", type: "merchant" },
      { name: "drivers", type: "driver" },
      { name: "corporate_accounts", type: "corporate" },
    ];

    for (const table of tables) {
      // Auto-suspend: active accounts dormant for 90+ days
      const { data: toSuspend } = await supabase
        .from(table.name)
        .select("id")
        .eq("account_status", "active")
        .lt("last_active_at", suspensionThreshold);

      if (toSuspend && toSuspend.length > 0) {
        const ids = toSuspend.map((r: any) => r.id);
        await supabase
          .from(table.name)
          .update({ account_status: "suspended" })
          .in("id", ids);

        // Log each
        for (const item of toSuspend) {
          await supabase.from("account_lifecycle_log").insert({
            target_type: table.type,
            target_entity_id: item.id,
            action: "auto_suspended",
            reason: "Account dormant for 90+ days",
          });
        }
        totalSuspended += toSuspend.length;
      }

      // Auto-delete: suspended accounts dormant for 120+ days
      const { data: toDelete } = await supabase
        .from(table.name)
        .select("id")
        .eq("account_status", "suspended")
        .lt("last_active_at", deletionThreshold);

      if (toDelete && toDelete.length > 0) {
        const ids = toDelete.map((r: any) => r.id);
        await supabase
          .from(table.name)
          .update({ account_status: "deleted" })
          .in("id", ids);

        for (const item of toDelete) {
          await supabase.from("account_lifecycle_log").insert({
            target_type: table.type,
            target_entity_id: item.id,
            action: "auto_deleted",
            reason: "Account dormant for 120+ days",
          });
        }
        totalDeleted += toDelete.length;
      }
    }

    console.log(`Lifecycle cron: suspended=${totalSuspended}, deleted=${totalDeleted}`);

    return new Response(
      JSON.stringify({
        success: true,
        suspended: totalSuspended,
        deleted: totalDeleted,
        timestamp: now.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Account lifecycle cron error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
