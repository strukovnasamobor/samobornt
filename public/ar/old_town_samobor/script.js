// Handles loading the events for <model-viewer>'s slotted progress bar
const onProgress = (event) => {
  const progressBar = event.target.querySelector('.progress-bar');
  const updatingBar = event.target.querySelector('.update-bar');
  updatingBar.style.width = `${event.detail.totalProgress * 100}%`;
  if (event.detail.totalProgress === 1) {
    progressBar.classList.add('hide');
    event.target.removeEventListener('progress', onProgress);
  } else {
    progressBar.classList.remove('hide');
  }
};
document.querySelector('model-viewer').addEventListener('progress', onProgress);
// An AR scene is a plain page outside the React app, so it carries its own copy
// of the one string it shows rather than reaching into the app's translations.
// The language comes from the app: ArViewer puts it in the link, and
// localStorage is the fallback for a page opened directly, where i18next keeps
// the chosen language under i18nextLng.
const arButtonLabels = {
  en: "View in your space",
  hr: "Prikaži u svom prostoru",
};

const storedLanguage = () => {
  try {
    return localStorage.getItem("i18nextLng");
  } catch {
    // storage can be unavailable in an embedded context; the fallbacks cover it
    return null;
  }
};

const language = (
  new URLSearchParams(window.location.search).get("lang") ||
  storedLanguage() ||
  navigator.language ||
  "en"
)
  // "en-US" and "hr-HR" each name a language there is a label for
  .split("-")[0];

// Scene Viewer is a separate app: it re-fetches the model over the network and
// cannot see this page's cache, so tapping through while offline only raises an
// Android system dialog demanding a connection. WebXR renders in the page from
// the model already loaded, so it is the one AR route that survives offline.
// Disable the button only when neither route can succeed.
const arOfflineLabels = {
  en: "AR needs internet",
  hr: "AR treba internet",
};

const arButton = document.querySelector("#ar-button");

// Samsung Internet answers isSessionSupported("immersive-ar") with true and
// then never presents a session: model-viewer logs "Attempting to present in
// AR with WebXR..." and nothing happens. It hosts the Trusted Web Activity on
// Samsung phones whenever it is the default browser, so this is the app for a
// lot of users. Feature detection cannot see it - the browser has to be named.
const webxrIsTrustworthy = !/SamsungBrowser/.test(navigator.userAgent);
let webxrAvailable = false;

const refreshArButton = () => {
  if (!arButton) return;
  const usable = navigator.onLine || webxrAvailable;
  arButton.disabled = !usable;
  const labels = usable ? arButtonLabels : arOfflineLabels;
  arButton.textContent = labels[language] || labels.en;
};

refreshArButton();
window.addEventListener("online", refreshArButton);
window.addEventListener("offline", refreshArButton);

if (webxrIsTrustworthy && navigator.xr && navigator.xr.isSessionSupported) {
  navigator.xr
    .isSessionSupported("immersive-ar")
    .then((supported) => {
      webxrAvailable = supported;
      refreshArButton();
    })
    .catch(() => {});
}

// The optimized model in `src` is what phones get, and it is the copy the
// service worker precaches for offline use. A desktop browser with a connection
// has the memory and the bandwidth for the full-resolution master, so it is
// upgraded to that instead; if that load fails for any reason the optimized
// model is put back. Only the heavy scanned scenes carry a data-src-full.
const modelViewer = document.querySelector("model-viewer");
const fullModel = modelViewer && modelViewer.dataset.srcFull;

// AR Quick Look is WebKit's "System Preview", and a WKWebView ships with it
// switched off: only Safari and the in-app Safari sheet turn it on. Inside the
// app, iOS therefore reports no AR route even with an ios-src, and model-viewer
// hides its button. The button is kept instead: moved out of model-viewer so
// the hidden slot cannot take it along, and made to hand the USDZ to the app,
// which opens it in that Safari sheet. Safari itself never gets here, because
// there canActivateAR is true and model-viewer runs Quick Look on its own.
const isIOS =
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const enableQuickLookHandoff = () => {
  if (!modelViewer || !arButton || !isIOS || modelViewer.canActivateAR) return;
  const iosSrc = modelViewer.getAttribute("ios-src");
  if (!iosSrc) return;
  const usdzUrl = new URL(iosSrc, window.location.href).href;

  arButton.removeAttribute("slot");
  document.body.appendChild(arButton);
  arButton.addEventListener("click", () => {
    if (arButton.disabled) return;
    if (window.parent !== window) {
      window.parent.postMessage(
        { type: "samobornt:open-quick-look", url: usdzUrl },
        window.location.origin
      );
    } else {
      // Opened as a plain page: let the browser handle the USDZ itself.
      window.location.href = usdzUrl;
    }
  });
};

customElements.whenDefined("model-viewer").then(async () => {
  if (!modelViewer) return;
  // canActivateAR is settled by the element's first update.
  await modelViewer.updateComplete;
  enableQuickLookHandoff();
});

// Scene Viewer is an intent to a separate app, so it works where this
// browser's WebXR does not. Set before the deferred module upgrades the
// element, so model-viewer reads the corrected order.
if (!webxrIsTrustworthy && modelViewer) {
  modelViewer.setAttribute("ar-modes", "scene-viewer webxr quick-look");
}

// navigator.userAgentData is Chromium-only. Elsewhere a coarse primary pointer
// means a touch device, which also catches iPadOS reporting a desktop agent.
const isDesktop = () => {
  const uaData = navigator.userAgentData;
  if (uaData && typeof uaData.mobile === "boolean") return !uaData.mobile;
  if (window.matchMedia("(pointer: coarse)").matches) return false;
  return !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
};

if (fullModel && isDesktop() && navigator.onLine) {
  // Attributes rather than the .src property: this is a classic script, so it
  // runs before the deferred module upgrades the element and the property does
  // not exist yet.
  const optimizedModel = modelViewer.getAttribute("src");
  modelViewer.addEventListener(
    "error",
    () => modelViewer.setAttribute("src", optimizedModel),
    { once: true }
  );
  modelViewer.setAttribute("src", fullModel);
}
