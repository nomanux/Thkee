import { useState } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  ArchiveIcon,
  ArrowRight01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  FavouriteIcon,
  MoreHorizontalIcon,
  PlayIcon,
  Search01Icon,
  Share08Icon,
} from "@hugeicons/core-free-icons";
import { courses, type Course } from "../data";
import { fontFor, fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, openLearning, useApp } from "../store";
import { buildCurriculum } from "./CourseDetailsPage";
import { ActionMenu, FilterSelect } from "./Menus";
import { CourseThumb } from "./Overlays";
import { isBestseller, Stars } from "./SearchPage";

const tabs = ["All Courses", "Wishlist", "Archived"] as const;
type Tab = (typeof tabs)[number];

const sortOptions = [
  { value: "enrolled", label: "Recently Enrolled" },
  { value: "accessed", label: "Recently Accessed" },
  { value: "az", label: "Title: A-Z" },
  { value: "za", label: "Title: Z-A" },
];
const completionOptions = [
  { value: "all", label: "All" },
  { value: "not-started", label: "Not Started" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

type Progress = { done: number; total: number; percent: number; currentTitle?: string; currentIndex: number };

function progressOf(course: Course): Progress {
  const lessons = buildCurriculum(course).flatMap((s, si) => s.lessons.map((l, li) => ({ ...l, key: `${si}-${li}` })));
  const saved = load<{ done: string[]; current?: string }>(`thkee.progress.${course.id}`, { done: [] });
  const total = lessons.length;
  const done = saved.done.length;
  const currentIndex = Math.max(0, lessons.findIndex((l) => l.key === saved.current));
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0, currentTitle: lessons[currentIndex]?.title, currentIndex };
}

function Icon({ icon, size = 16, className = "" }: { icon: IconSvgElement; size?: number; className?: string }) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.8} aria-hidden="true" className={`shrink-0 ${className}`} />;
}

function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={`h-full rounded-full transition-all duration-500 ${percent === 100 ? "bg-primary-700" : "bg-secondary-500"}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

export function ClassCard({ course }: { course: Course }) {
  const { enrolledIds, archivedIds, toggleArchive, wishlistIds, toggleWishlist, setOverlay, notify } = useApp();
  const enrolled = enrolledIds.includes(course.id);
  const archived = archivedIds.includes(course.id);
  const wished = wishlistIds.includes(course.id);
  const p = progressOf(course);
  const open = () => (enrolled ? openLearning(course.id) : setOverlay({ type: "course", id: course.id }));

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/course/${course.id}`;
    try {
      await navigator.clipboard.writeText(url);
      notify("Course link copied");
    } catch {
      notify("Copy this link: " + url);
    }
  };

  const status = !enrolled ? null : p.percent === 100 ? "Completed" : p.percent > 0 ? "In progress" : "Not started";
  const cta = !enrolled ? "View course" : p.percent === 100 ? "Review course" : p.percent > 0 ? "Continue" : "Start course";

  return (
    <li className="group/card flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-panel">
      <div className="relative">
        <button type="button" onClick={open} aria-label={`Open ${course.title}`} className="relative block w-full overflow-hidden">
          <CourseThumb course={course} showTitle={false} className="aspect-video transition duration-500 group-hover/card:scale-105 [&>span]:hidden" />
          <span className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition group-hover/card:bg-slate-900/30">
            <span className="flex size-12 scale-90 items-center justify-center rounded-full bg-white/95 text-slate-900 opacity-0 shadow-lg transition group-hover/card:scale-100 group-hover/card:opacity-100">
              <Icon icon={PlayIcon} size={20} className="ml-0.5 fill-current" />
            </span>
          </span>
        </button>
        <div className="pointer-events-none absolute left-3 top-3 flex gap-1.5">
          {status === "Completed" && (
            <span className={`inline-flex items-center gap-1 rounded-md bg-primary-700 px-2 py-1 text-11 text-white ${fontSemi}`}>
              <Icon icon={CheckmarkCircle02Icon} size={12} />
              Completed
            </span>
          )}
          {isBestseller(course) && <span className={`rounded-md bg-secondary-500 px-2 py-1 text-11 text-slate-900 ${fontSemi}`}>Bestseller</span>}
        </div>
        <div className="absolute right-3 top-3">
          <ActionMenu
            label={`Options for ${course.title}`}
            triggerClass="flex size-8 items-center justify-center rounded-lg bg-white/95 text-slate-900 shadow-sm backdrop-blur transition hover:bg-white"
            trigger={<Icon icon={MoreHorizontalIcon} size={18} />}
            items={[
              { label: "Share", onClick: share, icon: <Icon icon={Share08Icon} className="text-slate-500" /> },
              {
                label: wished ? "Remove from wishlist" : "Add to wishlist",
                onClick: () => toggleWishlist(course.id),
                icon: <Icon icon={FavouriteIcon} className={wished ? "fill-current text-red-500" : "text-slate-500"} />,
              },
              ...(enrolled
                ? [{ label: archived ? "Unarchive" : "Archive", onClick: () => toggleArchive(course.id), icon: <Icon icon={ArchiveIcon} className="text-slate-500" /> }]
                : []),
            ]}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span dir="auto" className={`truncate text-start text-xs text-slate-500 ${fontFor(course.instructor, fontRegular, "font-normal")}`}>
          {course.instructor}
        </span>
        <button type="button" dir="auto" onClick={open} className={`line-clamp-2 text-start text-15 leading-snug text-slate-900 transition-colors hover:text-primary-700 ${fontFor(course.title, fontSemi)}`}>
          {course.title}
        </button>
        <span className={`flex items-center gap-1.5 text-13 text-slate-600 ${fontRegular}`}>
          <span className={`text-slate-900 ${fontSemi}`}>{course.rating.toFixed(1)}</span>
          <Stars value={course.rating} />
        </span>

        <div className="mt-auto flex flex-col gap-3 pt-3">
          {enrolled && (
            <div className="flex flex-col gap-1.5">
              <div className={`flex items-center justify-between text-xs ${fontRegular}`}>
                <span className="text-slate-500">
                  {p.done}/{p.total} lessons
                </span>
                <span className={`tabular-nums ${p.percent === 100 ? "text-primary-700" : "text-slate-900"} ${fontSemi}`}>{p.percent}%</span>
              </div>
              <ProgressBar percent={p.percent} label={`${course.title} progress`} />
            </div>
          )}
          <button
            type="button"
            onClick={open}
            className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border text-13 transition ${
              enrolled && p.percent > 0 && p.percent < 100
                ? "border-primary-700 bg-primary-700 text-white hover:bg-primary-800"
                : "border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50"
            } ${fontSemi}`}
          >
            {cta}
            <Icon icon={ArrowRight01Icon} size={14} />
          </button>
        </div>
      </div>
    </li>
  );
}

function ContinueCard({ course }: { course: Course }) {
  const p = progressOf(course);
  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card sm:flex-row">
      <button type="button" onClick={() => openLearning(course.id)} aria-label={`Resume ${course.title}`} className="relative shrink-0 sm:w-72">
        <CourseThumb course={course} showTitle={false} className="aspect-video size-full [&>span]:hidden" />
        <span className="absolute inset-0 flex items-center justify-center bg-slate-900/25">
          <span className="flex size-12 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg">
            <Icon icon={PlayIcon} size={20} className="ml-0.5 fill-current" />
          </span>
        </span>
      </button>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-5">
        <span className={`text-xs uppercase tracking-wider text-primary-700 ${fontSemi}`}>Continue where you left off</span>
        <h2 dir="auto" className={`m-0 line-clamp-1 text-start text-lg text-slate-900 ${fontFor(course.title, fontSemi)}`}>
          {course.title}
        </h2>
        <p dir="auto" className={`line-clamp-1 text-start text-sm text-slate-500 ${fontRegular}`}>
          Lesson {p.currentIndex + 1} of {p.total}
          {p.currentTitle ? ` · ${p.currentTitle}` : ""}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-4">
          <div className="min-w-40 flex-1">
            <ProgressBar percent={p.percent} label={`${course.title} progress`} />
          </div>
          <span className={`text-13 tabular-nums text-slate-700 ${fontSemi}`}>{p.percent}% complete</span>
          <button
            type="button"
            onClick={() => openLearning(course.id)}
            className={`flex h-10 items-center gap-2 rounded-lg bg-primary-700 px-4 text-sm text-white shadow-primary-xs transition hover:bg-primary-800 ${fontSemi}`}
          >
            Resume
            <Icon icon={ArrowRight01Icon} size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default function MyLearningPage({ initialTab = "All Courses" }: { initialTab?: Tab }) {
  const { enrolledIds, archivedIds, wishlistIds, openSearch } = useApp();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [sort, setSort] = useState("enrolled");
  const [category, setCategory] = useState("all");
  const [completion, setCompletion] = useState("all");
  const [instructor, setInstructor] = useState("all");
  const [query, setQuery] = useState("");

  const byIds = (ids: string[]) => [...ids].reverse().flatMap((id) => courses.filter((c) => c.id === id));
  const enrolled = byIds(enrolledIds);
  const active = enrolled.filter((c) => !archivedIds.includes(c.id));
  const lists: Record<Tab, Course[]> = {
    "All Courses": active,
    Wishlist: byIds(wishlistIds),
    Archived: enrolled.filter((c) => archivedIds.includes(c.id)),
  };
  const inTab = lists[tab];

  const percents = active.map((c) => progressOf(c).percent);
  const inProgress = percents.filter((p) => p > 0 && p < 100).length;
  const completed = percents.filter((p) => p === 100).length;

  const resume = [...active]
    .filter((c) => {
      const p = progressOf(c).percent;
      return p < 100 && load(`thkee.lastOpened.${c.id}`, 0) > 0;
    })
    .sort((a, b) => load(`thkee.lastOpened.${b.id}`, 0) - load(`thkee.lastOpened.${a.id}`, 0))[0];

  const uniqueOptions = (values: string[]) => [...new Set(values)].map((value) => ({ value, label: value }));
  const categoryOptions = [{ value: "all", label: "All Categories" }, ...uniqueOptions(inTab.map((c) => c.category))];
  const instructorOptions = [{ value: "all", label: "All Instructors" }, ...uniqueOptions(inTab.map((c) => c.instructor))];

  const q = query.trim().toLowerCase();
  const isIn = (percent: number) => (completion === "not-started" ? percent === 0 : completion === "completed" ? percent === 100 : percent > 0 && percent < 100);
  const shown = inTab
    .filter(
      (c) =>
        (!q || c.title.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q)) &&
        (category === "all" || c.category === category) &&
        (instructor === "all" || c.instructor === instructor) &&
        (completion === "all" || isIn(progressOf(c).percent)),
    )
    .sort((a, b) => {
      if (sort === "az") return a.title.localeCompare(b.title);
      if (sort === "za") return b.title.localeCompare(a.title);
      if (sort === "accessed") return load(`thkee.lastOpened.${b.id}`, 0) - load(`thkee.lastOpened.${a.id}`, 0);
      return 0;
    });

  const filtered = category !== "all" || completion !== "all" || instructor !== "all" || q !== "";
  const clearFilters = () => {
    setCategory("all");
    setCompletion("all");
    setInstructor("all");
    setQuery("");
  };

  return (
    <main className="w-full bg-slate-25 px-4 pb-20 pt-28 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className={`m-0 text-26 text-slate-900 ${fontHeading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
            My Classes
          </h1>
          <p className={`text-sm text-slate-500 ${fontRegular}`}>
            {active.length} {active.length === 1 ? "course" : "courses"}
            <span className="mx-2 text-slate-300">•</span>
            {inProgress} in progress
            <span className="mx-2 text-slate-300">•</span>
            {completed} completed
          </p>
        </div>

        {tab === "All Courses" && resume && !filtered && <ContinueCard course={resume} />}

        {/* Tabs + search */}
        <div className="flex flex-col gap-3 border-b border-slate-200 md:flex-row md:items-end md:justify-between">
          <div role="tablist" aria-label="My classes" className="scrollbar-none -mb-px flex gap-1 overflow-x-auto">
            {tabs.map((t) => {
              const selected = tab === t;
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    setTab(t);
                    clearFilters();
                  }}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-3 pb-3 text-sm transition ${
                    selected ? `border-primary-700 text-slate-900 ${fontSemi}` : `border-transparent text-slate-500 hover:text-slate-900 ${fontMedium}`
                  }`}
                >
                  {t}
                  <span className={`rounded-full px-1.5 py-0.5 text-11 leading-none tabular-nums ${selected ? "bg-primary-700 text-white" : "bg-slate-100 text-slate-500"} ${fontSemi}`}>
                    {lists[t].length}
                  </span>
                </button>
              );
            })}
          </div>
          <label className="relative mb-3 flex items-center md:w-72">
            <Icon icon={Search01Icon} className="pointer-events-none absolute left-3 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your classes"
              aria-label="Search your classes"
              className={`h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary-700 focus:ring-3 focus:ring-primary-700/10 ${fontRegular}`}
            />
          </label>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect label="Sort by" options={sortOptions} value={sort} onChange={setSort} />
          <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" aria-hidden="true" />
          <FilterSelect label="Category" options={categoryOptions} value={category} onChange={setCategory} />
          {tab !== "Wishlist" && <FilterSelect label="Progress" options={completionOptions} value={completion} onChange={setCompletion} />}
          <FilterSelect label="Instructor" options={instructorOptions} value={instructor} onChange={setInstructor} />
          {filtered && (
            <button type="button" onClick={clearFilters} className={`ml-1 inline-flex items-center gap-1 text-13 text-slate-500 transition hover:text-slate-900 ${fontMedium}`}>
              <Icon icon={Cancel01Icon} size={14} />
              Clear
            </button>
          )}
          <span className={`ml-auto text-13 text-slate-500 ${fontRegular}`}>
            {shown.length} {shown.length === 1 ? "result" : "results"}
          </span>
        </div>

        {shown.length > 0 ? (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((course) => (
              <ClassCard key={course.id} course={course} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Icon icon={filtered ? Search01Icon : tab === "Wishlist" ? FavouriteIcon : tab === "Archived" ? ArchiveIcon : PlayIcon} size={22} />
            </span>
            <p className={`text-15 text-slate-900 ${fontSemi}`}>
              {filtered ? "No classes match" : tab === "Wishlist" ? "Your wishlist is empty" : tab === "Archived" ? "Nothing archived" : "No classes yet"}
            </p>
            <p className={`-mt-2 text-sm text-slate-500 ${fontRegular}`}>
              {filtered ? "Try a different search or clear the filters." : tab === "Wishlist" ? "Courses you add to your wishlist will appear here." : tab === "Archived" ? "Classes you archive will appear here." : "Find a course to start learning."}
            </p>
            <button
              type="button"
              onClick={filtered ? clearFilters : () => openSearch({})}
              className={`mt-1 h-10 rounded-lg bg-primary-700 px-5 text-sm text-white transition hover:bg-primary-800 ${fontSemi}`}
            >
              {filtered ? "Clear filters" : "Browse courses"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
