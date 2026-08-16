import "./App.css";
import { AppContext } from "./AppContext";
import { useContext } from "react";
import { Route, useLocation } from "react-router-dom";
import {
  getConfig,
  useIonRouter,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonIcon,
  IonRouterOutlet,
} from "@ionic/react";
import { locationOutline, navigateOutline, settingsOutline } from "ionicons/icons";
import { useTranslation } from "react-i18next";

import Map from "./pages/Map";
import Sights from "./pages/Sights";
import Settings from "./pages/Settings";
import PageNotFound from "./pages/PageNotFound";

export default function App() {
  const router = useIonRouter();
  const { t } = useTranslation();
  const location = useLocation();
  const config = getConfig();
  config.set("animated", false);

  const normalizedPath = location.pathname.replace(/\/$/, "");
  let isActiveTabMap = normalizedPath === "" || normalizedPath === "/";
  let isActiveTabSights = normalizedPath.startsWith("/sights");
  let isActiveTabSettings = normalizedPath.startsWith("/settings");

  const handleMapTabClick = () => {
    router.push("/", "forward");
  };

  const handleSightsTabClick = () => {
    let currentParamId = "";
    if (location.pathname.startsWith("/sights")) {
      const searchParams = new URLSearchParams(location.search);
      currentParamId = searchParams.get("id");
    }

    let targetUrl = "/sights";
    router.push(targetUrl, "forward");
  };

  const handleSettingsTabClick = () => {
    router.push("/settings", "forward");
  };

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/" component={Map} />
        <Route exact path="/sights" component={Sights} />
        <Route exact path="/settings" component={Settings} />
        <Route component={PageNotFound} />
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        <IonTabButton tab="sights" selected={isActiveTabSights} onClick={handleSightsTabClick} href="/sights">
          <IonIcon icon={locationOutline} />
          <IonLabel>{t("tabs.sights")}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="map" selected={isActiveTabMap} onClick={handleMapTabClick} href="/">
          <IonIcon icon={navigateOutline} />
          <IonLabel>{t("tabs.map")}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="settings" selected={isActiveTabSettings} onClick={handleSettingsTabClick} href="/settings">
          <IonIcon icon={settingsOutline} />
          <IonLabel>{t("tabs.settings")}</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}
