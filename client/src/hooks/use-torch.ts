import { useState, useCallback, useRef, useEffect } from 'react';

export function useTorch() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isOn, setIsOn] = useState(false);
  const trackRef = useRef<MediaStreamTrack | null>(null);

  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      // Check if torch is supported properly
      if (!capabilities.torch) {
        console.warn('Torch not supported on this device/browser');
        setIsSupported(false);
        // Clean up if not supported
        track.stop();
        return false;
      }

      trackRef.current = track;
      setHasPermission(true);
      return true;
    } catch (err) {
      console.error('Failed to access camera/torch:', err);
      setIsSupported(false);
      return false;
    }
  }, []);

  const toggle = useCallback(async (forceState?: boolean) => {
    if (!trackRef.current || !hasPermission) return;

    try {
      const nextState = forceState !== undefined ? forceState : !isOn;
      
      // Apply constraint
      await trackRef.current.applyConstraints({
        advanced: [{ torch: nextState }]
      });
      
      setIsOn(nextState);
    } catch (err) {
      console.error('Failed to toggle torch:', err);
    }
  }, [hasPermission, isOn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackRef.current) {
        trackRef.current.stop();
      }
    };
  }, []);

  return {
    isSupported,
    hasPermission,
    isOn,
    requestPermission,
    toggle
  };
}
