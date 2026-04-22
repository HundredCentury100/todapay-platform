import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentEmployeeAccount } from '@/services/corporateService';
import BookingLinkGenerator from '@/components/booking-links/BookingLinkGenerator';
import BookingLinksList from '@/components/booking-links/BookingLinksList';
import { Loader2 } from 'lucide-react';

const CorporateBookingLinks = () => {
  const { user } = useAuth();
  const [corporateAccountId, setCorporateAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getCurrentEmployeeAccount();
        if (result) setCorporateAccountId(result.account.id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Share Events</h1>
        <p className="text-muted-foreground">Generate booking links to distribute events to your employees</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <BookingLinkGenerator
            corporateAccountId={corporateAccountId || undefined}
            onLinkCreated={() => setRefreshKey(k => k + 1)}
          />
        </div>
        <div className="lg:col-span-2">
          <BookingLinksList
            corporateAccountId={corporateAccountId || undefined}
            refreshKey={refreshKey}
          />
        </div>
      </div>
    </div>
  );
};

export default CorporateBookingLinks;
