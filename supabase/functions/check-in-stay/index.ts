import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CheckInRequest {
  qrCodeData?: string;
  bookingReference?: string;
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
      console.error('No authorization header provided');
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

    // Verify user is a property owner or admin
    const { data: merchantProfile, error: profileError } = await supabase
      .from('merchant_profiles')
      .select('id, role, verification_status')
      .eq('user_id', user.id)
      .in('role', ['property_owner', 'admin'])
      .single();

    if (profileError || !merchantProfile || merchantProfile.verification_status !== 'verified') {
      console.error('Not an authorized property owner:', profileError);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Property owner access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { qrCodeData, bookingReference, location, checkedInBy, notes }: CheckInRequest = await req.json();

    console.log('Stay check-in attempt:', { qrCodeData, bookingReference });

    if (!qrCodeData && !bookingReference) {
      return new Response(
        JSON.stringify({ error: 'QR code data or booking reference is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the booking by QR code or booking reference
    let bookingQuery = supabase
      .from('bookings')
      .select('*')
      .eq('booking_type', 'stay');

    if (qrCodeData) {
      bookingQuery = bookingQuery.eq('qr_code_data', qrCodeData);
    } else if (bookingReference) {
      bookingQuery = bookingQuery.eq('booking_reference', bookingReference);
    }

    const { data: booking, error: bookingError } = await bookingQuery.single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Invalid ticket. Booking not found.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the stay booking details
    const { data: stayBooking, error: stayError } = await supabase
      .from('stay_bookings')
      .select(`
        *,
        property:properties(id, name, merchant_profile_id),
        room:rooms(id, name, room_type)
      `)
      .eq('booking_id', booking.id)
      .single();

    if (stayError || !stayBooking) {
      console.error('Stay booking not found:', stayError);
      return new Response(
        JSON.stringify({ error: 'Stay booking details not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Verify the property belongs to this merchant (skip for admin)
    if (merchantProfile.role !== 'admin') {
      if (stayBooking.property?.merchant_profile_id !== merchantProfile.id) {
        console.error('Merchant does not own this property');
        return new Response(
          JSON.stringify({ error: 'Forbidden - You do not have access to this property' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check if booking is cancelled
    if (booking.status === 'cancelled') {
      return new Response(
        JSON.stringify({ error: 'This booking has been cancelled.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already checked in
    if (booking.checked_in) {
      return new Response(
        JSON.stringify({
          error: 'Guest already checked in',
          checkedInAt: booking.checked_in_at,
          booking: {
            bookingReference: booking.booking_reference,
            guestName: booking.passenger_name,
            propertyName: stayBooking.property?.name,
            roomName: stayBooking.room?.name,
            checkInDate: stayBooking.check_in_date,
            checkOutDate: stayBooking.check_out_date,
          },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate check-in date
    const checkInDate = new Date(stayBooking.check_in_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkInDate.setHours(0, 0, 0, 0);
    
    // Allow check-in from the check-in date
    if (checkInDate > today) {
      const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return new Response(
        JSON.stringify({ 
          error: `Check-in is not available yet. Guest can check in on ${stayBooking.check_in_date} (in ${daysUntilCheckIn} days).` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
        location: location || stayBooking.property?.name || 'Unknown',
        notes: notes || null,
      });

    if (logError) {
      console.error('Failed to log check-in:', logError);
      // Don't fail the request if logging fails
    }

    console.log('Successfully checked in stay booking:', booking.booking_reference);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Check-in successful! Welcome to your stay.',
        booking: {
          bookingReference: booking.booking_reference,
          guestName: booking.passenger_name,
          guestEmail: booking.passenger_email,
          guestPhone: booking.passenger_phone,
          propertyName: stayBooking.property?.name,
          roomName: stayBooking.room?.name,
          roomType: stayBooking.room?.room_type,
          checkInDate: stayBooking.check_in_date,
          checkOutDate: stayBooking.check_out_date,
          numGuests: stayBooking.num_guests,
          numRooms: stayBooking.num_rooms,
          specialRequests: stayBooking.special_requests,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Stay check-in error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
