import { useState } from "react";
import { ThemeProvider } from "next-themes";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getBookingByReference } from "@/services/bookingService";
import { WorldClassBusTicket } from "@/components/tickets/WorldClassBusTicket";
import { WorldClassEventTicket } from "@/components/tickets/WorldClassEventTicket";
import { generateEnhancedPDF } from "@/utils/enhancedPdfGenerator";
import { downloadWalletPass } from "@/utils/walletPassGenerator";
import { BookingData } from "@/types/booking";
import { AlertCircle } from "lucide-react";
import BackButton from "@/components/BackButton";

const RetrieveBooking = () => {
  const [email, setEmail] = useState("");
  const [reference, setReference] = useState("");
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRetrieve = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await getBookingByReference(email, reference);

    if (fetchError || !data) {
      setError("Booking not found. Please check your email and reference code.");
      setBooking(null);
    } else {
      setBooking(data);
    }

    setLoading(false);
  };

  const handleDownloadPDF = async () => {
    if (!booking) return;
    await generateEnhancedPDF({
      bookingReference: booking.booking_reference,
      ticketNumber: booking.ticket_number,
      itemName: booking.item_name,
      passengerName: booking.passenger_name,
      passengerEmail: booking.passenger_email,
      passengerPhone: booking.passenger_phone,
      totalPrice: booking.total_price,
      currency: 'ZAR',
      type: booking.booking_type,
      from: booking.from_location,
      to: booking.to_location,
      date: booking.travel_date,
      departureTime: booking.departure_time,
      arrivalTime: booking.arrival_time,
      selectedSeats: booking.selected_seats,
      operator: booking.operator,
    });
  };

  const handleDownloadWallet = async () => {
    if (!booking) return;
    await downloadWalletPass({
      bookingReference: booking.booking_reference,
      ticketNumber: booking.ticket_number,
      itemName: booking.item_name,
      passengerName: booking.passenger_name,
      passengerEmail: booking.passenger_email,
      passengerPhone: booking.passenger_phone,
      type: booking.booking_type,
      from: booking.from_location,
      to: booking.to_location,
      date: booking.travel_date,
      departureTime: booking.departure_time,
      seats: booking.selected_seats,
    });
  };

  const mapToBookingData = (data: any): BookingData => ({
    type: data.booking_type,
    itemId: data.item_id,
    itemName: data.item_name,
    selectedSeats: data.selected_seats,
    ticketQuantity: data.ticket_quantity,
    passengerName: data.passenger_name,
    passengerEmail: data.passenger_email,
    passengerPhone: data.passenger_phone,
    passportNumber: data.passport_number,
    nextOfKinNumber: data.next_of_kin_number,
    whatsappNumber: data.whatsapp_number,
    finalDestinationCity: data.final_destination_city,
    isReturnTicket: data.is_return_ticket,
    returnDate: data.return_date,
    numberOfAdults: data.number_of_adults,
    numberOfChildren: data.number_of_children,
    numberOfBags: data.number_of_bags,
    luggageWeight: data.luggage_weight,
    passengers: data.additional_passengers,
    totalPrice: data.total_price,
    departureTime: data.departure_time,
    arrivalTime: data.arrival_time,
    operator: data.operator,
    from: data.from_location,
    to: data.to_location,
    date: data.travel_date,
    seatPreferences: data.seat_preferences,
    flexiOptions: data.flexi_options,
    selectedMeals: data.selected_meals,
    specialAssistance: data.special_assistance,
    petTravel: data.pet_travel,
    groupDiscount: data.group_discount,
  });

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
          <BackButton fallbackPath="/" className="mb-4" />
          <h1 className="text-3xl font-bold mb-6">Retrieve Your Booking</h1>

          {!booking ? (
            <Card className="p-6">
              <form onSubmit={handleRetrieve} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="reference">Booking Reference</Label>
                  <Input
                    id="reference"
                    value={reference}
                    onChange={(e) => setReference(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    6-character code from your confirmation
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !email || reference.length !== 6}
                >
                  {loading ? "Retrieving..." : "Retrieve Booking"}
                </Button>
              </form>
            </Card>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Booking Reference:</strong> {booking.booking_reference}
                </AlertDescription>
              </Alert>
              {booking.booking_type === 'bus' ? (
                <WorldClassBusTicket
                  bookingData={mapToBookingData(booking)}
                  ticketNumber={booking.ticket_number}
                  bookingReference={booking.booking_reference}
                  reservationType={booking.reservation_type}
                  onDownloadPDF={handleDownloadPDF}
                  onDownloadWallet={handleDownloadWallet}
                />
              ) : (
                <WorldClassEventTicket
                  booking={{
                    id: booking.id,
                    booking_reference: booking.booking_reference,
                    ticket_number: booking.ticket_number,
                    item_name: booking.item_name,
                    event_date: booking.event_date,
                    event_time: booking.event_time,
                    event_venue: booking.event_venue,
                    passenger_name: booking.passenger_name,
                    passenger_email: booking.passenger_email,
                    ticket_quantity: booking.ticket_quantity,
                    selected_seats: booking.selected_seats,
                    total_price: booking.total_price,
                    status: booking.status,
                    qr_code_data: booking.qr_code_data,
                    checked_in: booking.checked_in,
                    reservation_type: booking.reservation_type,
                  }}
                  onDownloadPDF={handleDownloadPDF}
                  onDownloadWallet={handleDownloadWallet}
                />
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setBooking(null);
                  setEmail("");
                  setReference("");
                }}
              >
                Search Another Booking
              </Button>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default RetrieveBooking;
