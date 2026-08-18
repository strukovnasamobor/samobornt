import "./Map.css";
import PageLayout from "../components/PageLayout";
import { useIonRouter } from "@ionic/react";
import { useContext, useEffect } from "react";
import { AppContext } from "../AppContext";

// Origin of the embedded map — also the only origin whose messages we accept.
// Point both at http://localhost:5173 to test against a local rontomap build.
const RONTOMAP_ORIGIN = "https://rontomap.web.app";
const RONTOMAP_SRC = `${RONTOMAP_ORIGIN}/?lat=45.799686&long=15.706353&zoom=14.73&bearing=-96.8&pitch=0.0&features_collection=0x3Glib9fg1VivuDX6gR&embedded=true&style=rontomap_streets_light&geolocation=true&interact=true`;

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
  const { sights } = useContext(AppContext);
  const router = useIonRouter();

  // Marker clicks inside the iframe arrive as postMessage from rontomap
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== RONTOMAP_ORIGIN) return;
      const data = event.data;
      if (!data || data.source !== "rontomap" || data.type !== "marker-click") return;

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
        title="Rontomap"
        style={{ width: "100%", height: "100%", border: "none" }}
        allow="fullscreen; geolocation"
        scrolling="no"
        src={RONTOMAP_SRC}
      />
    </PageLayout>
  );
}
