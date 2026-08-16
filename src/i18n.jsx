import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    // navigator reports region-specific codes ("en-US"); strip the region so the
    // backend asks for /i18n/en.json rather than /i18n/en-US.json
    load: "languageOnly",
    supportedLngs: ["en", "hr"],
    debug: false,
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
    backend: {
      // path where resources get loaded from, {{lng}} is replaced automatically
      loadPath: "/i18n/{{lng}}.json",
    },
  });

export default i18n;