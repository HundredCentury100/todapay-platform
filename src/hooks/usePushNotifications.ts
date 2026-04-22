import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PushNotificationOptions {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

export const usePushNotifications = (options?: PushNotificationOptions) => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);
      if (supported) {
        setPermission(Notification.permission);
      }
    };
    checkSupport();
  }, []);

  useEffect(() => {
    if (!user || !isSupported) return;
    
    const checkSubscription = async () => {
      try {
        const { data } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
        
        setIsSubscribed(!!data);
      } catch {
        setIsSubscribed(false);
      }
    };
    checkSubscription();
  }, [user, isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !user) return false;
    
    setIsLoading(true);
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult !== 'granted') {
        options?.onPermissionDenied?.();
        return false;
      }
      
      options?.onPermissionGranted?.();
      
      const registration = await navigator.serviceWorker.ready;
      
      // For demo purposes, we'll create a subscription record without actual web-push
      // In production, you'd use VAPID keys and web-push
      const subscriptionData = {
        endpoint: `https://push.example.com/${user.id}`,
        keys: { p256dh: 'demo', auth: 'demo' }
      };
      
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionData.endpoint,
          p256dh_key: subscriptionData.keys.p256dh,
          auth_key: subscriptionData.keys.auth,
          device_type: 'web',
          is_active: true,
          notification_preferences: {
            bookings: true,
            payments: true,
            promotions: true,
            reminders: true
          },
          last_used_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,endpoint'
        });
      
      if (error) throw error;
      
      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('Push subscription error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user, options]);

  const unsubscribe = useCallback(async () => {
    if (!user) return false;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Push unsubscribe error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updatePreferences = useCallback(async (preferences: {
    bookings?: boolean;
    payments?: boolean;
    promotions?: boolean;
    reminders?: boolean;
  }) => {
    if (!user) return false;
    
    try {
      const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('notification_preferences')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      
      const currentPrefs = (existing?.notification_preferences as Record<string, boolean>) || {};
      
      const { error } = await supabase
        .from('push_subscriptions')
        .update({
          notification_preferences: { ...currentPrefs, ...preferences }
        })
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      return !error;
    } catch {
      return false;
    }
  }, [user]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    updatePreferences
  };
};

// Helper to send push notifications via edge function
export const sendPushNotification = async (params: {
  userId?: string;
  userIds?: string[];
  title: string;
  body: string;
  category?: 'bookings' | 'payments' | 'promotions' | 'reminders';
  data?: Record<string, unknown>;
}) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: params
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Send push notification error:', error);
    return null;
  }
};
