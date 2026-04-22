import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Megaphone } from 'lucide-react';
import { Advertisement, recordImpression, recordClick } from '@/services/advertisingService';
import { useNavigate } from 'react-router-dom';

interface BannerAdProps {
  ad: Advertisement;
  placement: string;
  variant?: 'horizontal' | 'vertical' | 'hero';
  dismissible?: boolean;
  className?: string;
}

export const BannerAd = ({ 
  ad, 
  placement, 
  variant = 'horizontal',
  dismissible = true,
  className = '' 
}: BannerAdProps) => {
  const navigate = useNavigate();
  const [impressionRecorded, setImpressionRecorded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!impressionRecorded) {
      recordImpression(ad.id, placement);
      setImpressionRecorded(true);
    }
  }, [ad.id, placement, impressionRecorded]);

  const handleClick = () => {
    recordClick(ad.id);
    
    if (ad.destination_type === 'bus' && ad.destination_id) {
      navigate(`/bus/${ad.destination_id}`);
    } else if (ad.destination_type === 'event' && ad.destination_id) {
      navigate(`/event/${ad.destination_id}`);
    } else if (ad.destination_url) {
      window.open(ad.destination_url, '_blank');
    }
  };

  if (dismissed) return null;

  if (variant === 'hero') {
    return (
      <div 
        className={`relative w-full rounded-xl overflow-hidden cursor-pointer group ${className}`}
        onClick={handleClick}
      >
        {ad.image_url ? (
          <div className="relative h-48 md:h-64">
            <img 
              src={ad.image_url} 
              alt={ad.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
            <div className="absolute inset-0 p-6 flex flex-col justify-center">
              <Badge variant="secondary" className="w-fit text-xs bg-primary/20 text-primary border-0 mb-2">
                <Megaphone className="h-3 w-3 mr-1" />
                Sponsored
              </Badge>
              <h3 className="text-2xl font-bold text-foreground mb-2">{ad.title}</h3>
              {ad.description && (
                <p className="text-muted-foreground max-w-md mb-4">{ad.description}</p>
              )}
              <Button variant="default" className="w-fit">
                Learn More
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
            <Badge variant="secondary" className="w-fit text-xs bg-primary/20 text-primary border-0 mb-2">
              <Megaphone className="h-3 w-3 mr-1" />
              Sponsored
            </Badge>
            <h3 className="text-xl font-bold text-foreground mb-2">{ad.title}</h3>
            {ad.description && (
              <p className="text-muted-foreground mb-4">{ad.description}</p>
            )}
            <Button variant="default" size="sm">Learn More</Button>
          </div>
        )}
        
        {dismissible && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 bg-background/50 hover:bg-background/80"
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(true);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div 
        className={`relative rounded-lg overflow-hidden cursor-pointer border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent ${className}`}
        onClick={handleClick}
      >
        <Badge variant="secondary" className="absolute top-2 left-2 z-10 text-xs bg-primary/20 text-primary border-0">
          <Megaphone className="h-3 w-3 mr-1" />
          Ad
        </Badge>
        
        {ad.image_url && (
          <div className="h-32">
            <img 
              src={ad.image_url} 
              alt={ad.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className={`p-3 ${ad.image_url ? '' : 'pt-8'}`}>
          <h4 className="font-medium text-sm text-foreground">{ad.title}</h4>
          {ad.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{ad.description}</p>
          )}
        </div>
        
        {dismissible && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-5 w-5"
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(true);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  // Horizontal banner (default)
  return (
    <div 
      className={`relative flex items-center gap-4 p-4 rounded-lg cursor-pointer border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent hover:bg-primary/10 transition-colors ${className}`}
      onClick={handleClick}
    >
      <Badge variant="secondary" className="absolute top-2 left-2 text-xs bg-primary/20 text-primary border-0">
        <Megaphone className="h-3 w-3 mr-1" />
        Sponsored
      </Badge>
      
      {ad.image_url && (
        <div className="h-16 w-24 rounded overflow-hidden flex-shrink-0">
          <img 
            src={ad.image_url} 
            alt={ad.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="flex-1 min-w-0 pt-4">
        <h4 className="font-medium text-foreground truncate">{ad.title}</h4>
        {ad.description && (
          <p className="text-sm text-muted-foreground truncate">{ad.description}</p>
        )}
      </div>
      
      <Button variant="outline" size="sm" className="flex-shrink-0">
        View
      </Button>
      
      {dismissible && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-5 w-5"
          onClick={(e) => {
            e.stopPropagation();
            setDismissed(true);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};
