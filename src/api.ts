// Connects the demo app to the Thkee API.
// Everyone sees the owner's saved content. Only the owner (who has the owner key) can save or upload.
// Local testing: set VITE_API_URL and VITE_OWNER_KEY in .env.local, then run start-local.bat.
// Online: set only VITE_API_URL. Turn owner mode on once per browser with ?admin=YOUR_KEY, off with ?admin=off.
// With no VITE_API_URL the app works as before, saving only in the browser.

export const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) || "").replace(/\/$/, "");
const ENV_OWNER_KEY = (import.meta.env.VITE_OWNER_KEY as string | undefined) || "";

const ADMIN_KEY = "thkee.adminKey";
// Keys that belong to each visitor's own browser and are never shared.
const LOCAL_ONLY = new Set([ADMIN_KEY, "thkee.user", "thkee.cart", "thkee.promo", "thkee.credit", "thkee.lang", "thkee.cards", "thkee.savedCard", "thkee.builderPreview", "thkee.builderSplit"]);

const nativeSet = Storage.prototype.setItem;
const nativeRemove = Storage.prototype.removeItem;
const nativeGet = Storage.prototype.getItem;

function read(key: string) {
  try {
    return nativeGet.call(localStorage, key);
  } catch {
    return null;
  }
}

// "off" means this browser chose visitor mode, even when a local owner key is set.
export const adminKey = () => {
  const stored = read(ADMIN_KEY);
  return stored === "off" ? "" : stored || ENV_OWNER_KEY;
};
export const isAdmin = () => !!API_URL && adminKey().length > 0;
const isShared = (key: string) => key.startsWith("thkee.") && !LOCAL_ONLY.has(key);

async function request(path: string, init: RequestInit = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = new Headers(init.headers);
    if (isAdmin()) headers.set("X-Admin-Key", adminKey());
    const res = await fetch(`${API_URL}/${path}`, { ...init, headers, signal: controller.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// Owner changes are collected for a moment, then sent together.
const pending = new Map<string, string | null>();
let flushTimer: ReturnType<typeof setTimeout> | undefined;

function queue(key: string, value: string | null) {
  if (!isAdmin() || !isShared(key)) return;
  pending.set(key, value);
  clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 800);
}

async function flush() {
  if (!pending.size) return;
  const items = Object.fromEntries(pending);
  pending.clear();
  try {
    await request("state.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) }, 30000);
  } catch (error) {
    console.error("[thkee] Could not save to the server", error);
    Object.entries(items).forEach(([key, value]) => pending.has(key) || pending.set(key, value));
  }
}

function watchStorage() {
  Storage.prototype.setItem = function (key: string, value: string) {
    nativeSet.call(this, key, value);
    if (this === localStorage) queue(key, String(value));
  };
  Storage.prototype.removeItem = function (key: string) {
    nativeRemove.call(this, key);
    if (this === localStorage) queue(key, null);
  };
  window.addEventListener("pagehide", () => void flush());
}

function sharedLocalItems() {
  const items: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = key ? read(key) : null;
    if (key && value !== null && isShared(key)) items[key] = value;
  }
  return items;
}

async function setOwnerMode() {
  const params = new URLSearchParams(location.search);
  const key = params.get("admin");
  if (key === null) return;
  params.delete("admin");
  history.replaceState(null, "", `${location.pathname}${params.toString() ? `?${params}` : ""}${location.hash}`);
  if (key === "off" || !key) return nativeSet.call(localStorage, ADMIN_KEY, "off");
  nativeSet.call(localStorage, ADMIN_KEY, key);
  try {
    const check = await request("check.php");
    if (!check.admin) throw new Error("Wrong owner key");
  } catch (error) {
    nativeRemove.call(localStorage, ADMIN_KEY);
    console.error("[thkee] Owner mode was not turned on", error);
  }
}

function showOwnerBadge() {
  const badge = document.createElement("a");
  badge.textContent = "Owner mode · saving to server";
  badge.title = "Your changes and uploads are saved for every visitor. Click to turn off.";
  badge.href = "?admin=off";
  badge.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:99999;padding:6px 10px;border-radius:999px;background:#0d5c4b;color:#fff;font:500 12px/16px system-ui,sans-serif;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.2)";
  document.body.appendChild(badge);
}

// Runs before the app renders: loads the owner's saved content into this browser.
export async function boot() {
  if (!API_URL) return;
  await setOwnerMode();
  try {
    const remote: Record<string, string> = await request("state.php", {}, 6000);
    const keys = Object.keys(remote).filter(isShared);
    if (keys.length) {
      keys.forEach((key) => nativeSet.call(localStorage, key, remote[key]));
    } else if (isAdmin()) {
      // First run: the server is empty, so the owner's current content becomes the starting point.
      const items = sharedLocalItems();
      if (Object.keys(items).length) await request("state.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) }, 30000);
    }
  } catch (error) {
    console.warn("[thkee] Server content not loaded, using this browser's copy", error);
  }
  watchStorage();
  if (isAdmin()) showOwnerBadge();
}

// Uploads a file for the owner and returns its public URL. Visitors get null, so callers keep the file in the browser.
export async function uploadFile(file: File): Promise<string | null> {
  if (!isAdmin()) return null;
  const headers = { "Content-Type": file.type || "application/octet-stream", "X-File-Name": encodeURIComponent(file.name) };
  const data = await request("upload.php", { method: "POST", headers, body: file }, 30 * 60 * 1000);
  return data.url as string;
}
