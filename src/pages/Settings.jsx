import "./Settings.css";
import PageLayout from "../components/PageLayout";
import { IonButton, IonCol, IonGrid, IonIcon, IonModal, IonRow } from "@ionic/react";
import {
  documentTextOutline,
  globeOutline,
  informationCircleOutline,
  logoGithub,
  logoGooglePlaystore,
} from "ionicons/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import SelectLanguage from "../components/SelectLanguage";
import SelectMode from "../components/SelectMode";

// Where the app points outside itself. In a browser each opens a tab; in the
// Android app the WebView hands anything off-origin to the system browser,
// while the privacy policy, being the app's own domain, opens in place and the
// system back button returns from it.
const LINKS = [
  { key: "webapp", icon: globeOutline, url: "https://samobornt.web.app/" },
  {
    key: "googlePlay",
    icon: logoGooglePlaystore,
    url: "https://play.google.com/store/apps/details?id=com.strukovnasamobor.samobornt",
  },
  { key: "privacyPolicy", icon: documentTextOutline, url: "https://samobornt.web.app/privacy_policy.html" },
  { key: "source", icon: logoGithub, url: "https://github.com/strukovnasamobor/samobornt" },
];

export default function Settings() {
  const { t } = useTranslation();
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <PageLayout name="settings" center={false}>
      <IonGrid className="full-width">
        {/* No "center" on this row, unlike the two below. That class makes a row
            a column-flex container, where ion-col's own flex-basis:0/grow:1
            sizes its HEIGHT rather than its width: a column with no size prop
            collapses to nothing and its heading spills over the row beneath.
            The sized columns below are flex:0 0 auto, so they keep their height
            and only need centring. A plain row leaves the column full width,
            and the text is centred inside it. */}
        <IonRow className="ion-text-center">
          <IonCol>
            <h1>{t("navigation.settings")}</h1>
          </IonCol>
        </IonRow>
        <IonRow className="center">
          <IonCol size="12">
            <SelectLanguage />
          </IonCol>
        </IonRow>
        <IonRow className="center">
          <IonCol size="12">
            <SelectMode />
          </IonCol>
        </IonRow>
        <IonRow className="center">
          <IonCol size="12">
            <div className="settings-actions">
              {LINKS.map(({ key, icon, url }) => (
                <IonButton
                  key={key}
                  className="settings-action"
                  fill="outline"
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IonIcon slot="start" icon={icon} />
                  {t(key)}
                </IonButton>
              ))}

              <IonButton className="settings-action" fill="outline" onClick={() => setAboutOpen(true)}>
                <IonIcon slot="start" icon={informationCircleOutline} />
                {t("about.title")}
              </IonButton>
            </div>
          </IonCol>
        </IonRow>
      </IonGrid>

      {/* Deliberately no IonHeader or IonContent inside the modal: the app styles
          both globally for its own pages - a fixed header that hides above
          1200px, and a scroll area pushed 50px down to clear it - and neither
          belongs to a modal. A plain scrolling box avoids inheriting any of it. */}
      <IonModal className="settings-about-modal" isOpen={aboutOpen} onDidDismiss={() => setAboutOpen(false)}>
        <div className="settings-about">
          <h2>{t("about.title")}</h2>
          {/* The text carries its own markup, and comes from the app's own
              translation files rather than from anywhere a user can reach. */}
          <div dangerouslySetInnerHTML={{ __html: t("about.text") }} />
          <IonButton expand="block" fill="outline" onClick={() => setAboutOpen(false)}>
            {t("close")}
          </IonButton>
        </div>
      </IonModal>
    </PageLayout>
  );
}
