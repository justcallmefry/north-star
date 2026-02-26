# Publishing Aligned to the Apple App Store

Steps to get **Aligned: Connecting Couples** approved and listed on the App Store. The app is your existing Next.js web app (alignedconnectingcouples.com) wrapped in a native iOS shell so it can be distributed through the App Store.

---

## 1. Apple Developer Program

- **Cost:** **$99/year** (required to submit to the App Store).
- **Sign up:** [developer.apple.com/programs](https://developer.apple.com/programs/).
- You’ll need: Apple ID, legal entity (individual or organization), payment method, and to accept the license agreement.
- Approval can take 24–48 hours (sometimes longer for new accounts).

**Do this first** — you can’t create an app in App Store Connect without an active program membership.

---

## 2. Wrap the web app in a native shell (Capacitor)

Apple doesn’t accept “just a website.” You need a small native iOS app that loads your site. **Capacitor** is the standard way to do this with a Next.js/React app.

### 2a. Add Capacitor to the project

From the project root (after your Next.js app is built and deployed so the wrapper loads a live URL):

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Aligned" "com.alignedconnectingcouples.app"
```

- **App name:** e.g. `Aligned`
- **Bundle ID:** must be unique (e.g. `com.alignedconnectingcouples.app`). Use reverse-DNS style.

### 2b. Add the iOS platform

```bash
npm install @capacitor/ios
npx cap add ios
```

This creates an `ios/` folder with an Xcode project.

### 2c. Point the app at your production URL

Configure Capacitor so the iOS app loads `https://alignedconnectingcouples.com` instead of a local build. Options:

- **Option A – Server URL (simplest):** Set the start URL in Capacitor config to your production site. The “app” is then a full-screen web view of your site. No need to embed the Next.js build inside the app; you deploy updates by deploying to Vercel.
- **Option B – Embedded build:** Build the Next.js app as static (or export), copy into the native project, and load from the local bundle. More work; use if you need full offline or want to avoid depending on the network for first load.

For Option A you’ll set in `capacitor.config.ts` (or the config file you use) the URL the WebView opens (e.g. `https://alignedconnectingcouples.com`). Capacitor’s default is to load a local `index.html`; you can switch to a remote URL via a custom plugin or by using a start page that redirects to your URL. (Capacitor 6+ and community plugins support “server” mode / loading a remote URL.)

### 2d. Build and open in Xcode

**Requires a Mac with Xcode.** If you don't have a Mac, see [IOS-BUILD-NO-MAC.md](./IOS-BUILD-NO-MAC.md) for options (cloud Mac, borrow, etc.).

```bash
npx cap sync ios
npx cap open ios
```

In Xcode: select a real device or “Any iOS Device”, then **Product → Archive** when you’re ready to create a build for App Store Connect.

---

## 3. App Store Connect

- **URL:** [appstoreconnect.apple.com](https://appstoreconnect.apple.com).
- Sign in with the same Apple ID used for the Developer Program.

### 3a. Create the app

- **Apps** → **+** → **New App**.
- **Platform:** iOS.
- **Name:** e.g. **Aligned** (or “Aligned: Connecting Couples” if it fits).
- **Primary language**, **Bundle ID** (must match the one in your Xcode project, e.g. `com.alignedconnectingcouples.app`), **SKU** (e.g. `aligned-ios-1`).
- **User access:** Full access (unless you use a different model).

### 3b. Store listing (what users see)

- **Privacy Policy URL:** **Required.** Use your live policy, e.g. `https://alignedconnectingcouples.com/privacy`.
- **Category:** e.g. Lifestyle or Social Networking, depending on how you position it.
- **Subtitle** (optional) and **Description:** e.g. “One question a day. Answer together with your partner.” and a short paragraph on benefits.
- **Keywords:** For search (e.g. couples, relationship, daily question, partner).
- **Support URL:** e.g. `https://alignedconnectingcouples.com` or a dedicated support/contact page.
- **Marketing URL** (optional).

### 3c. Screenshots and media

- **iPhone 6.7"** (e.g. iPhone 15 Pro Max) and **6.5"** (e.g. iPhone 14 Plus) – required if you support those sizes.
- **iPhone 5.5"** (optional but good for older devices).
- You can reuse the same screenshots across sizes in many cases; check the current App Store Connect requirements.
- **App icon:** 1024×1024 px (no transparency). You already have branding; export at 1024×1024 from your design or use `/aligned-icon.png` if it’s high enough resolution.

### 3d. App Privacy

- **App Store Connect → Your app → App Privacy.**
- Declare what data you collect (e.g. email, name, usage). Match what your privacy policy says.
- “Sign in with Apple” is required if you offer any other third-party sign-in (e.g. Google, email magic link). You can add “Sign in with Apple” as an option in your app and in App Store Connect.

### 3e. Age rating and compliance

- Complete the **Age Rating** questionnaire (content, ads, etc.). For a couples/relationship app with no ads or in-app purchases, it’s usually straightforward.
- **Export compliance:** Typically “No” for encryption if you’re only using HTTPS (standard).
- **Advertising Identifier (IDFA):** “No” if you don’t use it.

---

## 4. Build and upload (Xcode → App Store Connect)

1. In Xcode: **Product → Archive** (with a real device or “Any iOS Device” selected, not Simulator).
2. When the archive is done, **Window → Organizer** → select the archive → **Distribute App**.
3. Choose **App Store Connect** → **Upload**.
4. Follow the prompts (signing, options). Xcode will upload the build to App Store Connect.

After processing (often 10–30 minutes), the build appears under **TestFlight** and under the app’s **App Store** tab for selection in a version.

---

## 5. Submit for review

1. In App Store Connect, open your app → **App Store** tab.
2. Create a **new version** (e.g. 1.0) if you haven’t already.
3. Fill in **What’s New in This Version** (e.g. “Initial release.”).
4. Select the build you uploaded.
5. Answer any remaining questions (e.g. content rights, encryption).
6. Click **Submit for Review**.

Review often takes **24–48 hours** (sometimes longer). Apple may ask for a **demo account** if sign-in is required; have a test account and password ready to provide in Resolution Center if they ask.

---

## 6. Checklist summary

| Step | Action |
|------|--------|
| 1 | Enroll in **Apple Developer Program** ($99/year). |
| 2 | Add **Capacitor** to the project and create the **iOS** app; point it at `https://alignedconnectingcouples.com` (or your chosen URL). |
| 3 | In **App Store Connect**, create the app (Bundle ID, name, language). |
| 4 | Add **store listing**: privacy policy URL, description, keywords, support URL, category. |
| 5 | Add **screenshots** and **1024×1024 app icon**. |
| 6 | Complete **App Privacy** and **Age Rating**. |
| 7 | In Xcode: **Archive** → **Distribute** → **Upload** to App Store Connect. |
| 8 | In App Store Connect: create version, select build, **Submit for Review**. |
| 9 | Have a **test account** ready in case Apple asks for one. |

---

## 7. After approval

- **Updates:** For content/UI/feature changes that only affect the website (e.g. copy, new screens, new flows), you usually **don’t** need a new App Store submission — just deploy to Vercel. You only need a new build and review when you change native code, Capacitor config, or app metadata (e.g. name, privacy policy URL).
- **Push notifications:** If you add push later (e.g. “Your partner answered”), you’ll need to enable push in the iOS project, in the Developer account (certificates/keys), and in App Store Connect, and then ship a new build. Until then, in-app or email notifications are fine.
- **“Sign in with Apple”:** If you offer any third-party sign-in (Google, magic link, etc.), Apple requires also offering “Sign in with Apple” for the same flow. Plan to add it if you haven’t already.

---

## 8. Useful links

- [Apple Developer Program](https://developer.apple.com/programs/)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Capacitor – iOS](https://capacitorjs.com/docs/ios)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines (for iOS)](https://developer.apple.com/design/human-interface-guidelines/)
