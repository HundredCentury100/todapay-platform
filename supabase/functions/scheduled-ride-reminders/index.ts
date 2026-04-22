import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// This function sends reminders for upcoming scheduled rides
// Should run every 5 minutes via cron

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    // Reminder window: 25-35 minutes before scheduled time (to catch 30 min reminder)
    const reminderWindowStart = new Date(now.getTime() + 25 * 60 * 1000);
    const reminderWindowEnd = new Date(now.getTime() + 35 * 60 * 1000);

    console.log(`Checking for reminder candidates between ${reminderWindowStart.toISOString()} and ${reminderWindowEnd.toISOString()}`);

    // Find scheduled rides needing reminders
    const { data: scheduledRides, error: fetchError } = await supabase
      .from('scheduled_rides')
      .select('*, profiles:user_id(full_name, email, phone)')
      .eq('status', 'scheduled')
      .eq('reminder_sent', false)
      .gte('scheduled_time', reminderWindowStart.toISOString())
      .lte('scheduled_time', reminderWindowEnd.toISOString());

    if (fetchError) {
      throw new Error(`Failed to fetch scheduled rides: ${fetchError.message}`);
    }

    if (!scheduledRides || scheduledRides.length === 0) {
      console.log('No reminders to send');
      return new Response(
        JSON.stringify({ success: true, message: 'No reminders needed', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Found ${scheduledRides.length} rides needing reminders`);

    const sentReminders = [];
    const errors = [];

    for (const ride of scheduledRides) {
      try {
        const scheduledTime = new Date(ride.scheduled_time);
        const formattedTime = scheduledTime.toLocaleTimeString('en-ZA', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        // Send push notification
        try {
          await supabase.functions.invoke('send-ride-notification', {
            body: {
              passengerId: ride.user_id,
              type: 'scheduled_ride_reminder',
              title: 'Upcoming Ride Reminder',
              body: `Your ride to ${ride.dropoff_address} is scheduled for ${formattedTime}. We'll start finding a driver in 15 minutes.`,
              data: {
                scheduledRideId: ride.id,
                scheduledTime: ride.scheduled_time
              }
            }
          });
        } catch (notifError) {
          console.error('Failed to send push notification:', notifError);
        }

        // Mark reminder as sent
        await supabase
          .from('scheduled_rides')
          .update({
            reminder_sent: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', ride.id);

        sentReminders.push({
          scheduledRideId: ride.id,
          userId: ride.user_id
        });

        console.log(`Sent reminder for scheduled ride ${ride.id}`);

      } catch (reminderError) {
        console.error(`Error sending reminder for ride ${ride.id}:`, reminderError);
        errors.push({
          scheduledRideId: ride.id,
          error: reminderError instanceof Error ? reminderError.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentReminders.length,
        sentReminders,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in scheduled-ride-reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
