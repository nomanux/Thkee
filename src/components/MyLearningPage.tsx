import { useState, type ReactNode } from "react";
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

function percentDone(course: Course) {
  const total = buildCurriculum(course).reduce((sum, s) => sum + s.lessons.length, 0);
  const done = load<{ done: string[] }>(`thkee.progress.${course.id}`, { done: [] }).done.length;
  return Math.round((done / total) * 100);
}

function MenuIcon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-[#64748b]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function ClassCard({ course }: { course: Course }) {
  const { enrolledIds, archivedIds, toggleArchive, wishlistIds, toggleWishlist, setOverlay, notify } = useApp();
  const enrolled = enrolledIds.includes(course.id);
  const archived = archivedIds.includes(course.id);
  const percent = percentDone(course);
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

  return (
    <li className="flex flex-col rounded-[10px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
      <div className="relative">
        <button type="button" onClick={open} aria-label={`Open ${course.title}`} className="block w-full overflow-hidden rounded-t-[10px]">
          <CourseThumb course={course} showTitle={false} className="aspect-video [&>span]:hidden" />
        </button>
        {isBestseller(course) && <span className={`pointer-events-none absolute bottom-3 left-3 rounded-[6px] bg-[#d9f26b] px-2.5 py-1 text-[12px] text-[#1e293b] ${fontSemi}`}>Bestseller</span>}
        <div className="absolute right-3 top-3">
          <ActionMenu
            label={`Options for ${course.title}`}
            triggerClass="flex size-7 items-center justify-center rounded-[6px] bg-white text-[#0f172a] shadow-sm transition hover:bg-[#f1f5f9]"
            trigger={
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                <circle cx="5" cy="12" r="1.8" />
                <circle cx="12" cy="12" r="1.8" />
                <circle cx="19" cy="12" r="1.8" />
              </svg>
            }
            items={[
              {
                label: "Share",
                onClick: share,
                icon: (
                  <MenuIcon>
                    <circle cx="18" cy="5" r="2.5" />
                    <circle cx="6" cy="12" r="2.5" />
                    <circle cx="18" cy="19" r="2.5" />
                    <path d="M8.2 10.8l7.6-4.5M8.2 13.2l7.6 4.5" />
                  </MenuIcon>
                ),
              },
              {
                label: wishlistIds.includes(course.id) ? "Unfavorite" : "Favorite",
                onClick: () => toggleWishlist(course.id),
                icon: (
                  <MenuIcon>
                    <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" />
                  </MenuIcon>
                ),
              },
              ...(enrolled
                ? [
                    {
                      label: archived ? "Unarchive" : "Archive",
                      onClick: () => toggleArchive(course.id),
                      icon: (
                        <MenuIcon>
                          <path d="M4 4h16v4H4zM5 8v11a1 1 0 001 1h12a1 1 0 001-1V8M10 12h4" />
                        </MenuIcon>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className={`flex items-center gap-1.5 text-[14px] text-[#0f172a] ${fontSemi}`}>
            {course.rating.toFixed(1)}
            <Stars value={course.rating} />
          </span>
          <span dir="auto" className={`min-w-0 truncate text-[12px] text-[#475569] ${fontFor(course.instructor, fontRegular, "font-normal")}`}>
            By {course.instructor}
          </span>
        </div>
        <button type="button" dir="auto" onClick={open} className={`line-clamp-2 text-left text-[14px] leading-[22px] text-[#0f172a] transition-colors hover:text-[#0d5c4b] ${fontFor(course.title, fontSemi)}`}>
          {course.title}
        </button>
        {enrolled && (
          <div className="mt-auto flex flex-col gap-1.5 pt-1">
            <div className="h-[3px] overflow-hidden rounded-full bg-[#e2e8f0]" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${course.title} progress`}>
              <div className="h-full rounded-full bg-[#ffb20d]" style={{ width: `${percent}%` }} />
            </div>
            <div className={`flex items-center justify-between text-[12px] text-[#475569] ${fontRegular}`}>
              <span>{percent > 0 ? `${percent}% Completed` : ""}</span>
              <span>100%</span>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

export default function MyLearningPage({ initialTab = "All Courses" }: { initialTab?: Tab }) {
  const { enrolledIds, archivedIds, wishlistIds, openSearch } = useApp();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [sort, setSort] = useState("enrolled");
  const [category, setCategory] = useState("all");
  const [completion, setCompletion] = useState("all");
  const [instructor, setInstructor] = useState("all");

  const enrolled = [...enrolledIds].reverse().flatMap((id) => courses.filter((c) => c.id === id));
  const inTab = tab === "Wishlist" ? [...wishlistIds].reverse().flatMap((id) => courses.filter((c) => c.id === id)) : enrolled.filter((c) => archivedIds.includes(c.id) === (tab === "Archived"));

  const uniqueOptions = (values: string[]) => [...new Set(values)].map((value) => ({ value, label: value }));
  const categoryOptions = [{ value: "all", label: "All Categories" }, ...uniqueOptions(inTab.map((c) => c.category))];
  const instructorOptions = [{ value: "all", label: "All Instructors" }, ...uniqueOptions(inTab.map((c) => c.instructor))];

  const isIn = (percent: number) => (completion === "not-started" ? percent === 0 : completion === "completed" ? percent === 100 : percent > 0 && percent < 100);
  const shown = inTab
    .filter((c) => (category === "all" || c.category === category) && (instructor === "all" || c.instructor === instructor) && (completion === "all" || isIn(percentDone(c))))
    .sort((a, b) => {
      if (sort === "az") return a.title.localeCompare(b.title);
      if (sort === "za") return b.title.localeCompare(a.title);
      if (sort === "accessed") return load(`thkee.lastOpened.${b.id}`, 0) - load(`thkee.lastOpened.${a.id}`, 0);
      return 0;
    });

  const filtered = category !== "all" || completion !== "all" || instructor !== "all";
  const clearFilters = () => {
    setCategory("all");
    setCompletion("all");
    setInstructor("all");
  };

  return (
    <main className="w-full bg-white px-4 pb-20 pt-[112px] md:px-8">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-6">
        <div className="flex flex-col gap-5 border-b border-[#e2e8f0]">
          <h1 className={`m-0 text-[26px] text-[#0f172a] ${fontHeading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
            My Classes
          </h1>
          <div role="tablist" aria-label="My classes" className="flex gap-2 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => {
                  setTab(t);
                  clearFilters();
                }}
                className={`shrink-0 border-b-2 px-3 pb-3 text-[14px] transition ${tab === t ? `border-[#ffb20d] text-[#0f172a] ${fontSemi}` : `border-transparent text-[#64748b] hover:text-[#0f172a] ${fontMedium}`}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-[8px] bg-[#f8fafc] p-3">
          <FilterSelect label="Sort by" options={sortOptions} value={sort} onChange={setSort} />
          <FilterSelect label="Filter by" options={categoryOptions} value={category} onChange={setCategory} />
          <FilterSelect label="Completion" options={completionOptions} value={completion} onChange={setCompletion} />
          <FilterSelect label="Instructor" options={instructorOptions} value={instructor} onChange={setInstructor} />
        </div>

        {shown.length > 0 ? (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((course) => (
              <ClassCard key={course.id} course={course} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className={`text-[14px] text-[#64748b] ${fontRegular}`}>{filtered ? "No classes match these filters." : tab === "Wishlist" ? "Courses you favorite will appear here." : tab === "Archived" ? "Classes you archive will appear here." : "You have no classes yet."}</p>
            <button type="button" onClick={filtered ? clearFilters : () => openSearch({})} className={`h-[44px] rounded-[8px] bg-[#ffb20d] px-5 text-[14px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
              {filtered ? "Clear filters" : "Browse courses"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
