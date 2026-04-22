import { supabase } from "@/integrations/supabase/client";

// ============================================
// HELPERS
// ============================================

/** Build a short Google Maps directions link for SMS */
function mapsLink(address?: string, lat?: number, lng?: number): string {
  if (lat && lng) {
    return `https://maps.google.com/?q=${lat},${lng}`;
  }
  if (address) {
    return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  }
  return '';
}

// ============================================
// USER NOTIFICATIONS
// ============================================

type UserNotificationType = 
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_reminder'
  | 'ride_update'
  | 'ride_completed'
  | 'ride_receipt'
  | 'payment_received'
  | 'refund_processed'
  | 'bill_payment'
  | 'bill_payment_pending'
  | 'wallet_topup'
  | 'promotional';

interface SendUserNotificationParams {
  userId: string;
  userEmail?: string;
  userPhone?: string;
  notificationType: UserNotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  sendEmail?: boolean;
  sendPush?: boolean;
  sendSms?: boolean;
  smsMessage?: string;
}

export const sendUserNotification = async (params: SendUserNotificationParams) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-user-notification', {
      body: {
        userId: params.userId,
        userEmail: params.userEmail,
        notificationType: params.notificationType,
        title: params.title,
        body: params.body,
        data: params.data,
        sendEmail: params.sendEmail,
        sendPush: params.sendPush,
        // SMS is handled by the edge function automatically — do NOT send separately
      },
    });

    if (error) {
      console.error('Notification error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, ...data };
  } catch (err) {
    console.error('Failed to send notification:', err);
    return { success: false, error: 'Failed to send notification' };
  }
};

export const sendBookingConfirmedNotification = async (
  userId: string,
  userEmail: string,
  bookingReference: string,
  itemName: string,
  venue?: string
) => {
  const venueLink = venue ? ` Location: ${mapsLink(venue)}` : '';
  return sendUserNotification({
    userId,
    userEmail,
    notificationType: 'booking_confirmed',
    title: 'Booking Confirmed!',
    body: `Your booking for ${itemName} has been confirmed.`,
    data: { bookingReference, itemName, venue },
    sendSms: true,
    smsMessage: `fulticket: Booking ${bookingReference} confirmed for ${itemName}.${venueLink}`,
  });
};

export const sendRideUpdateNotification = async (
  userId: string,
  title: string,
  body: string,
  rideId: string,
  pickupAddress?: string,
  driverName?: string
) => {
  const pickupLink = pickupAddress ? ` Pickup: ${mapsLink(pickupAddress)}` : '';
  return sendUserNotification({
    userId,
    notificationType: 'ride_update',
    title,
    body,
    data: { rideId, pickupAddress, driverName },
    sendEmail: false,
    sendSms: true,
    smsMessage: `fulticket: ${body}${driverName ? ` Driver: ${driverName}.` : ''}${pickupLink}`,
  });
};

export const sendRideCompletedNotification = async (
  userId: string,
  userEmail: string,
  rideId: string,
  receiptNumber: string,
  pickupAddress: string,
  dropoffAddress: string,
  totalAmount: number,
  driverName: string
) => {
  const dropoffLink = mapsLink(dropoffAddress);
  return sendUserNotification({
    userId,
    userEmail,
    notificationType: 'ride_completed',
    title: 'Ride Completed! 🚗',
    body: `Your ride with ${driverName} is complete. Total: $${totalAmount.toFixed(2)}`,
    data: { 
      rideId, 
      receiptNumber,
      pickupAddress,
      dropoffAddress,
      totalAmount,
      driverName,
      ticketType: 'ride'
    },
    sendEmail: true,
    sendPush: true,
    sendSms: true,
    smsMessage: `fulticket: Ride complete with ${driverName}. Total: $${totalAmount.toFixed(2)}. Receipt: ${receiptNumber}. ${dropoffLink}`,
  });
};

export const sendRideReceiptNotification = async (
  userId: string,
  userEmail: string,
  receiptNumber: string,
  totalAmount: number,
  pickupAddress: string,
  dropoffAddress: string
) => {
  return sendUserNotification({
    userId,
    userEmail,
    notificationType: 'ride_receipt',
    title: 'Your Ride Receipt',
    body: `Receipt ${receiptNumber} - $${totalAmount.toFixed(2)}`,
    data: { 
      receiptNumber,
      totalAmount,
      pickupAddress,
      dropoffAddress,
      ticketType: 'ride'
    },
    sendEmail: true,
  });
};

export const sendPaymentReceivedNotification = async (
  userId: string,
  userEmail: string,
  amount: number,
  reference: string
) => {
  return sendUserNotification({
    userId,
    userEmail,
    notificationType: 'payment_received',
    title: 'Payment Received',
    body: `We've received your payment of $${amount.toFixed(2)}.`,
    data: { amount, reference },
  });
};

export const sendRefundNotification = async (
  userId: string,
  userEmail: string,
  amount: number,
  bookingReference: string
) => {
  return sendUserNotification({
    userId,
    userEmail,
    notificationType: 'refund_processed',
    title: 'Refund Processed',
    body: `Your refund of $${amount.toFixed(2)} has been processed.`,
    data: { amount, bookingReference },
  });
};

export const sendBookingReminderNotification = async (
  userId: string,
  userEmail: string,
  itemName: string,
  departureTime: string,
  bookingReference: string,
  venue?: string
) => {
  const venueLink = venue ? ` Location: ${mapsLink(venue)}` : '';
  return sendUserNotification({
    userId,
    userEmail,
    notificationType: 'booking_reminder',
    title: 'Upcoming Trip Reminder',
    body: `Don't forget! Your ${itemName} trip is coming up.`,
    data: { itemName, departureTime, bookingReference, venue },
    sendSms: true,
    smsMessage: `fulticket: Reminder - ${itemName} on ${departureTime}. Ref: ${bookingReference}.${venueLink}`,
  });
};

export const sendBillPaymentNotification = async (
  userId: string,
  userEmail: string,
  billerName: string,
  accountNumber: string,
  amount: number,
  currency: string,
  transactionReference: string,
  tokens?: string[],
  kwh?: string
) => {
  return sendUserNotification({
    userId,
    userEmail,
    notificationType: 'bill_payment',
    title: `${billerName} Payment Confirmed`,
    body: `Your payment of ${currency} ${amount.toFixed(2)} to ${billerName} has been confirmed.`,
    data: { billerName, accountNumber, amount, currency, transactionReference, tokens, kwh },
    sendEmail: true,
    sendPush: true,
    sendSms: true,
    smsMessage: `fulticket: ${billerName} payment of ${currency} ${amount.toFixed(2)} confirmed. Ref: ${transactionReference}${tokens?.length ? '. Token: ' + tokens[0] : ''}`,
  });
};

export const sendBillPaymentPendingNotification = async (
  userId: string,
  userEmail: string,
  billerName: string,
  accountNumber: string,
  amount: number,
  currency: string
) => {
  return sendUserNotification({
    userId,
    userEmail,
    notificationType: 'bill_payment_pending',
    title: `${billerName} Payment Processing`,
    body: `Your payment of ${currency} ${amount.toFixed(2)} to ${billerName} is being processed.`,
    data: { billerName, accountNumber, amount, currency },
    sendEmail: true,
    sendPush: true,
  });
};

export const sendWalletTopUpNotification = async (
  userId: string,
  userEmail: string,
  amount: number,
  newBalance: number,
  paymentReference: string
) => {
  return sendUserNotification({
    userId,
    userEmail,
    notificationType: 'wallet_topup',
    title: 'Wallet Top-up Confirmed',
    body: `$${amount.toFixed(2)} has been added to your wallet. New balance: $${newBalance.toFixed(2)}`,
    data: { amount, newBalance, paymentReference },
    sendEmail: true,
    sendPush: true,
  });
};

// ============================================
// AGENT/MERCHANT PUSH SUBSCRIPTION
// ============================================

export const subscribeToWebPush = async (agentProfileId: string) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported');
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await (registration as any).pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
      ),
    });

    // Save subscription to database
    const { error } = await supabase
      .from('agent_push_tokens')
      .upsert({
        agent_profile_id: agentProfileId,
        token: JSON.stringify(subscription),
        device_type: 'web',
        last_used_at: new Date().toISOString(),
      }, {
        onConflict: 'token'
      });

    if (error) throw error;

    console.log('Push subscription saved');
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
  }
};

// ============================================
// USER PUSH SUBSCRIPTION
// ============================================

export const subscribeUserToWebPush = async (userId: string) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported');
    return { success: false, reason: 'not_supported' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return { success: false, reason: 'permission_denied' };
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await (registration as any).pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
      ),
    });

    const subscriptionData = subscription.toJSON();

    // Save subscription to database
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscriptionData.endpoint,
        p256dh_key: subscriptionData.keys?.p256dh,
        auth_key: subscriptionData.keys?.auth,
        is_active: true,
        last_used_at: new Date().toISOString(),
      }, {
        onConflict: 'endpoint'
      });

    if (error) throw error;

    console.log('User push subscription saved');
    return { success: true };
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return { success: false, reason: 'error' };
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const urlBase64ToUint8Array = (base64String: string) => {
  if (!base64String) return new Uint8Array();
  
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

// ============================================
// AGENT NOTIFICATIONS
// ============================================

type AgentNotificationType = 
  | 'new_booking' 
  | 'payout_approved' 
  | 'payout_rejected' 
  | 'commission_approved' 
  | 'tier_upgraded' 
  | 'client_message';

export const sendAgentNotification = async (
  agentProfileId: string,
  notificationType: AgentNotificationType,
  title: string,
  body: string,
  data?: Record<string, any>
) => {
  try {
    const { data: response, error } = await supabase.functions.invoke('send-agent-notification', {
      body: {
        agentProfileId,
        notificationType,
        title,
        body,
        data,
      },
    });

    if (error) {
      console.error('Agent notification error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, ...response };
  } catch (err) {
    console.error('Failed to send agent notification:', err);
    return { success: false, error: 'Failed to send notification' };
  }
};
