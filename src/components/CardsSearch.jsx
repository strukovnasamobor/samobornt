import { useContext } from "react";
import { IonSearchbar } from "@ionic/react";
import { useTranslation } from "react-i18next";
import { AppContext } from "../AppContext";

export default function CardsSearch() {
  const { sightsSearchInput, setSightsSearchInput } = useContext(AppContext);
  const { t } = useTranslation();

  return (
    <IonSearchbar
      debounce={300}
      value={sightsSearchInput}
      onIonInput={(e) => setSightsSearchInput(e.target.value ?? "")}
      placeholder={t("search")}
    />
  );
}
