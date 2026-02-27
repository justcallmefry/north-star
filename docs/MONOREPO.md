# Monorepo layout (Path B)

This repo is a **monorepo** with one shared package and three apps that reuse the same core.

## Structure

```
north-star/
  package.json              # Root: workspaces, scripts to run each app
  packages/
    shared/                 # @north-star/shared
      src/
        validation-constants.ts
        date-utils.ts       # todayUTC()
        index.ts
      dist/                 # Built output (run `npm run build -w @north-star/shared`)
  apps/
    aligned/                # Couples app (Aligned)
    parent-teen/            # Parent + teen app (placeholder branding)
    friends/                # Friends app (placeholder branding)
```

Each app has its own: `app/`, `components/`, `data/`, `lib/`, `prisma/`, `public/`, `scripts/`, and config. They depend on `@north-star/shared` for validation constants and date utilities. More shared code (e.g. UI components, auth helpers) can be moved into `packages/shared` over time.

## Commands (from repo root)

- **Build shared** (after clone or when you change shared):
  ```bash
  npm run build -w @north-star/shared
  ```
- **Run an app:**
  ```bash
  npm run dev:aligned
  npm run dev:parent-teen
  npm run dev:friends
  ```
- **Build an app:**
  ```bash
  npm run build:aligned
  npm run build:parent-teen
  npm run build:friends
  ```

Or from inside an app:
```bash
cd apps/aligned && npm run dev
```

## Per-app setup

- **Database:** Each app uses its own `DATABASE_URL` (in `.env` inside that app’s folder, or in Vercel project env).
- **Auth / domain:** Each app has its own `AUTH_URL`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` (and its own Vercel project if you deploy separately).
- **Content:** Each app has its own `data/quiz-days.json`, `data/agreement-days.json`, and prompt seed/update scripts. Replace with app-specific content (e.g. parent–teen questions, friends questions).
- **Branding:** Parent-teen and friends currently use placeholder names and copy. Do a find-replace for “Aligned” and update logo/favicon in `public/` when you’re ready to ship.

## Adding more shared code

To move more code into `packages/shared`:

1. Add the module under `packages/shared/src/` and export it from `src/index.ts`.
2. Run `npm run build -w @north-star/shared`.
3. In each app, replace the local import with `@north-star/shared`.

Keep Prisma and app-specific config (auth callbacks, env) in each app; share only pure utilities, constants, and UI that doesn’t depend on the database.

## Old root-level code

The original single-app code (root-level `app/`, `components/`, `lib/`, etc.) has been **copied** into `apps/aligned`. After you’ve verified that `npm run dev:aligned` and `npm run build:aligned` work, you can delete the duplicate folders at the repo root so the only app code lives under `apps/`. The root should then contain only: `package.json`, `packages/`, `apps/`, `docs/`, `.gitignore`, and any root-level config you keep (e.g. a single `.env.example` template).
