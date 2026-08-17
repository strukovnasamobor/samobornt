/**
 * Sight documents keep every translation inside the field itself, e.g.
 * name: { en: "START", hr: "START" }. Picks the value for the active language
 * and falls back to English (then to any translation present) so a missing
 * entry never renders as an empty string.
 */
export default function localized(field, language, fallbackLanguage = "en") {
  if (field === null || field === undefined) return "";
  if (typeof field !== "object") return String(field);

  // i18next may report a region-specific code ("en-US"); documents key on "en"
  const lang = String(language || fallbackLanguage).split("-")[0];

  return field[lang] ?? field[fallbackLanguage] ?? Object.values(field)[0] ?? "";
}
