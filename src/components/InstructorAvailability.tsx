import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, openInstructorAvailability, save, useApp } from "../store";
import { ActionMenu, useHoverHighlight } from "./Menus";
import { Shell } from "./Overlays";
import { buttonClass } from "./Button";

const imgClose = "/assets/53e9a.svg";

type Slot = { start: number; end: number };
type Day = { on: boolean; slots: Slot[] };
type Override = { id: string; date: string; unavailable: boolean; slots: Slot[] };
export type Schedule = { id: string; name: string; isDefault: boolean; timezone: string; days: Day[]; overrides: Override[] };

const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const CALENDAR_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const TIMEZONES = ["( GMT +3:00) Riyadh", "( GMT +4:00) Dubai", "( GMT +5:00) Karachi", "( GMT +6:00) Astana,Dhaka", "( GMT +0:00) London"];
const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => i * 15);
const STORE_KEY = "thkee.instructorAvailability.v2";
const DEFAULT_SLOT: Slot = { start: 540, end: 720 };

const pad = (n: number) => String(n).padStart(2, "0");
const toParts = (minutes: number) => ({ hour: Math.floor(minutes / 60) % 12 || 12, minute: pad(minutes % 60), am: minutes < 720 });
const formatUpper = (minutes: number) => {
  const { hour, minute, am } = toParts(minutes);
  return `${hour}:${minute} ${am ? "AM" : "PM"}`;
};
export const toIso = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const fromIso = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const formatOverrideDate = (iso: string) => fromIso(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

const daysFrom = (spec: Record<number, Slot[]>): Day[] => DAY_NAMES.map((_, i) => ({ on: Boolean(spec[i]), slots: spec[i] ?? [{ ...DEFAULT_SLOT }] }));
const WEEKDAYS = daysFrom({ 0: [{ ...DEFAULT_SLOT }], 1: [{ ...DEFAULT_SLOT }], 2: [{ ...DEFAULT_SLOT }], 3: [{ ...DEFAULT_SLOT }], 4: [{ ...DEFAULT_SLOT }] });
const REGULAR = { 0: [{ start: 540, end: 1020 }], 3: [{ start: 540, end: 1020 }], 1: [{ start: 495, end: 960 }], 4: [{ start: 465, end: 1320 }] };
const SEED_OVERRIDES: Override[] = ["2026-11-06", "2026-11-13", "2026-11-20", "2026-11-27", "2026-12-04", "2026-12-11"].map((date, i) => ({ id: `override-${i}`, date, unavailable: false, slots: [{ start: 105, end: 960 }] }));
const TZ = "( GMT +6:00) Astana,Dhaka";
const SEED: Schedule[] = [
  { id: "class-regular", name: "Class Schedule for Regular", isDefault: true, timezone: TZ, days: daysFrom({ 0: [{ ...DEFAULT_SLOT }, { start: 780, end: 1020 }], 1: [{ ...DEFAULT_SLOT }], 4: [{ ...DEFAULT_SLOT }] }), overrides: SEED_OVERRIDES },
  { id: "regular", name: "Regular Working Hours", isDefault: false, timezone: TZ, days: daysFrom(REGULAR), overrides: [] },
  { id: "evening", name: "Evening Schedule", isDefault: false, timezone: TZ, days: daysFrom({ 0: [{ start: 1080, end: 1260 }], 2: [{ start: 1080, end: 1260 }], 5: [{ start: 600, end: 840 }] }), overrides: [] },
  { id: "weekend", name: "Weekend Workshops", isDefault: false, timezone: TZ, days: daysFrom({ 5: [{ start: 600, end: 960 }], 6: [{ start: 600, end: 960 }] }), overrides: [] },
  { id: "ramadan", name: "Ramadan Hours", isDefault: false, timezone: "( GMT +3:00) Riyadh", days: daysFrom({ 0: [{ start: 1230, end: 1380 }], 1: [{ start: 1230, end: 1380 }], 2: [{ start: 1230, end: 1380 }], 3: [{ start: 1230, end: 1380 }], 6: [{ start: 1230, end: 1380 }] }), overrides: [] },
];

export const loadSchedules = () => load<Schedule[]>(STORE_KEY, SEED);
export const formatClock = (minutes: number) => {
  const { hour, minute, am } = toParts(minutes);
  return `${pad(hour)}:${minute} ${am ? "AM" : "PM"}`;
};

// Days with the same hours are grouped so a schedule reads as one short line.
const groupDays = (days: Day[]) => {
  const groups: { names: string[]; slots: Slot[] }[] = [];
  days.forEach((day, i) => {
    if (!day.on) return;
    const key = JSON.stringify(day.slots);
    const match = groups.find((g) => JSON.stringify(g.slots) === key);
    if (match) match.names.push(SHORT_DAYS[i]);
    else groups.push({ names: [SHORT_DAYS[i]], slots: day.slots });
  });
  return groups;
};
const weeklyHours = (days: Day[]) => {
  const minutes = days.reduce((sum, d) => sum + (d.on ? d.slots.reduce((t, s) => t + Math.max(0, s.end - s.start), 0) : 0), 0);
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours} ${hours === 1 ? "hour" : "hours"} a week`;
};
const dayHours = (day: Day) => {
  const minutes = day.slots.reduce((t, s) => t + Math.max(0, s.end - s.start), 0);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};
const toolButton = "flex size-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-primary-50 hover:text-primary-700";
const shortZone =(tz: string) => tz.replace(/^\(\s*/, "").replace(/\)\s*/, " · ").replace(/,/g, ", ");
const slotProblem = (slots: Slot[]) => {
  if (slots.some((s) => s.end <= s.start)) return "must end after they start";
  const sorted = [...slots].sort((a, b) => a.start - b.start);
  return sorted.some((s, i) => i > 0 && s.start < sorted[i - 1].end) ? "must not overlap" : null;
};

const titleClass = "m-0 font-instrument-medium text-2xl font-medium leading-8 text-slate-900";
const titleStyle = { fontVariationSettings: '"wdth" 100' };
const iconButton = "flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900";

function Icon({ path, className = "size-5" }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
const PLUS = "M12 5v14M5 12h14";
const COPY = "M9 9h11v11H9zM5 15H4V4h11v1";

export function Toggle({ on, label, onChange }: { on: boolean; label: string; onChange: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onChange} className={`relative h-5 w-8.5 shrink-0 rounded-full outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 ${on ? "bg-primary-700" : "bg-slate-200"}`}>
      <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-all ${on ? "left-4" : "left-0.5"}`} />
    </button>
  );
}

const PERIODS = [
  { label: "Night", from: 0 },
  { label: "Morning", from: 360 },
  { label: "Afternoon", from: 720 },
  { label: "Evening", from: 1020 },
];
const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
};

/* A time picker: times grouped by part of the day, the chosen one ticked and scrolled into view.
   Pass `from` (the start time) on an end-time picker to show only later times with their durations. */
export function TimeSelect({ value, label, onChange, width = "w-28", disabled, from }: { value: number; label: string; onChange: (minutes: number) => void; width?: string; disabled?: boolean; from?: number }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number; width: number } | null>(null);
  const [active, setActive] = useState(value);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement | null>(null);
  const id = useId();
  const { props: hoverProps, pill } = useHoverHighlight("rounded-lg bg-slate-100");
  const options = from === undefined ? TIME_OPTIONS : TIME_OPTIONS.filter((m) => m > from);

  const show = () => {
    const r = button.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom;
    const up = below < 300 && r.top > below;
    const width = Math.max(r.width, from === undefined ? 0 : 176);
    setPos({ left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)), width, ...(up ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }) });
    setActive(value);
    setOpen(true);
  };
  const choose = (minutes: number) => {
    onChange(minutes);
    setOpen(false);
    button.current?.focus();
  };

  useLayoutEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>(`[data-minutes="${value}"]`)?.scrollIntoView({ block: "center" });
  }, [open]);
  useEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>(`[data-minutes="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);
  useEffect(() => {
    if (!open) return;
    const inside = (t: EventTarget | null) => !!t && (list.current?.contains(t as Node) || button.current?.contains(t as Node));
    const away = (e: Event) => !inside(e.target) && setOpen(false);
    const scrolled = (e: Event) => !list.current?.contains(e.target as Node) && setOpen(false);
    const close = () => setOpen(false);
    document.addEventListener("pointerdown", away);
    window.addEventListener("scroll", scrolled, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", away);
      window.removeEventListener("scroll", scrolled, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    const i = options.indexOf(active);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(options[Math.min(options.length - 1, i + 1)]);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(options[Math.max(0, i - 1)]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (options.includes(active)) choose(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") setOpen(false);
  };

  return (
    <span className={`relative inline-flex ${width}`}>
      <button
        ref={button}
        type="button"
        disabled={disabled}
        aria-label={`${label}: ${formatUpper(value)}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className={`field flex h-9 items-center justify-between gap-1 pl-3 pr-2 text-left text-sm tabular-nums transition disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${open ? "border-primary-700 ring-2 ring-primary-100" : "hover:border-slate-400"}`}
      >
        <span className="truncate">{formatUpper(value)}</span>
        <Icon path="M6 9l6 6 6-6" className={`size-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            {...hoverProps}
            ref={(el) => {
              list.current = el;
              hoverProps.ref(el);
            }}
            id={id}
            role="listbox"
            aria-label={label}
            className="pop-in scrollbar-soft fixed isolate z-250 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl"
            style={{ left: pos.left, top: pos.top, bottom: pos.bottom, minWidth: pos.width }}
          >
            {pill}
            {PERIODS.map((period, p) => {
              const end = PERIODS[p + 1]?.from ?? 1440;
              const times = options.filter((m) => m >= period.from && m < end);
              if (times.length === 0) return null;
              return (
                <div key={period.label} role="group" aria-label={period.label}>
                  <p className={`sticky top-0 z-10 -mx-1.5 mb-0.5 bg-white px-4.5 pb-1 pt-2.5 text-10 uppercase leading-3 tracking-wider text-slate-400 ${fontSemi}`}>{period.label}</p>
                  {times.map((m) => {
                    const selected = m === value;
                    return (
                      <button
                        key={m}
                        id={`${id}-${m}`}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        data-minutes={m}
                        tabIndex={-1}
                        onClick={() => choose(m)}
                        className={`flex h-9 w-full items-center gap-3 rounded-lg px-3 text-left text-sm leading-5 tabular-nums ${selected ? `bg-primary-50 text-primary-700 ${fontSemi}` : `text-slate-700 ${fontRegular}`} ${m === active && !selected ? "ring-1 ring-inset ring-slate-300" : ""}`}
                      >
                        <span className="flex-1 whitespace-nowrap">{formatUpper(m)}</span>
                        {from !== undefined && <span className={`whitespace-nowrap text-xs leading-4 ${selected ? "text-primary-600" : "text-slate-400"} ${fontRegular}`}>{formatDuration(m - from)}</span>}
                        {selected && <Icon path="M5 12.5l4.5 4.5L19 7.5" className="size-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </span>
  );
}

function SlotRange({ slot, label, onChange }: { slot: Slot; label: string; onChange: (next: Slot) => void }) {
  return (
    <div className="flex items-center gap-2">
      <TimeSelect value={slot.start} label={`${label} start`} onChange={(start) => onChange({ ...slot, start, end: slot.end > start ? slot.end : Math.min(start + 60, 1425) })} />
      <span aria-hidden="true" className="text-slate-400">
        –
      </span>
      <TimeSelect value={slot.end} from={slot.start} label={`${label} end`} onChange={(end) => onChange({ ...slot, end })} />
    </div>
  );
}

function DialogFooter({ onCancel, confirmLabel, onConfirm }: { onCancel: () => void; confirmLabel: string; onConfirm: () => void }) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
      <button type="button" onClick={onCancel} className={buttonClass("ghost", "md")}>
        Cancel
      </button>
      <button type="button" onClick={onConfirm} className={buttonClass("primary", "md")}>
        {confirmLabel}
      </button>
    </div>
  );
}

function NameDialog({ onClose, onContinue }: { onClose: () => void; onContinue: (name: string) => void }) {
  const [name, setName] = useState("");
  const { notify } = useApp();
  const submit = () => (name.trim() ? onContinue(name.trim()) : notify("Add a name first"));
  return (
    <Shell title="Add a new schedule" onClose={onClose} hideHeader width="max-w-120" radius="sm:rounded-xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
        <h2 className={`text-lg leading-7 text-slate-800 ${fontSemi}`}>Add a new schedule</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="flex transition hover:opacity-70">
          <img src={imgClose} alt="" width={20} height={20} className="size-5" />
        </button>
      </div>
      <form
        className="flex flex-col gap-2 px-6 py-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="schedule-name" className={`text-sm leading-5 text-slate-900 ${fontMedium}`}>
          Schedule name
        </label>
        <input id="schedule-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Weekday mornings" className="field" />
        <p className={`text-xs leading-4.5 text-slate-500 ${fontRegular}`}>It starts with Monday to Friday, 9:00 AM – 12:00 PM. You can change the hours next.</p>
      </form>
      <DialogFooter onCancel={onClose} confirmLabel="Continue" onConfirm={submit} />
    </Shell>
  );
}

function ConfirmDelete({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <Shell title="Delete schedule" onClose={onClose} hideHeader width="max-w-120" radius="sm:rounded-xl">
      <div className="flex flex-col gap-2 px-6 py-6">
        <h2 className={`text-lg leading-7 text-slate-800 ${fontSemi}`}>Delete this schedule?</h2>
        <p className={`text-sm leading-6 text-slate-500 ${fontRegular}`}>"{name}" will be removed. You can't restore it.</p>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
        <button type="button" onClick={onClose} className={buttonClass("ghost", "md")}>
          Cancel
        </button>
        <button type="button" onClick={onConfirm} className={buttonClass("danger", "md")}>
          Delete schedule
        </button>
      </div>
    </Shell>
  );
}

const weekdayIndex = (iso: string) => (fromIso(iso).getDay() + 6) % 7;
const rangeText = (slots: Slot[]) => slots.map((s) => `${formatUpper(s.start)} – ${formatUpper(s.end)}`).join(", ");

function OverrideDialog({ editing, days, overrides, onClose, onSubmit }: { editing?: Override; days: Day[]; overrides: Override[]; onClose: () => void; onSubmit: (dates: string[], unavailable: boolean, slots: Slot[]) => void }) {
  const { notify } = useApp();
  const now = new Date();
  const today = toIso(now);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const start = editing ? fromIso(editing.date) : now;
  const [month, setMonth] = useState(new Date(start.getFullYear(), start.getMonth(), 1));
  const [dates, setDates] = useState<string[]>(editing ? [editing.date] : []);
  const [unavailable, setUnavailable] = useState(editing?.unavailable ?? false);
  const [slots, setSlots] = useState<Slot[]>(editing?.slots ?? [{ ...DEFAULT_SLOT }]);
  const [touched, setTouched] = useState(!!editing);

  const overrideOn = new Map(overrides.filter((o) => o.id !== editing?.id).map((o) => [o.date, o]));
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const blanks = month.getDay();
  const atFirstMonth = month <= thisMonth;
  const sorted = [...dates].sort();

  const usual = (iso: string) => {
    const existing = overrideOn.get(iso);
    if (existing) return existing.unavailable ? "Override: unavailable" : `Override: ${rangeText(existing.slots)}`;
    const day = days[weekdayIndex(iso)];
    return day.on ? `Usually ${rangeText(day.slots)}` : "Usually unavailable";
  };
  const pick = (iso: string) => {
    // Start from the hours that day normally has, until the instructor edits them.
    if (!touched && dates.length === 0) {
      const day = days[weekdayIndex(iso)];
      if (day.on) setSlots(day.slots.map((s) => ({ ...s })));
    }
    if (editing) return setDates([iso]);
    setDates((list) => (list.includes(iso) ? list.filter((d) => d !== iso) : [...list, iso]));
  };
  const editSlots = (next: Slot[]) => {
    setTouched(true);
    setSlots(next);
  };
  const submit = () => {
    if (dates.length === 0) return notify("Pick at least one date");
    if (!unavailable) {
      const problem = slotProblem(slots);
      if (problem) return notify(`Hours ${problem}`);
    }
    onSubmit(dates, unavailable, slots);
  };
  const navButton = "flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40";
  const legendDot = "size-1.5 rounded-full";

  return (
    <Shell title="Add a date override" onClose={onClose} hideHeader width="max-w-213" radius="sm:rounded-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className={`text-lg leading-7 text-slate-900 ${fontSemi}`}>{editing ? "Edit date override" : "Add a date override"}</h2>
          <p className={`mt-0.5 text-13 leading-5 text-slate-500 ${fontRegular}`}>{editing ? "Change the date or the hours." : "Pick one or more dates, then set your hours for them."}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
          <Icon path="M6 6l12 12M18 6L6 18" className="size-4.5" />
        </button>
      </div>

      <div className="grid md:grid-cols-2">
        <div className="px-6 py-5 md:border-r md:border-slate-200">
          <div className="flex items-center justify-between gap-3">
            <p className={`text-base leading-6 text-slate-900 ${fontSemi}`} aria-live="polite">
              {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
            <div className="flex items-center gap-1.5">
              {!atFirstMonth && (
                <button type="button" onClick={() => setMonth(thisMonth)} className={`h-8 rounded-lg px-2.5 text-13 leading-5 text-primary-700 transition hover:bg-primary-50 ${fontSemi}`}>
                  Today
                </button>
              )}
              <button type="button" aria-label="Previous month" disabled={atFirstMonth} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className={navButton}>
                <Icon path="M15 6l-6 6 6 6" className="size-4" />
              </button>
              <button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className={navButton}>
                <Icon path="M9 6l6 6-6 6" className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-y-1">
            {CALENDAR_DAYS.map((d, i) => (
              <span key={d} className={`pb-2 text-center text-xs leading-5 ${days[(i + 6) % 7].on ? "text-slate-600" : "text-slate-300"} ${fontMedium}`}>
                {d}
              </span>
            ))}
            {Array.from({ length: blanks }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const iso = toIso(new Date(month.getFullYear(), month.getMonth(), i + 1));
              const selected = dates.includes(iso);
              const isToday = iso === today;
              const past = iso < today;
              const available = days[weekdayIndex(iso)].on;
              const hasOverride = overrideOn.has(iso);
              const tone = selected
                ? `bg-primary-700 text-white ${fontSemi}`
                : isToday
                  ? `bg-primary-50 text-primary-700 ring-1 ring-primary-300 hover:bg-primary-100 ${fontSemi}`
                  : past
                    ? `text-slate-300 ${fontRegular}`
                    : available
                      ? `text-slate-900 hover:bg-slate-100 ${fontMedium}`
                      : `text-slate-400 hover:bg-slate-100 ${fontRegular}`;
              const dot = past ? "" : hasOverride ? (selected ? "border border-white" : "border border-primary-600") : available ? (selected ? "bg-white" : "bg-primary-600") : "";
              return (
                <div key={iso} className="flex justify-center">
                  <button
                    type="button"
                    disabled={past}
                    aria-pressed={selected}
                    aria-label={`${formatOverrideDate(iso)}${isToday ? ", today" : ""}. ${usual(iso)}`}
                    title={past ? undefined : usual(iso)}
                    onClick={() => pick(iso)}
                    className={`relative flex size-10 flex-col items-center justify-center rounded-xl text-sm leading-5 tabular-nums transition disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 ${tone}`}
                  >
                    {i + 1}
                    <span aria-hidden="true" className={`absolute bottom-1.5 size-1 rounded-full ${dot}`} />
                  </button>
                </div>
              );
            })}
          </div>

          <ul className={`mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3 text-xs leading-4 text-slate-500 ${fontRegular}`}>
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-primary-50 ring-1 ring-primary-300" />
              Today
            </li>
            <li className="flex items-center gap-1.5">
              <span className={`${legendDot} bg-primary-600`} />
              Available
            </li>
            <li className="flex items-center gap-1.5">
              <span className={`${legendDot} border border-primary-600`} />
              Has override
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-slate-400">12</span>
              Not available
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-5 border-t border-slate-200 px-6 py-5 md:border-t-0">
          <div>
            <p className={`text-sm leading-5 text-slate-900 ${fontSemi}`}>
              {sorted.length === 0 ? "No dates picked" : sorted.length === 1 ? "1 date picked" : `${sorted.length} dates picked`}
            </p>
            {sorted.length === 0 ? (
              <p className={`mt-1 text-13 leading-5 text-slate-500 ${fontRegular}`}>Pick dates on the calendar. Green dots show the days you usually work.</p>
            ) : (
              <ul className="scrollbar-soft mt-2 flex max-h-36 flex-col gap-1.5 overflow-y-auto">
                {sorted.map((iso) => (
                  <li key={iso} className="flex items-center gap-3 rounded-xl bg-slate-50 py-2 pl-3 pr-1.5">
                    <div className="min-w-0 flex-1">
                      <p className={`text-13 leading-5 text-slate-900 ${fontMedium}`}>{fromIso(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                      <p className={`truncate text-xs leading-4 text-slate-500 ${fontRegular}`}>{usual(iso)}</p>
                    </div>
                    {!editing && (
                      <button type="button" aria-label={`Remove ${formatOverrideDate(iso)}`} onClick={() => pick(iso)} className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-900">
                        <Icon path="M6 6l12 12M18 6L6 18" className="size-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-100 pt-5">
            <p className={`text-sm leading-5 text-slate-900 ${fontSemi}`}>New hours</p>
            <p className={`mt-0.5 text-13 leading-5 text-slate-500 ${fontRegular}`}>These replace your weekly hours on the picked dates.</p>
            <div className={`mt-3 flex flex-col gap-2 transition-opacity ${unavailable ? "pointer-events-none opacity-40" : ""}`} aria-hidden={unavailable}>
              {slots.map((slot, i) => (
                <div key={i} className="flex items-center gap-2">
                  <SlotRange slot={slot} label={`Override hours ${i + 1}`} onChange={(next) => editSlots(slots.map((s, j) => (j === i ? next : s)))} />
                  {i > 0 && (
                    <button type="button" aria-label={`Remove hours ${i + 1}`} onClick={() => editSlots(slots.filter((_, j) => j !== i))} className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                      <Icon path="M6 6l12 12M18 6L6 18" className="size-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => editSlots([...slots, { ...DEFAULT_SLOT }])} className={`flex h-8 w-fit items-center gap-1.5 rounded-lg px-2 text-13 leading-5 text-primary-700 transition hover:bg-primary-50 ${fontSemi}`}>
                <Icon path={PLUS} className="size-4" />
                Add time
              </button>
            </div>
            <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3">
              <span>
                <span className={`block text-sm leading-5 text-slate-900 ${fontMedium}`}>Unavailable all day</span>
                <span className={`block text-xs leading-4.5 text-slate-500 ${fontRegular}`}>Students can't book you on these dates.</span>
              </span>
              <Toggle on={unavailable} label="Unavailable all day" onChange={() => setUnavailable(!unavailable)} />
            </label>
          </div>
        </div>
      </div>
      <DialogFooter onCancel={onClose} confirmLabel={editing ? "Save override" : dates.length > 1 ? `Add ${dates.length} overrides` : "Add override"} onConfirm={submit} />
    </Shell>
  );
}

function PageHeading({ action }: { action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-6 md:px-7">
      <div>
        <h1 className={titleClass} style={titleStyle}>
          My Availability
        </h1>
        <p className={`mt-1 text-sm leading-5 text-slate-500 ${fontRegular}`}>Set the hours students can book you. New live sessions use your default schedule.</p>
      </div>
      {action}
    </div>
  );
}

function DefaultBadge() {
  return <span className={`inline-flex h-5 items-center rounded-full bg-primary-100 px-2 text-11 leading-4 text-primary-700 ${fontSemi}`}>Default</span>;
}


function Editor({ schedule, onSave, onDelete, onMakeDefault }: { schedule: Schedule; onSave: (next: Schedule) => void; onDelete: () => void; onMakeDefault: () => void }) {
  const { notify } = useApp();
  const [draft, setDraft] = useState(schedule);
  const [renaming, setRenaming] = useState(false);
  const [overrideDialog, setOverrideDialog] = useState<{ editing?: Override } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const setDay = (i: number, next: (day: Day) => Day) => setDraft((d) => ({ ...d, days: d.days.map((day, j) => (j === i ? next(day) : day)) }));
  const copyTo = (from: number, targets: number[]) => {
    const slots = draft.days[from].slots.map((s) => ({ ...s }));
    setDraft((d) => ({ ...d, days: d.days.map((day, j) => (targets.includes(j) ? { on: true, slots: slots.map((s) => ({ ...s })) } : day)) }));
    notify(`${FULL_DAYS[from]} hours copied to ${targets.length === 7 ? "every day" : targets.length === 5 ? "weekdays" : "the weekend"}`);
  };
  const leave = () => {
    if (JSON.stringify(draft) !== JSON.stringify(schedule)) notify("Unsaved changes discarded");
    openInstructorAvailability();
  };
  const submit = () => {
    if (!draft.name.trim()) return notify("Add a schedule name first");
    for (let i = 0; i < draft.days.length; i++) {
      const problem = draft.days[i].on ? slotProblem(draft.days[i].slots) : null;
      if (problem) return notify(`${SHORT_DAYS[i]} hours ${problem}`);
    }
    onSave({ ...draft, name: draft.name.trim() });
    setRenaming(false);
    notify("Schedule saved");
  };

  const dirty = JSON.stringify(draft) !== JSON.stringify(schedule);
  const cardTitle = `text-base leading-6 text-slate-900 ${fontSemi}`;
  const cardText = `mt-0.5 text-13 leading-5 text-slate-500 ${fontRegular}`;
  const sortedOverrides = [...draft.overrides].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <main className="flex flex-1 flex-col bg-white">
      <div className="sticky top-16 z-10 border-b border-slate-200 bg-white px-4 py-4 md:top-18 md:px-7">
        <button type="button" onClick={leave} className={`flex items-center gap-1.5 text-13 leading-5 text-slate-500 transition hover:text-slate-900 ${fontMedium}`}>
          <Icon path="M15 6l-6 6 6 6" className="size-4" />
          All schedules
        </button>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {renaming ? (
                <input autoFocus aria-label="Schedule name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} onBlur={() => setRenaming(false)} onKeyDown={(e) => (e.key === "Enter" || e.key === "Escape") && setRenaming(false)} className={`field h-9 w-72 max-w-full text-base ${fontSemi}`} />
              ) : (
                <button type="button" onClick={() => setRenaming(true)} aria-label={`Rename ${draft.name}`} className="group flex min-w-0 items-center gap-2.5 rounded-lg text-left">
                  <h1 className="m-0 truncate font-instrument-medium text-2xl font-medium leading-8 text-slate-900" style={titleStyle}>
                    {draft.name}
                  </h1>
                  <span className={`flex h-7 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2 text-xs leading-4 text-slate-500 transition group-hover:border-primary-200 group-hover:bg-primary-50 group-hover:text-primary-700 ${fontMedium}`}>
                    <HugeiconsIcon icon={PencilEdit02Icon} size={14} strokeWidth={1.8} aria-hidden="true" />
                    Rename
                  </span>
                </button>
              )}
              {schedule.isDefault && <DefaultBadge />}
            </div>
            <p className={`mt-1 text-13 leading-5 text-slate-500 ${fontRegular}`}>
              {weeklyHours(draft.days)} · {shortZone(draft.timezone)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {dirty && <span className={`mr-1 hidden text-13 leading-5 text-slate-500 sm:inline ${fontMedium}`}>Unsaved changes</span>}
            <ActionMenu
              label={`More actions for ${draft.name}`}
              triggerClass="flex size-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              trigger={
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                  <circle cx="5" cy="12" r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="19" cy="12" r="1.8" />
                </svg>
              }
              items={[
                { label: "Set as default", disabled: schedule.isDefault, onClick: onMakeDefault },
                { label: "Rename", onClick: () => setRenaming(true) },
                { label: "Delete schedule", danger: true, icon: <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={1.8} aria-hidden="true" />, onClick: () => (schedule.isDefault ? notify("Set another schedule as default before deleting this one") : setConfirming(true)) },
              ]}
            />
            {dirty ? (
              <button type="button" onClick={submit} className={buttonClass("primary", "md")}>
                Save changes
              </button>
            ) : (
              <span className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm leading-5 text-primary-700 ${fontSemi}`}>
                <Icon path="M5 12.5l4.5 4.5L19 7.5" className="size-4" />
                Saved
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid w-full max-w-6xl items-start gap-6 px-4 py-6 md:px-7 lg:grid-cols-5">
        <section aria-labelledby="weekly-hours" className="overflow-hidden rounded-2xl border border-slate-200 lg:col-span-3">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 id="weekly-hours" className={cardTitle}>
                Weekly hours
              </h2>
              <p className={cardText}>When students can usually book you.</p>
            </div>
            <ActionMenu
              label={`Time zone: ${draft.timezone}`}
              triggerClass={`flex h-9 items-center gap-2 rounded-xl border border-slate-300 px-3 text-13 leading-5 text-slate-700 transition hover:border-slate-400 ${fontMedium}`}
              trigger={
                <>
                  <Icon path="M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" className="size-4 text-slate-500" />
                  {shortZone(draft.timezone)}
                  <Icon path="M6 9l6 6 6-6" className="size-4 text-slate-400" />
                </>
              }
              items={TIMEZONES.map((tz) => ({ label: shortZone(tz), onClick: () => setDraft({ ...draft, timezone: tz }) }))}
            />
          </header>
          <ul className="divide-y divide-slate-100">
            {draft.days.map((day, i) => (
              <li key={DAY_NAMES[i]} className={`group flex flex-wrap items-start gap-x-4 gap-y-2 px-5 py-3 transition-colors sm:flex-nowrap ${day.on ? "hover:bg-slate-50" : "bg-slate-50"}`}>
                <div className="flex h-10 w-32 shrink-0 items-center gap-3">
                  <Toggle on={day.on} label={`${FULL_DAYS[i]} available`} onChange={() => setDay(i, (d) => ({ ...d, on: !d.on }))} />
                  <span className={`text-sm leading-5 ${day.on ? `text-slate-900 ${fontSemi}` : `text-slate-500 ${fontMedium}`}`}>{FULL_DAYS[i]}</span>
                </div>
                {day.on ? (
                  <>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      {day.slots.map((slot, j) => (
                        <div key={j} className="flex flex-wrap items-center gap-2">
                          <SlotRange slot={slot} label={`${FULL_DAYS[i]} hours ${j + 1}`} onChange={(next) => setDay(i, (d) => ({ ...d, slots: d.slots.map((s, k) => (k === j ? next : s)) }))} />
                          {j > 0 && (
                            <button type="button" title="Remove these hours" aria-label={`Remove ${FULL_DAYS[i]} hours ${j + 1}`} onClick={() => setDay(i, (d) => ({ ...d, slots: d.slots.filter((_, k) => k !== j) }))} className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                              <Icon path="M6 6l12 12M18 6L6 18" className="size-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="relative flex h-10 shrink-0 items-center justify-end sm:w-18">
                      <span className={`hidden rounded-full bg-slate-100 px-2 py-0.5 text-xs leading-4 text-slate-500 transition sm:inline sm:group-hover:opacity-0 sm:group-focus-within:opacity-0 ${fontMedium}`}>{dayHours(day)}</span>
                      <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs transition sm:absolute sm:right-0 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                        <button type="button" title="Add another time range" aria-label={`Add ${FULL_DAYS[i]} hours`} onClick={() => setDay(i, (d) => ({ ...d, slots: [...d.slots, { ...DEFAULT_SLOT }] }))} className={toolButton}>
                          <Icon path={PLUS} className="size-4" />
                        </button>
                        <ActionMenu
                          label={`Copy ${FULL_DAYS[i]} hours to other days`}
                          trigger={<Icon path={COPY} className="size-4" />}
                          triggerClass={toolButton}
                          items={[
                            { label: "Copy to weekdays (Mon – Fri)", onClick: () => copyTo(i, [0, 1, 2, 3, 4]) },
                            { label: "Copy to weekend (Sat – Sun)", onClick: () => copyTo(i, [5, 6]) },
                            { label: "Copy to every day", onClick: () => copyTo(i, [0, 1, 2, 3, 4, 5, 6]) },
                          ]}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <span className={`flex h-10 items-center text-sm leading-5 text-slate-400 ${fontRegular}`}>Unavailable</span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="date-overrides" className="overflow-hidden rounded-2xl border border-slate-200 lg:col-span-2">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 id="date-overrides" className={cardTitle}>
                Date overrides
              </h2>
              <p className={cardText}>Change your hours for specific dates, like holidays.</p>
            </div>
            {sortedOverrides.length > 0 && (
              <button type="button" onClick={() => setOverrideDialog({})} className={buttonClass("secondary", "md")}>
                <Icon path={PLUS} className="size-4" />
                Add
              </button>
            )}
          </header>
          {sortedOverrides.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <Icon path="M7 3v3M17 3v3M4 8h16M5 5h14v15H5zM9 14l2 2 4-4" className="size-5.5" />
              </span>
              <div>
                <p className={`text-sm leading-5 text-slate-900 ${fontSemi}`}>No overrides yet</p>
                <p className={`mt-0.5 text-13 leading-5 text-slate-500 ${fontRegular}`}>Taking a day off or working late once? Add it here.</p>
              </div>
              <button type="button" onClick={() => setOverrideDialog({})} className={buttonClass("soft", "md")}>
                <Icon path={PLUS} className="size-4" />
                Add an override
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {sortedOverrides.map((o) => {
                const date = fromIso(o.date);
                return (
                  <li key={o.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-100">
                      <span className={`text-10 uppercase leading-3 text-slate-500 ${fontSemi}`}>{date.toLocaleDateString("en-US", { month: "short" })}</span>
                      <span className={`text-base leading-5 text-slate-900 ${fontSemi}`}>{date.getDate()}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm leading-5 text-slate-900 ${fontMedium}`}>{date.toLocaleDateString("en-US", { weekday: "long" })}</p>
                      <p className={`truncate text-13 leading-5 ${o.unavailable ? "text-red-600" : "text-slate-500"} ${fontRegular}`}>{o.unavailable ? "Unavailable all day" : o.slots.map((s) => `${formatUpper(s.start)} – ${formatUpper(s.end)}`).join(", ")}</p>
                    </div>
                    <button type="button" title="Edit" aria-label={`Edit override for ${formatOverrideDate(o.date)}`} onClick={() => setOverrideDialog({ editing: o })} className={iconButton}>
                      <HugeiconsIcon icon={PencilEdit02Icon} size={18} strokeWidth={1.8} aria-hidden="true" />
                    </button>
                    <button type="button" title="Delete" aria-label={`Delete override for ${formatOverrideDate(o.date)}`} onClick={() => setDraft({ ...draft, overrides: draft.overrides.filter((item) => item.id !== o.id) })} className={`${iconButton} hover:bg-red-50 hover:text-red-600`}>
                      <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={1.8} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
      {overrideDialog && (
        <OverrideDialog
          editing={overrideDialog.editing}
          days={draft.days}
          overrides={draft.overrides}
          onClose={() => setOverrideDialog(null)}
          onSubmit={(dates, unavailable, slots) => {
            const editing = overrideDialog.editing;
            setDraft((d) => {
              const keep = d.overrides.filter((o) => o.id !== editing?.id && !dates.includes(o.date));
              const added = dates.map((date) => ({ id: `override-${date}`, date, unavailable, slots: slots.map((s) => ({ ...s })) }));
              return { ...d, overrides: [...keep, ...added] };
            });
            setOverrideDialog(null);
          }}
        />
      )}
      {confirming && <ConfirmDelete name={schedule.name} onClose={() => setConfirming(false)} onConfirm={onDelete} />}
    </main>
  );
}

export default function InstructorAvailability({ scheduleId }: { scheduleId?: string }) {
  const { notify } = useApp();
  const [schedules, setSchedules] = useState<Schedule[]>(() => load(STORE_KEY, SEED));
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Schedule | null>(null);

  useEffect(() => save(STORE_KEY, schedules), [schedules]);

  const makeDefault = (id: string) => {
    setSchedules((list) => list.map((s) => ({ ...s, isDefault: s.id === id })));
    notify("Default schedule updated");
  };
  const remove = (id: string) => {
    setSchedules((list) => list.filter((s) => s.id !== id));
    notify("Schedule deleted");
  };

  const open = schedules.find((s) => s.id === scheduleId);
  if (open) {
    return (
      <Editor
        key={open.id}
        schedule={open}
        onSave={(next) => setSchedules((list) => list.map((s) => (s.id === next.id ? { ...next, isDefault: s.isDefault } : s)))}
        onMakeDefault={() => makeDefault(open.id)}
        onDelete={() => {
          remove(open.id);
          openInstructorAvailability();
        }}
      />
    );
  }

  return (
    <main className="flex flex-1 flex-col bg-white">
      <PageHeading
        action={
          <button type="button" onClick={() => setAdding(true)} className={buttonClass("primary", "md")}>
            <Icon path={PLUS} className="size-4" />
            New schedule
          </button>
        }
      />
      <div className="w-full max-w-6xl px-4 py-6 md:px-7">
        <p className={`mb-3 text-13 leading-5 text-slate-500 ${fontRegular}`}>
          {schedules.length} {schedules.length === 1 ? "schedule" : "schedules"}
        </p>
        <ul className="overflow-hidden rounded-2xl border border-slate-200">
          {[...schedules]
            .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
            .map((s) => {
              const groups = groupDays(s.days);
              return (
                <li key={s.id} className="relative flex items-start gap-4 border-b border-slate-200 bg-white px-4 py-4 transition-colors last:border-b-0 hover:bg-primary-50 sm:px-5">
                  <button type="button" onClick={() => openInstructorAvailability(s.id)} className="flex min-w-0 flex-1 flex-col gap-3 text-left after:absolute after:inset-0 md:flex-row md:items-center md:gap-6">
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className={`text-15 leading-5.5 text-slate-900 ${fontSemi}`}>{s.name}</span>
                        {s.isDefault && <DefaultBadge />}
                      </span>
                      {groups.length === 0 ? (
                        <span className={`text-sm leading-5 text-slate-500 ${fontRegular}`}>Unavailable all week</span>
                      ) : (
                        <span className="flex flex-col gap-0.5">
                          {groups.map((g) => (
                            <span key={g.names.join()} className={`text-13 leading-5 text-slate-600 ${fontRegular}`}>
                              <span className={`text-slate-800 ${fontMedium}`}>{g.names.join(", ")}</span>
                              <span className="text-slate-400"> · </span>
                              {g.slots.map((slot) => `${formatUpper(slot.start)} – ${formatUpper(slot.end)}`).join(", ")}
                            </span>
                          ))}
                        </span>
                      )}
                      <span className={`text-xs leading-4.5 text-slate-400 ${fontRegular}`}>
                        {weeklyHours(s.days)} · {shortZone(s.timezone)}
                        {s.overrides.length > 0 && ` · ${s.overrides.length} date ${s.overrides.length === 1 ? "override" : "overrides"}`}
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-1">
                      {s.days.map((d, i) => (
                        <span key={DAY_NAMES[i]} aria-hidden="true" className={`flex size-7 items-center justify-center rounded-lg text-11 leading-4 ${d.on ? `bg-primary-100 text-primary-700 ${fontSemi}` : `bg-slate-100 text-slate-400 ${fontMedium}`}`}>
                          {SHORT_DAYS[i].slice(0, 2)}
                        </span>
                      ))}
                    </span>
                  </button>
                  <ActionMenu
                    label={`More actions for ${s.name}`}
                    triggerClass="relative flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-900"
                    trigger={
                      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                    <circle cx="12" cy="5" r="1.7" />
                    <circle cx="12" cy="12" r="1.7" />
                    <circle cx="12" cy="19" r="1.7" />
                  </svg>
                }
                items={[
                  { label: "Edit", onClick: () => openInstructorAvailability(s.id) },
                  { label: "Set as Default", disabled: s.isDefault, onClick: () => makeDefault(s.id) },
                  {
                    label: "Duplicate",
                    onClick: () => {
                      const copy = { ...s, id: `schedule-${Date.now()}`, name: `${s.name} (Copy)`, isDefault: false };
                      setSchedules((list) => [copy, ...list]);
                      notify("Schedule duplicated");
                    },
                  },
                  { label: "Delete", danger: true, disabled: s.isDefault, onClick: () => setDeleting(s) },
                ]}
              />
            </li>
              );
            })}
        </ul>
      </div>
      {adding && (
        <NameDialog
          onClose={() => setAdding(false)}
          onContinue={(name) => {
            const id = `schedule-${Date.now()}`;
            setSchedules((list) => [{ id, name, isDefault: false, timezone: TZ, days: WEEKDAYS.map((d) => ({ on: d.on, slots: d.slots.map((s) => ({ ...s })) })), overrides: [] }, ...list]);
            setAdding(false);
            openInstructorAvailability(id);
          }}
        />
      )}
      {deleting && (
        <ConfirmDelete
          name={deleting.name}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            remove(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </main>
  );
}
