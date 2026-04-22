import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { BaseMap } from './BaseMap';
import { MapMarker } from './MapMarker';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Loader2, X } from 'lucide-react';
import { getCurrentLocation } from '@/services/geocodingService';
import { cn } from '@/lib/utils';
import { useGoogleMaps } from './GoogleMapsProvider';

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
  initialAddress?: string;
  placeholder?: string;
  className?: string;
  compact?: boolean;
  biasLocation?: { lat: number; lng: number };
}

export function LocationPicker({
  onLocationSelect,
  initialLocation,
  initialAddress = '',
  placeholder = 'Search for an address...',
  className,
  compact = false,
  biasLocation,
}: LocationPickerProps) {
  const { isLoaded } = useGoogleMaps();
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(initialLocation || null);
  const [selectedAddress, setSelectedAddress] = useState(initialAddress);
  const biasCenter = biasLocation || initialLocation;
  const [mapCenter, setMapCenter] = useState(initialLocation || biasLocation || { lat: 0, lng: 0 });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (isLoaded && !geocoderRef.current) geocoderRef.current = new google.maps.Geocoder();
  }, [isLoaded]);

  const autocompleteOptions = useMemo(() => {
    const opts: google.maps.places.AutocompleteOptions = {
      types: ['geocode', 'establishment'],
      fields: ['formatted_address', 'geometry', 'name', 'place_id'],
    };
    if (biasCenter && biasCenter.lat !== 0 && biasCenter.lng !== 0) {
      const r = 50000;
      opts.bounds = {
        north: biasCenter.lat + r / 111320,
        south: biasCenter.lat - r / 111320,
        east: biasCenter.lng + r / (111320 * Math.cos(biasCenter.lat * Math.PI / 180)),
        west: biasCenter.lng - r / (111320 * Math.cos(biasCenter.lat * Math.PI / 180)),
      };
    }
    return opts;
  }, [biasCenter?.lat, biasCenter?.lng]);

  const onPlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const address = place.formatted_address || place.name || '';
      setSelectedLocation({ lat, lng });
      setSelectedAddress(address);
      setSearchQuery(address);
      setMapCenter({ lat, lng });
      onLocationSelect({ lat, lng, address });
    }
  }, [onLocationSelect]);

  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !geocoderRef.current) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setSelectedLocation({ lat, lng });
    try {
      const result = await geocoderRef.current.geocode({ location: { lat, lng } });
      if (result?.results?.[0]) {
        const address = result.results[0].formatted_address;
        setSelectedAddress(address);
        setSearchQuery(address);
        onLocationSelect({ lat, lng, address });
      }
    } catch {
      onLocationSelect({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
    }
  }, [onLocationSelect]);

  const handleMarkerDrag = useCallback(async (position: { lat: number; lng: number }) => {
    setSelectedLocation(position);
    if (geocoderRef.current) {
      try {
        const result = await geocoderRef.current.geocode({ location: position });
        if (result?.results?.[0]) {
          const address = result.results[0].formatted_address;
          setSelectedAddress(address);
          setSearchQuery(address);
          onLocationSelect({ ...position, address });
        }
      } catch { /* ignore */ }
    }
  }, [onLocationSelect]);

  const handleUseCurrentLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    try {
      const location = await getCurrentLocation();
      setSelectedLocation(location);
      setMapCenter(location);
      if (geocoderRef.current) {
        try {
          const result = await geocoderRef.current.geocode({ location });
          if (result?.results?.[0]) {
            const address = result.results[0].formatted_address;
            setSelectedAddress(address);
            setSearchQuery(address);
            onLocationSelect({ ...location, address });
            return;
          }
        } catch { /* ignore */ }
      }
      onLocationSelect({ ...location, address: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` });
    } catch (error) {
      console.error('Failed to get current location:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  }, [onLocationSelect]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    setSelectedLocation(null);
    setSelectedAddress('');
    inputRef.current?.focus();
  }, []);

  const inputEl = (
    <Input
      ref={inputRef}
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder={isLoaded ? placeholder : 'Loading maps...'}
      className="pl-10 pr-20 h-12 text-[16px]"
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      enterKeyHint="search"
      disabled={!isLoaded}
    />
  );

  if (compact) {
    return (
      <div className={cn('relative', className)}>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          {isLoaded ? (
            <Autocomplete onLoad={(a) => { autocompleteRef.current = a; }} onPlaceChanged={onPlaceChanged} options={autocompleteOptions}>
              {inputEl}
            </Autocomplete>
          ) : inputEl}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 z-10">
            {searchQuery && (
              <Button type="button" variant="ghost" size="icon" className="h-10 w-10 min-h-[40px]" onClick={handleClear}><X className="h-4 w-4" /></Button>
            )}
            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 min-h-[40px]" onClick={handleUseCurrentLocation} disabled={isLoadingLocation}>
              {isLoadingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        {isLoaded ? (
          <Autocomplete onLoad={(a) => { autocompleteRef.current = a; }} onPlaceChanged={onPlaceChanged} options={autocompleteOptions}>
            <Input ref={inputRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={placeholder} className="pl-10 h-12 text-[16px]" autoComplete="off" autoCorrect="off" autoCapitalize="off" enterKeyHint="search" />
          </Autocomplete>
        ) : (
          <Input placeholder="Loading maps..." className="pl-10 h-12 text-[16px]" disabled />
        )}
      </div>

      <BaseMap center={mapCenter} zoom={selectedLocation ? 16 : 13} className="h-[280px] sm:h-[300px] w-full rounded-xl overflow-hidden" scrollWheelZoom dragging onClick={handleMapClick}>
        {selectedLocation && <MapMarker position={selectedLocation} type="pickup" draggable onDragEnd={handleMarkerDrag} />}
      </BaseMap>

      <Button type="button" variant="outline" className="w-full h-12 min-h-[48px] text-base" onClick={handleUseCurrentLocation} disabled={isLoadingLocation}>
        {isLoadingLocation ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Navigation className="h-5 w-5 mr-2" />}
        Use my current location
      </Button>

      {selectedAddress && (
        <div className="p-3 bg-muted rounded-xl">
          <p className="text-sm font-medium">Selected Location</p>
          <p className="text-xs text-muted-foreground mt-0.5">{selectedAddress}</p>
        </div>
      )}
    </div>
  );
}

export default LocationPicker;
