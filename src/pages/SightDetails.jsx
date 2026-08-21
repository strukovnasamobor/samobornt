import "./SightDetails.css";
import PageLayout from "../components/PageLayout";
import {
  IonButton,
  IonCol,
  IonGrid,
  IonIcon,
  IonRow,
  IonText,
  useIonRouter,
  useIonViewWillEnter,
} from "@ionic/react";
import { cubeOutline, navigateOutline } from "ionicons/icons";
import { useContext, useEffect, useRef, useState } from "react";
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
import arScene from "../utils/arScene";

// Letting go moves to the neighbouring sight only once the page has been
// dragged this far across, so it takes a deliberate pull rather than a nudge.
const COMMIT_FRACTION = 0.25;

// How long the page takes to settle once the finger is off. Must match the
// transition on .sight-details-track--settling in SightDetails.css.
const SETTLE_MS = 220;

export default function SightDetails() {
  const { sights, setMapTarget } = useContext(AppContext);
  const { t, i18n } = useTranslation();
  const router = useIonRouter();
  const { id } = useParams();

  const swipeRef = useRef(null);

  // How far the page sits from its resting place, and where it is heading once
  // the finger is off: 0 stays on this sight, 1 or -1 goes to a neighbour. Only
  // `settling` turns the CSS transition on, so the drag itself has no lag.
  const [offset, setOffset] = useState(0);
  const [settling, setSettling] = useState(false);
  const stepRef = useRef(0);
  // Mirrors of those two, for the gesture handlers to read straight away: a
  // gesture is still in flight when React has not re-rendered yet.
  const offsetRef = useRef(0);
  const settlingRef = useRef(false);
  const settleTimerRef = useRef(null);

  const index = sights ? sights.findIndex((sight) => sight.id === id) : -1;
  const sight = index === -1 ? null : sights[index];

  // The sight `step` places away, wrapping around the ends
  const sightAt = (step) =>
    !sights || sights.length < 2 || index === -1
      ? null
      : sights[(index + step + sights.length) % sights.length];

  // Replace rather than push: pushing mounts a second copy of this page on top
  // of the one being swiped away, and for the frame before it has laid out the
  // screen shows an empty page - the blink. Replacing keeps one page and simply
  // changes which sight it is on. It also keeps the tab's history to the list
  // the reader came from, rather than one entry per swipe.
  const goToSight = (step) => {
    const target = sightAt(step);
    if (!target) return;
    router.push("/sights/" + target.id, "none", "replace");
  };

  // Once the page has slid a page aside, the sight it uncovered becomes the
  // page; coming to rest in the middle just leaves the drag undone.
  const finishSettle = () => {
    const step = stepRef.current;
    stepRef.current = 0;
    settlingRef.current = false;
    settleTimerRef.current = null;

    if (step !== 0) {
      // Leave the page exactly where the drag put it. What is on screen is the
      // neighbour it uncovered, which is the sight being navigated to, so the
      // picture does not change as the new page takes over. Putting the
      // transform back here instead would snap this sight into view first -
      // the blink of the wrong page before the right one arrives.
      goToSight(step);
      return;
    }

    offsetRef.current = 0;
    setOffset(0);
    setSettling(false);
  };

  // Let go of the page and it animates to where it belongs: back where it was,
  // or a page aside, uncovering the neighbour that then becomes the page.
  //
  // A timer rather than transitionend, which is unreliable here in two ways: it
  // never fires when a drag happens to end exactly where the page must settle
  // (the transform does not change, so no transition runs), and it fires for
  // every transition finishing anywhere inside the page, buttons included.
  const settleTo = (px, step) => {
    stepRef.current = step;
    offsetRef.current = px;
    settlingRef.current = true;
    setOffset(px);
    setSettling(true);

    clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(finishSettle, SETTLE_MS);
  };

  // The next sight arrives in place, so the page starts from rest again
  const resetPosition = () => {
    clearTimeout(settleTimerRef.current);
    settleTimerRef.current = null;
    setOffset(0);
    setSettling(false);
    stepRef.current = 0;
    offsetRef.current = 0;
    settlingRef.current = false;
  };

  useEffect(() => {
    resetPosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // A page left a page aside after a swipe is not unmounted - Ionic keeps it in
  // the tab's stack - so put it back at rest before it is ever shown again.
  useIonViewWillEnter(() => {
    resetPosition();
  });

  useEffect(() => () => clearTimeout(settleTimerRef.current), []);

  const swipeHandlers = useSwipeable({
    onSwiping: (e) => {
      // a mostly vertical drag is a scroll, and the page stays where it is
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) return;

      // A drag that started while the page was still settling takes over from
      // it, so the pending landing must not fire underneath the new gesture.
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
      stepRef.current = 0;

      // Never further than the neighbour: dragging past a full page would pull
      // it off the other side and leave nothing on screen.
      const width = swipeRef.current?.offsetWidth || 1;
      const dragged = Math.max(-width, Math.min(width, e.deltaX));

      settlingRef.current = false;
      offsetRef.current = dragged;
      setSettling(false);
      setOffset(dragged);
    },
    onSwiped: (e) => {
      const width = swipeRef.current?.offsetWidth || 1;
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const pulledAcross = Math.abs(e.deltaX) >= width * COMMIT_FRACTION;

      const step = horizontal && pulledAcross ? (e.deltaX < 0 ? 1 : -1) : 0;
      // the neighbour is a page away, so that is how far the page travels
      settleTo(step === 0 ? 0 : -step * width, step);
    },
    // A gesture can end without ever counting as a swipe — a touch the system
    // takes over, say. Whatever the drag reached is put back rather than left
    // hanging half a page across.
    onTouchEndOrOnMouseUp: () => {
      if (settlingRef.current || offsetRef.current === 0) return;
      settleTo(0, 0);
    },
    // Follow the finger from the first few pixels; whether the drag counts as a
    // move is settled on release above, rather than by a distance gate here.
    delta: 10,
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

  // Only the id travels: the map holds a marker for each sight and knows where
  // it is, so this page never needs the coordinates. requestedAt makes every
  // press a distinct target, even the same sight asked for twice.
  const showOnMap = () => {
    setMapTarget({ sightId: sight.id, requestedAt: Date.now() });
    router.push("/map", "forward");
  };

  // The sight on screen and the two waiting either side of it are drawn the
  // same way — photo included — so a drag carries the whole page across and
  // what slides in is what the page becomes.
  const renderPanel = (panelSight, role) => {
    if (!panelSight) return null;

    const current = role === "current";
    const name = localized(panelSight.name, i18n.language);
    const images = imageUrls(panelSight.imgUrl);
    const scene = arScene(panelSight);

    return (
      <div className={`sight-details-panel sight-details-panel--${role}`}>
        {images.length > 0 &&
          (current ? (
            <Swiper
              modules={[Navigation, Pagination, Zoom]}
              slidesPerView={1}
              spaceBetween={10}
              // swiper starts following the finger after 5px and treats anything
              // within 45 degrees as horizontal; both are widened so a scroll or
              // a nudge does not drag the gallery
              threshold={20}
              touchAngle={30}
              navigation
              pagination={{ clickable: true, dynamicBullets: true }}
              loop={images.length > 1}
              // Off deliberately. With it on, Swiper measures only once the photo
              // has loaded, so a freshly mounted gallery paints at zero height
              // first: the text jumps to the top of the page for one frame and
              // the photo shoves it down again - the blink after a swipe. The
              // photo sizes itself through CSS anyway (width 100%, height auto,
              // capped by max-height), so the gallery has its height from the
              // first paint. The cost is that a photo shaped differently from
              // the first one in the same sight letterboxes into the fill
              // instead of resizing the gallery.
              autoHeight={false}
              // toggle:false drops the built-in double-tap; the click below
              // drives the zoom instead. Two-finger pinch stays enabled.
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
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            // A neighbour only ever shows its first photo on the way past, so it
            // borrows the gallery's styling without a second gallery behind it.
            <div className="sight-details-gallery">
              <div className="swiper-zoom-container">
                <img src={images[0]} alt={name} draggable={false} loading="lazy" />
              </div>
            </div>
          ))}

        <div className="sight-details-text" {...(current ? swipeHandlers : {})}>
          <IonGrid className="full-width">
            <IonRow className="ion-text-center">
              <IonCol>
                <IonText>
                  <h2 className="sight-details-title">{localized(panelSight.title, i18n.language)}</h2>
                </IonText>

                <div className="sight-details-actions">
                  <IonButton
                    className="sight-details-action"
                    fill="outline"
                    size="small"
                    onClick={current ? showOnMap : undefined}
                  >
                    <IonIcon slot="start" icon={navigateOutline} />
                    {t("showOnMap")}
                  </IonButton>

                  {scene && (
                    <IonButton
                      className="sight-details-action"
                      fill="outline"
                      size="small"
                      onClick={current ? () => router.push("/ar/" + scene, "forward") : undefined}
                    >
                      <IonIcon slot="start" icon={cubeOutline} />
                      {t("openAr")}
                    </IonButton>
                  )}
                </div>
              </IonCol>
            </IonRow>

            <IonRow>
              <IonCol>
                <IonText>
                  <p className="sight-details-description">
                    {localized(panelSight.longDescription, i18n.language)}
                  </p>
                </IonText>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>
      </div>
    );
  };

  return (
    <PageLayout name="sight-details" center={false}>
      <div className="sight-details-swipe" ref={swipeRef}>
        <div
          className={`sight-details-track${settling ? " sight-details-track--settling" : ""}`}
          style={{ transform: `translate3d(${offset}px, 0, 0)` }}
        >
          {renderPanel(sightAt(-1), "previous")}
          {renderPanel(sight, "current")}
          {renderPanel(sightAt(1), "next")}
        </div>
      </div>
    </PageLayout>
  );
}
