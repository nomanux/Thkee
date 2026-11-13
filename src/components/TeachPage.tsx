import { useState, type ReactNode } from "react";
import { fontMedium, fontRegular, fontSemi } from "../fonts";
import { openInstructorStart } from "../store";
import { ChecklistArt, InspireIcon, PresentingArt, RecordingArt, TeachIcon, TrophyIcon } from "./InstructorArt";
import { buttonClass } from "./Button"

const imgHero = "/assets/6f650.png";
const fontTitle = "font-instrument-medium font-medium";

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
    art: <ChecklistArt className="w-full max-w-70" />,
    intro: "Brief description about planning and structuring the course content, setting clear learning objectives, and organizing the flow of topics.",
    points: ["Define clear learning outcomes for each module.", "Create engaging and relevant lessons that support those outcomes.", "Use various teaching materials like slides, videos, and quizzes to reinforce learning."],
  },
  {
    label: "Record your course",
    art: <RecordingArt className="w-full max-w-70" />,
    intro: "Brief description about recording clear lessons at home with simple equipment, and editing them so students can follow along.",
    points: ["Choose a quiet space with good lighting.", "Record short lessons that each cover one idea.", "Review and edit your videos before uploading them."],
  },
  {
    label: "Publish for everyone",
    art: <PresentingArt className="w-full max-w-62.5" />,
    intro: "Brief description about publishing your course on the marketplace and helping the right students discover it.",
    points: ["Write a clear course title and description.", "Set your price and publish your course.", "Share your course with your own audience."],
  },
];

function Title({ children }: { children: ReactNode }) {
  return (
    <h2 className={`m-0 text-28 leading-9 text-slate-800 md:text-4xl md:leading-11 ${fontTitle}`} style={{ fontVariationSettings: '"wdth" 100' }}>
      {children}
    </h2>
  );
}

function StartButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={openInstructorStart} className={`${buttonClass("dark", "lg")}`}>
      {label}
    </button>
  );
}

export default function TeachPage() {
  const [tab, setTab] = useState(0);
  const current = tabs[tab];
  const photo = "rounded-md object-cover";

  return (
    <main className="w-full bg-white pt-14">
      <section className="bg-slate-25 px-4 py-10 md:px-8 xl:px-25 xl:py-12.5">
        <div className="mx-auto flex max-w-310 flex-col items-center justify-between gap-10 lg:flex-row">
          <div className="flex flex-col items-start gap-5">
            <h1 className={`m-0 max-w-150 text-4xl leading-11.5 text-slate-800 xl:text-50 xl:leading-16 ${fontTitle}`} style={{ fontVariationSettings: '"wdth" 100' }}>
              Inspiration, Innovation and Discovery
            </h1>
            <p className={`text-sm leading-6 text-slate-800 ${fontRegular}`}>Make a difference in the lives of other people - including your own.</p>
            <StartButton label="Let's get started." />
          </div>
          <div className="flex shrink-0 gap-3.25">
            <div className="flex flex-col gap-2.5">
              <img src={imgHero} alt="" loading="lazy" className={`h-30 w-21 sm:h-42.25 sm:w-29.75 ${photo}`} style={{ objectPosition: "60% 20%" }} />
              <img src={imgHero} alt="" loading="lazy" className={`h-30 w-21 sm:h-42.25 sm:w-29.75 ${photo}`} style={{ objectPosition: "30% 50%" }} />
            </div>
            <img src={imgHero} alt="An instructor smiling at his phone" className={`h-62.5 w-51 sm:h-87 sm:w-70.75 ${photo}`} style={{ objectPosition: "50% 30%" }} />
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center gap-3 px-4 py-16 text-center xl:py-20">
        <Title>Discover your potential.</Title>
        <p className={`text-sm leading-6 text-slate-500 ${fontRegular}`}>Here you will find the top featured courses presented by category.</p>
        <ul className="mt-8 grid w-full max-w-275 gap-10 md:grid-cols-3">
          {benefits.map((b) => (
            <li key={b.title} className="flex flex-col items-center gap-4">
              {b.icon}
              <h3 className={`m-0 mt-3 text-base leading-6 text-slate-900 ${fontSemi}`}>{b.title}</h3>
              <p className={`max-w-62.5 text-sm leading-7 text-slate-600 ${fontRegular}`}>{b.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-slate-800 px-4 py-8">
        <ul className="mx-auto grid max-w-310 grid-cols-2 gap-6 text-center sm:grid-cols-3 lg:grid-cols-5">
          {stats.map(([value, label], i) => (
            <li key={i} className="flex flex-col gap-2">
              <span className={`text-2xl leading-8 text-white ${fontSemi}`}>{value}</span>
              <span className={`text-sm leading-5.5 text-slate-300 ${fontRegular}`}>{label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="relative overflow-hidden px-4 py-16 xl:py-20">
        <span aria-hidden="true" className="pointer-events-none absolute -left-55 top-6 size-100 rounded-full border border-amber-100" />
        <span aria-hidden="true" className="pointer-events-none absolute -left-27.5 top-29 size-45 rounded-full border border-amber-100" />
        <div className="relative mx-auto flex max-w-220 flex-col items-center gap-3 text-center">
          <Title>How to become an Instructor</Title>
          <p className={`text-sm leading-6 text-slate-500 ${fontRegular}`}>Here you will find the top featured courses presented by category.</p>
          <div role="tablist" aria-label="How to become an instructor" className="mt-8 flex w-full max-w-186.5 overflow-x-auto border-b border-slate-200">
            {tabs.map((t, i) => (
              <button key={t.label} type="button" role="tab" aria-selected={tab === i} onClick={() => setTab(i)} className={`-mb-px min-w-42.5 flex-1 border-b-2 px-3 py-3 text-sm leading-5 transition ${tab === i ? `border-violet-700 text-violet-700 ${fontMedium}` : `border-transparent text-slate-500 hover:text-slate-800 ${fontRegular}`}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="mt-10 grid w-full items-center gap-10 text-left md:grid-cols-main-300">
            <div className={`flex flex-col gap-6 text-sm leading-7 text-slate-600 ${fontRegular}`}>
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

      <section className="flex flex-col items-center gap-3 bg-slate-150 px-4 py-16 text-center">
        <Title>Become an Instructor Today</Title>
        <p className={`text-sm leading-6 text-slate-600 ${fontRegular}`}>Join the world's largest online learning marketplace.</p>
        <div className="mt-5">
          <StartButton label="Start teaching today" />
        </div>
      </section>
    </main>
  );
}
