import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildPremiumEmail } from "../_shared/email-template.ts";

const BRANDED_SENDER = "TodaPay <support@notify.TodaPay.com>";
const INTERNAL_SECRET = Deno.env.get("INTERNAL_FUNCTION_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationRequest {
  merchantId: string;
  status: 'verified' | 'rejected';
  businessEmail: string;
  businessName: string;
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
    const { businessEmail, businessName, status }: NotificationRequest = await req.json();
    console.log(`Sending ${status} notification to ${businessEmail}`);

    const subject = status === 'verified'
      ? `Welcome to TodaPay, ${businessName}!`
      : `Application Status Update for ${businessName}`;

    const htmlContent = status === 'verified'
      ? buildPremiumEmail({
          type: 'confirmation',
          title: 'Congratulations!',
          subtitle: 'Merchant Account Approved',
          greeting: `Dear ${businessName},`,
          bodyText: 'Your merchant account has been approved and verified. You can now log in to your dashboard and start managing your business.',
          alertText: 'Start by setting up your business profile, adding your routes or events, and configuring payment methods.',
          alertColor: 'success',
          ctaLabel: 'Access Your Dashboard',
          ctaUrl: 'https://TodaPay.com/merchant/auth',
        })
      : buildPremiumEmail({
          type: 'alert',
          title: 'Application Status Update',
          subtitle: 'Merchant Application',
          greeting: `Dear ${businessName},`,
          bodyText: 'We regret to inform you that your merchant application has been rejected after careful review. If you believe this was an error or would like to discuss your application, please contact our support team.',
          ctaLabel: 'Contact Support',
          ctaUrl: 'mailto:support@TodaPay.com',
        });

    await supabase.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: { from: BRANDED_SENDER, to: [businessEmail], subject, html: htmlContent },
    });
    console.log("Merchant notification email enqueued");

    return new Response(
      JSON.stringify({ success: true, message: "Notification enqueued" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
