import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rkeducation.app',
  appName: 'RK EDUCATION',
  webDir: 'out',
  server: {
    url: 'https://edtechpro-five.vercel.app',
    cleartext: true
  }
};

export default config;
