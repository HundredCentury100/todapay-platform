import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ActionRequest {
  bookingId: string;
  actionType: 'cancel' | 'refund' | 'reschedule' | 'upgrade';
  reason?: string;
  notes?: string;
  newDate?: string;
  newTime?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { bookingId, actionType, reason, notes, newDate, newTime }: ActionRequest = await req.json();

    console.log('Processing booking action:', actionType, bookingId);

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user owns this booking
    if (booking.user_id !== user.id && !booking.guest_email) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to modify this booking' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get applicable policy
    const { data: policy } = await supabase
      .from('booking_policies')
      .select('*')
      .eq('policy_type', booking.booking_type)
      .single();

    // Calculate time until event/departure
    const eventDateTime = booking.booking_type === 'event' 
      ? new Date(`${booking.event_date}T${booking.event_time}`)
      : new Date(`${booking.travel_date}T${booking.departure_time}`);
    
    const now = new Date();
    const hoursUntilEvent = (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundPercentage = 0;
    let refundAmount = 0;
    let actionStatus = 'pending';
    let canProcess = true;
    let message = '';

    if (actionType === 'cancel' || actionType === 'refund') {
      if (!policy || !policy.automated_enforcement) {
        actionStatus = 'pending';
        message = 'Request submitted for manual review';
      } else if (hoursUntilEvent >= policy.partial_refund_window_hours) {
        refundPercentage = policy.full_refund_percentage;
        actionStatus = 'approved';
        message = `${refundPercentage}% refund approved automatically`;
      } else if (hoursUntilEvent >= policy.no_refund_window_hours && hoursUntilEvent < policy.partial_refund_window_hours) {
        refundPercentage = policy.partial_refund_percentage;
        actionStatus = 'approved';
        message = `${refundPercentage}% partial refund approved automatically`;
      } else {
        canProcess = false;
        refundPercentage = 0;
        actionStatus = 'rejected';
        message = `Cancellation window closed. No refund available within ${policy.no_refund_window_hours} hours of event`;
      }

      if (canProcess && refundPercentage > 0) {
        refundAmount = (booking.total_price * refundPercentage) / 100;
      }
    }

    if (actionType === 'reschedule') {
      if (!policy || !policy.reschedule_allowed) {
        canProcess = false;
        actionStatus = 'rejected';
        message = 'Rescheduling not allowed for this booking type';
      } else {
        // Check reschedule count
        const { data: previousReschedules } = await supabase
          .from('booking_actions')
          .select('id')
          .eq('booking_id', bookingId)
          .eq('action_type', 'reschedule')
          .eq('action_status', 'completed');

        if (previousReschedules && previousReschedules.length >= policy.max_reschedules) {
          canProcess = false;
          actionStatus = 'rejected';
          message = `Maximum reschedules (${policy.max_reschedules}) reached`;
        } else {
          actionStatus = policy.automated_enforcement ? 'approved' : 'pending';
          message = policy.reschedule_fee > 0 
            ? `Reschedule fee: $${policy.reschedule_fee}`
            : 'Reschedule approved';
        }
      }
    }

    // Create action record
    const { data: action, error: actionError } = await supabase
      .from('booking_actions')
      .insert({
        booking_id: bookingId,
        action_type: actionType,
        action_status: actionStatus,
        requested_by: user.id,
        refund_amount: refundAmount,
        refund_percentage: refundPercentage,
        reason: reason || null,
        notes: notes || null,
        metadata: {
          hours_until_event: hoursUntilEvent,
          new_date: newDate,
          new_time: newTime,
          policy_applied: policy?.id || null,
        },
      })
      .select()
      .single();

    if (actionError) {
      console.error('Failed to create action:', actionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create action' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update booking status if action is automatically approved
    if (actionStatus === 'approved' || actionStatus === 'completed') {
      const updateData: any = {};
      
      if (actionType === 'cancel') {
        updateData.status = 'cancelled';
        updateData.cancellation_reason = reason;
        updateData.refund_status = refundPercentage > 0 ? 'approved' : 'none';
      } else if (actionType === 'reschedule') {
        updateData.reschedule_status = 'approved';
        updateData.reschedule_requested = false;
        if (newDate) updateData.event_date = newDate;
        if (newDate) updateData.travel_date = newDate;
        if (newTime) updateData.event_time = newTime;
        if (newTime) updateData.departure_time = newTime;
      }

      await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);
    }

    console.log('Action processed:', actionType, actionStatus);

    return new Response(
      JSON.stringify({
        success: true,
        action,
        message,
        refundAmount,
        refundPercentage,
        actionStatus,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Booking action error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Action processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
