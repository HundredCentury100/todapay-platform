import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Clock, CheckCircle, Eye, MoreHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isAfter, isBefore, isWithinInterval } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCurrency } from "@/contexts/CurrencyContext";

const BOOKING_TYPE_LABELS: Record<string, string> = {
  hourly: 'Hourly',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

const WorkspaceBookingsPage = () => {
  const { merchantProfile } = useMerchantAuth();
  const { convertPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState('active');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['workspace-bookings', merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return [];

      // Get workspace IDs for this merchant
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id')
        .eq('merchant_profile_id', merchantProfile.id);

      const workspaceIds = workspaces?.map(w => w.id) || [];

      if (workspaceIds.length === 0) return [];

      const { data, error } = await supabase
        .from('workspace_bookings')
        .select(`
          *,
          workspace:workspaces(id, name, workspace_type, city),
          booking:bookings(
            id, 
            booking_reference, 
            passenger_name, 
            passenger_email, 
            passenger_phone,
            total_price, 
            status, 
            payment_status,
            checked_in
          )
        `)
        .in('workspace_id', workspaceIds)
        .order('start_datetime', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!merchantProfile?.id,
  });

  const now = new Date();

  const categorizedBookings = {
    active: bookings?.filter(b => 
      isWithinInterval(now, { start: new Date(b.start_datetime), end: new Date(b.end_datetime) })
    ) || [],
    upcoming: bookings?.filter(b => 
      isAfter(new Date(b.start_datetime), now)
    ) || [],
    past: bookings?.filter(b => 
      isBefore(new Date(b.end_datetime), now)
    ) || [],
  };

  const getStatusBadge = (booking: any) => {
    const status = booking.booking?.status || 'pending';
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      confirmed: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
      completed: 'outline',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const renderBookingsTable = (bookingsList: any[]) => {
    if (bookingsList.length === 0) {
      return null;
    }

    return (
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Guest</TableHead>
              <TableHead>Workspace</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookingsList.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-mono text-sm">
                  {booking.booking?.booking_reference}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{booking.booking?.passenger_name}</p>
                    <p className="text-sm text-muted-foreground">{booking.booking?.passenger_email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{booking.workspace?.name}</p>
                    <p className="text-sm text-muted-foreground">{booking.workspace?.city}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{format(new Date(booking.start_datetime), 'MMM d, yyyy')}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(booking.start_datetime), 'HH:mm')} - {format(new Date(booking.end_datetime), 'HH:mm')}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {BOOKING_TYPE_LABELS[booking.booking_type] || booking.booking_type}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {convertPrice(booking.booking?.total_price || 0)}
                </TableCell>
                <TableCell>{getStatusBadge(booking)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Checked In
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  };

  const renderEmptyState = (type: string, icon: any, title: string, description: string) => {
    const Icon = icon;
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full max-w-md" />
        <Card>
          <CardContent className="p-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full mb-4" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bookings</h1>
        <p className="text-muted-foreground">Manage workspace bookings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">
            Active ({categorizedBookings.active.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming ({categorizedBookings.upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({categorizedBookings.past.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {categorizedBookings.active.length > 0 
            ? renderBookingsTable(categorizedBookings.active)
            : renderEmptyState('active', CalendarCheck, 'No Active Bookings', 'Current workspace users will appear here')
          }
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {categorizedBookings.upcoming.length > 0 
            ? renderBookingsTable(categorizedBookings.upcoming)
            : renderEmptyState('upcoming', Clock, 'No Upcoming Bookings', 'Future bookings will appear here')
          }
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {categorizedBookings.past.length > 0 
            ? renderBookingsTable(categorizedBookings.past)
            : renderEmptyState('past', CheckCircle, 'No Past Bookings', 'Completed bookings will appear here')
          }
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkspaceBookingsPage;
