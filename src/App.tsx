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
  const { theme, toggleTheme, contrast, toggleContrast } = useTheme();
  const isDark = theme === "dark";
  const isHighContrast = contrast === "high";
  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDark ? "dark" : "light",
          primary: isHighContrast
            ? {
                main: isDark ? "#00e5ff" : "#0057ff",
                contrastText: isDark ? "#000000" : "#ffffff",
              }
            : {
                main: isDark ? "#22c55e" : "#14b047",
                contrastText: "#ffffff",
              },
          secondary: isHighContrast
            ? {
                main: isDark ? "#ffd400" : "#111111",
                contrastText: isDark ? "#000000" : "#ffffff",
              }
            : {
                main: "#f7b500",
                contrastText: "#1f1400",
              },
          background: isHighContrast
            ? {
                default: isDark ? "#000000" : "#ffffff",
                paper: isDark ? "#0b0b0b" : "#ffffff",
              }
            : {
                default: isDark ? "#0c1410" : "#f6f7fb",
                paper: isDark ? "#101b14" : "#ffffff",
              },
          text: isHighContrast
            ? {
                primary: isDark ? "#ffffff" : "#000000",
                secondary: isDark ? "#e6e6e6" : "#111111",
              }
            : {
                primary: isDark ? "#eef5f0" : "#0f172a",
                secondary: isDark ? "#b7c4bc" : "#52607a",
              },
          divider: isHighContrast ? (isDark ? "#ffffff" : "#000000") : undefined,
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
                backgroundImage: isHighContrast
                  ? "none"
                  : "linear-gradient(90deg, #1db954, #15994a)",
                backgroundColor: isHighContrast
                  ? isDark
                    ? "#000000"
                    : "#ffffff"
                  : undefined,
                color: isHighContrast ? (isDark ? "#ffffff" : "#000000") : undefined,
                borderBottom: isHighContrast
                  ? `1px solid ${isDark ? "#ffffff" : "#000000"}`
                  : "none",
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
          MuiPaper: {
            styleOverrides: {
              root: {
                border: isHighContrast
                  ? `1px solid ${isDark ? "#ffffff" : "#000000"}`
                  : "none",
              },
            },
          },
        },
      }),
    [isDark, isHighContrast]
  );

  let content: React.ReactNode;
  if (page === "settings") {
    content = (
      <SettingsPage
        isDark={isDark}
        onToggleTheme={toggleTheme}
        isHighContrast={isHighContrast}
        onToggleContrast={toggleContrast}
      />
    );
  } else if (page === "search") {
    content = <SearchPage isDark={isDark} onToggleTheme={toggleTheme} />;
  } else if (page === "about") {
    content = <AboutPage isDark={isDark} onToggleTheme={toggleTheme} />;
  } else if (page === "game-embed") {
    content = <GameEmbedPage />;
  } else if (page === "category") {
    content = <CategoryPage />;
  } else {
    content = <HomePage isDark={isDark} onToggleTheme={toggleTheme} />;
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
