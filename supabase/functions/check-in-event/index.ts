import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CheckInRequest {
  qrCodeData: string;
  location?: string;
  checkedInBy?: string;
  notes?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // SECURITY: Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Authentication required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Verify user is an event organizer or admin
    const { data: merchantProfile, error: profileError } = await supabase
      .from('merchant_profiles')
      .select('id, role, verification_status')
      .eq('user_id', user.id)
      .in('role', ['event_organizer', 'admin'])
      .single();

    if (profileError || !merchantProfile || merchantProfile.verification_status !== 'verified') {
      console.error('Not an authorized event organizer:', profileError);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Event organizer access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { qrCodeData, location, checkedInBy, notes }: CheckInRequest = await req.json();

    console.log('Check-in attempt for QR code:', qrCodeData);

    if (!qrCodeData) {
      return new Response(
        JSON.stringify({ error: 'QR code data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the booking by QR code
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('qr_code_data', qrCodeData)
      .eq('booking_type', 'event')
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Invalid ticket. Booking not found.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Verify the event belongs to this merchant (skip for admin)
    if (merchantProfile.role !== 'admin') {
      const { data: event } = await supabase
        .from('events')
        .select('id, organizer')
        .eq('id', booking.item_id)
        .single();

      if (!event) {
        console.error('Event not found for booking');
        return new Response(
          JSON.stringify({ error: 'Event not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify merchant owns this event
      const { data: eventOwnership } = await supabase
        .from('operator_associations')
        .select('id')
        .eq('merchant_profile_id', merchantProfile.id)
        .eq('operator_name', event.organizer)
        .maybeSingle();

      if (!eventOwnership) {
        console.error('Merchant does not own this event');
        return new Response(
          JSON.stringify({ error: 'Forbidden - You do not have access to this event' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check if booking is cancelled
    if (booking.status === 'cancelled') {
      return new Response(
        JSON.stringify({ error: 'This ticket has been cancelled.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already checked in
    if (booking.checked_in) {
      return new Response(
        JSON.stringify({
          error: 'Ticket already checked in',
          checkedInAt: booking.checked_in_at,
          booking: {
            bookingReference: booking.booking_reference,
            passengerName: booking.passenger_name,
            itemName: booking.item_name,
            eventDate: booking.event_date,
            eventTime: booking.event_time,
          },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if event date is in the past (optional validation)
    const eventDate = new Date(booking.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      console.warn('Event date is in the past:', eventDate);
    }

    // Update booking as checked in
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
      })
      .eq('id', booking.id);

    if (updateError) {
      console.error('Failed to update booking:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to check in. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the check-in
    const { error: logError } = await supabase
      .from('check_ins')
      .insert({
        booking_id: booking.id,
        checked_in_by: checkedInBy || 'Staff',
        location: location || booking.event_venue || 'Unknown',
        notes: notes || null,
      });

    if (logError) {
      console.error('Failed to log check-in:', logError);
      // Don't fail the request if logging fails
    }

    console.log('Successfully checked in booking:', booking.booking_reference);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Check-in successful',
        booking: {
          bookingReference: booking.booking_reference,
          passengerName: booking.passenger_name,
          passengerEmail: booking.passenger_email,
          itemName: booking.item_name,
          eventDate: booking.event_date,
          eventTime: booking.event_time,
          eventVenue: booking.event_venue,
          ticketQuantity: booking.ticket_quantity,
          selectedSeats: booking.selected_seats,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Check-in error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
