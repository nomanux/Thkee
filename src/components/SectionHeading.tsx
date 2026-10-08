import type { ReactNode } from "react";
import { fontHeading, fontRegular, fontSemi } from "../fonts";

export default function SectionHeading({ eyebrow, title, subtitle, action, dark = false }: { eyebrow: string; title: ReactNode; subtitle?: string; action?: ReactNode; dark?: boolean }) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="flex max-w-[720px] flex-col gap-3">
        <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[12px] uppercase tracking-[1.2px] ${fontSemi} ${dark ? "bg-white/10 text-[#7ff0c0]" : "bg-[#e7f5f1] text-[#0d5c4b]"}`}>
          <span className={`size-1.5 rounded-full ${dark ? "bg-[#7ff0c0]" : "bg-[#12b981]"}`} />
          {eyebrow}
        </span>
        <h2 className={`m-0 text-[32px] leading-[1.15] tracking-[-0.96px] md:text-[40px] xl:text-[48px] ${fontHeading} ${dark ? "text-white" : "text-[#0f172a]"}`} style={{ fontVariationSettings: '"wdth" 100' }}>
          {title}
        </h2>
        {subtitle && <p className={`m-0 text-[16px] leading-[28px] md:text-[18px] ${fontRegular} ${dark ? "text-[#cbd5e1]" : "text-[#475569]"}`}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
