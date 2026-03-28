"use client";

import React from "react";

type SwitchProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
};

export function Switch({
  checked = false,
  onCheckedChange,
  className = "",
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`switch-root ${className}`}
      onClick={() => onCheckedChange?.(!checked)}
    >
      <span className="switch-thumb" />
    </button>
  );
}
