import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseServiceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // SECURITY: Verify authentication for check-in operations
    // Read-only validation can be done without auth, but check-in requires auth
    const { bookingReference, qrCodeData, operation } = await req.json();
    
    // If this is a check-in operation, require authentication
    if (operation === "check_in") {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Authentication required for check-in' }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Verify the user is authenticated
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      
      if (authError || !user) {
        console.error('Authentication failed:', authError);
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Invalid token' }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Verify user is a merchant (bus operator or event organizer)
      const { data: merchantProfile, error: profileError } = await supabaseServiceClient
        .from('merchant_profiles')
        .select('id, role, verification_status')
        .eq('user_id', user.id)
        .in('role', ['bus_operator', 'event_organizer', 'admin'])
        .single();

      if (profileError || !merchantProfile || merchantProfile.verification_status !== 'verified') {
        console.error('Not an authorized merchant:', profileError);
        return new Response(
          JSON.stringify({ error: 'Forbidden - Merchant access required for check-in' }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (!bookingReference && !qrCodeData) {
      return new Response(
        JSON.stringify({ error: "Booking reference or QR code required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build query
    let query = supabaseClient.from("bookings").select("*");

    if (bookingReference) {
      query = query.eq("booking_reference", bookingReference);
    } else if (qrCodeData) {
      query = query.eq("qr_code_data", qrCodeData);
    }

    const { data: booking, error } = await query.single();

    if (error || !booking) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "Ticket not found",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if booking is valid
    const isValid = booking.status === "confirmed" && !booking.checked_in;
    const isCancelled = booking.status === "cancelled";
    const isAlreadyCheckedIn = booking.checked_in;

    // Handle check-in operation (now with auth verification complete)
    if (operation === "check_in" && isValid) {
      const { error: updateError } = await supabaseServiceClient
        .from("bookings")
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to check in" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Record check-in
      await supabaseServiceClient.from("check_ins").insert({
        booking_id: booking.id,
        checked_in_by: "scanner",
        location: "venue_entrance",
      });

      return new Response(
        JSON.stringify({
          valid: true,
          checked_in: true,
          message: "Check-in successful",
          booking: {
            reference: booking.booking_reference,
            name: booking.item_name,
            attendee: booking.passenger_name,
            seats: booking.selected_seats,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Return validation result
    return new Response(
      JSON.stringify({
        valid: isValid,
        checked_in: isAlreadyCheckedIn,
        cancelled: isCancelled,
        status: booking.status,
        booking: {
          reference: booking.booking_reference,
          ticket_number: booking.ticket_number,
          name: booking.item_name,
          date: booking.event_date,
          time: booking.event_time,
          venue: booking.event_venue,
          attendee: booking.passenger_name,
          seats: booking.selected_seats,
          quantity: booking.ticket_quantity,
        },
        message: isAlreadyCheckedIn
          ? "Ticket already checked in"
          : isCancelled
          ? "Ticket has been cancelled"
          : isValid
          ? "Valid ticket"
          : "Invalid ticket",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Validation failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
