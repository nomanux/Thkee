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
export type Route = { page: "home" } | { page: "not-found" } | { page: "login" } | { page: "cart" } | { page: "checkout" } | { page: "my-learning"; tab?: string } | { page: "purchase-history" } | { page: "refund"; orderId: string; courseId: string } | { page: "account"; section: string } | { page: "messages" } | { page: "components" } | { page: "teach" } | { page: "instructor-start" } | { page: "instructor"; newCourse?: boolean; section?: "courses" | "assignments" | "reports" | "reviews" | "qa" | "co-instructors" | "announcements" | "availability" | "apps" | "sessions" | "schedule"; announcementCourse?: string; scheduleId?: string; appsView?: "store" | "installed"; sessionSeries?: string; sessionId?: string; sessionCourse?: string; submissionId?: string; reportView?: "revenue"; reportMonth?: string; questionId?: string; newQuestionCourse?: string } | { page: "live-create"; draftId?: string; section?: string } | { page: "course-editor"; id: string; section?: string } | { page: "learn"; id: string } | { page: "course"; id: string } | ({ page: "search" } & SearchParams);

function parseRoute(): Route {
  // Typing /component or /components goes to the hash route the rest of the app uses.
  if (/^\/components?\/?$/.test(window.location.pathname)) {
    window.history.replaceState(null, "", "/#/components");
    return { page: "components" };
  }
  const hash = window.location.hash;
  if (hash.startsWith("#/component")) return { page: "components" };
  if (hash.startsWith("#/login")) return { page: "login" };
  if (hash.startsWith("#/cart")) return { page: "cart" };
  if (hash.startsWith("#/checkout")) return { page: "checkout" };
  if (hash.startsWith("#/my-learning")) return { page: "my-learning", tab: hash.split("tab=")[1] };
  if (hash.startsWith("#/purchase-history")) return { page: "purchase-history" };
  if (hash.startsWith("#/account")) return { page: "account", section: hash.slice("#/account/".length) || "profile" };
  if (hash.startsWith("#/messages")) return { page: "messages" };
  if (hash.startsWith("#/teach/start")) return { page: "instructor-start" };
  if (hash.startsWith("#/teach")) return { page: "teach" };
  if (hash.startsWith("#/instructor/assignments")) return { page: "instructor", section: "assignments", submissionId: decodeURIComponent(hash.slice("#/instructor/assignments/".length)) || undefined };
  if (hash.startsWith("#/instructor/qa/new/")) return { page: "instructor", section: "qa", newQuestionCourse: decodeURIComponent(hash.slice("#/instructor/qa/new/".length)) };
  if (hash.startsWith("#/instructor/qa")) return { page: "instructor", section: "qa", questionId: decodeURIComponent(hash.slice("#/instructor/qa/".length)) || undefined };
  if (hash.startsWith("#/instructor/create")) {
    const [draftId, section] = hash.slice("#/instructor/create/".length).split("/").map(decodeURIComponent);
    return { page: "live-create", draftId: draftId || undefined, section };
  }
  if (hash.startsWith("#/instructor/schedule")) return { page: "instructor", section: "schedule" };
  if (hash.startsWith("#/instructor/sessions")) {
    const [sessionSeries, sessionId, sessionCourse] = hash.slice("#/instructor/sessions/".length).split("/").map(decodeURIComponent);
    return { page: "instructor", section: "sessions", sessionSeries: sessionSeries || undefined, sessionId, sessionCourse };
  }
  if (hash.startsWith("#/instructor/apps/installed")) return { page: "instructor", section: "apps", appsView: "installed" };
  if (hash.startsWith("#/instructor/apps")) return { page: "instructor", section: "apps", appsView: "store" };
  if (hash.startsWith("#/instructor/availability")) return { page: "instructor", section: "availability", scheduleId: decodeURIComponent(hash.slice("#/instructor/availability/".length)) || undefined };
  if (hash.startsWith("#/instructor/announcements")) return { page: "instructor", section: "announcements", announcementCourse: decodeURIComponent(hash.slice("#/instructor/announcements/".length)) || undefined };
  if (hash.startsWith("#/instructor/co-instructors")) return { page: "instructor", section: "co-instructors" };
  if (hash.startsWith("#/instructor/reviews")) return { page: "instructor", section: "reviews" };
  if (hash.startsWith("#/instructor/reports/revenue")) return { page: "instructor", section: "reports", reportView: "revenue", reportMonth: decodeURIComponent(hash.slice("#/instructor/reports/revenue/".length)) || undefined };
  if (hash.startsWith("#/instructor/reports")) return { page: "instructor", section: "reports" };
  if (hash.startsWith("#/instructor/courses/new")) return { page: "instructor", section: "courses", newCourse: true };
  if (hash.startsWith("#/instructor/courses/")) {
    const [id, section] = hash.slice("#/instructor/courses/".length).split("/").map(decodeURIComponent);
    if (id) return { page: "course-editor", id, section };
  }
  if (hash.startsWith("#/instructor/courses")) return { page: "instructor", section: "courses" };
  if (hash.startsWith("#/instructor")) return { page: "instructor" };
  if (hash.startsWith("#/refund/")) {
    const [orderId = "", courseId = ""] = hash.slice("#/refund/".length).split("/").map(decodeURIComponent);
    return { page: "refund", orderId, courseId };
  }
  if (hash.startsWith("#/learn/")) return { page: "learn", id: decodeURIComponent(hash.slice("#/learn/".length).split("?")[0]) };
  if (hash.startsWith("#/course/")) return { page: "course", id: decodeURIComponent(hash.slice("#/course/".length).split("?")[0]) };
  // Unknown app links show the 404 page; an empty hash or a plain anchor is the homepage.
  if (!hash.startsWith("#/search")) return /^#\/./.test(hash) ? { page: "not-found" } : { page: "home" };
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
// Demo courses that are always in My learning, so the player, quizzes and assignments can be opened any time.
export const STARTER_COURSE_IDS = ["ai-foundations", "python-data"];
export type CardBrand = "Visa" | "Mastercard" | "Card";
export type SavedCard = { id: string; brand: CardBrand; last4: string; expiry: string; name: string };
// Demo card every account starts with. The first card in the list is the default one.
const DEMO_CARD: SavedCard = { id: "demo-visa", brand: "Visa", last4: "1234", expiry: "02/27", name: "" };

export function cardBrand(number: string): CardBrand {
  const digits = number.replace(/\D/g, "");
  if (digits.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "Mastercard";
  return "Card";
}

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
export type Order = { id: string; date: string; items: { courseId: string; price: number }[]; total: number; paidWith: string };
export type Refund = { orderId: string; courseId: string; date: string; status: "Pending" | "Refunded"; refundTo?: string; reason?: string; description?: string };

// Coupons and credit lower what was actually paid, so each course's refund is its share of the order total.
export function refundAmount(order: Order, courseId: string) {
  const listed = order.items.reduce((sum, i) => sum + i.price, 0);
  const price = order.items.find((i) => i.courseId === courseId)?.price ?? 0;
  return listed ? Math.round((price * order.total) / listed) : 0;
}

function demoOrder(id: string, date: string, courseIds: string[], paidWith: string): Order {
  const items = courseIds.map((courseId) => ({ courseId, price: courses.find((c) => c.id === courseId)?.price ?? 0 }));
  return { id, date: `${date}T12:00:00`, items, total: items.reduce((sum, i) => sum + i.price, 0), paidWith };
}

// Demo purchases so the history page has content before anything is bought at checkout.
const DEMO_ORDERS = [
  demoOrder("TH-10428", "2026-10-28", ["ui-ux-figma"], "VISA ***1234"),
  demoOrder("TH-10397", "2026-10-12", ["react-modern"], "VISA ***1234"),
  demoOrder("TH-10352", "2026-09-21", ["prompt-engineering", "color-theory", "project-management"], "VISA ***1234"),
  demoOrder("TH-10310", "2026-08-30", ["flutter-mobile"], "Thkee Credit"),
  demoOrder("TH-10277", "2026-08-04", ["python-data"], "VISA ***1234"),
  demoOrder("TH-10203", "2026-06-17", ["ai-foundations"], "Thkee Point"),
  demoOrder("TH-10154", "2026-05-02", ["entrepreneurship"], "VISA ***1234"),
];
const DEMO_REFUNDS: Refund[] = [
  { orderId: "TH-10352", courseId: "color-theory", date: "2026-09-25T12:00:00", status: "Refunded", refundTo: "Thkee Credit" },
  { orderId: "TH-10310", courseId: "flutter-mobile", date: "2026-09-02T12:00:00", status: "Refunded", refundTo: "Thkee Credit" },
  { orderId: "TH-10154", courseId: "entrepreneurship", date: "2026-05-06T12:00:00", status: "Refunded", refundTo: "VISA ***1234" },
];

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function useStoredState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => load(key, fallback));
  useEffect(() => save(key, value), [key, value]);
  return [value, setValue] as const;
}

function useAppState() {
  const [user, setUser] = useStoredState<User | null>("thkee.user", null);
  const SEED_CART = ["prompt-engineering", "ui-ux-figma", "react-modern"];
  const [cartIds, setCartIds] = useStoredState<string[]>("thkee.cart", SEED_CART);
  useEffect(() => { if (cartIds.length < 3) setCartIds(SEED_CART); }, []);
  const [purchasedIds, setPurchasedIds] = useStoredState<string[]>("thkee.enrolled", []);
  const enrolledIds = useMemo(() => [...new Set([...STARTER_COURSE_IDS, ...purchasedIds])], [purchasedIds]);
  const [wishlistIds, setWishlistIds] = useStoredState<string[]>("thkee.wishlist", []);
  const [archivedIds, setArchivedIds] = useStoredState<string[]>("thkee.archived", []);
  const [placedOrders, setPlacedOrders] = useStoredState<Order[]>("thkee.orders", []);
  const orders = useMemo(() => [...placedOrders, ...DEMO_ORDERS], [placedOrders]);
  const [refunds, setRefunds] = useStoredState<Refund[]>("thkee.refunds2", DEMO_REFUNDS);
  // Older builds stored only whether the demo card was kept, so that flag seeds the list once.
  const [savedCards, setSavedCards] = useStoredState<SavedCard[]>("thkee.cards", load("thkee.savedCard", true) ? [DEMO_CARD] : []);
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
    if (next?.type === "instructor") {
      window.location.hash = load("thkee.instructor", false) ? "#/instructor" : "#/teach";
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

  // A saved cart may still hold a course that is now enrolled, so it is left out here rather than sold again.
  const cart = useMemo(() => cartIds.filter((id) => !enrolledIds.includes(id)).map((id) => courses.find((c) => c.id === id)).filter((c): c is Course => !!c), [cartIds, enrolledIds]);

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

  const toggleArchive = useCallback(
    (id: string) => {
      const archived = archivedIds.includes(id);
      setArchivedIds((ids) => (archived ? ids.filter((x) => x !== id) : [...ids, id]));
      notify(archived ? "Moved back to All Courses" : "Moved to Archived");
    },
    [archivedIds, notify, setArchivedIds],
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

  const requestRefund = useCallback(
    (orderId: string, courseId: string, details: Pick<Refund, "refundTo" | "reason" | "description">) => {
      setRefunds((list) => [{ orderId, courseId, date: new Date().toISOString(), status: "Pending", ...details }, ...list]);
    },
    [setRefunds],
  );

  const cancelRefund = useCallback(
    (orderId: string, courseId: string) => {
      setRefunds((list) => list.filter((r) => r.orderId !== orderId || r.courseId !== courseId));
      notify("Refund request cancelled");
    },
    [notify, setRefunds],
  );

  const completePurchase = useCallback((paidWith: string) => {
    const ids = cart.map((c) => c.id);
    const order = { id: `TH-${Date.now()}`, date: new Date().toISOString(), items: cart.map((c) => ({ courseId: c.id, price: c.price })), total: orderTotals(cart, promo, credit).total, paidWith };
    setPlacedOrders((list) => [order, ...list]);
    setPurchasedIds((list) => [...new Set([...list, ...ids])]);
    setCartIds([]);
    setPromo(null);
    setCredit(0);
    return ids;
  }, [cart, credit, promo, setCartIds, setCredit, setPlacedOrders, setPurchasedIds, setPromo]);

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

  const updateUser = useCallback((patch: Partial<User>) => setUser((u) => (u ? { ...u, ...patch } : u)), [setUser]);

  const addCard = useCallback(
    (card: Omit<SavedCard, "id">, makeDefault: boolean) => {
      const saved = { ...card, id: `card-${Date.now()}` };
      setSavedCards((list) => (makeDefault ? [saved, ...list] : [...list, saved]));
    },
    [setSavedCards],
  );

  const removeCard = useCallback(
    (id: string) => {
      setSavedCards((list) => list.filter((c) => c.id !== id));
      notify("Payment method removed");
    },
    [notify, setSavedCards],
  );

  const setDefaultCard = useCallback(
    (id: string) => {
      setSavedCards((list) => [...list.filter((c) => c.id === id), ...list.filter((c) => c.id !== id)]);
      notify("Default payment method updated");
    },
    [notify, setSavedCards],
  );

  const closeAccount = useCallback(() => {
    ["thkee.profile", "thkee.privacy", "thkee.notifications", "thkee.threads", "thkee.instructor", "thkee.instructorSurvey", "thkee.instructorCourses", "thkee.instructorCourseDetails", "thkee.courseSettings", "thkee.instructorAssignments", "thkee.instructorReviews", "thkee.instructorQa", "thkee.instructorQa.votes", "thkee.instructorCoRequests", "thkee.instructorAnnouncements", "thkee.instructorAvailability", "thkee.instructorApps", "thkee.instructorSessions", "thkee.instructorSessions.extras", "thkee.instructorSchedule", "thkee.liveDrafts", "thkee.liveLimitDefaults"].forEach((key) => localStorage.removeItem(key));
    setUser(null);
    setCartIds([]);
    setPurchasedIds([]);
    setWishlistIds([]);
    setArchivedIds([]);
    setPlacedOrders([]);
    setRefunds(DEMO_REFUNDS);
    setSavedCards([DEMO_CARD]);
    window.location.hash = "";
    notify("Your account has been closed");
  }, [notify, setArchivedIds, setCartIds, setPlacedOrders, setPurchasedIds, setRefunds, setSavedCards, setUser, setWishlistIds]);

  const logout = useCallback(() => {
    setUser(null);
    notify("You've been logged out");
  }, [notify, setUser]);

  useEffect(() => {
    document.documentElement.lang = lang === "AR" ? "ar" : "en";
  }, [lang]);

  return { route, openSearch, goHome, openAuth, signIn, user, logout, reservations, reserveSeat, bookings, bookExpert, cart, addToCart, removeFromCart, checkout, completePurchase, promo, setPromo, credit, setCredit, wishlistIds, toggleWishlist, moveToWishlist, enrolledIds, archivedIds, toggleArchive, orders, refunds, requestRefund, cancelRefund, savedCards, addCard, removeCard, setDefaultCard, updateUser, closeAccount, lang, setLang, overlay, setOverlay, toasts, notify };
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

export function openMyLearning(tab?: string) {
  window.location.hash = tab ? `#/my-learning?tab=${tab}` : "#/my-learning";
}

export function openPurchaseHistory() {
  window.location.hash = "#/purchase-history";
}

export function openInstructorStart() {
  window.location.hash = "#/teach/start";
}

export function openMessages() {
  window.location.hash = "#/messages";
}

export function openInstructorDashboard() {
  window.location.hash = "#/instructor";
}

export function openInstructorCourses(startNew?: boolean) {
  window.location.hash = startNew ? "#/instructor/courses/new" : "#/instructor/courses";
}

export function openCourseEditor(id: string, section = "intended-learners") {
  window.location.hash = `#/instructor/courses/${encodeURIComponent(id)}/${encodeURIComponent(section)}`;
}

export function openInstructorQa(questionId?: string) {
  window.location.hash = questionId ? `#/instructor/qa/${encodeURIComponent(questionId)}` : "#/instructor/qa";
}

export function openNewFeaturedQuestion(course: string) {
  window.location.hash = `#/instructor/qa/new/${encodeURIComponent(course)}`;
}

export function openCreateSession() {
  window.location.hash = "#/instructor/create";
}

export function openLiveEditor(draftId: string, section = "intended-learners") {
  window.location.hash = `#/instructor/create/${encodeURIComponent(draftId)}/${section}`;
}

export function openInstructorSchedule() {
  window.location.hash = "#/instructor/schedule";
}

export function openInstructorSessions(...path: string[]) {
  window.location.hash = ["#/instructor/sessions", ...path.map(encodeURIComponent)].join("/");
}

export function openInstructorApps(view: "store" | "installed") {
  window.location.hash = `#/instructor/apps/${view}`;
}

export function openInstructorAvailability(scheduleId?: string) {
  window.location.hash = scheduleId ? `#/instructor/availability/${encodeURIComponent(scheduleId)}` : "#/instructor/availability";
}

export function openInstructorAnnouncements(courseId?: string) {
  window.location.hash = courseId ? `#/instructor/announcements/${encodeURIComponent(courseId)}` : "#/instructor/announcements";
}

export function openCoInstructorRequests() {
  window.location.hash = "#/instructor/co-instructors";
}

export function openInstructorReviews() {
  window.location.hash = "#/instructor/reviews";
}

export function openInstructorReports(view?: "revenue", month?: string) {
  window.location.hash = view ? `#/instructor/reports/${view}${month ? `/${encodeURIComponent(month)}` : ""}` : "#/instructor/reports";
}

export function openInstructorAssignments(submissionId?: string) {
  window.location.hash = submissionId ? `#/instructor/assignments/${encodeURIComponent(submissionId)}` : "#/instructor/assignments";
}

export function openAccount(section = "profile") {
  window.location.hash = `#/account/${section}`;
}

export function openRefund(orderId: string, courseId: string) {
  window.location.hash = `#/refund/${encodeURIComponent(orderId)}/${encodeURIComponent(courseId)}`;
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
