import { useMemo, useCallback, useState } from 'react';
import { Polyline } from '@react-google-maps/api';
import { BaseMap } from './BaseMap';
import { BusStopMarker, MapMarker } from './MapMarker';
import { calculateBounds, MarkerType } from '@/services/mapUtils';

interface RouteStop {
  lat: number;
  lng: number;
  name: string;
  time?: string;
  type?: 'origin' | 'stop' | 'destination';
}

interface RouteMapProps {
  stops: RouteStop[];
  className?: string;
  showLabels?: boolean;
  lineColor?: string;
  markerType?: MarkerType;
}

export function RouteMap({ stops, className = 'h-[300px] w-full rounded-xl overflow-hidden', showLabels = true, lineColor = '#10b981', markerType }: RouteMapProps) {
  const routePoints = useMemo(() => stops.map((s) => ({ lat: s.lat, lng: s.lng })), [stops]);

  const center = useMemo(() => {
    if (stops.length === 0) return { lat: -17.8292, lng: 31.0522 };
    return { lat: stops.reduce((s, p) => s + p.lat, 0) / stops.length, lng: stops.reduce((s, p) => s + p.lng, 0) / stops.length };
  }, [stops]);

  const handleMapReady = useCallback((m: google.maps.Map) => {
    if (stops.length > 0) {
      const bounds = calculateBounds(stops.map((s) => ({ lat: s.lat, lng: s.lng })));
      if (bounds) m.fitBounds(bounds, 50);
    }
  }, [stops]);

  if (stops.length === 0) {
    return (
      <div className={className}>
        <div className="h-full w-full bg-muted flex items-center justify-center rounded-xl">
          <p className="text-muted-foreground">No route data available</p>
        </div>
      </div>
    );
  }

  return (
    <BaseMap center={center} zoom={10} className={className} scrollWheelZoom={false} onMapReady={handleMapReady}>
      <Polyline path={routePoints} options={{ strokeColor: lineColor, strokeWeight: 4, strokeOpacity: 0.8 }} />
      {stops.map((stop, i) => {
        const isOrigin = i === 0 || stop.type === 'origin';
        const isDestination = i === stops.length - 1 || stop.type === 'destination';
        if (markerType) {
          return (
            <MapMarker
              key={`${stop.lat}-${stop.lng}-${i}`}
              position={{ lat: stop.lat, lng: stop.lng }}
              type={isOrigin ? 'pickup' : isDestination ? 'dropoff' : markerType}
              size={isOrigin || isDestination ? 'lg' : 'md'}
              popupContent={showLabels ? <div><p className="font-semibold">{stop.name}</p>{stop.time && <p className="text-xs text-muted-foreground">{stop.time}</p>}</div> : undefined}
            />
          );
        }
        return (
          <BusStopMarker key={`${stop.lat}-${stop.lng}-${i}`} position={{ lat: stop.lat, lng: stop.lng }} name={stop.name} time={stop.time} isOrigin={isOrigin} isDestination={isDestination} />
        );
      })}
    </BaseMap>
  );
}

export default RouteMap;
