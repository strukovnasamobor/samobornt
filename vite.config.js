import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Vite 4 re-runs dep optimization when it discovers a bare import after the
  // initial scan. On Windows the re-run's rename of .vite/deps_temp_* onto an
  // existing .vite/deps fails with EPERM, leaving no deps dir at all and every
  // dep request 504ing. Listing the deps up front keeps it to a single pass.
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react-router",
      "react-router-dom",
      "react-i18next",
      "react-swipeable",
      "@ionic/react",
      "@ionic/react-router",
      "ionicons/icons",
      "i18next",
      "i18next-browser-languagedetector",
      "i18next-http-backend",
      "firebase/app",
      "firebase/app-check",
      "firebase/firestore",
      "swiper/react",
      "swiper/modules",
    ],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["**/*"],
      manifest: {
        id: "com.strukovnasamobor.samobornt",
        name: "Samobor N&T",
        short_name: "Samobor N&T",
        theme_color: "#760513",
        background_color: "#9e0020",
        display: "standalone",
        orientation: "portrait",
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
        drop_console: false, // Set to true in production
        drop_debugger: false, // Set to true in production
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
  },
});

