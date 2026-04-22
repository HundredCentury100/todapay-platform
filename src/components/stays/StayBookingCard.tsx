import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import { 
  Building2, MapPin, Calendar, Users, Moon, 
  Download, X, RefreshCw, FileDown, Clock, 
  CheckCircle, XCircle 
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface StayBookingCardProps {
  booking: any;
  stayBooking: any;
  onDownloadPDF: (booking: any) => void;
  onCancel: (booking: any) => void;
  downloadingId: string | null;
  cancellingId: string | null;
  onNavigate: (path: string) => void;
}

export const StayBookingCard = ({
  booking,
  stayBooking,
  onDownloadPDF,
  onCancel,
  downloadingId,
  cancellingId,
  onNavigate,
}: StayBookingCardProps) => {
  const { convertPrice } = useCurrency();

  const property = stayBooking?.property;
  const room = stayBooking?.room;
  const checkInDate = stayBooking?.check_in_date;
  const checkOutDate = stayBooking?.check_out_date;
  
  const nights = checkInDate && checkOutDate 
    ? differenceInDays(new Date(checkOutDate), new Date(checkInDate))
    : 1;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive"; label: string; icon: any; color: string }> = {
      confirmed: { 
        variant: "default", 
        label: "Confirmed", 
        icon: CheckCircle,
        color: "text-green-600"
      },
      upcoming: { 
        variant: "default", 
        label: "Upcoming", 
        icon: Clock,
        color: "text-blue-600"
      },
      completed: { 
        variant: "secondary", 
        label: "Completed", 
        icon: CheckCircle,
        color: "text-muted-foreground"
      },
      cancelled: { 
        variant: "destructive", 
        label: "Cancelled", 
        icon: XCircle,
        color: "text-destructive"
      },
    };
    
    const config = statusConfig[status] || statusConfig.confirmed;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className={`w-3 h-3 ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex gap-4">
          {/* Property Image */}
          <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
            <img
              src={property?.images?.[0] || "/placeholder.svg"}
              alt={property?.name || "Property"}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  {property?.name || "Stay Booking"}
                </h3>
                {room && (
                  <p className="text-sm text-muted-foreground capitalize">
                    {room.name} • {room.room_type?.replace('_', ' ')}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {getStatusBadge(booking.status)}
              {booking.refund_requested && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Refund {booking.refund_status}
                </Badge>
              )}
            </div>

            {/* Location */}
            {property && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{property.address}, {property.city}</span>
              </div>
            )}

            {/* Dates */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  {checkInDate && format(new Date(checkInDate), "MMM d")} - {checkOutDate && format(new Date(checkOutDate), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-muted-foreground" />
                <span>{nights} {nights === 1 ? 'night' : 'nights'}</span>
              </div>
            </div>

            {/* Guests & Rooms */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{stayBooking?.num_guests || 2} guests • {stayBooking?.num_rooms || 1} room(s)</span>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Booking: {booking.booking_reference}
            </div>

            <div className="text-xl font-bold text-primary">
              {convertPrice(booking.total_price)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 md:min-w-[140px]">
          {(booking.status === 'upcoming' || booking.status === 'confirmed') && (
            <>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => onDownloadPDF(booking)}
                disabled={downloadingId === booking.id}
              >
                {downloadingId === booking.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                className="w-full"
                onClick={() => onCancel(booking)}
                disabled={cancellingId === booking.id}
              >
                {cancellingId === booking.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </>
                )}
              </Button>
            </>
          )}
          {booking.status === 'completed' && (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={() => onDownloadPDF(booking)}
                disabled={downloadingId === booking.id}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => onNavigate('/stays')}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Book Again
              </Button>
            </>
          )}
          {booking.status === 'cancelled' && (
            <Button 
              size="sm" 
              className="w-full"
              onClick={() => onNavigate('/stays')}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Book Again
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
