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
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { gamesByCategory, gamesData, GameData } from "../data/games";
import { DesktopOnlyOverlay } from "../components/DesktopOnlyOverlay";
import { PrimaryNav } from "../components/PrimaryNav";
import { useDisguise } from "../hooks/useDisguise";
import { useIsMobile } from "../hooks/useIsMobile";
import { useUmamiViews } from "../hooks/useUmamiViews";
import { trackGameView } from "../utils/umami";
import { getCookie } from "../utils/storage";
import categoryMeta from "../data/categoryMeta.json";
import {
  getCombinedCount,
  getGameVisits,
  recordGameVisit,
} from "../utils/visits";
import { useParams, useRouter } from "next/navigation";

const categoryLabels = Object.fromEntries(
  categoryMeta.items.map((item) => [item.value, item.label]),
) as Record<string, string>;

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

function hasSettingsCookieConsent(): boolean {
  const raw = localStorage.getItem(consentStorageKey);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as { settings?: boolean };
    return parsed?.settings === true;
  } catch {
    return false;
  }
}

function getFavoriteIds(): string[] {
  if (!hasSettingsCookieConsent()) return [];
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

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const rawCategory = typeof params?.slug === "string" ? params.slug : "all";
  const category = rawCategory || "all";
  const [localVisits, setLocalVisits] = useState({});
  const [baseIcon, setBaseIcon] = useState("/img/gams-g.png");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const label = categoryLabels[category] || category;
  const isMobile = useIsMobile();
  const { counts: viewCounts } = useUmamiViews();

  useDisguise(`${label} - LearningArcade`, baseIcon);

  useEffect(() => {
    setMounted(true);
    setLocalVisits(getGameVisits());
    setBaseIcon(
      (document.querySelector('link[rel*="icon"]') as HTMLLinkElement | null)
        ?.href || "/img/gams-g.png",
    );
    const raw = localStorage.getItem(consentStorageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { settings?: boolean };
        if (parsed?.settings === true) {
          const favRaw = getCookie("gams_favorites");
          if (favRaw) {
            const parsedFavs = JSON.parse(favRaw) as unknown;
            if (Array.isArray(parsedFavs)) {
              setFavoriteIds(new Set(parsedFavs as string[]));
            }
          }
        }
      } catch {}
    }
  }, []);

  const filtered = useMemo(() => {
    if (category === "favorites") {
      return gamesData.filter((g) => favoriteIds.has(g.id));
    }
    if (category === "all") return gamesData;
    if (category === "popular") {
      const scored = gamesData.map((game) => {
        const score = getCombinedCount(localVisits, game.id, viewCounts);
        return { game, score };
      });
      scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.game.index - a.game.index;
      });
      return scored.map((entry) => entry.game);
    }
    return gamesByCategory[category] ?? [];
  }, [category, localVisits, viewCounts]);

  const openGame = (game: GameData) => {
    const href = new URL(game.href, window.location.href).href;
    recordGameVisit(game.id, game.name);
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
        categoryLinks={categoryLinks}
        activeCategory={category}
        showCategoryBar
      />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" gutterBottom>
                {label} Games
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filtered.length} games available.
              </Typography>
            </Box>
            <Button variant="outlined" href="/">
              Back to home
            </Button>
          </Stack>
        </Paper>

        <Grid container spacing={2}>
          {filtered.map((game) => {
            const desktopOnly =
              isMobile && (game.desktopOnly || !game.mobileFriendly);
            return (
              <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={game.id}>
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
      </Container>
    </Box>
  );
}
