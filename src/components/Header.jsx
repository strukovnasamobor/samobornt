import "./Header.css";
import { IonHeader, IonButtons, IonButton, useIonRouter } from "@ionic/react";
import { Route, Switch } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SightsSearch from './SightsSearch';

export default function Header() {
  const router = useIonRouter();
  const { t } = useTranslation();

  const handleMapNavClick = () => {
    router.push("/map", "forward");
  };

  const handleSightsNavClick = () => {
    router.push("/sights", "forward");
  };

  const handleSettingsNavClick = () => {
    router.push("/settings", "forward");
  };

  return (
    <IonHeader>
      <div className="header-navigation ion-hide-xl-down">
        <IonButtons>
          <IonButton expand="full" fill="clear" onClick={handleMapNavClick}>
            {t("navigation.map")}
          </IonButton>
          <IonButton expand="full" fill="clear" onClick={handleSightsNavClick}>
            {t("navigation.sights")}
          </IonButton>
          <IonButton expand="full" fill="clear" onClick={handleSettingsNavClick}>
            {t("navigation.settings")}
          </IonButton>
        </IonButtons>
      </div>
      <div className="header-title ion-hide-xl-up">SAMOBOR N&T</div>
      <div className="header-icons">
        <Switch>
          <Route exact path={["/sights", "/sights/:id"]}>
            <div className="header-search">
              <SightsSearch/>
            </div>
          </Route>
        </Switch>
      </div>
    </IonHeader>
  );
}