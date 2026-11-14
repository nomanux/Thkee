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
import { ArrowReloadHorizontalIcon, ArrowRight01Icon, Cancel01Icon, CancelCircleIcon, Idea01Icon, Tick02Icon, CheckmarkCircle02Icon, Clock01Icon, HelpCircleIcon, RepeatIcon } from "@hugeicons/core-free-icons"

export type QuizResult = { correct: number; total: number; minutes: number; answers?: (number | null)[] }

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

// Pass mark for a quiz lesson. Below this the lesson stays open on the path and the learner is asked to retake it.
export const PASS_MARK = 0.7

type QuizDraft = { index: number; picked: (number | null)[]; submitted: boolean[]; elapsed: number }

export function readQuizDraft(key?: string): QuizDraft | null {
  if (!key) return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as QuizDraft) : null
  } catch {
    return null
  }
}

export function clearQuizDraft(key?: string) {
  if (!key) return
  try {
    localStorage.removeItem(key)
  } catch {}
}

export function QuizRunner({
  onFinish,
  onExit,
  draftKey,
}: {
  onFinish: (result: QuizResult) => void
  onExit: () => void
  // Where unfinished answers are saved, so "Save and exit" can resume later.
  draftKey?: string
}) {
  const questions = questionBank
  const draft = useMemo(() => {
    const d = readQuizDraft(draftKey)
    return d && d.picked?.length === questions.length ? d : null
  }, [draftKey, questions.length])
  const [index, setIndex] = useState(draft?.index ?? 0)
  const [picked, setPicked] = useState<(number | null)[]>(() => draft?.picked ?? questions.map(() => null))
  const [submitted, setSubmitted] = useState<boolean[]>(() => draft?.submitted ?? questions.map(() => false))
  const [hint, setHint] = useState(false)
  const started = useRef(Date.now() - (draft?.elapsed ?? 0))
  const topRef = useRef<HTMLDivElement>(null)

  const q = questions[index]
  const choice = picked[index]
  const isSubmitted = submitted[index]
  const isCorrect = choice === q.answer
  const answered = submitted.filter(Boolean).length
  // Next question still to answer, going forward and wrapping round, so skipped ones come back at the end.
  const nextOpen = (from: number) => {
    for (let step = 1; step <= questions.length; step++) {
      const i = (from + step) % questions.length
      if (!submitted[i] && i !== from) return i
    }
    return null
  }
  const upcoming = nextOpen(index)
  const allDone = answered === questions.length

  // Keep a draft so leaving never loses answers.
  useEffect(() => {
    if (!draftKey) return
    try {
      localStorage.setItem(draftKey, JSON.stringify({ index, picked, submitted, elapsed: Date.now() - started.current }))
    } catch {}
  }, [draftKey, index, picked, submitted])

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "start" })
    setHint(false)
  }, [index])

  const finish = () => {
    const correct = questions.filter((qq, i) => submitted[i] && picked[i] === qq.answer).length
    clearQuizDraft(draftKey)
    onFinish({
      correct,
      total: questions.length,
      minutes: Math.max(1, Math.round((Date.now() - started.current) / 60000)),
      answers: picked,
    })
  }

  const check = () => {
    if (choice === null) return setHint(true)
    setSubmitted((s) => s.map((v, i) => (i === index ? true : v)))
  }

  const advance = () => {
    if (allDone) return finish()
    const n = nextOpen(index)
    if (n !== null) setIndex(n)
  }

  const pick = (i: number) => {
    if (isSubmitted) return
    setHint(false)
    setPicked((p) => p.map((v, j) => (j === index ? i : v)))
  }

  // Keyboard: A to D (or 1 to 4) picks an answer, Enter checks or moves on.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      const pos = "abcd".indexOf(k) >= 0 ? "abcd".indexOf(k) : "1234".indexOf(k)
      if (pos >= 0 && pos < q.options.length) {
        e.preventDefault()
        pick(pos)
      } else if (e.key === "Enter" && !(t && t.tagName === "BUTTON")) {
        e.preventDefault()
        if (isSubmitted) advance()
        else check()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const kbd = `rounded-md border px-1.5 py-px text-11 leading-4 ${fontMedium}`

  return (
    <div ref={topRef} className="flex min-h-dvh-minus-64 scroll-mt-18 flex-col bg-slate-50 md:min-h-dvh-minus-72">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 pb-10 pt-6 md:pt-10">
        {/* Top row: leave (answers are kept), one segment per question, and the count. */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onExit}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg py-1 pr-2 text-13 text-slate-600 transition hover:text-slate-900 ${fontMedium}`}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} aria-hidden="true" />
            Save and exit
          </button>
          <ol className="flex min-w-0 flex-1 gap-1" aria-label="Questions">
            {questions.map((qq, i) => {
              const done = submitted[i]
              const right = done && picked[i] === qq.answer
              const now = i === index
              return (
                <li key={i} className="flex-1">
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Question ${i + 1}${done ? (right ? ", correct" : ", not correct") : ""}`}
                    aria-current={now ? "step" : undefined}
                    className={`block h-1.5 w-full rounded-full transition ${
                      done ? (right ? "bg-primary-700" : "bg-secondary-500") : now ? "bg-white ring-2 ring-primary-700" : "bg-slate-200 hover:bg-slate-300"
                    }`}
                  />
                </li>
              )
            })}
          </ol>
          <span className={`shrink-0 text-13 tabular-nums text-slate-600 ${fontMedium}`}>
            {index + 1} of {questions.length}
          </span>
        </div>

        <div key={index} className="fade-up flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-2">
            <span className={`text-xs uppercase tracking-wider text-primary-700 ${fontSemi}`}>Pick one answer</span>
            <h2 className={`m-0 text-xl leading-snug text-slate-900 md:text-2xl ${fontSemi}`}>{q.q}</h2>
          </div>

          <div role="radiogroup" aria-label="Answer options" className="flex flex-col gap-2.5">
            {q.options.map((opt, i) => {
              const selected = choice === i
              const showRight = isSubmitted && i === q.answer
              const showMine = isSubmitted && selected && !isCorrect
              const dim = isSubmitted && !showRight && !showMine
              return (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={isSubmitted}
                  onClick={() => pick(i)}
                  className={`group flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition disabled:cursor-default ${
                    showRight
                      ? "border-primary-700 bg-primary-50"
                      : showMine
                        ? "border-secondary-500 bg-secondary-50"
                        : selected
                          ? "border-primary-700 bg-primary-50 ring-1 ring-primary-700"
                          : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-25"
                  } ${dim ? "opacity-55" : ""}`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-13 transition ${fontSemi} ${
                      showRight
                        ? "bg-primary-700 text-white"
                        : showMine
                          ? "bg-secondary-500 text-slate-900"
                          : selected
                            ? "bg-primary-700 text-white"
                            : "border border-slate-300 text-slate-600 group-hover:border-slate-500"
                    }`}
                  >
                    {letters[i]}
                  </span>
                  <span className={`min-w-0 flex-1 text-15 leading-6 ${selected || showRight ? `text-slate-900 ${fontMedium}` : `text-slate-700 ${fontRegular}`}`}>{opt}</span>
                  {showRight && (
                    <span className={`flex shrink-0 items-center gap-1 text-13 text-primary-700 ${fontSemi}`}>
                      <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={2.2} aria-hidden="true" />
                      Right answer
                    </span>
                  )}
                  {showMine && <span className={`shrink-0 text-13 text-secondary-800 ${fontSemi}`}>Your answer</span>}
                </button>
              )
            })}
          </div>

          {isSubmitted && (
            <div className={`fade-up flex gap-3 rounded-xl px-4 py-4 ${isCorrect ? "bg-primary-50" : "bg-secondary-50"}`} role="status">
              <span
                aria-hidden="true"
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${isCorrect ? "bg-primary-700 text-white" : "bg-secondary-100 text-secondary-800"}`}
              >
                <HugeiconsIcon icon={isCorrect ? Tick02Icon : Idea01Icon} size={17} strokeWidth={2} />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <p className={`m-0 text-15 text-slate-900 ${fontSemi}`}>
                  {isCorrect ? "Correct" : `Not quite. The answer is ${letters[q.answer]}.`}
                </p>
                <p className={`m-0 text-sm leading-6 text-slate-600 ${fontRegular}`}>{q.explain}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-150 pt-5">
            <div className="min-h-5">
              {!isSubmitted && upcoming !== null && (
                <button type="button" onClick={() => setIndex(upcoming)} className={`text-sm text-slate-600 underline-offset-2 transition hover:text-slate-900 hover:underline ${fontMedium}`}>
                  Skip for now
                </button>
              )}
              {hint && <span className={`ml-3 text-sm text-secondary-800 ${fontMedium}`}>Pick an answer first</span>}
            </div>
            <button
              type="button"
              onClick={isSubmitted ? advance : check}
              className={`${buttonClass("primary", "lg")} group/go`}
            >
              {isSubmitted ? (allDone ? "See results" : "Continue") : "Check answer"}
              <span className={`${kbd} border-white/30 text-white/80`}>Enter</span>
            </button>
          </div>
        </div>

        <p className={`text-center text-xs text-slate-500 ${fontRegular}`}>
          Tip: press <span className={`${kbd} border-slate-300 text-slate-600`}>A</span> to <span className={`${kbd} border-slate-300 text-slate-600`}>D</span> to pick an answer. Your answers are saved as you go.
        </p>
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
  draftKey,
}: {
  title: string
  questions: number
  draftKey?: string
  result?: QuizResult
  // Optional rules from the instructor, shown before the learner starts.
  instructions?: { text: string; html: string }
  onStart: () => void
  onNext?: () => void
}) {
  const pct = result ? Math.round((result.correct / result.total) * 100) : 0
  const passed = !!result && pct >= PASS_MARK * 100
  const passPct = Math.round(PASS_MARK * 100)
  const draft = readQuizDraft(draftKey)
  const draftAnswered = draft ? draft.submitted.filter(Boolean).length : 0
  const missed = result?.answers ? questionBank.map((qq, i) => ({ qq, i, mine: result.answers![i] })).filter((m) => m.mine !== m.qq.answer) : []
  const minutesEstimate = Math.max(1, Math.round(questions * 0.5))
  const verdict = passed
    ? pct >= 90
      ? { title: "Excellent work", body: "You passed. This lesson is now complete on your path." }
      : { title: "You passed", body: "This lesson is now complete on your path." }
    : { title: "Not passed yet", body: `You need ${passPct}% to complete this lesson. Look over the questions below, then retake the quiz.` }
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
        {result && <span className={`text-13 ${passed ? "text-primary-700" : "text-secondary-800"} ${fontRegular}`}>{passed ? "Passed" : "Not passed yet"}</span>}
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
                      stroke={passed ? "var(--color-primary-700)" : "var(--color-secondary-500)"}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(pct / 100) * ring} ${ring}`}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <span className={`text-3xl tabular-nums text-slate-900 ${fontHeading}`}>{pct}%</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className={`text-xs uppercase tracking-wider text-primary-700 ${fontSemi}`}>Your result · pass mark {passPct}%</span>
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

              {missed.length > 0 && (
                <section className="flex flex-col gap-3" aria-label="Questions to review">
                  <h3 className={`m-0 text-base text-slate-900 ${fontSemi}`}>Questions to review ({missed.length})</h3>
                  <ol className="flex flex-col divide-y divide-slate-150 rounded-xl border border-slate-200">
                    {missed.map(({ qq, i, mine }) => (
                      <li key={i} className="flex flex-col gap-1.5 px-4 py-4">
                        <p className={`m-0 text-15 leading-6 text-slate-900 ${fontMedium}`}>
                          <span className="mr-1.5 tabular-nums text-slate-500">{i + 1}.</span>
                          {qq.q}
                        </p>
                        <p className={`m-0 text-sm leading-5 text-secondary-800 ${fontRegular}`}>
                          Your answer: {mine === null || mine === undefined ? "Skipped" : `${letters[mine]}. ${qq.options[mine]}`}
                        </p>
                        <p className={`m-0 text-sm leading-5 text-primary-700 ${fontMedium}`}>
                          Right answer: {letters[qq.answer]}. {qq.options[qq.answer]}
                        </p>
                        <p className={`m-0 text-sm leading-6 text-slate-600 ${fontRegular}`}>{qq.explain}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    clearQuizDraft(draftKey)
                    onStart()
                  }}
                  className={buttonClass(passed ? "secondary" : "primary", "lg")}
                >
                  <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={17} strokeWidth={1.8} aria-hidden="true" />
                  Retake quiz
                </button>
                {onNext && (
                  <button type="button" onClick={onNext} className={`${buttonClass(passed ? "primary" : "secondary", "lg")} group/nx`}>
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
                    { icon: CheckmarkCircle02Icon, label: `Pass mark ${passPct}%` },
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

                <div className="flex flex-wrap items-center gap-4">
                  <button type="button" onClick={onStart} className={`${buttonClass("primary", "lg")} group/st`}>
                    {draft ? "Continue quiz" : "Start quiz"}
                    <HugeiconsIcon icon={ArrowRight01Icon} size={17} strokeWidth={2} className="transition-transform group-hover/st:translate-x-0.5" aria-hidden="true" />
                  </button>
                  {draft && (
                    <span className={`flex items-center gap-3 text-sm text-slate-600 ${fontRegular}`}>
                      {draftAnswered} of {questions} answered
                      <button
                        type="button"
                        onClick={() => {
                          clearQuizDraft(draftKey)
                          onStart()
                        }}
                        className={`text-slate-600 underline underline-offset-2 transition hover:text-slate-900 ${fontMedium}`}
                      >
                        Start over
                      </button>
                    </span>
                  )}
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
