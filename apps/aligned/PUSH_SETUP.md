# Web Push (in-app notifications)

When a user taps **Notify** (daily question, quiz, alignment, or Our Week), the app first tries to send a **push notification** to their partner's device. If the partner has allowed notifications and the app has a push subscription, they get an in-app alert. Otherwise the app falls back to the system share sheet or SMS.

## 1. Generate VAPID keys

In `apps/aligned` (or anywhere with `web-push` installed):

```bash
npx web-push generate-vapid-keys
```

You'll get a public and private key. Keep the private key secret.

## 2. Environment variables

| Variable | Where | Description |
|----------|--------|-------------|
| `VAPID_PUBLIC_KEY` | Server (Vercel / .env.local) | Public key from step 1 |
| `VAPID_PRIVATE_KEY` | Server only (never in client) | Private key from step 1 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Server + client (Vercel / .env.local) | Same value as `VAPID_PUBLIC_KEY` (needed so the browser can subscribe) |

## 3. Database

A migration is included: `prisma/migrations/20260313000000_add_push_subscriptions/`. Apply it:

**Local:** `cd apps/aligned && npx prisma migrate deploy` (or `npx prisma db push`).

**Production (Vercel):** Run the migration once against your production DB, e.g. with `DATABASE_URL` set to your prod URL: `cd apps/aligned && npx prisma migrate deploy`.

## 4. Deploy

Set the three env vars in Vercel (and locally in `.env.local`), then deploy. Users who grant notification permission when they tap **Notify** will receive in-app push alerts; others still get Share/SMS.

## 5. Native app push (iOS App Store)

For the **native iOS app** (Capacitor), the server also sends via **APNs**. The same “Notify” flow delivers to both web subscriptions and native device tokens.

### 5.1 Apple Developer

1. In [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list) → **Keys** → **+**, create a key with **Apple Push Notifications service (APNs)** enabled. Download the `.p8` file once and note the **Key ID**.
2. In **Identifiers**, select your app (e.g. `com.alignedconnectingcouples.app`) and enable **Push Notifications**.
3. In Xcode, add the **Push Notifications** capability to the app target.

### 5.2 Server env (Vercel / .env.local)

| Variable | Description |
|----------|-------------|
| `APNS_TEAM_ID` | Your Apple Developer Team ID |
| `APNS_KEY_ID` | Key ID of the APNs key you created |
| `APNS_TOPIC` | Your app’s bundle ID (e.g. `com.alignedconnectingcouples.app`) |
| `APNS_KEY_P8` | Contents of the `.p8` file as one line; use `\n` for newlines |
| `APNS_SANDBOX` | Set to `true` only for development / TestFlight (use production for App Store) |

### 5.3 Register the device from the app

After the user signs in in the native app, request push permission, get the device token, and send it to your backend:

```bash
npm install @capacitor/push-notifications
npx cap sync ios
```

In your app (e.g. in a layout or after login), use the Capacitor Push Notifications API to request permission, get the token, and `POST` it to your API:

- **Request permission** and get the token (see [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)).
- **POST** to `https://alignedconnectingcouples.com/api/push/register-device` with body: `{ "token": "<device-token>", "platform": "ios" }`, with the same auth (session cookie or bearer token) as your web app.

The backend stores the token; when a partner taps **Notify**, the server sends to both web-push subscriptions and native iOS tokens.

### 5.4 Database

Run the migration that adds `NativePushToken`:

```bash
cd apps/aligned && npx prisma migrate deploy
```

(Migration: `20260314000000_add_native_push_tokens`.)

---

## Flow

- **Web:** User taps **Notify** → app asks for notification permission → subscription is sent to `POST /api/push/subscribe` and stored. Later, **Notify** calls `POST /api/push/notify-partner` → server sends via web-push and/or APNs.
- **Native app:** App registers the device token with `POST /api/push/register-device`. When a partner taps **Notify**, the server sends to that token via APNs as well as to any web subscriptions.
