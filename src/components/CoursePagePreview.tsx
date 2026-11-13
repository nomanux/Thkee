import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { fontBold, fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { formatPrice } from "../store";
import { NoteBody } from "./Notes";

// What the course builder knows about a course, shaped for the student course page.
export type CoursePreviewData = {
  title: string;
  subtitle: string;
  category: string;
  subCategory: string;
  topics: string[];
  level: string;
  language: string;
  price: string;
  discount: number;
  cover: string;
  hasPromoVideo: boolean;
  description: string;
  descriptionHtml: string;
  objectives: string[];
  requirements: string[];
  audience: string[];
  curriculum: { id: string; title: string; lectures: { id: string; title: string; kind: string; duration?: string; preview?: boolean }[] }[];
  instructor: string;
};

// Parts of the page the builder can point at while the instructor edits them.
export type PreviewAnchor = "banner" | "card" | "objectives" | "overview" | "requirements" | "audience" | "content" | "instructor";

// The page is drawn at desktop width and scaled down, so it keeps the real layout.
// When the preview panel gets narrow, it switches to the phone layout inside a phone frame.
const DESIGN_WIDTH = 1040;
const PHONE_WIDTH = 390;
const PHONE_BREAKPOINT = 480;
const PHONE_BEZEL = 8;

const PATHS: Record<string, string> = {
  check: "M5 12.5l4.5 4.5L19 7.5",
  play: "M8 5.5v13l11-6.5z",
  video: "M4 6h11a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2zM17 10l5-3v10l-5-3",
  article: "M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM9 8h6M9 12h6M9 16h4",
  quiz: "M12 3a9 9 0 100 18 9 9 0 000-18zM9.8 9.7a2.3 2.3 0 114 1.5c-.8.7-1.8 1.1-1.8 2.2M12 16h.01",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  mobile: "M8 2h8a2 2 0 012 2v16a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2zM11 18h2",
  infinity: "M18.2 8.5a4 4 0 110 7c-2.1 0-3.9-2.4-6.2-3.5-2.3-1.1-4.1-3.5-6.2-3.5a4 4 0 100 7c2.1 0 3.9-2.4 6.2-3.5 2.3-1.1 4.1-3.5 6.2-3.5z",
  award: "M12 2a6 6 0 100 12 6 6 0 000-12zM8.5 13l-1.5 9 5-3 5 3-1.5-9",
  share: "M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4",
  heart: "M12 20s-7-4.4-9.3-8.6C1.2 8.4 3 5 6.3 5c2 0 3.3 1.1 3.9 2.2h3.6C14.4 6.1 15.7 5 17.7 5 21 5 22.8 8.4 21.3 11.4 19 15.6 12 20 12 20z",
  globe: "M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
  users: "M9 11a4 4 0 100-8 4 4 0 000 8zM2 21v-1a6 6 0 016-6h2a6 6 0 016 6v1M16 3.1a4 4 0 010 7.8M22 21v-1a6 6 0 00-4-5.7",
  minus: "M5 12h14",
  plus: "M12 5v14M5 12h14",
};

function Glyph({ name, className = "size-4.5", solid }: { name: string; className?: string; solid?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={solid ? "currentColor" : "none"} stroke={solid ? "none" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

const ghost = (width: string, tone = "bg-slate-150") => <span className={`block h-3 rounded-full ${tone} ${width}`} />;

export default function CoursePagePreview({ data, focus, fit = true }: { data: CoursePreviewData; focus?: PreviewAnchor | null; fit?: boolean }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [height, setHeight] = useState(0);
  const [phone, setPhone] = useState(false);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const page = pageRef.current;
    if (!outer || !page) return;
    const measure = () => {
      const width = outer.clientWidth;
      const small = width < PHONE_BREAKPOINT;
      setPhone(small);
      if (small) setScale(Math.min(1, (width - PHONE_BEZEL * 2) / PHONE_WIDTH));
      else setScale(fit ? width / DESIGN_WIDTH : Math.min(1, width / DESIGN_WIDTH));
      setHeight(page.offsetHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(page);
    return () => observer.disconnect();
  }, [fit]);

  // Bring the part being edited into view inside the nearest scrolling frame.
  useEffect(() => {
    if (!focus) return;
    const target = pageRef.current?.querySelector<HTMLElement>(`[data-anchor="${focus}"]`);
    const frame = outerRef.current?.closest<HTMLElement>("[data-preview-frame]");
    if (!target || !frame) return;
    const top = target.getBoundingClientRect().top - frame.getBoundingClientRect().top + frame.scrollTop - 12;
    frame.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [focus]);

  const mark = (anchor: PreviewAnchor) => ({
    "data-anchor": anchor,
    className: `transition-all duration-300 outline outline-5 outline-offset-6 ${focus === anchor ? "outline-secondary-600" : "outline-transparent"}`,
  });

  const priceValue = Number(data.price);
  const hasPrice = data.price.trim() !== "" && Number.isFinite(priceValue) && priceValue >= 0;
  const free = hasPrice && priceValue === 0;
  const sale = hasPrice && !free && data.discount > 0 ? priceValue * (1 - data.discount / 100) : null;
  const lectures = data.curriculum.reduce((n, s) => n + s.lectures.length, 0);
  const tags = data.topics.length ? data.topics.slice(0, 3) : data.subCategory ? [data.subCategory] : [];
  const initials = data.instructor
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "YOU";

  const card = (anchor: PreviewAnchor, title: string, children: ReactNode) => {
    const m = mark(anchor);
    return (
      <section data-anchor={m["data-anchor"]} className={`rounded-2xl border border-slate-200 bg-white ${phone ? "p-5" : "p-8"} ${m.className}`}>
        <h2 className={`m-0 mb-5 ${phone ? "text-19" : "text-22"} leading-tight text-slate-900 ${fontHeading}`}>{title}</h2>
        {children}
      </section>
    );
  };
  const bulletList = (anchor: PreviewAnchor, title: string, items: string[]) => {
    const m = mark(anchor);
    return (
      <div data-anchor={m["data-anchor"]} className={`-mx-3 mt-6 rounded-xl px-3 py-2 ${m.className}`}>
        <h3 className={`m-0 mb-3 text-lg text-slate-900 ${fontHeading}`}>{title}</h3>
        {items.length ? (
          <ul className={`m-0 flex list-disc flex-col gap-2 pl-5 text-sm leading-5.5 text-slate-600 marker:text-slate-900 wrap-anywhere ${fontRegular}`}>
            {items.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col gap-3 pl-1">
            {ghost("w-3/5")}
            {ghost("w-2/5")}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={outerRef} className="relative w-full overflow-hidden" style={{ height: height * scale + (phone ? PHONE_BEZEL * 2 : 0) }}>
      {phone && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-3xl bg-slate-900 shadow-2xl"
          style={{ width: PHONE_WIDTH * scale + PHONE_BEZEL * 2, height: height * scale + PHONE_BEZEL * 2 }}
        />
      )}
      <div
        ref={pageRef}
        className={`absolute top-0 origin-top-left overflow-hidden bg-slate-25 ${phone ? "rounded-3xl p-3" : "p-6"}`}
        style={phone ? { width: PHONE_WIDTH, transform: `scale(${scale})`, left: `calc(50% - ${(PHONE_WIDTH * scale) / 2}px)`, top: PHONE_BEZEL } : { left: 0, width: DESIGN_WIDTH, transform: `scale(${scale})` }}
      >
        <div className={phone ? "relative flex flex-col gap-4" : "relative grid grid-cols-aside-320 gap-x-8"}>
          {/* Banner */}
          <div {...mark("banner")} className={`${mark("banner").className} relative overflow-hidden rounded-2xl bg-linear-120 from-slate-950 via-slate-900 via-55% to-slate-800 ${phone ? "px-5 pb-6 pt-14" : "col-span-2 col-start-1 row-start-1 min-h-100 pb-8 pl-88 pr-8 pt-23"}`}>
            <svg aria-hidden="true" viewBox="0 0 321 454" preserveAspectRatio="none" className="pointer-events-none absolute inset-y-0 right-15 h-full w-80.25 opacity-6">
              <path d="M321 0H150L0 227l150 227h171L171 227z" fill="white" />
            </svg>
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 left-1/3 size-105 rounded-full bg-radial from-emerald-500/12 to-transparent to-70%" />
            <nav className={`absolute flex items-center gap-2 text-13 text-slate-300 ${phone ? "left-5 top-5" : "left-8 top-7"} ${fontRegular}`}>
              <span>Home</span>
              <span aria-hidden="true">›</span>
              <span>{data.category || "Category"}</span>
              <span aria-hidden="true">›</span>
              <span className={`text-secondary-500 ${fontMedium}`}>{data.subCategory || "Sub category"}</span>
            </nav>
            <header className="relative flex flex-col gap-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <h1 className={`m-0 ${phone ? "text-26 leading-8.5" : "text-34 leading-11"} tracking-tight wrap-anywhere ${data.title ? "" : "text-white/40"} ${fontHeading}`}>{data.title || "Your course title"}</h1>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/6 text-white">
                  <Glyph name="heart" className="size-5" />
                </span>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span key={t} className={`rounded-full border border-white/12 bg-white/12 px-3 py-1 text-xs leading-4.5 text-slate-200 ${fontMedium}`}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {data.subtitle.trim() ? <p className={`m-0 max-w-150 text-base leading-6 text-slate-150 wrap-anywhere ${fontMedium}`}>{data.subtitle}</p> : <div className="flex max-w-130 flex-col gap-2.5">{ghost("w-full", "bg-white/10")}{ghost("w-2/3", "bg-white/10")}</div>}
              <div className="flex flex-wrap gap-x-12 gap-y-4 pt-2">
                <div className="flex flex-col gap-1">
                  <span className={`text-15 text-slate-500 ${fontMedium}`}>Created by</span>
                  <span className={`text-15 text-white ${fontMedium}`}>{data.instructor || "You"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={`text-15 text-slate-500 ${fontMedium}`}>Review</span>
                  <span className={`text-sm text-slate-400 ${fontRegular}`}>No ratings yet</span>
                </div>
              </div>
              <div className={`flex flex-wrap items-center gap-x-10 gap-y-2 pt-2 text-sm text-slate-25 ${fontRegular}`}>
                <span>
                  <span className={`text-slate-500 ${fontMedium}`}>Level : </span>
                  {data.level || "Not set"}
                </span>
                <span className="flex items-center gap-2">
                  <Glyph name="globe" className="size-4" />
                  {data.language || "Language not set"}
                </span>
              </div>
            </header>
          </div>

          {/* Purchase card */}
          <aside className={phone ? "relative" : "relative z-10 col-start-1 row-span-2 row-start-1 mt-16 self-start pl-6"}>
            <div {...mark("card")} className={`${mark("card").className} flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl`}>
              <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-200">
                {data.cover && <img src={data.cover} alt="" className="size-full object-cover" />}
                <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="flex size-13 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg">
                    <Glyph name="play" className="ml-0.5 size-5" solid />
                  </span>
                </span>
                <span className={`absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-3 py-1 text-xs text-white ${fontMedium}`}>{data.hasPromoVideo ? "Preview this course" : "Add a promo video"}</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {hasPrice ? (
                  <>
                    <span className={`text-28 leading-none ${free ? "text-primary-700" : "text-red-600"} ${fontBold}`}>{free ? "Free" : formatPrice(sale ?? priceValue)}</span>
                    {sale !== null && (
                      <>
                        <span className={`text-base text-slate-400 line-through ${fontRegular}`}>{formatPrice(priceValue)}</span>
                        <span className={`text-15 text-slate-700 ${fontMedium}`}>{data.discount}% off</span>
                      </>
                    )}
                  </>
                ) : (
                  <span className={`text-xl leading-none text-slate-400 ${fontSemi}`}>Price not set</span>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <span className={`flex h-12 items-center justify-center rounded-xl bg-secondary-500 text-base text-slate-800 ${fontSemi}`}>{free ? "Enroll for free" : "Buy Now"}</span>
                <span className={`flex h-12 items-center justify-center rounded-xl bg-slate-150 text-base text-slate-900 ${fontSemi}`}>Add to Cart</span>
                <p className={`m-0 text-center text-xs text-slate-500 ${fontRegular}`}>30-day money-back guarantee</p>
              </div>
              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5">
                <p className={`m-0 text-15 text-slate-900 ${fontSemi}`}>This course includes</p>
                <ul className={`m-0 flex list-none flex-col gap-3 p-0 text-sm text-slate-700 ${fontRegular}`}>
                  {[
                    ["video", `${lectures} ${lectures === 1 ? "lecture" : "lectures"}`],
                    ["download", "Downloadable resources"],
                    ["mobile", "Learn anywhere, any time"],
                    ["infinity", "Lifetime access"],
                    ["award", "Certificate of completion"],
                  ].map(([icon, label]) => (
                    <li key={icon} className="flex items-center gap-3">
                      <span className="text-primary-700">
                        <Glyph name={icon} />
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
              <span className={`flex items-center justify-center gap-2 border-t border-slate-200 pt-4 text-sm text-slate-900 ${fontSemi}`}>
                <Glyph name="share" className="size-4" />
                Share this course
              </span>
            </div>
          </aside>

          {/* Body */}
          <div className={phone ? "flex min-w-0 flex-col gap-4" : "col-start-2 row-start-2 mt-6 flex min-w-0 flex-col gap-6"}>
            {card(
              "objectives",
              "Course objectives",
              data.objectives.length ? (
                <ul className={`m-0 grid list-none ${phone ? "grid-cols-1" : "grid-cols-2"} gap-x-8 gap-y-3 p-0 text-sm text-slate-700 ${fontRegular}`}>
                  {data.objectives.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 wrap-anywhere">
                      <span className="mt-0.5 text-emerald-500">
                        <Glyph name="check" />
                      </span>
                      <span className="min-w-0">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={`grid ${phone ? "grid-cols-1" : "grid-cols-2"} gap-x-8 gap-y-4`}>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="size-4 shrink-0 rounded-full bg-slate-200" />
                      {ghost(i % 2 ? "w-3/5" : "w-4/5")}
                    </div>
                  ))}
                </div>
              ),
            )}

            {card(
              "overview",
              "Overview",
              <>
                {data.description.trim() ? (
                  // The full description with its formatting (bold, lists, paragraphs), as students will see it.
                  <NoteBody
                    note={{ text: data.description, html: data.descriptionHtml }}
                    tone="text-slate-600"
                    className="wrap-anywhere [&_b]:text-slate-900 [&_li]:mb-1 [&_li]:marker:text-slate-900 [&_ol]:my-2 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:text-slate-900 [&_ul]:my-2"
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    {ghost("w-full")}
                    {ghost("w-11/12")}
                    {ghost("w-2/3")}
                  </div>
                )}
                {bulletList("requirements", "Requirements", data.requirements)}
                {bulletList("audience", "Who this course is for", data.audience)}
              </>,
            )}

            {card(
              "content",
              "Course content",
              <>
                <p className={`m-0 mb-4 text-13 text-slate-500 ${fontRegular}`}>
                  {data.curriculum.length} {data.curriculum.length === 1 ? "section" : "sections"} · {lectures} {lectures === 1 ? "lecture" : "lectures"}
                </p>
                {data.curriculum.length ? (
                  <div className="flex flex-col gap-3">
                    {data.curriculum.map((section, si) => (
                      <div key={section.id} className={`rounded-xl ${si === 0 ? "border border-slate-200" : "bg-slate-150"}`}>
                        <div className="flex items-center gap-3 px-4 py-3.5">
                          <Glyph name={si === 0 ? "minus" : "plus"} className="size-4 text-slate-700" />
                          <span className={`min-w-0 flex-1 truncate text-sm text-slate-900 ${fontMedium}`}>
                            {si + 1}. {section.title || "Untitled section"}
                          </span>
                          <span className={`shrink-0 text-xs text-slate-500 ${fontRegular}`}>
                            {section.lectures.length} {section.lectures.length === 1 ? "Lecture" : "Lectures"}
                          </span>
                        </div>
                        {si === 0 && section.lectures.length > 0 && (
                          <ul className="m-0 flex list-none flex-col gap-0.5 px-4 pb-3 pl-11">
                            {section.lectures.map((l) => (
                              <li key={l.id} className={`flex items-center gap-3 py-2 text-13 text-slate-700 ${fontRegular}`}>
                                <Glyph name={l.kind === "Video" ? "video" : l.kind === "Quiz" ? "quiz" : "article"} className="size-4 shrink-0 text-slate-400" />
                                <span className="min-w-0 flex-1 truncate">{l.title || `New ${l.kind.toLowerCase()} lecture`}</span>
                                {l.preview && <span className={`text-primary-700 ${fontSemi}`}>Preview</span>}
                                {l.duration && <span className="text-slate-400">{l.duration}</span>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="block h-12 rounded-xl bg-slate-150" />
                    ))}
                  </div>
                )}
              </>,
            )}

            {card(
              "instructor",
              "Instructor",
              <div className="flex items-center gap-4">
                <span className={`flex size-12 shrink-0 items-center justify-center rounded-full bg-linear-135 from-blue-600 to-blue-800 text-15 text-white ${fontSemi}`}>{initials}</span>
                <div className="min-w-0">
                  <p className={`m-0 text-base text-slate-900 ${fontSemi}`}>{data.instructor || "You"}</p>
                  <p className={`m-0 mt-0.5 text-13 text-slate-500 ${fontRegular}`}>{data.category ? `${data.category} instructor` : "Instructor"}</p>
                </div>
              </div>,
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className={`m-0 mb-4 text-22 leading-tight text-slate-900 ${fontHeading}`}>Reviews</h2>
              <div className="flex items-center gap-3 text-slate-300">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Glyph key={i} name="star" className="size-5" solid />
                ))}
                <span className={`ml-2 text-sm text-slate-500 ${fontRegular}`}>Reviews appear after students enroll.</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
