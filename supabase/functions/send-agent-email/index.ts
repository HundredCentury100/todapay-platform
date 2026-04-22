import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildPremiumEmail } from "../_shared/email-template.ts";

const BRANDED_SENDER = "fulticket Agents <support@notify.fulticket.com>";
const INTERNAL_SECRET = Deno.env.get("INTERNAL_FUNCTION_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AgentEmailRequest {
  agentEmail: string;
  agentName: string;
  notificationType: string;
  title: string;
  body: string;
  data?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const internalSecret = req.headers.get("x-internal-secret");
  if (!internalSecret || internalSecret !== INTERNAL_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { agentEmail, agentName, notificationType, title, body, data }: AgentEmailRequest = await req.json();
    console.log(`Sending ${notificationType} email to agent ${agentEmail}`);

    const details: { label: string; value: string }[] = [];
    let alertText: string | undefined;

    switch (notificationType) {
      case 'booking_created':
        details.push({ label: 'Booking Ref', value: data?.bookingReference || 'N/A' });
        details.push({ label: 'Client', value: data?.clientName || 'N/A' });
        details.push({ label: 'Amount', value: `$${data?.amount?.toFixed(2) || '0.00'}` });
        details.push({ label: 'Commission', value: `$${data?.commission?.toFixed(2) || '0.00'}` });
        break;
      case 'commission_approved':
        details.push({ label: 'Amount', value: `$${data?.amount?.toFixed(2) || '0.00'}` });
        details.push({ label: 'Status', value: data?.status || 'Approved' });
        break;
      case 'payout_processed':
        details.push({ label: 'Amount', value: `$${data?.amount?.toFixed(2) || '0.00'}` });
        details.push({ label: 'Payment Method', value: data?.paymentMethod || 'Bank Transfer' });
        details.push({ label: 'Reference', value: data?.reference || 'N/A' });
        break;
      case 'tier_upgrade':
        details.push({ label: 'New Tier', value: data?.tier || 'N/A' });
        details.push({ label: 'Commission Rate', value: `${data?.commissionRate || 'N/A'}%` });
        alertText = 'Congratulations on your tier upgrade! Your new commission rate applies to all future bookings.';
        break;
    }

    const htmlContent = buildPremiumEmail({
      type: 'notification',
      title,
      subtitle: 'Agent Portal',
      greeting: `Hello ${agentName},`,
      details: details.length > 0 ? details : undefined,
      bodyText: details.length === 0 ? body : undefined,
      alertText,
      alertColor: notificationType === 'tier_upgrade' ? 'success' : undefined,
      ctaLabel: 'View Agent Dashboard',
      ctaUrl: 'https://fulticket.com/merchant/agent/dashboard',
    });

    await supabase.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: { from: BRANDED_SENDER, to: [agentEmail], subject: `fulticket - ${title}`, html: htmlContent },
    });
    console.log("Agent email enqueued successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Agent notification email enqueued" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending agent email:", error);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
