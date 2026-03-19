import { expect, test, type Page } from "@playwright/test";

const routes = [
  { name: "home", path: "/" },
  { name: "about", path: "/about" },
  { name: "settings", path: "/settings" },
  { name: "search", path: "/search?q=run" },
  { name: "category-action", path: "/category/action" },
  {
    name: "game-embed",
    path: "/game-embed?name=2048&icon=/img/gams-g.png&src=/games/2048.html",
  },
];

const skipButtonText = new Set([
  "Fullscreen",
  "Exit full",
  "Upload icon",
  "Report a bug",
]);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const noop = () => undefined;
    try {
      history.pushState = noop;
      history.replaceState = noop;
    } catch {}
    try {
      window.open = () => null;
    } catch {}
    try {
      window.location.assign = noop;
      window.location.replace = noop;
    } catch {}
    document.addEventListener(
      "click",
      (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const anchor = target.closest("a");
        if (!anchor) return;
        const href = anchor.getAttribute("href") || "";
        if (href && !href.startsWith("#")) {
          event.preventDefault();
        }
      },
      true,
    );
  });
});

async function acceptCookieConsent(page: Page) {
  const accept = page.getByRole("button", { name: "Accept all" });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
  }
}

async function clickAllButtons(page: Page) {
  let totalClicked = 0;

  for (let pass = 0; pass < 3; pass++) {
    const clicked = await page.evaluate((skipText) => {
      const selector = 'button, [role="button"], [role="menuitem"]';
      const elements = Array.from(document.querySelectorAll(selector));
      let clickedCount = 0;

      for (const element of elements) {
        if (!(element instanceof HTMLElement)) continue;
        if (element.dataset.uiClicked === "true") continue;
        if (element.closest(".MuiCardActionArea-root")) continue;
        if (element.closest("[aria-hidden='true']")) continue;
        if (element.querySelector("input[type='file']")) continue;
        if (element.hasAttribute("disabled")) continue;
        if (element.getAttribute("aria-disabled") === "true") continue;

        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        const text = (element.textContent || "").trim();
        if (text && skipText.includes(text)) continue;

        const anchor = element instanceof HTMLAnchorElement ? element : element.closest("a");
        if (anchor) {
          const href = anchor.getAttribute("href") || "";
          if (href.startsWith("http") || href.startsWith("mailto:")) continue;
        }

        element.scrollIntoView({ block: "center", inline: "center" });
        element.dataset.uiClicked = "true";
        try {
          element.click();
          clickedCount += 1;
        } catch {}
      }

      return clickedCount;
    }, Array.from(skipButtonText));

    totalClicked += clicked;
    await page.waitForTimeout(100);
    if (clicked === 0) break;
  }

  return totalClicked;
}

for (const route of routes) {
  test(`ui buttons: ${route.name}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto(route.path, { waitUntil: "networkidle" });
    await acceptCookieConsent(page);
    const clicked = await clickAllButtons(page);

    const hydrationErrors = errors.filter((err) =>
      err.toLowerCase().includes("hydration failed"),
    );

    expect(hydrationErrors, `Hydration errors on ${route.path}`).toEqual([]);
    expect(clicked, `No clickable buttons found on ${route.path}`).toBeGreaterThan(0);
  });
}
