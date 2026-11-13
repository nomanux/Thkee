import { useEffect, useRef, useState } from "react";
import { fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, save, useApp } from "../store";
import { ActionMenu, FilterSelect } from "./Menus";
import { ConfirmDialog, LIVE_COURSES, MultiSessionBadge, SingleSessionBadge, openCourse } from "./InstructorSessions";
import { buttonClass } from "./Button"

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
      triggerClass="flex size-8 items-center justify-center rounded-md bg-white text-slate-700 transition hover:bg-slate-150"
      trigger={
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="12" cy="19" r="1.7" />
        </svg>
      }
      items={[{ label: "View session", onClick: () => openCourse(course) }, ...(upcoming ? [{ label: "Cancel session", danger: true, onClick: onCancel }] : [])]}
    />
  );
}

export function JoinButton({ canJoin }: { canJoin: boolean }) {
  const { notify } = useApp();
  return (
    <button type="button" disabled={!canJoin} title={canJoin ? undefined : "You can join 15 minutes before the start time"} onClick={() => notify("The live classroom isn't connected yet")} className={`${buttonClass("dark", "md")} shrink-0`}>
      Join now
    </button>
  );
}

function ScheduleCard({ item, now, onCancel }: { item: Item; now: number; onCancel: () => void }) {
  const { course, title, duration, end, upcoming, minutesLeft, running, canJoin } = sessionInfo(item, now);

  return (
    <li className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-25 p-4 sm:flex-row">
      <img src={course.image} alt="" className="aspect-video w-full shrink-0 rounded-lg object-cover sm:w-37.5 sm:self-start" />
      <div className="min-w-0 flex-1">
        <p className={`flex flex-wrap items-center gap-x-3 text-sm leading-5 text-slate-600 ${fontRegular}`}>
          <span>
            {formatTime(item.start)} – {formatTime(end)}
          </span>
          {upcoming && minutesLeft > 0 && minutesLeft <= 60 && <span className="text-red-600">Starts in {minutesLeft} min</span>}
          {running && <span className="text-red-600">In progress</span>}
        </p>
        <h3 className={`mt-2 text-base leading-6 text-slate-900 ${fontSemi}`}>
          <button type="button" onClick={() => openCourse(course)} className="text-left transition hover:underline">
            {item.session ?? title}
          </button>
        </h3>
        {item.session && <p className={`mt-1 text-sm leading-5 text-slate-600 ${fontRegular}`}>{title}</p>}
        <div className={`mt-2 flex flex-wrap items-center gap-3 text-sm leading-5 text-slate-400 ${fontRegular}`}>
          {course.kind === "multi" ? <MultiSessionBadge /> : <SingleSessionBadge />}
          <span className="flex items-center gap-1.5">
            <Icon path={CLOCK} />
            {formatDuration(duration)}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-row-reverse items-center justify-between gap-3 sm:flex-col sm:items-end">
        <SessionMenu item={item} now={now} onCancel={onCancel} />
        {upcoming && <JoinButton canJoin={canJoin} />}
      </div>
    </li>
  );
}

const HOUR_HEIGHT = 96;
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
  const arrow = "flex size-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-150";

  return (
    <div className="px-4 py-6 lg:w-77.5 lg:shrink-0">
      <div className="flex items-center justify-between">
        <button type="button" aria-label="Previous month" onClick={() => shift(-1)} className={arrow}>
          <Icon path="M15 6l-6 6 6 6" />
        </button>
        <p aria-live="polite" className={`text-base leading-6 text-slate-700 ${fontSemi}`}>
          {first.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
        <button type="button" aria-label="Next month" onClick={() => shift(1)} className={arrow}>
          <Icon path="M9 6l6 6-6 6" />
        </button>
      </div>
      <div className="mt-4 grid grid-cols-7 justify-items-center gap-y-1.5">
        {WEEKDAYS.map((day) => (
          <span key={day} className={`pb-1 text-sm leading-5 text-slate-700 ${fontMedium}`}>
            {day}
          </span>
        ))}
        {cells.map((day) => {
          const date = new Date(day);
          const inMonth = date.getMonth() === first.getMonth();
          const isSelected = day === selected;
          return (
            <button
              key={day}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}${marked.has(day) ? ", has sessions" : ""}`}
              onClick={() => onPick(day)}
              className={`relative flex size-10 items-center justify-center rounded-full text-sm leading-5 transition ${isSelected ? "bg-secondary-600 text-white" : day === today ? "bg-slate-150 text-slate-700" : `hover:bg-slate-25 ${inMonth ? "text-slate-700" : "text-slate-400"}`} ${fontRegular}`}
            >
              {date.getDate()}
              {marked.has(day) && <span aria-hidden="true" className={`absolute bottom-1 size-1 rounded-full ${isSelected ? "bg-white" : inMonth ? "bg-secondary-600" : "bg-slate-400"}`} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimelineCard({ item, day, now, onCancel }: { item: Item; day: number; now: number; onCancel: () => void }) {
  const { course, title, duration, end, upcoming, minutesLeft, running, canJoin } = sessionInfo(item, now);
  const top = toPixels(minutesIntoDay(item.start));
  const visibleEnd = Math.min(end, addDays(day, 1));
  const timing = running ? "In progress" : upcoming && minutesLeft > 0 && minutesLeft <= 60 ? `${minutesLeft} min left` : formatDuration(duration);

  return (
    <article className="absolute inset-x-2 z-10 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-slate-200 bg-slate-150 px-3 py-2" style={{ top: top + 1, minHeight: Math.max(toPixels((visibleEnd - item.start) / MINUTE) - 2, 62) }}>
      <div className="min-w-60 flex-1">
        <p className={`truncate text-sm leading-5 text-slate-800 ${fontSemi}`}>
          <button type="button" onClick={() => openCourse(course)} className="text-left transition hover:underline">
            {item.session ?? title}
          </button>
          {item.session && <span className={`ml-2 text-slate-700 ${fontRegular}`}>{title}</span>}
        </p>
        <div className={`mt-1.5 flex flex-wrap items-center gap-3 text-xs leading-4.5 text-slate-700 ${fontRegular}`}>
          {course.kind === "multi" ? <MultiSessionBadge /> : <SingleSessionBadge />}
          <span>
            {formatTime(item.start)} – {formatTime(end)}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon path={CLOCK} className="size-3.5 text-slate-400" />
            {timing}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {upcoming && <JoinButton canJoin={canJoin} />}
        <SessionMenu item={item} now={now} onCancel={onCancel} />
      </div>
    </article>
  );
}

function CalendarView({ items, base, now, onCancel }: { items: Item[]; base: number; now: number; onCancel: (item: Item) => void }) {
  const today = startOfDay(base);
  const [selected, setSelected] = useState(today);
  const scrollRef = useRef<HTMLDivElement>(null);
  const date = new Date(selected);
  const dayItems = items.filter((item) => startOfDay(item.start) === selected).sort((a, b) => a.start - b.start);
  const marked = new Set(items.map((item) => startOfDay(item.start)));
  const isToday = selected === startOfDay(now);
  const firstStart = dayItems[0]?.start;

  useEffect(() => {
    const focus = isToday ? minutesIntoDay(now) : firstStart ? minutesIntoDay(firstStart) : 480;
    scrollRef.current?.scrollTo({ top: Math.max(0, toPixels(focus) - HOUR_HEIGHT) });
    // Only move the timeline when the day or its sessions change, not on every clock tick.
  }, [selected, firstStart]);

  const navButton = "flex h-10 items-center justify-center px-3 text-slate-600 transition hover:bg-slate-25";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-150 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-16.5 shrink-0 overflow-hidden rounded-lg border border-slate-200 text-center">
            <p className={`bg-slate-25 py-0.5 text-xs leading-4.5 text-slate-500 ${fontMedium}`}>{date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</p>
            <p className={`py-1 text-lg leading-6.5 text-secondary-600 ${fontSemi}`}>{date.getDate()}</p>
          </div>
          <div>
            <p className="flex flex-wrap items-center gap-2.5">
              <span className={`text-lg leading-7 text-slate-900 ${fontSemi}`}>{date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
              <span className={`rounded-sm border border-slate-200 px-1.5 text-xs leading-4.5 text-slate-700 ${fontMedium}`}>Week {weekNumber(selected)}</span>
            </p>
            <p className={`text-sm leading-5 text-slate-500 ${fontRegular}`}>{date.toLocaleDateString("en-US", { weekday: "long" })}</p>
          </div>
        </div>
        <div className="flex divide-x divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
          <button type="button" aria-label="Previous day" onClick={() => setSelected(addDays(selected, -1))} className={navButton}>
            <Icon path="M20 12H4M10 6l-6 6 6 6" className="size-4.5" />
          </button>
          <button type="button" onClick={() => setSelected(startOfDay(now))} className={`h-10 px-4 text-sm leading-5 text-slate-700 transition hover:bg-slate-25 ${fontMedium}`}>
            Today
          </button>
          <button type="button" aria-label="Next day" onClick={() => setSelected(addDays(selected, 1))} className={navButton}>
            <Icon path="M4 12h16M14 6l6 6-6 6" className="size-4.5" />
          </button>
        </div>
      </div>
      <div className="flex flex-col-reverse lg:flex-row">
        <div ref={scrollRef} aria-label="Day timeline" className="h-150 min-w-0 flex-1 overflow-y-auto border-slate-200 lg:border-r">
          <div className="relative ml-18 border-l border-slate-200" style={{ height: HOUR_HEIGHT * 24 }}>
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="absolute inset-x-0" style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}>
                {!(isToday && Math.abs(minutesIntoDay(now) - hour * 60) < 15) && <span className={`absolute -left-18 top-0 w-15.5 text-right text-xs leading-4.5 text-slate-600 ${fontRegular}`}>{hourLabel(hour)}</span>}
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-slate-200" />
                <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-slate-150" />
              </div>
            ))}
            {dayItems.map((item) => (
              <TimelineCard key={item.id} item={item} day={selected} now={now} onCancel={() => onCancel(item)} />
            ))}
            {isToday && (
              <div className="pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-secondary-600" style={{ top: toPixels(minutesIntoDay(now)) }}>
                <span className={`absolute -left-18 -top-2 w-15.5 whitespace-nowrap bg-white text-right text-xs leading-4.5 text-secondary-600 ${fontMedium}`}>{formatTime(now)}</span>
                <span aria-hidden="true" className="absolute -left-1 -top-0.75 size-2 rounded-full bg-secondary-600" />
              </div>
            )}
            {dayItems.length === 0 && <p className={`sticky top-12 z-10 mx-auto w-fit rounded-lg bg-white px-4 py-2 text-sm leading-5 text-slate-500 ${fontRegular}`}>No sessions on this day.</p>}
          </div>
        </div>
        <MiniCalendar selected={selected} today={startOfDay(now)} marked={marked} onPick={setSelected} />
      </div>
    </>
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

  useEffect(() => save(STORE_KEY, cancelledIds), [cancelledIds]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const limit = range === "week" ? 6 : range === "month" ? 30 : Infinity;
  const inTab = items.map((item) => (cancelledIds.includes(item.id) ? { ...item, tab: "Cancelled" as Tab } : item)).filter((item) => item.tab === tab);
  const visible = inTab.filter((item) => Math.abs(dayDiff(item.start, base)) <= limit).sort((a, b) => (tab === "Completed" ? b.start - a.start : a.start - b.start));
  const days = [...new Set(visible.map((item) => startOfDay(item.start)))];
  const segment = (active: boolean) => `h-9 border px-4 text-sm leading-5 transition first:rounded-l-lg last:-ml-px last:rounded-r-lg ${active ? "relative z-10 border-secondary-500 bg-secondary-50 text-slate-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-25"} ${fontMedium}`;

  return (
    <main className="flex flex-1 flex-col bg-white">
      <div className="border-b border-slate-200 px-4 py-6 md:px-7">
        <h1 className="m-0 flex h-10.5 items-center font-instrument-medium text-2xl font-medium leading-8 text-slate-900" style={{ fontVariationSettings: '"wdth" 100' }}>
          Schedule
        </h1>
      </div>
      <div className="flex flex-1 flex-col px-4 py-6 md:px-7">
        <section className="flex-1 overflow-hidden rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-150 px-5 py-4">
            <div role="tablist" aria-label="Schedule status" className="flex gap-2">
              {TABS.map((t) => (
                <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`h-9 rounded-md px-3 text-sm leading-5 transition ${tab === t ? `bg-slate-150 text-slate-800 ${fontSemi}` : `text-slate-500 hover:text-slate-800 ${fontRegular}`}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
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
              <div className="flex">
                <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")} className={segment(view === "list")}>
                  List View
                </button>
                <button type="button" aria-pressed={view === "calendar"} onClick={() => setView("calendar")} className={segment(view === "calendar")}>
                  Calendar View
                </button>
              </div>
            </div>
          </div>
          {view === "calendar" ? (
            <CalendarView items={inTab} base={base} now={now} onCancel={setCancelling} />
          ) : (
            <div className="flex flex-col gap-8 px-5 py-6">
              {days.length === 0 && <p className={`py-12 text-center text-sm leading-6 text-slate-500 ${fontRegular}`}>No {tab.toLowerCase()} sessions in this period.</p>}
              {days.map((day) => (
                <div key={day}>
                  <h2 className={`border-b border-slate-200 pb-2.5 text-lg leading-7 text-slate-900 ${fontSemi}`}>{dayLabel(day, base)}</h2>
                  <ul className="mt-3.5 flex flex-col gap-3.5">
                    {visible
                      .filter((item) => startOfDay(item.start) === day)
                      .map((item) => (
                        <ScheduleCard key={item.id} item={item} now={now} onCancel={() => setCancelling(item)} />
                      ))}
                  </ul>
                </div>
              ))}
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
