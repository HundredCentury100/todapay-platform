import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface BookingProgress {
  id: string; // Unique ID for each booking draft
  type: "bus" | "event" | "stay" | "workspace" | "venue" | "experience";
  itemId: string;
  itemName: string;
  path: string;
  selectedSeats?: string[];
  ticketQuantity?: number;
  passengerName?: string;
  passengerEmail?: string;
  passengerPhone?: string;
  date?: string;
  from?: string;
  to?: string;
  price?: number;
  operator?: string;
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "booking_drafts";
const MAX_DRAFTS = 5;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days for localStorage

// Generate unique ID for each booking draft
const generateDraftId = () => `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Get all drafts from localStorage
const getAllDrafts = (): BookingProgress[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const drafts: BookingProgress[] = JSON.parse(stored);
      // Filter out expired drafts
      const validDrafts = drafts.filter(d => Date.now() - d.updatedAt < MAX_AGE_MS);
      if (validDrafts.length !== drafts.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validDrafts));
      }
      return validDrafts;
    }
  } catch (error) {
    console.error("Error loading booking drafts:", error);
    localStorage.removeItem(STORAGE_KEY);
  }
  return [];
};

// Save drafts to localStorage
const saveDrafts = (drafts: BookingProgress[]) => {
  try {
    // Keep only the most recent MAX_DRAFTS
    const limitedDrafts = drafts.slice(0, MAX_DRAFTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedDrafts));
  } catch (error) {
    console.error("Error saving booking drafts:", error);
  }
};

export const useBookingProgress = () => {
  const [drafts, setDrafts] = useState<BookingProgress[]>([]);
  const [currentDraft, setCurrentDraft] = useState<BookingProgress | null>(null);

  // Load drafts from localStorage on mount
  useEffect(() => {
    const loadedDrafts = getAllDrafts();
    setDrafts(loadedDrafts);
    // Set most recent as current
    if (loadedDrafts.length > 0) {
      setCurrentDraft(loadedDrafts[0]);
    }
  }, []);

  const saveProgress = useCallback((data: Omit<BookingProgress, "id" | "createdAt" | "updatedAt">, showToast = true) => {
    const now = Date.now();
    
    // Check if we're updating an existing draft for the same item
    const existingIndex = drafts.findIndex(
      d => d.itemId === data.itemId && d.type === data.type
    );

    let newDraft: BookingProgress;
    let updatedDrafts: BookingProgress[];

    if (existingIndex !== -1) {
      // Update existing draft
      newDraft = {
        ...drafts[existingIndex],
        ...data,
        updatedAt: now,
      };
      updatedDrafts = [...drafts];
      updatedDrafts[existingIndex] = newDraft;
      // Move to front
      updatedDrafts.splice(existingIndex, 1);
      updatedDrafts.unshift(newDraft);
    } else {
      // Create new draft
      newDraft = {
        ...data,
        id: generateDraftId(),
        createdAt: now,
        updatedAt: now,
      };
      updatedDrafts = [newDraft, ...drafts];
    }

    saveDrafts(updatedDrafts);
    setDrafts(updatedDrafts);
    setCurrentDraft(newDraft);

    if (showToast) {
      toast.success("Progress saved", {
        description: "Your booking has been saved. You can continue later.",
        duration: 2000,
      });
    }

    return newDraft.id;
  }, [drafts]);

  const clearProgress = useCallback((draftId?: string) => {
    if (draftId) {
      // Remove specific draft
      const updatedDrafts = drafts.filter(d => d.id !== draftId);
      saveDrafts(updatedDrafts);
      setDrafts(updatedDrafts);
      if (currentDraft?.id === draftId) {
        setCurrentDraft(updatedDrafts[0] || null);
      }
    } else {
      // Clear all drafts
      localStorage.removeItem(STORAGE_KEY);
      setDrafts([]);
      setCurrentDraft(null);
    }
  }, [drafts, currentDraft]);

  const updateProgress = useCallback((updates: Partial<BookingProgress>, draftId?: string) => {
    const targetId = draftId || currentDraft?.id;
    if (!targetId) return;

    const updatedDrafts = drafts.map(d => {
      if (d.id === targetId) {
        return { ...d, ...updates, updatedAt: Date.now() };
      }
      return d;
    });

    saveDrafts(updatedDrafts);
    setDrafts(updatedDrafts);
    
    if (currentDraft?.id === targetId) {
      setCurrentDraft({ ...currentDraft, ...updates, updatedAt: Date.now() });
    }
  }, [drafts, currentDraft]);

  const selectDraft = useCallback((draftId: string) => {
    const draft = drafts.find(d => d.id === draftId);
    if (draft) {
      setCurrentDraft(draft);
    }
  }, [drafts]);

  return {
    progress: currentDraft, // Backwards compatibility
    drafts,
    currentDraft,
    saveProgress,
    clearProgress,
    updateProgress,
    selectDraft,
    hasProgress: drafts.length > 0,
    draftCount: drafts.length,
  };
};

// Utility function to save progress from anywhere
export const saveBookingProgress = (data: Omit<BookingProgress, "id" | "createdAt" | "updatedAt">) => {
  const drafts = getAllDrafts();
  const now = Date.now();
  
  const existingIndex = drafts.findIndex(
    d => d.itemId === data.itemId && d.type === data.type
  );

  let newDraft: BookingProgress;

  if (existingIndex !== -1) {
    newDraft = { ...drafts[existingIndex], ...data, updatedAt: now };
    drafts[existingIndex] = newDraft;
    drafts.splice(existingIndex, 1);
    drafts.unshift(newDraft);
  } else {
    newDraft = { ...data, id: generateDraftId(), createdAt: now, updatedAt: now };
    drafts.unshift(newDraft);
  }

  saveDrafts(drafts);
  return newDraft.id;
};

// Utility function to clear progress
export const clearBookingProgress = (draftId?: string) => {
  if (draftId) {
    const drafts = getAllDrafts().filter(d => d.id !== draftId);
    saveDrafts(drafts);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
};

// Utility function to get progress (most recent or by ID)
export const getBookingProgress = (draftId?: string): BookingProgress | null => {
  const drafts = getAllDrafts();
  if (draftId) {
    return drafts.find(d => d.id === draftId) || null;
  }
  return drafts[0] || null;
};

// Utility function to get all drafts
export const getAllBookingDrafts = (): BookingProgress[] => {
  return getAllDrafts();
};

// Calculate time ago text with more detail
export const getBookingAge = (timestamp: number): { text: string; isRecent: boolean } => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return { text: "just now", isRecent: true };
  } else if (minutes < 60) {
    return { text: `${minutes}m ago`, isRecent: true };
  } else if (hours < 24) {
    return { text: `${hours}h ago`, isRecent: hours < 4 };
  } else if (days === 1) {
    return { text: "yesterday", isRecent: false };
  } else {
    return { text: `${days}d ago`, isRecent: false };
  }
};
