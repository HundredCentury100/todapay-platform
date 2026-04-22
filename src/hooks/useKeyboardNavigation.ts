import { useCallback, useRef, KeyboardEvent } from 'react';

type Orientation = 'horizontal' | 'vertical' | 'both';

interface UseKeyboardNavigationOptions {
  /** Navigation orientation */
  orientation?: Orientation;
  /** Whether to loop around at edges */
  loop?: boolean;
  /** Callback when item is selected (Enter/Space) */
  onSelect?: (index: number) => void;
  /** Total number of items */
  itemCount: number;
  /** Currently focused/selected index */
  currentIndex: number;
  /** Callback to update the current index */
  setCurrentIndex: (index: number) => void;
}

/**
 * Hook for keyboard navigation in lists, grids, and menus
 * Supports arrow key navigation with configurable orientation
 */
export function useKeyboardNavigation(options: UseKeyboardNavigationOptions) {
  const {
    orientation = 'vertical',
    loop = true,
    onSelect,
    itemCount,
    currentIndex,
    setCurrentIndex,
  } = options;

  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const setItemRef = useCallback((index: number) => (el: HTMLElement | null) => {
    itemRefs.current[index] = el;
  }, []);

  const focusItem = useCallback((index: number) => {
    const item = itemRefs.current[index];
    if (item) {
      item.focus();
    }
  }, []);

  const moveFocus = useCallback(
    (direction: 'prev' | 'next') => {
      let newIndex: number;

      if (direction === 'next') {
        if (currentIndex >= itemCount - 1) {
          newIndex = loop ? 0 : currentIndex;
        } else {
          newIndex = currentIndex + 1;
        }
      } else {
        if (currentIndex <= 0) {
          newIndex = loop ? itemCount - 1 : currentIndex;
        } else {
          newIndex = currentIndex - 1;
        }
      }

      setCurrentIndex(newIndex);
      focusItem(newIndex);
    },
    [currentIndex, itemCount, loop, setCurrentIndex, focusItem]
  );

  const moveToFirst = useCallback(() => {
    setCurrentIndex(0);
    focusItem(0);
  }, [setCurrentIndex, focusItem]);

  const moveToLast = useCallback(() => {
    const lastIndex = itemCount - 1;
    setCurrentIndex(lastIndex);
    focusItem(lastIndex);
  }, [itemCount, setCurrentIndex, focusItem]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key } = event;

      // Determine if key matches orientation
      const isVerticalKey = key === 'ArrowUp' || key === 'ArrowDown';
      const isHorizontalKey = key === 'ArrowLeft' || key === 'ArrowRight';

      const shouldHandle =
        orientation === 'both' ||
        (orientation === 'vertical' && isVerticalKey) ||
        (orientation === 'horizontal' && isHorizontalKey);

      if (!shouldHandle && key !== 'Home' && key !== 'End' && key !== 'Enter' && key !== ' ') {
        return;
      }

      switch (key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          moveFocus('prev');
          break;

        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          moveFocus('next');
          break;

        case 'Home':
          event.preventDefault();
          moveToFirst();
          break;

        case 'End':
          event.preventDefault();
          moveToLast();
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          onSelect?.(currentIndex);
          break;
      }
    },
    [orientation, moveFocus, moveToFirst, moveToLast, onSelect, currentIndex]
  );

  return {
    handleKeyDown,
    setItemRef,
    focusItem,
    moveFocus,
    moveToFirst,
    moveToLast,
  };
}

/**
 * Props to spread on navigable list items
 */
export function getNavigableItemProps(
  index: number,
  currentIndex: number,
  setItemRef: (index: number) => (el: HTMLElement | null) => void
) {
  return {
    ref: setItemRef(index),
    tabIndex: index === currentIndex ? 0 : -1,
    'aria-selected': index === currentIndex,
    role: 'option',
  };
}
