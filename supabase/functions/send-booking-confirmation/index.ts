import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildPremiumEmail } from "../_shared/email-template.ts";

const BRANDED_SENDER = "fulticket <support@notify.fulticket.com>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BookingConfirmationRequest {
  bookingReference: string;
  passengerEmail: string;
  passengerName: string;
  passengerPhone?: string;
  itemName: string;
  bookingType: string;
  travelDate?: string;
  eventDate?: string;
  eventTime?: string;
  fromLocation?: string;
  toLocation?: string;
  venue?: string;
  totalPrice: number;
  ticketNumber: string;
  selectedSeats?: string[];
  departureTime?: string;
  arrivalTime?: string;
  checkInDate?: string;
  checkOutDate?: string;
  roomType?: string;
  guestCount?: number;
  propertyAddress?: string;
  workspaceDate?: string;
  timeSlot?: string;
  amenities?: string[];
  experienceDate?: string;
  experienceTime?: string;
  meetingPoint?: string;
  hostName?: string;
  numberOfGuests?: number;
  vehicleInfo?: string;
  pickupDate?: string;
  returnDate?: string;
  pickupLocation?: string;
  returnLocation?: string;
  transferRoute?: string;
  transferDate?: string;
  transferTime?: string;
  vehicleType?: string;
  airline?: string;
  flightNumber?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  departureDateTime?: string;
  arrivalDateTime?: string;
  heroImageUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const b: BookingConfirmationRequest = await req.json();
    console.log(`Sending booking confirmation to ${b.passengerEmail}`);

    const bt = b.bookingType;
    const details: { label: string; value: string }[] = [
      { label: "Guest", value: b.passengerName },
    ];

    if (bt === 'bus') {
      if (b.fromLocation && b.toLocation) details.push({ label: "Route", value: `${b.fromLocation} → ${b.toLocation}` });
      if (b.travelDate) details.push({ label: "Date", value: `${b.travelDate}${b.departureTime ? ` at ${b.departureTime}` : ''}` });
      if (b.arrivalTime) details.push({ label: "Arrival", value: b.arrivalTime });
      if (b.selectedSeats?.length) details.push({ label: "Seats", value: b.selectedSeats.join(', ') });
    } else if (bt === 'event') {
      details.push({ label: "Event", value: b.itemName });
      if (b.eventDate) details.push({ label: "Date & Time", value: `${b.eventDate}${b.eventTime ? ` at ${b.eventTime}` : ''}` });
      if (b.venue) details.push({ label: "Venue", value: b.venue });
      if (b.selectedSeats?.length) details.push({ label: "Seats", value: b.selectedSeats.join(', ') });
    } else if (bt === 'stay') {
      details.push({ label: "Property", value: b.itemName });
      if (b.propertyAddress) details.push({ label: "Address", value: b.propertyAddress });
      if (b.checkInDate) details.push({ label: "Check-in", value: b.checkInDate });
      if (b.checkOutDate) details.push({ label: "Check-out", value: b.checkOutDate });
      if (b.roomType) details.push({ label: "Room", value: b.roomType });
      if (b.guestCount) details.push({ label: "Guests", value: `${b.guestCount}` });
    } else if (bt === 'workspace') {
      details.push({ label: "Workspace", value: b.itemName });
      if (b.workspaceDate) details.push({ label: "Date", value: b.workspaceDate });
      if (b.timeSlot) details.push({ label: "Time Slot", value: b.timeSlot });
      if (b.venue) details.push({ label: "Location", value: b.venue });
    } else if (bt === 'experience') {
      details.push({ label: "Experience", value: b.itemName });
      if (b.hostName) details.push({ label: "Host", value: b.hostName });
      if (b.experienceDate) details.push({ label: "Date & Time", value: `${b.experienceDate}${b.experienceTime ? ` at ${b.experienceTime}` : ''}` });
      if (b.meetingPoint) details.push({ label: "Meeting Point", value: b.meetingPoint });
      if (b.numberOfGuests) details.push({ label: "Guests", value: `${b.numberOfGuests}` });
    } else if (bt === 'car' || bt === 'car_rental') {
      details.push({ label: "Vehicle", value: b.vehicleInfo || b.itemName });
      if (b.pickupDate && b.pickupLocation) details.push({ label: "Pickup", value: `${b.pickupDate} at ${b.pickupLocation}` });
      if (b.returnDate) details.push({ label: "Return", value: `${b.returnDate}${b.returnLocation ? ` at ${b.returnLocation}` : ''}` });
    } else if (bt === 'transfer') {
      details.push({ label: "Route", value: b.transferRoute || b.itemName });
      if (b.transferDate) details.push({ label: "Date & Time", value: `${b.transferDate}${b.transferTime ? ` at ${b.transferTime}` : ''}` });
      if (b.vehicleType) details.push({ label: "Vehicle", value: b.vehicleType });
    } else if (bt === 'flight') {
      if (b.airline) details.push({ label: "Airline", value: b.airline });
      if (b.flightNumber) details.push({ label: "Flight", value: b.flightNumber });
      if (b.departureAirport && b.arrivalAirport) details.push({ label: "Route", value: `${b.departureAirport} → ${b.arrivalAirport}` });
      if (b.departureDateTime) details.push({ label: "Departure", value: b.departureDateTime });
    } else {
      details.push({ label: "Service", value: b.itemName });
      if (b.travelDate) details.push({ label: "Date", value: b.travelDate });
      if (b.venue) details.push({ label: "Location", value: b.venue });
    }

    details.push({ label: "Ticket", value: b.ticketNumber });

    const htmlContent = buildPremiumEmail({
      type: 'confirmation',
      title: 'Booking Confirmed!',
      subtitle: b.itemName,
      reference: b.bookingReference,
      greeting: `Hi ${b.passengerName}, your booking is confirmed and your ticket is ready.`,
      details,
      heroImageUrl: b.heroImageUrl,
      totalLabel: 'Total Amount',
      totalValue: `$${b.totalPrice.toFixed(2)}`,
      totalBadge: 'CONFIRMED',
      alertText: 'Please arrive at least 30 minutes before departure. Bring a valid ID and your booking reference.',
      alertColor: 'warning',
      ctaLabel: 'View My Orders',
      ctaUrl: 'https://fulticket.com/orders',
    });

    // Send via Lovable Email queue
    const subject = `Booking Confirmed - ${b.itemName} | fulticket`;
    await supabase.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: { from: BRANDED_SENDER, to: [b.passengerEmail], subject, html: htmlContent },
    });
    console.log("Booking confirmation email enqueued");

    // Send SMS confirmation
    let smsSent = false;
    if (b.passengerPhone) {
      try {
        const smsMessage = `Booking confirmed! Ref: ${b.bookingReference}. ${b.itemName}. Ticket: ${b.ticketNumber}`;
        const smsRes = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-sms`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
            body: JSON.stringify({ action: "send", to: b.passengerPhone, message: smsMessage.slice(0, 160), context: "booking_confirmed", reference_id: b.bookingReference }),
          }
        );
        const smsResult = await smsRes.json();
        smsSent = smsResult.success === true;
      } catch (smsErr) {
        console.error("SMS error:", smsErr);
      }
    }

    // Send Telegram notification if user has linked account
    let telegramSent = false;
    if (b.passengerEmail) {
      try {
        const { data: userProfile } = await supabase.from("profiles").select("id").eq("email", b.passengerEmail).single();
        if (userProfile) {
          const { data: tgLink } = await supabase.from("telegram_user_links").select("telegram_chat_id, notification_preferences").eq("user_id", userProfile.id).eq("status", "active").single();
          if (tgLink && (tgLink.notification_preferences as any)?.bookings !== false) {
            const tgMessage = `✅ <b>Booking Confirmed!</b>\n\n📦 ${b.itemName}\n🎫 Ref: <code>${b.bookingReference}</code>\n💰 Total: $${b.totalPrice.toFixed(2)}\n🎟️ Ticket: <code>${b.ticketNumber}</code>`;
            const tgBody: any = { chat_id: tgLink.telegram_chat_id, text: tgMessage };
            if (b.heroImageUrl) tgBody.photo_url = b.heroImageUrl;
            const tgRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-telegram-message`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
              body: JSON.stringify(tgBody),
            });
            telegramSent = (await tgRes.json()).success === true;
          }
        }
      } catch (tgErr) {
        console.error("Telegram notification error:", tgErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Booking confirmation sent", sms_sent: smsSent, telegram_sent: telegramSent }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending booking confirmation:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
