import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eye, CheckCircle, XCircle } from "lucide-react";

interface VenueBooking {
  id: string;
  venue_id: string;
  venue_name: string;
  event_type: string;
  event_name: string | null;
  start_datetime: string;
  end_datetime: string;
  expected_guests: number | null;
  booking: {
    id: string;
    booking_reference: string;
    passenger_name: string;
    passenger_email: string;
    total_price: number;
    status: string;
    payment_status: string;
  };
}

const BookingsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<VenueBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('merchant_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) return;

        // Get venues for this merchant
        const { data: venues } = await supabase
          .from('venues')
          .select('id, name')
          .eq('merchant_profile_id', profile.id);

        if (!venues || venues.length === 0) {
          setLoading(false);
          return;
        }

        const venueIds = venues.map(v => v.id);
        const venueMap = Object.fromEntries(venues.map(v => [v.id, v.name]));

        // Get venue bookings
        const { data, error } = await supabase
          .from('venue_bookings')
          .select(`
            id,
            venue_id,
            event_type,
            event_name,
            start_datetime,
            end_datetime,
            expected_guests,
            booking:bookings(id, booking_reference, passenger_name, passenger_email, total_price, status, payment_status)
          `)
          .in('venue_id', venueIds)
          .order('start_datetime', { ascending: false });

        if (error) throw error;

        const formattedBookings = (data || []).map((b: any) => ({
          ...b,
          venue_name: venueMap[b.venue_id] || 'Unknown',
          booking: b.booking || {}
        }));

        setBookings(formattedBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast.error('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      confirmed: "default",
      pending: "secondary",
      cancelled: "destructive",
      completed: "outline",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Venue Bookings</h1>
        <p className="text-muted-foreground">Manage reservations for your venues</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No bookings yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Event Date</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-sm">
                        {booking.booking?.booking_reference || '-'}
                      </TableCell>
                      <TableCell>{booking.venue_name}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.booking?.passenger_name}</p>
                          <p className="text-xs text-muted-foreground">{booking.booking?.passenger_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.start_datetime), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{booking.expected_guests || '-'}</TableCell>
                      <TableCell>${booking.booking?.total_price?.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(booking.booking?.status || 'pending')}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingsPage;
