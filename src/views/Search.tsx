"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as Select from "@radix-ui/react-select";
import { gamesData, GameData } from "../data/games";
import { normalizeSearchText } from "../utils/search";
import { DesktopOnlyOverlay } from "../components/DesktopOnlyOverlay";
import { GameImage } from "../components/GameImage";
import { PrimaryNav } from "../components/PrimaryNav";
import { useThemeContext } from "../components/ThemeRoot";
import { useDisguise } from "../hooks/useDisguise";
import { useIsMobile } from "../hooks/useIsMobile";
import { useUmamiViews } from "../hooks/useUmamiViews";
import { trackGameView } from "../utils/umami";
import {
  getCombinedCount,
  getGameVisits,
  recordGameVisit,
} from "../utils/visits";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  const aLen = a.length;
  const bLen = b.length;
  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  const prev = new Array(bLen + 1);
  const curr = new Array(bLen + 1);
  for (let j = 0; j <= bLen; j++) prev[j] = j;

  for (let i = 1; i <= aLen; i++) {
    curr[0] = i;
    const aChar = a.charCodeAt(i - 1);
    for (let j = 1; j <= bLen; j++) {
      const cost = aChar === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= bLen; j++) prev[j] = curr[j];
  }

  return prev[bLen];
}

function scoreFuzzy(term: string, candidate: string): number {
  if (!term || !candidate) return 0;
  if (candidate.includes(term)) return 1;
  const distance = levenshteinDistance(term, candidate);
  const maxLen = Math.max(term.length, candidate.length);
  return maxLen === 0 ? 0 : 1 - distance / maxLen;
}

function matchGame(
  normalizedTerm: string,
  game: GameData,
): { match: boolean; score: number } {
  if (!normalizedTerm) return { match: true, score: 1 };
  const normalizedName = game.searchName;
  if (!normalizedName) return { match: false, score: 0 };
  if (normalizedName.includes(normalizedTerm)) {
    return { match: true, score: 1 };
  }

  let bestScore = scoreFuzzy(normalizedTerm, normalizedName);
  for (const token of game.searchTokens) {
    bestScore = Math.max(bestScore, scoreFuzzy(normalizedTerm, token));
  }

  const len = normalizedTerm.length;
  let threshold = 0.55;
  if (len <= 3) threshold = 0.85;
  else if (len <= 5) threshold = 0.72;
  else if (len <= 8) threshold = 0.65;

  return { match: bestScore >= threshold, score: bestScore };
}

export default function SearchPage() {
  const { isDark, toggleTheme } = useThemeContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState<"relevance" | "views">("relevance");
  const [localVisits, setLocalVisits] = useState({});
  const [baseIcon, setBaseIcon] = useState("/img/gams-g.png");
  const { counts: viewCounts } = useUmamiViews();
  const isMobile = useIsMobile();

  useDisguise("Search - LearningArcade", baseIcon);

  useEffect(() => {
    setSearchTerm(searchParams?.get("q") ?? "");
    setLocalVisits(getGameVisits());
    setBaseIcon(
      (document.querySelector('link[rel*="icon"]') as HTMLLinkElement | null)
        ?.href || "/img/gams-g.png",
    );
  }, [searchParams]);

  const results = useMemo(() => {
    const term = searchTerm.trim();
    const normalizedTerm = normalizeSearchText(term);
    if (!term) {
      if (sortMode !== "views") return gamesData;
      return [...gamesData].sort((a, b) => {
        const aCount = getCombinedCount(localVisits, a.id, viewCounts);
        const bCount = getCombinedCount(localVisits, b.id, viewCounts);
        if (bCount !== aCount) return bCount - aCount;
        return b.index - a.index;
      });
    }

    const matches = gamesData
      .map((game) => {
        const { match, score } = matchGame(normalizedTerm, game);
        return match ? { game, score } : null;
      })
      .filter((entry): entry is { game: GameData; score: number } => !!entry);

    if (sortMode === "views") {
      return matches
        .sort((a, b) => {
          const aCount = getCombinedCount(localVisits, a.game.id, viewCounts);
          const bCount = getCombinedCount(localVisits, b.game.id, viewCounts);
          if (bCount !== aCount) return bCount - aCount;
          if (b.score !== a.score) return b.score - a.score;
          return b.game.index - a.game.index;
        })
        .map((entry) => entry.game);
    }

    return matches
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.game.index - a.game.index;
      })
      .map((entry) => entry.game);
  }, [localVisits, searchTerm, sortMode, viewCounts]);

  const openGame = (game: GameData) => {
    const href = new URL(game.href, window.location.origin).href;
    recordGameVisit(game.id, game.name);
    setLocalVisits(getGameVisits());
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
        isDark={isDark}
        onToggleTheme={toggleTheme}
        showHomeLinks={false}
      />

      <main className="ui-container">
        <section className="panel panel-search">
          <div className="panel-header">
            <div>
              <h2 className="panel-heading">Search games</h2>
              <p className="muted">{results.length} results</p>
            </div>
            <div className="search-controls">
              <input
                className="input"
                placeholder="Search all games"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                }}
              />
              <Select.Root
                value={sortMode}
                onValueChange={(value) =>
                  setSortMode(value as "relevance" | "views")
                }
              >
                <Select.Trigger className="select-trigger" aria-label="Sort by">
                  <Select.Value />
                  <Select.Icon className="select-icon">▾</Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="select-content" position="popper">
                    <Select.Viewport className="select-viewport">
                      <Select.Item value="relevance" className="select-item">
                        <Select.ItemText>Relevance</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="views" className="select-item">
                        <Select.ItemText>Views</Select.ItemText>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
              <div className="ui-row">
                <Link className="btn btn-outline" href="/category/all">
                  All games
                </Link>
                <Link className="btn btn-primary" href="/">
                  Back home
                </Link>
              </div>
            </div>
          </div>
        </section>

        {results.length === 0 ? (
          <section className="panel">
            <h3 className="panel-title">No results</h3>
            <p className="muted">Try a different search term.</p>
          </section>
        ) : (
          <div className="tile-grid">
            {results.map((game) => {
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
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
