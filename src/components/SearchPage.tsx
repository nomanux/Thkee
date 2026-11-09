import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { categories, courses, courseTags, type Course } from "../data";
import { fontBold, fontFor, fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { useApp, type SearchParams } from "../store";
import { CourseThumb } from "./Overlays";

const PAGE_SIZE = 9;
const arabic = /[؀-ۿ]/;

const languageOf = (c: Course) => (arabic.test(c.title) ? "Arabic" : "English");
export const isBestseller = (c: Course) => c.students >= 2500;
const formatOf = (c: Course) => (c.live ? "Live cohort" : "Recorded");
const lengthBuckets = [
  { label: "0 – 2 hours", test: (h: number) => h < 2 },
  { label: "2 – 5 hours", test: (h: number) => h >= 2 && h < 5 },
  { label: "5 – 10 hours", test: (h: number) => h >= 5 && h < 10 },
  { label: "10 – 15 hours", test: (h: number) => h >= 10 && h < 15 },
  { label: "15+ hours", test: (h: number) => h >= 15 },
];
const ratingSteps = [4.9, 4.8, 4.7, 4.5];
const allTopics = [...new Set(Object.values(courseTags).flat())];

type Filters = {
  price: string[];
  category: string[];
  sub: string[];
  format: string[];
  length: string[];
  rating: number | null;
  level: string[];
  language: string[];
  topics: string[];
};
type MultiKey = Exclude<keyof Filters, "rating">;

const emptyFilters: Filters = { price: [], category: [], sub: [], format: [], length: [], rating: null, level: [], language: [], topics: [] };

const passes: { [K in keyof Filters]: (c: Course, v: Filters[K]) => boolean } = {
  price: (c, v) => !v.length || v.includes(c.price === 0 ? "Free" : "Paid"),
  category: (c, v) => !v.length || v.includes(c.category),
  sub: (c, v) => !v.length || v.includes(c.subcategory),
  format: (c, v) => !v.length || v.includes(formatOf(c)),
  length: (c, v) => !v.length || lengthBuckets.some((b) => v.includes(b.label) && b.test(c.hours)),
  rating: (c, v) => v === null || c.rating >= v,
  level: (c, v) => !v.length || v.includes(c.level),
  language: (c, v) => !v.length || v.includes(languageOf(c)),
  topics: (c, v) => !v.length || (courseTags[c.id] ?? []).some((t) => v.includes(t)),
};

function matchesQuery(c: Course, q: string) {
  if (!q) return true;
  const hay = `${c.title} ${c.instructor} ${c.category} ${c.subcategory} ${c.description} ${(courseTags[c.id] ?? []).join(" ")}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((word) => hay.includes(word));
}

const sorters: Record<string, (a: Course, b: Course) => number> = {
  "Most Popular": (a, b) => b.students - a.students,
  "Highest Rated": (a, b) => b.rating - a.rating || b.students - a.students,
  Newest: (a, b) => (b.launched ?? "2025").localeCompare(a.launched ?? "2025"),
  "Price: Low to High": (a, b) => a.price - b.price,
  "Price: High to Low": (a, b) => b.price - a.price,
};

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const row = (cls: string) => (
    <span className={`flex ${cls}`} style={{ fontSize: size, lineHeight: 1 }}>
      {"★★★★★"}
    </span>
  );
  return (
    <span className="relative inline-flex shrink-0" aria-label={`${value.toFixed(1)} out of 5`}>
      {row("text-[#e2e8f0]")}
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${(value / 5) * 100}%` }}>
        {row("text-[#f59e0b]")}
      </span>
    </span>
  );
}

function Price({ course, size = "text-[18px]" }: { course: Course; size?: string }) {
  if (course.price === 0) return <span className={`${size} text-[#0d5c4b] ${fontBold}`}>Free</span>;
  return (
    <span className="flex items-baseline gap-1.5">
      {course.originalPrice && <span className={`text-[13px] text-[#94a3b8] line-through ${fontRegular}`}>{course.originalPrice} SAR</span>}
      <span className={`${size} ${course.originalPrice ? "text-[#dc2626]" : "text-[#0f172a]"} ${fontBold}`}>{course.price} SAR</span>
    </span>
  );
}

export function ResultCard({ course }: { course: Course }) {
  const { setOverlay } = useApp();
  return (
    <button
      type="button"
      onClick={() => setOverlay({ type: "course", id: course.id })}
      className="group flex w-full flex-col overflow-hidden rounded-[14px] border border-[#e2e8f0] bg-white text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
    >
      <div className="relative overflow-hidden">
        <CourseThumb course={course} showTitle={false} className="aspect-video transition-transform duration-500 group-hover:scale-[1.04]" />
        {isBestseller(course) && <span className={`absolute bottom-3 left-3 rounded-[6px] bg-[#d9f26b] px-2.5 py-1 text-[12px] text-[#1e293b] ${fontSemi}`}>Bestseller</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <span className={`text-[14px] text-[#0f172a] ${fontSemi}`}>{course.rating.toFixed(1)}</span>
            <Stars value={course.rating} />
          </span>
          <span dir="auto" className={`truncate text-[13px] text-[#475569] ${fontFor(course.instructor, fontRegular, "font-normal")}`}>
            By {course.instructor}
          </span>
        </div>
        <span dir="auto" className={`line-clamp-2 min-h-[48px] text-left text-[16px] leading-[24px] text-[#1e293b] transition-colors group-hover:text-[#0d5c4b] ${fontFor(course.title, fontSemi)}`}>
          {course.title}
        </span>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className={`flex items-center gap-1.5 text-[13px] text-[#64748b] ${fontRegular}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            {course.duration ?? `${course.hours} hours`}
          </span>
          <Price course={course} size="text-[17px]" />
        </div>
      </div>
    </button>
  );
}

function Carousel({ items }: { items: Course[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  };
  useEffect(update, [items]);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  const arrow = (dir: 1 | -1, hidden: boolean) => (
    <button
      type="button"
      aria-label={dir === 1 ? "Next courses" : "Previous courses"}
      onClick={() => scroll(dir)}
      className={`absolute top-[30%] z-10 hidden size-12 items-center justify-center rounded-full bg-[#1e293b] text-white shadow-[0_10px_24px_rgba(15,23,42,0.3)] transition hover:scale-105 hover:bg-[#0d5c4b] md:flex ${dir === 1 ? "-right-5" : "-left-5"} ${hidden ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <path d={dir === 1 ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
      </svg>
    </button>
  );
  return (
    <div className="relative">
      {arrow(-1, edge.start)}
      <div ref={ref} onScroll={update} className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-4 pt-1 [scrollbar-width:none] md:mx-0 md:scroll-px-0 md:px-0 [&::-webkit-scrollbar]:hidden">
        {items.map((c) => (
          <div key={c.id} className="w-[78%] shrink-0 snap-start sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-40px)/3)] xl:w-[calc((100%-60px)/4)]">
            <ResultCard course={c} />
          </div>
        ))}
      </div>
      {arrow(1, edge.end)}
    </div>
  );
}

function FeaturedCourse({ course }: { course: Course }) {
  const { setOverlay } = useApp();
  return (
    <div className="grid grid-cols-1 gap-6 rounded-[18px] border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
      <div className="relative overflow-hidden rounded-[12px]">
        <CourseThumb course={course} showTitle={false} className="aspect-video" />
        <span className={`absolute left-4 top-4 rounded-[6px] bg-[#d9f26b] px-2.5 py-1 text-[12px] text-[#1e293b] ${fontSemi}`}>Best Seller</span>
      </div>
      <div className="flex flex-col gap-3 py-1 lg:py-3">
        <p dir="auto" className={`text-left text-[22px] leading-[1.35] text-[#0f172a] ${fontFor(course.title, fontHeading, "font-bold")}`}>{course.title}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Stars value={course.rating} size={18} />
          <span className={`text-[18px] text-[#0f172a] ${fontSemi}`}>{course.rating.toFixed(2)}</span>
          <span className={`text-[14px] text-[#64748b] ${fontRegular}`}>({Math.round(course.students / 14).toLocaleString()} ratings)</span>
        </div>
        <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#334155] ${fontRegular}`}>
          <span dir="auto">
            Course by <span className={fontFor(course.instructor, fontMedium, "font-medium")}>{course.instructor}</span>
          </span>
          <span className="size-1 rounded-full bg-[#334155]" />
          <span>Last updated {new Date(course.launched ?? "2026-06-01").toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
          <span className="size-1 rounded-full bg-[#334155]" />
          <span>{course.students.toLocaleString()} students enrolled</span>
        </div>
        <p className={`line-clamp-2 text-[14px] leading-[22px] text-[#475569] ${fontRegular}`}>{course.description}</p>
        <div className="flex flex-wrap gap-2">
          {(courseTags[course.id] ?? []).map((t) => (
            <span key={t} className={`rounded-[6px] border border-[#e2e8f0] px-2.5 py-1 text-[12px] text-[#334155] ${fontMedium}`}>
              {t}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-4 pt-4">
          <Price course={course} size="text-[24px]" />
          <button type="button" onClick={() => setOverlay({ type: "course", id: course.id })} className={`h-[48px] rounded-[10px] bg-[#ffb20d] px-7 text-[16px] text-[#1e293b] shadow-[0_8px_20px_rgba(255,178,13,0.3)] transition hover:-translate-y-0.5 hover:bg-[#faa104] ${fontSemi}`}>
            View Course
          </button>
        </div>
      </div>
    </div>
  );
}

function Check({ checked }: { checked: boolean }) {
  return (
    <span className={`flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border transition ${checked ? "border-[#0d5c4b] bg-[#0d5c4b]" : "border-[#cbd5e1] bg-white group-hover:border-[#0d5c4b]"}`}>
      {checked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12l5 5 9-10" />
        </svg>
      )}
    </span>
  );
}

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="flex flex-col gap-3">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={`flex items-center justify-between rounded-[8px] bg-[#f8fafc] px-3 py-2 text-[12px] uppercase tracking-[1px] text-[#0f172a] ${fontSemi}`}>
        {title}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`transition-transform ${open ? "" : "-rotate-90"}`} aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <div className="flex flex-col gap-2.5 px-1">{children}</div>}
    </div>
  );
}

function Option({ label, count, checked, onToggle, prefix }: { label: string; count: number; checked: boolean; onToggle: () => void; prefix?: ReactNode }) {
  const disabled = count === 0 && !checked;
  return (
    <button type="button" role="checkbox" aria-checked={checked} disabled={disabled} onClick={onToggle} className={`group flex items-center gap-2.5 text-left text-[14px] text-[#334155] ${fontRegular} ${disabled ? "opacity-40" : ""}`}>
      <Check checked={checked} />
      {prefix}
      <span>{label}</span>
      <span className="text-[#94a3b8]">({count})</span>
    </button>
  );
}

export default function SearchPage({ params }: { params: SearchParams }) {
  const { openSearch } = useApp();
  const [query, setQuery] = useState(params.q ?? "");
  const [filters, setFilters] = useState<Filters>({
    ...emptyFilters,
    category: params.category ? [params.category] : [],
    sub: params.sub ? [params.sub] : [],
    format: params.live ? ["Live cohort"] : [],
  });
  const [sort, setSort] = useState("Most Popular");
  const [topTab, setTopTab] = useState("Most Popular");
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const heading = params.q ? `Results for “${params.q}”` : params.sub ? `${params.sub} Courses` : params.category ? `${params.category} Courses` : params.live ? "Live Cohort Courses" : "All Courses";
  const topicName = params.sub ?? params.category ?? (params.q ? `“${params.q}”` : "Thkee");

  const scope = useMemo(() => courses.filter((c) => matchesQuery(c, query.trim())), [query]);

  const passAll = (c: Course, except?: keyof Filters) =>
    (Object.keys(passes) as (keyof Filters)[]).every((k) => k === except || (passes[k] as (c: Course, v: unknown) => boolean)(c, filters[k]));

  const results = useMemo(() => scope.filter((c) => passAll(c)).sort(sorters[sort]), [scope, filters, sort]);
  const count = (key: keyof Filters, test: (c: Course) => boolean) => scope.filter((c) => passAll(c, key) && test(c)).length;

  useEffect(() => setPage(1), [query, filters, sort]);
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const shown = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const routeScope = useMemo(() => courses.filter((c) => matchesQuery(c, params.q ?? "") && passes.category(c, params.category ? [params.category] : []) && passes.sub(c, params.sub ? [params.sub] : []) && passes.format(c, params.live ? ["Live cohort"] : [])), [params]);
  const carouselBase = routeScope.length >= 4 ? routeScope : courses;
  const carousel = useMemo(() => {
    const list = [...carouselBase];
    if (topTab === "New") return list.sort(sorters.Newest);
    if (topTab === "For Beginner") return list.filter((c) => c.level === "Beginner").sort(sorters["Most Popular"]);
    return list.sort(sorters["Most Popular"]);
  }, [carouselBase, topTab]);
  const featured = [...carouselBase].sort((a, b) => Number(!!b.image) - Number(!!a.image) || b.students - a.students)[0];

  const currentSubs = categories.find((c) => c.name === params.category)?.subs.filter((sub) => sub !== params.sub) ?? [];
  const related = [...currentSubs, ...categories.map((c) => c.name).filter((n) => n !== params.category), ...allTopics].slice(0, 8);

  const toggle = (key: MultiKey, value: string) =>
    setFilters((f) => {
      const next = { ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] };
      if (key === "category" && f.category.includes(value)) {
        const dropped = categories.find((c) => c.name === value)?.subs ?? [];
        next.sub = f.sub.filter((s) => !(dropped as readonly string[]).includes(s));
      }
      return next;
    });
  const subOptions = categories.filter((c) => filters.category.includes(c.name)).flatMap((c) => c.subs);

  const activeChips: { label: string; clear: () => void }[] = [
    ...(Object.keys(filters) as (keyof Filters)[]).flatMap((key) =>
      key === "rating"
        ? filters.rating === null
          ? []
          : [{ label: `${filters.rating}+ rating`, clear: () => setFilters((f) => ({ ...f, rating: null })) }]
        : (filters[key] as string[]).map((v) => ({ label: v, clear: () => toggle(key as MultiKey, v) })),
    ),
    ...(query.trim() ? [{ label: `“${query.trim()}”`, clear: () => setQuery("") }] : []),
  ];
  const clearAll = () => {
    setFilters(emptyFilters);
    setQuery("");
  };

  const sidebar = (
    <div className="flex flex-col gap-6">
      <label className="field-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search courses…" aria-label="Search within results" className={`min-w-0 flex-1 bg-transparent text-[14px] text-[#0f172a] outline-none placeholder:text-slate-400 ${fontRegular}`} />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-[#94a3b8] hover:text-[#0f172a]">
            ✕
          </button>
        )}
      </label>
      <div className="flex flex-col gap-6 rounded-[14px] border border-[#e2e8f0] bg-white p-4">
        <div className="flex items-center justify-between">
          <span className={`text-[20px] text-[#0f172a] ${fontHeading}`}>Filters</span>
          <button type="button" onClick={clearAll} disabled={!activeChips.length} className={`text-[13px] text-[#ea580c] underline underline-offset-2 disabled:text-[#cbd5e1] disabled:no-underline ${fontMedium}`}>
            Clear Filters
          </button>
        </div>
        <FilterSection title="Price">
          {["Paid", "Free"].map((v) => (
            <Option key={v} label={v} count={count("price", (c) => (c.price === 0 ? "Free" : "Paid") === v)} checked={filters.price.includes(v)} onToggle={() => toggle("price", v)} />
          ))}
        </FilterSection>
        <FilterSection title="Category">
          {categories.map(({ name }) => (
            <Option key={name} label={name} count={count("category", (c) => c.category === name)} checked={filters.category.includes(name)} onToggle={() => toggle("category", name)} />
          ))}
        </FilterSection>
        {subOptions.length > 0 && (
          <FilterSection title="Subcategory">
            {subOptions.map((sub) => (
              <Option key={sub} label={sub} count={count("sub", (c) => c.subcategory === sub)} checked={filters.sub.includes(sub)} onToggle={() => toggle("sub", sub)} />
            ))}
          </FilterSection>
        )}
        <FilterSection title="Format">
          {["Recorded", "Live cohort"].map((v) => (
            <Option key={v} label={v} count={count("format", (c) => formatOf(c) === v)} checked={filters.format.includes(v)} onToggle={() => toggle("format", v)} />
          ))}
        </FilterSection>
        <FilterSection title="Course length">
          {lengthBuckets.map((b) => (
            <Option key={b.label} label={b.label} count={count("length", (c) => b.test(c.hours))} checked={filters.length.includes(b.label)} onToggle={() => toggle("length", b.label)} />
          ))}
        </FilterSection>
        <FilterSection title="Ratings">
          {ratingSteps.map((r) => (
            <Option
              key={r}
              label={`${r} & up`}
              prefix={<Stars value={r} />}
              count={count("rating", (c) => c.rating >= r)}
              checked={filters.rating === r}
              onToggle={() => setFilters((f) => ({ ...f, rating: f.rating === r ? null : r }))}
            />
          ))}
        </FilterSection>
        <FilterSection title="Level">
          {["Beginner", "Intermediate", "Advanced"].map((v) => (
            <Option key={v} label={v} count={count("level", (c) => c.level === v)} checked={filters.level.includes(v)} onToggle={() => toggle("level", v)} />
          ))}
        </FilterSection>
        <FilterSection title="Language">
          {["English", "Arabic"].map((v) => (
            <Option key={v} label={v} count={count("language", (c) => languageOf(c) === v)} checked={filters.language.includes(v)} onToggle={() => toggle("language", v)} />
          ))}
        </FilterSection>
        <FilterSection title="Topics">
          <div className="flex flex-wrap gap-2">
            {allTopics.map((t) => {
              const on = filters.topics.includes(t);
              return (
                <button key={t} type="button" aria-pressed={on} onClick={() => toggle("topics", t)} className={`rounded-[6px] border px-2.5 py-1.5 text-[12px] transition ${fontMedium} ${on ? "border-[#0d5c4b] bg-[#0d5c4b] text-white" : "border-[#e2e8f0] text-[#334155] hover:border-[#0d5c4b]"}`}>
                  {t}
                </button>
              );
            })}
          </div>
        </FilterSection>
      </div>
    </div>
  );

  return (
    <main className="w-full bg-white pt-[56px]">
      <section className="w-full border-b border-[#e2e8f0] bg-[#f8fafc] px-4 pt-10 md:px-8">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3">
          <nav aria-label="Breadcrumb" className={`flex items-center gap-2 text-[13px] text-[#64748b] ${fontRegular}`}>
            <a href="#" className="hover:text-[#0d5c4b]">
              Home
            </a>
            <span>/</span>
            <button type="button" onClick={() => openSearch({})} className="hover:text-[#0d5c4b]">
              Courses
            </button>
            {params.category && (
              <>
                <span>/</span>
                {params.sub ? (
                  <button type="button" onClick={() => openSearch({ category: params.category })} className="hover:text-[#0d5c4b]">
                    {params.category}
                  </button>
                ) : (
                  <span className="text-[#0f172a]">{params.category}</span>
                )}
              </>
            )}
            {(params.sub || params.q) && (
              <>
                <span>/</span>
                <span className="text-[#0f172a]">{params.sub ?? "Search"}</span>
              </>
            )}
          </nav>
          <h1 dir="auto" className={`m-0 text-left text-[30px] leading-[1.2] tracking-[-0.6px] text-[#1e293b] md:text-[36px] ${fontFor(heading, fontHeading, "font-bold")}`} style={{ fontVariationSettings: '"wdth" 100' }}>
            {heading}
          </h1>
          <p className={`text-[14px] text-[#475569] ${fontRegular}`}>
            {routeScope.length} {routeScope.length === 1 ? "course" : "courses"} taught by expert instructors — learn at your pace or join a live cohort.
          </p>
          <div role="tablist" className="-mb-px mt-4 flex gap-1 overflow-x-auto">
            {["Most Popular", "New", "For Beginner"].map((t) => (
              <button key={t} type="button" role="tab" aria-selected={topTab === t} onClick={() => setTopTab(t)} className={`shrink-0 border-b-2 px-4 pb-3 text-[14px] transition ${fontMedium} ${topTab === t ? "border-[#ffb20d] text-[#0f172a]" : "border-transparent text-[#64748b] hover:text-[#0f172a]"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1240px] flex-col gap-14 px-4 py-10 md:px-8 xl:px-0">
        {routeScope.length < 4 && (
          <p className={`-mb-8 rounded-[12px] bg-[#fff8e6] px-4 py-3 text-[14px] text-[#9a4a00] ${fontRegular}`}>Only a few courses match this search, so here are our most popular courses too.</p>
        )}
        <Carousel key={topTab} items={carousel} />

        <section className="flex flex-col gap-5">
          <h2 dir="auto" className={`m-0 text-left text-[22px] text-[#1e293b] md:text-[24px] ${fontFor(topicName, fontHeading, "font-bold")}`}>
            {topicName} students also learn
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {related.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() =>
                  (currentSubs as readonly string[]).includes(r)
                    ? openSearch({ category: params.category, sub: r })
                    : categories.some((c) => c.name === r)
                      ? openSearch({ category: r })
                      : openSearch({ q: r })
                }
                className={`h-12 rounded-[10px] border border-[#e2e8f0] bg-white px-3 text-[14px] text-[#1e293b] transition hover:-translate-y-0.5 hover:border-[#0d5c4b] hover:text-[#0d5c4b] hover:shadow-[0_8px_20px_rgba(15,23,42,0.06)] ${fontMedium}`}
              >
                {r}
              </button>
            ))}
          </div>
        </section>

        {featured && (
          <section className="flex flex-col gap-5">
            <h2 dir="auto" className={`m-0 text-left text-[22px] text-[#1e293b] md:text-[24px] ${fontFor(topicName, fontHeading, "font-bold")}`}>
              Featured {params.sub ?? params.category ?? ""} Course
            </h2>
            <FeaturedCourse course={featured} />
          </section>
        )}

        <section ref={resultsRef} className="flex scroll-mt-[96px] flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h2 className={`m-0 text-[26px] text-[#1e293b] md:text-[30px] ${fontHeading}`}>All {params.sub ?? params.category ?? ""} Courses</h2>
            <p className={`text-[14px] text-[#475569] ${fontRegular}`}>Narrow down with filters to find the course that fits your goals.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[278px_minmax(0,1fr)] lg:gap-12">
            <aside className="hidden lg:block">{sidebar}</aside>
            <div className="flex min-w-0 flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className={`text-[15px] text-[#0f172a] ${fontSemi}`}>
                  {results.length} {results.length === 1 ? "course" : "courses"} found
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setDrawer(true)} className={`flex h-9 items-center gap-2 rounded-[8px] border border-[#e2e8f0] px-3 text-[14px] text-[#0f172a] lg:hidden ${fontMedium}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M4 6h16M7 12h10M10 18h4" />
                    </svg>
                    Filters
                    {activeChips.length > 0 && <span className={`rounded-full bg-[#0d5c4b] px-1.5 text-[11px] text-white ${fontSemi}`}>{activeChips.length}</span>}
                  </button>
                  <label className={`flex items-center gap-2 text-[14px] text-[#64748b] ${fontRegular}`}>
                    <span className="hidden sm:inline">Sort by:</span>
                    <select value={sort} onChange={(e) => setSort(e.target.value)} className={"field w-auto"}>
                      {Object.keys(sorters).map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              {activeChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {activeChips.map((chip) => (
                    <button key={chip.label} type="button" onClick={chip.clear} className={`flex items-center gap-1.5 rounded-full bg-[#e7f5f1] py-1 pl-3 pr-2 text-[13px] text-[#0d5c4b] transition hover:bg-[#d3eee6] ${fontMedium}`}>
                      {chip.label}
                      <span aria-hidden>✕</span>
                      <span className="sr-only">Remove filter</span>
                    </button>
                  ))}
                  <button type="button" onClick={clearAll} className={`px-2 text-[13px] text-[#ea580c] underline underline-offset-2 ${fontMedium}`}>
                    Clear all
                  </button>
                </div>
              )}
              {shown.length ? (
                <div key={`${page}-${results.length}-${sort}`} className="fade-up grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
                  {shown.map((c) => (
                    <ResultCard key={c.id} course={c} />
                  ))}
                </div>
              ) : (
                <div className={`flex flex-col items-center gap-3 rounded-[16px] border border-dashed border-[#cbd5e1] px-6 py-16 text-center ${fontRegular}`}>
                  <span className="text-[40px]">🔍</span>
                  <p className={`text-[18px] text-[#0f172a] ${fontSemi}`}>No courses match these filters</p>
                  <p className="text-[14px] text-[#64748b]">Try removing a filter or searching for something broader.</p>
                  <button type="button" onClick={clearAll} className={`mt-2 h-11 rounded-[10px] bg-[#0d5c4b] px-5 text-[14px] text-white hover:bg-[#0b4c3e] ${fontSemi}`}>
                    Clear all filters
                  </button>
                </div>
              )}
              {pages > 1 && (
                <nav aria-label="Pagination" className="mt-2 flex items-center justify-center gap-2">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      aria-current={p === page ? "page" : undefined}
                      onClick={() => {
                        setPage(p);
                        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className={`size-10 rounded-[10px] text-[14px] transition ${fontSemi} ${p === page ? "bg-[#0f172a] text-white" : "border border-[#e2e8f0] text-[#0f172a] hover:border-[#0d5c4b]"}`}
                    >
                      {p}
                    </button>
                  ))}
                </nav>
              )}
            </div>
          </div>
        </section>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-[150] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="overlay-fade absolute inset-0 bg-[#0f172a]/50" onClick={() => setDrawer(false)} />
          <div className="drawer-in absolute inset-y-0 right-0 flex w-full max-w-[360px] flex-col bg-[#f8fafc]">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-white px-4 py-3">
              <span className={`text-[18px] text-[#0f172a] ${fontHeading}`}>Filters</span>
              <button type="button" onClick={() => setDrawer(false)} aria-label="Close filters" className="flex size-9 items-center justify-center rounded-full text-[#64748b] hover:bg-[#f1f5f9]">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{sidebar}</div>
            <div className="border-t border-[#e2e8f0] bg-white p-4">
              <button type="button" onClick={() => setDrawer(false)} className={`h-12 w-full rounded-[10px] bg-[#ffb20d] text-[16px] text-[#1e293b] ${fontSemi}`}>
                Show {results.length} {results.length === 1 ? "course" : "courses"}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 z-[90] flex size-11 items-center justify-center rounded-[10px] bg-[#ffb20d] text-[#1e293b] shadow-[0_10px_24px_rgba(255,178,13,0.4)] transition hover:-translate-y-0.5"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 19V5M6 11l6-6 6 6" />
        </svg>
      </button>
    </main>
  );
}
