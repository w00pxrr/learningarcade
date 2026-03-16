import React, { useMemo } from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { useTheme } from "./hooks/useTheme";

const HomePage = React.lazy(() => import("./pages/Home"));
const SearchPage = React.lazy(() => import("./pages/Search"));
const SettingsPage = React.lazy(() => import("./pages/Settings"));
const AboutPage = React.lazy(() => import("./pages/About"));
const GameEmbedPage = React.lazy(() => import("./pages/GameEmbed"));
const CategoryPage = React.lazy(() => import("./pages/Category"));

type AppProps = {
  page: string;
};

export default function App({ page }: AppProps) {
  const { theme, toggleTheme } = useTheme();
  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: theme === "dark" ? "dark" : "light",
          primary: {
            main: theme === "dark" ? "#22c55e" : "#14b047",
            contrastText: "#ffffff",
          },
          secondary: {
            main: "#f7b500",
            contrastText: "#1f1400",
          },
          background: {
            default: theme === "dark" ? "#0c1410" : "#f6f7fb",
            paper: theme === "dark" ? "#101b14" : "#ffffff",
          },
          text: {
            primary: theme === "dark" ? "#eef5f0" : "#0f172a",
            secondary: theme === "dark" ? "#b7c4bc" : "#52607a",
          },
        },
        shape: {
          borderRadius: 18,
        },
        typography: {
          fontFamily:
            '"Avenir Next", "Trebuchet MS", "Segoe UI", "Segoe UI Variable Text", sans-serif',
          h4: {
            fontWeight: 800,
          },
          h5: {
            fontWeight: 700,
          },
          button: {
            fontWeight: 700,
            textTransform: "none",
          },
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundImage: "linear-gradient(90deg, #1db954, #15994a)",
                boxShadow: "none",
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 999,
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              },
            },
          },
        },
      }),
    [theme]
  );

  let content: React.ReactNode;
  if (page === "settings") {
    content = <SettingsPage isDark={theme === "dark"} onToggleTheme={toggleTheme} />;
  } else if (page === "search") {
    content = <SearchPage isDark={theme === "dark"} onToggleTheme={toggleTheme} />;
  } else if (page === "about") {
    content = <AboutPage isDark={theme === "dark"} onToggleTheme={toggleTheme} />;
  } else if (page === "game-embed") {
    content = <GameEmbedPage />;
  } else if (page === "category") {
    content = <CategoryPage />;
  } else {
    content = <HomePage isDark={theme === "dark"} onToggleTheme={toggleTheme} />;
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <React.Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
        {content}
      </React.Suspense>
    </ThemeProvider>
  );
}
