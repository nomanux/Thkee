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

function CourseTile({ course }: { course: Course }) {
  const { setOverlay, addToCart, enrolledIds } = useApp();
  const enrolled = enrolledIds.includes(course.id);
  const isNew = !!course.launched && course.launched >= "2026-09-01";
  return (
    <article className="group flex flex-col overflow-hidden rounded-[18px] border border-[#e2e8f0] bg-white transition duration-300 hover:-translate-y-1.5 hover:border-[#0d5c4b]/30 hover:shadow-[0_24px_50px_rgba(15,23,42,0.12)]">
      <button type="button" onClick={() => setOverlay({ type: "course", id: course.id })} className="relative block overflow-hidden text-left" aria-label={`View ${course.title}`}>
        <CourseThumb course={course} showTitle={false} className="aspect-video transition-transform duration-500 group-hover:scale-[1.04]" />
        {!course.bannerBadges && <span className={`absolute bottom-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-[12px] text-[#0f172a] shadow-sm ${fontSemi}`}>
          {course.live ? "Live cohort" : "Recorded"} · {course.duration ?? `${course.hours}h`}
        </span>}
        {isNew && <span className={`absolute bottom-3 left-3 rounded-full bg-[#ffb20d] px-2.5 py-1 text-[11px] uppercase text-[#1e293b] ${fontSemi}`}>New</span>}
      </button>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className={`text-[13px] text-[#0d5c4b] ${fontMedium}`}>{course.category}</p>
        <button type="button" onClick={() => setOverlay({ type: "course", id: course.id })} dir="auto" className={`line-clamp-2 text-left text-[17px] leading-[1.45] text-[#0f172a] transition-colors group-hover:text-[#0d5c4b] ${fontFor(course.title, fontSemi)}`}>
          {course.title}
        </button>
        <p dir="auto" className={`text-left text-[14px] text-[#64748b] ${fontFor(course.instructor, fontRegular, "font-normal")}`}>{course.instructor}</p>
        <div className={`flex items-center gap-2 text-[13px] text-[#475569] ${fontRegular}`}>
          <span className={`flex items-center gap-1 text-[#0f172a] ${fontSemi}`}>
            <span className="text-[#ffb20d]">★</span>
            {course.rating.toFixed(1)}
          </span>
          <span>({course.students.toLocaleString()} learners)</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#f1f5f9] pt-4">
          <span className={`text-[18px] text-[#0f172a] ${fontBold}`}>{formatPrice(course.price)}</span>
          {enrolled ? (
            <span className={`rounded-[10px] bg-[#e7f5f1] px-3.5 py-2 text-[13px] text-[#0d5c4b] ${fontSemi}`}>Enrolled ✓</span>
          ) : (
            <button type="button" onClick={() => addToCart(course)} className={`rounded-[10px] bg-[#0f172a] px-3.5 py-2 text-[13px] text-white transition hover:bg-[#0d5c4b] ${fontSemi}`}>
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
    <section id="courses" className="w-full scroll-mt-[80px] bg-white px-4 py-[64px] md:px-8 xl:py-[96px]">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
        <SectionHeading
          eyebrow="Hand-checked"
          title="Popular courses"
          subtitle="Courses learners are loving right now, picked by our team for quality and real-world value."
          action={
            <button type="button" onClick={() => setOverlay({ type: "catalog" })} className={`group inline-flex shrink-0 items-center gap-2 text-[16px] text-[#0d5c4b] ${fontSemi}`}>
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
              className={`shrink-0 rounded-full border px-4 py-2.5 text-[14px] transition ${fontSemi} ${tab === i ? "border-[#0f172a] bg-[#0f172a] text-white shadow-[0_8px_20px_rgba(15,23,42,0.18)]" : "border-[#cbd5e1] bg-white text-[#0f172a] hover:border-[#0d5c4b] hover:text-[#0d5c4b]"}`}
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
