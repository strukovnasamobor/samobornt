import { IonSelect, IonSelectOption } from "@ionic/react";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { AppContext, THEME_PREFERENCES } from "../AppContext";

const MODE_LABELS = {
  light: "light",
  dark: "dark",
  system: "system",
};

const SelectMode = () => {
  const { themePreference, setThemePreference } = useContext(AppContext);
  const { t } = useTranslation();

  return (
    <IonSelect
      label={t("appearance")}
      labelPlacement="floating"
      fill="outline"
      interface="alert"
      value={themePreference}
      // AppContext owns what follows from the choice: it puts the dark class on
      // the body, keeps "system" following the OS, and saves the preference
      onIonChange={(e) => setThemePreference(e.detail.value)}
    >
      {THEME_PREFERENCES.map((preference) => (
        <IonSelectOption key={preference} value={preference}>
          {t(MODE_LABELS[preference])}
        </IonSelectOption>
      ))}
    </IonSelect>
  );
};

export default SelectMode;
