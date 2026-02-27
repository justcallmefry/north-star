# Codebase health & backend notes

Quick reference for backend structure, cleanup done, and optional follow-ups.

## Done

- **Shared relationship helpers** — `requireActiveMember`, `todayUTC`, and `getActiveMemberIds` were duplicated across `lib/sessions.ts`, `lib/quiz.ts`, `lib/agreement.ts`, `lib/relationships.ts`, and `lib/meetings.ts`. They now live in `lib/relationship-members.ts` and are imported everywhere. Single place to fix bugs or change behavior.
- **Env example** — `.env.example` documents `CONTENT_REVIEW_EMAIL` and `CRON_SECRET` for the content-review cron.

## File sizes (current)

- **lib/sessions.ts** — ~500 lines. Handles daily session, responses, reveal, history, reflections, validation. One file is still manageable; optional split would be: core (getToday, submit, reveal) vs history vs reflections.
- **lib/quiz.ts** (~310), **lib/agreement.ts** (~300) — Fine as single files.
- **lib/email.ts** (~250), **lib/auth.ts** (~230), **lib/meetings.ts** (~210), **lib/relationships.ts** (~200) — All reasonable.
- **app/app/quiz/quiz-client.tsx** (~500), **app/app/agreement/agreement-client.tsx** (~540), **app/app/session/[id]/session-content.tsx** (~400) — Larger UI files but not excessive. Optional: extract “reveal” views into `quiz-reveal-view.tsx`, `agreement-reveal-view.tsx`, `session-reveal-view.tsx` if you want smaller components or reuse.

No file is egregiously large; parsing is in good shape.

## Things to check periodically

- **Auth** — All app routes that need a user rely on `getServerAuthSession()` and redirect or return null; relationship-scoped actions use `requireActiveMember`. No auth in Edge middleware (session is resolved server-side with DB adapter).
- **Errors** — Server actions throw; API route `/api/app/me` returns 401 with optional dev-only debug. No raw SQL; Prisma parameterization is used.
- **Cron** — `vercel.json` defines the content-review cron; protect the route with `CRON_SECRET` or Vercel’s cron auth if you enable it in production.
- **Duplicate routes** — `/auth/signin` redirects to `/login` on purpose (NextAuth default). No cleanup needed.

## Optional follow-ups

- Split **lib/sessions.ts** into e.g. `sessions.ts` (today/submit/reveal) + `sessions-history.ts` + `sessions-reflections.ts` only if you add more session-related features.
- Extract reveal UI from quiz/agreement/session client components into separate view components if you want smaller files or shared reveal layout.
- Add integration tests for `requireActiveMember` and `todayUTC` (e.g. in `lib/relationship-members.test.ts`) if you introduce more date- or membership-sensitive logic.

Overall the backend is in good shape: clear auth model, shared helpers, and consistent error handling.
