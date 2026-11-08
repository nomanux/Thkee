import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { categories } from "../data";
import { fontBold, fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, openCourseEditor, save, useApp, useStoredState } from "../store";
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

export type CourseStatus = "draft" | "published" | "pending" | "rejected";
export type InstructorCourse = { id: string; title: string; price: string; favorites: number; purchases: number; category: string; updated: string; status: CourseStatus };
type CourseValues = Pick<InstructorCourse, "title" | "price" | "category" | "status">;

const STORAGE_KEY = "thkee.instructorCourses";
// What the course editor adds to a course, stored by course id.
export const COURSE_DETAILS_KEY = "thkee.instructorCourseDetails";
const PAGE_SIZE = 5;
const STATUS_PATTERN: CourseStatus[] = ["draft", "published", "pending", "rejected", "draft"];
const SAMPLE_TITLES: { title: string; category: string; price: string; image: string }[] = [
  { title: "UI/UX Design with Figma: From Wireframe to Prototype", category: "Design", price: "$99.99", image: "/assets/courses/ui-ux-figma.jpg" },
  { title: "Python Programming: From Zero to Hero", category: "Information Technology", price: "$89.99", image: "/assets/courses/python-programming.jpg" },
  { title: "Modern Web Apps with React", category: "Information Technology", price: "$119.99", image: "/assets/courses/react-web-apps-v2.jpg" },
  { title: "AI Foundations for Everyone", category: "Information Technology", price: "$79.99", image: "/assets/courses/ai-foundations-sara.jpg" },
  { title: "Launch Your Startup in Saudi Arabia", category: "Business", price: "Free", image: "/assets/courses/launch-startup-saudi.jpg" },
  { title: "Leadership Essentials for New Managers", category: "Personal & Professional Growth", price: "$69.99", image: "/assets/courses/leadership-essentials.jpg" },
  { title: "Banking and Insurance Fundamentals", category: "Business", price: "$59.99", image: "/assets/courses/bank-insurance.jpg" },
  { title: "4G Networks: Architecture and Protocols", category: "Information Technology", price: "$109.99", image: "/assets/courses/4g-networks.jpg" },
  { title: "Arabic for Beginners", category: "Language", price: "$49.99", image: "/assets/courses/arabic-instructor.jpg" },
  { title: "3G Networks Explained", category: "Information Technology", price: "$39.99", image: "/assets/courses/3g-networks.jpg" },
];
// Newest first: each sample course was updated two days before the one above it.
const sampleDate = (i: number) => new Date(2026, 10, 5 - i * 2).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
const SAMPLE_COURSES: InstructorCourse[] = Array.from({ length: 65 }, (_, i) => {
  const t = SAMPLE_TITLES[i % SAMPLE_TITLES.length];
  const round = Math.floor(i / SAMPLE_TITLES.length);
  return {
    id: `course-${i + 1}`,
    title: round === 0 ? t.title : `${t.title} (Part ${round + 1})`,
    price: t.price,
    favorites: 40 + ((i * 37) % 260),
    purchases: 3 + ((i * 53) % 180),
    category: t.category,
    updated: sampleDate(i),
    status: STATUS_PATTERN[i % STATUS_PATTERN.length],
  };
});

// Older sample data repeated one Adobe XD course 65 times. Swap it for the varied list, keeping each course's status.
const OLD_SAMPLE_TITLE = "Adobe Xd: The Absolute Beginner to Pro Class";
const upgradeSample = (list: InstructorCourse[]) => (list.length > 0 && list.every((c) => c.title === OLD_SAMPLE_TITLE && /^course-\d+$/.test(c.id)) ? list.map((c, i) => ({ ...SAMPLE_COURSES[i % SAMPLE_COURSES.length], id: c.id, status: c.status })) : list);

// The picture for a sample course. Courses people create themselves have none until they upload one.
export const sampleCover = (course: InstructorCourse) => SAMPLE_TITLES.find((t) => course.title.startsWith(t.title))?.image ?? "";

export const thumbFor = (course: InstructorCourse) => {
  const match = SAMPLE_TITLES.find((t) => course.title.startsWith(t.title));
  if (match) return match.image;
  const hash = [...course.id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  return SAMPLE_TITLES[hash % SAMPLE_TITLES.length].image;
};

export const loadInstructorCourses = () => upgradeSample(load<InstructorCourse[]>(STORAGE_KEY, SAMPLE_COURSES));
export const saveInstructorCourses = (courses: InstructorCourse[]) => save(STORAGE_KEY, courses);
export const rejectedCourseCount = () => loadInstructorCourses().filter((c) => c.status === "rejected").length;

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

export const todayLabel = () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });

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

function CourseDialog({ onClose, onSave }: { onClose: () => void; onSave: (values: CourseValues) => void }) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("Draft");
  const [attempted, setAttempted] = useState(false);
  const priceValue = Number(price);
  const priceValid = price.trim() !== "" && Number.isFinite(priceValue) && priceValue >= 0;

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    setAttempted(true);
    if (!title.trim() || !priceValid || !category) return;
    onSave({
      title: title.trim(),
      price: priceValue === 0 ? "Free" : `$${priceValue.toFixed(2)}`,
      category,
      status: status === "Published" ? "published" : "draft",
    });
  };

  return (
    <Shell title="New course" onClose={onClose} width="max-w-[520px]" radius="sm:rounded-[12px]">
      <form id="course-form" onSubmit={submit} noValidate className="flex flex-col gap-5 p-6">
        <TextField id="course-title" label="Course title" required value={title} onChange={setTitle} placeholder="e.g. Adobe XD for beginners" error={attempted && !title.trim() ? "Enter a course title" : ""} />
        <TextField id="course-price" label="Price (USD)" required type="number" value={price} onChange={setPrice} placeholder="0 for a free course" error={attempted && !priceValid ? "Enter a price of 0 or more" : ""} />
        <SelectField id="course-category" label="Category" value={category} onChange={setCategory} placeholder="Select a category" options={[...new Set([...categories.map((c) => c.name as string), ...(category ? [category] : [])])]} />
        {attempted && !category && <p className={`-mt-3 text-[14px] leading-[20px] text-[#dc2626] ${fontRegular}`}>Select a category</p>}
        <SelectField id="course-status" label="Status" value={status} onChange={setStatus} placeholder="Select a status" options={["Draft", "Published"]} />
      </form>
      <div className="flex items-center justify-end gap-3 border-t border-[#e2e8f0] px-6 py-4">
        <button type="button" onClick={onClose} className={`h-[36px] rounded-[8px] border border-[#cbd5e1] bg-white px-4 text-[14px] text-[#1e293b] transition hover:bg-[#f8fafc] ${fontMedium}`}>
          Cancel
        </button>
        <button type="submit" form="course-form" className={`h-[36px] rounded-[8px] bg-[#ffb20d] px-4 text-[14px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
          Create course
        </button>
      </div>
    </Shell>
  );
}

type Tab = "all" | CourseStatus;
type SortKey = "updated" | "purchases" | "favorites" | "title";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All courses" },
  { key: "published", label: "Published" },
  { key: "pending", label: "In review" },
  { key: "draft", label: "Drafts" },
  { key: "rejected", label: "Rejected" },
];

const STATUS_STYLE: Record<CourseStatus, { label: string; dot: string; text: string; bg: string; ring: string }> = {
  published: { label: "Published", dot: "#10b981", text: "#047857", bg: "#ecfdf5", ring: "#a7f3d0" },
  pending: { label: "In review", dot: "#f59e0b", text: "#b45309", bg: "#fffbeb", ring: "#fde68a" },
  draft: { label: "Draft", dot: "#94a3b8", text: "#475569", bg: "#f8fafc", ring: "#e2e8f0" },
  rejected: { label: "Rejected", dot: "#ef4444", text: "#b91c1c", bg: "#fef2f2", ring: "#fecaca" },
};

export function StatusPill({ status }: { status: CourseStatus }) {
  const st = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] leading-[16px] ring-1 ring-inset ${fontSemi}`} style={{ color: st.text, backgroundColor: st.bg, ["--tw-ring-color" as string]: st.ring }}>
      <span className="size-1.5 rounded-full" style={{ backgroundColor: st.dot }} />
      {st.label}
    </span>
  );
}

function Icon({ d, className = "size-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const I = {
  plus: "M12 5v14M5 12h14",
  search: "M21 21l-4.3-4.3M11 18a7 7 0 100-14 7 7 0 000 14z",
  heart: "M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4 7.2 4c2 0 3.6 1 4.8 2.6C13.2 5 14.8 4 16.8 4 20.6 4 23 8 21.5 11.7 19.5 16.4 12 21 12 21z",
  cart: "M3 4h2l2.4 11h10.2L20 7H6M9 20h.01M17 20h.01",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z",
  trash: "M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6",
  megaphone: "M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1zM15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13",
  chevron: "M6 9l6 6 6-6",
  left: "M15 6l-6 6 6 6",
  right: "M9 6l6 6-6 6",
  backup: "M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2",
  book: "M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5z",
  globe: "M12 22a10 10 0 100-20 10 10 0 000 20zM2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20",
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
  warning: "M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
};

const parseDate = (label: string) => {
  const t = Date.parse(label.replace(/(\d{2})$/, "20$1"));
  return Number.isNaN(t) ? 0 : t;
};

function SummaryCard({ label, value, hint, icon, tone, bg, active, onClick }: { label: string; value: number; hint: string; icon: string; tone: string; bg: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`group flex items-center gap-4 rounded-[14px] border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] ${active ? "border-[#ffb20d] shadow-[0_0_0_3px_rgba(255,178,13,0.15)]" : "border-[#e2e8f0]"}`}>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px]" style={{ backgroundColor: bg, color: tone }}>
        <Icon d={icon} className="size-5" />
      </span>
      <span className="min-w-0">
        <span className={`block text-[13px] leading-[18px] text-[#64748b] ${fontMedium}`}>{label}</span>
        <span className={`block text-[22px] leading-[28px] tracking-[-0.3px] text-[#0f172a] ${fontBold}`}>{value}</span>
        <span className={`block truncate text-[12px] leading-[16px] text-[#94a3b8] ${fontRegular}`}>{hint}</span>
      </span>
    </button>
  );
}

export default function InstructorCourses({ startNew }: { startNew?: boolean }) {
  const { notify } = useApp();
  const [stored, setCourses] = useStoredState<InstructorCourse[]>(STORAGE_KEY, SAMPLE_COURSES);
  const courses = upgradeSample(stored);
  useEffect(() => {
    if (courses !== stored) setCourses(courses);
  }, [courses, stored, setCourses]);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [creating, setCreating] = useState(!!startNew);
  // Drop "/new" from the URL so a reload doesn't reopen the dialog.
  useEffect(() => {
    if (startNew) window.history.replaceState(null, "", "#/instructor/courses");
  }, [startNew]);
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
  const newCourse = () => setCreating(true);
  const saveCourse = (values: CourseValues) => {
    setCourses((list) => [{ id: `course-${Date.now()}`, favorites: 0, purchases: 0, updated: todayLabel(), ...values }, ...list]);
    setPage(1);
    setTab("all");
    notify("Course created");
    setCreating(false);
  };

  const counts = STATUSES.reduce((acc, st) => ({ ...acc, [st]: courses.filter((c) => c.status === st).length }), { all: courses.length } as Record<Tab, number>);
  const q = query.trim().toLowerCase();
  const filtered = courses
    .filter((c) => (tab === "all" || c.status === tab) && (!q || `${c.title} ${c.category}`.toLowerCase().includes(q)))
    .sort((a, b) => (sort === "title" ? a.title.localeCompare(b.title) : sort === "purchases" ? b.purchases - a.purchases : sort === "favorites" ? b.favorites - a.favorites : parseDate(b.updated) - parseDate(a.updated)));
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  const totalSales = courses.reduce((n, c) => n + c.purchases, 0);
  const pickTab = (t: Tab) => {
    setTab(t);
    setPage(1);
  };

  const firstShown = Math.max(1, Math.min(current - 2, pageCount - 4));
  const pageNumbers = Array.from({ length: Math.min(5, pageCount) }, (_, i) => firstShown + i);
  const ghostBtn = `flex h-10 items-center gap-2 rounded-[10px] border border-[#e2e8f0] bg-white px-3.5 text-[14px] text-[#0f172a] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-[#f8fafc] ${fontSemi}`;
  const iconBtn = "flex size-9 items-center justify-center rounded-[8px] text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#0f172a]";

  return (
    <main className="@container flex flex-1 flex-col bg-[#f6f7f9]">
      <div className="flex w-full flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className={`m-0 text-[28px] leading-[36px] tracking-[-0.4px] text-[#0f172a] ${fontBold}`}>Courses</h1>
            <p className={`mt-1 text-[15px] leading-[22px] text-[#64748b] ${fontRegular}`}>
              Create, edit and track all your recorded courses. <span className={`text-[#0f172a] ${fontSemi}`}>{totalSales.toLocaleString("en-US")}</span> sales so far.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input ref={backupInput} type="file" accept=".json,application/json" onChange={pickBackup} className="sr-only" tabIndex={-1} aria-label="Course backup file" />
            <ActionMenu
              label="Course backup"
              triggerClass={ghostBtn}
              trigger={
                <>
                  <Icon d={I.backup} className="size-4" />
                  Backup
                  <Icon d={I.chevron} className="size-4 text-[#64748b]" />
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
            <button type="button" onClick={newCourse} className={`flex h-10 items-center gap-2 rounded-[10px] bg-[#ffb20d] px-4 text-[14px] text-[#1e293b] shadow-[0_6px_16px_rgba(255,178,13,0.3)] transition hover:bg-[#faa104] ${fontSemi}`}>
              <Icon d={I.plus} className="size-[18px]" />
              New course
            </button>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-5 rounded-[16px] border border-dashed border-[#cbd5e1] bg-white px-6 py-16 text-center">
            <div className="flex size-[120px] items-center justify-center rounded-full bg-[#f8fafc]">
              <img src={imgEmpty} alt="" width={64} height={64} className="size-16" />
            </div>
            <div>
              <p className={`text-[18px] leading-[26px] text-[#0f172a] ${fontBold}`}>Create your first course</p>
              <p className={`mx-auto mt-1 max-w-[380px] text-[14px] leading-[22px] text-[#64748b] ${fontRegular}`}>Turn what you know into a course. Add lessons, set a price and publish when you're ready.</p>
            </div>
            <button type="button" onClick={newCourse} className={`flex h-11 items-center gap-2 rounded-[10px] bg-[#ffb20d] px-5 text-[14px] text-[#1e293b] transition hover:bg-[#faa104] ${fontSemi}`}>
              <img src={imgPlus} alt="" width={20} height={20} className="size-5" />
              New course
            </button>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4 @3xl:gap-4">
              <SummaryCard label="Published" value={counts.published} hint="Live on Thkee" icon={I.globe} tone="#059669" bg="#ecfdf5" active={tab === "published"} onClick={() => pickTab(tab === "published" ? "all" : "published")} />
              <SummaryCard label="In review" value={counts.pending} hint="Usually 2 to 3 days" icon={I.clock} tone="#b45309" bg="#fffbeb" active={tab === "pending"} onClick={() => pickTab(tab === "pending" ? "all" : "pending")} />
              <SummaryCard label="Drafts" value={counts.draft} hint="Finish and submit" icon={I.book} tone="#475569" bg="#f1f5f9" active={tab === "draft"} onClick={() => pickTab(tab === "draft" ? "all" : "draft")} />
              <SummaryCard label="Rejected" value={counts.rejected} hint="Fix and resubmit" icon={I.warning} tone="#dc2626" bg="#fef2f2" active={tab === "rejected"} onClick={() => pickTab(tab === "rejected" ? "all" : "rejected")} />
            </div>

            {/* Table card */}
            <section className="overflow-hidden rounded-[16px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef2f6] px-4 pt-3 @3xl:px-5">
                <div role="tablist" aria-label="Course status" className="-mb-px flex gap-1 overflow-x-auto">
                  {TABS.map((t) => {
                    const active = tab === t.key;
                    return (
                      <button key={t.key} type="button" role="tab" aria-selected={active} onClick={() => pickTab(t.key)} className={`flex shrink-0 items-center gap-2 border-b-2 px-3 pb-3 pt-2 text-[14px] transition ${active ? `border-[#ffb20d] text-[#0f172a] ${fontSemi}` : `border-transparent text-[#64748b] hover:text-[#0f172a] ${fontMedium}`}`}>
                        {t.label}
                        <span className={`rounded-full px-2 py-0.5 text-[11px] leading-[14px] ${active ? "bg-[#fff3d6] text-[#976002]" : "bg-[#f1f5f9] text-[#64748b]"} ${fontSemi}`}>{counts[t.key]}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex w-full items-center gap-2 pb-3 @3xl:w-auto">
                  <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 transition focus-within:border-[#ffb20d] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#ffb20d]/15 @3xl:w-[240px] @3xl:flex-none">
                    <Icon d={I.search} className="size-4 shrink-0 text-[#94a3b8]" />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search courses"
                      aria-label="Search courses"
                      className={`min-w-0 flex-1 bg-transparent text-[14px] text-[#0f172a] outline-none placeholder:text-[#94a3b8] ${fontRegular}`}
                    />
                  </label>
                  <label className="relative">
                    <span className="sr-only">Sort by</span>
                    <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={`h-9 appearance-none rounded-[10px] border border-[#e2e8f0] bg-white pl-3 pr-8 text-[14px] text-[#0f172a] outline-none transition hover:bg-[#f8fafc] focus:border-[#ffb20d] ${fontMedium}`}>
                      <option value="updated">Recently updated</option>
                      <option value="purchases">Most sales</option>
                      <option value="favorites">Most favourited</option>
                      <option value="title">Title A to Z</option>
                    </select>
                    <Icon d={I.chevron} className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" />
                  </label>
                </div>
              </div>

              <div className="@container">
                <div aria-hidden="true" className={`hidden grid-cols-[minmax(0,1fr)_96px_96px_110px_120px_88px] items-center gap-4 bg-[#f8fafc] px-5 py-2.5 text-[12px] uppercase tracking-[0.5px] text-[#64748b] @3xl:grid ${fontSemi}`}>
                  <span>Course</span>
                  <span>Sales</span>
                  <span>Favourites</span>
                  <span>Updated</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>
                {visible.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]">
                      <Icon d={I.search} className="size-5" />
                    </span>
                    <p className={`text-[15px] text-[#0f172a] ${fontSemi}`}>No courses match</p>
                    <p className={`text-[14px] text-[#64748b] ${fontRegular}`}>Try another search or status.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        pickTab("all");
                      }}
                      className={`mt-2 text-[14px] text-[#976002] hover:underline ${fontSemi}`}
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y divide-[#eef2f6]">
                    {visible.map((course) => (
                      <li key={course.id} className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-4 py-4 transition hover:bg-[#fafbfc] @3xl:grid-cols-[minmax(0,1fr)_96px_96px_110px_120px_88px] @3xl:px-5">
                        <div className="flex min-w-0 items-start gap-3 @md:items-center @md:gap-4">
                          <div className="relative aspect-video w-[76px] shrink-0 overflow-hidden rounded-[10px] @md:w-[104px] bg-[#0f172a] ring-1 ring-[#0f172a]/5 @3xl:w-[112px]">
                            <img src={thumbFor(course)} alt="" loading="lazy" className="size-full object-cover transition duration-300 group-hover:scale-105" />
                          </div>
                          <div className="min-w-0">
                            <button type="button" onClick={() => openCourseEditor(course.id)} className={`line-clamp-2 text-left text-[15px] leading-[21px] text-[#0f172a] transition hover:text-[#976002] ${fontSemi}`}>
                              {course.title}
                            </button>
                            <p className={`mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-[18px] text-[#64748b] ${fontRegular}`}>
                              <span className={`text-[#0f172a] ${fontSemi}`}>{course.price}</span>
                              <span className="size-1 rounded-full bg-[#cbd5e1]" />
                              <span className="truncate">{course.category}</span>
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 @3xl:hidden">
                              <StatusPill status={course.status} />
                              <span className={`flex items-center gap-1 text-[12px] text-[#64748b] ${fontMedium}`}>
                                <Icon d={I.cart} className="size-3.5" />
                                {course.purchases}
                              </span>
                              <span className={`flex items-center gap-1 text-[12px] text-[#64748b] ${fontMedium}`}>
                                <Icon d={I.heart} className="size-3.5" />
                                {course.favorites}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`hidden text-[14px] tabular-nums text-[#0f172a] @3xl:block ${fontSemi}`}>{course.purchases.toLocaleString("en-US")}</span>
                        <span className={`hidden items-center gap-1.5 text-[14px] tabular-nums text-[#334155] @3xl:flex ${fontMedium}`}>
                          <Icon d={I.heart} className="size-3.5 text-[#f43f5e]" />
                          {course.favorites.toLocaleString("en-US")}
                        </span>
                        <span className={`hidden text-[13px] text-[#64748b] @3xl:block ${fontRegular}`}>{course.updated}</span>
                        <span className="hidden flex-col items-start gap-1 @3xl:flex">
                          <StatusPill status={course.status} />
                          {course.status === "published" && <span className={`pl-1 text-[11px] text-[#94a3b8] ${fontMedium}`}>Unlisted</span>}
                        </span>
                        <div className="flex items-center justify-end gap-0.5">
                          <button type="button" aria-label={`Edit ${course.title}`} title="Edit" onClick={() => openCourseEditor(course.id)} className={iconBtn}>
                            <Icon d={I.edit} className="size-[17px]" />
                          </button>
                          {course.status === "published" ? (
                            <button type="button" aria-label={`Announce ${course.title}`} title="Announce" onClick={() => notify("Announcements are coming soon")} className={iconBtn}>
                              <Icon d={I.megaphone} className="size-[17px]" />
                            </button>
                          ) : (
                            <button type="button" aria-label={`Delete ${course.title}`} title="Delete" onClick={() => setDeleting(course)} className={`${iconBtn} hover:bg-[#fef2f2] hover:text-[#dc2626]`}>
                              <Icon d={I.trash} className="size-[17px]" />
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {filtered.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef2f6] px-4 py-3 @3xl:px-5">
                  <p className={`text-[13px] text-[#64748b] ${fontRegular}`}>
                    Showing <span className={`text-[#0f172a] ${fontSemi}`}>{start + 1}</span> to <span className={`text-[#0f172a] ${fontSemi}`}>{start + visible.length}</span> of <span className={`text-[#0f172a] ${fontSemi}`}>{filtered.length}</span> courses
                  </p>
                  <nav aria-label="Pagination" className="flex items-center gap-1">
                    <button type="button" aria-label="Previous page" disabled={current === 1} onClick={() => setPage(current - 1)} className="flex size-9 items-center justify-center rounded-[8px] border border-[#e2e8f0] text-[#334155] transition hover:bg-[#f8fafc] disabled:opacity-40">
                      <Icon d={I.left} className="size-4" />
                    </button>
                    {pageNumbers.map((n) => (
                      <button key={n} type="button" aria-label={`Page ${n}`} aria-current={n === current ? "page" : undefined} onClick={() => setPage(n)} className={`flex size-9 items-center justify-center rounded-[8px] text-[13px] transition ${n === current ? `bg-[#0f172a] text-white ${fontSemi}` : `text-[#334155] hover:bg-[#f1f5f9] ${fontMedium}`}`}>
                        {n}
                      </button>
                    ))}
                    <button type="button" aria-label="Next page" disabled={current === pageCount} onClick={() => setPage(current + 1)} className="flex size-9 items-center justify-center rounded-[8px] border border-[#e2e8f0] text-[#334155] transition hover:bg-[#f8fafc] disabled:opacity-40">
                      <Icon d={I.right} className="size-4" />
                    </button>
                  </nav>
                </div>
              )}
            </section>
          </>
        )}
      </div>
      {creating && <CourseDialog onClose={() => setCreating(false)} onSave={saveCourse} />}
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
            const { [deleting.id]: _removed, ...details } = load<Record<string, unknown>>(COURSE_DETAILS_KEY, {});
            save(COURSE_DETAILS_KEY, details);
            setDeleting(null);
            notify("Course deleted");
          }}
        />
      )}
    </main>
  );
}
