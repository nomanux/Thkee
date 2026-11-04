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
const PAGE_SIZE = 10;
const COLUMNS = "grid grid-cols-[254fr_269fr_156fr_170fr_230fr] items-center gap-x-3 px-6";

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
  Pending: "bg-[#fff9f0] text-[#faa104]",
  Accepted: "bg-[#ecfdf5] text-[#059669]",
  Rejected: "bg-[#f2f4f7] text-[#475569]",
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

  const headerCell = `flex items-center gap-1.5 text-[14px] leading-[24px] text-[#64748b] ${fontMedium}`;
  const pickCourse = (next: string) => {
    setCourse(next);
    setPage(1);
  };

  return (
    <main className="flex flex-1 flex-col bg-white">
      <div className="border-b border-[#e2e8f0] bg-white px-4 py-6 md:px-7">
        <h1 className="m-0 flex h-[42px] items-center font-['Instrument_Sans:Medium'] text-[24px] font-medium leading-[32px] text-[#0f172a]" style={{ fontVariationSettings: '"wdth" 100' }}>
          Co-Instructor Requests
        </h1>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-4 py-6 md:px-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ActionMenu
            label={`Course: ${allCourses ? "All Courses" : course}`}
            alignLeft
            triggerClass={`flex items-center gap-3 text-left text-[16px] leading-[24px] text-[#0f172a] ${fontSemi}`}
            trigger={
              <>
                {allCourses ? "All Courses" : course} ({inCourse.length} Requests)
                <img src={imgChevronLarge} alt="" width={24} height={24} className="size-6 shrink-0" />
              </>
            }
            items={[{ label: `All Courses (${REQUESTS.length} Requests)`, onClick: () => pickCourse("all") }, ...COURSES.map((name) => ({ label: `${name} (${REQUESTS.filter((r) => r.course === name).length} Requests)`, onClick: () => pickCourse(name) }))]}
          />
          <div className="w-[186px] [&_button[aria-haspopup]]:w-full [&_button[aria-haspopup]]:justify-between">
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

        <div className="overflow-x-auto rounded-[8px] border border-[#e2e8f0]">
          <div className="min-w-[860px]">
            <div className={`${COLUMNS} h-[54px] bg-[#f8fafc]`}>
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
                  <li key={r.id} className={`${COLUMNS} min-h-[55px] border-t border-[#f1f5f9] py-2 text-[14px] leading-[24px] tracking-[-0.01px] ${fontRegular}`}>
                    <span title={r.course} className="truncate pr-6 text-[#64748b]">
                      {r.course}
                    </span>
                    <span className="truncate text-[#1e293b]">{r.name}</span>
                    <span className="whitespace-nowrap text-[#64748b]">{r.requestedOn}</span>
                    <span>
                      <span className={`inline-flex h-[22px] items-center rounded-full px-2 text-[12px] leading-[18px] ${STATUS_STYLES[current]} ${fontMedium}`}>{current}</span>
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
                            className="flex items-center gap-2 text-[#faa104] transition hover:text-[#c98003]"
                          >
                            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
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
                            className="flex items-center gap-2 text-[#94a3b8] transition hover:text-[#475569]"
                          >
                            <svg viewBox="0 0 24 24" className="size-[18px] text-[#475569]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                              <path d="M6 6l12 12M18 6L6 18" />
                            </svg>
                            Reject
                          </button>
                        </div>
                      )}
                      {current === "Accepted" && (
                        <>
                          <button type="button" onClick={() => notify("Permission settings are coming soon")} className={`text-[12px] leading-[18px] text-[#334155] underline transition hover:text-[#0f172a] ${fontMedium}`}>
                            Manage Permission
                          </button>
                          <span className="mt-0.5 whitespace-nowrap text-[10px] leading-[16px] tracking-[0.1px] text-[#94a3b8]">{acceptedAt}</span>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
              {rows.length === 0 && <li className={`border-t border-[#f1f5f9] px-6 py-10 text-center text-[14px] text-[#64748b] ${fontRegular}`}>No requests match these filters.</li>}
            </ul>
          </div>
        </div>
      </div>
      <Pagination page={current} pageCount={pageCount} start={start} shown={rows.length} total={filtered.length} onPage={setPage} />
    </main>
  );
}
