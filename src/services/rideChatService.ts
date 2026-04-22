import { supabase } from "@/integrations/supabase/client";

export interface RideMessage {
  id: string;
  ride_id: string;
  sender_id: string;
  sender_type: 'passenger' | 'driver';
  message: string;
  message_type: 'text' | 'quick_reply' | 'location';
  read_at: string | null;
  created_at: string;
}

export async function getRideMessages(rideId: string): Promise<RideMessage[]> {
  const { data, error } = await supabase
    .from('ride_messages')
    .select('*')
    .eq('ride_id', rideId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching ride messages:', error);
    return [];
  }

  return data as RideMessage[];
}

export async function sendRideMessage(
  rideId: string,
  message: string,
  senderType: 'passenger' | 'driver',
  messageType: 'text' | 'quick_reply' | 'location' = 'text'
): Promise<RideMessage | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('ride_messages')
    .insert({
      ride_id: rideId,
      sender_id: user.id,
      sender_type: senderType,
      message,
      message_type: messageType,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    throw error;
  }

  return data as RideMessage;
}

export async function markMessagesAsRead(rideId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('ride_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('ride_id', rideId)
    .neq('sender_id', userId)
    .is('read_at', null);

  if (error) {
    console.error('Error marking messages as read:', error);
  }
}

export const QUICK_REPLIES = [
  "I'm on my way",
  "I'm here",
  "Running 5 mins late",
  "Please wait",
  "I'm at the pickup point",
  "Can you call me?",
] as const;
