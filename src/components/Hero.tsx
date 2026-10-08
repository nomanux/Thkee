import { useApp } from "../store";

const sparkles = [
  { top: "150px", left: "8%", size: 22, color: "#7ff0c0", duration: 3.2, delay: 0 },
  { top: "260px", left: "20%", size: 16, color: "#ffffff", duration: 4.1, delay: 0.8 },
  { top: "190px", right: "12%", size: 24, color: "#ffd166", duration: 3.6, delay: 0.3 },
  { top: "420px", right: "6%", size: 18, color: "#7ff0c0", duration: 4.4, delay: 1.4 },
  { top: "470px", left: "5%", size: 20, color: "#ffffff", duration: 3.9, delay: 2 },
  { top: "110px", left: "46%", size: 14, color: "#ffd166", duration: 5, delay: 1 },
];

const tickerTopics: { label: string; category?: string }[] = [
  { label: "Personal & Professional Growth" },
  { label: "Business", category: "Business" },
  { label: "Information Technology", category: "Development" },
  { label: "Design", category: "Design" },
  { label: "Teaching & Training" },
  { label: "Language", category: "Languages" },
];

const avatarGradients = [
  "linear-gradient(135deg, #ffd166, #ffb400)",
  "linear-gradient(135deg, #7ff0c0, #1fa569)",
  "linear-gradient(135deg, #c9e8ff, #5aa9e6)",
  "linear-gradient(135deg, #ffd9c9, #ef8354)",
];

export default function Hero() {
  const { setOverlay } = useApp();

  return (
    <div
      id="top"
      className="relative w-full overflow-hidden pt-[72px] font-['Plus_Jakarta_Sans',sans-serif] text-white"
      style={{ background: "radial-gradient(ellipse 90% 70% at 50% 0%, #0b9c70 0%, #065c43 42%, #03281d 100%)" }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 75% 65% at 50% 35%, #000 25%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 75% 65% at 50% 35%, #000 25%, transparent 80%)",
        }}
      />
      <div aria-hidden="true" className="hero-drift absolute -left-[120px] -top-[160px] size-[460px] rounded-full" style={{ background: "radial-gradient(circle, rgba(255,180,0,0.32), rgba(255,180,0,0) 70%)", animationDuration: "16s" }} />
      <div aria-hidden="true" className="hero-drift absolute -right-[180px] top-[120px] size-[520px] rounded-full" style={{ background: "radial-gradient(circle, rgba(60,230,170,0.30), rgba(60,230,170,0) 70%)", animationDuration: "20s", animationDirection: "reverse" }} />
      {sparkles.map((s, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="hero-twinkle absolute leading-none"
          style={{ top: s.top, left: s.left, right: s.right, fontSize: s.size, color: s.color, animationDuration: `${s.duration}s`, animationDelay: `${s.delay}s` }}
        >
          +
        </div>
      ))}

      <section className="relative z-[1] mx-auto flex max-w-[1200px] flex-col items-center gap-7 px-6 py-[72px] text-center sm:py-24">
        <div className="hero-rise inline-flex items-center gap-2.5 rounded-full border border-white/[0.28] bg-white/[0.07] px-[18px] py-[9px] text-[12px] font-bold uppercase tracking-[1.6px]">
          <span className="hero-pulse size-2 rounded-full bg-[#ffb400]" />
          AI-powered learning platform
        </div>

        <h1 className="hero-rise m-0 max-w-[960px] text-[clamp(42px,7.2vw,84px)] font-extrabold leading-[1.02] tracking-[-2.5px]" style={{ animationDelay: "0.1s" }}>
          Connect, Learn, and{" "}
          <span
            className="hero-shimmer bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(90deg, #ffd166, #ffb400, #7ff0c0, #ffd166)", backgroundSize: "300% 100%", WebkitTextFillColor: "transparent" }}
          >
            Grow Together
          </span>
        </h1>

        <p className="hero-rise m-0 max-w-[640px] text-[18px] leading-[1.55] text-white/[0.84] sm:text-[20px]" style={{ animationDelay: "0.2s" }}>
          Discover expert-led courses, join live sessions, and learn from instructors around the world.
        </p>

        <div className="hero-rise flex w-full flex-col justify-center gap-3.5 sm:w-auto sm:flex-row" style={{ animationDelay: "0.3s" }}>
          <button
            type="button"
            onClick={() => setOverlay({ type: "catalog" })}
            className="inline-flex items-center justify-center gap-2.5 rounded-[12px] bg-[#ffb400] px-[30px] py-4 text-[17px] font-bold text-[#1a1200] shadow-[0_10px_30px_rgba(255,180,0,0.45)] transition hover:-translate-y-0.5 hover:bg-[#ffc233] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1200" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 10L12 5 2 10l10 5 10-5z" />
              <path d="M6 12v5c3 2 9 2 12 0v-5" />
            </svg>
            Start Learning
          </button>
          <button
            type="button"
            onClick={() => setOverlay({ type: "instructor" })}
            className="inline-flex items-center justify-center gap-2.5 rounded-[12px] border border-white/30 bg-white/10 px-7 py-4 text-[17px] font-semibold text-white transition hover:bg-white/[0.18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Become an Instructor
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 17L17 7" />
              <path d="M8 7h9v9" />
            </svg>
          </button>
        </div>

        <div className="hero-rise flex flex-wrap items-center justify-center gap-3.5" style={{ animationDelay: "0.4s" }}>
          <div className="flex">
            {avatarGradients.map((g, i) => (
              <span key={g} className={`size-[34px] rounded-full border-2 border-[#065c43] ${i ? "-ml-2.5" : ""}`} style={{ background: g }} />
            ))}
          </div>
          <div className="text-[16px] text-white/[0.88]">
            <span className="text-[#ffb400]">★</span> Trusted by <strong>1000+</strong> learners and <strong>50+</strong> expert instructors
          </div>
        </div>
      </section>

      <div className="group relative z-[1] overflow-hidden border-t border-white/[0.14] bg-[rgba(3,40,29,0.55)] py-[18px]">
        <div className="hero-marquee flex w-max group-hover:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <div key={copy} aria-hidden={copy === 1 || undefined} className="flex flex-none items-center">
              {tickerTopics.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  tabIndex={copy === 1 ? -1 : undefined}
                  onClick={() => setOverlay(t.category ? { type: "catalog", category: t.category } : { type: "catalog" })}
                  className="inline-flex items-center gap-3.5 pr-11 text-[15px] font-semibold text-white/[0.88] transition-colors hover:text-[#ffd166]"
                >
                  <span className="size-[7px] rounded-full bg-[#ffb400]" />
                  {t.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
