import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  MessageSquareQuote, Send, X, Clock, CheckCircle, 
  XCircle, Users, Calendar, Mail, Phone, FileText,
  ArrowRight
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface VenueQuote {
  id: string;
  venue_id: string;
  venue_name?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  event_type: string;
  event_date: string;
  start_time: string;
  end_time: string;
  expected_guests: number;
  message: string | null;
  quoted_price: number | null;
  notes: string | null;
  status: string;
  created_at: string;
  responded_at: string | null;
  expires_at: string | null;
}

const QuotesPage = () => {
  const { user } = useAuth();
  const { convertPrice } = useCurrency();
  const [quotes, setQuotes] = useState<VenueQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<VenueQuote | null>(null);
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [dialogMode, setDialogMode] = useState<"quote" | "view" | "convert">("quote");

  useEffect(() => {
    fetchQuotes();
  }, [user]);

  const fetchQuotes = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('merchant_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

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

      const { data, error } = await supabase
        .from('venue_quotes')
        .select('*')
        .in('venue_id', venueIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedQuotes = (data || []).map(q => ({
        ...q,
        venue_name: venueMap[q.venue_id] || 'Unknown'
      }));

      setQuotes(formattedQuotes);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast.error('Failed to load quote requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSendQuote = async () => {
    if (!selectedQuote || !quotePrice) return;

    try {
      const price = parseFloat(quotePrice);
      const paymentLinkCode = `VQ-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      const ticketNumber = `VEN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // 1. Create a pending booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          booking_type: 'venue',
          item_id: selectedQuote.venue_id,
          item_name: selectedQuote.venue_name || 'Venue Booking',
          passenger_name: selectedQuote.customer_name,
          passenger_email: selectedQuote.customer_email,
          passenger_phone: selectedQuote.customer_phone || '',
          guest_email: selectedQuote.customer_email,
          total_price: price,
          base_price: price,
          status: 'pending',
          payment_status: 'pending',
          ticket_number: ticketNumber,
          event_date: selectedQuote.event_date,
          event_time: selectedQuote.start_time,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // 2. Create venue booking record
      const startDatetime = `${selectedQuote.event_date}T${selectedQuote.start_time}:00`;
      const endDatetime = `${selectedQuote.event_date}T${selectedQuote.end_time}:00`;

      await supabase
        .from('venue_bookings')
        .insert({
          booking_id: booking.id,
          venue_id: selectedQuote.venue_id,
          event_type: selectedQuote.event_type,
          start_datetime: startDatetime,
          end_datetime: endDatetime,
          expected_guests: selectedQuote.expected_guests,
        });

      // 3. Update quote with price, booking link, and booking ID
      const { error } = await supabase
        .from('venue_quotes')
        .update({
          quoted_price: price,
          notes: quoteNotes || null,
          status: 'quoted',
          responded_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          booking_id: booking.id,
          payment_link_code: paymentLinkCode,
        })
        .eq('id', selectedQuote.id);

      if (error) throw error;

      // 4. Send notification to customer (best-effort)
      try {
        await supabase.functions.invoke('send-booking-confirmation', {
          body: {
            bookingId: booking.id,
            type: 'venue_quote',
            paymentLink: `https://fulticket.com/venues/quote/${paymentLinkCode}`,
            customerEmail: selectedQuote.customer_email,
            customerName: selectedQuote.customer_name,
            venueName: selectedQuote.venue_name,
            quotedPrice: price,
            eventDate: selectedQuote.event_date,
          }
        });
      } catch (notifErr) {
        console.warn('Quote notification failed (non-blocking):', notifErr);
      }

      setQuotes(quotes.map(q => 
        q.id === selectedQuote.id 
          ? { ...q, quoted_price: price, notes: quoteNotes || null, status: 'quoted' }
          : q
      ));
      
      toast.success('Quote sent! Customer will receive a payment link via email.');
      closeDialog();
    } catch (error) {
      console.error('Error sending quote:', error);
      toast.error('Failed to send quote');
    }
  };

  const handleDecline = async (id: string) => {
    try {
      const { error } = await supabase
        .from('venue_quotes')
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setQuotes(quotes.map(q => q.id === id ? { ...q, status: 'declined' } : q));
      toast.success('Quote request declined');
    } catch (error) {
      toast.error('Failed to decline quote');
    }
  };

  const handleConvertToBooking = async () => {
    if (!selectedQuote) return;

    try {
      // Create the main booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          booking_type: 'venue',
          item_id: selectedQuote.venue_id,
          item_name: selectedQuote.venue_name || 'Venue Booking',
          passenger_name: selectedQuote.customer_name,
          passenger_email: selectedQuote.customer_email,
          passenger_phone: selectedQuote.customer_phone || '',
          guest_email: selectedQuote.customer_email,
          total_price: selectedQuote.quoted_price || 0,
          base_price: selectedQuote.quoted_price || 0,
          status: 'confirmed',
          payment_status: 'pending',
          ticket_number: `VEN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          event_date: selectedQuote.event_date,
          event_time: selectedQuote.start_time,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create venue booking record
      const startDatetime = `${selectedQuote.event_date}T${selectedQuote.start_time}:00`;
      const endDatetime = `${selectedQuote.event_date}T${selectedQuote.end_time}:00`;

      const { error: venueBookingError } = await supabase
        .from('venue_bookings')
        .insert({
          booking_id: booking.id,
          venue_id: selectedQuote.venue_id,
          event_type: selectedQuote.event_type,
          start_datetime: startDatetime,
          end_datetime: endDatetime,
          expected_guests: selectedQuote.expected_guests,
        });

      if (venueBookingError) throw venueBookingError;

      // Update quote status
      await supabase
        .from('venue_quotes')
        .update({ status: 'accepted' })
        .eq('id', selectedQuote.id);

      setQuotes(quotes.map(q => 
        q.id === selectedQuote.id ? { ...q, status: 'accepted' } : q
      ));

      toast.success('Booking created successfully!');
      closeDialog();
    } catch (error) {
      console.error('Error converting to booking:', error);
      toast.error('Failed to create booking');
    }
  };

  const closeDialog = () => {
    setSelectedQuote(null);
    setQuotePrice("");
    setQuoteNotes("");
    setDialogMode("quote");
  };

  const openQuoteDialog = (quote: VenueQuote, mode: "quote" | "view" | "convert") => {
    setSelectedQuote(quote);
    setDialogMode(mode);
    if (quote.quoted_price) setQuotePrice(quote.quoted_price.toString());
    if (quote.notes) setQuoteNotes(quote.notes);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: React.ReactNode }> = {
      pending: { variant: "secondary", label: "Pending", icon: <Clock className="h-3 w-3" /> },
      quoted: { variant: "default", label: "Quoted", icon: <Send className="h-3 w-3" /> },
      accepted: { variant: "outline", label: "Accepted", icon: <CheckCircle className="h-3 w-3" /> },
      declined: { variant: "destructive", label: "Declined", icon: <XCircle className="h-3 w-3" /> },
    };
    const { variant, label, icon } = config[status] || config.pending;
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {icon}
        {label}
      </Badge>
    );
  };

  const filterQuotes = (status: string) => {
    if (status === "all") return quotes;
    return quotes.filter(q => q.status === status);
  };

  const stats = {
    pending: quotes.filter(q => q.status === "pending").length,
    quoted: quotes.filter(q => q.status === "quoted").length,
    accepted: quotes.filter(q => q.status === "accepted").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const QuoteRow = ({ quote }: { quote: VenueQuote }) => (
    <TableRow key={quote.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openQuoteDialog(quote, "view")}>
      <TableCell className="font-medium">{quote.venue_name}</TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{quote.customer_name}</p>
          <p className="text-xs text-muted-foreground">{quote.customer_email}</p>
        </div>
      </TableCell>
      <TableCell>
        <span className="capitalize">{quote.event_type.replace(/_/g, ' ')}</span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          {format(new Date(quote.event_date), 'MMM dd, yyyy')}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3 text-muted-foreground" />
          {quote.expected_guests || '-'}
        </div>
      </TableCell>
      <TableCell>{getStatusBadge(quote.status)}</TableCell>
      <TableCell className="font-medium">
        {quote.quoted_price ? convertPrice(quote.quoted_price) : '-'}
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        {quote.status === 'pending' && (
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => openQuoteDialog(quote, "quote")}
            >
              <Send className="h-3 w-3 mr-1" />
              Quote
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDecline(quote.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        {quote.status === 'quoted' && (
          <Badge variant="outline" className="text-xs">
            Payment link sent
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quote Requests</h1>
        <p className="text-muted-foreground">Manage and respond to venue inquiries</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.quoted}</p>
                <p className="text-sm text-muted-foreground">Awaiting Response</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.accepted}</p>
                <p className="text-sm text-muted-foreground">Converted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({quotes.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="quoted">Quoted ({stats.quoted})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({stats.accepted})</TabsTrigger>
        </TabsList>

        {["all", "pending", "quoted", "accepted"].map(status => (
          <TabsContent key={status} value={status}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareQuote className="h-5 w-5" />
                  {status === "all" ? "All Requests" : `${status.charAt(0).toUpperCase() + status.slice(1)} Requests`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filterQuotes(status).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No {status === "all" ? "" : status} quote requests</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Venue</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Event Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Guests</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Quote</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filterQuotes(status).map(quote => (
                          <QuoteRow key={quote.id} quote={quote} />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Quote/View/Convert Dialog */}
      <Dialog open={!!selectedQuote} onOpenChange={closeDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "quote" && "Send Quote"}
              {dialogMode === "view" && "Quote Details"}
              {dialogMode === "convert" && "Convert to Booking"}
            </DialogTitle>
            {dialogMode === "convert" && (
              <DialogDescription>
                Create a confirmed booking from this accepted quote
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedQuote && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{selectedQuote.customer_name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {selectedQuote.customer_email}
                  </span>
                  {selectedQuote.customer_phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedQuote.customer_phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Event Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Venue</span>
                  <p className="font-medium">{selectedQuote.venue_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Event Type</span>
                  <p className="font-medium capitalize">{selectedQuote.event_type.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date</span>
                  <p className="font-medium">{format(new Date(selectedQuote.event_date), 'EEEE, MMMM dd, yyyy')}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Time</span>
                  <p className="font-medium">{selectedQuote.start_time} - {selectedQuote.end_time}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Expected Guests</span>
                  <p className="font-medium">{selectedQuote.expected_guests || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Requested</span>
                  <p className="font-medium">{formatDistanceToNow(new Date(selectedQuote.created_at), { addSuffix: true })}</p>
                </div>
              </div>

              {selectedQuote.message && (
                <div>
                  <Label className="text-muted-foreground">Customer Message</Label>
                  <div className="flex items-start gap-2 mt-1">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm bg-muted p-3 rounded-md flex-1">{selectedQuote.message}</p>
                  </div>
                </div>
              )}

              {/* Quote Input (for quote mode) */}
              {dialogMode === "quote" && (
                <>
                  <div>
                    <Label htmlFor="quotePrice">Quote Amount</Label>
                    <Input
                      id="quotePrice"
                      type="number"
                      placeholder="Enter price"
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quoteNotes">Notes (optional)</Label>
                    <Textarea
                      id="quoteNotes"
                      placeholder="Add any notes or terms for the customer..."
                      value={quoteNotes}
                      onChange={(e) => setQuoteNotes(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </>
              )}

              {/* Show quoted price for view/convert */}
              {(dialogMode === "view" || dialogMode === "convert") && selectedQuote.quoted_price && (
                <div className="bg-primary/10 p-4 rounded-lg">
                  <span className="text-sm text-muted-foreground">Quoted Price</span>
                  <p className="text-2xl font-bold text-primary">{convertPrice(selectedQuote.quoted_price)}</p>
                  {selectedQuote.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{selectedQuote.notes}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            {dialogMode === "quote" && (
              <Button onClick={handleSendQuote} disabled={!quotePrice}>
                <Send className="h-4 w-4 mr-2" />
                Send Quote
              </Button>
            )}
            {dialogMode === "convert" && (
              <Button onClick={handleConvertToBooking}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Create Booking
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotesPage;
