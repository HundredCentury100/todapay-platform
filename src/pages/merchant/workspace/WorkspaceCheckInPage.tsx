import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CameraQRScanner from "@/components/CameraQRScanner";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QrCode, Search, CheckCircle, XCircle, Clock, User, Briefcase, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";

interface BookingResult {
  id: string;
  booking_reference: string;
  passenger_name: string;
  passenger_email: string;
  item_name: string;
  status: string;
  checked_in: boolean;
  checked_in_at?: string;
  start_datetime?: string;
  end_datetime?: string;
  num_attendees?: number;
}

const WorkspaceCheckInPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [booking, setBooking] = useState<BookingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const searchBooking = async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setBooking(null);

    try {
      // First, try to find by booking reference
      let { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_reference,
          passenger_name,
          passenger_email,
          item_name,
          status,
          checked_in,
          checked_in_at,
          departure_time,
          arrival_time
        `)
        .eq('booking_type', 'workspace')
        .or(`booking_reference.ilike.%${query}%,ticket_number.ilike.%${query}%`)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Get workspace booking details
        const { data: wsBooking } = await supabase
          .from('workspace_bookings')
          .select('start_datetime, end_datetime, num_attendees')
          .eq('booking_id', data.id)
          .single();

        setBooking({
          ...data,
          start_datetime: wsBooking?.start_datetime,
          end_datetime: wsBooking?.end_datetime,
          num_attendees: wsBooking?.num_attendees
        });
      } else {
        toast({
          title: "Not Found",
          description: "No workspace booking found with that reference",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Error",
        description: "Failed to search for booking",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!booking) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (error) throw error;

      setBooking({
        ...booking,
        checked_in: true,
        checked_in_at: new Date().toISOString()
      });

      toast({
        title: "Check-in Successful!",
        description: `${booking.passenger_name} has been checked in`
      });
    } catch (error) {
      console.error("Check-in error:", error);
      toast({
        title: "Check-in Failed",
        description: "Failed to check in guest",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = (result: string) => {
    setShowScanner(false);
    try {
      const data = JSON.parse(result);
      if (data.ref) {
        searchBooking(data.ref);
      }
    } catch {
      // If not JSON, treat as plain reference
      searchBooking(result);
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy HH:mm');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Check-In</h1>
        <p className="text-muted-foreground">Scan QR codes or search to check in guests</p>
      </div>

      <Tabs defaultValue="scan" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scan" className="gap-2">
            <QrCode className="h-4 w-4" />
            Scan QR
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scan">
          <Card>
            <CardHeader>
              <CardTitle>Scan Booking QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              {showScanner ? (
                <div className="space-y-4">
                  <CameraQRScanner onScan={handleScan} />
                  <Button variant="outline" onClick={() => setShowScanner(false)} className="w-full">
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setShowScanner(true)} className="w-full h-32">
                  <QrCode className="h-8 w-8 mr-2" />
                  Start Scanner
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Search Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter booking reference or ticket number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchBooking(searchQuery)}
                />
                <Button onClick={() => searchBooking(searchQuery)} disabled={isLoading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Booking Result */}
      {booking && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Booking Details</CardTitle>
              {booking.checked_in ? (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Checked In
                </Badge>
              ) : (
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Guest</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{booking.passenger_name}</p>
                </div>
                <p className="text-sm text-muted-foreground">{booking.passenger_email}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Workspace</p>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{booking.item_name}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Time</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    {formatDateTime(booking.start_datetime)} - {formatDateTime(booking.end_datetime)}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Reference</p>
                <p className="font-mono text-sm">{booking.booking_reference}</p>
              </div>
            </div>

            {booking.checked_in ? (
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  Checked in at {formatDateTime(booking.checked_in_at)}
                </AlertDescription>
              </Alert>
            ) : booking.status === 'cancelled' ? (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  This booking has been cancelled
                </AlertDescription>
              </Alert>
            ) : (
              <Button onClick={handleCheckIn} disabled={isLoading} className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Check In Guest
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkspaceCheckInPage;
