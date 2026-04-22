import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Polyline, Marker } from '@react-google-maps/api';
import { BaseMap } from './BaseMap';
import { PickupMarker, DropoffMarker, UserLocationMarker } from './MapMarker';
import { calculateBounds, getGoogleMapsIcon } from '@/services/mapUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Navigation, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LiveTrackingMapProps {
  pickupCoords: { lat: number; lng: number };
  dropoffCoords: { lat: number; lng: number };
  driverCoords?: { lat: number; lng: number } | null;
  userCoords?: { lat: number; lng: number } | null;
  pickupAddress?: string;
  dropoffAddress?: string;
  driverName?: string;
  vehicleInfo?: string;
  etaMinutes?: number;
  showRoute?: boolean;
  className?: string;
  status?: string;
}

export function LiveTrackingMap({
  pickupCoords, dropoffCoords, driverCoords, userCoords,
  pickupAddress, dropoffAddress, driverName, vehicleInfo,
  etaMinutes, showRoute = true,
  className = 'h-[300px] sm:h-[350px] w-full rounded-xl overflow-hidden',
  status,
}: LiveTrackingMapProps) {
  const [animatedDriverPos, setAnimatedDriverPos] = useState(driverCoords);
  const animRef = useRef<number | null>(null);
  const prevRef = useRef(driverCoords);

  useEffect(() => {
    if (!driverCoords || !prevRef.current) {
      setAnimatedDriverPos(driverCoords);
      prevRef.current = driverCoords;
      return;
    }
    if (prevRef.current.lat === driverCoords.lat && prevRef.current.lng === driverCoords.lng) return;

    const start = prevRef.current;
    const end = driverCoords;
    const dur = 1000;
    const t0 = Date.now();

    const animate = () => {
      const p = Math.min((Date.now() - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setAnimatedDriverPos({ lat: start.lat + (end.lat - start.lat) * e, lng: start.lng + (end.lng - start.lng) * e });
      if (p < 1) animRef.current = requestAnimationFrame(animate);
      else prevRef.current = end;
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [driverCoords]);

  const allPoints = useMemo(() => {
    const pts = [pickupCoords, dropoffCoords];
    if (driverCoords) pts.push(driverCoords);
    if (userCoords) pts.push(userCoords);
    return pts;
  }, [pickupCoords, dropoffCoords, driverCoords, userCoords]);

  const center = useMemo(() => {
    const pts = [pickupCoords, dropoffCoords];
    if (driverCoords) pts.push(driverCoords);
    return { lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length, lng: pts.reduce((s, p) => s + p.lng, 0) / pts.length };
  }, [pickupCoords, dropoffCoords, driverCoords]);

  const handleMapReady = useCallback((m: google.maps.Map) => {
    const bounds = calculateBounds(allPoints);
    if (bounds) m.fitBounds(bounds, { top: 60, right: 60, bottom: 80, left: 60 });
  }, [allPoints]);

  const handleShare = useCallback(async () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dropoffCoords.lat},${dropoffCoords.lng}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'My Ride', text: `Track my ride to ${dropoffAddress || 'destination'}`, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Location link copied!');
    }
  }, [dropoffCoords, dropoffAddress]);

  return (
    <div className={cn('relative', className)}>
      <BaseMap center={center} zoom={14} className="h-full w-full" scrollWheelZoom onMapReady={handleMapReady}>
        {showRoute && (
          <>
            {driverCoords && <Polyline path={[driverCoords, pickupCoords]} options={{ strokeColor: '#3b82f6', strokeWeight: 4, strokeOpacity: 0.8, icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 }, offset: '0', repeat: '15px' }] }} />}
            <Polyline path={[pickupCoords, dropoffCoords]} options={{ strokeColor: '#10b981', strokeWeight: 4, strokeOpacity: 0.9 }} />
          </>
        )}
        <PickupMarker position={pickupCoords} address={pickupAddress} />
        <DropoffMarker position={dropoffCoords} address={dropoffAddress} />
        {animatedDriverPos && <Marker position={animatedDriverPos} icon={getGoogleMapsIcon('driver', { size: 'lg' })} zIndex={100} />}
        {userCoords && <UserLocationMarker position={userCoords} />}
      </BaseMap>

      {etaMinutes !== undefined && (
        <Badge className="absolute top-3 right-3 z-[1000] bg-background/90 text-foreground shadow-lg text-sm px-3 py-1.5" variant="outline">
          {etaMinutes === 0 ? 'Arriving now' : `${etaMinutes} min away`}
        </Badge>
      )}
      {status && <Badge className="absolute top-3 left-3 z-[1000] bg-primary text-primary-foreground shadow-lg text-sm px-3 py-1.5">{status}</Badge>}

      <div className="absolute bottom-3 right-3 z-[1000] flex gap-2">
        <Button size="icon" variant="secondary" className="h-10 w-10 min-h-[40px] rounded-full shadow-lg bg-background/90" onClick={handleShare}><Share2 className="h-4 w-4" /></Button>
        <Button size="icon" className="h-10 w-10 min-h-[40px] rounded-full shadow-lg" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${dropoffCoords.lat},${dropoffCoords.lng}&origin=${pickupCoords.lat},${pickupCoords.lng}&travelmode=driving`, '_blank')}><Navigation className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

export default LiveTrackingMap;
