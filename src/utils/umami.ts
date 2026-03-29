import { GameData } from "../data/games";
import { getStoredItem } from "./storage";

type UmamiTracker = {
  track?: (event?: string, data?: Record<string, unknown>) => void;
};

type CookieConsent = { settings?: boolean; analytics?: boolean };
type QueuedUmamiEvent =
  | { type: "event"; event: string; data?: Record<string, unknown> }
  | { type: "pageview" };

declare global {
  interface Window {
    umami?: UmamiTracker;
    __umamiQueue?: QueuedUmamiEvent[];
  }
}

const CONSENT_STORAGE_KEY = "gams_cookie_consent_v1";
const UMAMI_SCRIPT_SRC = "https://cloud.umami.is/script.js";
const UMAMI_WEBSITE_ID = "ac0c3422-a178-4ef1-92f3-8d6f875896d0";

function loadCookieConsent(): CookieConsent | null {
  const raw = getStoredItem(CONSENT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    return null;
  }
  return null;
}

function hasAnalyticsConsent(): boolean {
  const consent = loadCookieConsent();
  if (!consent) return true; // Default to all enabled
  return consent.analytics === true;
}

function flushQueuedEvents(): void {
  const tracker = window.umami;
  if (!tracker || typeof tracker.track !== "function") return;
  const queue = window.__umamiQueue;
  if (!queue || queue.length === 0) return;
  window.__umamiQueue = [];
  for (const entry of queue) {
    if (entry.type === "pageview") {
      tracker.track();
    } else {
      tracker.track(entry.event, entry.data);
    }
  }
}

export function ensureUmamiLoaded(): void {
  if (typeof document === "undefined") return;
  if (document.querySelector('script[data-umami="true"]')) return;
  const script = document.createElement("script");
  script.defer = true;
  script.src = UMAMI_SCRIPT_SRC;
  script.dataset.websiteId = UMAMI_WEBSITE_ID;
  script.dataset.umami = "true";
  script.addEventListener("load", () => {
    // Flush any events that fired before the script was ready.
    window.setTimeout(flushQueuedEvents, 0);
  });
  document.head.appendChild(script);
}

export function enableAnalyticsFromConsent(): void {
  if (typeof window === "undefined") return;
  const consent = loadCookieConsent();
  if (consent?.analytics) ensureUmamiLoaded();
}

export function trackGameView(game: GameData): void {
  if (typeof window === "undefined") return;
  const tracker = window.umami;
  if (tracker && typeof tracker.track === "function") {
    tracker.track("game_view", {
      gameId: game.id,
      name: game.name,
      section: game.section,
      category: game.category,
    });
    return;
  }
  if (!hasAnalyticsConsent()) return;
  const queue = window.__umamiQueue ?? [];
  queue.push({
    type: "event",
    event: "game_view",
    data: {
      gameId: game.id,
      name: game.name,
      section: game.section,
      category: game.category,
    },
  });
  window.__umamiQueue = queue;
}

export function trackPageView(): void {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;
  const tracker = window.umami;
  if (tracker && typeof tracker.track === "function") {
    tracker.track();
    return;
  }
  const queue = window.__umamiQueue ?? [];
  queue.push({ type: "pageview" });
  window.__umamiQueue = queue;
}
