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

      // F12 - DevTools
      if (e.key === "F12") {
        e.preventDefault();
        return;
      }

      // Ctrl/Cmd + Shift + I - Inspect
      if (e[modKey] && e.shiftKey && key === "i") {
        e.preventDefault();
        return;
      }

      // Ctrl/Cmd + Shift + J - Console
      if (e[modKey] && e.shiftKey && key === "j") {
        e.preventDefault();
        return;
      }

      // Ctrl/Cmd + Shift + C - Inspect Element
      if (e[modKey] && e.shiftKey && key === "c") {
        e.preventDefault();
        return;
      }

      // Ctrl/Cmd + U - View Source
      if (e[modKey] && key === "u") {
        e.preventDefault();
        return;
      }

      // Ctrl/Cmd + S - Save Page
      if (e[modKey] && key === "s") {
        e.preventDefault();
        return;
      }

      // Ctrl/Cmd + Shift + K - Firefox Console
      if (e[modKey] && e.shiftKey && key === "k") {
        e.preventDefault();
        return;
      }
    };

    const detectDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      return widthDiff || heightDiff;
    };

    let devToolsOpen = false;
    const checkInterval = setInterval(() => {
      const isOpen = detectDevTools();
      if (isOpen && !devToolsOpen) {
        devToolsOpen = true;
        document.body.innerHTML = "";
        document.body.style.background = "#000";
        document.body.style.color = "#000";
        document.body.style.userSelect = "none";
        document.body.style.pointerEvents = "none";
      } else if (!isOpen && devToolsOpen) {
        window.location.reload();
      }
    }, 500);

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(checkInterval);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
