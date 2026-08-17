import "./App.css";
import { Redirect, Route } from "react-router-dom";
import {
  getConfig,
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
import SightDetails from "./pages/SightDetails";
import Settings from "./pages/Settings";
import PageNotFound from "./pages/PageNotFound";

export default function App() {
  const { t } = useTranslation();
  const config = getConfig();
  config.set("animated", false);

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/map" component={Map} />
        <Route exact path="/sights" component={Sights} />
        <Route exact path="/sights/:id" component={SightDetails} />
        <Route exact path="/settings" component={Settings} />
        <Route exact path="/">
          <Redirect to="/map" />
        </Route>
        <Route component={PageNotFound} />
      </IonRouterOutlet>
      {/*
        Each tab href must be a prefix of only its own routes: IonTabBar picks the
        active tab with the first `pathname.startsWith(href)` hit in child order,
        so a tab pointing at "/" would claim every route and end up remembering
        another tab's page. Hence "/map" plus the redirect above.
        Ionic drives the navigation from href — an extra onClick router.push here
        navigates a second time and corrupts the per-tab history.
      */}
      <IonTabBar slot="bottom">
        <IonTabButton tab="sights" href="/sights">
          <IonIcon icon={locationOutline} />
          <IonLabel>{t("tabs.sights")}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="map" href="/map">
          <IonIcon icon={navigateOutline} />
          <IonLabel>{t("tabs.map")}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="settings" href="/settings">
          <IonIcon icon={settingsOutline} />
          <IonLabel>{t("tabs.settings")}</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}
