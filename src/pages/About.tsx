import React, { useEffect } from "react";
import {
  Box,
  Container,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { PrimaryNav } from "../components/PrimaryNav";
import { useDisguise } from "../hooks/useDisguise";

type AboutProps = {
  isDark: boolean;
  onToggleTheme: (nextDark: boolean) => void;
};

export default function AboutPage({ isDark, onToggleTheme }: AboutProps) {
  const baseIcon =
    (document.querySelector('link[rel*="icon"]') as HTMLLinkElement | null)?.href ||
    "/img/gams-g.png";
  useDisguise("About - LearningArcade", baseIcon);

  useEffect(() => {
    const existing = document.querySelector("script[data-about-secrets='true']");
    if (existing) return;

    const loadSecrets = () => {
      const present = document.querySelector("script[data-about-secrets='true']");
      if (present) return;
      const script = document.createElement("script");
      script.src = "/assets/about-secrets.js";
      script.defer = true;
      script.dataset.aboutSecrets = "true";
      document.body.appendChild(script);
      window.removeEventListener("keydown", loadSecrets);
      window.removeEventListener("click", loadSecrets);
      window.removeEventListener("pointerdown", loadSecrets);
    };

    window.addEventListener("keydown", loadSecrets, { once: true });
    window.addEventListener("click", loadSecrets, { once: true });
    window.addEventListener("pointerdown", loadSecrets, { once: true });
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <PrimaryNav isDark={isDark} onToggleTheme={onToggleTheme} />

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h5" gutterBottom>
              About LearningArcade
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Why LearningArcade exists and how it works.
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              What is LearningArcade?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              LearningArcade is a curated collection of games you can play in
              school-friendly environments. It focuses on quick access, clean
              navigation, and a mix of educational and classic titles.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Instead of chasing the most heavyweight, internet-dependent setups,
              the goal is to keep the experience smooth, even when connectivity is limited.
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Why choose LearningArcade?
            </Typography>
            <List dense>
              {[
                "Simple design: focus on games, not clutter.",
                "Unique selection: a mix you won't find in every collection.",
                "Easy to use: fast loading and clear categories.",
                "Dark mode: easier on the eyes for long sessions.",
              ].map((item) => (
                <ListItem key={item} sx={{ pl: 0 }}>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              How does it work?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Games usually rely on online resources, which can be blocked or slow in school
              networks. LearningArcade keeps things lightweight by bundling assets and
              streamlining how games are loaded.
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Additional notes
            </Typography>
            <List dense>
              {[
                "Recommended game: Drive Mad is a must-try.",
                "Updates land regularly with fresh picks.",
                "Quality matters: every game here is handpicked for fun and stability.",
                "Ruffle makes Flash classics playable in modern browsers.",
                "Mine, all mine: LearningArcade is mine, the project, not the games.",
              ].map((item) => (
                <ListItem key={item} sx={{ pl: 0 }}>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Credits
            </Typography>
            <List dense>
              {[
                "Forked by w00pxrr",
                "Original creator: mountain658",
                "Thanks to Jacob Kern and Alec Ponce for contributions.",
              ].map((item) => (
                <ListItem key={item} sx={{ pl: 0 }}>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              This site uses Ruffle to emulate Flash content.
            </Typography>
            <TextField
              type="password"
              placeholder="Enter passcode"
              fullWidth
              sx={{ mt: 2 }}
              onInput={(event) => {
                const target = event.currentTarget as HTMLInputElement;
                const value = target.value;
                target.value = "";
                const fn = (window as unknown as { keyComboActive?: (key: string) => void })
                  .keyComboActive;
                if (fn) fn(value);
              }}
            />
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
