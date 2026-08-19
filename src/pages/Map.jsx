import "./Map.css";
import PageLayout from "../components/PageLayout";
import { useIonRouter } from "@ionic/react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppContext } from "../AppContext";

// Origin of the embedded map — also the only origin whose messages we accept.
// Point both at http://localhost:5173 to test against a local rontomap build.
const RONTOMAP_ORIGIN = "https://rontomap.web.app";

// One feature collection per language, so the markers come back localised.
// Falls back to english, matching i18n's own fallbackLng.
const FEATURE_COLLECTIONS = {
  en: "ZNGsrqPj8bDcUIsozvTk",
  hr: "0x3Glib9fg1VivuDX6gR",
};

// Where the map opens when no particular sight is being shown: the old town
// with all the markers in frame.
const OVERVIEW_CAMERA = {
  lat: 45.799686,
  long: 15.706353,
  zoom: 14.73,
  bearing: -96.8,
  pitch: 0.0,
};

// Close enough for a single sight that its marker and the street it stands on
// are both readable.
const SIGHT_ZOOM = 17.5;

// The camera is built from the sight's own coordinates rather than being baked
// into a fixed link. The URL only frames the map as it boots; once it is up,
// moving it goes through the set-camera message below, so the frame is never
// reloaded to change the view.
const rontomapSrc = (language, camera) =>
  `${RONTOMAP_ORIGIN}/?lat=${camera.lat}&long=${camera.long}&zoom=${camera.zoom}` +
  `&bearing=${camera.bearing}&pitch=${camera.pitch}` +
  `&features_collection=${FEATURE_COLLECTIONS[language] ?? FEATURE_COLLECTIONS.en}` +
  `&embedded=true&style=rontomap_streets_light&geolocation=true&interact=true`;

// A sight keeps the overview's bearing and pitch, so being sent to one moves
// the map without also spinning it.
const cameraFor = (target) =>
  target
    ? { ...OVERVIEW_CAMERA, lat: target.lat, long: target.long, zoom: SIGHT_ZOOM }
    : OVERVIEW_CAMERA;

/**
 * A marker carries its sight id as JSON in the description field. That can
 * reach us already parsed, as a JSON string, or as JSON sitting inside other
 * text, so each of those is unwrapped before the id is read.
 */
function sightIdFromMarker(marker) {
  let data = marker.description ?? marker.properties?.description;
  if (!data) return null;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      const braced = data.match(/\{[\s\S]*\}/);
      if (!braced) return null;
      try {
        data = JSON.parse(braced[0]);
      } catch {
        return null;
      }
    }
  }
  if (typeof data !== "object" || data === null) return null;

  const id = data.id ?? data.sightId ?? data.sight;
  // firestore document ids are strings ("1"), the json may hold a number
  return id === undefined || id === null ? null : String(id);
}

// How long a camera waits for the frame to report itself before we give up on
// the message and reload the frame around it instead. That covers a map still
// loading, and a build older than the set-camera command, which never reports.
const CAMERA_FALLBACK_MS = 4000;

export default function Map() {
  const { sights, mapTarget } = useContext(AppContext);
  const router = useIonRouter();
  const { i18n } = useTranslation();

  const frameRef = useRef(null);
  // The frame says "ready" once its map can take commands. A camera asked for
  // before that waits here and goes out the moment it can.
  const frameReadyRef = useRef(false);
  const pendingCameraRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  // Bumping this rebuilds the src, which is the only way to reload the frame.
  const [reloadToken, setReloadToken] = useState(0);

  // resolvedLanguage is the supported code i18next settled on ("en"/"hr"),
  // rather than whatever region-tagged value the detector reported
  const language = i18n.resolvedLanguage ?? i18n.language;

  // Read by the src below, which must not rebuild when the target changes: a
  // new src reloads the frame, which is exactly what the message avoids.
  const targetRef = useRef(mapTarget);
  // The target the current frame was built around, so a camera it already
  // frames is never sent or reloaded for a second time.
  const bootTargetRef = useRef(mapTarget);

  // Only a language switch or a fallback rebuilds the src, and when it does the
  // frame opens on wherever the map was last sent rather than snapping back to
  // the overview.
  const src = useMemo(
    () => rontomapSrc(language, cameraFor(targetRef.current)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language, reloadToken]
  );

  const sendCamera = (camera) => {
    const frame = frameRef.current;
    if (frame?.contentWindow && frameReadyRef.current) {
      console.log("Rontomap > set-camera:", camera);
      frame.contentWindow.postMessage(
        { source: "rontomap-embed", type: "set-camera", camera },
        RONTOMAP_ORIGIN
      );
      return;
    }

    // Nothing to post to yet. Hold the camera for the frame's own "ready", and
    // reload the frame around it if that never comes.
    pendingCameraRef.current = camera;
    if (fallbackTimerRef.current) return;
    fallbackTimerRef.current = setTimeout(() => {
      fallbackTimerRef.current = null;
      if (frameReadyRef.current) return;
      console.warn("Rontomap > frame never reported ready; reloading it on the camera instead");
      setReloadToken((token) => token + 1);
    }, CAMERA_FALLBACK_MS);
  };

  // Every fresh frame — first mount, a language switch, a fallback reload —
  // starts unannounced and already framed on the camera it was built with.
  useEffect(() => {
    frameReadyRef.current = false;
    pendingCameraRef.current = null;
    bootTargetRef.current = targetRef.current;
    clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = null;
  }, [language, reloadToken]);

  // "Show on map" hands the sight over here. Every press makes a new target
  // object, so the same sight asked for twice still flies the map back to it.
  useEffect(() => {
    targetRef.current = mapTarget;
    if (mapTarget && mapTarget !== bootTargetRef.current) sendCamera(cameraFor(mapTarget));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapTarget]);

  useEffect(() => () => clearTimeout(fallbackTimerRef.current), []);

  // Events from inside the iframe: the frame announcing itself, and marker taps
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== RONTOMAP_ORIGIN) return;
      const data = event.data;
      if (!data || data.source !== "rontomap") return;

      if (data.type === "ready") {
        console.log("Rontomap > frame ready");
        frameReadyRef.current = true;
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
        const pending = pendingCameraRef.current;
        pendingCameraRef.current = null;
        if (pending) sendCamera(pending);
        return;
      }

      if (data.type !== "marker-click") return;

      const marker = data.marker || {};
      const sightId = sightIdFromMarker(marker);
      console.log("Rontomap > marker clicked:", marker.name || "(unnamed)", "> sight id:", sightId, marker);

      if (!sightId) {
        console.warn("Rontomap > marker has no sight id in its description:", marker.description);
        return;
      }
      if (sights && !sights.some((sight) => sight.id === sightId)) {
        // still navigate, so the detail page reports it, but say why up front
        console.warn(`Rontomap > no sight "${sightId}" in the sights collection`);
      }

      router.push("/sights/" + sightId, "forward");
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router, sights]);

  return (
    <PageLayout name="map" center={true}>
      <iframe
        // keying on the language remounts the frame on a switch, and the token
        // does the same for a fallback reload; changing src in place would
        // navigate the existing frame and stack up history instead. A new sight
        // touches neither: its camera goes over postMessage, so the map moves
        // without the frame reloading at all.
        key={`${language}:${reloadToken}`}
        ref={frameRef}
        title="Rontomap"
        style={{ width: "100%", height: "100%", border: "none" }}
        allow="fullscreen; geolocation"
        scrolling="no"
        src={src}
      />
    </PageLayout>
  );
}
