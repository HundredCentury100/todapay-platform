/**
 * Haptic Feedback Utility
 * 
 * Provides haptic feedback for mobile interactions.
 * Gracefully degrades on devices without vibration support.
 * 
 * Uses the Web Vibration API which is supported on Android Chrome
 * and will be available on iOS when using Capacitor.
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  warning: [25, 50, 25],
  error: [50, 100, 50],
  selection: 5,
};

/**
 * Check if haptic feedback is available
 */
export function isHapticSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback with a predefined pattern
 */
export function haptic(pattern: HapticPattern = 'light'): void {
  if (!isHapticSupported()) return;
  
  try {
    navigator.vibrate(patterns[pattern]);
  } catch (error) {
    // Silently fail - haptic is non-critical
    console.debug('Haptic feedback failed:', error);
  }
}

/**
 * Trigger custom haptic feedback with a duration in milliseconds
 */
export function hapticCustom(duration: number): void {
  if (!isHapticSupported()) return;
  
  try {
    navigator.vibrate(duration);
  } catch (error) {
    console.debug('Haptic feedback failed:', error);
  }
}

/**
 * Stop any ongoing haptic feedback
 */
export function hapticStop(): void {
  if (!isHapticSupported()) return;
  
  try {
    navigator.vibrate(0);
  } catch (error) {
    console.debug('Haptic stop failed:', error);
  }
}

/**
 * Hook for using haptic feedback in React components
 * 
 * Usage:
 * const { trigger } = useHaptic();
 * <button onClick={() => { trigger('success'); doSomething(); }}>
 */
export function useHaptic() {
  return {
    isSupported: isHapticSupported(),
    trigger: haptic,
    custom: hapticCustom,
    stop: hapticStop,
  };
}
