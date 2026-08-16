import { createContext, useState, useEffect } from "react";

export const AppContext = createContext();

export function AppContextProvider({ children }) {
  const [isDarkModeStored, setIsDarkModeStored] = useState(() => {
    const storedIsDarkMode = localStorage.getItem("isDarkMode");
    console.log("AppContext > useState() > storedIsDarkMode:", storedIsDarkMode);
    return storedIsDarkMode;
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return isDarkModeStored === null
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : isDarkModeStored === "true";
  });

  // Change dark mode when the user changes their preference in the OS settings
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setIsDarkMode(e.matches);

    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  return (
    <AppContext.Provider value={{
      isDarkMode, setIsDarkMode,
    }}>
      {children}
    </AppContext.Provider>
  );
}