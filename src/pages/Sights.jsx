import "./Sights.css";
import PageLayout from "../components/PageLayout";
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonGrid,
  IonRow,
  IonText,
} from "@ionic/react";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { AppContext } from "../AppContext";
import Loading from "../components/Loading";
import localized from "../utils/localized";
import imageUrls from "../utils/imageUrls";

// The gallery arrows sit inside the card, which is itself a router link. Ionic
// binds routerLink as a React onClick on ion-card, and React runs handlers from
// the target upwards, so stopping propagation here keeps an arrow tap on the
// gallery instead of opening the sight. Taps on the photo still navigate.
const keepArrowTapsInGallery = (e) => {
  if (e.target.closest(".swiper-button-next, .swiper-button-prev")) {
    e.preventDefault();
    e.stopPropagation();
  }
};

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
    <PageLayout name="sights" center={false}>
      <IonGrid className="full-width">
        <IonRow>
          {visibleSights.map((sight) => {
            const name = localized(sight.name, i18n.language);
            const title = localized(sight.title, i18n.language);
            const images = imageUrls(sight.imgUrl);

            return (
              <IonCol key={sight.id} size="12" size-md="6" size-xl="4">
                <IonCard className="sight-card" routerLink={"/sights/" + sight.id}>
                  {images.length > 0 && (
                    <div onClick={keepArrowTapsInGallery}>
                      <Swiper
                        modules={[Navigation, Pagination]}
                        slidesPerView={1}
                        navigation={images.length > 1}
                        pagination={images.length > 1}
                        loop={images.length > 1}
                        className="sight-card-gallery"
                      >
                        {images.map((url, imageIndex) => (
                          <SwiperSlide key={url + imageIndex}>
                            <img
                              src={url}
                              alt={`${name} ${imageIndex + 1}`}
                              loading="lazy"
                              draggable={false}
                            />
                          </SwiperSlide>
                        ))}
                      </Swiper>
                    </div>
                  )}
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
