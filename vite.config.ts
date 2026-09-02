import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Base relative pour un hébergement statique en sous-dossier (ex. GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Outils enquêtes XLSForm',
        short_name: 'XLSForm Outils',
        description:
          "Validation, génération et préparation de formulaires XLSForm / KoboToolbox, entièrement dans le navigateur.",
        theme_color: '#1e405a',
        background_color: '#f4f6f8',
        display: 'standalone',
        start_url: './',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
});
