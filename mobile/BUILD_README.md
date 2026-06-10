# School ERP Mobile — Build Guide

This guide covers how to run, test, and build the School ERP mobile app using Expo and EAS (Expo Application Services).

---

## ⚠️ Important Notes

- **Do NOT commit** your `.env`, `google-services.json`, or `GoogleService-Info.plist` files.
- **Do NOT publish to the Play Store or App Store** until the app is fully reviewed and approved.
- **Do NOT hardcode** API URLs, tokens, or secrets in source code.
- Firebase push notifications require a real EAS/dev build — Expo Go is limited.
- iOS builds require an Apple Developer account ($99/year) and macOS + EAS credentials.

---

## 1. Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18.x |
| Expo CLI | via `npx expo` |
| EAS CLI | via `npx eas-cli` (≥ 12.0.0) |
| Expo Account | [expo.dev](https://expo.dev) |

---

## 2. Set Up API URL

Copy `.env.example` to `.env` and set your backend URL:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Android Emulator
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:5001/api

# iOS Simulator / localhost
EXPO_PUBLIC_API_BASE_URL=http://localhost:5001/api

# Physical device on LAN (fill in your machine IP)
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.X:5001/api

# Production (HTTPS required for App Store / Play Store)
EXPO_PUBLIC_API_BASE_URL=https://api.yourschool.com/api
```

> **Never commit `.env` to the repository.**

---

## 3. Install Dependencies

```bash
cd mobile
npm install
```

---

## 4. TypeScript Check

```bash
cd mobile
npm run typecheck
# or
npx tsc --noEmit
```

---

## 5. Run Locally (Expo Go)

```bash
cd mobile
npm start
# or with cache clear:
npm run start:clear
```

Scan the QR code in the Expo Go app (iOS/Android).

> **Note:** Expo Go has limited push notification support. For full push testing, use a development build.

### Android Emulator
```bash
npm run android
```

### iOS Simulator (macOS only)
```bash
npm run ios
```

---

## 6. Run on a Physical Android Phone (USB)

1. Enable **Developer Options** and **USB Debugging** on your phone.
2. Connect via USB.
3. Set `EXPO_PUBLIC_API_BASE_URL` to your machine's **LAN IP** in `.env`.

   > ⚠️ **`localhost` does NOT work on a physical device.** The device cannot reach your development machine via `localhost`. You must use the actual LAN IP address (e.g. `http://192.168.1.X:5001/api`). Find your machine IP with `ipconfig` (Windows) or `ifconfig` / `ip addr` (macOS/Linux).

4. Run:

```bash
npm run android
```

---

## 7. EAS Build — Initial Setup

Login to your Expo account:

```bash
npx eas-cli login
```

Link project (only once — updates `eas.json` with projectId):

```bash
npx eas-cli build:configure
```

> This sets the `extra.eas.projectId` in `app.json`.

---

## 8. Create a Development Build

A development build includes the Expo dev client and supports full native APIs (push notifications, etc.).

**Android APK:**
```bash
npx eas-cli build --profile development --platform android
```

**iOS Simulator:**
```bash
npx eas-cli build --profile development --platform ios
```

> iOS requires Apple Developer credentials. EAS will guide you through certificate setup.

---

## 9. Create a Preview APK (Internal Testing)

Generates a shareable APK for testers — does NOT publish to Play Store.

```bash
npx eas-cli build --profile preview --platform android
```

---

## 10. Create Production Build (Future — NOT YET)

> ⛔ **Do NOT run this until the app is fully reviewed and ready for store submission.**

**Android AAB (Play Store):**
```bash
npx eas-cli build --profile production --platform android
```

**iOS IPA (App Store):**
```bash
npx eas-cli build --profile production --platform ios
```

---

## 11. Firebase Push Notifications

Push notifications use Firebase Cloud Messaging (FCM) via the backend.

| Component | Location |
|-----------|----------|
| Firebase Admin SDK | Backend (`server/src/config/firebase.ts`) |
| Firebase credentials | Backend `.env` only (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) |
| Device token registration | `/api/mobile/devices/register` |
| Native push config | Requires `google-services.json` (Android) / `GoogleService-Info.plist` (iOS) |

### For a real push test:

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com).
2. Download `google-services.json` and `GoogleService-Info.plist`.
3. Add them via **EAS Secrets** (do NOT commit them).
4. Run an EAS development build.
5. Enable push in backend `.env`:
   ```env
   PUSH_NOTIFICATIONS_ENABLED=true
   FIREBASE_PROJECT_ID=...
   FIREBASE_CLIENT_EMAIL=...
   FIREBASE_PRIVATE_KEY=...
   ```

> Expo Go does not support full FCM native push — use a dev build.

---

## 12. Before Release Checklist

- [ ] Replace `./assets/icon.png` with final client logo (1024×1024 PNG)
- [ ] Replace `./assets/splash-icon.png` with final splash (centered logo on dark background)
- [ ] Replace `./assets/android-icon-*.png` with final adaptive icons
- [ ] Confirm final app name (currently: `School ERP Mobile`)
- [ ] Confirm final bundle ID (`com.schoolerp.mobile`) with client
- [ ] Set `EXPO_PUBLIC_API_BASE_URL` to production HTTPS API
- [ ] Set `PUSH_NOTIFICATIONS_ENABLED=true` and add Firebase credentials to backend
- [ ] Run `npx eas-cli build:configure` to link EAS project
- [ ] Submit for internal testing before public release

---

## 13. Environment Matrix

| Scenario | `EXPO_PUBLIC_API_BASE_URL` | Build Type |
|----------|---------------------------|------------|
| Android Emulator | `http://10.0.2.2:5001/api` | Expo Go |
| iOS Simulator | `http://localhost:5001/api` | Expo Go |
| Physical phone (LAN) | `http://192.168.1.X:5001/api` | Expo Go / Dev Build |
| Internal testers | `http://<STAGING_IP>:5001/api` | Preview APK |
| Production | `https://api.yourschool.com/api` | Production AAB/IPA |

---

*Phase 3.0G — EAS Build Preparation*  
*Last updated: June 2026*
