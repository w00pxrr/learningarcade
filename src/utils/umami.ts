import { GameData } from "../data/games";

type UmamiTracker = {
  track?: (event: string, data?: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
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
  }
}
