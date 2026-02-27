# Reusing this codebase for similar apps (e.g. parent–teen)

**This repo is already set up as a monorepo (Path B).** See **[docs/MONOREPO.md](./MONOREPO.md)** for structure, commands, and per-app setup. The rest of this doc describes the strategy.

---

You want to spin up new apps (e.g. parent + teenager) that are very similar to Aligned: same “two people, one relationship, daily question + quiz + agreement” model, with different branding and content. Two ways to do it:

---

## Path A: Copy repo and customize (fastest to first ship)

**Idea:** Duplicate this repo into a new folder (or new repo). Rebrand (name, logo, copy) and swap content (prompts, quiz, agreement). You get a second app in days, not months.

**Steps:**

1. Copy the whole project to a new folder (e.g. `ParentTeen` or `Connected`). Don’t use the same repo if you want separate deploys/domains.
2. Find-and-replace / manual edits:
   - App name: “Aligned” → your new name everywhere (layout metadata, welcome, nav, `public/` assets).
   - Domain: `alignedconnectingcouples.com` → your new domain in env and any hardcoded links.
   - Copy: welcome hero, taglines, login/signup, marketing pages (privacy/terms can stay generic or be updated).
3. Replace **content only** (no structural changes):
   - `data/quiz-days.json` — new questions for parent–teen.
   - `data/agreement-days.json` — new statements.
   - Prompts (DB): update `prisma/seed.ts` and/or `prisma/update-daily-prompts.ts` and reseed.
4. New database: new `DATABASE_URL`, new Vercel project (or new project in same Vercel team), new Auth URL/domain.
5. Optional: small feature tweaks (e.g. rename “Meeting” to “Weekly check-in”, hide or show a section). Same code, different copy and content.

**Pros:** Fast. No refactor.  
**Cons:** Two codebases. Bug fixes and features you do in Aligned have to be manually applied to the new app (or you later move to Path B).

---

## Path B: Monorepo with shared code (best for 3+ similar apps)

**Idea:** One repo, multiple apps that share a common “core” package. First app stays as-is (moved into the monorepo); second app is “new app from template” and reuses almost everything.

**Target structure:**

```
repo-root/
  package.json          # workspaces: "apps/*", "packages/*"
  apps/
    aligned/             # current codebase (moved here)
      app/
      lib/               # app-specific only; rest from shared
      data/
      prisma/
      public/
      package.json        # name: "aligned", depends on @repo/shared
    parent-teen/         # new app (clone of aligned, then customize)
      app/
      lib/
      data/              # different quiz/agreement/prompts
      prisma/            # same schema or copy; can share schema
      public/            # different logo, name
      package.json       # name: "parent-teen", depends on @repo/shared
  packages/
    shared/              # shared UI, lib, types, Tailwind base
      components/
      lib/
      tailwind.base.js
      package.json       # name: @repo/shared
```

**What goes in `packages/shared`:**

- **Components:** Buttons, cards, form inputs, layout primitives, nav shell (brand name/logo can be passed as props or env).
- **Lib:** Auth helpers, `relationship-members` (requireActiveMember, todayUTC, getActiveMemberIds), validation constants, email sending pattern, maybe a thin auth config factory.
- **Types:** Shared TypeScript types used by both apps.
- **Tailwind:** Base config (colors, fonts) that both apps extend.

**What stays in each app:**

- **App name, domain, copy:** All visible text and metadata (each app has its own `app/layout.tsx` metadata, welcome, marketing).
- **Content:** `data/quiz-days.json`, `data/agreement-days.json`, prompt seed/update scripts (each app has its own).
- **Prisma:** Either one shared schema in `packages/shared` with each app using its own `DATABASE_URL`, or each app has its own `prisma/` so schemas can diverge (e.g. Aligned has subscriptions, parent-teen might not).
- **Routes/pages:** Structure can be identical; only copy and which sections you show differ (e.g. “Meeting” vs “Check-in”).

**Rough migration steps:**

1. Create repo root `package.json` with npm/pnpm workspaces: `"apps/*", "packages/*"`.
2. Create `packages/shared` with a minimal `package.json` and export a few shared utilities (e.g. `relationship-members`, `validation-constants`). No need to move everything at once.
3. Move current project into `apps/aligned` (move `app`, `lib`, `components`, `data`, `prisma`, `public`, `scripts`, etc.). Fix imports in `apps/aligned` to use `@repo/shared` for the pieces you moved.
4. Add `apps/parent-teen` by copying `apps/aligned` and then:
   - Change app name and branding.
   - Point to `@repo/shared`.
   - Replace `data/` content and any app-specific copy.
   - New DB and env for the new app.

**Pros:** One place to fix bugs and add features; new apps are “copy app + new content + new brand.”  
**Cons:** Upfront refactor (moving code into shared and fixing imports). Worth it once you have two apps and plan a third.

---

## Recommendation

- **If you only have “Aligned” and “parent–teen” for now:** Path A is fine. Copy the repo, rebrand, swap content, ship. You’ll still save a lot of time. If you later add a third similar app, consider moving to Path B.
- **If you already know you’ll do several variants (e.g. couples, parent–teen, best friends):** Start with Path B so the second and third apps are mostly “new content + new brand” and shared improvements benefit everyone.

---

## Content checklist for a parent–teen app (Path A or B)

- [ ] New app name and domain.
- [ ] New logo and favicon (`public/`).
- [ ] Welcome/marketing copy (e.g. “One question a day. You and your teen.”).
- [ ] `data/quiz-days.json`: questions appropriate for parent–teen (communication, boundaries, interests, feelings, not romantic).
- [ ] `data/agreement-days.json`: statements for parent–teen alignment.
- [ ] Daily prompts (DB): reseed or new script with parent–teen prompts.
- [ ] Optional: rename “Partner” → “Teen” (or “Parent”) in UI; rename “Meeting” to “Weekly check-in” or similar.
- [ ] New Vercel project + env (DATABASE_URL, AUTH_URL, etc.) and new DB.

The schema (User, Relationship, RelationshipMember, DailySession, Response, QuizSession, AgreementSession, etc.) can stay the same: “relationship” = one parent + one teen, same flow.
