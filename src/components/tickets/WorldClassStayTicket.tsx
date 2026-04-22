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
  Building2,
  Calendar,
  Moon,
  Users,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, parseISO } from "date-fns";
import { TicketPurchaseDetails } from "./TicketPurchaseDetails";

interface WorldClassStayTicketProps {
  booking: {
    id: string;
    booking_reference: string;
    ticket_number: string;
    item_name: string; // Property name
    check_in_date: string;
    check_out_date: string;
    property_address?: string;
    property_city?: string;
    room_name?: string;
    num_guests: number;
    num_rooms: number;
    passenger_name: string;
    passenger_email: string;
    total_price: number;
    status: string;
    qr_code_data?: string;
    checked_in?: boolean;
    reservation_type?: string;
    special_requests?: string;
  };
  propertyImage?: string;
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

export const WorldClassStayTicket = ({
  booking,
  propertyImage,
  purchaseChannel,
  agentCode,
  agentName,
  purchaseLocation,
  paymentMethod,
  paymentReference,
  purchasedAt,
  onDownloadPDF,
  onDownloadWallet
}: WorldClassStayTicketProps) => {
  const { convertPrice } = useCurrency();
  const { toast } = useToast();
  const isCashReservation = booking.reservation_type === 'cash_reserved';

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, 'EEE, MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const formatShortDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, 'MMM d');
    } catch {
      return dateStr;
    }
  };

  const calculateNights = () => {
    try {
      const checkIn = parseISO(booking.check_in_date);
      const checkOut = parseISO(booking.check_out_date);
      return differenceInDays(checkOut, checkIn);
    } catch {
      return 1;
    }
  };

  const nights = calculateNights();

  const handleCopy = () => {
    navigator.clipboard.writeText(booking.booking_reference);
    toast({ title: "Copied!", description: "Reference copied" });
  };

  const handleShare = async () => {
    const text = `🏨 Hotel Booking\n${booking.item_name}\n📍 ${booking.property_city || ''}\n📅 ${formatDate(booking.check_in_date)} - ${formatDate(booking.check_out_date)}\n${nights} night${nights > 1 ? 's' : ''}\nBooking: ${booking.booking_reference}\n\nvia fulticket.com`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Hotel Booking', text });
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
        {isCashReservation ? 'RESERVED' : 'CONFIRMED'}
      </Badge>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Mobile-First Single Viewport Ticket */}
      <Card className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 border-2 print:border">
        {/* Perforated Edge Effect */}
        <div className="absolute left-0 top-1/2 w-3 h-6 bg-background rounded-r-full -translate-y-1/2 -translate-x-1/2 border-r-2 border-dashed border-muted-foreground/20" />
        <div className="absolute right-0 top-1/2 w-3 h-6 bg-background rounded-l-full -translate-y-1/2 translate-x-1/2 border-l-2 border-dashed border-muted-foreground/20" />

        {/* Compact Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {propertyImage ? (
                <img src={propertyImage} alt="" className="w-8 h-8 rounded-md object-cover bg-white/20" />
              ) : (
                <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center">
                  <Building2 className="h-4 w-4" />
                </div>
              )}
              <div>
                <p className="font-bold text-sm">HOTEL BOOKING</p>
                <p className="text-[10px] opacity-80">fulticket</p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </div>

        {/* Property Name Banner */}
        <div className="bg-amber-500/5 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <h2 className="font-bold text-base leading-tight line-clamp-2">{booking.item_name}</h2>
          {booking.property_city && (
            <div className="flex items-center gap-1 mt-1 text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <p className="text-xs truncate">{booking.property_city}</p>
            </div>
          )}
          {booking.room_name && (
            <p className="text-xs text-primary font-medium mt-1">
              {booking.room_name}
            </p>
          )}
        </div>

        {/* Cash Reservation Alert - Compact */}
        {isCashReservation && (
          <div className="bg-orange-500/10 px-3 py-2 flex items-center gap-2 border-b border-orange-500/20">
            <AlertCircle className="h-3 w-3 text-orange-600 flex-shrink-0" />
            <p className="text-[10px] text-orange-700 dark:text-orange-300">
              Pay at property to confirm
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

        {/* Check-in / Check-out Section */}
        <div className="grid grid-cols-2 gap-2 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <div className="p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground uppercase">Check-in</p>
            </div>
            <p className="font-bold text-sm">{formatShortDate(booking.check_in_date)}</p>
            <p className="text-[10px] text-muted-foreground">From 14:00</p>
          </div>
          <div className="p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground uppercase">Check-out</p>
            </div>
            <p className="font-bold text-sm">{formatShortDate(booking.check_out_date)}</p>
            <p className="text-[10px] text-muted-foreground">Until 11:00</p>
          </div>
        </div>

        {/* 3-Column Info Grid */}
        <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <Moon className="h-4 w-4 mx-auto mb-1 text-amber-600" />
            <p className="text-[10px] text-muted-foreground uppercase">Nights</p>
            <p className="font-bold text-primary text-sm">{nights}</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <Users className="h-4 w-4 mx-auto mb-1 text-amber-600" />
            <p className="text-[10px] text-muted-foreground uppercase">Guests</p>
            <p className="font-bold text-sm">{booking.num_guests}</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <Building2 className="h-4 w-4 mx-auto mb-1 text-amber-600" />
            <p className="text-[10px] text-muted-foreground uppercase">Rooms</p>
            <p className="font-bold text-sm">{booking.num_rooms}</p>
          </div>
        </div>

        {/* Guest Row */}
        <div className="px-4 py-2 border-b border-dashed border-muted-foreground/20">
          <p className="text-[10px] text-muted-foreground uppercase">Guest Name</p>
          <p className="font-semibold text-sm">{booking.passenger_name}</p>
          <p className="text-[10px] text-muted-foreground">{booking.passenger_email}</p>
        </div>

        {/* Special Requests */}
        {booking.special_requests && (
          <div className="px-4 py-2 border-b border-dashed border-muted-foreground/20">
            <p className="text-[10px] text-muted-foreground uppercase">Special Requests</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{booking.special_requests}</p>
          </div>
        )}

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
                type: 'STAY',
                property: booking.item_name,
                checkIn: booking.check_in_date,
                checkOut: booking.check_out_date,
                guests: booking.num_guests,
                platform: 'fulticket'
              })}
              size={80}
              level="M"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-green-600 mb-1">
              <CheckCircle2 className="h-3 w-3" />
              <span className="text-[10px] font-medium">Verified Booking</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Present at check-in</p>
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
            ⚠️ Present valid ID at check-in • Cancellation policy applies • fulticket.com
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
    </div>
  );
};
