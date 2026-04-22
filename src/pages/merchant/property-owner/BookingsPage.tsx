import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  CalendarCheck, Clock, CheckCircle, XCircle, Search, 
  User, Mail, Phone, Calendar, MapPin, DoorOpen, BedDouble, QrCode
} from "lucide-react";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format, isAfter, isBefore, isToday, parseISO } from "date-fns";
import { toast } from "sonner";
import StayCheckInScanner from "@/components/stays/StayCheckInScanner";

interface StayBooking {
  id: string;
  booking_id: string;
  property_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  num_rooms: number;
  special_requests?: string | null;
  guest_details: any;
  created_at: string;
  booking?: {
    id: string;
    booking_reference: string;
    passenger_name: string;
    passenger_email: string;
    passenger_phone: string;
    total_price: number;
    payment_status: string;
    status: string;
    checked_in: boolean;
  } | null;
  property?: {
    id: string;
    name: string;
  } | null;
  room?: {
    id: string;
    name: string;
    room_type: string;
  } | null;
}

const BookingsPage = () => {
  const { merchantProfile } = useMerchantAuth();
  const { convertPrice } = useCurrency();
  const [bookings, setBookings] = useState<StayBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCheckInScanner, setShowCheckInScanner] = useState(false);

  useEffect(() => {
    if (merchantProfile?.id) {
      fetchBookings();
    }
  }, [merchantProfile?.id]);

  const fetchBookings = async () => {
    if (!merchantProfile?.id) return;
    
    try {
      // First get properties for this merchant
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('merchant_profile_id', merchantProfile.id);
      
      if (!properties || properties.length === 0) {
        setBookings([]);
        setLoading(false);
        return;
      }

      const propertyIds = properties.map(p => p.id);

      // Then get stay bookings for those properties
      const { data, error } = await supabase
        .from('stay_bookings')
        .select(`
          *,
          booking:bookings(*),
          property:properties(id, name),
          room:rooms(id, name, room_type)
        `)
        .in('property_id', propertyIds)
        .order('check_in_date', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const categorizeBookings = () => {
    const now = new Date();
    const filtered = bookings.filter(b => 
      b.booking?.passenger_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.booking?.booking_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.property?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
      upcoming: filtered.filter(b => {
        const checkIn = parseISO(b.check_in_date);
        return isAfter(checkIn, now) && b.booking?.status !== 'cancelled';
      }),
      current: filtered.filter(b => {
        const checkIn = parseISO(b.check_in_date);
        const checkOut = parseISO(b.check_out_date);
        return (isBefore(checkIn, now) || isToday(checkIn)) && 
               isAfter(checkOut, now) && 
               b.booking?.status !== 'cancelled';
      }),
      completed: filtered.filter(b => {
        const checkOut = parseISO(b.check_out_date);
        return isBefore(checkOut, now) && b.booking?.status !== 'cancelled';
      }),
      cancelled: filtered.filter(b => b.booking?.status === 'cancelled')
    };
  };

  const handleCheckIn = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ checked_in: true, checked_in_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) throw error;
      toast.success('Guest checked in successfully');
      fetchBookings();
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Failed to check in guest');
    }
  };

  const categories = categorizeBookings();

  const BookingCard = ({ booking }: { booking: StayBooking }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={
                booking.booking?.payment_status === 'paid' ? 'default' : 
                booking.booking?.payment_status === 'pending' ? 'secondary' : 'destructive'
              }>
                {booking.booking?.payment_status || 'Unknown'}
              </Badge>
              {booking.booking?.checked_in && (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  Checked In
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                #{booking.booking?.booking_reference}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{booking.booking?.passenger_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate">{booking.booking?.passenger_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{booking.booking?.passenger_phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{booking.num_guests} guests, {booking.num_rooms} room(s)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{booking.property?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <DoorOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{booking.room?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {format(parseISO(booking.check_in_date), 'MMM d')} - {format(parseISO(booking.check_out_date), 'MMM d, yyyy')}
                </span>
              </div>
            </div>

            {booking.special_requests && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                "{booking.special_requests}"
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="text-lg font-bold">
              {convertPrice(booking.booking?.total_price || 0)}
            </span>
            {!booking.booking?.checked_in && booking.booking?.status !== 'cancelled' && (
              <Button 
                size="sm" 
                onClick={() => handleCheckIn(booking.booking!.id)}
              >
                Check In Guest
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <Card className="text-center py-12">
      <CardContent>
        <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage your property bookings</p>
        </div>
        <div className="flex gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Dialog open={showCheckInScanner} onOpenChange={setShowCheckInScanner}>
            <DialogTrigger asChild>
              <Button>
                <QrCode className="h-4 w-4 mr-2" />
                Scan Check-In
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Guest Check-In</DialogTitle>
              </DialogHeader>
              <StayCheckInScanner onCheckInComplete={() => {
                fetchBookings();
                setShowCheckInScanner(false);
              }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.upcoming.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Guests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.current.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.completed.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.cancelled.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Upcoming ({categories.upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="current" className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            Current ({categories.current.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed ({categories.completed.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Cancelled ({categories.cancelled.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {categories.upcoming.length > 0 ? (
            categories.upcoming.map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          ) : (
            <EmptyState 
              icon={Clock} 
              title="No Upcoming Bookings" 
              description="Bookings will appear here once guests make reservations" 
            />
          )}
        </TabsContent>

        <TabsContent value="current" className="mt-4">
          {categories.current.length > 0 ? (
            categories.current.map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          ) : (
            <EmptyState 
              icon={CalendarCheck} 
              title="No Current Guests" 
              description="Active stays will appear here" 
            />
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {categories.completed.length > 0 ? (
            categories.completed.map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          ) : (
            <EmptyState 
              icon={CheckCircle} 
              title="No Completed Bookings" 
              description="Past stays will appear here" 
            />
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-4">
          {categories.cancelled.length > 0 ? (
            categories.cancelled.map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          ) : (
            <EmptyState 
              icon={XCircle} 
              title="No Cancelled Bookings" 
              description="Cancelled reservations will appear here" 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BookingsPage;
