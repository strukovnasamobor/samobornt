import "./SightDetails.css";
import PageLayout from "../components/PageLayout";
import {
  IonCol,
  IonGrid,
  IonRow,
  IonText,
  useIonRouter,
} from "@ionic/react";
import { useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSwipeable } from "react-swipeable";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Zoom } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/zoom";
import { AppContext } from "../AppContext";
import Loading from "../components/Loading";
import PageNotFound from "./PageNotFound";
import localized from "../utils/localized";
import imageUrls from "../utils/imageUrls";

export default function SightDetails() {
  const { sights } = useContext(AppContext);
  const { i18n } = useTranslation();
  const router = useIonRouter();
  const { id } = useParams();

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
    // react-swipeable defaults to delta 10 with no time limit, so a 10px drag
    // — or any small mouse drag, since trackMouse is on — jumped to another
    // sight. Ask for a deliberate flick instead.
    delta: 100,
    swipeDuration: 500,
    trackMouse: true,
  });

  // Zoom the photo where it sits. Swiper only emits click for a real tap, not
  // for the end of a drag, so swiping the gallery or panning a zoomed photo
  // never triggers it; the arrows and bullets are controls in their own right.
  const handleGalleryClick = (swiper, event) => {
    if (event.target.closest(".swiper-button-next, .swiper-button-prev, .swiper-pagination")) return;
    swiper.zoom.toggle(event);
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
        <Swiper
          modules={[Navigation, Pagination, Zoom]}
          onSwiper={(swiper) => { galleryRef.current = swiper; }}
          slidesPerView={1}
          spaceBetween={10}
          // swiper starts following the finger after 5px and treats anything
          // within 45 degrees as horizontal; both are widened so a scroll or a
          // nudge does not drag the gallery
          threshold={20}
          touchAngle={30}
          navigation
          pagination={{ clickable: true, dynamicBullets: true }}
          loop={images.length > 1}
          // the photo sets its own height, so let the gallery follow it
          autoHeight={true}
          // toggle:false drops the built-in double-tap; the click below drives
          // the zoom instead. Two-finger pinch is separate and stays enabled.
          zoom={{ maxRatio: 4, toggle: false }}
          onClick={handleGalleryClick}
          className="sight-details-gallery"
        >
          {images.map((url, imageIndex) => (
            <SwiperSlide key={url + imageIndex}>
              {/* zoom only drives what sits inside swiper-zoom-container */}
              <div className="swiper-zoom-container">
                <img
                  src={url}
                  alt={`${name} ${imageIndex + 1}`}
                  draggable={false}
                  // autoHeight measures on init, before the image has a height
                  onLoad={() => galleryRef.current?.update()}
                />
              </div>
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
