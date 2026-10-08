import { fontHeading, fontRegular, fontSemi } from "../fonts";
import { useApp } from "../store";
import SectionHeading from "./SectionHeading";

const steps = [
  { label: "Lessons 1 to 2", title: "Start with the lessons", body: "Pause or replay any part before moving on.", optional: false, icon: "▶" },
  { label: "Session one", title: "Ask your expert", body: "Bring your questions and try an exercise with the group.", optional: true, icon: "💬" },
  { label: "Lessons 3 to 4", title: "Practise what you learned", body: "Work through the next lessons and share questions with the group.", optional: false, icon: "✎" },
  { label: "Session two", title: "Meet a guest expert", body: "Hear how the ideas apply in their work.", optional: true, icon: "★" },
  { label: "Lessons 5 to 6", title: "Complete your project", body: "Use what you learned, with or without the live sessions.", optional: false, icon: "✓" },
];

export default function HowItWorks() {
  const { setOverlay } = useApp();

  return (
    <section className="w-full bg-white px-4 py-[64px] md:px-8 xl:py-[96px]">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-12">
        <SectionHeading
          eyebrow="Recorded lessons and live sessions"
          title="Watch the lessons. Ask the expert."
          subtitle="Watch when it suits you. Join optional live sessions to ask questions and practise what you have learned."
          action={
            <div className={`flex shrink-0 flex-wrap gap-4 text-[13px] text-[#475569] ${fontRegular}`}>
              <span className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-[#0d5c4b]" /> Recorded lesson
              </span>
              <span className="flex items-center gap-2">
                <span className="size-3 rounded-full border-2 border-dashed border-[#ffb20d]" /> Optional live session
              </span>
            </div>
          }
        />
        <ol className="relative grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-5">
          <div aria-hidden className="absolute bottom-6 left-[27px] top-6 w-[2px] bg-gradient-to-b from-[#0d5c4b] via-[#ffb20d] to-[#0d5c4b] opacity-30 lg:bottom-auto lg:left-[10%] lg:right-[10%] lg:top-[27px] lg:h-[2px] lg:w-auto lg:bg-gradient-to-r" />
          {steps.map((s, i) => (
            <li key={s.title} className="group relative flex gap-4 lg:flex-col lg:items-center lg:text-center">
              <span
                className={`relative z-[1] flex size-14 shrink-0 items-center justify-center rounded-full text-[20px] transition duration-300 group-hover:scale-110 ${
                  s.optional ? "border-2 border-dashed border-[#ffb20d] bg-[#fffaf0] text-[#9a4a00]" : "bg-[#0d5c4b] text-white shadow-[0_10px_24px_rgba(13,92,75,0.3)]"
                } ${fontSemi}`}
              >
                {s.icon}
              </span>
              <div
                className={`flex flex-1 flex-col gap-1.5 rounded-[16px] border p-5 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] lg:w-full ${
                  s.optional ? "border-dashed border-[#f5c869] bg-[#fffdf7]" : "border-[#e2e8f0] bg-white"
                }`}
              >
                <span className={`text-[12px] uppercase tracking-[0.8px] ${fontSemi} ${s.optional ? "text-[#9a4a00]" : "text-[#0d5c4b]"}`}>
                  Step {i + 1} · {s.label}
                  {s.optional && " · optional"}
                </span>
                <span className={`text-[18px] leading-[1.35] text-[#0f172a] ${fontHeading}`}>{s.title}</span>
                <span className={`text-[14px] leading-[22px] text-[#475569] ${fontRegular}`}>{s.body}</span>
              </div>
            </li>
          ))}
        </ol>
        <div className="flex flex-col items-start gap-4 rounded-[20px] bg-[#0f172a] p-6 text-white sm:flex-row sm:items-center sm:justify-between md:p-8">
          <p className={`text-[18px] md:text-[20px] ${fontHeading}`}>Learn at your pace, with an expert one click away.</p>
          <button type="button" onClick={() => setOverlay({ type: "catalog" })} className={`h-[48px] shrink-0 rounded-[10px] bg-[#ffb20d] px-6 text-[16px] text-[#1e293b] transition hover:bg-[#faa104] ${fontSemi}`}>
            Find a course
          </button>
        </div>
      </div>
    </section>
  );
}
