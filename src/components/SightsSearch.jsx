import { useContext } from "react";
import { IonSearchbar, useIonRouter } from "@ionic/react";
import { useTranslation } from "react-i18next";
import { AppContext } from "../AppContext";

export default function SightsSearch() {
  const { sightsSearchInput, setSightsSearchInput } = useContext(AppContext);
  const { t } = useTranslation();
  const router = useIonRouter();

  const handleSearchInput = (e) => {
    setSightsSearchInput(e.target.value ?? "");
  };

  // the header search also shows on a sight's detail page, where there is
  // nothing to filter — clicking it returns to the list the results land in
  const handleSearchClick = () => {
    if (router.routeInfo?.pathname !== "/sights") {
      router.push("/sights", "back");
    }
  };

  return (
    <IonSearchbar
      debounce={500}
      onIonInput={handleSearchInput}
      onClick={handleSearchClick}
      value={sightsSearchInput}
      placeholder={t("searchSights")}
    />
  );
}
