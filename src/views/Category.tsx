"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { gamesByCategory, gamesData, GameData } from "../data/games";
import { DesktopOnlyOverlay } from "../components/DesktopOnlyOverlay";
import { PrimaryNav } from "../components/PrimaryNav";
import { GameImage } from "../components/GameImage";
import { useDisguise } from "../hooks/useDisguise";
import { useIsMobile } from "../hooks/useIsMobile";
import { useUmamiViews } from "../hooks/useUmamiViews";
import { trackGameView } from "../utils/umami";
import { getCookie, getStoredItem, setCookie } from "../utils/storage";
import categoryMeta from "../data/categoryMeta.json";
import {
  getCombinedCount,
  getGameVisits,
  recordGameVisit,
} from "../utils/visits";
import { useParams, useRouter } from "next/navigation";

const categoryLabels = Object.fromEntries(
  categoryMeta.items.map((item) => [item.value, item.label]),
) as Record<string, string>;

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

function hasSettingsCookieConsent(): boolean {
  const raw = getStoredItem(consentStorageKey);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as { settings?: boolean };
    return parsed?.settings === true;
  } catch {
    return false;
  }
}

function getFavoriteIds(): string[] {
  if (!hasSettingsCookieConsent()) return [];
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

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const rawCategory = typeof params?.slug === "string" ? params.slug : "all";
  const category = rawCategory || "all";
  const [localVisits, setLocalVisits] = useState({});
  const [baseIcon, setBaseIcon] = useState("/img/gams-g.png");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const label = categoryLabels[category] || category;
  const isMobile = useIsMobile();
  const { counts: viewCounts } = useUmamiViews();
  const canFavorite = hasSettingsCookieConsent();

  useDisguise(`${label} - LearningArcade`, baseIcon);

  useEffect(() => {
    setMounted(true);
    setLocalVisits(getGameVisits());
    setBaseIcon(
      (document.querySelector('link[rel*="icon"]') as HTMLLinkElement | null)
        ?.href || "/img/gams-g.png",
    );
    setFavoriteIds(new Set(getFavoriteIds()));
  }, []);

  const filtered = useMemo(() => {
    if (category === "favorites") {
      return gamesData.filter((g) => favoriteIds.has(g.id));
    }
    if (category === "all") return gamesData;
    if (category === "popular") {
      const scored = gamesData.map((game) => {
        const score = getCombinedCount(localVisits, game.id, viewCounts);
        return { game, score };
      });
      scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.game.index - a.game.index;
      });
      return scored.map((entry) => entry.game);
    }
    return gamesByCategory[category] ?? [];
  }, [category, favoriteIds, localVisits, viewCounts]);

  const toggleFavorite = (gameId: string) => {
    if (!canFavorite) return;
    const next = new Set(favoriteIds);
    if (next.has(gameId)) next.delete(gameId);
    else next.add(gameId);
    const nextList = Array.from(next);
    saveFavoriteIds(nextList);
    setFavoriteIds(next);
  };

  const openGame = (game: GameData) => {
    const href = new URL(game.href, window.location.origin).href;
    recordGameVisit(game.id, game.name);
    trackGameView(game);
    router.push(
      `/game-embed?${new URLSearchParams({
        id: game.id,
        icon: new URL(game.img, window.location.origin).href,
        name: game.name,
        src: href,
      }).toString()}`,
    );
  };

  return (
    <div className="ui-page">
      <PrimaryNav
        categoryLinks={categoryLinks}
        activeCategory={category}
        showCategoryBar
      />
      <main className="main-container">
        {/* Header Section */}
        <section className="section animate-fade-in">
          <div className="section-header">
            <div>
              <h1 className="section-title">
                <span className="section-title-icon">🎮</span>
                {label} Games
              </h1>
              <p className="section-subtitle">{filtered.length} games available</p>
            </div>
            <Link className="btn btn-outline" href="/">
              ← Back to Home
            </Link>
          </div>
        </section>

        {/* Games Grid */}
        <section className="section">
          <div className="games-grid">
            {filtered.map((game) => {
              const desktopOnly =
                isMobile && (game.desktopOnly || !game.mobileFriendly);
              return (
                <div
                  className={`game-card ${desktopOnly ? "tile-disabled" : ""}`}
                  key={game.id}
                >
                  <button
                    className="tile-action"
                    type="button"
                    onClick={() => {
                      if (!desktopOnly) openGame(game);
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
                    {favoriteIds.has(game.id) ? "★" : "☆"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Empty State */}
        {filtered.length === 0 && (
          <section className="section">
            <div className="panel" style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🎮</div>
              <h3 className="panel-heading">No games found</h3>
              <p className="muted" style={{ marginBottom: "24px" }}>
                {category === "favorites"
                  ? "You haven't starred any games yet. Browse games and star your favorites!"
                  : "No games available in this category."}
              </p>
              <Link href="/category/all" className="btn btn-primary">
                Browse All Games
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
