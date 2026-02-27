import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alignedconnectingcouples.app',
  appName: 'Aligned',
  webDir: 'public',
  server: {
    url: 'https://alignedconnectingcouples.com',
    cleartext: false,
  },
};

export default config;
