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

const arButton = document.querySelector("#ar-button");
if (arButton) arButton.textContent = arButtonLabels[language] || arButtonLabels.en;
