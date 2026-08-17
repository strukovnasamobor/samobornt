import "./ImageViewer.css";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Zoom } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/zoom";

export default function ImageViewer({ images, isOpen, startIndex = 0, title, onClose }) {
  const { t } = useTranslation();
  const swiperRef = useRef(null);

  // Swiper sizes itself on init, which happens while the modal is still
  // animating in — re-measure and jump to the tapped image once it has settled.
  const handleDidPresent = () => {
    const swiper = swiperRef.current;
    if (!swiper) return;
    swiper.update();
    swiper.slideTo(startIndex, 0);
  };

  return (
    <IonModal
      className="image-viewer"
      isOpen={isOpen}
      onDidPresent={handleDidPresent}
      onDidDismiss={onClose}
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>SAMOBOR N&T - Image Viewer</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose} aria-label={t("close")}>
              <IonIcon slot="icon-only" icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent scrollY={false}>
        <Swiper
          modules={[Navigation, Pagination, Zoom]}
          onSwiper={(swiper) => { swiperRef.current = swiper; }}
          initialSlide={startIndex}
          slidesPerView={1}
          zoom={{ maxRatio: 4 }}
          navigation={images.length > 1}
          pagination={images.length > 1 ? { clickable: true, dynamicBullets: true } : false}
          className="image-viewer-swiper"
        >
          {images.map((url, imageIndex) => (
            <SwiperSlide key={url + imageIndex}>
              {/* the zoom module only drives what is inside swiper-zoom-container */}
              <div className="swiper-zoom-container">
                <img src={url} alt={`${title} ${imageIndex + 1}`} draggable={false} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </IonContent>
    </IonModal>
  );
}
