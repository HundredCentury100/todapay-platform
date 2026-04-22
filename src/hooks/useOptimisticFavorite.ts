import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface UseOptimisticFavoriteOptions {
  resourceId: string;
  resourceType: "property" | "workspace" | "venue" | "experience";
  checkIsFavorite: () => Promise<boolean>;
  addFavorite: () => Promise<void>;
  removeFavorite: () => Promise<void>;
}

interface UseOptimisticFavoriteReturn {
  isFavorite: boolean;
  isLoading: boolean;
  isToggling: boolean;
  toggleFavorite: (e?: React.MouseEvent) => Promise<void>;
}

export const useOptimisticFavorite = ({
  resourceId,
  resourceType,
  checkIsFavorite,
  addFavorite,
  removeFavorite,
}: UseOptimisticFavoriteOptions): UseOptimisticFavoriteReturn => {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  // Check initial favorite status
  useEffect(() => {
    const checkStatus = async () => {
      if (!user || !resourceId) {
        setIsLoading(false);
        setIsFavorite(false);
        return;
      }

      try {
        const status = await checkIsFavorite();
        setIsFavorite(status);
      } catch (error) {
        console.error(`Error checking ${resourceType} favorite status:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [user, resourceId, resourceType, checkIsFavorite]);

  const toggleFavorite = useCallback(async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!user) {
      toast.error("Please sign in to save favorites");
      return;
    }

    if (isToggling) return;

    // Optimistic update - immediately toggle UI
    const previousState = isFavorite;
    setIsFavorite(!previousState);
    setIsToggling(true);

    // Haptic feedback on mobile
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }

    try {
      if (previousState) {
        await removeFavorite();
        toast.success("Removed from favorites");
      } else {
        await addFavorite();
        toast.success("Added to favorites");
      }
    } catch (error) {
      // Rollback on error
      setIsFavorite(previousState);
      toast.error("Failed to update favorites");
      console.error(`Error toggling ${resourceType} favorite:`, error);
    } finally {
      setIsToggling(false);
    }
  }, [user, isFavorite, isToggling, resourceType, addFavorite, removeFavorite]);

  return {
    isFavorite,
    isLoading,
    isToggling,
    toggleFavorite,
  };
};
