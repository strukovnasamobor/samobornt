import "./Map.css";
import PageLayout from "../components/PageLayout";
import { useEffect } from "react";

// Origin of the embedded map — also the only origin whose messages we accept.
// Point both at http://localhost:5173 to test against a local rontomap build.
const RONTOMAP_ORIGIN = "https://rontomap.web.app";
const RONTOMAP_SRC = `${RONTOMAP_ORIGIN}/?lat=45.799686&long=15.706353&zoom=14.73&bearing=-96.8&pitch=0.0&features_collection=D2BdLFNZK5c8rGLpCdCu&embedded=true&style=rontomap_streets_light&geolocation=true&interact=true`;

export default function Map() {
  // Marker clicks inside the iframe arrive as postMessage from rontomap
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== RONTOMAP_ORIGIN) return;
      const data = event.data;
      if (!data || data.source !== "rontomap" || data.type !== "marker-click") return;
      const marker = data.marker || {};
      console.log("Rontomap > marker clicked:", marker.name || "(unnamed)", marker);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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
