import { supabase } from "@/integrations/supabase/client";

export interface AvailabilitySlot {
  id: string;
  resource_type: 'workspace' | 'property' | 'venue' | 'vehicle';
  resource_id: string;
  slot_date: string;
  start_time?: string;
  end_time?: string;
  is_available: boolean;
  is_blocked: boolean;
  blocked_reason?: string;
  price_override?: number;
  booking_id?: string;
  created_at: string;
}

export interface RecurringBooking {
  id: string;
  user_id: string;
  resource_type: 'workspace' | 'venue';
  resource_id: string;
  recurrence_type: 'daily' | 'weekly' | 'monthly';
  recurrence_days?: number[];
  start_time: string;
  end_time: string;
  start_date: string;
  end_date?: string;
  price_per_occurrence: number;
  total_occurrences?: number;
  status: 'active' | 'paused' | 'cancelled' | 'completed';
  next_occurrence?: string;
  payment_method: string;
  auto_renew: boolean;
  created_at: string;
}

export async function getAvailability(
  resourceType: string,
  resourceId: string,
  startDate: string,
  endDate: string
): Promise<AvailabilitySlot[]> {
  // Use raw approach since table may not be in types yet
  const { data, error } = await (supabase as any)
    .from('availability_slots')
    .select('*')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .gte('slot_date', startDate)
    .lte('slot_date', endDate)
    .order('slot_date', { ascending: true });

  if (error) {
    console.error('Error fetching availability:', error);
    return [];
  }

  return data as AvailabilitySlot[];
}

export async function checkSlotAvailability(
  resourceType: string,
  resourceId: string,
  date: string,
  startTime?: string
): Promise<boolean> {
  let query = (supabase as any)
    .from('availability_slots')
    .select('is_available, is_blocked')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .eq('slot_date', date);

  if (startTime) {
    query = query.eq('start_time', startTime);
  }

  const { data, error } = await query.single();

  if (error) {
    // If no slot exists, assume available
    return true;
  }

  return data?.is_available && !data?.is_blocked;
}

export async function blockSlot(
  resourceType: string,
  resourceId: string,
  date: string,
  reason?: string,
  startTime?: string,
  endTime?: string
): Promise<boolean> {
  const { error } = await (supabase as any)
    .from('availability_slots')
    .upsert({
      resource_type: resourceType,
      resource_id: resourceId,
      slot_date: date,
      start_time: startTime,
      end_time: endTime,
      is_available: false,
      is_blocked: true,
      blocked_reason: reason
    }, {
      onConflict: 'resource_type,resource_id,slot_date,start_time'
    });

  if (error) {
    console.error('Error blocking slot:', error);
    return false;
  }

  return true;
}

export async function unblockSlot(slotId: string): Promise<boolean> {
  const { error } = await (supabase as any)
    .from('availability_slots')
    .update({
      is_available: true,
      is_blocked: false,
      blocked_reason: null
    })
    .eq('id', slotId);

  if (error) {
    console.error('Error unblocking slot:', error);
    return false;
  }

  return true;
}

// Recurring bookings
export async function createRecurringBooking(
  booking: Omit<RecurringBooking, 'id' | 'user_id' | 'created_at' | 'status'>
): Promise<RecurringBooking | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data, error } = await (supabase as any)
    .from('recurring_bookings')
    .insert({
      ...booking,
      user_id: user.id,
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating recurring booking:', error);
    return null;
  }

  return data as RecurringBooking;
}

export async function getMyRecurringBookings(): Promise<RecurringBooking[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  const { data, error } = await (supabase as any)
    .from('recurring_bookings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching recurring bookings:', error);
    return [];
  }

  return data as RecurringBooking[];
}

export async function cancelRecurringBooking(id: string): Promise<boolean> {
  const { error } = await (supabase as any)
    .from('recurring_bookings')
    .update({ status: 'cancelled' })
    .eq('id', id);

  if (error) {
    console.error('Error cancelling recurring booking:', error);
    return false;
  }

  return true;
}

export async function pauseRecurringBooking(id: string): Promise<boolean> {
  const { error } = await (supabase as any)
    .from('recurring_bookings')
    .update({ status: 'paused' })
    .eq('id', id);

  if (error) {
    console.error('Error pausing recurring booking:', error);
    return false;
  }

  return true;
}

export async function resumeRecurringBooking(id: string): Promise<boolean> {
  const { error } = await (supabase as any)
    .from('recurring_bookings')
    .update({ status: 'active' })
    .eq('id', id);

  if (error) {
    console.error('Error resuming recurring booking:', error);
    return false;
  }

  return true;
}
