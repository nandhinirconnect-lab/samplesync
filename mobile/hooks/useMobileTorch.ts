import { useState, useCallback, useRef } from 'react';
import { Camera } from 'expo-camera';

// Use native torch module when available (requires ejecting to bare workflow)
let NativeTorch: any = null;
try {
  // dynamically require so the code still runs in non-ejected Expo environments
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  NativeTorch = require('react-native-torch');
} catch (err) {
  NativeTorch = null;
}
// Also try to use the native TorchModule we added (TorchService bridge)
let NativeTorchModule: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const RN = require('react-native');
  NativeTorchModule = RN.NativeModules?.TorchModule ?? null;
} catch (err) {
  NativeTorchModule = null;
}

export default function useMobileTorch() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isOn, setIsOn] = useState(false);
  const cameraRef = useRef<Camera>(null);

  const requestPermission = useCallback(async () => {
    try {
      // If native torch is present, many platforms do not need a camera permission to toggle torch,
      // but iOS may require camera permission depending on implementation. We'll still request.
      const { status } = await Camera.requestCameraPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (err) {
      console.error('[Torch] Failed to request permission:', err);
      setIsSupported(false);
      return false;
    }
  }, []);

  const toggle = useCallback(async (forceState?: boolean) => {
    try {
      const nextState = forceState !== undefined ? forceState : !isOn;

      if (NativeTorchModule && NativeTorchModule.startTorch) {
        // Use our native TorchModule to start the foreground service
        try {
          NativeTorchModule.startTorch(nextState);
          setIsOn(nextState);
          return true;
        } catch (e) {
          // ignore and fallback
        }
      }

      if (NativeTorch && NativeTorch.switchState) {
        // Use react-native-torch if linked
        await NativeTorch.switchState(nextState);
        setIsOn(nextState);
        return true;
      }

      // Fallback: use expo-camera preview and attempt to set torch if supported by the track
      if (cameraRef.current) {
        // This is a best-effort placeholder for Expo-managed apps.
        // Many Expo SDKs do not support keeping torch on in background.
        console.log('[Torch] Fallback toggle via Camera preview (best-effort) ->', nextState);
        try {
          // Some implementations expose setTorchMode or similar; here we pause preview to emulate behavior
          await cameraRef.current.pausePreview();
        } catch (e) {
          // ignore
        }
        setIsOn(nextState);
        return true;
      }

      console.warn('[Torch] No torch mechanism available');
      setIsSupported(false);
      return false;
    } catch (err) {
      console.error('[Torch] Failed to toggle torch:', err);
      return false;
    }
  }, [isOn]);

  const startBackground = useCallback(async () => {
    try {
      console.log('[Torch][JS] startBackground() called')
      if (NativeTorchModule && NativeTorchModule.startTorch) {
        console.log('[Torch][JS] Using NativeTorchModule.startTorch')
        NativeTorchModule.startTorch(true);
        setIsOn(true);
        return true;
      }

      if (NativeTorch && NativeTorch.switchState) {
        console.log('[Torch][JS] Using react-native-torch.switchState')
        await NativeTorch.switchState(true);
        setIsOn(true);
        return true;
      }

      // fallback to toggle
      await toggle(true);
      return true;
    } catch (err) {
      console.error('[Torch] startBackground failed', err);
      return false;
    }
  }, [toggle]);

  const stopBackground = useCallback(async () => {
    try {
      console.log('[Torch][JS] stopBackground() called')
      if (NativeTorchModule && NativeTorchModule.startTorch) {
        console.log('[Torch][JS] Using NativeTorchModule.startTorch(false)')
        NativeTorchModule.startTorch(false);
        setIsOn(false);
        return true;
      }

      if (NativeTorch && NativeTorch.switchState) {
        console.log('[Torch][JS] Using react-native-torch.switchState(false)')
        await NativeTorch.switchState(false);
        setIsOn(false);
        return true;
      }

      await toggle(false);
      return true;
    } catch (err) {
      console.error('[Torch] stopBackground failed', err);
      return false;
    }
  }, [toggle]);

  return {
    hasPermission,
    isSupported,
    isOn,
    requestPermission,
    toggle,
    startBackground,
    stopBackground,
    cameraRef,
  };
}
