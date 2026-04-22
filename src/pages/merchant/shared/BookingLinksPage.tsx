import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BookingLinkGenerator from '@/components/booking-links/BookingLinkGenerator';
import BookingLinksList from '@/components/booking-links/BookingLinksList';

const BookingLinksPage = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  // For now we pass the user ID as merchant profile - the service will look up via RLS
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Booking Links</h1>
        <p className="text-muted-foreground">Create and manage shareable booking & payment links</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <BookingLinkGenerator
            onLinkCreated={() => setRefreshKey(k => k + 1)}
          />
        </div>
        <div className="lg:col-span-2">
          <BookingLinksList refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
};

export default BookingLinksPage;
