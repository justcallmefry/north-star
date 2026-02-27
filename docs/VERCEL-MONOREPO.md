# Vercel: Deploying the Aligned app (monorepo)

The repo root is a **monorepo** (apps + packages). Deploy the **Aligned** app by pointing Vercel at `apps/aligned` and using the install/build below.

## Recommended: Root Directory = `apps/aligned`

In the Vercel project **Settings → General → Root Directory**:

1. Set **Root Directory** to **`apps/aligned`** (Edit → enter `apps/aligned` → Save).
2. **Build & Output Settings** (same page or Settings → General):
   - **Override Install Command:**  
     `cd ../.. && npm install`  
     (Installs from repo root so workspace deps like `@north-star/shared` are linked.)
   - **Override Build Command:**  
     `cd ../.. && npm run build -w @north-star/shared && npm run build:aligned`  
     (Builds shared package, then the aligned app.)
   - **Output Directory:** leave default **`.next`** (relative to `apps/aligned`).

3. **Environment variables:** Set them in Vercel as usual (e.g. `DATABASE_URL`, `AUTH_SECRET`, etc.). They apply to the `apps/aligned` app.

4. Redeploy.

## Why this is needed

- The **root** still has an old `app/` and `lib/` that expect `@/generated/prisma` and are not wired for the monorepo. Building from root causes "module not found" for the Prisma client.
- The **live app** is **`apps/aligned`**: it has its own Prisma schema, generates the client to `apps/aligned/generated/prisma`, and uses `@north-star/shared`. Building from `apps/aligned` (with install from root) fixes the error.

## Alternative: Root Directory = `.` (repo root)

If you prefer to keep Root Directory at the repo root:

- **Override Build Command:** `npm run build`  
  (Root `package.json` now has `"build": "npm run build -w @north-star/shared && npm run build:aligned"`.)
- **Output Directory:** `apps/aligned/.next`

You may still need to set **Root Directory** to `apps/aligned` so the runtime and serverless functions use the correct app; otherwise try the output directory override first and only switch Root to `apps/aligned` if the deployment fails.
