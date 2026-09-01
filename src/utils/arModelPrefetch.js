import { Capacitor, registerPlugin } from "@capacitor/core";
import {
  getMapOfflineStatus,
  isAnyMapPrepared,
  subscribe as subscribeMap,
} from "./mapOfflineStatus";
import { markDone, markError, markPrefetching } from "./arModelStatus";

// On iOS, AR runs through the native QuickLook plugin, which keeps the USDZ
// models in the app's own cache so AR works offline. The models are fetched
// here, up front, rather than on first use - but only after the offline map
// has finished downloading, so the two ~tens-of-MB transfers do not fight
// over the connection. The plugin skips files it already holds and reports
// nothing for them, which is what keeps the toast quiet on later launches.
const QuickLook = registerPlugin("QuickLook");

let started = false;

export function startArModelPrefetch() {
  if (started) return;
  started = true;

  // Only the iOS shell has the plugin; Android AR goes through Scene Viewer
  // and the web through the browser's own Quick Look / WebXR. Old app builds
  // without the plugin bail here and keep their current behavior.
  if (Capacitor.getPlatform() !== "ios") return;
  if (!Capacitor.isPluginAvailable("QuickLook")) return;

  // The map sweep only runs once per collection: a launch after it finished
  // leaves the live status at "idle" forever, so the stored flag is the only
  // signal that the wait is already over.
  if (isAnyMapPrepared()) {
    run();
    return;
  }
  const unsubscribe = subscribeMap(() => {
    if (getMapOfflineStatus().phase !== "ready") return;
    unsubscribe();
    run();
  });
}

async function run() {
  let listener;
  try {
    // The USDZ filenames are not derivable from the scene names (the heavy
    // scanned scenes carry an .opt. infix, the light ones do not), so the
    // list lives in a manifest next to the scenes.
    const response = await fetch("/ar/usdz-manifest.json");
    const manifest = await response.json();
    const urls = manifest.models.map(
      (path) => new URL(path, window.location.origin).href
    );

    listener = await QuickLook.addListener(
      "prefetchProgress",
      ({ completed, total }) => markPrefetching({ completed, total })
    );
    const { failed } = await QuickLook.prefetch({ urls });
    if (failed === 0) {
      markDone();
    } else {
      markError();
    }
  } catch {
    // Silent by design: AR still works online, and the next launch retries.
    markError();
  } finally {
    listener?.remove();
  }
}
