import { useEffect, useRef, useState } from "react";
import { fontBold, fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { openCoInstructorRequests, openCreateSession, openInstructorAssignments, openInstructorCourses, openInstructorQa, openInstructorReports, openInstructorReviews, openInstructorSchedule, useApp } from "../store";
import { uncheckedSubmissionCount } from "./InstructorAssignments";
import { pendingCoRequestCount } from "./InstructorCoRequests";
import { rejectedCourseCount } from "./InstructorCourses";
import { unansweredQuestionCount } from "./InstructorQa";
import { PAYOUT_TILES } from "./InstructorReports";
import { unrepliedReviewCount } from "./InstructorReviews";
import { JoinButton, dayLabel, formatTime, sessionInfo, upcomingSessions } from "./InstructorSchedule";
import { openCourse } from "./InstructorSessions";

/* ------------------------------------------------------------------ */
/* Sample data. Per-course totals add up to the totals shown in Reports. */
/* ------------------------------------------------------------------ */

const COURSES = [
  { id: "db", title: "Database Management Systems", image: "/assets/courses/bank-insurance.jpg", students: 742, newStudents: 6, rating: 4.5, completion: 68, revenue: 1482.4, trend: [8, 10, 9, 12, 14, 13, 16] },
  { id: "java", title: "Object Oriented Java Programming", image: "/assets/courses/react-web-apps-v2.jpg", students: 531, newStudents: 4, rating: 4.3, completion: 54, revenue: 1036.12, trend: [9, 8, 10, 9, 11, 10, 12] },
  { id: "dsa", title: "Fundamental of Data Structure", image: "/assets/courses/ai-foundations-sara.jpg", students: 318, newStudents: 1, rating: 3.6, completion: 31, revenue: 512.6, trend: [10, 9, 7, 8, 6, 6, 5] },
  { id: "python", title: "Python for Data Analysis", image: "/assets/courses/python-programming.jpg", students: 232, newStudents: 2, rating: 4.1, completion: 47, revenue: 385.5, trend: [3, 4, 4, 5, 5, 6, 7] },
];

const TOTAL_STUDENTS = COURSES.reduce((sum, c) => sum + c.students, 0);
const TOTAL_REVENUE = COURSES.reduce((sum, c) => sum + c.revenue, 0);
const weighted = (field: "rating" | "completion") => COURSES.reduce((sum, c) => sum + c[field] * c.students, 0) / TOTAL_STUDENTS;

// Oldest first. The last value is the current month, still in progress.
const MONTHLY = {
  revenue: [168.4, 214.75, 246.1, 198.3, 232.85, 301.2, 276.45, 254.9, 318.6, 342.15, 286.3, 192.16],
  enrollments: [12, 17, 21, 15, 19, 26, 22, 20, 27, 31, 24, 13],
  rating: [4.0, 4.0, 4.1, 4.0, 4.1, 4.1, 4.1, 4.2, 4.1, 4.1, 4.1, 4.2],
  completion: [44, 45, 47, 46, 48, 50, 49, 51, 52, 51, 52, 55],
};

const ACTIVITY = [
  { who: "Sara Al-Qahtani", what: "enrolled in", target: "Database Management Systems", ago: "12 min ago", kind: "enroll" },
  { who: "Omar Khalid", what: "left a 5-star review on", target: "Object Oriented Java Programming", ago: "1 h ago", kind: "review" },
  { who: "Lina Haddad", what: "asked a question in", target: "Fundamental of Data Structure", ago: "3 h ago", kind: "question" },
  { who: "Faisal Al-Harbi", what: "submitted an assignment in", target: "Python for Data Analysis", ago: "5 h ago", kind: "assignment" },
  { who: "Noura Saleh", what: "completed", target: "Database Management Systems", ago: "Yesterday", kind: "complete" },
] as const;

const money = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const compactMoney = (v: number) => `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many);
const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const BRAND = "#ffb20d";
const BRAND_DARK = "#c98003";

const monthLabels = (now: number) => {
  const today = new Date(now);
  return MONTHLY.revenue.map((_, i) => new Date(today.getFullYear(), today.getMonth() - (MONTHLY.revenue.length - 1 - i), 1).toLocaleDateString("en-US", { month: "short" }));
};

const payoutInfo = (now: number) => {
  const today = new Date(now);
  const next = new Date(today);
  if (today.getDate() > 3) next.setMonth(next.getMonth() + 1, 3);
  else next.setDate(3);
  const prev = new Date(next);
  prev.setMonth(prev.getMonth() - 1);
  const daysLeft = Math.ceil((next.getTime() - now) / 86400000);
  const progress = (now - prev.getTime()) / (next.getTime() - prev.getTime());
  return { label: next.toLocaleDateString("en-GB", { day: "numeric", month: "long" }), daysLeft, progress };
};

const greeting = (now: number) => {
  const h = new Date(now).getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

/* ---------------------------- Small parts ---------------------------- */

const card = "rounded-[14px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";
const cardTitle = `m-0 text-[16px] leading-[24px] text-[#0f172a] ${fontSemi}`;

function Icon({ path, className = "size-5", strokeWidth = 2 }: { path: string; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

const P = {
  chevron: "M9 6l6 6-6 6",
  arrowUp: "M7 17L17 7M9 7h8v8",
  arrowDown: "M7 7l10 10M17 9v8H9",
  plus: "M12 5v14M5 12h14",
  video: "M15 10l5-3v10l-5-3M3 7a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  star: "M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3z",
  user: "M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 11-8 0 4 4 0 018 0zM20 8v6M23 11h-6",
  question: "M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01M12 22a10 10 0 100-20 10 10 0 000 20z",
  doc: "M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9zM14 3v6h6M9 15l2 2 4-4",
  award: "M12 15a6 6 0 100-12 6 6 0 000 12zM8.2 13.9L7 22l5-3 5 3-1.2-8.1",
  check: "M5 13l4 4L19 7",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  wallet: "M20 12V8H6a2 2 0 010-4h12v4M4 6v12a2 2 0 002 2h14v-4M18 12a2 2 0 000 4h4v-4z",
  warning: "M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
};

function Delta({ value, unit = "%", suffix }: { value: number; unit?: string; suffix?: string }) {
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[12px] leading-[16px] ${up ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#fee2e2] text-[#b91c1c]"} ${fontSemi}`}>
      <Icon path={up ? P.arrowUp : P.arrowDown} className="size-3" strokeWidth={2.5} />
      {up ? "+" : "−"}
      {Math.abs(value)}
      {unit}
      {suffix && <span className={`ml-1 text-[#64748b] ${fontRegular}`}>{suffix}</span>}
    </span>
  );
}

function LinkButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex shrink-0 items-center gap-1 text-[14px] leading-[20px] text-[#976002] transition hover:text-[#613f00] ${fontMedium}`}>
      {label}
      <Icon path={P.chevron} className="size-3.5" />
    </button>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 64},${20 - ((v - min) / (max - min || 1)) * 18 + 1}`).join(" ");
  return (
    <svg width="40" height="14" viewBox="0 0 64 22" className="shrink-0" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------ Header ------------------------------ */

function Greeting({ now }: { now: number }) {
  const { user } = useApp();
  const first = (user?.name ?? "there").split(" ")[0];
  const thisMonth = MONTHLY.revenue[MONTHLY.revenue.length - 1];
  const newStudents = MONTHLY.enrollments[MONTHLY.enrollments.length - 1];
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className={`text-[13px] leading-[20px] text-[#64748b] ${fontMedium}`}>{new Date(now).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className={`m-0 mt-1 text-[28px] leading-[36px] tracking-[-0.4px] text-[#0f172a] ${fontHeading}`}>
          {greeting(now)}, {first}
        </h1>
        <p className={`mt-1 text-[15px] leading-[22px] text-[#475569] ${fontRegular}`}>
          You earned <span className={`text-[#0f172a] ${fontSemi}`}>{money(thisMonth)}</span> and gained <span className={`text-[#0f172a] ${fontSemi}`}>{newStudents} new students</span> so far this month.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={openCreateSession} className={`flex h-10 items-center gap-2 rounded-[10px] border border-[#cbd5e1] bg-white px-4 text-[14px] text-[#1e293b] transition hover:bg-[#f8fafc] ${fontMedium}`}>
          <Icon path={P.video} className="size-[18px]" />
          Schedule live session
        </button>
        <button type="button" onClick={() => openInstructorCourses(true)} className={`flex h-10 items-center gap-2 rounded-[10px] bg-[#ffb20d] px-4 text-[14px] text-[#1e293b] shadow-[0_6px_16px_rgba(255,178,13,0.3)] transition hover:bg-[#faa104] ${fontSemi}`}>
          <Icon path={P.plus} className="size-[18px]" strokeWidth={2.5} />
          New course
        </button>
      </div>
    </div>
  );
}

function UpNext({ now }: { now: number }) {
  const next = upcomingSessions(now)[0];
  if (!next) return null;
  const { course, title, end, minutesLeft, canJoin, running } = sessionInfo(next, now);
  if (minutesLeft > 24 * 60) return null;
  const when = running ? "Live now" : minutesLeft <= 60 ? `Starts in ${minutesLeft} min` : `${dayLabel(next.start, now)} at ${formatTime(next.start)}`;
  return (
    <section aria-label="Next live session" className="relative overflow-hidden rounded-[14px] bg-[#0f172a] p-4 text-white md:p-5">
      <div aria-hidden="true" className="absolute -right-16 -top-24 size-[260px] rounded-full bg-[#ffb20d]/15 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-24 left-1/3 size-[220px] rounded-full bg-[#12b981]/10 blur-3xl" />
      <div className="relative flex flex-wrap items-center gap-4 md:gap-5">
        <img src={course.image} alt="" className="aspect-video w-[120px] shrink-0 rounded-[10px] object-cover ring-1 ring-white/10 md:w-[148px]" />
        <div className="min-w-[200px] flex-1">
          <p className={`flex items-center gap-2 text-[12px] uppercase leading-[18px] tracking-[0.8px] text-[#ffb20d] ${fontSemi}`}>
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#ffb20d] opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-[#ffb20d]" />
            </span>
            Up next · {when}
          </p>
          <p className={`mt-1 text-[18px] leading-[26px] ${fontSemi}`}>{title}</p>
          <p className={`text-[13px] leading-[20px] text-[#94a3b8] ${fontRegular}`}>
            {next.session ? `${next.session} · ` : ""}
            {formatTime(next.start)} – {formatTime(end)} · 1h {String(Math.round((end - next.start) / 60000) % 60).padStart(2, "0")}m
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => openCourse(course)} className={`h-10 rounded-[10px] border border-white/20 px-4 text-[14px] text-white transition hover:bg-white/10 ${fontMedium}`}>
            View session
          </button>
          <JoinLive canJoin={canJoin} />
        </div>
      </div>
    </section>
  );
}

function JoinLive({ canJoin }: { canJoin: boolean }) {
  const { notify } = useApp();
  return (
    <button
      type="button"
      disabled={!canJoin}
      title={canJoin ? undefined : "You can join 15 minutes before the start time"}
      onClick={() => notify("The live classroom isn't connected yet")}
      className={`flex h-10 items-center gap-2 rounded-[10px] bg-[#ffb20d] px-4 text-[14px] text-[#1e293b] transition hover:bg-[#faa104] disabled:cursor-not-allowed disabled:opacity-50 ${fontSemi}`}
    >
      <Icon path={P.video} className="size-[18px]" />
      Join now
    </button>
  );
}

/* --------------------------- Overview card --------------------------- */

type MetricKey = "revenue" | "enrollments" | "rating" | "completion";

const METRICS: Record<MetricKey, { label: string; value: string; delta: number; unit: string; format: (v: number) => string; axis: (v: number) => string; onOpen: () => void; sum: boolean }> = {
  revenue: { label: "Total revenue", value: money(TOTAL_REVENUE), delta: -16, unit: "%", format: money, axis: compactMoney, onOpen: () => openInstructorReports("revenue"), sum: true },
  enrollments: { label: "Students", value: TOTAL_STUDENTS.toLocaleString("en-US"), delta: -23, unit: "%", format: (v) => v.toLocaleString("en-US"), axis: String, onOpen: () => openInstructorReports(), sum: true },
  rating: { label: "Instructor rating", value: weighted("rating").toFixed(1), delta: 0.1, unit: "", format: (v) => v.toFixed(1), axis: (v) => v.toFixed(1), onOpen: openInstructorReviews, sum: false },
  completion: { label: "Avg. completion", value: `${Math.round(weighted("completion"))}%`, delta: 3, unit: " pts", format: (v) => `${v}%`, axis: (v) => `${v}%`, onOpen: () => openInstructorReports(), sum: false },
};

function AreaChart({ labels, values, format, axis, inProgress }: { labels: string[]; values: number[]; format: (v: number) => string; axis: (v: number) => string; inProgress: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(720);
  useEffect(() => {
    if (!boxRef.current) return;
    const observer = new ResizeObserver(([entry]) => setW(Math.max(280, entry.contentRect.width)));
    observer.observe(boxRef.current);
    return () => observer.disconnect();
  }, []);
  const H = 260;
  const pad = { top: 16, right: 12, bottom: 28, left: 48 };
  const max = Math.max(...values);
  const min = Math.min(...values);
  // Round axis steps to 1, 2, 2.5 or 5 times a power of ten so labels read cleanly.
  const niceStep = (span: number) => {
    const raw = span / 4;
    const pow = 10 ** Math.floor(Math.log10(raw));
    return ([1, 2, 2.5, 5, 10].find((m) => m * pow >= raw) ?? 10) * pow;
  };
  const zeroBased = min <= max * 0.6;
  const step = niceStep(zeroBased ? max : max - min);
  const lo = zeroBased ? 0 : Math.floor(min / step) * step;
  const hi = Math.ceil((max + step * 0.2) / step) * step;
  const x = (i: number) => pad.left + (i / (values.length - 1)) * (W - pad.left - pad.right);
  const y = (v: number) => pad.top + (1 - (v - lo) / (hi - lo)) * (H - pad.top - pad.bottom);
  const ticks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => lo + i * step);

  // Smooth path through the points (Catmull-Rom to Bezier).
  const pathFor = (pts: [number, number][]) =>
    pts.reduce((d, p, i, a) => {
      if (i === 0) return `M${p[0]},${p[1]}`;
      const p0 = a[i - 2] ?? a[i - 1];
      const p1 = a[i - 1];
      const p3 = a[i + 1] ?? p;
      const c1 = [p1[0] + (p[0] - p0[0]) / 6, p1[1] + (p[1] - p0[1]) / 6];
      const c2 = [p[0] - (p3[0] - p1[0]) / 6, p[1] - (p3[1] - p1[1]) / 6];
      return `${d} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p[0]},${p[1]}`;
    }, "");
  const pts = values.map((v, i) => [x(i), y(v)] as [number, number]);
  const solid = inProgress ? pts.slice(0, -1) : pts;
  const line = pathFor(solid);
  const area = `${pathFor(pts)} L${x(values.length - 1)},${H - pad.bottom} L${x(0)},${H - pad.bottom} Z`;

  return (
    <div ref={boxRef} className="relative w-full" onMouseLeave={() => setHover(null)}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="block"
        role="img"
        aria-label={`Chart from ${labels[0]} to ${labels[labels.length - 1]}`}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((px - pad.left) / (W - pad.left - pad.right)) * (values.length - 1));
          setHover(i >= 0 && i < values.length ? i : null);
        }}
      >
        <defs>
          <linearGradient id="dash-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={BRAND} stopOpacity="0.28" />
            <stop offset="1" stopColor={BRAND} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="#eef2f6" />
            <text x={pad.left - 10} y={y(t) + 4} textAnchor="end" className={`fill-[#94a3b8] text-[11px] ${fontRegular}`}>
              {axis(t)}
            </text>
          </g>
        ))}
        {labels.map((m, i) => (
          (W > 520 || i % 2 === labels.length % 2 || i === hover) && <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className={`text-[11px] ${i === hover ? "fill-[#0f172a]" : "fill-[#94a3b8]"} ${fontRegular}`}>
            {m}
          </text>
        ))}
        <path d={area} fill="url(#dash-area)" />
        <path d={line} fill="none" stroke={BRAND_DARK} strokeWidth="2.5" strokeLinecap="round" />
        {inProgress && <path d={pathFor(pts.slice(-2))} fill="none" stroke={BRAND_DARK} strokeWidth="2.5" strokeDasharray="5 5" strokeLinecap="round" />}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={H - pad.bottom} stroke="#cbd5e1" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(values[hover])} r="5" fill="#fff" stroke={BRAND_DARK} strokeWidth="2.5" />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-[8px] bg-[#0f172a] px-3 py-2 text-[12px] leading-[18px] text-white shadow-lg" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <p className={`text-[#94a3b8] ${fontRegular}`}>
            {labels[hover]}
            {inProgress && hover === values.length - 1 ? " (so far)" : ""}
          </p>
          <p className={fontSemi}>{format(values[hover])}</p>
        </div>
      )}
    </div>
  );
}

function OverviewCard({ now }: { now: number }) {
  const [metric, setMetric] = useState<MetricKey>("revenue");
  const [range, setRange] = useState(12);
  const config = METRICS[metric];
  const labels = monthLabels(now).slice(-range);
  const values = MONTHLY[metric].slice(-range);
  const summary = config.sum ? config.format(values.reduce((s, v) => s + v, 0)) : config.format(values[values.length - 1]);

  return (
    <section aria-labelledby="dash-overview" className={`${card} min-w-0 overflow-hidden`}>
      <h2 id="dash-overview" className="sr-only">
        Overview
      </h2>
      <div role="tablist" aria-label="Metric" className="grid grid-cols-2 border-b border-[#e2e8f0] @3xl:grid-cols-4">
        {(Object.keys(METRICS) as MetricKey[]).map((key, i) => {
          const m = METRICS[key];
          const active = key === metric;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMetric(key)}
              className={`relative flex flex-col gap-1 px-5 pb-4 pt-5 text-left transition ${i % 2 === 1 ? "border-l" : ""} ${i > 1 ? "border-t @3xl:border-t-0" : ""} @3xl:border-l @3xl:first:border-l-0 border-[#e2e8f0] ${active ? "bg-white" : "bg-[#f8fafc] hover:bg-white"}`}
            >
              <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-[3px] transition ${active ? "bg-[#ffb20d]" : "bg-transparent"}`} />
              <span className={`text-[13px] leading-[20px] ${active ? "text-[#0f172a]" : "text-[#64748b]"} ${fontMedium}`}>{m.label}</span>
              <span className={`text-[24px] leading-[32px] tracking-[-0.3px] text-[#0f172a] ${fontBold}`}>{m.value}</span>
              <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <Delta value={m.delta} unit={m.unit} />
                <span className={`whitespace-nowrap text-[12px] text-[#94a3b8] ${fontRegular}`}>vs last month</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className={`text-[14px] leading-[20px] text-[#475569] ${fontRegular}`}>
            <span className={`text-[#0f172a] ${fontSemi}`}>{summary}</span> {config.sum ? `${config.label.toLowerCase()} in the last ${range} months` : `this month, up from ${config.format(values[0])} ${range} months ago`}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex rounded-[8px] bg-[#f1f5f9] p-0.5">
              {[6, 12].map((n) => (
                <button key={n} type="button" aria-pressed={range === n} onClick={() => setRange(n)} className={`h-7 rounded-[6px] px-3 text-[13px] transition ${range === n ? `bg-white text-[#0f172a] shadow-sm ${fontSemi}` : `text-[#64748b] hover:text-[#0f172a] ${fontMedium}`}`}>
                  {n} months
                </button>
              ))}
            </div>
            <LinkButton label="Details" onClick={config.onOpen} />
          </div>
        </div>
        <AreaChart key={`${metric}-${range}`} labels={labels} values={values} format={config.format} axis={config.axis} inProgress />
        <p className={`mt-2 flex items-center gap-2 text-[12px] text-[#94a3b8] ${fontRegular}`}>
          <span className="h-0 w-5 border-t-2 border-dashed border-[#c98003]" /> Current month, still in progress
        </p>
      </div>
    </section>
  );
}

/* --------------------------- Course table --------------------------- */

function healthOf(completion: number) {
  if (completion >= 60) return { color: "#16a34a", label: "Healthy" };
  if (completion >= 40) return { color: "#f59e0b", label: "Average" };
  return { color: "#dc2626", label: "Low completion" };
}

function CoursesCard() {
  const sorted = [...COURSES].sort((a, b) => b.revenue - a.revenue);
  const top = sorted[0].revenue;
  const head = `text-[12px] leading-[18px] text-[#64748b] ${fontMedium}`;
  const cols = "@xl:grid-cols-[minmax(0,1fr)_56px_112px_92px] @3xl:grid-cols-[minmax(0,1fr)_80px_64px_140px_104px]";
  return (
    <section aria-labelledby="dash-courses" className={`${card} min-w-0 p-5`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="dash-courses" className={cardTitle}>
            Top courses
          </h2>
          <p className={`text-[13px] leading-[20px] text-[#64748b] ${fontRegular}`}>Ranked by lifetime revenue</p>
        </div>
        <LinkButton label="All courses" onClick={() => openInstructorCourses()} />
      </div>
      <div className="@container">
        <div aria-hidden="true" className={`mt-4 hidden items-center gap-4 rounded-[8px] bg-[#f8fafc] px-3 py-2 @xl:grid ${cols}`}>
          <span className={head}>Course</span>
          <span className={`hidden @3xl:block ${head}`}>Students</span>
          <span className={head}>Rating</span>
          <span className={head}>Completion</span>
          <span className={`text-right ${head}`}>Revenue</span>
        </div>
        <ul className="mt-1 flex flex-col">
          {sorted.map((course, i) => {
            const health = healthOf(course.completion);
            return (
              <li key={course.id}>
                <button type="button" onClick={() => openInstructorCourses()} className={`grid w-full grid-cols-3 items-center gap-x-4 gap-y-3 rounded-[10px] px-3 py-3 text-left transition hover:bg-[#f8fafc] ${cols}`}>
                  <span className="col-span-3 flex min-w-0 items-center gap-3 @xl:col-span-1">
                    <span className={`w-3 shrink-0 text-center text-[13px] text-[#94a3b8] ${fontSemi}`}>{i + 1}</span>
                    <img src={course.image} alt="" className="aspect-video w-[56px] shrink-0 rounded-[6px] object-cover" />
                    <span className="min-w-0">
                      <span className={`block truncate text-[14px] leading-[20px] text-[#0f172a] ${fontMedium}`}>{course.title}</span>
                      <span className={`flex min-w-0 items-center gap-1.5 whitespace-nowrap text-[12px] leading-[18px] ${course.completion < 40 ? "text-[#b91c1c]" : "text-[#64748b]"} ${fontRegular}`}>
                        {course.completion < 40 ? <Icon path={P.warning} className="size-3.5 shrink-0" /> : <Sparkline values={course.trend} color={course.trend[course.trend.length - 1] >= course.trend[0] ? "#16a34a" : "#dc2626"} />}
                        <span className="truncate">{course.completion < 40 ? "Students drop off early" : `+${course.newStudents} this week`}</span>
                      </span>
                    </span>
                  </span>
                  <span className="flex flex-col @xl:hidden @3xl:flex">
                    <span className={`text-[12px] text-[#64748b] @xl:sr-only ${fontRegular}`}>Students</span>
                    <span className={`text-[14px] tabular-nums text-[#334155] ${fontMedium}`}>{course.students.toLocaleString("en-US")}</span>
                  </span>
                  <span className="flex flex-col">
                    <span className={`text-[12px] text-[#64748b] @xl:sr-only ${fontRegular}`}>Rating</span>
                    <span className={`flex items-center gap-1 text-[14px] tabular-nums text-[#334155] ${fontMedium}`}>
                      <svg viewBox="0 0 24 24" className="size-3.5 text-[#faa104]" fill="currentColor" aria-hidden="true">
                        <path d={P.star} />
                      </svg>
                      {course.rating.toFixed(1)}
                    </span>
                  </span>
                  <span className="order-last col-span-3 flex flex-col gap-1 @xl:order-none @xl:col-span-1">
                    <span className={`text-[12px] text-[#64748b] @xl:sr-only ${fontRegular}`}>Completion</span>
                    <span className="flex items-center gap-2" title={health.label}>
                      <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#eef2f6]">
                        <span className="block h-full rounded-full" style={{ width: `${course.completion}%`, backgroundColor: health.color }} />
                      </span>
                      <span className={`w-9 text-right text-[13px] tabular-nums text-[#334155] ${fontMedium}`}>{course.completion}%</span>
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-3 @xl:justify-end">
                    <span className="flex w-full flex-col @xl:items-end">
                      <span className={`text-[12px] text-[#64748b] @xl:sr-only ${fontRegular}`}>Revenue</span>
                      <span className={`text-[14px] tabular-nums text-[#0f172a] ${fontSemi}`}>{money(course.revenue)}</span>
                      <span className="mt-1 hidden h-1 w-full overflow-hidden rounded-full bg-[#f1f5f9] @xl:block">
                        <span className="block h-full rounded-full bg-[#ffb20d]" style={{ width: `${(course.revenue / top) * 100}%` }} />
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* -------------------------- Upcoming sessions -------------------------- */

function SessionsCard({ now }: { now: number }) {
  const sessions = upcomingSessions(now).slice(1, 4);
  return (
    <section aria-labelledby="dash-sessions" className={`${card} min-w-0 p-5`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="dash-sessions" className={cardTitle}>
          Later on your schedule
        </h2>
        <LinkButton label="Full schedule" onClick={openInstructorSchedule} />
      </div>
      {sessions.length === 0 ? (
        <p className={`py-8 text-center text-[14px] text-[#64748b] ${fontRegular}`}>Nothing else scheduled.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {sessions.map((item) => {
            const { course, title, end, canJoin } = sessionInfo(item, now);
            const d = new Date(item.start);
            return (
              <li key={item.id} className="flex items-center gap-4 rounded-[10px] border border-[#eef2f6] p-3 transition hover:border-[#e2e8f0] hover:bg-[#f8fafc]">
                <span className="flex w-12 shrink-0 flex-col items-center rounded-[8px] bg-[#fff7e6] py-1.5">
                  <span className={`text-[11px] uppercase leading-[14px] text-[#976002] ${fontSemi}`}>{d.toLocaleDateString("en-US", { month: "short" })}</span>
                  <span className={`text-[18px] leading-[24px] text-[#0f172a] ${fontBold}`}>{d.getDate()}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => openCourse(course)} className={`block max-w-full truncate text-left text-[14px] leading-[20px] text-[#0f172a] hover:underline ${fontMedium}`}>
                    {title}
                  </button>
                  <p className={`text-[12px] leading-[18px] text-[#64748b] ${fontRegular}`}>
                    {dayLabel(item.start, now)} · {formatTime(item.start)} – {formatTime(end)}
                    {item.session ? ` · ${item.session}` : ""}
                  </p>
                </div>
                {canJoin ? <JoinButton canJoin /> : <Icon path={P.chevron} className="size-4 shrink-0 text-[#94a3b8]" />}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ----------------------------- Right rail ----------------------------- */

function BalanceCard({ now }: { now: number }) {
  const tile = (label: string) => {
    const raw = PAYOUT_TILES.find((t) => t.label === label)?.value ?? "";
    return raw.includes("$") ? money(Number(raw.replace(/[^0-9.]/g, ""))) : raw;
  };
  const payout = payoutInfo(now);
  return (
    <section aria-labelledby="dash-balance" className="relative overflow-hidden rounded-[14px] bg-[#0f172a] p-5 text-white">
      <div aria-hidden="true" className="absolute -right-10 -top-16 size-[180px] rounded-full bg-[#ffb20d]/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <h2 id="dash-balance" className={`m-0 flex items-center gap-2 text-[14px] leading-[20px] text-[#cbd5e1] ${fontMedium}`}>
            <Icon path={P.wallet} className="size-4" />
            Available balance
          </h2>
          <span className={`rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-[#e2e8f0] ${fontMedium}`}>USD</span>
        </div>
        <p className={`mt-3 text-[34px] leading-[40px] tracking-[-0.5px] ${fontBold}`}>{tile("Available Balance")}</p>
        <div className="mt-4">
          <div className={`mb-1.5 flex justify-between text-[12px] text-[#94a3b8] ${fontRegular}`}>
            <span>Next payout {payout.label}</span>
            <span className={`text-white ${fontMedium}`}>
              {payout.daysLeft} {plural(payout.daysLeft, "day")} left
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#ffb20d]" style={{ width: `${Math.max(4, payout.progress * 100)}%` }} />
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
          {[
            ["Sales", tile("Total Sales")],
            ["Refunds", tile("Total Refund")],
            ["Expected", tile("Expected Earnings")],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className={`text-[12px] text-[#94a3b8] ${fontRegular}`}>{label}</dt>
              <dd className={`m-0 text-[14px] text-white ${fontSemi}`}>{value}</dd>
            </div>
          ))}
        </dl>
        <button type="button" onClick={() => openInstructorReports("revenue")} className={`mt-5 flex h-10 w-full items-center justify-center gap-1 rounded-[10px] bg-white text-[14px] text-[#0f172a] transition hover:bg-[#f1f5f9] ${fontSemi}`}>
          View revenue report
          <Icon path={P.chevron} className="size-3.5" />
        </button>
      </div>
    </section>
  );
}

function TodoCard() {
  const tasks = [
    { count: uncheckedSubmissionCount(), label: (n: number) => `${plural(n, "assignment")} to grade`, hint: "Students are waiting on feedback", path: P.doc, tone: "#7c3aed", bg: "#ede9fe", open: () => openInstructorAssignments() },
    { count: unansweredQuestionCount(), label: (n: number) => `unanswered ${plural(n, "question")}`, hint: "Reply in Q&A", path: P.question, tone: "#0284c7", bg: "#e0f2fe", open: () => openInstructorQa() },
    { count: unrepliedReviewCount(), label: (n: number) => `${plural(n, "review")} to reply to`, hint: "Thank students or follow up", path: P.star, tone: "#c98003", bg: "#fff3d6", open: openInstructorReviews },
    { count: pendingCoRequestCount(), label: (n: number) => `co-instructor ${plural(n, "request")}`, hint: "Accept or decline", path: P.user, tone: "#059669", bg: "#d1fae5", open: openCoInstructorRequests },
    { count: rejectedCourseCount(), label: (n: number) => `rejected ${plural(n, "course")}`, hint: "Update and resubmit", path: P.warning, tone: "#dc2626", bg: "#fee2e2", open: () => openInstructorCourses() },
  ].filter((t) => t.count > 0);
  const total = tasks.reduce((s, t) => s + t.count, 0);

  return (
    <section aria-labelledby="dash-todo" className={`${card} flex min-w-0 flex-col p-5`}>
      <div className="flex items-center gap-2">
        <h2 id="dash-todo" className={cardTitle}>
          To do
        </h2>
        {total > 0 && <span className={`rounded-full bg-[#fee2e2] px-2 py-0.5 text-[12px] leading-[16px] text-[#b91c1c] ${fontSemi}`}>{total}</span>}
      </div>
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-[#dcfce7] text-[#16a34a]">
            <Icon path={P.check} />
          </span>
          <p className={`text-[14px] text-[#64748b] ${fontRegular}`}>You're all caught up.</p>
        </div>
      ) : (
        <ul className="-mx-2 mt-2 flex flex-col">
          {tasks.map((task) => (
            <li key={task.hint}>
              <button type="button" onClick={task.open} className="group flex w-full items-center gap-3 rounded-[10px] p-2 text-left transition hover:bg-[#f8fafc]">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px]" style={{ backgroundColor: task.bg, color: task.tone }}>
                  <Icon path={task.path} className="size-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-[14px] leading-[20px] text-[#0f172a] ${fontMedium}`}>
                    <span className={fontBold}>{task.count}</span> {task.label(task.count)}
                  </span>
                  <span className={`block text-[12px] leading-[18px] text-[#64748b] ${fontRegular}`}>{task.hint}</span>
                </span>
                <Icon path={P.chevron} className="size-4 shrink-0 text-[#cbd5e1] transition group-hover:translate-x-0.5 group-hover:text-[#64748b]" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const ACTIVITY_STYLE: Record<(typeof ACTIVITY)[number]["kind"], { path: string; tone: string; bg: string }> = {
  enroll: { path: P.user, tone: "#059669", bg: "#d1fae5" },
  review: { path: P.star, tone: "#c98003", bg: "#fff3d6" },
  question: { path: P.question, tone: "#0284c7", bg: "#e0f2fe" },
  assignment: { path: P.doc, tone: "#7c3aed", bg: "#ede9fe" },
  complete: { path: P.award, tone: "#0f172a", bg: "#e2e8f0" },
};

function ActivityCard() {
  return (
    <section aria-labelledby="dash-activity" className={`${card} @container min-w-0 p-5`}>
      <h2 id="dash-activity" className={cardTitle}>
        Recent activity
      </h2>
      <ol className="relative mt-4 grid gap-4 @2xl:grid-cols-2 @2xl:gap-x-8 @5xl:grid-cols-3">
        <span aria-hidden="true" className="absolute bottom-3 left-[15px] top-3 w-px bg-[#eef2f6] @2xl:hidden" />
        {ACTIVITY.map((a) => {
          const s = ACTIVITY_STYLE[a.kind];
          return (
            <li key={a.who + a.kind} className="relative flex gap-3">
              <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white" style={{ backgroundColor: s.bg, color: s.tone }}>
                <Icon path={s.path} className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-[13px] leading-[20px] text-[#475569] ${fontRegular}`}>
                  <span className={`text-[#0f172a] ${fontSemi}`}>{a.who}</span> {a.what} <span className={`text-[#0f172a] ${fontMedium}`}>{a.target}</span>
                </p>
                <p className={`text-[12px] leading-[18px] text-[#94a3b8] ${fontRegular}`}>{a.ago}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* -------------------------------- Page -------------------------------- */

export default function InstructorOverview() {
  const [now] = useState(() => Date.now());
  return (
    <main className="@container flex flex-1 flex-col bg-[#f6f7f9]">
      <div className="flex w-full flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
        <Greeting now={now} />
        <UpNext now={now} />
        <div className="grid gap-5 @4xl:grid-cols-[minmax(0,1fr)_320px] @[90rem]:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-5">
            <OverviewCard now={now} />
            <CoursesCard />
            <SessionsCard now={now} />
          </div>
          {/* Stacked below the main column on mid-size screens, the rail becomes a 2-column grid so cards never stretch edge to edge. */}
          <div className="grid min-w-0 content-start gap-5 @2xl:grid-cols-2 @4xl:grid-cols-1">
            <BalanceCard now={now} />
            <TodoCard />
            <div className="@2xl:col-span-2 @4xl:col-span-1">
              <ActivityCard />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
