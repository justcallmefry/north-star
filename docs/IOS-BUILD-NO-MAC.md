# Building the iOS app when you don’t have a Mac

The iOS app is a **Capacitor** shell that loads `https://alignedconnectingcouples.com` in a full-screen WebView. The repo already has:

- **Capacitor** and the **iOS platform** added
- **Bundle ID:** `com.alignedconnectingcouples.app`
- **Server URL:** `https://alignedconnectingcouples.com` (so the app uses your live site; no embedded build)

You **cannot** build, run, or archive an iOS app without **Xcode**, and Xcode only runs on **macOS**. So you need access to a Mac at some point to actually produce the `.ipa` and submit to App Store Connect.

---

## What you can do without a Mac (already done)

- **Add Capacitor and the iOS project** – Done in this repo. The `ios/` folder is the Xcode project.
- **Change the config** – Edit `capacitor.config.ts` (e.g. `server.url`, `appId`, `appName`). Then run `npx cap sync ios` so the `ios/` copy stays in sync.
- **Ship web changes** – Deploy to Vercel as usual; the iOS app will load the updated site because it points at the live URL.

---

## When you have access to a Mac

You need a Mac (your own, a friend’s, or a rented one) with:

- **Xcode** from the Mac App Store (free)
- **Node.js** and **npm** (e.g. from [nodejs.org](https://nodejs.org))
- This repo (clone from Git or copy the folder)

Then:

1. **Terminal on the Mac:**
   ```bash
   cd "/path/to/North Star"
   npm install
   npx cap sync ios
   npx cap open ios
   ```
2. **Xcode** will open the `ios/App/App.xcworkspace` (or the project). Pick a simulator or a connected iPhone and run (**Product → Run**).
3. **Test the app:** It should open your site (welcome, login, quiz, agreement, etc.). Fix any issues.
4. **When you’re ready to submit** (and you have your Apple Developer **Organization** account and D‑U‑N‑S):
   - In Xcode: **Product → Archive**
   - **Distribute App** → **App Store Connect** → upload the build
   - In App Store Connect, create the app (if needed), attach the build, and submit for review.

You do **not** need to run `cap init` or `cap add ios` again; that’s already done in the repo.

---

## Options if you don’t own a Mac

| Option | What it is | Use it for |
|--------|------------|------------|
| **Borrow / use a friend’s Mac** | Physical Mac for an afternoon or a few days | One-time: sync, open Xcode, test, archive, upload. |
| **Cloud Mac (Mac as a service)** | Rent a remote Mac by the hour or month | Same as above when you don’t have local access. Examples: [MacinCloud](https://www.macincloud.com/), [MacStadium](https://www.macstadium.com/), or AWS EC2 Mac instances. You RDP or VNC in and run Xcode there. |
| **CI/CD with a Mac runner** | e.g. GitHub Actions with `macos-latest`, or Codemagic | Can run `npx cap sync ios` and build/archive in the cloud. You still need to do the **first-time** Xcode setup (signing, capabilities) on a Mac; after that, some teams automate the archive and upload. |

---

## Summary

- **No Mac:** You can keep developing the web app and the Capacitor config; you just can’t build or run the iOS app or submit to the App Store until you have Mac + Xcode.
- **When you get Mac access:** Clone the repo, `npm install`, `npx cap sync ios`, `npx cap open ios`, then build and run in Xcode. Use the same steps to archive and upload when your Apple Developer Organization account is ready.
