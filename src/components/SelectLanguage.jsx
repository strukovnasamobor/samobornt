import { IonSelect, IonSelectOption } from "@ionic/react";
import { useTranslation } from "react-i18next";

// endonyms, so each option stays readable whichever language is active
const LANGUAGES = [
  { code: "hr", label: "Hrvatski" },
  { code: "en", label: "English" },
];

const SelectLanguage = () => {
  const { t, i18n } = useTranslation();

  // resolvedLanguage is the supported code i18next settled on ("en"/"hr"),
  // rather than the region-tagged value the detector may have reported
  const language = i18n.resolvedLanguage ?? i18n.language;

  return (
    <IonSelect
      label={t("language")}
      labelPlacement="floating"
      fill="outline"
      interface="alert"
      value={language}
      // i18next writes the choice to localStorage itself (detection.caches), so
      // there is nothing to persist here
      onIonChange={(e) => i18n.changeLanguage(e.detail.value)}
    >
      {LANGUAGES.map(({ code, label }) => (
        <IonSelectOption key={code} value={code}>{label}</IonSelectOption>
      ))}
    </IonSelect>
  );
};

export default SelectLanguage;
