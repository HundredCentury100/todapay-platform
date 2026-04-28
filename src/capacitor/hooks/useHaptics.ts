import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isPluginAvailable } from './usePlatform';

/**
 * Hook to provide haptic feedback on user interactions
 */
export const useHaptics = () => {
  const isHapticsAvailable = isPluginAvailable('Haptics');

  /**
   * Trigger a light impact haptic feedback
   */
  const light = async () => {
    if (!isHapticsAvailable) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.error('Haptics error:', error);
    }
  };

  /**
   * Trigger a medium impact haptic feedback
   */
  const medium = async () => {
    if (!isHapticsAvailable) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.error('Haptics error:', error);
    }
  };

  /**
   * Trigger a heavy impact haptic feedback
   */
  const heavy = async () => {
    if (!isHapticsAvailable) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      console.error('Haptics error:', error);
    }
  };

  /**
   * Trigger a success notification haptic
   */
  const success = async () => {
    if (!isHapticsAvailable) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      console.error('Haptics error:', error);
    }
  };

  /**
   * Trigger a warning notification haptic
   */
  const warning = async () => {
    if (!isHapticsAvailable) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {
      console.error('Haptics error:', error);
    }
  };

  /**
   * Trigger an error notification haptic
   */
  const error = async () => {
    if (!isHapticsAvailable) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      console.error('Haptics error:', error);
    }
  };

  /**
   * Trigger a selection changed haptic (like scrolling through a picker)
   */
  const selectionChanged = async () => {
    if (!isHapticsAvailable) return;
    try {
      await Haptics.selectionChanged();
    } catch (error) {
      console.error('Haptics error:', error);
    }
  };

  /**
   * Trigger vibration with pattern (Android only)
   */
  const vibrate = async (duration: number = 300) => {
    if (!isHapticsAvailable) return;
    try {
      await Haptics.vibrate({ duration });
    } catch (error) {
      console.error('Haptics error:', error);
    }
  };

  return {
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    selectionChanged,
    vibrate,
    isHapticsAvailable,
  };
};
