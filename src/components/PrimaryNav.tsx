import React from "react";
import Link from "next/link";
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Switch,
  Toolbar,
  Typography,
} from "@mui/material";

type CategoryLink = {
  value: string;
  label: string;
  href: string;
};

type PrimaryNavProps = {
  isDark?: boolean;
  onToggleTheme?: (nextDark: boolean) => void;
  showHomeLinks?: boolean;
  extraActions?: React.ReactNode;
  categoryLinks?: CategoryLink[];
  activeCategory?: string;
  showCategoryBar?: boolean;
};

export function PrimaryNav({
  isDark,
  onToggleTheme,
  showHomeLinks = false,
  extraActions,
  categoryLinks,
  activeCategory,
  showCategoryBar = false,
}: PrimaryNavProps) {
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(menuAnchor);
  const showCategories = showCategoryBar && (categoryLinks?.length ?? 0) > 0;
  return (
    <AppBar
      position="sticky"
      sx={(theme) => ({
        "@media (max-width: 900px) and (orientation: landscape)": {
          display: "none",
        },
        [theme.breakpoints.down("sm")]: {
          backgroundImage: "none",
          backgroundColor: "transparent",
          boxShadow: "none",
        },
      })}
    >
      <Toolbar sx={{ flexWrap: "wrap", gap: 2, py: 1 }}>
        <IconButton
          aria-label="Open menu"
          onClick={(event) => setMenuAnchor(event.currentTarget)}
          disableRipple
          disableFocusRipple
          sx={{
            display: { xs: "inline-flex", md: "none" },
            bgcolor: "transparent",
            "&:hover": { bgcolor: "transparent" },
          }}
        >
          ☰
        </IconButton>

        <Menu
          anchorEl={menuAnchor}
          open={isMenuOpen}
          onClose={() => setMenuAnchor(null)}
          keepMounted
        >
          <MenuItem component={Link} href="/" onClick={() => setMenuAnchor(null)}>
            Home
          </MenuItem>
          <MenuItem component={Link} href="/category/all" onClick={() => setMenuAnchor(null)}>
            All Games
          </MenuItem>
          {showHomeLinks ? (
            [
              <MenuItem key="categories" component="a" href="/#categories" onClick={() => setMenuAnchor(null)}>
                Categories
              </MenuItem>,
              <MenuItem key="recommended" component="a" href="/#recommended-section" onClick={() => setMenuAnchor(null)}>
                Top Picks
              </MenuItem>,
              <MenuItem key="games" component="a" href="/#games" onClick={() => setMenuAnchor(null)}>
                All Games
              </MenuItem>,
            ]
          ) : null}
          <MenuItem component={Link} href="/about" onClick={() => setMenuAnchor(null)}>
            About
          </MenuItem>
          <MenuItem component={Link} href="/settings" onClick={() => setMenuAnchor(null)}>
            Settings
          </MenuItem>
          {onToggleTheme ? (
            <MenuItem>
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
            </MenuItem>
          ) : null}
        </Menu>

        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1 }}>
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

        <Stack
          direction="row"
          spacing={1}
          sx={{ flexGrow: 1, flexWrap: "wrap", display: { xs: "none", md: "flex" } }}
        >
          <Button color="inherit" component={Link} href="/">
            Home
          </Button>
          <Button color="inherit" component={Link} href="/category/all">
            All Games
          </Button>
          {showHomeLinks ? (
            <>
              <Button color="inherit" href="/#categories">
                Categories
              </Button>
              <Button color="inherit" href="/#recommended-section">
                Top Picks
              </Button>
              <Button color="inherit" href="/#games">
                All Games
              </Button>
            </>
          ) : null}
          <Button color="inherit" component={Link} href="/about">
            About
          </Button>
          <Button color="inherit" component={Link} href="/settings">
            Settings
          </Button>
        </Stack>

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ flexWrap: "wrap", display: { xs: "none", md: "flex" } }}
        >
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
      {showCategories ? (
        <Box sx={{ borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
          <Container maxWidth="xl" sx={{ py: 1 }}>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{
                flexWrap: { xs: "nowrap", md: "wrap" },
                overflowX: { xs: "auto", md: "visible" },
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {categoryLinks?.map((link) => {
                const selected = activeCategory === link.value;
                return (
                  <Chip
                    key={link.value}
                    label={link.label}
                    component={Link}
                    href={link.href}
                    clickable
                    color={selected ? "secondary" : "default"}
                    variant={selected ? "filled" : "outlined"}
                    sx={{ textDecoration: "none" }}
                  />
                );
              })}
            </Stack>
          </Container>
        </Box>
      ) : null}
    </AppBar>
  );
}
