import "./Header.css";
import { IonHeader, IonButtons, IonButton, useIonRouter } from "@ionic/react";
import { useTranslation } from "react-i18next";

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
    </IonHeader>
  );
}