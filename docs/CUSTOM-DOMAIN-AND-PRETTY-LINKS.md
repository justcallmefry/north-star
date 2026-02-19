# Custom domain and pretty link previews

So shared links (e.g. in texts) use a short, branded URL and show a nice icon and title in the preview.

## 1. Add a custom domain in Vercel

1. Open your project on [vercel.com](https://vercel.com) → **Settings** → **Domains**.
2. Add your domain (e.g. `usenorthstar.com` or `app.yourdomain.com`).
3. Follow Vercel’s instructions to add the DNS records they show (at your registrar: GoDaddy, Namecheap, Cloudflare, etc.).
4. Wait until the domain shows as verified.

## 2. Set the app URL in Vercel

1. In the same project: **Settings** → **Environment Variables**.
2. Add (or edit):
   - **Name:** `NEXT_PUBLIC_APP_URL`
   - **Value:** `https://your-domain.com` (no trailing slash), e.g. `https://usenorthstar.com`
3. Save and **redeploy** the project (Deployments → … → Redeploy).

## 3. What this does

- **Shared links**  
  “Notify them” and similar flows will use `NEXT_PUBLIC_APP_URL` when building the link, so your partner gets `https://your-domain.com/app/...` instead of the long Vercel URL.

- **Link previews (icon + title)**  
  The app is set up so that when `NEXT_PUBLIC_APP_URL` is set, link previews (e.g. in iMessage, Slack) use:
  - Your **North Star logo** as the icon
  - **Title:** “North Star”
  - **Description:** “One question a day. Answer together with your partner.”

Until the custom domain is live and the env var is set, shared links will still use the default Vercel URL; after that, they’ll use your domain and show the branded preview.
