import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AppContextProvider } from "./AppContext";
import "./i18n";
import { IonApp } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { startPrecacheStatusTracking } from "./utils/precacheStatus";
import OfflineToast from "./components/OfflineToast";

import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

import "./theme/variables.css";

import { setupIonicReact } from "@ionic/react";
setupIonicReact({
  mode: "md", // forces Material Design everywhere
});

// registerType is "autoUpdate", so the plugin reloads the page itself once an
// updated worker activates and onNeedRefresh is never called. All this adds is
// the first-install progress the toast below reads.
startPrecacheStatusTracking();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppContextProvider>
      <IonApp>
        <IonReactRouter>
          <App />
        </IonReactRouter>
        {/* Outside IonTabs, which accepts only IonRouterOutlet and IonTabBar as
            children, and whose ion-tabs element carries contain: layout - that
            makes it the containing block for fixed positioning, so the toast
            would be measured against the tabs rather than the viewport. */}
        <OfflineToast />
      </IonApp>
    </AppContextProvider>
  </StrictMode>,
);