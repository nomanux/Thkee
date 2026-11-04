import { useState, type ReactNode } from "react";
import { fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { openLiveEditor, useApp } from "../store";
import { Checkbox } from "./InstructorAssignments";
import { TimeSelect, fromIso, loadSchedules, toIso, type Schedule } from "./InstructorAvailability";
import { ConfirmDialog } from "./InstructorSessions";
import { ActionMenu } from "./Menus";
import { Shell } from "./Overlays";

export type SeriesSession = { id: string; date: string; start: number };
export type LiveSeries = { id: string; name: string; verified: boolean; enrolled: number; seats: number; sessions: SeriesSession[] };
export type SingleLiveSession = SeriesSession & { name: string; seats: number; enrolled: number };
export type ScheduleFields = { series: LiveSeries[]; singleSessions: SingleLiveSession[] };

type ScheduleDraft = ScheduleFields & { id: string; kind: "single" | "multi"; duration: string; seats: string; availabilityId?: string };
type ListItem = SeriesSession & { flag?: "adjusted" | "conflict"; locked?: boolean };
type DayHours = Schedule["days"];
type Ctx = { days: DayHours; duration: number; others: SeriesSession[] };

const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CALENDAR_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const FALLBACK_DAYS: DayHours = FULL_DAYS.map(() => ({ on: true, slots: [{ start: 540, end: 1020 }] }));
const FALLBACK_TIMEZONE = "( GMT +6:00) Astana,Dhaka";
// Placeholder times until the picker is connected to the instructor's availability.
const DUMMY_SLOTS = [840, 600, 750, 975, 405, 500, 690];
const OPEN_DAYS: DayHours = FULL_DAYS.map(() => ({ on: true, slots: [{ start: 0, end: 1440 }] }));
const ENROLLED_MESSAGE = "Sessions with enrolments can't be changed";

const pad = (n: number) => String(n).padStart(2, "0");
const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e5)}`;
const addDays = (iso: string, days: number) => {
  const date = fromIso(iso);
  return toIso(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
};
const dayIndex = (iso: string) => (fromIso(iso).getDay() + 6) % 7;
const clock = (minutes: number) => `${Math.floor(minutes / 60) % 12 || 12}:${pad(minutes % 60)} ${minutes < 720 ? "AM" : "PM"}`;
const slotClock = (minutes: number) => `${pad(Math.floor(minutes / 60) % 12 || 12)}:${pad(minutes % 60)} ${minutes < 720 ? "AM" : "PM"}`;
const longDate = (iso: string) => `${pad(fromIso(iso).getDate())} ${fromIso(iso).toLocaleDateString("en-US", { month: "long" })}`;
const shortDate = (iso: string) => `${pad(fromIso(iso).getDate())} ${fromIso(iso).toLocaleDateString("en-US", { month: "short" })}`;
const byTime = <T extends SeriesSession>(a: T, b: T) => a.date.localeCompare(b.date) || a.start - b.start;
const durationOf = (draft: { duration: string }) => Number(draft.duration) || 60;
const durationLabel = (minutes: number) => (minutes % 60 === 0 ? `${pad(minutes / 60)} hr.` : `${minutes} min`);

const nextWeekday = (index: number, from = toIso(new Date())) => {
  const gap = (index - dayIndex(from) + 7) % 7 || 7;
  return addDays(from, gap);
};

// The sample courses start with a filled schedule that fits the default availability.
export function seedSchedule(kind: "single" | "multi"): ScheduleFields {
  if (kind === "single") {
    const monday = nextWeekday(0);
    return {
      series: [],
      singleSessions: Array.from({ length: 10 }, (_, i) => ({ id: `single-${i + 1}`, name: `Single Session ${pad(i + 1)}`, date: addDays(monday, Math.floor(i / 3) * 7), start: 540 + (i % 3) * 60, seats: 20, enrolled: i < 7 ? 6 : 0 })),
    };
  }
  const monday = nextWeekday(0);
  const sessions = (key: string, count: number, start: number, firstWeek: number) => Array.from({ length: count }, (_, i) => ({ id: `${key}-${i + 1}`, date: addDays(monday, firstWeek * 7 + Math.floor(i / 2) * 7 + (i % 2) * 4), start }));
  return {
    singleSessions: [],
    series: [
      { id: "series-a", name: "Series A", verified: false, enrolled: 0, seats: 40, sessions: sessions("a", 5, 540, 0) },
      { id: "series-b", name: "Series B", verified: false, enrolled: 9, seats: 40, sessions: sessions("b", 6, 600, 0) },
    ],
  };
}

export const hasScheduleProblem = (draft: ScheduleDraft): string | null => {
  if (draft.kind === "single") return draft.singleSessions.length === 0 ? "Add at least one session" : null;
  const withSessions = draft.series.filter((s) => s.sessions.length > 0);
  if (withSessions.length === 0) return "Create at least one series";
  const unverified = withSessions.find((s) => !s.verified);
  return unverified ? `Verify ${unverified.name} before publishing` : null;
};

const resolveSchedule = (availabilityId?: string) => {
  const schedules = loadSchedules();
  return schedules.find((s) => s.id === availabilityId) ?? schedules.find((s) => s.isDefault) ?? schedules[0];
};

const isClash = (ctx: Ctx, date: string, start: number, list: SeriesSession[], selfId?: string) => {
  const day = ctx.days[dayIndex(date)];
  if (!day.on || !day.slots.some((slot) => start >= slot.start && start + ctx.duration <= slot.end)) return true;
  return [...ctx.others, ...list.filter((s) => s.id !== selfId)].some((s) => s.date === date && start < s.start + ctx.duration && s.start < start + ctx.duration);
};

function Icon({ path, className = "size-5" }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
const PENCIL = "M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19l-4 1z";
const CLOSE = "M6 6l12 12M18 6L6 18";
const CHECK = "M5 12l5 5 9-10";
const CALENDAR = "M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2zM3 10h18M8 3v4M16 3v4";
const Dots = (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="12" cy="19" r="1.7" />
  </svg>
);
const dotsClass = "flex size-8 items-center justify-center rounded-full text-[#334155] transition hover:bg-[#f1f5f9]";
const yellowButton = `flex h-9 shrink-0 items-center gap-2 rounded-[8px] bg-[#ffb20d] px-3 text-[14px] leading-[20px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`;
const fieldLabel = `text-[14px] leading-[20px] text-[#475569] ${fontRegular}`;
const dateInput = `h-[42px] w-full rounded-[8px] border border-[#e2e8f0] bg-white px-3 text-[14px] text-[#1e293b] outline-none focus:border-[#1e293b] disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:text-[#94a3b8] ${fontRegular}`;
const smallSelect = `h-7 cursor-pointer rounded-[6px] border-0 bg-[#f1f5f9] px-1.5 text-[14px] text-[#1e293b] outline-none focus:ring-2 focus:ring-[#1e293b]/30 disabled:cursor-not-allowed disabled:text-[#94a3b8] ${fontRegular}`;
const seatIcon = "M4 4h16v16H4zM8 12l3 3 5-6";
const peopleIcon = "M16 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-1a4 4 0 00-3-3.8M16 4.2a3.5 3.5 0 010 6.6";

function SessionList({ items, setItems, ctx, initialEditId }: { items: ListItem[]; setItems: (next: ListItem[]) => void; ctx: Ctx; initialEditId?: string }) {
  const { notify } = useApp();
  const [editing, setEditing] = useState<ListItem | null>(() => items.find((i) => i.id === initialEditId) ?? null);
  const today = toIso(new Date());

  const saveEdit = () => {
    if (!editing) return;
    if (editing.date < today) return notify("Pick a date that hasn't passed");
    if (isClash(ctx, editing.date, editing.start, items, editing.id)) return notify("That time is outside your availability or clashes with another session");
    setItems(items.map((i) => (i.id === editing.id ? { ...editing, flag: undefined } : i)).sort(byTime));
    setEditing(null);
  };
  const adjusted = items.some((i) => i.flag === "adjusted");

  return (
    <section className="rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] p-4 lg:min-h-[600px]">
      <h3 className={`text-[16px] leading-[24px] text-[#0f172a] ${fontSemi}`}>Scheduled Sessions({items.length})</h3>
      {adjusted && (
        <p className={`mt-4 flex items-center gap-3 rounded-[8px] bg-[#fff0d7] px-3 py-2 text-[12px] leading-[18px] text-[#9a3412] ${fontRegular}`}>
          <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="#faa104" aria-hidden="true">
            <path d="M12 2L1 21h22L12 2z" />
            <path d="M12 9v5M12 17.5v.01" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Certain session times were auto-adjusted by the system.
        </p>
      )}
      {items.length === 0 && <p className={`mt-6 rounded-[8px] border border-dashed border-[#cbd5e1] px-4 py-10 text-center text-[14px] leading-[24px] text-[#64748b] ${fontRegular}`}>Your sessions will show here.</p>}
      <ul className="mt-4 flex flex-col gap-2.5">
        {items.map((item) =>
          editing?.id === item.id ? (
            <li key={item.id} className="flex flex-wrap items-center gap-2 rounded-[8px] border border-[#1e293b] bg-white p-2">
              <input type="date" aria-label="Session date" value={editing.date} min={today} onChange={(e) => setEditing({ ...editing, date: e.target.value })} className={`${dateInput} h-[35px] w-auto min-w-0 flex-1`} />
              <TimeSelect value={editing.start} label="Session start time" onChange={(start) => setEditing({ ...editing, start })} />
              <button type="button" aria-label="Save session" onClick={saveEdit} className="flex size-[35px] items-center justify-center rounded-[6px] bg-[#ffb20d] text-[#1e293b] transition hover:bg-[#faa104]">
                <Icon path={CHECK} className="size-4" />
              </button>
              <button type="button" aria-label="Cancel editing" onClick={() => setEditing(null)} className="flex size-[35px] items-center justify-center rounded-[6px] bg-[#f1f5f9] text-[#1e293b] transition hover:bg-[#e2e8f0]">
                <Icon path={CLOSE} className="size-4" />
              </button>
            </li>
          ) : (
            <li key={item.id} className="flex min-h-[38px] flex-wrap items-center gap-2 rounded-[8px] border border-[#e2e8f0] bg-white px-3 py-1.5">
              <span className={`min-w-0 flex-1 text-[14px] leading-[20px] text-[#334155] ${fontRegular}`}>
                {shortDate(item.date)} · {FULL_DAYS[dayIndex(item.date)]} @ {clock(item.start)} – {clock(item.start + ctx.duration)}
              </span>
              {item.flag && <span className={`rounded-[4px] bg-[#fee2e2] px-1.5 text-[10px] leading-[16px] text-[#dc2626] ${fontMedium}`}>{item.flag === "adjusted" ? "Adjusted time" : "Conflict"}</span>}
              {!item.locked && (
                <>
                  <button type="button" aria-label={`Edit session on ${shortDate(item.date)}`} onClick={() => setEditing(item)} className="flex text-[#64748b] transition hover:text-[#0f172a]">
                    <Icon path={PENCIL} className="size-4" />
                  </button>
                  <button type="button" aria-label={`Remove session on ${shortDate(item.date)}`} onClick={() => setItems(items.filter((i) => i.id !== item.id))} className="flex text-[#64748b] transition hover:text-[#dc2626]">
                    <Icon path={CLOSE} className="size-4" />
                  </button>
                </>
              )}
            </li>
          ),
        )}
      </ul>
    </section>
  );
}

function Drawer({ title, subtitle, duration, timezone, onClose, onConfirm, left, right }: { title: string; subtitle: string; duration: number; timezone: string; onClose: () => void; onConfirm: () => void; left: ReactNode; right: ReactNode }) {
  return (
    <Shell title={title} onClose={onClose} variant="drawer" drawerWidth="max-w-[920px]" hideHeader>
      <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[#e2e8f0] bg-white px-5 py-3 md:px-6">
        <h2 className={`text-[18px] leading-[28px] text-[#334155] ${fontHeading}`}>{title}</h2>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className={`h-9 rounded-[8px] border border-[#cbd5e1] px-3.5 text-[14px] leading-[20px] text-[#334155] transition hover:bg-[#f8fafc] ${fontMedium}`}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className={`h-9 rounded-[8px] bg-[#1e293b] px-3.5 text-[14px] leading-[20px] text-white transition hover:bg-[#0f172a] ${fontMedium}`}>
            Confirm
          </button>
        </div>
      </div>
      <div className="px-5 py-6 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={`text-[16px] leading-[24px] text-[#0f172a] ${fontSemi}`}>Set Your Session Schedule</p>
            <p className={`mt-1 text-[14px] leading-[20px] text-[#475569] ${fontRegular}`}>{subtitle}</p>
          </div>
          <p className={`flex items-center gap-2 text-[12px] leading-[18px] text-[#94a3b8] ${fontRegular}`}>
            <Icon path="M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z" className="size-4" />
            {duration} min/session
            <span aria-hidden="true">|</span>
            {timezone}
          </p>
        </div>
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,312px)_minmax(0,1fr)]">
          <div className="min-w-0">{left}</div>
          <div className="min-w-0">{right}</div>
        </div>
      </div>
    </Shell>
  );
}

function DateFields({ start, end, setStart }: { start: string; end: string; setStart: (value: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label htmlFor="new-start-date" className={fieldLabel}>
          New Start Date
        </label>
        <input id="new-start-date" type="date" value={start} min={toIso(new Date())} onChange={(e) => setStart(e.target.value)} className={`mt-1 ${dateInput}`} />
      </div>
      <div>
        <label htmlFor="new-end-date" className={fieldLabel}>
          New End Date:
        </label>
        <input id="new-end-date" type="date" value={end} disabled className={`mt-1 ${dateInput}`} />
      </div>
    </div>
  );
}

function Frequency({ perWeek, weeks, setPerWeek, setWeeks, disabled }: { perWeek: number; weeks: number; setPerWeek?: (n: number) => void; setWeeks?: (n: number) => void; disabled?: boolean }) {
  const option = (n: number) => (
    <option key={n} value={n}>
      {n}
    </option>
  );
  return (
    <p className={`mt-3 flex flex-wrap items-center gap-2 text-[14px] leading-[20px] ${disabled ? "text-[#94a3b8]" : "text-[#1e293b]"} ${fontRegular}`}>
      Generate
      <select aria-label="Sessions per week" value={perWeek} disabled={disabled} onChange={(e) => setPerWeek?.(Number(e.target.value))} className={smallSelect}>
        {[1, 2, 3, 4, 5, 6, 7].map(option)}
      </select>
      Sessions per week for
      <select aria-label="Number of weeks" value={weeks} disabled={disabled} onChange={(e) => setWeeks?.(Number(e.target.value))} className={smallSelect}>
        {Array.from({ length: Math.max(12, weeks) }, (_, i) => i + 1).map(option)}
      </select>
      weeks.
    </p>
  );
}

const hasConflicts = (items: ListItem[]) => items.some((i) => i.flag === "conflict");

function MultiDrawer({ ctx, timezone, onClose, onConfirm }: { ctx: Ctx; timezone: string; onClose: () => void; onConfirm: (sessions: SeriesSession[]) => void }) {
  const { notify } = useApp();
  const available = ctx.days.map((d, i) => (d.on ? i : -1)).filter((i) => i >= 0);
  const [start, setStart] = useState(() => toIso(new Date()));
  const [perWeek, setPerWeekRaw] = useState(Math.min(2, available.length || 1));
  const [weeks, setWeeks] = useState(4);
  const [chosen, setChosen] = useState<number[]>(() => available.slice(0, Math.min(2, available.length)));
  const [hours, setHours] = useState(() => ctx.days.map((d) => ({ start: d.slots[0]?.start ?? 540, end: d.slots[0]?.end ?? 720 })));
  const [items, setItems] = useState<ListItem[]>([]);
  const end = addDays(start, weeks * 7 - 1);

  const setPerWeek = (n: number) => {
    setPerWeekRaw(n);
    setChosen((list) => list.slice(0, n));
  };
  const toggle = (i: number) => {
    if (chosen.includes(i)) return setChosen(chosen.filter((d) => d !== i));
    if (chosen.length >= perWeek) return notify(`Only ${perWeek} ${perWeek === 1 ? "day" : "days"} can be selected`);
    setChosen([...chosen, i]);
  };
  const preview = () => {
    if (!start || start < toIso(new Date())) return notify("Pick a start date that hasn't passed");
    if (chosen.length !== perWeek) return notify(`Select ${perWeek} ${perWeek === 1 ? "day" : "days"}`);
    const short = chosen.find((i) => hours[i].start + ctx.duration > hours[i].end);
    if (short !== undefined) return notify(`${SHORT_DAYS[short]} hours are shorter than one session`);
    const next: ListItem[] = [];
    for (let date = start; date <= end; date = addDays(date, 1)) {
      const index = dayIndex(date);
      if (!chosen.includes(index)) continue;
      const clash = isClash(ctx, date, hours[index].start, next);
      next.push({ id: newId("session"), date, start: hours[index].start, flag: clash ? "conflict" : undefined });
    }
    setItems(next);
  };
  const confirm = () => {
    if (items.length === 0) return notify("Preview your sessions first");
    if (hasConflicts(items)) return notify("Fix or remove the sessions marked Conflict");
    onConfirm(items.map(({ id, date, start: time }) => ({ id, date, start: time })));
  };

  return (
    <Drawer
      title="Multi Session Creation"
      subtitle="Choose a time range and frequency for recurring sessions."
      duration={ctx.duration}
      timezone={timezone}
      onClose={onClose}
      onConfirm={confirm}
      right={<SessionList items={items} setItems={setItems} ctx={ctx} />}
      left={
        <>
          <DateFields start={start} end={end} setStart={setStart} />
          <Frequency perWeek={perWeek} weeks={weeks} setPerWeek={setPerWeek} setWeeks={setWeeks} />
          <p className={`mt-7 text-[16px] leading-[24px] text-[#0f172a] ${fontSemi}`}>Preferred Day & time</p>
          <p className={`mt-1 flex items-start gap-1.5 text-[12px] leading-[18px] text-[#ea580c] ${fontRegular}`}>
            <Icon path="M12 3a9 9 0 100 18 9 9 0 000-18zM12 8v5M12 16h.01" className="mt-px size-4 shrink-0" />
            Based on your weekly session count, only {perWeek} {perWeek === 1 ? "day" : "days"} can be selected.
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {SHORT_DAYS.map((name, i) => {
              const dayOn = ctx.days[i].on;
              const selected = chosen.includes(i);
              return (
                <li key={name} className="flex min-h-[35px] items-center gap-3">
                  {dayOn ? (
                    <span className={`w-[64px] shrink-0 ${selected ? "" : "opacity-50"}`}>
                      <Checkbox checked={selected} onChange={() => toggle(i)}>
                        <span className={`text-[14px] leading-[20px] text-[#334155] ${fontRegular}`}>{name}</span>
                      </Checkbox>
                    </span>
                  ) : (
                    <span className="flex w-[64px] shrink-0 items-center gap-2 opacity-50">
                      <span aria-hidden="true" className="size-4 rounded-[3.5px] border border-[#cbd5e1]" />
                      <span className={`text-[14px] leading-[20px] text-[#64748b] line-through ${fontRegular}`}>{name}</span>
                    </span>
                  )}
                  {dayOn ? (
                    <span className="flex items-center gap-1.5">
                      <TimeSelect width="w-[100px]" disabled={!selected} value={hours[i].start} label={`${name} start time`} onChange={(value) => setHours(hours.map((h, j) => (j === i ? { ...h, start: value } : h)))} />
                      <span aria-hidden="true" className="text-[#475569]">
                        -
                      </span>
                      <TimeSelect width="w-[100px]" disabled={!selected} value={hours[i].end} label={`${name} end time`} onChange={(value) => setHours(hours.map((h, j) => (j === i ? { ...h, end: value } : h)))} />
                    </span>
                  ) : (
                    <span className={`text-[12px] italic leading-[18px] text-[#94a3b8] [font-synthesis:style] ${fontRegular}`}>Unavailable this day</span>
                  )}
                </li>
              );
            })}
          </ul>
          <button type="button" onClick={preview} className={`${yellowButton} mt-6`}>
            Preview sessions
          </button>
        </>
      }
    />
  );
}

function PickerDrawer({ title, tint, ctx: scheduleCtx, timezone, initial, initialEditId, onClose, onConfirm }: { title: string; tint: "amber" | "gray"; ctx: Ctx; timezone: string; initial: ListItem[]; initialEditId?: string; onClose: () => void; onConfirm: (items: ListItem[]) => void }) {
  const { notify } = useApp();
  const ctx = { ...scheduleCtx, days: OPEN_DAYS };
  const today = toIso(new Date());
  const [items, setItems] = useState(initial);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const scheduled = new Set(items.map((i) => i.date));
  const open = DUMMY_SLOTS.filter((time) => !items.some((i) => i.date === selectedDate && i.start === time));
  const nav = "flex size-9 items-center justify-center rounded-[6px] bg-[#f8fafc] text-[#1e293b] transition hover:bg-[#f1f5f9]";

  const add = () => {
    if (selectedSlot === null) return;
    if (isClash(ctx, selectedDate, selectedSlot, items)) return notify("That time clashes with another session");
    setItems([...items, { id: newId("session"), date: selectedDate, start: selectedSlot }].sort(byTime));
    setSelectedSlot(null);
  };
  const confirm = () => {
    if (items.length === 0) return notify("Add at least one session");
    onConfirm(items);
  };

  return (
    <Drawer
      title={title}
      subtitle="Select your session by selecting a date and time. and add to list"
      duration={ctx.duration}
      timezone={timezone}
      onClose={onClose}
      onConfirm={confirm}
      right={<SessionList items={items} setItems={setItems} ctx={ctx} initialEditId={initialEditId} />}
      left={
        <>
          <div className="flex items-center justify-between">
            <p aria-live="polite" className={`text-[16px] leading-[24px] text-[#1e293b] ${fontSemi}`}>
              {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
            <div className="flex gap-1.5">
              <button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className={nav}>
                <Icon path="M15 6l-6 6 6 6" className="size-4" />
              </button>
              <button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className={nav}>
                <Icon path="M9 6l6 6-6 6" className="size-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-7 justify-items-center gap-y-2">
            {CALENDAR_DAYS.map((day) => (
              <span key={day} className={`text-[12px] leading-[18px] text-[#94a3b8] ${fontRegular}`}>
                {day}
              </span>
            ))}
            {Array.from({ length: month.getDay() }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const iso = toIso(new Date(month.getFullYear(), month.getMonth(), i + 1));
              const selected = iso === selectedDate;
              const has = scheduled.has(iso);
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={iso < today}
                  aria-pressed={selected}
                  aria-label={`${fromIso(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}${has ? ", has a session" : ""}`}
                  onClick={() => {
                    setSelectedDate(iso);
                    setSelectedSlot(null);
                  }}
                  className={`flex size-8 items-center justify-center rounded-full text-[14px] leading-[20px] text-[#334155] transition disabled:cursor-not-allowed disabled:text-[#cbd5e1] ${iso === today ? "bg-[#fdb42d]" : has ? (tint === "amber" ? "bg-[#fff0d7]" : "bg-[#f1f5f9]") : "enabled:hover:bg-[#f8fafc]"} ${selected ? "ring-1 ring-[#faa104]" : ""} ${fontRegular}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <p className={`mt-6 text-[14px] leading-[20px] text-[#0f172a] ${fontSemi}`}>Select Time</p>
          {open.length === 0 ? (
            <p className={`mt-2.5 rounded-[8px] border border-dashed border-[#cbd5e1] px-4 py-6 text-center text-[14px] leading-[20px] text-[#64748b] ${fontRegular}`}>No open times left on this day.</p>
          ) : (
            <ul className="mt-2.5 flex flex-col gap-2.5">
              {open.map((time) => {
                const selected = selectedSlot === time;
                return (
                  <li key={time} className="flex items-center gap-2">
                    <button type="button" aria-pressed={selected} onClick={() => setSelectedSlot(selected ? null : time)} className={`h-[34px] min-w-0 flex-1 rounded-[8px] border bg-white text-[12px] leading-[18px] text-[#334155] transition ${selected ? "border-[#1e293b]" : "border-[#e2e8f0] hover:border-[#94a3b8]"} ${fontRegular}`}>
                      {slotClock(time)} - {clock(time + ctx.duration)}
                    </button>
                    {selected && (
                      <>
                        <button type="button" aria-label={`Add session at ${clock(time)}`} onClick={add} className="flex size-[34px] items-center justify-center rounded-[6px] bg-[#ffb20d] text-[#1e293b] transition hover:bg-[#faa104]">
                          <Icon path={CHECK} className="size-4" />
                        </button>
                        <button type="button" aria-label="Clear selected time" onClick={() => setSelectedSlot(null)} className="flex size-[34px] items-center justify-center rounded-[6px] bg-[#f1f5f9] text-[#1e293b] transition hover:bg-[#e2e8f0]">
                          <Icon path={CLOSE} className="size-4" />
                        </button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      }
    />
  );
}

function CopyDrawer({ source, ctx, timezone, onClose, onConfirm }: { source: LiveSeries; ctx: Ctx; timezone: string; onClose: () => void; onConfirm: (sessions: SeriesSession[]) => void }) {
  const { notify } = useApp();
  const sorted = [...source.sessions].sort(byTime);
  const first = sorted[0]?.date ?? toIso(new Date());
  const last = sorted[sorted.length - 1]?.date ?? first;
  const span = Math.round((fromIso(last).getTime() - fromIso(first).getTime()) / 86400000);
  const weeks = Math.max(1, Math.ceil((span + 1) / 7));
  const [start, setStart] = useState(() => {
    let date = addDays(first, weeks * 7);
    const today = toIso(new Date());
    while (date < today) date = addDays(date, 7);
    return date;
  });
  const [autoShift, setAutoShift] = useState(true);
  const [shiftDay, setShiftDay] = useState(1);
  const [shiftHour, setShiftHour] = useState(1);
  const [items, setItems] = useState<ListItem[]>([]);
  const offset = Math.round((fromIso(start).getTime() - fromIso(first).getTime()) / 86400000);
  const perWeek = Math.max(1, Math.min(7, Math.ceil(sorted.length / weeks)));
  const selectClass = `${dateInput} cursor-pointer`;

  const preview = () => {
    if (!start || start < toIso(new Date())) return notify("Pick a start date that hasn't passed");
    const next: ListItem[] = [];
    sorted.forEach((session) => {
      let date = addDays(session.date, offset);
      let time = session.start;
      let flag: ListItem["flag"];
      if (isClash(ctx, date, time, next)) {
        flag = "conflict";
        if (autoShift) {
          for (let attempt = 0; attempt < 60; attempt++) {
            date = addDays(date, shiftDay);
            time = (time + shiftHour * 60) % (1440 - ctx.duration);
            if (!isClash(ctx, date, time, next)) {
              flag = "adjusted";
              break;
            }
          }
          if (flag === "conflict") {
            date = addDays(session.date, offset);
            time = session.start;
          }
        }
      }
      next.push({ id: newId("session"), date, start: time, flag });
    });
    setItems(next.sort(byTime));
  };
  const confirm = () => {
    if (items.length === 0) return notify("Preview your sessions first");
    if (hasConflicts(items)) return notify("Fix or remove the sessions marked Conflict");
    onConfirm(items.map(({ id, date, start: time }) => ({ id, date, start: time })));
  };

  return (
    <Drawer
      title="Copy session"
      subtitle="Choose a time range and frequency for recurring sessions."
      duration={ctx.duration}
      timezone={timezone}
      onClose={onClose}
      onConfirm={confirm}
      right={<SessionList items={items} setItems={setItems} ctx={ctx} />}
      left={
        <>
          <DateFields start={start} end={start ? addDays(start, span) : ""} setStart={setStart} />
          <Frequency perWeek={perWeek} weeks={weeks} disabled />
          <div className="mt-7 rounded-[12px] bg-[#f8fafc] p-4">
            <Checkbox checked={autoShift} onChange={() => setAutoShift(!autoShift)}>
              <span className={`text-[14px] leading-[20px] text-[#1e293b] ${fontMedium}`}>Schedule Shift</span>
            </Checkbox>
            <p className={`mt-1.5 text-[12px] leading-[18px] text-[#475569] ${fontRegular}`}>Automatically shift your schedule if a conflict is detected.</p>
            <div className={`mt-4 grid grid-cols-2 gap-3 ${autoShift ? "" : "opacity-50"}`}>
              <label className={`text-[14px] leading-[20px] text-[#1e293b] ${fontSemi}`}>
                Shift day
                <select value={shiftDay} disabled={!autoShift} onChange={(e) => setShiftDay(Number(e.target.value))} className={`mt-1.5 ${selectClass}`}>
                  {[1, 2, 3, 7].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "Day" : "Days"}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`text-[14px] leading-[20px] text-[#1e293b] ${fontSemi}`}>
                Shift time
                <select value={shiftHour} disabled={!autoShift} onChange={(e) => setShiftHour(Number(e.target.value))} className={`mt-1.5 ${selectClass}`}>
                  {[0, 1, 2, 3].map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? "No change" : `${n} ${n === 1 ? "hour" : "hours"}`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <button type="button" onClick={preview} className={`${yellowButton} mt-6`}>
            Preview sessions
          </button>
        </>
      }
    />
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: ReactNode }) {
  return (
    <span className={`flex items-center gap-1.5 text-[12px] leading-[18px] text-[#64748b] ${fontRegular}`}>
      <Icon path={icon} className="size-4 text-[#94a3b8]" />
      {label}: <span className={`text-[#1e293b] ${fontSemi}`}>{value}</span>
    </span>
  );
}

function SeriesCard({ series, duration, onVerify, onAdd, onEdit, onDeleteSession, onCopy, onDelete }: { series: LiveSeries; duration: number; onVerify: () => void; onAdd: () => void; onEdit: (id: string) => void; onDeleteSession: (id: string) => void; onCopy: () => void; onDelete: () => void }) {
  const { notify } = useApp();
  const locked = series.enrolled > 0;
  const sorted = [...series.sessions].sort(byTime);
  const dayNames = [...new Set(sorted.map((s) => FULL_DAYS[dayIndex(s.date)]))];
  const daysText = dayNames.length === 0 ? "None yet" : dayNames.length <= 2 ? dayNames.join(" , ") : `${dayNames.slice(0, 2).join(" , ")} and ${dayNames.length - 2} more`;

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2.5">
            <span className={`text-[16px] leading-[24px] text-[#1e293b] ${fontSemi}`}>{series.name}</span>
            {locked && (
              <span className="group/tip relative flex">
                <button type="button" aria-label="Session deletion is restricted due to enrollments in this series." className="flex text-[#334155]">
                  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                    <path d="M6 10V8a6 6 0 1112 0v2h1a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V11a1 1 0 011-1h1zm2.5 0h7V8a3.5 3.5 0 10-7 0v2z" />
                  </svg>
                </button>
                <span role="tooltip" className={`pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-[230px] -translate-x-1/2 rounded-[6px] bg-[#1e293b] px-2.5 py-2 text-center text-[12px] leading-[18px] text-white group-focus-within/tip:block group-hover/tip:block ${fontRegular}`}>
                  Session deletion is restricted due to enrollments in this series.
                </span>
              </span>
            )}
            {series.verified ? <span className={`rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[12px] leading-[18px] text-[#059669] ${fontMedium}`}>Verified</span> : !locked && <span className={`rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[12px] leading-[18px] text-[#334155] ${fontMedium}`}>Not verified</span>}
          </h2>
          <p className={`mt-0.5 text-[14px] italic leading-[20px] text-[#475569] [font-synthesis:style] ${fontRegular}`}>
            {locked ? (
              <>
                This session is locked 🚫 because it has <span className={fontSemi}>{series.enrolled}</span> enrolments.
              </>
            ) : (
              "This session is editable ✅. You can modify details until enrolments begin."
            )}
          </p>
        </div>
        {!series.verified && (
          <button type="button" onClick={onVerify} className={`h-9 shrink-0 rounded-[8px] border border-[#1e293b] px-3.5 text-[14px] leading-[20px] text-[#1e293b] transition hover:bg-[#f8fafc] ${fontMedium}`}>
            Verify
          </button>
        )}
      </div>
      <div className="mt-3 rounded-[12px] border border-[#f1f5f9] bg-white">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3">
          <p className={`min-w-[220px] flex-1 text-[12px] leading-[18px] text-[#64748b] ${fontRegular}`}>
            Available Days <span className={`ml-1 text-[#1e293b] ${fontMedium}`}>{daysText}</span>
          </p>
          <Stat icon={seatIcon} label="Available Seats" value={series.seats} />
          {locked ? (
            <Stat icon={peopleIcon} label="Enrolled" value={`${series.enrolled}/${series.seats}`} />
          ) : (
            <span className={`flex items-center gap-1.5 rounded-[4px] bg-[#fff0d7] px-2 py-1 text-[12px] italic leading-[18px] text-[#7c2d12] [font-synthesis:style] ${fontMedium}`}>
              <Icon path={peopleIcon} className="size-4" />
              No Enrolment Yet
            </span>
          )}
          <ActionMenu
            label={`More actions for ${series.name}`}
            trigger={Dots}
            triggerClass={dotsClass}
            items={[
              { label: "Copy session", onClick: onCopy },
              { label: "Delete series", danger: true, onClick: () => (locked ? notify("Session deletion is restricted due to enrollments in this series.") : onDelete()) },
            ]}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className={`bg-[#f8fafc] text-[12px] leading-[18px] text-[#475569] ${fontRegular}`}>
                <th scope="col" className="w-[42%] px-5 py-2.5 font-normal">
                  Session Date
                </th>
                <th scope="col" className="px-2 py-2.5 font-normal">
                  Time
                </th>
                <th scope="col" className="w-12">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((session) => (
                <tr key={session.id}>
                  <td className={`px-4 py-2.5 text-[14px] leading-[20px] text-[#475569] ${fontRegular}`}>
                    <span className="flex items-center gap-3">
                      <Icon path={CALENDAR} className="size-[18px] text-[#64748b]" />
                      {longDate(session.date)}
                    </span>
                  </td>
                  <td className={`whitespace-nowrap px-2 py-2.5 text-[14px] leading-[20px] text-[#475569] ${fontRegular}`}>
                    {SHORT_DAYS[dayIndex(session.date)]} @ {clock(session.start)} - {clock(session.start + duration)}
                  </td>
                  <td className="pr-3">
                    <ActionMenu
                      label={`More actions for session on ${longDate(session.date)}`}
                      trigger={Dots}
                      triggerClass={dotsClass}
                      items={[
                        { label: "Edit", onClick: () => (locked ? notify(ENROLLED_MESSAGE) : onEdit(session.id)) },
                        { label: "Delete", danger: true, onClick: () => (locked ? notify("Session deletion is restricted due to enrollments in this series.") : onDeleteSession(session.id)) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!locked && (
          <div className="px-4 pb-4 pt-2">
            <button type="button" onClick={onAdd} className={`flex h-9 items-center gap-2 rounded-[8px] border border-[#1e293b] px-3 text-[14px] leading-[20px] text-[#1e293b] transition hover:bg-[#f8fafc] ${fontMedium}`}>
              <Icon path="M12 5v14M5 12h14" className="size-[18px]" />
              Add new Session
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

type DrawerState = { kind: "multi" } | { kind: "add"; seriesId: string; editId?: string } | { kind: "copy"; seriesId: string } | { kind: "single"; editId?: string };

export default function LiveScheduleSection({ draft, update }: { draft: ScheduleDraft; update: (patch: Partial<ScheduleFields>) => void }) {
  const { notify } = useApp();
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [deleting, setDeleting] = useState<LiveSeries | null>(null);
  const schedule = resolveSchedule(draft.availabilityId);
  const days = schedule?.days ?? FALLBACK_DAYS;
  const timezone = schedule?.timezone ?? FALLBACK_TIMEZONE;
  const duration = durationOf(draft);
  const multi = draft.kind === "multi";

  const ctxExcept = (seriesId?: string): Ctx => ({ days, duration, others: draft.series.filter((s) => s.id !== seriesId).flatMap((s) => s.sessions) });
  const setSessions = (seriesId: string, sessions: SeriesSession[]) => update({ series: draft.series.map((s) => (s.id === seriesId ? { ...s, sessions, verified: false } : s)) });
  const nextName = () => {
    const used = new Set(draft.series.map((s) => s.name));
    for (let i = 0; i < 26; i++) {
      const name = `Series ${String.fromCharCode(65 + i)}`;
      if (!used.has(name)) return name;
    }
    return `Series ${draft.series.length + 1}`;
  };
  const addSeries = (sessions: SeriesSession[]) => {
    update({ series: [...draft.series, { id: newId("series"), name: nextName(), verified: false, enrolled: 0, seats: Number(draft.seats) || 40, sessions }] });
    setDrawer(null);
  };
  const verify = (series: LiveSeries) => {
    if (series.sessions.length === 0) return notify("Add at least one session first");
    const today = toIso(new Date());
    const passed = series.sessions.filter((s) => s.date < today).length;
    if (passed > 0) return notify(`${passed} ${passed === 1 ? "session has" : "sessions have"} a date that has passed`);
    const ctx = { ...ctxExcept(series.id), days: OPEN_DAYS };
    const clashes = series.sessions.filter((s) => isClash(ctx, s.date, s.start, series.sessions, s.id)).length;
    if (clashes > 0) return notify(`${clashes} ${clashes === 1 ? "session clashes" : "sessions clash"} with another session`);
    update({ series: draft.series.map((s) => (s.id === series.id ? { ...s, verified: true } : s)) });
    notify(`${series.name} verified`);
  };

  const singleItems: ListItem[] = draft.singleSessions.map((s) => ({ id: s.id, date: s.date, start: s.start, locked: s.enrolled > 0 })).sort(byTime);
  const confirmSingle = (items: ListItem[]) => {
    const existing = new Map(draft.singleSessions.map((s) => [s.id, s]));
    let count = draft.singleSessions.reduce((max, s) => Math.max(max, Number(s.name.match(/\d+$/)?.[0]) || 0), 0);
    update({
      singleSessions: items.map((item) => {
        const known = existing.get(item.id);
        if (known) return { ...known, date: item.date, start: item.start };
        count += 1;
        return { id: item.id, name: `Single Session ${pad(count)}`, date: item.date, start: item.start, seats: Number(draft.seats) || 20, enrolled: 0 };
      }),
    });
    setDrawer(null);
  };
  const singleColumns = "grid grid-cols-[minmax(170px,1fr)_190px_70px_100px_90px_36px] items-center gap-x-2";
  const addedSeries = drawer?.kind === "add" || drawer?.kind === "copy" ? draft.series.find((s) => s.id === drawer.seriesId) : undefined;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={`m-0 text-[20px] leading-[28px] text-[#1e293b] ${fontSemi}`}>Appointment Time</h1>
          <p className={`mt-1 text-[14px] leading-[20px] text-[#94a3b8] ${fontRegular}`}>
            Timezone: <span className="ml-1 text-[#334155]">{timezone}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {!multi && (
            <button type="button" onClick={() => openLiveEditor(draft.id, "class-setup")} className={`flex h-9 items-center gap-2 rounded-[8px] bg-[#f1f5f9] px-3 text-[14px] leading-[20px] text-[#1e293b] transition hover:bg-[#e2e8f0] ${fontMedium}`}>
              Session Settings
              <Icon path="M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 00-2.1-1.2L14 3h-4l-.5 2.7a7 7 0 00-2.1 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 005 12a7 7 0 00.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 002.1 1.2L10 21h4l.5-2.7a7 7 0 002.1-1.2l2.3 1 2-3.4-2-1.5A7 7 0 0019 12z" className="size-[18px]" />
            </button>
          )}
          <button type="button" onClick={() => setDrawer(multi ? { kind: "multi" } : { kind: "single" })} className={yellowButton}>
            {multi ? "Create Series" : "Create Session"}
            <Icon path="M12 5v14M5 12h14" className="size-[18px]" />
          </button>
        </div>
      </div>

      {multi ? (
        <div className="mt-8 flex flex-col gap-8">
          {draft.series.length === 0 && <p className={`rounded-[8px] border border-[#e2e8f0] px-6 py-14 text-center text-[14px] leading-[24px] text-[#64748b] ${fontRegular}`}>No series yet. Click Create Series to plan your sessions.</p>}
          {draft.series.map((series) => (
            <SeriesCard
              key={series.id}
              series={series}
              duration={duration}
              onVerify={() => verify(series)}
              onAdd={() => setDrawer({ kind: "add", seriesId: series.id })}
              onEdit={(editId) => setDrawer({ kind: "add", seriesId: series.id, editId })}
              onDeleteSession={(id) => setSessions(series.id, series.sessions.filter((s) => s.id !== id))}
              onCopy={() => setDrawer({ kind: "copy", seriesId: series.id })}
              onDelete={() => setDeleting(series)}
            />
          ))}
        </div>
      ) : draft.singleSessions.length === 0 ? (
        <p className={`mt-8 rounded-[8px] border border-[#e2e8f0] px-6 py-14 text-center text-[14px] leading-[24px] text-[#64748b] ${fontRegular}`}>No sessions yet. Click Create Session to add your first one.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <div className="flex min-w-[680px] flex-col gap-3">
            <div className={`${singleColumns} rounded-[8px] bg-[#f8fafc] px-4 py-2.5 text-[12px] leading-[18px] text-[#475569] ${fontRegular}`}>
              <span>Session</span>
              <span className="text-center">Time</span>
              <span className="text-center">Duration</span>
              <span className="flex items-center justify-center gap-1">
                <Icon path={seatIcon} className="size-3.5 shrink-0 text-[#94a3b8]" />
                Seats
              </span>
              <span className="flex items-center justify-center gap-1">
                <Icon path={peopleIcon} className="size-3.5 shrink-0 text-[#94a3b8]" />
                Enrolled
              </span>
              <span />
            </div>
            {[...draft.singleSessions].sort(byTime).map((session) => (
              <article key={session.id} className="rounded-[12px] border border-[#f1f5f9] bg-white px-4 py-3">
                <h2 className={`text-[14px] leading-[20px] text-[#0f172a] ${fontSemi}`}>{session.name}</h2>
                <div className={`${singleColumns} mt-1 text-[14px] leading-[20px] text-[#475569] ${fontRegular}`}>
                  <span className="flex items-center gap-3">
                    <Icon path={CALENDAR} className="size-[18px] text-[#64748b]" />
                    {longDate(session.date)}
                  </span>
                  <span className="whitespace-nowrap text-center">
                    {SHORT_DAYS[dayIndex(session.date)]} @ {clock(session.start)} - {clock(session.start + duration)}
                  </span>
                  <span className="text-center">{durationLabel(duration)}</span>
                  <span className="text-center">{session.seats}</span>
                  <span className="text-center">
                    {pad(session.enrolled)}/{session.seats}
                  </span>
                  <ActionMenu
                    label={`More actions for ${session.name}`}
                    trigger={Dots}
                    triggerClass={dotsClass}
                    items={[
                      { label: "Edit", onClick: () => (session.enrolled > 0 ? notify(ENROLLED_MESSAGE) : setDrawer({ kind: "single", editId: session.id })) },
                      { label: "Delete", danger: true, onClick: () => (session.enrolled > 0 ? notify(ENROLLED_MESSAGE) : update({ singleSessions: draft.singleSessions.filter((s) => s.id !== session.id) })) },
                    ]}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {drawer?.kind === "multi" && <MultiDrawer ctx={ctxExcept()} timezone={timezone} onClose={() => setDrawer(null)} onConfirm={addSeries} />}
      {drawer?.kind === "copy" && addedSeries && <CopyDrawer source={addedSeries} ctx={ctxExcept()} timezone={timezone} onClose={() => setDrawer(null)} onConfirm={addSeries} />}
      {drawer?.kind === "add" && addedSeries && (
        <PickerDrawer
          title="Create Session"
          tint="amber"
          ctx={ctxExcept(addedSeries.id)}
          timezone={timezone}
         
          initial={[...addedSeries.sessions].sort(byTime)}
          initialEditId={drawer.editId}
          onClose={() => setDrawer(null)}
          onConfirm={(items) => {
            setSessions(addedSeries.id, items.map(({ id, date, start }) => ({ id, date, start })));
            setDrawer(null);
          }}
        />
      )}
      {drawer?.kind === "single" && <PickerDrawer title="Single Session Creation" tint="gray" ctx={ctxExcept()} timezone={timezone} initial={singleItems} initialEditId={drawer.editId} onClose={() => setDrawer(null)} onConfirm={confirmSingle} />}
      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.name}?`}
          body="This series and its sessions will be removed."
          confirmLabel="Yes, delete"
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            update({ series: draft.series.filter((s) => s.id !== deleting.id) });
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}
