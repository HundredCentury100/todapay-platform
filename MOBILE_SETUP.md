# 📱 TodaPay Mobile App Setup Guide

## ✅ Setup Complete!

Congratulations! Your TodaPay platform has been successfully configured for mobile app development using Capacitor.

---

## 📦 What Was Installed

### Core Capacitor
- `@capacitor/core` - Core Capacitor functionality
- `@capacitor/cli` - Command-line interface
- `@capacitor/android` - Android platform support
- `@capacitor/ios` - iOS platform support

### Essential Plugins
- `@capacitor/app` - App lifecycle events
- `@capacitor/haptics` - Haptic feedback/vibration
- `@capacitor/keyboard` - Keyboard management
- `@capacitor/status-bar` - Status bar styling
- `@capacitor/splash-screen` - Splash screen management
- `@capacitor/camera` - Camera and photo gallery access
- `@capacitor/geolocation` - GPS location services
- `@capacitor/push-notifications` - Push notifications
- `@capacitor/share` - Native share dialog
- `@capacitor/network` - Network status monitoring
- `@capacitor/device` - Device information
- `@capacitor/browser` - In-app browser
- `@capacitor/toast` - Native toast messages

---

## 🗂️ Project Structure

```
todapay-platform-main/
├── android/                         # Android native project
├── ios/                             # iOS native project (Xcode)
├── src/
│   ├── capacitor/
│   │   └── hooks/                   # Capacitor utility hooks
│   │       ├── usePlatform.ts       # Platform detection
│   │       ├── useCamera.ts         # Camera functionality
│   │       ├── useHaptics.ts        # Haptic feedback
│   │       └── index.ts             # Exports
│   └── components/
│       └── mobile/
│           └── MobileBottomNav.tsx  # Mobile bottom navigation
├── capacitor.config.ts              # Capacitor configuration
└── MOBILE_SETUP.md                  # This file
```

---

## 🚀 Available NPM Scripts

### Development
```bash
npm run dev                  # Start web development server
```

### Mobile Build & Sync
```bash
npm run build:mobile         # Build web + sync to native platforms
npm run cap:sync             # Sync web assets to native platforms
npm run cap:update           # Build + sync (same as build:mobile)
```

### Open Native IDEs
```bash
npm run cap:android          # Open Android Studio
npm run cap:ios              # Open Xcode (Mac only)
```

### Run on Device/Emulator
```bash
npm run cap:run:android      # Build and run on Android
npm run cap:run:ios          # Build and run on iOS
```

---

## 📱 Development Workflow

### Option 1: Live Reload (Recommended for Development)

1. **Start the Vite dev server:**
   ```bash
   npm run dev
   ```

2. **Update `capacitor.config.ts`** to use the dev server:
   ```typescript
   server: {
     url: 'http://localhost:8081',  // Your dev server URL
     cleartext: true,                 // Allow HTTP on Android
   }
   ```

3. **Sync and run:**
   ```bash
   npm run cap:sync
   npm run cap:run:android  # or cap:run:ios
   ```

4. **Make changes** - They'll hot-reload in the app!

### Option 2: Production Build

1. **Build the web app:**
   ```bash
   npm run build:mobile
   ```

2. **Open in native IDE:**
   ```bash
   npm run cap:android   # or cap:ios
   ```

3. **Run from Android Studio or Xcode**

---

## 🛠️ Using Capacitor Hooks

### Platform Detection

```typescript
import { usePlatform } from '@/capacitor/hooks';

const MyComponent = () => {
  const { isNative, isIOS, isAndroid, isWeb } = usePlatform();

  if (isNative) {
    return <MobileView />;
  }

  return <WebView />;
};
```

### Camera Usage

```typescript
import { useCamera } from '@/capacitor/hooks';

const ProfilePhoto = () => {
  const { takePicture, pickImage, isLoading } = useCamera();

  const handleTakePhoto = async () => {
    const photo = await takePicture();
    if (photo) {
      console.log('Photo path:', photo.webPath);
    }
  };

  const handlePickFromGallery = async () => {
    const photo = await pickImage();
    if (photo) {
      console.log('Image path:', photo.webPath);
    }
  };

  return (
    <>
      <button onClick={handleTakePhoto}>Take Photo</button>
      <button onClick={handlePickFromGallery}>Choose from Gallery</button>
    </>
  );
};
```

### Haptic Feedback

```typescript
import { useHaptics } from '@/capacitor/hooks';

const Button = () => {
  const { light, success, error } = useHaptics();

  const handleClick = async () => {
    await light(); // Light tap feedback
    // Do something
    await success(); // Success feedback
  };

  return <button onClick={handleClick}>Click Me</button>;
};
```

---

## 📱 Testing on Android

### Prerequisites
1. **Install Android Studio** from https://developer.android.com/studio
2. **Install Java JDK 17** (required for Android)
3. **Set up Android SDK** (Android Studio will guide you)

### Steps
1. **Open Android Studio:**
   ```bash
   npm run cap:android
   ```

2. **Wait for Gradle sync** to complete

3. **Select a device:**
   - Physical device (enable USB debugging)
   - Or create an emulator (AVD Manager)

4. **Click the Run button** (green play icon)

5. **App will launch** on your device/emulator

---

## 🍎 Testing on iOS

### Prerequisites
1. **Mac computer** (required for iOS development)
2. **Install Xcode** from Mac App Store
3. **Install Xcode Command Line Tools:**
   ```bash
   xcode-select --install
   ```

### Steps
1. **Open Xcode:**
   ```bash
   npm run cap:ios
   ```

2. **Select a device:**
   - Physical device (requires Apple Developer account for testing)
   - Or iOS Simulator

3. **Click the Run button** (play icon)

4. **App will launch** on your device/simulator

---

## 🔧 Troubleshooting

### Android Build Errors

**Error: JAVA_HOME not set**
- Install Java JDK 17
- Set JAVA_HOME environment variable

**Error: SDK location not found**
- Open Android Studio
- Go to File → Project Structure → SDK Location
- Set Android SDK location

**Gradle sync failed**
- Open Android Studio
- File → Invalidate Caches / Restart

### iOS Build Errors

**Error: Command PhaseScriptExecution failed**
- Open Xcode
- Product → Clean Build Folder
- Try building again

**Error: Signing requires a development team**
- Open Xcode
- Select project → Signing & Capabilities
- Select your team or use automatic signing

### General Issues

**Changes not reflecting in app**
```bash
npm run build:mobile  # Rebuild and sync
```

**Plugins not working**
```bash
npx cap sync  # Re-sync plugins
```

**Native project corrupted**
```bash
# Remove and re-add platform
rm -rf android  # or ios
npx cap add android  # or ios
npm run build:mobile
```

---

## 🎨 Customizing Your App

### App Name & ID

Edit [capacitor.config.ts](capacitor.config.ts:4-5):
```typescript
appId: 'com.todapay.platform',  // Change to your bundle ID
appName: 'TodaPay',             // Change app name
```

After changing, sync:
```bash
npx cap sync
```

### App Icons

1. **Prepare icons** (various sizes needed)
2. **Android:**
   - Place in `android/app/src/main/res/mipmap-*/`
3. **iOS:**
   - Use Xcode → Assets.xcassets → AppIcon

### Splash Screen

1. **Android:**
   - Place image in `android/app/src/main/res/drawable/splash.png`

2. **iOS:**
   - Use Xcode → Assets.xcassets → Splash

3. **Configure in [capacitor.config.ts](capacitor.config.ts:16-26)**

### Theme Colors

Edit [capacitor.config.ts](capacitor.config.ts:20):
```typescript
backgroundColor: '#1d9bf0',  // Your brand color
```

---

## 📦 Adding More Plugins

Browse plugins at https://capacitorjs.com/docs/plugins

Example - adding File System:
```bash
npm install @capacitor/filesystem
npx cap sync
```

Then use in code:
```typescript
import { Filesystem } from '@capacitor/filesystem';
```

---

## 🚢 Publishing to App Stores

### Google Play Store

1. **Generate signed APK/AAB** in Android Studio
2. **Create Google Play Console account** ($25 one-time)
3. **Upload APK/AAB** and fill out store listing
4. **Submit for review**

### Apple App Store

1. **Archive app in Xcode** (Product → Archive)
2. **Create App Store Connect account** ($99/year)
3. **Upload via Xcode** or Application Loader
4. **Fill out App Store listing**
5. **Submit for review**

---

## 📚 Next Steps

1. ✅ **Test on Android emulator/device**
2. ✅ **Test on iOS simulator/device (if Mac)**
3. ✅ **Implement native features:**
   - Camera for QR code scanning
   - Push notifications for bookings
   - Geolocation for maps
   - Haptics for better UX
4. ✅ **Add mobile bottom navigation** to main app
5. ✅ **Optimize UI for mobile screens**
6. ✅ **Test offline functionality**
7. ✅ **Prepare app store assets:**
   - Screenshots
   - App icons
   - Descriptions
   - Privacy policy

---

## 🆘 Need Help?

- **Capacitor Docs:** https://capacitorjs.com/docs
- **Capacitor Community:** https://forum.ionicframework.com
- **Plugin Documentation:** https://capacitorjs.com/docs/plugins

---

## ✨ Tips for Success

1. **Always sync after plugin changes:** `npm run cap:sync`
2. **Use live reload during development** for faster iteration
3. **Test on real devices** before publishing
4. **Check permissions** in AndroidManifest.xml and Info.plist
5. **Keep Capacitor updated:** `npm update @capacitor/cli @capacitor/core`
6. **Use platform detection** to show/hide features
7. **Add haptic feedback** for better mobile UX
8. **Handle safe areas** for notches and home indicators

---

**You're all set! Start building your mobile app! 🚀**
