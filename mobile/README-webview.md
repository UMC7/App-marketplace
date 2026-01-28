# Mobile WebView App (Expo)

This folder contains a minimal WebView wrapper for the mobile app. It opens https://www.yachtdaywork.com as the sole UI.

Setup

1. From this repository root, change to the mobile folder:

```bash
cd mobile
```

2. Install dependencies:

```bash
npm install
# or yarn
```

3. Start the Expo dev server:

```bash
npx expo start
```

Notes

- The root screen is `mobile/app/index.tsx` and contains a full-screen `WebView`.
- Android hardware back button navigates WebView history when possible.
- `mobile/app.json` contains Android permission placeholders (camera and wake-lock) as structure for future native features.
