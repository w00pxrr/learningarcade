"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Slider,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { PrimaryNav } from "../components/PrimaryNav";
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
    return new URL(rawUrl, window.location.href).href;
  } catch {
    return rawUrl;
  }
}

export default function GameEmbedPage() {
  const searchParams = useSearchParams();
  const params = useMemo(
    () => new URLSearchParams(searchParams?.toString()),
    [searchParams]
  );
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
  const [controlsAnchor, setControlsAnchor] = useState<null | HTMLElement>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 900px)").matches
      : false
  );
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);

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

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
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

      <Box sx={{ display: "flex", minHeight: 0, flex: 1, position: "relative" }}>
        <Box
          sx={{ position: "relative", flex: 1, minHeight: 0 }}
          onPointerDown={() => {
            if (isFullscreen) return;
            if (window.matchMedia("(max-width: 900px)").matches) {
              openFullscreen();
            }
          }}
        >
          <Box
            component="iframe"
            id="frame"
            title="Game frame"
            src={frameSrc}
            ref={frameRef}
            onLoad={() => frameRef.current?.focus()}
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, filter: filterStyle }}
          />
        </Box>
      </Box>

      {isMobile && !isFullscreen && showFullscreenPrompt ? (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 1050,
          }}
        >
          <Box
            sx={{
              bgcolor: "rgba(0, 0, 0, 0.65)",
              color: "white",
              px: 2.5,
              py: 1.5,
              borderRadius: 999,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Tap to go fullscreen
          </Box>
        </Box>
      ) : null}

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
            {typedFilterControls.map(({ label, key, min, max, step }) => (
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
