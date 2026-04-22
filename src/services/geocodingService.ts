// Google Maps Geocoding Service

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  placeId: string;
  type: string;
}

export interface AddressSuggestion {
  placeId: string;
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
}

// Parse address components from Google's geocoding result
function parseAddressComponents(
  components: google.maps.GeocoderAddressComponent[]
): GeocodingResult['address'] {
  const address: GeocodingResult['address'] = {};

  components.forEach((component) => {
    const types = component.types;
    
    if (types.includes('route')) {
      address.road = component.long_name;
    } else if (types.includes('sublocality') || types.includes('neighborhood')) {
      address.suburb = component.long_name;
    } else if (types.includes('locality')) {
      address.city = component.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      address.state = component.long_name;
    } else if (types.includes('country')) {
      address.country = component.long_name;
    } else if (types.includes('postal_code')) {
      address.postcode = component.long_name;
    }
  });

  return address;
}

// Search for addresses using Google Geocoding API
export async function searchAddress(
  query: string,
  options: {
    countryCode?: string;
    limit?: number;
  } = {}
): Promise<GeocodingResult[]> {
  if (typeof google === 'undefined') {
    console.warn('Google Maps not loaded');
    return [];
  }

  const geocoder = new google.maps.Geocoder();

  try {
    const request: google.maps.GeocoderRequest = {
      address: query,
    };

    if (options.countryCode) {
      request.componentRestrictions = { country: options.countryCode };
    }

    const response = await geocoder.geocode(request);

    return response.results.slice(0, options.limit || 5).map((result) => ({
      lat: result.geometry.location.lat(),
      lng: result.geometry.location.lng(),
      displayName: result.formatted_address,
      address: parseAddressComponents(result.address_components),
      placeId: result.place_id,
      type: result.types[0] || 'address',
    }));
  } catch (error) {
    console.error('Geocoding search error:', error);
    return [];
  }
}

// Reverse geocode coordinates to address
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodingResult | null> {
  if (typeof google === 'undefined') {
    console.warn('Google Maps not loaded');
    return null;
  }

  const geocoder = new google.maps.Geocoder();

  try {
    const response = await geocoder.geocode({
      location: { lat, lng },
    });

    if (response.results.length === 0) {
      return null;
    }

    const result = response.results[0];

    return {
      lat: result.geometry.location.lat(),
      lng: result.geometry.location.lng(),
      displayName: result.formatted_address,
      address: parseAddressComponents(result.address_components),
      placeId: result.place_id,
      type: result.types[0] || 'address',
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

// Get address suggestions for autocomplete
export async function getAddressSuggestions(
  query: string,
  countryCode?: string
): Promise<AddressSuggestion[]> {
  if (query.length < 3) {
    return [];
  }

  const results = await searchAddress(query, { countryCode, limit: 5 });

  return results.map((result) => {
    // Create a shorter display name
    const parts = [];
    if (result.address.road) parts.push(result.address.road);
    if (result.address.suburb) parts.push(result.address.suburb);
    if (result.address.city) parts.push(result.address.city);

    return {
      placeId: result.placeId,
      displayName: result.displayName,
      shortName: parts.length > 0 ? parts.join(', ') : result.displayName.split(',')[0],
      lat: result.lat,
      lng: result.lng,
    };
  });
}

// Debounce helper for autocomplete
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Get user's current location
export function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}
