"use client";

import { useEffect } from "react";

export function AntiInspect() {
  useEffect(() => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const modKey = isMac ? "metaKey" : "ctrlKey";

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (e.key === "F12") {
        e.preventDefault();
        return;
      }

      if (e[modKey] && e.shiftKey && key === "i") {
        e.preventDefault();
        return;
      }

      if (e[modKey] && e.shiftKey && key === "j") {
        e.preventDefault();
        return;
      }

      if (e[modKey] && e.shiftKey && key === "c") {
        e.preventDefault();
        return;
      }

      if (e[modKey] && key === "u") {
        e.preventDefault();
        return;
      }

      if (e[modKey] && key === "s") {
        e.preventDefault();
        return;
      }

      if (e[modKey] && e.shiftKey && key === "k") {
        e.preventDefault();
        return;
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
