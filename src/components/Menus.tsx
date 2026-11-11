import { useEffect, useRef, useState, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { fontMedium, fontRegular } from "../fonts";

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return { open, setOpen, ref };
}

const panel =
  "pop-in absolute top-full z-20 mt-1.5 flex flex-col gap-0.5 rounded-[12px] border border-slate-200 bg-white p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_16px_36px_-8px_rgba(15,23,42,0.2)]";

export function FilterSelect({
  label,
  options,
  value,
  onChange,
  alignRight,
  large,
  plain,
  id,
  placeholder,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  alignRight?: boolean;
  large?: boolean;
  plain?: boolean;
  /** Lets a visible <label htmlFor> point at the trigger. */
  id?: string;
  /** Shown (in slate-400) when no option matches the value. */
  placeholder?: string;
}) {
  const { open, setOpen, ref } = useDropdown();
  const selectedLabel = options.find((o) => o.value === value)?.label;
  return (
    <div ref={ref} className="relative" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-label={plain && !id ? `${label}: ${selectedLabel ?? placeholder ?? ""}` : undefined}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`group flex items-center gap-2 border bg-white text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-[border-color,box-shadow,background-color] duration-150 focus-visible:border-[#0d5c4b]/60 focus-visible:ring-3 focus-visible:ring-[#0d5c4b]/12 ${
          open ? "border-[#0d5c4b]/60 ring-3 ring-[#0d5c4b]/12" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
        } ${plain ? "h-[36px] w-full justify-between rounded-[10px] pl-3 pr-2.5 text-[14px]" : large ? "h-[36px] rounded-[10px] pl-3 pr-2.5 text-[14px]" : "h-[32px] rounded-[8px] pl-2.5 pr-2 text-[13px]"} ${fontRegular}`}
      >
        <span className="min-w-0 truncate whitespace-nowrap">
          {plain ? (
            <span className={value && selectedLabel ? "text-slate-900" : "text-slate-400"}>{selectedLabel ?? placeholder}</span>
          ) : (
            <>
              {label}: <span className={`text-slate-900 ${fontMedium}`}>{selectedLabel ?? placeholder}</span>
            </>
          )}
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={large || plain ? 18 : 16}
          strokeWidth={1.8}
          aria-hidden="true"
          className={`shrink-0 transition-[transform,color] duration-200 ${open ? "rotate-180 text-[#0d5c4b]" : "text-slate-500 group-hover:text-slate-700"}`}
        />
      </button>
      {open && (
        <ul role="listbox" aria-label={label} className={`${panel} min-w-[max(100%,180px)] whitespace-nowrap ${alignRight ? "right-0" : "left-0"}`}>
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <li key={o.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-4 rounded-[8px] px-2.5 py-2 text-left text-[14px] leading-[20px] transition-colors ${
                    selected ? `bg-[#eef7f3] text-[#0d5c4b] ${fontMedium}` : `text-slate-700 hover:bg-slate-100 hover:text-slate-900 ${fontRegular}`
                  }`}
                >
                  {o.label}
                  {selected && <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={2} aria-hidden="true" className="shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export type ActionItem = { label: string; icon?: ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean };

export function ActionMenu({ label, trigger, triggerClass, items, alignLeft }: { label: string; trigger: ReactNode; triggerClass: string; items: ActionItem[]; alignLeft?: boolean }) {
  const { open, setOpen, ref } = useDropdown();
  const [flipUp, setFlipUp] = useState(false);

  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setFlipUp(spaceBelow < 220);
  }, [open]);

  return (
    <div ref={ref} className="relative" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <button type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={triggerClass}>
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={`pop-in absolute z-20 flex flex-col gap-0.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-popover min-w-30 whitespace-nowrap ${alignLeft ? "left-0" : "right-0"} ${flipUp ? "bottom-full mb-1.5" : "top-full mt-1.5"}`}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm leading-5 transition-colors disabled:text-slate-400 disabled:hover:bg-transparent ${item.danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"} ${fontRegular}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
