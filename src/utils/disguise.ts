import { getStoredJSON } from "./storage";

export function setFavicon(href: string): void {
  if (typeof document === "undefined" || !href) return;
  const head = document.head || document.getElementsByTagName("head")[0];
  if (!head) return;
  const existing = document.getElementById("gams-favicon") as
    | HTMLLinkElement
    | null;
  if (existing) {
    existing.href = href;
    return;
  }
  const link = document.createElement("link");
  link.id = "gams-favicon";
  link.type = "image/x-icon";
  link.rel = "icon";
  link.href = href;
  head.appendChild(link);
}

export function applyDisguise(baseTitle: string, baseIcon: string): void {
  if (typeof document === "undefined") return;
  const icon = getStoredJSON<string>("gams", { key: "icon" });
  const title = getStoredJSON<string>("gams", { key: "title" });
  const nextTitle = title ?? baseTitle;
  document.title = nextTitle;
  const titleEl = document.querySelector("title");
  if (titleEl) titleEl.textContent = nextTitle;
  setFavicon(icon ?? baseIcon);
}

export function getBroadcastDisguise(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  try {
    return new BroadcastChannel("BroadcastDisguise");
  } catch {
    return null;
  }
}
