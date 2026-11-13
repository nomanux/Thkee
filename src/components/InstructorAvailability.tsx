import { useEffect, useState, type ReactNode } from "react";
import { fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, openInstructorAvailability, save, useApp } from "../store";
import { Checkbox } from "./InstructorAssignments";
import { ActionMenu } from "./Menus";
import { Shell } from "./Overlays";
import { buttonClass } from "./Button"

const imgClose = "/assets/53e9a.svg";
const imgPlusSmall = "/assets/51771.svg";

type Slot = { start: number; end: number };
type Day = { on: boolean; slots: Slot[] };
type Override = { id: string; date: string; unavailable: boolean; slots: Slot[] };
export type Schedule = { id: string; name: string; isDefault: boolean; timezone: string; days: Day[]; overrides: Override[] };

const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CALENDAR_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const TIMEZONES = ["( GMT +3:00) Riyadh", "( GMT +4:00) Dubai", "( GMT +5:00) Karachi", "( GMT +6:00) Astana,Dhaka", "( GMT +0:00) London"];
const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => i * 15);
const STORE_KEY = "thkee.instructorAvailability";
const DEFAULT_SLOT: Slot = { start: 540, end: 720 };

const pad = (n: number) => String(n).padStart(2, "0");
const toParts = (minutes: number) => ({ hour: Math.floor(minutes / 60) % 12 || 12, minute: pad(minutes % 60), am: minutes < 720 });
const formatInput = (minutes: number) => {
  const { hour, minute, am } = toParts(minutes);
  return `${pad(hour)}:${minute}${am ? "am" : "pm"}`;
};
const formatShort = (minutes: number) => {
  const { hour, minute, am } = toParts(minutes);
  return `${hour}:${minute}${am ? "am" : "pm"}`;
};
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
  { id: "regular", name: "Regular Working Hours", isDefault: false, timezone: TZ, days: daysFrom(REGULAR), overrides: [] },
  ...[1, 2, 3, 4, 5].map((n) => ({ id: `evening-${n}`, name: "Evening Schedule", isDefault: false, timezone: TZ, days: daysFrom(REGULAR), overrides: [] })),
  { id: "class-regular", name: "Class Schedule for Regular", isDefault: true, timezone: TZ, days: daysFrom({ 0: [{ ...DEFAULT_SLOT }, { start: 780, end: 1020 }], 1: [{ ...DEFAULT_SLOT }], 4: [{ ...DEFAULT_SLOT }] }), overrides: SEED_OVERRIDES },
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
const listSummary = (days: Day[]) => groupDays(days).map((g) => `${g.names.join(", ")}, ${g.slots.map((s) => `${formatUpper(s.start)} - ${formatUpper(s.end)}`).join(" | ")}`);
const slotProblem = (slots: Slot[]) => {
  if (slots.some((s) => s.end <= s.start)) return "must end after they start";
  const sorted = [...slots].sort((a, b) => a.start - b.start);
  return sorted.some((s, i) => i > 0 && s.start < sorted[i - 1].end) ? "must not overlap" : null;
};

const titleClass = "m-0 font-instrument-medium text-2xl font-medium leading-8 text-slate-900";
const titleStyle = { fontVariationSettings: '"wdth" 100' };
const iconButton = "flex size-8.25 shrink-0 items-center justify-center rounded-md text-slate-700 transition hover:bg-slate-150";

function Icon({ path, className = "size-5" }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
const PLUS = "M12 5v14M5 12h14";
const COPY = "M9 9h11v11H9zM5 15H4V4h11v1";
const TRASH = "M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6";
const PENCIL = "M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19l-4 1z";

export function Toggle({ on, label, onChange }: { on: boolean; label: string; onChange: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onChange} className={`relative h-5 w-8.5 shrink-0 rounded-full transition-colors ${on ? "bg-slate-800" : "bg-slate-200"}`}>
      <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-all ${on ? "left-4" : "left-0.5"}`} />
    </button>
  );
}

export function TimeSelect({ value, label, onChange, width = "w-26.25", disabled }: { value: number; label: string; onChange: (minutes: number) => void; width?: string; disabled?: boolean }) {
  return (
    <span className={`relative inline-flex ${width}`}>
      <select aria-label={label} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className="field pl-3 pr-7">
        {TIME_OPTIONS.map((minutes) => (
          <option key={minutes} value={minutes}>
            {formatInput(minutes)}
          </option>
        ))}
      </select>
    </span>
  );
}

function SlotRange({ slot, label, onChange }: { slot: Slot; label: string; onChange: (next: Slot) => void }) {
  return (
    <div className="flex items-center gap-2.5">
      <TimeSelect value={slot.start} label={`${label} start`} onChange={(start) => onChange({ ...slot, start })} />
      <span aria-hidden="true" className="text-slate-600">
        -
      </span>
      <TimeSelect value={slot.end} label={`${label} end`} onChange={(end) => onChange({ ...slot, end })} />
    </div>
  );
}

function DialogFooter({ onCancel, confirmLabel, onConfirm }: { onCancel: () => void; confirmLabel: string; onConfirm: () => void }) {
  return (
    <div className="flex items-center justify-end gap-8 border-t border-slate-200 px-6 py-6">
      <button type="button" onClick={onCancel} className={`text-base leading-6 text-slate-800 transition hover:text-slate-500 ${fontMedium}`}>
        Cancel
      </button>
      <button type="button" onClick={onConfirm} className={`${buttonClass("yellow", "lg")}`}>
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
        <label htmlFor="schedule-name" className={`text-base leading-6 text-slate-900 ${fontRegular}`}>
          Name
        </label>
        <input id="schedule-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Working hour" className="field" />
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
      <div className="flex items-center justify-end gap-8 border-t border-slate-200 px-6 py-4">
        <button type="button" onClick={onClose} className={`text-base leading-6 text-slate-800 transition hover:text-slate-500 ${fontMedium}`}>
          Cancel
        </button>
        <button type="button" onClick={onConfirm} className={`h-11 rounded-lg bg-red-500 px-5 text-base leading-5 text-white transition hover:bg-red-600 ${fontMedium}`}>
          Yes, delete
        </button>
      </div>
    </Shell>
  );
}

function OverrideDialog({ editing, onClose, onSubmit }: { editing?: Override; onClose: () => void; onSubmit: (dates: string[], unavailable: boolean, slots: Slot[]) => void }) {
  const { notify } = useApp();
  const today = toIso(new Date());
  const start = editing ? fromIso(editing.date) : new Date();
  const [month, setMonth] = useState(new Date(start.getFullYear(), start.getMonth(), 1));
  const [dates, setDates] = useState<string[]>(editing ? [editing.date] : []);
  const [unavailable, setUnavailable] = useState(editing?.unavailable ?? false);
  const [slots, setSlots] = useState<Slot[]>(editing?.slots ?? [{ ...DEFAULT_SLOT }]);

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const blanks = month.getDay();
  const pick = (iso: string) => {
    if (editing) return setDates([iso]);
    setDates((list) => (list.includes(iso) ? list.filter((d) => d !== iso) : [...list, iso]));
  };
  const submit = () => {
    if (dates.length === 0) return notify("Select at least one date");
    if (!unavailable) {
      const problem = slotProblem(slots);
      if (problem) return notify(`Hours ${problem}`);
    }
    onSubmit(dates, unavailable, slots);
  };
  const navButton = "flex size-9 items-center justify-center rounded-md bg-slate-25 text-slate-800 transition hover:bg-slate-150";

  return (
    <Shell title="Select the dates to override" onClose={onClose} hideHeader width="max-w-213" radius="sm:rounded-xl">
      <div className="grid gap-6 px-6 py-6 md:grid-cols-2 md:gap-0">
        <div className="md:border-r md:border-slate-200 md:pr-6">
          <h2 className={`text-lg leading-7 text-slate-800 ${fontSemi}`}>Select the dates to override</h2>
          <div className="mt-7 flex items-center justify-between">
            <p className={`text-base leading-6 text-slate-800 ${fontSemi}`} aria-live="polite">
              {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
            <div className="flex gap-1.5">
              <button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className={navButton}>
                <Icon path="M15 6l-6 6 6 6" className="size-4" />
              </button>
              <button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className={navButton}>
                <Icon path="M9 6l6 6-6 6" className="size-4" />
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-7 justify-items-center gap-y-3">
            {CALENDAR_DAYS.map((d) => (
              <span key={d} className={`text-sm leading-5 text-slate-400 ${fontRegular}`}>
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
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={past}
                  aria-pressed={selected}
                  aria-label={formatOverrideDate(iso)}
                  onClick={() => pick(iso)}
                  className={`flex size-8 items-center justify-center rounded-full text-sm leading-5 transition disabled:cursor-not-allowed disabled:text-slate-300 focus-visible:outline focus-visible:outline-1 focus-visible:outline-secondary-600 ${selected ? "bg-secondary-100 text-slate-800" : isToday ? "bg-secondary-500 text-slate-800" : "text-slate-700 hover:outline hover:outline-1 hover:outline-secondary-600 disabled:hover:outline-0"} ${fontRegular}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
        <div className="md:pl-6">
          <h3 className={`text-base leading-6 text-slate-600 ${fontSemi}`}>Which hours are you available</h3>
          <p className={`mt-1 text-xs leading-4.5 text-slate-500 ${fontRegular}`}>Set your time to take your session</p>
          <div className="mt-8 flex flex-col gap-3">
            {!unavailable &&
              slots.map((slot, i) => (
                <div key={i} className="flex items-center gap-2">
                  <SlotRange slot={slot} label={`Override hours ${i + 1}`} onChange={(next) => setSlots((list) => list.map((s, j) => (j === i ? next : s)))} />
                  {i === 0 ? (
                    <button type="button" aria-label="Add hours" onClick={() => setSlots((list) => [...list, { ...DEFAULT_SLOT }])} className={iconButton}>
                      <Icon path={PLUS} />
                    </button>
                  ) : (
                    <button type="button" aria-label={`Remove hours ${i + 1}`} onClick={() => setSlots((list) => list.filter((_, j) => j !== i))} className={iconButton}>
                      <Icon path={TRASH} />
                    </button>
                  )}
                </div>
              ))}
            <div className="mt-1 flex items-center gap-3">
              <Toggle on={unavailable} label="Mark unavailable all day" onChange={() => setUnavailable(!unavailable)} />
              <span className={`text-sm leading-5 text-slate-800 ${fontRegular}`}>Mark unavailable all day</span>
            </div>
          </div>
        </div>
      </div>
      <DialogFooter onCancel={onClose} confirmLabel={editing ? "Save Override" : "Add Override"} onConfirm={submit} />
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
        <p className={`mt-1 text-base leading-6 text-slate-500 ${fontRegular}`}>Select a schedule below to edit or create a new one for your event types.</p>
      </div>
      {action}
    </div>
  );
}

function DefaultBadge() {
  return <span className={`inline-flex h-5 items-center rounded-sm border border-emerald-200 bg-emerald-50 px-2 text-10 leading-4 text-emerald-600 ${fontMedium}`}>Default</span>;
}

function AddOverrideButton({ onClick, className = "h-10.75 px-4 text-base" }: { onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`flex items-center justify-center gap-2.5 rounded-lg bg-slate-150 leading-5 text-slate-800 transition hover:bg-slate-200 ${className} ${fontMedium}`}>
      <Icon path={PLUS} />
      Add Override
    </button>
  );
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

  return (
    <main className="flex flex-1 flex-col bg-white">
      <PageHeading />
      <div className="flex flex-1 flex-col px-4 py-6 md:px-7">
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-3.5">
            <div className="flex min-w-0 items-center gap-6">
              <button type="button" onClick={leave} aria-label="Back to schedules" className="flex shrink-0 text-slate-800 transition hover:opacity-70">
                <Icon path="M20 12H4M10 6l-6 6 6 6" className="size-4.5" />
              </button>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  {renaming ? (
                    <input autoFocus aria-label="Schedule name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} onBlur={() => setRenaming(false)} onKeyDown={(e) => (e.key === "Enter" || e.key === "Escape") && setRenaming(false)} className={`h-7 rounded-sm border border-slate-300 px-2 text-sm text-slate-900 outline-none focus:border-slate-800 ${fontSemi}`} />
                  ) : (
                    <>
                      <span className={`text-sm leading-6 text-slate-900 ${fontSemi}`}>{draft.name}</span>
                      <button type="button" aria-label="Rename schedule" onClick={() => setRenaming(true)} className="flex text-slate-400 transition hover:text-slate-600">
                        <Icon path={PENCIL} className="size-4" />
                      </button>
                    </>
                  )}
                  {schedule.isDefault && <DefaultBadge />}
                </div>
                {groupDays(draft.days).map((g) => (
                  <p key={g.names.join()} className={`text-sm leading-5 text-slate-500 ${fontRegular}`}>
                    {g.names.join(", ")} | {g.slots.map((s) => `${formatShort(s.start)} - ${formatShort(s.end)}`).join(" | ")}
                  </p>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Checkbox checked={schedule.isDefault} onChange={() => (schedule.isDefault ? notify("Set another schedule as default to change this") : onMakeDefault())}>
                <span className={`text-sm leading-5 text-slate-600 ${fontRegular}`}>Set as Default</span>
              </Checkbox>
              <button type="button" onClick={() => (schedule.isDefault ? notify("Set another schedule as default before deleting this one") : setConfirming(true))} className={`h-8.75 w-19.5 rounded-lg border border-red-300 text-sm leading-5 text-red-600 transition hover:bg-red-50 ${fontMedium}`}>
                Delete
              </button>
              <button type="button" onClick={submit} className={`h-8.75 w-19.5 rounded-lg bg-slate-800 text-sm leading-5 text-white transition hover:bg-slate-900 ${fontMedium}`}>
                Save
              </button>
            </div>
          </div>
          <div className="flex flex-1 flex-col lg:flex-row">
            <div className="min-w-0 border-slate-200 px-6 py-6 lg:basis-29/50 lg:border-r lg:px-8">
              <div className="flex justify-end border-b border-slate-150 pb-5">
                <ActionMenu
                  label={`Time zone: ${draft.timezone}`}
                  triggerClass={`flex items-center gap-2.5 text-sm leading-6 text-slate-700 ${fontRegular}`}
                  trigger={
                    <>
                      <Icon path="M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" className="size-4.5 text-slate-800" />
                      {draft.timezone}
                      <img src="/assets/933a3.svg" alt="" width={16} height={16} className="size-4" />
                    </>
                  }
                  items={TIMEZONES.map((tz) => ({ label: tz, onClick: () => setDraft({ ...draft, timezone: tz }) }))}
                />
              </div>
              <ul className="mt-5 flex flex-col gap-4">
                {draft.days.map((day, i) => (
                  <li key={DAY_NAMES[i]} className="flex flex-wrap items-start gap-x-4 gap-y-2 sm:flex-nowrap">
                    <div className="flex h-8.75 w-30.5 shrink-0 items-center gap-4">
                      <Toggle on={day.on} label={`${SHORT_DAYS[i]} available`} onChange={() => setDay(i, (d) => ({ ...d, on: !d.on }))} />
                      <span className={`text-sm leading-5 text-slate-600 ${fontSemi}`}>{DAY_NAMES[i]}</span>
                    </div>
                    {day.on ? (
                      <div className="flex flex-col gap-3">
                        {day.slots.map((slot, j) => (
                          <div key={j} className="flex flex-wrap items-center gap-3">
                            <SlotRange slot={slot} label={`${SHORT_DAYS[i]} hours ${j + 1}`} onChange={(next) => setDay(i, (d) => ({ ...d, slots: d.slots.map((s, k) => (k === j ? next : s)) }))} />
                            {j === 0 ? (
                              <button type="button" aria-label={`Add ${SHORT_DAYS[i]} hours`} onClick={() => setDay(i, (d) => ({ ...d, slots: [...d.slots, { ...DEFAULT_SLOT }] }))} className={iconButton}>
                                <Icon path={PLUS} />
                              </button>
                            ) : (
                              <button type="button" aria-label={`Remove ${SHORT_DAYS[i]} hours ${j + 1}`} onClick={() => setDay(i, (d) => ({ ...d, slots: d.slots.filter((_, k) => k !== j) }))} className={iconButton}>
                                <Icon path={TRASH} />
                              </button>
                            )}
                            <ActionMenu
                              label={`Copy ${SHORT_DAYS[i]} hours`}
                              trigger={<Icon path={COPY} />}
                              triggerClass={iconButton}
                              items={[
                                { label: "Copy to all days", onClick: () => copyTo(i, [0, 1, 2, 3, 4, 5, 6]) },
                                { label: "Copy to Mon - Fri", onClick: () => copyTo(i, [0, 1, 2, 3, 4]) },
                              ]}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className={`flex h-8.75 items-center text-sm leading-5 text-slate-400 ${fontRegular}`}>Unavailable</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0 flex-1 border-t border-slate-200 px-6 py-6 lg:border-t-0">
              <div className="flex min-h-10.75 flex-wrap items-center justify-between gap-3 border-b border-slate-150 pb-4">
                <h2 className={`text-base leading-6 text-slate-900 ${fontSemi}`}>Override date</h2>
                {draft.overrides.length > 0 && <AddOverrideButton onClick={() => setOverrideDialog({})} />}
              </div>
              {draft.overrides.length === 0 ? (
                <div className="flex flex-col items-center gap-4 px-4 py-14 text-center">
                  <p className={`text-sm leading-6 text-slate-500 ${fontRegular}`}>Want to override ? Click to add in here</p>
                  <AddOverrideButton onClick={() => setOverrideDialog({})} className="h-8.75 px-3.5 text-sm" />
                </div>
              ) : (
                <ul className="mt-5 flex flex-col gap-5">
                  {[...draft.overrides]
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((o) => (
                      <li key={o.id} className="flex items-center gap-8">
                        <div className="w-30 shrink-0">
                          <p className={`whitespace-nowrap text-sm leading-5.5 text-slate-600 ${fontRegular}`}>{formatOverrideDate(o.date)}</p>
                          <p className={`text-xs leading-5.5 text-slate-400 ${fontRegular}`}>{o.unavailable ? "Unavailable all day" : o.slots.map((s) => `${formatUpper(s.start)} - ${formatUpper(s.end)}`).join(", ")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" aria-label={`Edit override for ${formatOverrideDate(o.date)}`} onClick={() => setOverrideDialog({ editing: o })} className={iconButton}>
                            <Icon path={PENCIL} />
                          </button>
                          <button type="button" aria-label={`Delete override for ${formatOverrideDate(o.date)}`} onClick={() => setDraft({ ...draft, overrides: draft.overrides.filter((item) => item.id !== o.id) })} className={iconButton}>
                            <Icon path={TRASH} />
                          </button>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
      {overrideDialog && (
        <OverrideDialog
          editing={overrideDialog.editing}
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
          <button type="button" onClick={() => setAdding(true)} className={`${buttonClass("yellow", "lg")}`}>
            <img src={imgPlusSmall} alt="" width={18} height={18} className="size-4.5" />
            Add New
          </button>
        }
      />
      <div className="px-4 py-6 md:px-7">
        <ul className="rounded-xl border border-slate-200">
          {schedules.map((s) => (
            <li key={s.id} className="flex items-center gap-4 border-b border-slate-200 px-6 py-3 last:border-b-0">
              <button type="button" onClick={() => openInstructorAvailability(s.id)} className="min-w-0 flex-1 text-left">
                <span className="flex flex-wrap items-center gap-2.5">
                  <span className={`text-sm leading-6 text-slate-900 ${fontSemi}`}>{s.name}</span>
                  {s.isDefault && <DefaultBadge />}
                </span>
                <span className={`mt-0.5 block text-sm leading-5.5 text-slate-500 ${fontRegular}`}>{listSummary(s.days).join("  |  ") || "Unavailable all week"}</span>
              </button>
              <ActionMenu
                label={`More actions for ${s.name}`}
                triggerClass="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-150"
                trigger={
                  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
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
          ))}
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
