import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon, Calendar03Icon } from "@hugeicons/core-free-icons";
import { fontMedium, fontRegular, fontSemi } from "../fonts";

// A date field in the Thkee design. Same look in every browser, unlike <input type="date">.
// Values are "YYYY-MM-DD" strings, the same format <input type="date"> uses.

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const PANEL_WIDTH = 296;
const pad = (n: number) => String(n).padStart(2, "0");

export const toIsoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayIso = () => toIsoDate(new Date());
const parse = (iso?: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const formatDate = (iso: string) => parse(iso)?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) ?? "";

export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  disabled,
  invalid,
  placeholder = "Select a date",
  ariaLabel,
  describedBy,
  clearable = true,
  className = "",
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  describedBy?: string;
  clearable?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => monthStart(parse(value) ?? new Date()));
  const [focus, setFocus] = useState<Date>(() => parse(value) ?? new Date());
  const [place, setPlace] = useState({ right: false, up: false });
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const grid = useRef<HTMLDivElement>(null);

  const selected = parse(value);
  const minDate = parse(min);
  const maxDate = parse(max);
  const today = parse(todayIso())!;
  const blocked = (d: Date) => (!!minDate && d < minDate) || (!!maxDate && d > maxDate);

  // Closes on a click outside.
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => wrap.current?.contains(e.target as Node) || setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  // Keeps the panel on screen: opens to the left near the right edge, and upward near the bottom.
  useLayoutEffect(() => {
    if (!open || !trigger.current) return;
    const box = trigger.current.getBoundingClientRect();
    setPlace({ right: box.left + PANEL_WIDTH > window.innerWidth - 8, up: box.bottom + 380 > window.innerHeight && box.top > 380 });
  }, [open]);

  // Moves keyboard focus to the active day.
  useEffect(() => {
    if (open) grid.current?.querySelector<HTMLButtonElement>(`[data-day="${toIsoDate(focus)}"]`)?.focus();
  }, [open, focus, month]);

  const show = () => {
    const start = selected ?? (minDate && today < minDate ? minDate : today);
    setFocus(start);
    setMonth(monthStart(start));
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  const pick = (d: Date) => {
    if (blocked(d)) return;
    onChange(toIsoDate(d));
    close();
  };
  const moveFocus = (d: Date) => {
    setFocus(d);
    if (d.getMonth() !== month.getMonth() || d.getFullYear() !== month.getFullYear()) setMonth(monthStart(d));
  };
  const onGridKey = (e: KeyboardEvent) => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in step) {
      e.preventDefault();
      moveFocus(addDays(focus, step[e.key]));
    } else if (e.key === "PageUp" || e.key === "PageDown") {
      e.preventDefault();
      moveFocus(new Date(focus.getFullYear(), focus.getMonth() + (e.key === "PageUp" ? -1 : 1), focus.getDate()));
    }
  };

  const lead = (month.getDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, i) => addDays(month, i - lead));
  const shift = (by: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + by, 1));
  const canPrev = !minDate || new Date(month.getFullYear(), month.getMonth(), 0) >= minDate;
  const canNext = !maxDate || new Date(month.getFullYear(), month.getMonth() + 1, 1) <= maxDate;
  const arrow = "flex size-8 items-center justify-center rounded-[8px] text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-30";
  const footLink = `rounded-[6px] px-2 py-1 text-[13px] leading-[18px] text-[#0d5c4b] transition hover:bg-[#eef7f3] disabled:pointer-events-none disabled:opacity-40 ${fontMedium}`;

  return (
    <div ref={wrap} className={`relative ${className}`} onKeyDown={(e) => e.key === "Escape" && open && (e.stopPropagation(), close())}>
      <button
        ref={trigger}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-label={ariaLabel ? `${ariaLabel}${value ? `: ${formatDate(value)}` : ""}` : undefined}
        onClick={() => (open ? close() : show())}
        className={`field group flex h-[36px] items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${open ? "!border-[#0d5c4b]/60 bg-white shadow-[0_0_0_3px_rgb(13_92_75/0.12)]" : ""}`}
      >
        <span className={`min-w-0 truncate ${value ? "" : "text-slate-400"}`}>{value ? formatDate(value) : placeholder}</span>
        <HugeiconsIcon icon={Calendar03Icon} size={18} strokeWidth={1.8} aria-hidden="true" className={`shrink-0 transition-colors ${open ? "text-[#0d5c4b]" : "text-slate-500 group-hover:text-slate-700"}`} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose a date"
          style={{ width: PANEL_WIDTH }}
          className={`pop-in absolute z-30 rounded-[12px] border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_16px_36px_-8px_rgba(15,23,42,0.2)] ${place.right ? "right-0" : "left-0"} ${place.up ? "bottom-full mb-1.5" : "top-full mt-1.5"}`}
        >
          <div className="flex items-center justify-between">
            <button type="button" aria-label="Previous month" disabled={!canPrev} onClick={() => shift(-1)} className={arrow}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <p aria-live="polite" className={`text-[14px] leading-[20px] text-slate-900 ${fontSemi}`}>
              {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
            <button type="button" aria-label="Next month" disabled={!canNext} onClick={() => shift(1)} className={arrow}>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>

          <div ref={grid} role="grid" onKeyDown={onGridKey} className="mt-2 grid grid-cols-7 justify-items-center gap-y-0.5">
            {WEEKDAYS.map((day) => (
              <span key={day} role="columnheader" className={`pb-1 text-[12px] leading-[18px] text-slate-500 ${fontMedium}`}>
                {day}
              </span>
            ))}
            {cells.map((d) => {
              const iso = toIsoDate(d);
              const inMonth = d.getMonth() === month.getMonth();
              const isSelected = !!selected && iso === value;
              const isToday = iso === toIsoDate(today);
              const off = blocked(d);
              return (
                <button
                  key={iso}
                  type="button"
                  data-day={iso}
                  tabIndex={iso === toIsoDate(focus) ? 0 : -1}
                  disabled={off}
                  aria-pressed={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  aria-label={d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  onClick={() => pick(d)}
                  onFocus={() => setFocus(d)}
                  className={`relative flex size-9 items-center justify-center rounded-full text-[14px] leading-[20px] outline-none transition focus-visible:ring-2 focus-visible:ring-[#0d5c4b]/40 ${
                    isSelected
                      ? `bg-[#0d5c4b] text-white ${fontSemi}`
                      : off
                        ? `cursor-not-allowed text-slate-300 ${fontRegular}`
                        : `${inMonth ? "text-slate-700" : "text-slate-400"} hover:bg-[#eef7f3] hover:text-[#0d5c4b] ${isToday ? fontSemi : fontRegular}`
                  }`}
                >
                  {d.getDate()}
                  {isToday && !isSelected && <span aria-hidden="true" className="absolute bottom-1 size-1 rounded-full bg-[#faa104]" />}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
            {clearable ? (
              <button type="button" disabled={!value} onClick={() => (onChange(""), close())} className={footLink}>
                Clear
              </button>
            ) : (
              <span />
            )}
            <button type="button" disabled={blocked(today)} onClick={() => pick(today)} className={footLink}>
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Labelled date field that matches TextField: label, field, error or hint.
export function DateField({ id, label, value, onChange, error, hint, min, max, required, placeholder }: { id: string; label: string; value: string; onChange: (value: string) => void; error?: string; hint?: string; min?: string; max?: string; required?: boolean; placeholder?: string }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={`text-[14px] leading-[20px] text-slate-900 ${fontMedium}`}>
        {label} {required && <span className={`text-slate-500 ${fontRegular}`}>(Required)</span>}
      </label>
      <DatePicker id={id} value={value} onChange={onChange} min={min} max={max} invalid={!!error} describedBy={describedBy} placeholder={placeholder} />
      {error && (
        <p id={`${id}-error`} className={`text-[14px] leading-[20px] text-[#dc2626] ${fontRegular}`}>
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="field-help">
          {hint}
        </p>
      )}
    </div>
  );
}
