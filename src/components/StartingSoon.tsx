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
    <section className="w-full bg-slate-25 px-4 py-16 md:px-8 xl:py-24">
      <div className="mx-auto flex w-full max-w-330 flex-col gap-8">
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
                className={`group grid grid-cols-auto-main items-center gap-x-4 gap-y-4 rounded-2xl border bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl sm:p-5 lg:grid-cols-auto-main-auto lg:gap-x-6 ${reserved ? "border-emerald-500/50" : "border-slate-200"}`}
              >
                <div className={`flex w-19 flex-col items-center justify-center rounded-2xl py-3 text-center ${status.live || s.dayOffset === 0 ? "bg-primary-700 text-white" : "bg-slate-150 text-slate-900"}`}>
                  <span className={`text-xs uppercase tracking-wider opacity-80 ${fontSemi}`}>{dayLabel(start)}</span>
                  <span className={`text-xl leading-7 ${fontBold}`}>{start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(":00", "")}</span>
                </div>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs ${fontSemi} ${status.live ? "bg-red-100 text-red-700" : "bg-primary-200 text-primary-700"}`}>
                      {status.live && <span className="size-1.5 animate-pulse rounded-full bg-red-500" />}
                      {status.text}
                    </span>
                    {seats !== null ? (
                      <span className={`rounded-full bg-orange-50 px-2.5 py-0.5 text-xs text-amber-800 ${fontSemi}`}>Only {seats} seats left</span>
                    ) : (
                      <span className={`rounded-full bg-slate-150 px-2.5 py-0.5 text-xs text-slate-600 ${fontMedium}`}>Open enrolment</span>
                    )}
                  </div>
                  <p dir="auto" className={`text-left text-17 leading-normal text-slate-900 ${fontFor(s.title, fontSemi)}`}>{s.title}</p>
                  <p className={`text-sm text-slate-500 ${fontRegular}`}>
                    {s.format} with{" "}
                    <span dir="auto" className={`text-slate-700 ${fontFor(s.host, fontMedium, "font-medium")}`}>
                      {s.host}
                    </span>{" "}
                    · {formatLength(s.minutes)} · {formatPrice(s.price)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => reserveSeat(s.id, s.title)}
                  className={`group/reserve col-span-2 h-11.5 rounded-xl px-5 text-15 transition lg:col-span-1 ${fontSemi} ${reserved ? "bg-primary-200 text-primary-700 hover:bg-red-100 hover:text-red-700" : "border border-primary-700 text-primary-700 hover:bg-primary-700 hover:text-white"}`}
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
