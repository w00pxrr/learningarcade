"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
} from "../components/ui";
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
import { getCombinedCount, getGameVisits, recordGameVisit } from "../utils/visits";
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

function matchGame(normalizedTerm: string, game: GameData): { match: boolean; score: number } {
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
  const _pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams?.get("q") ?? "");
  const [sortMode, setSortMode] = useState<"relevance" | "views">("relevance");
  const [localVisits, setLocalVisits] = useState(getGameVisits);
  const [baseIcon, _setBaseIcon] = useState(() => {
    if (typeof window === "undefined") return "/icons/favicon.ico";
    return (
      (document.querySelector('link[rel*="icon"]') as HTMLLinkElement | null)?.href ||
      "/icons/favicon.ico"
    );
  });
  const { counts: viewCounts } = useUmamiViews();
  const isMobile = useIsMobile();

  useDisguise("Search - LearningArcade", baseIcon);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from URL search params
    setSearchTerm(searchParams?.get("q") ?? "");
    setLocalVisits(getGameVisits());
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

  const prefetchGame = (game: GameData) => {
    const href = new URL(game.href, window.location.origin).href;
    router.prefetch(
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
      <PrimaryNav showHomeLinks={false} />

      <main className="main-container">
        {/* Search Header */}
        <section className="section animate-fade-in">
          <div className="section-header">
            <div>
              <h1 className="section-title">
                <span className="section-title-icon">🔍</span>
                Search Games
              </h1>
              <p className="section-subtitle">{results.length} results found</p>
            </div>
            <Link className="btn btn-outline" href="/">
              ← Back to Home
            </Link>
          </div>
        </section>

        {/* Search Controls */}
        <section className="section">
          <div className="panel">
            <div
              style={{
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div className="search-container" style={{ flex: 1, minWidth: "250px" }}>
                <span className="search-icon">🔍</span>
                <input
                  className="search-input"
                  placeholder="Search all games..."
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                  }}
                />
              </div>
              <Select
                value={sortMode}
                onValueChange={(value: string) => setSortMode(value as "relevance" | "views")}
              >
                <SelectTrigger
                  className="select-trigger"
                  aria-label="Sort by"
                  style={{
                    padding: "12px 20px",
                    background: "var(--cg-bg-card)",
                    border: "2px solid var(--cg-border-color)",
                    borderRadius: "50px",
                    color: "var(--cg-text-primary)",
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    minWidth: "150px",
                  }}
                >
                  <SelectValue />
                  <SelectIcon className="select-icon">▾</SelectIcon>
                </SelectTrigger>
                <SelectContent
                  className="select-content"
                  position="popper"
                  style={{
                    background: "var(--cg-bg-card)",
                    border: "1px solid var(--cg-border-color)",
                    borderRadius: "12px",
                    padding: "8px",
                    boxShadow: "var(--cg-shadow-card)",
                  }}
                >
                  <SelectViewport className="select-viewport">
                    <SelectItem
                      value="relevance"
                      className="select-item"
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        color: "var(--cg-text-secondary)",
                      }}
                    >
                      <SelectItemText>Relevance</SelectItemText>
                    </SelectItem>
                    <SelectItem
                      value="views"
                      className="select-item"
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        color: "var(--cg-text-secondary)",
                      }}
                    >
                      <SelectItemText>Views</SelectItemText>
                    </SelectItem>
                  </SelectViewport>
                </SelectContent>
              </Select>
              <Link className="btn btn-primary" href="/category/all">
                All Games
              </Link>
            </div>
          </div>
        </section>

        {/* Search Results */}
        {results.length === 0 ? (
          <section className="section">
            <div className="panel" style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
              <h3 className="panel-heading">No results found</h3>
              <p className="muted" style={{ marginBottom: "24px" }}>
                Try a different search term or browse all games.
              </p>
              <Link href="/category/all" className="btn btn-primary">
                Browse All Games
              </Link>
            </div>
          </section>
        ) : (
          <section className="section">
            <div className="games-grid">
              {results.map((game) => {
                const desktopOnly = isMobile && (game.desktopOnly || !game.mobileFriendly);
                return (
                  <div className={`game-card ${desktopOnly ? "tile-disabled" : ""}`} key={game.id}>
                    <button
                      className="tile-action"
                      type="button"
                      onClick={() => {
                        if (!desktopOnly) openGame(game);
                      }}
                      onMouseEnter={() => prefetchGame(game)}
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
                        <div className="game-card-category">{game.category || "Game"}</div>
                      </div>
                    </button>
                    <DesktopOnlyOverlay visible={desktopOnly} />
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
