import { useEffect, useState } from "react";
import { getStoredJSON, storeJSON } from "../utils/storage";

type ThemeMode = "light" | "dark";
type ContrastMode = "normal" | "high";

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [contrast, setContrast] = useState<ContrastMode>("normal");

  useEffect(() => {
    document.documentElement.setAttribute("data-reduced-motion", "true");
    const savedContrast = getStoredJSON<string>("gams", { key: "contrast" });
    if (savedContrast === "high") {
      setContrast("high");
      document.documentElement.setAttribute("data-contrast", "high");
    }
    const savedTheme = getStoredJSON<string>("gams", { key: "theme" });
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
      return;
    }

    const media = window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;
    if (media) {
      const applyAutoTheme = (isDark: boolean) => {
        const nextTheme: ThemeMode = isDark ? "dark" : "light";
        setTheme(nextTheme);
        document.documentElement.classList.toggle("dark", isDark);
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
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextDark);
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

  return { theme, toggleTheme, contrast, toggleContrast };
}
