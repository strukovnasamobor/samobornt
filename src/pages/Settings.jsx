import "./Settings.css";
import PageLayout from "../components/PageLayout";
import { IonCol, IonGrid, IonRow } from "@ionic/react";
import { useTranslation } from "react-i18next";
import SelectLanguage from "../components/SelectLanguage";
import SelectMode from "../components/SelectMode";

export default function Settings() {
  const { t } = useTranslation();

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
            <h1>{t("tabs.settings")}</h1>
          </IonCol>
        </IonRow>
        <IonRow className="center">
          <IonCol size="12" size-lg="6">
            <SelectLanguage />
          </IonCol>
        </IonRow>
        <IonRow className="center">
          <IonCol size="12" size-lg="6">
            <SelectMode />
          </IonCol>
        </IonRow>
      </IonGrid>
    </PageLayout>
  );
}
