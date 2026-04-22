import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { useJsApiLoader, Libraries } from '@react-google-maps/api';

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
  isApiKeyAvailable: boolean;
  retryLoad: () => void;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: undefined,
  isApiKeyAvailable: true,
  retryLoad: () => {},
});

const libraries: Libraries = ['places', 'geometry'];

let cachedKey: string | null = null;

async function fetchApiKey(): Promise<string> {
  if (cachedKey) return cachedKey;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !anonKey) {
    console.warn('[GoogleMaps] Missing SUPABASE_URL or PUBLISHABLE_KEY env vars');
    return '';
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 40000);

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/get-maps-config`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`[GoogleMaps] Edge function returned HTTP ${res.status}`);
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();
    const key = (json?.apiKey || '').trim();

    if (key) {
      cachedKey = key;
      console.log('[GoogleMaps] API key fetched successfully');
    } else {
      console.warn('[GoogleMaps] Edge function returned empty API key');
    }
    return key;
  } catch (err) {
    console.error('[GoogleMaps] Failed to fetch API key:', err);
    // Fallback: try client-side env variable
    const envKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
    if (envKey) {
      console.log('[GoogleMaps] Using client-side env fallback');
      cachedKey = envKey;
      return envKey;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function GoogleMapsLoader({ apiKey, children, retryLoad }: { apiKey: string; children: ReactNode; retryLoad: () => void }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
    id: 'google-maps-script',
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError, isApiKeyAvailable: true, retryLoad }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(cachedKey);
  const [failed, setFailed] = useState(false);
  const retryCountRef = useRef(0);

  const retryLoad = useCallback(() => {
    cachedKey = null;
    retryCountRef.current = 0;
    setApiKey(null);
    setFailed(false);
  }, []);

  useEffect(() => {
    if (apiKey || failed) return;

    let active = true;

    const attempt = () => {
      fetchApiKey()
        .then((key) => {
          if (!active) return;
          if (key) {
            setApiKey(key);
          } else {
            // Auto-retry once after 3s
            if (retryCountRef.current < 1) {
              retryCountRef.current += 1;
              console.log('[GoogleMaps] Retrying API key fetch in 3s...');
              setTimeout(() => { if (active) attempt(); }, 3000);
            } else {
              setFailed(true);
            }
          }
        })
        .catch(() => {
          if (!active) return;
          if (retryCountRef.current < 1) {
            retryCountRef.current += 1;
            console.log('[GoogleMaps] Retrying API key fetch in 3s after error...');
            setTimeout(() => { if (active) attempt(); }, 3000);
          } else {
            setFailed(true);
          }
        });
    };

    attempt();

    return () => { active = false; };
  }, [apiKey, failed]);

  if (failed) {
    return (
      <GoogleMapsContext.Provider
        value={{ isLoaded: false, loadError: new Error('Google Maps configuration unavailable'), isApiKeyAvailable: false, retryLoad }}
      >
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  if (!apiKey) {
    return (
      <GoogleMapsContext.Provider value={{ isLoaded: false, loadError: undefined, isApiKeyAvailable: true, retryLoad }}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  return (
    <GoogleMapsLoader apiKey={apiKey} retryLoad={retryLoad}>
      {children}
    </GoogleMapsLoader>
  );
}

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}

export default GoogleMapsProvider;
