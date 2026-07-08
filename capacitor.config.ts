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
};

export default config;
