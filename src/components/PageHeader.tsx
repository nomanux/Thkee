import type { ReactNode } from "react";
import { fontHeading, fontRegular } from "../fonts";

/* The one page header for instructor pages: same font, size, colour and spacing everywhere.
   Sits directly on the page background (no white bar), title on the left, actions on the right. */

export const pageShell = "flex flex-1 flex-col bg-slate-25";
export const pageBody = "flex flex-col gap-6 px-4 py-6 md:px-8";

export default function PageHeader({ title, description, children }: { title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className={`m-0 text-2xl leading-8 tracking-tight text-slate-900 ${fontHeading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
          {title}
        </h1>
        {description && <p className={`m-0 mt-1 text-sm text-slate-500 ${fontRegular}`}>{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
