import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/TypeScriptPartFinalCMPM121/', // The base path for your app

  build: {
    outDir: 'dist', // Build output directory
    rollupOptions: {
      input: './index.html' // Entry point for the build
    }
  },

  plugins: [
    VitePWA({
      manifest: {
        name: 'Phaser Game',
        short_name: 'Game',
        start_url: '/TypeScriptPartFinalCMPM121/index.html',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#4CAF50',
        icons: [
          {
            src: '/TypeScriptPartFinalCMPM121/assets/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/TypeScriptPartFinalCMPM121/assets/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 4000000, // Increased limit to 4 MiB
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              }
            }
          }
        ]
      }
    })
  ]
});
