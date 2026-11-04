import { useState } from "react";
import { fontBold, fontMedium, fontRegular, fontSemi } from "../fonts";
import { useApp } from "../store";

const imgPlusSmall = "/assets/51771.svg";
const imgPlus = "/assets/1a8b7.svg";
const imgEmpty = "/assets/3cf65.svg";
const imgFilter = "/assets/c5306.svg";
const imgSort = "/assets/25f78.svg";
const imgThumb = "/assets/be57c.png";
const imgCategoryDot = "/assets/036db.svg";
const imgPencil = "/assets/5f49c.svg";
const imgTrash = "/assets/62f35.svg";
const imgPencilPublished = "/assets/3bc53.svg";
const imgMegaphone = "/assets/48fdd.svg";
const imgUnlistedDot = "/assets/28674.svg";

type CourseStatus = "draft" | "published" | "pending" | "rejected";

const PAGE_SIZE = 5;
const STATUS_PATTERN: CourseStatus[] = ["draft", "published", "pending", "rejected", "draft"];
const SAMPLE_COURSES = Array.from({ length: 65 }, (_, i) => ({
  id: `course-${i + 1}`,
  title: "Adobe Xd: The Absolute Beginner to Pro Class",
  price: "$99.99",
  favorites: 103,
  purchases: 12,
  category: "Web Development",
  updated: "13 July 22",
  status: STATUS_PATTERN[i % STATUS_PATTERN.length],
}));

const COLUMNS = "grid grid-cols-[81.33px_minmax(220px,549px)_minmax(90px,130px)_minmax(90px,134px)_minmax(170px,1fr)_minmax(90px,135px)_minmax(200px,276px)_85px] items-center";

function SortHeader({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className={`whitespace-nowrap text-[14px] leading-[24px] text-[#64748b] ${fontBold}`}>{label}</span>
      <img src={imgSort} alt="" width={20} height={20} className="size-5" />
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col gap-1.5 px-2 tracking-[-0.01px]">
      <span className={`text-[14px] leading-[24px] text-[#334155] ${fontMedium}`}>{value}</span>
      <span className={`text-[12px] leading-[18px] text-[#94a3b8] ${fontRegular}`}>{label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: CourseStatus }) {
  if (status === "draft") return <span className={`flex w-[115px] items-center justify-center rounded-[4px] border border-[#e2e8f0] bg-[#f1f5f9] p-2 text-[12px] leading-[18px] tracking-[-0.01px] text-[#94a3b8] ${fontRegular}`}>In drafts</span>;
  const pill = `flex h-[26px] items-center justify-center whitespace-nowrap rounded-[4px] border px-2 text-[12px] tracking-[-0.12px] ${fontMedium}`;
  if (status === "pending") return <span className={`${pill} border-[#fee3b4] bg-[#fff0d7] text-[#c98003]`}>Pending for review</span>;
  if (status === "rejected") return <span className={`${pill} w-[115px] border-[#fecaca] bg-[#fee2e2] text-[#ef4444]`}>Course rejected</span>;
  return (
    <>
      <span className={`${pill} w-[115px] border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]`}>Published</span>
      <span className={`flex items-center justify-center gap-1.5 rounded-[16px] bg-[#f2f4f7] py-0.5 pl-1.5 pr-2 text-center text-[12px] leading-[18px] tracking-[-0.01px] text-[#334155] ${fontMedium}`}>
        <img src={imgUnlistedDot} alt="" width={8} height={8} className="size-2" />
        Unlisted
      </span>
    </>
  );
}

function PageButton({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} aria-current={active ? "page" : undefined} onClick={onClick} className={`flex size-10 items-center justify-center rounded-[8px] text-[14px] leading-[24px] tracking-[-0.01px] transition ${active ? "border border-[#fdce7c] bg-[#fee3b4] text-[#1e293b]" : "text-[#334155] hover:bg-[#f8fafc]"} ${fontMedium}`}>
      {children}
    </button>
  );
}

function ChevronButton({ direction, disabled, onClick }: { direction: "previous" | "next"; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-label={`${direction === "next" ? "Next" : "Previous"} page`} disabled={disabled} onClick={onClick} className="flex size-10 items-center justify-center rounded-[8px] bg-[#f8fafc] text-[#334155] transition hover:bg-[#f1f5f9] disabled:cursor-not-allowed">
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={direction === "next" ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
      </svg>
    </button>
  );
}

export function Pagination({ page, pageCount, start, shown, total, onPage }: { page: number; pageCount: number; start: number; shown: number; total: number; onPage: (page: number) => void }) {
  const firstShown = Math.max(1, Math.min(page - 2, pageCount - 4));
  const pageNumbers = Array.from({ length: Math.min(5, pageCount) }, (_, i) => firstShown + i);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#cbd5e1] bg-white px-4 py-4 md:px-7">
      <p className={`text-[14px] leading-[24px] tracking-[-0.01px] text-[#334155] ${fontMedium}`}>
        {total === 0 ? 0 : start + 1} to {start + shown} of {total} records
      </p>
      <nav aria-label="Pagination" className="flex gap-2">
        <ChevronButton direction="previous" disabled={page === 1} onClick={() => onPage(page - 1)} />
        {pageNumbers.map((n) => (
          <PageButton key={n} label={`Page ${n}`} active={n === page} onClick={() => onPage(n)}>
            {n}
          </PageButton>
        ))}
        <ChevronButton direction="next" disabled={page === pageCount} onClick={() => onPage(page + 1)} />
      </nav>
    </div>
  );
}

export default function InstructorCourses() {
  const { notify } = useApp();
  const [courses, setCourses] = useState(SAMPLE_COURSES);
  const [page, setPage] = useState(1);

  const newCourse = () => notify("Course creation is coming soon");
  const pageCount = Math.max(1, Math.ceil(courses.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * PAGE_SIZE;
  const visible = courses.slice(start, start + PAGE_SIZE);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2e8f0] bg-white px-4 py-6 md:px-7">
        <div className="flex flex-wrap items-center gap-6">
          <h1 className="m-0 font-['Instrument_Sans:Medium'] text-[24px] font-medium leading-[32px] text-[#0f172a]" style={{ fontVariationSettings: '"wdth" 100' }}>
            Courses overview
          </h1>
          <button type="button" onClick={newCourse} className={`flex h-[36px] items-center gap-1.5 rounded-[8px] bg-[#ffb20d] px-3 text-[14px] leading-[20px] tracking-[-0.01px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
            <img src={imgPlusSmall} alt="" width={18} height={18} className="size-[18px]" />
            New Course
          </button>
        </div>
        <button type="button" onClick={() => notify("Course filters are coming soon")} className={`flex h-[36px] items-center gap-1.5 rounded-[8px] bg-[#e2e8f0] px-3 text-[14px] leading-[20px] tracking-[-0.01px] text-[#1e293b] transition hover:bg-[#cbd5e1] ${fontMedium}`}>
          <img src={imgFilter} alt="" width={20} height={20} className="size-5" />
          Filter
        </button>
      </div>

      {courses.length === 0 ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-[29px] px-4 py-12 text-center">
          <div className="flex rounded-full bg-[#f8fafc] px-[61.6px] py-[60.4px]">
            <img src={imgEmpty} alt="" width={81} height={81} className="size-[81px]" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className={`text-[14px] leading-[24px] text-[#1e293b] ${fontBold}`}>You haven't added any courses yet.</p>
            <p className={`mt-2 max-w-[410px] text-[14px] leading-[24px] text-[#64748b] ${fontRegular}`}>To add your first online course to your students, click "new course".</p>
            <button type="button" onClick={newCourse} className={`mt-4 flex h-[44px] items-center gap-2 rounded-[8px] bg-[#ffb20d] px-5 text-[14px] leading-[20px] tracking-[-0.01px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
              <img src={imgPlus} alt="" width={20} height={20} className="size-5" />
              Create New Course
            </button>
          </div>
        </main>
      ) : (
        <main className="flex flex-1 flex-col bg-[#f1f5f9]">
          <div className="flex-1 overflow-x-auto px-4 py-6 md:px-7">
            <div className="flex min-w-[1090px] flex-col gap-4">
              <div className={`${COLUMNS} border-b border-[#e2e8f0] px-2 py-3`}>
                <SortHeader label="Course Name" className="col-span-2" />
                <SortHeader label="Statistics" className="col-span-2 px-2" />
                <SortHeader label="Category" />
                <SortHeader label="Last Updated" className="px-2" />
                <SortHeader label="Status" className="justify-center" />
                <SortHeader label="Action" className="justify-center" />
              </div>
              <ul className="flex flex-col gap-3">
                {visible.map((course) => (
                  <li key={course.id} className={`${COLUMNS} rounded-[8px] border border-[#f1f5f9] bg-white px-2 py-1`}>
                    <div className="relative h-[61px] overflow-hidden rounded-[6.507px]">
                      <img src={imgThumb} alt="" className="size-full object-cover" />
                      <div className="absolute inset-0 bg-[rgba(102,81,7,0.2)]" />
                    </div>
                    <div className="flex min-w-0 flex-col gap-1 px-4 text-[14px] tracking-[-0.01px]">
                      <p className={`leading-[20px] text-[#334155] ${fontSemi}`}>{course.title}</p>
                      <p className={`leading-[24px] text-[#94a3b8] ${fontRegular}`}>{course.price}</p>
                    </div>
                    <Stat value={course.favorites} label="Favoritized" />
                    <Stat value={course.purchases} label="Purchased" />
                    <div>
                      <span className={`inline-flex items-center gap-1.5 rounded-[50px] bg-[#f8fafc] px-2 py-1 text-[14px] leading-[24px] tracking-[-0.01px] text-[#64748b] ${fontRegular}`}>
                        <img src={imgCategoryDot} alt="" width={9} height={9} className="size-[9px]" />
                        {course.category}
                      </span>
                    </div>
                    <p className={`whitespace-nowrap px-2 text-[14px] leading-[24px] tracking-[-0.01px] text-[#94a3b8] ${fontRegular}`}>{course.updated}</p>
                    <div className="flex items-center justify-center gap-2.5 px-2 py-2.5">
                      <StatusBadge status={course.status} />
                    </div>
                    <div className="flex items-center justify-center gap-4 px-2">
                      <button type="button" aria-label="Edit course" onClick={() => notify("Course editing is coming soon")} className="flex transition hover:opacity-70">
                        <img src={course.status === "published" ? imgPencilPublished : imgPencil} alt="" width={14} height={14} className="size-3.5" />
                      </button>
                      {course.status === "published" ? (
                        <button type="button" aria-label="Announce course" onClick={() => notify("Announcements are coming soon")} className="flex transition hover:opacity-70">
                          <img src={imgMegaphone} alt="" width={14} height={14} className="size-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          aria-label="Delete course"
                          onClick={() => {
                            setCourses((list) => list.filter((c) => c.id !== course.id));
                            notify("Course deleted");
                          }}
                          className="flex transition hover:opacity-70"
                        >
                          <img src={imgTrash} alt="" width={14} height={14} className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <Pagination page={current} pageCount={pageCount} start={start} shown={visible.length} total={courses.length} onPage={setPage} />
        </main>
      )}
    </>
  );
}
