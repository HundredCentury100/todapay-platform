import { useEffect, useState } from 'react';
import { Advertisement, getActiveAds } from '@/services/advertisingService';
import { SponsoredCard } from './SponsoredCard';
import { BannerAd } from './BannerAd';

interface AdContainerProps {
  adType: 'sponsored_card' | 'banner';
  placement: string;
  variant?: 'horizontal' | 'vertical' | 'hero';
  maxAds?: number;
  filters?: {
    location?: string;
    eventType?: string;
    routeType?: string;
  };
  className?: string;
}

export const AdContainer = ({
  adType,
  placement,
  variant = 'horizontal',
  maxAds = 1,
  filters,
  className = ''
}: AdContainerProps) => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const activeAds = await getActiveAds(adType, filters);
        // Randomize and limit
        const shuffled = activeAds.sort(() => Math.random() - 0.5);
        setAds(shuffled.slice(0, maxAds));
      } catch (error) {
        console.error('Failed to fetch ads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [adType, maxAds, filters?.location, filters?.eventType, filters?.routeType]);

  if (loading || ads.length === 0) return null;

  return (
    <div className={className}>
      {ads.map((ad) => (
        adType === 'sponsored_card' ? (
          <SponsoredCard key={ad.id} ad={ad} placement={placement} />
        ) : (
          <BannerAd key={ad.id} ad={ad} placement={placement} variant={variant} />
        )
      ))}
    </div>
  );
};
