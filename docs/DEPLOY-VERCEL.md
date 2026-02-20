# Deploy North Star on Vercel

## 1. Connect GitHub

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub).
2. **Add New** → **Project**.
3. Import **justcallmefry/north-star** (or your fork). Use the repo that has the code you just pushed.
4. Leave **Framework Preset**: Next.js. **Root Directory** can stay empty unless you use a monorepo.
5. Do **not** deploy yet—add env vars first.

## 2. Production database

- Use a Postgres host that supports SSL (e.g. [Neon](https://neon.tech), Supabase, Railway).
- Create a database and copy the connection string.
- Run migrations against that DB once (from your machine or Neon’s SQL editor):

  ```bash
  DATABASE_URL="postgresql://..." npx prisma migrate deploy
  ```

  Or in Neon: run the SQL from `prisma/migrations/*/migration.sql` in order.

## 3. Environment variables (Vercel)

In the project: **Settings → Environment Variables**. Add these for **Production** (and optionally Preview):

| Name | Value | Notes |
|------|--------|------|
| `DATABASE_URL` | `postgresql://...` | Production Postgres URL (with `?sslmode=require` if needed). |
| `AUTH_SECRET` | (random string) | Generate: `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Replace with your Vercel URL after first deploy. |
| `NEXT_PUBLIC_APP_URL` | Same as `NEXTAUTH_URL` | Used for links in emails and app. |

Optional (for magic-link sign-in):

| Name | Value |
|------|--------|
| `RESEND_API_KEY` | Your Resend API key |
| `EMAIL_FROM` | e.g. `noreply@yourdomain.com` (see [RESEND-DOMAIN-SETUP.md](./RESEND-DOMAIN-SETUP.md)) |

Optional (if you add Stripe later):

- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`

After the first deploy, set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to the real URL (e.g. `https://north-star-xxx.vercel.app` or your custom domain), then redeploy.

## 4. Deploy

- Click **Deploy** (or push to `main`; Vercel will build and deploy).
- Build runs `postinstall` → `prisma generate`, so the Prisma client is up to date.
- If the build fails, check the build log; often it’s a missing env var or DB not reachable.

## 5. After deploy

- Open the deployed URL and test signup → pair → today’s question.
- If you use magic links, ensure `EMAIL_FROM` is on a [verified Resend domain](./RESEND-DOMAIN-SETUP.md) so links can be sent to any email.
