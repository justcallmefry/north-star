# iOS Privacy Manifest

After you run `npx cap add ios`, add the privacy manifest to the iOS app:

**Option A – script (recommended)**

```bash
npm run ios:copy-privacy
```

This copies `PrivacyInfo.xcprivacy` into `ios/App/App/`. Then in Xcode:

1. Open the project: `npx cap open ios`
2. In the Project Navigator, right-click the **App** folder (under App)
3. **Add Files to "App"...** → select `ios/App/App/PrivacyInfo.xcprivacy`
4. Leave **Copy items if needed** unchecked, check **Add to targets: App**
5. Click Add

**Option B – manual**

1. Copy `ios-privacy/PrivacyInfo.xcprivacy` into `ios/App/App/`
2. In Xcode, add that file to the App target (Add Files to "App"... and ensure the App target is checked)

Apple requires this for App Store submission (required reason API and data collection disclosure).
