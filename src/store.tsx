import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { courses, type Course } from "./data";

export type User = { name: string; email: string };
type Account = User & { username: string; password: string };

const demoAccount: Account = { name: "Noman", username: "noman", email: "noman@thkee.demo", password: "12345" };
export type Lang = "EN" | "AR";
export type Overlay =
  | { type: "auth"; mode: "login" | "signup" }
  | { type: "catalog"; category?: string; query?: string; liveOnly?: boolean }
  | { type: "course"; id: string }
  | { type: "cart" }
  | { type: "instructor" }
  | { type: "info"; page: string }
  | null;
type Toast = { id: number; message: string };

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function useStoredState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => load(key, fallback));
  useEffect(() => save(key, value), [key, value]);
  return [value, setValue] as const;
}

function useAppState() {
  const [user, setUser] = useStoredState<User | null>("thkee.user", null);
  const [cartIds, setCartIds] = useStoredState<string[]>("thkee.cart", []);
  const [enrolledIds, setEnrolledIds] = useStoredState<string[]>("thkee.enrolled", []);
  const [lang, setLang] = useStoredState<Lang>("thkee.lang", "EN");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const cart = useMemo(() => cartIds.map((id) => courses.find((c) => c.id === id)).filter((c): c is Course => !!c), [cartIds]);

  const addToCart = useCallback(
    (course: Course) => {
      if (enrolledIds.includes(course.id)) return notify(`You're already enrolled in "${course.title}"`);
      if (cartIds.includes(course.id)) return notify("Already in your cart");
      setCartIds((ids) => [...ids, course.id]);
      notify(`Added "${course.title}" to your cart`);
    },
    [cartIds, enrolledIds, notify, setCartIds],
  );

  const removeFromCart = useCallback((id: string) => setCartIds((ids) => ids.filter((x) => x !== id)), [setCartIds]);

  const checkout = useCallback(() => {
    if (!user) {
      setOverlay({ type: "auth", mode: "login" });
      return notify("Please log in to complete your purchase");
    }
    setEnrolledIds((ids) => [...new Set([...ids, ...cartIds])]);
    setCartIds([]);
    setOverlay(null);
    notify("Payment successful — you're enrolled! 🎉");
  }, [cartIds, notify, setCartIds, setEnrolledIds, user]);

  const [accounts, setAccounts] = useStoredState<Account[]>("thkee.accounts", []);

  const login = useCallback(
    (identifier: string, password: string) => {
      const id = identifier.trim().toLowerCase();
      const account = [demoAccount, ...accounts].find((a) => (a.username === id || a.email.toLowerCase() === id) && a.password === password);
      if (account) setUser({ name: account.name, email: account.email });
      return account ?? null;
    },
    [accounts, setUser],
  );

  const register = useCallback(
    (name: string, email: string, password: string) => {
      const normalized = email.trim().toLowerCase();
      if ([demoAccount, ...accounts].some((a) => a.email.toLowerCase() === normalized)) return "An account with this email already exists";
      const account: Account = { name: name.trim(), email: email.trim(), username: normalized.split("@")[0], password };
      setAccounts((list) => [...list, account]);
      setUser({ name: account.name, email: account.email });
      return null;
    },
    [accounts, setAccounts, setUser],
  );

  const logout = useCallback(() => {
    setUser(null);
    notify("You've been logged out");
  }, [notify, setUser]);

  useEffect(() => {
    document.documentElement.lang = lang === "AR" ? "ar" : "en";
  }, [lang]);

  return { user, login, register, logout, cart, addToCart, removeFromCart, checkout, enrolledIds, lang, setLang, overlay, setOverlay, toasts, notify };
}

const AppContext = createContext<ReturnType<typeof useAppState> | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  return <AppContext.Provider value={useAppState()}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function formatPrice(price: number) {
  return price === 0 ? "Free" : `${price} SAR`;
}
