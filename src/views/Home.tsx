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

// Category filter buttons for the main page
const categoryFilters = [
  { value: "all", label: "All Games", icon: "🎮" },
  { value: "action", label: "Action", icon: "⚔️" },
  { value: "adventure", label: "Adventure", icon: "🗺️" },
  { value: "puzzle", label: "Puzzle", icon: "🧩" },
  { value: "sports", label: "Sports", icon: "⚽" },
  { value: "racing", label: "Racing", icon: "🏎️" },
  { value: "strategy", label: "Strategy", icon: "♟️" },
  { value: "simulation", label: "Simulation", icon: "🎯" },
];

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

// Game Card Component with hover effects
function GameCard({ 
  game, 
  onOpenGame, 
  onToggleFavorite, 
  canFavorite, 
  isFavorite,
  badge,
  isMobile
}: {
  game: GameData;
  onOpenGame: (game: GameData) => void;
  onToggleFavorite: (gameId: string) => void;
  canFavorite: boolean;
  isFavorite: boolean;
  badge?: "new" | "trending" | "featured";
  isMobile: boolean;
}) {
  const desktopOnly = isMobile && (game.desktopOnly || !game.mobileFriendly);

  return (
    <div className={`game-card ${desktopOnly ? "tile-disabled" : ""}`}>
      {badge && (
        <span className={`game-card-badge ${badge}`}>
          {badge === "new" ? "NEW" : badge === "trending" ? "TRENDING" : "FEATURED"}
        </span>
      )}
      <button
        className="tile-action"
        type="button"
        onClick={() => {
          if (!desktopOnly) onOpenGame(game);
        }}
        disabled={desktopOnly}
      >
        <div className="game-card-image-container">
          <GameImage
            className="game-card-image"
            sources={game.imgCandidates}
            alt={game.name}
          />
          <div className="game-card-overlay">
            <div className="play-button">▶</div>
          </div>
        </div>
        <div className="game-card-content">
          <div className="game-card-title" title={game.name}>
            {game.name}
          </div>
          <div className="game-card-category">
            {game.category || "Game"}
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
          onToggleFavorite(game.id);
        }}
        disabled={!canFavorite}
        title={
          canFavorite
            ? "Toggle favorite"
            : "Enable settings cookies to save favorites"
        }
        aria-label="Toggle favorite"
      >
        {isFavorite ? "★" : "☆"}
      </button>
    </div>
  );
}

// Section Component
function GameSection({
  title,
  subtitle,
  icon,
  games,
  badge,
  viewAllLink,
  viewAllText,
  onOpenGame,
  onToggleFavorite,
  canFavorite,
  favoriteSet,
  isMobile,
}: {
  title: string;
  subtitle?: string;
  icon: string;
  games: GameData[];
  badge?: "new" | "trending" | "featured";
  viewAllLink?: string;
  viewAllText?: string;
  onOpenGame: (game: GameData) => void;
  onToggleFavorite: (gameId: string) => void;
  canFavorite: boolean;
  favoriteSet: Set<string>;
  isMobile: boolean;
}) {
  if (games.length === 0) return null;

  return (
    <section className="section animate-fade-in">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <span className="section-title-icon">{icon}</span>
            {title}
          </h2>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
        {viewAllLink && (
          <Link href={viewAllLink} className="section-link">
            {viewAllText || "View All"}
          </Link>
        )}
      </div>
      <div className="games-grid">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onOpenGame={onOpenGame}
            onToggleFavorite={onToggleFavorite}
            canFavorite={canFavorite}
            isFavorite={favoriteSet.has(game.id)}
            badge={badge}
            isMobile={isMobile}
          />
        ))}
      </div>
    </section>
  );
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
  const [activeCategory, setActiveCategory] = useState("all");
  const isMobile = useIsMobile();

  useDisguise("LearningArcde", baseIcon);

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

  // Filter games by category
  const filteredGames = useMemo(() => {
    if (activeCategory === "all") return gamesData;
    return gamesData.filter((game) => 
      game.category?.toLowerCase() === activeCategory.toLowerCase()
    );
  }, [activeCategory]);

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

  return (
    <div className="ui-page">
      <PrimaryNav
        isDark={isDark}
        onToggleTheme={toggleTheme}
        showHomeLinks={false}
        categoryLinks={categoryLinks}
        showCategoryBar
      />

      <main className="main-container">
        {/* Hero Section */}
        <section className="hero animate-fade-in">
          <div className="hero-content">
            <h1 className="hero-title">Play Free Online Games</h1>
            <p className="hero-subtitle">
              Discover thousands of free games. Action, adventure, puzzle, and more!
            </p>
            <div className="hero-search">
              <form onSubmit={handleSearchSubmit} className="search-container">
                <span className="search-icon">🔍</span>
                <input
                  className="search-input"
                  placeholder="Search games..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </form>
            </div>
            <div className="stats-bar">
              <div className="stat-item">
                <div className="stat-value">{gamesData.length}+</div>
                <div className="stat-label">Games</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">100%</div>
                <div className="stat-label">Free</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">24/7</div>
                <div className="stat-label">Available</div>
              </div>
            </div>
          </div>
        </section>

        {/* Category Filters */}
        <section className="section">
          <div className="category-filters">
            {categoryFilters.map((cat) => (
              <button
                key={cat.value}
                className={`category-btn ${activeCategory === cat.value ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.value)}
              >
                <span style={{ marginRight: "6px" }}>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* Featured Games */}
        <GameSection
          title="Featured Games"
          subtitle="Hand-picked games you'll love"
          icon="⭐"
          games={recommended.slice(0, 6)}
          badge="featured"
          viewAllLink="/category/popular"
          viewAllText="View All"
          onOpenGame={handleOpenGame}
          onToggleFavorite={toggleFavorite}
          canFavorite={canFavorite}
          favoriteSet={favoriteSet}
          isMobile={isMobile}
        />

        {/* Trending Games */}
        <GameSection
          title="Trending Now"
          subtitle="Most popular games this week"
          icon="🔥"
          games={popularGames.slice(0, 6)}
          badge="trending"
          viewAllLink="/category/popular"
          viewAllText="View All"
          onOpenGame={handleOpenGame}
          onToggleFavorite={toggleFavorite}
          canFavorite={canFavorite}
          favoriteSet={favoriteSet}
          isMobile={isMobile}
        />

        {/* New Releases */}
        <GameSection
          title="New Releases"
          subtitle="Fresh games just added"
          icon="🆕"
          games={latest}
          badge="new"
          onOpenGame={handleOpenGame}
          onToggleFavorite={toggleFavorite}
          canFavorite={canFavorite}
          favoriteSet={favoriteSet}
          isMobile={isMobile}
        />

        {/* All Games / Filtered Games */}
        {activeCategory !== "all" && (
          <GameSection
            title={`${categoryFilters.find(c => c.value === activeCategory)?.label || "Games"}`}
            subtitle={`Browse all ${activeCategory} games`}
            icon="🎮"
            games={filteredGames.slice(0, 12)}
            onOpenGame={handleOpenGame}
            onToggleFavorite={toggleFavorite}
            canFavorite={canFavorite}
            favoriteSet={favoriteSet}
            isMobile={isMobile}
          />
        )}

        {/* Favorites Section */}
        {canFavorite && favoriteGames.length > 0 && (
          <GameSection
            title="Your Favorites"
            subtitle="Games you've starred"
            icon="❤️"
            games={favoriteGames.slice(0, 6)}
            viewAllLink="/category/favorites"
            viewAllText="View All"
            onOpenGame={handleOpenGame}
            onToggleFavorite={toggleFavorite}
            canFavorite={canFavorite}
            favoriteSet={favoriteSet}
            isMobile={isMobile}
          />
        )}

        {/* Quick Actions */}
        <section className="section">
          <div className="section-header">
            <div>
              <h2 className="section-title">
                <span className="section-title-icon">🚀</span>
                Quick Actions
              </h2>
            </div>
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <Link href="/category/all" className="btn btn-primary">
              Browse All Games
            </Link>
            <Link href="/category/popular" className="btn btn-secondary">
              Most Popular
            </Link>
            <Link href="/about" className="btn btn-outline">
              About Us
            </Link>
          </div>
        </section>
      </main>

      {/* Cookie Consent */}
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
