import { useState } from "react";
import { experts, type Expert } from "../data";
import { fontBold, fontFor, fontMedium, fontRegular, fontSemi } from "../fonts";
import { formatPrice, useApp } from "../store";
import SectionHeading from "./SectionHeading";
import { buttonClass } from "./Button";

export function ExpertAvatar({ expert, size = 56 }: { expert: Expert; size?: number }) {
  const initials = expert.name
    .replace(/^(د\.|Dr\.)\s*/, "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full text-white shadow-xl ${fontFor(expert.name, fontSemi, "font-bold")}`}
      style={{ width: size, height: size, fontSize: size * 0.34, backgroundImage: `linear-gradient(135deg, ${expert.colors[0]}, ${expert.colors[1]})` }}
    >
      {initials}
    </span>
  );
}

export function ExpertCard({ expert }: { expert: Expert }) {
  const { setOverlay, bookings } = useApp();
  const booking = bookings.find((b) => b.expertId === expert.id);
  return (
    <article className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl shadow-primary-700/21">
      <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" style={{ backgroundImage: `linear-gradient(90deg, ${expert.colors[0]}, ${expert.colors[1]})` }} />
      <div className="flex items-center gap-3.5">
        <ExpertAvatar expert={expert} />
        <div className="min-w-0">
          <p dir="auto" className={`truncate text-left text-17 text-slate-900 ${fontFor(expert.name, fontSemi)}`}>{expert.name}</p>
          <p className={`text-13 text-slate-500 ${fontRegular}`}>
            {expert.field} · {expert.format}
          </p>
        </div>
      </div>
      <p dir="auto" className={`text-left text-lg leading-normal text-slate-900 ${fontFor(expert.headline, fontSemi)}`}>{expert.headline}</p>
      <p className={`text-sm leading-5.5 text-slate-600 ${fontRegular}`}>{expert.detail}</p>
      <div className={`flex items-center gap-3 text-13 text-slate-600 ${fontRegular}`}>
        <span className={`flex items-center gap-1 text-slate-900 ${fontSemi}`}>
          <span className="text-secondary-500">★</span>
          {expert.rating.toFixed(1)}
        </span>
        <span>{expert.sessions} sessions</span>
        <span>{expert.minutes} min</span>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-150 pt-4">
        <span className={`text-lg text-slate-900 ${fontBold}`}>
          {formatPrice(expert.price)}
          <span className={`text-13 text-slate-500 ${fontRegular}`}> / session</span>
        </span>
        <button
          type="button"
          onClick={() => setOverlay({ type: "booking", expertId: expert.id })}
          className={`rounded-xl px-4 py-2.5 text-sm transition ${fontSemi} ${booking ? "bg-primary-200 text-primary-700 hover:bg-mist-200" : "bg-primary-700 text-white hover:bg-primary-800"}`}
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
    <section id="experts" className="relative w-full scroll-mt-20 overflow-hidden bg-primary-100 px-4 py-16 md:px-8 xl:py-24">
      <div aria-hidden className="pointer-events-none absolute -right-30 -top-30 size-105 rounded-full bg-radial from-emerald-500/18 to-transparent to-70%" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-30 size-105 rounded-full bg-radial from-secondary-500/16 to-transparent to-70%" />
      <div className="relative mx-auto flex w-full max-w-330 flex-col gap-10">
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
              className={buttonClass("primary", "lg")}
            >
              Book an expert
            </button>
          }
        />
        <div id="experts-grid" className="grid scroll-mt-24 grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((e) => (
            <ExpertCard key={e.id} expert={e} />
          ))}
        </div>
        <button type="button" onClick={() => setShowAll((v) => !v)} className={`group inline-flex w-fit items-center gap-2 text-base text-primary-700 ${fontMedium}`}>
          {showAll ? "Show fewer experts" : `Browse all experts (${experts.length})`}
          <span className={`transition-transform ${showAll ? "-rotate-90" : "group-hover:translate-x-1"}`}>→</span>
        </button>
      </div>
    </section>
  );
}
