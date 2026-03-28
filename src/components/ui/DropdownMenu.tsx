"use client";

import React, { useEffect, useRef, useState } from "react";

type DropdownMenuProps = {
  children: React.ReactNode;
};

type DropdownMenuTriggerProps = {
  asChild?: boolean;
  children: React.ReactNode;
};

type DropdownMenuContentProps = {
  className?: string;
  sideOffset?: number;
  align?: "start" | "center" | "end";
  children: React.ReactNode;
};

type DropdownMenuItemProps = {
  className?: string;
  asChild?: boolean;
  onSelect?: (event: Event) => void;
  children: React.ReactNode;
};

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="dropdown-menu" ref={menuRef}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === DropdownMenuTrigger) {
            return React.cloneElement(child as React.ReactElement<{ onClick?: () => void }>, {
              onClick: () => setIsOpen(!isOpen),
            });
          }
          if (child.type === DropdownMenuContent) {
            return isOpen ? child : null;
          }
        }
        return child;
      })}
    </div>
  );
}

export function DropdownMenuTrigger({
  asChild,
  children,
}: DropdownMenuTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    return children;
  }
  return <button className="dropdown-trigger">{children}</button>;
}

export function DropdownMenuContent({
  className = "",
  sideOffset = 8,
  align = "start",
  children,
}: DropdownMenuContentProps) {
  const alignClass = `dropdown-content-${align}`;
  return (
    <div
      className={`dropdown-content ${alignClass} ${className}`}
      style={{ marginTop: sideOffset }}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  className = "",
  asChild,
  onSelect,
  children,
}: DropdownMenuItemProps) {
  const handleClick = (event: React.MouseEvent) => {
    onSelect?.(event.nativeEvent);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>, {
      onClick: handleClick,
    });
  }

  return (
    <button className={`dropdown-item ${className}`} onClick={handleClick}>
      {children}
    </button>
  );
}
