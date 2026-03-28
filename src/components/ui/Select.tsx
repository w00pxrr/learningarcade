"use client";

import React, { useEffect, useRef, useState } from "react";

type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
};

type SelectTriggerProps = {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

type SelectValueProps = {
  placeholder?: string;
};

type SelectIconProps = {
  className?: string;
  children: React.ReactNode;
};

type SelectContentProps = {
  className?: string;
  style?: React.CSSProperties;
  position?: "popper" | "item-aligned";
  children: React.ReactNode;
};

type SelectViewportProps = {
  className?: string;
  children: React.ReactNode;
};

type SelectItemProps = {
  value: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

type SelectItemTextProps = {
  children: React.ReactNode;
};

export function Select({ value, onValueChange, children }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="select-root" ref={selectRef}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === SelectTrigger) {
            return React.cloneElement(child as React.ReactElement<{ onClick?: () => void }>, {
              onClick: () => setIsOpen(!isOpen),
            });
          }
          if (child.type === SelectContent) {
            return isOpen ? child : null;
          }
        }
        return child;
      })}
    </div>
  );
}

export function SelectTrigger({ className = "", style, children }: SelectTriggerProps) {
  return (
    <button className={`select-trigger ${className}`} type="button" style={style}>
      {children}
    </button>
  );
}

export function SelectValue({ placeholder }: SelectValueProps) {
  return <span className="select-value">{placeholder}</span>;
}

export function SelectIcon({ className = "", children }: SelectIconProps) {
  return <span className={`select-icon ${className}`}>{children}</span>;
}

export function SelectContent({
  className = "",
  style,
  position = "popper",
  children,
}: SelectContentProps) {
  const positionClass = position === "popper" ? "select-content-popper" : "";
  return (
    <div className={`select-content ${positionClass} ${className}`} style={style}>
      {children}
    </div>
  );
}

export function SelectViewport({ className = "", children }: SelectViewportProps) {
  return <div className={`select-viewport ${className}`}>{children}</div>;
}

export function SelectItem({ value, className = "", style, children }: SelectItemProps) {
  return (
    <div className={`select-item ${className}`} data-value={value} style={style}>
      {children}
    </div>
  );
}

export function SelectItemText({ children }: SelectItemTextProps) {
  return <span className="select-item-text">{children}</span>;
}
