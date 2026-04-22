import { useMemo, useState, useCallback } from 'react';
import { MarkerClusterer } from '@react-google-maps/api';
import { BaseMap } from './BaseMap';
import { MapMarker } from './MapMarker';
import { calculateBounds, MarkerType } from '@/services/mapUtils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapItem {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  price?: string;
  image?: string;
  rating?: number;
}

interface ResultsMapViewProps {
  items: MapItem[];
  onItemClick?: (id: string) => void;
  markerType?: MarkerType;
  className?: string;
  selectedId?: string;
  onSelectionChange?: (id: string | null) => void;
}

export function ResultsMapView({ items, onItemClick, markerType = 'property', className, selectedId, onSelectionChange }: ResultsMapViewProps) {
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);

  const center = useMemo(() => {
    if (items.length === 0) return { lat: -17.8292, lng: 31.0522 };
    return { lat: items.reduce((s, i) => s + i.lat, 0) / items.length, lng: items.reduce((s, i) => s + i.lng, 0) / items.length };
  }, [items]);

  const handleMapReady = useCallback((m: google.maps.Map) => {
    if (items.length > 0) {
      const bounds = calculateBounds(items.map((i) => ({ lat: i.lat, lng: i.lng })));
      if (bounds) m.fitBounds(bounds, 50);
    }
  }, [items]);

  const handleMarkerClick = useCallback((item: MapItem) => {
    setSelectedItem(item);
    onSelectionChange?.(item.id);
  }, [onSelectionChange]);

  return (
    <div className={cn('relative', className)}>
      <BaseMap center={center} zoom={12} className="h-full w-full" scrollWheelZoom dragging onMapReady={handleMapReady}>
        <MarkerClusterer options={{ imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m', gridSize: 50, minimumClusterSize: 2, maxZoom: 15 }}>
          {(clusterer) => (
            <>
              {items.map((item) => (
                <MapMarker key={item.id} position={{ lat: item.lat, lng: item.lng }} type={markerType} size={selectedId === item.id ? 'lg' : 'md'} pulse={selectedId === item.id} onClick={() => { handleMarkerClick(item); onItemClick?.(item.id); }} />
              ))}
            </>
          )}
        </MarkerClusterer>
      </BaseMap>

      {selectedItem && (
        <Card className="absolute bottom-3 left-3 right-3 md:left-auto md:right-4 md:w-80 p-0 overflow-hidden shadow-lg z-[1000]">
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10 h-8 w-8 bg-background/80" onClick={() => { setSelectedItem(null); onSelectionChange?.(null); }}>
            <X className="h-4 w-4" />
          </Button>
          {selectedItem.image && <img src={selectedItem.image} alt={selectedItem.title} className="w-full h-28 sm:h-32 object-cover" />}
          <div className="p-3 sm:p-4">
            <h3 className="font-semibold line-clamp-1 text-sm sm:text-base">{selectedItem.title}</h3>
            {selectedItem.subtitle && <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-0.5">{selectedItem.subtitle}</p>}
            <div className="flex items-center justify-between mt-2">
              {selectedItem.price && <span className="font-bold text-primary text-sm">{selectedItem.price}</span>}
              {selectedItem.rating && <Badge variant="secondary" className="gap-1 text-xs">⭐ {selectedItem.rating.toFixed(1)}</Badge>}
            </div>
            <div className="flex gap-2 mt-3">
              <Button className="flex-1 h-10 min-h-[40px] text-sm" onClick={() => onItemClick?.(selectedItem.id)}>View Details</Button>
              <Button variant="outline" size="icon" className="h-10 w-10 min-h-[40px] shrink-0" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedItem.lat},${selectedItem.lng}`, '_blank')}>
                <Navigation className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default ResultsMapView;
