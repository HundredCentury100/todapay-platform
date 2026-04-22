import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookingLinkByCode, incrementLinkUsage } from '@/services/bookingLinkService';
import { Loader2 } from 'lucide-react';

const BookingLinkResolver = () => {
  const { linkCode } = useParams<{ linkCode: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolve = async () => {
      if (!linkCode) {
        setError('Invalid link');
        return;
      }

      const link = await getBookingLinkByCode(linkCode);
      if (!link) {
        setError('This link is invalid or has expired');
        return;
      }

      // Check expiry
      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        setError('This link has expired');
        return;
      }

      // Check max uses
      if (link.max_uses !== null && link.times_used >= link.max_uses) {
        setError('This link has reached its usage limit');
        return;
      }

      // Increment usage
      await incrementLinkUsage(link.id);

      // Route based on link type
      if (link.link_type === 'payment') {
        navigate(`/pay-link/${linkCode}`, { replace: true });
        return;
      }

      // Booking link: redirect to service page with preset params
      const config = link.preset_config || {};
      const params = new URLSearchParams();
      if (config.promo_code) params.set('promo', config.promo_code);
      if (config.tier_id) params.set('tier', config.tier_id);
      if (config.quantity) params.set('qty', config.quantity);
      if (link.corporate_account_id) params.set('corporate', link.corporate_account_id);

      const queryString = params.toString();
      const serviceRoutes: Record<string, string> = {
        event: '/events',
        bus: '/buses',
        venue: '/venues',
        stay: '/stays',
        workspace: '/workspaces',
        experience: '/experiences',
        transfer: '/transfers',
      };

      const basePath = serviceRoutes[link.service_type] || '/events';
      const url = `${basePath}/${link.service_id}${queryString ? `?${queryString}` : ''}`;
      navigate(url, { replace: true });
    };

    resolve();
  }, [linkCode, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Link Unavailable</h1>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="text-primary underline"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Redirecting you...</p>
      </div>
    </div>
  );
};

export default BookingLinkResolver;
