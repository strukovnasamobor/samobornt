import "./ArViewer.css";
import { IonPage } from "@ionic/react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * The AR scenes are plain static pages under public/ar, outside the React app.
 * Each is shown in an iframe rather than navigated to: loading a scene as its
 * own document tears the app down with it, so coming back from AR meant a full
 * reload, map initialization and all. Framed, the app stays alive behind the
 * scene and back just pops this route. The tab bar is hidden while this route
 * is active (see App.jsx), so the scene keeps the whole screen it had as a
 * standalone page.
 */
export default function ArViewer() {
  const { id } = useParams();
  const { i18n } = useTranslation();

  // The scene is a plain page with its own copy of the one label it shows, so
  // it is told which language to use.
  const language = i18n.resolvedLanguage ?? i18n.language;

  return (
    <IonPage className="ar-viewer-page">
      {/* allow: an iframe gets no powerful features unless the parent grants
          them, and WebXR needs the xr and sensor ones. Without the grant
          model-viewer would quietly fall back to Scene Viewer, which re-fetches
          the model over the network - WebXR is the one AR route that works
          offline. */}
      <iframe
        className="ar-viewer-frame"
        src={`/ar/${id}/index.html?lang=${language}`}
        title="AR"
        allow="camera; xr-spatial-tracking; accelerometer; gyroscope; magnetometer; fullscreen"
        allowFullScreen
      />
    </IonPage>
  );
}
