# Shipping Aligned to TestFlight (no Mac required)

The whole iOS build runs on GitHub's macOS runners. You never open Xcode.
Do the one-time setup below, then every release is: **Actions → iOS TestFlight →
Run workflow**, wait ~15 min, open TestFlight on your phone.

---

## One-time setup (~15 minutes, all in a browser)

### 1. Create an App Store Connect API key
1. Go to [App Store Connect → Users and Access → Integrations → App Store Connect API](https://appstoreconnect.apple.com/access/integrations/api).
2. Click **+**, name it `CI`, role **App Manager**, Generate.
3. Note the **Key ID** and the **Issuer ID** (shown at the top of the page).
4. **Download the `.p8` file** — you only get one chance. Keep it somewhere safe.

### 2. Create the app record
1. [App Store Connect → Apps → +](https://appstoreconnect.apple.com/apps) → New App.
2. Platform **iOS**, Bundle ID **`com.alignedconnectingcouples.app`**
   (already set in `capacitor.config.ts`), pick a name and SKU.
   - If the bundle ID isn't in the dropdown, register it first at
     [Certificates, IDs & Profiles → Identifiers](https://developer.apple.com/account/resources/identifiers/list).

### 3. Find your Team ID
It's the 10-character code at [developer.apple.com/account](https://developer.apple.com/account)
under Membership details (also the `APPLE_TEAM_ID` already in your Vercel env).

### 4. Enable Push Notifications on the App ID
1. [Certificates, IDs & Profiles → Identifiers](https://developer.apple.com/account/resources/identifiers/list) → click **`com.alignedconnectingcouples.app`**.
2. Check the **Push Notifications** capability box → Save.
   - This is separate from the APNs Auth Key (`APNS_KEY_ID`/`APNS_TEAM_ID`/`APNS_TOPIC`/`APNS_KEY_P8`,
     already in Vercel) — that key authorizes *your server* to talk to APNs; this
     checkbox authorizes *this specific app* to receive push at all. Both are needed.
   - If this app already has notification-relevant entries from earlier setup, this
     may already be checked — just confirm it before moving on.

### 5. Add four repo secrets
GitHub → the repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|--------|-------|
| `ASC_KEY_ID` | the Key ID from step 1 |
| `ASC_ISSUER_ID` | the Issuer ID from step 1 |
| `ASC_KEY_CONTENT` | the `.p8` file, **base64-encoded** (see below) |
| `APPLE_TEAM_ID` | your 10-char Team ID |

To base64 the key (Windows PowerShell):
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$HOME\Downloads\AuthKey_XXXXXX.p8"))
```
Paste the single-line output as `ASC_KEY_CONTENT`.

---

## Every release after that
- **Actions** tab → **iOS TestFlight** → **Run workflow** (or push a tag: `git tag ios-v1.0.1 && git push --tags`).
- The build number is the CI run number, so it always increases.
- When it finishes, the build appears in TestFlight (App Store Connect → your app → TestFlight)
  after Apple finishes processing (a few minutes). Install the TestFlight app on your
  iPhone to test.

## First-run notes (honest caveats)
This pipeline is authored without a Mac to test on, so the **first run may need one
tweak** — almost always one of:
- **Signing**: if automatic signing can't create the profile, the fix is adding
  `fastlane match` with a private certs repo. The Fastfile is structured so this is a
  small change, not a rewrite.
- **`npx cap sync ios` path**: if the Capacitor CLI isn't found from the repo root,
  prefix with the workspace: `npm --workspace aligned exec cap sync ios`.
- **Xcode version**: the workflow pins `Xcode_15.4`; if the runner image moves, bump
  that line to an available version (`ls /Applications | grep Xcode` in a runner step).

Build logs upload as an artifact on failure — read those first.

## Push notifications (native)
The website's existing notifications used Web Push (VAPID), which **does not work
inside the Capacitor app at all** — a WKWebView has no browser Push API. The native
app instead uses a real APNs device token:

- `@capacitor/push-notifications` registers the device and calls
  `POST /api/push/register-device-token`, stored in the `DeviceToken` table.
- `lib/apns.ts` sends via Apple's HTTP/2 API, signing its own short-lived ES256
  provider JWT with Node's `crypto` (no extra dependency) from the `APNS_KEY_P8` /
  `APNS_KEY_ID` / `APNS_TEAM_ID` / `APNS_TOPIC` env vars already in Vercel.
- `lib/push.ts`'s `sendPushToUser()` fans out to both Web Push and APNs — a couple
  can be mixed (one on the website, one in the app) transparently.
- Uses **production** APNs (`api.push.apple.com`), matching TestFlight/App Store
  distribution-signed builds. A debug build run directly from Xcode with a
  development profile would need `api.sandbox.push.apple.com` instead — not a path
  this project uses, since there's no local Mac in the loop.

**Windows gotcha:** if you ever run `npx cap sync ios` on this Windows machine, it
regenerates `ios/App/CapApp-SPM/Package.swift` with **backslash** paths
(`..\..\..\node_modules\...`), which Swift interprets as escape sequences (`\n` →
newline!) and won't compile. The CI workflow always re-runs `cap sync` fresh on the
macOS runner before building, so this only bites if you commit a Windows-synced
Package.swift without fixing the slashes first (or open the project directly in
Xcode without syncing on a Mac first).

## Android (for later)
No special hardware needed at all. `npm i @capacitor/android && npx cap add android`
generates the project on any OS; build a signed bundle in Android Studio (or add a
parallel CI job) and publish via Google Play Console ($25 one-time).

## The paid-subscription wrinkle
Apple/Google require **in-app purchase** for digital subscriptions sold *inside* the
native app — you can't run Stripe Checkout there. Plan: add **RevenueCat** (one SDK
unifying StoreKit + Play Billing + your existing Stripe web purchases) and read its
entitlement inside `lib/entitlements.ts` — the code already anticipates this cutover.
Web signups keep paying via Stripe at full margin.
