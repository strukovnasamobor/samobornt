import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { registerSW } from "virtual:pwa-register";

registerSW({
  onNeedRefresh() {
    // Silent update: just reload the app
    window.location.reload();
  },
  onOfflineReady() {
    // App is ready to work offline, no action needed
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)