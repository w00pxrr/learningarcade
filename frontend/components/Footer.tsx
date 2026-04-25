"use client";

import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-links">
          <Link href="/settings" className="footer-link">
            Settings
          </Link>
          <Link href="/about" className="footer-link">
            About
          </Link>
          <Link href="/category/all" className="footer-link">
            All Games
          </Link>
        </div>
        <div className="footer-copyright">
          <p>© {new Date().getFullYear()} LearningArcade. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
