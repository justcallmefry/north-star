# Sign in with Apple – setup

Use this after you have an [Apple Developer](https://developer.apple.com) account. Once configured, users can sign in or create an account with Apple on the login and signup pages.

## 1. Create a Services ID (web client)

1. Go to [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list) → **Identifiers**.
2. Click **+** and choose **Services IDs** → Continue.
3. **Description:** e.g. `Aligned web`.
4. **Identifier:** e.g. `com.yourcompany.aligned` (this is your **Client ID** / `APPLE_ID`).
5. Enable **Sign in with Apple** and click **Configure**:
   - **Primary App ID:** pick your app (or create an App ID first, e.g. `com.yourcompany.aligned.app`).
   - **Domains and Subdomains:** `alignedconnectingcouples.com` (and `www.alignedconnectingcouples.com` if you use it).
   - **Return URLs:**  
     `https://alignedconnectingcouples.com/api/auth/callback/apple`  
     For local: `http://localhost:3000/api/auth/callback/apple`
6. Save, then register the identifier.

## 2. Create a Sign in with Apple key

1. Go to **Keys** → **+**.
2. **Key name:** e.g. `Aligned Sign in with Apple`.
3. Enable **Sign in with Apple** → **Configure** → select the same **Primary App ID** as above.
4. Register, then **Download** the `.p8` file (you can only download it once).
5. Note the **Key ID** shown on the page (`APPLE_KEY_ID`).

You also need your **Team ID** (top right in Apple Developer) and **Client ID** (the Services ID from step 1).

## 3. Environment variables

Set these **server-side** (e.g. in Vercel or `.env.local`; never commit the private key):

| Variable | Description |
|----------|-------------|
| `APPLE_ID` | Services ID (Client ID), e.g. `com.yourcompany.aligned` |
| `APPLE_TEAM_ID` | Your Apple Developer Team ID |
| `APPLE_KEY_ID` | The Key ID from the key you created |
| `APPLE_PRIVATE_KEY` | Contents of the `.p8` file. In `.env` use one line and replace real newlines with `\n`, e.g. `-----BEGIN PRIVATE KEY-----\nMIGT...\n-----END PRIVATE KEY-----` |

To show the “Sign in with Apple” button on login/signup, set:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APPLE_SIGNIN_ENABLED` | `true` |

## 4. Local testing

- Add `http://localhost:3000/api/auth/callback/apple` as a Return URL for your Services ID (you can add multiple).
- Use the same env vars in `.env.local` (with `APPLE_PRIVATE_KEY` as a single line with `\n`).

## 5. After deploy

- Ensure production Return URL is exactly:  
  `https://alignedconnectingcouples.com/api/auth/callback/apple`
- Set all env vars in your hosting dashboard and redeploy.
- Set `NEXT_PUBLIC_APPLE_SIGNIN_ENABLED=true` so the button appears.

## Troubleshooting

- **Invalid client:** Check `APPLE_ID` matches the Services ID and Return URL matches your site (no trailing slash).
- **Invalid secret / JWT:** Check `APPLE_TEAM_ID`, `APPLE_KEY_ID`, and `APPLE_PRIVATE_KEY`. For `APPLE_PRIVATE_KEY`, use a single line with `\n` for newlines; the code replaces `\\n` so escaped newlines in env are fine.
- **Redirect mismatch:** Return URL in Apple must match exactly (scheme, host, path). No query string in the configured Return URL.
