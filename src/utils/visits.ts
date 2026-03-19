import { getStoredItem, setStoredItem } from "./storage";

export type GameVisitEntry = { count: number; lastVisit: number; name: string };
export type GameVisits = Record<string, GameVisitEntry>;

const visitsStorageKey = "gams_game_visits";

export function getGameVisits(): GameVisits {
  const raw = getStoredItem(visitsStorageKey);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as GameVisits;
  } catch {
    return {};
  }
}

export function recordGameVisit(gameId: string, gameName: string): void {
  const visits = getGameVisits();
  const now = Date.now();
  if (visits[gameId]) {
    visits[gameId].count++;
    visits[gameId].lastVisit = now;
  } else {
    visits[gameId] = { count: 1, lastVisit: now, name: gameName };
  }

  const allEntries = Object.entries(visits);
  if (allEntries.length > 100) {
    allEntries.sort((a, b) => b[1].lastVisit - a[1].lastVisit);
    const trimmed = Object.fromEntries(allEntries.slice(0, 100));
    setStoredItem(visitsStorageKey, JSON.stringify(trimmed));
  } else {
    setStoredItem(visitsStorageKey, JSON.stringify(visits));
  }
}

export function getVisitCount(visits: GameVisits, gameId: string): number {
  return visits[gameId]?.count ?? 0;
}

export function getCombinedCount(
  visits: GameVisits,
  gameId: string,
  umamiCounts?: Record<string, number>
): number {
  const localCount = getVisitCount(visits, gameId);
  const umamiCount = umamiCounts?.[gameId] ?? 0;
  return localCount + umamiCount;
}
