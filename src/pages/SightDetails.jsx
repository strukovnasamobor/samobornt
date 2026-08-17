import "./SightDetails.css";
import PageLayout from "../components/PageLayout";
import {
  IonCol,
  IonGrid,
  IonRow,
  IonText,
  useIonRouter,
} from "@ionic/react";
import { useContext, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSwipeable } from "react-swipeable";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { AppContext } from "../AppContext";
import ImageViewer from "../components/ImageViewer";
import Loading from "../components/Loading";
import PageNotFound from "./PageNotFound";
import localized from "../utils/localized";
import imageUrls from "../utils/imageUrls";

export default function SightDetails() {
  const { sights } = useContext(AppContext);
  const { i18n } = useTranslation();
  const router = useIonRouter();
  const { id } = useParams();

  // index of the image shown in the fullscreen viewer, null while it is closed
  const [viewerIndex, setViewerIndex] = useState(null);
  const galleryRef = useRef(null);

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

  // Swiper suppresses the click that ends a swipe, so this only fires on a real
  // tap; the arrows and bullets are their own controls and shouldn't open it.
  const openViewer = (e) => {
    if (e.target.closest(".swiper-button-next, .swiper-button-prev, .swiper-pagination")) return;
    setViewerIndex(galleryRef.current?.realIndex ?? 0);
  };

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
        <div onClick={openViewer}>
          <Swiper
            modules={[Navigation, Pagination]}
            onSwiper={(swiper) => { galleryRef.current = swiper; }}
            slidesPerView={1}
            spaceBetween={10}
            navigation
            pagination={{ clickable: true, dynamicBullets: true }}
            loop={images.length > 1}
            // the photo sets its own height now, so let the gallery follow it
            autoHeight={true}
            className="sight-details-gallery"
          >
            {images.map((url, imageIndex) => (
              <SwiperSlide key={url + imageIndex}>
                <img
                  src={url}
                  alt={`${name} ${imageIndex + 1}`}
                  draggable={false}
                  // autoHeight measures on init, before the image has a height
                  onLoad={() => galleryRef.current?.update()}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
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

      {images.length > 0 && (
        <ImageViewer
          images={images}
          isOpen={viewerIndex !== null}
          startIndex={viewerIndex ?? 0}
          title={title}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </PageLayout>
  );
}
