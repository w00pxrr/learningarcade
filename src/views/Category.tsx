"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { gamesByCategory, gamesData, GameData } from "../data/games";
import { DesktopOnlyOverlay } from "../components/DesktopOnlyOverlay";
import { PrimaryNav } from "../components/PrimaryNav";
import { useDisguise } from "../hooks/useDisguise";
import { useIsMobile } from "../hooks/useIsMobile";
import { useUmamiViews } from "../hooks/useUmamiViews";
import { trackGameView } from "../utils/umami";
import { getCookie, getStoredItem } from "../utils/storage";
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

  useDisguise(`${label} - LearningArcade`, baseIcon);

  useEffect(() => {
    setMounted(true);
    setLocalVisits(getGameVisits());
    setBaseIcon(
      (document.querySelector('link[rel*="icon"]') as HTMLLinkElement | null)
        ?.href || "/img/gams-g.png",
    );
    const raw = getStoredItem(consentStorageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { settings?: boolean };
        if (parsed?.settings === true) {
          const favRaw = getCookie("gams_favorites");
          if (favRaw) {
            const parsedFavs = JSON.parse(favRaw) as unknown;
            if (Array.isArray(parsedFavs)) {
              setFavoriteIds(new Set(parsedFavs as string[]));
            }
          }
        }
      } catch {}
    }
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
  }, [category, localVisits, viewCounts]);

  const openGame = (game: GameData) => {
    const href = new URL(game.href, window.location.href).href;
    recordGameVisit(game.id, game.name);
    trackGameView(game);
    router.push(
      `/game-embed?${new URLSearchParams({
        icon: new URL(game.img, window.location.href).href,
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
              <div className={`tile-card ${desktopOnly ? "tile-disabled" : ""}`} key={game.id}>
                <button
                  className="tile-action"
                  type="button"
                  onClick={() => {
                    if (!desktopOnly) openGame(game);
                  }}
                  disabled={desktopOnly}
                >
                  <img className="tile-image" src={game.img} alt={game.name} />
                  <div className="tile-content">
                    <div className="tile-title" title={game.name}>
                      {game.name}
                    </div>
                  </div>
                </button>
                <DesktopOnlyOverlay visible={desktopOnly} />
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
