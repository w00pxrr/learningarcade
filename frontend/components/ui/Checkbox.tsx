"use client";

import React from "react";

type CheckboxProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  children?: React.ReactNode;
};

export function Checkbox({
  checked = false,
  onCheckedChange,
  className = "",
  children,
}: CheckboxProps) {
  return (
    <label className={`checkbox-root ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className="checkbox-input"
      />
      <span className="checkbox-indicator">{checked ? "✓" : ""}</span>
      {children}
    </label>
  );
}
