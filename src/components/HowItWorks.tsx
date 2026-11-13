import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ArrowRight02Icon, Calendar03Icon, Certificate01Icon, CheckmarkCircle02Icon, PlayIcon, UserGroupIcon, Video01Icon } from "@hugeicons/core-free-icons";
import { fontBold, fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { useApp } from "../store";

// Three plain promises, each answering one question a learner has.
const points: { icon: IconSvgElement; title: string; body: string; tone: string }[] = [
  { icon: Video01Icon, title: "Watch any time", body: "Short recorded lessons. Pause, replay and learn at your own pace.", tone: "bg-primary-200 text-primary-700" },
  { icon: UserGroupIcon, title: "Ask an expert live", body: "Join optional live sessions to ask questions. Missed one? Watch the recording.", tone: "bg-secondary-100 text-amber-700" },
  { icon: Certificate01Icon, title: "Finish with proof", body: "Build a real project and earn a certificate you can share.", tone: "bg-indigo-50 text-indigo-600" },
];

// What a course looks like inside: recorded lessons with a live session in between.
const lessons: { title: string; meta: string; state: "done" | "playing" | "live" | "next" }[] = [
  { title: "Welcome to Figma", meta: "Lesson · 6 min", state: "done" },
  { title: "Frames and layout basics", meta: "Lesson · 12 min", state: "done" },
  { title: "Build your first screen", meta: "Lesson · 14 min", state: "playing" },
  { title: "Live Q&A with your instructor", meta: "Thursday · 7:00 PM", state: "live" },
  { title: "Prototype and share", meta: "Lesson · 10 min", state: "next" },
];

export default function HowItWorks() {
  const { setOverlay } = useApp();
  const findCourse = () => setOverlay({ type: "catalog" });

  return (
    <section className="w-full overflow-hidden bg-white px-4 py-16 md:px-8 xl:py-24">
      <div className="mx-auto grid w-full max-w-330 grid-cols-1 items-center gap-12 lg:grid-cols-split-right lg:gap-16">
        {/* Left: the promise in plain words */}
        <div className="flex flex-col">
          <span className={`w-fit rounded-full bg-primary-100 px-3 py-1 text-xs uppercase tracking-widest text-primary-700 ${fontSemi}`}>How learning works</span>
          <h2 className={`m-0 mt-4 text-34 leading-none tracking-tight text-slate-900 md:text-46 ${fontHeading}`}>
            Learn on your schedule.
            <br />
            <span className="text-primary-700">Get help when you need it.</span>
          </h2>
          <p className={`m-0 mt-4 max-w-130 text-base leading-6.5 text-slate-600 ${fontRegular}`}>Every course mixes recorded lessons with optional live sessions, so you never get stuck on your own.</p>

          <ul className="mt-8 flex flex-col gap-5">
            {points.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${p.tone}`}>
                  <HugeiconsIcon icon={p.icon} size={22} strokeWidth={1.8} />
                </span>
                <span>
                  <span className={`block text-base leading-5.5 text-slate-900 ${fontSemi}`}>{p.title}</span>
                  <span className={`mt-0.5 block text-sm leading-5.5 text-slate-500 ${fontRegular}`}>{p.body}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button type="button" onClick={findCourse} className={`group flex h-12.5 items-center gap-2 rounded-full bg-slate-900 pl-6 pr-1.5 text-15 text-white shadow-2xl transition hover:bg-slate-800 ${fontSemi}`}>
              Find a course
              <span className="flex size-9.5 items-center justify-center rounded-full bg-secondary-500 text-slate-900 transition group-hover:translate-x-0.5">
                <HugeiconsIcon icon={ArrowRight02Icon} size={18} strokeWidth={2} />
              </span>
            </button>
            <span className={`text-13 text-slate-500 ${fontRegular}`}>Live sessions are always optional.</span>
          </div>
        </div>

        {/* Right: a real-looking peek inside a course, so the idea is shown, not explained */}
        <div className="relative">
          <div aria-hidden="true" className="absolute -inset-10 -z-0 rounded-3xl bg-glow-duo" />
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Player */}
            <div className="relative aspect-16/8 overflow-hidden bg-slate-900">
              <img src="/assets/courses/ui-ux-figma.jpg" alt="" aria-hidden="true" className="size-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/10 to-transparent" />
              <div className="absolute inset-x-4 bottom-3 flex items-center gap-3 text-white">
                <span className="flex size-9 items-center justify-center rounded-full bg-white text-slate-900">
                  <HugeiconsIcon icon={PlayIcon} size={16} strokeWidth={2} className="ml-0.5 fill-current" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`m-0 truncate text-13 leading-4.5 ${fontSemi}`}>Lesson 3 · Build your first screen</p>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/25">
                    <div className="h-full w-21/50 rounded-full bg-secondary-500" />
                  </div>
                </div>
                <span className={`text-xs tabular-nums text-white/80 ${fontMedium}`}>5:52 / 14:00</span>
              </div>
            </div>
            {/* Lesson list */}
            <ul className="flex flex-col p-2">
              {lessons.map((l, i) => {
                const live = l.state === "live";
                return (
                  <li key={l.title} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${live ? "my-1 bg-amber-50 ring-1 ring-inset ring-amber-200" : l.state === "playing" ? "bg-primary-50" : ""}`}>
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs ${fontSemi} ${
                        l.state === "done" ? "bg-primary-200 text-primary-700" : l.state === "playing" ? "bg-primary-700 text-white" : live ? "bg-secondary-500 text-yellow-950" : "bg-slate-150 text-slate-500"
                      }`}
                    >
                      {l.state === "done" ? <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} strokeWidth={2} /> : live ? <HugeiconsIcon icon={Calendar03Icon} size={16} strokeWidth={2} /> : l.state === "playing" ? <HugeiconsIcon icon={PlayIcon} size={13} strokeWidth={2} className="ml-0.5 fill-current" /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm leading-5 ${l.state === "done" ? "text-slate-500" : "text-slate-900"} ${l.state === "playing" || live ? fontSemi : fontMedium}`}>{l.title}</span>
                      <span className={`block text-xs leading-4 ${live ? "text-amber-700" : "text-slate-400"} ${fontRegular}`}>{l.meta}</span>
                    </span>
                    {live ? (
                      <span className={`flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs text-white ${fontSemi}`}>
                        <span className="relative flex size-1.5">
                          <span className="absolute inset-0 animate-ping rounded-full bg-red-500 motion-reduce:hidden" />
                          <span className="relative size-1.5 rounded-full bg-red-500" />
                        </span>
                        Join live
                      </span>
                    ) : l.state === "playing" ? (
                      <span className={`text-xs text-primary-700 ${fontSemi}`}>Watching</span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Floating proof chips */}
          <div className={`float-y absolute -left-4 top-6 hidden items-center gap-2 rounded-2xl bg-white px-3 py-2 text-13 text-slate-900 shadow-2xl ring-1 ring-slate-200 sm:flex ${fontSemi}`}>
            <span className="flex size-7 items-center justify-center rounded-full bg-primary-200 text-primary-700">
              <HugeiconsIcon icon={Certificate01Icon} size={15} strokeWidth={2} />
            </span>
            Certificate included
          </div>
          <div className={`float-y absolute -bottom-5 -right-3 hidden items-center gap-2.5 rounded-2xl bg-white px-3 py-2 shadow-2xl ring-1 ring-slate-200 animation-delay-1200 sm:flex`}>
            <span className="flex -space-x-2">
              {["#0d5c4b", "#f59e0b", "#6366f1"].map((c, i) => (
                <span key={c} className={`flex size-7 items-center justify-center rounded-full text-11 text-white ring-2 ring-white ${fontBold}`} style={{ background: c }}>
                  {["S", "O", "H"][i]}
                </span>
              ))}
            </span>
            <span className="leading-tight">
              <span className={`block text-13 text-slate-900 ${fontSemi}`}>24 learners joined</span>
              <span className={`block text-11 text-slate-500 ${fontRegular}`}>last live session</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
