# Email setup (beta confirmation + magic link sign-in)

If the app says it sent an email but you don’t receive it, or you get stuck on the login page, check the following.

## 0. Stuck on login (preview URL / “couldn’t go further”)

If you opened a **preview** link (e.g. `…-chris-frys-projects-dcf37fe5.vercel.app`) and get stuck on `/login`:

1. **Use your main (production) URL** for sign-in. In Vercel, set:
   - **`NEXT_PUBLIC_APP_URL`** = your production URL, e.g. `https://north-star-hazel.vercel.app` (no trailing slash).
   - **`AUTH_URL`** = same value, e.g. `https://north-star-hazel.vercel.app`.
   Redeploy, then open **that** URL and sign in from there. The login page will show a “Sign in on main site” link when `NEXT_PUBLIC_APP_URL` is set.
2. Ensure **`AUTH_SECRET`** and **`DATABASE_URL`** are set in Vercel (for both Production and Preview if you use previews).
3. In the beta confirmation email we use `VERCEL_URL` for the link; for a stable link, set **`NEXT_PUBLIC_APP_URL`** so the email points to production.

## 1. Vercel environment variables

In your Vercel project: **Settings → Environment Variables**. Add:

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | **Required for sending.** Create an API key at [resend.com](https://resend.com) → API Keys. Use the key that starts with `re_`. |
| `EMAIL_FROM` | Optional. Sender address, e.g. `North Star <hello@yourdomain.com>`. If unset, Resend uses `onboarding@resend.dev`. |

Redeploy after changing env vars (or trigger a new deployment).

## 2. Resend: “From” address and domain

- **Using `onboarding@resend.dev` (default)**  
  Resend may only deliver to the email address of the Resend account owner when using this sender. If you’re testing with a different email, it might not arrive.

- **Sending to any address**  
  1. In Resend: **Domains** → add your domain (e.g. `yourdomain.com`).  
  2. Add the DNS records Resend shows (SPF, DKIM, etc.) at your DNS provider.  
  3. After the domain is verified, set in Vercel:  
     `EMAIL_FROM=North Star <hello@yourdomain.com>`  
     (or any address @yourdomain.com).  
  4. Redeploy.

## 3. Check Resend dashboard

In Resend: **Emails** (or **Logs**). You’ll see whether each send succeeded or failed and the reason (e.g. invalid from, domain not verified, bounce).

## 4. Spam and delays

- Check the recipient’s spam/junk folder.  
- Delivery can take a minute; refresh and wait a bit before assuming it failed.

## Summary

1. Set `RESEND_API_KEY` in Vercel (and redeploy).  
2. For reliable delivery to any email, verify a domain in Resend and set `EMAIL_FROM` to an address at that domain.  
3. Use the Resend dashboard to confirm sends and debug failures.
