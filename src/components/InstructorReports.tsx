import { useState, type ReactNode } from "react";
import { fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { openInstructorReports, openInstructorReviews, useApp } from "../store";
import { Checkbox } from "./InstructorAssignments";
import { BarChart, Donut, LineChart, type ChartSeries } from "./InstructorCharts";
import { Pagination } from "./InstructorCourses";
import { FilterSelect } from "./Menus";


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
const titleClass = "m-0 font-['Instrument_Sans:Medium'] text-[24px] font-medium leading-[32px] text-[#0f172a]";

export function InfoTip({ text, tone = "gray", light }: { text: string; tone?: "gray" | "amber"; light?: boolean }) {
  return (
    <span className="group/tip relative inline-flex shrink-0">
      <button type="button" aria-label={text} className="flex">
        {tone === "gray" ? (
          <svg viewBox="0 0 20 20" className="size-4 text-[#94a3b8]" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" className={`size-3.5 ${light ? "text-[#ffb20d]" : "text-[#faa104]"}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <circle cx="10" cy="10" r="8" />
            <path d="M10 6v5M10 14h.01" />
          </svg>
        )}
      </button>
      <span role="tooltip" className={`pointer-events-none absolute bottom-full right-[-8px] z-20 mb-2 hidden w-[260px] rounded-[6px] bg-[#1e293b] px-2.5 py-2 text-left text-[12px] leading-[18px] text-white group-focus-within/tip:block group-hover/tip:block ${fontRegular}`}>
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
          <span className={`text-[14px] leading-[20px] tracking-[-0.01px] text-[#334155] ${fontRegular}`}>{s.label}</span>
          <span aria-hidden="true" className="h-[3px] w-4 rounded-full" style={{ backgroundColor: s.color }} />
        </Checkbox>
      ))}
    </div>
  );
}

function PeriodSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="w-[187px]">
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
const PAYOUT_TILES: { value: string; label: string; bg: string; color: string; icon: ReactNode; tip: string }[] = [
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
      <div className="flex flex-wrap items-center gap-6 border-b border-[#e2e8f0] bg-white px-4 py-6 md:px-7">
        <h1 className={`flex h-[42px] items-center ${titleClass}`} style={titleStyle}>
          Reports overview
        </h1>
        {tab !== "revenue" && (
          <button type="button" onClick={() => (tab === "rating" ? downloadCsv("instructor-rating.csv", "Rating", RATINGS) : downloadCsv("total-enrollments.csv", "Enrollments", ENROLLMENTS))} className={`flex h-[42px] items-center rounded-[8px] bg-[#ffb20d] px-4 text-[16px] leading-[20px] tracking-[-0.01px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
            Download CSV
          </button>
        )}
      </div>
      <div className="flex flex-col gap-6 px-4 py-6 md:px-7">
        <div role="tablist" aria-label="Report metric" className="flex overflow-x-auto border-y border-[#e2e8f0] bg-[#f8fafc]">
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <button key={t.key} type="button" role="tab" aria-selected={active} onClick={() => setTab(t.key)} className={`flex w-[216px] shrink-0 flex-col gap-1.5 border-t-4 px-6 py-5 text-left transition ${active ? "border-[#ffb20d] bg-white" : "border-transparent hover:bg-[#f1f5f9]"}`}>
                <span className={`text-[16px] leading-[24px] ${active ? "text-[#64748b]" : "text-[#94a3b8]"} ${fontRegular}`}>{t.label}</span>
                <span className={`text-[24px] leading-[32px] ${active ? "text-[#1e293b]" : "text-[#475569]"} ${fontHeading}`}>{t.value}</span>
                <span className={`text-[14px] leading-[24px] ${active ? "text-[#64748b]" : "text-[#94a3b8]"} ${fontRegular}`}>
                  {t.highlight && <span className={active ? "text-[#faa104]" : ""}>{t.highlight} </span>}
                  {t.note}
                </span>
              </button>
            );
          })}
        </div>

        {tab === "revenue" ? (
          <>
            <section className="rounded-[8px] border border-[#e2e8f0] bg-white p-6">
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
                <button type="button" onClick={() => openInstructorReports("revenue")} className={`flex h-[44px] items-center gap-3 rounded-[8px] border border-[#cbd5e1] px-5 text-[16px] text-[#1e293b] transition hover:bg-[#f8fafc] ${fontRegular}`}>
                  Revenue Report
                  <svg viewBox="0 0 24 24" className="size-4 text-[#ffb20d]" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </section>
            <section className="rounded-[8px] border border-[#e2e8f0] bg-white p-6">
              <span className={`inline-flex h-[30px] items-center rounded-[4px] bg-[#10b981] px-2 text-[12px] leading-[18px] text-white ${fontMedium}`}>Monthly Payout</span>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className={`text-[20px] leading-[32px] tracking-[0.15px] text-[#065f46] ${fontHeading}`}>Your Next Payout</h2>
                <p className={`text-[16px] leading-[24px] text-[#334155] ${fontRegular}`}>
                  Due date: <span className={`text-[#1e293b] ${fontSemi}`}>3 July 2022</span>
                </p>
              </div>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {PAYOUT_TILES.map((tile) => (
                  <div key={tile.label} className="relative flex items-center gap-4 rounded-[8px] border border-[#e2e8f0] px-5 py-[18px]">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-[8px]" style={{ backgroundColor: tile.bg, color: tile.color }}>
                      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        {tile.icon}
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className={`text-[20px] leading-[28px] text-[#334155] ${fontHeading}`}>{tile.value}</p>
                      <p className={`mt-1 text-[14px] leading-[20px] text-[#64748b] ${fontRegular}`}>{tile.label}</p>
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
            <section className="rounded-[8px] border border-[#cbd5e1] bg-white p-6">
              {tab === "enrollments" ? (
                <LineChart months={MONTHS} series={[{ key: "enrollments", label: "Enrollments", color: COLORS.promotional, values: ENROLLMENTS }]} yMax={750} ticks={[0, 250, 500, 750]} markers tickLabel={String} valueLabel={String} />
              ) : (
                <>
                  <BarChart months={MONTHS} values={RATINGS} color={COLORS.promotional} yMax={5} ticks={[0, 1, 2, 3, 4, 5]} tickLabel={(t) => `${t} Star`} valueLabel={(v) => v.toFixed(1)} />
                  <div className="mt-3 flex justify-center">
                    <button type="button" onClick={openInstructorReviews} className={`text-[16px] leading-[24px] text-[#faa104] transition hover:text-[#c98003] ${fontRegular}`}>
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
const REVENUE_COLUMNS = "grid grid-cols-[1.15fr_1fr_1fr_1fr_1.15fr] items-center px-5";

function SortCell({ label }: { label: string }) {
  return (
    <span className={`flex items-center gap-1.5 whitespace-nowrap text-[14px] leading-[24px] text-white ${fontMedium}`}>
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
  const smallText = `flex flex-wrap items-center gap-x-0.5 gap-y-1 text-[12px] leading-[18px] ${fontRegular}`;

  return (
    <main className="flex flex-1 flex-col bg-[#f1f5f9]">
      <div className="bg-white px-4 py-6 md:px-8">
        <h1 className={`flex h-[42px] items-center ${titleClass}`} style={titleStyle}>
          Revenue Report
        </h1>
      </div>
      <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-7">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="flex flex-col gap-3 rounded-[6px] bg-[#5a0ee0] p-5">
            <p className={`text-[16px] leading-[24px] text-white ${fontRegular}`}>Total Revenue</p>
            <p className={`flex items-center gap-2 text-[22px] leading-[32px] text-white ${fontHeading}`}>
              $3416.62 <InfoTip tone="amber" light text={STAT_TIP} />
            </p>
            <p className={`${smallText} text-[#cbd5e1]`}>
              <Up color="#34d399" />
              <span className="text-[#34d399]">+12.4%</span> this month
            </p>
          </div>
          {[
            { label: "Total Paid", value: "$20000", delta: "$450", note: "Last Month", up: true },
            { label: "Available Balance", value: "$20000", delta: "$450", prefix: "Approx.", note: "Next Month", up: true },
            { label: "Total Refund", value: "$200", delta: "+09.4%", note: "This Month", up: true },
            { label: "Total Sales", value: "145", delta: "-09.4%", note: "this month", up: false },
          ].map((card) => (
            <div key={card.label} className="flex flex-col gap-3 rounded-[6px] border border-[#e2e8f0] bg-white p-5">
              <p className={`text-[16px] leading-[24px] text-[#475569] ${fontRegular}`}>{card.label}</p>
              <p className={`flex items-center gap-2 text-[22px] leading-[32px] text-[#5a0ee0] ${fontHeading}`}>
                {card.value} <InfoTip tone="amber" text={STAT_TIP} />
              </p>
              <p className={`${smallText} text-[#64748b]`}>
                {card.up ? <Up color="#059669" /> : <Down />}
                <span className={card.up ? "text-[#059669]" : "text-[#ef4444]"}>{card.delta}</span> {card.prefix && <span className={`text-[10px] ${fontSemi}`}>{card.prefix}</span>} {card.note} <InfoTip tone="amber" text={STAT_TIP} />
              </p>
            </div>
          ))}
        </div>

        <section className="rounded-[8px] border border-[#cbd5e1] bg-white p-6">
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
          <div className="flex min-w-[760px] flex-col gap-2">
            <div className={`${REVENUE_COLUMNS} h-10 rounded-[4px] bg-[#334155]`}>
              {["Statistics", "Total Sales", "Total Earnings", "Total Refund", "Expected Payment Date"].map((h) => (
                <SortCell key={h} label={h} />
              ))}
            </div>
            {rows.map((row) => (
              <div key={row.month} className={`${REVENUE_COLUMNS} h-[74px] rounded-[8px] border border-[#e2e8f0] bg-white text-[16px] leading-[24px] text-[#475569] ${fontRegular}`}>
                <button type="button" onClick={() => openInstructorReports("revenue", row.month)} className={`w-fit text-[#5a0ee0] hover:underline ${fontMedium}`}>
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
    <section className="flex flex-col rounded-[8px] border border-[#e2e8f0] bg-white p-6">
      <h2 className={`text-[18px] leading-[28px] text-[#1e293b] ${fontMedium}`}>{title}</h2>
      <div className="mt-6">
        <Donut segments={shown} center={money(shown.reduce((sum, r) => sum + r.value, 0))} />
      </div>
      <div className="mt-10 flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.label} className="flex min-h-[36px] items-center justify-between gap-2">
            <Checkbox checked={on.includes(r.label)} onChange={() => toggle(r.label)}>
              <span className={`max-w-[120px] truncate text-[14px] leading-[20px] tracking-[-0.01px] text-[#334155] ${fontRegular}`} title={r.label}>
                {r.label}
              </span>
              <span aria-hidden="true" className="h-[3px] w-4 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
            </Checkbox>
            <div className="flex items-center gap-5">
              <span className={`rounded-full bg-[#f8fafc] px-3 py-1.5 text-[12px] leading-[18px] text-[#64748b] ${fontMedium}`}>{Math.round((r.value / total) * 100)}%</span>
              <span className={`w-[50px] text-right text-[14px] leading-[20px] text-[#475569] ${fontRegular}`}>{money(r.value)}</span>
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
const SALE_COLUMNS = "grid grid-cols-[100px_140px_minmax(180px,1fr)_110px_110px_140px_140px_70px] items-center gap-x-2 px-5";
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
  const link = "text-[#faa104] transition hover:text-[#c98003]";

  return (
    <main className="flex flex-1 flex-col bg-[#f1f5f9]">
      <div className="bg-white px-4 py-6 md:px-8">
        <h1 className={`flex h-[42px] flex-wrap items-center gap-1.5 ${titleClass}`} style={titleStyle}>
          <button type="button" onClick={() => openInstructorReports("revenue")} className="transition hover:text-[#475569]">
            Revenue Report
          </button>
          <span className="text-[#ffb20d]">/ {month}</span>
        </h1>
      </div>
      <div className="flex flex-1 flex-col px-4 py-6 md:px-7">
        <p className={`text-[16px] leading-[24px] text-[#334155] ${fontRegular}`}>You earned $88.93 during this month. July 08, 2020 is the expected payment date for this statement.</p>
        <p className={`mt-4 text-[14px] leading-[20px] text-[#334155] ${fontRegular}`}>
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
          <div className="w-[187px]">
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
          <div className="w-[187px]">
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
          <div className="flex min-w-[1010px] flex-col gap-4">
            <div className={`${SALE_COLUMNS} h-10 rounded-[4px] bg-[#334155]`}>
              {["Date", "Customer Name", "Products", "Channel", "Sale Price", "Your Earnings", "Status"].map((h) => (
                <SortCell key={h} label={h} />
              ))}
              <span className={`text-[14px] leading-[24px] text-white ${fontMedium}`}>Details</span>
            </div>
            {rows.map((s) => (
              <div key={s.id} className={`${SALE_COLUMNS} min-h-[84px] rounded-[8px] border border-[#e2e8f0] bg-white py-2 text-[14px] leading-[24px] text-[#475569] ${fontRegular}`}>
                <span className="max-w-[80px]">{s.date}</span>
                <span>{s.customer}</span>
                <span className={`pr-6 text-[#334155] ${fontSemi}`}>{s.product}</span>
                <span>{s.channel}</span>
                <span>{s.price}</span>
                <span>{s.earnings}</span>
                <span className={`flex h-[26px] w-[104px] items-center justify-center rounded-[4px] border text-[12px] ${s.status === "Completed" ? "border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]" : "border-[#fecaca] bg-[#fee2e2] text-[#ef4444]"} ${fontMedium}`}>{s.status}</span>
                <button type="button" onClick={() => notify("Sale details are coming soon")} className={`w-fit text-[16px] text-[#475569] underline transition hover:text-[#0f172a] ${fontMedium}`}>
                  View
                </button>
              </div>
            ))}
            {rows.length === 0 && <p className={`rounded-[8px] bg-white px-6 py-10 text-center text-[14px] text-[#64748b] ${fontRegular}`}>No sales match these filters.</p>}
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
