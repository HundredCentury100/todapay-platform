import { supabase } from "@/integrations/supabase/client";

export interface ScheduledRide {
  id: string;
  user_id: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  scheduled_time: string;
  vehicle_type: string;
  pricing_mode: string;
  notes: string | null;
  status: 'scheduled' | 'activated' | 'completed' | 'cancelled';
  ride_request_id: string | null;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}

export async function getScheduledRides(): Promise<ScheduledRide[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('scheduled_rides')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['scheduled'])
    .order('scheduled_time', { ascending: true });

  if (error) {
    console.error('Error fetching scheduled rides:', error);
    return [];
  }

  return data as ScheduledRide[];
}

export async function createScheduledRide(ride: {
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  scheduled_time: string;
  vehicle_type?: string;
  pricing_mode?: string;
  notes?: string;
}): Promise<ScheduledRide | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('scheduled_rides')
    .insert({
      user_id: user.id,
      ...ride,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating scheduled ride:', error);
    throw error;
  }

  return data as ScheduledRide;
}

export async function cancelScheduledRide(id: string): Promise<void> {
  const { error } = await supabase
    .from('scheduled_rides')
    .update({ status: 'cancelled' })
    .eq('id', id);

  if (error) {
    console.error('Error cancelling scheduled ride:', error);
    throw error;
  }
}

export async function getUpcomingScheduledRide(): Promise<ScheduledRide | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('scheduled_rides')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'scheduled')
    .gte('scheduled_time', new Date().toISOString())
    .order('scheduled_time', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching upcoming ride:', error);
    return null;
  }

  return data as ScheduledRide | null;
}
