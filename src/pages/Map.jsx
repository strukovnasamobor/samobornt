import "./Map.css";
import PageLayout from "../components/PageLayout";
import { useIonRouter } from "@ionic/react";
import { useContext, useEffect, useRef, useState } from "react";
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

// Where the map opens: the old town with all the markers in frame. It stays the
// only camera this app spells out — a sight is asked for by id, and the map
// answers with the position of its own marker.
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

const rontomapSrc = (language, camera) =>
  `${RONTOMAP_ORIGIN}/?lat=${camera.lat}&long=${camera.long}&zoom=${camera.zoom}` +
  `&bearing=${camera.bearing}&pitch=${camera.pitch}` +
  `&features_collection=${FEATURE_COLLECTIONS[language] ?? FEATURE_COLLECTIONS.en}` +
  `&embedded=true&style=rontomap_streets_light&geolocation=true&interact=true`;

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

export default function Map() {
  const { sights, mapTarget } = useContext(AppContext);
  const router = useIonRouter();
  const { i18n } = useTranslation();

  const frameRef = useRef(null);
  // The frame says "ready" once its map is up and its markers are on it.
  // Anything asked for before that is simply sent again when it arrives.
  const frameReadyRef = useRef(false);
  const targetRef = useRef(mapTarget);

  // resolvedLanguage is the supported code i18next settled on ("en"/"hr"),
  // rather than whatever region-tagged value the detector reported
  const language = i18n.resolvedLanguage ?? i18n.language;

  // Fixed for the life of the page. Changing it would navigate the frame — a
  // full map reload that throws away the user's zoom, bearing, pitch and chosen
  // basemap — so everything after this goes over postMessage instead.
  const [src] = useState(() => rontomapSrc(language, OVERVIEW_CAMERA));

  const post = (message) => {
    const frame = frameRef.current;
    if (!frame?.contentWindow || !frameReadyRef.current) return;
    frame.contentWindow.postMessage({ source: "rontomap-embed", ...message }, RONTOMAP_ORIGIN);
  };

  // Ask the map for the marker that carries this sight's id. It knows where its
  // own markers are, so nothing here needs coordinates — and if it holds no
  // marker for the sight it leaves the view alone rather than guessing.
  const showMarker = (target) => {
    console.log("Rontomap > show-marker:", target.sightId);
    post({ type: "show-marker", sightId: target.sightId, zoom: SIGHT_ZOOM });
  };

  // Markers are localised by swapping the whole collection, which the map does
  // in place. The frame is left alone, so the view survives a language change.
  const showFeaturesFor = (lang) => {
    const collectionId = FEATURE_COLLECTIONS[lang] ?? FEATURE_COLLECTIONS.en;
    console.log("Rontomap > set-features:", lang, collectionId);
    post({ type: "set-features", collectionId });
  };

  useEffect(() => {
    showFeaturesFor(language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // "Show on map" hands the sight over here. Every press makes a new target
  // object, so the same sight asked for twice still flies the map back to it.
  useEffect(() => {
    targetRef.current = mapTarget;
    if (mapTarget) showMarker(mapTarget);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapTarget]);

  // Events from inside the iframe: the frame announcing itself, and marker taps
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== RONTOMAP_ORIGIN) return;
      const data = event.data;
      if (!data || data.source !== "rontomap") return;

      if (data.type === "ready") {
        console.log("Rontomap > frame ready");
        frameReadyRef.current = true;
        // Whatever was asked for while the frame was still coming up
        showFeaturesFor(language);
        if (targetRef.current) showMarker(targetRef.current);
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
  }, [router, sights, language]);

  return (
    <PageLayout name="map" center={true}>
      <iframe
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
