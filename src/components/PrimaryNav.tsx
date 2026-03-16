import React from "react";
import {
  AppBar,
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  Stack,
  Switch,
  Toolbar,
  Typography,
} from "@mui/material";

type PrimaryNavProps = {
  isDark?: boolean;
  onToggleTheme?: (nextDark: boolean) => void;
  showHomeLinks?: boolean;
  extraActions?: React.ReactNode;
};

export function PrimaryNav({
  isDark,
  onToggleTheme,
  showHomeLinks = false,
  extraActions,
}: PrimaryNavProps) {
  return (
    <AppBar position="sticky">
      <Toolbar sx={{ flexWrap: "wrap", gap: 2, py: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            component="img"
            src="/img/gams-g.png"
            alt="LearningArcade"
            sx={{ width: 18, height: 18, borderRadius: 1.5, bgcolor: "white", p: 0.25 }}
          />
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "0.08em" }}>
            LearningArcade
          </Typography>
          <Chip label="Arcade" size="small" color="secondary" />
        </Box>

        <Stack direction="row" spacing={1} sx={{ flexGrow: 1, flexWrap: "wrap" }}>
          <Button color="inherit" href="#/">
            Home
          </Button>
          {showHomeLinks ? (
            <>
              <Button color="inherit" href="#categories">
                Categories
              </Button>
              <Button color="inherit" href="#recommended-section">
                Top Picks
              </Button>
              <Button color="inherit" href="#games">
                All Games
              </Button>
            </>
          ) : null}
          <Button color="inherit" href="#/about">
            About
          </Button>
          <Button color="inherit" href="#/settings">
            Settings
          </Button>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: "wrap" }}>
          {onToggleTheme ? (
            <FormControlLabel
              label="Dark"
              control={
                <Switch
                  checked={!!isDark}
                  onChange={(event) => onToggleTheme(event.target.checked)}
                  color="secondary"
                />
              }
            />
          ) : null}
          {extraActions ? <Box sx={{ display: "flex", gap: 1 }}>{extraActions}</Box> : null}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
