import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { GoogleMap, DirectionsRenderer } from '@react-google-maps/api';
import { useGoogleMaps } from '@/components/maps/GoogleMapsProvider';
import { rideMapDarkStyles, rideMapLightStyles } from '@/styles/mapStyles';
import { useThemeDetect } from '@/hooks/useThemeDetect';
import { Loader2, MapPin, Navigation2 } from 'lucide-react';

interface RideMapProps {
  pickupCoords: { lat: number; lng: number };
  dropoffCoords: { lat: number; lng: number };
  driverCoords?: { lat: number; lng: number } | null;
  pickupAddress?: string;
  dropoffAddress?: string;
  driverName?: string;
  showRoute?: boolean;
  className?: string;
  rideStatus?: string;
}

function createCustomMarker(
  map: google.maps.Map,
  position: { lat: number; lng: number },
  type: 'pickup' | 'dropoff' | 'driver',
  label?: string
): google.maps.Marker {
  const colors = {
    pickup: { bg: '#22c55e', ring: 'rgba(34,197,94,0.3)' },
    dropoff: { bg: '#5271ff', ring: 'rgba(82,113,255,0.3)' },
    driver: { bg: '#f59e0b', ring: 'rgba(245,158,11,0.3)' },
  };
  const c = colors[type];
  const size = type === 'driver' ? 44 : 36;
  const inner = type === 'driver' ? 28 : 20;

  const svg = type === 'driver'
    ? `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${c.ring}"/><circle cx="${size/2}" cy="${size/2}" r="${inner/2}" fill="${c.bg}" stroke="white" stroke-width="3"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="14">🚗</text></svg>`
    : `<svg width="${size}" height="${size+12}" viewBox="0 0 ${size} ${size+12}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size/2}" cy="${size/2}" r="${size/2-1}" fill="${c.bg}" stroke="white" stroke-width="3"/>${type === 'pickup' ? `<circle cx="${size/2}" cy="${size/2}" r="5" fill="white"/>` : `<rect x="${size/2-4}" y="${size/2-4}" width="8" height="8" rx="1" fill="white" transform="rotate(45 ${size/2} ${size/2})"/>`}<polygon points="${size/2},${size+8} ${size/2-5},${size-2} ${size/2+5},${size-2}" fill="${c.bg}"/></svg>`;

  return new google.maps.Marker({
    position, map,
    icon: {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new google.maps.Size(size, type === 'driver' ? size : size + 12),
      anchor: new google.maps.Point(size / 2, type === 'driver' ? size / 2 : size + 8),
    },
    title: label || type,
    zIndex: type === 'driver' ? 100 : type === 'pickup' ? 90 : 80,
    optimized: false,
  });
}

export const RideMap = ({
  pickupCoords, dropoffCoords, driverCoords,
  pickupAddress, dropoffAddress, driverName,
  showRoute = true, className = 'h-full w-full', rideStatus,
}: RideMapProps) => {
  const { isLoaded, loadError, isApiKeyAvailable, retryLoad } = useGoogleMaps();
  const isDark = useThemeDetect();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const hasDropoff = dropoffCoords.lat !== 0 && dropoffCoords.lng !== 0 &&
    (dropoffCoords.lat !== pickupCoords.lat || dropoffCoords.lng !== pickupCoords.lng);

  const center = useMemo(() => {
    if (!hasDropoff) return pickupCoords;
    return { lat: (pickupCoords.lat + dropoffCoords.lat) / 2, lng: (pickupCoords.lng + dropoffCoords.lng) / 2 };
  }, [pickupCoords, dropoffCoords, hasDropoff]);

  const mapOptions: google.maps.MapOptions = useMemo(() => ({
    styles: isDark ? rideMapDarkStyles : rideMapLightStyles,
    disableDefaultUI: true, zoomControl: false, scrollwheel: true,
    draggable: true, gestureHandling: 'greedy', clickableIcons: false,
    maxZoom: 18, minZoom: 5,
  }), [isDark]);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
  }, []);

  useEffect(() => {
    if (!map) return;
    clearMarkers();
    markersRef.current.push(createCustomMarker(map, pickupCoords, 'pickup', pickupAddress));
    if (hasDropoff) markersRef.current.push(createCustomMarker(map, dropoffCoords, 'dropoff', dropoffAddress));
    if (driverCoords) markersRef.current.push(createCustomMarker(map, driverCoords, 'driver', driverName));

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(pickupCoords);
    if (hasDropoff) bounds.extend(dropoffCoords);
    if (driverCoords) bounds.extend(driverCoords);

    if (hasDropoff || driverCoords) {
      map.fitBounds(bounds, { top: 60, right: 40, bottom: 60, left: 40 });
    } else {
      map.setCenter(pickupCoords);
      map.setZoom(15);
    }
    return clearMarkers;
  }, [map, pickupCoords, dropoffCoords, driverCoords, hasDropoff, pickupAddress, dropoffAddress, driverName]);

  useEffect(() => {
    if (!map || !hasDropoff || !showRoute) { setDirections(null); return; }
    const svc = new google.maps.DirectionsService();
    svc.route(
      { origin: pickupCoords, destination: dropoffCoords, travelMode: google.maps.TravelMode.DRIVING },
      (result, status) => { setDirections(status === 'OK' && result ? result : null); }
    );
  }, [map, pickupCoords.lat, pickupCoords.lng, dropoffCoords.lat, dropoffCoords.lng, hasDropoff, showRoute]);

  if (loadError || !isApiKeyAvailable) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <div className="text-center text-muted-foreground p-4">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-60" />
          <p className="text-sm font-medium">Map unavailable</p>
          <button type="button" onClick={retryLoad} className="text-xs underline underline-offset-4 mt-2">Retry</button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className={`flex items-center justify-center bg-muted ${className}`}><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className={`${className} relative`} style={{ touchAction: 'none' }}>
      <GoogleMap
        mapContainerStyle={{ height: '100%', width: '100%' }}
        center={center}
        zoom={hasDropoff ? 13 : 15}
        options={mapOptions}
        onLoad={(m) => setMap(m)}
        onUnmount={() => { clearMarkers(); setMap(null); }}
      >
        {directions && (
          <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#5271ff', strokeWeight: 5, strokeOpacity: 0.9 } }} />
        )}
      </GoogleMap>

      <button
        onClick={() => {
          if (!map) return;
          if (hasDropoff) {
            const b = new google.maps.LatLngBounds();
            b.extend(pickupCoords); b.extend(dropoffCoords);
            if (driverCoords) b.extend(driverCoords);
            map.fitBounds(b, { top: 60, right: 40, bottom: 60, left: 40 });
          } else { map.setCenter(pickupCoords); map.setZoom(15); }
        }}
        className="absolute top-20 right-4 z-10 h-11 w-11 rounded-full bg-card/90 backdrop-blur-md shadow-lg border border-border/30 flex items-center justify-center hover:bg-card transition-colors"
      >
        <Navigation2 className="h-4 w-4 text-foreground" />
      </button>
    </div>
  );
};

export default RideMap;
