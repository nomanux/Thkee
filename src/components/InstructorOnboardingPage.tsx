import { useState, type ReactNode } from "react";
import { fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { useApp, useStoredState } from "../store";
import { LaptopsArt, PresentingArt, RecordingArt } from "./InstructorArt";

const imgLogo = "/assets/9afd8.svg";
const imgCheckboxOn = "/assets/70227.svg";

const placeholder = ["Tincidunt integer commodo, cursus etiam aliquam neque, et. Consectetur pretium in volutpat, diam. Montes, magna cursus nulla feugiat dignissim id lobortis amet. Laoreet sem est phasellus eu proin massa, lectus. Diam rutrum posuere donec ultricies non morbi. Mi a platea auctor mi.", "Mauris ullamcorper imperdiet nec egestas mi quis quam ante vulputate. Vel faucibus adipiscing lacus, eget. Nunc fermentum id tellus donec. Ut metus odio sit sit varius non nunc orci. Eu, mi neque, ornare suspendisse amet, nibh. Facilisi volutpat lectus id sapien dis mauris rhoncus. Est rhoncus, interdum imperdiet ac eros, diam mauris, tortor. Risus id sit molestie magna."];
const introText = "Thkee courses are video-based experiences that give students the chance to learn actionable skills. Whether you have experience teaching, or it's your first time, we'll help you package your knowledge into an online course that improves student lives.";

const steps: { title: string; text: string; question: string; options: string[]; art: ReactNode }[] = [
  {
    title: "Share your knowledge",
    text: introText,
    question: "What kind of teaching have you done before?",
    options: ["In Person Informally", "In Person Professionally", "Online", "Other"],
    art: <LaptopsArt className="w-full max-w-87.5" />,
  },
  {
    title: "Create a course",
    text: "Over the years we've helped thousands of instructors learn how to record at home. No matter your experience level, you can become a video pro too. We'll equip you with the latest resources, tips, and support to help you succeed.",
    question: 'How much of a video "pro" are you?',
    options: ["I'm a beginner", "I have some knowledge", "I'm experienced", "I have videos, ready to upload"],
    art: <RecordingArt className="w-full max-w-75" />,
  },
  {
    title: "Expand your reach",
    text: "Once you publish your course, you can grow your student audience and make an impact with the support of Thkee's marketplace promotions and also through your own marketing efforts. Together, we'll help the right students discover your course.",
    question: "Do you have an audience to share your course with?",
    options: ["Not at the moment", "I have a small following", "I have a sizeable following", "I have a large community"],
    art: <PresentingArt className="w-full max-w-65" />,
  },
];

export function Stepper({ current }: { current: number }) {
  return (
    <ol aria-label={`Step ${current + 1} of ${steps.length}`} className="flex w-full max-w-160 items-center">
      {steps.map((step, i) => (
        <li key={step.title} className={`flex items-center ${i === 0 ? "" : "flex-1"}`}>
          {i > 0 && <span className={`mx-1 h-0 flex-1 border-t ${i <= current ? "border-solid border-emerald-600" : "border-dashed border-slate-300"}`} />}
          {i < current ? (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-200">
              <span className="flex size-4 items-center justify-center rounded-full bg-emerald-600">
                <svg viewBox="0 0 24 24" className="size-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12l5 5 9-10" />
                </svg>
              </span>
            </span>
          ) : i === current ? (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-200">
              <span className="flex size-4 items-center justify-center rounded-full bg-emerald-500">
                <span className="size-1.5 rounded-xs bg-white" />
              </span>
            </span>
          ) : (
            <span className="mx-1 size-4 shrink-0 rounded-full border border-slate-500 bg-white" />
          )}
        </li>
      ))}
    </ol>
  );
}

const secondaryButton = `h-11 flex-1 rounded-md border bg-white text-sm text-slate-600 transition sm:w-45.5 sm:flex-none ${fontMedium}`;
const primaryButton = `h-11 flex-1 rounded-md bg-secondary-500 text-sm text-slate-800 transition hover:bg-secondary-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-secondary-500 sm:w-45.5 sm:flex-none ${fontMedium}`;

export default function InstructorOnboardingPage() {
  const { notify } = useApp();
  const [, setOnboarded] = useStoredState("thkee.instructor", false);
  const [, setSurvey] = useStoredState<string[]>("thkee.instructorSurvey", []);
  const [step, setStep] = useState(-1);
  const [agreed, setAgreed] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const exit = () => {
    window.location.hash = "#/teach";
  };
  const go = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const complete = () => {
    setSurvey(answers);
    setOnboarded(true);
    // The stored flag is written by an effect, so it is set here too before the dashboard reads it.
    localStorage.setItem("thkee.instructor", "true");
    window.location.hash = "#/instructor";
    notify("Welcome to Thkee, Instructor!");
  };
  const current = steps[step];

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-white">
      <header className="flex h-16 items-center justify-between bg-slate-800 px-4 md:px-8">
        <img src={imgLogo} alt="Thkee" className="h-8 w-24" />
        <button type="button" onClick={exit} className={`flex items-center gap-1 text-sm text-white transition hover:text-secondary-500 ${fontMedium}`}>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Exit
        </button>
      </header>
      <span aria-hidden="true" className="pointer-events-none absolute -left-26.25 -bottom-32.5 size-87.5 rounded-full border-25 border-orange-50" />

      <main className="relative mx-auto flex max-w-207.5 flex-col items-center px-4 pb-14 pt-10 md:pt-19">
        <h1 className={`m-0 text-center text-26 leading-9 tracking-tight text-slate-900 md:text-3xl ${fontHeading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
          {current ? current.title : "Become an Instructor"}
        </h1>
        <p className={`mt-6 max-w-200 text-center text-sm leading-6 text-slate-600 ${fontRegular}`}>{current ? current.text : introText}</p>

        {current ? (
          <>
            <div className="mt-8 flex w-full justify-center">
              <Stepper current={step} />
            </div>
            <div className="mt-14 grid w-full grid-cols-1 items-center gap-10 md:grid-cols-aside-396">
              <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
                <legend className={`mb-4 p-0 text-sm leading-6 text-slate-900 ${fontSemi}`}>{current.question}</legend>
                {current.options.map((option) => {
                  const checked = answers[step] === option;
                  return (
                    <label key={option} className={`flex h-9.25 cursor-pointer items-center gap-2 rounded-sm border px-2.5 text-sm text-slate-700 transition ${checked ? "border-slate-800 bg-secondary-50" : "border-slate-400 hover:bg-slate-25"} ${fontMedium}`}>
                      <input type="radio" name={`step-${step}`} checked={checked} onChange={() => setAnswers((a) => Object.assign([...a], { [step]: option }))} className="peer sr-only" />
                      <span className={`flex size-4 shrink-0 items-center justify-center rounded-full border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-700 ${checked ? "border-slate-800 bg-slate-800" : "border-slate-300 bg-white"}`}>{checked && <span className="size-1.5 rounded-full bg-white" />}</span>
                      {option}
                    </label>
                  );
                })}
              </fieldset>
              <div className="hidden justify-center md:flex">{current.art}</div>
            </div>
            <div className="mt-14 flex w-full justify-center gap-8">
              <button type="button" onClick={() => go(step - 1)} className={`${secondaryButton} border-slate-800 hover:bg-slate-25`}>
                Previous
              </button>
              <button type="button" disabled={!answers[step]} onClick={step === steps.length - 1 ? complete : () => go(step + 1)} className={primaryButton}>
                {step === steps.length - 1 ? "Complete" : "Continue"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div tabIndex={0} aria-label="Instructor terms" className="mt-10 flex h-105 w-full flex-col gap-7 overflow-y-auto rounded-md bg-slate-25 p-6 md:h-138 md:px-8">
              {[placeholder, [placeholder[0]], [placeholder[0]]].map((paragraphs, i) => (
                <section key={i} className="flex flex-col gap-4">
                  <h2 className={`m-0 text-sm leading-6 text-slate-900 ${fontSemi}`}>How we're different</h2>
                  {paragraphs.map((text, j) => (
                    <p key={j} className={`text-sm leading-6 text-slate-600 ${fontRegular}`}>
                      {text}
                    </p>
                  ))}
                </section>
              ))}
            </div>
            <label className={`mt-4 flex w-full cursor-pointer items-center gap-2 text-sm leading-5 text-slate-600 ${fontRegular}`}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="peer sr-only" />
              <span className="size-4 shrink-0 rounded-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-700">{agreed ? <img src={imgCheckboxOn} alt="" width={16} height={16} className="block size-4" /> : <span className="block size-4 rounded-sm border border-slate-300 bg-white" />}</span>
              I agree to the terms of use, instructor terms and privacy
            </label>
            <div className="mt-10 flex w-full justify-center gap-8">
              <button type="button" onClick={exit} className={`${secondaryButton} border-secondary-600 hover:bg-secondary-50`}>
                Decline
              </button>
              <button type="button" disabled={!agreed} onClick={() => go(0)} className={primaryButton}>
                Accept
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
