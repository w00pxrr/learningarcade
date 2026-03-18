"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Checkbox,
  Chip,
  Container,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { gamesByCategory, gamesById, gamesData, GameData } from "../data/games";
import { DesktopOnlyOverlay } from "../components/DesktopOnlyOverlay";
import { PrimaryNav } from "../components/PrimaryNav";
import { useThemeContext } from "../components/ThemeRoot";
import { useDisguise } from "../hooks/useDisguise";
import { useIsMobile } from "../hooks/useIsMobile";
import categoryMeta from "../data/categoryMeta.json";
import { useUmamiViews } from "../hooks/useUmamiViews";
import { clearCookie, getCookie, setCookie } from "../utils/storage";
import { ensureUmamiLoaded, trackGameView } from "../utils/umami";
import {
  getCombinedCount,
  getGameVisits,
  recordGameVisit,
  type GameVisits,
} from "../utils/visits";
import { useRouter } from "next/navigation";

type CookieConsent = { settings?: boolean; analytics?: boolean };

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

function loadCookieConsent(): CookieConsent | null {
  const raw = localStorage.getItem(consentStorageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    return null;
  }
  return null;
}

function saveCookieConsent(consent: CookieConsent): void {
  localStorage.setItem(consentStorageKey, JSON.stringify(consent));
}

function hasSettingsCookieConsent(consent: CookieConsent | null): boolean {
  return !!(consent && consent.settings === true);
}

function getFavoriteIds(consent: CookieConsent | null): string[] {
  if (!hasSettingsCookieConsent(consent)) return [];
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

function getLatestGames(): GameData[] {
  const allowedSections = ["HTML5/unity Webgl", "Flash"];
  const filtered = gamesData.filter((g) => allowedSections.includes(g.section));
  const sorted = [...filtered].sort((a, b) => b.index - a.index);
  return sorted.slice(0, 6);
}

function getTopVisitedGamesFromVisits(
  visits: Record<string, { count: number; lastVisit: number; name: string }>,
  limit = 6,
): GameData[] {
  const entries = Object.entries(visits);
  if (entries.length === 0) return getLatestGames();

  entries.sort((a, b) => {
    if (b[1].count !== a[1].count) return b[1].count - a[1].count;
    return b[1].lastVisit - a[1].lastVisit;
  });

  const topGameIds = new Set(entries.slice(0, limit).map((e) => e[0]));
  const recommended: GameData[] = [];
  for (const [gameId] of entries) {
    if (recommended.length >= limit) break;
    const game = gamesById[gameId];
    if (game) recommended.push(game);
  }

  if (recommended.length < limit) {
    const latest = getLatestGames();
    for (const game of latest) {
      if (recommended.length >= limit) break;
      if (!topGameIds.has(game.id)) recommended.push(game);
    }
  }
  return recommended.slice(0, limit);
}

export default function HomePage() {
  const { isDark, toggleTheme } = useThemeContext();
  const router = useRouter();
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [showConsent, setShowConsent] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [localVisits, setLocalVisits] = useState<GameVisits>({});
  const [baseIcon, setBaseIcon] = useState("/img/gams-g.png");
  const isMobile = useIsMobile();

  useDisguise("LearningArcade", baseIcon);

  useEffect(() => {
    const loadedConsent = loadCookieConsent();
    setConsent(loadedConsent);
    setShowConsent(!loadedConsent);
    setFavorites(getFavoriteIds(loadedConsent));
    setLocalVisits(getGameVisits());
    setBaseIcon(
      (document.querySelector('link[rel*="icon"]') as HTMLLinkElement | null)
        ?.href || "/img/gams-g.png",
    );
  }, []);

  useEffect(() => {
    if (consent?.analytics) ensureUmamiLoaded();
    if (consent && !consent.settings) clearCookie("gams_favorites");
    setFavorites(getFavoriteIds(consent));
  }, [consent]);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const canFavorite = hasSettingsCookieConsent(consent);
  const { counts: viewCounts } = useUmamiViews();

  const recommended = useMemo(
    () => getTopVisitedGamesFromVisits(localVisits),
    [localVisits],
  );
  const latest = useMemo(() => getLatestGames(), []);
  const popularGames = useMemo(() => {
    const scored = gamesData.map((game) => {
      const score = getCombinedCount(localVisits, game.id, viewCounts);
      return { game, score };
    });
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.game.index - a.game.index;
    });
    return scored.map((entry) => entry.game);
  }, [localVisits, viewCounts]);
  const favoriteGames = useMemo(
    () => favorites.map((id) => gamesById[id]).filter(Boolean) as GameData[],
    [favorites],
  );
  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    const next = `/search${params.toString() ? `?${params.toString()}` : ""}`;
    router.push(next);
  };

  const toggleFavorite = (gameId: string) => {
    if (!canFavorite) return;
    const next = new Set(favorites);
    if (next.has(gameId)) next.delete(gameId);
    else next.add(gameId);
    const nextList = Array.from(next);
    saveFavoriteIds(nextList);
    setFavorites(nextList);
  };

  const handleOpenGame = (game: GameData) => {
    const href = new URL(game.href, window.location.href).href;
    const pic = new URL(game.img, window.location.href).href;
    recordGameVisit(game.id, game.name);
    setLocalVisits(getGameVisits());
    trackGameView(game);

    const gameShellQuery = new URLSearchParams({
      icon: pic,
      name: game.name,
      src: href,
    }).toString();
    router.push(`/game-embed?${gameShellQuery}`);
  };

  const renderTiles = (list: GameData[]) => (
    <Grid container spacing={2}>
      {list.map((game) => {
        const desktopOnly =
          isMobile && (game.desktopOnly || !game.mobileFriendly);
        return (
          <Grid size={{ xs: 4, sm: 4, md: 3, lg: 2 }} key={game.id}>
            <Card
              sx={{
                height: "100%",
                position: "relative",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                opacity: desktopOnly ? 0.5 : 1,
              }}
            >
              <CardActionArea
                onClick={() => {
                  if (!desktopOnly) handleOpenGame(game);
                }}
                disabled={desktopOnly}
              >
                <CardMedia
                  component="img"
                  image={game.img}
                  alt={game.name}
                  sx={{ aspectRatio: "1 / 1", objectFit: "cover" }}
                />
                <CardContent sx={{ p: 1.5 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    noWrap
                    sx={{ width: "100%" }}
                  >
                    {game.name}
                  </Typography>
                </CardContent>
              </CardActionArea>
              <DesktopOnlyOverlay visible={desktopOnly} />
              <IconButton
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  toggleFavorite(game.id);
                }}
                disabled={!canFavorite}
                size="small"
                title={
                  canFavorite
                    ? "Toggle favorite"
                    : "Enable settings cookies to save favorites"
                }
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  width: 32,
                  height: 32,
                }}
              >
                <span style={{ fontSize: 16 }}>
                  {favoriteSet.has(game.id) ? "★" : "☆"}
                </span>
              </IconButton>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <PrimaryNav
        isDark={isDark}
        onToggleTheme={toggleTheme}
        showHomeLinks={false}
        categoryLinks={categoryLinks}
        showCategoryBar
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 3 }}>
            <Stack spacing={2}>
              <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Search
                </Typography>
                <Box component="form" onSubmit={handleSearchSubmit}>
                  <Stack spacing={1.5}>
                    <TextField
                      placeholder="Search games"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      fullWidth
                      size="small"
                    />
                    <Stack direction="row" spacing={1}>
                      <Button type="submit" variant="contained">
                        Search
                      </Button>
                      <Button variant="outlined" href="/category/all">
                        All games
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              </Paper>
              <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Quick stats
                </Typography>
                <Stack spacing={1}>
                  <Chip label={`${gamesData.length} games`} color="primary" />
                  <Chip
                    label={`${favorites.length} favorites`}
                    color="secondary"
                  />
                  <Chip label="School friendly" variant="outlined" />
                </Stack>
              </Paper>
              <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Latest drops
                </Typography>
                <Stack spacing={1.5}>
                  {latest.slice(0, 3).map((game) => (
                    <Button
                      key={game.id}
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenGame(game)}
                      sx={{ justifyContent: "space-between" }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ flex: 1, justifyContent: "space-between" }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ minWidth: 0 }}
                        >
                          <Typography component="span" noWrap>
                            {game.name}
                          </Typography>
                        </Stack>
                        <Chip
                          label={`${getCombinedCount(localVisits, game.id, viewCounts).toLocaleString()} plays`}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    </Button>
                  ))}
                </Stack>
              </Paper>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <Stack spacing={3}>
              <Paper
                sx={(theme) => ({
                  p: { xs: 3, md: 4 },
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: "divider",
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(120deg, #1c1c2b 0%, #2c2034 55%, #1b1b25 100%)"
                      : "linear-gradient(120deg, #f6f3ff 0%, #fff0f7 55%, #f6fff2 100%)",
                })}
              >
                <Typography variant="h4" gutterBottom>
                  Your favorites
                </Typography>
                {!canFavorite ? (
                  <Stack spacing={2}>
                    <Typography variant="body1" color="text.secondary">
                      Enable settings cookies to save and show favorites here.
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => setShowConsent(true)}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      Update preferences
                    </Button>
                  </Stack>
                ) : favoriteGames.length === 0 ? (
                  <Stack spacing={2}>
                    <Typography variant="body1" color="text.secondary">
                      Star games you love to pin them here.
                    </Typography>
                    <Button
                      variant="outlined"
                      href="/category/all"
                      sx={{ alignSelf: "flex-start" }}
                    >
                      Browse all games
                    </Button>
                  </Stack>
                ) : (
                  <Stack spacing={2.5}>
                    {renderTiles(favoriteGames.slice(0, 8))}
                    {favoriteGames.length > 8 ? (
                      <Button
                        variant="outlined"
                        href="/category/favorites"
                        sx={{ alignSelf: "flex-start" }}
                      >
                        View all favorites
                      </Button>
                    ) : null}
                  </Stack>
                )}
              </Paper>
              <Paper
                sx={(theme) => ({
                  p: { xs: 3, md: 4 },
                  borderRadius: 4,
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(120deg, #0f2f1c 0%, #143f24 65%, #0f2f1c 100%)"
                      : "linear-gradient(120deg, #e8fff2 0%, #f4ffe6 55%, #fff7d1 100%)",
                  border: "1px solid",
                  borderColor:
                    theme.palette.mode === "dark" ? "#1c2d23" : "#dfe8d9",
                })}
              >
                <Typography variant="h4" gutterBottom>
                  Based on your plays
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "text.secondary", mb: 3 }}
                >
                  Your most-played games, plus a few fresh picks.
                </Typography>
                {recommended.length > 0 ? renderTiles(recommended) : null}
              </Paper>
              <Paper
                sx={(theme) => ({
                  p: { xs: 3, md: 4 },
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: "divider",
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(120deg, #1b1c2b 0%, #1a2532 55%, #141b24 100%)"
                      : "linear-gradient(120deg, #eef6ff 0%, #f2fff7 55%, #fff6e6 100%)",
                })}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                  sx={{ mb: 2 }}
                >
                  <Box>
                    <Typography variant="h4" gutterBottom>
                      Most popular
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "text.secondary" }}
                    >
                      Ranked by total plays.
                    </Typography>
                  </Box>
                  <Button variant="outlined" href="/category/popular">
                    More
                  </Button>
                </Stack>
                {popularGames.length > 0
                  ? renderTiles(popularGames.slice(0, 12))
                  : null}
              </Paper>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 3 }}>
            <Stack spacing={2}>
              <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  How to play
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a game, select a launch mode, and start playing. Use
                  Embed mode for the cleanest experience.
                </Typography>
              </Paper>
              <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Report issues
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1.5 }}
                >
                  Find a broken game or bug? Let me know.
                </Typography>
                <Button
                  variant="outlined"
                  href="https://github.com/w00pxrr/w00pxrr.github.io"
                >
                  Report a bug
                </Button>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {showConsent ? (
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            bottom: 16,
            left: 16,
            right: 16,
            maxWidth: 880,
            mx: "auto",
            p: 2.5,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            zIndex: 1200,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Cookie preferences
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose whether to allow analytics cookies and settings cookies.
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mt: 2 }}
          >
            <Box>
              <Checkbox
                checked={!!consent?.settings}
                onChange={(event) =>
                  setConsent((prev) => ({
                    ...(prev || {}),
                    settings: event.target.checked,
                  }))
                }
              />
              <Typography variant="body2" component="span">
                Settings cookies
              </Typography>
            </Box>
            <Box>
              <Checkbox
                checked={!!consent?.analytics}
                onChange={(event) =>
                  setConsent((prev) => ({
                    ...(prev || {}),
                    analytics: event.target.checked,
                  }))
                }
              />
              <Typography variant="body2" component="span">
                Analytics cookies
              </Typography>
            </Box>
          </Stack>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mt: 2 }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                const next = { settings: true, analytics: true };
                saveCookieConsent(next);
                setConsent(next);
                setShowConsent(false);
              }}
            >
              Accept all
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                if (consent) saveCookieConsent(consent);
                setShowConsent(false);
              }}
            >
              Save choices
            </Button>
            <Button
              variant="text"
              onClick={() => {
                const next = { settings: false, analytics: false };
                saveCookieConsent(next);
                setConsent(next);
                setShowConsent(false);
              }}
            >
              Reject all
            </Button>
          </Stack>
        </Paper>
      ) : null}
    </Box>
  );
}
