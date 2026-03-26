"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Switch from "@radix-ui/react-switch";

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
};

export function PrimaryNav({
  isDark,
  onToggleTheme,
  showHomeLinks = false,
  extraActions,
  categoryLinks,
  activeCategory,
  showCategoryBar = false,
}: PrimaryNavProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;
    const loadAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          if (active) setIsAuthenticated(false);
          return;
        }
        const data = (await res.json()) as { user?: { username?: string } | null };
        if (active) setIsAuthenticated(!!data?.user);
      } catch {
        if (active) setIsAuthenticated(false);
      }
    };
    void loadAuth();
    return () => {
      active = false;
    };
  }, []);

  const showCategories = showCategoryBar && (categoryLinks?.length ?? 0) > 0;
  const accountLabel = isAuthenticated ? "Account" : "Log in";
  const accountLinkClass = isAuthenticated ? "nav-link" : "nav-link nav-link-login";
  return (
    <header className="nav-shell">
      <div className="nav-bar">
        <div className="nav-left">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="btn btn-ghost nav-hamburger" aria-label="Open menu">
                ☰
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="dropdown-content" sideOffset={8} align="start">
                <DropdownMenu.Item className="dropdown-item" asChild>
                  <Link href="/">Home</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item className="dropdown-item" asChild>
                  <Link href="/category/all">All Games</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item className="dropdown-item" asChild>
                  <Link href="/forum">Forum</Link>
                </DropdownMenu.Item>
                {showHomeLinks ? (
                  <>
                    <DropdownMenu.Item className="dropdown-item" asChild>
                      <Link href="/#categories">Categories</Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className="dropdown-item" asChild>
                      <Link href="/#recommended-section">Top Picks</Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className="dropdown-item" asChild>
                      <Link href="/#games">All Games</Link>
                    </DropdownMenu.Item>
                  </>
                ) : null}
                <DropdownMenu.Item className="dropdown-item" asChild>
                  <Link href="/about">About</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item className="dropdown-item" asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item className="dropdown-item" asChild>
                  <Link href="/account">{accountLabel}</Link>
                </DropdownMenu.Item>
                {onToggleTheme ? (
                  <DropdownMenu.Item
                    className="dropdown-item dropdown-item-switch"
                    onSelect={(event) => event.preventDefault()}
                  >
                    <span>Dark mode</span>
                    <Switch.Root
                      className="switch-root"
                      checked={!!isDark}
                      onCheckedChange={onToggleTheme}
                    >
                      <Switch.Thumb className="switch-thumb" />
                    </Switch.Root>
                  </DropdownMenu.Item>
                ) : null}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <div className="nav-brand">
            <img src="/img/Learning Arcade Background Removed.png" alt="LearningArcade" className="nav-logo" />
            <span className="nav-title">LearningArcade</span>
            <span className="chip chip-accent">Arcade</span>
          </div>
        </div>

        <nav className="nav-links">
          <Link href="/" className="nav-link">
            Home
          </Link>
          <Link href="/category/all" className="nav-link">
            All Games
          </Link>
          <Link href="/forum" className="nav-link">
            Forum
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
          <Link href="/account" className={accountLinkClass}>
            {accountLabel}
          </Link>
        </nav>

        <div className="nav-actions">
          {onToggleTheme ? (
            <label className="switch-inline">
              <span>Dark</span>
              <Switch.Root
                className="switch-root"
                checked={!!isDark}
                onCheckedChange={onToggleTheme}
              >
                <Switch.Thumb className="switch-thumb" />
              </Switch.Root>
            </label>
          ) : null}
          {extraActions ? <div className="nav-extra">{extraActions}</div> : null}
        </div>
      </div>

      {showCategories ? (
        <div className="nav-categories">
          <div className="nav-categories-inner">
            {categoryLinks?.map((link) => {
              const selected = activeCategory === link.value;
              return (
                <Link
                  key={link.value}
                  href={link.href}
                  className={`chip ${selected ? "chip-active" : ""}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </header>
  );
}
