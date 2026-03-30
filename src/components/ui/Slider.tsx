"use client";

import React from "react";

type SliderProps = {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
};

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className = "",
}: SliderProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value);
    onValueChange([newValue]);
  };

  return (
    <div className={`slider-root ${className}`}>
      <input
        type="range"
        className="slider-input"
        value={value[0] ?? min}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
      />
      <div
        className="slider-track"
        style={{
          width: `${(((value[0] ?? min) - min) / (max - min)) * 100}%`,
        }}
      />
      <div
        className="slider-thumb"
        style={{
          left: `${(((value[0] ?? min) - min) / (max - min)) * 100}%`,
        }}
      />
    </div>
  );
}
