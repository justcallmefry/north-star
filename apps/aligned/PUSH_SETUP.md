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

## Flow

- User taps **Notify** → app asks for notification permission (if not yet granted) and subscribes to push → subscription is sent to `POST /api/push/subscribe` and stored by user.
- Same user taps **Notify** again → app calls `POST /api/push/notify-partner` with `relationshipId`, title, body, url → server looks up the partner's subscriptions and sends a push via web-push → partner's device shows the notification; tapping it opens the app at the given url.
