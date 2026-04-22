import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Calendar, Clock, MapPin, Users, Briefcase, Download, X } from "lucide-react";
import { format, parseISO, differenceInHours } from "date-fns";

interface WorkspaceBookingCardProps {
  booking: any;
  workspaceBooking?: any;
  onDownloadPDF: (booking: any) => void;
  onCancel: (booking: any) => void;
  downloadingId: string | null;
  cancellingId: string | null;
  onNavigate: (path: string) => void;
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

export const WorkspaceBookingCard = ({
  booking,
  workspaceBooking,
  onDownloadPDF,
  onCancel,
  downloadingId,
  cancellingId,
  onNavigate
}: WorkspaceBookingCardProps) => {
  const { convertPrice } = useCurrency();

  const startDatetime = workspaceBooking?.start_datetime || booking.departure_time;
  const endDatetime = workspaceBooking?.end_datetime || booking.arrival_time;

  const formatDateTime = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, 'MMM d, yyyy HH:mm');
    } catch {
      return dateStr;
    }
  };

  const calculateDuration = () => {
    if (!startDatetime || !endDatetime) return 'N/A';
    try {
      const start = parseISO(startDatetime);
      const end = parseISO(endDatetime);
      const hours = differenceInHours(end, start);
      if (hours < 24) return `${hours}h`;
      return `${Math.ceil(hours / 24)}d`;
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      confirmed: { variant: "default", label: "Confirmed" },
      upcoming: { variant: "default", label: "Upcoming" },
      completed: { variant: "secondary", label: "Completed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };
    const config = statusConfig[status] || statusConfig.confirmed;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{booking.item_name}</h3>
                {workspaceBooking?.workspace?.workspace_type && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {WORKSPACE_TYPE_LABELS[workspaceBooking.workspace.workspace_type] || workspaceBooking.workspace.workspace_type}
                  </Badge>
                )}
              </div>
            </div>
            {getStatusBadge(booking.status)}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{booking.to_location || workspaceBooking?.workspace?.city || 'Location'}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDateTime(startDatetime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{calculateDuration()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{workspaceBooking?.num_attendees || booking.number_of_adults || 1} people</span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Ref: <span className="font-mono">{booking.booking_reference}</span>
          </div>

          <div className="text-xl font-bold text-primary">
            {convertPrice(booking.total_price)}
          </div>
        </div>

        <div className="flex flex-col gap-2 md:min-w-[140px]">
          {(booking.status === 'upcoming' || booking.status === 'confirmed') && (
            <>
              <Button
                size="sm"
                onClick={() => onDownloadPDF(booking)}
                disabled={downloadingId === booking.id}
              >
                {downloadingId === booking.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onCancel(booking)}
                disabled={cancellingId === booking.id}
              >
                {cancellingId === booking.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                )}
              </Button>
            </>
          )}
          {booking.status === 'completed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate('/workspaces')}
            >
              Book Again
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
