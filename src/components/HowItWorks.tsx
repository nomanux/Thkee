import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ArrowRight02Icon, Calendar03Icon, Certificate01Icon, CheckmarkCircle02Icon, PlayIcon, UserGroupIcon, Video01Icon } from "@hugeicons/core-free-icons";
import { fontBold, fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { useApp } from "../store";

// Three plain promises, each answering one question a learner has.
const points: { icon: IconSvgElement; title: string; body: string; tone: string }[] = [
  { icon: Video01Icon, title: "Watch any time", body: "Short recorded lessons. Pause, replay and learn at your own pace.", tone: "bg-[#e6f4ee] text-[#0d5c4b]" },
  { icon: UserGroupIcon, title: "Ask an expert live", body: "Join optional live sessions to ask questions. Missed one? Watch the recording.", tone: "bg-[#fff4dc] text-[#b45309]" },
  { icon: Certificate01Icon, title: "Finish with proof", body: "Build a real project and earn a certificate you can share.", tone: "bg-[#eef2ff] text-[#4f46e5]" },
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
    <section className="w-full overflow-hidden bg-white px-4 py-[64px] md:px-8 xl:py-[96px]">
      <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
        {/* Left: the promise in plain words */}
        <div className="flex flex-col">
          <span className={`w-fit rounded-full bg-[#eef7f3] px-3 py-1 text-[12px] uppercase tracking-[0.12em] text-[#0d5c4b] ${fontSemi}`}>How learning works</span>
          <h2 className={`m-0 mt-4 text-[34px] leading-[1.1] tracking-[-1px] text-[#0f172a] md:text-[46px] ${fontHeading}`}>
            Learn on your schedule.
            <br />
            <span className="text-[#0d5c4b]">Get help when you need it.</span>
          </h2>
          <p className={`m-0 mt-4 max-w-[520px] text-[16px] leading-[26px] text-[#475569] ${fontRegular}`}>Every course mixes recorded lessons with optional live sessions, so you never get stuck on your own.</p>

          <ul className="mt-8 flex flex-col gap-5">
            {points.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-[12px] ${p.tone}`}>
                  <HugeiconsIcon icon={p.icon} size={22} strokeWidth={1.8} />
                </span>
                <span>
                  <span className={`block text-[16px] leading-[22px] text-[#0f172a] ${fontSemi}`}>{p.title}</span>
                  <span className={`mt-0.5 block text-[14px] leading-[22px] text-[#64748b] ${fontRegular}`}>{p.body}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button type="button" onClick={findCourse} className={`group flex h-[50px] items-center gap-2 rounded-full bg-[#0f172a] pl-6 pr-1.5 text-[15px] text-white shadow-[0_12px_28px_-12px_rgba(15,23,42,0.6)] transition hover:bg-[#1e293b] ${fontSemi}`}>
              Find a course
              <span className="flex size-[38px] items-center justify-center rounded-full bg-[#ffb20d] text-[#0f172a] transition group-hover:translate-x-0.5">
                <HugeiconsIcon icon={ArrowRight02Icon} size={18} strokeWidth={2} />
              </span>
            </button>
            <span className={`text-[13px] text-[#64748b] ${fontRegular}`}>Live sessions are always optional.</span>
          </div>
        </div>

        {/* Right: a real-looking peek inside a course, so the idea is shown, not explained */}
        <div className="relative">
          <div aria-hidden="true" className="absolute -inset-10 -z-0 rounded-[48px] bg-[radial-gradient(60%_60%_at_70%_30%,rgba(16,185,129,0.14),transparent_70%),radial-gradient(50%_50%_at_20%_90%,rgba(255,178,13,0.16),transparent_70%)]" />
          <div className="relative overflow-hidden rounded-[24px] border border-[#e2e8f0] bg-white shadow-[0_30px_60px_-30px_rgba(15,23,42,0.35)]">
            {/* Player */}
            <div className="relative aspect-[16/8] overflow-hidden bg-[#0f172a]">
              <img src="/assets/courses/ui-ux-figma.jpg" alt="" aria-hidden="true" className="size-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/90 via-[#0f172a]/10 to-transparent" />
              <div className="absolute inset-x-4 bottom-3 flex items-center gap-3 text-white">
                <span className="flex size-9 items-center justify-center rounded-full bg-white text-[#0f172a]">
                  <HugeiconsIcon icon={PlayIcon} size={16} strokeWidth={2} className="ml-0.5 fill-current" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`m-0 truncate text-[13px] leading-[18px] ${fontSemi}`}>Lesson 3 · Build your first screen</p>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/25">
                    <div className="h-full w-[42%] rounded-full bg-[#ffb20d]" />
                  </div>
                </div>
                <span className={`text-[12px] tabular-nums text-white/80 ${fontMedium}`}>5:52 / 14:00</span>
              </div>
            </div>
            {/* Lesson list */}
            <ul className="flex flex-col p-2">
              {lessons.map((l, i) => {
                const live = l.state === "live";
                return (
                  <li key={l.title} className={`flex items-center gap-3 rounded-[14px] px-3 py-2.5 ${live ? "my-1 bg-[#fff8e6] ring-1 ring-inset ring-[#ffd98a]" : l.state === "playing" ? "bg-[#f4faf7]" : ""}`}>
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[12px] ${fontSemi} ${
                        l.state === "done" ? "bg-[#e6f4ee] text-[#0d5c4b]" : l.state === "playing" ? "bg-[#0d5c4b] text-white" : live ? "bg-[#ffb20d] text-[#3b2600]" : "bg-[#f1f5f9] text-[#64748b]"
                      }`}
                    >
                      {l.state === "done" ? <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} strokeWidth={2} /> : live ? <HugeiconsIcon icon={Calendar03Icon} size={16} strokeWidth={2} /> : l.state === "playing" ? <HugeiconsIcon icon={PlayIcon} size={13} strokeWidth={2} className="ml-0.5 fill-current" /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[14px] leading-[20px] ${l.state === "done" ? "text-[#64748b]" : "text-[#0f172a]"} ${l.state === "playing" || live ? fontSemi : fontMedium}`}>{l.title}</span>
                      <span className={`block text-[12px] leading-[16px] ${live ? "text-[#b45309]" : "text-[#94a3b8]"} ${fontRegular}`}>{l.meta}</span>
                    </span>
                    {live ? (
                      <span className={`flex items-center gap-1.5 rounded-full bg-[#0f172a] px-3 py-1.5 text-[12px] text-white ${fontSemi}`}>
                        <span className="relative flex size-1.5">
                          <span className="absolute inset-0 animate-ping rounded-full bg-[#ef4444] motion-reduce:hidden" />
                          <span className="relative size-1.5 rounded-full bg-[#ef4444]" />
                        </span>
                        Join live
                      </span>
                    ) : l.state === "playing" ? (
                      <span className={`text-[12px] text-[#0d5c4b] ${fontSemi}`}>Watching</span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Floating proof chips */}
          <div className={`float-y absolute -left-4 top-6 hidden items-center gap-2 rounded-[14px] bg-white px-3 py-2 text-[13px] text-[#0f172a] shadow-[0_14px_30px_-12px_rgba(15,23,42,0.35)] ring-1 ring-[#e2e8f0] sm:flex ${fontSemi}`}>
            <span className="flex size-7 items-center justify-center rounded-full bg-[#e6f4ee] text-[#0d5c4b]">
              <HugeiconsIcon icon={Certificate01Icon} size={15} strokeWidth={2} />
            </span>
            Certificate included
          </div>
          <div className={`float-y absolute -bottom-5 -right-3 hidden items-center gap-2.5 rounded-[14px] bg-white px-3 py-2 shadow-[0_14px_30px_-12px_rgba(15,23,42,0.35)] ring-1 ring-[#e2e8f0] [animation-delay:1.2s] sm:flex`}>
            <span className="flex -space-x-2">
              {["#0d5c4b", "#f59e0b", "#6366f1"].map((c, i) => (
                <span key={c} className={`flex size-7 items-center justify-center rounded-full text-[11px] text-white ring-2 ring-white ${fontBold}`} style={{ background: c }}>
                  {["S", "O", "H"][i]}
                </span>
              ))}
            </span>
            <span className="leading-tight">
              <span className={`block text-[13px] text-[#0f172a] ${fontSemi}`}>24 learners joined</span>
              <span className={`block text-[11px] text-[#64748b] ${fontRegular}`}>last live session</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
