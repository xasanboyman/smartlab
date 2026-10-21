import { useState, useEffect, useCallback } from "react";

const STORAGE_KEYS = ["simulink_theme", "smartlab_theme", "zperiod_theme"];

export const getStoredTheme = () => {
  try {
    for (const k of STORAGE_KEYS) {
      const val = localStorage.getItem(k);
      if (val === "dark" || val === "light") return val;
    }
    return "dark"; // Default is dark
  } catch {
    return "dark";
  }
};

export const applyThemeToDom = (theme) => {
  const isDark = theme === "dark";
  const root = document.documentElement;
  const body = document.body;

  root.setAttribute("data-theme", theme);
  root.classList.toggle("dark", isDark);
  root.classList.toggle("dark-theme", isDark);
  root.classList.toggle("light-theme", !isDark);

  if (body) {
    body.setAttribute("data-theme", theme);
    body.classList.toggle("dark", isDark);
    body.classList.toggle("dark-theme", isDark);
    body.classList.toggle("light-theme", !isDark);
  }

  try {
    for (const k of STORAGE_KEYS) {
      localStorage.setItem(k, theme);
    }
  } catch {
    // Ignore storage quota or access errors
  }
};

export function useAppTheme() {
  const [theme, setThemeState] = useState(getStoredTheme);

  const setTheme = useCallback((nextTheme) => {
    const val = nextTheme === "light" ? "light" : "dark";
    setThemeState(val);
    applyThemeToDom(val);
    window.dispatchEvent(new CustomEvent("simulink_theme_change", { detail: val }));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  useEffect(() => {
    applyThemeToDom(theme);

    const onThemeChange = (e) => {
      const next = e.detail;
      if (next === "dark" || next === "light") {
        setThemeState(next);
        applyThemeToDom(next);
      }
    };

    const onStorage = (e) => {
      if (STORAGE_KEYS.includes(e.key) && (e.newValue === "dark" || e.newValue === "light")) {
        setThemeState(e.newValue);
        applyThemeToDom(e.newValue);
      }
    };

    window.addEventListener("simulink_theme_change", onThemeChange);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("simulink_theme_change", onThemeChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [theme]);

  return { theme, isDark: theme === "dark", setTheme, toggleTheme };
}
