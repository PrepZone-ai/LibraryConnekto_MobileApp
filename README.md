# Library Connekto – Mobile App (React Native + Expo)

Library Connekto is a React Native + Expo application for modern library operations. It offers distinct Student and Admin experiences covering seat bookings, attendance, messaging, analytics, and subscription management.

## Overview

- Platforms: Android (native module enabled), optional Web preview
- Navigation: Stack + Bottom Tabs
- UI: React Native Paper (MD3 theme)
- State/Context: Auth + Student contexts
- API: Typed fetch wrapper with bearer auth and error handling
- Background: Task registration and notification checks on app boot

## Architecture

- `App.tsx`
  - Registers providers (`AuthProvider`, `StudentProvider`)
  - Defines `RootStack`, `AdminStack`, `AdminTab`, `StudentTab`
  - `ProtectedRoute` example for gated content
  - Central theme and error boundary
- `components/`
  - `Admin/…`: Dashboard, Seat Management, Student Management, Messaging, Profile
  - `Student/…`: Home, Booking, Messages, Dashboard, Profile
  - `common/…`: Tab icons, headers, FABs, loading
- `contexts/`
  - `AuthContext.tsx`, `StudentContext.tsx`
- `services/`
  - `backgroundTaskService.ts`, `notificationService.ts`, `authService.ts`, etc.
- `config/`
  - `api.ts`: `apiClient`, `adminAPI`, `API_BASE_URL` from env
  - `env.js`: dotenv loading for `REACT_APP_*`
- `android/`
  - Native Android project for local builds and releases

## Features

- Student
  - Onboarding and role selection, login, profile, messages
  - Find libraries, seat booking flow, dashboard stats
- Admin
  - Dashboard with KPIs and analytics
  - Seat management, student CRUD, bulk upload
  - Messaging (1:1 and broadcast), subscription plans

## Getting Started

### Requirements

- Node.js 18+
- Yarn
- Expo CLI (`npm i -g expo`)
- Android Studio + SDKs

### Install

```bash
yarn install
```

### Environment

Create `.env` in project root:

```bash
REACT_APP_API_BASE_URL=https://your-backend-host/api/v1
```

Notes:

- `config/env.js` loads `.env` files and exposes `REACT_APP_*` variables.
- `config/api.ts` defaults to `http://localhost:8000/api/v1` when unset.

### Run (Expo)

```bash
yarn start          # start Metro bundler
yarn android        # run on Android device/emulator
yarn ios            # run on iOS (macOS only)
yarn web            # optional web preview
```

## Build

### Android Debug APK

```bash
cd android
./gradlew clean
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

### Android Release (high level)

1) Generate keystore and configure signing in `android/app/build.gradle`
2) Set `release` signing config and `minifyEnabled` as needed
3) Build:

```bash
cd android
./gradlew assembleRelease
```

### Expo EAS (optional)

If using EAS:

```bash
npx expo install expo-build-properties
eas build -p android
```

## Scripts

- `start`: `expo start`
- `android`: `expo run:android`
- `ios`: `expo run:ios`
- `web`: `expo start --web`

## API Usage

`config/api.ts` provides:

- `apiClient.get/post/put/patch/delete`
- `getAuthToken/setAuthToken/removeAuthToken`
- `adminAPI` helpers (profile, analytics, messages, students)

Ensure the backend implements `/api/v1/health`, `/admin/*`, `/messaging/*` endpoints.

## Testing (Jest setup present)

- Jest config under `config/jest/*`
- Example command (if tests are added under `src/`):

```bash
yarn jest
```

## Troubleshooting

- Metro cache: `expo start -c`
- Android SDK path: ensure `ANDROID_HOME` is set
- Hermes/Gradle: run `cd android && ./gradlew clean`
- API failures: verify `REACT_APP_API_BASE_URL`

## Contributing

1. Create a feature branch
2. Follow TypeScript and formatting conventions
3. Use descriptive commit messages
4. Open a PR for review

## License

0BSD (see `package.json`)
