"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Slider from "@radix-ui/react-slider";
import * as Switch from "@radix-ui/react-switch";
import { PrimaryNav } from "../components/PrimaryNav";
import { gamesById, gamesData } from "../data/games";
import { useDisguise } from "../hooks/useDisguise";
import filterControls from "../data/gameEmbedFilters.json";
import { useSearchParams } from "next/navigation";

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
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
  const [leaderboardEntries, setLeaderboardEntries] = useState<
    Array<{ username: string; score: number }>
  >([]);
  const [leaderboardStatus, setLeaderboardStatus] = useState("");
  const [leaderboardBest, setLeaderboardBest] = useState<number | null>(null);
  const [leaderboardUser, setLeaderboardUser] = useState<{
    username: string;
  } | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardSubmitting, setLeaderboardSubmitting] = useState(false);
  const [detectedScore, setDetectedScore] = useState<number | null>(null);
  const [detectedScoreStatus, setDetectedScoreStatus] = useState("");

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

  const showLeaderboard = !!activeGame?.hasLeaderboard;

  const loadLeaderboard = useCallback(async () => {
    if (!activeGame?.id) return;
    setLeaderboardLoading(true);
    try {
      const res = await fetch(
        `/api/leaderboards?gameId=${encodeURIComponent(activeGame.id)}`,
        { credentials: "include" },
      );
      if (!res.ok) {
        setLeaderboardStatus("Unable to load leaderboard.");
        return;
      }
      const data = (await res.json()) as {
        entries?: Array<{ username: string; score: number }>;
        meBest?: number | null;
        user?: { username: string } | null;
      };
      setLeaderboardEntries(data.entries ?? []);
      setLeaderboardBest(typeof data.meBest === "number" ? data.meBest : null);
      setLeaderboardUser(data.user ?? null);
      setLeaderboardStatus("");
    } catch {
      setLeaderboardStatus("Unable to load leaderboard.");
    } finally {
      setLeaderboardLoading(false);
    }
  }, [activeGame?.id]);

  useEffect(() => {
    if (!showLeaderboard) return;
    void loadLeaderboard();
  }, [showLeaderboard, loadLeaderboard]);

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

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("GameEmbed: Received message:", event.data);
      if (!event.data || typeof event.data !== "object") return;
      if (
        event.data.type === "gameScore" &&
        typeof event.data.score === "number"
      ) {
        console.log("GameEmbed: Score detected:", event.data.score);
        setDetectedScore(event.data.score);
        setDetectedScoreStatus("");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const filterStyle = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) hue-rotate(${filters.hue}deg) blur(${filters.blur}px) saturate(${filters.saturate}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) invert(${filters.invert}%) opacity(${filters.opacity}) drop-shadow(0 0 ${filters.dropShadow}px rgba(0,0,0,0.4))`;

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

  const submitScore = async () => {
    if (!activeGame?.id) return;
    if (!leaderboardUser) {
      setLeaderboardStatus("Log in to submit scores.");
      return;
    }
    if (detectedScore === null || !Number.isFinite(detectedScore)) {
      setLeaderboardStatus("Score not detected yet.");
      return;
    }
    setLeaderboardSubmitting(true);
    setLeaderboardStatus("");
    try {
      const res = await fetch("/api/leaderboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          gameId: activeGame.id,
          score: Math.round(detectedScore),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLeaderboardStatus(data?.error || "Submission failed.");
        return;
      }
      await loadLeaderboard();
      setLeaderboardStatus("Score submitted.");
    } catch {
      setLeaderboardStatus("Submission failed.");
    } finally {
      setLeaderboardSubmitting(false);
    }
  };

  const extractScoreFromText = (value: string) => {
    const matches = value.match(/\d{1,9}/g);
    if (!matches) return null;
    return Math.max(
      ...matches
        .map((entry) => Number(entry))
        .filter((n) => Number.isFinite(n)),
    );
  };

  const detectScoreFromFrame = useCallback((): number | null => {
    const frame = frameRef.current;
    if (!frame) return null;
    try {
      const win = frame.contentWindow;
      const doc = frame.contentDocument || win?.document;
      if (!win || !doc) return null;

      const explicitKeys = [
        "score",
        "Score",
        "highscore",
        "highScore",
        "bestScore",
        "best",
        "points",
        "point",
        "totalScore",
        "totalPoints",
        "currentScore",
        "runScore",
        "myScore",
        "playerScore",
        "gameScore",
        "_ubg235_score",
        "_currentGameScore",
      ];
      const candidates: number[] = [];
      for (const key of explicitKeys) {
        const value = (win as unknown as Record<string, unknown>)[key];
        if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
          candidates.push(value);
        }
      }

      try {
        const canvas = doc.querySelector("canvas");
        if (canvas) {
          const phaserGame = (canvas as unknown as { game?: unknown }).game;
          if (phaserGame && typeof phaserGame === "object") {
            const pg = phaserGame as Record<string, unknown>;
            if (
              typeof pg.score === "number" &&
              Number.isFinite(pg.score) &&
              pg.score >= 0
            ) {
              candidates.push(pg.score);
            }
            if (
              pg.registry &&
              typeof pg.registry === "object" &&
              "values" in pg.registry
            ) {
              const registry = pg.registry as {
                values?: Record<string, unknown>;
              };
              const registryValues = registry.values || {};
              for (const key of explicitKeys) {
                if (
                  typeof registryValues[key] === "number" &&
                  Number.isFinite(registryValues[key]) &&
                  registryValues[key] >= 0
                ) {
                  candidates.push(registryValues[key]);
                }
              }
            }
            if (
              pg.scene &&
              typeof pg.scene === "object" &&
              "keys" in pg.scene
            ) {
              const scene = pg.scene as { keys?: Record<string, unknown> };
              const sceneKeys: Record<string, unknown> = scene.keys || {};
              for (const key of Object.keys(sceneKeys)) {
                const sceneObj = sceneKeys[key] as Record<string, unknown>;
                if (sceneObj && typeof sceneObj === "object") {
                  for (const scoreKey of explicitKeys) {
                    if (
                      typeof sceneObj[scoreKey] === "number" &&
                      Number.isFinite(sceneObj[scoreKey]) &&
                      sceneObj[scoreKey] >= 0
                    ) {
                      candidates.push(sceneObj[scoreKey]);
                    }
                  }
                }
              }
            }
          }
        }
      } catch {
        // ignore phaser access
      }

      try {
        const findScoreInObject = (
          obj: unknown,
          depth: number = 0,
        ): number[] => {
          if (depth > 5 || !obj || typeof obj !== "object") return [];
          const results: number[] = [];
          const o = obj as Record<string, unknown>;
          for (const key of Object.keys(o)) {
            const val = o[key];
            if (
              typeof val === "number" &&
              Number.isFinite(val) &&
              val > 0 &&
              /^(score|point|high)/i.test(key)
            ) {
              results.push(val);
            } else if (val && typeof val === "object" && depth < 5) {
              results.push(...findScoreInObject(val, depth + 1));
            }
          }
          return results;
        };
        candidates.push(...findScoreInObject(win));
      } catch {
        // ignore recursive search
      }

      const selectors = [
        "[data-score]",
        "[id*='score']",
        "[class*='score']",
        "[id*='points']",
        "[class*='points']",
        "[id*='highscore']",
        "[class*='highscore']",
      ];
      const nodes = doc.querySelectorAll(selectors.join(","));
      nodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        const text = node.innerText || node.textContent || "";
        const value = extractScoreFromText(text);
        if (typeof value === "number" && Number.isFinite(value)) {
          candidates.push(value);
        }
        const dataScore = node.getAttribute("data-score");
        if (dataScore) {
          const num = Number(dataScore);
          if (Number.isFinite(num)) candidates.push(num);
        }
      });

      try {
        const storage = win.localStorage;
        const ubgScore = storage.getItem("_ubg235_score");
        if (ubgScore) {
          const num = Number(ubgScore);
          if (Number.isFinite(num) && num >= 0) {
            candidates.push(num);
          }
        }
        const currentScore = storage.getItem("_currentGameScore");
        if (currentScore) {
          const num = Number(currentScore);
          if (Number.isFinite(num) && num >= 0) {
            candidates.push(num);
          }
        }
        for (let i = 0; i < storage.length; i += 1) {
          const key = storage.key(i) || "";
          if (!/score|highscore|points/i.test(key)) continue;
          const value = storage.getItem(key) || "";
          const num = extractScoreFromText(value);
          if (typeof num === "number" && Number.isFinite(num)) {
            candidates.push(num);
          }
        }
      } catch {
        // ignore storage access
      }

      if (candidates.length === 0) return null;
      return Math.max(...candidates.filter((entry) => Number.isFinite(entry)));
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!showLeaderboard) return;
    let active = true;
    const tick = () => {
      const score = detectScoreFromFrame();
      if (!active) return;
      if (score === null) {
        setDetectedScoreStatus("Score not detected yet.");
        return;
      }
      setDetectedScoreStatus("");
      setDetectedScore(score);
    };
    tick();
    const handle = window.setInterval(tick, 300);
    return () => {
      active = false;
      window.clearInterval(handle);
    };
  }, [showLeaderboard, detectScoreFromFrame]);

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
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="btn btn-outline btn-sm">Controls</button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="dropdown-content"
                      sideOffset={8}
                      align="end"
                    >
                      <DropdownMenu.Item
                        className="dropdown-item"
                        onSelect={() => openFullscreen()}
                      >
                        {isFullscreen ? "Exit full" : "Fullscreen"}
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className="dropdown-item"
                        onSelect={() => setIsModalOpen(true)}
                      >
                        Settings
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
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
            <iframe
              id="frame"
              title="Game frame"
              src={frameSrc}
              ref={frameRef}
              onLoad={() => frameRef.current?.focus()}
              className="embed-iframe"
              style={{ filter: filterStyle }}
            />
          ) : null}
        </div>
      </div>

      {showLeaderboard ? (
        <section className="panel leaderboard-panel">
          <div className="leaderboard-header">
            <div>
              <h3 className="panel-title">Leaderboard</h3>
              <p className="muted">
                {leaderboardUser
                  ? `Signed in as ${leaderboardUser.username}`
                  : "Log in to submit your score."}
              </p>
              {leaderboardBest !== null ? (
                <p className="muted small">Your best: {leaderboardBest}</p>
              ) : null}
            </div>
            {leaderboardUser ? null : (
              <a className="btn btn-outline btn-sm" href="/account">
                Log in
              </a>
            )}
          </div>
          <div className="leaderboard-body">
            <div className="leaderboard-list">
              {leaderboardLoading ? (
                <p className="muted">Loading leaderboard...</p>
              ) : leaderboardEntries.length === 0 ? (
                <p className="muted">No scores yet. Be the first.</p>
              ) : (
                leaderboardEntries.map((entry, index) => (
                  <div
                    className="leaderboard-entry"
                    key={`${entry.username}-${entry.score}`}
                  >
                    <span className="leaderboard-rank">#{index + 1}</span>
                    <span className="leaderboard-name">{entry.username}</span>
                    <span className="leaderboard-score">{entry.score}</span>
                  </div>
                ))
              )}
            </div>
            <div className="leaderboard-submit">
              <div className="input-label">
                Detected score
                <div className="leaderboard-detected">
                  {detectedScore !== null ? detectedScore : "—"}
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={submitScore}
                disabled={leaderboardSubmitting || detectedScore === null}
              >
                Submit
              </button>
              {detectedScoreStatus ? (
                <p className="muted small">{detectedScoreStatus}</p>
              ) : null}
              {leaderboardStatus ? (
                <p className="muted small">{leaderboardStatus}</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {isMobile && !isFullscreen && showFullscreenPrompt ? (
        <div className="fullscreen-prompt">
          <div className="fullscreen-pill">Tap to go fullscreen</div>
        </div>
      ) : null}

      <div className="mobile-controls" aria-label="Mobile game controls">
        <div className="mobile-dpad">
          <button
            className="arrow-btn"
            style={{ gridColumn: 2, gridRow: 1 }}
            onPointerDown={(event) => {
              event.preventDefault();
              sendVirtualKey("keydown", "ArrowUp");
            }}
            onPointerUp={(event) => {
              event.preventDefault();
              sendVirtualKey("keyup", "ArrowUp");
            }}
            onPointerLeave={(event) => {
              event.preventDefault();
              sendVirtualKey("keyup", "ArrowUp");
            }}
          >
            ▲
          </button>
          {(
            [
              ["ArrowLeft", "◀", 1, 2],
              ["ArrowDown", "▼", 2, 2],
              ["ArrowRight", "▶", 3, 2],
            ] as Array<[string, string, number, number]>
          ).map(([keyValue, label, col, row]) => (
            <button
              key={keyValue}
              className="arrow-btn"
              style={{ gridColumn: col, gridRow: row }}
              onPointerDown={(event) => {
                event.preventDefault();
                sendVirtualKey("keydown", keyValue);
              }}
              onPointerUp={(event) => {
                event.preventDefault();
                sendVirtualKey("keyup", keyValue);
              }}
              onPointerLeave={(event) => {
                event.preventDefault();
                sendVirtualKey("keyup", keyValue);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className="space-btn"
          onPointerDown={(event) => {
            event.preventDefault();
            sendVirtualKey("keydown", " ");
          }}
          onPointerUp={(event) => {
            event.preventDefault();
            sendVirtualKey("keyup", " ");
          }}
          onPointerLeave={(event) => {
            event.preventDefault();
            sendVirtualKey("keyup", " ");
          }}
        >
          Space
        </button>
      </div>

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            <div className="dialog-header">
              <Dialog.Title className="dialog-title">
                Game settings
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="btn btn-ghost btn-sm">Close</button>
              </Dialog.Close>
            </div>
            <div className="ui-stack">
              <label className="switch-row">
                <Switch.Root
                  className="switch-root"
                  checked={windowLock}
                  onCheckedChange={setWindowLock}
                >
                  <Switch.Thumb className="switch-thumb" />
                </Switch.Root>
                <span>Ask before closing window</span>
              </label>
              {typedFilterControls.map(({ label, key, min, max, step }) => (
                <div key={key} className="slider-block">
                  <div className="slider-row">
                    <span className="slider-label">{label}</span>
                    <span className="slider-value">{filters[key]}</span>
                  </div>
                  <Slider.Root
                    className="slider-root"
                    value={[filters[key]]}
                    min={min}
                    max={max}
                    step={step}
                    onValueChange={(value) =>
                      updateFilter(key, value[0] ?? min)
                    }
                  >
                    <Slider.Track className="slider-track">
                      <Slider.Range className="slider-range" />
                    </Slider.Track>
                    <Slider.Thumb className="slider-thumb" />
                  </Slider.Root>
                </div>
              ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
