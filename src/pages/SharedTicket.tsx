import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import { WorldClassEventTicket } from "@/components/tickets/WorldClassEventTicket";
import { generateEnhancedPDF } from "@/utils/enhancedPdfGenerator";
import { downloadWalletPass } from "@/utils/walletPassGenerator";
import { getSharedTicket } from "@/services/ticketSharingService";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SharedTicket = () => {
  const { token } = useParams<{ token: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!token) {
        setError("Invalid share link");
        setLoading(false);
        return;
      }

      try {
        const { booking: bookingData } = await getSharedTicket(token);
        setBooking(bookingData);
      } catch (err) {
        setError("This share link has expired or is invalid");
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [token]);

  const handleDownloadPDF = async () => {
    if (!booking) return;
    
    try {
      await generateEnhancedPDF({
        bookingReference: booking.booking_reference,
        ticketNumber: booking.ticket_number,
        itemName: booking.item_name,
        passengerName: booking.passenger_name,
        passengerEmail: booking.passenger_email,
        passengerPhone: booking.passenger_phone || '',
        totalPrice: booking.total_price,
        currency: 'ZAR',
        type: 'event',
        eventDate: booking.event_date,
        eventTime: booking.event_time,
        eventVenue: booking.event_venue,
        ticketQuantity: booking.ticket_quantity,
        selectedSeats: booking.selected_seats,
        qrCodeData: booking.qr_code_data,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handleDownloadWallet = async () => {
    if (!booking) return;
    await downloadWalletPass({
      bookingReference: booking.booking_reference,
      ticketNumber: booking.ticket_number,
      itemName: booking.item_name,
      passengerName: booking.passenger_name,
      passengerEmail: booking.passenger_email,
      passengerPhone: booking.passenger_phone || '',
      type: 'event',
      eventDate: booking.event_date,
      eventTime: booking.event_time,
      eventVenue: booking.event_venue,
      seats: booking.selected_seats,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading ticket...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error || "Ticket not found"}</AlertDescription>
            </Alert>
            <Button
              onClick={() => window.location.href = "/"}
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Go to Homepage
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <BackButton fallbackPath="/" />
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Shared Event Ticket</h1>
            <p className="text-muted-foreground">
              This ticket has been shared with you. You can view and download it.
            </p>
          </div>

          <WorldClassEventTicket
            booking={booking}
            onDownloadPDF={handleDownloadPDF}
            onDownloadWallet={handleDownloadWallet}
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.href = "/"}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Book Your Own Tickets
            </Button>
          </div>

          <Alert>
            <AlertDescription>
              ℹ️ This is a view-only shared ticket. To transfer ownership, the original ticket holder must use the transfer feature.
            </AlertDescription>
          </Alert>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SharedTicket;
