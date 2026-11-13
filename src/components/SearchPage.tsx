import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { categories, courses, courseTags, type Course } from "../data";
import { fontBold, fontFor, fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { useApp, type SearchParams } from "../store";
import { CourseThumb } from "./Overlays";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon, BookOpen01Icon, ChartIncreaseIcon, Clock01Icon, Fire02Icon, SparklesIcon, StarIcon } from "@hugeicons/core-free-icons";
import { buttonClass } from "./Button"

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
      {row("text-slate-200")}
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${(value / 5) * 100}%` }}>
        {row("text-secondary-600")}
      </span>
    </span>
  );
}

function Price({ course, size = "text-lg" }: { course: Course; size?: string }) {
  if (course.price === 0) return <span className={`${size} text-primary-700 ${fontBold}`}>Free</span>;
  return (
    <span className="flex items-baseline gap-1.5">
      {course.originalPrice && <span className={`text-13 text-slate-400 line-through ${fontRegular}`}>{course.originalPrice} SAR</span>}
      <span className={`${size} ${course.originalPrice ? "text-red-600" : "text-slate-900"} ${fontBold}`}>{course.price} SAR</span>
    </span>
  );
}

export function ResultCard({ course }: { course: Course }) {
  const { setOverlay } = useApp();
  return (
    <button
      type="button"
      onClick={() => setOverlay({ type: "course", id: course.id })}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className="relative overflow-hidden">
        <CourseThumb course={course} showTitle={false} className="aspect-video transition-transform duration-500 group-hover:scale-104" />
        {isBestseller(course) && <span className={`absolute bottom-3 left-3 rounded-md bg-lime-300 px-2.5 py-1 text-xs text-slate-800 ${fontSemi}`}>Bestseller</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <span className={`text-sm text-slate-900 ${fontSemi}`}>{course.rating.toFixed(1)}</span>
            <Stars value={course.rating} />
          </span>
          <span dir="auto" className={`truncate text-13 text-slate-600 ${fontFor(course.instructor, fontRegular, "font-normal")}`}>
            By {course.instructor}
          </span>
        </div>
        <span dir="auto" className={`line-clamp-2 min-h-12 text-left text-base leading-6 text-slate-800 transition-colors group-hover:text-primary-700 ${fontFor(course.title, fontSemi)}`}>
          {course.title}
        </span>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className={`flex items-center gap-1.5 text-13 text-slate-500 ${fontRegular}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            {course.duration ?? `${course.hours} hours`}
          </span>
          <Price course={course} size="text-17" />
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
      className={`absolute top-3/10 z-10 hidden size-12 items-center justify-center rounded-full bg-slate-800 text-white shadow-2xl transition hover:scale-105 hover:bg-primary-700 md:flex ${dir === 1 ? "-right-5" : "-left-5"} ${hidden ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <path d={dir === 1 ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
      </svg>
    </button>
  );
  return (
    <div className="relative">
      {arrow(-1, edge.start)}
      {/* A sideways scroller clips anything outside it, so it gets extra padding (offset by negative margins)
          to leave room for the cards' hover lift and shadow. */}
      <div ref={ref} onScroll={update} className="-mx-4 -mb-6 -mt-3 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-10 pt-3 scrollbar-none [&::-webkit-scrollbar]:hidden">
        {items.map((c) => (
          <div key={c.id} className="w-39/50 shrink-0 snap-start sm:w-col-2 lg:w-col-3 xl:w-col-4">
            <ResultCard course={c} />
          </div>
        ))}
      </div>
      {arrow(1, edge.end)}
    </div>
  );
}

// Featured course spotlight: a dark card with moving colour glows, the course image as the hero,
// glass chips and stat tiles, and one bright call to action. Inspired by Fresha and Higgsfield hero cards.
function FeaturedCourse({ course }: { course: Course }) {
  const { setOverlay } = useApp();
  const open = () => setOverlay({ type: "course", id: course.id });
  const ratings = Math.round(course.students / 14);
  const initials = course.instructor
    .split(" ")
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  const stats = [
    { icon: Clock01Icon, value: course.duration ?? `${course.hours} hours`, label: "Video" },
    { icon: BookOpen01Icon, value: `${course.lessons} lessons`, label: "Content" },
    { icon: ChartIncreaseIcon, value: course.level, label: "Level" },
  ];
  return (
    <article className="group/feat relative isolate overflow-hidden rounded-3xl bg-gray-900 p-3 text-white shadow-2xl md:p-4">
      {/* Colour glows that drift slowly behind the content */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-28 -z-10 size-105 rounded-full bg-emerald-500/25 blur-3xl animate-feat-drift motion-reduce:animate-none" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 right-0 -z-10 size-105 rounded-full bg-secondary-500/25 blur-3xl animate-feat-drift-slow motion-reduce:animate-none" />
      <div aria-hidden="true" className="pointer-events-none absolute right-1/3 top-0 -z-10 size-65 rounded-full bg-indigo-500/20 blur-3xl" />
      {/* Fine grid texture */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-7 bg-grid-lines bg-grid-32 mask-fade-radial" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-split-left lg:gap-8">
        <button type="button" onClick={open} aria-label={`Open ${course.title}`} className="relative block overflow-hidden rounded-2xl text-left ring-1 ring-white/10">
          <CourseThumb course={course} showTitle={false} className="aspect-video transition duration-700 group-hover/feat:scale-104 [&>img:nth-of-type(2)]:scale-104" />
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
          <span className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-gray-900/60 py-1 pl-1 pr-2.5 text-xs leading-4 text-white ring-1 ring-inset ring-white/20 backdrop-blur-md ${fontSemi}`}>
            <span className="flex size-5 items-center justify-center rounded-full bg-linear-135 from-emerald-300 to-emerald-500 text-emerald-950">
              <HugeiconsIcon icon={Fire02Icon} size={12} strokeWidth={2.2} className="fill-current" />
            </span>
            Bestseller
          </span>
          <span className={`absolute bottom-3 left-3 flex items-center gap-2 rounded-xl bg-white/15 px-2.5 py-1.5 text-white ring-1 ring-inset ring-white/25 backdrop-blur-md ${fontMedium}`}>
            <HugeiconsIcon icon={StarIcon} size={14} strokeWidth={2} className="fill-secondary-500 text-secondary-500" />
            <span className={`text-13 leading-none ${fontBold}`}>{course.rating.toFixed(1)}</span>
            <span className="h-3 w-px bg-white/40" />
            <span className="text-xs leading-none text-white/90">{course.students.toLocaleString()} learners</span>
          </span>
        </button>

        <div className="flex min-w-0 flex-col py-1 lg:py-3 lg:pr-3">
          <span className={`flex w-fit items-center gap-1.5 rounded-full bg-linear-90 from-secondary-500/22 to-secondary-500/6 px-2.5 py-1 text-11 uppercase leading-3.5 tracking-widest text-amber-300 ring-1 ring-inset ring-secondary-500/30 ${fontSemi}`}>
            <HugeiconsIcon icon={SparklesIcon} size={13} strokeWidth={2} />
            Editor's pick · {course.subcategory}
          </span>
          <h3 dir="auto" className={`m-0 mt-3 text-left text-28 leading-tight tracking-tight text-transparent md:text-34 bg-linear-180 from-slate-25 to-slate-300 bg-clip-text ${fontFor(course.title, fontHeading, "font-bold")}`}>
            {course.title}
          </h3>
          <p className={`m-0 mt-2.5 line-clamp-2 text-sm leading-5.5 text-white/70 ${fontRegular}`}>{course.description}</p>

          <div className="mt-4 flex items-center gap-2.5">
            <span className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-135 from-secondary-500 to-orange-500 text-13 text-slate-800 ring-2 ring-white/20 ${fontBold}`}>{initials || "T"}</span>
            <span className="min-w-0">
              <span dir="auto" className={`block truncate text-sm leading-4.5 text-white ${fontFor(course.instructor, fontSemi, "font-semibold")}`}>{course.instructor}</span>
              <span className={`block text-xs leading-4 text-white/55 ${fontRegular}`}>
                Instructor · {ratings.toLocaleString()} ratings
              </span>
            </span>
          </div>

          <dl className="mt-5 grid grid-cols-3 gap-2">
            {stats.map((st) => (
              <div key={st.label} className="rounded-2xl bg-white/6 px-3 py-2.5 ring-1 ring-inset ring-white/10 backdrop-blur-sm transition hover:bg-white/10">
                <dt className={`flex items-center gap-1 text-11 leading-3.5 text-white/55 ${fontMedium}`}>
                  <HugeiconsIcon icon={st.icon} size={13} strokeWidth={1.8} className="text-emerald-300" />
                  {st.label}
                </dt>
                <dd className={`m-0 mt-1 truncate text-sm leading-4.5 text-white ${fontSemi}`}>{st.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-6">
            <div className="flex flex-col">
              {course.price === 0 ? (
                <>
                  <span className={`text-3xl leading-8.5 text-emerald-300 ${fontBold}`}>Free</span>
                  <span className={`text-xs text-white/55 ${fontRegular}`}>Full access, no card needed</span>
                </>
              ) : (
                <>
                  <span className="flex items-baseline gap-2">
                    <span className={`text-3xl leading-8.5 text-white ${fontBold}`}>{course.price} SAR</span>
                    {course.originalPrice && <span className={`text-sm text-white/40 line-through ${fontRegular}`}>{course.originalPrice} SAR</span>}
                  </span>
                  <span className={`text-xs text-white/55 ${fontRegular}`}>One-time payment · lifetime access</span>
                </>
              )}
            </div>
            <button type="button" onClick={open} className={`group/cta relative flex h-12.5 items-center gap-2 overflow-hidden rounded-full bg-secondary-500 pl-6 pr-1.5 text-15 text-gray-900 shadow-2xl shadow-secondary-500 transition hover:-translate-y-0.5 hover:bg-secondary-400 ${fontBold}`}>
              <span aria-hidden="true" className="absolute inset-0 bg-linear-110 from-transparent from-35% via-slate-25/55 via-50% to-transparent to-65% bg-size-shine animate-badge-shine-fast motion-reduce:hidden" />
              <span className="relative">{course.price === 0 ? "Start learning" : "View course"}</span>
              <span className="relative flex size-9.5 items-center justify-center rounded-full bg-gray-900 text-secondary-500 transition group-hover/cta:translate-x-0.5">
                <HugeiconsIcon icon={ArrowRight02Icon} size={18} strokeWidth={2} />
              </span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function Check({ checked }: { checked: boolean }) {
  return (
    <span className={`flex size-4.5 shrink-0 items-center justify-center rounded-sm border transition ${checked ? "border-primary-700 bg-primary-700" : "border-slate-300 bg-white group-hover:border-primary-700"}`}>
      {checked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12l5 5 9-10" />
        </svg>
      )}
    </span>
  );
}

// One filter group: a plain heading with how many are picked, folding open and shut. Groups are split by thin lines.
function FilterSection({ title, children, defaultOpen = true, selected = 0 }: { title: string; children: ReactNode; defaultOpen?: boolean; selected?: number }) {
  const [open, setOpen] = useState(defaultOpen || selected > 0);
  return (
    <div className="py-4 first:pt-1 last:pb-1">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="group flex w-full items-center gap-2 text-left">
        <span className={`flex-1 text-sm leading-5 text-slate-900 ${fontSemi}`}>{title}</span>
        {selected > 0 && <span className={`rounded-full bg-primary-700 px-1.5 py-px text-11 leading-4 text-white tabular-nums ${fontSemi}`}>{selected}</span>}
        <span className="flex size-6 items-center justify-center rounded-md text-slate-400 transition group-hover:bg-slate-150 group-hover:text-slate-900">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      {open && <div className="fade-up mt-3 flex flex-col gap-0.5">{children}</div>}
    </div>
  );
}

// A row with a checkbox, label and a count on the right. Rows with no matching course are greyed out.
function Option({ label, count, checked, onToggle, prefix }: { label: string; count: number; checked: boolean; onToggle: () => void; prefix?: ReactNode }) {
  const disabled = count === 0 && !checked;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className={`group -mx-2 flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm leading-5 transition ${checked ? `bg-primary-100 text-slate-900 ${fontMedium}` : `text-slate-700 hover:bg-slate-25 ${fontRegular}`} ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      <span className="mt-px">
        <Check checked={checked} />
      </span>
      {prefix && <span className="mt-0.75 shrink-0">{prefix}</span>}
      <span className="min-w-0 flex-1">{label}</span>
      <span className={`mt-px shrink-0 rounded-full px-1.5 text-xs leading-4.5 tabular-nums ${checked ? "bg-white text-primary-700" : "bg-slate-150 text-slate-500"} ${fontMedium}`}>{count}</span>
    </button>
  );
}

// Short choices as pill toggles (price, format, level, language): quicker to scan and tap than checkbox rows.
function Chips({ options }: { options: { label: string; count: number; checked: boolean; onToggle: () => void }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const disabled = o.count === 0 && !o.checked;
        return (
          <button
            key={o.label}
            type="button"
            aria-pressed={o.checked}
            disabled={disabled}
            onClick={o.onToggle}
            className={`flex h-8 items-center gap-1.5 rounded-full border px-3 text-13 transition disabled:cursor-not-allowed disabled:opacity-40 ${o.checked ? `border-primary-700 bg-primary-700 text-white ${fontSemi}` : `border-slate-200 bg-white text-slate-700 hover:border-slate-400 ${fontMedium}`}`}
          >
            {o.checked && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12l5 5 9-10" />
              </svg>
            )}
            {o.label}
            <span className={`text-xs tabular-nums ${o.checked ? "text-white/75" : "text-slate-400"}`}>{o.count}</span>
          </button>
        );
      })}
    </div>
  );
}

// Long lists show the first few, with a link to see the rest.
function ShowMore({ children, limit = 5 }: { children: ReactNode[]; limit?: number }) {
  const [all, setAll] = useState(false);
  // Hiding a single extra row saves nothing, so only collapse when two or more would be hidden.
  if (children.length <= limit + 1) return <>{children}</>;
  return (
    <>
      {all ? children : children.slice(0, limit)}
      <button type="button" onClick={() => setAll((a) => !a)} className={`mt-1 w-fit text-13 text-primary-700 underline-offset-2 hover:underline ${fontSemi}`}>
        {all ? "Show less" : `Show all ${children.length}`}
      </button>
    </>
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
    <div className="flex flex-col gap-3">
      <label className="field-box h-11 rounded-xl">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search in these courses…" aria-label="Search within results" className={`min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 ${fontRegular}`} />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-slate-400 hover:text-slate-900">
            ✕
          </button>
        )}
      </label>
      <div className="rounded-2xl border border-slate-200 bg-white px-4 pb-2 pt-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-150 pb-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          <span className={`flex-1 text-17 leading-6 text-slate-900 ${fontSemi}`}>Filters</span>
          {activeChips.length > 0 && (
            <button type="button" onClick={clearAll} className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs text-slate-500 transition hover:bg-red-50 hover:text-red-600 ${fontMedium}`}>
              Clear all
              <span className={`rounded-full bg-slate-900 px-1.5 text-11 leading-4 text-white tabular-nums ${fontSemi}`}>{activeChips.length}</span>
            </button>
          )}
        </div>
        <div className="divide-y divide-slate-150">
          <FilterSection title="Price" selected={filters.price.length}>
            <Chips options={["Free", "Paid"].map((v) => ({ label: v, count: count("price", (c) => (c.price === 0 ? "Free" : "Paid") === v), checked: filters.price.includes(v), onToggle: () => toggle("price", v) }))} />
          </FilterSection>
          <FilterSection title="Category" selected={filters.category.length}>
            <ShowMore>
              {categories.map(({ name }) => (
                <Option key={name} label={name} count={count("category", (c) => c.category === name)} checked={filters.category.includes(name)} onToggle={() => toggle("category", name)} />
              ))}
            </ShowMore>
          </FilterSection>
          {subOptions.length > 0 && (
            <FilterSection title="Subcategory" selected={filters.sub.length}>
              <ShowMore>
                {subOptions.map((sub) => (
                  <Option key={sub} label={sub} count={count("sub", (c) => c.subcategory === sub)} checked={filters.sub.includes(sub)} onToggle={() => toggle("sub", sub)} />
                ))}
              </ShowMore>
            </FilterSection>
          )}
          <FilterSection title="Rating" selected={filters.rating === null ? 0 : 1}>
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
          <FilterSection title="Format" selected={filters.format.length}>
            <Chips options={["Recorded", "Live cohort"].map((v) => ({ label: v, count: count("format", (c) => formatOf(c) === v), checked: filters.format.includes(v), onToggle: () => toggle("format", v) }))} />
          </FilterSection>
          <FilterSection title="Level" selected={filters.level.length}>
            <Chips options={["Beginner", "Intermediate", "Advanced"].map((v) => ({ label: v, count: count("level", (c) => c.level === v), checked: filters.level.includes(v), onToggle: () => toggle("level", v) }))} />
          </FilterSection>
          <FilterSection title="Course length" selected={filters.length.length} defaultOpen={false}>
            {lengthBuckets.map((b) => (
              <Option key={b.label} label={b.label} count={count("length", (c) => b.test(c.hours))} checked={filters.length.includes(b.label)} onToggle={() => toggle("length", b.label)} />
            ))}
          </FilterSection>
          <FilterSection title="Language" selected={filters.language.length} defaultOpen={false}>
            <Chips options={["English", "Arabic"].map((v) => ({ label: v, count: count("language", (c) => languageOf(c) === v), checked: filters.language.includes(v), onToggle: () => toggle("language", v) }))} />
          </FilterSection>
          <FilterSection title="Topics" selected={filters.topics.length} defaultOpen={false}>
            <div className="flex flex-wrap gap-1.5">
              {allTopics.map((t) => {
                const on = filters.topics.includes(t);
                return (
                  <button key={t} type="button" aria-pressed={on} onClick={() => toggle("topics", t)} className={`h-7 rounded-full border px-2.5 text-xs transition ${on ? `border-primary-700 bg-primary-700 text-white ${fontSemi}` : `border-slate-200 text-slate-700 hover:border-slate-400 ${fontMedium}`}`}>
                    {t}
                  </button>
                );
              })}
            </div>
          </FilterSection>
        </div>
      </div>
    </div>
  );

  return (
    <main className="w-full bg-white pt-14">
      <section className="w-full border-b border-slate-200 bg-slate-25 px-4 pt-10 md:px-8">
        <div className="mx-auto flex max-w-310 flex-col gap-3">
          <nav aria-label="Breadcrumb" className={`flex items-center gap-2 text-13 text-slate-500 ${fontRegular}`}>
            <a href="#" className="hover:text-primary-700">
              Home
            </a>
            <span>/</span>
            <button type="button" onClick={() => openSearch({})} className="hover:text-primary-700">
              Courses
            </button>
            {params.category && (
              <>
                <span>/</span>
                {params.sub ? (
                  <button type="button" onClick={() => openSearch({ category: params.category })} className="hover:text-primary-700">
                    {params.category}
                  </button>
                ) : (
                  <span className="text-slate-900">{params.category}</span>
                )}
              </>
            )}
            {(params.sub || params.q) && (
              <>
                <span>/</span>
                <span className="text-slate-900">{params.sub ?? "Search"}</span>
              </>
            )}
          </nav>
          <h1 dir="auto" className={`m-0 text-left text-3xl leading-tight tracking-tight text-slate-800 md:text-4xl ${fontFor(heading, fontHeading, "font-bold")}`} style={{ fontVariationSettings: '"wdth" 100' }}>
            {heading}
          </h1>
          <p className={`text-sm text-slate-600 ${fontRegular}`}>
            {routeScope.length} {routeScope.length === 1 ? "course" : "courses"} taught by expert instructors — learn at your pace or join a live cohort.
          </p>
          <div role="tablist" className="-mb-px mt-4 flex gap-1 overflow-x-auto">
            {["Most Popular", "New", "For Beginner"].map((t) => (
              <button key={t} type="button" role="tab" aria-selected={topTab === t} onClick={() => setTopTab(t)} className={`shrink-0 border-b-2 px-4 pb-3 text-sm transition ${fontMedium} ${topTab === t ? "border-secondary-500 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-900"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-310 flex-col gap-14 px-4 py-10 md:px-8 xl:px-0">
        {routeScope.length < 4 && (
          <p className={`-mb-8 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ${fontRegular}`}>Only a few courses match this search, so here are our most popular courses too.</p>
        )}
        <Carousel key={topTab} items={carousel} />

        <section className="flex flex-col gap-5">
          <h2 dir="auto" className={`m-0 text-left text-22 text-slate-800 md:text-2xl ${fontFor(topicName, fontHeading, "font-bold")}`}>
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
                className={`h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 transition hover:-translate-y-0.5 hover:border-primary-700 hover:text-primary-700 hover:shadow-xl ${fontMedium}`}
              >
                {r}
              </button>
            ))}
          </div>
        </section>

        {featured && (
          <section className="flex flex-col gap-5">
            <h2 dir="auto" className={`m-0 text-left text-22 text-slate-800 md:text-2xl ${fontFor(topicName, fontHeading, "font-bold")}`}>
              Featured {params.sub ?? params.category ?? ""} Course
            </h2>
            <FeaturedCourse course={featured} />
          </section>
        )}

        <section ref={resultsRef} className="flex scroll-mt-24 flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h2 className={`m-0 text-26 text-slate-800 md:text-3xl ${fontHeading}`}>All {params.sub ?? params.category ?? ""} Courses</h2>
            <p className={`text-sm text-slate-600 ${fontRegular}`}>Narrow down with filters to find the course that fits your goals.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-aside-278 lg:gap-12">
            <aside className="hidden lg:block">{sidebar}</aside>
            <div className="flex min-w-0 flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className={`text-15 text-slate-900 ${fontSemi}`}>
                  {results.length} {results.length === 1 ? "course" : "courses"} found
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setDrawer(true)} className={`${buttonClass("secondary", "md")} lg:hidden`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M4 6h16M7 12h10M10 18h4" />
                    </svg>
                    Filters
                    {activeChips.length > 0 && <span className={`rounded-full bg-primary-700 px-1.5 text-11 text-white ${fontSemi}`}>{activeChips.length}</span>}
                  </button>
                  <label className={`flex items-center gap-2 text-sm text-slate-500 ${fontRegular}`}>
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
                    <button key={chip.label} type="button" onClick={chip.clear} className={`flex items-center gap-1.5 rounded-full bg-primary-200 py-1 pl-3 pr-2 text-13 text-primary-700 transition hover:bg-mist-200 ${fontMedium}`}>
                      {chip.label}
                      <span aria-hidden>✕</span>
                      <span className="sr-only">Remove filter</span>
                    </button>
                  ))}
                  <button type="button" onClick={clearAll} className={`px-2 text-13 text-orange-600 underline underline-offset-2 ${fontMedium}`}>
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
                <div className={`flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center ${fontRegular}`}>
                  <span className="text-40">🔍</span>
                  <p className={`text-lg text-slate-900 ${fontSemi}`}>No courses match these filters</p>
                  <p className="text-sm text-slate-500">Try removing a filter or searching for something broader.</p>
                  <button type="button" onClick={clearAll} className={`${buttonClass("primary", "lg")} mt-2`}>
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
                      className={`size-10 rounded-xl text-sm transition ${fontSemi} ${p === page ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-900 hover:border-primary-700"}`}
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
        <div className="fixed inset-0 z-150 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="overlay-fade absolute inset-0 bg-slate-900/50" onClick={() => setDrawer(false)} />
          <div className="drawer-in absolute inset-y-0 right-0 flex w-full max-w-90 flex-col bg-slate-25">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <span className={`text-lg text-slate-900 ${fontHeading}`}>Filters</span>
              <button type="button" onClick={() => setDrawer(false)} aria-label="Close filters" className="flex size-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-150">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{sidebar}</div>
            <div className="border-t border-slate-200 bg-white p-4">
              <button type="button" onClick={() => setDrawer(false)} className={`h-12 w-full rounded-xl bg-secondary-500 text-base text-slate-800 ${fontSemi}`}>
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
        className="fixed bottom-6 right-6 z-90 flex size-11 items-center justify-center rounded-xl bg-secondary-500 text-slate-800 shadow-2xl shadow-secondary-500/60 transition hover:-translate-y-0.5"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 19V5M6 11l6-6 6 6" />
        </svg>
      </button>
    </main>
  );
}
