"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { gamesByCategory, gamesById, gamesData, GameData } from "../data/games";
import { DesktopOnlyOverlay } from "../components/DesktopOnlyOverlay";
import { GameImage } from "../components/GameImage";
import { PrimaryNav } from "../components/PrimaryNav";
import { useThemeContext } from "../components/ThemeRoot";
import { useDisguise } from "../hooks/useDisguise";
import { useIsMobile } from "../hooks/useIsMobile";
import categoryMeta from "../data/categoryMeta.json";
import { useUmamiViews } from "../hooks/useUmamiViews";
import {
  clearCookie,
  getCookie,
  getStoredItem,
  setCookie,
  setStoredItem,
  hydrateServerStorage,
} from "../utils/storage";
import { ensureUmamiLoaded, trackGameView } from "../utils/umami";
import {
  getCombinedCount,
  getGameVisits,
  recordGameVisit,
  type GameVisits,
} from "../utils/visits";
import { useRouter } from "next/navigation";

type CookieConsent = { settings?: boolean; analytics?: boolean };

const consentStorageKey = "gams_cookie_consent_v1";

const categoryLinks = categoryMeta.items
  .filter((item) => {
    if (["all", "favorites", "popular"].includes(item.value)) return true;
    return (gamesByCategory[item.value] ?? []).length > 0;
  })
  .map((item) => ({
    value: item.value,
    label: item.label,
    href: `/category/${item.value}`,
  }));

function loadCookieConsent(): CookieConsent | null {
  const raw = getStoredItem(consentStorageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    return null;
  }
  return null;
}

function saveCookieConsent(consent: CookieConsent): void {
  setStoredItem(consentStorageKey, JSON.stringify(consent));
}

function hasSettingsCookieConsent(consent: CookieConsent | null): boolean {
  return !!(consent && consent.settings === true);
}

function getFavoriteIds(consent: CookieConsent | null): string[] {
  if (!hasSettingsCookieConsent(consent)) return [];
  const raw = getCookie("gams_favorites");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as string[];
  } catch {
    return [];
  }
  return [];
}

function saveFavoriteIds(ids: string[]): void {
  setCookie("gams_favorites", JSON.stringify(ids), 3650);
}

function getLatestGames(): GameData[] {
  const allowedSections = ["HTML5/unity Webgl", "Flash"];
  const filtered = gamesData.filter((g) => allowedSections.includes(g.section));
  const sorted = [...filtered].sort((a, b) => b.index - a.index);
  return sorted.slice(0, 6);
}

function getTopVisitedGamesFromVisits(
  visits: Record<string, { count: number; lastVisit: number; name: string }>,
  limit = 6,
): GameData[] {
  const entries = Object.entries(visits);
  if (entries.length === 0) return getLatestGames();

  entries.sort((a, b) => {
    if (b[1].count !== a[1].count) return b[1].count - a[1].count;
    return b[1].lastVisit - a[1].lastVisit;
  });

  const topGameIds = new Set(entries.slice(0, limit).map((e) => e[0]));
  const recommended: GameData[] = [];
  for (const [gameId] of entries) {
    if (recommended.length >= limit) break;
    const game = gamesById[gameId];
    if (game) recommended.push(game);
  }

  if (recommended.length < limit) {
    const latest = getLatestGames();
    for (const game of latest) {
      if (recommended.length >= limit) break;
      if (!topGameIds.has(game.id)) recommended.push(game);
    }
  }
  return recommended.slice(0, limit);
}

export default function HomePage() {
  const { isDark, toggleTheme } = useThemeContext();
  const router = useRouter();
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [showConsent, setShowConsent] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [localVisits, setLocalVisits] = useState<GameVisits>({});
  const [baseIcon, setBaseIcon] = useState("/img/gams-g.png");
  const isMobile = useIsMobile();

  useDisguise("LearningArcade", baseIcon);

  useEffect(() => {
    hydrateServerStorage();
    const loadedConsent = loadCookieConsent();
    setConsent(loadedConsent);
    setShowConsent(!loadedConsent);
    setFavorites(getFavoriteIds(loadedConsent));
    setLocalVisits(getGameVisits());
    setBaseIcon(
      (document.querySelector('link[rel*="icon"]') as HTMLLinkElement | null)
        ?.href || "/img/gams-g.png",
    );
  }, []);

  useEffect(() => {
    if (consent?.analytics) ensureUmamiLoaded();
    if (consent && !consent.settings) clearCookie("gams_favorites");
    setFavorites(getFavoriteIds(consent));
  }, [consent]);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const canFavorite = hasSettingsCookieConsent(consent);
  const { counts: viewCounts } = useUmamiViews();

  const recommended = useMemo(
    () => getTopVisitedGamesFromVisits(localVisits),
    [localVisits],
  );
  const latest = useMemo(() => getLatestGames(), []);
  const popularGames = useMemo(() => {
    const scored = gamesData.map((game) => {
      const score = getCombinedCount(localVisits, game.id, viewCounts);
      return { game, score };
    });
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.game.index - a.game.index;
    });
    return scored.map((entry) => entry.game);
  }, [localVisits, viewCounts]);
  const favoriteGames = useMemo(
    () => favorites.map((id) => gamesById[id]).filter(Boolean) as GameData[],
    [favorites],
  );
  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    const next = `/search${params.toString() ? `?${params.toString()}` : ""}`;
    router.push(next);
  };

  const toggleFavorite = (gameId: string) => {
    if (!canFavorite) return;
    const next = new Set(favorites);
    if (next.has(gameId)) next.delete(gameId);
    else next.add(gameId);
    const nextList = Array.from(next);
    saveFavoriteIds(nextList);
    setFavorites(nextList);
  };

  const handleOpenGame = (game: GameData) => {
    const href = new URL(game.href, window.location.origin).href;
    const pic = new URL(game.img, window.location.origin).href;
    recordGameVisit(game.id, game.name);
    setLocalVisits(getGameVisits());
    trackGameView(game);

    const gameShellQuery = new URLSearchParams({
      id: game.id,
      icon: pic,
      name: game.name,
      src: href,
    }).toString();
    router.push(`/game-embed?${gameShellQuery}`);
  };

  const renderTiles = (list: GameData[]) => (
    <div className="tile-grid">
      {list.map((game) => {
        const desktopOnly =
          isMobile && (game.desktopOnly || !game.mobileFriendly);
        return (
          <div
            className={`tile-card ${desktopOnly ? "tile-disabled" : ""}`}
            key={game.id}
          >
            <button
              className="tile-action"
              type="button"
              onClick={() => {
                if (!desktopOnly) handleOpenGame(game);
              }}
              disabled={desktopOnly}
            >
              <GameImage
                className="tile-image"
                sources={game.imgCandidates}
                alt={game.name}
              />
              <div className="tile-content">
                <div className="tile-title" title={game.name}>
                  {game.name}
                </div>
              </div>
            </button>
            <DesktopOnlyOverlay visible={desktopOnly} />
            <button
              className="icon-button"
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleFavorite(game.id);
              }}
              disabled={!canFavorite}
              title={
                canFavorite
                  ? "Toggle favorite"
                  : "Enable settings cookies to save favorites"
              }
              aria-label="Toggle favorite"
            >
              {favoriteSet.has(game.id) ? "★" : "☆"}
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="ui-page">
      <PrimaryNav
        isDark={isDark}
        onToggleTheme={toggleTheme}
        showHomeLinks={false}
        categoryLinks={categoryLinks}
        showCategoryBar
      />

      <main className="ui-container ui-container-xl">
        <div className="home-grid">
          <aside className="ui-stack">
            <section className="panel">
              <h3 className="panel-title">Search</h3>
              <form onSubmit={handleSearchSubmit} className="ui-stack">
                <input
                  className="input"
                  placeholder="Search games"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                <div className="ui-row">
                  <button type="submit" className="btn btn-primary">
                    Search
                  </button>
                  <Link className="btn btn-outline" href="/category/all">
                    All games
                  </Link>
                </div>
              </form>
            </section>
            <section className="panel">
              <h3 className="panel-title">Quick stats</h3>
              <div className="chip-row">
                <span className="chip chip-primary">
                  {gamesData.length} games
                </span>
                <span className="chip chip-secondary">
                  {favorites.length} favorites
                </span>
                <span className="chip">School friendly</span>
              </div>
            </section>
            <section className="panel">
              <h3 className="panel-title">Latest drops</h3>
              <div className="ui-stack">
                {latest.slice(0, 3).map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    className="btn btn-outline btn-block btn-sm"
                    onClick={() => handleOpenGame(game)}
                  >
                    <span className="btn-row">
                      <span className="btn-text">{game.name}</span>
                      <span className="chip chip-outline">
                        {getCombinedCount(
                          localVisits,
                          game.id,
                          viewCounts,
                        ).toLocaleString()}{" "}
                        plays
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <section className="ui-stack">
            <section className="panel panel-gradient panel-favorites">
              <h2 className="panel-heading">Your favorites</h2>
              {!canFavorite ? (
                <div className="ui-stack">
                  <p className="muted">
                    Enable settings cookies to save and show favorites here.
                  </p>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowConsent(true)}
                  >
                    Update preferences
                  </button>
                </div>
              ) : favoriteGames.length === 0 ? (
                <div className="ui-stack">
                  <p className="muted">Star games you love to pin them here.</p>
                  <Link className="btn btn-outline" href="/category/all">
                    Browse all games
                  </Link>
                </div>
              ) : (
                <div className="ui-stack">
                  {renderTiles(favoriteGames.slice(0, 8))}
                  {favoriteGames.length > 8 ? (
                    <Link
                      className="btn btn-outline"
                      href="/category/favorites"
                    >
                      View all favorites
                    </Link>
                  ) : null}
                </div>
              )}
            </section>

            <section className="panel panel-gradient panel-recommended">
              <h2 className="panel-heading">Based on your plays</h2>
              <p className="muted">
                Your most-played games, plus a few fresh picks.
              </p>
              {recommended.length > 0 ? renderTiles(recommended) : null}
            </section>

            <section className="panel panel-gradient panel-popular">
              <div className="panel-header">
                <div>
                  <h2 className="panel-heading">Most popular</h2>
                  <p className="muted">Ranked by total plays.</p>
                </div>
                <Link
                  className="btn btn-outline btn-sm"
                  href="/category/popular"
                >
                  More
                </Link>
              </div>
              {popularGames.length > 0
                ? renderTiles(popularGames.slice(0, 12))
                : null}
            </section>
          </section>

          <aside className="ui-stack">
            <section className="panel">
              <h3 className="panel-title">How to play</h3>
              <p className="muted">
                Choose a game, select a launch mode, and start playing. Use
                Embed mode for the cleanest experience.
              </p>
            </section>
            <section className="panel">
              <h3 className="panel-title">Report issues</h3>
              <p className="muted">Find a broken game or bug? Let me know.</p>
              <a
                className="btn btn-outline"
                href="https://github.com/w00pxrr/w00pxrr.github.io"
                rel="noreferrer"
                target="_blank"
              >
                Report a bug
              </a>
            </section>
          </aside>
        </div>
      </main>

      {showConsent ? (
        <div className="consent-panel">
          <div className="consent-card">
            <h3 className="panel-title">Cookie preferences</h3>
            <p className="muted">
              Choose whether to allow analytics cookies and settings cookies.
            </p>
            <div className="ui-row">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={!!consent?.settings}
                  onChange={(event) =>
                    setConsent((prev) => ({
                      ...(prev || {}),
                      settings: event.target.checked,
                    }))
                  }
                />
                <span>Settings cookies</span>
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={!!consent?.analytics}
                  onChange={(event) =>
                    setConsent((prev) => ({
                      ...(prev || {}),
                      analytics: event.target.checked,
                    }))
                  }
                />
                <span>Analytics cookies</span>
              </label>
            </div>
            <div className="ui-row">
              <button
                className="btn btn-primary"
                onClick={() => {
                  const next = { settings: true, analytics: true };
                  saveCookieConsent(next);
                  setConsent(next);
                  setShowConsent(false);
                }}
              >
                Accept all
              </button>
              <button
                className="btn btn-outline"
                onClick={() => {
                  if (consent) saveCookieConsent(consent);
                  setShowConsent(false);
                }}
              >
                Save choices
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  const next = { settings: false, analytics: false };
                  saveCookieConsent(next);
                  setConsent(next);
                  setShowConsent(false);
                }}
              >
                Reject all
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
