import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getOperatorSchedules, getOperatorBookings } from "@/services/operatorService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Clock, Users, Download, Bus, QrCode } from "lucide-react";
import CheckInScanner from "@/components/CheckInScanner";
import { exportToCSV, prepareAttendeesForExport } from "@/utils/exportData";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";

interface Schedule {
  id: string;
  from_location: string;
  to_location: string;
  available_date: string;
  departure_time: string;
  bus?: {
    operator: string;
  } | null;
}

const BusCheckInPage = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<string>("all");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSchedules();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [selectedSchedule]);

  const loadSchedules = async () => {
    try {
      const data = await getOperatorSchedules();
      // Filter to only today and upcoming schedules
      const today = new Date().toISOString().split('T')[0];
      const upcomingSchedules = data.filter(
        (s: any) => s.available_date >= today
      );
      setSchedules(upcomingSchedules);
    } catch (error) {
      console.error("Error loading schedules:", error);
      toast({
        title: "Error",
        description: "Failed to load schedules",
        variant: "destructive",
      });
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await getOperatorBookings();
      let filtered = data;
      
      if (selectedSchedule !== "all") {
        filtered = data.filter((b: any) => b.item_id === selectedSchedule);
      }
      
      // Only show bus bookings
      filtered = filtered.filter((b: any) => b.booking_type === 'bus');
      
      setBookings(filtered);
    } catch (error) {
      console.error("Error loading bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckIn = async (bookingId: string, bookingRef: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          checked_in: true, 
          checked_in_at: new Date().toISOString() 
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Also create a check_in record
      await supabase
        .from('check_ins')
        .insert({
          booking_id: bookingId,
          location: 'Bus Departure Point',
        });

      sonnerToast.success(`Passenger ${bookingRef} checked in successfully`);
      loadBookings();
    } catch (error) {
      console.error("Error checking in:", error);
      sonnerToast.error("Failed to check in passenger");
    }
  };

  const checkedInCount = bookings.filter((b) => b.checked_in).length;
  const totalBookings = bookings.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Passenger Check-In</h1>
          <p className="text-muted-foreground">Scan tickets and manage passenger boarding</p>
        </div>
        <Button
          onClick={() => exportToCSV(prepareAttendeesForExport(bookings), "bus-passengers")}
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
              <p className="text-sm text-muted-foreground">Total Passengers</p>
              <p className="text-2xl font-bold">{totalBookings}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Boarded</p>
              <p className="text-2xl font-bold">{checkedInCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Clock className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Waiting</p>
              <p className="text-2xl font-bold">{totalBookings - checkedInCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <QrCode className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Ticket Scanner</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Scan passenger QR codes to automatically check them in for boarding
        </p>
        <CheckInScanner />
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Passenger Manifest</h2>
          </div>
          <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Select schedule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schedules</SelectItem>
              {schedules.map((schedule) => (
                <SelectItem key={schedule.id} value={schedule.id}>
                  {schedule.from_location} → {schedule.to_location} ({new Date(schedule.available_date).toLocaleDateString()} {schedule.departure_time})
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
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No passengers found for this schedule
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-sm">{booking.ticket_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.passenger_name}</div>
                          <div className="text-xs text-muted-foreground">{booking.passenger_phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.from_location} → {booking.to_location}
                      </TableCell>
                      <TableCell>{booking.travel_date ? new Date(booking.travel_date).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>
                        {booking.selected_seats?.join(', ') || '—'}
                      </TableCell>
                      <TableCell>
                        {booking.checked_in ? (
                          <Badge className="bg-green-600">Boarded</Badge>
                        ) : (
                          <Badge variant="secondary">Waiting</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!booking.checked_in && (
                          <Button
                            size="sm"
                            onClick={() => handleManualCheckIn(booking.id, booking.booking_reference)}
                          >
                            Check In
                          </Button>
                        )}
                        {booking.checked_in && (
                          <span className="text-xs text-muted-foreground">
                            {booking.checked_in_at ? new Date(booking.checked_in_at).toLocaleTimeString() : 'Checked'}
                          </span>
                        )}
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

export default BusCheckInPage;