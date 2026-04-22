import { useRef, useState, useCallback, useEffect } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

interface UsePullToRefreshReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  pullDistance: number;
  isRefreshing: boolean;
  isPulling: boolean;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions): UsePullToRefreshReturn => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPullingRef = useRef(false);
  const isRefreshingRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    isPullingRef.current = isPulling;
  }, [isPulling]);

  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Check window scroll position instead of container
    if (window.scrollY === 0 || window.pageYOffset === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPullingRef.current || isRefreshingRef.current) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    if (diff > 0) {
      // Apply resistance - the further you pull, the harder it gets
      const resistance = Math.min(1, 1 - diff / (maxPull * 3));
      const pullValue = Math.min(diff * resistance, maxPull);
      setPullDistance(pullValue);
      
      // Prevent scroll if we're at the top
      if (window.scrollY === 0 || window.pageYOffset === 0) {
        e.preventDefault();
      }
    }
  }, [maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return;
    
    setIsPulling(false);
    const currentPullDistance = pullDistance;
    
    if (currentPullDistance >= threshold && !isRefreshingRef.current) {
      // Haptic feedback when threshold is reached
      if ('vibrate' in navigator) {
        try { navigator.vibrate([15, 30, 15]); } catch {}
      }
      
      setIsRefreshing(true);
      setPullDistance(threshold / 2);
      
      try {
        await onRefresh();
      } finally {
        // Short haptic on refresh complete
        if ('vibrate' in navigator) {
          try { navigator.vibrate(10); } catch {}
        }
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    isPulling,
  };
};
