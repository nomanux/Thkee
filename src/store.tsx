import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { courses, type Course } from "./data";

export type User = { name: string; email: string };
export type Lang = "EN" | "AR";
export type Overlay =
  | { type: "catalog"; category?: string; query?: string; liveOnly?: boolean }
  | { type: "course"; id: string }
  | { type: "cart" }
  | { type: "instructor" }
  | { type: "info"; page: string }
  | { type: "booking"; expertId: string }
  | null;
type Toast = { id: number; message: string };
export type SearchParams = { q?: string; category?: string; sub?: string; live?: boolean };
export type Route = { page: "home" } | { page: "login" } | { page: "cart" } | { page: "checkout" } | { page: "learn"; id: string } | { page: "course"; id: string } | ({ page: "search" } & SearchParams);

function parseRoute(): Route {
  const hash = window.location.hash;
  if (hash.startsWith("#/login")) return { page: "login" };
  if (hash.startsWith("#/cart")) return { page: "cart" };
  if (hash.startsWith("#/checkout")) return { page: "checkout" };
  if (hash.startsWith("#/learn/")) return { page: "learn", id: decodeURIComponent(hash.slice("#/learn/".length).split("?")[0]) };
  if (hash.startsWith("#/course/")) return { page: "course", id: decodeURIComponent(hash.slice("#/course/".length).split("?")[0]) };
  if (!hash.startsWith("#/search")) return { page: "home" };
  const p = new URLSearchParams(hash.split("?")[1] ?? "");
  return { page: "search", q: p.get("q") ?? undefined, category: p.get("category") ?? undefined, sub: p.get("sub") ?? undefined, live: p.get("live") === "1" };
}

export function searchHash(params: SearchParams) {
  const p = new URLSearchParams();
  if (params.q?.trim()) p.set("q", params.q.trim());
  if (params.category) p.set("category", params.category);
  if (params.sub) p.set("sub", params.sub);
  if (params.live) p.set("live", "1");
  const qs = p.toString();
  return `#/search${qs ? `?${qs}` : ""}`;
}

export const AVAILABLE_CREDIT = 173;
// Demo coupon codes and the percentage each one takes off.
export const COUPONS: Record<string, number> = { THKEE10: 10, WELCOME20: 20, LEARN15: 15 };

export function orderTotals(cart: Course[], promo: string | null, credit: number) {
  const subtotal = cart.reduce((sum, c) => sum + (c.originalPrice ?? c.price), 0);
  const afterSale = cart.reduce((sum, c) => sum + c.price, 0);
  const saleDiscount = subtotal - afterSale;
  const salePercent = subtotal ? Math.round((saleDiscount / subtotal) * 100) : 0;
  const promoDiscount = promo ? Math.round((afterSale * (COUPONS[promo] ?? 0)) / 100) : 0;
  const creditUsed = Math.min(credit, Math.max(0, afterSale - promoDiscount));
  const total = Math.max(0, afterSale - promoDiscount - creditUsed);
  return { subtotal, saleDiscount, salePercent, promoDiscount, creditUsed, total };
}

export type Booking = { expertId: string; date: string; time: string };

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
  const [wishlistIds, setWishlistIds] = useStoredState<string[]>("thkee.wishlist", []);
  const [promo, setPromo] = useStoredState<string | null>("thkee.promo", null);
  const [credit, setCredit] = useStoredState<number>("thkee.credit", 0);
  const [lang, setLang] = useStoredState<Lang>("thkee.lang", "EN");
  const [overlay, setOverlayState] = useState<Overlay>(null);
  // Course details and the cart live on their own pages, so those overlay requests open the page instead.
  const setOverlay = useCallback((next: Overlay) => {
    if (next?.type === "course") {
      window.location.hash = `#/course/${encodeURIComponent(next.id)}`;
      return;
    }
    if (next?.type === "cart") {
      window.location.hash = "#/cart";
      return;
    }
    setOverlayState(next);
  }, []);
  const [reservations, setReservations] = useStoredState<string[]>("thkee.reservations", []);
  const [bookings, setBookings] = useStoredState<Booking[]>("thkee.bookings", []);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [route, setRoute] = useState<Route>(parseRoute);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseRoute());
      setOverlay(null);
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const openSearch = useCallback((params: SearchParams = {}) => {
    window.location.hash = searchHash(params);
  }, []);

  const goHome = useCallback(() => {
    if (window.location.hash) window.location.hash = "";
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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

  const openAuth = useCallback(() => {
    if (!window.location.hash.startsWith("#/login")) {
      try {
        sessionStorage.setItem("thkee.returnTo", window.location.hash);
      } catch {}
    }
    window.location.hash = "#/login";
  }, []);

  const toggleWishlist = useCallback(
    (id: string) => {
      const saved = wishlistIds.includes(id);
      setWishlistIds((ids) => (saved ? ids.filter((x) => x !== id) : [...ids, id]));
      notify(saved ? "Removed from your wishlist" : "Saved to your wishlist ♥");
    },
    [notify, setWishlistIds, wishlistIds],
  );

  const moveToWishlist = useCallback(
    (id: string) => {
      setCartIds((ids) => ids.filter((x) => x !== id));
      setWishlistIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
      notify("Moved to your wishlist ♥");
    },
    [notify, setCartIds, setWishlistIds],
  );

  const checkout = useCallback(() => {
    window.location.hash = "#/checkout";
  }, []);

  const completePurchase = useCallback(() => {
    const ids = [...cartIds];
    setEnrolledIds((list) => [...new Set([...list, ...ids])]);
    setCartIds([]);
    setPromo(null);
    setCredit(0);
    return ids;
  }, [cartIds, setCartIds, setCredit, setEnrolledIds, setPromo]);

  const signIn = useCallback(
    (account: User) => {
      setUser(account);
      const back = sessionStorage.getItem("thkee.returnTo") ?? "";
      sessionStorage.removeItem("thkee.returnTo");
      window.location.hash = back.startsWith("#/login") ? "" : back;
      notify(`Welcome to Thkee, ${account.name.split(" ")[0]}! 🎉`);
    },
    [notify, setUser],
  );

  const reserveSeat = useCallback(
    (sessionId: string, title: string) => {
      if (!user) {
        openAuth();
        return notify("Log in to reserve your seat");
      }
      if (reservations.includes(sessionId)) {
        setReservations((ids) => ids.filter((id) => id !== sessionId));
        return notify("Reservation cancelled");
      }
      setReservations((ids) => [...ids, sessionId]);
      notify(`Seat reserved for "${title}" ✓`);
    },
    [notify, reservations, setReservations, user],
  );

  const bookExpert = useCallback(
    (booking: Booking) => {
      setBookings((list) => [...list.filter((b) => b.expertId !== booking.expertId), booking]);
      setOverlay(null);
      notify(`Session booked for ${booking.date} at ${booking.time} ✓`);
    },
    [notify, setBookings],
  );

  const logout = useCallback(() => {
    setUser(null);
    notify("You've been logged out");
  }, [notify, setUser]);

  useEffect(() => {
    document.documentElement.lang = lang === "AR" ? "ar" : "en";
  }, [lang]);

  return { route, openSearch, goHome, openAuth, signIn, user, logout, reservations, reserveSeat, bookings, bookExpert, cart, addToCart, removeFromCart, checkout, completePurchase, promo, setPromo, credit, setCredit, wishlistIds, toggleWishlist, moveToWishlist, enrolledIds, lang, setLang, overlay, setOverlay, toasts, notify };
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

export function openLearning(id: string) {
  window.location.hash = `#/learn/${encodeURIComponent(id)}`;
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) return el.scrollIntoView({ behavior: "smooth", block: "start" });
  // Section lives on the home page: go there first, then scroll once it renders.
  window.location.hash = "";
  setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 350);
}

export function formatPrice(price: number) {
  return price === 0 ? "Free" : `${price} SAR`;
}
