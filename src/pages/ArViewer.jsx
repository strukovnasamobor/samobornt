import "./ArViewer.css";
import { useEffect } from "react";
import { IonButton, IonIcon, IonPage, useIonRouter } from "@ionic/react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { arrowBackOutline } from "ionicons/icons";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

// The app-local iOS plugin (ios-capacitor/App/App/QuickLookPlugin.swift):
// presents Apple's native AR Quick Look and keeps the models cached for
// offline use. registerPlugin is harmless where it does not exist - the
// availability check below gates every call.
const QuickLook = registerPlugin("QuickLook");
const hasQuickLook =
  Capacitor.getPlatform() === "ios" && Capacitor.isPluginAvailable("QuickLook");

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
  const { t, i18n } = useTranslation();
  const router = useIonRouter();

  // The scene is a plain page with its own copy of the one label it shows, so
  // it is told which language to use.
  const language = i18n.resolvedLanguage ?? i18n.language;

  // AR Quick Look does not run inside the app's own web view (WebKit's System
  // Preview is only switched on in Safari and the in-app Safari sheet), so on
  // iOS the scene hands its USDZ up here and it is opened in that sheet, which
  // returns to the app through its Done button. See the scene's script.js.
  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.type !== "samobornt:open-quick-look") return;
      if (typeof data.url !== "string") return;
      let url;
      try {
        url = new URL(data.url);
      } catch {
        return;
      }
      // Only this site's own models leave the app.
      if (url.origin !== window.location.origin) return;

      // The QuickLook plugin shows Apple's native AR viewer straight over the
      // app and serves the model from its own cache, so it works offline; its
      // share sheet shares the live viewer page rather than the local file.
      // Builds without it fall back to the in-app Safari sheet, then to
      // window.open, which the shell hands to external Safari - Quick Look
      // works in both, they just need a connection.
      if (hasQuickLook) {
        QuickLook.open({
          url: url.href,
          shareUrl: `${window.location.origin}/ar/${id}`,
        }).catch(() => {
          // Offline with nothing cached is the expected rejection, and then
          // nothing else can fetch the model either - so only errors that
          // happen with a connection fall through to the sheet.
          if (navigator.onLine) Browser.open({ url: url.href });
        });
      } else if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Browser")) {
        Browser.open({ url: url.href });
      } else {
        window.open(url.href, "_blank", "noopener");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [id]);

  // Android has a system back button; iOS has only this. A scene opened
  // straight from a link has nothing to pop, so it lands on the sights list.
  const goBack = () => {
    if (router.canGoBack()) router.goBack();
    else router.push("/sights", "back");
  };

  return (
    <IonPage className="ar-viewer-page">
      <IonButton
        className="ar-viewer-close"
        shape="round"
        aria-label={t("back")}
        onClick={goBack}
      >
        <IonIcon slot="icon-only" icon={arrowBackOutline} />
      </IonButton>
      {/* allow: an iframe gets no powerful features unless the parent grants
          them, and WebXR needs the xr and sensor ones. Without the grant
          model-viewer would quietly fall back to Scene Viewer, which re-fetches
          the model over the network - WebXR is the one AR route that works
          offline.
          app=ios tells the scene the native QuickLook cache is on board, so
          its online-only AR lockout must not apply. Appended only when the
          plugin exists: older builds keep the current gating. */}
      <iframe
        className="ar-viewer-frame"
        src={`/ar/${id}/index.html?lang=${language}${hasQuickLook ? "&app=ios" : ""}`}
        title="AR"
        allow="camera; xr-spatial-tracking; accelerometer; gyroscope; magnetometer; fullscreen"
        allowFullScreen
      />
    </IonPage>
  );
}
