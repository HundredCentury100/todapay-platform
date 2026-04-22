import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface SavedTraveler {
  id: string;
  name: string;
  email: string;
  phone: string;
  passportNumber?: string;
  isDefault?: boolean;
}

export interface UserPreferences {
  // Payment preferences
  lastPaymentMethod?: string;
  preferredPaymentMethods?: string[];
  
  // Traveler preferences
  savedTravelers: SavedTraveler[];
  defaultTravelerId?: string;
  
  // Route preferences
  favoriteRoutes: Array<{ from: string; to: string; count: number }>;
  recentSearches: Array<{ query: string; type: string; timestamp: number }>;
  
  // UI preferences
  hasSeenOnboarding?: boolean;
  reducedAnimations?: boolean;
  preferredCurrency?: string;
  
  // Booking preferences
  autoFillDetails?: boolean;
  rememberSeatPreferences?: boolean;
  preferredSeatPosition?: "window" | "aisle" | "any";
  
  // Last activity
  lastVisit?: number;
  visitCount?: number;
}

const STORAGE_KEY = "user_preferences";
const MAX_RECENT_SEARCHES = 10;
const MAX_FAVORITE_ROUTES = 10;

const defaultPreferences: UserPreferences = {
  savedTravelers: [],
  favoriteRoutes: [],
  recentSearches: [],
  autoFillDetails: true,
  rememberSeatPreferences: true,
  preferredSeatPosition: "any",
  visitCount: 0,
};

// Get preferences from localStorage
const getStoredPreferences = (): UserPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Error loading preferences:", error);
  }
  return defaultPreferences;
};

// Save preferences to localStorage
const savePreferences = (prefs: UserPreferences) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error("Error saving preferences:", error);
  }
};

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(getStoredPreferences);

  // Load preferences on mount and track visit
  useEffect(() => {
    const prefs = getStoredPreferences();
    prefs.lastVisit = Date.now();
    prefs.visitCount = (prefs.visitCount || 0) + 1;
    savePreferences(prefs);
    setPreferences(prefs);
  }, []);

  // Update a preference
  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      savePreferences(updated);
      return updated;
    });
  }, []);

  // Remember last payment method
  const setLastPaymentMethod = useCallback((method: string) => {
    updatePreference("lastPaymentMethod", method);
    setPreferences(prev => {
      const methods = prev.preferredPaymentMethods || [];
      const updated = {
        ...prev,
        lastPaymentMethod: method,
        preferredPaymentMethods: [method, ...methods.filter(m => m !== method)].slice(0, 5),
      };
      savePreferences(updated);
      return updated;
    });
  }, [updatePreference]);

  // Save a traveler
  const saveTraveler = useCallback((traveler: Omit<SavedTraveler, "id">) => {
    const newTraveler: SavedTraveler = {
      ...traveler,
      id: `traveler_${Date.now()}`,
    };
    
    setPreferences(prev => {
      const travelers = [...prev.savedTravelers, newTraveler];
      const updated = {
        ...prev,
        savedTravelers: travelers,
        defaultTravelerId: travelers.length === 1 ? newTraveler.id : prev.defaultTravelerId,
      };
      savePreferences(updated);
      return updated;
    });

    return newTraveler.id;
  }, []);

  // Update a saved traveler
  const updateTraveler = useCallback((id: string, updates: Partial<SavedTraveler>) => {
    setPreferences(prev => {
      const travelers = prev.savedTravelers.map(t =>
        t.id === id ? { ...t, ...updates } : t
      );
      const updated = { ...prev, savedTravelers: travelers };
      savePreferences(updated);
      return updated;
    });
  }, []);

  // Remove a saved traveler
  const removeTraveler = useCallback((id: string) => {
    setPreferences(prev => {
      const travelers = prev.savedTravelers.filter(t => t.id !== id);
      const updated = {
        ...prev,
        savedTravelers: travelers,
        defaultTravelerId: prev.defaultTravelerId === id ? travelers[0]?.id : prev.defaultTravelerId,
      };
      savePreferences(updated);
      return updated;
    });
  }, []);

  // Set default traveler
  const setDefaultTraveler = useCallback((id: string) => {
    updatePreference("defaultTravelerId", id);
  }, [updatePreference]);

  // Get default traveler
  const getDefaultTraveler = useCallback((): SavedTraveler | undefined => {
    return preferences.savedTravelers.find(t => t.id === preferences.defaultTravelerId)
      || preferences.savedTravelers[0];
  }, [preferences]);

  // Add to favorite routes
  const addFavoriteRoute = useCallback((from: string, to: string) => {
    setPreferences(prev => {
      const routes = [...prev.favoriteRoutes];
      const existingIndex = routes.findIndex(r => r.from === from && r.to === to);
      
      if (existingIndex !== -1) {
        routes[existingIndex].count += 1;
      } else {
        routes.unshift({ from, to, count: 1 });
      }

      // Sort by count and limit
      routes.sort((a, b) => b.count - a.count);
      const limited = routes.slice(0, MAX_FAVORITE_ROUTES);

      const updated = { ...prev, favoriteRoutes: limited };
      savePreferences(updated);
      return updated;
    });
  }, []);

  // Add recent search
  const addRecentSearch = useCallback((query: string, type: string) => {
    setPreferences(prev => {
      const searches = prev.recentSearches.filter(s => s.query !== query);
      searches.unshift({ query, type, timestamp: Date.now() });
      const limited = searches.slice(0, MAX_RECENT_SEARCHES);

      const updated = { ...prev, recentSearches: limited };
      savePreferences(updated);
      return updated;
    });
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    updatePreference("recentSearches", []);
  }, [updatePreference]);

  // Check if user is returning (has visited before)
  const isReturningUser = preferences.visitCount && preferences.visitCount > 1;

  // Check if user has been here recently (within 24h)
  const isRecentVisitor = preferences.lastVisit && 
    (Date.now() - preferences.lastVisit) < 24 * 60 * 60 * 1000;

  return {
    preferences,
    updatePreference,
    
    // Payment methods
    lastPaymentMethod: preferences.lastPaymentMethod,
    setLastPaymentMethod,
    
    // Travelers
    savedTravelers: preferences.savedTravelers,
    saveTraveler,
    updateTraveler,
    removeTraveler,
    setDefaultTraveler,
    getDefaultTraveler,
    
    // Routes
    favoriteRoutes: preferences.favoriteRoutes,
    addFavoriteRoute,
    
    // Searches
    recentSearches: preferences.recentSearches,
    addRecentSearch,
    clearRecentSearches,
    
    // Flags
    isReturningUser,
    isRecentVisitor,
    hasSeenOnboarding: preferences.hasSeenOnboarding,
    autoFillEnabled: preferences.autoFillDetails ?? true,
  };
};

// Export helper to get preferences outside React
export const getUserPreferences = (): UserPreferences => getStoredPreferences();

// Export helper to save from outside React
export const updateUserPreferences = <K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
) => {
  const prefs = getStoredPreferences();
  prefs[key] = value;
  savePreferences(prefs);
};
