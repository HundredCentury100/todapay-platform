import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type NotificationType = 
  | 'driver_assigned'
  | 'driver_arriving'
  | 'driver_arrived'
  | 'trip_started'
  | 'trip_completed'
  | 'trip_cancelled'
  | 'payment_received';

interface RideNotificationRequest {
  ride_id: string;
  notification_type: NotificationType;
  recipient_type: 'passenger' | 'driver' | 'both';
  custom_message?: string;
  eta_minutes?: number;
}

const NOTIFICATION_TEMPLATES: Record<NotificationType, { title: string; body: string }> = {
  driver_assigned: {
    title: '🚗 Driver Found!',
    body: 'Your driver is on the way. Track your ride in the app.',
  },
  driver_arriving: {
    title: '📍 Driver Approaching',
    body: 'Your driver will arrive in {eta} minutes.',
  },
  driver_arrived: {
    title: '✅ Driver Has Arrived',
    body: 'Your driver is waiting at the pickup point.',
  },
  trip_started: {
    title: '🚀 Trip Started',
    body: 'Enjoy your ride! Track your trip in real-time.',
  },
  trip_completed: {
    title: '🎉 Trip Completed',
    body: 'Thanks for riding! Rate your driver and view your receipt.',
  },
  trip_cancelled: {
    title: '❌ Trip Cancelled',
    body: 'Your ride has been cancelled.',
  },
  payment_received: {
    title: '💰 Payment Received',
    body: 'Payment of R{amount} has been processed.',
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      ride_id, 
      notification_type, 
      recipient_type,
      custom_message,
      eta_minutes 
    }: RideNotificationRequest = await req.json();

    // Get ride details
    const { data: ride, error: rideError } = await supabase
      .from('active_rides')
      .select('*, driver:drivers(*), ride_request:ride_requests(*)')
      .eq('id', ride_id)
      .single();

    if (rideError || !ride) {
      throw new Error('Ride not found');
    }

    const template = NOTIFICATION_TEMPLATES[notification_type];
    let title = template.title;
    let body = custom_message || template.body;

    // Replace placeholders
    if (eta_minutes) {
      body = body.replace('{eta}', eta_minutes.toString());
    }
    if (ride.final_price) {
      body = body.replace('{amount}', ride.final_price.toString());
    }

    const notifications: Array<{ user_id: string; type: string }> = [];

    // Determine recipients
    if (recipient_type === 'passenger' || recipient_type === 'both') {
      if (ride.passenger_id) {
        notifications.push({ 
          user_id: ride.passenger_id, 
          type: 'passenger' 
        });
      }
    }

    if (recipient_type === 'driver' || recipient_type === 'both') {
      if ((ride.driver as any)?.user_id) {
        notifications.push({ 
          user_id: (ride.driver as any).user_id, 
          type: 'driver' 
        });
      }
    }

    // Create notification records
    const notificationRecords = notifications.map(n => ({
      user_id: n.user_id,
      type: 'bookings', // Using bookings category for rides
      title,
      message: body,
      read: false,
      metadata: {
        ride_id,
        notification_type,
        recipient_type: n.type,
      }
    }));

    if (notificationRecords.length > 0) {
      await supabase.from('user_notifications').insert(notificationRecords);
    }

    // Get push subscriptions for recipients
    const userIds = notifications.map(n => n.user_id);
    
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds)
      .eq('is_active', true);

    // Log push attempt (actual push would require web-push implementation)
    console.log(`Sending ${notification_type} notification to ${notifications.length} recipients`);
    console.log(`Found ${subscriptions?.length || 0} active push subscriptions`);

    // Update last_used_at for subscriptions
    if (subscriptions && subscriptions.length > 0) {
      const subIds = subscriptions.map(s => s.id);
      await supabase
        .from('push_subscriptions')
        .update({ last_used_at: new Date().toISOString() })
        .in('id', subIds);
    }

    // Send Telegram notifications to linked users
    let telegramSent = 0;
    for (const n of notifications) {
      try {
        const { data: tgLink } = await supabase
          .from('telegram_user_links')
          .select('telegram_chat_id, notification_preferences')
          .eq('user_id', n.user_id)
          .eq('status', 'active')
          .single();

        if (tgLink && (tgLink.notification_preferences as any)?.rides !== false) {
          const tgRes = await fetch(
            `${supabaseUrl}/functions/v1/send-telegram-message`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                chat_id: tgLink.telegram_chat_id,
                text: `${title}\n\n${body}`,
              }),
            }
          );
          if ((await tgRes.json()).success) telegramSent++;
        }
      } catch (tgErr) {
        console.error('Ride Telegram error:', tgErr);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      notifications_sent: notifications.length,
      push_subscriptions: subscriptions?.length || 0,
      telegram_sent: telegramSent,
      message: `${notification_type} notification sent`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Ride notification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
