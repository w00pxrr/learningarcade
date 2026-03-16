import React from "react";

type LayoutProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showControls?: boolean;
  onToggleTheme?: (nextDark: boolean) => void;
  isDark?: boolean;
};

export function Layout({
  title,
  subtitle,
  children,
  showControls = true,
  onToggleTheme,
  isDark = false,
}: LayoutProps) {
  return (
    <div className="min-h-screen px-4 pb-16 pt-6 text-textSecondary">
      <nav className="glass-panel mb-6 flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-4">
          <a className="nav-link" href="#/">
            Home
          </a>
          <a className="nav-link" href="#/settings">
            Settings
          </a>
          <a className="nav-link" href="#/about">
            About
          </a>
        </div>

        {showControls ? (
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-textSecondary">
              <span>Dark mode</span>
              <input
                type="checkbox"
                checked={isDark}
                onChange={(event) => onToggleTheme?.(event.target.checked)}
                className="h-4 w-4 accent-[var(--gams-link)]"
              />
            </label>
          </div>
        ) : null}
      </nav>

      <section className="glass-panel mb-8 px-6 py-8">
        <h1 className="text-title font-display text-4xl leading-none tracking-[0.25em]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 max-w-3xl text-sm font-medium uppercase tracking-[0.3em] text-textSecondary">
            {subtitle}
          </p>
        ) : null}
      </section>

      <main>{children}</main>
    </div>
  );
}
