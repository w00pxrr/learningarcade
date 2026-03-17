import React from "react";
import { Box } from "@mui/material";
import { GameData } from "../data/games";

type GameTypeBadgeProps = {
  game: GameData;
  size?: "sm" | "xs";
};

function isFlashGame(game: GameData): boolean {
  const section = game.section.toLowerCase();
  const type = game.type.toLowerCase();
  return section.includes("flash") || type.includes("flash");
}

export const GameTypeBadge = React.memo(function GameTypeBadge({
  game,
  size = "sm",
}: GameTypeBadgeProps) {
  const flash = isFlashGame(game);
  const label = flash ? "Flash" : "HTML5";
  const fontSize = size === "xs" ? 10 : 11;
  const paddingX = size === "xs" ? 0.6 : 0.8;
  const paddingY = size === "xs" ? 0.15 : 0.25;

  return (
    <Box
      component="span"
      sx={(theme) => {
        const bg = flash ? theme.palette.warning.main : theme.palette.success.main;
        return {
          display: "inline-flex",
          alignItems: "center",
          borderRadius: 999,
          px: paddingX,
          py: paddingY,
          fontSize,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          bgcolor: bg,
          color: theme.palette.getContrastText(bg),
          lineHeight: 1,
          whiteSpace: "nowrap",
        };
      }}
    >
      {label}
    </Box>
  );
});
