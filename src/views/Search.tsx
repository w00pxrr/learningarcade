"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Container,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { gamesData, GameData } from "../data/games";
import { normalizeSearchText } from "../utils/search";
import { DesktopOnlyOverlay } from "../components/DesktopOnlyOverlay";
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
    const href = new URL(game.href, window.location.href).href;
    recordGameVisit(game.id, game.name);
    setLocalVisits(getGameVisits());
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
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <PrimaryNav
        isDark={isDark}
        onToggleTheme={toggleTheme}
        showHomeLinks={false}
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems="center"
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" gutterBottom>
                  Search games
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {results.length} results
                </Typography>
              </Box>
              <TextField
                placeholder="Search all games"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                }}
                size="small"
                sx={{ minWidth: { xs: "100%", md: 280 } }}
              />
              <TextField
                select
                label="Sort by"
                size="small"
                value={sortMode}
                onChange={(event) =>
                  setSortMode(event.target.value as "relevance" | "views")
                }
                sx={{ minWidth: { xs: "100%", md: 180 } }}
              >
                <MenuItem value="relevance">Relevance</MenuItem>
                <MenuItem value="views">Views</MenuItem>
              </TextField>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" href="/category/all">
                  All games
                </Button>
                <Button variant="contained" href="/">
                  Back home
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Paper>

        {results.length === 0 ? (
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              No results
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try a different search term.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {results.map((game) => {
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
                        if (!desktopOnly) openGame(game);
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
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
