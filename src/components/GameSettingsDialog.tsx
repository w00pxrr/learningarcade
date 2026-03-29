"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  Slider,
  Switch,
} from "./ui";

type FilterState = {
  brightness: number;
  contrast: number;
  hue: number;
  blur: number;
  saturate: number;
  grayscale: number;
  sepia: number;
  invert: number;
  opacity: number;
  dropShadow: number;
};

interface GameSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  windowLock: boolean;
  onWindowLockChange: (locked: boolean) => void;
  filters: FilterState;
  filterControls: Array<{
    label: string;
    key: keyof FilterState;
    min: number;
    max: number;
    step: number;
  }>;
  onFilterChange: (key: keyof FilterState, value: number) => void;
}

export default function GameSettingsDialog({
  open,
  onOpenChange,
  windowLock,
  onWindowLockChange,
  filters,
  filterControls,
  onFilterChange,
}: GameSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-content">
        <DialogHeader className="dialog-header">
          <DialogTitle className="dialog-title">⚙️ Game Settings</DialogTitle>
          <DialogClose asChild>
            <button className="btn btn-ghost btn-sm">✕</button>
          </DialogClose>
        </DialogHeader>
        <div className="ui-stack">
          <label className="switch-row">
            <Switch
              className="switch-root"
              checked={windowLock}
              onCheckedChange={onWindowLockChange}
            />
            <span>Ask before closing window</span>
          </label>
          {filterControls.map(({ label, key, min, max, step }) => (
            <div key={key} className="slider-block">
              <div className="slider-row">
                <span className="slider-label">{label}</span>
                <span className="slider-value">{filters[key]}</span>
              </div>
              <Slider
                className="slider-root"
                value={[filters[key]]}
                min={min}
                max={max}
                step={step}
                onValueChange={(value: number[]) =>
                  onFilterChange(key, value[0] ?? min)
                }
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
