import { useState, type ReactNode } from "react";
import { fontMedium, fontRegular, fontSemi } from "../fonts";
import { openInstructorStart } from "../store";
import { ChecklistArt, InspireIcon, PresentingArt, RecordingArt, TeachIcon, TrophyIcon } from "./InstructorArt";

const imgHero = "/assets/6f650.png";
const fontTitle = "font-['Instrument_Sans:Medium'] font-medium";

const benefits = [
  { icon: <TeachIcon />, title: "Teach Ahead", text: "You always have control over your own content when you publish a course." },
  { icon: <InspireIcon />, title: "Inspire student", text: "Impart Your Knowledge, Foster Interests and Skills, Enhance Career Paths" },
  { icon: <TrophyIcon />, title: "Earn Reward", text: "Broaden Connections, Strengthen Expertise, Generate Income through Enrollments" },
];
const stats = [
  ["3500+", "Students worldwide"],
  ["3500+", "Students worldwide"],
  ["4960+", "Total course views"],
  ["9870+", "Students community"],
  ["3500+", "Students worldwide"],
];
const tabs = [
  {
    label: "Design Your Curriculum",
    art: <ChecklistArt className="w-full max-w-[280px]" />,
    intro: "Brief description about planning and structuring the course content, setting clear learning objectives, and organizing the flow of topics.",
    points: ["Define clear learning outcomes for each module.", "Create engaging and relevant lessons that support those outcomes.", "Use various teaching materials like slides, videos, and quizzes to reinforce learning."],
  },
  {
    label: "Record your course",
    art: <RecordingArt className="w-full max-w-[280px]" />,
    intro: "Brief description about recording clear lessons at home with simple equipment, and editing them so students can follow along.",
    points: ["Choose a quiet space with good lighting.", "Record short lessons that each cover one idea.", "Review and edit your videos before uploading them."],
  },
  {
    label: "Publish for everyone",
    art: <PresentingArt className="w-full max-w-[250px]" />,
    intro: "Brief description about publishing your course on the marketplace and helping the right students discover it.",
    points: ["Write a clear course title and description.", "Set your price and publish your course.", "Share your course with your own audience."],
  },
];

function Title({ children }: { children: ReactNode }) {
  return (
    <h2 className={`m-0 text-[28px] leading-[36px] text-[#1e293b] md:text-[36px] md:leading-[44px] ${fontTitle}`} style={{ fontVariationSettings: '"wdth" 100' }}>
      {children}
    </h2>
  );
}

function StartButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={openInstructorStart} className={`h-[44px] rounded-[6px] bg-[#1e293b] px-5 text-[14px] text-white transition hover:bg-[#0f172a] ${fontMedium}`}>
      {label}
    </button>
  );
}

export default function TeachPage() {
  const [tab, setTab] = useState(0);
  const current = tabs[tab];
  const photo = "rounded-[6px] object-cover";

  return (
    <main className="w-full bg-white pt-[56px]">
      <section className="bg-[#f8fafc] px-4 py-10 md:px-8 xl:px-[100px] xl:py-[50px]">
        <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-10 lg:flex-row">
          <div className="flex flex-col items-start gap-5">
            <h1 className={`m-0 max-w-[600px] text-[36px] leading-[46px] text-[#1e293b] xl:text-[50px] xl:leading-[64px] ${fontTitle}`} style={{ fontVariationSettings: '"wdth" 100' }}>
              Inspiration, Innovation and Discovery
            </h1>
            <p className={`text-[14px] leading-[24px] text-[#1e293b] ${fontRegular}`}>Make a difference in the lives of other people - including your own.</p>
            <StartButton label="Let's get started." />
          </div>
          <div className="flex shrink-0 gap-[13px]">
            <div className="flex flex-col gap-[10px]">
              <img src={imgHero} alt="" loading="lazy" className={`h-[120px] w-[84px] object-[60%_20%] sm:h-[169px] sm:w-[119px] ${photo}`} />
              <img src={imgHero} alt="" loading="lazy" className={`h-[120px] w-[84px] object-[30%_50%] sm:h-[169px] sm:w-[119px] ${photo}`} />
            </div>
            <img src={imgHero} alt="An instructor smiling at his phone" className={`h-[250px] w-[204px] object-[50%_30%] sm:h-[348px] sm:w-[283px] ${photo}`} />
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center gap-3 px-4 py-16 text-center xl:py-20">
        <Title>Discover your potential.</Title>
        <p className={`text-[14px] leading-[24px] text-[#64748b] ${fontRegular}`}>Here you will find the top featured courses presented by category.</p>
        <ul className="mt-8 grid w-full max-w-[1100px] gap-10 md:grid-cols-3">
          {benefits.map((b) => (
            <li key={b.title} className="flex flex-col items-center gap-4">
              {b.icon}
              <h3 className={`m-0 mt-3 text-[16px] leading-[24px] text-[#0f172a] ${fontSemi}`}>{b.title}</h3>
              <p className={`max-w-[250px] text-[14px] leading-[28px] text-[#475569] ${fontRegular}`}>{b.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-[#1e293b] px-4 py-8">
        <ul className="mx-auto grid max-w-[1240px] grid-cols-2 gap-6 text-center sm:grid-cols-3 lg:grid-cols-5">
          {stats.map(([value, label], i) => (
            <li key={i} className="flex flex-col gap-2">
              <span className={`text-[24px] leading-[32px] text-white ${fontSemi}`}>{value}</span>
              <span className={`text-[14px] leading-[22px] text-[#cbd5e1] ${fontRegular}`}>{label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="relative overflow-hidden px-4 py-16 xl:py-20">
        <span aria-hidden="true" className="pointer-events-none absolute -left-[220px] top-6 size-[400px] rounded-full border border-[#fde9c0]" />
        <span aria-hidden="true" className="pointer-events-none absolute -left-[110px] top-[116px] size-[180px] rounded-full border border-[#fde9c0]" />
        <div className="relative mx-auto flex max-w-[880px] flex-col items-center gap-3 text-center">
          <Title>How to become an Instructor</Title>
          <p className={`text-[14px] leading-[24px] text-[#64748b] ${fontRegular}`}>Here you will find the top featured courses presented by category.</p>
          <div role="tablist" aria-label="How to become an instructor" className="mt-8 flex w-full max-w-[746px] overflow-x-auto border-b border-[#e2e8f0]">
            {tabs.map((t, i) => (
              <button key={t.label} type="button" role="tab" aria-selected={tab === i} onClick={() => setTab(i)} className={`-mb-px min-w-[170px] flex-1 border-b-2 px-3 py-3 text-[14px] leading-[20px] transition ${tab === i ? `border-[#6d28d9] text-[#6d28d9] ${fontMedium}` : `border-transparent text-[#64748b] hover:text-[#1e293b] ${fontRegular}`}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="mt-10 grid w-full items-center gap-10 text-left md:grid-cols-[1fr_300px]">
            <div className={`flex flex-col gap-6 text-[14px] leading-[28px] text-[#475569] ${fontRegular}`}>
              <p>{current.intro}</p>
              <ul className="flex list-disc flex-col pl-6">
                {current.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center">{current.art}</div>
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center gap-3 bg-[#f1f5f9] px-4 py-16 text-center">
        <Title>Become an Instructor Today</Title>
        <p className={`text-[14px] leading-[24px] text-[#475569] ${fontRegular}`}>Join the world's largest online learning marketplace.</p>
        <div className="mt-5">
          <StartButton label="Start teaching today" />
        </div>
      </section>
    </main>
  );
}
