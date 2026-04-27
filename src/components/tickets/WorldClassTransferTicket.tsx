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
  Car,
  MapPin,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  Briefcase,
  Phone,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { TicketPurchaseDetails } from "./TicketPurchaseDetails";

interface TransferBooking {
  id: string;
  booking_reference: string;
  ticket_number: string;
  service_name: string;
  transfer_type?: 'airport' | 'city' | 'intercity' | 'port';
  pickup_location: string;
  dropoff_location: string;
  pickup_datetime: string;
  flight_number?: string;
  vehicle_type?: string;
  num_passengers: number;
  num_luggage?: number;
  driver_name?: string;
  driver_phone?: string;
  passenger_name: string;
  passenger_email: string;
  passenger_phone?: string;
  total_price: number;
  status: string;
  qr_code_data?: string;
  checked_in?: boolean;
  reservation_type?: string;
  special_requests?: string;
}

interface WorldClassTransferTicketProps {
  booking: TransferBooking;
  providerImage?: string;
  onDownloadPDF: () => void;
  onDownloadWallet?: () => void;
}

const TRANSFER_TYPE_LABELS: Record<string, string> = {
  airport: 'Airport Transfer',
  city: 'City Transfer',
  intercity: 'Intercity Transfer',
  port: 'Port Transfer',
};

export const WorldClassTransferTicket = ({
  booking,
  providerImage,
  onDownloadPDF,
  onDownloadWallet
}: WorldClassTransferTicketProps) => {
  const { convertPrice } = useCurrency();
  const { toast } = useToast();
  const isCashReservation = booking.reservation_type === 'cash_reserved';

  const formatDateTime = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'EEE, MMM d • HH:mm');
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

  const handleCopy = () => {
    navigator.clipboard.writeText(booking.booking_reference);
    toast({ title: "Copied!", description: "Reference copied" });
  };

  const handleShare = async () => {
    const text = `🚐 Transfer Booking\n${booking.pickup_location} → ${booking.dropoff_location}\n📅 ${formatDateTime(booking.pickup_datetime)}\n👥 ${booking.num_passengers} passenger(s)\nBooking: ${booking.booking_reference}\n\nvia todapayments.com`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Transfer Booking', text });
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
          PICKED UP
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
        <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {providerImage ? (
                <img src={providerImage} alt="" className="w-8 h-8 rounded-md object-cover bg-white/20" />
              ) : (
                <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center">
                  <Car className="h-4 w-4" />
                </div>
              )}
              <div>
                <p className="font-bold text-sm">TRANSFER</p>
                <p className="text-[10px] opacity-80">fulticket</p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </div>

        {/* Transfer Type */}
        <div className="bg-sky-500/5 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <div className="flex items-center gap-2 mb-2">
            {booking.transfer_type && (
              <Badge variant="outline" className="text-[10px] border-sky-300 text-sky-700 dark:text-sky-300">
                {TRANSFER_TYPE_LABELS[booking.transfer_type] || booking.transfer_type}
              </Badge>
            )}
            {booking.flight_number && (
              <Badge variant="secondary" className="text-[10px]">
                ✈️ {booking.flight_number}
              </Badge>
            )}
          </div>
          
          {/* Route Display */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <p className="text-sm font-medium flex-1 truncate">{booking.pickup_location}</p>
            </div>
            <div className="flex items-center gap-2 pl-1">
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <p className="text-sm font-medium flex-1 truncate">{booking.dropoff_location}</p>
            </div>
          </div>
        </div>

        {/* Cash Alert */}
        {isCashReservation && (
          <div className="bg-orange-500/10 px-3 py-2 flex items-center gap-2 border-b border-orange-500/20">
            <AlertCircle className="h-3 w-3 text-orange-600 flex-shrink-0" />
            <p className="text-[10px] text-orange-700 dark:text-orange-300">
              Pay driver upon pickup
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

        {/* Pickup Info */}
        <div className="grid grid-cols-2 gap-2 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <div className="p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="h-3 w-3 text-sky-600" />
              <p className="text-[10px] text-muted-foreground uppercase">Pickup</p>
            </div>
            <p className="font-bold text-sm">{formatDateTime(booking.pickup_datetime)}</p>
          </div>
          <div className="p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Car className="h-3 w-3 text-sky-600" />
              <p className="text-[10px] text-muted-foreground uppercase">Vehicle</p>
            </div>
            <p className="font-bold text-sm capitalize">{booking.vehicle_type || 'Sedan'}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <Users className="h-4 w-4 mx-auto mb-1 text-sky-600" />
            <p className="text-[10px] text-muted-foreground uppercase">Passengers</p>
            <p className="font-bold text-sm">{booking.num_passengers}</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <Briefcase className="h-4 w-4 mx-auto mb-1 text-sky-600" />
            <p className="text-[10px] text-muted-foreground uppercase">Luggage</p>
            <p className="font-bold text-sm">{booking.num_luggage || 0}</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <Clock className="h-4 w-4 mx-auto mb-1 text-sky-600" />
            <p className="text-[10px] text-muted-foreground uppercase">Time</p>
            <p className="font-bold text-sm">{formatTime(booking.pickup_datetime)}</p>
          </div>
        </div>

        {/* Driver Info */}
        {booking.driver_name && (
          <div className="px-4 py-2 border-b border-dashed border-muted-foreground/20">
            <p className="text-[10px] text-muted-foreground uppercase">Driver</p>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{booking.driver_name}</p>
              {booking.driver_phone && (
                <a href={`tel:${booking.driver_phone}`} className="text-sky-600">
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Passenger Info */}
        <div className="px-4 py-2 border-b border-dashed border-muted-foreground/20">
          <p className="text-[10px] text-muted-foreground uppercase">Passenger</p>
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
                type: 'TRANSFER',
                pickup: booking.pickup_location,
                dropoff: booking.dropoff_location,
                datetime: booking.pickup_datetime,
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
            <p className="text-[10px] text-muted-foreground">Show to driver</p>
            <p className="text-[10px] font-mono text-muted-foreground truncate mt-1">
              {booking.ticket_number}
            </p>
          </div>
        </div>

        {/* Price */}
        <div className="bg-muted/50 px-4 py-2 flex items-center justify-between border-t border-dashed border-muted-foreground/20">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Total</p>
            <p className="font-bold text-lg text-sky-600">{convertPrice(booking.total_price)}</p>
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
            🚐 Driver will meet you at pickup point • todapayments.com
          </p>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 mt-3 print:hidden">
        <Button onClick={onDownloadPDF} size="sm" className="flex-1 h-9 bg-sky-600 hover:bg-sky-700">
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

export default WorldClassTransferTicket;
