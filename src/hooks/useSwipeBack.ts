import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from './use-mobile';

interface SwipeBackOptions {
  /** Min horizontal distance to trigger (px) */
  threshold?: number;
  /** Max edge zone width to start swipe (px) */
  edgeWidth?: number;
  /** Disabled flag */
  disabled?: boolean;
}

/**
 * Enables iOS-style swipe-from-left-edge to go back on mobile.
 * Only activates when touch starts within `edgeWidth` of the left screen edge.
 */
export function useSwipeBack({
  threshold = 80,
  edgeWidth = 30,
  disabled = false,
}: SwipeBackOptions = {}) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isEdgeSwipe = useRef(false);

  const canGoBack = useCallback(() => {
    const idx = window.history.state?.idx;
    return typeof idx === 'number' && idx > 0;
  }, []);

  useEffect(() => {
    if (!isMobile || disabled) return;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch.clientX <= edgeWidth) {
        isEdgeSwipe.current = true;
        touchStartX.current = touch.clientX;
        touchStartY.current = touch.clientY;
      } else {
        isEdgeSwipe.current = false;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isEdgeSwipe.current) return;
      isEdgeSwipe.current = false;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = Math.abs(touch.clientY - touchStartY.current);

      // Horizontal swipe must be dominant and exceed threshold
      if (deltaX > threshold && deltaX > deltaY * 1.5 && canGoBack()) {
        if ('vibrate' in navigator) navigator.vibrate(10);
        navigate(-1);
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isMobile, disabled, threshold, edgeWidth, navigate, canGoBack]);
}
