import "./Header.css";
import { IonHeader, IonButtons, IonButton } from "@ionic/react";
import { Route } from 'react-router';
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useIonRouter } from "@ionic/react";

export default function Header() {
  const router = useIonRouter();
  const { t } = useTranslation();
  const location = useLocation();

  const handleMapNavClick = () => {
    router.push("/", "forward");
  };

  const handleSightsNavClick = () => {
    let currentParamId = "";
    if (location.pathname.startsWith("/sights")) {
      const searchParams = new URLSearchParams(location.search);
      currentParamId = searchParams.get("id");
    }

    let targetUrl = "/sights";
    router.push(targetUrl, "forward");
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
      <div className="header-title ion-hide-xl-up">SS VIEWER</div>
    </IonHeader>
  );
}