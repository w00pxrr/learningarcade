import { useEffect, useState } from "react";

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer: coarse), (max-width: 900px)").matches;
  });

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse), (max-width: 900px)");
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }

    media.addListener(handler);
    return () => media.removeListener(handler);
  }, []);

  return isMobile;
}
