import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ShareTicketParams {
  bookingId: string;
  shareType: 'view' | 'transfer';
  expiryHours?: number;
}

export interface TransferTicketParams {
  bookingId: string;
  toEmail: string;
  fromEmail: string;
}

/**
 * Generate a shareable link for a ticket
 */
export const generateShareLink = async (params: ShareTicketParams) => {
  const { bookingId, shareType, expiryHours = 72 } = params;

  try {
    // Generate unique token
    const token = generateShareToken();

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);

    // Insert into ticket_shares
    const { data, error } = await supabase
      .from('ticket_shares')
      .insert({
        booking_id: bookingId,
        share_token: token,
        share_type: shareType,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    const shareUrl = `${window.location.origin}/ticket/share/${token}`;
    return { shareUrl, token, expiresAt: data.expires_at };
  } catch (error) {
    console.error('Error generating share link:', error);
    throw error;
  }
};

/**
 * Get ticket by share token
 */
export const getSharedTicket = async (token: string) => {
  try {
    // Get share record
    const { data: shareData, error: shareError } = await supabase
      .from('ticket_shares')
      .select('*')
      .eq('share_token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (shareError) throw shareError;

    // Increment access count
    await supabase
      .from('ticket_shares')
      .update({ accessed_count: shareData.accessed_count + 1 })
      .eq('id', shareData.id);

    // Get booking details
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', shareData.booking_id)
      .single();

    if (bookingError) throw bookingError;

    return { booking: bookingData, share: shareData };
  } catch (error) {
    console.error('Error fetching shared ticket:', error);
    throw error;
  }
};

/**
 * Transfer ticket to another user
 */
export const transferTicket = async (params: TransferTicketParams) => {
  const { bookingId, toEmail, fromEmail } = params;

  try {
    // Get current booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError) throw fetchError;

    // Check transfer limit
    if (booking.transfer_count >= 2) {
      throw new Error('Maximum transfer limit reached (2 transfers allowed)');
    }

    // Update booking with transfer info
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        passenger_email: toEmail,
        transfer_count: booking.transfer_count + 1,
        transferred_from_email: fromEmail,
        transferred_to_email: toEmail,
        transfer_date: new Date().toISOString(),
        original_booking_id: booking.original_booking_id || booking.id
      })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    toast({
      title: "Ticket Transferred",
      description: `Ticket successfully transferred to ${toEmail}`,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error transferring ticket:', error);
    toast({
      title: "Transfer Failed",
      description: error.message || "Failed to transfer ticket",
      variant: "destructive",
    });
    throw error;
  }
};

/**
 * Share via email
 */
export const shareViaEmail = async (bookingId: string, recipientEmail: string) => {
  const { shareUrl } = await generateShareLink({ bookingId, shareType: 'view' });

  const subject = encodeURIComponent('Event Ticket');
  const body = encodeURIComponent(
    `Hi,\n\nI'd like to share my event ticket with you. You can view it here:\n${shareUrl}\n\nThis link will expire in 72 hours.\n\nBest regards`
  );

  window.open(`mailto:${recipientEmail}?subject=${subject}&body=${body}`, '_blank');
};

/**
 * Share via WhatsApp
 */
export const shareViaWhatsApp = async (bookingId: string, bookingData: any) => {
  const { shareUrl } = await generateShareLink({ bookingId, shareType: 'view' });

  const message = encodeURIComponent(
    `🎟️ ${bookingData.item_name}\n📅 ${new Date(bookingData.event_date).toLocaleDateString()}\n🕐 ${bookingData.event_time}\n📍 ${bookingData.event_venue}\n\nView ticket: ${shareUrl}`
  );

  window.open(`https://wa.me/?text=${message}`, '_blank');
};

/**
 * Share on social media
 */
export const shareOnSocial = (platform: 'facebook' | 'twitter', bookingData: any) => {
  const text = `I'm going to ${bookingData.item_name}! 🎉`;
  const url = window.location.origin;

  if (platform === 'facebook') {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  } else if (platform === 'twitter') {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  }
};

/**
 * Copy share link to clipboard
 */
export const copyShareLink = async (bookingId: string) => {
  const { shareUrl } = await generateShareLink({ bookingId, shareType: 'view' });

  await navigator.clipboard.writeText(shareUrl);

  toast({
    title: "Link Copied",
    description: "Share link copied to clipboard",
  });

  return shareUrl;
};

/**
 * Generate unique share token
 */
const generateShareToken = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * Validate ticket by reference and email
 */
export const validateTicket = async (bookingReference: string, email: string) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_reference', bookingReference)
      .eq('passenger_email', email)
      .single();

    if (error) throw error;

    return {
      valid: true,
      booking: data,
      status: data.status,
      checkedIn: data.checked_in
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid booking reference or email'
    };
  }
};
