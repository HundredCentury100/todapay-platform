import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Megaphone, Bus, Calendar, ExternalLink } from 'lucide-react';
import { Advertisement, recordImpression, recordClick } from '@/services/advertisingService';
import { useNavigate } from 'react-router-dom';

interface SponsoredCardProps {
  ad: Advertisement;
  placement: string;
  className?: string;
}

export const SponsoredCard = ({ ad, placement, className = '' }: SponsoredCardProps) => {
  const navigate = useNavigate();
  const [impressionRecorded, setImpressionRecorded] = useState(false);

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

  const getIcon = () => {
    switch (ad.destination_type) {
      case 'bus': return <Bus className="h-5 w-5" />;
      case 'event': return <Calendar className="h-5 w-5" />;
      default: return <ExternalLink className="h-5 w-5" />;
    }
  };

  return (
    <Card 
      className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-primary/20 bg-gradient-to-br from-primary/5 to-transparent ${className}`}
      onClick={handleClick}
    >
      <div className="absolute top-2 left-2 z-10">
        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
          <Megaphone className="h-3 w-3 mr-1" />
          Sponsored
        </Badge>
      </div>
      
      {ad.image_url && (
        <div className="h-32 overflow-hidden">
          <img 
            src={ad.image_url} 
            alt={ad.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardContent className={`p-4 ${ad.image_url ? '' : 'pt-10'}`}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{ad.title}</h3>
            {ad.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {ad.description}
              </p>
            )}
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-3 border-primary/30 hover:bg-primary/10"
        >
          Learn More
        </Button>
      </CardContent>
    </Card>
  );
};
