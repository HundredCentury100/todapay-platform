import { useSwipeBack } from '@/hooks/useSwipeBack';

/**
 * Component to enable swipe-from-left-edge back navigation.
 * Place inside <BrowserRouter>.
 */
export const SwipeBackProvider = () => {
  useSwipeBack();
  return null;
};
