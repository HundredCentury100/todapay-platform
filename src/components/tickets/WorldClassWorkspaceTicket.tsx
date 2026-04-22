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
  Briefcase,
  Calendar,
  Clock,
  Users,
  MapPin,
  Wifi,
  Monitor
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, differenceInHours } from "date-fns";
import { TicketPurchaseDetails } from "./TicketPurchaseDetails";

interface WorldClassWorkspaceTicketProps {
  booking: {
    id: string;
    booking_reference: string;
    ticket_number: string;
    item_name: string;
    workspace_type?: string;
    start_datetime: string;
    end_datetime: string;
    workspace_address?: string;
    workspace_city?: string;
    num_attendees: number;
    booking_type: string;
    passenger_name: string;
    passenger_email: string;
    total_price: number;
    status: string;
    qr_code_data?: string;
    checked_in?: boolean;
    reservation_type?: string;
    equipment_requested?: { name: string; quantity: number }[];
    catering_requested?: { name: string; quantity: number }[];
  };
  workspaceImage?: string;
  onDownloadPDF: () => void;
  onDownloadWallet: () => void;
}

const WORKSPACE_TYPE_LABELS: Record<string, string> = {
  hot_desk: "Hot Desk",
  dedicated_desk: "Dedicated Desk",
  private_office: "Private Office",
  meeting_room: "Meeting Room",
  conference_room: "Conference Room",
  virtual_office: "Virtual Office",
  event_space: "Event Space",
  podcast_studio: "Podcast Studio",
  photo_studio: "Photo Studio",
};

export const WorldClassWorkspaceTicket = ({
  booking,
  workspaceImage,
  onDownloadPDF,
  onDownloadWallet
}: WorldClassWorkspaceTicketProps) => {
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

  const formatTime = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, 'HH:mm');
    } catch {
      return dateStr;
    }
  };

  const calculateDuration = () => {
    try {
      const start = parseISO(booking.start_datetime);
      const end = parseISO(booking.end_datetime);
      const hours = differenceInHours(end, start);
      if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`;
      const days = Math.ceil(hours / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    } catch {
      return '1 hour';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(booking.booking_reference);
    toast({ title: "Copied!", description: "Reference copied" });
  };

  const handleShare = async () => {
    const text = `🏢 Workspace Booking\n${booking.item_name}\n📍 ${booking.workspace_city || ''}\n📅 ${formatDate(booking.start_datetime)}\n⏰ ${formatTime(booking.start_datetime)} - ${formatTime(booking.end_datetime)}\nBooking: ${booking.booking_reference}\n\nvia fulticket.com`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Workspace Booking', text });
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
      <Card className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 border-2 print:border">
        {/* Perforated Edge Effect */}
        <div className="absolute left-0 top-1/2 w-3 h-6 bg-background rounded-r-full -translate-y-1/2 -translate-x-1/2 border-r-2 border-dashed border-muted-foreground/20" />
        <div className="absolute right-0 top-1/2 w-3 h-6 bg-background rounded-l-full -translate-y-1/2 translate-x-1/2 border-l-2 border-dashed border-muted-foreground/20" />

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {workspaceImage ? (
                <img src={workspaceImage} alt="" className="w-8 h-8 rounded-md object-cover bg-white/20" />
              ) : (
                <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center">
                  <Briefcase className="h-4 w-4" />
                </div>
              )}
              <div>
                <p className="font-bold text-sm">WORKSPACE BOOKING</p>
                <p className="text-[10px] opacity-80">fulticket</p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </div>

        {/* Workspace Name Banner */}
        <div className="bg-blue-500/5 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <h2 className="font-bold text-base leading-tight line-clamp-2">{booking.item_name}</h2>
          {booking.workspace_city && (
            <div className="flex items-center gap-1 mt-1 text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <p className="text-xs truncate">{booking.workspace_city}</p>
            </div>
          )}
          {booking.workspace_type && (
            <Badge variant="outline" className="mt-2 text-[10px]">
              {WORKSPACE_TYPE_LABELS[booking.workspace_type] || booking.workspace_type}
            </Badge>
          )}
        </div>

        {/* Cash Reservation Alert */}
        {isCashReservation && (
          <div className="bg-orange-500/10 px-3 py-2 flex items-center gap-2 border-b border-orange-500/20">
            <AlertCircle className="h-3 w-3 text-orange-600 flex-shrink-0" />
            <p className="text-[10px] text-orange-700 dark:text-orange-300">
              Pay on arrival to confirm
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

        {/* Date & Time Section */}
        <div className="grid grid-cols-2 gap-2 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <div className="p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground uppercase">Date</p>
            </div>
            <p className="font-bold text-sm">{formatDate(booking.start_datetime)}</p>
          </div>
          <div className="p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground uppercase">Time</p>
            </div>
            <p className="font-bold text-sm">{formatTime(booking.start_datetime)} - {formatTime(booking.end_datetime)}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <Clock className="h-4 w-4 mx-auto mb-1 text-blue-600" />
            <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
            <p className="font-bold text-primary text-sm">{calculateDuration()}</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <Users className="h-4 w-4 mx-auto mb-1 text-blue-600" />
            <p className="text-[10px] text-muted-foreground uppercase">Attendees</p>
            <p className="font-bold text-sm">{booking.num_attendees}</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <Wifi className="h-4 w-4 mx-auto mb-1 text-blue-600" />
            <p className="text-[10px] text-muted-foreground uppercase">WiFi</p>
            <p className="font-bold text-sm">Included</p>
          </div>
        </div>

        {/* Equipment/Catering Add-ons */}
        {(booking.equipment_requested?.length || booking.catering_requested?.length) && (
          <div className="px-4 py-2 border-b border-dashed border-muted-foreground/20">
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Add-ons</p>
            <div className="flex flex-wrap gap-1">
              {booking.equipment_requested?.map((item, idx) => (
                <Badge key={idx} variant="outline" className="text-[9px]">
                  <Monitor className="h-2.5 w-2.5 mr-1" />
                  {item.name} x{item.quantity}
                </Badge>
              ))}
              {booking.catering_requested?.map((item, idx) => (
                <Badge key={idx} variant="outline" className="text-[9px]">
                  {item.name} x{item.quantity}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Guest Row */}
        <div className="px-4 py-2 border-b border-dashed border-muted-foreground/20">
          <p className="text-[10px] text-muted-foreground uppercase">Booked By</p>
          <p className="font-semibold text-sm">{booking.passenger_name}</p>
          <p className="text-[10px] text-muted-foreground">{booking.passenger_email}</p>
        </div>

        {/* Purchase Details */}
        <TicketPurchaseDetails purchaseChannel="online" />

        {/* QR Code Section */}
        <div className="px-4 py-3 flex items-center gap-4">
          <div className="bg-white p-2 rounded-lg shadow-sm flex-shrink-0">
            <QRCode
              value={booking.qr_code_data || JSON.stringify({
                ref: booking.booking_reference,
                ticket: booking.ticket_number,
                type: 'WORKSPACE',
                workspace: booking.item_name,
                start: booking.start_datetime,
                end: booking.end_datetime,
                attendees: booking.num_attendees,
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

        {/* Footer */}
        <div className="bg-muted/30 px-4 py-2 border-t">
          <p className="text-[9px] text-muted-foreground text-center">
            ⚠️ Arrive 5 mins early • Cancellation policy applies • fulticket.com
          </p>
        </div>
      </Card>

      {/* Action Bar */}
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
