import "./Settings.css";
import PageLayout from "../components/PageLayout";
import {
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import { contrastOutline, moonOutline, sunnyOutline } from "ionicons/icons";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { AppContext } from "../AppContext";

// endonyms, so each option stays readable whichever language is active
const LANGUAGES = [
  { code: "hr", label: "Hrvatski" },
  { code: "en", label: "English" },
];

const THEMES = [
  { value: "light", icon: sunnyOutline, labelKey: "light" },
  { value: "dark", icon: moonOutline, labelKey: "dark" },
  { value: "system", icon: contrastOutline, labelKey: "system" },
];

export default function Settings() {
  const { themePreference, setThemePreference } = useContext(AppContext);
  const { t, i18n } = useTranslation();

  // resolvedLanguage strips the region ("en-US" -> "en") so it matches an option
  const language = i18n.resolvedLanguage ?? i18n.language;

  return (
    <PageLayout name="settings" center={false}>
      <IonList className="settings-list" lines="full">
        <IonListHeader>
          <IonLabel>{t("language")}</IonLabel>
        </IonListHeader>
        <IonItem>
          <IonSelect
            aria-label={t("changeLanguage")}
            value={language}
            interface="popover"
            onIonChange={(e) => i18n.changeLanguage(e.detail.value)}
          >
            {LANGUAGES.map(({ code, label }) => (
              <IonSelectOption key={code} value={code}>{label}</IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        <IonListHeader>
          <IonLabel>{t("appearance")}</IonLabel>
        </IonListHeader>
        <IonItem lines="none">
          <IonSegment
            className="settings-theme-segment"
            value={themePreference}
            onIonChange={(e) => setThemePreference(e.detail.value)}
          >
            {THEMES.map(({ value, icon, labelKey }) => (
              <IonSegmentButton key={value} value={value}>
                <IonIcon icon={icon} />
                <IonLabel>{t(labelKey)}</IonLabel>
              </IonSegmentButton>
            ))}
          </IonSegment>
        </IonItem>
      </IonList>
    </PageLayout>
  );
}
