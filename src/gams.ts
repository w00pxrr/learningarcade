"use strict";
// --- Types ---

interface StoredJSONKeyOpt {
  key: string;
  value?: string;
}

interface CookieConsent {
  settings?: boolean;
  analytics?: boolean;
}

type GamListSection = { title: string; type: "section" };
type GamListItem =
  | GamListSection
  | {
      name: string;
      id?: string;
      href?: string;
      img?: string;
      src?: string;
      type?: string;
    };

interface GameData {
  id: string;
  name: string;
  href: string;
  img: string;
  type: string;
  section: string;
  category: string;
  index: number;
  searchName: string;
}

function isSectionEntry(entry: GamListItem): entry is GamListSection {
  return "title" in entry && entry.title !== undefined;
}

function getCategory(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('soccer') || lower.includes('football') || lower.includes('sports')) return 'sports';
  if (lower.includes('puzzle') || lower.includes('quiz') || lower.includes('bloxorz') || lower.includes('tetris') || lower.includes('2048') || lower.includes('wordle') || lower.includes('impossible')) return 'puzzle';
  if (lower.includes('code editor') || lower.includes('web retro') || lower.includes('proxy browser') || lower.includes('calculator') || lower.includes('ruffle flash player')) return 'tools';
  if (lower.includes('run') || lower.includes('slope') || lower.includes('tunnel rush') || lower.includes('drift boss') || lower.includes('subway surfers')) return 'runner';
  if (lower.includes('mario') || lower.includes('sonic') || lower.includes('geometry dash') || lower.includes('drift') || lower.includes('drive') || lower.includes('tunnel') || lower.includes('madalin') || lower.includes('stickman') || lower.includes('qwop') || lower.includes('aim') || lower.includes('snake') || lower.includes('pacman') || lower.includes('cat ninja') || lower.includes('burrito bison') || lower.includes('hole io') || lower.includes('tube jumpers') || lower.includes('agario') || lower.includes('paper io') || lower.includes('cell machine') || lower.includes('evil glitch') || lower.includes('game inside') || lower.includes('grey box') || lower.includes('ai creatures') || lower.includes('fluid simulator') || lower.includes('mountain maze') || lower.includes('radius raid') || lower.includes('rolling forests') || lower.includes('stack') || lower.includes('its raining boxes') || lower.includes('sand game') || lower.includes('offline paradise') || lower.includes('spacebar clicker') || lower.includes('cube field') || lower.includes('cookie clicker')) return 'action';
  if (lower.includes('adventure') || lower.includes('retro') || lower.includes('celeste') || lower.includes('portal') || lower.includes('fireboy') || lower.includes('watergirl') || lower.includes('raft') || lower.includes('worlds hardest') || lower.includes('escaping') || lower.includes('infiltrating') || lower.includes('fleeing') || lower.includes('breaking') || lower.includes('stealing') || lower.includes('bloons tower defense') || lower.includes('learn to fly') || lower.includes('papas') || lower.includes('just one boss') || lower.includes('40x escape') || lower.includes('duck life') || lower.includes('use boxmen') || lower.includes('doom') || lower.includes('johnny upgrade') || lower.includes('ruffle'))
    return 'adventure';
  return 'action'; // default
}

// --- Bootstrap: ensure stored gam mode exists (runs before init) ---
try {
  getStoredJSON("gams", { key: "gamMode" });
} catch {
  localStorage.removeItem("gams");
  storeJSON("gams", { key: "gamMode", value: "gam" });
}

const BroadcastDisguise: BroadcastChannel | null =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("BroadcastDisguise")
    : null;

let consentStorageKey = "gams_cookie_consent_v1";
let analyticsEnabled = false;

function l(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function initPage(): void {
  applyReducedMotionPreference();
  setSavedTheme();
  bindSearchToggle();
  bindControls();
  bindCookieConsent();
  bindSearchInput();
  bindCategoryButtons();
}

function applyReducedMotionPreference(): void {
  let reduced: boolean = true; // Permanently enabled reduced motion
  document.documentElement.setAttribute(
    "data-reduced-motion",
    reduced ? "true" : "false"
  );
}

function bindSearchToggle(): void {
  const toggle = l("searchToggle");
  if (!toggle) return;
  (toggle as HTMLButtonElement).onclick = () => searchbar(toggle);
  toggle.onkeydown = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      searchbar(toggle);
    }
  };
}

function bindControls(): void {
  const darkModeInput = l("darkModeInput") as HTMLInputElement | null;
  if (darkModeInput) {
    darkModeInput.onchange = () => changeTheme(darkModeInput);
  }
  const gamMode = l("gamMode") as HTMLSelectElement | null;
  if (gamMode) {
    gamMode.onchange = () => changeGamMode(gamMode);
  }
}

function loadCookieConsent(): CookieConsent | null {
  const raw = localStorage.getItem(consentStorageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed && typeof parsed === "object") return parsed;
  } catch {}
  return null;
}

function saveCookieConsent(consent: CookieConsent): void {
  localStorage.setItem(consentStorageKey, JSON.stringify(consent));
}

function hasSettingsCookieConsent(): boolean {
  const consent = loadCookieConsent();
  return !!(consent && consent.settings === true);
}

function clearCookie(name: string): void {
  document.cookie =
    name +
    "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax";
}

function enableAnalytics(): void {
  if (analyticsEnabled) return;
  analyticsEnabled = true;
  const script = document.createElement("script");
  script.defer = true;
  script.src = "https://cloud.umami.is/script.js";
  script.dataset.websiteId = "ac0c3422-a178-4ef1-92f3-8d6f875896d0";
  document.head.appendChild(script);
}

function applyCookieConsent(consent: CookieConsent | null): void {
  if (!consent) return;
  if (consent.analytics) enableAnalytics();
  if (!consent.settings) clearCookie("gams_favorites");
  if (typeof renderGames === "function") renderGames();
}

function bindCookieConsent(): void {
  const popup = l("cookieConsent");
  const settingsInput = l("consentSettings") as HTMLInputElement | null;
  const analyticsInput = l("consentAnalytics") as HTMLInputElement | null;
  const acceptAll = l("consentAcceptAll");
  const saveBtn = l("consentSave");
  const rejectAll = l("consentRejectAll");
  if (
    !popup ||
    !settingsInput ||
    !analyticsInput ||
    !acceptAll ||
    !saveBtn ||
    !rejectAll
  )
    return;

  const saved = loadCookieConsent();
  if (saved) {
    applyCookieConsent(saved);
    popup.classList.add("hidden");
    return;
  }
  popup.classList.remove("hidden");

  ;(acceptAll as HTMLButtonElement).onclick = () => {
    const consent: CookieConsent = { settings: true, analytics: true };
    saveCookieConsent(consent);
    applyCookieConsent(consent);
    popup.classList.add("hidden");
  };
  ;(saveBtn as HTMLButtonElement).onclick = () => {
    const consent: CookieConsent = {
      settings: settingsInput.checked,
      analytics: analyticsInput.checked,
    };
    saveCookieConsent(consent);
    applyCookieConsent(consent);
    popup.classList.add("hidden");
  };
  ;(rejectAll as HTMLButtonElement).onclick = () => {
    const consent: CookieConsent = { settings: false, analytics: false };
    saveCookieConsent(consent);
    applyCookieConsent(consent);
    popup.classList.add("hidden");
  };
}

function bindSearchInput(): void {
  const input = l("searchInput") as HTMLInputElement | null;
  if (!input) return;
  input.oninput = () => {
    if (searchRaf) cancelAnimationFrame(searchRaf);
    searchRaf = requestAnimationFrame(() => {
      searchTerm = input.value.toLowerCase();
      renderGames();
    });
  };
}

function bindCategoryButtons(): void {
  const buttons = document.querySelectorAll('.category-btn');
  buttons.forEach(btn => {
    (btn as HTMLButtonElement).onclick = () => {
      currentCategory = (btn as HTMLElement).dataset.category || 'all';
      buttons.forEach(b => {
        b.classList.remove('is-primary');
        b.classList.add('is-light');
      });
      btn.classList.remove('is-light');
      btn.classList.add('is-primary');
      renderGames();
    };
  });
}

function setLight(): void {
  const root = document.documentElement.style;
  root.setProperty("--gams-title-color", "#121a2c");
  root.setProperty("--nc-tx-1", "#0f1729");
  root.setProperty("--nc-tx-2", "#4a5978");
  root.setProperty("--nc-bg-1", "#f8fbff");
  root.setProperty("--nc-bg-2", "#edf3fb");
  root.setProperty("--nc-bg-3", "#dce6f5");
  root.setProperty("--nc-lk-1", "#2f6df6");
  root.setProperty("--nc-lk-2", "#2357cc");
  root.setProperty("--nc-lk-tx", "#FFFFFF");
  root.setProperty("--nc-ac-1", "#81f0d7");
  root.setProperty("--nc-ac-tx", "#123c49");
}

function setDark(): void {
  const root = document.documentElement.style;
  root.setProperty("--gams-title-color", "#f0f5ff");
  root.setProperty("--nc-tx-1", "#e8efff");
  root.setProperty("--nc-tx-2", "#adbedf");
  root.setProperty("--nc-bg-1", "#0b1220");
  root.setProperty("--nc-bg-2", "#111b2d");
  root.setProperty("--nc-bg-3", "#1a2842");
  root.setProperty("--nc-lk-1", "#6ea0ff");
  root.setProperty("--nc-lk-2", "#4a7de6");
  root.setProperty("--nc-lk-tx", "#FFFFFF");
  root.setProperty("--nc-ac-1", "#5fd7bd");
  root.setProperty("--nc-ac-tx", "#062b36");
}

function searchbar(elm: HTMLElement | null): void {
  if (elm) elm.remove();
  const searcher = l("searcher");
  if (!searcher) return;
  const input = document.createElement("input");
  input.id = "searchQuery";
  input.className = "search-input";
  input.type = "search";
  input.placeholder = "Search...";
  input.autocomplete = "off";
  input.onkeyup = startSearch;
  input.onblur = () => searchicon(input);
  input.onfocus = () => {
    (input as HTMLInputElement).style.width = "180px";
  };
  searcher.appendChild(input);
  input.focus();
  (input as HTMLInputElement).style.width = "180px";
}

function searchicon(elm: HTMLElement | null): void {
  if (!elm) return;
  (elm as HTMLInputElement).style.width = "20px";
  setTimeout(() => {
    elm.remove();
    const searcher = l("searcher");
    if (!searcher) return;
    const toggle = document.createElement("button");
    toggle.id = "searchToggle";
    toggle.className = "search-toggle button is-rounded is-light";
    toggle.textContent = "🔍";
    toggle.setAttribute("type", "button");
    toggle.setAttribute("aria-label", "Open search");
    toggle.onclick = () => searchbar(toggle);
    toggle.onkeydown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        searchbar(toggle);
      }
    };
    searcher.appendChild(toggle);
  }, 500);
}

function getStoredJSON(
  key: string,
  data?: StoredJSONKeyOpt
): string | object | boolean | null {
  if (data?.key && localStorage[key] !== "null") {
    try {
      const inStore = JSON.parse(localStorage[key]) as Record<string, unknown>;
      if (
        typeof inStore === "object" &&
        Object.prototype.hasOwnProperty.call(inStore, data.key)
      ) {
        return inStore[data.key] as string | object | boolean | null;
      }
    } catch {
      return null;
    }
  }
  if (localStorage[key] && !data) {
    try {
      return JSON.parse(localStorage[key]);
    } catch {
      return null;
    }
  }
  return null;
}

function storeJSON(
  key: string,
  data: { key: string; value: string }
): string {
  let inStore: Record<string, unknown>;
  if (localStorage[key]) {
    try {
      inStore = (JSON.parse(localStorage[key]) as Record<string, unknown>) || {};
    } catch {
      inStore = {};
    }
    inStore[data.key] = data.value;
  } else {
    inStore = { [data.key]: data.value };
  }
  localStorage[key] = JSON.stringify(inStore);
  return localStorage[key];
}

function changeTheme(input: HTMLInputElement): void {
  if (input.checked) {
    setDark();
    storeJSON("gams", { key: "theme", value: "dark" });
  } else {
    setLight();
    storeJSON("gams", { key: "theme", value: "light" });
  }
}

function changeGamMode(input: HTMLSelectElement): void {
  storeJSON("gams", { key: "gamMode", value: input.value });
}

function setSavedTheme(): void {
  const darkModeInput = l("darkModeInput") as HTMLInputElement | null;
  if (!darkModeInput) return;

  const gamModeSelect = l("gamMode") as HTMLSelectElement | null;
  if (gamModeSelect) {
    gamModeSelect.value =
      (getStoredJSON("gams", { key: "gamMode" }) as string) || "embed";
  }

  const savedTheme = getStoredJSON("gams", { key: "theme" }) as
    | string
    | null
    | undefined;
  if (savedTheme === "light") {
    setLight();
    darkModeInput.checked = false;
  } else if (savedTheme === "dark") {
    setDark();
    darkModeInput.checked = true;
  } else {
    const media = window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;
    if (media) {
      const applyAutoTheme = (isDark: boolean) => {
        darkModeInput.checked = isDark;
        if (isDark) setDark();
        else setLight();
      };
      media.addEventListener("change", (e: MediaQueryListEvent) =>
        applyAutoTheme(e.matches)
      );
      applyAutoTheme(media.matches);
    } else {
      setLight();
      darkModeInput.checked = false;
    }
  }
}

const shadeElm = l("shade");
if (shadeElm) {
  shadeElm.onclick = () => {
    const overlay = l("overlay");
    const mainGam = l("mainGam") as HTMLIFrameElement | null;
    const newWin = l("newWin") as HTMLAnchorElement | null;
    if (overlay) (overlay as HTMLElement).style.display = "none";
    if (mainGam) mainGam.src = "";
    if (newWin) newWin.href = "";
  };
}

function startSearch(): void {
  const input = l("searchQuery") as HTMLInputElement | null;
  if (!input) return;
  const filter = input.value.toUpperCase();
  const tiles = document.body.getElementsByClassName("tile");
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i] as HTMLElement;
    tile.style.display =
      tile.textContent?.toUpperCase().indexOf(filter) !== -1 ? "" : "none";
  }
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  prps?: Record<string, string>
): HTMLElementTagNameMap[K] {
  const elm = document.createElement(tag);
  if (prps) {
    for (const key of Object.keys(prps)) {
      elm.setAttribute(key, prps[key]);
    }
  }
  return elm;
}

const gamsList: GamListItem[] = [
  { title: "HTML5/unity Webgl", type: "section" },
  { name: "Stickman Hook" },
  { name: "Drive Mad", href: "games/g/drivemad/drivemad.html" },
  { name: "2048" },
  { name: "Cookie Clicker", href: "games/g/cookie/index.html" },
  { name: "Cube Field", href: "games/g/cubefield/index.html" },
  { name: "Spacebar Clicker" },
  { name: "Offline Paradise" },
  { name: "Sand Game" },
  { name: "Agario Lite" },
  { name: "Evil Glitch" },
  { name: "Its Raining Boxes" },
  { name: "T Rex" },
  { name: "Stack" },
  { name: "Rolling Forests" },
  { name: "Radius Raid" },
  { name: "Mountain Maze" },
  { name: "Fluid Simulator" },
  { name: "Edge Not Found" },
  { name: "Ninja vs EVILCORP" },
  { name: "Geometry Dash" },
  { name: "Wordle" },
  { name: "Paper IO 2" },
  { name: "Aim Trainer", href: "games/g/aimtrainer/aimtrainer.html" },
  { name: "Snake", href: "games/snake.html" },
  { name: "Slope" },
  { name: "Burrito Bison", href: "games/g/burritobison/burritobison.html" },
  { name: "Tube Jumpers" },
  { name: "Hole IO" },
  { name: "Madalin Stunt Cars", href: "games/g/madalinstuntcars/madalinstuntcars.html" },
  { name: "Glass City", href: "games/g/glasscity/glasscity.html" },
  { name: "Tunnel Rush", href: "games/g/tunnelrush/tunnelrush.html" },
  { name: "Tanuki Sunset", href: "games/g/tanukisunset/tanukisunset.html" },
  { name: "A Dance of Fire and Ice", href: "games/g/fireice/index.html" },
  { name: "Game Inside a Game", href: "games/g/gameinsideagame/index.html" },
  { name: "Cell Machine", href: "games/g/cellmachine/index.html" },
  { name: "Slope 2", href: "games/g/slope2/index.html" },
  { name: "Ai Creatures", href: "games/g/aicreatures/index.html" },
  { name: "Grey Box Testing", href: "games/g/greybox/index.html" },
  { name: "Drift Boss", href: "games/g/driftboss/driftboss.html" },
  {name: "Chess", href:"games/chess.html"},
  {name: "Subway Surfers", href: "games/g/subwaysurf/subwaysurf.html"},
  { title: "Retro", type: "section" },
  { name: "Super Mario 64" },
  { name: "Celeste" },
  { name: "Just One Boss" },
  { name: "Super Mario RPG" },
  { title: "Flash", type: "section" },
  { name: "Breaking The Bank" },
  { name: "Escaping The Prison" },
  { name: "Stealing The Diamond" },
  { name: "Infiltrating The Airship" },
  { name: "Fleeing The Complex" },
  { name: "Bloxorz" },
  { name: "Tetris" },
  { name: "Flood Runner 4" },
  { name: "Raft Wars" },
  { name: "Raft Wars 2" },
  { name: "Worlds Hardest Game" },
  {
    name: "Worlds Hardest Game 2",
    href: "games/g/Ruffle/player.html?swf=../../flash/whg2.swf",
  },
  { name: "The Impossible Quiz" },
  { name: "Learn To Fly Idle" },
  { name: "Learn To Fly 1" },
  { name: "Learn To Fly 2" },
  { name: "Learn To Fly 3" },
  { name: "Bloons Tower Defense 1" },
  { name: "Bloons Tower Defense 2" },
  { name: "Bloons Tower Defense 5" },
  { name: "Cat Ninja" },
  { name: "Pacman" },
  { name: "1 on 1 Soccer" },
  { name: "QWOP" },
  { name: "Use Boxmen" },
  { name: "40x Escape" },
  { name: "Stickman Life" },
  { name: "Duck Life 1" },
  { name: "Duck Life 2" },
  { name: "Duck Life 3" },
  { name: "Duck Life 4" },
  { name: "Duck Life 5" },
  { name: "Run", href: "games/g/Ruffle/player.html?swf=../../flash/run.swf" },
  { name: "Run 2", href: "games/g/Ruffle/player.html?swf=../../flash/run-2.swf" },
  { name: "Run 3", href: "games/g/Ruffle/player.html?swf=../../flash/run3.swf" },
  { name: "doom", href: "games/g/Ruffle/player.html?swf=../../flash/doom.swf" },
  { name: "Johnny Upgrade", href: "games/g/Ruffle/player.html?swf=../../flash/john.swf" },
  {
    name: "Papas Burgeria",
    href: "games/g/Ruffle/player.html?swf=../../flash/papasburgeria.swf",
  },
  {
    name: "Fireboy And Watergirl 1",
    href: "games/g/Ruffle/player.html?swf=../../flash/fbwg1.swf",
  },
  {
    name: "Papas Pastaria",
    href: "games/g/Ruffle/player.html?swf=../../flash/papaspastaria.swf",
  },
  { name: "Portal", href: "games/g/Ruffle/player.html?swf=../../flash/portal.swf" },
  { title: "Tools", type: "section" },
  { name: "Ruffle Flash Player", href: "games/g/Ruffle/Ruffle.html" },
  { name: "Code Editor", type: "raw" },
  { name: "Web Retro" },
  { name: "Proxy Browser", href: "games/proxybrowser.html" },
  { name: "Calculator", href: "games/calc.html" },
];

function setCookie(name: string, value: string, days?: number): void {
  if (!hasSettingsCookieConsent()) return;
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  const secure =
    window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    name +
    "=" +
    encodeURIComponent(value) +
    expires +
    "; path=/; SameSite=Lax" +
    secure;
}

function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    let c = cookies[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0)
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
}

function getFavoriteIds(): string[] {
  if (!hasSettingsCookieConsent()) return [];
  const raw = getCookie("gams_favorites");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as string[];
  } catch {}
  return [];
}

function saveFavoriteIds(ids: string[]): void {
  setCookie("gams_favorites", JSON.stringify(ids), 3650);
}

function toggleFavorite(gameId: string): void {
  const ids = getFavoriteIds();
  const idx = ids.indexOf(gameId);
  if (idx === -1) ids.push(gameId);
  else ids.splice(idx, 1);
  saveFavoriteIds(ids);
  renderGames();
}

const sectionOrder: string[] = [];
const gamesData: GameData[] = [];
let currentSection: string = "";
let searchTerm = "";
let currentCategory = "all";
const nameCollator = new Intl.Collator(undefined, { sensitivity: "base" });
let searchRaf = 0;

for (let j = 0; j < gamsList.length; j++) {
  const gam = gamsList[j];
  if (isSectionEntry(gam)) {
    currentSection = gam.title;
    sectionOrder.push(gam.title);
    continue;
  }
  if (!("name" in gam) || !gam.name) continue;

  const imgName = gam.name.toLowerCase().replace(/\s/g, "");
  const gameId = gam.id ?? imgName;
  gamesData.push({
    id: gameId,
    name: gam.name,
    href: gam.href ?? "games/" + imgName + ".html",
    img: gam.img ?? (gam.src ? "img/" + gam.src : "img/" + imgName + ".jpeg"),
    type: gam.type ?? "",
    section: currentSection || "Other",
    category: getCategory(gam.name),
    index: gamesData.length,
    searchName: gam.name.toLowerCase(),
  });
}

const totalGames = gamesData.length;
const totalGamesEl = l("totalGames");
if (totalGamesEl) totalGamesEl.innerText = String(totalGames);

const container = createElement("div", { id: "container" });
const containEl = l("contain");
if (containEl) containEl.appendChild(container);
container.onclick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  if (!target) return;
  const favoriteButton = target.closest(".favorite-btn");
  if (favoriteButton) {
    event.preventDefault();
    event.stopPropagation();
    const tile = favoriteButton.closest(".tile") as HTMLElement | null;
    const gameId = tile?.getAttribute("data-game-id");
    if (gameId) toggleFavorite(gameId);
    return;
  }
  const tile = target.closest(".tile") as HTMLElement | null;
  if (tile) handleTileOpen(tile);
};

function makeSectionTitle(titleText: string): HTMLElement {
  const title = createElement("h2", { class: "section-title" });
  title.textContent = titleText;
  return title;
}

function makeTile(game: GameData, favorite: boolean): HTMLDivElement {
  const tile = createElement("div", {
    class: "tile card",
    "data-game-id": game.id,
    "data-href": game.href,
    "data-name": game.name,
    "data-modex": game.type,
    "data-pic": game.img,
  });

  const favoriteButton = createElement("button", {
    class: "favorite-btn",
    type: "button",
    title: "Toggle favorite",
    "aria-label": "Toggle favorite",
  });
  favoriteButton.textContent = favorite ? "\u2605" : "\u2606";
  tile.appendChild(favoriteButton);

  const img = createElement("img", {
    class: "img",
    src: game.img,
    alt: game.name,
    width: "512",
    height: "512",
    loading: "lazy",
    decoding: "async",
  });
  const imageFigure = createElement("figure", { class: "image is-square" });
  imageFigure.appendChild(img);
  const imageWrap = createElement("div", { class: "card-image" });
  imageWrap.appendChild(imageFigure);
  tile.appendChild(imageWrap);

  const p = createElement("p", { class: "name" });
  p.textContent = game.name;
  const content = createElement("div", { class: "card-content" });
  content.appendChild(p);
  tile.appendChild(content);

  return tile;
}

type LaunchMode = "gam" | "embed" | "blank" | "direct" | "raw";

function handleTileOpen(tile: HTMLElement): void {
  const dataHref = tile.getAttribute("data-href");
  const dataName = tile.getAttribute("data-name");
  const dataModex = tile.getAttribute("data-modex");
  const dataPic = tile.getAttribute("data-pic");
  if (!dataHref || !dataName || !dataPic) return;

  const href = new URL(dataHref, window.location.href).href;
  const name = dataName;
  const modeX = dataModex;
  const pic = new URL(dataPic, window.location.href).href;
  
  // Track game visit
  const gameId = tile.getAttribute("data-game-id");
  if (gameId) {
    recordGameVisit(gameId, name);
  }
  
  let mode: LaunchMode =
    (getStoredJSON("gams", { key: "gamMode" }) as LaunchMode) || "embed";
  const gameShellQuery = new URLSearchParams({
    icon: pic,
    name,
    src: href,
  }).toString();
  const gameShellUrl = `g/g/Gam.html?${gameShellQuery}`;

  if (modeX === "raw") mode = "raw";

  if (mode === "raw") {
    window.open(href);
    return;
  }
  if (mode === "direct") {
    window.location.href = gameShellUrl;
    return;
  }
  if (mode === "blank") {
    const w = window.open();
    if (!w) return;
    const doc = w.document;
    const body = doc.body;
    body.style.margin = "0";
    const iframe = doc.createElement("iframe");
    iframe.style.width = "100vw";
    iframe.style.height = "100vh";
    iframe.setAttribute("frameborder", "0");
    iframe.src = gameShellUrl;
    body.appendChild(iframe);

    const scriptContent = `const BroadcastDisguise = new BroadcastChannel('BroadcastDisguise');
function setFavicon(href) {
var existFav = document.querySelectorAll('link[rel*="icon"]');
existFav.forEach(function(favicon) { favicon.parentNode.removeChild(favicon); });
var link = document.createElement('link');
link.type = 'image/x-icon';
link.rel = 'icon';
link.href = href;
document.getElementsByTagName('head')[0].appendChild(link);
}
function getStoredJSON(key, data) {
if (data && data.key && (localStorage[key] !== 'null')) {
  var inStore = JSON.parse(localStorage[key]);
  if ((typeof inStore === 'object') && Object.prototype.hasOwnProperty.call(inStore, data.key)) {
    return inStore[data.key];
  }
}
if (localStorage[key] && !data) { return JSON.parse(localStorage[key]); }
return null;
}
function applyDisguise() {
var icon = getStoredJSON('gams', {key: 'icon'});
var title = getStoredJSON('gams', {key: 'title'});
if (title) { document.title = title; } else { document.title = 'about:blank'; }
if (icon) { setFavicon(icon); } else { setFavicon('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABRklEQVR42mKgOqjq75ds7510YNL0uV9nAGqniqwKYiCIHIIjcAK22BGQLRdgBWvc3fnWk/FJhrkPO1xPgGvqPfLfJMHhT1yqurvS48bPaJhjD2efgidnVwa2yv59xecvEvi0UWCXq9t0ItfP2MMZ7nwIpkA8F1n8uLxZHM6yrBH7FIl2gFXDHYsErkn2hyKLHtcKrFntk58uVQJ+kSdQnmjhID4cwLLa8+K0BXsfNWCqBOsFdo2Yldv43DBrkxd30cjnNyYBhK0SQGkI9pG4Mu40D5b374DRCAyhHqXVfTmOwivivMkJxBz5wnHCtBfGgNFC+ChWKWRf3hsQIlyEoIv4IYEo5wkgtBLRekY9DE4Uin4Keae6hydGnljPmE8kRcCine6827AMsJ1IuW9ibnlQpXLBCR/WC875m2BP+VSu3c/0m+8V08OBngc0pxcAAAAASUVORK5CYII='); }
}
applyDisguise();
if (BroadcastDisguise) {
BroadcastDisguise.onmessage = () => { applyDisguise(); };
}
`;
    const script = doc.createElement("script");
    script.textContent = scriptContent;
    doc.head.appendChild(script);
    return;
  }
  if (mode === "gam") {
    window.open(gameShellUrl);
    return;
  }
  if (mode === "embed") {
    window.open(gameShellUrl);
    return;
  }
}

// Game visit tracking
function recordGameVisit(gameId: string, gameName: string): void {
  const visits = getGameVisits();
  const now = Date.now();
  
  if (visits[gameId]) {
    visits[gameId].count++;
    visits[gameId].lastVisit = now;
  } else {
    visits[gameId] = {
      count: 1,
      lastVisit: now,
      name: gameName
    };
  }
  
  // Keep only last 100 unique games to limit storage
  const allEntries = Object.entries(visits);
  if (allEntries.length > 100) {
    // Sort by lastVisit descending and take top 100
    allEntries.sort((a, b) => b[1].lastVisit - a[1].lastVisit);
    const trimmed = Object.fromEntries(allEntries.slice(0, 100));
    localStorage.setItem("gams_game_visits", JSON.stringify(trimmed));
  } else {
    localStorage.setItem("gams_game_visits", JSON.stringify(visits));
  }
}

function getGameVisits(): Record<string, {count: number; lastVisit: number; name: string}> {
  const raw = localStorage.getItem("gams_game_visits");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function getTopVisitedGames(limit: number = 4): GameData[] {
  const visits = getGameVisits();
  const entries = Object.entries(visits);
  
  if (entries.length === 0) {
    // Fallback to latest games
    return getLatestGames();
  }
  
  // Sort by count (descending), then by lastVisit (descending) for tiebreakers
  entries.sort((a, b) => {
    if (b[1].count !== a[1].count) {
      return b[1].count - a[1].count;
    }
    return b[1].lastVisit - a[1].lastVisit;
  });
  
  // Get game data for top entries
  const topGameIds = new Set(entries.slice(0, limit).map(e => e[0]));
  const recommended: GameData[] = [];
  
  // Maintain order from entries
  for (const [gameId] of entries) {
    if (recommended.length >= limit) break;
    const game = gamesData.find(g => g.id === gameId);
    if (game) {
      recommended.push(game);
    }
  }
  
  // If we don't have enough, fill with latest games
  if (recommended.length < limit) {
    const latest = getLatestGames();
    for (const game of latest) {
      if (recommended.length >= limit) break;
      if (!topGameIds.has(game.id)) {
        recommended.push(game);
      }
    }
  }
  
  return recommended.slice(0, limit);
}

function getLatestGames(): GameData[] {
  const allowedSections = ["HTML5/unity Webgl", "Flash"];
  const filtered = gamesData.filter((g) =>
    allowedSections.includes(g.section)
  );
  const sorted = [...filtered].sort((a, b) => b.index - a.index);
  return sorted.slice(0, 4);
}

function renderGames(): void {
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const favoriteSet = new Set(getFavoriteIds());
  const hasSearch = searchTerm.length > 0;
  const favoriteGames: GameData[] = [];
  const otherGames: GameData[] = [];
  let totalCount = 0;

  for (const game of gamesData) {
    const matchesCategory = currentCategory === "all" || game.category === currentCategory;
    const matchesSearch = !hasSearch || game.searchName.includes(searchTerm);
    if (currentCategory === "favorites") {
      if (favoriteSet.has(game.id) && matchesSearch) {
        favoriteGames.push(game);
        totalCount++;
      }
      continue;
    }
    if (!matchesCategory || !matchesSearch) continue;
    totalCount++;
    if (favoriteSet.has(game.id)) favoriteGames.push(game);
    else otherGames.push(game);
  }

  if (currentCategory === "favorites") {
    favoriteGames.sort((a, b) => nameCollator.compare(a.name, b.name));
    for (const game of favoriteGames) {
      fragment.appendChild(makeTile(game, true));
    }
  } else {
    if (favoriteGames.length > 0) {
      fragment.appendChild(makeSectionTitle("Favorites"));
      favoriteGames.sort((a, b) => nameCollator.compare(a.name, b.name));
      for (const game of favoriteGames) {
        fragment.appendChild(makeTile(game, true));
      }
    }

    otherGames.sort((a, b) => nameCollator.compare(a.name, b.name));
    for (const game of otherGames) {
      fragment.appendChild(makeTile(game, false));
    }
  }

  container.appendChild(fragment);

  const totalGamesEl = l("totalGames");
  if (totalGamesEl) totalGamesEl.innerText = String(totalCount);
}

renderGames();

function setFavicon(href: string): void {
  const existFav = document.querySelectorAll('link[rel*="icon"]');
  existFav.forEach((favicon) => favicon.parentNode?.removeChild(favicon));
  const link = document.createElement("link");
  link.type = "image/x-icon";
  link.rel = "icon";
  link.href = href;
  document.getElementsByTagName("head")[0].appendChild(link);
}

const ogTitle = document.title;
const ogIconEl = document.querySelectorAll('link[rel*="icon"]')[0];
const ogIcon = ogIconEl ? (ogIconEl as HTMLLinkElement).href : "";

function applyDisguise(): void {
  const icon = getStoredJSON("gams", { key: "icon" }) as string | null;
  const title = getStoredJSON("gams", { key: "title" }) as string | null;
  document.title = title ?? ogTitle;
  setFavicon(icon ?? ogIcon);
}

applyDisguise();

if (BroadcastDisguise) {
  BroadcastDisguise.onmessage = () => applyDisguise();
}

initPage();
