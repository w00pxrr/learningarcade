export type StoredJSONKeyOpt = { key: string };

const STORAGE_ENDPOINT = "/api/storage";
const STORAGE_KEYS = [
  "gams",
  "gams_cookie_consent_v1",
  "gams_game_visits",
  "gams_cookie_store",
];
const COOKIE_STORE_KEY = "gams_cookie_store";
const refreshQueue = new Map<string, Promise<void>>();
let hydrated = false;
let authSyncEnabled = false;
let storagePatched = false;
let internalWrites = 0;
let authSyncInterval: number | null = null;
let authCheckInFlight: Promise<void> | null = null;

function getLocalStorage(): Storage | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}

function getDocument(): Document | null {
  if (typeof document === "undefined") return null;
  return document;
}

function getWindow(): Window | null {
  if (typeof window === "undefined") return null;
  return window;
}

async function postStorage(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return null;
  try {
    const response = await fetch(STORAGE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: "include",
    });
    if (!response.ok) return null;
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function fetchAuthUser(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) return false;
    const data = (await res.json()) as { user?: { username?: string } | null };
    return !!data?.user;
  } catch {
    return false;
  }
}

function withInternalWrite(task: () => void): void {
  internalWrites += 1;
  try {
    task();
  } finally {
    internalWrites = Math.max(0, internalWrites - 1);
  }
}

function patchLocalStorageSync(): void {
  if (storagePatched) return;
  if (typeof window === "undefined" || typeof Storage === "undefined") return;
  try {
    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;

    Storage.prototype.setItem = function setItem(key: string, value: string) {
      originalSetItem.call(this, key, value);
      if (!authSyncEnabled || internalWrites > 0) return;
      pushServerUpdate(key, value);
    };

    Storage.prototype.removeItem = function removeItem(key: string) {
      originalRemoveItem.call(this, key);
      if (!authSyncEnabled || internalWrites > 0) return;
      pushServerRemove(key);
    };

    storagePatched = true;
  } catch {
    storagePatched = false;
  }
}

async function pushServerBulkUpdate(
  entries: Record<string, string>,
): Promise<void> {
  if (Object.keys(entries).length === 0) return;
  await postStorage({ action: "bulk_set", entries });
}

async function hydrateServerStorageAll(): Promise<void> {
  if (typeof window === "undefined") return;
  const data = await postStorage({ action: "bulk_all" });
  if (!data || typeof data !== "object") return;
  const entries = data.entries as Record<string, string> | undefined;
  if (!entries) return;

  const ls = getLocalStorage();
  if (!ls) return;

  const pending: Record<string, string> = {};
  const serverKeys = new Set(Object.keys(entries));

  for (const [key, value] of Object.entries(entries)) {
    if (typeof value !== "string") continue;
    const localValue = ls.getItem(key);
    if (localValue === null) {
      withInternalWrite(() => ls.setItem(key, value));
    } else if (localValue !== value) {
      pending[key] = localValue;
    }
  }

  for (let i = 0; i < ls.length; i += 1) {
    const key = ls.key(i);
    if (!key || serverKeys.has(key)) continue;
    const value = ls.getItem(key);
    if (typeof value === "string") {
      pending[key] = value;
    }
  }

  await pushServerBulkUpdate(pending);
}

export async function hydrateAuthStorage(): Promise<void> {
  if (typeof window === "undefined" || authSyncEnabled) return;
  if (authCheckInFlight) return authCheckInFlight;
  authCheckInFlight = (async () => {
    const isAuthed = await fetchAuthUser();
    if (!isAuthed) return;
    authSyncEnabled = true;
    patchLocalStorageSync();
    await hydrateServerStorageAll();
    if (authSyncInterval === null) {
      authSyncInterval = window.setInterval(() => {
        void hydrateServerStorageAll();
      }, 30000);
    }
  })().finally(() => {
    authCheckInFlight = null;
  });
  return authCheckInFlight;
}

export function hydrateServerStorage(keys: string[] = STORAGE_KEYS): void {
  if (typeof window === "undefined" || hydrated) return;
  hydrated = true;
  void postStorage({ action: "bulk_get", keys }).then((data) => {
    if (!data || typeof data !== "object") return;
    const entries = data.entries as Record<string, string> | undefined;
    if (!entries) return;
    const ls = getLocalStorage();
    if (!ls) return;
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(entries, key)) {
        const localValue = ls.getItem(key);
        if (typeof localValue === "string" && localValue.length > 0) {
          pushServerUpdate(key, localValue);
        }
      }
    }
    for (const [key, value] of Object.entries(entries)) {
      if (typeof value === "string" && value.length > 0) {
        ls.setItem(key, value);
      }
    }
  });
}

function requestServerRefresh(key: string): void {
  if (typeof window === "undefined") return;
  if (refreshQueue.has(key)) return;
  const task = postStorage({ action: "get", key }).then((data) => {
    const value = data?.value;
    if (typeof value !== "string") return;
    const ls = getLocalStorage();
    if (!ls) return;
    ls.setItem(key, value);
  });
  refreshQueue.set(key, task || Promise.resolve());
  task?.finally(() => refreshQueue.delete(key));
}

function pushServerUpdate(key: string, value: string): void {
  void postStorage({ action: "set", key, value });
}

function pushServerRemove(key: string): void {
  void postStorage({ action: "remove", key });
}

export function getStoredJSON<T = string | object | boolean | null>(
  key: string,
  data?: StoredJSONKeyOpt,
): T | null {
  const ls = getLocalStorage();
  if (!ls) return null;
  if (!ls.getItem(key)) requestServerRefresh(key);
  if (data?.key && ls[key] !== "null") {
    try {
      const inStore = JSON.parse(ls[key]) as Record<string, unknown>;
      if (
        typeof inStore === "object" &&
        Object.prototype.hasOwnProperty.call(inStore, data.key)
      ) {
        return inStore[data.key] as T;
      }
    } catch {
      return null;
    }
  }
  if (ls[key] && !data) {
    try {
      return JSON.parse(ls[key]) as T;
    } catch {
      return null;
    }
  }
  return null;
}

export function storeJSON(
  key: string,
  data: { key: string; value: string },
): string {
  const ls = getLocalStorage();
  if (!ls) return "";
  let inStore: Record<string, unknown>;
  if (ls[key]) {
    try {
      inStore = (JSON.parse(ls[key]) as Record<string, unknown>) || {};
    } catch {
      inStore = {};
    }
    inStore[data.key] = data.value;
  } else {
    inStore = { [data.key]: data.value };
  }
  withInternalWrite(() => {
    ls[key] = JSON.stringify(inStore);
  });
  pushServerUpdate(key, ls[key]);
  return ls[key];
}

export function removeJSON(key: string, data: { key: string }): void {
  const ls = getLocalStorage();
  if (!ls) return;
  if (!ls[key]) return;
  try {
    const inStore = JSON.parse(ls[key]) as Record<string, unknown>;
    if (typeof inStore === "object" && inStore) {
      delete inStore[data.key];
      withInternalWrite(() => {
        ls[key] = JSON.stringify(inStore);
      });
      pushServerUpdate(key, ls[key]);
    }
  } catch {
    withInternalWrite(() => {
      ls.removeItem(key);
    });
    pushServerRemove(key);
  }
}

export function getStoredItem(key: string): string | null {
  const ls = getLocalStorage();
  if (!ls) return null;
  const value = ls.getItem(key);
  if (!value) requestServerRefresh(key);
  return value;
}

export function setStoredItem(key: string, value: string): void {
  const ls = getLocalStorage();
  if (!ls) return;
  withInternalWrite(() => {
    ls.setItem(key, value);
  });
  pushServerUpdate(key, value);
}

export function removeStoredItem(key: string): void {
  const ls = getLocalStorage();
  if (!ls) return;
  withInternalWrite(() => {
    ls.removeItem(key);
  });
  pushServerRemove(key);
}

type CookieStoreEntry = { value: string; days?: number };

function getCookieStore(): Record<string, CookieStoreEntry> {
  const raw = getStoredItem(COOKIE_STORE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, CookieStoreEntry>;
  } catch {
    return {};
  }
}

function setCookieStore(store: Record<string, CookieStoreEntry>) {
  setStoredItem(COOKIE_STORE_KEY, JSON.stringify(store));
}

function hasSettingsConsent(): boolean {
  const raw = getStoredItem("gams_cookie_consent_v1");
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as { settings?: boolean };
    return parsed?.settings === true;
  } catch {
    return false;
  }
}

export function setCookie(name: string, value: string, days?: number): void {
  const doc = getDocument();
  const win = getWindow();
  if (!doc || !win) return;
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  const secure = win.location.protocol === "https:" ? "; Secure" : "";
  doc.cookie =
    name +
    "=" +
    encodeURIComponent(value) +
    expires +
    "; path=/; SameSite=Lax" +
    secure;
  const store = getCookieStore();
  store[name] = { value, days };
  setCookieStore(store);
}

export function clearCookie(name: string): void {
  const doc = getDocument();
  if (!doc) return;
  doc.cookie =
    name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax";
  const store = getCookieStore();
  if (store[name]) {
    delete store[name];
    setCookieStore(store);
  }
}

export function getCookie(name: string): string | null {
  const doc = getDocument();
  if (!doc) return null;
  const nameEQ = name + "=";
  const cookies = doc.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    let c = cookies[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  if (hasSettingsConsent()) {
    const store = getCookieStore();
    const entry = store[name];
    if (entry?.value) {
      setCookie(name, entry.value, entry.days);
      return entry.value;
    }
  }
  return null;
}
