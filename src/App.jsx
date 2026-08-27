import "./App.css";
import { Redirect, Route, useLocation } from "react-router-dom";
import {
  getConfig,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonIcon,
  IonRouterOutlet,
  useIonRouter,
} from "@ionic/react";
import { locationOutline, navigateOutline, settingsOutline } from "ionicons/icons";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import Map from "./pages/Map";
import Sights from "./pages/Sights";
import SightDetails from "./pages/SightDetails";
import ArViewer from "./pages/ArViewer";
import Settings from "./pages/Settings";
import PageNotFound from "./pages/PageNotFound";

export default function App() {
  const { t } = useTranslation();
  const router = useIonRouter();
  const config = getConfig();
  config.set("animated", false);

  // The AR viewer frames a scene that was designed as a standalone full-screen
  // page, so the tab bar makes way for it. Hidden with a class rather than by
  // unmounting: IonTabs expects its IonTabBar child to stay put.
  const arSceneOpen = useLocation().pathname.startsWith("/ar/");

  // Android's system back asks the page whether it can go back, because the
  // WebView cannot tell: moving between pages here pushes state rather than
  // loading documents, so the WebView's own history stays empty and its
  // canGoBack() is false even deep inside the app. Answering false is what lets
  // MainActivity hand the press back to the system and close the app.
  useEffect(() => {
    window.samobornt = {
      ...window.samobornt,
      goBack: () => {
        if (!router.canGoBack()) return false;
        router.goBack();
        return true;
      },
    };
  }, [router]);

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/map" component={Map} />
        <Route exact path="/sights" component={Sights} />
        <Route exact path="/sights/:id" component={SightDetails} />
        <Route exact path="/settings" component={Settings} />
        {/* Not a tab of its own: it fills the screen with a static AR page
            from public/ar, so no tab button points at it. */}
        <Route exact path="/ar/:id" component={ArViewer} />
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
      <IonTabBar slot="bottom" className={arSceneOpen ? "tab-bar-hidden" : undefined}>
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
