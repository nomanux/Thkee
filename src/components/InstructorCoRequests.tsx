import { useEffect, useState } from "react";
import { fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, save, useApp } from "../store";
import { Pagination } from "./InstructorCourses";
import { ActionMenu, FilterSelect } from "./Menus";

const imgChevronLarge = "/assets/933a3.svg";
const imgSort = "/assets/25f78.svg";

const PYTHON = "Complete Python Bootcamp: From Zero to Hero";
const WEB = "Responsive Web Design: HTML, CSS and Layout";
const COURSES = [PYTHON, WEB];

type Status = "Pending" | "Accepted" | "Rejected";
type Decision = { status: Status; acceptedAt?: string };

const SEEDED_ACCEPTED = "Accepted at 6th June, 2025 14:20";
const NAMES = ["Casey Johnson", "Riley Thompson", "Morgan Patel", "Jamie Chen", "Taylor Smith", "Sydney Brown", "Jordan Lee", "Alexandra Morgan", "Cameron White", "Avery Davis", "Drew Wilson", "Quinn Martinez", "Reese Clark", "Skyler Hall", "Blake Young", "Parker King", "Rowan Scott", "Hayden Green", "Emerson Adams", "Finley Baker"];
const seedStatus = (i: number): Status => (i < 4 ? "Pending" : i < 7 ? "Accepted" : i < 10 ? "Rejected" : (["Pending", "Accepted", "Rejected"] as const)[i % 3]);
const REQUESTS = NAMES.map((name, i) => ({ id: `co-${i + 1}`, name, course: i % 2 === 0 ? PYTHON : WEB, requestedOn: `${String(7 + i).padStart(2, "0")} June 2025`, status: seedStatus(i) }));

const STORE_KEY = "thkee.instructorCoRequests";
export const pendingCoRequestCount = () => {
  const decisions = load<Record<string, Decision>>(STORE_KEY, {});
  return REQUESTS.filter((r) => (decisions[r.id]?.status ?? r.status) === "Pending").length;
};
const PAGE_SIZE = 10;
const COLUMNS = "grid grid-cols-co-requests items-center gap-x-3 px-6";

const ordinal = (day: number) => {
  const tens = day % 100;
  if (tens >= 11 && tens <= 13) return `${day}th`;
  return `${day}${["th", "st", "nd", "rd"][day % 10] ?? "th"}`;
};
const acceptedNow = () => {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return `Accepted at ${ordinal(now.getDate())} ${now.toLocaleString("en-US", { month: "long" })}, ${now.getFullYear()} ${time}`;
};

const STATUS_STYLES: Record<Status, string> = {
  Pending: "bg-secondary-50 text-secondary-600",
  Accepted: "bg-emerald-50 text-emerald-600",
  Rejected: "bg-slate-150 text-slate-600",
};

export default function InstructorCoRequests() {
  const { notify } = useApp();
  const [decisions, setDecisions] = useState<Record<string, Decision>>(() => load(STORE_KEY, {}));
  const [course, setCourse] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => save(STORE_KEY, decisions), [decisions]);

  const allCourses = course === "all";
  const inCourse = allCourses ? REQUESTS : REQUESTS.filter((r) => r.course === course);
  const statusOf = (r: (typeof REQUESTS)[number]) => decisions[r.id]?.status ?? r.status;
  const filtered = inCourse.filter((r) => status === "all" || statusOf(r) === status);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);

  const headerCell = `flex items-center gap-1.5 text-sm leading-6 text-slate-500 ${fontMedium}`;
  const pickCourse = (next: string) => {
    setCourse(next);
    setPage(1);
  };

  return (
    <main className="flex flex-1 flex-col bg-white">
      <div className="border-b border-slate-200 bg-white px-4 py-6 md:px-7">
        <h1 className="m-0 flex h-10.5 items-center font-instrument-medium text-2xl font-medium leading-8 text-slate-900" style={{ fontVariationSettings: '"wdth" 100' }}>
          Co-Instructor Requests
        </h1>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-4 py-6 md:px-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ActionMenu
            label={`Course: ${allCourses ? "All Courses" : course}`}
            alignLeft
            triggerClass={`flex items-center gap-3 text-left text-base leading-6 text-slate-900 ${fontSemi}`}
            trigger={
              <>
                {allCourses ? "All Courses" : course} ({inCourse.length} Requests)
                <img src={imgChevronLarge} alt="" width={24} height={24} className="size-6 shrink-0" />
              </>
            }
            items={[{ label: `All Courses (${REQUESTS.length} Requests)`, onClick: () => pickCourse("all") }, ...COURSES.map((name) => ({ label: `${name} (${REQUESTS.filter((r) => r.course === name).length} Requests)`, onClick: () => pickCourse(name) }))]}
          />
          <div className="w-46.5 [&_button[aria-haspopup]]:w-full [&_button[aria-haspopup]]:justify-between">
            <FilterSelect
              large
              alignRight
              label="Sort by"
              value={status}
              onChange={(next) => {
                setStatus(next);
                setPage(1);
              }}
              options={[
                { value: "all", label: "All" },
                { value: "Pending", label: "Pending" },
                { value: "Accepted", label: "Accepted" },
                { value: "Rejected", label: "Rejected" },
              ]}
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <div className="min-w-215">
            <div className={`${COLUMNS} h-13.5 bg-slate-25`}>
              <span className={headerCell}>
                Course Name
                <img src={imgSort} alt="" width={20} height={20} className="size-5" />
              </span>
              <span className={headerCell}>
                Requested By
                <img src={imgSort} alt="" width={20} height={20} className="size-5" />
              </span>
              <span className={headerCell}>Requested On</span>
              <span className={headerCell}>Status</span>
              <span className={`${headerCell} justify-center`}>Action</span>
            </div>
            <ul>
              {rows.map((r) => {
                const current = statusOf(r);
                const acceptedAt = decisions[r.id]?.acceptedAt ?? SEEDED_ACCEPTED;
                return (
                  <li key={r.id} className={`${COLUMNS} min-h-13.75 border-t border-slate-150 py-2 text-sm leading-6 ${fontRegular}`}>
                    <span title={r.course} className="truncate pr-6 text-slate-500">
                      {r.course}
                    </span>
                    <span className="truncate text-slate-800">{r.name}</span>
                    <span className="whitespace-nowrap text-slate-500">{r.requestedOn}</span>
                    <span>
                      <span className={`inline-flex h-5.5 items-center rounded-full px-2 text-xs leading-4.5 ${STATUS_STYLES[current]} ${fontMedium}`}>{current}</span>
                    </span>
                    <div className="flex flex-col items-center justify-center">
                      {current === "Pending" && (
                        <div className="flex items-center gap-5">
                          <button
                            type="button"
                            aria-label={`Approve ${r.name}`}
                            onClick={() => {
                              setDecisions((d) => ({ ...d, [r.id]: { status: "Accepted", acceptedAt: acceptedNow() } }));
                              notify(`${r.name} approved as co-instructor`);
                            }}
                            className="flex items-center gap-2 text-secondary-600 transition hover:text-secondary-700"
                          >
                            <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 8v8M8 12h8" />
                            </svg>
                            Approve
                          </button>
                          <button
                            type="button"
                            aria-label={`Reject ${r.name}`}
                            onClick={() => {
                              setDecisions((d) => ({ ...d, [r.id]: { status: "Rejected" } }));
                              notify(`Request from ${r.name} rejected`);
                            }}
                            className="flex items-center gap-2 text-slate-400 transition hover:text-slate-600"
                          >
                            <svg viewBox="0 0 24 24" className="size-4.5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                              <path d="M6 6l12 12M18 6L6 18" />
                            </svg>
                            Reject
                          </button>
                        </div>
                      )}
                      {current === "Accepted" && (
                        <>
                          <button type="button" onClick={() => notify("Permission settings are coming soon")} className={`text-xs leading-4.5 text-slate-700 underline transition hover:text-slate-900 ${fontMedium}`}>
                            Manage Permission
                          </button>
                          <span className="mt-0.5 whitespace-nowrap text-10 leading-4 text-slate-400">{acceptedAt}</span>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
              {rows.length === 0 && <li className={`border-t border-slate-150 px-6 py-10 text-center text-sm text-slate-500 ${fontRegular}`}>No requests match these filters.</li>}
            </ul>
          </div>
        </div>
      </div>
      <Pagination page={current} pageCount={pageCount} start={start} shown={rows.length} total={filtered.length} onPage={setPage} />
    </main>
  );
}
