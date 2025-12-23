import { useState, useCallback, useRef } from 'react';
import { Camera } from 'expo-camera';

export default function useMobileTorch() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const cameraRef = useRef<Camera>(null);

  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      return status === 'granted';
    } catch (err) {
      console.error('[Torch] Failed to request permission:', err);
      setIsSupported(false);
      return false;
    }
  }, []);

  const toggle = useCallback(async (forceState?: boolean) => {
    try {
      if (cameraRef.current) {
        const nextState = forceState !== undefined ? forceState : true;
        console.log('[Torch] Toggling torch to:', nextState);
        await cameraRef.current.pausePreview();
        // Torch control would happen via Camera API
        // This is a placeholder - actual implementation depends on expo-camera version
      }
    } catch (err) {
      console.error('[Torch] Failed to toggle:', err);
    }
  }, []);

  return {
    hasPermission,
    isSupported,
    requestPermission,
    toggle,
    cameraRef,
  };
}
