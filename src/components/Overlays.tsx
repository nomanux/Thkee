import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { categories, categoryColors, courses, experts, infoPages, type Course } from "../data";
import { fontBold, fontFor, fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { ExpertAvatar } from "./Experts";
import { formatPrice, useApp, openLearning } from "../store";
import { buttonClass } from "./Button"

const inputClass = "field";
const primaryBtn = `inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-secondary-500 px-6 text-base text-slate-800 transition hover:bg-secondary-600 disabled:opacity-50 ${fontSemi}`;
const darkBtn = `inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary-700 px-5 text-15 text-white transition hover:bg-primary-800 ${fontSemi}`;
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function Shell({ title, onClose, children, variant = "modal", width = "max-w-130", radius = "sm:rounded-2xl", hideHeader = false, drawerWidth = "max-w-110" }: { title: string; drawerWidth?: string; onClose: () => void; children: ReactNode; variant?: "modal" | "drawer"; width?: string; radius?: string; hideHeader?: boolean }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    const panel = panelRef.current;
    (panel?.querySelector<HTMLElement>("[role=dialog] > div:last-child :is(input:not([type=checkbox]), textarea)") ?? panel?.querySelector<HTMLElement>("button"))?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const drawer = variant === "drawer";
  return (
    <div className="fixed inset-0 z-200 flex items-end justify-center sm:items-center" role="presentation">
      <div className="overlay-fade absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={
          drawer
            ? `drawer-in absolute inset-y-0 right-0 flex w-full ${drawerWidth} flex-col bg-white shadow-2xl`
            : `modal-in relative flex max-h-dvh-92 w-full ${width} flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:mx-4 ${radius}`
        }
      >
        {!hideHeader && (
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
            <h2 className={`text-xl text-slate-900 ${fontHeading}`}>{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="flex size-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-150 hover:text-slate-900">
              <CloseIcon />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function CourseThumb({ course, className = "", showTitle = true }: { course: Course; className?: string; showTitle?: boolean }) {
  const [from, to] = categoryColors(course.category);
  if (course.image) {
    return (
      <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
        {/* Blurred copy fills the frame so banners of any shape show in full without cropping. */}
        <img src={course.image} alt="" aria-hidden loading="lazy" className="absolute inset-0 size-full scale-110 object-cover opacity-80 blur-xl" />
        <img src={course.image} alt={course.title} loading="lazy" className="absolute inset-0 size-full object-contain" />
        {!course.bannerBadges && <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />}
        {course.live && !course.bannerBadges && (
          <span className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-11 uppercase text-white ${fontSemi}`}>
            <span className="size-1.5 animate-pulse rounded-full bg-white" /> Live
          </span>
        )}
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}>
      <div className="absolute -right-6 -top-6 size-27.5 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 left-6 size-22.5 rounded-full bg-white/10" />
      <span className={`absolute left-3 top-3 rounded-full bg-white/20 px-2.5 py-1 text-11 uppercase tracking-wider text-white backdrop-blur ${fontSemi}`}>{course.category}</span>
      {course.live && (
        <span className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-11 uppercase text-white ${fontSemi}`}>
          <span className="size-1.5 animate-pulse rounded-full bg-white" /> Live
        </span>
      )}
      {showTitle && <span dir="auto" className={`absolute bottom-3 left-3 right-3 line-clamp-2 text-left text-17 leading-6 text-white ${fontFor(course.title, fontHeading, "font-bold")}`}>{course.title}</span>}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className={`flex items-center gap-1 text-13 text-slate-800 ${fontSemi}`}>
      <span className="text-secondary-500">★</span>
      {rating.toFixed(1)}
    </span>
  );
}

export function CourseCard({ course }: { course: Course }) {
  const { setOverlay, addToCart, enrolledIds } = useApp();
  const enrolled = enrolledIds.includes(course.id);
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-2xl">
      <button type="button" className="text-left" onClick={() => setOverlay({ type: "course", id: course.id })}>
        <CourseThumb course={course} className="aspect-video" />
      </button>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {course.image && <p dir="auto" className={`line-clamp-2 text-left text-15 leading-normal text-slate-900 ${fontFor(course.title, fontSemi)}`}>{course.title}</p>}
        <p dir="auto" className={`text-left text-13 text-slate-500 ${fontFor(course.instructor, fontRegular, "font-normal")}`}>{course.instructor}</p>
        <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 ${fontRegular}`}>
          <Stars rating={course.rating} />
          <span>{course.students.toLocaleString()} learners</span>
          <span>{course.duration ?? `${course.hours}h`} · {course.level}</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className={`text-17 text-slate-900 ${fontBold}`}>{formatPrice(course.price)}</span>
          {enrolled ? (
            <span className={`rounded-lg bg-primary-200 px-3 py-2 text-13 text-primary-700 ${fontSemi}`}>Enrolled</span>
          ) : (
            <button type="button" onClick={() => addToCart(course)} className={`rounded-lg bg-slate-900 px-3 py-2 text-13 text-white transition hover:bg-primary-700 ${fontSemi}`}>
              Add to cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Catalog({ initial }: { initial: { category?: string; query?: string; liveOnly?: boolean } }) {
  const { setOverlay } = useApp();
  const [query, setQuery] = useState(initial.query ?? "");
  const [category, setCategory] = useState(initial.category ?? "All");
  const [liveOnly, setLiveOnly] = useState(initial.liveOnly ?? false);
  const [level, setLevel] = useState("All levels");
  const [sort, setSort] = useState("Most popular");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = courses.filter(
      (c) =>
        (category === "All" || c.category === category) &&
        (!liveOnly || c.live) &&
        (level === "All levels" || c.level === level) &&
        (!q || `${c.title} ${c.instructor} ${c.category}`.toLowerCase().includes(q)),
    );
    const sorters: Record<string, (a: Course, b: Course) => number> = {
      "Most popular": (a, b) => b.students - a.students,
      "Highest rated": (a, b) => b.rating - a.rating,
      "Price: low to high": (a, b) => a.price - b.price,
      "Price: high to low": (a, b) => b.price - a.price,
    };
    return [...list].sort(sorters[sort]);
  }, [query, category, liveOnly, level, sort]);

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-sm transition ${fontMedium} ${active ? "border-primary-700 bg-primary-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-primary-700"}`;

  return (
    <Shell title="Explore courses" onClose={() => setOverlay(null)} width="max-w-260">
      <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
        <input className={inputClass} placeholder="Search courses, topics or instructors" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search courses" />
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {["All", ...categories.map((c) => c.name)].map((name) => (
            <button key={name} type="button" className={chip(category === name)} onClick={() => setCategory(name)}>
              {name}
            </button>
          ))}
        </div>
        <div className={`flex flex-wrap items-center gap-3 text-sm text-slate-700 ${fontRegular}`}>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={liveOnly} onChange={(e) => setLiveOnly(e.target.checked)} className="size-4 accent-primary-700" />
            Live classes only
          </label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="field w-auto" aria-label="Level">
            {["All levels", "Beginner", "Intermediate", "Advanced"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="field w-auto" aria-label="Sort by">
            {["Most popular", "Highest rated", "Price: low to high", "Price: high to low"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <span className="ml-auto text-slate-500">{results.length} courses</span>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        {results.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        ) : (
          <div className={`py-16 text-center text-slate-500 ${fontRegular}`}>
            <p className={`mb-2 text-lg text-slate-900 ${fontSemi}`}>No courses found</p>
            Try a different search or clear the filters.
          </div>
        )}
      </div>
    </Shell>
  );
}

function CourseDetail({ id }: { id: string }) {
  const { setOverlay, addToCart, enrolledIds, user, notify, openAuth } = useApp();
  const course = courses.find((c) => c.id === id);
  if (!course) return null;
  const enrolled = enrolledIds.includes(course.id);

  return (
    <Shell title="Course details" onClose={() => setOverlay(null)} width="max-w-160">
      <CourseThumb course={course} className="aspect-video" />
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 ${fontRegular}`}>
          <Stars rating={course.rating} />
          <span>{course.students.toLocaleString()} learners</span>
          <span>{course.lessons} lessons · {course.hours} hours</span>
          <span>{course.level}</span>
        </div>
        <p className={`text-sm leading-5.5 text-slate-800 ${fontRegular}`}>{course.description}</p>
        <div>
          <p className={`mb-2 text-base text-slate-900 ${fontSemi}`}>What you'll learn</p>
          <ul className={`flex flex-col gap-2 text-sm text-slate-700 ${fontRegular}`}>
            {course.outcomes.map((o) => (
              <li key={o} className="flex gap-2">
                <span className="text-emerald-500">✓</span>
                {o}
              </li>
            ))}
          </ul>
        </div>
        <p className={`text-sm text-slate-500 ${fontRegular}`}>
          Instructor: <span dir="auto" className={`text-slate-900 ${fontFor(course.instructor, fontSemi)}`}>{course.instructor}</span>
        </p>
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <span className={`text-2xl text-slate-900 ${fontBold}`}>{formatPrice(course.price)}</span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => setOverlay({ type: "catalog" })} className={`${buttonClass("secondary", "lg")}`}>
              ← All courses
            </button>
            {enrolled ? (
              <button type="button" className={primaryBtn} onClick={() => openLearning(course.id)}>
                Continue learning
              </button>
            ) : (
              <button
                type="button"
                className={primaryBtn}
                onClick={() => {
                  if (course.price === 0 && !user) return openAuth();
                  addToCart(course);
                  setOverlay({ type: "cart" });
                }}
              >
                {course.price === 0 ? "Enroll for free" : "Add to cart"}
              </button>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={`text-sm text-slate-700 ${fontMedium}`}>{label}</span>
      {children}
      {error && <span className={`text-13 text-red-500 ${fontRegular}`}>{error}</span>}
    </label>
  );
}

function InstructorApply() {
  const { setOverlay, user } = useApp();
  const [form, setForm] = useState({ name: user?.name ?? "", email: user?.email ?? "", expertise: categories[0].name as string, about: "", agree: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Please enter your full name";
    if (!isEmail(form.email)) next.email = "Please enter a valid email address";
    if (form.about.trim().length < 20) next.about = "Tell us a bit more (at least 20 characters)";
    if (!form.agree) next.agree = "Please accept the instructor terms";
    setErrors(next);
    if (!Object.keys(next).length) setSent(true);
  };

  return (
    <Shell title="Become an Instructor" onClose={() => setOverlay(null)} width="max-w-130">
      {sent ? (
        <div className={`flex flex-col items-center gap-4 px-6 py-14 text-center ${fontRegular}`}>
          <span className="text-5xl">🎓</span>
          <p className={`text-xl text-slate-900 ${fontHeading}`}>Application received!</p>
          <p className="text-slate-600">Thanks, {form.name.split(" ")[0]}. Our team will review your application and email you at {form.email} within 3 business days.</p>
          <button type="button" className={darkBtn} onClick={() => setOverlay(null)}>
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4 p-5 sm:p-6">
          <p className={`text-sm leading-5.5 text-slate-600 ${fontRegular}`}>Share your expertise with thousands of learners. Keep 70% of every sale and host live classes with our studio tools.</p>
          <Field label="Full name" error={errors.name}>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email" error={errors.email}>
            <input className={inputClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Area of expertise">
            <select className={inputClass} value={form.expertise} onChange={(e) => setForm({ ...form, expertise: e.target.value })}>
              {categories.map((c) => (
                <option key={c.name}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Tell us about your teaching experience" error={errors.about}>
            <textarea className={`${inputClass} min-h-27.5 resize-y`} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} />
          </Field>
          <label className={`flex items-start gap-2 text-sm text-slate-700 ${fontRegular}`}>
            <input type="checkbox" className="mt-1 size-4 accent-primary-700" checked={form.agree} onChange={(e) => setForm({ ...form, agree: e.target.checked })} />
            I agree to the instructor terms and content guidelines.
          </label>
          {errors.agree && <span className={`-mt-2 text-13 text-red-500 ${fontRegular}`}>{errors.agree}</span>}
          <button type="submit" className={primaryBtn}>
            Submit application
          </button>
        </form>
      )}
    </Shell>
  );
}

function nextDays(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });
}

const timeSlots = ["10:00 AM", "12:00 PM", "3:00 PM", "6:00 PM", "8:00 PM"];

function BookingModal({ expertId }: { expertId: string }) {
  const { setOverlay, user, bookExpert, bookings, notify, openAuth } = useApp();
  const expert = experts.find((e) => e.id === expertId);
  const days = nextDays(7);
  const [dayIndex, setDayIndex] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  if (!expert) return null;
  const existing = bookings.find((b) => b.expertId === expert.id);
  const dayText = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  // Deterministic "already taken" slots so the demo feels realistic.
  const taken = (di: number, ti: number) => (di * 3 + ti + expert.id.length) % 4 === 0;

  const confirm = () => {
    if (!time) return notify("Choose a time first");
    if (!user) {
      notify("Log in to confirm your booking");
      return openAuth();
    }
    bookExpert({ expertId: expert.id, date: dayText(days[dayIndex]), time });
  };

  return (
    <Shell title="Book a session" onClose={() => setOverlay(null)} width="max-w-140">
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-center gap-3.5">
          <ExpertAvatar expert={expert} size={52} />
          <div className="min-w-0">
            <p dir="auto" className={`truncate text-left text-17 text-slate-900 ${fontFor(expert.name, fontSemi)}`}>{expert.name}</p>
            <p className={`text-13 text-slate-500 ${fontRegular}`}>
              {expert.field} · {expert.minutes} min · {formatPrice(expert.price)}
            </p>
          </div>
        </div>
        <p dir="auto" className={`rounded-xl bg-slate-25 px-4 py-3 text-left text-15 text-slate-900 ${fontFor(expert.headline, fontMedium, "font-medium")}`}>{expert.headline}</p>
        {existing && (
          <p className={`rounded-xl bg-primary-200 px-4 py-3 text-sm text-primary-700 ${fontMedium}`}>
            You already have a session on {existing.date} at {existing.time}. Booking again will reschedule it.
          </p>
        )}
        <div className="flex flex-col gap-2">
          <span className={`text-sm text-slate-700 ${fontSemi}`}>Choose a day</span>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {days.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setDayIndex(i);
                  setTime(null);
                }}
                className={`flex w-16 shrink-0 flex-col items-center rounded-xl border py-2 transition ${dayIndex === i ? "border-primary-700 bg-primary-700 text-white" : "border-slate-200 text-slate-900 hover:border-primary-700"}`}
              >
                <span className={`text-xs uppercase opacity-80 ${fontMedium}`}>{d.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                <span className={`text-xl ${fontBold}`}>{d.getDate()}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className={`text-sm text-slate-700 ${fontSemi}`}>Choose a time</span>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {timeSlots.map((t, ti) => {
              const unavailable = taken(dayIndex, ti);
              return (
                <button
                  key={t}
                  type="button"
                  disabled={unavailable}
                  onClick={() => setTime(t)}
                  className={`rounded-xl border py-2.5 text-sm transition ${fontMedium} ${unavailable ? "cursor-not-allowed border-slate-150 text-slate-300 line-through" : time === t ? "border-primary-700 bg-primary-200 text-primary-700" : "border-slate-200 text-slate-900 hover:border-primary-700"}`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className={`text-sm text-slate-600 ${fontRegular}`}>
            {time ? (
              <>
                <span className={`text-slate-900 ${fontSemi}`}>{dayText(days[dayIndex])}</span> at <span className={`text-slate-900 ${fontSemi}`}>{time}</span>
              </>
            ) : (
              "Pick a day and time"
            )}
          </p>
          <button type="button" className={primaryBtn} onClick={confirm} disabled={!time}>
            Confirm booking · {formatPrice(expert.price)}
          </button>
        </div>
      </div>
    </Shell>
  );
}

function Info({ page }: { page: string }) {
  const { setOverlay } = useApp();
  const info = infoPages[page];
  if (!info) return null;
  return (
    <Shell title={info.title} onClose={() => setOverlay(null)}>
      <div className={`flex flex-col gap-4 p-5 text-sm leading-5.5 text-slate-700 sm:p-6 ${fontRegular}`}>
        {info.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </Shell>
  );
}

function Toasts() {
  const { toasts } = useApp();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-300 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-in pointer-events-auto max-w-120 rounded-xl bg-slate-900 px-5 py-3 text-15 text-white shadow-2xl ${fontMedium}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export default function Overlays() {
  const { overlay } = useApp();
  return (
    <>
      {overlay?.type === "catalog" && <Catalog key={JSON.stringify(overlay)} initial={overlay} />}
      {overlay?.type === "course" && <CourseDetail key={overlay.id} id={overlay.id} />}
      {overlay?.type === "instructor" && <InstructorApply />}
      {overlay?.type === "info" && <Info page={overlay.page} />}
      {overlay?.type === "booking" && <BookingModal key={overlay.expertId} expertId={overlay.expertId} />}
      <Toasts />
    </>
  );
}
