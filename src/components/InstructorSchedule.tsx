import { useEffect, useRef, useState } from "react";
import { fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, save, useApp } from "../store";
import { ActionMenu, FilterSelect } from "./Menus";
import { ConfirmDialog, LIVE_COURSES, openCourse } from "./InstructorSessions";
import { buttonClass } from "./Button";
import { motion, useReducedMotion } from "motion/react";

type Tab = "Upcoming" | "Completed" | "Cancelled";
type Seed = { id: string; course: string; session?: string; tab: Tab } & ({ inMinutes: number } | { day: number; at: number });
type Item = { id: string; course: string; session?: string; tab: Tab; start: number };

const MINUTE = 60000;
const STORE_KEY = "thkee.instructorSchedule";
const TABS: Tab[] = ["Upcoming", "Completed", "Cancelled"];
const CLOCK = "M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z";

const SEED: Seed[] = [
  { id: "s1", course: "ux-battle", session: "Session 1", tab: "Upcoming", inMinutes: 15 },
  { id: "s2", course: "empathy-design", tab: "Upcoming", inMinutes: 150 },
  { id: "s3", course: "ui-ux-trends", session: "Session 1", tab: "Upcoming", inMinutes: 255 },
  { id: "s4", course: "figma-auto-layout", tab: "Upcoming", inMinutes: 390 },
  { id: "s5", course: "empathy-design", tab: "Upcoming", day: 1, at: 1080 },
  { id: "s6", course: "ux-battle", session: "Session 2", tab: "Upcoming", day: 1, at: 1170 },
  { id: "s7", course: "ui-ux-trends", session: "Session 2", tab: "Upcoming", day: 3, at: 1170 },
  { id: "s8", course: "figma-auto-layout", tab: "Upcoming", day: 3, at: 1320 },
  { id: "s9", course: "ux-battle", session: "Session 3", tab: "Upcoming", day: 10, at: 1110 },
  { id: "c1", course: "empathy-design", tab: "Completed", day: -1, at: 1080 },
  { id: "c2", course: "ui-ux-trends", session: "Session 1", tab: "Completed", day: -2, at: 1170 },
  { id: "c3", course: "figma-auto-layout", tab: "Completed", day: -12, at: 1200 },
  { id: "x1", course: "ui-ux-trends", session: "Session 3", tab: "Cancelled", day: 4, at: 1110 },
];

const courseOf = (id: string) => LIVE_COURSES.find((c) => c.id === id)!;
const startOfDay = (time: number) => new Date(time).setHours(0, 0, 0, 0);
const dayDiff = (time: number, from: number) => Math.round((startOfDay(time) - startOfDay(from)) / (1440 * MINUTE));
export const formatTime = (time: number) => new Date(time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const durationOf = (id: string) => (courseOf(id).kind === "multi" ? 120 : 90);
const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;

export const dayLabel = (time: number, now: number) => {
  const diff = dayDiff(time, now);
  const date = new Date(time);
  const name = diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : diff === -1 ? "Yesterday" : date.toLocaleDateString("en-US", { weekday: "long" });
  return `${name}, ${date.getDate()} ${date.toLocaleDateString("en-US", { month: "short" })}`;
};

const buildItems = (base: number): Item[] =>
  SEED.map((seed) => ({
    id: seed.id,
    course: seed.course,
    session: seed.session,
    tab: seed.tab,
    start: "inMinutes" in seed ? base + seed.inMinutes * MINUTE : startOfDay(base) + seed.day * 1440 * MINUTE + seed.at * MINUTE,
  }));

export const upcomingSessions = (base: number) => {
  const cancelled = load<string[]>(STORE_KEY, []);
  return buildItems(base)
    .filter((item) => item.tab === "Upcoming" && !cancelled.includes(item.id))
    .sort((a, b) => a.start - b.start);
};

function Icon({ path, className = "size-4" }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export const sessionInfo = (item: Item, now: number) => {
  const course = courseOf(item.course);
  const title = load<{ titles?: Record<string, string> }>("thkee.instructorSessions.extras", {}).titles?.[course.id] ?? course.title;
  const duration = durationOf(item.course);
  const end = item.start + duration * MINUTE;
  const upcoming = item.tab === "Upcoming";
  const minutesLeft = Math.ceil((item.start - now) / MINUTE);
  return { course, title, duration, end, upcoming, minutesLeft, running: upcoming && minutesLeft <= 0 && now < end, canJoin: upcoming && minutesLeft <= 15 && now < end };
};

function SessionMenu({ item, now, onCancel }: { item: Item; now: number; onCancel: () => void }) {
  const { course, title, upcoming } = sessionInfo(item, now);
  return (
    <ActionMenu
      label={`More actions for ${item.session ?? title}`}
      triggerClass="flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
      trigger={
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      }
      items={[{ label: "View session", onClick: () => openCourse(course) }, ...(upcoming ? [{ label: "Cancel session", danger: true, onClick: onCancel }] : [])]}
    />
  );
}

export function JoinButton({ canJoin, opensAt }: { canJoin: boolean; opensAt?: number }) {
  const { notify } = useApp();
  if (!canJoin && opensAt)
    return (
      <span title="You can join 15 minutes before the start time" className={`inline-flex h-9 shrink-0 items-center gap-1.5 px-2 text-xs leading-4.5 text-slate-400 ${fontRegular}`}>
        <Icon path={CLOCK} className="size-3.5" />
        Opens {formatTime(opensAt)}
      </span>
    );
  return (
    <button type="button" disabled={!canJoin} title={canJoin ? undefined : "You can join 15 minutes before the start time"} onClick={() => notify("The live classroom isn't connected yet")} className={`${buttonClass("primary", "md")} shrink-0`}>
      <Icon path="M15 10l4.5-2.5v9L15 14M4 7h11v10H4z" className="size-4" />
      Join now
    </button>
  );
}

function ScheduleCard({ item, now, onCancel }: { item: Item; now: number; onCancel: () => void }) {
  const { course, title, duration, end, upcoming, minutesLeft, running, canJoin } = sessionInfo(item, now);
  const soon = upcoming && minutesLeft > 0 && minutesLeft <= 60;
  const highlight = running || (soon && canJoin);

  return (
    <li className={`group -mx-3 flex flex-col gap-4 rounded-xl px-3 py-3.5 transition-colors sm:flex-row sm:items-center ${highlight ? "bg-primary-50" : "hover:bg-slate-50"}`}>
      <div className="flex shrink-0 items-center gap-4">
        <div className="hidden w-18 shrink-0 flex-col sm:flex">
          <span className={`text-sm leading-5 text-slate-700 tabular-nums ${fontMedium}`}>{formatTime(item.start)}</span>
          <span className={`text-xs leading-4.5 text-slate-400 tabular-nums ${fontRegular}`}>{formatTime(end)}</span>
        </div>
        <img src={course.image} alt="" className="aspect-video w-full shrink-0 rounded-lg object-cover sm:w-24" />
      </div>
      <div className="min-w-0 flex-1">
        <span className={`block text-xs leading-4.5 text-slate-500 tabular-nums sm:hidden ${fontMedium}`}>
          {formatTime(item.start)} – {formatTime(end)}
        </span>
        {(running || soon) && (
          <div className={`mb-1 flex items-center gap-2 text-xs leading-4.5 ${fontMedium}`}>
            {running && (
              <span className="flex items-center gap-1.5 text-red-600">
                <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
                Live now
              </span>
            )}
            {soon && <span className="text-primary-700">Starts in {minutesLeft} min</span>}
          </div>
        )}
        <h3 className={`truncate text-sm leading-5.5 text-slate-800 ${fontMedium}`}>
          <button type="button" onClick={() => openCourse(course)} className="max-w-full truncate text-left transition hover:text-primary-700">
            {item.session && <span className={`text-slate-400 ${fontRegular}`}>{item.session} · </span>}
            {title}
          </button>
        </h3>
        <p className={`mt-0.5 flex flex-wrap items-center gap-x-2 text-xs leading-4.5 text-slate-400 ${fontRegular}`}>
          <span>{course.kind === "multi" ? "Multi-session course" : "Single session"}</span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span className="flex items-center gap-1">
            <Icon path={CLOCK} className="size-3.5" />
            {formatDuration(duration)}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-2">
        {upcoming && <JoinButton canJoin={canJoin} opensAt={item.start - 15 * MINUTE} />}
        <SessionMenu item={item} now={now} onCancel={onCancel} />
      </div>
    </li>
  );
}

const HOUR_HEIGHT = 48;
const toPixels = (minutes: number) => (minutes * HOUR_HEIGHT) / 60;
const minutesIntoDay = (time: number) => (time - startOfDay(time)) / MINUTE;
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const hourLabel = (hour: number) => `${hour % 12 || 12} ${hour < 12 ? "AM" : "PM"}`;
const addDays = (time: number, days: number) => {
  const date = new Date(time);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days).getTime();
};
const weekNumber = (time: number) => {
  const date = new Date(startOfDay(time));
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const firstWeek = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - firstWeek.getTime()) / (1440 * MINUTE) - 3 + ((firstWeek.getDay() + 6) % 7)) / 7);
};

export function MiniCalendar({ selected, today, marked, onPick }: { selected: number; today: number; marked: Set<number>; onPick: (day: number) => void }) {
  const [month, setMonth] = useState(() => new Date(new Date(selected).getFullYear(), new Date(selected).getMonth(), 1).getTime());
  const first = new Date(month);
  const lead = (first.getDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i - lead + 1).getTime());

  useEffect(() => {
    const date = new Date(selected);
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1).getTime());
  }, [selected]);

  const shift = (by: number) => setMonth(new Date(first.getFullYear(), first.getMonth() + by, 1).getTime());
  const arrow = "flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900";

  return (
    <div>
      <div className="flex items-center justify-between">
        <p aria-live="polite" className={`text-sm leading-5 text-slate-900 ${fontSemi}`}>
          {first.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
        <div className="flex">
          <button type="button" aria-label="Previous month" onClick={() => shift(-1)} className={arrow}>
            <Icon path="M15 6l-6 6 6 6" />
          </button>
          <button type="button" aria-label="Next month" onClick={() => shift(1)} className={arrow}>
            <Icon path="M9 6l6 6-6 6" />
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-7 justify-items-center gap-y-0.5">
        {WEEKDAYS.map((day) => (
          <span key={day} className={`pb-1 text-xs leading-5 text-slate-400 ${fontMedium}`}>
            {day}
          </span>
        ))}
        {cells.map((day) => {
          const date = new Date(day);
          const inMonth = date.getMonth() === first.getMonth();
          const isSelected = day === selected;
          const isToday = day === today;
          return (
            <button
              key={day}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}${isToday ? ", today" : ""}${marked.has(day) ? ", has sessions" : ""}`}
              onClick={() => onPick(day)}
              className={`relative flex size-8 items-center justify-center rounded-full text-xs leading-4 tabular-nums transition ${isSelected ? `bg-primary-700 text-white ${fontSemi}` : isToday ? `text-primary-700 ring-1 ring-primary-300 hover:bg-primary-50 ${fontSemi}` : `hover:bg-slate-100 ${inMonth ? "text-slate-700" : "text-slate-300"} ${fontRegular}`}`}
            >
              {date.getDate()}
              {marked.has(day) && <span aria-hidden="true" className={`absolute bottom-1 size-1 rounded-full ${isSelected ? "bg-white" : inMonth ? "bg-primary-600" : "bg-slate-300"}`} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type Mode = "day" | "week";
type Placed = { item: Item; col: number; cols: number };
type OpenEvent = { item: Item; rect: DOMRect } | null;

const startOfWeek = (time: number) => addDays(startOfDay(time), -((new Date(time).getDay() + 6) % 7));
const shortDate = (date: Date) => date.toLocaleDateString("en-US", { month: "short" });

const timeZoneLabel = () => {
  const offset = -new Date().getTimezoneOffset();
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
  const minutes = Math.abs(offset) % 60;
  return `GMT${offset < 0 ? "-" : "+"}${hours}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""}`;
};

// Overlapping sessions sit side by side, like Google Calendar: each overlap cluster splits the day's width into columns.
const layoutDay = (dayItems: Item[], now: number): Placed[] => {
  const placed: Placed[] = [];
  let cluster: Placed[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = 0;
  const flush = () => {
    cluster.forEach((p) => (p.cols = columnEnds.length));
    cluster = [];
    columnEnds = [];
    clusterEnd = 0;
  };
  [...dayItems]
    .sort((a, b) => a.start - b.start)
    .forEach((item) => {
      const { end } = sessionInfo(item, now);
      if (cluster.length && item.start >= clusterEnd) flush();
      let col = columnEnds.findIndex((columnEnd) => columnEnd <= item.start);
      if (col === -1) {
        col = columnEnds.length;
        columnEnds.push(end);
      } else columnEnds[col] = end;
      clusterEnd = Math.max(clusterEnd, end);
      const entry = { item, col, cols: 1 };
      cluster.push(entry);
      placed.push(entry);
    });
  flush();
  return placed;
};

const eventTone = (item: Item, now: number) => {
  const { end, running } = sessionInfo(item, now);
  if (item.tab === "Cancelled") return { block: "bg-slate-100 text-slate-500 hover:bg-slate-200", swatch: "bg-slate-400" };
  if (now >= end || item.tab === "Completed") return { block: "bg-primary-100 text-primary-800 hover:bg-primary-200", swatch: "bg-primary-300" };
  if (running) return { block: "bg-primary-800 text-white", swatch: "bg-primary-800" };
  return { block: "bg-primary-700 text-white hover:bg-primary-800", swatch: "bg-primary-700" };
};

function TimelineEvent({ placed, day, now, showJoin, active, onOpen }: { placed: Placed; day: number; now: number; showJoin: boolean; active: boolean; onOpen: (rect: DOMRect) => void }) {
  const { notify } = useApp();
  const { item, col, cols } = placed;
  const { title, end, running, canJoin } = sessionInfo(item, now);
  const top = toPixels(minutesIntoDay(item.start));
  const visibleEnd = Math.min(end, addDays(day, 1));
  const height = Math.max(toPixels((visibleEnd - item.start) / MINUTE) - 2, 22);
  const short = height < 44;
  const join = showJoin && canJoin && !short;
  const name = item.session ? `${item.session} · ${title}` : title;

  return (
    <article
      id={`block-${item.id}`}
      className={`absolute overflow-hidden rounded-md ring-1 ring-white transition-colors ${eventTone(item, now).block} ${active ? "z-20 shadow-lg" : "z-10"}`}
      style={{ top: top + 1, height, left: `calc(${(col / cols) * 100}% + 2px)`, width: `calc(${100 / cols}% - ${col === cols - 1 ? 12 : 3}px)` }}
    >
      <button type="button" aria-label={`${name}, ${formatTime(item.start)} to ${formatTime(end)}`} onClick={(e) => onOpen(e.currentTarget.getBoundingClientRect())} className="absolute inset-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary-500" />
      {short ? (
        <p className={`pointer-events-none relative truncate px-2 text-11 leading-5 ${fontRegular}`}>
          <span className={fontSemi}>{name}</span>, {formatTime(item.start)}
        </p>
      ) : (
        <div className={`pointer-events-none relative px-2 py-1 ${join ? "pr-14" : ""}`}>
          <p className={`text-xs leading-4 ${item.tab === "Cancelled" ? "line-through" : ""} ${height > 64 ? "line-clamp-2" : "truncate"} ${fontSemi}`}>{name}</p>
          <p className={`mt-0.5 flex items-center gap-1 truncate text-11 leading-4 tabular-nums opacity-90 ${fontRegular}`}>
            {running && <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-red-400" />}
            {formatTime(item.start)} – {formatTime(end)}
          </p>
        </div>
      )}
      {join && (
        <button type="button" onClick={() => notify("The live classroom isn't connected yet")} className={`absolute right-1.5 top-1.5 flex h-6 items-center rounded-md bg-white px-2.5 text-xs leading-4 text-primary-800 shadow-sm transition hover:bg-primary-50 ${fontSemi}`}>
          Join
        </button>
      )}
    </article>
  );
}

function EventPopover({ item, rect, now, onClose, onCancel }: { item: Item; rect: DOMRect; now: number; onClose: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const { course, title, duration, end, upcoming, minutesLeft, running, canJoin } = sessionInfo(item, now);
  const width = Math.min(352, window.innerWidth - 16);
  const left = rect.right + 12 + width <= window.innerWidth - 8 ? rect.right + 12 : rect.left - 12 - width >= 8 ? rect.left - 12 - width : Math.max(8, (window.innerWidth - width) / 2);
  const top = Math.max(8, Math.min(rect.top, window.innerHeight - 320));
  const live = upcoming && now < end;
  const status = item.tab === "Cancelled" ? "Cancelled" : running ? "Live now" : !live ? "Ended" : minutesLeft <= 15 ? `Starts in ${minutesLeft} min · joining is open` : minutesLeft < 60 ? `Starts in ${minutesLeft} min` : `Joining opens at ${formatTime(item.start - 15 * MINUTE)}`;
  const iconButton = "flex size-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900";

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    const close = () => closeRef.current();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && close();
    const onScroll = (e: Event) => !ref.current?.contains(e.target as Node) && close();
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, []);

  return (
    <div ref={ref} role="dialog" aria-label={title} tabIndex={-1} className="pop-in fixed z-200 rounded-2xl bg-white pb-4 shadow-2xl outline-none ring-1 ring-slate-200" style={{ top, left, width }}>
      <div className="flex justify-end gap-0.5 p-1.5">
        <button type="button" aria-label="Open session" title="Open session" onClick={() => openCourse(course)} className={iconButton}>
          <Icon path="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
        </button>
        {live && (
          <button
            type="button"
            aria-label="Cancel session"
            title="Cancel session"
            onClick={() => {
              onClose();
              onCancel();
            }}
            className={iconButton}
          >
            <Icon path="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 001 1h8a1 1 0 001-1l1-12M9 7V4h6v3" />
          </button>
        )}
        <button type="button" aria-label="Close" title="Close" onClick={onClose} className={iconButton}>
          <Icon path="M6 6l12 12M18 6L6 18" />
        </button>
      </div>
      <div className="flex gap-4 px-5">
        <span aria-hidden="true" className={`mt-2 size-3.5 shrink-0 rounded-sm ${eventTone(item, now).swatch}`} />
        <div className="min-w-0 flex-1">
          <h3 className={`text-xl leading-7 text-slate-900 ${item.tab === "Cancelled" ? "line-through decoration-slate-400" : ""} ${fontMedium}`}>{title}</h3>
          <p className={`mt-1 text-sm leading-5 text-slate-600 ${fontRegular}`}>
            {new Date(item.start).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {formatTime(item.start)} – {formatTime(end)}
          </p>
          <p className={`mt-1 flex items-center gap-1.5 text-13 leading-5 ${running ? "text-red-600" : live ? "text-primary-700" : "text-slate-500"} ${fontMedium}`}>
            {running && <span className="size-1.5 animate-pulse rounded-full bg-red-500" />}
            {status}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 px-5">
        <div className="flex items-center gap-4">
          <img src={course.image} alt="" className="aspect-video w-14 shrink-0 rounded-md object-cover" />
          <p className={`min-w-0 text-13 leading-5 text-slate-700 ${fontRegular}`}>
            <span className={`block truncate ${fontMedium}`}>{item.session ?? "Single session"}</span>
            <span className="text-slate-500">{course.kind === "multi" ? "Multi-session course" : "Single-session course"}</span>
          </p>
        </div>
        <p className={`flex items-center gap-4 pl-4 text-13 leading-5 text-slate-700 ${fontRegular}`}>
          <Icon path={CLOCK} className="size-4.5 shrink-0 text-slate-500" />
          {formatDuration(duration)} · {timeZoneLabel()}
        </p>
      </div>
      {live && (
        <div className="mt-4 flex items-center gap-2 px-5">
          <JoinButton canJoin={canJoin} opensAt={item.start - 15 * MINUTE} />
        </div>
      )}
    </div>
  );
}

function CalendarView({ items, base, now, onCancel }: { items: Item[]; base: number; now: number; onCancel: (item: Item) => void }) {
  const today = startOfDay(now);
  const [selected, setSelected] = useState(() => startOfDay(base));
  const [mode, setMode] = useState<Mode>("week");
  const [open, setOpen] = useState<OpenEvent>(null);
  const still = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);

  const days = mode === "day" ? [selected] : Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(selected), i));
  const itemsOn = (day: number) => items.filter((item) => startOfDay(item.start) === day);
  const visibleItems = items.filter((item) => days.includes(startOfDay(item.start)));
  const dayItems = itemsOn(selected).sort((a, b) => a.start - b.start);
  const marked = new Set(items.map((item) => startOfDay(item.start)));
  const showsToday = days.includes(today);
  const firstMinute = visibleItems.length ? Math.min(...visibleItems.map((item) => minutesIntoDay(item.start))) : null;
  const rangeKey = `${mode}-${days[0]}`;
  const columns = mode === "day" ? "grid-cols-1" : "grid-cols-7";

  useEffect(() => {
    const focus = showsToday ? minutesIntoDay(now) : (firstMinute ?? 480);
    scrollRef.current?.scrollTo({ top: Math.max(0, toPixels(focus) - HOUR_HEIGHT * 2), behavior: "smooth" });
    setOpen(null);
    // Only move the grid when the visible range or its sessions change, not on every clock tick.
  }, [rangeKey, firstMinute]);

  const first = new Date(days[0]);
  const last = new Date(days[days.length - 1]);
  const heading =
    mode === "day"
      ? first.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
      : first.getMonth() === last.getMonth()
        ? first.toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : first.getFullYear() === last.getFullYear()
          ? `${shortDate(first)} – ${shortDate(last)} ${last.getFullYear()}`
          : `${shortDate(first)} ${first.getFullYear()} – ${shortDate(last)} ${last.getFullYear()}`;

  const step = (by: number) => setSelected(addDays(selected, by * (mode === "day" ? 1 : 7)));
  const jumpTo = (item: Item) => {
    scrollRef.current?.scrollTo({ top: Math.max(0, toPixels(minutesIntoDay(item.start)) - HOUR_HEIGHT), behavior: "smooth" });
  };
  const navButton = "flex size-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900";
  const spring = still ? { duration: 0 } : { type: "spring" as const, stiffness: 500, damping: 40 };

  return (
    <div className="pt-4">
      {/* Toolbar: Today, previous/next, the visible range, and the Day/Week switch. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" onClick={() => setSelected(today)} className={`h-9 rounded-full border border-slate-300 px-4 text-sm leading-5 text-slate-700 transition hover:bg-slate-50 ${fontMedium}`}>
            Today
          </button>
          <div className="flex">
            <button type="button" aria-label={mode === "day" ? "Previous day" : "Previous week"} onClick={() => step(-1)} className={navButton}>
              <Icon path="M15 6l-6 6 6 6" />
            </button>
            <button type="button" aria-label={mode === "day" ? "Next day" : "Next week"} onClick={() => step(1)} className={navButton}>
              <Icon path="M9 6l6 6-6 6" />
            </button>
          </div>
          <h2 aria-live="polite" className={`truncate text-xl leading-7 text-slate-900 ${fontMedium}`}>
            {heading}
          </h2>
          {mode === "week" && <span className={`hidden shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-11 leading-4 text-slate-500 sm:inline ${fontSemi}`}>Week {weekNumber(days[0])}</span>}
        </div>
        <div className="flex rounded-full bg-slate-100 p-1" role="group" aria-label="Calendar range">
          {(["day", "week"] as const).map((m) => {
            const active = mode === m;
            return (
              <button key={m} type="button" aria-pressed={active} onClick={() => setMode(m)} className={`relative h-7 rounded-full px-3.5 text-13 leading-5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-700 ${active ? `text-slate-900 ${fontSemi}` : `text-slate-500 hover:text-slate-900 ${fontMedium}`}`}>
                {active && <motion.span layoutId="calendar-mode" aria-hidden="true" className="absolute inset-0 rounded-full bg-white shadow-sm" transition={spring} />}
                <span className="relative">{m === "day" ? "Day" : "Week"}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-6 lg:flex-row">
        <div ref={scrollRef} aria-label={mode === "day" ? "Day timeline" : "Week timeline"} className="scrollbar-soft h-calendar relative min-w-0 flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
          {/* Day headers stay pinned while the hours scroll underneath. */}
          <div className="sticky top-0 z-30 flex border-b border-slate-200 bg-white">
            <div className={`flex w-16 shrink-0 items-end justify-end pb-1.5 pr-2 text-10 leading-4 text-slate-400 ${fontMedium}`}>{timeZoneLabel()}</div>
            <div className={`grid flex-1 ${columns}`}>
              {days.map((day) => {
                const date = new Date(day);
                const isToday = day === today;
                const isSelected = day === selected && mode === "week";
                return (
                  <button
                    key={day}
                    type="button"
                    aria-label={`Open ${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} in day view`}
                    onClick={() => {
                      setSelected(day);
                      setMode("day");
                    }}
                    className={`group flex flex-col gap-0.5 border-l border-slate-200 py-2 ${mode === "day" ? "items-start pl-3" : "items-center"}`}
                  >
                    <span className={`text-11 uppercase leading-4 tracking-wider ${isToday ? "text-primary-700" : "text-slate-500"} ${fontSemi}`}>{date.toLocaleDateString("en-US", { weekday: "short" })}</span>
                    <span className={`flex size-10 items-center justify-center rounded-full text-22 leading-7 tabular-nums transition-colors ${isToday ? "bg-primary-700 text-white" : isSelected ? "bg-primary-50 text-primary-800" : "text-slate-800 group-hover:bg-slate-100"} ${fontMedium}`}>{date.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {visibleItems.length === 0 && (
            <div className="sticky top-28 z-20 flex h-0 justify-center">
              <div className="mt-4 flex h-fit flex-col items-center gap-1 rounded-xl bg-white px-5 py-3 text-center shadow-sm ring-1 ring-slate-200">
                <p className={`text-sm leading-5 text-slate-900 ${fontSemi}`}>Nothing scheduled</p>
                <p className={`text-xs leading-4.5 text-slate-500 ${fontRegular}`}>Pick a day with a dot to see its sessions.</p>
              </div>
            </div>
          )}

          <div className="relative flex" style={{ height: HOUR_HEIGHT * 24 }}>
            <div aria-hidden="true" className="relative w-16 shrink-0">
              {Array.from({ length: 23 }, (_, i) => i + 1).map((hour) => (
                <div key={hour}>
                  <span className={`absolute right-3 text-10 leading-4 text-slate-500 ${fontMedium}`} style={{ top: hour * HOUR_HEIGHT - 8 }}>
                    {hourLabel(hour)}
                  </span>
                  <span className="absolute right-0 h-px w-2 bg-slate-200" style={{ top: hour * HOUR_HEIGHT }} />
                </div>
              ))}
            </div>
            <div className={`relative grid flex-1 ${columns}`}>
              <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                {Array.from({ length: 23 }, (_, i) => i + 1).map((hour) => (
                  <span key={hour} className="absolute inset-x-0 h-px bg-slate-200/70" style={{ top: hour * HOUR_HEIGHT }} />
                ))}
              </div>
              {days.map((day) => (
                <div key={day} className="relative border-l border-slate-200">
                  {layoutDay(itemsOn(day), now).map((placed) => (
                    <TimelineEvent key={placed.item.id} placed={placed} day={day} now={now} showJoin={mode === "day"} active={open?.item.id === placed.item.id} onOpen={(rect) => setOpen({ item: placed.item, rect })} />
                  ))}
                  {day === today && (
                    <div className="pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-red-500" style={{ top: toPixels(minutesIntoDay(now)) - 1 }}>
                      <span aria-hidden="true" className="absolute -left-1.5 -top-1.25 size-3 rounded-full bg-red-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-5 lg:w-64 lg:shrink-0">
          <MiniCalendar selected={selected} today={today} marked={marked} onPick={setSelected} />
          <div className="border-t border-slate-200 pt-4">
            <p className={`text-xs uppercase leading-4 tracking-wider text-slate-400 ${fontSemi}`}>{selected === today ? "Today's agenda" : new Date(selected).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
            {dayItems.length === 0 ? (
              <p className={`mt-2 text-13 leading-5 text-slate-500 ${fontRegular}`}>No sessions on this day.</p>
            ) : (
              <ul className="mt-2 flex flex-col">
                {dayItems.map((item) => {
                  const { title, end, running } = sessionInfo(item, now);
                  const done = now >= end;
                  return (
                    <li key={item.id}>
                      <button type="button" onClick={() => jumpTo(item)} className="-mx-2 flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-slate-50">
                        <span className={`mt-1.5 size-2 shrink-0 rounded-full ${running ? "bg-red-500" : done ? "bg-slate-300" : "bg-primary-600"}`} />
                        <span className="min-w-0 flex-1">
                          <span className={`block text-xs leading-4.5 tabular-nums text-slate-500 ${fontMedium}`}>
                            {formatTime(item.start)} – {formatTime(end)}
                          </span>
                          <span className={`block truncate text-13 leading-5 ${done ? "text-slate-400" : "text-slate-900"} ${fontMedium}`}>{item.session ? `${item.session} · ${title}` : title}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {open && <EventPopover item={open.item} rect={open.rect} now={now} onClose={() => setOpen(null)} onCancel={() => onCancel(open.item)} />}
    </div>
  );
}

export default function InstructorSchedule() {
  const { notify } = useApp();
  const [base] = useState(() => Date.now());
  const [now, setNow] = useState(base);
  const [items] = useState(() => buildItems(base));
  const [tab, setTab] = useState<Tab>("Upcoming");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [range, setRange] = useState("week");
  const [cancelledIds, setCancelledIds] = useState<string[]>(() => load(STORE_KEY, []));
  const [cancelling, setCancelling] = useState<Item | null>(null);
  const still = useReducedMotion();

  useEffect(() => save(STORE_KEY, cancelledIds), [cancelledIds]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const limit = range === "week" ? 6 : range === "month" ? 30 : Infinity;
  const inTab = items.map((item) => (cancelledIds.includes(item.id) ? { ...item, tab: "Cancelled" as Tab } : item)).filter((item) => item.tab === tab);
  const visible = inTab.filter((item) => Math.abs(dayDiff(item.start, base)) <= limit).sort((a, b) => (tab === "Completed" ? b.start - a.start : a.start - b.start));
  const days = [...new Set(visible.map((item) => startOfDay(item.start)))];
  const withStatus = items.map((item) => (cancelledIds.includes(item.id) ? { ...item, tab: "Cancelled" as Tab } : item));
  const counts = Object.fromEntries(TABS.map((t) => [t, withStatus.filter((item) => item.tab === t).length])) as Record<Tab, number>;
  const todayCount = withStatus.filter((item) => item.tab === "Upcoming" && dayDiff(item.start, base) === 0).length;
  const spring = still ? { duration: 0 } : { type: "spring" as const, stiffness: 500, damping: 40 };
  const views = [
    { key: "list" as const, label: "List", icon: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" },
    { key: "calendar" as const, label: "Calendar", icon: "M7 3v3M17 3v3M4 8h16M5 5h14v15H5z" },
  ];

  return (
    <main className="flex flex-1 flex-col bg-white">
      <div className="px-4 pt-6 md:px-7">
        <h1 className="m-0 font-instrument-medium text-2xl font-medium leading-8 text-slate-900" style={{ fontVariationSettings: '"wdth" 100' }}>
          Schedule
        </h1>
        <p className={`mt-1 text-sm leading-5 text-slate-500 ${fontRegular}`}>{todayCount ? `You have ${todayCount} ${todayCount === 1 ? "session" : "sessions"} today. You can join each one 15 minutes before it starts.` : "No sessions today. Your upcoming live sessions are listed below."}</p>
      </div>
      <div className="flex flex-1 flex-col px-4 pb-8 md:px-7">
        <section className="flex-1">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pt-4">
            <div role="tablist" aria-label="Schedule status" className="-mb-px -ml-3 flex gap-1 overflow-x-auto">
              {TABS.map((t) => {
                const active = tab === t;
                return (
                  <button key={t} type="button" role="tab" aria-selected={active} onClick={() => setTab(t)} className={`relative flex shrink-0 items-center gap-2 px-3 pb-3.5 pt-2 text-sm transition-colors ${active ? `text-slate-900 ${fontSemi}` : `text-slate-500 hover:text-slate-900 ${fontMedium}`}`}>
                    {t}
                    <span className={`rounded-full px-2 py-0.5 text-11 leading-3.5 tabular-nums ${active ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-500"} ${fontSemi}`}>{counts[t]}</span>
                    {active && <motion.span layoutId="schedule-tabs" aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary-700" transition={spring} />}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2 pb-3">
              {view === "list" && (
                <div className="w-32.5">
                  <FilterSelect
                    plain
                    alignRight
                    label="Time range"
                    value={range}
                    onChange={setRange}
                    options={[
                      { value: "week", label: "This week" },
                      { value: "month", label: "This month" },
                      { value: "all", label: "All time" },
                    ]}
                  />
                </div>
              )}
              <div className="flex rounded-xl bg-slate-100 p-1" role="group" aria-label="View">
                {views.map((v) => {
                  const active = view === v.key;
                  return (
                    <button key={v.key} type="button" aria-pressed={active} onClick={() => setView(v.key)} className={`relative flex h-8 items-center gap-1.5 rounded-lg px-3 text-13 leading-5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-700 ${active ? `text-slate-900 ${fontSemi}` : `text-slate-500 hover:text-slate-900 ${fontMedium}`}`}>
                      {active && <motion.span layoutId="schedule-view" aria-hidden="true" className="absolute inset-0 rounded-lg bg-white shadow-sm" transition={spring} />}
                      <Icon path={v.icon} className="relative size-4" />
                      <span className="relative">{v.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          {view === "calendar" ? (
            <CalendarView items={inTab} base={base} now={now} onCancel={setCancelling} />
          ) : (
            <div key={`${tab}-${range}`} className="fade-up flex max-w-5xl flex-col gap-8 py-6">
              {days.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-14 text-center">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                    <Icon path="M7 3v3M17 3v3M4 8h16M5 5h14v15H5z" className="size-5" />
                  </span>
                  <p className={`text-sm leading-5 text-slate-900 ${fontSemi}`}>No {tab.toLowerCase()} sessions</p>
                  <p className={`-mt-2 text-13 leading-5 text-slate-500 ${fontRegular}`}>{range === "all" ? "Nothing here yet." : "Try a longer time range."}</p>
                </div>
              )}
              {days.map((day) => {
                const count = visible.filter((item) => startOfDay(item.start) === day).length;
                return (
                <div key={day}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className={`text-sm leading-5 text-slate-900 ${fontSemi}`}>{dayLabel(day, base)}</h2>
                    <span className={`text-xs leading-4.5 text-slate-400 ${fontRegular}`}>
                      {count} {count === 1 ? "session" : "sessions"}
                    </span>
                  </div>
                  <ul className="mt-1 flex flex-col divide-y divide-slate-100">
                    {visible
                      .filter((item) => startOfDay(item.start) === day)
                      .map((item) => (
                        <ScheduleCard key={item.id} item={item} now={now} onCancel={() => setCancelling(item)} />
                      ))}
                  </ul>
                </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
      {cancelling && (
        <ConfirmDialog
          title="Cancel this session?"
          body="It will move to your Cancelled sessions."
          confirmLabel="Yes, cancel session"
          onClose={() => setCancelling(null)}
          onConfirm={() => {
            setCancelledIds((list) => [...list, cancelling.id]);
            setCancelling(null);
            notify("Session cancelled");
          }}
        />
      )}
    </main>
  );
}
