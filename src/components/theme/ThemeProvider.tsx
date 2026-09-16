"use client";

import { createContext, useContext, useSyncExternalStore, useCallback } from "react";

export type Theme = "nord-forest" | "midnight-oled";

const STORAGE_KEY = "petsquare-theme";
const DEFAULT_THEME: Theme = "nord-forest";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  if (theme === DEFAULT_THEME) {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

function readTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "midnight-oled" ? "midnight-oled" : DEFAULT_THEME;
}

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The blocking inline script in layout.tsx already set the DOM attribute
  // before hydration, so this initial state just needs to agree with it —
  // no flash, no mismatch warning.
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => DEFAULT_THEME);

  const setTheme = useCallback((t: Theme) => {
    applyTheme(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // ignore — theme still applies for this session via DOM attribute
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "nord-forest" ? "midnight-oled" : "nord-forest");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

/** Inline, render-blocking script string — read by layout.tsx and injected
 * directly into <head> so the correct theme applies before first paint,
 * avoiding a flash of the default theme for returning Midnight OLED users. */
export const noFlashThemeScript = `
(function() {
  try {
    var t = localStorage.getItem('${STORAGE_KEY}');
    if (t === 'midnight-oled') {
      document.documentElement.setAttribute('data-theme', 'midnight-oled');
    }
  } catch (e) {}
})();
`;
