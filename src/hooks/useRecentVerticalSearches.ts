import { useState, useCallback } from "react";

interface RecentSearch {
  query: string;
  filters?: Record<string, string>;
  timestamp: number;
}

const STORAGE_PREFIX = "fulticket_recent_";

export function useRecentVerticalSearches(vertical: string) {
  const key = `${STORAGE_PREFIX}${vertical}`;

  const getStored = (): RecentSearch[] => {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]").slice(0, 5);
    } catch {
      return [];
    }
  };

  const [recent, setRecent] = useState<RecentSearch[]>(getStored);

  const addSearch = useCallback(
    (query: string, filters?: Record<string, string>) => {
      const items = getStored().filter((s) => s.query !== query);
      items.unshift({ query, filters, timestamp: Date.now() });
      const trimmed = items.slice(0, 5);
      localStorage.setItem(key, JSON.stringify(trimmed));
      setRecent(trimmed);
    },
    [key]
  );

  const clearAll = useCallback(() => {
    localStorage.removeItem(key);
    setRecent([]);
  }, [key]);

  return { recent, addSearch, clearAll };
}
