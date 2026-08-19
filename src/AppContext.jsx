import { createContext, useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export const AppContext = createContext();

export const THEME_PREFERENCES = ["light", "dark", "system"];

const THEME_STORAGE_KEY = "theme";
const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

function readStoredThemePreference() {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (THEME_PREFERENCES.includes(storedTheme)) return storedTheme;

  // migrate the earlier light/dark-only setting, which had no "system" option
  const storedIsDarkMode = localStorage.getItem("isDarkMode");
  if (storedIsDarkMode === "true") return "dark";
  if (storedIsDarkMode === "false") return "light";

  return "system";
}

export function AppContextProvider({ children }) {
  const [themePreference, setThemePreference] = useState(readStoredThemePreference);

  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia(DARK_MEDIA_QUERY).matches
  );

  // Follow the OS setting, but only apply it while the preference is "system"
  useEffect(() => {
    const mediaQuery = window.matchMedia(DARK_MEDIA_QUERY);
    const handler = (e) => setSystemPrefersDark(e.matches);

    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const isDarkMode =
    themePreference === "system" ? systemPrefersDark : themePreference === "dark";

  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themePreference);
  }, [themePreference]);

  // null until the first snapshot arrives, so pages can tell "still loading"
  // apart from "the collection is empty"
  const [sights, setSights] = useState(null);
  const [sightsSearchInput, setSightsSearchInput] = useState("");

  // Where the map tab should point its camera, set by "show on map" in the
  // sight details. It lives here rather than in the route so the map tab keeps
  // its single /map entry and Ionic's per-tab history stays intact.
  const [mapTarget, setMapTarget] = useState(null);

  // Every sight document carries all its translations, so a single subscription
  // serves both languages — switching language never refetches.
  useEffect(() => {
    const unsubSights = onSnapshot(
      collection(db, "sights"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        // document ids are numeric strings ("1", "2", "10")
        data.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
        console.log("AppContext > sights =", data);
        setSights(data);
      },
      (error) => {
        console.error("AppContext > sights subscription failed:", error);
        setSights([]);
      }
    );

    return () => unsubSights();
  }, []);

  return (
    <AppContext.Provider value={{
      isDarkMode, themePreference, setThemePreference,
      sights, sightsSearchInput, setSightsSearchInput,
      mapTarget, setMapTarget,
    }}>
      {children}
    </AppContext.Provider>
  );
}