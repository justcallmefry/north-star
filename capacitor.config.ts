import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alignedconnectingcouples.app',
  appName: 'Aligned',
  webDir: 'public',
  server: {
    url: 'https://alignedconnectingcouples.com',
    cleartext: false,
    // Bundled fallback shown when the remote site can't load (offline,
    // DNS failure) — otherwise the app is a blank white screen in
    // airplane mode. Lives in webDir so `cap sync` copies it into the app.
    errorPath: 'offline.html',
  },
  // Lets the server distinguish the native app from the website. The app
  // must not expose the web Stripe purchase path (App Store Guideline
  // 3.1.1 requires in-app purchase for digital subscriptions), and the
  // app loads the same remote URL as the site, so a UA marker is the only
  // signal available server-side.
  appendUserAgent: 'AlignedNativeIOS',
};

export default config;
