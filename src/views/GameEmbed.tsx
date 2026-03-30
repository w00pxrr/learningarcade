"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../components/ui";
import { PrimaryNav } from "../components/PrimaryNav";
import { gamesById, gamesData } from "../data/games";
import { useDisguise } from "../hooks/useDisguise";
import filterControls from "../data/gameEmbedFilters.json";
import { useSearchParams } from "next/navigation";

const GameSettingsDialog = dynamic(
  () => import("../components/GameSettingsDialog"),
  { loading: () => null },
);

const MobileControls = dynamic(() => import("../components/MobileControls"), {
  loading: () => null,
});

type FilterState = {
  brightness: number;
  contrast: number;
  hue: number;
  blur: number;
  saturate: number;
  grayscale: number;
  sepia: number;
  invert: number;
  opacity: number;
  dropShadow: number;
};

const defaultFilters: FilterState = {
  brightness: 100,
  contrast: 100,
  hue: 0,
  blur: 0,
  saturate: 100,
  grayscale: 0,
  sepia: 0,
  invert: 0,
  opacity: 1,
  dropShadow: 0,
};

const typedFilterControls = filterControls as Array<{
  label: string;
  key: keyof FilterState;
  min: number;
  max: number;
  step: number;
}>;

function resolveUrl(rawUrl?: string | null) {
  if (!rawUrl) return "";
  try {
    return new URL(rawUrl, window.location.origin).href;
  } catch {
    return rawUrl;
  }
}

// Loading skeleton component for the iframe
function GameLoadingSkeleton() {
  return (
    <div className="game-loading-skeleton">
      <div className="skeleton-spinner"></div>
      <p>Loading game...</p>
    </div>
  );
}

export default function GameEmbedPage() {
  const searchParams = useSearchParams();
  const [gameId, setGameId] = useState<string | null>(null);
  const [currentName, setCurrentName] = useState("Game");
  const [currentIcon, setCurrentIcon] = useState("/img/gams-g.png");
  const [frameSrc, setFrameSrc] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [windowLock, setWindowLock] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);

  useDisguise(currentName, currentIcon);

  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString());
    const nextId = params.get("id");
    const nextName = params.get("name") || "Game";
    const nextIcon = resolveUrl(params.get("icon")) || "/img/gams-g.png";
    const nextSrc = resolveUrl(params.get("src"));
    setGameId(nextId);
    setCurrentName(nextName);
    setCurrentIcon(nextIcon);
    setFrameSrc(nextSrc || null);
    // Track load start time for performance monitoring
    if (nextSrc) {
      setLoadStartTime(performance.now());
      setIsIframeLoaded(false);

      // Inject preconnect/prefetch for external origins to warm DNS+connection
      // before the iframe starts loading (critical for Chromebook perf)
      try {
        const origin = new URL(nextSrc).origin;
        if (origin !== window.location.origin) {
          const head = document.head;
          const addLink = (
            rel: string,
            href: string,
            attrs?: Record<string, string>,
          ) => {
            if (head.querySelector(`link[rel="${rel}"][href="${href}"]`))
              return;
            const link = document.createElement("link");
            link.rel = rel;
            link.href = href;
            if (attrs)
              Object.entries(attrs).forEach(([k, v]) =>
                link.setAttribute(k, v),
              );
            head.appendChild(link);
          };
          addLink("dns-prefetch", origin);
          addLink("preconnect", origin);
        }
      } catch {
        // invalid URL, skip
      }
    }
  }, [searchParams]);

  const activeGame = useMemo(() => {
    if (gameId && gamesById[gameId]) return gamesById[gameId];
    if (!frameSrc) return null;
    try {
      const target = new URL(frameSrc, window.location.origin).href;
      return (
        gamesData.find((game) => {
          try {
            return new URL(game.href, window.location.origin).href === target;
          } catch {
            return false;
          }
        }) || null
      );
    } catch {
      return null;
    }
  }, [gameId, frameSrc]);

  useEffect(() => {
    document.title = currentName;
  }, [currentName]);

  useEffect(() => {
    if (windowLock) {
      window.onbeforeunload = () =>
        "Are you sure you want to leave this page? Your changes may not be saved.";
    } else {
      window.onbeforeunload = null;
    }
    return () => {
      window.onbeforeunload = null;
    };
  }, [windowLock]);

  useEffect(() => {
    const updateFullscreenState = () => {
      const active =
        !!document.fullscreenElement ||
        !!(document as Document & { webkitFullscreenElement?: Element })
          .webkitFullscreenElement ||
        !!(document as Document & { msFullscreenElement?: Element })
          .msFullscreenElement;
      setIsFullscreen(active);
      document.body.classList.toggle("fullscreen-active", active);
    };
    document.addEventListener("fullscreenchange", updateFullscreenState);
    document.addEventListener("webkitfullscreenchange", updateFullscreenState);
    document.addEventListener("msfullscreenchange", updateFullscreenState);
    return () => {
      document.removeEventListener("fullscreenchange", updateFullscreenState);
      document.removeEventListener(
        "webkitfullscreenchange",
        updateFullscreenState,
      );
      document.removeEventListener("msfullscreenchange", updateFullscreenState);
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    setIsMobile(media.matches);
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }
    media.addListener(handler);
    return () => media.removeListener(handler);
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      frameRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(handle);
  }, [frameSrc]);

  useEffect(() => {
    if (!isMobile || isFullscreen) return;
    setShowFullscreenPrompt(true);
    const handle = window.setTimeout(() => {
      setShowFullscreenPrompt(false);
    }, 3500);
    return () => window.clearTimeout(handle);
  }, [isMobile, isFullscreen]);

  useEffect(() => {
    const attemptFullscreen = () => {
      if (isFullscreen) return;
      if (!window.matchMedia("(max-width: 900px)").matches) return;
      openFullscreen();
    };
    const handler = () => attemptFullscreen();
    window.addEventListener("pointerdown", handler, { once: true });
    return () => window.removeEventListener("pointerdown", handler);
  }, [isFullscreen]);

  const filterStyle = "";

  const openFullscreen = () => {
    const element = document.getElementById("frame");
    if (!element) return;

    if (!document.fullscreenElement) {
      const request =
        element.requestFullscreen ||
        (element as HTMLElement & { webkitRequestFullscreen?: () => void })
          .webkitRequestFullscreen ||
        (element as HTMLElement & { msRequestFullscreen?: () => void })
          .msRequestFullscreen;
      request?.call(element);
    } else {
      const exit =
        document.exitFullscreen ||
        (document as Document & { webkitExitFullscreen?: () => void })
          .webkitExitFullscreen ||
        (document as Document & { msExitFullscreen?: () => void })
          .msExitFullscreen;
      exit?.call(document);
    }
  };

  const updateFilter = (key: keyof FilterState, value: number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const sendVirtualKey = useCallback(
    (eventType: "keydown" | "keyup", keyValue: string) => {
      const frame = document.getElementById(
        "frame",
      ) as HTMLIFrameElement | null;
      if (!frame) return;

      const keyCodeMap: Record<string, number> = {
        ArrowUp: 38,
        ArrowDown: 40,
        ArrowLeft: 37,
        ArrowRight: 39,
        " ": 32,
      };
      const codeMap: Record<string, string> = {
        ArrowUp: "ArrowUp",
        ArrowDown: "ArrowDown",
        ArrowLeft: "ArrowLeft",
        ArrowRight: "ArrowRight",
        " ": "Space",
      };
      const keyCode = keyCodeMap[keyValue] ?? 0;
      const code = codeMap[keyValue] ?? keyValue;

      const dispatchArrowEvent = (target: EventTarget | null) => {
        if (!target || typeof (target as Window).dispatchEvent !== "function")
          return;
        const event = new KeyboardEvent(eventType, {
          key: keyValue,
          code,
          which: keyCode,
          keyCode,
          bubbles: true,
          cancelable: true,
        });
        (target as Window).dispatchEvent(event);
      };

      dispatchArrowEvent(window);
      try {
        if (frame.contentWindow) {
          frame.contentWindow.focus();
          dispatchArrowEvent(frame.contentWindow);
          if (frame.contentWindow.document) {
            dispatchArrowEvent(frame.contentWindow.document);
            if (frame.contentWindow.document.body) {
              dispatchArrowEvent(frame.contentWindow.document.body);
            }
          }
        }
      } catch {
        // ignore cross-origin
      }
    },
    [],
  );

  return (
    <div className="ui-page ui-page-embed">
      {!isFullscreen ? (
        <PrimaryNav
          showHomeLinks={false}
          extraActions={
            <>
              <div className="nav-game-actions">
                <div className="game-identity">
                  <img
                    src={currentIcon}
                    alt="Game icon"
                    className="game-icon"
                  />
                  <span className="game-name" title={currentName}>
                    {currentName}
                  </span>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={openFullscreen}
                >
                  {isFullscreen ? "Exit full" : "Fullscreen"}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsModalOpen(true)}
                >
                  Settings
                </button>
              </div>
              <div className="nav-game-mobile">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{
                        padding: "8px 16px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        borderRadius: "50px",
                        background: "var(--cg-bg-card)",
                        border: "2px solid var(--cg-border-color)",
                        color: "var(--cg-text-primary)",
                      }}
                    >
                      ⚙️ Menu
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="dropdown-content"
                    sideOffset={8}
                    align="end"
                  >
                    <DropdownMenuItem
                      className="dropdown-item"
                      onSelect={() => openFullscreen()}
                    >
                      {isFullscreen ? "⛶ Exit Fullscreen" : "⛶ Fullscreen"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="dropdown-item"
                      onSelect={() => setIsModalOpen(true)}
                    >
                      ⚙️ Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          }
        />
      ) : null}

      <div className="embed-shell">
        <div
          className="embed-frame"
          onPointerDown={() => {
            if (isFullscreen) return;
            if (window.matchMedia("(max-width: 900px)").matches) {
              openFullscreen();
            }
          }}
        >
          {frameSrc ? (
            <>
              {/* Show loading skeleton until iframe loads - improves perceived performance on Chromebooks */}
              {!isIframeLoaded && <GameLoadingSkeleton />}
              <iframe
                id="frame"
                title="Game frame"
                src={frameSrc}
                ref={frameRef}
                // Only focus after load to prevent blocking
                onLoad={() => {
                  setIsIframeLoaded(true);
                  frameRef.current?.focus();
                  // Log performance metrics
                  if (loadStartTime) {
                    const loadTime = performance.now() - loadStartTime;
                    console.log(
                      `[Performance] Game iframe loaded in ${loadTime.toFixed(2)}ms`,
                    );
                    // Report to analytics if available
                    if (typeof window !== "undefined" && (window as any).gtag) {
                      (window as any).gtag("event", "game_load", {
                        event_category: "performance",
                        event_label: currentName,
                        value: Math.round(loadTime),
                      });
                    }
                  }
                }}
                className={`embed-iframe ${isIframeLoaded ? "loaded" : "loading"}`}
                style={{
                  filter: filterStyle,
                  // Hide iframe content until loaded to prevent flickering
                  opacity: isIframeLoaded ? 1 : 0,
                  transition: "opacity 0.2s ease-in-out",
                  // GPU acceleration hints for smoother rendering
                  willChange: "transform, opacity",
                  transform: "translateZ(0)",
                  backfaceVisibility: "hidden",
                  // Optimize rendering performance
                  contain: "layout style paint",
                }}
                // Performance optimizations for Chromebooks
                loading="eager"
                referrerPolicy="no-referrer"
                // Reduce memory usage and improve performance
                allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
              />
            </>
          ) : null}
        </div>
      </div>

      {isMobile && !isFullscreen && showFullscreenPrompt ? (
        <div className="fullscreen-prompt">
          <div className="fullscreen-pill">Tap to go fullscreen</div>
        </div>
      ) : null}

      <MobileControls onSendKey={sendVirtualKey} />

      <GameSettingsDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        windowLock={windowLock}
        onWindowLockChange={setWindowLock}
        filters={filters}
        filterControls={typedFilterControls}
        onFilterChange={updateFilter}
      />
    </div>
  );
}
