import { useState, useCallback, useEffect } from "react";

export interface SavedBiller {
  billerId: string;
  billerName: string;
  accountNumber: string;
  label?: string;
  lastUsed: number;
  useCount: number;
}

const STORAGE_KEY = "saved_billers";
const MAX_SAVED = 20;

const getStored = (): SavedBiller[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persist = (billers: SavedBiller[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(billers));
  } catch {}
};

export const useSavedBillers = () => {
  const [savedBillers, setSavedBillers] = useState<SavedBiller[]>(getStored);

  useEffect(() => {
    setSavedBillers(getStored());
  }, []);

  const saveBiller = useCallback((biller: Omit<SavedBiller, "lastUsed" | "useCount">) => {
    setSavedBillers((prev) => {
      const existing = prev.findIndex(
        (b) => b.billerId === biller.billerId && b.accountNumber === biller.accountNumber
      );
      let updated: SavedBiller[];
      if (existing !== -1) {
        updated = [...prev];
        updated[existing] = {
          ...updated[existing],
          lastUsed: Date.now(),
          useCount: updated[existing].useCount + 1,
          label: biller.label || updated[existing].label,
        };
      } else {
        updated = [
          { ...biller, lastUsed: Date.now(), useCount: 1 },
          ...prev,
        ];
      }
      updated.sort((a, b) => b.lastUsed - a.lastUsed);
      const limited = updated.slice(0, MAX_SAVED);
      persist(limited);
      return limited;
    });
  }, []);

  const removeBiller = useCallback((billerId: string, accountNumber: string) => {
    setSavedBillers((prev) => {
      const updated = prev.filter(
        (b) => !(b.billerId === billerId && b.accountNumber === accountNumber)
      );
      persist(updated);
      return updated;
    });
  }, []);

  const getTopBillers = useCallback(
    (limit = 6) => savedBillers.slice(0, limit),
    [savedBillers]
  );

  return { savedBillers, saveBiller, removeBiller, getTopBillers };
};

// Static helper for use outside React
export const recordBillerUsage = (biller: Omit<SavedBiller, "lastUsed" | "useCount">) => {
  const stored = getStored();
  const existing = stored.findIndex(
    (b) => b.billerId === biller.billerId && b.accountNumber === biller.accountNumber
  );
  if (existing !== -1) {
    stored[existing].lastUsed = Date.now();
    stored[existing].useCount += 1;
  } else {
    stored.unshift({ ...biller, lastUsed: Date.now(), useCount: 1 });
  }
  stored.sort((a, b) => b.lastUsed - a.lastUsed);
  persist(stored.slice(0, MAX_SAVED));
};
