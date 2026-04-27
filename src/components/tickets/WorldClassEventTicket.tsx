import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import QRCode from "react-qr-code";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Download,
  Share2,
  Copy,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  Star,
  MapPin,
  Calendar,
  Clock,
  Users,
  Ticket
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { TicketPurchaseDetails } from "./TicketPurchaseDetails";

interface WorldClassEventTicketProps {
  booking: {
    id: string;
    booking_reference: string;
    ticket_number: string;
    item_name: string;
    event_date: string;
    event_time: string;
    event_venue: string;
    event_category?: string;
    passenger_name: string;
    passenger_email: string;
    ticket_quantity: number;
    selected_seats?: string[];
    total_price: number;
    status: string;
    qr_code_data?: string;
    checked_in?: boolean;
    reservation_type?: string;
  };
  organizerImage?: string;
  organizerCode?: string;
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

export const WorldClassEventTicket = ({
  booking,
  organizerImage,
  organizerCode,
  purchaseChannel,
  agentCode,
  agentName,
  purchaseLocation,
  paymentMethod,
  paymentReference,
  purchasedAt,
  onDownloadPDF,
  onDownloadWallet
}: WorldClassEventTicketProps) => {
  const { convertPrice } = useCurrency();
  const { toast } = useToast();
  const isCashReservation = booking.reservation_type === 'cash_reserved';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(booking.booking_reference);
    toast({ title: "Copied!", description: "Reference copied" });
  };

  const handleShare = async () => {
    const text = `🎉 Event Ticket\n${booking.item_name}\n${formatDate(booking.event_date)} at ${booking.event_time}\n📍 ${booking.event_venue}\nBooking: ${booking.booking_reference}\n\nvia todapayments.com`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Event Ticket', text });
      } catch (error) {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard" });
      }
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard" });
    }
  };

  const getStatusBadge = () => {
    if (booking.checked_in) {
      return (
        <Badge className="bg-green-500/20 text-green-100 text-[10px] px-2 py-0.5">
          <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
          CHECKED IN
        </Badge>
      );
    }
    return (
      <Badge 
        variant="secondary" 
        className={`text-[10px] px-2 py-0.5 ${isCashReservation ? 'bg-orange-500/20 text-orange-100' : 'bg-white/20 text-white'}`}
      >
        {isCashReservation ? 'RESERVED' : 'ADMIT ' + booking.ticket_quantity}
      </Badge>
    );
  };

  return (
    <motion.div 
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 border-2 print:border shadow-lg">

        {/* Compact Header */}
        <div className="bg-gradient-to-r from-primary via-accent to-primary/80 text-primary-foreground px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {organizerImage ? (
                <img src={organizerImage} alt="" className="w-8 h-8 rounded-md object-cover bg-white/20" />
              ) : (
                <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center">
                  <Star className="h-4 w-4 fill-current" />
                </div>
              )}
              <div>
                <p className="font-bold text-sm">EVENT TICKET</p>
                <p className="text-[10px] opacity-80">fulticket</p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </div>

        {/* Event Name Banner */}
        <div className="bg-primary/5 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base leading-tight line-clamp-2 flex-1">{booking.item_name}</h2>
            {booking.event_category && (
              <Badge variant="secondary" className="text-[10px] shrink-0">{booking.event_category}</Badge>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1 text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <p className="text-xs truncate">{booking.event_venue}</p>
          </div>
          <p className="text-xs text-center text-primary font-medium mt-2">
            {formatDate(booking.event_date)} • {booking.event_time}
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
            <p className="font-mono font-bold text-base tracking-wide">{booking.booking_reference}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 w-7 p-0 print:hidden">
            <Copy className="h-3 w-3" />
          </Button>
        </div>

        {/* 3-Column Info Grid */}
        <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <p className="text-[10px] text-muted-foreground uppercase">Seats</p>
            <p className="font-bold text-primary text-sm">
              {booking.selected_seats?.join(", ") || "GA"}
            </p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <p className="text-[10px] text-muted-foreground uppercase">Qty</p>
            <p className="font-bold text-sm">{booking.ticket_quantity}</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <p className="text-[10px] text-muted-foreground uppercase">Time</p>
            <p className="font-bold text-sm">{booking.event_time}</p>
          </div>
        </div>

        {/* Attendee Row */}
        <div className="px-4 py-2 border-b border-dashed border-muted-foreground/20">
          <p className="text-[10px] text-muted-foreground uppercase">Attendee</p>
          <p className="font-semibold text-sm">{booking.passenger_name}</p>
          <p className="text-[10px] text-muted-foreground">{booking.passenger_email}</p>
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
              value={booking.qr_code_data || JSON.stringify({
                ref: booking.booking_reference,
                ticket: booking.ticket_number,
                type: 'EVENT',
                event: booking.item_name,
                date: booking.event_date,
                venue: booking.event_venue,
                seats: booking.selected_seats,
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
            <p className="text-[10px] text-muted-foreground">Scan at entrance</p>
            <p className="text-[10px] font-mono text-muted-foreground truncate mt-1">
              {booking.ticket_number.split('-').slice(-2).join('-')}
            </p>
          </div>
        </div>

        {/* Price Bar */}
        <div className="bg-muted/50 px-4 py-2 flex items-center justify-between border-t border-dashed border-muted-foreground/20">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Total</p>
            <p className="font-bold text-lg text-primary">{convertPrice(booking.total_price)}</p>
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
            ⚠️ Arrive 30 min early • Present ID at entrance • todapayments.com
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
