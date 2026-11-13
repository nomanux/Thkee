import { useMemo, useState } from "react";
import { courses, type Course } from "../data";
import { fontBold, fontFor, fontMedium, fontRegular, fontSemi } from "../fonts";
import { formatPrice, useApp } from "../store";
import { CourseThumb } from "./Overlays";
import SectionHeading from "./SectionHeading";

const tabs: { label: string; pick: (list: Course[]) => Course[] }[] = [
  { label: "Trending", pick: (l) => [...l].sort((a, b) => b.students - a.students) },
  { label: "Top rated", pick: (l) => [...l].sort((a, b) => b.rating - a.rating || b.students - a.students) },
  { label: "Newly launched", pick: (l) => [...l].sort((a, b) => (b.launched ?? "2025").localeCompare(a.launched ?? "2025")) },
  { label: "Live cohorts", pick: (l) => l.filter((c) => c.live) },
  { label: "Free", pick: (l) => l.filter((c) => c.price === 0) },
];

export function CourseTile({ course }: { course: Course }) {
  const { setOverlay, addToCart, enrolledIds } = useApp();
  const enrolled = enrolledIds.includes(course.id);
  const isNew = !!course.launched && course.launched >= "2026-09-01";
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1.5 hover:border-primary-700/30 hover:shadow-2xl">
      <button type="button" onClick={() => setOverlay({ type: "course", id: course.id })} className="relative block overflow-hidden text-left" aria-label={`View ${course.title}`}>
        <CourseThumb course={course} showTitle={false} className="aspect-video transition-transform duration-500 group-hover:scale-104" />
        {!course.bannerBadges && <span className={`absolute bottom-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-xs text-slate-900 shadow-sm ${fontSemi}`}>
          {course.live ? "Live cohort" : "Recorded"} · {course.duration ?? `${course.hours}h`}
        </span>}
        {isNew && <span className={`absolute bottom-3 left-3 rounded-full bg-secondary-500 px-2.5 py-1 text-11 uppercase text-slate-800 ${fontSemi}`}>New</span>}
      </button>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className={`text-13 text-primary-700 ${fontMedium}`}>{course.category}</p>
        <button type="button" onClick={() => setOverlay({ type: "course", id: course.id })} dir="auto" className={`line-clamp-2 text-left text-17 leading-normal text-slate-900 transition-colors group-hover:text-primary-700 ${fontFor(course.title, fontSemi)}`}>
          {course.title}
        </button>
        <p dir="auto" className={`text-left text-sm text-slate-500 ${fontFor(course.instructor, fontRegular, "font-normal")}`}>{course.instructor}</p>
        <div className={`flex items-center gap-2 text-13 text-slate-600 ${fontRegular}`}>
          <span className={`flex items-center gap-1 text-slate-900 ${fontSemi}`}>
            <span className="text-secondary-500">★</span>
            {course.rating.toFixed(1)}
          </span>
          <span>({course.students.toLocaleString()} learners)</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-150 pt-4">
          <span className={`text-lg text-slate-900 ${fontBold}`}>{formatPrice(course.price)}</span>
          {enrolled ? (
            <span className={`rounded-xl bg-primary-200 px-3.5 py-2 text-13 text-primary-700 ${fontSemi}`}>Enrolled ✓</span>
          ) : (
            <button type="button" onClick={() => addToCart(course)} className={`rounded-xl bg-slate-900 px-3.5 py-2 text-13 text-white transition hover:bg-primary-700 ${fontSemi}`}>
              Add to cart
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function PopularCourses() {
  const { setOverlay } = useApp();
  const [tab, setTab] = useState(0);
  const shown = useMemo(() => tabs[tab].pick(courses).slice(0, 4), [tab]);

  return (
    <section id="courses" className="w-full scroll-mt-20 bg-white px-4 py-16 md:px-8 xl:py-24">
      <div className="mx-auto flex w-full max-w-330 flex-col gap-8">
        <SectionHeading
          eyebrow="Hand-checked"
          title="Popular courses"
          subtitle="Courses learners are loving right now, picked by our team for quality and real-world value."
          action={
            <button type="button" onClick={() => setOverlay({ type: "catalog" })} className={`group inline-flex shrink-0 items-center gap-2 text-base text-primary-700 ${fontSemi}`}>
              See all courses
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          }
        />
        <div role="tablist" aria-label="Course lists" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {tabs.map((t, i) => (
            <button
              key={t.label}
              type="button"
              role="tab"
              aria-selected={tab === i}
              onClick={() => setTab(i)}
              className={`shrink-0 rounded-full border px-4 py-2.5 text-sm transition ${fontSemi} ${tab === i ? "border-slate-900 bg-slate-900 text-white shadow-xl" : "border-slate-300 bg-white text-slate-900 hover:border-primary-700 hover:text-primary-700"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div key={tab} className="fade-up grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {shown.map((c) => (
            <CourseTile key={c.id} course={c} />
          ))}
        </div>
      </div>
    </section>
  );
}
