import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getOrganizerEvents, getOrganizerCheckIns } from "@/services/organizerService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Clock, Users, Download } from "lucide-react";
import CheckInScanner from "@/components/CheckInScanner";
import { exportToCSV, prepareAttendeesForExport } from "@/utils/exportData";

interface Event {
  id: string;
  name: string;
  event_date: string;
  event_time: string;
  venue: string;
}

const CheckInPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      loadCheckIns();
    }
  }, [selectedEvent]);

  const loadEvents = async () => {
    try {
      const data = await getOrganizerEvents();
      setEvents(data);
    } catch (error) {
      console.error("Error loading events:", error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    }
  };

  const loadCheckIns = async () => {
    setLoading(true);
    try {
      const eventId = selectedEvent === "all" ? undefined : selectedEvent;
      const data = await getOrganizerCheckIns(eventId);
      setCheckIns(data);
    } catch (error) {
      console.error("Error loading check-ins:", error);
      toast({
        title: "Error",
        description: "Failed to load check-ins",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkedInCount = checkIns.filter((b) => b.checked_in).length;
  const totalBookings = checkIns.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Check-In Dashboard</h1>
          <p className="text-muted-foreground">Manage event check-ins and attendance</p>
        </div>
        <Button
          onClick={() => exportToCSV(prepareAttendeesForExport(checkIns), "check-ins")}
          variant="outline"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
              <p className="text-2xl font-bold">{totalBookings}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Checked In</p>
              <p className="text-2xl font-bold">{checkedInCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Clock className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{totalBookings - checkedInCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Check-In Scanner</h2>
        <CheckInScanner />
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Attendance List</h2>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name} - {new Date(event.event_date).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking Ref</TableHead>
                  <TableHead>Guest Name</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Tickets</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Checked In At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkIns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  checkIns.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono">{booking.booking_reference}</TableCell>
                      <TableCell>{booking.passenger_name}</TableCell>
                      <TableCell>{booking.item_name}</TableCell>
                      <TableCell>{new Date(booking.event_date).toLocaleDateString()}</TableCell>
                      <TableCell>{booking.ticket_quantity}</TableCell>
                      <TableCell>
                        {booking.checked_in ? (
                          <Badge className="bg-green-600">Checked In</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {booking.checked_in_at
                          ? new Date(booking.checked_in_at).toLocaleString()
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CheckInPage;
