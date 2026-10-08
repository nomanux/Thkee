import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { categories, courses } from "../data";
import { fontFor, fontMedium, fontRegular, fontSemi } from "../fonts";
import { formatPrice, useApp, type Lang } from "../store";

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

const menuPanel = "pop-in absolute top-[calc(100%+8px)] z-40 overflow-hidden rounded-[12px] border border-[#e2e8f0] bg-white p-2 shadow-[0_16px_40px_rgba(15,23,42,0.18)]";
const menuItem = `flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-2.5 text-left text-[15px] text-[#1e293b] transition hover:bg-[#f1f5f9] ${fontMedium}`;

function SearchBox({ onDone, autoFocus = false }: { onDone?: () => void; autoFocus?: boolean }) {
  const { setOverlay } = useApp();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useDismiss(open, () => setOpen(false));

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return courses.filter((c) => `${c.title} ${c.instructor} ${c.category}`.toLowerCase().includes(q)).slice(0, 5);
  }, [query]);

  const finish = () => {
    setOpen(false);
    setQuery("");
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
      else setOverlay({ type: "catalog", query });
      finish();
    }
  };

  return (
    <div ref={ref} className="relative w-full">
      <div className="flex h-[44px] w-full items-center gap-[8px] rounded-[12px] border border-[rgba(255,255,255,0.05)] bg-[#041f1a] px-[16px] focus-within:border-[#12b981]/60">
        <img alt="" className="size-[20px] shrink-0" src={imgSearch} />
        <input
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
          placeholder="Search topics here"
          aria-label="Search courses"
          className={`min-w-0 flex-1 bg-transparent text-[16px] leading-[20px] tracking-[-0.01px] text-[#f1f5f9] placeholder:text-[#f1f5f9] focus:outline-none ${fontRegular}`}
        />
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
                className={`${menuItem} ${active === i + 1 ? "bg-[#f1f5f9]" : ""}`}
                onMouseEnter={() => setActive(i + 1)}
                onClick={() => {
                  setOverlay({ type: "course", id: c.id });
                  finish();
                }}
              >
                <span className="min-w-0">
                  <span dir="auto" className={`block truncate text-left ${fontFor(c.title, fontMedium, "font-medium")}`}>{c.title}</span>
                  <span className={`block text-[13px] text-[#64748b] ${fontRegular}`}>
                    {c.category} · {c.instructor}
                  </span>
                </span>
                <span className={`shrink-0 text-[13px] text-[#0d5c4b] ${fontSemi}`}>{formatPrice(c.price)}</span>
              </button>
            ))
          ) : (
            <p className={`px-3 py-3 text-[14px] text-[#64748b] ${fontRegular}`}>No courses match "{query.trim()}"</p>
          )}
          <button
            type="button"
            className={`${menuItem} mt-1 border-t border-[#e2e8f0] text-[#0d5c4b]`}
            onClick={() => {
              setOverlay({ type: "catalog", query });
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

function CoursesMenu() {
  const { setOverlay } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const go = (o: Parameters<typeof setOverlay>[0]) => {
    setOverlay(o);
    setOpen(false);
  };
  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-[36px] items-center justify-center gap-[4px] rounded-[8px] px-[12px] py-[6px] transition hover:bg-white/10"
      >
        <span className={`text-[16px] leading-[20px] tracking-[-0.01px] text-white ${fontMedium}`}>Courses</span>
        <img alt="" className={`size-[18px] transition-transform ${open ? "rotate-180" : ""}`} src={imgChevronDown} />
      </button>
      {open && (
        <div className={`${menuPanel} left-0 w-[280px]`}>
          <button type="button" className={menuItem} onClick={() => go({ type: "catalog" })}>
            All courses <span className="text-[13px] text-[#64748b]">{courses.length}</span>
          </button>
          <button type="button" className={menuItem} onClick={() => go({ type: "catalog", liveOnly: true })}>
            <span className="flex items-center gap-2">
              <span className="size-[8px] rounded-full bg-[#ef4444]" /> Live classes
            </span>
            <span className="text-[13px] text-[#64748b]">{courses.filter((c) => c.live).length}</span>
          </button>
          <div className="my-1 border-t border-[#e2e8f0]" />
          {categories.map((cat) => (
            <button key={cat.name} type="button" className={menuItem} onClick={() => go({ type: "catalog", category: cat.name })}>
              <span className="flex items-center gap-2">
                <span className="size-[10px] rounded-full" style={{ background: cat.colors[1] }} />
                {cat.name}
              </span>
              <span className="text-[13px] text-[#64748b]">{courses.filter((c) => c.category === cat.name).length}</span>
            </button>
          ))}
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
      <button type="button" aria-expanded={open} aria-label="Change language" onClick={() => setOpen((o) => !o)} className="flex h-[36px] items-center justify-center gap-[4px] rounded-[6px] px-[8px] py-[6px] transition hover:bg-white/10">
        <img alt="" className="size-[20px]" src={imgGlobe} />
        <span className={`text-[16px] leading-[20px] tracking-[-0.01px] text-white ${fontMedium}`}>{lang}</span>
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

function UserMenu() {
  const { user, logout, setOverlay, enrolledIds } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  if (!user) return null;
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((o) => !o)}
        className={`flex size-[44px] items-center justify-center rounded-full border-2 border-white/40 bg-[#ffb20d] text-[15px] text-[#1e293b] transition hover:border-white ${fontSemi}`}
      >
        {initials}
      </button>
      {open && (
        <div className={`${menuPanel} right-0 w-[240px]`}>
          <div className="px-3 py-2">
            <p className={`truncate text-[15px] text-[#0f172a] ${fontSemi}`}>{user.name}</p>
            <p className={`truncate text-[13px] text-[#64748b] ${fontRegular}`}>{user.email}</p>
          </div>
          <div className="my-1 border-t border-[#e2e8f0]" />
          <button type="button" className={menuItem} onClick={() => (setOverlay({ type: "catalog" }), setOpen(false))}>
            My learning <span className="text-[13px] text-[#64748b]">{enrolledIds.length} enrolled</span>
          </button>
          <button type="button" className={menuItem} onClick={() => (setOverlay({ type: "cart" }), setOpen(false))}>
            My cart
          </button>
          <button type="button" className={menuItem} onClick={() => (setOverlay({ type: "instructor" }), setOpen(false))}>
            Become an Instructor
          </button>
          <div className="my-1 border-t border-[#e2e8f0]" />
          <button type="button" className={`${menuItem} text-[#ef4444]`} onClick={() => (logout(), setOpen(false))}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

function CartButton({ className = "" }: { className?: string }) {
  const { cart, setOverlay } = useApp();
  return (
    <button type="button" aria-label={`Cart, ${cart.length} items`} onClick={() => setOverlay({ type: "cart" })} className={`relative flex size-[40px] items-center justify-center rounded-[8px] transition hover:bg-white/10 ${className}`}>
      <img alt="" className="h-[21px] w-[21px]" src={imgCart} />
      {cart.length > 0 && (
        <span className={`absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-[#ffb20d] px-1 text-[11px] leading-[18px] text-[#1e293b] ${fontSemi}`}>{cart.length}</span>
      )}
    </button>
  );
}

export default function Navbar() {
  const { user, setOverlay, lang, setLang, cart, logout } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
      className={`fixed inset-x-0 top-0 z-[100] flex h-[72px] items-center justify-center border-b border-white/10 backdrop-blur-[20px] transition-colors duration-300 ${
        scrolled || menuOpen ? "bg-[rgba(3,36,29,0.92)] shadow-[0_8px_24px_rgba(0,0,0,0.18)]" : "bg-[rgba(3,40,29,0.45)]"
      }`}
    >
      <nav className="relative flex w-full max-w-[1272px] items-center px-[16px]" aria-label="Main">
        <div className="flex shrink-0 items-center gap-[32px]">
          <button type="button" aria-label="Thkee home" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="py-[2px]">
            <img alt="Thkee" className="h-[28px] w-[94.839px]" src={imgLogo} />
          </button>
          <CoursesMenu />
        </div>
        <div className="hidden min-w-px flex-[1_0_0] pl-[32px] pr-[8px] md:flex">
          <SearchBox />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-[8px] sm:gap-[16px]">
          <button type="button" onClick={() => open({ type: "instructor" })} className={`hidden h-[36px] items-center justify-center whitespace-nowrap rounded-[8px] px-[12px] py-[6px] text-[16px] leading-[20px] tracking-[-0.01px] text-white transition hover:bg-white/10 xl:flex ${fontMedium}`}>
            Become an Instructor
          </button>
          <div className="hidden self-stretch py-[4px] xl:flex">
            <div className="h-full w-px bg-white opacity-40" />
          </div>
          <CartButton className="hidden lg:flex" />
          <LanguageMenu />
          {user ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-[8px] sm:gap-[16px]">
              <button type="button" onClick={() => open({ type: "auth", mode: "login" })} className={`hidden h-[44px] items-center justify-center rounded-[8px] bg-[#f1f5f9] px-[16px] py-[10px] text-[16px] leading-[20px] tracking-[-0.01px] text-[#1e293b] transition hover:bg-white sm:flex ${fontMedium}`}>
                Log in
              </button>
              <button type="button" onClick={() => open({ type: "auth", mode: "signup" })} className={`flex h-[40px] items-center justify-center whitespace-nowrap rounded-[8px] bg-[#ffb20d] px-[16px] py-[10px] text-[16px] leading-[20px] tracking-[-0.01px] text-[#1e293b] transition hover:bg-[#faa104] sm:h-[44px] sm:px-[20px] ${fontMedium}`}>
                Sign up
              </button>
            </div>
          )}
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="relative flex size-[40px] items-center justify-center rounded-[8px] text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white xl:hidden"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
            {!menuOpen && cart.length > 0 && <span className="absolute right-1.5 top-1.5 size-[8px] rounded-full bg-[#ffb20d] lg:hidden" />}
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div className="pop-in absolute inset-x-4 top-[76px] flex max-h-[calc(100dvh-92px)] flex-col gap-1 overflow-y-auto rounded-[12px] border border-white/10 bg-[#041f1a] p-3 shadow-[0_20px_40px_rgba(0,0,0,0.35)] xl:hidden">
          <div className="mb-2 md:hidden">
            <SearchBox onDone={() => setMenuOpen(false)} />
          </div>
          <button type="button" className={`${mobileItem} lg:hidden`} onClick={() => open({ type: "catalog" })}>
            All courses <span className="text-[14px] text-white/60">{courses.length}</span>
          </button>
          <button type="button" className={`${mobileItem} lg:hidden`} onClick={() => open({ type: "catalog", liveOnly: true })}>
            <span className="flex items-center gap-2">
              <span className="size-[8px] rounded-full bg-[#ef4444]" /> Live classes
            </span>
          </button>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1 lg:hidden">
            {categories.map((cat) => (
              <button key={cat.name} type="button" onClick={() => open({ type: "catalog", category: cat.name })} className={`shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-[14px] text-white/90 hover:bg-white/10 ${fontMedium}`}>
                {cat.name}
              </button>
            ))}
          </div>
          <button type="button" className={mobileItem} onClick={() => open({ type: "instructor" })}>
            Become an Instructor
          </button>
          <button type="button" className={`${mobileItem} lg:hidden`} onClick={() => open({ type: "cart" })}>
            Cart
            {cart.length > 0 && <span className={`rounded-full bg-[#ffb20d] px-2 text-[13px] text-[#1e293b] ${fontSemi}`}>{cart.length}</span>}
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
            <button type="button" className={`mt-2 rounded-[8px] bg-[#f1f5f9] px-4 py-3 text-center text-[16px] text-[#1e293b] sm:hidden ${fontMedium}`} onClick={() => open({ type: "auth", mode: "login" })}>
              Log in
            </button>
          )}
        </div>
      )}
    </header>
  );
}
