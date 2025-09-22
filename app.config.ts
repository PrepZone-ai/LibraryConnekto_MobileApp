import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'LibraryConneckto',
  slug: 'libraryconneckto',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.libraryconneckto'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.ddlsandeep.libraryconneckto',  // Updated package name
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'INTERNET',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'VIBRATE'
    ],
    versionCode: 1
  },
  scheme: 'libraryconneckto',
  web: {
    favicon: './assets/favicon.png'
  },
  plugins: [
    'expo-location',
    'expo-document-picker',
    'expo-file-system',
    'expo-image-picker',
    // Removed problematic plugins: expo-sharing, expo-mail-composer, expo-print
    'expo-task-manager',
    [
      'expo-build-properties',
      {
        android: {
          kotlinVersion: '1.8.0',
          compileSdkVersion: 34,
          targetSdkVersion: 34,
          minSdkVersion: 24,
          buildToolsVersion: '34.0.0'
        }
      }
    ]
  ],
  extra: {
    eas: {
      projectId: 'd4e145fc-f671-47b2-8a44-f7dd043ea09f'
    }
  }
};

export default config;

