import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import QRCode from "react-qr-code";
import { BookingData } from "@/types/booking";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Download,
  Share2,
  Copy,
  Smartphone,
  Bus,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Clock,
  MapPin,
  Users,
  Briefcase
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { TicketPurchaseDetails } from "./TicketPurchaseDetails";

interface WorldClassBusTicketProps {
  bookingData: BookingData;
  ticketNumber: string;
  bookingReference: string;
  reservationType?: string;
  operatorImage?: string;
  operatorCode?: string;
  purchaseChannel?: 'online' | 'agent' | 'pos';
  agentCode?: string;
  agentName?: string;
  purchaseLocation?: string;
  paymentMethod?: string;
  paymentReference?: string;
  purchasedAt?: string;
  onDownloadPDF: () => void;
  onDownloadWallet: () => void;
}

export const WorldClassBusTicket = ({
  bookingData,
  ticketNumber,
  bookingReference,
  reservationType,
  operatorImage,
  operatorCode,
  purchaseChannel,
  agentCode,
  agentName,
  purchaseLocation,
  paymentMethod,
  paymentReference,
  purchasedAt,
  onDownloadPDF,
  onDownloadWallet
}: WorldClassBusTicketProps) => {
  const { convertPrice } = useCurrency();
  const { toast } = useToast();
  const isCashReservation = reservationType === 'cash_reserved';

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingReference);
    toast({ title: "Copied!", description: "Reference copied" });
  };

  const handleShare = async () => {
    const text = `🚌 Bus Ticket\n${bookingData.from} → ${bookingData.to}\n${bookingData.date} at ${bookingData.departureTime}\nBooking: ${bookingReference}\n\nvia todapayments.com`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Bus Ticket', text });
      } catch (error) {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard" });
      }
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard" });
    }
  };

  return (
    <motion.div 
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 border-2 print:border shadow-lg">
        {/* Perforated Edge Effect */}
        <div className="absolute left-0 top-1/2 w-3 h-6 bg-background rounded-r-full -translate-y-1/2 -translate-x-1/2 border-r-2 border-dashed border-muted-foreground/20" />

        {/* Compact Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {operatorImage ? (
                <img src={operatorImage} alt="" className="w-8 h-8 rounded-md object-cover bg-white/20" />
              ) : (
                <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center">
                  <Bus className="h-4 w-4" />
                </div>
              )}
              <div>
                <p className="font-bold text-sm">BUS TICKET</p>
                <p className="text-[10px] opacity-80">{bookingData.operator || 'fulticket'}</p>
              </div>
            </div>
            <Badge 
              variant="secondary" 
              className={`text-[10px] px-2 py-0.5 ${isCashReservation ? 'bg-orange-500/20 text-orange-100' : 'bg-white/20 text-white'}`}
            >
              {isCashReservation ? 'RESERVED' : 'CONFIRMED'}
            </Badge>
          </div>
        </div>

        {/* Route Banner */}
        <div className="bg-primary/5 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase">From</p>
              <p className="font-bold text-sm truncate">{bookingData.from}</p>
            </div>
            <div className="flex-shrink-0 px-2">
              <ArrowRight className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-[10px] text-muted-foreground uppercase">To</p>
              <p className="font-bold text-sm truncate">{bookingData.to}</p>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-1">
            {bookingData.date} • {bookingData.departureTime}
          </p>
        </div>

        {/* Cash Reservation Alert - Compact */}
        {isCashReservation && (
          <div className="bg-orange-500/10 px-3 py-2 flex items-center gap-2 border-b border-orange-500/20">
            <AlertCircle className="h-3 w-3 text-orange-600 flex-shrink-0" />
            <p className="text-[10px] text-orange-700 dark:text-orange-300">
              Pay at office/agent to confirm
            </p>
          </div>
        )}

        {/* Booking Reference Row */}
        <div className="px-4 py-2 bg-muted/50 flex items-center justify-between border-b border-dashed border-muted-foreground/20">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Booking Ref</p>
            <p className="font-mono font-bold text-base tracking-wide">{bookingReference}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 w-7 p-0 print:hidden">
            <Copy className="h-3 w-3" />
          </Button>
        </div>

        {/* 3-Column Info Grid */}
        <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <p className="text-[10px] text-muted-foreground uppercase">Seat</p>
            <p className="font-bold text-primary text-sm">
              {bookingData.selectedSeats?.join(", ") || "Any"}
            </p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <p className="text-[10px] text-muted-foreground uppercase">Departs</p>
            <p className="font-bold text-sm">{bookingData.departureTime}</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <p className="text-[10px] text-muted-foreground uppercase">Arrives</p>
            <p className="font-bold text-sm">{bookingData.arrivalTime}</p>
          </div>
        </div>

        {/* Passenger Row */}
        <div className="px-4 py-2 border-b border-dashed border-muted-foreground/20">
          <p className="text-[10px] text-muted-foreground uppercase">Passenger</p>
          <p className="font-semibold text-sm">{bookingData.passengerName}</p>
          <p className="text-[10px] text-muted-foreground">{bookingData.passengerEmail}</p>
        </div>

        {/* Purchase Details */}
        <TicketPurchaseDetails
          purchaseChannel={purchaseChannel}
          agentCode={agentCode}
          agentName={agentName}
          purchaseLocation={purchaseLocation}
          paymentMethod={paymentMethod}
          paymentReference={paymentReference}
          purchasedAt={purchasedAt}
        />

        {/* QR Code Section - Compact */}
        <div className="px-4 py-3 flex items-center gap-4">
          <div className="bg-white p-2 rounded-lg shadow-sm flex-shrink-0">
            <QRCode
              value={JSON.stringify({
                ref: bookingReference,
                ticket: ticketNumber,
                type: 'BUS',
                from: bookingData.from,
                to: bookingData.to,
                date: bookingData.date,
                seats: bookingData.selectedSeats,
                platform: 'fulticket'
              })}
              size={80}
              level="M"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-green-600 mb-1">
              <CheckCircle2 className="h-3 w-3" />
              <span className="text-[10px] font-medium">Verified Ticket</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Scan at boarding</p>
            <p className="text-[10px] font-mono text-muted-foreground truncate mt-1">{ticketNumber}</p>
          </div>
        </div>

        {/* Price Bar */}
        <div className="bg-muted/50 px-4 py-2 flex items-center justify-between border-t border-dashed border-muted-foreground/20">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Total</p>
            <p className="font-bold text-lg text-primary">{convertPrice(bookingData.totalPrice)}</p>
          </div>
          {!isCashReservation && (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-[10px]">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              PAID
            </Badge>
          )}
        </div>

        {/* Compact Footer */}
        <div className="bg-muted/30 px-4 py-2 border-t">
          <p className="text-[9px] text-muted-foreground text-center">
            ⚠️ Arrive 30 min early • Present ID at boarding • todapayments.com
          </p>
        </div>
      </Card>

      {/* Floating Action Bar - Outside Card */}
      <div className="flex gap-2 mt-3 print:hidden">
        <Button onClick={onDownloadPDF} size="sm" className="flex-1 h-9">
          <Download className="h-3 w-3 mr-1" />
          <span className="text-xs">PDF</span>
        </Button>
        <Button onClick={onDownloadWallet} variant="outline" size="sm" className="flex-1 h-9">
          <Smartphone className="h-3 w-3 mr-1" />
          <span className="text-xs">Wallet</span>
        </Button>
        <Button onClick={handleShare} variant="outline" size="sm" className="flex-1 h-9">
          <Share2 className="h-3 w-3 mr-1" />
          <span className="text-xs">Share</span>
        </Button>
      </div>
    </motion.div>
  );
};
