"use client";

import React, { useState } from "react";
import Link from "next/link";

type CategoryLink = {
  value: string;
  label: string;
  href: string;
};

type CategorySidebarProps = {
  categoryLinks?: CategoryLink[];
  activeCategory?: string;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
};

// Map category values to FontAwesome icon classes
const categoryIcons: Record<string, string> = {
  all: "fa-solid fa-gamepad",
  popular: "fa-solid fa-fire",
  favorites: "fa-solid fa-star",
  action: "fa-solid fa-crosshairs",
  "action-adventure": "fa-solid fa-khanda",
  puzzle: "fa-solid fa-puzzle-piece",
  adventure: "fa-solid fa-compass",
  "role-playing": "fa-solid fa-hat-wizard",
  horror: "fa-solid fa-ghost",
  simulation: "fa-solid fa-car",
  strategy: "fa-solid fa-chess",
  idle: "fa-solid fa-clock",
  retro: "fa-solid fa-tv",
  racing: "fa-solid fa-flag-checkered",
  platformer: "fa-solid fa-person-running",
  sports: "fa-solid fa-futbol",
  flash: "fa-solid fa-bolt",
  tools: "fa-solid fa-wrench",
  runner: "fa-solid fa-person-running",
};

export function CategorySidebar({
  categoryLinks = [],
  activeCategory,
  isMobile = false,
  isOpen = false,
  onClose,
}: CategorySidebarProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const getIcon = (value: string) => {
    return categoryIcons[value] || "fa-solid fa-folder";
  };

  // Mobile sidebar (overlay)
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <div
            className="sidebar-backdrop"
            onClick={onClose}
            aria-hidden="true"
          />
        )}

        {/* Mobile Sidebar */}
        <aside className={`category-sidebar mobile ${isOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <h2 className="sidebar-title">Categories</h2>
            <button
              className="sidebar-close"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <nav className="sidebar-nav">
            {categoryLinks.map((link) => {
              const selected = activeCategory === link.value;
              return (
                <Link
                  key={link.value}
                  href={link.href}
                  className={`sidebar-link ${selected ? "active" : ""}`}
                  onClick={onClose}
                >
                  <i className={getIcon(link.value)} />
                  <span className="sidebar-link-label">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
      </>
    );
  }

  // Desktop sidebar (fixed)
  return (
    <aside className="category-sidebar desktop">
      <nav className="sidebar-nav">
        {categoryLinks.map((link) => {
          const selected = activeCategory === link.value;
          const isHovered = hoveredCategory === link.value;

          return (
            <div key={link.value} className="sidebar-item">
              <Link
                href={link.href}
                className={`sidebar-link ${selected ? "active" : ""}`}
                onMouseEnter={() => setHoveredCategory(link.value)}
                onMouseLeave={() => setHoveredCategory(null)}
                aria-label={link.label}
              >
                <i className={getIcon(link.value)} />
              </Link>

              {/* Tooltip */}
              {isHovered && <div className="sidebar-tooltip">{link.label}</div>}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
