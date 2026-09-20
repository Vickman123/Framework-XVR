import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  base: './',
  plugins: [
    basicSsl()
  ],
  server: {
    host: true, // Listen on all local IPs so Quest 3S can connect via WiFi
    port: 5173,
    https: true
  },
  build: {
    target: 'esnext'
  }
});
