import React from "react";

type DesktopOnlyOverlayProps = {
  visible: boolean;
};

export function DesktopOnlyOverlay({ visible }: DesktopOnlyOverlayProps) {
  if (!visible) return null;

  return (
    <div className="desktop-only-overlay">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="desktop-only-icon">
        <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 5c0-1.1-.9-2-2-2H4C2.9 3 2 3.9 2 5v11c0 1.1.9 2 2 2H0v2h24v-2h-4zm0-2H4V5h16v11z" />
      </svg>
      <span className="desktop-only-label">Desktop only</span>
    </div>
  );
}
