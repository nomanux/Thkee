import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { fontBold, fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, openAccount, openCoInstructorRequests, openInstructorAnnouncements, openInstructorApps, openInstructorAssignments, openInstructorAvailability, openInstructorCourses, openInstructorDashboard, openInstructorQa, openInstructorReports, openInstructorReviews, openInstructorSchedule, openInstructorSessions, openMessages, openMyLearning, useApp } from "../store";
import InstructorAnnouncements from "./InstructorAnnouncements";
import InstructorApps from "./InstructorApps";
import InstructorAssignments, { uncheckedSubmissionCount } from "./InstructorAssignments";
import InstructorAvailability from "./InstructorAvailability";
import InstructorCoRequests, { pendingCoRequestCount } from "./InstructorCoRequests";
import InstructorCourses from "./InstructorCourses";
import InstructorOverview from "./InstructorOverview";
import InstructorQa, { unansweredQuestionCount } from "./InstructorQa";
import InstructorReports from "./InstructorReports";
import InstructorReviews, { unrepliedReviewCount } from "./InstructorReviews";
import InstructorSchedule from "./InstructorSchedule";
import InstructorSessions from "./InstructorSessions";

const imgLogoLight = "/assets/4c1d1.svg";
const COLLAPSE_KEY = "thkee.instructorNavCollapsed";

type Section = "courses" | "assignments" | "reports" | "reviews" | "qa" | "co-instructors" | "announcements" | "availability" | "apps" | "sessions" | "schedule";
type NavItem = { label: string; icon: string; children?: string[]; badge?: () => number };

const navGroups: { heading?: string; items: NavItem[] }[] = [
  { items: [{ label: "Dashboard", icon: "/assets/7b902.svg" }] },
  {
    heading: "Recorded courses",
    items: [
      { label: "Course", icon: "/assets/a8978.svg" },
      { label: "Assignments", icon: "/assets/dc8e4.svg", badge: uncheckedSubmissionCount },
      { label: "Q&A", icon: "/assets/1337a.svg", badge: unansweredQuestionCount },
      { label: "Reviews", icon: "/assets/d6bae.svg", badge: unrepliedReviewCount },
      { label: "Report", icon: "/assets/9109d.svg" },
    ],
  },
  {
    heading: "Live sessions",
    items: [
      { label: "All Sessions", icon: "/assets/f4aec.svg" },
      { label: "Schedule", icon: "/assets/971eb.svg" },
      { label: "Availability", icon: "/assets/26384.svg" },
      { label: "Connected Apps", icon: "/assets/9ed7f.svg", children: ["App Store", "Installed Apps"] },
    ],
  },
  {
    heading: "Communication",
    items: [
      { label: "Messages", icon: "/assets/817aa.svg" },
      { label: "Announcements", icon: "/assets/48fdd.svg" },
      { label: "Co-Instructor Requests", icon: "/assets/78c79.svg", badge: pendingCoRequestCount },
    ],
  },
];

const PAGE_GROUP: Record<string, string> = Object.fromEntries(navGroups.flatMap((g) => g.items.flatMap((i) => [[i.label, g.heading ?? ""], ...(i.children ?? []).map((c) => [c, g.heading ?? ""])])));

function go(label: string) {
  if (label === "Messages") openMessages();
  else if (label === "Dashboard") openInstructorDashboard();
  else if (label === "Course") openInstructorCourses();
  else if (label === "Assignments") openInstructorAssignments();
  else if (label === "Q&A") openInstructorQa();
  else if (label === "All Sessions") openInstructorSessions();
  else if (label === "Schedule") openInstructorSchedule();
  else if (label === "App Store" || label === "Connected Apps") openInstructorApps("store");
  else if (label === "Installed Apps") openInstructorApps("installed");
  else if (label === "Availability") openInstructorAvailability();
  else if (label === "Announcements") openInstructorAnnouncements();
  else if (label === "Co-Instructor Requests") openCoInstructorRequests();
  else if (label === "Reviews") openInstructorReviews();
  else if (label === "Report") openInstructorReports();
}

function Svg({ d, className = "size-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const D = {
  search: "M21 21l-4.3-4.3M11 18a7 7 0 100-14 7 7 0 000 14z",
  bell: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0",
  help: "M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01M12 22a10 10 0 100-20 10 10 0 000 20z",
  swap: "M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16",
  chevron: "M6 9l6 6 6-6",
  chevronRight: "M9 6l6 6-6 6",
  collapse: "M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 3v18M16 15l-3-3 3-3",
  expand: "M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 3v18M14 9l3 3-3 3",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6L6 18",
  user: "M20 21a8 8 0 10-16 0M12 13a5 5 0 100-10 5 5 0 000 10z",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
};

function NavIcon({ src, active }: { src: string; active: boolean }) {
  const mask = `url(${src}) center / contain no-repeat`;
  return <span aria-hidden="true" className={`size-[18px] shrink-0 transition-colors ${active ? "bg-[#ffb20d]" : "bg-[#94a3b8] group-hover:bg-white"}`} style={{ mask, WebkitMask: mask }} />;
}

function Avatar({ size = 32, ring = "ring-white" }: { size?: number; ring?: string }) {
  const { user } = useApp();
  const photo = load("thkee.profile", { photo: "" }).photo;
  const initials = (user?.name ?? "You")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return photo ? (
    <img src={photo} alt="" className={`shrink-0 rounded-full object-cover ring-2 ${ring}`} style={{ width: size, height: size }} />
  ) : (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ffb20d] to-[#f59e0b] text-[#1e293b] ring-2 ${ring} ${fontBold}`} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </span>
  );
}

/* ------------------------------- Sidebar ------------------------------- */

function Sidebar({ active, collapsed, onToggle, onNavigate, mobile }: { active: string; collapsed: boolean; onToggle?: () => void; onNavigate?: () => void; mobile?: boolean }) {
  const { user } = useApp();
  const [appsOpen, setAppsOpen] = useState(active === "App Store" || active === "Installed Apps");
  const narrow = collapsed && !mobile;

  const pick = (label: string, hasChildren?: boolean) => {
    if (hasChildren && !narrow) {
      setAppsOpen((o) => !o);
      return;
    }
    go(label);
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col">
      <div className={`flex h-16 shrink-0 items-center ${narrow ? "justify-center px-2" : "justify-between px-5"}`}>
        {narrow ? (
          <button type="button" onClick={() => go("Dashboard")} aria-label="Dashboard" className={`flex size-9 items-center justify-center rounded-[10px] bg-white/10 text-[18px] text-[#ffb20d] ${fontBold}`}>
            T
          </button>
        ) : (
          <button type="button" onClick={() => go("Dashboard")} className="flex items-center gap-2.5">
            <img src={imgLogoLight} alt="Thkee" className="h-[24px] w-auto" />
            <span className={`rounded-full bg-[#ffb20d]/15 px-2 py-0.5 text-[11px] leading-[16px] text-[#ffcf66] ${fontSemi}`}>Instructor</span>
          </button>
        )}
        {mobile && (
          <button type="button" onClick={onNavigate} aria-label="Close menu" className="flex size-9 items-center justify-center rounded-[8px] text-[#94a3b8] hover:bg-white/10 hover:text-white">
            <Svg d={D.close} />
          </button>
        )}
      </div>

      <nav aria-label="Instructor" className={`flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto py-4 ${narrow ? "px-2" : "px-3"}`}>
        {navGroups.map((group, gi) => (
          <div key={gi} className="flex flex-col gap-0.5">
            {group.heading &&
              (narrow ? (
                <span aria-hidden="true" className="mx-auto mb-1 h-px w-6 bg-white/10" />
              ) : (
                <p className={`mb-1 px-3 text-[11px] uppercase leading-[16px] tracking-[0.6px] text-[#64748b] ${fontSemi}`}>{group.heading}</p>
              ))}
            {group.items.map((item) => {
              const isActive = item.label === active || !!item.children?.includes(active);
              const count = item.badge?.() ?? 0;
              const open = !!item.children && appsOpen && !narrow;
              return (
                <div key={item.label}>
                  <button
                    type="button"
                    title={narrow ? item.label : undefined}
                    aria-current={item.label === active ? "page" : undefined}
                    aria-expanded={item.children && !narrow ? open : undefined}
                    onClick={() => pick(item.label, !!item.children)}
                    className={`group relative flex h-9 w-full items-center rounded-[8px] text-left text-[14px] leading-[20px] transition ${narrow ? "justify-center" : "gap-3 px-3"} ${isActive && !open ? `bg-white/[0.08] text-white ${fontSemi}` : `text-[#94a3b8] hover:bg-white/[0.05] hover:text-white ${fontMedium}`}`}
                  >
                    {isActive && !open && <span aria-hidden="true" className="absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#ffb20d]" />}
                    <NavIcon src={item.icon} active={isActive} />
                    {!narrow && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                    {!narrow && count > 0 && <span className={`min-w-[20px] rounded-full px-1.5 text-center text-[11px] leading-[18px] ${isActive ? "bg-[#ffb20d] text-[#1e293b]" : "bg-white/10 text-[#cbd5e1]"} ${fontSemi}`}>{count}</span>}
                    {narrow && count > 0 && <span aria-hidden="true" className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#ef4444] ring-2 ring-[#0b1220]" />}
                    {!narrow && item.children && <Svg d={D.chevron} className={`size-4 shrink-0 text-[#64748b] transition-transform ${open ? "" : "-rotate-90"}`} />}
                  </button>
                  {open && (
                    <div className="ml-[21px] mt-0.5 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                      {item.children!.map((child) => (
                        <button
                          key={child}
                          type="button"
                          aria-current={child === active ? "page" : undefined}
                          onClick={() => pick(child)}
                          className={`flex h-8 items-center rounded-[8px] px-3 text-left text-[13px] transition ${child === active ? `bg-white/[0.08] text-white ${fontSemi}` : `text-[#94a3b8] hover:bg-white/[0.05] hover:text-white ${fontMedium}`}`}
                        >
                          {child}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={`shrink-0 ${narrow ? "flex flex-col items-center gap-2 p-2" : "p-3"}`}>
        {narrow ? (
          <>
            <button type="button" onClick={() => openMyLearning()} title="Switch to student view" aria-label="Switch to student view" className="flex size-9 items-center justify-center rounded-[8px] text-[#94a3b8] hover:bg-white/10 hover:text-white">
              <Svg d={D.swap} className="size-[18px]" />
            </button>
            <button type="button" onClick={onToggle} title="Expand sidebar" aria-label="Expand sidebar" className="flex size-9 items-center justify-center rounded-[8px] text-[#94a3b8] hover:bg-white/10 hover:text-white">
              <Svg d={D.expand} className="size-[18px]" />
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => openMyLearning()} className={`flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.06] text-[14px] text-white transition hover:bg-white/[0.12] ${fontSemi}`}>
              <Svg d={D.swap} className="size-[18px]" />
              Switch to student view
            </button>
            <div className="mt-3 flex items-center gap-3 rounded-[10px] px-1 py-1">
              <Avatar size={34} ring="ring-[#0b1220]" />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-[13px] leading-[18px] text-white ${fontSemi}`}>{user?.name ?? "Instructor"}</p>
                <p className={`truncate text-[12px] leading-[16px] text-[#94a3b8] ${fontRegular}`}>{user?.email ?? "Signed in"}</p>
              </div>
              {onToggle && (
                <button type="button" onClick={onToggle} title="Collapse sidebar" aria-label="Collapse sidebar" className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#94a3b8] hover:bg-white/10 hover:text-white">
                  <Svg d={D.collapse} className="size-[18px]" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Top bar ------------------------------- */

function useOutside(ref: RefObject<HTMLElement | null>, onOutside: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onOutside();
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}

function CommandSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const close = useMemo(() => () => setOpen(false), []);
  useOutside(boxRef, close);

  const pages = useMemo(() => navGroups.flatMap((g) => g.items.flatMap((i) => (i.children ? i.children.map((c) => ({ label: c, group: g.heading ?? "General" })) : [{ label: i.label, group: g.heading ?? "General" }]))), []);
  const results = pages.filter((p) => p.label.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const choose = (label: string) => {
    go(label);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={boxRef} className="relative w-full max-w-[420px]">
      <div className="flex h-9 items-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.05] px-3 transition hover:bg-white/[0.08] focus-within:border-[#ffb20d]/60 focus-within:bg-white/[0.08] focus-within:ring-4 focus-within:ring-[#ffb20d]/10">
        <Svg d={D.search} className="size-[18px] shrink-0 text-[#94a3b8]" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setIndex((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && results[index]) choose(results[index].label);
            else if (e.key === "Escape") {
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder="Search pages…"
          aria-label="Search instructor pages"
          className={`min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/45 ${fontRegular}`}
        />
        <kbd className={`hidden shrink-0 rounded-[6px] border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] text-[#94a3b8] lg:block ${fontMedium}`}>⌘K</kbd>
      </div>
      {open && (
        <div role="listbox" className="absolute left-0 right-0 top-12 z-50 max-h-[340px] overflow-y-auto rounded-[12px] border border-[#e2e8f0] bg-white p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.14)]">
          {results.length === 0 ? (
            <p className={`px-3 py-6 text-center text-[13px] text-[#64748b] ${fontRegular}`}>No pages match "{query}"</p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.label}
                type="button"
                role="option"
                aria-selected={i === index}
                onMouseEnter={() => setIndex(i)}
                onClick={() => choose(r.label)}
                className={`flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-left text-[14px] ${i === index ? "bg-[#f1f5f9]" : ""} ${fontMedium}`}
              >
                <span className="text-[#0f172a]">{r.label}</span>
                <span className={`text-[12px] text-[#94a3b8] ${fontRegular}`}>{r.group}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Menu({ trigger, label, children, width = "w-[260px]" }: { trigger: ReactNode; label: string; children: (close: () => void) => ReactNode; width?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useMemo(() => () => setOpen(false), []);
  useOutside(ref, close);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label={label} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)} className="flex items-center">
        {trigger}
      </button>
      {open && (
        <div role="menu" className={`pop-in absolute right-0 top-12 z-50 ${width} overflow-hidden rounded-[12px] border border-[#e2e8f0] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.14)]`}>
          {children(close)}
        </div>
      )}
    </div>
  );
}

const NOTIFICATIONS = [
  { title: "New enrolment", body: "Sara Al-Qahtani joined Database Management Systems", ago: "12 min ago", unread: true },
  { title: "New 5-star review", body: "Omar Khalid reviewed Object Oriented Java Programming", ago: "1 h ago", unread: true },
  { title: "Payout scheduled", body: "Your next payout is on 3 December", ago: "Yesterday", unread: false },
];

function TopBar({ title, group, onMenu }: { title: string; group: string; onMenu: () => void }) {
  const { user, logout, notify } = useApp();
  const iconBtn = "relative flex size-9 items-center justify-center rounded-[10px] text-[#94a3b8] transition hover:bg-white/10 hover:text-white";
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 bg-[#0b1220] px-4 md:pl-4 md:pr-5">
      <button type="button" onClick={onMenu} aria-label="Open menu" className={`${iconBtn} md:hidden`}>
        <Svg d={D.menu} />
      </button>
      <nav aria-label="Breadcrumb" className={`hidden min-w-0 items-center gap-1.5 text-[14px] lg:flex ${fontMedium}`}>
        <button type="button" onClick={() => go("Dashboard")} className="text-[#94a3b8] transition hover:text-white">
          Instructor
        </button>
        {group && (
          <>
            <Svg d={D.chevronRight} className="size-3.5 text-[#475569]" />
            <span className="whitespace-nowrap text-[#94a3b8]">{group}</span>
          </>
        )}
        <Svg d={D.chevronRight} className="size-3.5 text-[#475569]" />
        <span className={`truncate text-white ${fontSemi}`}>{title}</span>
      </nav>
      <div className="flex flex-1 justify-center px-2 lg:px-6">
        <CommandSearch />
      </div>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => openMyLearning()} className={`mr-1 hidden h-9 items-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.04] px-3 text-[13px] text-white transition hover:bg-white/10 xl:flex ${fontSemi}`}>
          <Svg d={D.swap} className="size-4" />
          Student view
        </button>
        <button type="button" aria-label="Help" onClick={() => notify("The help centre opens here")} className={`${iconBtn} hidden sm:flex`}>
          <Svg d={D.help} />
        </button>
        <Menu
          label={`Notifications, ${unread} unread`}
          width="w-[340px]"
          trigger={
            <span className={iconBtn}>
              <Svg d={D.bell} />
              {unread > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-[#ef4444] ring-2 ring-[#0b1220]" />}
            </span>
          }
        >
          {() => (
            <>
              <div className="flex items-center justify-between border-b border-[#eef2f6] px-4 py-3">
                <p className={`text-[14px] text-[#0f172a] ${fontSemi}`}>Notifications</p>
                <span className={`rounded-full bg-[#fee2e2] px-2 py-0.5 text-[11px] text-[#b91c1c] ${fontSemi}`}>{unread} new</span>
              </div>
              <ul className="max-h-[320px] overflow-y-auto py-1">
                {NOTIFICATIONS.map((n) => (
                  <li key={n.title} className="flex gap-3 px-4 py-3 hover:bg-[#f8fafc]">
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.unread ? "bg-[#ffb20d]" : "bg-transparent"}`} />
                    <div className="min-w-0">
                      <p className={`text-[13px] text-[#0f172a] ${fontSemi}`}>{n.title}</p>
                      <p className={`text-[13px] leading-[18px] text-[#475569] ${fontRegular}`}>{n.body}</p>
                      <p className={`mt-0.5 text-[12px] text-[#94a3b8] ${fontRegular}`}>{n.ago}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Menu>
        <span aria-hidden="true" className="mx-2 hidden h-6 w-px bg-white/10 sm:block" />
        <Menu
          label="Account menu"
          trigger={
            <span className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-white/10">
              <Avatar size={32} ring="ring-[#0b1220]" />
              <Svg d={D.chevron} className="hidden size-4 text-[#94a3b8] sm:block" />
            </span>
          }
        >
          {(close) => {
            const item = `flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] text-[#334155] transition hover:bg-[#f8fafc] ${fontMedium}`;
            return (
              <>
                <div className="flex items-center gap-3 border-b border-[#eef2f6] px-4 py-3">
                  <Avatar size={38} />
                  <div className="min-w-0">
                    <p className={`truncate text-[14px] text-[#0f172a] ${fontSemi}`}>{user?.name ?? "Instructor"}</p>
                    <p className={`truncate text-[12px] text-[#64748b] ${fontRegular}`}>{user?.email ?? ""}</p>
                  </div>
                </div>
                <div className="py-1">
                  <button type="button" role="menuitem" className={item} onClick={() => (close(), openAccount())}>
                    <Svg d={D.user} className="size-[18px] text-[#64748b]" />
                    Account settings
                  </button>
                  <button type="button" role="menuitem" className={item} onClick={() => (close(), openMyLearning())}>
                    <Svg d={D.swap} className="size-[18px] text-[#64748b]" />
                    Switch to student view
                  </button>
                </div>
                <div className="border-t border-[#eef2f6] py-1">
                  <button type="button" role="menuitem" className={`${item} text-[#b91c1c]`} onClick={() => (close(), logout())}>
                    <Svg d={D.logout} className="size-[18px]" />
                    Log out
                  </button>
                </div>
              </>
            );
          }}
        </Menu>
      </div>
    </header>
  );
}

/* -------------------------------- Page -------------------------------- */

export default function InstructorDashboardPage({ section, newCourse, submissionId, reportView, reportMonth, questionId, newQuestionCourse, announcementCourse, scheduleId, appsView, sessionSeries, sessionId, sessionCourse }: { newCourse?: boolean; section?: Section; announcementCourse?: string; scheduleId?: string; appsView?: "store" | "installed"; sessionSeries?: string; sessionId?: string; sessionCourse?: string; submissionId?: string; reportView?: "revenue"; reportMonth?: string; questionId?: string; newQuestionCourse?: string }) {
  const [collapsed, setCollapsed] = useState(() => load<boolean>(COLLAPSE_KEY, false));
  const [drawer, setDrawer] = useState(false);
  const activeLabel = section === "courses" ? "Course" : section === "assignments" ? "Assignments" : section === "reports" ? "Report" : section === "reviews" ? "Reviews" : section === "qa" ? "Q&A" : section === "co-instructors" ? "Co-Instructor Requests" : section === "announcements" ? "Announcements" : section === "sessions" ? "All Sessions" : section === "schedule" ? "Schedule" : section === "availability" ? "Availability" : section === "apps" ? (appsView === "installed" ? "Installed Apps" : "App Store") : "Dashboard";

  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, JSON.stringify(!c));
      } catch {}
      return !c;
    });

  useEffect(() => {
    if (!drawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawer]);

  return (
    <div className="flex min-h-[100dvh] w-full bg-[#0b1220]">
      <aside className={`sticky top-0 hidden h-[100dvh] shrink-0 bg-[#0b1220] transition-[width] duration-200 md:block ${collapsed ? "w-[68px]" : "w-[248px]"}`}>
        <Sidebar active={activeLabel} collapsed={collapsed} onToggle={toggle} />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-[150] md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="overlay-fade absolute inset-0 bg-[#0f172a]/50 backdrop-blur-[2px]" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-[#0b1220] shadow-2xl">
            <Sidebar active={activeLabel} collapsed={false} mobile onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={activeLabel} group={PAGE_GROUP[activeLabel] ?? ""} onMenu={() => setDrawer(true)} />
        {/* Content sits in a rounded light panel inside the dark frame. overflow-clip keeps sticky elements inside pages working. */}
        <div className="flex min-h-[calc(100dvh-4rem)] flex-1 flex-col overflow-clip bg-[#f6f7f9] md:mb-2 md:mr-2 md:rounded-[16px] md:ring-1 md:ring-white/5">
        {section === "courses" ? <InstructorCourses startNew={newCourse} /> : section === "assignments" ? <InstructorAssignments submissionId={submissionId} /> : section === "reports" ? <InstructorReports view={reportView} month={reportMonth} /> : section === "reviews" ? <InstructorReviews /> : section === "qa" ? <InstructorQa questionId={questionId} newQuestionCourse={newQuestionCourse} /> : section === "co-instructors" ? <InstructorCoRequests /> : section === "announcements" ? <InstructorAnnouncements courseId={announcementCourse} /> : section === "availability" ? <InstructorAvailability scheduleId={scheduleId} /> : section === "apps" ? <InstructorApps view={appsView ?? "store"} /> : section === "sessions" ? <InstructorSessions seriesId={sessionSeries} sessionId={sessionId} courseId={sessionCourse} /> : section === "schedule" ? <InstructorSchedule /> : <InstructorOverview />}
        </div>
      </div>
    </div>
  );
}
