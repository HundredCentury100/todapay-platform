import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { getBookingLinkByCode, type BookingLink } from '@/services/bookingLinkService';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';

const PayLinkCheckout = () => {
  const { linkCode } = useParams<{ linkCode: string }>();
  const navigate = useNavigate();
  const [link, setLink] = useState<BookingLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!linkCode) { setError('Invalid link'); setLoading(false); return; }
      const data = await getBookingLinkByCode(linkCode);
      if (!data) { setError('This payment link is invalid or has expired'); setLoading(false); return; }
      if (data.link_type !== 'payment') { navigate(`/book/${linkCode}`, { replace: true }); return; }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { setError('This payment link has expired'); setLoading(false); return; }
      if (data.max_uses !== null && data.times_used >= data.max_uses) { setError('This payment link has reached its limit'); setLoading(false); return; }
      setLink(data);
      setLoading(false);
    };
    load();
  }, [linkCode, navigate]);

  const getExpiryText = () => {
    if (!link?.expires_at) return null;
    const expiry = new Date(link.expires_at);
    const hoursLeft = differenceInHours(expiry, new Date());
    if (hoursLeft > 24) return `Expires ${format(expiry, 'PPP')}`;
    const minsLeft = differenceInMinutes(expiry, new Date());
    if (minsLeft < 60) return `Expires in ${minsLeft} minutes`;
    return `Expires in ${hoursLeft} hours`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-xl font-bold">{error || 'Link not found'}</h2>
            <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <Badge variant="secondary" className="w-fit mx-auto mb-2 capitalize">{link.service_type}</Badge>
          <CardTitle className="text-2xl">{link.service_name}</CardTitle>
          {link.custom_message && (
            <CardDescription className="text-base mt-2">{link.custom_message}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator />

          {/* Amount */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Amount Due</p>
            <p className="text-4xl font-bold text-foreground">
              {link.currency} {link.fixed_amount?.toFixed(2) || '0.00'}
            </p>
          </div>

          {/* Expiry */}
          {link.expires_at && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{getExpiryText()}</span>
            </div>
          )}

          <Separator />

          {/* Pay Button */}
          <Button size="lg" className="w-full" onClick={() => navigate('/pay')}>
            <CreditCard className="h-5 w-5 mr-2" />
            Pay Now
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by Suvat Pay
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayLinkCheckout;
