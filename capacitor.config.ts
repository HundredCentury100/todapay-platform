import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.todapay.platform',
  appName: 'TodaPay',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'todapay.app',
    // For development, uncomment the line below to use the dev server
    // url: 'http://localhost:8081',
    // cleartext: true,
  },
  // Deep link configuration for payment callbacks
  android: {
    allowMixedContent: true,
  },
  ios: {
    scheme: 'todapay',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#1c1fcf',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffc50d',
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#1c1fcf',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
