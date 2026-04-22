import { useState, useEffect, useCallback, useRef } from "react";
import { reverseGeocode } from "@/services/geocodingService";

export interface DeviceLocation {
  lat: number;
  lng: number;
  suburb: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  countryCode: string | null;
  displayName: string;
}

const STORAGE_KEY = "device_location";
const COUNTRY_KEY = "last_known_country";

function getCountryCode(components: google.maps.GeocoderAddressComponent[]): string | null {
  const country = components.find(c => c.types.includes("country"));
  return country?.short_name || null;
}

function getStoredLocation(): DeviceLocation | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    // Expire after 30 minutes
    if (Date.now() - parsed._ts > 30 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

function storeLocation(loc: DeviceLocation) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loc, _ts: Date.now() }));
}

export function useDeviceLocation() {
  const [location, setLocation] = useState<DeviceLocation | null>(getStoredLocation);
  const [isDetecting, setIsDetecting] = useState(!location);
  const [error, setError] = useState<string | null>(null);
  const [countryChanged, setCountryChanged] = useState<{ from: string | null; to: string } | null>(null);
  const hasDetected = useRef(!!location);

  const detect = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setIsDetecting(false);
      return;
    }

    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;

        try {
          // Use Google reverse geocoding if available, otherwise fallback to Nominatim
          if (typeof google === "undefined" || !google?.maps?.Geocoder) {
            // Fallback: use OpenStreetMap Nominatim for free reverse geocoding
            try {
              const nominatimRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
                { headers: { "User-Agent": "fulticket-app" } }
              );
              if (nominatimRes.ok) {
                const nominatimData = await nominatimRes.json();
                const addr = nominatimData.address || {};
                const suburb = addr.suburb || addr.neighbourhood || null;
                const city = addr.city || addr.town || addr.village || null;
                const state = addr.state || null;
                const country = addr.country || null;
                const countryCode = addr.country_code?.toUpperCase() || null;
                const displayName = suburb || city || state || country || "Current Location";

                const loc: DeviceLocation = { lat, lng, suburb, city, state, country, countryCode, displayName };
                setLocation(loc);
                storeLocation(loc);

                // Check if country changed
                const previousCountry = localStorage.getItem(COUNTRY_KEY);
                if (countryCode && previousCountry && previousCountry !== countryCode) {
                  setCountryChanged({ from: previousCountry, to: countryCode });
                }
                if (countryCode) {
                  localStorage.setItem(COUNTRY_KEY, countryCode);
                }
              } else {
                const loc: DeviceLocation = {
                  lat, lng, suburb: null, city: null, state: null,
                  country: null, countryCode: null, displayName: "Current Location",
                };
                setLocation(loc);
                storeLocation(loc);
              }
            } catch {
              const loc: DeviceLocation = {
                lat, lng, suburb: null, city: null, state: null,
                country: null, countryCode: null, displayName: "Current Location",
              };
              setLocation(loc);
              storeLocation(loc);
            }
            setIsDetecting(false);
            return;
          }

          const geocoder = new google.maps.Geocoder();
          const response = await geocoder.geocode({ location: { lat, lng } });

          if (response.results.length > 0) {
            const result = response.results[0];
            const components = result.address_components;

            const suburb = components.find(c =>
              c.types.includes("sublocality") || c.types.includes("neighborhood")
            )?.long_name || null;
            const city = components.find(c => c.types.includes("locality"))?.long_name || null;
            const state = components.find(c => c.types.includes("administrative_area_level_1"))?.long_name || null;
            const country = components.find(c => c.types.includes("country"))?.long_name || null;
            const countryCode = getCountryCode(components);

            const displayName = suburb || city || state || country || "Current Location";

            const loc: DeviceLocation = { lat, lng, suburb, city, state, country, countryCode, displayName };
            setLocation(loc);
            storeLocation(loc);

            // Check if country changed
            const previousCountry = localStorage.getItem(COUNTRY_KEY);
            if (countryCode && previousCountry && previousCountry !== countryCode) {
              setCountryChanged({ from: previousCountry, to: countryCode });
            }
            if (countryCode) {
              localStorage.setItem(COUNTRY_KEY, countryCode);
            }
          }
        } catch (err) {
          console.error("Location detection error:", err);
          const loc: DeviceLocation = {
            lat, lng,
            suburb: null, city: null, state: null,
            country: null, countryCode: null,
            displayName: "Current Location",
          };
          setLocation(loc);
          storeLocation(loc);
        } finally {
          setIsDetecting(false);
          hasDetected.current = true;
        }
      },
      (err) => {
        setError("Location access denied");
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    if (!hasDetected.current) {
      detect();
    }
  }, [detect]);

  const dismissCountryChange = useCallback(() => setCountryChanged(null), []);

  return {
    location,
    isDetecting,
    error,
    countryChanged,
    dismissCountryChange,
    refresh: detect,
  };
}
