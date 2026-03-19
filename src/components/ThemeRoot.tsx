"use client";

import React, { useEffect } from "react";
import { useTheme } from "../hooks/useTheme";
import { hydrateServerStorage } from "../utils/storage";

type ThemeContextValue = {
  isDark: boolean;
  toggleTheme: (nextDark: boolean) => void;
  isHighContrast: boolean;
  toggleContrast: (nextHigh: boolean) => void;
  accent: string;
  setAccentColor: (nextAccent: string) => void;
  resetAccentColor: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function useThemeContext(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within ThemeRoot");
  }
  return context;
}

export function ThemeRoot({ children }: { children: React.ReactNode }) {
  const {
    theme,
    toggleTheme,
    contrast,
    toggleContrast,
    accent,
    setAccentColor,
    resetAccentColor,
  } = useTheme();
  const isDark = theme === "dark";
  const isHighContrast = contrast === "high";

  useEffect(() => {
    hydrateServerStorage();
    const cores =
      typeof navigator !== "undefined"
        ? navigator.hardwareConcurrency
        : undefined;
    if (typeof cores === "number" && cores > 0 && cores < 4) {
      document.documentElement.setAttribute("data-fancy", "off");
    }
  }, []);
  return (
    <ThemeContext.Provider
      value={{
        isDark,
        toggleTheme,
        isHighContrast,
        toggleContrast,
        accent,
        setAccentColor,
        resetAccentColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
