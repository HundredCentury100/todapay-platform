import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, Clock, AlertCircle, Loader2, MapPin, 
  Users, Calendar, CheckCircle, Building2 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';
import MobileAppLayout from '@/components/MobileAppLayout';

interface QuoteData {
  id: string;
  venue_id: string;
  venue_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  event_type: string;
  event_date: string;
  start_time: string;
  end_time: string;
  expected_guests: number;
  quoted_price: number;
  notes: string | null;
  status: string;
  payment_link_code: string;
  booking_id: string;
  expires_at: string | null;
}

const VenueQuoteCheckout = () => {
  const { linkCode } = useParams<{ linkCode: string }>();
  const navigate = useNavigate();
  const { convertPrice } = useCurrency();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!linkCode) { setError('Invalid link'); setLoading(false); return; }

      const { data, error: fetchError } = await supabase
        .from('venue_quotes')
        .select('*, venues(name)')
        .eq('payment_link_code', linkCode)
        .single();

      if (fetchError || !data) {
        setError('This payment link is invalid or not found');
        setLoading(false);
        return;
      }

      if (data.status === 'accepted') {
        setError('This quote has already been paid');
        setLoading(false);
        return;
      }

      if (data.status !== 'quoted') {
        setError('This quote is no longer available for payment');
        setLoading(false);
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('This quote has expired. Please request a new one.');
        setLoading(false);
        return;
      }

      setQuote({
        ...data,
        venue_name: (data as any).venues?.name || 'Venue',
      } as QuoteData);
      setLoading(false);
    };
    load();
  }, [linkCode]);

  const getExpiryText = () => {
    if (!quote?.expires_at) return null;
    const expiry = new Date(quote.expires_at);
    const hoursLeft = differenceInHours(expiry, new Date());
    if (hoursLeft > 24) return `Expires ${format(expiry, 'PPP')}`;
    const minsLeft = differenceInMinutes(expiry, new Date());
    if (minsLeft < 60) return `Expires in ${minsLeft} minutes`;
    return `Expires in ${hoursLeft} hours`;
  };

  const handlePayNow = async () => {
    if (!quote) return;
    setPaying(true);

    try {
      // Navigate to BookingConfirm with the booking ID for smart checkout
      navigate(`/booking/confirm`, {
        state: {
          bookingId: quote.booking_id,
          bookingType: 'venue',
          itemName: quote.venue_name,
          totalPrice: quote.quoted_price,
          passengerName: quote.customer_name,
          passengerEmail: quote.customer_email,
          passengerPhone: quote.customer_phone || '',
          eventDate: quote.event_date,
          eventTime: quote.start_time,
          fromQuote: true,
          quoteId: quote.id,
        }
      });
    } catch (err) {
      toast.error('Failed to proceed to payment');
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <MobileAppLayout hideNav>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="py-8 text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <h2 className="text-xl font-bold">{error || 'Quote not found'}</h2>
              <p className="text-muted-foreground text-sm">
                If you believe this is an error, please contact the venue directly.
              </p>
              <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
            </CardContent>
          </Card>
        </div>
      </MobileAppLayout>
    );
  }

  return (
    <MobileAppLayout hideNav>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full shadow-xl border-primary/10">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 p-3 bg-primary/10 rounded-full w-fit">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <Badge variant="secondary" className="w-fit mx-auto mb-2 capitalize">
              {quote.event_type.replace(/_/g, ' ')}
            </Badge>
            <CardTitle className="text-2xl">{quote.venue_name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Quote for {quote.customer_name}
            </p>
          </CardHeader>

          <CardContent className="space-y-5">
            <Separator />

            {/* Event Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Date</p>
                  <p className="font-medium">{format(new Date(quote.event_date), 'MMM dd, yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Time</p>
                  <p className="font-medium">{quote.start_time} - {quote.end_time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Guests</p>
                  <p className="font-medium">{quote.expected_guests}</p>
                </div>
              </div>
            </div>

            {/* Merchant Notes */}
            {quote.notes && (
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <p className="text-muted-foreground text-xs mb-1">Notes from venue</p>
                <p>{quote.notes}</p>
              </div>
            )}

            <Separator />

            {/* Amount */}
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-4xl font-bold text-foreground">
                {convertPrice(quote.quoted_price)}
              </p>
            </div>

            {/* Expiry */}
            {quote.expires_at && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{getExpiryText()}</span>
              </div>
            )}

            <Separator />

            {/* Pay Button */}
            <Button 
              size="lg" 
              className="w-full bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25" 
              onClick={handlePayNow}
              disabled={paying}
            >
              {paying ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-5 w-5 mr-2" />
              )}
              Pay Now
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Secure payment powered by Suvat Pay
            </p>
          </CardContent>
        </Card>
      </div>
    </MobileAppLayout>
  );
};

export default VenueQuoteCheckout;
