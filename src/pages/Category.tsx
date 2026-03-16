import React, { useMemo } from "react";
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
import Grid from "@mui/material/GridLegacy";
import { gamesData, GameData } from "../data/games";
import { GameTypeBadge } from "../components/GameTypeBadge";
import { PrimaryNav } from "../components/PrimaryNav";
import { useDisguise } from "../hooks/useDisguise";
import { trackGameView } from "../utils/umami";

const categoryLabels: Record<string, string> = {
  action: "Action",
  puzzle: "Puzzle",
  adventure: "Adventure",
  horror: "Horror",
  racing: "Racing",
  simulation: "Simulation",
  platformer: "Platformer",
  sports: "Sports",
  tools: "Tools",
  runner: "Runner",
  favorites: "Favorites",
  all: "All",
};

function resolveCategoryFromHash(): string {
  const hash = window.location.hash.toLowerCase();
  const match = hash.match(/#\/category\/?([^?]+)/);
  if (!match) return "all";
  const raw = match[1].replace(/\//g, "").trim();
  return raw || "all";
}

export default function CategoryPage() {
  const category = resolveCategoryFromHash();
  const label = categoryLabels[category] || category;

  const baseIcon =
    (document.querySelector('link[rel*="icon"]') as HTMLLinkElement | null)?.href ||
    "/img/gams-g.png";
  useDisguise(`${label} - LearningArcade`, baseIcon);

  const filtered = useMemo(() => {
    if (category === "all") return gamesData;
    return gamesData.filter((g) => g.category === category);
  }, [category]);

  const openGame = (game: GameData) => {
    const href = new URL(game.href, window.location.href).href;
    trackGameView(game);
    window.location.hash = `#/game-embed?${new URLSearchParams({
      icon: new URL(game.img, window.location.href).href,
      name: game.name,
      src: href,
    }).toString()}`;
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <PrimaryNav />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" gutterBottom>
                {label} Games
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filtered.length} games available.
              </Typography>
            </Box>
            <Button variant="outlined" href="#/">
              Back to home
            </Button>
          </Stack>
        </Paper>

        <Grid container spacing={2}>
          {filtered.map((game) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={game.id}>
              <Card
                sx={{
                  height: "100%",
                  position: "relative",
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <CardActionArea onClick={() => openGame(game)}>
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
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
