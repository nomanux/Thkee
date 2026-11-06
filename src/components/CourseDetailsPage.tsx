import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { categoryColors, courses, courseTags, type Course } from "../data";
import { fontBold, fontFor, fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { formatPrice, openLearning, useApp } from "../store";
import { CourseThumb } from "./Overlays";

/* ---------- Dummy content generated from each course ---------- */

const arabic = /[؀-ۿ]/;

const curriculumTemplate: { title: string; lessons: string[] }[] = [
  { title: "Introduction and setup", lessons: ["Welcome to the course", "How this course works", "Set up your tools", "Meet your learning community", "Your first quick win", "Course resources"] },
  { title: "Core concepts", lessons: ["The key ideas explained", "Common terms you need", "How the pieces fit together", "Mistakes beginners make", "Quick check quiz", "Section summary"] },
  { title: "Hands-on practice", lessons: ["Guided exercise 1", "Guided exercise 2", "Working with real examples", "Fixing common problems", "Practice challenge", "Challenge walkthrough"] },
  { title: "Going deeper", lessons: ["Advanced techniques", "Working faster with shortcuts", "Case study from the field", "Tips from industry experts", "Quiz: test yourself", "Section summary"] },
  { title: "Real-world project", lessons: ["Plan your project", "Build the first part", "Build the second part", "Review and improve", "Present your work", "Project feedback"] },
  { title: "Career and next steps", lessons: ["Add this skill to your CV", "Build your portfolio", "Keep learning after the course", "Final quiz", "Course wrap-up", "Get your certificate"] },
];

export type Lesson = { title: string; minutes: number; preview: boolean; kind: "video" | "article" | "quiz" | "assignment" };
export type Section = { title: string; lessons: Lesson[] };

export function buildCurriculum(course: Course): Section[] {
  const count = Math.min(curriculumTemplate.length, Math.max(3, Math.ceil(course.lessons / 6)));
  const totalMinutes = course.hours * 60;
  let left = course.lessons;
  return curriculumTemplate.slice(0, count).map((section, i) => {
    const n = Math.max(1, Math.min(section.lessons.length, Math.ceil(left / (count - i))));
    left -= n;
    return {
      title: `${i + 1}. ${section.title}`,
      lessons: section.lessons.slice(0, n).map((title, j) => ({
        title,
        kind: /quiz/i.test(title) ? "quiz" : /challenge|present your work|build your portfolio/i.test(title) ? "assignment" : j % 4 === 3 ? "article" : "video",
        minutes: Math.max(3, Math.round(totalMinutes / course.lessons) + ((i + j) % 5) - 2),
        preview: i === 0 && j < 2,
      })),
    };
  });
}

const extraObjectives = [
  "Downloadable exercise files",
  "Build a real project from beginning to end",
  "Learn the tools and methods professionals use",
  "Practise with a quiz after each section",
  "Ask the instructor in the Q&A section",
  "Earn a certificate you can share on LinkedIn",
  "Work at your own pace on any device",
];

export type Review = { name: string; when: string; rating: number; title: string; body: string };

export const seedReviews: Review[] = [
  { name: "Oscar Cafeo", when: "3 weeks ago", rating: 5, title: "Beautiful course", body: "This course was well organised and covered a lot more detail than other courses I tried. I enjoyed it. One suggestion: add a final project we build together from start to end." },
  { name: "Alex Morgan", when: "1 month ago", rating: 5, title: "Clear and practical", body: "The lessons are short and to the point. The exercises helped me use the skills at work in the first week. I would like more examples in the later sections." },
  { name: "Reem Al-Dosari", when: "2 months ago", rating: 4, title: "Great for beginners", body: "I started with zero knowledge and finished with a small project I am proud of. The instructor explains every step in simple words, and each section builds on the one before it, so I never felt lost. The quizzes showed me what I needed to review, and the practice challenges made me use the skills instead of only watching. I now use what I learned every week at work, and I have already recommended this course to two of my colleagues." },
  { name: "Khalid Nasser", when: "3 months ago", rating: 5, title: "Worth the price", body: "Good structure, real examples and fast answers in the Q&A section. I recommend it to my team." },
];

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const formatDate = (iso?: string) => new Date(`${iso ?? "2026-06-03"}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const initials = (name: string) =>
  name
    .replace(/^(د\.|Dr\.)\s*/, "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

/* ---------- Small UI pieces ---------- */

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - i + 1));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <svg viewBox="0 0 24 24" width={size} height={size} className="absolute inset-0 text-[#cbd5e1]" fill="currentColor" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
            </svg>
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <svg viewBox="0 0 24 24" width={size} height={size} className="text-[#ffb20d]" fill="currentColor" aria-hidden="true">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
              </svg>
            </span>
          </span>
        );
      })}
    </span>
  );
}

function Icon({ name, className = "size-[18px]" }: { name: string; className?: string }) {
  const paths: Record<string, ReactNode> = {
    video: (
      <>
        <rect x="2" y="5" width="15" height="14" rx="2" />
        <path d="M17 10l5-3v10l-5-3z" />
      </>
    ),
    article: (
      <>
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6M8 13h8M8 17h5" />
      </>
    ),
    download: <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />,
    mobile: (
      <>
        <rect x="6" y="2" width="12" height="20" rx="2" />
        <path d="M11 18h2" />
      </>
    ),
    infinity: <path d="M18.2 8.2a4 4 0 1 1 0 7.6c-2.4-.6-4-3.8-6.2-3.8s-3.8 3.2-6.2 3.8a4 4 0 1 1 0-7.6c2.4.6 4 3.8 6.2 3.8s3.8-3.2 6.2-3.8z" />,
    award: (
      <>
        <circle cx="12" cy="9" r="6" />
        <path d="M8.5 14L7 22l5-3 5 3-1.5-8" />
      </>
    ),
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </>
    ),
    cc: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M10 10.5a2 2 0 1 0 0 3M16 10.5a2 2 0 1 0 0 3" />
      </>
    ),
    check: <path d="M5 12l5 5L20 7" />,
    chevron: <path d="M6 9l6 6 6-6" />,
    quiz: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5h.01" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="4" />
        <path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3" />
      </>
    ),
    play: <path d="M8 5v14l11-7z" fill="currentColor" stroke="none" />,
    heart: <path d="M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4 7.2 4c2 0 3.6 1 4.8 2.6C13.2 5 14.8 4 16.8 4 20.6 4 23 8 21.5 11.7 19.5 16.4 12 21 12 21z" />,
  };
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function Card({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-[96px] rounded-[16px] border border-[#e2e8f0] bg-white p-5 md:p-8">
      <h2 className={`mb-5 text-[22px] leading-[1.3] text-[#0f172a] ${fontHeading}`}>{title}</h2>
      {children}
    </section>
  );
}

function SeeMore({ open, onClick, more = "See more", less = "See less" }: { open: boolean; onClick: () => void; more?: string; less?: string }) {
  return (
    <button type="button" onClick={onClick} className={`mt-5 inline-flex items-center gap-1.5 text-[15px] text-[#0f172a] transition hover:text-[#0d5c4b] ${fontSemi}`}>
      {open ? less : more}
      <Icon name="chevron" className={`size-[16px] transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
  );
}

/* ---------- Page ---------- */

export default function CourseDetailsPage({ id }: { id: string }) {
  const course = courses.find((c) => c.id === id);
  if (!course) return <NotFound />;
  return <Details course={course} />;
}

function NotFound() {
  const { openSearch } = useApp();
  return (
    <main className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-4 bg-[#f8fafc] px-4 pt-[72px] text-center">
      <p className={`text-[24px] text-[#0f172a] ${fontHeading}`}>Course not found</p>
      <p className={`text-[14px] text-[#64748b] ${fontRegular}`}>This course does not exist or was removed.</p>
      <button type="button" onClick={() => openSearch({})} className={`h-[48px] rounded-[10px] bg-[#ffb20d] px-7 text-[16px] text-[#1e293b] transition hover:bg-[#faa104] ${fontSemi}`}>
        Browse all courses
      </button>
    </main>
  );
}

function Details({ course }: { course: Course }) {
  const { openSearch, addToCart, setOverlay, enrolledIds, cart, notify, wishlistIds, toggleWishlist: toggleSaved } = useApp();
  const enrolled = enrolledIds.includes(course.id);
  const inCart = cart.some((c) => c.id === course.id);
  const tags = courseTags[course.id] ?? [course.subcategory];
  const language = arabic.test(course.title) ? "Arabic" : "English";
  const ratingsCount = Math.round(course.students * 0.23);
  const discount = course.originalPrice && course.originalPrice > course.price ? Math.round((1 - course.price / course.originalPrice) * 100) : 0;
  const bestSeller = course.students >= 2500;
  const highestRated = course.rating >= 4.8;

  const saved = wishlistIds.includes(course.id);
  const toggleWishlist = () => toggleSaved(course.id);

  useEffect(() => {
    document.title = `${course.title} | Thkee`;
    return () => {
      document.title = "Thkee";
    };
  }, [course.title]);

  const buyNow = () => {
    if (!inCart) addToCart(course);
    setOverlay({ type: "cart" });
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify("Course link copied");
    } catch {
      notify("Copy this link: " + window.location.href);
    }
  };

  return (
    <main className="w-full bg-[#f8fafc] pb-20 pt-[80px]">
      <div className="mx-auto grid max-w-[1392px] grid-cols-1 px-3 md:px-6 lg:grid-cols-[384px_minmax(0,1fr)] lg:gap-x-8 xl:grid-cols-[424px_minmax(0,1fr)] xl:gap-x-[46px] 2xl:px-0">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-[20px] bg-[linear-gradient(120deg,#0b1220_0%,#0f172a_55%,#13213a_100%)] px-5 pb-8 pt-6 md:px-8 lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:min-h-[454px] lg:pb-8 lg:pl-[416px] lg:pr-8 lg:pt-[105px] xl:pl-[470px] xl:pr-[34px]">
          {[
            "right-[120px] xl:right-[132px] opacity-[0.07]",
            "right-[-60px] xl:right-[-50px] opacity-[0.045]",
          ].map((pos) => (
            <svg key={pos} aria-hidden="true" viewBox="0 0 321 454" preserveAspectRatio="none" className={`pointer-events-none absolute inset-y-0 hidden h-full w-[321px] md:block ${pos}`}>
              <path d="M321 0H150L0 227l150 227h171L171 227z" fill="url(#chevron-fade)" />
              <defs>
                <linearGradient id="chevron-fade" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="white" />
                  <stop offset="1" stopColor="white" stopOpacity="0.4" />
                </linearGradient>
              </defs>
            </svg>
          ))}
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 left-1/3 size-[420px] rounded-full bg-[radial-gradient(circle,rgba(18,185,129,0.12),transparent_70%)]" />

          <div className="relative mb-6 flex flex-wrap items-center justify-between gap-3 lg:absolute lg:inset-x-8 lg:top-[29px] lg:mb-0">
            <nav aria-label="Breadcrumb" className={`flex flex-wrap items-center gap-2 text-[13px] text-[#cbd5e1] ${fontRegular}`}>
              <a href="#" className="hover:text-white">
                Home
              </a>
              <span aria-hidden="true">›</span>
              <button type="button" onClick={() => openSearch({ category: course.category })} className="hover:text-white">
                {course.category}
              </button>
              <span aria-hidden="true">›</span>
              <button type="button" onClick={() => openSearch({ category: course.category, sub: course.subcategory })} className={`text-[#ffb20d] hover:text-[#ffd166] ${fontMedium}`}>
                {course.subcategory}
              </button>
            </nav>
            <div className="flex gap-2 lg:mr-6 lg:mt-2">
              {highestRated && <span className={`rounded-[8px] bg-[#fdf3dc] px-3.5 py-2 text-[13px] text-[#1e293b] ${fontMedium}`}>Highest Rated</span>}
              {bestSeller && <span className={`rounded-[8px] bg-[#12b981] px-3.5 py-2 text-[13px] text-white ${fontMedium}`}>Best Seller</span>}
            </div>
          </div>

        <header className="relative flex max-w-[862px] flex-col gap-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <h1 dir="auto" className={`m-0 text-left text-[28px] leading-[1.25] tracking-[-0.72px] md:text-[36px] md:leading-[48px] ${fontFor(course.title, fontHeading, "font-bold")}`}>
              {course.title}
            </h1>
            <button
              type="button"
              onClick={toggleWishlist}
              aria-pressed={saved}
              aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
              className={`flex size-[40px] shrink-0 items-center justify-center rounded-[8px] shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition ${saved ? "bg-[#ef4444] text-white" : "bg-white/[0.06] text-white hover:bg-white/15"}`}
            >
              <Icon name="heart" className={`size-[20px] ${saved ? "fill-current" : ""}`} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className={`rounded-full border border-white/[0.12] bg-white/[0.12] px-3 py-1 text-[12px] leading-[18px] text-[#e2e8f0] ${fontMedium}`}>
                {t}
              </span>
            ))}
            {course.live && <span className={`rounded-full bg-[#ef4444] px-3 py-1 text-[12px] text-white ${fontSemi}`}>● Live cohort</span>}
          </div>
          <p dir="auto" className={`max-w-[650px] text-left text-[16px] leading-[24px] text-[#f1f5f9] ${fontFor(course.description, fontMedium, "font-medium")}`}>
            {course.description}
          </p>
          <div className="flex flex-wrap gap-x-12 gap-y-4 pt-3">
            <div className="flex flex-col gap-1">
              <span className={`text-[15px] text-[#64748b] ${fontMedium}`}>Created by</span>
              <span dir="auto" className={`text-[15px] text-white ${fontFor(course.instructor, fontMedium, "font-medium")}`}>{course.instructor}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className={`text-[15px] text-[#64748b] ${fontMedium}`}>Review</span>
              <span className={`flex flex-wrap items-center gap-2 text-[14px] text-[#cbd5e1] ${fontRegular}`}>
                <span className={`text-[16px] text-[#ffb20d] ${fontBold}`}>{course.rating.toFixed(1)}</span>
                <StarRow rating={course.rating} />
                <span>({ratingsCount.toLocaleString()} ratings)</span>
                <span className={`text-white ${fontMedium}`}>{course.students.toLocaleString()} students</span>
              </span>
            </div>
          </div>
          <div className={`flex flex-wrap items-center gap-x-12 gap-y-2 pt-3 text-[14px] text-[#f8fafc] ${fontRegular}`}>
            <span>
              <span className={`text-[#64748b] ${fontMedium}`}>Last Updated : </span>
              {formatDate(course.launched)}
            </span>
            <span className="flex items-center gap-2">
              <Icon name="globe" className="size-[16px]" />
              {language}
            </span>
            <span className="flex items-center gap-2">
              <Icon name="cc" className="size-[16px]" />
              {language === "Arabic" ? "Arabic, English [Auto]" : "English, Arabic [Auto]"}, <span className="underline">13 more</span>
            </span>
          </div>
        </header>
        </div>

        {/* Purchase card */}
        <aside className="relative z-10 mt-6 lg:sticky lg:top-[88px] lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mt-[78px] lg:self-start lg:pl-8 xl:pl-[34px]">
          <div className="flex flex-col gap-5 rounded-[16px] border border-[#e2e8f0] bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
            <button type="button" onClick={() => notify("Course preview opens here (demo)")} className="group relative block overflow-hidden rounded-[12px]" aria-label="Play course preview">
              <CourseThumb course={course} showTitle={false} className="aspect-video" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/30">
                <span className="flex size-[56px] items-center justify-center rounded-full bg-white/90 text-[#0f172a] shadow-lg transition group-hover:scale-110">
                  <Icon name="play" className="ml-0.5 size-[22px]" />
                </span>
              </span>
              <span className={`absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[12px] text-white ${fontMedium}`}>Preview this course</span>
            </button>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className={`text-[28px] leading-none ${course.price === 0 ? "text-[#0d5c4b]" : "text-[#dc2626]"} ${fontBold}`}>{formatPrice(course.price)}</span>
                {discount > 0 && (
                  <>
                    <span className={`text-[16px] text-[#94a3b8] line-through ${fontRegular}`}>{formatPrice(course.originalPrice!)}</span>
                    <span className={`text-[15px] text-[#334155] ${fontMedium}`}>{discount}% off</span>
                  </>
                )}
              </div>
              {discount > 0 && (
                <p className={`flex items-center gap-1.5 text-[13px] text-[#dc2626] ${fontMedium}`}>
                  <Icon name="clock" className="size-[15px]" />5 hours left at this price!
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {enrolled ? (
                <button type="button" onClick={() => openLearning(course.id)} className={`h-[48px] rounded-[10px] bg-[#0d5c4b] text-[16px] text-white transition hover:bg-[#0b4c3e] ${fontSemi}`}>
                  Go to course
                </button>
              ) : (
                <>
                  <button type="button" onClick={buyNow} className={`h-[48px] rounded-[10px] bg-[#ffb20d] text-[16px] text-[#1e293b] shadow-[0_8px_20px_rgba(255,178,13,0.3)] transition hover:-translate-y-0.5 hover:bg-[#faa104] ${fontSemi}`}>
                    {course.price === 0 ? "Enroll for free" : "Buy Now"}
                  </button>
                  <button
                    type="button"
                    onClick={() => (inCart ? setOverlay({ type: "cart" }) : addToCart(course))}
                    className={`h-[48px] rounded-[10px] bg-[#f1f5f9] text-[16px] text-[#0f172a] transition hover:bg-[#e2e8f0] ${fontSemi}`}
                  >
                    {inCart ? "Go to cart" : "Add to Cart"}
                  </button>
                </>
              )}
              <p className={`text-center text-[12px] text-[#64748b] ${fontRegular}`}>30-day money-back guarantee</p>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#e2e8f0] pt-5">
              <p className={`text-[15px] text-[#0f172a] ${fontSemi}`}>This course includes</p>
              <ul className={`flex flex-col gap-3 text-[14px] text-[#334155] ${fontRegular}`}>
                {[
                  ["video", course.live ? `Live sessions plus ${course.duration ?? `${course.hours} hours`} of recordings` : `${course.duration ?? `${course.hours} hours`} of on-demand video`],
                  ["article", `${Math.max(2, Math.round(course.lessons / 6))} exclusive articles`],
                  ["download", `${Math.max(1, Math.round(course.lessons / 12))} downloadable resources`],
                  ["mobile", "Learn anywhere, any time"],
                  ["infinity", "Lifetime access"],
                  ["award", "Certificate of completion"],
                ].map(([icon, label]) => (
                  <li key={icon} className="flex items-center gap-3">
                    <span className="text-[#0d5c4b]">
                      <Icon name={icon} />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            <button type="button" onClick={share} className={`flex items-center justify-center gap-2 border-t border-[#e2e8f0] pt-4 text-[14px] text-[#0f172a] transition hover:text-[#0d5c4b] ${fontSemi}`}>
              <Icon name="share" className="size-[16px]" />
              Share this course
            </button>
          </div>
        </aside>

        {/* Body */}
        <div className="mt-6 flex min-w-0 flex-col gap-6 lg:col-start-2 lg:row-start-2">
          <Objectives course={course} />
          <Overview course={course} />
          <CourseContent course={course} />
          <Instructor course={course} />
          <Reviews course={course} ratingsCount={ratingsCount} />
        </div>
      </div>
    </main>
  );
}

function Objectives({ course }: { course: Course }) {
  const items = [...course.outcomes, ...extraObjectives].slice(0, 10);
  return (
    <Card title="Course objectives">
      <ul className={`grid grid-cols-1 gap-x-8 gap-y-3 text-[14px] text-[#334155] sm:grid-cols-2 ${fontRegular}`}>
        {items.map((item) => (
          <li key={item} dir="auto" className="flex items-start gap-3 text-left">
            <span className="mt-0.5 text-[#12b981]">
              <Icon name="check" className="size-[18px]" />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Overview({ course }: { course: Course }) {
  const [open, setOpen] = useState(false);
  const requirements = [
    `A computer or phone with an internet connection.`,
    "Determination and a wish to learn. We teach you the rest.",
    `No previous ${course.subcategory} experience is needed.`,
    "Free tools only. We show you how to set them up.",
    `${course.level === "Beginner" ? "No" : "Basic"} knowledge of ${course.category.toLowerCase()} is required.`,
  ];
  return (
    <Card title="Overview">
      <div className={`relative overflow-hidden transition-[max-height] duration-500 ${open ? "max-h-[1200px]" : "max-h-[470px]"}`}>
        <div className={`flex flex-col gap-4 text-[14px] leading-[22px] text-[#475569] ${fontRegular}`}>
          <p dir="auto" className="text-left">
            {course.description} This {course.level.toLowerCase()} course in {course.subcategory} takes you step by step through {course.lessons} lessons, with {course.hours} hours of focused content.
          </p>
          <p>
            Throughout the course you work on hands-on projects that apply each idea to real situations. Every section ends with a short exercise, so you practise what you learn before moving on. You finish with a project you can show to employers or clients.
          </p>
        </div>
        <h3 className={`mb-3 mt-8 text-[18px] text-[#0f172a] ${fontHeading}`}>Requirements</h3>
        <ul className={`flex list-disc flex-col gap-2 pl-5 text-[14px] leading-[22px] text-[#475569] marker:text-[#0f172a] ${fontRegular}`}>
          {requirements.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <h3 className={`mb-3 mt-8 text-[18px] text-[#0f172a] ${fontHeading}`}>Who this course is for</h3>
        <ul className={`flex list-disc flex-col gap-2 pl-5 text-[14px] leading-[22px] text-[#475569] marker:text-[#0f172a] ${fontRegular}`}>
          <li>Learners who want a clear, practical start in {course.subcategory}.</li>
          <li>Professionals who want to add a new skill to their CV.</li>
          <li>Teams in Saudi Arabia and the region who learn better with real examples.</li>
        </ul>
        {!open && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />}
      </div>
      <SeeMore open={open} onClick={() => setOpen(!open)} />
    </Card>
  );
}

function CourseContent({ course }: { course: Course }) {
  const sections = useMemo(() => buildCurriculum(course), [course]);
  const [openSet, setOpenSet] = useState<Set<number>>(() => new Set([0]));
  const [showAll, setShowAll] = useState(false);
  const { notify } = useApp();
  const visible = showAll ? sections : sections.slice(0, 4);
  const allOpen = openSet.size === sections.length;
  const toggle = (i: number) =>
    setOpenSet((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  const lessonCount = sections.reduce((n, s) => n + s.lessons.length, 0);

  return (
    <Card title="Course content">
      <div className={`mb-4 flex flex-wrap items-center justify-between gap-2 text-[14px] text-[#475569] ${fontRegular}`}>
        <span>
          {sections.length} sections · {lessonCount} lectures · {course.duration ?? `${course.hours}h`} total length
        </span>
        <button
          type="button"
          onClick={() => {
            setOpenSet(allOpen ? new Set() : new Set(sections.map((_, i) => i)));
            if (!allOpen) setShowAll(true);
          }}
          className={`text-[#0d5c4b] hover:underline ${fontSemi}`}
        >
          {allOpen ? "Collapse all sections" : "Expand all sections"}
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {visible.map((section, i) => {
          const open = openSet.has(i);
          const previews = section.lessons.filter((l) => l.preview).length;
          return (
            <div key={section.title} className={`overflow-hidden rounded-[12px] border transition ${open ? "border-[#e2e8f0] bg-white" : "border-transparent bg-[#f1f5f9]"}`}>
              <button type="button" onClick={() => toggle(i)} aria-expanded={open} className="flex w-full items-center gap-4 px-4 py-4 text-left md:px-5">
                <span className={`flex size-[20px] shrink-0 items-center justify-center text-[22px] leading-none text-[#475569] ${fontRegular}`}>{open ? "−" : "+"}</span>
                <span className={`flex-1 text-[15px] text-[#0f172a] ${fontMedium}`}>{section.title}</span>
                <span className={`hidden shrink-0 text-[13px] text-[#64748b] sm:block ${fontRegular}`}>
                  {previews > 0 && `${previews} Preview | `}
                  {section.lessons.length} Lectures
                </span>
              </button>
              {open && (
                <ul className="flex flex-col pb-2">
                  {section.lessons.map((lesson) => (
                    <li key={lesson.title} className={`flex items-center gap-3 px-4 py-3 text-[14px] md:px-5 md:pl-[60px] ${fontRegular}`}>
                      <span className="text-[#94a3b8]">
                        <Icon name={lesson.kind} className="size-[16px]" />
                      </span>
                      {lesson.preview ? (
                        <button type="button" onClick={() => notify(`Previewing "${lesson.title}" (demo)`)} className="flex-1 text-left text-[#0f172a] underline-offset-2 hover:text-[#0d5c4b] hover:underline">
                          {lesson.title}
                        </button>
                      ) : (
                        <span className="flex-1 text-[#64748b]">{lesson.title}</span>
                      )}
                      {lesson.preview && <span className={`text-[13px] text-[#0d5c4b] ${fontSemi}`}>Preview</span>}
                      <span className="w-[52px] shrink-0 text-right text-[13px] text-[#94a3b8]">{lesson.kind === "quiz" ? "Quiz" : lesson.kind === "assignment" ? "Task" : `${lesson.minutes}min`}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      {sections.length > 4 && <SeeMore open={showAll} onClick={() => setShowAll(!showAll)} more={`See ${sections.length - 4} more sections`} />}
    </Card>
  );
}

function Instructor({ course }: { course: Course }) {
  const { openSearch } = useApp();
  const theirs = courses.filter((c) => c.instructor === course.instructor);
  const students = theirs.reduce((n, c) => n + c.students, 0);
  const rating = theirs.reduce((n, c) => n + c.rating, 0) / theirs.length;
  const [from, to] = categoryColors(course.category);
  const [open, setOpen] = useState(false);
  return (
    <Card title="Instructor">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className={`flex size-[56px] items-center justify-center rounded-full text-[18px] text-white ${fontFor(course.instructor, fontSemi, "font-bold")}`} style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}>
            {initials(course.instructor)}
          </span>
          <div>
            <p dir="auto" className={`text-left text-[17px] text-[#0f172a] ${fontFor(course.instructor, fontSemi)}`}>{course.instructor}</p>
            <p className={`text-[13px] text-[#64748b] ${fontRegular}`}>{course.subcategory} instructor</p>
          </div>
        </div>
        <button type="button" onClick={() => openSearch({ q: course.instructor })} className={`h-[40px] rounded-[8px] bg-[#f1f5f9] px-4 text-[14px] text-[#0f172a] transition hover:bg-[#e2e8f0] ${fontSemi}`}>
          See instructor courses
        </button>
      </div>
      <div className={`mt-5 flex flex-wrap gap-x-8 gap-y-2 text-[14px] text-[#0f172a] ${fontSemi}`}>
        <span className="flex items-center gap-2">
          <span className="text-[#ffb20d]">★</span>
          {rating.toFixed(1)} rating
        </span>
        <span className="flex items-center gap-2">
          <Icon name="users" className="size-[16px] text-[#64748b]" />
          {students.toLocaleString()} students
        </span>
        <span className="flex items-center gap-2">
          <Icon name="video" className="size-[16px] text-[#64748b]" />
          {theirs.length} {theirs.length === 1 ? "course" : "courses"}
        </span>
      </div>
      <div className={`mt-5 flex flex-col gap-3 text-[14px] leading-[22px] text-[#475569] ${fontRegular} ${open ? "" : "line-clamp-4"}`}>
        <p>
          {course.instructor} is an expert in {course.subcategory} with years of hands-on experience in {course.category.toLowerCase()}. They have trained teams across Saudi Arabia and the Gulf and hold professional certificates in their field.
        </p>
        <p>
          Their teaching style focuses on real examples and short, practical lessons. Learners say they leave each session with something they use at work the next day. Outside teaching, they consult for companies on {course.subcategory.toLowerCase()} projects.
        </p>
      </div>
      <SeeMore open={open} onClick={() => setOpen(!open)} />
    </Card>
  );
}

function Reviews({ course, ratingsCount }: { course: Course; ratingsCount: number }) {
  const { user, notify } = useApp();
  const key = `thkee.reviews.${course.id}`;
  const [mine, setMine] = useState<Review[]>(() => loadJSON(key, []));
  const [showAll, setShowAll] = useState(false);
  const all = [...mine, ...seedReviews];
  const visible = showAll ? all : all.slice(0, 2);

  const r = course.rating;
  const distribution = [
    Math.round(Math.max(40, (r - 3.6) * 70)),
    Math.round(Math.max(15, (5 - r) * 60 + 10)),
    Math.round(Math.max(4, (5 - r) * 30)),
    Math.round(Math.max(1, (5 - r) * 10)),
    Math.round(Math.max(1, (5 - r) * 5)),
  ];
  const sum = distribution.reduce((a, b) => a + b, 0);
  const percents = distribution.map((d) => Math.round((d / sum) * 100));

  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!stars) return setError("Please choose a star rating.");
    if (body.trim().length < 10) return setError("Please write at least 10 characters.");
    const next = [{ name: user?.name ?? "You", when: "Just now", rating: stars, title: title.trim() || "My review", body: body.trim() }, ...mine];
    setMine(next);
    saveJSON(key, next);
    setStars(0);
    setTitle("");
    setBody("");
    setError("");
    notify("Thanks! Your review is posted ✓");
  };

  const inputClass = "field";

  return (
    <>
      <Card title="Reviews" id="reviews">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
          <div className="flex shrink-0 flex-col items-center gap-2 sm:w-[160px]">
            <span className={`text-[48px] leading-none text-[#0f172a] ${fontHeading}`}>{course.rating.toFixed(1)}</span>
            <StarRow rating={course.rating} size={18} />
            <span className={`text-[13px] text-[#64748b] ${fontRegular}`}>({ratingsCount.toLocaleString()} ratings)</span>
          </div>
          <div className="flex flex-1 flex-col gap-2.5">
            {percents.map((p, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-[8px] flex-1 overflow-hidden rounded-full bg-[#f1f5f9]">
                  <div className="h-full rounded-full bg-[#ffb20d]" style={{ width: `${p}%` }} />
                </div>
                <StarRow rating={5 - i} size={14} />
                <span className={`w-[36px] text-right text-[13px] text-[#475569] ${fontMedium}`}>{p}%</span>
              </div>
            ))}
          </div>
        </div>

        <ul className="mt-8 flex flex-col divide-y divide-[#e2e8f0] border-t border-[#e2e8f0]">
          {visible.map((rev, i) => (
            <li key={`${rev.name}-${i}`} className="flex gap-4 py-6">
              <span className={`flex size-[44px] shrink-0 items-center justify-center rounded-full bg-[#e7f5f1] text-[15px] text-[#0d5c4b] ${fontSemi}`}>{initials(rev.name)}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={`text-[15px] text-[#0f172a] ${fontSemi}`}>
                    {rev.name} <span className={`text-[12px] text-[#94a3b8] ${fontRegular}`}>· {rev.when}</span>
                  </p>
                  <StarRow rating={rev.rating} size={15} />
                </div>
                <p className={`text-[13px] text-[#64748b] ${fontMedium}`}>{rev.title}</p>
                <p className={`text-[14px] leading-[24px] text-[#334155] ${fontRegular}`}>{rev.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex justify-end">
          <button type="button" onClick={() => setShowAll(!showAll)} className={`h-[44px] rounded-[8px] bg-[#0f172a] px-5 text-[14px] text-white transition hover:bg-[#0d5c4b] ${fontSemi}`}>
            {showAll ? "Show fewer reviews" : `See all feedback (${all.length})`}
          </button>
        </div>
      </Card>

      <Card title="Add a review and rate">
        <form onSubmit={submit} className="flex max-w-[620px] flex-col gap-5" noValidate>
          <div className="flex flex-col gap-2">
            <span className={`text-[14px] text-[#475569] ${fontRegular}`}>What is this course like?</span>
            <div className="flex gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Your rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onMouseEnter={() => setHover(n)} onClick={() => setStars(n)} className="p-0.5 transition hover:scale-110">
                  <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" className={(hover || stars) >= n ? "text-[#ffb20d]" : "text-[#e2e8f0]"} aria-hidden="true">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-2">
            <span className={`text-[14px] text-[#0f172a] ${fontMedium}`}>Review title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sum up your experience" className={inputClass} />
          </label>
          <label className="flex flex-col gap-2">
            <span className={`text-[14px] text-[#0f172a] ${fontMedium}`}>Review content</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="What did you like? What could be better?" className={`${inputClass} resize-y`} />
          </label>
          {error && <p className={`text-[13px] text-[#dc2626] ${fontMedium}`}>{error}</p>}
          <button type="submit" className={`h-[48px] self-start rounded-[10px] bg-[#ffb20d] px-7 text-[16px] text-[#1e293b] transition hover:bg-[#faa104] ${fontSemi}`}>
            Submit review
          </button>
        </form>
      </Card>
    </>
  );
}
