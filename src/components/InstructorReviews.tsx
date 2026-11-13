import { useEffect, useState } from "react";
import { fontBold, fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, save, useApp } from "../store";
import { ActionMenu, FilterSelect } from "./Menus";

const imgChevronLarge = "/assets/933a3.svg";
const imgDevon = "/assets/1a400.png";

type Review = { id: string; student: string; photo?: string; color: string; posted: string; rating: number; course: string; overall: number; text: string; likes: number; dislikes: number };

const devon = { student: "Devon Lane", photo: imgDevon, color: "#1e293b", posted: "Posted 1 month ago", overall: 4.6, likes: 1, dislikes: 0 };
const REVIEWS: Review[] = [
  { ...devon, id: "r1", rating: 4, course: "Database Management Systems", text: "“The instructor explains complex topics in a simple, easy-to-understand way. I felt more confident in Java after taking this course!”" },
  { ...devon, id: "r2", rating: 3, course: "Object Oriented Java Programming", text: "\"Very engaging and knowledgeable. The real-world examples made the lessons much more practical and relatable.\"" },
  { ...devon, id: "r3", rating: 2, course: "Fundamental of Data Structure", text: "\"Great course structure and delivery! The instructor is patient and ensures every concept is well-explained.\"" },
  { ...devon, id: "r4", rating: 5, course: "Database Management Systems", text: "\"Excellent course! The instructor breaks down complex subjects into manageable, digestible pieces.\"" },
  { ...devon, id: "r5", rating: 5, student: "Rachel Green", photo: undefined, color: "#7c3aed", course: "Database Management Systems", text: "\"I enjoyed the interactive teaching approach. The instructor made difficult concepts easier to grasp with practical examples.\"" },
  { ...devon, id: "r6", rating: 4, student: "Marcus Bell", photo: undefined, color: "#0891b2", course: "Object Oriented Java Programming", text: "\"Clear explanations and useful exercises. I could apply what I learned straight away at work.\"" },
  { ...devon, id: "r7", rating: 1, student: "Priya Nair", photo: undefined, color: "#db2777", course: "Fundamental of Data Structure", text: "\"The pace was too fast for me, and I needed more examples before the later sections.\"" },
];
const COURSES = [...new Set(REVIEWS.map((r) => r.course))];

type ReviewState = { reply?: string; flagged?: boolean; vote?: "up" | "down" };
const STORE_KEY = "thkee.instructorReviews";
export const unrepliedReviewCount = () => {
  const states = load<Record<string, ReviewState>>(STORE_KEY, {});
  return REVIEWS.filter((r) => !states[r.id]?.reply).length;
};

function Stars({ rating, size = "size-5" }: { rating: number; size?: string }) {
  return (
    <span role="img" aria-label={`${rating} out of 5 stars`} className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 24 24" className={size} fill={n <= Math.round(rating) ? "#faa104" : "none"} stroke="#faa104" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9l-5.4 2.9 1.1-6.1-4.5-4.3 6.1-.8L12 3z" />
        </svg>
      ))}
    </span>
  );
}

function Icon({ path, className = "size-4.5", filled }: { path: string; className?: string; filled?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ?? "none"} stroke={filled ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

const THUMB_UP = "M7 10v11H4V10h3zm0 0l4-7a2.5 2.5 0 012.5 2.5V9h5a2 2 0 012 2.3l-1.2 7A2 2 0 0117.3 20H7";
const THUMB_DOWN = "M17 14V3h3v11h-3zm0 0l-4 7a2.5 2.5 0 01-2.5-2.5V15h-5a2 2 0 01-2-2.3l1.2-7A2 2 0 016.7 4H17";
const FLAG = "M5 21V4h13l-2.5 4.5L18 13H5";

function ReviewCard({ review, state, showCourse, onChange }: { review: Review; state: ReviewState; showCourse: boolean; onChange: (next: ReviewState) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const ghost = `flex items-center gap-2 text-sm leading-5 text-slate-500 transition hover:text-slate-700 ${fontMedium}`;
  const count = `text-sm leading-5 text-slate-500 ${fontRegular}`;

  return (
    <article className="flex flex-col gap-3 rounded-xl bg-white px-6 py-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {review.photo ? (
            <img src={review.photo} alt="" className="size-8 shrink-0 rounded-full object-cover" />
          ) : (
            <span aria-hidden="true" className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs text-white ${fontBold}`} style={{ backgroundColor: review.color }}>
              {review.student
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </span>
          )}
          <p className="flex flex-wrap items-center gap-0.75">
            <span className={`text-xs leading-4.5 text-slate-600 ${fontSemi}`}>{review.student}</span>
            <span aria-hidden="true" className={`text-10 leading-relaxed text-slate-400 ${fontRegular}`}>
              •
            </span>
            <span className={`text-10 leading-relaxed text-slate-400 ${fontRegular}`}>{review.posted}</span>
          </p>
        </div>
        <div className="flex items-center gap-5">
          <button type="button" onClick={() => setDraft(state.reply ?? "")} className={ghost}>
            <Icon path={state.reply ? "M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19l-4 1z" : "M9 7L4 12l5 5M4 12h11a5 5 0 015 5v1"} />
            {state.reply ? "Edit Reply" : "Reply"}
          </button>
          <button type="button" aria-label={state.flagged ? "Remove flag" : "Flag review"} aria-pressed={Boolean(state.flagged)} onClick={() => onChange({ ...state, flagged: !state.flagged })} className="flex items-center gap-1.5 text-slate-400 transition hover:text-slate-500">
            <span className={count}>0</span>
            <Icon path={FLAG} filled={state.flagged ? "#ea580c" : undefined} />
          </button>
          <div className="flex items-center gap-2 rounded-md bg-slate-25 px-2 py-1.5 text-slate-400">
            <button type="button" aria-label="Like review" aria-pressed={state.vote === "up"} onClick={() => onChange({ ...state, vote: state.vote === "up" ? undefined : "up" })} className={`flex items-center gap-1.5 transition hover:text-slate-600 ${state.vote === "up" ? "text-slate-700" : ""}`}>
              <span className={count}>{review.likes + (state.vote === "up" ? 1 : 0)}</span>
              <Icon path={THUMB_UP} />
            </button>
            <button type="button" aria-label="Dislike review" aria-pressed={state.vote === "down"} onClick={() => onChange({ ...state, vote: state.vote === "down" ? undefined : "down" })} className={`flex items-center gap-1.5 transition hover:text-slate-600 ${state.vote === "down" ? "text-slate-700" : ""}`}>
              <span className={count}>{review.dislikes + (state.vote === "down" ? 1 : 0)}</span>
              <Icon path={THUMB_DOWN} />
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className={`text-xl leading-7 text-slate-400 ${fontRegular}`}>
          <span className={`text-2xl text-slate-600 ${fontBold}`}>{review.rating}</span>/5
        </p>
        <Stars rating={review.rating} />
      </div>
      {showCourse && (
        <p className={`text-xs leading-4.5 text-slate-500 ${fontRegular}`}>
          <span className="mr-2 italic underline font-synthesis-style">{review.course}</span>
          (Overall : <span className={`text-slate-600 ${fontSemi}`}>{review.overall}</span>)
        </p>
      )}
      <p className={`text-base italic leading-7 text-slate-800 font-synthesis-style ${fontRegular}`}>{review.text}</p>
      {draft !== null ? (
        <form
          className="flex flex-wrap gap-4 md:flex-nowrap"
          onSubmit={(e) => {
            e.preventDefault();
            onChange({ ...state, reply: draft.trim() || undefined });
            setDraft(null);
          }}
        >
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            aria-label={`Reply to ${review.student}`}
            placeholder="Write your reply in here..."
            className="field min-h-22.5 min-w-0 flex-1"
          />
          <div className="flex shrink-0 gap-3 md:flex-col">
            <button type="submit" className={`flex h-9.5 w-22.5 items-center justify-center rounded-lg bg-secondary-500 text-sm leading-5 text-slate-800 transition hover:bg-secondary-600 ${fontMedium}`}>
              Post
            </button>
            <button type="button" onClick={() => setDraft(null)} className={`flex h-9.5 w-22.5 items-center justify-center rounded-lg bg-slate-150 text-sm leading-5 text-slate-700 transition hover:bg-slate-200 ${fontMedium}`}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        state.reply && <p className={`whitespace-pre-wrap rounded-r-sm border-l-2 border-slate-300 bg-slate-150 px-4 py-2 text-sm leading-5 text-slate-600 ${fontRegular}`}>{state.reply}</p>
      )}
    </article>
  );
}

export default function InstructorReviews() {
  const { notify } = useApp();
  const [course, setCourse] = useState("all");
  const [period, setPeriod] = useState("7d");
  const [sort, setSort] = useState("most");
  const [stars, setStars] = useState(0);
  const [states, setStates] = useState<Record<string, ReviewState>>(() => load(STORE_KEY, {}));

  useEffect(() => save(STORE_KEY, states), [states]);

  const allCourses = course === "all";
  const inCourse = allCourses ? REVIEWS : REVIEWS.filter((r) => r.course === course);
  const average = inCourse.reduce((sum, r) => sum + r.rating, 0) / inCourse.length;
  const filtered = inCourse.filter((r) => stars === 0 || r.rating === stars);
  const visible = sort === "most" ? filtered : [...filtered].sort((a, b) => (sort === "high" ? b.rating - a.rating : a.rating - b.rating));

  const segment = (value: number, label: string, n: number) => {
    const active = stars === value;
    return (
      <button key={value} type="button" aria-pressed={active} onClick={() => setStars(value)} className={`-ml-px h-9 whitespace-nowrap border px-3 text-sm leading-5 transition first:ml-0 first:rounded-l-lg last:rounded-r-lg ${active ? "relative z-10 border-secondary-500 bg-secondary-50 text-secondary-600" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-25"} ${fontMedium}`}>
        {label}
        {value > 0 && n > 0 ? ` ( ${n} )` : ""}
      </button>
    );
  };

  return (
    <main className="flex flex-1 flex-col bg-slate-150">
      <div className="bg-white px-4 py-6 md:px-7">
        <h1 className="m-0 flex h-10.5 items-center font-instrument-medium text-2xl font-medium leading-8 text-slate-900" style={{ fontVariationSettings: '"wdth" 100' }}>
          Reviews Overview
        </h1>
      </div>
      <div className="flex flex-col gap-5 px-4 py-5 md:pl-8 md:pr-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ActionMenu
            label={`Course: ${allCourses ? "All Courses" : course}`}
            alignLeft
            triggerClass={`flex items-center gap-3 text-left text-xl leading-8 text-slate-900 ${fontHeading}`}
            trigger={
              <>
                {allCourses ? "All Courses" : course}
                <img src={imgChevronLarge} alt="" width={24} height={24} className="size-6 shrink-0" />
              </>
            }
            items={[
              {
                label: "All Courses",
                onClick: () => {
                  setCourse("all");
                  setStars(0);
                },
              },
              ...COURSES.map((name) => ({
                label: name,
                onClick: () => {
                  setCourse(name);
                  setStars(0);
                },
              })),
            ]}
          />
          <div className="flex flex-wrap gap-2.5">
            <div className="w-38.75">
              <FilterSelect
                plain
                alignRight
                label="Period"
                value={period}
                onChange={setPeriod}
                options={[
                  { value: "7d", label: "Last 7 Days" },
                  { value: "30d", label: "Last 30 Days" },
                  { value: "all", label: "All time" },
                ]}
              />
            </div>
            <div className="w-38.75">
              <FilterSelect
                plain
                alignRight
                label="Sort"
                value={sort}
                onChange={setSort}
                options={[
                  { value: "most", label: "Most Reviews" },
                  { value: "high", label: "Highest Rated" },
                  { value: "low", label: "Lowest Rated" },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-lg bg-white px-6 py-6">
          <div>
            <div className="flex items-center gap-3">
              <span className={`text-2xl leading-8 text-slate-700 ${fontHeading}`}>{average.toFixed(1)}</span>
              <Stars rating={average} size="size-4" />
            </div>
            <p className={`mt-1 text-sm leading-6 text-slate-500 ${fontRegular}`}>{allCourses ? "Average rating of all courses" : "Average rating of this course"}</p>
          </div>
          <span aria-hidden="true" className="hidden h-15 w-px bg-slate-200 sm:block" />
          <div>
            <p className={`text-base leading-8 ${allCourses ? "text-slate-400" : "text-slate-800"} ${fontRegular}`}>
              <span className={`text-2xl ${allCourses ? "text-slate-700" : "text-slate-800"} ${fontHeading}`}>{inCourse.length}</span> reviews total
            </p>
            <button type="button" onClick={() => notify("Review growth details are coming soon")} className={`mt-1 text-sm leading-6 text-slate-400 underline transition hover:text-slate-500 ${fontRegular}`}>
              20% Growth in reviews this month.
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={`text-sm leading-5 text-slate-600 ${fontRegular}`}>
            Showing {visible.length} reviews from student
          </p>
          <div className="flex max-w-full overflow-x-auto">
            {segment(0, "All Reviews", inCourse.length)}
            {[5, 4, 3, 2, 1].map((n) => segment(n, n === 1 ? "1 Stars" : `${n} Stars`, inCourse.filter((r) => r.rating === n).length))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {visible.map((review) => (
            <ReviewCard key={review.id} review={review} state={states[review.id] ?? {}} showCourse={allCourses} onChange={(next) => setStates((s) => ({ ...s, [review.id]: next }))} />
          ))}
          {visible.length === 0 && <p className={`rounded-xl bg-white px-6 py-12 text-center text-sm text-slate-500 ${fontRegular}`}>No reviews with this rating yet.</p>}
        </div>
      </div>
    </main>
  );
}
