# Mobile app: Eject & Native Torch instructions

This project currently uses Expo managed workflow. To keep the device flashlight (torch) on when the screen is off or app is backgrounded, you must use a native module and run a bare React Native app (Android supports background torch via native APIs).

Recommended steps:

1. Eject to the bare workflow

```bash
# from /workspaces/samplesync/mobile
npm install
expo prebuild --platform android --clean
# or: expo eject
```

2. Install native torch dependency

```bash
npm install react-native-torch
# iOS: cd ios && pod install
```

3. Android permissions

- Ensure `android/app/src/main/AndroidManifest.xml` includes the camera permission:

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

- For background behavior, implement a foreground service if you want the torch to remain on after screen off. That requires additional native code (Android `Service`) and is outside the scope of this README.

4. Update `useMobileTorch` hook (already updated) to use `react-native-torch` when available. After ejecting, ensure native modules are linked and rebuild the app:

```bash
npx react-native run-android
npx react-native run-ios
```

Notes and caveats:

- iOS typically restricts camera usage in background — keeping torch on when the screen is off is not generally supported on iOS.
- On Android, the native torch API (`CameraManager.setTorchMode`) can toggle torch independently of a camera preview and will work while screen is off if the process remains running.
- If you need the torch to persist reliably when the app is backgrounded, implement a foreground Android service and keep the process alive while the show is running.

If you want, I can:
- Patch Android native code to add a simple foreground service (additional native edits).
- Prepare a PR with updated mobile docs and package changes.
