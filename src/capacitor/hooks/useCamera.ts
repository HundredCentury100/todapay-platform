import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { useState } from 'react';
import { isPluginAvailable } from './usePlatform';

export interface CameraOptions {
  quality?: number;
  allowEditing?: boolean;
  resultType?: CameraResultType;
  source?: CameraSource;
}

/**
 * Hook to use device camera for taking photos or selecting from gallery
 */
export const useCamera = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCameraAvailable = isPluginAvailable('Camera');

  /**
   * Take a photo using the device camera
   */
  const takePicture = async (options?: CameraOptions): Promise<Photo | null> => {
    if (!isCameraAvailable) {
      setError('Camera is not available on this device');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const photo = await Camera.getPhoto({
        quality: options?.quality || 90,
        allowEditing: options?.allowEditing || false,
        resultType: options?.resultType || CameraResultType.Uri,
        source: options?.source || CameraSource.Camera,
      });

      setIsLoading(false);
      return photo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to take picture';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  };

  /**
   * Pick an image from the device gallery
   */
  const pickImage = async (options?: CameraOptions): Promise<Photo | null> => {
    return takePicture({
      ...options,
      source: CameraSource.Photos,
    });
  };

  /**
   * Request camera permissions
   */
  const requestPermissions = async () => {
    if (!isCameraAvailable) {
      return { granted: false };
    }

    try {
      const permissions = await Camera.requestPermissions();
      return { granted: permissions.camera === 'granted' };
    } catch (err) {
      setError('Failed to request camera permissions');
      return { granted: false };
    }
  };

  /**
   * Check camera permissions
   */
  const checkPermissions = async () => {
    if (!isCameraAvailable) {
      return { granted: false };
    }

    try {
      const permissions = await Camera.checkPermissions();
      return { granted: permissions.camera === 'granted' };
    } catch (err) {
      setError('Failed to check camera permissions');
      return { granted: false };
    }
  };

  return {
    takePicture,
    pickImage,
    requestPermissions,
    checkPermissions,
    isLoading,
    error,
    isCameraAvailable,
  };
};
