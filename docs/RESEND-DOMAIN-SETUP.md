# Sending magic links to other people (Resend domain setup)

With a **Resend** API key and the default sender `onboarding@resend.dev`, Resend only allows sending emails **to the account owner’s email** (the one on the Resend account). Any other address (e.g. your partner’s email) gets a **403** and the user sees “We couldn’t send the magic link.”

To send magic links to **anyone** (e.g. your wife, beta users), you need to:

1. **Verify a domain in Resend**
   - Go to [resend.com/domains](https://resend.com/domains).
   - Add a domain you own (e.g. `yourdomain.com` or a subdomain like `app.yourdomain.com`).
   - Add the DNS records Resend shows (SPF, DKIM, etc.) at your DNS provider.
   - Wait until the domain shows as **Verified**.

2. **Use a “from” address on that domain**
   - In Resend, create or note an address like `noreply@yourdomain.com` or `hello@yourdomain.com` using the verified domain.

3. **Set `EMAIL_FROM` in Vercel**
   - In your Vercel project: **Settings → Environment Variables**.
   - Add (or edit):  
     **Name:** `EMAIL_FROM`  
     **Value:** `noreply@yourdomain.com` (or whatever you set in Resend).
   - Redeploy so the new env var is used.

After that, magic links can be sent to any email address, not only the Resend account owner.
