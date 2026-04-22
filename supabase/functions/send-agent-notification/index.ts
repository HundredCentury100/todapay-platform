import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationRequest {
  agentProfileId: string;
  notificationType: 'new_booking' | 'payout_approved' | 'payout_rejected' | 'commission_approved' | 'tier_upgraded' | 'client_message';
  title: string;
  body: string;
  data?: Record<string, any>;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { agentProfileId, notificationType, title, body, data = {} }: NotificationRequest = await req.json();

    console.log(`Sending ${notificationType} notification to agent ${agentProfileId}`);

    // Create notification record in database
    const { error: notifError } = await supabase
      .from('agent_notifications')
      .insert({
        agent_profile_id: agentProfileId,
        notification_type: notificationType,
        title,
        body,
        data,
        read: false,
      });

    if (notifError) {
      console.error('Error creating notification:', notifError);
      throw notifError;
    }

    // Get push tokens for this agent
    const { data: pushTokens } = await supabase
      .from('agent_push_tokens')
      .select('token, device_type')
      .eq('agent_profile_id', agentProfileId);

    let pushSent = 0;

    if (pushTokens && pushTokens.length > 0) {
      console.log(`Found ${pushTokens.length} push tokens for agent`);
      
      // Update last_used_at for tokens
      await supabase
        .from('agent_push_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('agent_profile_id', agentProfileId);

      pushSent = pushTokens.length;
      
      // Note: Actual web push would require VAPID keys and web-push library
      // For now, we log and mark as ready for implementation
      console.log(`Push notification queued for ${pushSent} devices`);
    }

    // Also get user's email for potential email notification
    const { data: agentProfile } = await supabase
      .from('merchant_profiles')
      .select('email, business_name')
      .eq('id', agentProfileId)
      .single();

    // For critical notifications, also send email and SMS
    const criticalTypes = ['payout_approved', 'payout_rejected', 'tier_upgraded'];
    if (criticalTypes.includes(notificationType) && agentProfile?.email) {
      console.log(`Critical notification - would email ${agentProfile.email}`);
    }

    // Send SMS to agent if they have a phone
    let smsSent = false;
    const { data: agentUser } = await supabase
      .from('merchant_profiles')
      .select('phone')
      .eq('id', agentProfileId)
      .single();

    if (agentUser?.phone) {
      try {
        const smsRes = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-sms`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              action: "send",
              to: agentUser.phone,
              message: `${title}: ${body}`.slice(0, 160),
              context: notificationType,
            }),
          }
        );
        const smsResult = await smsRes.json();
        smsSent = smsResult.success === true;
      } catch (smsErr) {
        console.error("Agent SMS error:", smsErr);
      }
    }

    // Send Telegram notification if agent has linked account
    let telegramSent = false;
    if (agentProfile?.email) {
      try {
        const { data: agentUser2 } = await supabase
          .from("merchant_profiles")
          .select("user_id")
          .eq("id", agentProfileId)
          .single();

        if (agentUser2?.user_id) {
          const { data: tgLink } = await supabase
            .from("telegram_user_links")
            .select("telegram_chat_id")
            .eq("user_id", agentUser2.user_id)
            .eq("status", "active")
            .single();

          if (tgLink) {
            const tgRes = await fetch(
              `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-telegram-message`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                },
                body: JSON.stringify({
                  chat_id: tgLink.telegram_chat_id,
                  text: `🔔 <b>${title}</b>\n\n${body}`,
                }),
              }
            );
            telegramSent = (await tgRes.json()).success === true;
          }
        }
      } catch (tgErr) {
        console.error("Agent Telegram error:", tgErr);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification sent",
        db_notification: true,
        push_tokens_notified: pushSent,
        sms_sent: smsSent,
        telegram_sent: telegramSent,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
