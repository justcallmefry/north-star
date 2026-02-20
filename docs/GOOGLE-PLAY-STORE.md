# Publishing North Star to the Google Play Store

Google Play lets you publish your **web app** (the same Next.js app running on Vercel) as an Android app using **Trusted Web Activities (TWA)**. The “app” is a thin wrapper that opens your site in a full-screen Chrome view—no separate Android codebase.

---

## 1. Google Play Developer account

- **Cost:** **$25 one-time** (vs Apple’s $99/year).
- **Sign up:** [play.google.com/console](https://play.google.com/console).
- You’ll need: email, legal name/address, payment method (card; prepaid not accepted).
- New personal accounts may need to verify access to an Android device via the Play Console app.

---

## 2. PWA requirements (your site must qualify)

Your app is treated as a **Progressive Web App**. You need:

| Requirement | Status / action |
|-------------|------------------|
| **HTTPS** | ✅ Use your Vercel URL (e.g. `https://your-app.vercel.app`). |
| **Web App Manifest** | ✅ Served at `/manifest.json` (see `public/manifest.json`). Linked from the root layout. |
| **Icons** | Use at least 192×192 and 512×512 (you have `/north-star-logo.png`; ensure those sizes exist or add them). |
| **Start URL** | Typically `https://your-domain.com/` or `/welcome`. |

Optional but recommended:

- **Service worker** – Not required for TWA, but improves “Add to Home Screen” and offline behavior. Next.js can add this later (e.g. with `next-pwa` or similar).
- **Lighthouse PWA audit** – Run in Chrome DevTools and fix any critical issues before packaging.

---

## 3. Trusted Web Activity (TWA) wrapper

TWA is how a PWA gets into the Play Store: a small Android app that opens your URL in Chrome with no browser UI.

**Recommended tool: Bubblewrap**

1. **Prerequisites**
   - Node.js 10+
   - Java JDK 8 (or 11); `JAVA_HOME` set.
   - Your site live on HTTPS with the manifest and icons available.

2. **Install and init**
   ```bash
   npm install -g @bubblewrap/cli
   bubblewrap init --manifest=https://YOUR-DOMAIN.com/manifest.json
   ```
   Use your real production URL (e.g. Vercel). Bubblewrap will prompt for package name (e.g. `com.yourcompany.northstar`), app name, etc.

3. **Digital Asset Links**
   - Bubblewrap will tell you to host a file at:
     `https://YOUR-DOMAIN.com/.well-known/assetlinks.json`
   - This file proves you own the domain. Generate it with:
     ```bash
   bubblewrap fingerprint
     ```
   - Add the output to `assetlinks.json` (see [Google’s doc](https://developers.google.com/digital-asset-links/v1/getting-started)). You can add a route or static file in Next.js to serve `/.well-known/assetlinks.json`.

4. **Build**
   ```bash
   bubblewrap build
   ```
   This produces an **Android App Bundle** (`.aab`). Google Play **requires** the `.aab` format (not only APK).

5. **Upload**
   - In [Play Console](https://play.google.com/console) create a new app, then upload the generated `app-release-bundle.aab` under **Release** → **Production** (or testing track).

---

## 4. Store listing and policy (same idea as Apple)

- **App name, short description, full description** – Same positioning as on the web (e.g. “One question a day. Answer together with your partner.”).
- **Graphics** – Screenshots (phone/tablet), feature graphic (1024×500), app icon (512×512). Reuse your existing branding.
- **Privacy policy** – **Required.** Use your existing URL (e.g. `https://your-domain.com/privacy`). Play Console has a **Data safety** section; declare what data you collect (account, email, etc.) and how it’s used.
- **Content rating** – Complete the questionnaire (likely “Everyone” or “Teen” depending on content). No in-app purchases or ads → simpler.
- **Target audience** – Choose age groups and whether the app is for kids (North Star is likely “not for kids” / 13+).

---

## 5. Checklist summary

| Step | Action |
|------|--------|
| 1 | Pay $25 and create a Play Console developer account. |
| 2 | Add a **Web App Manifest** and serve it from your production URL; ensure 192×192 and 512×512 icons. |
| 3 | Serve **`/.well-known/assetlinks.json`** for TWA domain verification. |
| 4 | Install **Bubblewrap**, run `bubblewrap init --manifest=...`, then `bubblewrap build` to get the `.aab`. |
| 5 | In Play Console: create app, upload the `.aab`, fill store listing, privacy policy, Data safety, content rating. |
| 6 | Submit for review. |

---

## 6. Apple vs Google (quick comparison)

| | **Apple App Store** | **Google Play Store** |
|--|---------------------|------------------------|
| **Fee** | $99/year | $25 one-time |
| **How web app gets in** | Wrapper (e.g. Capacitor, or PWA “Add to Home Screen” only) or native shell that loads the URL | Trusted Web Activity (TWA) – official way to ship a PWA as an app |
| **Manifest** | Needed for “Add to Home Screen” and similar tooling | Required for TWA and PWA eligibility |
| **Privacy policy** | Required | Required + Data safety form |
| **Review** | Often stricter and slower | Typically faster; still need to follow policies |

Once the manifest and asset links are in place, the same Vercel deployment can power both the website and the Play Store app; you only repackage when you want to ship a new store version (e.g. after changing the app name or start URL in the manifest).
