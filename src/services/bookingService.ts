import { supabase } from "@/integrations/supabase/client";
import { BookingData } from "@/types/booking";
import { generateEventTicketNumber, generateBusTicketNumber, getOrganizerCodeByType, getOperatorCodeFromName } from "@/utils/ticketGenerator";


// Generate QR code data for event bookings
const generateQRCodeData = (bookingReference: string, bookingType: string, ticketNumber: string): string | undefined => {
  if (bookingType === 'event') {
    // Create a secure QR code JSON string with comprehensive ticket data
    const qrData = {
      ref: bookingReference,
      ticket: ticketNumber,
      type: 'EVENT',
      timestamp: Date.now(),
      platform: 'fulticket'
    };
    return JSON.stringify(qrData);
  }
  return undefined;
};

export const createBooking = async (
  bookingData: BookingData,
  ticketNumber: string
): Promise<{ data: any; error: any; bookingReference?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // First insert to get the booking reference
    const isCashReservation = bookingData.reservationType === 'cash_reserved';
    // For online payments, reservation_type is 'paid' but payment_status is 'pending'
    
    const bookingRecord = {
      user_id: user?.id || null,
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
      final_destination_city: bookingData.finalDestinationCity,
      is_return_ticket: bookingData.isReturnTicket,
      return_date: bookingData.returnDate,
      number_of_adults: bookingData.numberOfAdults,
      number_of_children: bookingData.numberOfChildren,
      number_of_bags: bookingData.numberOfBags,
      luggage_weight: bookingData.luggageWeight,
      ticket_quantity: bookingData.ticketQuantity,
      base_price: bookingData.totalPrice,
      total_price: bookingData.totalPrice,
      group_discount: bookingData.groupDiscount,
      status: isCashReservation ? 'pending' : 'confirmed',
      payment_status: isCashReservation ? 'pending' : 'paid',
      reservation_type: bookingData.reservationType || 'paid',
      reservation_expires_at: bookingData.reservationExpiresAt || null,
      cash_payment_deadline: isCashReservation ? bookingData.reservationExpiresAt : null,
      ticket_number: ticketNumber,
      seat_preferences: bookingData.seatPreferences as any,
      flexi_options: bookingData.flexiOptions as any,
      selected_meals: bookingData.selectedMeals as any,
      special_assistance: bookingData.specialAssistance as any,
      pet_travel: bookingData.petTravel as any,
      additional_passengers: bookingData.passengers as any,
      event_date: bookingData.type === 'event' ? bookingData.eventDate : null,
      event_time: bookingData.type === 'event' ? bookingData.eventTime : null,
      event_venue: bookingData.type === 'event' ? bookingData.venue : null,
      event_category: bookingData.type === 'event' ? bookingData.eventCategory : null,
      category_specific_data: bookingData.type === 'event' ? bookingData.categorySpecificData : null,
      accessibility_needs: bookingData.accessibilityNeeds ? bookingData.accessibilityNeeds : null,
    };
    
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingRecord])
      .select()
      .single();
    
    if (error || !data) {
      return { data: null, error };
    }

    // Generate enhanced ticket number based on booking type
    let enhancedTicketNumber = data.ticket_number;

    if (data.booking_type === 'bus') {
      // Get bus details for operator code
      const { data: busData } = await supabase
        .from('buses')
        .select('operator_code, operator')
        .eq('operator', data.operator)
        .maybeSingle();

      const operatorCode = busData?.operator_code || getOperatorCodeFromName(data.operator || 'BUS');
      
      enhancedTicketNumber = generateBusTicketNumber({
        operatorCode,
        travelDate: data.travel_date,
        departureTime: data.departure_time,
        seatNumber: data.selected_seats?.[0],
        sequenceNumber: parseInt(data.booking_reference.replace(/\D/g, '').substring(0, 3)) || undefined
      });

      // Update ticket number
      await supabase
        .from('bookings')
        .update({ ticket_number: enhancedTicketNumber })
        .eq('id', data.id);
    }

    // Send booking confirmation email
    try {
      await supabase.functions.invoke('send-booking-confirmation', {
        body: {
          bookingReference: data.booking_reference,
          passengerEmail: data.passenger_email,
          passengerName: data.passenger_name,
          itemName: data.item_name,
          bookingType: data.booking_type,
          travelDate: data.travel_date,
          eventDate: data.event_date,
          eventTime: data.event_time,
          fromLocation: data.from_location,
          toLocation: data.to_location,
          venue: data.event_venue,
          totalPrice: data.total_price,
          ticketNumber: data.ticket_number,
          selectedSeats: data.selected_seats,
          departureTime: data.departure_time,
          arrivalTime: data.arrival_time,
        }
      });
    } catch (emailError) {
      // Don't fail the booking if email fails
    }

    // Booking confirmation notification (fire-and-forget)
    if (user?.id) {
      supabase.from('user_notifications').insert({
        user_id: user.id,
        title: 'Booking Confirmed! 🎉',
        message: `Your booking for ${data.item_name} (${data.booking_reference}) has been confirmed.`,
        type: 'booking',
        category: 'booking',
        metadata: {
          type: 'booking_confirmation',
          bookingReference: data.booking_reference,
          itemName: data.item_name,
        }
      }).then(() => {});
    }

    // Update with QR code data and enhanced ticket number for event bookings
    if (data.booking_type === 'event') {
      // Get event details to generate enhanced ticket number
      const { data: eventData } = await supabase
        .from('events')
        .select('organizer_code, type')
        .eq('id', data.item_id)
        .single();

      const organizerCode = eventData?.organizer_code || getOrganizerCodeByType(eventData?.type || 'event');
      
      // Generate enhanced ticket number
      const enhancedTicketNumber = generateEventTicketNumber({
        organizerCode,
        eventDate: data.event_date,
        eventTime: data.event_time,
        seatNumber: data.selected_seats?.[0],
        sequenceNumber: parseInt(data.booking_reference.replace(/\D/g, '').substring(0, 4)) || undefined
      });

      const qrCodeData = generateQRCodeData(data.booking_reference, data.booking_type, enhancedTicketNumber);
      
      const { data: updatedData, error: updateError } = await supabase
        .from('bookings')
        .update({ 
          qr_code_data: qrCodeData,
          ticket_number: enhancedTicketNumber 
        })
        .eq('id', data.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Failed to update QR code:', updateError);
        // Still return the original data even if QR code update fails
      } else {
        return { 
          data: updatedData, 
          error: null, 
          bookingReference: updatedData?.booking_reference 
        };
      }
    }
    
    return { 
      data, 
      error: null, 
      bookingReference: data?.booking_reference 
    };
  } catch (error) {
    return { data: null, error };
  }
};

export const getUserBookings = async (
  status?: 'upcoming' | 'completed' | 'cancelled'
): Promise<{ data: any[]; error: any }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: [], error: new Error('Not authenticated') };
    }
    
    let query = supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (status === 'upcoming') {
      query = query.eq('status', 'confirmed');
    } else if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    return { data: data || [], error };
  } catch (error) {
    return { data: [], error };
  }
};

export const getBookingByReference = async (
  email: string,
  bookingReference: string
): Promise<{ data: any; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('guest_email', email.toLowerCase().trim())
      .eq('booking_reference', bookingReference.toUpperCase().trim())
      .maybeSingle();
    
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const cancelBooking = async (
  bookingId: string
): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', payment_status: 'refunded' })
      .eq('id', bookingId);
    
    return { error };
  } catch (error) {
    return { error };
  }
};

export const claimGuestBookings = async (
  userId: string,
  email: string
): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ user_id: userId })
      .eq('guest_email', email.toLowerCase())
      .is('user_id', null);
    
    return { error };
  } catch (error) {
    return { error };
  }
};

export const getUserStayBookings = async (): Promise<{ data: any[] | null; error: any }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('stay_bookings')
      .select(`
        *,
        booking:booking_id (*),
        property:property_id (id, name, address, city, images),
        room:room_id (id, name, room_type, max_guests)
      `)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error };

    // Filter by user bookings
    const userBookings = (data || []).filter(sb => sb.booking?.user_id === user.id);
    return { data: userBookings, error: null };
  } catch (error) {
    return { data: null, error };
  }
};
