import "./Sights.css";
import PageLayout from "../components/PageLayout";
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCol,
  IonGrid,
  IonRow,
  IonText,
} from "@ionic/react";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { AppContext } from "../AppContext";
import CardsSearch from "../components/CardsSearch";
import Loading from "../components/Loading";
import localized from "../utils/localized";
import imageUrls from "../utils/imageUrls";

export default function Sights() {
  const { sights, sightsSearchInput } = useContext(AppContext);
  const { t, i18n } = useTranslation();

  if (sights === null) {
    return <Loading />;
  }

  const search = sightsSearchInput.trim().toLowerCase();
  const visibleSights = search
    ? sights.filter((sight) =>
        [sight.name, sight.title, sight.shortDescription, sight.longDescription]
          .map((field) => localized(field, i18n.language).toLowerCase())
          .some((text) => text.includes(search))
      )
    : sights;

  return (
    <PageLayout name="sights" center={true}>
      <IonGrid className="full-width">
        <IonRow>
          <IonCol size="12" size-lg="8" offset-lg="2">
            <CardsSearch />
          </IonCol>
        </IonRow>

        <IonRow>
          {visibleSights.map((sight) => {
            const name = localized(sight.name, i18n.language);
            const title = localized(sight.title, i18n.language);
            const [coverImage] = imageUrls(sight.imgUrl);

            return (
              <IonCol key={sight.id} size="12" size-md="6" size-xl="4">
                <IonCard className="sight-card" routerLink={"/sights/" + sight.id}>
                  {coverImage && <img src={coverImage} alt={name} />}
                  <IonCardHeader>
                    <IonCardTitle>{title}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>{localized(sight.shortDescription, i18n.language)}</IonCardContent>
                </IonCard>
              </IonCol>
            );
          })}
        </IonRow>

        {visibleSights.length === 0 && (
          <IonRow className="ion-text-center">
            <IonCol>
              <IonText>{search ? t("noResults") : t("noSights")}</IonText>
            </IonCol>
          </IonRow>
        )}
      </IonGrid>
    </PageLayout>
  );
}
