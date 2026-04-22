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
  Compass,
  MapPin,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  Sparkles,
  Languages
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { TicketPurchaseDetails } from "./TicketPurchaseDetails";

interface ExperienceBooking {
  id: string;
  booking_reference: string;
  ticket_number: string;
  item_name: string;
  experience_type?: string;
  experience_date: string;
  start_time: string;
  end_time?: string;
  duration_hours?: number;
  meeting_point?: string;
  location_city?: string;
  num_participants: number;
  guide_name?: string;
  language?: string;
  passenger_name: string;
  passenger_email: string;
  passenger_phone?: string;
  total_price: number;
  status: string;
  qr_code_data?: string;
  checked_in?: boolean;
  reservation_type?: string;
  includes?: string[];
  special_requirements?: string;
}

interface WorldClassExperienceTicketProps {
  booking: ExperienceBooking;
  experienceImage?: string;
  onDownloadPDF: () => void;
  onDownloadWallet?: () => void;
}

export const WorldClassExperienceTicket = ({
  booking,
  experienceImage,
  onDownloadPDF,
  onDownloadWallet
}: WorldClassExperienceTicketProps) => {
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

  const handleCopy = () => {
    navigator.clipboard.writeText(booking.booking_reference);
    toast({ title: "Copied!", description: "Reference copied" });
  };

  const handleShare = async () => {
    const text = `🌟 Experience Booking\n${booking.item_name}\n📍 ${booking.location_city || ''}\n📅 ${formatDate(booking.experience_date)} at ${booking.start_time}\n👥 ${booking.num_participants} participant(s)\nBooking: ${booking.booking_reference}\n\nvia fulticket.com`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Experience Booking', text });
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
        <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {experienceImage ? (
                <img src={experienceImage} alt="" className="w-8 h-8 rounded-md object-cover bg-white/20" />
              ) : (
                <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center">
                  <Compass className="h-4 w-4" />
                </div>
              )}
              <div>
                <p className="font-bold text-sm">EXPERIENCE</p>
                <p className="text-[10px] opacity-80">fulticket</p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </div>

        {/* Experience Name */}
        <div className="bg-rose-500/5 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <h2 className="font-bold text-base leading-tight line-clamp-2">{booking.item_name}</h2>
          {booking.location_city && (
            <div className="flex items-center gap-1 mt-1 text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <p className="text-xs truncate">{booking.location_city}</p>
            </div>
          )}
          {booking.experience_type && (
            <Badge variant="outline" className="mt-2 text-[10px] border-rose-300 text-rose-700 dark:text-rose-300">
              <Sparkles className="h-2.5 w-2.5 mr-1" />
              {booking.experience_type}
            </Badge>
          )}
        </div>

        {/* Cash Alert */}
        {isCashReservation && (
          <div className="bg-orange-500/10 px-3 py-2 flex items-center gap-2 border-b border-orange-500/20">
            <AlertCircle className="h-3 w-3 text-orange-600 flex-shrink-0" />
            <p className="text-[10px] text-orange-700 dark:text-orange-300">
              Pay at meeting point to confirm
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
              <Calendar className="h-3 w-3 text-rose-600" />
              <p className="text-[10px] text-muted-foreground uppercase">Date</p>
            </div>
            <p className="font-bold text-sm">{formatDate(booking.experience_date)}</p>
          </div>
          <div className="p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="h-3 w-3 text-rose-600" />
              <p className="text-[10px] text-muted-foreground uppercase">Time</p>
            </div>
            <p className="font-bold text-sm">
              {booking.start_time}
              {booking.end_time && ` - ${booking.end_time}`}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <Users className="h-4 w-4 mx-auto mb-1 text-rose-600" />
            <p className="text-[10px] text-muted-foreground uppercase">Guests</p>
            <p className="font-bold text-sm">{booking.num_participants}</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <Clock className="h-4 w-4 mx-auto mb-1 text-rose-600" />
            <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
            <p className="font-bold text-sm">{booking.duration_hours || 2}h</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <Languages className="h-4 w-4 mx-auto mb-1 text-rose-600" />
            <p className="text-[10px] text-muted-foreground uppercase">Language</p>
            <p className="font-bold text-sm">{booking.language || 'EN'}</p>
          </div>
        </div>

        {/* Meeting Point */}
        {booking.meeting_point && (
          <div className="px-4 py-2 border-b border-dashed border-muted-foreground/20">
            <div className="flex items-start gap-2">
              <MapPin className="h-3 w-3 text-rose-600 mt-0.5" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Meeting Point</p>
                <p className="text-xs font-medium">{booking.meeting_point}</p>
              </div>
            </div>
          </div>
        )}

        {/* Guest Info */}
        <div className="px-4 py-2 border-b border-dashed border-muted-foreground/20">
          <p className="text-[10px] text-muted-foreground uppercase">Lead Guest</p>
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
                type: 'EXPERIENCE',
                name: booking.item_name,
                date: booking.experience_date,
                guests: booking.num_participants,
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
            <p className="text-[10px] text-muted-foreground">Show at meeting point</p>
            <p className="text-[10px] font-mono text-muted-foreground truncate mt-1">
              {booking.ticket_number}
            </p>
          </div>
        </div>

        {/* Price */}
        <div className="bg-muted/50 px-4 py-2 flex items-center justify-between border-t border-dashed border-muted-foreground/20">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Total</p>
            <p className="font-bold text-lg text-rose-600">{convertPrice(booking.total_price)}</p>
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
            ⏰ Arrive 15 min early • Comfortable shoes recommended • fulticket.com
          </p>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 mt-3 print:hidden">
        <Button onClick={onDownloadPDF} size="sm" className="flex-1 h-9 bg-rose-600 hover:bg-rose-700">
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

export default WorldClassExperienceTicket;
