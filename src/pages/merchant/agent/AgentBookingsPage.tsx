import { useQuery } from "@tanstack/react-query";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default function AgentBookingsPage() {
  const { merchantProfile } = useMerchantAuth();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['agent-bookings', merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('booked_by_agent_id', merchantProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!merchantProfile?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <p className="text-muted-foreground mt-1">
          All bookings made on behalf of your clients
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking History</CardTitle>
          <CardDescription>
            {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Route/Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No bookings yet. Start booking for your clients!
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-sm">{booking.booking_reference}</TableCell>
                    <TableCell>{booking.passenger_name}</TableCell>
                    <TableCell className="capitalize">{booking.booking_type}</TableCell>
                    <TableCell>
                      {booking.booking_type === 'bus' 
                        ? `${booking.from_location} → ${booking.to_location}`
                        : booking.item_name}
                    </TableCell>
                    <TableCell>
                      {booking.travel_date 
                        ? format(new Date(booking.travel_date), 'MMM dd, yyyy')
                        : booking.event_date 
                        ? format(new Date(booking.event_date), 'MMM dd, yyyy')
                        : 'N/A'}
                    </TableCell>
                    <TableCell>R {Number(booking.total_price).toFixed(2)}</TableCell>
                    <TableCell>
                      {booking.agent_commission_rate 
                        ? `R ${(Number(booking.total_price) * Number(booking.agent_commission_rate) / 100).toFixed(2)}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        booking.status === 'confirmed' ? 'default' :
                        booking.status === 'completed' ? 'secondary' :
                        booking.status === 'cancelled' ? 'destructive' :
                        'outline'
                      }>
                        {booking.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
