import type { ReactNode } from "react";
import { fontHeading, fontRegular, fontSemi } from "../fonts";

export default function SectionHeading({ eyebrow, title, subtitle, action, dark = false }: { eyebrow: string; title: ReactNode; subtitle?: string; action?: ReactNode; dark?: boolean }) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="flex max-w-180 flex-col gap-3">
        <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs uppercase tracking-widest ${fontSemi} ${dark ? "bg-white/10 text-green-300" : "bg-primary-200 text-primary-700"}`}>
          <span className={`size-1.5 rounded-full ${dark ? "bg-green-300" : "bg-emerald-500"}`} />
          {eyebrow}
        </span>
        <h2 className={`m-0 text-32 leading-tight tracking-tight md:text-40 xl:text-5xl ${fontHeading} ${dark ? "text-white" : "text-slate-900"}`} style={{ fontVariationSettings: '"wdth" 100' }}>
          {title}
        </h2>
        {subtitle && <p className={`m-0 text-sm leading-5.5 ${fontRegular} ${dark ? "text-slate-300" : "text-slate-600"}`}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
