import { useEffect, useState } from "react";
import { getStoredJSON, removeJSON, storeJSON } from "../utils/storage";

type ThemeMode = "light" | "dark";
type ContrastMode = "normal" | "high";
export type ThemePreset =
  | "default"
  | "vscode-dark-plus"
  | "vscode-light-plus"
  | "monokai"
  | "solarized-dark"
  | "solarized-light";

const THEME_PRESETS: ThemePreset[] = [
  "default",
  "vscode-dark-plus",
  "vscode-light-plus",
  "monokai",
  "solarized-dark",
  "solarized-light",
];

const PRESET_MODE: Record<ThemePreset, ThemeMode | "auto"> = {
  default: "auto",
  "vscode-dark-plus": "dark",
  "vscode-light-plus": "light",
  monokai: "dark",
  "solarized-dark": "dark",
  "solarized-light": "light",
};

const isThemePreset = (value: string): value is ThemePreset =>
  THEME_PRESETS.includes(value as ThemePreset);

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [contrast, setContrast] = useState<ContrastMode>("normal");
  const [themePreset, setThemePresetState] = useState<ThemePreset>("default");
  const [accent, setAccent] = useState<string>("#81f0d7");

  const readAccentFromDOM = () => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue("--gams-accent")
      .trim();
    if (/^#([0-9a-f]{3}){1,2}$/i.test(value)) {
      return value;
    }
    return "#81f0d7";
  };

  const applyThemeMode = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  const applyPreset = (nextPreset: ThemePreset) => {
    if (nextPreset === "default") {
      document.documentElement.removeAttribute("data-theme");
      return;
    }
    document.documentElement.setAttribute("data-theme", nextPreset);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-reduced-motion", "true");
    const savedContrast = getStoredJSON<string>("gams", { key: "contrast" });
    if (savedContrast === "high") {
      setContrast("high");
      document.documentElement.setAttribute("data-contrast", "high");
    }
    const savedAccent = getStoredJSON<string>("gams", { key: "accent" });
    if (savedAccent && /^#([0-9a-f]{3}){1,2}$/i.test(savedAccent)) {
      setAccent(savedAccent);
      document.documentElement.style.setProperty("--gams-accent", savedAccent);
    } else {
      setAccent(readAccentFromDOM());
    }
    const savedPreset = getStoredJSON<string>("gams", { key: "themePreset" });
    const resolvedPreset =
      savedPreset && isThemePreset(savedPreset) ? savedPreset : "default";
    setThemePresetState(resolvedPreset);
    applyPreset(resolvedPreset);
    const forcedMode = PRESET_MODE[resolvedPreset];

    const savedTheme = getStoredJSON<string>("gams", { key: "theme" });
    if (forcedMode !== "auto") {
      applyThemeMode(forcedMode);
      return;
    }
    if (savedTheme === "light" || savedTheme === "dark") {
      applyThemeMode(savedTheme);
      return;
    }

    const media = window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;
    if (media) {
      const applyAutoTheme = (isDark: boolean) => {
        const nextTheme: ThemeMode = isDark ? "dark" : "light";
        applyThemeMode(nextTheme);
      };
      applyAutoTheme(media.matches);
      const handler = (event: MediaQueryListEvent) => applyAutoTheme(event.matches);
      media.addEventListener("change", handler);
      return () => {
        media.removeEventListener("change", handler);
      };
    }

    document.documentElement.classList.remove("dark");
  }, []);

  const toggleTheme = (nextDark: boolean) => {
    const nextTheme: ThemeMode = nextDark ? "dark" : "light";
    applyThemeMode(nextTheme);
    storeJSON("gams", { key: "theme", value: nextTheme });
  };

  const toggleContrast = (nextHigh: boolean) => {
    const nextContrast: ContrastMode = nextHigh ? "high" : "normal";
    setContrast(nextContrast);
    if (nextContrast === "high") {
      document.documentElement.setAttribute("data-contrast", "high");
    } else {
      document.documentElement.removeAttribute("data-contrast");
    }
    storeJSON("gams", { key: "contrast", value: nextContrast });
  };

  const setAccentColor = (nextAccent: string) => {
    if (!/^#([0-9a-f]{3}){1,2}$/i.test(nextAccent)) return;
    setAccent(nextAccent);
    document.documentElement.style.setProperty("--gams-accent", nextAccent);
    storeJSON("gams", { key: "accent", value: nextAccent });
  };

  const resetAccentColor = () => {
    removeJSON("gams", { key: "accent" });
    document.documentElement.style.removeProperty("--gams-accent");
    setAccent(readAccentFromDOM());
  };

  const setThemePreset = (nextPreset: ThemePreset) => {
    setThemePresetState(nextPreset);
    applyPreset(nextPreset);
    storeJSON("gams", { key: "themePreset", value: nextPreset });
    const forcedMode = PRESET_MODE[nextPreset];
    if (forcedMode !== "auto") {
      applyThemeMode(forcedMode);
      storeJSON("gams", { key: "theme", value: forcedMode });
    }
  };

  return {
    theme,
    toggleTheme,
    contrast,
    toggleContrast,
    themePreset,
    setThemePreset,
    accent,
    setAccentColor,
    resetAccentColor,
  };
}
