import { useState, type ReactNode } from "react";
import { courses, type Course } from "../data";
import { fontBold, fontFor, fontMedium, fontRegular, fontSemi } from "../fonts";
import { formatPrice, openLearning, openRefund, refundAmount, scrollToId, useApp, type Order, type Refund } from "../store";
import { Shell } from "./Overlays";
import { buttonClass } from "./Button"

const imgChevronDown = "/assets/46b15.svg";
const imgChevronToggle = "/assets/ffb52.svg";
const imgDocument = "/assets/f78fa.svg";

const HISTORY_PAGE_SIZE = 6;
const REFUNDS_PAGE_SIZE = 8;
const REFUND_TYPE = "Full";
const TAX_PERCENT = 11;
const tabs = ["History", "Refunds"] as const;
type Tab = (typeof tabs)[number];
type SortKey = "name" | "date" | "total" | "paidWith" | "type";
type Sort = { key: SortKey; asc: boolean };
type OrderDoc = { kind: "Receipt" | "Invoice"; order: Order } | { kind: "Credit Note"; order: Order; refund: Refund };

const courseById = (id: string) => courses.find((c) => c.id === id) as Course;
const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

const cellText = `text-sm leading-6 text-slate-500 ${fontRegular}`;
const headCell = `h-13.5 whitespace-nowrap bg-slate-25 px-6 text-sm leading-6 text-slate-500 ${fontMedium}`;
const refundLink = "self-start text-xs text-sky-600 underline transition hover:text-sky-700";

function useCourseOpener() {
  const { enrolledIds, setOverlay } = useApp();
  return (id: string) => (enrolledIds.includes(id) ? openLearning(id) : setOverlay({ type: "course", id }));
}

function RefundAction({ order, courseId, className }: { order: Order; courseId: string; className: string }) {
  const { refunds } = useApp();
  const refund = refunds.find((r) => r.orderId === order.id && r.courseId === courseId);
  if (refundAmount(order, courseId) === 0) return null;
  if (refund) return <span className={`text-xs leading-4.5 text-slate-500 ${fontMedium}`}>{refund.status === "Refunded" ? "Refunded" : "Refund requested"}</span>;
  return (
    <button type="button" onClick={() => openRefund(order.id, courseId)} className={`${refundLink} ${className}`}>
      Refund request
    </button>
  );
}

function DocumentButton({ kind, onClick }: { kind: "Receipt" | "Invoice"; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-150 px-3 text-sm leading-5 text-slate-600 transition hover:bg-slate-200 ${fontMedium}`}>
      <img src={imgDocument} alt="" width={20} height={20} className="size-5 shrink-0" />
      {kind}
    </button>
  );
}

function OrderRows({ order, last, onDocument }: { order: Order; last: boolean; onDocument: (doc: OrderDoc) => void }) {
  const openCourse = useCourseOpener();
  const [expanded, setExpanded] = useState(true);
  const [first, ...others] = order.items;
  const firstCourse = courseById(first.courseId);
  const single = others.length === 0;
  const showItems = expanded && !single;
  const border = last && !showItems ? "" : "border-b border-slate-150";
  const title = firstCourse.title;

  return (
    <>
      <tr className="bg-white">
        <td className={`h-20 px-6 py-2 ${border}`}>
          {single ? (
            <div className="flex flex-col items-start gap-4">
              <button type="button" dir="auto" onClick={() => openCourse(first.courseId)} className={`max-w-85.75 truncate text-left text-sm leading-6 text-slate-700 transition hover:text-primary-700 ${fontFor(title, fontMedium)}`}>
                {title}
              </button>
              <RefundAction order={order} courseId={first.courseId} className={`leading-4.5 ${fontMedium}`} />
            </div>
          ) : (
            <p className={`max-w-85.75 text-sm leading-6 text-slate-700 ${fontFor(title, fontMedium)}`}>
              <span dir="auto">{title}</span> &amp;{" "}
              <button type="button" aria-expanded={expanded} onClick={() => setExpanded((e) => !e)} className="inline-flex items-center gap-1 align-bottom text-ai-500">
                <span className="underline">
                  {others.length} more {others.length === 1 ? "course" : "courses"}
                </span>
                <img src={imgChevronToggle} alt="" width={24} height={24} className={`size-6 shrink-0 transition-transform ${expanded ? "-scale-y-100" : ""}`} />
              </button>
            </p>
          )}
        </td>
        <td className={`whitespace-nowrap px-6 ${cellText} ${border}`}>{formatDate(order.date)}</td>
        <td className={`whitespace-nowrap px-6 ${cellText} ${border}`}>{formatPrice(order.total)}</td>
        <td className={`whitespace-nowrap px-6 ${cellText} ${border}`}>{order.paidWith}</td>
        <td className={`px-6 ${border}`}>
          <div className="flex items-center justify-center gap-4.5">
            <DocumentButton kind="Receipt" onClick={() => onDocument({ kind: "Receipt", order })} />
            <DocumentButton kind="Invoice" onClick={() => onDocument({ kind: "Invoice", order })} />
          </div>
        </td>
      </tr>
      {showItems &&
        order.items.map((item, i) => {
          const course = courseById(item.courseId);
          const childBorder = last && i === order.items.length - 1 ? "" : "border-b border-slate-200";
          return (
            <tr key={item.courseId} className="bg-slate-25">
              <td className={`h-18.5 px-6 py-2 ${childBorder}`}>
                <div className="flex flex-col items-start gap-1">
                  <button type="button" dir="auto" onClick={() => openCourse(item.courseId)} className={`max-w-85.75 truncate text-left text-sm leading-5 text-slate-700 transition hover:text-primary-700 ${fontFor(course.title, fontRegular, "font-normal")}`}>
                    {course.title}
                  </button>
                  <RefundAction order={order} courseId={item.courseId} className={`leading-4 ${fontRegular}`} />
                </div>
              </td>
              <td className={childBorder} />
              <td className={`whitespace-nowrap px-6 ${cellText} ${childBorder}`}>{formatPrice(item.price)}</td>
              <td className={childBorder} colSpan={2} />
            </tr>
          );
        })}
    </>
  );
}

function SortHead({ label, column, sort, onSort }: { label: string; column: SortKey; sort: Sort; onSort: (key: SortKey) => void }) {
  const active = sort.key === column;
  return (
    <th scope="col" aria-sort={active ? (sort.asc ? "ascending" : "descending") : "none"} className={headCell}>
      <button type="button" onClick={() => onSort(column)} className={`flex items-center gap-1 transition hover:text-slate-900 ${fontMedium}`}>
        {label}
        <img src={imgChevronDown} alt="" width={20} height={20} className={`size-5 shrink-0 transition-transform ${active && sort.asc ? "rotate-180" : ""}`} />
      </button>
    </th>
  );
}

function PageButton({ label, current, disabled, onClick, children }: { label: string; current?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  const look = current ? "border border-secondary-300 bg-secondary-50 text-slate-800" : "bg-white text-slate-700 hover:bg-slate-25";
  return (
    <button type="button" aria-label={label} aria-current={current ? "page" : undefined} disabled={disabled} onClick={onClick} className={`flex size-10 items-center justify-center rounded-lg text-sm leading-6 transition disabled:cursor-not-allowed disabled:opacity-50 ${look} ${fontRegular}`}>
      {children}
    </button>
  );
}

function ArrowButton({ direction, disabled, onClick }: { direction: "Previous" | "Next"; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-label={`${direction} page`} disabled={disabled} onClick={onClick} className="flex size-10 items-center justify-center rounded-lg bg-slate-25 text-slate-700 transition hover:bg-slate-150 disabled:cursor-not-allowed disabled:opacity-50">
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={direction === "Previous" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  );
}

function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (page: number) => void }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center gap-2">
      <ArrowButton direction="Previous" disabled={page === 1} onClick={() => onPage(page - 1)} />
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <PageButton key={p} label={`Page ${p}`} current={p === page} onClick={() => onPage(p)}>
          {p}
        </PageButton>
      ))}
      <ArrowButton direction="Next" disabled={page === pages} onClick={() => onPage(page + 1)} />
    </nav>
  );
}

function useTableControls() {
  const [sort, setSort] = useState<Sort>({ key: "date", asc: false });
  const [page, setPage] = useState(1);
  const onSort = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, asc: !s.asc } : { key, asc: key !== "date" && key !== "total" }));
    setPage(1);
  };
  const goTo = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return { sort, page, onSort, goTo };
}

function sortedBy<T>(rows: T[], sort: Sort, value: (row: T) => string | number) {
  return [...rows].sort((a, b) => {
    const [x, y] = [value(a), value(b)];
    const order = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
    return sort.asc ? order : -order;
  });
}

function HistoryTab({ onDocument }: { onDocument: (doc: OrderDoc) => void }) {
  const { orders } = useApp();
  const { sort, page, onSort, goTo } = useTableControls();

  const sorted = sortedBy(orders, sort, (o) => (sort.key === "name" ? courseById(o.items[0].courseId).title : sort.key === "date" ? new Date(o.date).getTime() : sort.key === "total" ? o.total : o.paidWith));
  const pages = Math.max(1, Math.ceil(sorted.length / HISTORY_PAGE_SIZE));
  const shown = sorted.slice((page - 1) * HISTORY_PAGE_SIZE, page * HISTORY_PAGE_SIZE);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="w-full overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full min-w-270 border-separate border-spacing-0">
          <thead>
            <tr>
              <SortHead label="Course Name" column="name" sort={sort} onSort={onSort} />
              <SortHead label="Purchased Date" column="date" sort={sort} onSort={onSort} />
              <SortHead label="Total Price" column="total" sort={sort} onSort={onSort} />
              <SortHead label="Refunded to" column="paidWith" sort={sort} onSort={onSort} />
              <th scope="col" className={`${headCell} w-77.5 text-center`}>
                Receipt / Invoice
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((order, i) => (
              <OrderRows key={order.id} order={order} last={i === shown.length - 1} onDocument={onDocument} />
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={pages} onPage={goTo} />
    </div>
  );
}

function RefundsTab({ onDocument }: { onDocument: (doc: OrderDoc) => void }) {
  const { orders, refunds, cancelRefund } = useApp();
  const openCourse = useCourseOpener();
  const { sort, page, onSort, goTo } = useTableControls();
  const rows = refunds.flatMap((refund) => {
    const order = orders.find((o) => o.id === refund.orderId);
    return order?.items.some((i) => i.courseId === refund.courseId) ? [{ refund, order, course: courseById(refund.courseId), amount: refundAmount(order, refund.courseId), refundTo: refund.refundTo ?? order.paidWith }] : [];
  });

  if (rows.length === 0) return <p className={`py-16 text-center text-sm text-slate-500 ${fontRegular}`}>Refunds you request will appear here.</p>;

  const sorted = sortedBy(rows, sort, (r) => (sort.key === "name" ? r.course.title : sort.key === "date" ? new Date(r.order.date).getTime() : sort.key === "total" ? r.amount : sort.key === "paidWith" ? r.refundTo : REFUND_TYPE));
  const pages = Math.ceil(sorted.length / REFUNDS_PAGE_SIZE);
  const shown = sorted.slice((page - 1) * REFUNDS_PAGE_SIZE, page * REFUNDS_PAGE_SIZE);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="w-full overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full min-w-250 border-separate border-spacing-0">
          <thead>
            <tr>
              <SortHead label="Course Name" column="name" sort={sort} onSort={onSort} />
              <SortHead label="Purchased Date" column="date" sort={sort} onSort={onSort} />
              <SortHead label="Total Price" column="total" sort={sort} onSort={onSort} />
              <SortHead label="Refunded to" column="paidWith" sort={sort} onSort={onSort} />
              <SortHead label="Type" column="type" sort={sort} onSort={onSort} />
              <th scope="col" className={`${headCell} w-45 text-center`}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map(({ refund, order, course, amount, refundTo }, i) => {
              const border = i === shown.length - 1 ? "" : "border-b border-slate-150";
              return (
                <tr key={`${refund.orderId}-${refund.courseId}`} className="bg-white">
                  <td className={`h-17.5 px-6 py-2 ${border}`}>
                    <button type="button" dir="auto" onClick={() => openCourse(course.id)} className={`max-w-80 text-left text-sm leading-5.5 text-slate-700 transition hover:text-primary-700 ${fontFor(course.title, fontMedium)}`}>
                      {course.title}
                    </button>
                  </td>
                  <td className={`whitespace-nowrap px-6 ${cellText} ${border}`}>{formatDate(order.date)}</td>
                  <td className={`whitespace-nowrap px-6 ${cellText} ${border}`}>{formatPrice(amount)}</td>
                  <td className={`whitespace-nowrap px-6 ${cellText} ${border}`}>{refundTo}</td>
                  <td className={`whitespace-nowrap px-6 ${cellText} ${border}`}>{REFUND_TYPE}</td>
                  <td className={`px-6 ${border}`}>
                    {refund.status === "Refunded" ? (
                      <button type="button" onClick={() => onDocument({ kind: "Credit Note", order, refund })} className={`${buttonClass("yellow", "md")} mx-auto`}>
                        Credit Note
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <span className={`rounded-full bg-secondary-50 px-2.5 py-0.5 text-xs leading-4.5 text-amber-700 ${fontMedium}`}>{refund.status}</span>
                        <button type="button" onClick={() => cancelRefund(refund.orderId, refund.courseId)} className={`text-xs leading-4.5 text-sky-600 underline transition hover:text-sky-700 ${fontMedium}`}>
                          Cancel request
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={pages} onPage={goTo} />
    </div>
  );
}

function PartyRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-slate-600">{label}</dt>
      <dd className="text-slate-600">:</dd>
      <dd className="text-slate-900">{children}</dd>
    </>
  );
}

function CreditNoteDialog({ order, refund, onClose }: { order: Order; refund: Refund; onClose: () => void }) {
  const { user } = useApp();
  const title = courseById(refund.courseId).title;
  const total = refundAmount(order, refund.courseId);
  const net = total / (1 + TAX_PERCENT / 100);
  const money = (amount: number) => `${amount.toFixed(2)} SAR`;
  const headClass = `whitespace-nowrap px-3 py-3 text-center text-xs font-medium uppercase leading-4.5 text-slate-700 ${fontMedium}`;
  const valueClass = "whitespace-nowrap px-3 py-5 text-center text-slate-500";

  return (
    <Shell title="Credit Note" onClose={onClose} width="max-w-180">
      <div className={`flex flex-col gap-3 p-4 text-sm leading-5.5 sm:p-6 ${fontRegular}`}>
        <div className="flex flex-col gap-6 rounded-sm border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-4">
            <img src="/assets/logo-dark.svg" alt="Thkee" className="h-7 w-23.75" />
            <div className="text-right">
              <p className={`text-base leading-6 text-slate-800 ${fontBold}`}>CREDIT NOTE</p>
              <p className="mt-1 text-xs leading-4.5 text-secondary-600">Credit Note: #{order.id}</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-between gap-6">
            <div className="flex flex-col gap-3">
              <h3 className={`m-0 text-sm text-slate-900 ${fontMedium}`}>PROVIDED BY</h3>
              <dl className="grid grid-cols-thumb-72 gap-x-2 gap-y-2">
                <PartyRow label="Company">Thkee</PartyRow>
                <PartyRow label="Place">
                  8785 Al Urfaj
                  <br />
                  Al Olaya, Riyadh 12611
                  <br />
                  Saudi Arabia
                </PartyRow>
              </dl>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className={`m-0 text-sm text-slate-900 ${fontMedium}`}>PROVIDED TO</h3>
              <dl className="grid grid-cols-thumb-88 gap-x-2 gap-y-2">
                <PartyRow label="Student">{user?.name ?? "Guest"}</PartyRow>
                <PartyRow label="Invoice Date">{formatDate(order.date)}</PartyRow>
              </dl>
            </div>
          </div>
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-150 border-collapse">
              <thead>
                <tr>
                  <th scope="col" className={`${headClass} pl-5 text-left`}>
                    Product
                  </th>
                  {["Original Amount", "Amount Credited", "Tax Credited", "Total Credited"].map((label) => (
                    <th key={label} scope="col" className={headClass}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-y border-slate-200 bg-slate-25">
                  <td dir="auto" className={`max-w-37.5 truncate py-5 pl-5 pr-3 text-slate-700 ${fontFor(title, fontRegular, "font-normal")}`}>
                    {title}
                  </td>
                  <td className={valueClass}>{money(net)}</td>
                  <td className={valueClass}>{money(net)}</td>
                  <td className={valueClass}>
                    ({TAX_PERCENT}%) {money(total - net)}
                  </td>
                  <td className={valueClass}>{money(total)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-3 py-5 text-right text-slate-700">
                    Total Credit
                  </td>
                  <td colSpan={2} className={`px-6 py-5 text-right text-base text-slate-600 ${fontMedium}`}>
                    {money(total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p className="px-4 text-slate-600">
          This credit note is valid and processed by computer.
          <br />
          Please contact{" "}
          <button
            type="button"
            onClick={() => {
              onClose();
              scrollToId("faq");
            }}
            className="text-secondary-600 transition hover:underline"
          >
            Thkee Help Center
          </button>{" "}
          if you need assistance.
        </p>
      </div>
    </Shell>
  );
}

function DocumentDialog({ doc, onClose }: { doc: OrderDoc; onClose: () => void }) {
  if (doc.kind === "Credit Note") return <CreditNoteDialog order={doc.order} refund={doc.refund} onClose={onClose} />;
  const { kind, order } = doc;
  return (
    <Shell title={kind} onClose={onClose}>
      <div className="flex flex-col gap-5 px-5 py-5 sm:px-6">
        <dl className={`grid grid-cols-2 gap-3 text-sm leading-5.5 ${fontRegular}`}>
          {[
            [`${kind} number`, order.id],
            ["Date", formatDate(order.date)],
            ["Paid with", order.paidWith],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-slate-500">{label}</dt>
              <dd className={`text-slate-900 ${fontMedium}`}>{value}</dd>
            </div>
          ))}
        </dl>
        <ul className="flex flex-col border-t border-slate-200">
          {order.items.map((item) => {
            const title = courseById(item.courseId).title;
            return (
              <li key={item.courseId} className="flex justify-between gap-4 border-b border-slate-150 py-3 text-sm leading-5.5 text-slate-700">
                <span dir="auto" className={fontFor(title, fontRegular, "font-normal")}>
                  {title}
                </span>
                <span className={`shrink-0 ${fontRegular}`}>{formatPrice(item.price)}</span>
              </li>
            );
          })}
        </ul>
        <p className={`flex justify-between text-sm text-slate-900 ${fontSemi}`}>
          <span>Total paid</span>
          <span>{formatPrice(order.total)}</span>
        </p>
      </div>
    </Shell>
  );
}

export default function PurchaseHistoryPage() {
  const [tab, setTab] = useState<Tab>(() => (window.location.hash.includes("tab=refunds") ? "Refunds" : "History"));
  const [doc, setDoc] = useState<OrderDoc | null>(null);

  return (
    <main className="w-full bg-slate-25 pb-20 pt-14">
      <div className="border-b border-slate-200 bg-slate-25 px-4 pt-2 md:px-8 xl:px-20">
        <div className="mx-auto max-w-320">
          <h1 className="m-0 py-6 font-instrument-medium text-2xl font-medium leading-8 text-slate-900" style={{ fontVariationSettings: '"wdth" 100' }}>
            Purchase history
          </h1>
          <div role="tablist" aria-label="Purchase history" className="flex">
            {tabs.map((t) => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`relative px-6 py-2 text-sm leading-6 transition ${tab === t ? `text-slate-800 ${fontMedium}` : `text-slate-500 hover:text-slate-800 ${fontRegular}`}`}>
                {t}
                {tab === t && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-sm bg-secondary-500" />}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="px-4 py-10 md:px-8 xl:px-20">
        <div className="mx-auto max-w-320">{tab === "History" ? <HistoryTab onDocument={setDoc} /> : <RefundsTab onDocument={setDoc} />}</div>
      </div>
      {doc && <DocumentDialog doc={doc} onClose={() => setDoc(null)} />}
    </main>
  );
}
