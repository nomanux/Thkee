import { useState, type ReactNode } from "react";
import { fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { openInstructorReports, openInstructorReviews, useApp } from "../store";
import { Checkbox } from "./InstructorAssignments";
import { BarChart, Donut, LineChart, type ChartSeries } from "./InstructorCharts";
import { Pagination } from "./InstructorCourses";
import { FilterSelect } from "./Menus";
import { buttonClass } from "./Button"


const MONTHS = ["May 2021", "June 2021", "July 2021", "Aug 2021", "Sep 2021", "Oct 2021", "Nov 2021", "Dec 2021", "Jan 2022", "Feb 2022", "Mar 2022"];
const PROMOTIONAL = [165, 210, 315, 262, 325, 478, 370, 222, 355, 555, 428];
const ENROLLMENTS = [165, 210, 315, 262, 325, 478, 370, 222, 355, 555, 428];
const RATINGS = [4.7, 4.5, 4.2, 4.6, 5, 3.6, 4.4, 4.6, 5, 3.6, 4.4];

const COLORS = { organic: "#6bafc9", ad: "#0b3d7a", affiliate: "#991b1b", promotional: "#ffb20d" };
const OVERVIEW_SERIES: ChartSeries[] = [
  { key: "organic", label: "Organic", color: COLORS.organic, values: [120, 190, 240, 180, 210, 300, 260, 200, 280, 390, 330] },
  { key: "ad", label: "Ad program", color: COLORS.ad, values: [90, 130, 170, 140, 160, 220, 190, 150, 210, 280, 240] },
  { key: "affiliate", label: "Affiliate", color: COLORS.affiliate, values: [60, 80, 110, 90, 100, 140, 120, 95, 130, 170, 150] },
  { key: "promotional", label: "Promotional", color: COLORS.promotional, values: PROMOTIONAL },
];
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

const downloadCsv = (filename: string, header: string, values: number[]) => {
  const csv = [`Month,${header}`, ...MONTHS.map((m, i) => `${m},${values[i]}`)].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const TABS = [
  { key: "revenue", label: "Total Revenue", value: "$3,416.62", note: "this month", highlight: "$192.16" },
  { key: "enrollments", label: "Total Enrollments", value: "1,823", note: "13 this month" },
  { key: "rating", label: "Instructor Rating", value: "4.2", note: "7 ratings this month" },
];

const PAYOUT_TIP = "Your payout schedule is monthly. Expected earnings shown are based on current sales, subject to change with additional sales or refunds before payout.";
export const PAYOUT_TILES: { value: string; label: string; bg: string; color: string; icon: ReactNode; tip: string }[] = [
  { value: "$ 3845.00", label: "Expected Earnings", bg: "#d1fae5", color: "#059669", icon: <path d="M17 7L7 17M7 9v8h8" />, tip: PAYOUT_TIP },
  { value: "$ 3845.00", label: "Available Balance", bg: "#e0f2fe", color: "#0284c7", icon: <path d="M17 7L7 17M7 9v8h8" />, tip: "The amount that is ready to be paid out on your next payout date." },
  { value: "$ 200.00", label: "Total Refund", bg: "#fee2e2", color: "#dc2626", icon: <path d="M7 17L17 7M9 7h8v8" />, tip: "Refunds processed during this payout period." },
  { value: "43", label: "Total Sales", bg: "#ede9fe", color: "#7c3aed", icon: <path d="M3 4h2l2.4 11h10.2L20 7H6M9 20h.01M17 20h.01" />, tip: "Course sales made during this payout period." },
];

function Overview() {
  const [tab, setTab] = useState("revenue");
  const [period, setPeriod] = useState("all");
  const { on, toggle } = useToggles(["promotional"]);
  const visibleSeries = OVERVIEW_SERIES.filter((s) => on.includes(s.key));

  return (
    <main className="flex flex-1 flex-col bg-white">
      <div className="flex flex-wrap items-center gap-6 border-b border-slate-200 bg-white px-4 py-6 md:px-7">
        <h1 className={`flex h-10.5 items-center ${titleClass}`} style={titleStyle}>
          Reports overview
        </h1>
        {tab !== "revenue" && (
          <button type="button" onClick={() => (tab === "rating" ? downloadCsv("instructor-rating.csv", "Rating", RATINGS) : downloadCsv("total-enrollments.csv", "Enrollments", ENROLLMENTS))} className={`${buttonClass("yellow", "lg")}`}>
            Download CSV
          </button>
        )}
      </div>
      <div className="flex flex-col gap-6 px-4 py-6 md:px-7">
        <div role="tablist" aria-label="Report metric" className="flex overflow-x-auto border-y border-slate-200 bg-slate-25">
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <button key={t.key} type="button" role="tab" aria-selected={active} onClick={() => setTab(t.key)} className={`flex w-54 shrink-0 flex-col gap-1.5 border-t-4 px-6 py-5 text-left transition ${active ? "border-secondary-500 bg-white" : "border-transparent hover:bg-slate-150"}`}>
                <span className={`text-base leading-6 ${active ? "text-slate-500" : "text-slate-400"} ${fontRegular}`}>{t.label}</span>
                <span className={`text-2xl leading-8 ${active ? "text-slate-800" : "text-slate-600"} ${fontHeading}`}>{t.value}</span>
                <span className={`text-sm leading-6 ${active ? "text-slate-500" : "text-slate-400"} ${fontRegular}`}>
                  {t.highlight && <span className={active ? "text-secondary-600" : ""}>{t.highlight} </span>}
                  {t.note}
                </span>
              </button>
            );
          })}
        </div>

        {tab === "revenue" ? (
          <>
            <section className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className={titleClass} style={titleStyle}>
                  Report analytics
                </h2>
                <SeriesToggles series={OVERVIEW_SERIES} on={on} toggle={toggle} />
                <PeriodSelect value={period} onChange={setPeriod} />
              </div>
              <div className="mt-6">
                <LineChart months={MONTHS} series={visibleSeries} yMax={750} ticks={[0, 250, 500, 750]} markers tickLabel={money} valueLabel={money} />
              </div>
              <div className="mt-6 flex justify-center">
                <button type="button" onClick={() => openInstructorReports("revenue")} className={`${buttonClass("secondary", "lg")}`}>
                  Revenue Report
                  <svg viewBox="0 0 24 24" className="size-4 text-secondary-500" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </section>
            <section className="rounded-lg border border-slate-200 bg-white p-6">
              <span className={`inline-flex h-7.5 items-center rounded-sm bg-emerald-500 px-2 text-xs leading-4.5 text-white ${fontMedium}`}>Monthly Payout</span>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className={`text-xl leading-8 text-emerald-800 ${fontHeading}`}>Your Next Payout</h2>
                <p className={`text-base leading-6 text-slate-700 ${fontRegular}`}>
                  Due date: <span className={`text-slate-800 ${fontSemi}`}>3 July 2022</span>
                </p>
              </div>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {PAYOUT_TILES.map((tile) => (
                  <div key={tile.label} className="relative flex items-center gap-4 rounded-lg border border-slate-200 px-5 py-4.5">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: tile.bg, color: tile.color }}>
                      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        {tile.icon}
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className={`text-xl leading-7 text-slate-700 ${fontHeading}`}>{tile.value}</p>
                      <p className={`mt-1 text-sm leading-5 text-slate-500 ${fontRegular}`}>{tile.label}</p>
                    </div>
                    <span className="absolute right-2.5 top-2.5 flex">
                      <InfoTip text={tile.tip} />
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <div className="flex justify-end">
              <PeriodSelect value={period} onChange={setPeriod} />
            </div>
            <section className="rounded-lg border border-slate-300 bg-white p-6">
              {tab === "enrollments" ? (
                <LineChart months={MONTHS} series={[{ key: "enrollments", label: "Enrollments", color: COLORS.promotional, values: ENROLLMENTS }]} yMax={750} ticks={[0, 250, 500, 750]} markers tickLabel={String} valueLabel={String} />
              ) : (
                <>
                  <BarChart months={MONTHS} values={RATINGS} color={COLORS.promotional} yMax={5} ticks={[0, 1, 2, 3, 4, 5]} tickLabel={(t) => `${t} Star`} valueLabel={(v) => v.toFixed(1)} />
                  <div className="mt-3 flex justify-center">
                    <button type="button" onClick={openInstructorReviews} className={`text-base leading-6 text-secondary-600 transition hover:text-secondary-700 ${fontRegular}`}>
                      Reviews Overview
                    </button>
                  </div>
                </>
              )}
            </section>
          </>
        )}
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
