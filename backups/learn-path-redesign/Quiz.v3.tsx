import { useEffect, useMemo, useRef, useState } from "react"
import { NoteBody } from "./Notes"
import {
  fontBold,
  fontHeading,
  fontMedium,
  fontRegular,
  fontSemi,
} from "../fonts"
import { buttonClass } from "./Button"
import { HugeiconsIcon } from "@hugeicons/react"
import ChecklistBoard from "./liniqo/ChecklistBoard"
import { ArrowReloadHorizontalIcon, ArrowRight01Icon, CancelCircleIcon, CheckmarkCircle02Icon, Clock01Icon, HelpCircleIcon, RepeatIcon } from "@hugeicons/core-free-icons"

export type QuizResult = { correct: number; total: number; minutes: number }

type Question = { q: string; options: string[]; answer: number; explain: string }

const questionBank: Question[] = [
  {
    q: "Which of the following features is unique to Figma compared to Sketch?",
    options: [
      "Real-time multiplayer collaboration in the browser",
      "Vector editing tools",
      "Reusable symbols and components",
      "Exporting assets as PNG",
    ],
    answer: 0,
    explain:
      "Figma stands out for its real-time design and collaboration features, allowing multiple users to work on the same file simultaneously — something Sketch lacks natively.",
  },
  {
    q: "What is the main goal of a usability test?",
    options: [
      "To check how attractive the visual design is",
      "To see whether real users can complete key tasks easily",
      "To measure how fast the website loads",
      "To collect users’ favourite colours",
    ],
    answer: 1,
    explain:
      "Usability testing observes real users trying to complete tasks, so you can find where they struggle and fix those problems.",
  },
  {
    q: "A persona in UX design is…",
    options: [
      "A real customer’s private profile",
      "A fictional character that represents a key user group",
      "The brand mascot used in marketing",
      "A list of every feature in the product",
    ],
    answer: 1,
    explain:
      "Personas are research-based, fictional users that help the team keep real needs, goals and pain points in mind.",
  },
  {
    q: "What does a wireframe mainly communicate?",
    options: [
      "Final colours and typography",
      "Layout, structure and content hierarchy",
      "The production source code",
      "The marketing budget",
    ],
    answer: 1,
    explain:
      "Wireframes are low-fidelity layouts that focus on structure and hierarchy before visual details are added.",
  },
  {
    q: "Which WCAG contrast ratio is the minimum for normal body text (level AA)?",
    options: ["2:1", "3:1", "4.5:1", "10:1"],
    answer: 2,
    explain:
      "WCAG 2.1 AA requires at least 4.5:1 contrast for normal text and 3:1 for large text.",
  },
  {
    q: "In Figma, what is Auto Layout used for?",
    options: [
      "Automatically choosing brand colours",
      "Creating frames that resize and space their content dynamically",
      "Exporting code to React",
      "Translating text into other languages",
    ],
    answer: 1,
    explain:
      "Auto Layout lets frames grow, shrink and space their children automatically, much like CSS flexbox.",
  },
  {
    q: "What does Fitts’s Law tell us about interface targets?",
    options: [
      "Users read in an F-shaped pattern",
      "Larger, closer targets are faster and easier to hit",
      "Users can only remember seven items",
      "Colour affects emotion",
    ],
    answer: 1,
    explain:
      "Fitts’s Law says the time to reach a target depends on its size and distance — make important buttons big and close.",
  },
  {
    q: "Which is the best example of a design system?",
    options: [
      "A single screenshot of the home page",
      "A shared library of components, tokens and usage guidelines",
      "A list of competitor apps",
      "A moodboard on Pinterest",
    ],
    answer: 1,
    explain:
      "A design system is a shared set of reusable components, design tokens and rules that keeps products consistent.",
  },
  {
    q: "What is information architecture (IA)?",
    options: [
      "The physical layout of the design office",
      "How content is organised, labelled and connected",
      "The server setup behind a website",
      "The choice of fonts and icons",
    ],
    answer: 1,
    explain:
      "IA is about structuring and labelling content so people can find what they need and understand where they are.",
  },
  {
    q: "Card sorting is mainly used to…",
    options: [
      "Test the speed of animations",
      "Understand how users group and label content",
      "Choose a brand colour palette",
      "Print business cards",
    ],
    answer: 1,
    explain:
      "In card sorting, participants group topics into categories, which reveals how they expect content to be organised.",
  },
  {
    q: "Which principle says similar elements should look and behave the same way?",
    options: ["Consistency", "Scarcity", "Serial position effect", "Anchoring"],
    answer: 0,
    explain:
      "Consistency reduces the effort users need to learn an interface — similar things should look and work alike.",
  },
  {
    q: "What is the purpose of a high-fidelity prototype?",
    options: [
      "To replace user research",
      "To simulate the final look and interactions for testing and hand-off",
      "To document the database",
      "To estimate hosting costs",
    ],
    answer: 1,
    explain:
      "High-fidelity prototypes look and behave close to the real product, so you can test details and hand off to developers.",
  },
  {
    q: "Hick’s Law suggests that…",
    options: [
      "More choices make decisions take longer",
      "Users always scroll to the bottom",
      "Bigger fonts are always better",
      "Animations should be slow",
    ],
    answer: 0,
    explain:
      "Hick’s Law: decision time grows with the number and complexity of choices, so simplify options where you can.",
  },
  {
    q: "Mobile-first design means…",
    options: [
      "Designing only for mobile phones",
      "Starting with the smallest screen, then enhancing for larger ones",
      "Building the app before the website",
      "Using only touch gestures",
    ],
    answer: 1,
    explain:
      "Mobile-first starts with the most constrained layout and core content, then progressively adds for bigger screens.",
  },
  {
    q: "Which is the most useful metric from a usability test task?",
    options: [
      "Task success rate",
      "Number of colours used",
      "Font file size",
      "Logo width",
    ],
    answer: 0,
    explain:
      "Task success rate shows whether users could actually complete the task — the core measure of usability.",
  },
]

const letters = ["A", "B", "C", "D"]

export function QuizRunner({
  onFinish,
  onExit,
}: {
  onFinish: (result: QuizResult) => void
  onExit: () => void
}) {
  const questions = questionBank
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<(number | null)[]>(() =>
    questions.map(() => null),
  )
  const [submitted, setSubmitted] = useState<boolean[]>(() =>
    questions.map(() => false),
  )
  const started = useRef(Date.now())
  const topRef = useRef<HTMLDivElement>(null)

  const q = questions[index]
  const choice = picked[index]
  const isSubmitted = submitted[index]
  const isCorrect = choice === q.answer
  const answeredCount = submitted.filter(Boolean).length
  const percent = Math.round((answeredCount / questions.length) * 100)
  const last = index === questions.length - 1

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "start" })
  }, [index])

  const finish = () => {
    const correct = questions.filter(
      (qq, i) => submitted[i] && picked[i] === qq.answer,
    ).length
    onFinish({
      correct,
      total: questions.length,
      minutes: Math.max(1, Math.round((Date.now() - started.current) / 60000)),
    })
  }

  const submit = () => {
    if (choice === null) return
    setSubmitted((s) => s.map((v, i) => (i === index ? true : v)))
  }

  return (
    <div
      ref={topRef}
      className="flex min-h-dvh-minus-64 scroll-mt-18 flex-col bg-white md:min-h-dvh-minus-72"
    >
      <div className="mx-auto w-full max-w-200 flex-1 px-4 pb-10 pt-8 md:px-8 md:pt-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onExit}
            className={`flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 ${fontMedium}`}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
            Exit quiz
          </button>
          <p className={`text-sm text-slate-500 ${fontMedium}`}>
            Question {index + 1} of {questions.length}
          </p>
          <span className="w-18" aria-hidden="true" />
        </div>

        <h2
          key={index}
          className={`fade-up m-0 text-lg leading-normal text-slate-900 md:text-19 ${fontSemi}`}
        >
          {index + 1}. {q.q}
        </h2>

        <div
          role="radiogroup"
          aria-label="Answer options"
          className="mt-6 flex flex-col gap-2"
        >
          {q.options.map((opt, i) => {
            const selected = choice === i
            const showRight = isSubmitted && i === q.answer
            const showWrong = isSubmitted && selected && !isCorrect
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={isSubmitted}
                onClick={() =>
                  setPicked((p) => p.map((v, j) => (j === index ? i : v)))
                }
                className={`flex w-full items-center gap-3.5 rounded-lg border px-4 py-2.5 text-left text-sm transition ${fontRegular} ${
                  showRight
                    ? "border-green-300 bg-primary-50 text-green-900"
                    : showWrong
                      ? "border-red-300 bg-red-50 text-red-900"
                      : selected
                        ? "border-transparent bg-slate-150 text-slate-900"
                        : "border-transparent text-slate-800 hover:bg-slate-25"
                } disabled:cursor-default`}
              >
                <span
                  className={`flex size-4.5 shrink-0 items-center justify-center rounded-full border-2 ${
                    selected ? "border-slate-800" : "border-slate-300"
                  }`}
                >
                  {selected && (
                    <span className="size-2 rounded-full bg-slate-800" />
                  )}
                </span>
                <span>
                  {letters[i]}. {opt}
                </span>
              </button>
            )
          })}
        </div>

        {isSubmitted && (
          <div
            className={`fade-up mt-8 flex gap-3 rounded-md border-l-4 px-5 py-4 ${
              isCorrect
                ? "border-green-600 bg-primary-50"
                : "border-red-500 bg-red-50"
            }`}
          >
            <span
              className={`mt-0.5 flex size-5.5 shrink-0 items-center justify-center rounded-full text-13 text-white ${
                isCorrect ? "bg-green-600" : "bg-red-600"
              } ${fontBold}`}
            >
              {isCorrect ? "✓" : "✕"}
            </span>
            <div>
              <p
                className={`text-17 ${
                  isCorrect ? "text-green-700" : "text-red-700"
                } ${fontSemi}`}
              >
                {isCorrect ? "Correct answer" : "Wrong answer"}
              </p>
              <p
                className={`mt-1 text-sm leading-6 text-slate-800 ${fontRegular}`}
              >
                {q.explain}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-200 px-4 pb-5 pt-5 md:px-8">
          <div
            className={`flex items-center justify-between text-sm text-slate-700 ${fontRegular}`}
          >
            <span>Progress</span>
            <span>{percent}% Complete</span>
          </div>
          <div className="mt-2 h-1.25 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-5 grid grid-cols-3 items-center gap-3">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className={`h-10.5 justify-self-start rounded-md bg-slate-150 px-4 text-15 text-slate-800 transition hover:bg-slate-200 disabled:opacity-40 ${fontMedium}`}
            >
              Previous
            </button>
            {!isSubmitted ? (
              <button
                type="button"
                onClick={submit}
                disabled={choice === null}
                className={`h-10.5 justify-self-center rounded-md px-8 text-15 text-white transition disabled:cursor-not-allowed disabled:bg-slate-400 ${
                  choice === null ? "" : "bg-slate-800 hover:bg-slate-900"
                } ${fontMedium}`}
              >
                Submit
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => (last ? finish() : setIndex((i) => i + 1))}
              className={`${buttonClass("yellow", "lg")} justify-self-end`}
            >
              {last ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Demo rules for the start screen. Instructors write their own in the quiz editor (Instructions).
export const DEMO_QUIZ_INSTRUCTIONS = {
  text: "",
  html: "<ol><li>Read each question carefully before you answer.</li><li>Answer on your own. Do not use AI tools or search the internet.</li><li>Some questions have more than one correct answer. Tick every one that applies.</li><li>Finish every required question before you submit.</li></ol>",
}

export function QuizPanel({
  title,
  questions,
  result,
  instructions,
  onStart,
  onNext,
}: {
  title: string
  questions: number
  result?: QuizResult
  // Optional rules from the instructor, shown before the learner starts.
  instructions?: { text: string; html: string }
  onStart: () => void
  onNext?: () => void
}) {
  const pct = result ? Math.round((result.correct / result.total) * 100) : 0
  const minutesEstimate = Math.max(1, Math.round(questions * 0.5))
  const verdict =
    pct >= 80
      ? { title: "Great work", body: "You have a strong grip on this chapter." }
      : pct >= 50
        ? { title: "Good effort", body: "Retake the quiz to lift your score." }
        : { title: "Keep practising", body: "Go back over the lessons in this chapter and retake the quiz." }
  const stats = result
    ? [
        { label: "Correct", value: result.correct, icon: CheckmarkCircle02Icon, tone: "text-primary-700" },
        { label: "Incorrect", value: result.total - result.correct, icon: CancelCircleIcon, tone: "text-red-600" },
        { label: "Questions", value: result.total, icon: HelpCircleIcon, tone: "text-slate-600" },
        { label: result.minutes === 1 ? "Minute" : "Minutes", value: result.minutes, icon: Clock01Icon, tone: "text-slate-600" },
      ]
    : []
  // Ring for the score: circumference of r=52 is about 326.7.
  const ring = 326.7

  return (
    <div className="border-b border-slate-200 bg-slate-50">
      {/* Same light toolbar as the article reader, so every lesson type feels like one product. */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5 md:px-8">
        <span className={`flex items-center gap-1.5 text-13 text-slate-600 ${fontMedium}`}>
          <HugeiconsIcon icon={HelpCircleIcon} size={16} strokeWidth={1.8} className="text-primary-700" aria-hidden="true" />
          Quiz · {questions} questions
        </span>
        {result && <span className={`text-13 text-primary-700 ${fontRegular}`}>Completed</span>}
      </div>

      <div className="px-4 py-6 md:px-8 md:py-10">
        <div className="fade-up mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {result ? (
            <div className="flex flex-col gap-8 p-6 md:p-10">
              <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
                <div className="relative flex size-32 shrink-0 items-center justify-center">
                  <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-slate-150)" strokeWidth="10" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke={pct >= 50 ? "var(--color-primary-700)" : "var(--color-secondary-500)"}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(pct / 100) * ring} ${ring}`}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <span className={`text-3xl tabular-nums text-slate-900 ${fontHeading}`}>{pct}%</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className={`text-xs uppercase tracking-wider text-primary-700 ${fontSemi}`}>Your result</span>
                  <h2 className={`m-0 text-2xl text-slate-900 md:text-28 ${fontHeading}`}>{verdict.title}</h2>
                  <p className={`m-0 text-base leading-6 text-slate-600 ${fontRegular}`}>
                    You answered {result.correct} of {result.total} questions correctly. {verdict.body}
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="flex flex-col gap-1 bg-white px-4 py-4">
                    <dt className={`flex items-center gap-1.5 text-13 text-slate-500 ${fontRegular}`}>
                      <HugeiconsIcon icon={s.icon} size={15} strokeWidth={1.8} className={s.tone} aria-hidden="true" />
                      {s.label}
                    </dt>
                    <dd className={`m-0 text-2xl tabular-nums text-slate-900 ${fontSemi}`}>{s.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-6">
                <button type="button" onClick={onStart} className={buttonClass("secondary", "lg")}>
                  <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={17} strokeWidth={1.8} aria-hidden="true" />
                  Retake quiz
                </button>
                {onNext && (
                  <button type="button" onClick={onNext} className={`${buttonClass("primary", "lg")} group/nx`}>
                    Next lesson
                    <HugeiconsIcon icon={ArrowRight01Icon} size={17} strokeWidth={2} className="transition-transform group-hover/nx:translate-x-0.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-5">
              <div className="flex flex-col gap-6 p-6 md:col-span-3 md:p-10">
                <div className="flex flex-col gap-2">
                  <span className={`text-xs uppercase tracking-wider text-primary-700 ${fontSemi}`}>Check your understanding</span>
                  <h2 dir="auto" className={`m-0 text-start text-2xl leading-tight tracking-tight text-slate-900 md:text-3xl ${fontHeading}`}>
                    {title}
                  </h2>
                </div>

                <ul className="flex flex-wrap gap-2">
                  {[
                    { icon: HelpCircleIcon, label: `${questions} questions` },
                    { icon: Clock01Icon, label: `About ${minutesEstimate} min` },
                    { icon: RepeatIcon, label: "Retake any time" },
                  ].map((f) => (
                    <li key={f.label} className={`flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-13 text-slate-600 ${fontMedium}`}>
                      <HugeiconsIcon icon={f.icon} size={15} strokeWidth={1.8} className="text-slate-500" aria-hidden="true" />
                      {f.label}
                    </li>
                  ))}
                </ul>

                {instructions && (instructions.html || instructions.text.trim()) && (
                  <div className="border-t border-slate-200 pt-5">
                    <p className={`m-0 text-13 text-slate-900 ${fontSemi}`}>Before you start</p>
                    <NoteBody note={instructions} className="mt-3 text-sm leading-6" tone="text-slate-600" />
                  </div>
                )}

                <div>
                  <button type="button" onClick={onStart} className={`${buttonClass("primary", "lg")} group/st`}>
                    Start quiz
                    <HugeiconsIcon icon={ArrowRight01Icon} size={17} strokeWidth={2} className="transition-transform group-hover/st:translate-x-0.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="hidden items-center justify-center overflow-hidden border-l border-slate-200 bg-primary-50 p-4 md:col-span-2 md:flex">
                {/* Liniqo Live figure: rows tick themselves off as the pointer moves over the board. */}
                <ChecklistBoard className="w-full scale-125" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const QUIZ_LENGTH = questionBank.length
