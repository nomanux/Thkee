import { useEffect, useState } from "react";
import { liveSessions, type LiveSession } from "../data";
import { fontBold, fontFor, fontMedium, fontRegular, fontSemi } from "../fonts";
import { formatPrice, useApp } from "../store";
import SectionHeading from "./SectionHeading";

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function startOf(session: LiveSession) {
  const d = new Date();
  d.setDate(d.getDate() + session.dayOffset);
  d.setHours(session.hour, 0, 0, 0);
  return d;
}

function dayLabel(date: Date) {
  const today = new Date();
  const diff = Math.round((new Date(date).setHours(0, 0, 0, 0) - new Date(today).setHours(0, 0, 0, 0)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function countdown(start: Date, minutes: number, now: number) {
  const ms = start.getTime() - now;
  if (ms <= 0 && now < start.getTime() + minutes * 60_000) return { live: true, text: "Live now" };
  if (ms <= 0) return { live: false, text: "Ended" };
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) return { live: false, text: `Starts in ${Math.floor(h / 24)}d ${h % 24}h` };
  return { live: false, text: `Starts in ${h ? `${h}h ` : ""}${m}m` };
}

function formatLength(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h ? `${h}h` : ""}${m ? ` ${m}m` : ""}`.trim();
}

export default function StartingSoon() {
  const { reservations, reserveSeat } = useApp();
  const now = useNow(30_000);

  return (
    <section className="w-full bg-[#f8fafc] px-4 py-[64px] md:px-8 xl:py-[96px]">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
        <SectionHeading eyebrow="Live & cohorts" title="Starting soon" subtitle="Join a live cohort this week — learn together with an expert and a small group of peers." />
        <ol className="flex flex-col gap-3">
          {liveSessions.map((s) => {
            const start = startOf(s);
            const reserved = reservations.includes(s.id);
            const status = countdown(start, s.minutes, now);
            const seats = s.seatsLeft === null ? null : Math.max(0, s.seatsLeft - (reserved ? 1 : 0));
            return (
              <li
                key={s.id}
                className={`group grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-4 rounded-[18px] border bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:p-5 lg:grid-cols-[auto_1fr_auto] lg:gap-x-6 ${reserved ? "border-[#12b981]/50" : "border-[#e2e8f0]"}`}
              >
                <div className={`flex w-[76px] flex-col items-center justify-center rounded-[14px] py-3 text-center ${status.live || s.dayOffset === 0 ? "bg-[#0d5c4b] text-white" : "bg-[#f1f5f9] text-[#0f172a]"}`}>
                  <span className={`text-[12px] uppercase tracking-[0.6px] opacity-80 ${fontSemi}`}>{dayLabel(start)}</span>
                  <span className={`text-[20px] leading-[28px] ${fontBold}`}>{start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(":00", "")}</span>
                </div>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] ${fontSemi} ${status.live ? "bg-[#fee2e2] text-[#b91c1c]" : "bg-[#e7f5f1] text-[#0d5c4b]"}`}>
                      {status.live && <span className="size-1.5 animate-pulse rounded-full bg-[#ef4444]" />}
                      {status.text}
                    </span>
                    {seats !== null ? (
                      <span className={`rounded-full bg-[#fff4e0] px-2.5 py-0.5 text-[12px] text-[#9a4a00] ${fontSemi}`}>Only {seats} seats left</span>
                    ) : (
                      <span className={`rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[12px] text-[#475569] ${fontMedium}`}>Open enrolment</span>
                    )}
                  </div>
                  <p dir="auto" className={`text-left text-[17px] leading-[1.5] text-[#0f172a] ${fontFor(s.title, fontSemi)}`}>{s.title}</p>
                  <p className={`text-[14px] text-[#64748b] ${fontRegular}`}>
                    {s.format} with{" "}
                    <span dir="auto" className={`text-[#334155] ${fontFor(s.host, fontMedium, "font-medium")}`}>
                      {s.host}
                    </span>{" "}
                    · {formatLength(s.minutes)} · {formatPrice(s.price)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => reserveSeat(s.id, s.title)}
                  className={`group/reserve col-span-2 h-[46px] rounded-[12px] px-5 text-[15px] transition lg:col-span-1 ${fontSemi} ${reserved ? "bg-[#e7f5f1] text-[#0d5c4b] hover:bg-[#fee2e2] hover:text-[#b91c1c]" : "border border-[#0d5c4b] text-[#0d5c4b] hover:bg-[#0d5c4b] hover:text-white"}`}
                >
                  {reserved ? (
                    <>
                      <span className="group-hover/reserve:hidden">Seat reserved ✓</span>
                      <span className="hidden group-hover/reserve:inline">Cancel reservation</span>
                    </>
                  ) : (
                    "Reserve a seat"
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
