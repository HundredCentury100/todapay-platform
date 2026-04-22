import { useEffect, useMemo, useState, useCallback, ReactNode } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { useGoogleMaps } from './GoogleMapsProvider';
import { lightMapStyles, darkMapStyles } from '@/styles/mapStyles';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '@/services/mapUtils';
import { useThemeDetect } from '@/hooks/useThemeDetect';
import { Loader2, MapPin } from 'lucide-react';

interface BaseMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  children?: ReactNode;
  scrollWheelZoom?: boolean;
  dragging?: boolean;
  zoomControl?: boolean;
  bounds?: google.maps.LatLngBounds | null;
  maxZoom?: number;
  minZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
  onClick?: (e: google.maps.MapMouseEvent) => void;
}

export function BaseMap({
  center,
  zoom = DEFAULT_ZOOM,
  className = 'h-[300px] w-full rounded-xl overflow-hidden',
  children,
  scrollWheelZoom = false,
  dragging = true,
  zoomControl = true,
  bounds,
  maxZoom = 18,
  minZoom = 3,
  onMapReady,
  onClick,
}: BaseMapProps) {
  const { isLoaded, loadError, isApiKeyAvailable, retryLoad } = useGoogleMaps();
  const isDark = useThemeDetect();
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const mapCenter = useMemo(() => center || DEFAULT_CENTER, [center]);

  const mapOptions: google.maps.MapOptions = useMemo(() => ({
    styles: isDark ? darkMapStyles : lightMapStyles,
    disableDefaultUI: true,
    zoomControl,
    scrollwheel: scrollWheelZoom,
    draggable: dragging,
    maxZoom,
    minZoom,
    gestureHandling: 'greedy',
    clickableIcons: false,
  }), [isDark, zoomControl, scrollWheelZoom, dragging, maxZoom, minZoom]);

  const onLoad = useCallback((m: google.maps.Map) => {
    setMap(m);
    onMapReady?.(m);
  }, [onMapReady]);

  useEffect(() => {
    if (map && bounds) map.fitBounds(bounds, 50);
  }, [map, bounds]);

  if (loadError || !isApiKeyAvailable) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <div className="text-center text-muted-foreground p-4">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Map unavailable</p>
          {retryLoad && (
            <button type="button" onClick={retryLoad} className="text-xs underline underline-offset-4 mt-2">Retry</button>
          )}
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`${className} touch-manipulation`}>
      <GoogleMap
        mapContainerStyle={{ height: '100%', width: '100%' }}
        center={mapCenter}
        zoom={zoom}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={() => setMap(null)}
        onClick={onClick}
      >
        {children}
      </GoogleMap>
    </div>
  );
}

export default BaseMap;
