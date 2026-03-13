# App Store (iOS) – next steps

Aligned is set up with **Capacitor** and loads your live site (`alignedconnectingcouples.com`). Use this checklist to get ready for Apple App Store submission.

---

## 1. Apple Developer account

- Enroll at [developer.apple.com](https://developer.apple.com) (**Apple Developer Program**, $99/year).
- You’ll need this for App IDs, signing, and App Store Connect.

---

## 2. Create the iOS project (if not done)

From the repo root, build the web app and add the native iOS project:

```bash
cd apps/aligned
npm run build
npx cap add ios
```

Then sync the web build into the iOS app:

```bash
npx cap sync ios
```

Open in Xcode:

```bash
npx cap open ios
```

---

## 3. Configure the app in Xcode

- **Bundle ID:** Should match `capacitor.config.ts` → `appId`: `com.alignedconnectingcouples.app`.
- **Signing & Capabilities:** Select your Apple Developer team; enable **Sign in with Apple** (you already use it on the web).
- **Display name / version:** Set the name and version you want on the store.
- **Icons:** Use a **1024×1024 px** app icon (App Store requirement). You have `public/aligned-icon.png` and similar; ensure one is 1024×1024 or export from your design.
- **Splash / launch screen:** Configure in Xcode or via Capacitor assets so the app doesn’t show a blank screen on launch.

---

## 4. Push notifications in the native app

The backend already supports **APNs**: when a partner taps **Notify**, the server sends to both web-push and native iOS device tokens.

- In **Apple Developer:** Create an APNs key (Keys → + → Apple Push Notifications), enable **Push Notifications** for your App ID, and set the env vars listed in `PUSH_SETUP.md` (APNS_TEAM_ID, APNS_KEY_ID, APNS_TOPIC, APNS_KEY_P8).
- In **Xcode:** Add the **Push Notifications** capability to the app target.
- In the **native app:** Use `@capacitor/push-notifications` to get the device token and send it to `POST /api/push/register-device` with body `{ "token": "<device-token>", "platform": "ios" }` (authenticated). See **PUSH_SETUP.md** for full steps.

---

## 5. Privacy (required by Apple)

- **Privacy manifest:** A template is in `apps/aligned/ios-privacy/PrivacyInfo.xcprivacy`. After running `npx cap add ios`, add this file to your Xcode app target (e.g. drag into the project and ensure “Add to targets: App”). It declares collected data (email, name, device ID for push) and no tracking.
- **App Store Connect privacy labels:** When you create the app in App Store Connect, you’ll answer questions about data collection (identifiers, usage data, etc.). Keep this consistent with your privacy policy and app behavior.
- **Privacy policy URL:** You need a public privacy policy; use it in App Store Connect and in the app (e.g. signup or settings).

---

## 6. App Store Connect

- In [App Store Connect](https://appstoreconnect.apple.com), create a **new app** (e.g. “Aligned”).
- Fill in:
  - **Name, subtitle, description, keywords**
  - **Category** (e.g. Lifestyle or Health & Fitness)
  - **Screenshots** (required sizes for iPhone and optionally iPad)
  - **Privacy policy URL**
  - **Support URL**
  - **Age rating** (questionnaire)
- You’ll also set **price** (e.g. free) and **availability**.

---

## 7. Build and upload

- In Xcode: **Product → Archive**.
- After the archive is created, **Distribute App** → **App Store Connect** → **Upload**.
- In App Store Connect, select the build, add it to a version (e.g. 1.0), then **Submit for Review**.

---

## 8. Things to double-check

- **Sign in with Apple:** You already have this on the web; the same backend works. Ensure the App ID in Apple Developer (and the native app’s Bundle ID) is the one configured in your Services ID / key (see `APPLE_SIGNIN_SETUP.md`).
- **Capacitor config:** `server.url` points at `https://alignedconnectingcouples.com`. The iOS app is a wrapper around that URL; no need to change this unless you switch to a bundled build.
- **Deep links / universal links:** If you want “Notify” links to open the native app instead of the browser, you’ll need to configure associated domains and handle the URLs in the app. Optional for v1.

---

## Summary order

1. Apple Developer account  
2. `npx cap add ios` and `npx cap sync ios`  
3. Configure signing, icon (1024×1024), and capabilities in Xcode  
4. Privacy manifest + privacy policy + App Store Connect labels  
5. (Optional) APNs for native push  
6. App Store Connect metadata and screenshots  
7. Archive → Upload → Submit for Review  

For detailed Capacitor/iOS steps, see [Capacitor iOS documentation](https://capacitorjs.com/docs/ios) and [Deploying to the App Store](https://capacitorjs.com/docs/ios/deploying-to-app-store).
