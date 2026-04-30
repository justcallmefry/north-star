# App Store / Play Store privacy disclosures

Reference for filling out **App Privacy** in App Store Connect (the
"nutrition labels") and the **Data safety** form in Google Play Console.
This is what to declare based on the data the Aligned app actually
collects and uses, as of April 2026.

If you change what data is collected or how it's used, update this
document and re-submit the privacy disclosure in the relevant store.

---

## App Store Connect — App Privacy

### Data linked to user

These are stored against the user's account and identifiable.

| Data type | Used for | Notes |
|---|---|---|
| **Email address** | App functionality, account management | Required for sign-in and password reset. |
| **Name** | App functionality | Optional display name shown to partner. |
| **Photo (profile picture)** | App functionality | Optional, only the image the user selects. |
| **User content — Other user content** | App functionality | Daily answers, reactions, weekly meeting notes. Visible to the user's partner only after both have answered. |
| **Identifiers — User ID** | App functionality | Internal id used to scope content to the user. |
| **Diagnostics — Crash data, performance data** | App functionality, analytics | Standard Vercel/Next.js diagnostics; no third-party advertising SDKs. |

### Data NOT collected

Confirm "no" for these in App Store Connect:

- Health & fitness
- Financial info
- Location (precise or coarse)
- Sensitive info (race, religion, sexual orientation, etc.)
- Contacts
- Search history
- Browsing history
- Purchases (until StoreKit ships)
- Audio data — voice transcription is on-device; no audio leaves the
  device. *Declare microphone access required by Info.plist, but do
  NOT declare "Audio data" as collected.*
- Advertising data — none collected, none used.

### Tracking

**Used to track you across apps and websites:** No.
The app does not use IDFA or share data with third parties for advertising.

---

## Google Play — Data safety

Mirrors the App Store disclosures above. Google's form is structured
slightly differently:

- **Data collection:** Yes (email, name, profile photo, user content,
  user ID, crash data).
- **Data sharing with third parties:** No (service providers like
  hosting/email/database are not "third parties" under Google's definition
  if they only process on our behalf — confirm before submission).
- **Data encryption in transit:** Yes (HTTPS for all API requests;
  service worker enforces secure context for push subscriptions).
- **Data deletion:** Yes — link to in-app deletion at
  `Profile → Account & data → Delete my account`, plus instructions
  to email `privacy@northstar.app` (replace with real address).

---

## iOS Info.plist permission strings (live values)

These are checked at submission. Already wired in
`ios/App/App/Info.plist`:

- `NSMicrophoneUsageDescription` — voice answers
- `NSSpeechRecognitionUsageDescription` — speech-to-text transcription
- `NSPhotoLibraryUsageDescription` — profile picture from library
- `NSCameraUsageDescription` — profile picture from camera

If you add a new feature that touches a sensitive API (location,
contacts, calendar, HealthKit, etc.), add the matching `NS*UsageDescription`
key BEFORE submission or App Review will reject the build.

---

## In-app data rights (already shipped)

These map to the rights enumerated in the privacy policy:

- **Access / portability:** `Profile → Account & data → Download my data`
  emits a JSON file of the user's own content.
- **Deletion:** `Profile → Account & data → Delete my account` runs the
  soft-delete flow (anonymizes the user, hard-deletes auth and devices,
  cancels active subs, leaves jointly-authored content with the partner).
- **Correction:** `Profile → How you appear` to edit name/avatar.
- **Restrict processing / object:** Email `privacy@northstar.app`.

---

## Submission checklist

Before submitting to either store:

- [ ] Update the "privacy@northstar.app" address everywhere (privacy
      policy, this doc, Play Console, App Store Connect support URL).
- [ ] Confirm the Privacy Policy URL points to a live, public version
      (not behind auth). The URL goes in App Store Connect → App
      Information → Privacy Policy URL.
- [ ] Test the Account & data flow on a real device.
- [ ] Test microphone, photos, and camera permission prompts on a
      fresh-install build — make sure each prompt fires only when the
      relevant action is taken.
- [ ] Re-read the App Privacy answers in App Store Connect against this
      doc; mismatches between declared collection and actual code can
      get the app rejected or pulled later.
