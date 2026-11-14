import { useEffect, useRef, useState } from "react";
import PageHeader, { pageBody, pageShell } from "./PageHeader";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ArrowTurnBackwardIcon, ArrowUpRight01Icon, Cancel01Icon, Edit02Icon, MoreVerticalIcon, StarIcon } from "@hugeicons/core-free-icons";
import { fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, save } from "../store";
import { buttonClass } from "./Button";
import { ActionMenu, FilterSelect } from "./Menus";

const imgDevon = "/assets/1a400.png";

type Review = { id: string; student: string; photo?: string; color: string; posted: string; rating: number; course: string; overall: number; text: string; likes: number; dislikes: number };

const devon = { student: "Devon Lane", photo: imgDevon, color: "#1e293b", posted: "1 month ago", overall: 4.6, likes: 1, dislikes: 0 };
const REVIEWS: Review[] = [
  { ...devon, id: "r1", rating: 4, course: "Database Management Systems", text: "The instructor explains complex topics in a simple, easy-to-understand way. I felt more confident in Java after taking this course!" },
  { ...devon, id: "r2", rating: 3, course: "Object Oriented Java Programming", text: "Very engaging and knowledgeable. The real-world examples made the lessons much more practical and relatable." },
  { ...devon, id: "r3", rating: 2, course: "Fundamental of Data Structure", text: "Great course structure and delivery! The instructor is patient and ensures every concept is well-explained." },
  { ...devon, id: "r4", rating: 5, course: "Database Management Systems", text: "Excellent course! The instructor breaks down complex subjects into manageable, digestible pieces." },
  { ...devon, id: "r5", rating: 5, student: "Rachel Green", photo: undefined, color: "#7c3aed", course: "Database Management Systems", text: "I enjoyed the interactive teaching approach. The instructor made difficult concepts easier to grasp with practical examples." },
  { ...devon, id: "r6", rating: 4, student: "Marcus Bell", photo: undefined, color: "#0891b2", course: "Object Oriented Java Programming", text: "Clear explanations and useful exercises. I could apply what I learned straight away at work." },
  { ...devon, id: "r7", rating: 1, student: "Priya Nair", photo: undefined, color: "#db2777", course: "Fundamental of Data Structure", text: "The pace was too fast for me, and I needed more examples before the later sections." },
];
const COURSES = [...new Set(REVIEWS.map((r) => r.course))];

type ReviewState = { reply?: string; flagged?: boolean; vote?: "up" | "down" };
const STORE_KEY = "thkee.instructorReviews";
export const unrepliedReviewCount = () => {
  const states = load<Record<string, ReviewState>>(STORE_KEY, {});
  return REVIEWS.filter((r) => !states[r.id]?.reply).length;
};

function Icon({ icon, size = 16, className = "" }: { icon: IconSvgElement; size?: number; className?: string }) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.8} aria-hidden="true" className={`shrink-0 ${className}`} />;
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span role="img" aria-label={`${rating} out of 5 stars`} className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} icon={StarIcon} size={size} className={n <= Math.round(rating) ? "fill-current text-secondary-500" : "text-slate-300"} />
      ))}
    </span>
  );
}

function Avatar({ review }: { review: Review }) {
  if (review.photo) return <img src={review.photo} alt="" className="size-9 shrink-0 rounded-full object-cover" />;
  return (
    <span aria-hidden="true" className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs ${fontSemi}`} style={{ backgroundColor: `${review.color}1a`, color: review.color }}>
      {review.student
        .split(" ")
        .map((p) => p[0])
        .join("")}
    </span>
  );
}

function ReviewRow({ review, state, showCourse, focusReply, onChange }: { review: Review; state: ReviewState; showCourse: boolean; focusReply: boolean; onChange: (next: ReviewState) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const rowRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (!focusReply) return;
    setDraft((d) => d ?? "");
    rowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusReply]);
  const replied = Boolean(state.reply);

  return (
    <li ref={rowRef} className="flex gap-3 px-4 py-5 md:px-6">
      <Avatar review={review} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <div className={`min-w-0 flex-1 text-xs text-slate-400 ${fontRegular}`}>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className={`text-13 text-slate-700 ${fontMedium}`}>{review.student}</span>
              <span>{review.posted}</span>
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <Stars rating={review.rating} />
              {showCourse && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="truncate text-slate-500">{review.course}</span>
                </>
              )}
            </div>
          </div>
          <ActionMenu
            label="Review options"
            triggerClass="flex size-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            trigger={<Icon icon={MoreVerticalIcon} size={18} />}
            items={[{ label: state.flagged ? "Unreport review" : "Report review", onClick: () => onChange({ ...state, flagged: !state.flagged }) }]}
          />
        </div>

        <p className={`mt-2 text-sm leading-relaxed text-slate-800 ${fontRegular}`}>{review.text}</p>
        {state.flagged && <p className={`mt-1 text-xs text-orange-600 ${fontMedium}`}>Reported to Thkee for review</p>}

        {draft !== null ? (
          <form
            className="mt-3 flex flex-col gap-2"
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
              placeholder={review.rating <= 2 ? "Thank them, acknowledge the issue and say what you'll improve…" : "Thank them for the feedback…"}
              className="field min-h-22.5"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDraft(null)} className={buttonClass("ghost", "md")}>
                Cancel
              </button>
              <button type="submit" disabled={!draft.trim()} className={buttonClass("primary", "md")}>
                Post reply
              </button>
            </div>
          </form>
        ) : replied ? (
          <div className="mt-3 border-l-2 border-primary-200 pl-3">
            <p className={`flex items-center gap-2 text-xs text-slate-500 ${fontMedium}`}>
              Your reply
              <button type="button" onClick={() => setDraft(state.reply ?? "")} className="inline-flex items-center gap-1 text-slate-400 transition hover:text-primary-700">
                <Icon icon={Edit02Icon} size={13} />
                Edit
              </button>
            </p>
            <p className={`mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 ${fontRegular}`}>{state.reply}</p>
          </div>
        ) : (
          <button type="button" onClick={() => setDraft("")} className={`-ml-2 mt-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-13 text-primary-700 transition hover:bg-primary-50 ${fontSemi}`}>
            <Icon icon={ArrowTurnBackwardIcon} />
            Reply
          </button>
        )}
      </div>
    </li>
  );
}

export default function InstructorReviews() {
  const [course, setCourse] = useState("all");
  const [period, setPeriod] = useState("30d");
  const [sort, setSort] = useState("newest");
  const [stars, setStars] = useState(0);
  const [needsReply, setNeedsReply] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; at: number } | null>(null);
  const [states, setStates] = useState<Record<string, ReviewState>>(() => load(STORE_KEY, {}));

  useEffect(() => save(STORE_KEY, states), [states]);

  const allCourses = course === "all";
  const inCourse = allCourses ? REVIEWS : REVIEWS.filter((r) => r.course === course);
  const average = inCourse.length ? inCourse.reduce((sum, r) => sum + r.rating, 0) / inCourse.length : 0;
  const unreplied = inCourse.filter((r) => !states[r.id]?.reply).length;
  // Who is waiting, lowest rating first: that is the order an instructor should answer in.
  const waiting = inCourse.filter((r) => !states[r.id]?.reply).sort((a, b) => a.rating - b.rating);
  const first = waiting[0];
  const waitingPeople = [...new Map(waiting.map((r) => [r.student, r])).values()];
  const filtered = inCourse.filter((r) => (stars === 0 || r.rating === stars) && (!needsReply || !states[r.id]?.reply));
  const visible = sort === "newest" ? filtered : [...filtered].sort((a, b) => (sort === "high" ? b.rating - a.rating : a.rating - b.rating));
  const maxCount = Math.max(1, ...[1, 2, 3, 4, 5].map((n) => inCourse.filter((r) => r.rating === n).length));

  const resetFilters = () => {
    setStars(0);
    setNeedsReply(false);
  };

  return (
    <main className={pageShell}>
      <div className={pageBody}>
        <PageHeader title="Reviews" description="See how learners rate your courses and reply to their feedback.">
            <FilterSelect
              label="Course"
              value={course}
              onChange={(v) => {
                setCourse(v);
                resetFilters();
              }}
              options={[{ value: "all", label: "All courses" }, ...COURSES.map((c) => ({ value: c, label: c }))]}
            />
            <FilterSelect
              label="Period"
              alignRight
              value={period}
              onChange={setPeriod}
              options={[
                { value: "7d", label: "Last 7 days" },
                { value: "30d", label: "Last 30 days" },
                { value: "all", label: "All time" },
              ]}
            />
        </PageHeader>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* How am I doing: score and distribution belong together */}
          <section aria-label="Rating summary" className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:gap-8 md:p-6 lg:col-span-3">
            <div className="flex shrink-0 flex-col items-start sm:w-36">
              <span className={`text-xs uppercase tracking-wider text-slate-400 ${fontSemi}`}>Average rating</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className={`text-5xl leading-none tracking-tight text-slate-900 ${fontHeading}`}>{average.toFixed(1)}</span>
                <span className={`text-sm text-slate-400 ${fontRegular}`}>/5</span>
              </div>
              <div className="mt-2.5">
                <Stars rating={average} size={16} />
              </div>
              <p className={`mt-2 text-13 text-slate-500 ${fontRegular}`}>Based on {inCourse.length} reviews</p>
              <span className={`mt-3 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700 ${fontMedium}`}>
                <Icon icon={ArrowUpRight01Icon} size={13} />
                +20% this month
              </span>
            </div>

            <span aria-hidden="true" className="hidden h-36 w-px bg-slate-100 sm:block" />

            {/* Each row filters the list below */}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = inCourse.filter((r) => r.rating === n).length;
                const pct = inCourse.length ? Math.round((count / inCourse.length) * 100) : 0;
                const active = stars === n;
                const dim = stars > 0 && !active;
                return (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={active}
                    aria-label={`Show ${n}-star reviews (${count})`}
                    onClick={() => setStars(active ? 0 : n)}
                    className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-13 transition ${active ? "bg-secondary-50" : "hover:bg-slate-50"} ${dim ? "opacity-50" : ""} ${fontRegular}`}
                  >
                    <span className={`flex w-8 shrink-0 items-center gap-1 tabular-nums text-slate-600 ${fontMedium}`}>
                      {n}
                      <Icon icon={StarIcon} size={12} className="fill-current text-secondary-500" />
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <span className="block h-full rounded-full bg-secondary-500 transition-all duration-500" style={{ width: `${(count / maxCount) * 100}%` }} />
                    </span>
                    <span className="w-16 shrink-0 text-end tabular-nums">
                      <span className={`text-slate-700 ${fontMedium}`}>{pct}%</span>
                      <span className="text-slate-400"> · {count}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* What needs my attention: the one callout on the page, so it earns a tinted card */}
          <section aria-label="Reviews waiting for a reply" className="bg-payout-pattern relative flex flex-col overflow-hidden rounded-2xl bg-primary-900 p-5 text-white md:p-6 lg:col-span-2">
            <img src="/illustrations/live-chat-line.svg" alt="" aria-hidden="true" className="pointer-events-none absolute -right-10 -top-8 size-44 opacity-50" />

            {first ? (
              <>
                <div className="relative flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {waitingPeople.slice(0, 3).map((r) => (
                      <span key={r.student} className="rounded-full bg-white ring-2 ring-primary-900">
                        <Avatar review={r} />
                      </span>
                    ))}
                  </div>
                  <p className={`text-13 text-primary-300 ${fontRegular}`}>
                    {waitingPeople
                      .slice(0, 2)
                      .map((r) => r.student.split(" ")[0])
                      .join(", ")}
                    {waitingPeople.length > 2 ? ` and ${waitingPeople.length - 2} more` : ""}
                  </p>
                </div>

                <h2 className={`relative mt-4 text-xl leading-snug text-white ${fontHeading}`}>
                  {waiting.length} {waiting.length === 1 ? "review is" : "reviews are"} waiting for your reply
                </h2>

                {/* The one to answer first, so the instructor can start without hunting */}
                <figure className="relative m-0 mt-4 border-l-2 border-primary-400 pl-3">
                  <blockquote className={`m-0 line-clamp-2 text-13 leading-relaxed text-primary-100 ${fontRegular}`}>{first.text}</blockquote>
                  <figcaption className={`mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-primary-300 ${fontRegular}`}>
                    <span className={`text-white ${fontMedium}`}>{first.student}</span>
                    <Stars rating={first.rating} size={11} />
                  </figcaption>
                </figure>

                <div className="relative mt-auto flex flex-wrap items-center gap-4 pt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setStars(0);
                      setNeedsReply(true);
                      setSort("low");
                      setReplyTo({ id: first.id, at: Date.now() });
                    }}
                    className={`inline-flex h-9 items-center rounded-lg bg-white px-4 text-sm text-primary-800 transition hover:bg-primary-50 ${fontSemi}`}
                  >
                    Reply to {first.student.split(" ")[0]}
                  </button>
                  {waiting.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setStars(0);
                        setNeedsReply(true);
                        setSort("low");
                      }}
                      className={`text-13 text-primary-200 underline-offset-4 transition hover:text-white hover:underline ${fontSemi}`}
                    >
                      See all {waiting.length}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="relative my-auto">
                <h2 className={`text-xl leading-snug text-white ${fontHeading}`}>You're all caught up</h2>
                <p className={`mt-1.5 max-w-64 text-13 leading-relaxed text-primary-300 ${fontRegular}`}>Every review has a reply. New ones will show up here.</p>
              </div>
            )}
          </section>
        </div>

        {/* List */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div role="tablist" aria-label="Which reviews" className="flex gap-1.5">
              {[
                { on: false, label: "All", count: inCourse.length },
                { on: true, label: "Needs reply", count: unreplied },
              ].map((t) => {
                const active = needsReply === t.on;
                return (
                  <button
                    key={t.label}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setNeedsReply(t.on)}
                    className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-13 transition ${
                      active ? `bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200 ${fontSemi}` : `text-slate-500 hover:bg-slate-100 hover:text-slate-700 ${fontMedium}`
                    }`}
                  >
                    {t.label}
                    <span className="tabular-nums opacity-70">{t.count}</span>
                  </button>
                );
              })}
            </div>
            {stars > 0 && (
              <button type="button" onClick={() => setStars(0)} className={`flex h-8 items-center gap-1 rounded-full bg-secondary-50 px-3 text-13 text-slate-700 ring-1 ring-inset ring-secondary-200 transition hover:bg-secondary-100 ${fontMedium}`}>
                {stars} star only
                <Icon icon={Cancel01Icon} size={13} className="text-slate-500" />
              </button>
            )}
            <div className="ml-auto">
              <FilterSelect
                label="Sort"
                alignRight
                value={sort}
                onChange={setSort}
                options={[
                  { value: "newest", label: "Newest" },
                  { value: "low", label: "Lowest rated" },
                  { value: "high", label: "Highest rated" },
                ]}
              />
            </div>
          </div>

          {visible.length > 0 ? (
            <ul className="m-0 list-none divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0">
              {visible.map((review) => (
                <ReviewRow key={review.id} review={review} state={states[review.id] ?? {}} showCourse={allCourses} focusReply={replyTo?.id === review.id} onChange={(next) => setStates((s) => ({ ...s, [review.id]: next }))} />
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
              <p className={`text-15 text-slate-800 ${fontSemi}`}>{needsReply ? "You've replied to every review" : "No reviews match"}</p>
              <p className={`text-sm text-slate-500 ${fontRegular}`}>{needsReply ? "New reviews that need a reply will show up here." : "Try another rating or course."}</p>
              <button type="button" onClick={resetFilters} className={`mt-1 ${buttonClass("secondary", "md")}`}>
                Show all reviews
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
