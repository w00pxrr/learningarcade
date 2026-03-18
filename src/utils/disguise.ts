import { getStoredJSON } from "./storage";

export function setFavicon(href: string): void {
  if (typeof document === "undefined" || !href) return;
  const existing = document.querySelectorAll('link[rel*="icon"]');
  existing.forEach((favicon) => favicon.remove());
  const link = document.createElement("link");
  link.type = "image/x-icon";
  link.rel = "icon";
  link.href = href;
  document.getElementsByTagName("head")[0]?.appendChild(link);
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
