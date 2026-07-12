import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.edtechpro.app',
  appName: 'EdTechPro',
  webDir: 'public',
  server: {
    url: 'http://10.12.32.149:3000',
    cleartext: true
  }
};

export default config;
