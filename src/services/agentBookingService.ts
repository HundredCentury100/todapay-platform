import { supabase } from "@/integrations/supabase/client";
import { BookingData } from "@/types/booking";
import { AgentClient } from "@/types/merchant";
import { createCommissionRecord } from "./agentCommissionService";
import {
  calculateVerticalCommission,
  calculateOverrideCommission,
  mapBookingTypeToVertical,
  canEarnOverrideCommission,
  type AgentTier,
  type AgentType,
} from "@/config/agentCommissionConfig";
import { generateEventTicketNumber, getOrganizerCodeByType } from "@/utils/ticketGenerator";

interface AgentBookingData extends BookingData {
  agentProfileId: string;
  agentCommissionRate: number;
  client: AgentClient;
}

export const createAgentBooking = async (
  bookingData: AgentBookingData,
  ticketNumber: string
): Promise<{ data: any; error: any; bookingReference?: string }> => {
  try {
    const generateQRCodeData = (bookingReference: string, bookingType: string, ticketNum: string): string | undefined => {
      if (bookingType === 'event') {
        return JSON.stringify({
          ref: bookingReference,
          ticket: ticketNum,
          type: 'EVENT',
          timestamp: Date.now(),
          platform: 'fulticket'
        });
      }
      return undefined;
    };

    // Fetch agent profile to get tier and type for vertical-aware commission
    const { data: agentProfile } = await supabase
      .from('merchant_profiles')
      .select('agent_tier, agent_type, role')
      .eq('id', bookingData.agentProfileId)
      .single();

    const agentTier = (agentProfile?.agent_tier as AgentTier) || 'standard';
    const agentType = (agentProfile?.agent_type as AgentType) || 'internal';

    // Calculate vertical-aware commission
    const vertical = mapBookingTypeToVertical(bookingData.type);
    const commissionResult = calculateVerticalCommission(
      bookingData.totalPrice,
      vertical,
      agentTier,
      agentType
    );

    const isPendingOnlinePayment = bookingData.reservationType === 'pending_payment';

    const bookingRecord = {
      user_id: null,
      guest_email: bookingData.passengerEmail,
      booking_type: bookingData.type,
      item_id: bookingData.itemId,
      item_name: bookingData.itemName,
      passenger_name: bookingData.passengerName,
      passenger_email: bookingData.passengerEmail,
      passenger_phone: bookingData.passengerPhone,
      passport_number: bookingData.passportNumber,
      next_of_kin_number: bookingData.nextOfKinNumber,
      whatsapp_number: bookingData.whatsappNumber,
      operator: bookingData.operator,
      from_location: bookingData.from,
      to_location: bookingData.to,
      departure_time: bookingData.departureTime,
      arrival_time: bookingData.arrivalTime,
      travel_date: bookingData.date,
      selected_seats: bookingData.selectedSeats,
      ticket_quantity: bookingData.ticketQuantity,
      base_price: bookingData.totalPrice,
      total_price: bookingData.totalPrice,
      ticket_number: ticketNumber,
      payment_status: isPendingOnlinePayment ? 'pending' : 'paid',
      status: isPendingOnlinePayment ? 'pending' : 'confirmed',
      event_date: bookingData.type === 'event' ? bookingData.eventDate : null,
      event_time: bookingData.type === 'event' ? bookingData.eventTime : null,
      event_venue: bookingData.type === 'event' ? bookingData.venue : null,
      event_category: bookingData.type === 'event' ? bookingData.eventCategory : null,
      category_specific_data: bookingData.type === 'event' ? bookingData.categorySpecificData : null,
      accessibility_needs: bookingData.accessibilityNeeds || null,
      booked_by_agent_id: bookingData.agentProfileId,
      agent_commission_rate: commissionResult.effectiveRate,
      agent_client_id: bookingData.client.id,
    };

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingRecord)
      .select()
      .single();

    if (bookingError) {
      console.error('Booking error:', bookingError);
      return { data: null, error: bookingError };
    }

    // For event bookings, generate enhanced ticket number and QR code
    if (bookingData.type === 'event') {
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', bookingData.itemId)
        .single();

      if (eventData) {
        const organizerCode = eventData.organizer_code || getOrganizerCodeByType(eventData.type);
        const enhancedTicketNumber = generateEventTicketNumber({
          organizerCode,
          eventDate: eventData.event_date,
          eventTime: eventData.event_time,
          seatNumber: bookingData.selectedSeats?.[0],
        });

        const qrCodeData = generateQRCodeData(booking.booking_reference, 'event', enhancedTicketNumber);

        await supabase
          .from('bookings')
          .update({
            ticket_number: enhancedTicketNumber,
            qr_code_data: qrCodeData,
          })
          .eq('id', booking.id);
      }
    }

    // Create commission record with vertical-aware amount
    const commission = await createCommissionRecord(
      bookingData.agentProfileId,
      booking.id,
      bookingData.totalPrice,
      commissionResult.effectiveRate,
      commissionResult.commissionAmount
    );

    // Check for referral override commission (internal agents only)
    await processOverrideCommission(
      bookingData.agentProfileId,
      booking.id,
      bookingData.totalPrice,
      commissionResult.commissionAmount
    );

    // Get agent profile for notification
    const { data: notifProfile } = await supabase
      .from('merchant_profiles')
      .select('business_name, business_email')
      .eq('id', bookingData.agentProfileId)
      .single();

    if (notifProfile) {
      await supabase.from('agent_notifications').insert({
        agent_profile_id: bookingData.agentProfileId,
        notification_type: 'booking_created',
        title: 'New Booking Created',
        body: `Booking ${booking.booking_reference} created for ${bookingData.client.client_name}. Commission: $${commission.commission_amount.toFixed(2)}`,
        data: { 
          bookingReference: booking.booking_reference,
          clientName: bookingData.client.client_name,
          amount: bookingData.totalPrice,
          commission: commission.commission_amount
        }
      });

      await supabase.functions.invoke('send-agent-email', {
        body: {
          agentEmail: notifProfile.business_email,
          agentName: notifProfile.business_name,
          notificationType: 'booking_created',
          title: 'New Booking Created',
          body: `Booking ${booking.booking_reference} created for ${bookingData.client.client_name}`,
          data: { 
            bookingReference: booking.booking_reference,
            clientName: bookingData.client.client_name,
            amount: bookingData.totalPrice,
            commission: commission.commission_amount
          }
        }
      });
    }

    return {
      data: booking,
      error: null,
      bookingReference: booking.booking_reference
    };
  } catch (error: any) {
    console.error('Agent booking error:', error);
    return { data: null, error };
  }
};

/**
 * Process override commission for the referrer agent (if any).
 * Only internal agents earn override commissions, capped at 50% of sub-agent's commission.
 */
async function processOverrideCommission(
  subAgentProfileId: string,
  bookingId: string,
  bookingAmount: number,
  subAgentCommission: number
) {
  try {
    // Check if this agent was referred by another agent
    const { data: referral } = await supabase
      .from('agent_referrals')
      .select('referrer_agent_id')
      .eq('referred_agent_id', subAgentProfileId)
      .single();

    if (!referral) return;

    // Get referrer's agent type
    const { data: referrerProfile } = await supabase
      .from('merchant_profiles')
      .select('agent_type')
      .eq('id', referral.referrer_agent_id)
      .single();

    if (!referrerProfile) return;

    const referrerType = (referrerProfile.agent_type as AgentType) || 'external';
    
    if (!canEarnOverrideCommission(referrerType)) return;

    const overrideAmount = calculateOverrideCommission(
      bookingAmount,
      subAgentCommission,
      referrerType
    );

    if (overrideAmount <= 0) return;

    await supabase.from('agent_override_commissions').insert({
      referrer_agent_id: referral.referrer_agent_id,
      sub_agent_id: subAgentProfileId,
      booking_id: bookingId,
      override_amount: overrideAmount,
      override_rate: 2.5,
      status: 'pending',
    });
  } catch (error) {
    console.error('Override commission error (non-blocking):', error);
  }
}

export const calculateAgentCommissionPreview = (
  bookingAmount: number,
  commissionRate: number
): { commission: number; agentEarnings: number } => {
  const commission = bookingAmount * (commissionRate / 100);
  return {
    commission,
    agentEarnings: commission
  };
};
