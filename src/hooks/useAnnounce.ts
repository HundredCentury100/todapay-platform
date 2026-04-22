import { useCallback, useRef, useEffect } from 'react';

type Politeness = 'polite' | 'assertive' | 'off';

interface UseAnnounceOptions {
  /** Politeness level for announcements */
  politeness?: Politeness;
  /** Delay before announcement (helps with race conditions) */
  delay?: number;
}

/**
 * Hook for announcing dynamic content changes to screen readers
 * Uses ARIA live regions for accessibility
 */
export function useAnnounce(options: UseAnnounceOptions = {}) {
  const { politeness = 'polite', delay = 100 } = options;
  
  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Create live region on mount
  useEffect(() => {
    const existingRegion = document.getElementById(`live-region-${politeness}`);
    
    if (existingRegion) {
      liveRegionRef.current = existingRegion as HTMLDivElement;
    } else {
      const region = document.createElement('div');
      region.id = `live-region-${politeness}`;
      region.setAttribute('aria-live', politeness);
      region.setAttribute('aria-atomic', 'true');
      region.setAttribute('role', 'status');
      region.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;
      document.body.appendChild(region);
      liveRegionRef.current = region;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [politeness]);

  const announce = useCallback(
    (message: string) => {
      if (!liveRegionRef.current) return;

      // Clear any pending announcement
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Clear current content first (helps screen readers detect change)
      liveRegionRef.current.textContent = '';

      // Set new content after delay
      timeoutRef.current = setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = message;
        }
      }, delay);
    },
    [delay]
  );

  const clear = useCallback(() => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = '';
    }
  }, []);

  return { announce, clear };
}

/**
 * Higher-order component or hook for automatic form error announcements
 */
export function useFormErrorAnnounce() {
  const { announce } = useAnnounce({ politeness: 'assertive' });

  const announceError = useCallback(
    (fieldLabel: string, errorMessage: string) => {
      announce(`Error in ${fieldLabel}: ${errorMessage}`);
    },
    [announce]
  );

  const announceErrors = useCallback(
    (errors: Record<string, string>) => {
      const errorMessages = Object.entries(errors)
        .map(([field, message]) => `${field}: ${message}`)
        .join('. ');
      
      if (errorMessages) {
        announce(`Form has errors. ${errorMessages}`);
      }
    },
    [announce]
  );

  return { announceError, announceErrors };
}
