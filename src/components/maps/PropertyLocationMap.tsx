import { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, ExternalLink, Share2 } from 'lucide-react';
import { BaseMap } from './BaseMap';
import { MapMarker } from './MapMarker';
import { toast } from 'sonner';

interface PropertyLocationMapProps {
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  propertyName: string;
}

export function PropertyLocationMap({ address, city, country, latitude, longitude, propertyName }: PropertyLocationMapProps) {
  const hasCoordinates = latitude !== undefined && longitude !== undefined;

  const getDirectionsUrl = () => {
    if (hasCoordinates) return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${address}, ${city}, ${country}`)}`;
  };

  const getViewMapUrl = () => {
    if (hasCoordinates) return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${city}, ${country}`)}`;
  };

  const handleShare = useCallback(async () => {
    const url = getViewMapUrl();
    if (navigator.share) {
      try { await navigator.share({ title: propertyName, text: `Check out ${propertyName} at ${address}, ${city}`, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Location link copied!');
    }
  }, [propertyName, address, city]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Location</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
          {hasCoordinates ? (
            <BaseMap center={{ lat: latitude, lng: longitude }} zoom={15} className="h-full w-full" scrollWheelZoom={false} dragging={false} zoomControl={false}>
              <MapMarker position={{ lat: latitude, lng: longitude }} type="property" />
            </BaseMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center"><MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Map preview not available</p></div>
            </div>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{propertyName}</p>
          <p>{address}</p>
          <p>{city}, {country}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" className="h-11 min-h-[44px] text-xs sm:text-sm" onClick={() => window.open(getDirectionsUrl(), '_blank')}><Navigation className="h-4 w-4 mr-1 shrink-0" />Directions</Button>
          <Button variant="outline" size="sm" className="h-11 min-h-[44px] text-xs sm:text-sm" onClick={() => window.open(getViewMapUrl(), '_blank')}><ExternalLink className="h-4 w-4 mr-1 shrink-0" />View Map</Button>
          <Button variant="outline" size="sm" className="h-11 min-h-[44px] text-xs sm:text-sm" onClick={handleShare}><Share2 className="h-4 w-4 mr-1 shrink-0" />Share</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default PropertyLocationMap;
