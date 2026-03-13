# Step-by-step: Icons, DB migration, and APNs

Follow these in order. You already have an Apple Developer account.

---

## Part 1: Icons

### 1.1 Run npm install

From the **repo root** (North Star folder):

```bash
cd "c:\Users\cfry\Desktop\North Star"
npm install
```

If you see an **EPERM** error (e.g. Prisma `query_engine-windows.dll.node` rename failed):

- Close any other terminals or IDEs that might be using the project.
- Close Cursor, reopen the project, then run `npm install` again from the root.

To install only in the aligned app (if the monorepo root already ran):

```bash
cd "c:\Users\cfry\Desktop\North Star\apps\aligned"
npm install
```

### 1.2 Check icon size and add 1024×1024 if needed

1. **Check the current icon**
   - Open `apps/aligned/public/aligned-icon-1024.png` in an image viewer or design tool.
   - Check its dimensions (e.g. right‑click → Properties, or in Paint: Image → Attributes). If it’s already **1024×1024**, you’re done for the icon.

2. **If it’s not 1024×1024**, create a 1024×1024 version:
   - **Option A – Design tool (Figma, etc.):** Export your “Aligned Connecting Hearts” logo/icon at 1024×1024 px (PNG, no transparency issues for App Store).
   - **Option B – Image editor (Paint, Photoshop, GIMP, etc.):** Open your source art, resize the canvas/image to 1024×1024, then export as PNG.
   - **Option C – Online:** Use a site like [resizeimage.net](https://resizeimage.net) or similar: upload the image, set 1024×1024, download.

3. **Replace the file**
   - Save the new image as `aligned-icon-1024.png`.
   - Put it in `apps/aligned/public/` and overwrite the existing `aligned-icon-1024.png`.

4. **(Optional)** If you want the main PWA/icon to match, overwrite `apps/aligned/public/aligned-icon.png` with the same 1024×1024 (or a smaller version like 512×512) so the “Aligned” icon is consistent everywhere.

---

## Part 2: Database migration

The migration adds the `NativePushToken` table for native app push.

### 2.1 Local database

If you run the app locally with a local Postgres (or a local DB URL in `.env.local`):

```bash
cd "c:\Users\cfry\Desktop\North Star\apps\aligned"
npx prisma migrate deploy
```

This uses `DATABASE_URL` from your environment (e.g. `.env` or `.env.local`). If Prisma says “no migration pending”, the migration is already applied.

### 2.2 Production database (e.g. Vercel / hosted Postgres)

1. Get your **production** database URL (from Vercel env, Neon, Supabase, etc.). It’s the same `DATABASE_URL` you use for the deployed app.
2. In a terminal, set that URL and run the migration **once**:

   **PowerShell:**

   ```powershell
   cd "c:\Users\cfry\Desktop\North Star\apps\aligned"
   $env:DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
   npx prisma migrate deploy
   ```

   **Bash (Mac/Linux):**

   ```bash
   cd apps/aligned
   DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require" npx prisma migrate deploy
   ```

3. Replace the URL with your real production connection string. After it runs successfully, the production DB has the `NativePushToken` table. You don’t need to run this again unless you add new migrations.

---

## Part 2b: Steps 2, 3, 4 – Quick checklist

After redeploy (step 1), run these in order:

**Step 2 – Database migration**  
In `apps/aligned`, ensure `DATABASE_URL` is set (e.g. in `.env` or `.env.local`), then run:

```bash
cd apps/aligned
npx prisma migrate deploy
```

(Use production `DATABASE_URL` when applying to production; see Part 2 above.)

**Step 3 – iOS project and native push**  
From `apps/aligned` (after `npm install` succeeds):

```bash
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

In Xcode: select the **App** target → **Signing & Capabilities** → **+ Capability** → add **Push Notifications**.  
The app already includes code to register the device token with your server when the user opens the app in the native shell.

**Step 4 – Privacy manifest in iOS**  
From `apps/aligned` (after the `ios` folder exists):

```bash
npm run ios:copy-privacy
```

Then in Xcode: add `ios/App/App/PrivacyInfo.xcprivacy` to the App target (see `ios-privacy/README.md`).

---

## Part 3: APNs (Apple Push Notifications)

Do this when you’re ready to support push in the **native iOS app** (TestFlight or App Store).

### 3.1 Create an APNs key in Apple Developer

1. Go to [Apple Developer](https://developer.apple.com) → **Account** → **Certificates, Identifiers & Profiles** (or open [Keys](https://developer.apple.com/account/resources/authkeys/list)).
2. Click **Keys** in the sidebar → **+** (Create a key).
3. **Key Name:** e.g. `Aligned APNs`.
4. Enable **Apple Push Notifications service (APNs)**.
5. Click **Continue** → **Register**.
6. On the next screen, note:
   - **Key ID** (e.g. `2AB3CD4EF5`) → you’ll use this as `APNS_KEY_ID`.
7. Click **Download** to get the `.p8` file. You can only download it once; store it safely.
8. Note your **Team ID** (top right of the Apple Developer page, or in [Membership](https://developer.apple.com/account#MembershipDetailsCard)) → `APNS_TEAM_ID`.
9. Your app’s **Bundle ID** (e.g. `com.alignedconnectingcouples.app` from `capacitor.config.ts`) → `APNS_TOPIC`.

### 3.2 Enable Push Notifications for your App ID

1. In Apple Developer go to **Identifiers**.
2. Open your app’s **App ID** (same as the bundle ID, e.g. `com.alignedconnectingcouples.app`).
3. Under **Capabilities**, enable **Push Notifications**.
4. Save.

### 3.3 Turn the .p8 file into one line for env

You need the contents of the `.p8` file as a **single line**, with real newlines replaced by `\n`:

1. Open the downloaded `.p8` in a text editor (e.g. Notepad).
2. It looks like:
   ```
   -----BEGIN PRIVATE KEY-----
   MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
   ...
   -----END PRIVATE KEY-----
   ```
3. Make it one line: replace every actual newline with the two characters `\n`.  
   Example result:
   ```
   -----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...\n...\n-----END PRIVATE KEY-----
   ```
4. Use that entire string as the value of `APNS_KEY_P8` (in quotes if there are spaces).

### 3.4 Set variables in Vercel (production)

1. Open [Vercel](https://vercel.com) → your **Aligned** project → **Settings** → **Environment Variables**.
2. Add these for **Production** (and optionally Preview if you use it):

   | Name            | Value                                                                 | Notes                    |
   |-----------------|-----------------------------------------------------------------------|--------------------------|
   | `APNS_TEAM_ID`  | Your Apple Developer Team ID (e.g. `ABC12DEF3`)                       |                          |
   | `APNS_KEY_ID`   | The Key ID from the APNs key you created                              |                          |
   | `APNS_TOPIC`    | Your app’s bundle ID (e.g. `com.alignedconnectingcouples.app`)        | Must match Xcode         |
   | `APNS_KEY_P8`   | The one-line .p8 contents (with `\n` for newlines)                    | Secret; don’t commit     |

3. Optional: for **TestFlight / development** only, add:
   - `APNS_SANDBOX` = `true`  
   Use production (no `APNS_SANDBOX` or `APNS_SANDBOX` = `false`) for App Store builds.

4. Save and **redeploy** the app so the new env is used.

### 3.5 Set variables locally (.env.local)

In `apps/aligned/.env.local` (create the file if it doesn’t exist), add the same four (and optionally `APNS_SANDBOX` for local testing):

```env
APNS_TEAM_ID=YourTeamId
APNS_KEY_ID=YourKeyId
APNS_TOPIC=com.alignedconnectingcouples.app
APNS_KEY_P8="-----BEGIN PRIVATE KEY-----\nMIGT...\n-----END PRIVATE KEY-----"
```

Use the same one-line `.p8` value as in Vercel. If you test with a dev build, add:

```env
APNS_SANDBOX=true
```

---

## Quick checklist

- [ ] Run `npm install` from repo root (retry if EPERM after closing other apps).
- [ ] Check `aligned-icon-1024.png` size; if not 1024×1024, export and replace.
- [ ] Run `npx prisma migrate deploy` in `apps/aligned` for local and once for production with production `DATABASE_URL`.
- [ ] Create APNs key in Apple Developer, download `.p8`, note Key ID and Team ID.
- [ ] Enable Push Notifications for your App ID.
- [ ] Put `.p8` contents in one line with `\n` → set `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_TOPIC`, `APNS_KEY_P8` in Vercel and in `apps/aligned/.env.local`.

After this, when the native app registers the device token with `POST /api/push/register-device`, the server can send notifications via APNs when a partner taps **Notify**.
