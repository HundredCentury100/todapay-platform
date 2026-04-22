import { useEffect, useCallback } from 'react';

const DB_NAME = 'fulticket_offline';
const DB_VERSION = 1;
const STORE_NAME = 'cache';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Persist and retrieve data in IndexedDB for offline resilience.
 * Use for critical user data like bookings, profile, wallet balance.
 */
export function useOfflineCache<T>(key: string) {
  const save = useCallback(async (data: T) => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(
        { data, timestamp: Date.now() },
        key
      );
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Silently fail — offline cache is best-effort
    }
  }, [key]);

  const load = useCallback(async (): Promise<{ data: T; timestamp: number } | null> => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }, [key]);

  const remove = useCallback(async () => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
    } catch {
      // Silently fail
    }
  }, [key]);

  return { save, load, remove };
}

/**
 * Auto-cache query data for offline fallback.
 * Call with fresh data after successful fetch; returns cached data when offline.
 */
export function useOfflineFallback<T>(key: string, data: T | undefined, isOnline: boolean) {
  const { save, load } = useOfflineCache<T>(key);

  // Persist whenever we get fresh data
  useEffect(() => {
    if (data && isOnline) {
      save(data);
    }
  }, [data, isOnline, save]);

  return { loadCached: load };
}
