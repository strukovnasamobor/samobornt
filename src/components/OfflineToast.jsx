import "./OfflineToast.css";
import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { getIsPrecaching, subscribe } from "../utils/precacheStatus";

// Not an IonToast: positionAnchor measures the tab bar once, when the toast is
// presented, so it would not follow the 1200px breakpoint where App.css hides
// the tab bar - and a hidden tab bar hands it a zeroed rectangle. Ionic's md
// toast also colours itself from --ion-color-step-*, which this app never
// defines.
export default function OfflineToast() {
  // The worker is registered in main.jsx, before React mounts, so its progress
  // lives in a module store. useSyncExternalStore rather than useRegisterSW:
  // that hook registers from a useState initialiser, which StrictMode
  // double-invokes in development, registering the worker twice.
  const isPrecaching = useSyncExternalStore(subscribe, getIsPrecaching, getIsPrecaching);

  // useSuspense false plus a defaultValue: this has to be readable while the
  // precache is saturating the connection, which is exactly when
  // /i18n/en.json may still be queued behind a scene. Suspending here would
  // blank the whole app rather than delay one line of text.
  const { t } = useTranslation(undefined, { useSuspense: false });

  if (!isPrecaching) return null;

  return (
    <div className="offline-toast" role="status" aria-live="polite">
      <div className="offline-toast-message">
        {t("preparingOffline", {
          defaultValue: "Preparing offline mode. Please keep the app open.",
        })}
      </div>
    </div>
  );
}
