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
  CheckCircle2,
  Building,
  MapPin,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  PartyPopper,
  Mic2,
  Camera,
  Utensils
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, differenceInHours } from "date-fns";
import { motion } from "framer-motion";
import { TicketPurchaseDetails } from "./TicketPurchaseDetails";

interface VenueBooking {
  id: string;
  booking_reference: string;
  ticket_number: string;
  venue_name: string;
  venue_type?: string;
  venue_address?: string;
  venue_city?: string;
  start_datetime: string;
  end_datetime: string;
  event_type?: string;
  num_attendees: number;
  layout_type?: string;
  passenger_name: string;
  passenger_email: string;
  passenger_phone?: string;
  total_price: number;
  status: string;
  qr_code_data?: string;
  checked_in?: boolean;
  reservation_type?: string;
  catering_included?: boolean;
  equipment_included?: string[];
  special_requests?: string;
}

interface WorldClassVenueTicketProps {
  booking: VenueBooking;
  venueImage?: string;
  onDownloadPDF: () => void;
  onDownloadWallet?: () => void;
}

const VENUE_TYPE_ICONS: Record<string, any> = {
  conference: Building,
  event_space: PartyPopper,
  podcast_studio: Mic2,
  photo_studio: Camera,
  banquet: Utensils,
};

export const WorldClassVenueTicket = ({
  booking,
  venueImage,
  onDownloadPDF,
  onDownloadWallet
}: WorldClassVenueTicketProps) => {
  const { convertPrice } = useCurrency();
  const { toast } = useToast();
  const isCashReservation = booking.reservation_type === 'cash_reserved';

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'EEE, MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'HH:mm');
    } catch {
      return dateStr;
    }
  };

  const calculateDuration = () => {
    try {
      const start = parseISO(booking.start_datetime);
      const end = parseISO(booking.end_datetime);
      const hours = differenceInHours(end, start);
      return `${hours}h`;
    } catch {
      return '—';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(booking.booking_reference);
    toast({ title: "Copied!", description: "Reference copied" });
  };

  const handleShare = async () => {
    const text = `🏛️ Venue Booking\n${booking.venue_name}\n📍 ${booking.venue_city || ''}\n📅 ${formatDate(booking.start_datetime)}\n⏰ ${formatTime(booking.start_datetime)} - ${formatTime(booking.end_datetime)}\n👥 ${booking.num_attendees} guests\nBooking: ${booking.booking_reference}\n\nvia todapayments.com`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Venue Booking', text });
      } catch {
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
        <Badge className="bg-white/20 text-white text-[10px] px-2 py-0.5 border-0">
          <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
          CHECKED IN
        </Badge>
      );
    }
    return (
      <Badge 
        className={`text-[10px] px-2 py-0.5 border-0 ${
          isCashReservation ? 'bg-orange-500/30 text-orange-100' : 'bg-white/20 text-white'
        }`}
      >
        {isCashReservation ? 'RESERVED' : 'CONFIRMED'}
      </Badge>
    );
  };

  const VenueIcon = VENUE_TYPE_ICONS[booking.venue_type || ''] || Building;

  return (
    <motion.div 
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 border-2 print:border shadow-lg">
        {/* Perforated Edge */}
        <div className="absolute left-0 top-1/2 w-3 h-6 bg-background rounded-r-full -translate-y-1/2 -translate-x-1/2 border-r-2 border-dashed border-muted-foreground/20" />
        <div className="absolute right-0 top-1/2 w-3 h-6 bg-background rounded-l-full -translate-y-1/2 translate-x-1/2 border-l-2 border-dashed border-muted-foreground/20" />

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {venueImage ? (
                <img src={venueImage} alt="" className="w-8 h-8 rounded-md object-cover bg-white/20" />
              ) : (
                <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center">
                  <VenueIcon className="h-4 w-4" />
                </div>
              )}
              <div>
                <p className="font-bold text-sm">VENUE BOOKING</p>
                <p className="text-[10px] opacity-80">fulticket</p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </div>

        {/* Venue Name */}
        <div className="bg-orange-500/5 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <h2 className="font-bold text-base leading-tight line-clamp-2">{booking.venue_name}</h2>
          {booking.venue_city && (
            <div className="flex items-center gap-1 mt-1 text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <p className="text-xs truncate">{booking.venue_city}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {booking.venue_type && (
              <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-700 dark:text-orange-300 capitalize">
                {booking.venue_type.replace('_', ' ')}
              </Badge>
            )}
            {booking.event_type && (
              <Badge variant="secondary" className="text-[10px]">
                {booking.event_type}
              </Badge>
            )}
          </div>
        </div>

        {/* Cash Alert */}
        {isCashReservation && (
          <div className="bg-orange-500/10 px-3 py-2 flex items-center gap-2 border-b border-orange-500/20">
            <AlertCircle className="h-3 w-3 text-orange-600 flex-shrink-0" />
            <p className="text-[10px] text-orange-700 dark:text-orange-300">
              Pay at venue to confirm
            </p>
          </div>
        )}

        {/* Booking Reference */}
        <div className="px-4 py-2 bg-muted/50 flex items-center justify-between border-b border-dashed border-muted-foreground/20">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Booking Ref</p>
            <p className="font-mono font-bold text-base tracking-wide">{booking.booking_reference}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 w-7 p-0 print:hidden">
            <Copy className="h-3 w-3" />
          </Button>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-2 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <div className="p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="h-3 w-3 text-orange-600" />
              <p className="text-[10px] text-muted-foreground uppercase">Date</p>
            </div>
            <p className="font-bold text-sm">{formatDate(booking.start_datetime)}</p>
          </div>
          <div className="p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="h-3 w-3 text-orange-600" />
              <p className="text-[10px] text-muted-foreground uppercase">Time</p>
            </div>
            <p className="font-bold text-sm">
              {formatTime(booking.start_datetime)} - {formatTime(booking.end_datetime)}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <Users className="h-4 w-4 mx-auto mb-1 text-orange-600" />
            <p className="text-[10px] text-muted-foreground uppercase">Capacity</p>
            <p className="font-bold text-sm">{booking.num_attendees}</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <Clock className="h-4 w-4 mx-auto mb-1 text-orange-600" />
            <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
            <p className="font-bold text-sm">{calculateDuration()}</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <Building className="h-4 w-4 mx-auto mb-1 text-orange-600" />
            <p className="text-[10px] text-muted-foreground uppercase">Layout</p>
            <p className="font-bold text-sm capitalize">{booking.layout_type || 'Flexible'}</p>
          </div>
        </div>

        {/* Inclusions */}
        {(booking.catering_included || booking.equipment_included?.length) && (
          <div className="px-4 py-2 border-b border-dashed border-muted-foreground/20">
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Inclusions</p>
            <div className="flex flex-wrap gap-1">
              {booking.catering_included && (
                <Badge variant="secondary" className="text-[9px]">
                  <Utensils className="h-2.5 w-2.5 mr-1" />
                  Catering
                </Badge>
              )}
              {booking.equipment_included?.map((item, idx) => (
                <Badge key={idx} variant="secondary" className="text-[9px]">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Organizer Info */}
        <div className="px-4 py-2 border-b border-dashed border-muted-foreground/20">
          <p className="text-[10px] text-muted-foreground uppercase">Event Organizer</p>
          <p className="font-semibold text-sm">{booking.passenger_name}</p>
          <p className="text-[10px] text-muted-foreground">{booking.passenger_email}</p>
        </div>

        {/* Purchase Details */}
        <TicketPurchaseDetails purchaseChannel="online" />

        {/* QR Code */}
        <div className="px-4 py-3 flex items-center gap-4">
          <div className="bg-white p-2 rounded-lg shadow-sm flex-shrink-0">
            <QRCode
              value={booking.qr_code_data || JSON.stringify({
                ref: booking.booking_reference,
                ticket: booking.ticket_number,
                type: 'VENUE',
                venue: booking.venue_name,
                date: booking.start_datetime,
                guests: booking.num_attendees,
                platform: 'fulticket'
              })}
              size={70}
              level="M"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-emerald-600 mb-1">
              <CheckCircle2 className="h-3 w-3" />
              <span className="text-[10px] font-medium">Verified Booking</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Present at venue</p>
            <p className="text-[10px] font-mono text-muted-foreground truncate mt-1">
              {booking.ticket_number}
            </p>
          </div>
        </div>

        {/* Price */}
        <div className="bg-muted/50 px-4 py-2 flex items-center justify-between border-t border-dashed border-muted-foreground/20">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Total</p>
            <p className="font-bold text-lg text-orange-600">{convertPrice(booking.total_price)}</p>
          </div>
          {!isCashReservation && (
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100 text-[10px]">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              PAID
            </Badge>
          )}
        </div>

        {/* Footer */}
        <div className="bg-muted/30 px-4 py-2 border-t">
          <p className="text-[9px] text-muted-foreground text-center">
            🏛️ Access from 30min before start time • todapayments.com
          </p>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 mt-3 print:hidden">
        <Button onClick={onDownloadPDF} size="sm" className="flex-1 h-9 bg-orange-600 hover:bg-orange-700">
          <Download className="h-3 w-3 mr-1" />
          <span className="text-xs">PDF</span>
        </Button>
        {onDownloadWallet && (
          <Button onClick={onDownloadWallet} variant="outline" size="sm" className="flex-1 h-9">
            <Smartphone className="h-3 w-3 mr-1" />
            <span className="text-xs">Wallet</span>
          </Button>
        )}
        <Button onClick={handleShare} variant="outline" size="sm" className="flex-1 h-9">
          <Share2 className="h-3 w-3 mr-1" />
          <span className="text-xs">Share</span>
        </Button>
      </div>
    </motion.div>
  );
};

export default WorldClassVenueTicket;
