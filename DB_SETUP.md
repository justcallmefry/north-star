# Database setup (run once)

Pick **one** option so `npx prisma migrate dev` and `npx prisma db seed` can run.

## Option 1: Neon (recommended — no local services)

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the **connection string** (Prisma/standard Postgres URL; pooled or direct is fine).
3. In the project root, update `.env`:
   ```env
   DATABASE_URL="YOUR_NEON_CONNECTION_STRING"
   NEXTAUTH_URL="http://localhost:3001"
   AUTH_SECRET="(keep as is)"
   ```
   **Important:** `NEXTAUTH_URL` must match the port your dev server uses (e.g. `3001` if 3000 is in use), or auth callbacks break.
4. Run:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
   If `migrate dev` complains on Neon, use:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

### Then verify auth

- Go to `http://localhost:3001/login`, enter your email, click “Send link”.
- Use the magic link (inbox or dev console log if SMTP isn’t set).
- Confirm `http://localhost:3001/app` loads.

**Gotcha:** If you don’t have SMTP yet, use a dev catcher (e.g. Mailpit) or Resend so magic links are sent. DB must be running either way.

## Option 2: Local Docker Postgres

If Docker is installed:

```bash
docker run --name northstar-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=north_star -p 5432:5432 -d postgres:16
```

Then in `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/north_star?schema=public"
```

Then run:

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

---

After either option, the app can use the database and NextAuth (magic link) will work once `AUTH_SECRET` and email (e.g. `EMAIL_SERVER` / `EMAIL_FROM` or Resend) are set.
