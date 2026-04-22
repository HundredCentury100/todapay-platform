// Google Maps utility functions

export type MarkerType =
  | 'pickup'
  | 'dropoff'
  | 'driver'
  | 'property'
  | 'event'
  | 'workspace'
  | 'venue'
  | 'bus-stop'
  | 'user'
  | 'default';

export const MARKER_COLORS: Record<MarkerType, string> = {
  pickup: '#22c55e',
  dropoff: '#ef4444',
  driver: '#3b82f6',
  property: '#8b5cf6',
  event: '#f97316',
  workspace: '#06b6d4',
  venue: '#ec4899',
  'bus-stop': '#14b8a6',
  user: '#3b82f6',
  default: '#6b7280',
};

export const MARKER_ICONS: Record<MarkerType, string> = {
  pickup: '📍',
  dropoff: '🏁',
  driver: '🚗',
  property: '🏠',
  event: '🎉',
  workspace: '💼',
  venue: '🏛️',
  'bus-stop': '🚏',
  user: '👤',
  default: '📌',
};

const SIZES = { sm: 24, md: 32, lg: 40 };

export interface MarkerIconOptions {
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  showIcon?: boolean;
}

export function getMarkerIconUrl(type: MarkerType, options: MarkerIconOptions = {}): string {
  const { size = 'md', showIcon = true } = options;
  const color = MARKER_COLORS[type];
  const icon = MARKER_ICONS[type];
  const s = SIZES[size];
  const svg = `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - 2}" fill="${color}" stroke="white" stroke-width="3"/>
    ${showIcon ? `<text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="${s * 0.4}">${icon}</text>` : ''}
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function getGoogleMapsIcon(type: MarkerType, options: MarkerIconOptions = {}): google.maps.Icon {
  const { size = 'md' } = options;
  const s = SIZES[size];
  return {
    url: getMarkerIconUrl(type, options),
    scaledSize: new google.maps.Size(s, s),
    anchor: new google.maps.Point(s / 2, s / 2),
  };
}

export function calculateBounds(points: Array<{ lat: number; lng: number }>): google.maps.LatLngBounds | null {
  if (points.length === 0 || typeof google === 'undefined') return null;
  const bounds = new google.maps.LatLngBounds();
  points.forEach((p) => bounds.extend(new google.maps.LatLng(p.lat, p.lng)));
  return bounds;
}

export function calculateCenter(points: Array<{ lat: number; lng: number }>): { lat: number; lng: number } {
  if (points.length === 0) return { lat: 0, lng: 0 };
  return {
    lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
    lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
  };
}

export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getZoomForDistance(distanceKm: number): number {
  if (distanceKm < 1) return 16;
  if (distanceKm < 5) return 14;
  if (distanceKm < 10) return 13;
  if (distanceKm < 25) return 12;
  if (distanceKm < 50) return 11;
  if (distanceKm < 100) return 10;
  return 9;
}

export const DEFAULT_CENTER = { lat: -17.8292, lng: 31.0522 };
export const DEFAULT_ZOOM = 13;

export function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let shift = 0, result = 0, byte: number;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}
