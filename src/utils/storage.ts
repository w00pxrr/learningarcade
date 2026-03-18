export type StoredJSONKeyOpt = { key: string };

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

export function getStoredJSON<T = string | object | boolean | null>(
  key: string,
  data?: StoredJSONKeyOpt,
): T | null {
  const ls = getLocalStorage();
  if (!ls) return null;
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
  ls[key] = JSON.stringify(inStore);
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
      ls[key] = JSON.stringify(inStore);
    }
  } catch {
    ls.removeItem(key);
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
}

export function clearCookie(name: string): void {
  const doc = getDocument();
  if (!doc) return;
  doc.cookie =
    name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax";
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
  return null;
}
