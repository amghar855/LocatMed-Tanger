import type { CapacitorConfig } from '@capacitor/cli';

const webDir = process.env.CAP_WEB_DIR ?? 'out';

const config: CapacitorConfig = {
  appId: 'com.locatomed.app',
  appName: 'LOCATOMED',
  webDir,
  // Uncomment server block for local-server mode (dynamic/SSR fallback).
  // server: {
  //   // Replace with your computer LAN IP running `npm run dev:host`.
  //   url: 'http://192.168.x.x:3000',
  //   cleartext: true,
  // },
};

export default config;
