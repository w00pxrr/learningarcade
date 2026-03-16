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
import Grid from "@mui/material/GridLegacy";
import { gamesById, gamesData, GameData } from "../data/games";
import { GameTypeBadge } from "../components/GameTypeBadge";
import { PrimaryNav } from "../components/PrimaryNav";
import { useDisguise } from "../hooks/useDisguise";
import { useUmamiViews } from "../hooks/useUmamiViews";
import { clearCookie, getCookie, setCookie } from "../utils/storage";
import { ensureUmamiLoaded, trackGameView } from "../utils/umami";

type CookieConsent = { settings?: boolean; analytics?: boolean };

const consentStorageKey = "gams_cookie_consent_v1";

const categoryOptions: Array<[string, string]> = [
  ["action", "Action"],
  ["puzzle", "Puzzle"],
  ["adventure", "Adventure"],
  ["horror", "Horror"],
  ["racing", "Racing"],
  ["simulation", "Simulation"],
  ["platformer", "Platformer"],
  ["sports", "Sports"],
  ["tools", "Tools"],
  ["runner", "Runner"],
];

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

function getGameVisits(): Record<string, { count: number; lastVisit: number; name: string }> {
  const raw = localStorage.getItem("gams_game_visits");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function recordGameVisit(gameId: string, gameName: string): void {
  const visits = getGameVisits();
  const now = Date.now();
  if (visits[gameId]) {
    visits[gameId].count++;
    visits[gameId].lastVisit = now;
  } else {
    visits[gameId] = { count: 1, lastVisit: now, name: gameName };
  }

  const allEntries = Object.entries(visits);
  if (allEntries.length > 100) {
    allEntries.sort((a, b) => b[1].lastVisit - a[1].lastVisit);
    const trimmed = Object.fromEntries(allEntries.slice(0, 100));
    localStorage.setItem("gams_game_visits", JSON.stringify(trimmed));
  } else {
    localStorage.setItem("gams_game_visits", JSON.stringify(visits));
  }
}

function getLatestGames(): GameData[] {
  const allowedSections = ["HTML5/unity Webgl", "Flash"];
  const filtered = gamesData.filter((g) => allowedSections.includes(g.section));
  const sorted = [...filtered].sort((a, b) => b.index - a.index);
  return sorted.slice(0, 6);
}

function getTopVisitedGames(limit = 6): GameData[] {
  const visits = getGameVisits();
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

type HomeProps = {
  isDark: boolean;
  onToggleTheme: (nextDark: boolean) => void;
};

export default function HomePage({ isDark, onToggleTheme }: HomeProps) {
  const [consent, setConsent] = useState<CookieConsent | null>(() => loadCookieConsent());
  const [showConsent, setShowConsent] = useState(() => !loadCookieConsent());
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => getFavoriteIds(consent));

  const baseIcon =
    (document.querySelector('link[rel*="icon"]') as HTMLLinkElement | null)?.href ||
    "/img/gams-g.png";
  useDisguise("LearningArcade", baseIcon);

  useEffect(() => {
    if (consent?.analytics) ensureUmamiLoaded();
    if (consent && !consent.settings) clearCookie("gams_favorites");
    setFavorites(getFavoriteIds(consent));
  }, [consent]);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const canFavorite = hasSettingsCookieConsent(consent);
  const { counts: viewCounts } = useUmamiViews();

  const recommended = useMemo(() => {
    const ids = Object.keys(viewCounts);
    if (ids.length === 0) return getTopVisitedGames();
    const ranked = [...gamesData].sort((a, b) => {
      const aCount = viewCounts[a.id] ?? 0;
      const bCount = viewCounts[b.id] ?? 0;
      if (bCount !== aCount) return bCount - aCount;
      return b.index - a.index;
    });
    return ranked.slice(0, 6);
  }, [viewCounts]);
  const latest = useMemo(() => getLatestGames(), []);
  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    const next = `#/search${params.toString() ? `?${params.toString()}` : ""}`;
    window.location.hash = next;
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
    trackGameView(game);

    const gameShellQuery = new URLSearchParams({
      icon: pic,
      name: game.name,
      src: href,
    }).toString();
    const gameShellUrl = new URL(window.location.href);
    gameShellUrl.search = "";
    gameShellUrl.hash = `/game-embed?${gameShellQuery}`;

    window.location.href = gameShellUrl.toString();
  };

  const renderTiles = (list: GameData[]) => (
    <Grid container spacing={2}>
      {list.map((game) => (
        <Grid item xs={4} sm={4} md={3} lg={2} key={game.id}>
          <Card
            sx={{
              height: "100%",
              position: "relative",
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardActionArea onClick={() => handleOpenGame(game)}>
              <CardMedia
                component="img"
                image={game.img}
                alt={game.name}
                sx={{ aspectRatio: "1 / 1", objectFit: "cover" }}
              />
              <CardContent sx={{ p: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    noWrap
                    sx={{ flex: 1, minWidth: 0 }}
                  >
                    {game.name}
                  </Typography>
                  <GameTypeBadge game={game} />
                </Stack>
                <Typography variant="caption" color="text.secondary" display="block">
                  Views: {(viewCounts[game.id] ?? 0).toLocaleString()}
                </Typography>
              </CardContent>
            </CardActionArea>
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
      ))}
    </Grid>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <PrimaryNav
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        showHomeLinks={false}
      />

      <Box sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="lg" sx={{ py: 1.5 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            {categoryOptions.map(([value, label]) => (
              <Chip
                key={value}
                label={label}
                component="a"
                href={`#/category/${value}`}
                clickable
                color="secondary"
                variant="outlined"
                sx={{ textDecoration: "none" }}
              />
            ))}
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={3}>
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
                      <Button variant="outlined" href="#/category/all">
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
                  <Chip label={`${favorites.length} favorites`} color="secondary" />
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
                          <GameTypeBadge game={game} size="xs" />
                        </Stack>
                        <span>Play</span>
                      </Stack>
                    </Button>
                  ))}
                </Stack>
              </Paper>
            </Stack>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Stack spacing={3}>
              <Paper
                sx={(theme) => ({
                  p: { xs: 3, md: 4 },
                  borderRadius: 4,
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(120deg, #0f2f1c 0%, #143f24 65%, #0f2f1c 100%)"
                      : "linear-gradient(120deg, #e8fff2 0%, #f4ffe6 55%, #fff7d1 100%)",
                  border: "1px solid",
                  borderColor: theme.palette.mode === "dark" ? "#1c2d23" : "#dfe8d9",
                })}
              >
                <Typography variant="h4" gutterBottom>
                  Trending picks
                </Typography>
                <Typography variant="body1" sx={{ color: "text.secondary", mb: 3 }}>
                  Only the top games right now. Jump in fast.
                </Typography>
                {recommended.length > 0 ? renderTiles(recommended) : null}
              </Paper>
            </Stack>
          </Grid>

          <Grid item xs={12} lg={3}>
            <Stack spacing={2}>
              <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  How to play
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a game, select a launch mode, and start playing. Use Embed mode for the
                  cleanest experience.
                </Typography>
              </Paper>
              <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Report issues
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
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
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
            <Box>
              <Checkbox
                checked={!!consent?.settings}
                onChange={(event) =>
                  setConsent((prev) => ({ ...(prev || {}), settings: event.target.checked }))
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
                  setConsent((prev) => ({ ...(prev || {}), analytics: event.target.checked }))
                }
              />
              <Typography variant="body2" component="span">
                Analytics cookies
              </Typography>
            </Box>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
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
