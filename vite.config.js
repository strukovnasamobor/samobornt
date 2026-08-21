import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["**/*"],
      // The AR scenes are real pages under /ar, not routes of this app. Without
      // the denylist the catch-all navigation fallback answers them with the app
      // shell, and the router, which has no route for /ar/:id/index.html, renders
      // PageNotFound. Listing lang alongside the two Workbox defaults, which this
      // option replaces rather than extends, lets the ?lang= that ArViewer appends
      // still match the precached scene, so AR keeps working offline.
      workbox: {
        navigateFallbackDenylist: [/^\/ar\//],
        ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^lang$/],
      },
      manifest: {
        id: "com.strukovnasamobor.samobornt",
        name: "Samobor N&T",
        short_name: "Samobor N&T",
        theme_color: "#760513",
        background_color: "#9e0020",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Set to true in production
        drop_debugger: true, // Set to true in production
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
  },
});

