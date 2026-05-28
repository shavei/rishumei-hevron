import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// Rishumei Hevron — Vite config. PWA via Workbox (vite-plugin-pwa).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      // We ship our own service worker logic for Web Push (Phase 11); injectManifest
      // lets Workbox precache the shell while our handlers own `push`/`notificationclick`.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: false, // manifest is authored by hand in public/manifest.webmanifest
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { port: 5173 },
});
