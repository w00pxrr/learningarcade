import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Slider,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { GameTypeBadge } from "../components/GameTypeBadge";
import { PrimaryNav } from "../components/PrimaryNav";
import { useDisguise } from "../hooks/useDisguise";
import { getStoredJSON } from "../utils/storage";
import { trackGameView } from "../utils/umami";
import { recommendedGames } from "../data/recommended";
import { gamesData, GameData } from "../data/games";

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

type RecommendedGame = {
  name: string;
  href: string;
  img: string;
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

const filterControls: Array<[string, keyof FilterState, number, number, number]> = [
  ["Brightness", "brightness", 10, 200, 1],
  ["Contrast", "contrast", 0, 200, 1],
  ["Hue", "hue", 0, 360, 1],
  ["Blur", "blur", 0, 10, 0.5],
  ["Saturate", "saturate", 0, 200, 1],
  ["Grayscale", "grayscale", 0, 100, 1],
  ["Sepia", "sepia", 0, 100, 1],
  ["Invert", "invert", 0, 100, 1],
  ["Opacity", "opacity", 0, 1, 0.01],
  ["Drop Shadow", "dropShadow", 0, 12, 0.5],
];

function resolveUrl(rawUrl?: string | null) {
  if (!rawUrl) return "";
  try {
    return new URL(rawUrl, window.location.href).href;
  } catch {
    return rawUrl;
  }
}

function getGameVisits(): Record<string, { count: number }> {
  const raw = localStorage.getItem("gams_game_visits");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function getSortedRecommendedGames(): RecommendedGame[] {
  const visits = getGameVisits();
  if (Object.keys(visits).length === 0) return recommendedGames.slice(0, 6);

  return [...recommendedGames]
    .sort((a, b) => {
      const aCount = visits[a.name.toLowerCase().replace(/\s/g, "")]?.count || 0;
      const bCount = visits[b.name.toLowerCase().replace(/\s/g, "")]?.count || 0;
      return bCount - aCount;
    })
    .slice(0, 6);
}

export default function GameEmbedPage() {
  const params = useMemo(() => {
    const hash = window.location.hash;
    const queryIndex = hash.indexOf("?");
    if (queryIndex === -1) return new URLSearchParams(window.location.search);
    return new URLSearchParams(hash.slice(queryIndex + 1));
  }, []);
  const initialName = params.get("name") || "Gam";
  const initialIcon = resolveUrl(params.get("icon")) || "/img/gams-g.png";
  const initialSrc = resolveUrl(params.get("src"));

  const [currentName, setCurrentName] = useState(initialName);
  const [currentIcon, setCurrentIcon] = useState(initialIcon);
  const [frameSrc, setFrameSrc] = useState(initialSrc);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [windowLock, setWindowLock] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hideSidebar, setHideSidebar] = useState(false);
  const [controlsAnchor, setControlsAnchor] = useState<null | HTMLElement>(null);

  const popoutMode =
    (getStoredJSON<string>("gams", { key: "popoutMode" }) as string) || "top";

  const recommended = useMemo(() => getSortedRecommendedGames(), []);

  useDisguise(currentName, currentIcon);

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
        !!(document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
        !!(document as Document & { msFullscreenElement?: Element }).msFullscreenElement;
      setIsFullscreen(active);
      document.body.classList.toggle("fullscreen-active", active);
    };
    document.addEventListener("fullscreenchange", updateFullscreenState);
    document.addEventListener("webkitfullscreenchange", updateFullscreenState);
    document.addEventListener("msfullscreenchange", updateFullscreenState);
    return () => {
      document.removeEventListener("fullscreenchange", updateFullscreenState);
      document.removeEventListener("webkitfullscreenchange", updateFullscreenState);
      document.removeEventListener("msfullscreenchange", updateFullscreenState);
    };
  }, []);

  const filterStyle = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) hue-rotate(${filters.hue}deg) blur(${filters.blur}px) saturate(${filters.saturate}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) invert(${filters.invert}%) opacity(${filters.opacity}) drop-shadow(0 0 ${filters.dropShadow}px rgba(0,0,0,0.4))`;

  const openFullscreen = () => {
    const element = document.getElementById("frame");
    if (!element) return;

    if (!document.fullscreenElement) {
      const request =
        element.requestFullscreen ||
        (element as HTMLElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen ||
        (element as HTMLElement & { msRequestFullscreen?: () => void }).msRequestFullscreen;
      request?.call(element);
    } else {
      const exit =
        document.exitFullscreen ||
        (document as Document & { webkitExitFullscreen?: () => void }).webkitExitFullscreen ||
        (document as Document & { msExitFullscreen?: () => void }).msExitFullscreen;
      exit?.call(document);
    }
  };

  const updateFilter = (key: keyof FilterState, value: number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const isControlsOpen = Boolean(controlsAnchor);

  const sendVirtualKey = useCallback((eventType: "keydown" | "keyup", keyValue: string) => {
    const frame = document.getElementById("frame") as HTMLIFrameElement | null;
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
      if (!target || typeof (target as Window).dispatchEvent !== "function") return;
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
  }, []);

  const resolveGameMeta = (game: RecommendedGame): GameData | undefined =>
    gamesData.find((entry) => entry.name === game.name || entry.href === game.href);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
      {!isFullscreen ? (
        <PrimaryNav
          showHomeLinks={false}
          extraActions={
            <>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ display: { xs: "none", md: "flex" } }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    component="img"
                    src={currentIcon}
                    alt="Game icon"
                    sx={{ width: 20, height: 20, borderRadius: 1.5, bgcolor: "white", p: 0.25 }}
                  />
                  <Typography variant="body2" fontWeight={700} noWrap>
                    {currentName}
                  </Typography>
                </Stack>
                <Button variant="outlined" color="inherit" onClick={openFullscreen} size="small">
                  {isFullscreen ? "Exit full" : "Fullscreen"}
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => setHideSidebar((prev) => !prev)}
                  size="small"
                >
                  {hideSidebar ? "Show sidebar" : "Hide sidebar"}
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => setIsModalOpen(true)}
                  size="small"
                >
                  Settings
                </Button>
              </Stack>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ display: { xs: "flex", md: "none" } }}
              >
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  onClick={(event) => setControlsAnchor(event.currentTarget)}
                >
                  Controls
                </Button>
                <Menu
                  anchorEl={controlsAnchor}
                  open={isControlsOpen}
                  onClose={() => setControlsAnchor(null)}
                >
                  <MenuItem
                    onClick={() => {
                      setControlsAnchor(null);
                      openFullscreen();
                    }}
                  >
                    {isFullscreen ? "Exit full" : "Fullscreen"}
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setControlsAnchor(null);
                      setHideSidebar((prev) => !prev);
                    }}
                  >
                    {hideSidebar ? "Show sidebar" : "Hide sidebar"}
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setControlsAnchor(null);
                      setIsModalOpen(true);
                    }}
                  >
                    Settings
                  </MenuItem>
                </Menu>
              </Stack>
            </>
          }
        />
      ) : null}

      <Box sx={{ display: "flex", minHeight: 0, flex: 1 }}>
        <Paper
          variant="outlined"
          sx={{
            width: 280,
            p: 2,
            display: hideSidebar || isFullscreen ? "none" : "block",
            borderRadius: 0,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Recommended
            </Typography>
            <Chip label="Quick" size="small" color="secondary" />
          </Stack>
          <Grid container spacing={1.5}>
            {recommended.map((game) => {
              const meta = resolveGameMeta(game);
              return (
              <Grid item xs={6} key={game.name}>
                <Card variant="outlined">
                  <CardActionArea
                    onClick={() => {
                      const href = resolveUrl(game.href);
                      const icon = resolveUrl(game.img);
                      if (meta) trackGameView(meta);
                      setFrameSrc(href);
                      setCurrentName(game.name);
                      setCurrentIcon(icon);
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={game.img}
                      alt={game.name}
                      sx={{ aspectRatio: "1 / 1", objectFit: "cover" }}
                    />
                    <CardContent sx={{ p: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          variant="caption"
                          display="block"
                          noWrap
                          sx={{ flex: 1, minWidth: 0 }}
                        >
                          {game.name}
                        </Typography>
                        {meta ? <GameTypeBadge game={meta} size="xs" /> : null}
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
              );
            })}
          </Grid>
        </Paper>

        <Box sx={{ position: "relative", flex: 1, minHeight: 0 }}>
          <Box
            component="iframe"
            id="frame"
            title="Game frame"
            src={frameSrc}
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, filter: filterStyle }}
          />
        </Box>
      </Box>

      <Box
        aria-label="Mobile game controls"
        sx={{
          position: "fixed",
          bottom: 16,
          left: 16,
          right: 16,
          zIndex: 1100,
          display: { xs: "flex", md: "none" },
          justifyContent: "space-between",
          alignItems: "flex-end",
          pointerEvents: "none",
        }}
      >
        <Stack spacing={1} sx={{ pointerEvents: "auto" }}>
          <Stack direction="row" spacing={1} justifyContent="center">
            <IconButton
              color="primary"
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
            </IconButton>
          </Stack>
          <Stack direction="row" spacing={1} justifyContent="center">
            {[
              ["ArrowLeft", "◀"],
              ["ArrowDown", "▼"],
              ["ArrowRight", "▶"],
            ].map(([keyValue, label]) => (
              <IconButton
                key={keyValue}
                color="primary"
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
              </IconButton>
            ))}
          </Stack>
        </Stack>
        <Button
          variant="contained"
          color="secondary"
          sx={{ pointerEvents: "auto" }}
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
        </Button>
      </Box>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Game settings</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={windowLock}
                  onChange={(event) => setWindowLock(event.target.checked)}
                />
              }
              label="Ask before closing window"
            />
            {filterControls.map(([label, key, min, max, step]) => (
              <Box key={key}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" fontWeight={600}>
                    {label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {filters[key]}
                  </Typography>
                </Stack>
                <Slider
                  value={filters[key]}
                  min={min}
                  max={max}
                  step={step}
                  onChange={(_, value) => updateFilter(key, Number(value))}
                  size="small"
                />
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
