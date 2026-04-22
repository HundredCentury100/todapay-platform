import { supabase } from "@/integrations/supabase/client";
import { NotificationType } from "@/contexts/NotificationContext";

export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  options?: {
    category?: string;
    actionUrl?: string;
    attachmentUrl?: string;
    metadata?: Record<string, any>;
  }
) => {
  const { error } = await supabase
    .from('user_notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      read: false,
      category: options?.category || 'system',
      action_url: options?.actionUrl,
      attachment_url: options?.attachmentUrl,
      metadata: options?.metadata,
    } as any);

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('user_notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const { error } = await supabase
    .from('user_notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

export const deleteNotification = async (notificationId: string) => {
  const { error } = await supabase
    .from('user_notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

export const getUserNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  return data;
};
