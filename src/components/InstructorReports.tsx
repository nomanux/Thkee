import { useState, type ReactNode } from "react";
import PageHeader, { pageBody, pageShell } from "./PageHeader";
import { fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { openInstructorReports, openInstructorReviews, useApp } from "../store";
import { Checkbox } from "./InstructorAssignments";
import { Donut, LineChart, type ChartSeries } from "./InstructorCharts";
import { Pagination } from "./InstructorCourses";
import { FilterSelect } from "./Menus";
import { buttonClass } from "./Button";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ArrowDownRight01Icon, ArrowRight01Icon, ArrowUpRight01Icon, Calendar03Icon, Download04Icon, ReturnRequestIcon, StarIcon, UserGroupIcon } from "@hugeicons/core-free-icons";


const MONTHS = ["May 2021", "June 2021", "July 2021", "Aug 2021", "Sep 2021", "Oct 2021", "Nov 2021", "Dec 2021", "Jan 2022", "Feb 2022", "Mar 2022"];

const COLORS = { organic: "#6bafc9", ad: "#0b3d7a", affiliate: "#991b1b", promotional: "#ffb20d" };
const REVENUE_SERIES: ChartSeries[] = [
  { key: "organic", label: "Organic", color: COLORS.organic, values: [118, 118, 160, 92, 115, 165, 128, 175, 262, 208, 212] },
  { key: "ad", label: "Ad program", color: COLORS.ad, values: [48, 56, 108, 58, 63, 102, 82, 134, 168, 152, 180] },
  { key: "affiliate", label: "Affiliate", color: COLORS.affiliate, values: [32, 40, 68, 42, 46, 68, 60, 90, 80, 112, 90] },
  { key: "promotional", label: "Promotional", color: COLORS.promotional, values: [15, 22, 40, 25, 37, 42, 48, 70, 50, 23, 33] },
];

const money = (v: number) => `$${v.toFixed(2)}`;
const titleStyle = { fontVariationSettings: '"wdth" 100' };
const titleClass = "m-0 font-instrument-medium text-2xl font-medium leading-8 text-slate-900";

export function InfoTip({ text, tone = "gray", light }: { text: string; tone?: "gray" | "amber"; light?: boolean }) {
  return (
    <span className="group/tip relative inline-flex shrink-0">
      <button type="button" aria-label={text} className="flex">
        {tone === "gray" ? (
          <svg viewBox="0 0 20 20" className="size-4 text-slate-400" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" className={`size-3.5 ${light ? "text-secondary-500" : "text-secondary-600"}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <circle cx="10" cy="10" r="8" />
            <path d="M10 6v5M10 14h.01" />
          </svg>
        )}
      </button>
      <span role="tooltip" className={`pointer-events-none absolute bottom-full -right-2 z-20 mb-2 hidden w-65 rounded-md bg-slate-800 px-2.5 py-2 text-left text-xs leading-4.5 text-white group-focus-within/tip:block group-hover/tip:block ${fontRegular}`}>
        {text}
      </span>
    </span>
  );
}

function SeriesToggles({ series, on, toggle }: { series: ChartSeries[]; on: string[]; toggle: (key: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      {series.map((s) => (
        <Checkbox key={s.key} checked={on.includes(s.key)} onChange={() => toggle(s.key)}>
          <span className={`text-sm leading-5 text-slate-700 ${fontRegular}`}>{s.label}</span>
          <span aria-hidden="true" className="h-0.75 w-4 rounded-full" style={{ backgroundColor: s.color }} />
        </Checkbox>
      ))}
    </div>
  );
}

function PeriodSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="w-46.75">
      <FilterSelect
        plain
        alignRight
        label="Period"
        value={value}
        onChange={onChange}
        options={[
          { value: "all", label: "All time" },
          { value: "12m", label: "Last 12 months" },
          { value: "30d", label: "Last 30 days" },
        ]}
      />
    </div>
  );
}

function useToggles(initial: string[]) {
  const [on, setOn] = useState(initial);
  return { on, toggle: (key: string) => setOn((list) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key])) };
}



const PAYOUT_TIP = "Your payout schedule is monthly. Expected earnings shown are based on current sales, subject to change with additional sales or refunds before payout.";
export const PAYOUT_TILES: { value: string; label: string; bg: string; color: string; icon: ReactNode; tip: string }[] = [
  { value: "$ 3845.00", label: "Expected Earnings", bg: "#d1fae5", color: "#059669", icon: <path d="M17 7L7 17M7 9v8h8" />, tip: PAYOUT_TIP },
  { value: "$ 3845.00", label: "Available Balance", bg: "#e0f2fe", color: "#0284c7", icon: <path d="M17 7L7 17M7 9v8h8" />, tip: "The amount that is ready to be paid out on your next payout date." },
  { value: "$ 200.00", label: "Total Refund", bg: "#fee2e2", color: "#dc2626", icon: <path d="M7 17L17 7M9 7h8v8" />, tip: "Refunds processed during this payout period." },
  { value: "43", label: "Total Sales", bg: "#ede9fe", color: "#7c3aed", icon: <path d="M3 4h2l2.4 11h10.2L20 7H6M9 20h.01M17 20h.01" />, tip: "Course sales made during this payout period." },
];

// ---------- Overview: what an instructor needs first ----------
// 1. How much did I earn, is it growing?  2. When do I get paid?
// 3. Are learners coming and happy?       4. Which channel and which course drive it?

const MONTHLY_ENROLLMENTS = [96, 120, 148, 131, 152, 201, 176, 139, 184, 232, 244];
const MONTHLY_RATING = [4.7, 4.5, 4.2, 4.6, 5, 3.6, 4.4, 4.6, 5, 3.6, 4.4];
const MONTHLY_REFUNDS = [12, 18, 9, 22, 15, 30, 14, 25, 19, 41, 28];
const MONTHLY_REVENUE = MONTHS.map((_, i) => REVENUE_SERIES.reduce((sum, s) => sum + s.values[i], 0));
const TOP_COURSES = [
  { title: "Database Management Systems", students: 812, revenue: 1640.5, rating: 4.6, completion: 68 },
  { title: "Object Oriented Java Programming", students: 604, revenue: 1122.3, rating: 4.3, completion: 54 },
  { title: "Fundamental of Data Structure", students: 407, revenue: 653.82, rating: 3.8, completion: 41 },
];
const BRAND = "#0d5c4b";

const usd = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const usdShort = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${Math.round(v)}`);
const pctChange = (now: number, before: number) => (before ? ((now - before) / before) * 100 : 0);

function HIcon({ icon, size = 16, className = "" }: { icon: IconSvgElement; size?: number; className?: string }) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.8} aria-hidden="true" className={`shrink-0 ${className}`} />;
}

/** Signed change vs. last month. `goodWhenUp` decides the color, the arrow always shows direction. */
function Delta({ value, goodWhenUp = true }: { value: number; goodWhenUp?: boolean }) {
  const up = value >= 0;
  const good = up === goodWhenUp;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs ${good ? "bg-primary-50 text-primary-700" : "bg-red-50 text-red-700"} ${fontMedium}`}>
      <HIcon icon={up ? ArrowUpRight01Icon : ArrowDownRight01Icon} size={12} />
      {Math.abs(value).toFixed(0)}%
    </span>
  );
}

/** A headline number with a plain-language comparison: no chart to decode. */
function StatTile({ icon, label, value, delta, goodWhenUp, now, before, unit, action }: { icon: IconSvgElement; label: string; value: string; delta: number; goodWhenUp?: boolean; now: string; before: string; unit?: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary-700 text-white">
          <HIcon icon={icon} size={18} />
        </span>
        <p className={`text-13 text-slate-600 ${fontMedium}`}>{label}</p>
        {action && (
          <button type="button" onClick={action.onClick} className={`ml-auto inline-flex items-center gap-0.5 text-13 text-primary-700 transition hover:text-primary-800 ${fontSemi}`}>
            {action.label}
            <HIcon icon={ArrowRight01Icon} size={14} />
          </button>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2.5">
        <p className={`text-3xl leading-none text-slate-900 ${fontHeading}`}>{value}</p>
        <Delta value={delta} goodWhenUp={goodWhenUp} />
      </div>
      <dl className={`mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs ${fontRegular}`}>
        <div>
          <dt className="text-slate-400">This month</dt>
          <dd className={`m-0 mt-0.5 text-sm text-slate-800 ${fontSemi}`}>
            {now}
            {unit && <span className={`text-slate-400 ${fontRegular}`}> {unit}</span>}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Last month</dt>
          <dd className={`m-0 mt-0.5 text-sm text-slate-600 ${fontMedium}`}>
            {before}
            {unit && <span className={`text-slate-400 ${fontRegular}`}> {unit}</span>}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function Overview() {
  const [range, setRange] = useState<"6m" | "12m">("12m");
  const span = range === "6m" ? 6 : MONTHS.length;
  const from = MONTHS.length - span;
  const months = MONTHS.slice(from);
  const revenue = MONTHLY_REVENUE.slice(from);
  const last = MONTHS.length - 1;

  const periodRevenue = revenue.reduce((a, b) => a + b, 0);
  const thisMonth = MONTHLY_REVENUE[last];
  const revenueDelta = pctChange(thisMonth, MONTHLY_REVENUE[last - 1]);
  const yMax = Math.ceil(Math.max(...revenue) / 200) * 200;
  const ticks = Array.from({ length: yMax / 200 + 1 }, (_, i) => i * 200);

  const channels = REVENUE_SERIES.map((s) => ({ label: s.label, value: s.values.slice(from).reduce((a, b) => a + b, 0) })).sort((a, b) => b.value - a.value);
  const channelMax = channels[0].value;

  const exportCsv = () => {
    const csv = ["Month,Revenue,Enrollments,Rating,Refunds", ...months.map((m, i) => `${m},${revenue[i].toFixed(2)},${MONTHLY_ENROLLMENTS[from + i]},${MONTHLY_RATING[from + i]},${MONTHLY_REFUNDS[from + i]}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `thkee-report-${range}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className={pageShell}>
      <div className={pageBody}>
        {/* Header + the one filter row that scopes everything below */}
        <PageHeader title="Reports" description="Your earnings, learners and best-selling courses at a glance.">
            <div role="group" aria-label="Date range" className="flex rounded-lg border border-slate-200 bg-white p-0.5">
              {(
                [
                  ["6m", "Last 6 months"],
                  ["12m", "Last 12 months"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={range === key}
                  onClick={() => setRange(key)}
                  className={`h-8 rounded-md px-3 text-13 transition ${range === key ? `bg-slate-100 text-slate-900 ${fontSemi}` : `text-slate-500 hover:text-slate-800 ${fontMedium}`}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button type="button" onClick={exportCsv} className={buttonClass("secondary", "md")}>
              <HIcon icon={Download04Icon} />
              Export
            </button>
        </PageHeader>

        {/* 1. Money: hero figure + trend, next to when it gets paid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <section aria-label="Revenue" className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className={`text-13 text-slate-500 ${fontRegular}`}>Revenue · {range === "6m" ? "last 6 months" : "last 12 months"}</p>
                <p className={`mt-1 text-5xl leading-none tracking-tight text-slate-900 ${fontHeading}`}>{usd(periodRevenue)}</p>
                <p className={`mt-3 flex flex-wrap items-center gap-2 text-13 text-slate-500 ${fontRegular}`}>
                  <span className={`text-slate-800 ${fontSemi}`}>{usd(thisMonth)}</span> in {MONTHS[last]}
                  <Delta value={revenueDelta} />
                  <span>vs last month</span>
                </p>
              </div>
              <button type="button" onClick={() => openInstructorReports("revenue")} className={`inline-flex items-center gap-1 text-13 text-primary-700 transition hover:text-primary-800 ${fontSemi}`}>
                Full revenue report
                <HIcon icon={ArrowRight01Icon} size={14} />
              </button>
            </div>
            <div className="mt-6">
              <LineChart months={months} series={[{ key: "revenue", label: "Revenue", color: BRAND, values: revenue }]} yMax={yMax} ticks={ticks} height={240} tickLabel={usdShort} valueLabel={usd} />
            </div>
          </section>

          {/* State the instructor waits on: the one tinted callout on the page */}
          <section aria-label="Next payout" className="bg-payout-pattern relative flex flex-col overflow-hidden rounded-2xl bg-primary-900 p-5 text-white md:p-6">
            <img src="/illustrations/digital-wallet-line.svg" alt="" aria-hidden="true" className="pointer-events-none absolute -right-8 -top-1 size-44 opacity-60" />

            <div className="relative">
              <span className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-primary-400 ${fontSemi}`}>
                Next payout
                <InfoTip text={PAYOUT_TIP} />
              </span>
              <p className={`mt-3 text-4xl leading-none tracking-tight ${fontHeading}`}>$3,845.00</p>
              <p className={`mt-2.5 flex items-center gap-1.5 text-13 text-primary-300 ${fontRegular}`}>
                <HIcon icon={Calendar03Icon} size={14} />
                Paid on 3 July 2022
              </p>
            </div>

            {/* Where we are in this payout cycle */}
            <div className="relative mt-5">
              <div className={`flex items-center justify-between text-xs ${fontRegular}`}>
                <span className="text-primary-300">Payout cycle</span>
                <span className={`text-primary-200 ${fontMedium}`}>9 days to go</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-white/10" role="progressbar" aria-label="Payout cycle progress" aria-valuenow={70} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full w-7/10 rounded-full bg-white" />
              </div>
            </div>

            <dl className={`relative mt-5 flex flex-col divide-y divide-white/10 rounded-xl bg-white/5 px-4 text-13 ring-1 ring-inset ring-white/10 backdrop-blur-sm ${fontRegular}`}>
              {[
                ["Available now", "$3,845.00", "text-white"],
                ["Sales this period", "43", "text-white"],
                ["Refunds", "−$200.00", "text-primary-200"],
              ].map(([k, v, tone]) => (
                <div key={k} className="flex items-center justify-between py-2.5">
                  <dt className="text-primary-300">{k}</dt>
                  <dd className={`m-0 tabular-nums ${tone} ${fontMedium}`}>{v}</dd>
                </div>
              ))}
            </dl>
            <p className={`relative mt-auto pt-4 text-xs leading-relaxed text-primary-400 ${fontRegular}`}>Final amount can change with new sales or refunds before the payout date.</p>
          </section>
        </div>

        {/* 2. Learners: are they coming, are they happy, are they leaving? */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatTile
            icon={UserGroupIcon}
            label="New students"
            value={MONTHLY_ENROLLMENTS.slice(from).reduce((a, b) => a + b, 0).toLocaleString()}
            delta={pctChange(MONTHLY_ENROLLMENTS[last], MONTHLY_ENROLLMENTS[last - 1])}
            now={String(MONTHLY_ENROLLMENTS[last])}
            before={String(MONTHLY_ENROLLMENTS[last - 1])}
            unit="students"
          />
          <StatTile
            icon={StarIcon}
            label="Average rating"
            value={(MONTHLY_RATING.slice(from).reduce((a, b) => a + b, 0) / span).toFixed(1)}
            delta={pctChange(MONTHLY_RATING[last], MONTHLY_RATING[last - 1])}
            now={MONTHLY_RATING[last].toFixed(1)}
            before={MONTHLY_RATING[last - 1].toFixed(1)}
            unit="/ 5"
            action={{ label: "Reviews", onClick: openInstructorReviews }}
          />
          <StatTile
            icon={ReturnRequestIcon}
            label="Refunds"
            value={MONTHLY_REFUNDS.slice(from).reduce((a, b) => a + b, 0).toString()}
            delta={pctChange(MONTHLY_REFUNDS[last], MONTHLY_REFUNDS[last - 1])}
            goodWhenUp={false}
            now={String(MONTHLY_REFUNDS[last])}
            before={String(MONTHLY_REFUNDS[last - 1])}
            unit="refunds"
          />
        </div>

        {/* 3. What drives it: channels (ranked bars, one hue) and courses */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <section aria-label="Revenue by channel" className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
            <h2 className={`m-0 text-base text-slate-900 ${fontSemi}`}>Where sales come from</h2>
            <p className={`mt-0.5 text-13 text-slate-500 ${fontRegular}`}>Revenue by channel, same period</p>
            <ul className="m-0 mt-5 flex list-none flex-col gap-4 p-0">
              {channels.map((c) => {
                const share = Math.round((c.value / periodRevenue) * 100);
                return (
                  <li key={c.label} className={`group text-13 ${fontRegular}`} title={`${c.label}: ${usd(c.value)} (${share}%)`}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-slate-700">{c.label}</span>
                      <span className="tabular-nums text-slate-500">
                        <span className={`text-slate-900 ${fontMedium}`}>{usd(c.value)}</span> · {share}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-primary-700 transition-opacity group-hover:opacity-80" style={{ width: `${(c.value / channelMax) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-label="Top courses" className="overflow-hidden rounded-2xl border border-slate-200 bg-white lg:col-span-2">
            <div className="flex items-center justify-between gap-3 px-5 pt-5 md:px-6 md:pt-6">
              <div>
                <h2 className={`m-0 text-base text-slate-900 ${fontSemi}`}>Top courses</h2>
                <p className={`mt-0.5 text-13 text-slate-500 ${fontRegular}`}>Ranked by revenue</p>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className={`w-full min-w-xl text-13 ${fontRegular}`}>
                <thead>
                  <tr className="border-b border-slate-100 text-start text-xs text-slate-400">
                    <th className={`px-5 py-2 text-start md:px-6 ${fontMedium}`}>Course</th>
                    <th className={`px-3 py-2 text-end ${fontMedium}`}>Students</th>
                    <th className={`px-3 py-2 text-end ${fontMedium}`}>Rating</th>
                    <th className={`px-3 py-2 text-start ${fontMedium}`}>Completion</th>
                    <th className={`px-5 py-2 text-end md:px-6 ${fontMedium}`}>Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {TOP_COURSES.map((c, i) => (
                    <tr key={c.title} className="transition hover:bg-slate-25">
                      <td className="px-5 py-3.5 md:px-6">
                        <span className="flex items-center gap-3">
                          <span className={`w-4 text-xs tabular-nums text-slate-400 ${fontSemi}`}>{i + 1}</span>
                          <span className={`text-slate-800 ${fontMedium}`}>{c.title}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-end tabular-nums text-slate-600">{c.students.toLocaleString()}</td>
                      <td className="px-3 py-3.5 text-end tabular-nums">
                        <span className={`inline-flex items-center gap-1 ${c.rating < 4 ? "text-red-700" : "text-slate-600"}`}>
                          <HIcon icon={StarIcon} size={12} className="fill-current text-secondary-500" />
                          {c.rating.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-20 rounded-full bg-primary-50">
                            <span className="block h-full rounded-full bg-primary-700" style={{ width: `${c.completion}%` }} />
                          </span>
                          <span className="tabular-nums text-slate-500">{c.completion}%</span>
                        </span>
                      </td>
                      <td className={`px-5 py-3.5 text-end tabular-nums text-slate-900 md:px-6 ${fontSemi}`}>{usd(c.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

const STAT_TIP = "Figures update when new sales, refunds or payouts are recorded.";
const Up = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 24" className="size-3 shrink-0" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);
const Down = () => (
  <svg viewBox="0 0 24 24" className="size-3 shrink-0" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);

const REVENUE_ROWS = Array.from({ length: 65 }, (_, i) => {
  const date = new Date(2021, 2 - i, 1);
  return { month: date.toLocaleString("en-US", { month: "short", year: "numeric" }), sales: [20, 30, 50, 33, 66, 11, 21][i % 7], earnings: "$2.36", refund: "$86.37", payment: i === 0 ? "Due on July 08, 2021" : "Paid on July 08, 2021" };
});
const REVENUE_PAGE = 7;
const REVENUE_COLUMNS = "grid grid-cols-reports-summary items-center px-5";

function SortCell({ label }: { label: string }) {
  return (
    <span className={`flex items-center gap-1.5 whitespace-nowrap text-sm leading-6 text-white ${fontMedium}`}>
      {label}
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}

function RevenueReport() {
  const [period, setPeriod] = useState("all");
  const [page, setPage] = useState(1);
  const { on, toggle } = useToggles(REVENUE_SERIES.map((s) => s.key));
  const start = (page - 1) * REVENUE_PAGE;
  const rows = REVENUE_ROWS.slice(start, start + REVENUE_PAGE);
  const smallText = `flex flex-wrap items-center gap-x-0.5 gap-y-1 text-xs leading-4.5 ${fontRegular}`;

  return (
    <main className="flex flex-1 flex-col bg-slate-150">
      <div className="bg-white px-4 py-6 md:px-8">
        <h1 className={`flex h-10.5 items-center ${titleClass}`} style={titleStyle}>
          Revenue Report
        </h1>
      </div>
      <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-7">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="flex flex-col gap-3 rounded-md bg-ai-600 p-5">
            <p className={`text-base leading-6 text-white ${fontRegular}`}>Total Revenue</p>
            <p className={`flex items-center gap-2 text-22 leading-8 text-white ${fontHeading}`}>
              $3416.62 <InfoTip tone="amber" light text={STAT_TIP} />
            </p>
            <p className={`${smallText} text-slate-300`}>
              <Up color="#34d399" />
              <span className="text-emerald-400">+12.4%</span> this month
            </p>
          </div>
          {[
            { label: "Total Paid", value: "$20000", delta: "$450", note: "Last Month", up: true },
            { label: "Available Balance", value: "$20000", delta: "$450", prefix: "Approx.", note: "Next Month", up: true },
            { label: "Total Refund", value: "$200", delta: "+09.4%", note: "This Month", up: true },
            { label: "Total Sales", value: "145", delta: "-09.4%", note: "this month", up: false },
          ].map((card) => (
            <div key={card.label} className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-5">
              <p className={`text-base leading-6 text-slate-600 ${fontRegular}`}>{card.label}</p>
              <p className={`flex items-center gap-2 text-22 leading-8 text-ai-600 ${fontHeading}`}>
                {card.value} <InfoTip tone="amber" text={STAT_TIP} />
              </p>
              <p className={`${smallText} text-slate-500`}>
                {card.up ? <Up color="#059669" /> : <Down />}
                <span className={card.up ? "text-emerald-600" : "text-red-500"}>{card.delta}</span> {card.prefix && <span className={`text-10 ${fontSemi}`}>{card.prefix}</span>} {card.note} <InfoTip tone="amber" text={STAT_TIP} />
              </p>
            </div>
          ))}
        </div>

        <section className="rounded-lg border border-slate-300 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className={titleClass} style={titleStyle}>
              Report Analytics
            </h2>
            <SeriesToggles series={REVENUE_SERIES} on={on} toggle={toggle} />
            <PeriodSelect value={period} onChange={setPeriod} />
          </div>
          <div className="mt-5">
            <LineChart months={MONTHS} series={REVENUE_SERIES.filter((s) => on.includes(s.key))} yMax={400} ticks={[0, 50, 100, 150, 200, 250, 300, 350, 400]} height={284} tickLabel={money} valueLabel={money} />
          </div>
        </section>

        <div className="overflow-x-auto">
          <div className="flex min-w-190 flex-col gap-2">
            <div className={`${REVENUE_COLUMNS} h-10 rounded-sm bg-slate-700`}>
              {["Statistics", "Total Sales", "Total Earnings", "Total Refund", "Expected Payment Date"].map((h) => (
                <SortCell key={h} label={h} />
              ))}
            </div>
            {rows.map((row) => (
              <div key={row.month} className={`${REVENUE_COLUMNS} h-18.5 rounded-lg border border-slate-200 bg-white text-base leading-6 text-slate-600 ${fontRegular}`}>
                <button type="button" onClick={() => openInstructorReports("revenue", row.month)} className={`w-fit text-ai-600 hover:underline ${fontMedium}`}>
                  {row.month}
                </button>
                <span>{row.sales}</span>
                <span>{row.earnings}</span>
                <span>{row.refund}</span>
                <span>{row.payment}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Pagination page={page} pageCount={Math.ceil(REVENUE_ROWS.length / REVENUE_PAGE)} start={start} shown={rows.length} total={REVENUE_ROWS.length} onPage={setPage} />
    </main>
  );
}

const BLUE = "#0284c7";
const NAVY = "#0c4a6e";
const DONUTS = [
  {
    title: "Your Total Earnings",
    rows: [
      { label: "Organic", color: BLUE, value: 53.65 },
      { label: "Ad program", color: NAVY, value: 18.2 },
      { label: "Affiliate", color: "#991b1b", value: 17.08 },
    ],
  },
  {
    title: "Your Promotion Activity",
    rows: [
      { label: "Your Referral", color: BLUE, value: 43.73 },
      { label: "Ad program", color: NAVY, value: 42.2 },
    ],
  },
  {
    title: "Your Earnings by Course",
    rows: [
      { label: "Local Lead instructor", color: BLUE, value: 29.55 },
      { label: "Amazon Sales basics", color: NAVY, value: 24.65 },
      { label: "Digital Marketing", color: "#047857", value: 29.75 },
    ],
  },
];

function DonutCard({ title, rows }: { title: string; rows: { label: string; color: string; value: number }[] }) {
  const { on, toggle } = useToggles(rows.map((r) => r.label));
  const shown = rows.filter((r) => on.includes(r.label));
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  return (
    <section className="flex flex-col rounded-lg border border-slate-200 bg-white p-6">
      <h2 className={`text-lg leading-7 text-slate-800 ${fontMedium}`}>{title}</h2>
      <div className="mt-6">
        <Donut segments={shown} center={money(shown.reduce((sum, r) => sum + r.value, 0))} />
      </div>
      <div className="mt-10 flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.label} className="flex min-h-9 items-center justify-between gap-2">
            <Checkbox checked={on.includes(r.label)} onChange={() => toggle(r.label)}>
              <span className={`max-w-30 truncate text-sm leading-5 text-slate-700 ${fontRegular}`} title={r.label}>
                {r.label}
              </span>
              <span aria-hidden="true" className="h-0.75 w-4 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
            </Checkbox>
            <div className="flex items-center gap-5">
              <span className={`rounded-full bg-slate-25 px-3 py-1.5 text-xs leading-4.5 text-slate-500 ${fontMedium}`}>{Math.round((r.value / total) * 100)}%</span>
              <span className={`w-12.5 text-right text-sm leading-5 text-slate-600 ${fontRegular}`}>{money(r.value)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const SALE_CHANNELS = ["Affiliate", "Thkee Organic", "Affiliate", "Thkee Organic", "Organic"];
const SALES = Array.from({ length: 65 }, (_, i) => ({
  id: i,
  date: "March 13, 2022",
  customer: "John Doe",
  product: "Adobe Xd: The Absolute Beginner to Pro Class",
  channel: SALE_CHANNELS[i % SALE_CHANNELS.length],
  price: "$238.20",
  earnings: "$119.10",
  status: i % 5 === 4 ? "Cancelled" : "Completed",
}));
const SALE_COLUMNS = "grid grid-cols-reports-table items-center gap-x-2 px-5";
const SALES_PAGE = 5;

function MonthDetail({ month }: { month: string }) {
  const { notify } = useApp();
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("Completed");
  const [page, setPage] = useState(1);
  const filtered = SALES.filter((s) => (channel === "all" || s.channel === channel) && (status === "all" || s.status === status));
  const pageCount = Math.max(1, Math.ceil(filtered.length / SALES_PAGE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * SALES_PAGE;
  const rows = filtered.slice(start, start + SALES_PAGE);
  const link = "text-secondary-600 transition hover:text-secondary-700";

  return (
    <main className="flex flex-1 flex-col bg-slate-150">
      <div className="bg-white px-4 py-6 md:px-8">
        <h1 className={`flex h-10.5 flex-wrap items-center gap-1.5 ${titleClass}`} style={titleStyle}>
          <button type="button" onClick={() => openInstructorReports("revenue")} className="transition hover:text-slate-600">
            Revenue Report
          </button>
          <span className="text-secondary-500">/ {month}</span>
        </h1>
      </div>
      <div className="flex flex-1 flex-col px-4 py-6 md:px-7">
        <p className={`text-base leading-6 text-slate-700 ${fontRegular}`}>You earned $88.93 during this month. July 08, 2020 is the expected payment date for this statement.</p>
        <p className={`mt-4 text-sm leading-5 text-slate-700 ${fontRegular}`}>
          Totals for this month are not yet finalized, as refunds and external payments may still be applied. Learn more about{" "}
          <button type="button" onClick={() => notify("Payments help is coming soon")} className={link}>
            payments
          </button>{" "}
          and{" "}
          <button type="button" onClick={() => notify("Revenue report help is coming soon")} className={link}>
            revenue reports.
          </button>
        </p>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {DONUTS.map((d) => (
            <DonutCard key={d.title} title={d.title} rows={d.rows} />
          ))}
        </div>
        <div className="mt-12 flex flex-wrap justify-end gap-6">
          <div className="w-46.75">
            <FilterSelect
              plain
              alignRight
              label="Channel"
              value={channel}
              onChange={(v) => {
                setChannel(v);
                setPage(1);
              }}
              options={[{ value: "all", label: "All channel" }, ...["Affiliate", "Organic", "Thkee Organic"].map((c) => ({ value: c, label: c }))]}
            />
          </div>
          <div className="w-46.75">
            <FilterSelect
              plain
              alignRight
              label="Status"
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
              options={[
                { value: "all", label: "All status" },
                { value: "Completed", label: "Completed" },
                { value: "Cancelled", label: "Cancelled" },
              ]}
            />
          </div>
        </div>
        <div className="mt-5 overflow-x-auto">
          <div className="flex min-w-252.5 flex-col gap-4">
            <div className={`${SALE_COLUMNS} h-10 rounded-sm bg-slate-700`}>
              {["Date", "Customer Name", "Products", "Channel", "Sale Price", "Your Earnings", "Status"].map((h) => (
                <SortCell key={h} label={h} />
              ))}
              <span className={`text-sm leading-6 text-white ${fontMedium}`}>Details</span>
            </div>
            {rows.map((s) => (
              <div key={s.id} className={`${SALE_COLUMNS} min-h-21 rounded-lg border border-slate-200 bg-white py-2 text-sm leading-6 text-slate-600 ${fontRegular}`}>
                <span className="max-w-20">{s.date}</span>
                <span>{s.customer}</span>
                <span className={`pr-6 text-slate-700 ${fontSemi}`}>{s.product}</span>
                <span>{s.channel}</span>
                <span>{s.price}</span>
                <span>{s.earnings}</span>
                <span className={`flex h-6.5 w-26 items-center justify-center rounded-sm border text-xs ${s.status === "Completed" ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-red-200 bg-red-100 text-red-500"} ${fontMedium}`}>{s.status}</span>
                <button type="button" onClick={() => notify("Sale details are coming soon")} className={`w-fit text-base text-slate-600 underline transition hover:text-slate-900 ${fontMedium}`}>
                  View
                </button>
              </div>
            ))}
            {rows.length === 0 && <p className={`rounded-lg bg-white px-6 py-10 text-center text-sm text-slate-500 ${fontRegular}`}>No sales match these filters.</p>}
          </div>
        </div>
      </div>
      <Pagination page={current} pageCount={pageCount} start={start} shown={rows.length} total={filtered.length} onPage={setPage} />
    </main>
  );
}

export default function InstructorReports({ view, month }: { view?: "revenue"; month?: string }) {
  if (view === "revenue" && month) return <MonthDetail key={month} month={month} />;
  if (view === "revenue") return <RevenueReport />;
  return <Overview />;
}
