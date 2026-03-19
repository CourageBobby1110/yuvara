import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yuvara.app',
  appName: 'yuvara',
  webDir: 'www',
  server: {
    url: 'https://yuvara.netlify.app',
    cleartext: true
  }
};

export default config;
