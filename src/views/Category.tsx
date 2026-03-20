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
      <main className="ui-container">
        <section className="panel panel-header">
          <div>
            <h2 className="panel-heading">{label} Games</h2>
            <p className="muted">{filtered.length} games available.</p>
          </div>
          <Link className="btn btn-outline" href="/">
            Back to home
          </Link>
        </section>

        <div className="tile-grid">
          {filtered.map((game) => {
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
                    if (!desktopOnly) openGame(game);
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
                  {favoriteIds.has(game.id) ? "★" : "☆"}
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
