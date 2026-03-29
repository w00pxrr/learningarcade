"use client";

import React, { useState, lazy, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Switch,
} from "./ui";

const CategorySidebar = lazy(() =>
  import("./CategorySidebar").then((mod) => ({ default: mod.CategorySidebar })),
);

type CategoryLink = {
  value: string;
  label: string;
  href: string;
};

type PrimaryNavProps = {
  isDark?: boolean;
  onToggleTheme?: (nextDark: boolean) => void;
  showHomeLinks?: boolean;
  extraActions?: React.ReactNode;
  categoryLinks?: CategoryLink[];
  activeCategory?: string;
  showCategoryBar?: boolean;
  showSidebar?: boolean;
};

export function PrimaryNav({
  isDark,
  onToggleTheme,
  showHomeLinks = false,
  extraActions,
  categoryLinks,
  activeCategory,
  showCategoryBar = false,
  showSidebar = false,
}: PrimaryNavProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const showCategories = showCategoryBar && (categoryLinks?.length ?? 0) > 0;
  const showSidebarNav = showSidebar && (categoryLinks?.length ?? 0) > 0;

  return (
    <>
      <header className={`nav-shell ${showSidebarNav ? "has-sidebar" : ""}`}>
        <div className="nav-bar">
          <div className="nav-left">
            {/* Mobile sidebar toggle */}
            {showSidebarNav && (
              <button
                className="sidebar-toggle"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open categories"
              >
                <i className="fa-solid fa-bars" />
              </button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="nav-hamburger" aria-label="Open menu">
                  ☰
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="dropdown-content"
                sideOffset={8}
                align="start"
              >
                <DropdownMenuItem className="dropdown-item" asChild>
                  <Link href="/">Home</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="dropdown-item" asChild>
                  <Link href="/category/all">All Games</Link>
                </DropdownMenuItem>
                {showHomeLinks ? (
                  <>
                    <DropdownMenuItem className="dropdown-item" asChild>
                      <Link href="/#categories">Categories</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="dropdown-item" asChild>
                      <Link href="/#recommended-section">Top Picks</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="dropdown-item" asChild>
                      <Link href="/#games">All Games</Link>
                    </DropdownMenuItem>
                  </>
                ) : null}
                <DropdownMenuItem className="dropdown-item" asChild>
                  <Link href="/about">About</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="dropdown-item" asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                {onToggleTheme ? (
                  <DropdownMenuItem
                    className="dropdown-item dropdown-item-switch"
                    onSelect={(event) => event.preventDefault()}
                  >
                    <span>Dark mode</span>
                    <Switch
                      className="switch-root"
                      checked={!!isDark}
                      onCheckedChange={onToggleTheme}
                    />
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/" className="nav-brand">
              <Image
                src="/img/Learning Arcade Background Removed.png"
                alt="LearningArcade"
                className="nav-logo"
                width={40}
                height={40}
                priority
              />
              <span className="nav-title">LearningArcade</span>
            </Link>
          </div>

          <nav className="nav-links">
            <Link href="/" className="nav-link">
              Home
            </Link>
            <Link href="/category/all" className="nav-link">
              All Games
            </Link>
            {showHomeLinks ? (
              <>
                <Link href="/#categories" className="nav-link">
                  Categories
                </Link>
                <Link href="/#recommended-section" className="nav-link">
                  Top Picks
                </Link>
                <Link href="/#games" className="nav-link">
                  All Games
                </Link>
              </>
            ) : null}
            <Link href="/about" className="nav-link">
              About
            </Link>
            <Link href="/settings" className="nav-link">
              Settings
            </Link>
          </nav>

          <div className="nav-actions">
            {onToggleTheme ? (
              <label
                className="switch-inline"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--cg-text-secondary)",
                  }}
                >
                  Dark
                </span>
                <Switch
                  className="switch-root"
                  checked={!!isDark}
                  onCheckedChange={onToggleTheme}
                />
              </label>
            ) : null}
            {extraActions ? (
              <div className="nav-extra">{extraActions}</div>
            ) : null}
          </div>
        </div>

        {/* Category bar - only shown when sidebar is not used */}
        {showCategories && !showSidebarNav ? (
          <div className="nav-categories">
            <div className="nav-categories-inner">
              {categoryLinks?.map((link) => {
                const selected = activeCategory === link.value;
                return (
                  <Link
                    key={link.value}
                    href={link.href}
                    className={`chip ${selected ? "active" : ""}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </header>

      {/* Category Sidebar */}
      {showSidebarNav && (
        <Suspense fallback={null}>
          <CategorySidebar
            categoryLinks={categoryLinks}
            activeCategory={activeCategory}
            isMobile={false}
          />
        </Suspense>
      )}

      {/* Mobile Sidebar */}
      {showSidebarNav && (
        <Suspense fallback={null}>
          <CategorySidebar
            categoryLinks={categoryLinks}
            activeCategory={activeCategory}
            isMobile={true}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}
