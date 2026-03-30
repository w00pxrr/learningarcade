"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gamesById } from "../../../data/games";
import { PrimaryNav } from "../../../components/PrimaryNav";
import { GameImage } from "../../../components/GameImage";
import { useThemeContext } from "../../../components/ThemeRoot";
import { useDisguise } from "../../../hooks/useDisguise";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { DesktopOnlyOverlay } from "../../../components/DesktopOnlyOverlay";
import { recordGameVisit } from "../../../utils/visits";
import { trackGameView } from "../../../utils/umami";
import categoryMeta from "../../../data/categoryMeta.json";
import { gamesByCategory } from "../../../data/games";

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

interface Props {
  gameId: string;
}

export default function ClientGamePage({ gameId }: Props) {
  const router = useRouter();
  const { isDark, toggleTheme } = useThemeContext();
  const [baseIcon, setBaseIcon] = useState("/img/gams-g.png");
  const isMobile = useIsMobile();
  const game = gamesById[gameId];

  useDisguise(game ? `${game.name} - LearningArcade` : "LearningArcade", baseIcon);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing favicon from DOM on mount
    setBaseIcon(
      (document.querySelector('link[rel*="icon"]') as HTMLLinkElement | null)?.href ||
        "/img/gams-g.png",
    );
  }, []);

  // Prefetch game embed on mount for faster navigation
  useEffect(() => {
    if (!game) return;
    const href = new URL(game.href, window.location.origin).href;
    const gameShellQuery = new URLSearchParams({
      id: game.id,
      icon: new URL(game.img, window.location.origin).href,
      name: game.name,
      src: href,
    }).toString();
    router.prefetch(`/game-embed?${gameShellQuery}`);
  }, [game, router]);

  if (!game) {
    return (
      <div className="ui-page">
        <PrimaryNav
          isDark={isDark}
          onToggleTheme={toggleTheme}
          categoryLinks={categoryLinks}
          showCategoryBar
        />
        <main className="ui-container">
          <section className="panel">
            <h2 className="panel-heading">Game Not Found</h2>
            <p className="muted">The requested game could not be found.</p>
            <Link className="btn btn-primary" href="/">
              Back to Home
            </Link>
          </section>
        </main>
      </div>
    );
  }

  const desktopOnly = isMobile && (game.desktopOnly || !game.mobileFriendly);

  const handlePlayGame = () => {
    const href = new URL(game.href, window.location.origin).href;
    const pic = new URL(game.img, window.location.origin).href;
    recordGameVisit(game.id, game.name);
    trackGameView(game);

    const gameShellQuery = new URLSearchParams({
      id: game.id,
      icon: pic,
      name: game.name,
      src: href,
    }).toString();
    router.push(`/game-embed?${gameShellQuery}`);
  };

  // Generate structured data for the game
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.name,
    description: `Play ${game.name} online for free on LearningArcade. ${game.categories.join(", ")} game. Safe, school-friendly, and works on any device.`,
    url: `https://learningarcade.vercel.app/game/${game.id}`,
    image: `https://learningarcade.vercel.app${game.img}`,
    genre: game.categories,
    gamePlatform: "Web Browser",
    applicationCategory: "Game",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      ratingCount: "100",
    },
  };

  return (
    <div className="ui-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PrimaryNav
        isDark={isDark}
        onToggleTheme={toggleTheme}
        categoryLinks={categoryLinks}
        showCategoryBar
      />
      <main className="ui-container">
        <section className="panel panel-header">
          <div>
            <h1 className="panel-heading">{game.name}</h1>
            <p className="muted">
              Play {game.name} online for free on LearningArcade. {game.categories.join(", ")} game.
            </p>
          </div>
          <Link className="btn btn-outline" href="/">
            Back to Home
          </Link>
        </section>

        <div className="game-detail-grid">
          <section className="panel">
            <div className="game-detail-image">
              <GameImage
                className="tile-image-large"
                sources={game.imgCandidates}
                alt={game.name}
              />
            </div>
            <div className="game-detail-actions">
              <button
                className="btn btn-primary btn-lg"
                onClick={handlePlayGame}
                disabled={desktopOnly}
              >
                {desktopOnly ? "Desktop Only" : "Play Now"}
              </button>
              <DesktopOnlyOverlay visible={desktopOnly} />
            </div>
          </section>

          <aside className="ui-stack">
            <section className="panel">
              <h3 className="panel-title">Game Info</h3>
              <div className="game-info-list">
                <div className="game-info-item">
                  <span className="game-info-label">Category</span>
                  <span className="game-info-value">{game.categories.join(", ")}</span>
                </div>
                <div className="game-info-item">
                  <span className="game-info-label">Type</span>
                  <span className="game-info-value">{game.section}</span>
                </div>
                <div className="game-info-item">
                  <span className="game-info-label">Mobile Friendly</span>
                  <span className="game-info-value">{game.mobileFriendly ? "Yes" : "No"}</span>
                </div>
              </div>
            </section>

            <section className="panel">
              <h3 className="panel-title">How to Play</h3>
              <p className="muted">
                Click the &quot;Play Now&quot; button to start playing {game.name}. The game will
                open in an embedded player for the best experience.
              </p>
            </section>

            <section className="panel">
              <h3 className="panel-title">About {game.name}</h3>
              <p className="muted">
                {game.name} is a free online {game.categories[0]} game available on LearningArcade.
                Play it directly in your browser without any downloads. Safe and school-friendly!
              </p>
            </section>
          </aside>
        </div>

        <section className="panel">
          <h3 className="panel-title">More Games</h3>
          <div className="ui-row">
            <Link className="btn btn-outline" href={`/category/${game.category}`}>
              More {game.category} games
            </Link>
            <Link className="btn btn-outline" href="/category/all">
              Browse all games
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
