"use client";

import React, { useEffect, useState } from "react";
import { PrimaryNav } from "../components/PrimaryNav";
import { useThemeContext } from "../components/ThemeRoot";
import { useDisguise } from "../hooks/useDisguise";
import aboutContent from "../data/aboutContent.json";
function getBaseIcon(): string {
  if (typeof window === "undefined") return "/img/gams-g.png";
  return (
    (document.querySelector('link[rel*="icon"]') as HTMLLinkElement | null)?.href ||
    "/img/gams-g.png"
  );
}

export default function AboutPage() {
  const { isDark, toggleTheme } = useThemeContext();
  const [baseIcon, _setBaseIcon] = useState(getBaseIcon);

  useDisguise("About - LearningArcade", baseIcon);

  useEffect(() => {
    const existing = document.querySelector("script[data-about-secrets='true']");
    if (existing) return;

    const loadSecrets = () => {
      const present = document.querySelector("script[data-about-secrets='true']");
      if (present) return;
      const script = document.createElement("script");
      script.src = "/assets/about-secrets.js";
      script.defer = true;
      script.dataset.aboutSecrets = "true";
      document.body.appendChild(script);
      window.removeEventListener("keydown", loadSecrets);
      window.removeEventListener("click", loadSecrets);
      window.removeEventListener("pointerdown", loadSecrets);
    };

    window.addEventListener("keydown", loadSecrets, { once: true });
    window.addEventListener("click", loadSecrets, { once: true });
    window.addEventListener("pointerdown", loadSecrets, { once: true });
  }, []);

  return (
    <div className="ui-page">
      <PrimaryNav isDark={isDark} onToggleTheme={toggleTheme} />

      <main className="ui-container ui-container-md">
        <div className="ui-stack">
          <section className="panel">
            <h2 className="panel-heading">About LearningArcade</h2>
            <p className="muted">Why LearningArcade exists and how it works.</p>
          </section>

          <section className="panel">
            <h3 className="panel-title">What is LearningArcade?</h3>
            <p className="muted">
              LearningArcade is a curated collection of games you can play in school-friendly
              environments. It focuses on quick access, clean navigation, and a mix of educational
              and classic titles.
            </p>
            <p className="muted">
              Instead of chasing the most heavyweight, internet-dependent setups, the goal is to
              keep the experience smooth, even when connectivity is limited.
            </p>
          </section>

          <section className="panel">
            <h3 className="panel-title">Why choose LearningArcade?</h3>
            <ul className="list">
              {aboutContent.reasons.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h3 className="panel-title">How does it work?</h3>
            <p className="muted">
              Games usually rely on online resources, which can be blocked or slow in school
              networks. LearningArcade keeps things lightweight by bundling assets and streamlining
              how games are loaded.
            </p>
          </section>

          <section className="panel">
            <h3 className="panel-title">Additional notes</h3>
            <ul className="list">
              {aboutContent.notes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h3 className="panel-title">Credits</h3>
            <ul className="list">
              {aboutContent.credits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="muted">This site uses Ruffle to emulate Flash content.</p>
            <input
              className="input"
              type="password"
              placeholder="Enter passcode"
              onInput={(event) => {
                const target = event.currentTarget as HTMLInputElement;
                const value = target.value;
                target.value = "";
                const fn = (
                  window as unknown as {
                    keyComboActive?: (key: string) => void;
                  }
                ).keyComboActive;
                if (fn) fn(value);
              }}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
