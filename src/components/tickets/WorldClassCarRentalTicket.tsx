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
  Fuel,
  Gauge,
  Key,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, differenceInDays } from "date-fns";
import { motion } from "framer-motion";
import { TicketPurchaseDetails } from "./TicketPurchaseDetails";

interface CarRentalBooking {
  id: string;
  booking_reference: string;
  ticket_number: string;
  vehicle_name: string;
  vehicle_type?: string;
  vehicle_image?: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_datetime: string;
  dropoff_datetime: string;
  transmission?: 'automatic' | 'manual';
  fuel_type?: string;
  insurance_type?: string;
  mileage_included?: number | 'unlimited';
  driver_name: string;
  driver_email: string;
  driver_phone?: string;
  license_number?: string;
  total_price: number;
  deposit_amount?: number;
  status: string;
  qr_code_data?: string;
  picked_up?: boolean;
  returned?: boolean;
  reservation_type?: string;
  add_ons?: { name: string; price: number }[];
}

interface WorldClassCarRentalTicketProps {
  booking: CarRentalBooking;
  onDownloadPDF: () => void;
  onDownloadWallet?: () => void;
}

export const WorldClassCarRentalTicket = ({
  booking,
  onDownloadPDF,
  onDownloadWallet
}: WorldClassCarRentalTicketProps) => {
  const { convertPrice } = useCurrency();
  const { toast } = useToast();
  const isCashReservation = booking.reservation_type === 'cash_reserved';

  const formatDateTime = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'EEE, MMM d');
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

  const calculateDays = () => {
    try {
      const pickup = parseISO(booking.pickup_datetime);
      const dropoff = parseISO(booking.dropoff_datetime);
      return differenceInDays(dropoff, pickup) || 1;
    } catch {
      return 1;
    }
  };

  const rentalDays = calculateDays();

  const handleCopy = () => {
    navigator.clipboard.writeText(booking.booking_reference);
    toast({ title: "Copied!", description: "Reference copied" });
  };

  const handleShare = async () => {
    const text = `🚗 Car Rental\n${booking.vehicle_name}\n📍 Pickup: ${booking.pickup_location}\n📅 ${formatDateTime(booking.pickup_datetime)} - ${formatDateTime(booking.dropoff_datetime)}\n${rentalDays} day${rentalDays > 1 ? 's' : ''}\nBooking: ${booking.booking_reference}\n\nvia fulticket.com`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Car Rental Booking', text });
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
    if (booking.returned) {
      return (
        <Badge className="bg-white/20 text-white text-[10px] px-2 py-0.5 border-0">
          <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
          RETURNED
        </Badge>
      );
    }
    if (booking.picked_up) {
      return (
        <Badge className="bg-emerald-500/30 text-emerald-100 text-[10px] px-2 py-0.5 border-0">
          <Key className="h-2.5 w-2.5 mr-1" />
          ACTIVE
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
        <div className="bg-gradient-to-r from-violet-600 via-violet-500 to-violet-600 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center">
                <Car className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-sm">CAR RENTAL</p>
                <p className="text-[10px] opacity-80">fulticket</p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="bg-violet-500/5 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <div className="flex gap-3">
            {booking.vehicle_image ? (
              <img 
                src={booking.vehicle_image} 
                alt={booking.vehicle_name}
                className="w-20 h-14 object-cover rounded-lg bg-muted"
              />
            ) : (
              <div className="w-20 h-14 rounded-lg bg-muted flex items-center justify-center">
                <Car className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm leading-tight">{booking.vehicle_name}</h2>
              <div className="flex flex-wrap gap-1 mt-1">
                {booking.vehicle_type && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 capitalize">
                    {booking.vehicle_type}
                  </Badge>
                )}
                {booking.transmission && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 capitalize">
                    {booking.transmission}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cash Alert */}
        {isCashReservation && (
          <div className="bg-orange-500/10 px-3 py-2 flex items-center gap-2 border-b border-orange-500/20">
            <AlertCircle className="h-3 w-3 text-orange-600 flex-shrink-0" />
            <p className="text-[10px] text-orange-700 dark:text-orange-300">
              Pay at pickup counter
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

        {/* Pickup / Dropoff */}
        <div className="grid grid-cols-2 gap-2 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <div className="p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Key className="h-3 w-3 text-violet-600" />
              <p className="text-[10px] text-muted-foreground uppercase">Pickup</p>
            </div>
            <p className="font-bold text-sm">{formatDateTime(booking.pickup_datetime)}</p>
            <p className="text-[10px] text-muted-foreground">{formatTime(booking.pickup_datetime)}</p>
          </div>
          <div className="p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Car className="h-3 w-3 text-violet-600" />
              <p className="text-[10px] text-muted-foreground uppercase">Return</p>
            </div>
            <p className="font-bold text-sm">{formatDateTime(booking.dropoff_datetime)}</p>
            <p className="text-[10px] text-muted-foreground">{formatTime(booking.dropoff_datetime)}</p>
          </div>
        </div>

        {/* Locations */}
        <div className="px-4 py-2 space-y-2 border-b border-dashed border-muted-foreground/20">
          <div className="flex items-start gap-2">
            <MapPin className="h-3 w-3 text-violet-600 mt-0.5" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Pickup Location</p>
              <p className="text-xs font-medium">{booking.pickup_location}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-3 w-3 text-red-500 mt-0.5" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Return Location</p>
              <p className="text-xs font-medium">{booking.dropoff_location}</p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-4 gap-1 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <div className="text-center p-1.5 bg-muted/30 rounded-lg">
            <Calendar className="h-3 w-3 mx-auto mb-0.5 text-violet-600" />
            <p className="text-[9px] text-muted-foreground">Days</p>
            <p className="font-bold text-xs">{rentalDays}</p>
          </div>
          <div className="text-center p-1.5 bg-muted/30 rounded-lg">
            <Gauge className="h-3 w-3 mx-auto mb-0.5 text-violet-600" />
            <p className="text-[9px] text-muted-foreground">Mileage</p>
            <p className="font-bold text-xs">
              {booking.mileage_included === 'unlimited' ? '∞' : `${booking.mileage_included || 0}km`}
            </p>
          </div>
          <div className="text-center p-1.5 bg-muted/30 rounded-lg">
            <Fuel className="h-3 w-3 mx-auto mb-0.5 text-violet-600" />
            <p className="text-[9px] text-muted-foreground">Fuel</p>
            <p className="font-bold text-xs capitalize">{booking.fuel_type || 'Petrol'}</p>
          </div>
          <div className="text-center p-1.5 bg-muted/30 rounded-lg">
            <Shield className="h-3 w-3 mx-auto mb-0.5 text-violet-600" />
            <p className="text-[9px] text-muted-foreground">Cover</p>
            <p className="font-bold text-xs capitalize">{booking.insurance_type || 'Basic'}</p>
          </div>
        </div>

        {/* Driver Info */}
        <div className="px-4 py-2 border-b border-dashed border-muted-foreground/20">
          <p className="text-[10px] text-muted-foreground uppercase">Driver</p>
          <p className="font-semibold text-sm">{booking.driver_name}</p>
          <p className="text-[10px] text-muted-foreground">{booking.driver_email}</p>
          {booking.license_number && (
            <p className="text-[10px] text-muted-foreground">License: {booking.license_number}</p>
          )}
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
                type: 'CAR_RENTAL',
                vehicle: booking.vehicle_name,
                pickup: booking.pickup_datetime,
                dropoff: booking.dropoff_datetime,
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
            <p className="text-[10px] text-muted-foreground">Present at counter</p>
            <p className="text-[10px] font-mono text-muted-foreground truncate mt-1">
              {booking.ticket_number}
            </p>
          </div>
        </div>

        {/* Price */}
        <div className="bg-muted/50 px-4 py-2 flex items-center justify-between border-t border-dashed border-muted-foreground/20">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Total</p>
            <p className="font-bold text-lg text-violet-600">{convertPrice(booking.total_price)}</p>
            {booking.deposit_amount && (
              <p className="text-[9px] text-muted-foreground">
                Deposit: {convertPrice(booking.deposit_amount)}
              </p>
            )}
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
            🚗 Bring ID + driver's license • Full-to-full fuel policy • fulticket.com
          </p>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 mt-3 print:hidden">
        <Button onClick={onDownloadPDF} size="sm" className="flex-1 h-9 bg-violet-600 hover:bg-violet-700">
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

export default WorldClassCarRentalTicket;
