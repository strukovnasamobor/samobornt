import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      // Everything the app and the AR scenes need offline. Deliberately not
      // "**/*": that swept in the three full-resolution scans and made the
      // precache 192 MB, and a service worker whose install fails never
      // activates. The masters are still deployed and still served to desktop
      // browsers over the network, they are just not carried offline.
      includeAssets: [
        "icons/**/*",
        "images/**/*",
        "i18n/*.json",
        // html/js/css already arrive via the default globPatterns; listing
        // them here too would only duplicate every entry
        "ar/*/*.{png,webp}",
        "ar/*/*.opt.glb",
        "ar/kremsnita/kremsnita.glb",
        "ar/i_love_samobor/i_love_samobor.glb",
        // the list the iOS app prefetches its Quick Look models from
        "ar/usdz-manifest.json",
        // The .usdz copies are deliberately not listed: on iOS the native
        // QuickLook plugin keeps its own copies (the page cache is unreachable
        // from Quick Look), and they total ~80 MB that is useless to every
        // non-iOS user.
      ],
      // The AR scenes are real pages under /ar, not routes of this app. Without
      // the denylist the catch-all navigation fallback answers them with the app
      // shell, and the router, which has no route for /ar/:id/index.html, renders
      // PageNotFound. Listing lang and app alongside the two Workbox defaults,
      // which this option replaces rather than extends, lets the ?lang= and
      // &app= that ArViewer appends still match the precached scene, so AR
      // keeps working offline.
      workbox: {
        // the optimized scenes are 10-12 MB each, past the 2 MiB default
        maximumFileSizeToCacheInBytes: 16 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/ar\//],
        ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^lang$/, /^app$/],
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

