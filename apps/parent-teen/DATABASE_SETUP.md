# Database setup (Parent & Young Adult app)

The app needs a **Postgres** database. You create the database in Vercel, then create the tables with Prisma.

## 1. Create the database in Vercel

1. Open [Vercel Dashboard](https://vercel.com/dashboard) and select the **north-star-parent-teen** project.
2. Go to the **Storage** tab.
3. Click **Create Database** → choose **Postgres**.
4. Name it (e.g. `parent-teen-db`), pick a region, then **Create**.
5. In the database’s **Connect** tab, select your project (**north-star-parent-teen**) and connect it.  
   This adds the **`DATABASE_URL`** environment variable to the project.

## 2. Create the tables (schema)

After the database exists and `DATABASE_URL` is set (in Vercel or locally), run:

```bash
cd apps/parent-teen
npx prisma db push
```

- **From your machine:** Copy `DATABASE_URL` from Vercel (Project → Settings → Environment Variables), put it in `apps/parent-teen/.env`, then run the command above.
- Or use the Vercel Postgres **Connect** instructions; they often give a connection string you can paste into `.env` as `DATABASE_URL`.

After `db push` succeeds, the app can create users and store data. Redeploy the project if you added env vars after the last deploy.

## Local login (localhost)

If you see “There is a problem with the server configuration” when logging in locally, add to `apps/parent-teen/.env`:

- **AUTH_SECRET** – any random string (e.g. `openssl rand -base64 32`), or use the dev secret from `.env.example`.
- **NEXTAUTH_URL** – `http://localhost:3000` (or the port you use, e.g. `http://localhost:3001`).
- **AUTH_URL** – same as NEXTAUTH_URL for localhost.

Restart the dev server after changing `.env`.
