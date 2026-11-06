import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { categories } from "../data";
import { fontBold, fontMedium, fontRegular, fontSemi } from "../fonts";
import { useApp, useStoredState } from "../store";
import { SelectField, TextField } from "./AccountSettingsPage";
import { ConfirmDialog } from "./InstructorSessions";
import { ActionMenu } from "./Menus";
import { Shell } from "./Overlays";

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
type InstructorCourse = { id: string; title: string; price: string; favorites: number; purchases: number; category: string; updated: string; status: CourseStatus };
type CourseValues = Pick<InstructorCourse, "title" | "price" | "category" | "status">;

const STORAGE_KEY = "thkee.instructorCourses";
const PAGE_SIZE = 5;
const STATUS_PATTERN: CourseStatus[] = ["draft", "published", "pending", "rejected", "draft"];
const SAMPLE_COURSES: InstructorCourse[] = Array.from({ length: 65 }, (_, i) => ({
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

export function StatusBadge({ status }: { status: CourseStatus }) {
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

const todayLabel = () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "2-digit" });

const BACKUP_TYPE = "thkee.instructorCourses";
const STATUSES: CourseStatus[] = ["draft", "published", "pending", "rejected"];

const isCourse = (value: unknown): value is InstructorCourse => {
  const c = value as InstructorCourse | null;
  return !!c && typeof c.id === "string" && typeof c.title === "string" && typeof c.price === "string" && typeof c.favorites === "number" && typeof c.purchases === "number" && typeof c.category === "string" && typeof c.updated === "string" && STATUSES.includes(c.status);
};

// Returns the courses in a backup file, or null if the file isn't a valid backup.
const parseBackup = (text: string): InstructorCourse[] | null => {
  try {
    const backup = JSON.parse(text) as { type?: string; courses?: unknown };
    if (backup?.type !== BACKUP_TYPE || !Array.isArray(backup.courses) || !backup.courses.every(isCourse)) return null;
    const courses = backup.courses as InstructorCourse[];
    return new Set(courses.map((c) => c.id)).size === courses.length ? courses : null;
  } catch {
    return null;
  }
};

const downloadBackup = (courses: InstructorCourse[]) => {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const url = URL.createObjectURL(new Blob([JSON.stringify({ type: BACKUP_TYPE, exportedAt: now.toISOString(), courses }, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `thkee-courses-${date}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

function CourseDialog({ course, onClose, onSave }: { course?: InstructorCourse; onClose: () => void; onSave: (values: CourseValues) => void }) {
  const [title, setTitle] = useState(course?.title ?? "");
  const [price, setPrice] = useState(course ? (course.price === "Free" ? "0" : course.price.replace(/[^0-9.]/g, "")) : "");
  const [category, setCategory] = useState(course?.category ?? "");
  const [status, setStatus] = useState(course?.status === "published" ? "Published" : "Draft");
  const [attempted, setAttempted] = useState(false);
  const priceValue = Number(price);
  const priceValid = price.trim() !== "" && Number.isFinite(priceValue) && priceValue >= 0;
  const canChangeStatus = !course || course.status === "draft" || course.status === "published";

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    setAttempted(true);
    if (!title.trim() || !priceValid || !category) return;
    onSave({
      title: title.trim(),
      price: priceValue === 0 ? "Free" : `$${priceValue.toFixed(2)}`,
      category,
      status: canChangeStatus ? (status === "Published" ? "published" : "draft") : course.status,
    });
  };

  return (
    <Shell title={course ? "Edit course" : "New course"} onClose={onClose} width="max-w-[520px]" radius="sm:rounded-[12px]">
      <form id="course-form" onSubmit={submit} noValidate className="flex flex-col gap-5 p-6">
        <TextField id="course-title" label="Course title" required value={title} onChange={setTitle} placeholder="e.g. Adobe XD for beginners" error={attempted && !title.trim() ? "Enter a course title" : ""} />
        <TextField id="course-price" label="Price (USD)" required type="number" value={price} onChange={setPrice} placeholder="0 for a free course" error={attempted && !priceValid ? "Enter a price of 0 or more" : ""} />
        <SelectField id="course-category" label="Category" value={category} onChange={setCategory} placeholder="Select a category" options={[...new Set([...categories.map((c) => c.name as string), ...(category ? [category] : [])])]} />
        {attempted && !category && <p className={`-mt-3 text-[14px] leading-[20px] text-[#dc2626] ${fontRegular}`}>Select a category</p>}
        {canChangeStatus && <SelectField id="course-status" label="Status" value={status} onChange={setStatus} placeholder="Select a status" options={["Draft", "Published"]} />}
      </form>
      <div className="flex items-center justify-end gap-3 border-t border-[#e2e8f0] px-6 py-4">
        <button type="button" onClick={onClose} className={`h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-4 text-[14px] text-[#1e293b] transition hover:bg-[#f8fafc] ${fontMedium}`}>
          Cancel
        </button>
        <button type="submit" form="course-form" className={`h-[36px] rounded-[8px] bg-[#ffb20d] px-4 text-[14px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
          {course ? "Save changes" : "Create course"}
        </button>
      </div>
    </Shell>
  );
}

export default function InstructorCourses() {
  const { notify } = useApp();
  const [courses, setCourses] = useStoredState<InstructorCourse[]>(STORAGE_KEY, SAMPLE_COURSES);
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<{ course?: InstructorCourse } | null>(null);
  const [deleting, setDeleting] = useState<InstructorCourse | null>(null);
  const [restoring, setRestoring] = useState<InstructorCourse[] | null>(null);
  const backupInput = useRef<HTMLInputElement>(null);

  const pickBackup = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const backup = parseBackup(await file.text());
    if (backup) setRestoring(backup);
    else notify("That file isn't a valid course backup");
  };
  const newCourse = () => setDialog({});
  const saveCourse = (values: CourseValues) => {
    const editing = dialog?.course;
    if (editing) {
      setCourses((list) => list.map((c) => (c.id === editing.id ? { ...c, ...values, updated: todayLabel() } : c)));
      notify("Course updated");
    } else {
      setCourses((list) => [{ id: `course-${Date.now()}`, favorites: 0, purchases: 0, updated: todayLabel(), ...values }, ...list]);
      setPage(1);
      notify("Course created");
    }
    setDialog(null);
  };
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
        <div className="flex items-center gap-3">
          <input ref={backupInput} type="file" accept=".json,application/json" onChange={pickBackup} className="sr-only" tabIndex={-1} aria-label="Course backup file" />
          <ActionMenu
            label="Course backup"
            triggerClass={`flex h-[36px] items-center gap-1.5 rounded-[8px] bg-[#e2e8f0] px-3 text-[14px] leading-[20px] tracking-[-0.01px] text-[#1e293b] transition hover:bg-[#cbd5e1] ${fontMedium}`}
            trigger={
              <>
                Backup
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </>
            }
            items={[
              {
                label: "Download backup",
                onClick: () => {
                  downloadBackup(courses);
                  notify("Backup downloaded");
                },
              },
              { label: "Restore from file", onClick: () => backupInput.current?.click() },
            ]}
          />
          <button type="button" onClick={() => notify("Course filters are coming soon")} className={`flex h-[36px] items-center gap-1.5 rounded-[8px] bg-[#e2e8f0] px-3 text-[14px] leading-[20px] tracking-[-0.01px] text-[#1e293b] transition hover:bg-[#cbd5e1] ${fontMedium}`}>
            <img src={imgFilter} alt="" width={20} height={20} className="size-5" />
            Filter
          </button>
        </div>
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
                      <button type="button" aria-label="Edit course" onClick={() => setDialog({ course })} className="flex transition hover:opacity-70">
                        <img src={course.status === "published" ? imgPencilPublished : imgPencil} alt="" width={14} height={14} className="size-3.5" />
                      </button>
                      {course.status === "published" ? (
                        <button type="button" aria-label="Announce course" onClick={() => notify("Announcements are coming soon")} className="flex transition hover:opacity-70">
                          <img src={imgMegaphone} alt="" width={14} height={14} className="size-3.5" />
                        </button>
                      ) : (
                        <button type="button" aria-label="Delete course" onClick={() => setDeleting(course)} className="flex transition hover:opacity-70">
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
      {dialog && <CourseDialog course={dialog.course} onClose={() => setDialog(null)} onSave={saveCourse} />}
      {restoring && (
        <ConfirmDialog
          title="Replace your course list?"
          body={`This replaces your current ${courses.length} courses with the ${restoring.length} in the backup. Courses that aren't in the backup will be lost.`}
          confirmLabel="Replace"
          onClose={() => setRestoring(null)}
          onConfirm={() => {
            setCourses(restoring);
            setRestoring(null);
            setPage(1);
            notify("Courses restored");
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete this course?"
          body={`"${deleting.title}" will be permanently removed.`}
          confirmLabel="Delete"
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            setCourses((list) => list.filter((c) => c.id !== deleting.id));
            setDeleting(null);
            notify("Course deleted");
          }}
        />
      )}
    </>
  );
}
