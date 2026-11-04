import { useEffect, useRef, useState, type ReactNode } from "react";
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

const panel = "pop-in absolute top-full z-20 mt-1 flex flex-col gap-0.5 rounded-[6px] bg-white p-1 shadow-[0_8px_24px_rgba(15,23,42,0.15)]";

export function FilterSelect({
  label,
  options,
  value,
  onChange,
  alignRight,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  alignRight?: boolean;
}) {
  const { open, setOpen, ref } = useDropdown();
  return (
    <div ref={ref} className="relative" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-[32px] items-center gap-2 rounded-[6px] border border-[#e2e8f0] bg-white px-3 text-[12px] text-[#64748b] transition hover:border-[#cbd5e1] ${fontRegular}`}
      >
        <span className="whitespace-nowrap">
          {label}: <span className={`text-[#0f172a] ${fontMedium}`}>{options.find((o) => o.value === value)?.label}</span>
        </span>
        <svg viewBox="0 0 24 24" className={`size-3.5 text-[#0f172a] transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul role="listbox" aria-label={label} className={`${panel} min-w-full whitespace-nowrap ${alignRight ? "right-0" : "left-0"}`}>
          {options.map((o) => (
            <li key={o.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`w-full rounded-[4px] px-3 py-2 text-left text-[12px] text-[#334155] transition hover:bg-[#f1f5f9] ${o.value === value ? "bg-[#f1f5f9]" : ""} ${fontRegular}`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export type ActionItem = { label: string; icon?: ReactNode; onClick: () => void; disabled?: boolean };

export function ActionMenu({ label, trigger, triggerClass, items, alignLeft }: { label: string; trigger: ReactNode; triggerClass: string; items: ActionItem[]; alignLeft?: boolean }) {
  const { open, setOpen, ref } = useDropdown();
  return (
    <div ref={ref} className="relative" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <button type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={triggerClass}>
        {trigger}
      </button>
      {open && (
        <div role="menu" className={`${panel} ${alignLeft ? "left-0" : "right-0"} min-w-[120px] whitespace-nowrap`}>
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
              className={`flex w-full items-center gap-2.5 rounded-[4px] px-3 py-2 text-left text-[14px] text-[#334155] transition hover:bg-[#f1f5f9] disabled:text-[#94a3b8] disabled:hover:bg-transparent ${fontRegular}`}
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
