import { useState, useEffect } from 'react';

/**
 * Hook to detect user's motion preference
 * Returns true if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return false;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    
    // Fallback for older browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Get motion-safe animation props for Framer Motion
 * Returns empty animation props if user prefers reduced motion
 */
export function useMotionSafe<T extends Record<string, unknown>>(
  animationProps: T
): T | Record<string, never> {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return {};
  }
  
  return animationProps;
}

/**
 * Motion-safe transition for Framer Motion
 */
export function useMotionSafeTransition(transition: Record<string, unknown>) {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return { duration: 0 };
  }
  
  return transition;
}
