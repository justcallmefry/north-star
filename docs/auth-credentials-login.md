# Auth: Credentials Login & Session

## What was broken

- After signing in with **email + password**, the app redirected back to the login page (or showed "Not signed in" when loading app data).
- Login appeared to "not stick."

## Root cause (two parts)

### 1. Session strategy: database vs JWT

We had `session: { strategy: "database" }` in `lib/auth.ts`.

**Auth.js behavior:** The **Credentials** provider does **not** create a database session. It only ever writes a **JWT** into the session cookie. OAuth and magic-link flows can create DB sessions; credentials cannot.

So with `strategy: "database"`, the server tried to resolve the session by looking up the cookie value in the database. That value is a JWT, not a session token, so the lookup returned nothing → "not signed in" / redirect to login.

**Fix:** Use JWT for the session when you rely on credentials login:

```ts
session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
```

### 2. JWT puts user id in `token.sub`, not `session.user.id`

With JWT strategy, the decoded token has `sub` (the user id). The default session object may not expose that as `session.user.id`, but our app expects `session.user.id` everywhere (e.g. `lib/sessions.ts`, `lib/relationships.ts`).

**Fix:** Add a `session` callback so the app always has `session.user.id`:

```ts
callbacks: {
  session({ session, token }) {
    if (session.user) session.user.id = (token.sub as string) ?? session.user.id;
    return session;
  },
  // ... authorized, redirect
},
```

## If this happens again

1. **Login redirect loop or "Not signed in" right after credentials login**
   - Check `lib/auth.ts`: is `session.strategy` set to `"database"`? If you use **Credentials** (email/password), it must be `"jwt"`.
   - Confirm the **Credentials** provider is the one being used for that login (not magic link or OAuth).

2. **"Not signed in" or missing `session.user.id` in server code**
   - With JWT strategy, the id is in `token.sub`. Ensure the `session` callback in `lib/auth.ts` sets `session.user.id = token.sub` (or equivalent) so the rest of the app can use `session.user.id`.

## Why it was hard to find

- The failure looked like a **cookie/origin/redirect** issue (AUTH_URL, meta refresh, etc.), so we spent time there. The real bug was a **strategy mismatch**: credentials write a JWT, but the server was reading the session from the database.
- Auth.js doesn’t document prominently that Credentials **only** use JWT in the cookie and never create a DB session. So `strategy: "database"` with Credentials is a silent mismatch.
- The second bug (missing `session.user.id`) only showed up after the first was fixed, and was easy to fix once we knew JWT was in use and the id lived in `token.sub`.

## References

- `lib/auth.ts` – session strategy and session callback.
- Auth.js: Credentials provider stores a JWT in the cookie; no DB session is created for credentials.
