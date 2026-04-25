import React from "react";
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
  const sizeClass = size === "xs" ? "badge-xs" : "badge-sm";
  return (
    <span className={`game-badge ${flash ? "badge-flash" : "badge-html"} ${sizeClass}`}>
      {label}
    </span>
  );
});
