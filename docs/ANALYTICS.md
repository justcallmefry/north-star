# Analytics & usage tracking

Two ways we track how much people use the app:

1. **Vercel Web Analytics** — page views and Web Vitals (no code beyond what’s in the app).
2. **Usage stats from your database** — counts and DAU from existing tables, via an admin API.

---

## 1. Vercel Web Analytics

The app includes `@vercel/analytics` and renders `<Analytics />` in the root layout. So every page view and core Web Vitals are sent to Vercel when the app runs on Vercel.

**What you need to do:**

1. In the [Vercel dashboard](https://vercel.com), open your project.
2. Go to **Settings → Analytics** (or the **Analytics** tab).
3. Turn on **Web Analytics** for this project.
4. Redeploy if needed. After that, the **Analytics** tab will show:
   - Page views
   - Top pages
   - Web Vitals (LCP, FID, CLS, etc.)

**Notes:**

- No env vars required for basic analytics.
- Custom events (e.g. “Completed daily question”) are available on **Vercel Pro/Enterprise** via `track()` from `@vercel/analytics` or `@vercel/analytics/server`. On the free plan you get page views and Web Vitals only.
- If you prefer a different product (e.g. PostHog, Plausible), you can remove `<Analytics />` and add their script or SDK instead.

---

## 2. Usage stats from your database

We don’t store analytics in a separate system. We compute “how much people use the app” from existing data.

**Provided:**

- **`lib/usage.ts`** — `getUsageStats(forDate?)` returns for a UTC date:
  - `signups` — new users (User.createdAt that day)
  - `dailyResponses` — number of daily-question responses for that session date
  - `dailyReveals` — daily sessions where both partners answered (state = revealed)
  - `quizParticipations` — quiz answers for that date
  - `agreementParticipations` — agreement answers for that date
  - `activeUsers` — distinct users who did at least one of the above that day (DAU for that date)

- **`GET /api/admin/usage`** — returns the same stats as JSON. Secured by a secret.

**What you need to do:**

1. **Set a secret** (e.g. in Vercel env vars):
   ```bash
   USAGE_SECRET=some-long-random-string
   ```

2. **Call the API** when you want to see usage:
   ```bash
   # Today’s stats (UTC)
   curl -H "Authorization: Bearer YOUR_USAGE_SECRET" \
     "https://alignedconnectingcouples.com/api/admin/usage"

   # A specific date
   curl -H "Authorization: Bearer YOUR_USAGE_SECRET" \
     "https://alignedconnectingcouples.com/api/admin/usage?date=2026-02-20"
   ```

3. **Optional:** Run this from a cron (e.g. daily) and log the result, or build a small dashboard that calls this endpoint and displays the numbers.

**Example response:**

```json
{
  "date": "2026-02-21",
  "signups": 2,
  "dailyResponses": 14,
  "dailyReveals": 5,
  "quizParticipations": 8,
  "agreementParticipations": 6,
  "activeUsers": 12
}
```

If `USAGE_SECRET` is not set, the API returns 503 so you don’t accidentally expose it without configuration.

---

## Summary

| What you want                 | What to use                         |
|------------------------------|-------------------------------------|
| Page views, Web Vitals       | Vercel Analytics (enable in dashboard) |
| DAU, signups, feature usage  | `GET /api/admin/usage` + `USAGE_SECRET` |
| Custom events (e.g. “Clicked quiz”) | Vercel Pro `track()` or another analytics product |

No new database tables or background jobs are required for the usage stats; they are computed on demand from existing data.
