import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, save, useApp } from "../store";
import { buttonClass } from "./Button";
import { Pagination } from "./InstructorCourses";
import { ActionMenu, FilterSelect } from "./Menus";

const PYTHON = "Complete Python Bootcamp: From Zero to Hero";
const WEB = "Responsive Web Design: HTML, CSS and Layout";
const COURSES = [PYTHON, WEB];

type Status = "Pending" | "Accepted" | "Rejected";
// decidedOn: the day of June 2025 the request was accepted or rejected.
type Decision = { status: Status; decidedOn?: string };

const NAMES = ["Casey Johnson", "Riley Thompson", "Morgan Patel", "Jamie Chen", "Taylor Smith", "Sydney Brown", "Jordan Lee", "Alexandra Morgan", "Cameron White", "Avery Davis", "Drew Wilson", "Quinn Martinez", "Reese Clark", "Skyler Hall", "Blake Young", "Parker King", "Rowan Scott", "Hayden Green", "Emerson Adams", "Finley Baker"];
const seedStatus = (i: number): Status => (i < 4 ? "Pending" : i < 7 ? "Accepted" : i < 10 ? "Rejected" : (["Pending", "Accepted", "Rejected"] as const)[i % 3]);
const formatDay = (day: number) => `${day} Jun 2025`;
const REQUESTS = NAMES.map((name, i) => {
  const day = 7 + i;
  const status = seedStatus(i);
  return {
    id: `co-${i + 1}`,
    name,
    email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
    course: i % 2 === 0 ? PYTHON : WEB,
    day,
    status,
    // Seeded decisions happen the day after the request, never before it.
    decidedOn: status === "Pending" ? undefined : formatDay(day + 1),
  };
});
type Request = (typeof REQUESTS)[number];

const STORE_KEY = "thkee.instructorCoRequests.v2";
export const pendingCoRequestCount = () => {
  const decisions = load<Record<string, Decision>>(STORE_KEY, {});
  return REQUESTS.filter((r) => (decisions[r.id]?.status ?? r.status) === "Pending").length;
};
const PAGE_SIZE = 10;
const COLUMNS = "md:grid md:grid-cols-co-requests md:items-center md:gap-x-4";

const STATUS_STYLES: Record<Status, string> = {
  Pending: "bg-secondary-50 text-secondary-800 ring-secondary-200",
  Accepted: "bg-primary-50 text-primary-700 ring-primary-200",
  Rejected: "bg-slate-100 text-slate-600 ring-slate-200",
};

const today = () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return <span className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-13 text-primary-700 ${fontSemi}`}>{initials}</span>;
}

function StatusPill({ status }: { status: Status }) {
  return <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs ring-1 ring-inset ${STATUS_STYLES[status]} ${fontMedium}`}>{status}</span>;
}

const Dots = (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="12" cy="19" r="1.8" />
  </svg>
);

export default function InstructorCoRequests() {
  const { notify } = useApp();
  const still = useReducedMotion();
  const [decisions, setDecisions] = useState<Record<string, Decision>>(() => load(STORE_KEY, {}));
  const [course, setCourse] = useState("all");
  const [tab, setTab] = useState<Status | "all">("Pending");
  const [sort, setSort] = useState("newest");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => save(STORE_KEY, decisions), [decisions]);

  const statusOf = (r: Request) => decisions[r.id]?.status ?? r.status;
  const decidedOn = (r: Request) => decisions[r.id]?.decidedOn ?? r.decidedOn;
  const decide = (r: Request, status: Status, message: string) => {
    setDecisions((d) => ({ ...d, [r.id]: { status, decidedOn: status === "Pending" ? undefined : today() } }));
    notify(message);
  };

  const q = query.trim().toLowerCase();
  const inCourse = REQUESTS.filter((r) => (course === "all" || r.course === course) && (!q || r.name.toLowerCase().includes(q) || r.email.includes(q)));
  const counts = {
    Pending: inCourse.filter((r) => statusOf(r) === "Pending").length,
    Accepted: inCourse.filter((r) => statusOf(r) === "Accepted").length,
    Rejected: inCourse.filter((r) => statusOf(r) === "Rejected").length,
    all: inCourse.length,
  };
  const filtered = inCourse
    .filter((r) => tab === "all" || statusOf(r) === tab)
    .sort((a, b) => (sort === "oldest" ? a.day - b.day : sort === "name" ? a.name.localeCompare(b.name) : b.day - a.day));
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);

  const tabs: { key: Status | "all"; label: string }[] = [
    { key: "Pending", label: "Pending" },
    { key: "Accepted", label: "Accepted" },
    { key: "Rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];
  const headerCell = `text-xs uppercase tracking-wider text-slate-500 ${fontSemi}`;

  return (
    <main className="flex flex-1 flex-col bg-white">
      <div className="border-b border-slate-200 bg-white px-4 py-6 md:px-7">
        <h1 className="m-0 font-instrument-medium text-2xl font-medium leading-8 text-slate-900" style={{ fontVariationSettings: '"wdth" 100' }}>
          Co-Instructor Requests
        </h1>
        <p className={`mt-1 text-sm leading-5 text-slate-500 ${fontRegular}`}>Instructors who want to co-teach your courses. Approving gives them access to edit the course.</p>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 py-6 md:px-7">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {/* Toolbar: status tabs on the left, search and filters on the right. */}
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 px-4 pt-3 md:px-5">
            <div role="tablist" aria-label="Request status" className="-mb-px flex gap-1 overflow-x-auto">
              {tabs.map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setTab(t.key);
                      setPage(1);
                    }}
                    className={`relative flex shrink-0 items-center gap-2 px-3 pb-3.5 pt-2 text-sm transition-colors ${active ? `text-slate-900 ${fontSemi}` : `text-slate-500 hover:text-slate-900 ${fontMedium}`}`}
                  >
                    {t.label}
                    <span className={`rounded-full px-2 py-0.5 text-11 leading-3.5 tabular-nums ${active ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-500"} ${fontSemi}`}>{counts[t.key]}</span>
                    {active && (
                      <motion.span
                        layoutId="co-request-tabs"
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary-700"
                        transition={still ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 pb-3 md:w-auto">
              <label className="field-box min-w-0 flex-1 md:w-56 md:flex-none">
                <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by name or email"
                  aria-label="Search requests"
                  className={`min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 md:text-sm ${fontRegular}`}
                />
              </label>
              <FilterSelect
                large
                label="Course"
                value={course}
                onChange={(next) => {
                  setCourse(next);
                  setPage(1);
                }}
                options={[{ value: "all", label: "All courses" }, ...COURSES.map((c) => ({ value: c, label: c }))]}
              />
              <FilterSelect
                large
                alignRight
                label="Sort"
                value={sort}
                onChange={setSort}
                options={[
                  { value: "newest", label: "Newest first" },
                  { value: "oldest", label: "Oldest first" },
                  { value: "name", label: "Name A to Z" },
                ]}
              />
            </div>
          </div>

          <div aria-hidden="true" className={`hidden bg-slate-25 px-5 py-2.5 ${COLUMNS}`}>
            <span className={headerCell}>Requested by</span>
            <span className={headerCell}>Course</span>
            <span className={headerCell}>Requested</span>
            <span className={headerCell}>Status</span>
            <span className={`${headerCell} text-right`}>Action</span>
          </div>

          <ul key={`${tab}-${course}`} className="fade-up divide-y divide-slate-150">
            {rows.map((r) => {
              const status = statusOf(r);
              return (
                <li key={r.id} className={`flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-slate-25 md:px-5 md:py-3.5 ${COLUMNS}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={r.name} />
                    <div className="min-w-0">
                      <p className={`truncate text-sm leading-5 text-slate-900 ${fontSemi}`}>{r.name}</p>
                      <p className={`truncate text-xs leading-4.5 text-slate-500 ${fontRegular}`}>{r.email}</p>
                    </div>
                    <span className="ml-auto md:hidden">
                      <StatusPill status={status} />
                    </span>
                  </div>
                  <p title={r.course} className={`truncate text-sm leading-5 text-slate-700 ${fontRegular}`}>
                    <span className={`text-slate-500 md:hidden ${fontMedium}`}>Course: </span>
                    {r.course}
                  </p>
                  <p className={`hidden whitespace-nowrap text-sm leading-5 text-slate-500 md:block ${fontRegular}`}>{formatDay(r.day)}</p>
                  <span className="hidden md:block">
                    <StatusPill status={status} />
                  </span>

                  <div className="flex items-center justify-between gap-2 md:justify-end">
                    <span className={`text-xs text-slate-500 md:hidden ${fontRegular}`}>Requested {formatDay(r.day)}</span>
                    {status === "Pending" ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Reject ${r.name}`}
                          onClick={() => decide(r, "Rejected", `Request from ${r.name} rejected`)}
                          className={buttonClass("ghost", "md")}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          aria-label={`Approve ${r.name}`}
                          onClick={() => decide(r, "Accepted", `${r.name} is now a co-instructor`)}
                          className={buttonClass("primary", "md")}
                        >
                          Approve
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`whitespace-nowrap text-xs text-slate-500 ${fontRegular}`}>
                          {status} {decidedOn(r)}
                        </span>
                        <ActionMenu
                          label={`More actions for ${r.name}`}
                          triggerClass="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                          trigger={Dots}
                          items={
                            status === "Accepted"
                              ? [
                                  { label: "Manage permissions", onClick: () => notify("Permission settings are coming soon") },
                                  { label: "Remove co-instructor", danger: true, onClick: () => decide(r, "Rejected", `${r.name} was removed as co-instructor`) },
                                ]
                              : [{ label: "Reconsider request", onClick: () => decide(r, "Pending", `Request from ${r.name} moved back to pending`) }]
                          }
                        />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
            {rows.length === 0 && (
              <li className="flex flex-col items-center gap-1 px-6 py-14 text-center">
                <p className={`text-15 text-slate-900 ${fontSemi}`}>{tab === "Pending" && !q ? "You're all caught up" : "No requests found"}</p>
                <p className={`text-sm text-slate-500 ${fontRegular}`}>{tab === "Pending" && !q ? "There are no requests waiting for you." : "Try another status, course or search."}</p>
              </li>
            )}
          </ul>
        </section>
      </div>
      <Pagination page={current} pageCount={pageCount} start={start} shown={rows.length} total={filtered.length} onPage={setPage} />
    </main>
  );
}
