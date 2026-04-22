import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import QRCode from "react-qr-code";
import Barcode from "react-barcode";
import { BookingData } from "@/types/booking";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Copy, Share2, Mail, Twitter, Bus, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReservationCountdown from "@/components/ReservationCountdown";

interface BusTicketProps {
  bookingData: BookingData;
  ticketNumber: string;
  reservationType?: string;
  reservationExpiresAt?: string;
  cashPaymentDeadline?: string;
}

const BusTicket = ({ bookingData, ticketNumber, reservationType, reservationExpiresAt, cashPaymentDeadline }: BusTicketProps) => {
  const { convertPrice } = useCurrency();
  const { toast } = useToast();
  const isCashReservation = reservationType === 'cash_reserved';

  const handleCopyTicketNumber = () => {
    navigator.clipboard.writeText(ticketNumber);
    toast({
      title: "Copied!",
      description: "Ticket number copied to clipboard",
    });
  };

  const handleShare = (platform: string) => {
    const text = `My bus ticket: ${ticketNumber}\n${bookingData.from} → ${bookingData.to}\nDeparture: ${bookingData.departureTime}`;
    const url = window.location.href;
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=Bus Ticket ${ticketNumber}&body=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
        break;
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-background rounded-lg shadow-lg overflow-hidden print:shadow-none print:max-w-full">
      {/* Share and Copy Buttons */}
      <div className="flex flex-wrap gap-2 p-3 sm:p-4 bg-muted/50 print:hidden border-b">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare("whatsapp")}
          className="flex-1 min-w-[80px] text-xs sm:text-sm h-8 sm:h-9"
        >
          <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          WhatsApp
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare("email")}
          className="flex-1 min-w-[80px] text-xs sm:text-sm h-8 sm:h-9"
        >
          <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Email
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare("facebook")}
          className="flex-1 min-w-[80px] text-xs sm:text-sm h-8 sm:h-9"
        >
          <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Facebook
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare("twitter")}
          className="flex-1 min-w-[80px] text-xs sm:text-sm h-8 sm:h-9"
        >
          <Twitter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Twitter
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyTicketNumber}
          className="flex-1 min-w-[80px] text-xs sm:text-sm h-8 sm:h-9"
        >
          <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Copy #
        </Button>
      </div>

      {/* Header with Logo */}
      <div className="bg-primary text-primary-foreground p-4 sm:p-6 text-center">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
          <Bus className="h-6 w-6 sm:h-8 sm:w-8" />
          <h1 className="text-xl sm:text-2xl font-bold">{bookingData.itemName}</h1>
        </div>
        <p className="text-xs sm:text-sm opacity-90">Your Journey, Our Priority</p>
        <a 
          href="https://www.fulticket.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs sm:text-sm opacity-90 hover:opacity-100 transition-opacity inline-block mt-1"
        >
          www.fulticket.com
        </a>
      </div>

      {/* Ticket Number */}
      <div className="bg-muted/50 p-3 sm:p-4 border-b">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Ticket Number</p>
            <p className="text-sm sm:text-lg font-mono font-bold break-all">{ticketNumber}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyTicketNumber}
            className="shrink-0 h-8 w-8 sm:h-9 sm:w-9"
          >
            <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Cash Reservation Warning */}
      {isCashReservation && reservationExpiresAt && (
        <div className="bg-orange-500/10 border-y border-orange-500/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30">
                  CASH RESERVATION - PAYMENT PENDING
                </Badge>
                <ReservationCountdown expiresAt={new Date(reservationExpiresAt)} variant="warning" />
              </div>
              <div className="text-sm space-y-1">
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  Important: This is a cash reservation. Payment is required to confirm your booking.
                </p>
                <p className="text-orange-700 dark:text-orange-300">
                  Payment Deadline: {cashPaymentDeadline ? new Date(cashPaymentDeadline).toLocaleString() : 'See reservation expiry'}
                </p>
                <p className="text-orange-600 dark:text-orange-400 text-xs">
                  Visit our office or authorized agent to complete your cash payment before the deadline. Failure to pay will result in automatic cancellation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Journey Details */}
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">From</p>
            <p className="font-semibold text-sm sm:text-base">{bookingData.from}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">To</p>
            <p className="font-semibold text-sm sm:text-base">{bookingData.to}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Departure</p>
            <p className="font-semibold text-sm sm:text-base">{bookingData.departureTime}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">{bookingData.date}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Arrival</p>
            <p className="font-semibold text-sm sm:text-base">{bookingData.arrivalTime}</p>
          </div>
        </div>

        {bookingData.selectedSeats && bookingData.selectedSeats.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Seat(s)</p>
              <p className="font-semibold text-sm sm:text-base">{bookingData.selectedSeats.join(", ")}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Type</p>
              <p className="font-semibold text-sm sm:text-base">{bookingData.isReturnTicket ? "Return" : "One-way"}</p>
            </div>
          </div>
        )}

        {bookingData.isReturnTicket && (
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Return Date</p>
            <p className="font-semibold text-sm sm:text-base">{bookingData.returnDate}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Passengers</p>
            <p className="font-semibold text-sm sm:text-base">
              {bookingData.numberOfAdults} Adult(s)
              {bookingData.numberOfChildren ? `, ${bookingData.numberOfChildren} Child(ren)` : ""}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Luggage</p>
            <p className="font-semibold text-sm sm:text-base">
              {bookingData.numberOfBags} bag(s) ({bookingData.luggageWeight}kg)
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Final Destination</p>
          <p className="font-semibold text-sm sm:text-base">{bookingData.finalDestinationCity}</p>
        </div>

        {bookingData.selectedMeals && bookingData.selectedMeals.length > 0 && (
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Meals</p>
            <div className="space-y-1">
              {bookingData.selectedMeals.map((meal, index) => (
                <p key={index} className="text-xs sm:text-sm">• {meal.name}</p>
              ))}
            </div>
          </div>
        )}

        {bookingData.flexiOptions && (bookingData.flexiOptions.flexiTicket || bookingData.flexiOptions.cancellationInsurance) && (
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Booking Options</p>
            <div className="space-y-1 text-xs sm:text-sm">
              {bookingData.flexiOptions.flexiTicket && <p>• Flexi-Ticket</p>}
              {bookingData.flexiOptions.cancellationInsurance && <p>• Cancellation Insurance</p>}
              {bookingData.flexiOptions.payLater && <p>• Book Now, Pay Later</p>}
            </div>
          </div>
        )}

        {bookingData.petTravel && bookingData.petTravel.hasPet && (
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Pet Travel</p>
            <p className="text-xs sm:text-sm">{bookingData.petTravel.petType} ({bookingData.petTravel.petWeight}kg)</p>
          </div>
        )}
      </div>

      {/* Passenger Details */}
      <div className="border-t p-4 sm:p-6 bg-muted/50">
        <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Passenger Information</h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Primary Passenger</p>
            <p className="font-medium text-sm sm:text-base">{bookingData.passengerName}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="break-all">{bookingData.passengerEmail}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p>{bookingData.passengerPhone}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Passport</p>
              <p>{bookingData.passportNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">WhatsApp</p>
              <p>{bookingData.whatsappNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Next of Kin</p>
              <p>{bookingData.nextOfKinNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Final Destination</p>
              <p>{bookingData.finalDestinationCity}</p>
            </div>
          </div>
          
          {bookingData.passengers && bookingData.passengers.length > 0 && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">Additional Passengers</p>
              {bookingData.passengers.map((passenger, index) => (
                <div key={index} className="mb-2 bg-background/50 p-2 rounded">
                  <p className="font-medium text-xs sm:text-sm">{index + 2}. {passenger.name}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] sm:text-xs text-muted-foreground mt-1">
                    <p className="break-all">Email: {passenger.email}</p>
                    <p>Passport: {passenger.passportNumber}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Total Price */}
      <div className="border-t p-4 sm:p-6">
        <div className="flex justify-between items-center">
          <span className="text-base sm:text-lg font-semibold">Total Amount:</span>
          <span className="text-xl sm:text-2xl font-bold text-primary">{convertPrice(bookingData.totalPrice)}</span>
        </div>
      </div>

      {/* QR Code and Barcode */}
      <div className="border-t p-4 sm:p-6 space-y-4 sm:space-y-6 bg-muted/30">
        <div className="flex justify-center">
          <div className="p-3 sm:p-4 bg-white dark:bg-gray-100 rounded-lg">
            <QRCode value={ticketNumber} size={120} className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px]" />
          </div>
        </div>
        
        <div className="flex justify-center overflow-x-auto">
          <div className="bg-white dark:bg-gray-100 p-2 sm:p-3 rounded-lg max-w-full">
            <Barcode 
              value={ticketNumber} 
              format="CODE128" 
              width={1.2} 
              height={50} 
              fontSize={10}
              displayValue={true}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-muted/50 p-3 sm:p-4 text-center text-xs sm:text-sm text-muted-foreground border-t">
        <p className="mb-1">Please arrive at least 30 minutes before departure</p>
        <p>Present this ticket at the boarding gate • Keep this ticket safe</p>
      </div>
    </div>
  );
};

export default BusTicket;
