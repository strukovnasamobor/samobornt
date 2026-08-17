import "./SightDetails.css";
import PageLayout from "../components/PageLayout";
import {
  IonButton,
  IonButtons,
  IonCol,
  IonGrid,
  IonIcon,
  IonRow,
  IonText,
  useIonRouter,
} from "@ionic/react";
import { arrowBackOutline } from "ionicons/icons";
import { useContext } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSwipeable } from "react-swipeable";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { AppContext } from "../AppContext";
import Loading from "../components/Loading";
import PageNotFound from "./PageNotFound";
import localized from "../utils/localized";
import imageUrls from "../utils/imageUrls";

export default function SightDetails() {
  const { sights } = useContext(AppContext);
  const { t, i18n } = useTranslation();
  const router = useIonRouter();
  const { id } = useParams();

  const index = sights ? sights.findIndex((sight) => sight.id === id) : -1;
  const sight = index === -1 ? null : sights[index];

  // Swiping the text area moves to the neighbouring sight, wrapping around
  const goToSight = (step) => {
    if (!sights || sights.length < 2 || index === -1) return;
    const target = (index + step + sights.length) % sights.length;
    router.push("/sights/" + sights[target].id, "forward");
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => goToSight(1),
    onSwipedRight: () => goToSight(-1),
    trackMouse: true,
  });

  if (sights === null) {
    return <Loading />;
  }

  if (!sight) {
    return <PageNotFound />;
  }

  const name = localized(sight.name, i18n.language);
  const title = localized(sight.title, i18n.language);
  const description = localized(sight.longDescription, i18n.language);
  const images = imageUrls(sight.imgUrl);

  return (
    <PageLayout name="sight-details" center={false}>
      {images.length > 0 && (
        <Swiper
          modules={[Navigation, Pagination]}
          slidesPerView={1}
          spaceBetween={10}
          navigation
          pagination={{ clickable: true, dynamicBullets: true }}
          loop={images.length > 1}
          className="sight-details-gallery"
        >
          {images.map((url, imageIndex) => (
            <SwiperSlide key={url + imageIndex}>
              <img src={url} alt={`${name} ${imageIndex + 1}`} />
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      <IonGrid className="full-width" {...swipeHandlers}>
        <IonRow className="ion-text-center">
          <IonCol>
            <IonText>
              <h2>{title}</h2>
            </IonText>
          </IonCol>
        </IonRow>

        <IonRow>
          <IonCol>
            <IonText>
              <p className="sight-details-description">{description}</p>
            </IonText>
          </IonCol>
        </IonRow>
      </IonGrid>
    </PageLayout>
  );
}
