import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BookOpen01Icon,
  CreditCardIcon,
  DashboardSquare01Icon,
  FavouriteIcon,
  HelpCircleIcon,
  Invoice01Icon,
  Logout03Icon,
  Message01Icon,
  Notification01Icon,
  Settings01Icon,
  ShoppingCart01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { categories, courses } from "../data";
import { fontFor, fontMedium, fontRegular, fontSemi } from "../fonts";
import { formatPrice, load, openAccount, openMessages, openMyLearning, openPurchaseHistory, scrollToId, useApp, type Lang } from "../store";

const imgLogo = "/assets/820a1.svg";
const imgChevronDown = "/assets/edb9c.svg";
const imgSearch = "/assets/2970f.svg";
const imgCart = "/assets/f9b18.svg";
const imgGlobe = "/assets/28db3.svg";

const languages: { code: Lang; label: string }[] = [
  { code: "EN", label: "English" },
  { code: "AR", label: "العربية" },
];

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/i.test((navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform || navigator.platform || navigator.userAgent);

const menuPanel ="pop-in absolute top-[calc(100%+8px)] z-40 overflow-hidden rounded-[12px] border border-slate-200 bg-white p-2 shadow-[0_16px_40px_rgba(15,23,42,0.18)]";
const menuItem = `flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-2.5 text-left text-[15px] text-slate-800 transition hover:bg-slate-100 ${fontMedium}`;

function SearchBox({ onDone, autoFocus = false, shortcut = false }: { onDone?: () => void; autoFocus?: boolean; shortcut?: boolean }) {
  const { setOverlay, openSearch, route } = useApp();
  const [query, setQuery] = useState(route.page === "search" ? (route.q ?? "") : "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useDismiss(open, () => setOpen(false));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(route.page === "search" ? (route.q ?? "") : "");
  }, [route]);

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return courses.filter((c) => `${c.title} ${c.instructor} ${c.category}`.toLowerCase().includes(q)).slice(0, 5);
  }, [query]);

  const finish = () => {
    setOpen(false);
    onDone?.();
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, matches.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active > 0 && matches[active - 1]) setOverlay({ type: "course", id: matches[active - 1].id });
      else openSearch({ q: query });
      finish();
    }
  };

  return (
    <div ref={ref} className="relative w-full">
      <div className="flex h-[36px] w-full items-center gap-[8px] rounded-[8px] border border-transparent bg-white/[0.08] px-[12px] transition-colors hover:bg-white/[0.11] focus-within:border-[#12b981]/60 focus-within:bg-[#041f1a]">
        <img alt="" className="size-[16px] shrink-0 opacity-80" src={imgSearch} />
        <input
          ref={inputRef}
          type="search"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="What do you want to learn?"
          aria-label="Search courses"
          aria-keyshortcuts={shortcut ? (isMac ? "Meta+K" : "Control+K") : undefined}
          className={`min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-slate-100 placeholder:text-white/55 focus:outline-none ${fontRegular}`}
        />
        {shortcut && !query && (
          <kbd className={`hidden shrink-0 rounded-[5px] border border-white/15 px-1.5 text-[12px] leading-[18px] text-white/55 lg:block ${fontMedium}`}>{isMac ? "⌘K" : "Ctrl K"}</kbd>
        )}
      </div>
      {open && query.trim() && (
        <div className={`${menuPanel} left-0 right-0`} role="listbox">
          {matches.length ? (
            matches.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={active === i + 1}
                className={`${menuItem} ${active === i + 1 ? "bg-slate-100" : ""}`}
                onMouseEnter={() => setActive(i + 1)}
                onClick={() => {
                  setOverlay({ type: "course", id: c.id });
                  finish();
                }}
              >
                <span className="min-w-0">
                  <span dir="auto" className={`block truncate text-left ${fontFor(c.title, fontMedium, "font-medium")}`}>{c.title}</span>
                  <span className={`block text-[13px] text-slate-500 ${fontRegular}`}>
                    {c.category} · {c.instructor}
                  </span>
                </span>
                <span className={`shrink-0 text-[13px] text-[#0d5c4b] ${fontSemi}`}>{formatPrice(c.price)}</span>
              </button>
            ))
          ) : (
            <p className={`px-3 py-3 text-[14px] text-slate-500 ${fontRegular}`}>No courses match "{query.trim()}"</p>
          )}
          <button
            type="button"
            className={`${menuItem} mt-1 border-t border-slate-200 text-[#0d5c4b]`}
            onClick={() => {
              openSearch({ q: query });
              finish();
            }}
          >
            See all results for "{query.trim()}" →
          </button>
        </div>
      )}
    </div>
  );
}

function ExploreMenu() {
  const { openSearch } = useApp();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useDismiss(open, () => setOpen(false));
  const go = (params: Parameters<typeof openSearch>[0]) => {
    openSearch(params);
    setOpen(false);
  };
  const current = categories[active];
  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-[36px] items-center justify-center gap-1.5 rounded-[8px] pl-3 pr-2 transition-colors hover:bg-white/[0.14] ${open ? "bg-white/[0.14]" : "bg-white/[0.08]"}`}
      >
        <span className={`text-[14px] leading-[20px] text-white ${fontSemi}`}>Explore</span>
        <img alt="" className={`size-[16px] opacity-80 transition-transform ${open ? "rotate-180" : ""}`} src={imgChevronDown} />
      </button>
      {open && (
        <div className="pop-in absolute left-0 top-[calc(100%+10px)] z-40 flex w-[min(880px,calc(100vw-48px))] overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
          <ul className="flex w-[300px] shrink-0 flex-col gap-1 border-r border-slate-200 bg-slate-50 p-3" role="menu">
            {categories.map((cat, i) => (
              <li key={cat.name}>
                <button
                  type="button"
                  role="menuitem"
                  aria-expanded={i === active}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => go({ category: cat.name })}
                  className={`flex w-full items-center justify-between gap-3 rounded-[12px] px-4 py-3 text-left text-[16px] leading-[22px] transition-colors ${fontMedium} ${i === active ? "bg-[#e7f5f1] text-[#0d5c4b]" : "text-slate-900 hover:bg-slate-100"}`}
                >
                  {cat.name}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="shrink-0">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
          <div key={current.name} className="fade-up flex min-w-0 flex-1 flex-col gap-6 p-7">
            <button type="button" onClick={() => go({ category: current.name })} className={`group flex items-center justify-between gap-3 text-left text-[17px] text-[#0d5c4b] ${fontSemi}`}>
              All {current.name}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              {current.subs.map((sub) => {
                const count = courses.filter((c) => c.subcategory === sub).length;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => go({ category: current.name, sub })}
                    className={`flex items-baseline justify-between gap-2 rounded-[8px] py-2.5 text-left text-[14px] text-slate-700 transition-colors hover:text-[#0d5c4b] ${fontRegular}`}
                  >
                    {sub}
                    <span className="text-[12px] text-slate-400">{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
              <button type="button" onClick={() => go({})} className={`rounded-full bg-slate-900 px-4 py-2 text-[14px] text-white transition hover:bg-[#0d5c4b] ${fontMedium}`}>
                Browse all {courses.length} courses
              </button>
              <button type="button" onClick={() => go({ live: true })} className={`flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-[14px] text-slate-900 transition hover:border-[#0d5c4b] hover:text-[#0d5c4b] ${fontMedium}`}>
                <span className="size-2 rounded-full bg-[#ef4444]" /> Live classes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LanguageMenu() {
  const { lang, setLang, notify } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative hidden sm:block">
      <button type="button" aria-expanded={open} aria-label="Change language" onClick={() => setOpen((o) => !o)} className="flex h-[36px] items-center justify-center gap-[4px] rounded-[8px] px-[8px] transition hover:bg-white/10">
        <img alt="" className="size-[18px]" src={imgGlobe} />
        <span className={`text-[14px] leading-[20px] text-white ${fontMedium}`}>{lang}</span>
      </button>
      {open && (
        <div className={`${menuPanel} right-0 w-[180px]`}>
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              className={menuItem}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
                notify(l.code === "AR" ? "Language set to العربية (full translation coming soon)" : "Language set to English");
              }}
            >
              {l.label}
              {lang === l.code && <span className="text-[#0d5c4b]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* Hugeicons (stroke style) for the account menu. */
const menuIcons = {
  learning: BookOpen01Icon,
  cart: ShoppingCart01Icon,
  heart: FavouriteIcon,
  dashboard: DashboardSquare01Icon,
  bell: Notification01Icon,
  message: Message01Icon,
  settings: Settings01Icon,
  card: CreditCardIcon,
  receipt: Invoice01Icon,
  user: UserCircleIcon,
  help: HelpCircleIcon,
  logout: Logout03Icon,
};

function MenuIcon({ name }: { name: keyof typeof menuIcons }) {
  return <HugeiconsIcon icon={menuIcons[name]} size={18} strokeWidth={1.7} aria-hidden="true" className="shrink-0 text-slate-500 transition-colors group-hover:text-current" />;
}

function UserAvatar({ photo, initials, className }: { photo: string; initials: string; className: string }) {
  if (photo) return <img src={photo} alt="" className={`shrink-0 rounded-full object-cover ${className}`} />;
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(140deg,#1fae86_0%,#0d5c4b_100%)] tracking-[0.02em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(0,0,0,0.18)] ${className} ${fontSemi}`}
    >
      {initials}
    </span>
  );
}

function UserMenu() {
  const { user, logout, setOverlay, notify, cart } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  if (!user) return null;
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const photo = load("thkee.profile", { photo: "" }).photo;
  const groups: { label: string; icon: keyof typeof menuIcons; onClick: () => void; badge?: number }[][] = [
    [
      { label: "My learning", icon: "learning", onClick: () => openMyLearning() },
      { label: "My cart", icon: "cart", onClick: () => setOverlay({ type: "cart" }), badge: cart.length },
      { label: "Wishlist", icon: "heart", onClick: () => openMyLearning("wishlist") },
      { label: "Instructor dashboard", icon: "dashboard", onClick: () => setOverlay({ type: "instructor" }) },
    ],
    [
      { label: "Notifications", icon: "bell", onClick: () => openAccount("notifications") },
      { label: "Messages", icon: "message", onClick: () => openMessages() },
    ],
    [
      { label: "Account settings", icon: "settings", onClick: () => openAccount() },
      { label: "Payment methods", icon: "card", onClick: () => openAccount("payment") },
      { label: "Purchase history", icon: "receipt", onClick: () => openPurchaseHistory() },
      { label: "Public profile", icon: "user", onClick: () => notify("Public profiles are coming soon") },
      { label: "Help", icon: "help", onClick: () => scrollToId("faq") },
    ],
  ];
  const pick = (fn: () => void) => {
    setOpen(false);
    fn();
  };
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-expanded={open} aria-label="Account menu" onClick={() => setOpen((o) => !o)} className={`group relative flex size-[32px] items-center justify-center rounded-full ring-1 ring-white/20 ring-offset-2 ring-offset-[#03241d] transition-[box-shadow] duration-200 hover:ring-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb20d] ${open ? "ring-white/60" : ""}`}
      >
        <UserAvatar photo={photo} initials={initials} className="size-full text-[13px]" />
      </button>
      {open && (
        <div
          role="menu"
          className="pop-in absolute right-0 top-[calc(100%+10px)] z-40 max-h-[calc(100dvh-72px)] w-[284px] overflow-y-auto rounded-[16px] border border-slate-200 bg-white p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_20px_48px_-8px_rgba(15,23,42,0.24)] [scrollbar-width:thin]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => pick(() => openAccount("profile"))}
            className="group flex w-full items-center gap-3 rounded-[12px] bg-[#f6f8f7] p-3 text-left transition hover:bg-[#eef4f1]"
          >
            <UserAvatar photo={photo} initials={initials} className="size-[40px] text-[14px]" />
            <span className="min-w-0 flex-1">
              <span className={`block truncate text-[15px] leading-[20px] text-slate-900 ${fontSemi}`}>{user.name}</span>
              <span className={`block truncate text-[14px] leading-[20px] text-slate-500 ${fontRegular}`}>{user.email}</span>
            </span>
            <span className={`shrink-0 text-[14px] text-[#0d5c4b] opacity-0 transition group-hover:opacity-100 ${fontMedium}`}>Edit</span>
          </button>
          {groups.map((items, i) => (
            <div key={i} className="mt-1.5 border-t border-slate-100 pt-1.5">
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => pick(item.onClick)}
                  className={`group flex h-[38px] w-full items-center gap-3 rounded-[10px] px-2.5 text-left text-[14px] text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 ${fontMedium}`}
                >
                  <MenuIcon name={item.icon} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {!!item.badge && <span className={`rounded-full bg-[#ffb20d] px-1.5 text-[12px] leading-[18px] text-slate-800 ${fontSemi}`}>{item.badge}</span>}
                </button>
              ))}
            </div>
          ))}
          <div className="mt-1.5 border-t border-slate-100 pt-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => pick(logout)}
              className={`group flex h-[38px] w-full items-center gap-3 rounded-[10px] px-2.5 text-left text-[14px] text-slate-700 transition-colors hover:bg-[#fef2f2] hover:text-[#b91c1c] ${fontMedium}`}
            >
              <MenuIcon name="logout" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CartButton({ className = "" }: { className?: string }) {
  const { cart, setOverlay } = useApp();
  return (
    <button type="button" aria-label={`Cart, ${cart.length} items`} onClick={() => setOverlay({ type: "cart" })} className={`relative flex size-[36px] items-center justify-center rounded-[8px] transition hover:bg-white/10 ${className}`}>
      <img alt="" className="size-[19px]" src={imgCart} />
      {cart.length > 0 && (
        <span className={`absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-[#ffb20d] px-1 text-[11px] leading-[18px] text-slate-800 ${fontSemi}`}>{cart.length}</span>
      )}
    </button>
  );
}

export default function Navbar({ solid = false }: { solid?: boolean }) {
  const { user, setOverlay, lang, setLang, cart, logout, openSearch, goHome, openAuth } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // The teach link speaks to who is signed in: instructors go to their dashboard, learners are invited to start teaching.
  const teachLabel = !user ? "Teach on Thkee" : load("thkee.instructor", false) ? "Instructor" : "Become an instructor";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => window.innerWidth >= 1280 && setMenuOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, [menuOpen]);

  const open = (o: Parameters<typeof setOverlay>[0]) => {
    setOverlay(o);
    setMenuOpen(false);
  };
  const mobileItem = `flex w-full items-center justify-between rounded-[8px] px-4 py-3 text-left text-[16px] text-white transition hover:bg-white/10 ${fontMedium}`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[100] flex h-[56px] items-center justify-center border-b backdrop-blur-[20px] transition-colors duration-300 ${
        solid || scrolled || menuOpen ? "border-white/[0.06] bg-[rgba(3,36,29,0.94)] shadow-[0_6px_20px_rgba(0,0,0,0.14)]" : "border-white/[0.08] bg-[rgba(3,40,29,0.4)]"
      }`}
    >
      <nav className="relative flex w-full max-w-[1272px] items-center px-[16px]" aria-label="Main">
        <div className="flex shrink-0 items-center gap-[20px]">
          <button type="button" aria-label="Thkee home" onClick={goHome} className="py-[2px]">
            <img alt="Thkee" className="h-[22px] w-[74.5px]" src={imgLogo} />
          </button>
          <ExploreMenu />
        </div>
        <div className="hidden min-w-px max-w-[440px] flex-[1_0_0] pl-[10px] md:flex">
          <SearchBox shortcut />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-[4px] sm:gap-[6px]">
          <button type="button" onClick={() => openMyLearning()} className={`hidden h-[36px] items-center whitespace-nowrap rounded-[8px] px-[10px] text-[14px] leading-[20px] text-white/80 transition hover:bg-white/10 hover:text-white xl:flex ${fontMedium}`}>
            My learning
          </button>
          <button type="button" onClick={() => open({ type: "instructor" })} className={`hidden h-[36px] items-center whitespace-nowrap rounded-[8px] px-[10px] text-[14px] leading-[20px] text-white/80 transition hover:bg-white/10 hover:text-white xl:flex ${fontMedium}`}>
            {teachLabel}
          </button>
          <div className="mx-[6px] hidden h-[20px] w-px bg-white/20 xl:block" />
          <CartButton className="hidden lg:flex" />
          <LanguageMenu />
          {user ? (
            <div className="ml-[6px]">
              <UserMenu />
            </div>
          ) : (
            <div className="ml-[4px] flex items-center gap-[6px]">
              <button type="button" onClick={() => (openAuth(), setMenuOpen(false))} className={`hidden h-[36px] items-center rounded-[8px] px-[12px] text-[14px] leading-[20px] text-white transition hover:bg-white/10 sm:flex ${fontMedium}`}>
                Log in
              </button>
              <button type="button" onClick={() => (openAuth(), setMenuOpen(false))} className={`flex h-[36px] items-center whitespace-nowrap rounded-[8px] bg-[#ffb20d] px-[14px] text-[14px] leading-[20px] text-slate-800 transition hover:bg-[#faa104] ${fontSemi}`}>
                Sign up
              </button>
            </div>
          )}
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="relative flex size-[36px] items-center justify-center rounded-[8px] text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white xl:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
            {!menuOpen && cart.length > 0 && <span className="absolute right-1.5 top-1.5 size-[8px] rounded-full bg-[#ffb20d] lg:hidden" />}
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div className="pop-in absolute inset-x-4 top-[60px] flex max-h-[calc(100dvh-76px)] flex-col gap-1 overflow-y-auto rounded-[12px] border border-white/10 bg-[#041f1a] p-3 shadow-[0_20px_40px_rgba(0,0,0,0.35)] xl:hidden">
          <div className="mb-2 md:hidden">
            <SearchBox onDone={() => setMenuOpen(false)} />
          </div>
          <button type="button" className={`${mobileItem} lg:hidden`} onClick={() => (openSearch({}), setMenuOpen(false))}>
            All courses <span className="text-[14px] text-white/60">{courses.length}</span>
          </button>
          <button type="button" className={`${mobileItem} lg:hidden`} onClick={() => (openSearch({ live: true }), setMenuOpen(false))}>
            <span className="flex items-center gap-2">
              <span className="size-[8px] rounded-full bg-[#ef4444]" /> Live classes
            </span>
          </button>
          <div className="flex flex-col lg:hidden">
            <p className={`px-4 pb-1 pt-3 text-[12px] uppercase tracking-[1px] text-white/50 ${fontSemi}`}>Explore</p>
            {categories.map((cat) => (
              <details key={cat.name} className="group rounded-[8px] open:bg-white/5">
                <summary className={`${mobileItem} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
                  {cat.name}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="shrink-0 transition-transform group-open:rotate-90">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </summary>
                <div className="flex flex-col pb-2 pl-4">
                  <button type="button" onClick={() => (openSearch({ category: cat.name }), setMenuOpen(false))} className={`px-4 py-2 text-left text-[15px] text-[#7ff0c0] ${fontMedium}`}>
                    All {cat.name} →
                  </button>
                  {cat.subs.map((sub) => (
                    <button key={sub} type="button" onClick={() => (openSearch({ category: cat.name, sub }), setMenuOpen(false))} className={`px-4 py-2 text-left text-[14px] text-white/80 hover:text-white ${fontRegular}`}>
                      {sub}
                    </button>
                  ))}
                </div>
              </details>
            ))}
          </div>
          <button type="button" className={mobileItem} onClick={() => (openMyLearning(), setMenuOpen(false))}>
            My learning
          </button>
          <button type="button" className={mobileItem} onClick={() => (openPurchaseHistory(), setMenuOpen(false))}>
            Purchase history
          </button>
          <button type="button" className={mobileItem} onClick={() => (openMessages(), setMenuOpen(false))}>
            Messages
          </button>
          <button type="button" className={mobileItem} onClick={() => (openAccount(), setMenuOpen(false))}>
            Account settings
          </button>
          <button type="button" className={mobileItem} onClick={() => open({ type: "instructor" })}>
            {teachLabel}
          </button>
          <button type="button" className={`${mobileItem} lg:hidden`} onClick={() => open({ type: "cart" })}>
            Cart
            {cart.length > 0 && <span className={`rounded-full bg-[#ffb20d] px-2 text-[13px] text-slate-800 ${fontSemi}`}>{cart.length}</span>}
          </button>
          <div className="flex gap-2 px-4 py-2 sm:hidden">
            {languages.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-[8px] border px-3 py-2 text-[15px] ${fontMedium} ${lang === l.code ? "border-[#ffb20d] text-[#ffb20d]" : "border-white/15 text-white"}`}
              >
                {l.label}
              </button>
            ))}
          </div>
          {user ? (
            <button type="button" className={`${mobileItem} text-[#fca5a5] sm:hidden`} onClick={() => (logout(), setMenuOpen(false))}>
              Log out ({user.name})
            </button>
          ) : (
            <button type="button" className={`mt-2 rounded-[8px] bg-slate-100 px-4 py-3 text-center text-[16px] text-slate-800 sm:hidden ${fontMedium}`} onClick={() => (openAuth(), setMenuOpen(false))}>
              Log in
            </button>
          )}
        </div>
      )}
    </header>
  );
}
