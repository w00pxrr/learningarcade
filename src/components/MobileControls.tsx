"use client";

import React, { useCallback, useState } from "react";

interface MobileControlsProps {
  onSendKey: (eventType: "keydown" | "keyup", key: string) => void;
}

export default function MobileControls({ onSendKey }: MobileControlsProps) {
  const [activeButton, setActiveButton] = useState<string | null>(null);

  const handleButtonPress = (key: string) => {
    setActiveButton(key);
    onSendKey("keydown", key);
  };

  const handleButtonRelease = (key: string) => {
    setActiveButton(null);
    onSendKey("keyup", key);
  };

  return (
    <div className="mobile-controls" aria-label="Mobile game controls">
      <div className="mobile-dpad">
        <button
          className={`arrow-btn ${activeButton === "ArrowUp" ? "active" : ""}`}
          style={{ gridColumn: 2, gridRow: 1 }}
          onPointerDown={(event) => {
            event.preventDefault();
            handleButtonPress("ArrowUp");
          }}
          onPointerUp={(event) => {
            event.preventDefault();
            handleButtonRelease("ArrowUp");
          }}
          onPointerLeave={(event) => {
            event.preventDefault();
            handleButtonRelease("ArrowUp");
          }}
        >
          ▲
        </button>
        {(
          [
            ["ArrowLeft", "◀", 1, 2],
            ["ArrowDown", "▼", 2, 2],
            ["ArrowRight", "▶", 3, 2],
          ] as Array<[string, string, number, number]>
        ).map(([keyValue, label, col, row]) => (
          <button
            key={keyValue}
            className={`arrow-btn ${activeButton === keyValue ? "active" : ""}`}
            style={{ gridColumn: col, gridRow: row }}
            onPointerDown={(event) => {
              event.preventDefault();
              handleButtonPress(keyValue);
            }}
            onPointerUp={(event) => {
              event.preventDefault();
              handleButtonRelease(keyValue);
            }}
            onPointerLeave={(event) => {
              event.preventDefault();
              handleButtonRelease(keyValue);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        className={`space-btn ${activeButton === " " ? "active" : ""}`}
        onPointerDown={(event) => {
          event.preventDefault();
          handleButtonPress(" ");
        }}
        onPointerUp={(event) => {
          event.preventDefault();
          handleButtonRelease(" ");
        }}
        onPointerLeave={(event) => {
          event.preventDefault();
          handleButtonRelease(" ");
        }}
      >
        Space
      </button>
    </div>
  );
}
