import { Capacitor } from '@capacitor/core';
import { useEffect, useState } from 'react';

export interface PlatformInfo {
  isNative: boolean;
  platform: 'web' | 'ios' | 'android';
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
}

/**
 * Hook to detect the current platform the app is running on
 * @returns Platform information object
 */
export const usePlatform = (): PlatformInfo => {
  const [platformInfo] = useState<PlatformInfo>(() => {
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform() as 'web' | 'ios' | 'android';

    return {
      isNative,
      platform,
      isIOS: platform === 'ios',
      isAndroid: platform === 'android',
      isWeb: platform === 'web',
    };
  });

  return platformInfo;
};

/**
 * Helper function to check if running on native platform
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Helper function to get the current platform
 */
export const getPlatform = (): 'web' | 'ios' | 'android' => {
  return Capacitor.getPlatform() as 'web' | 'ios' | 'android';
};

/**
 * Helper function to check if plugin is available
 */
export const isPluginAvailable = (pluginName: string): boolean => {
  return Capacitor.isPluginAvailable(pluginName);
};
