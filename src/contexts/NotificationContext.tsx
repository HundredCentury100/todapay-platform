import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import {
  createNotification as createNotificationDB,
  markNotificationAsRead as markNotificationAsReadDB,
  markAllNotificationsAsRead as markAllNotificationsAsReadDB,
  deleteNotification as deleteNotificationDB,
  getUserNotifications,
} from "@/services/userNotificationService";
import { useNotificationSound } from "@/hooks/useNotificationSound";

export type NotificationType = "success" | "warning" | "info";
export type NotificationCategory = "all" | "booking" | "payment" | "promotion" | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  attachmentUrl?: string;
  metadata?: {
    bookingRef?: string;
    amount?: number;
    currency?: string;
    paymentMethod?: string;
    eventName?: string;
    routeFrom?: string;
    routeTo?: string;
    travelDate?: string;
    isSponsored?: boolean;
    sponsorName?: string;
    sponsorImage?: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (
    type: NotificationType, 
    title: string, 
    message: string, 
    options?: {
      category?: NotificationCategory;
      actionUrl?: string;
      attachmentUrl?: string;
      metadata?: Notification['metadata'];
    }
  ) => void;
  markAsRead: (id: string) => void;
  removeNotification: (id: string) => void;
  markAllAsRead: () => void;
  clearAllByCategory: (category: NotificationCategory) => void;
  unreadCount: number;
  getByCategory: (category: NotificationCategory) => Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const GUEST_NOTIFICATIONS_KEY = 'fulticket_guest_notifications';

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  const { playForNotification } = useNotificationSound();

  // Load notifications - from localStorage for guests, database for authenticated users
  useEffect(() => {
    if (!user) {
      // Load guest notifications from localStorage
      try {
        const stored = localStorage.getItem(GUEST_NOTIFICATIONS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setNotifications(parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp),
            category: n.category || 'system'
          })));
        }
      } catch (error) {
        console.error("Error loading guest notifications:", error);
      }
      return;
    }

    const loadNotifications = async () => {
      try {
        const data = await getUserNotifications(user.id);
        setNotifications(
          data.map((notif: any) => ({
            id: notif.id,
            type: notif.type as NotificationType,
            category: (notif.category || 'system') as NotificationCategory,
            title: notif.title,
            message: notif.message,
            timestamp: new Date(notif.created_at),
            read: notif.read,
            actionUrl: notif.action_url,
            attachmentUrl: notif.attachment_url,
            metadata: notif.metadata || {},
          }))
        );
      } catch (error) {
        console.error("Error loading notifications:", error);
      }
    };

    loadNotifications();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as any;
            const category = (newNotif.category || 'system') as NotificationCategory;
            const type = newNotif.type as NotificationType;
            playForNotification(category, type);
            setNotifications((prev) => [
              {
                id: newNotif.id,
                type,
                category,
                title: newNotif.title,
                message: newNotif.message,
                timestamp: new Date(newNotif.created_at),
                read: newNotif.read,
                actionUrl: newNotif.action_url,
                attachmentUrl: newNotif.attachment_url,
                metadata: newNotif.metadata || {},
              },
              ...prev,
            ]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotif = payload.new as any;
            setNotifications((prev) =>
              prev.map((notif) =>
                notif.id === updatedNotif.id
                  ? {
                      ...notif,
                      read: updatedNotif.read,
                    }
                  : notif
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedNotif = payload.old as any;
            setNotifications((prev) => prev.filter((notif) => notif.id !== deletedNotif.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addNotification = async (
    type: NotificationType, 
    title: string, 
    message: string,
    options?: {
      category?: NotificationCategory;
      actionUrl?: string;
      attachmentUrl?: string;
      metadata?: Notification['metadata'];
    }
  ) => {
    const category = options?.category || 'system';
    
    if (!user) {
      // For unauthenticated users, persist to localStorage
      const newNotification: Notification = {
        id: `${Date.now()}-${Math.random()}`,
        type,
        category,
        title,
        message,
        timestamp: new Date(),
        read: false,
        actionUrl: options?.actionUrl,
        attachmentUrl: options?.attachmentUrl,
        metadata: options?.metadata,
      };
      playForNotification(category, type);
      setNotifications((prev) => {
        const updated = [newNotification, ...prev].slice(0, 50); // Keep last 50
        localStorage.setItem(GUEST_NOTIFICATIONS_KEY, JSON.stringify(updated));
        return updated;
      });
      return;
    }

    try {
      await createNotificationDB(user.id, type, title, message, {
        category: options?.category,
        actionUrl: options?.actionUrl,
        attachmentUrl: options?.attachmentUrl,
        metadata: options?.metadata as Record<string, any>,
      });
      // Real-time subscription will handle adding to state
    } catch (error) {
      console.error("Error adding notification:", error);
    }
  };

  const markAsRead = async (id: string) => {
    if (!user) {
      // For unauthenticated users, update localStorage
      setNotifications((prev) => {
        const updated = prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif));
        localStorage.setItem(GUEST_NOTIFICATIONS_KEY, JSON.stringify(updated));
        return updated;
      });
      return;
    }

    try {
      await markNotificationAsReadDB(id);
      // Real-time subscription will handle updating state
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const removeNotification = async (id: string) => {
    if (!user) {
      // For unauthenticated users, remove from localStorage
      setNotifications((prev) => {
        const updated = prev.filter((notif) => notif.id !== id);
        localStorage.setItem(GUEST_NOTIFICATIONS_KEY, JSON.stringify(updated));
        return updated;
      });
      return;
    }

    try {
      await deleteNotificationDB(id);
      // Real-time subscription will handle removing from state
    } catch (error) {
      console.error("Error removing notification:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) {
      // For unauthenticated users, update localStorage
      setNotifications((prev) => {
        const updated = prev.map((notif) => ({ ...notif, read: true }));
        localStorage.setItem(GUEST_NOTIFICATIONS_KEY, JSON.stringify(updated));
        return updated;
      });
      return;
    }

    try {
      await markAllNotificationsAsReadDB(user.id);
      // Update local state immediately for better UX
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const clearAllByCategory = (category: NotificationCategory) => {
    if (!user) {
      setNotifications((prev) => {
        const updated = prev.filter((notif) => notif.category !== category);
        localStorage.setItem(GUEST_NOTIFICATIONS_KEY, JSON.stringify(updated));
        return updated;
      });
      return;
    }
    
    // For authenticated users, remove notifications by category
    notifications
      .filter(n => n.category === category)
      .forEach(n => removeNotification(n.id));
  };

  const getByCategory = (category: NotificationCategory): Notification[] => {
    if (category === 'all') return notifications;
    return notifications.filter(n => n.category === category);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        removeNotification,
        markAllAsRead,
        clearAllByCategory,
        unreadCount,
        getByCategory,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};