import { useState } from "react";
import { experts, type Expert } from "../data";
import { fontBold, fontFor, fontMedium, fontRegular, fontSemi } from "../fonts";
import { formatPrice, useApp } from "../store";
import SectionHeading from "./SectionHeading";

export function ExpertAvatar({ expert, size = 56 }: { expert: Expert; size?: number }) {
  const initials = expert.name
    .replace(/^(د\.|Dr\.)\s*/, "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full text-white shadow-[0_6px_16px_rgba(15,23,42,0.18)] ${fontFor(expert.name, fontSemi, "font-bold")}`}
      style={{ width: size, height: size, fontSize: size * 0.34, backgroundImage: `linear-gradient(135deg, ${expert.colors[0]}, ${expert.colors[1]})` }}
    >
      {initials}
    </span>
  );
}

function ExpertCard({ expert }: { expert: Expert }) {
  const { setOverlay, bookings } = useApp();
  const booking = bookings.find((b) => b.expertId === expert.id);
  return (
    <article className="group relative flex flex-col gap-4 overflow-hidden rounded-[20px] border border-white bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_50px_rgba(13,92,75,0.14)]">
      <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" style={{ backgroundImage: `linear-gradient(90deg, ${expert.colors[0]}, ${expert.colors[1]})` }} />
      <div className="flex items-center gap-3.5">
        <ExpertAvatar expert={expert} />
        <div className="min-w-0">
          <p dir="auto" className={`truncate text-left text-[17px] text-[#0f172a] ${fontFor(expert.name, fontSemi)}`}>{expert.name}</p>
          <p className={`text-[13px] text-[#64748b] ${fontRegular}`}>
            {expert.field} · {expert.format}
          </p>
        </div>
      </div>
      <p dir="auto" className={`text-left text-[18px] leading-[1.5] text-[#0f172a] ${fontFor(expert.headline, fontSemi)}`}>{expert.headline}</p>
      <p className={`text-[14px] leading-[22px] text-[#475569] ${fontRegular}`}>{expert.detail}</p>
      <div className={`flex items-center gap-3 text-[13px] text-[#475569] ${fontRegular}`}>
        <span className={`flex items-center gap-1 text-[#0f172a] ${fontSemi}`}>
          <span className="text-[#ffb20d]">★</span>
          {expert.rating.toFixed(1)}
        </span>
        <span>{expert.sessions} sessions</span>
        <span>{expert.minutes} min</span>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#f1f5f9] pt-4">
        <span className={`text-[18px] text-[#0f172a] ${fontBold}`}>
          {formatPrice(expert.price)}
          <span className={`text-[13px] text-[#64748b] ${fontRegular}`}> / session</span>
        </span>
        <button
          type="button"
          onClick={() => setOverlay({ type: "booking", expertId: expert.id })}
          className={`rounded-[10px] px-4 py-2.5 text-[14px] transition ${fontSemi} ${booking ? "bg-[#e7f5f1] text-[#0d5c4b] hover:bg-[#d3eee6]" : "bg-[#0d5c4b] text-white hover:bg-[#0b4c3e]"}`}
        >
          {booking ? `Booked · ${booking.date.split(",")[0]}` : "Book a session"}
        </button>
      </div>
    </article>
  );
}

export default function Experts() {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? experts : experts.slice(0, 3);

  return (
    <section id="experts" className="relative w-full scroll-mt-[80px] overflow-hidden bg-[#eef7f2] px-4 py-[64px] md:px-8 xl:py-[96px]">
      <div aria-hidden className="pointer-events-none absolute -right-[120px] -top-[120px] size-[420px] rounded-full bg-[radial-gradient(circle,rgba(18,185,129,0.18),transparent_70%)]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-[160px] -left-[120px] size-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,178,13,0.16),transparent_70%)]" />
      <div className="relative mx-auto flex w-full max-w-[1320px] flex-col gap-10">
        <SectionHeading
          eyebrow="1:1 and group sessions"
          title="An hour with someone ten years ahead can shortcut your next year."
          subtitle="Discuss an idea, review your work, or prepare for an interview. Choose an expert and book a time. You get a summary of the session afterwards."
          action={
            <button
              type="button"
              onClick={() => {
                setShowAll(true);
                document.getElementById("experts-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`inline-flex h-[52px] shrink-0 items-center justify-center rounded-[12px] bg-[#0d5c4b] px-6 text-[16px] text-white shadow-[0_10px_24px_rgba(13,92,75,0.25)] transition hover:-translate-y-0.5 hover:bg-[#0b4c3e] ${fontSemi}`}
            >
              Book an expert
            </button>
          }
        />
        <div id="experts-grid" className="grid scroll-mt-[96px] grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((e) => (
            <ExpertCard key={e.id} expert={e} />
          ))}
        </div>
        <button type="button" onClick={() => setShowAll((v) => !v)} className={`group inline-flex w-fit items-center gap-2 text-[16px] text-[#0d5c4b] ${fontMedium}`}>
          {showAll ? "Show fewer experts" : `Browse all experts (${experts.length})`}
          <span className={`transition-transform ${showAll ? "-rotate-90" : "group-hover:translate-x-1"}`}>→</span>
        </button>
      </div>
    </section>
  );
}
