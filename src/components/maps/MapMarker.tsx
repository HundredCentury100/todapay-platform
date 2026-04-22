import { useState, useCallback } from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import { getGoogleMapsIcon, MarkerType } from '@/services/mapUtils';

interface MapMarkerProps {
  position: { lat: number; lng: number };
  type?: MarkerType;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  showIcon?: boolean;
  popupContent?: React.ReactNode;
  onClick?: () => void;
  draggable?: boolean;
  onDragEnd?: (position: { lat: number; lng: number }) => void;
  zIndex?: number;
}

export function MapMarker({ position, type = 'default', size = 'md', pulse = false, showIcon = true, popupContent, onClick, draggable = false, onDragEnd, zIndex }: MapMarkerProps) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const icon = getGoogleMapsIcon(type, { size, pulse, showIcon });

  const handleClick = useCallback(() => {
    if (popupContent) setIsInfoOpen(true);
    onClick?.();
  }, [onClick, popupContent]);

  const handleDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (onDragEnd && e.latLng) onDragEnd({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  }, [onDragEnd]);

  return (
    <>
      <Marker
        position={position}
        icon={icon}
        draggable={draggable}
        onClick={handleClick}
        onDragEnd={handleDragEnd}
        zIndex={zIndex}
        animation={pulse ? google.maps.Animation.BOUNCE : undefined}
      />
      {isInfoOpen && popupContent && (
        <InfoWindow position={position} onCloseClick={() => setIsInfoOpen(false)}>
          <div className="text-sm p-1">{popupContent}</div>
        </InfoWindow>
      )}
    </>
  );
}

export function PickupMarker({ position, address, ...props }: { position: { lat: number; lng: number }; address?: string } & Omit<MapMarkerProps, 'position' | 'type'>) {
  return <MapMarker position={position} type="pickup" popupContent={<div><p className="font-semibold text-green-600">Pickup</p>{address && <p className="text-gray-600">{address}</p>}</div>} {...props} />;
}

export function DropoffMarker({ position, address, ...props }: { position: { lat: number; lng: number }; address?: string } & Omit<MapMarkerProps, 'position' | 'type'>) {
  return <MapMarker position={position} type="dropoff" popupContent={<div><p className="font-semibold text-red-600">Dropoff</p>{address && <p className="text-gray-600">{address}</p>}</div>} {...props} />;
}

export function DriverMarker({ position, driverName, vehicleInfo, ...props }: { position: { lat: number; lng: number }; driverName?: string; vehicleInfo?: string } & Omit<MapMarkerProps, 'position' | 'type'>) {
  return <MapMarker position={position} type="driver" size="lg" popupContent={<div><p className="font-semibold text-blue-600">Your Driver</p>{driverName && <p>{driverName}</p>}{vehicleInfo && <p className="text-xs text-gray-500">{vehicleInfo}</p>}</div>} {...props} />;
}

export function PropertyMarker({ position, name, price, onClick, ...props }: { position: { lat: number; lng: number }; name: string; price?: string; onClick?: () => void } & Omit<MapMarkerProps, 'position' | 'type'>) {
  return <MapMarker position={position} type="property" onClick={onClick} popupContent={<div><p className="font-semibold">{name}</p>{price && <p className="text-primary font-medium">{price}</p>}</div>} {...props} />;
}

export function EventMarker({ position, name, date, onClick, ...props }: { position: { lat: number; lng: number }; name: string; date?: string; onClick?: () => void } & Omit<MapMarkerProps, 'position' | 'type'>) {
  return <MapMarker position={position} type="event" onClick={onClick} popupContent={<div><p className="font-semibold">{name}</p>{date && <p className="text-xs text-gray-500">{date}</p>}</div>} {...props} />;
}

export function BusStopMarker({ position, name, time, isOrigin, isDestination, ...props }: { position: { lat: number; lng: number }; name: string; time?: string; isOrigin?: boolean; isDestination?: boolean } & Omit<MapMarkerProps, 'position' | 'type'>) {
  const type = isOrigin ? 'pickup' : isDestination ? 'dropoff' : 'bus-stop';
  const label = isOrigin ? 'Departure' : isDestination ? 'Arrival' : 'Stop';
  return <MapMarker position={position} type={type} popupContent={<div><p className="font-semibold">{label}</p><p>{name}</p>{time && <p className="text-xs text-gray-500">{time}</p>}</div>} {...props} />;
}

export function UserLocationMarker({ position, ...props }: { position: { lat: number; lng: number } } & Omit<MapMarkerProps, 'position' | 'type'>) {
  return <MapMarker position={position} type="user" pulse popupContent={<p className="font-semibold">Your Location</p>} {...props} />;
}

export default MapMarker;
