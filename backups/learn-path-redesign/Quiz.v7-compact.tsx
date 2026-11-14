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
import { ArrowReloadHorizontalIcon, ArrowRight01Icon, Cancel01Icon, CancelCircleIcon, Flag02Icon, MinusSignIcon, UserIcon, Idea01Icon, Tick02Icon, CheckmarkCircle02Icon, Clock01Icon, HelpCircleIcon, RepeatIcon } from "@hugeicons/core-free-icons"

export type QuizResult = { correct: number; total: number; minutes: number; seconds?: number; timedOut?: boolean; answers?: (number | null)[] }

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
// Time limit the instructor set for this quiz, in minutes. 0 means no limit. Demo value until the quiz editor saves it.
export const QUIZ_TIME_LIMIT_MIN = 10

type QuizDraft = { index: number; picked: (number | null)[]; flagged?: boolean[]; elapsed: number }
export type QuizAttempt = { correct: number; total: number; seconds: number; at: number }

const readJson = <T,>(key?: string): T | null => {
  if (!key) return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
export const readQuizDraft = (key?: string) => readJson<QuizDraft>(key)
export function clearQuizDraft(key?: string) {
  if (!key) return
  try {
    localStorage.removeItem(key)
  } catch {}
}
// Every finished try is kept, so the result screen can show progress across attempts.
const attemptsKey = (draftKey?: string) => (draftKey ? `${draftKey}.attempts` : undefined)
export const readAttempts = (draftKey?: string) => readJson<QuizAttempt[]>(attemptsKey(draftKey)) ?? []
const saveAttempt = (draftKey: string | undefined, a: QuizAttempt) => {
  const key = attemptsKey(draftKey)
  if (!key) return
  try {
    localStorage.setItem(key, JSON.stringify([...readAttempts(draftKey), a].slice(-20)))
  } catch {}
}

const clockText = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.max(0, Math.floor(sec % 60))).padStart(2, "0")}`

// DEMO cohort: stand-in for other learners' results on this quiz until the backend sends real ones.
// Deterministic, so the numbers don't jump between visits.
const cohort = (() => {
  const first = ["Sara", "Omar", "Layla", "Yousef", "Noura", "Fahad", "Huda", "Khalid", "Reem", "Ali", "Mona", "Tariq"]
  const initials = "ABDFGHJKMNRSTZ"
  let seed = 7
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
  return Array.from({ length: 48 }, (_, i) => {
    const correct = Math.min(15, Math.max(4, Math.round(6 + rand() * 9)))
    return { name: `${first[i % first.length]} ${initials[Math.floor(i / first.length) * 3 % initials.length + (i % 3)]}.`, correct, seconds: Math.round(200 + rand() * 380) }
  })
})()

export function QuizRunner({
  onFinish,
  onExit,
  draftKey,
  timeLimit = QUIZ_TIME_LIMIT_MIN,
}: {
  onFinish: (result: QuizResult) => void
  onExit: () => void
  // Where unfinished answers are saved, so "Save and exit" can resume later.
  draftKey?: string
  // Minutes. 0 or less means no time limit.
  timeLimit?: number
}) {
  const questions = questionBank
  const draft = useMemo(() => {
    const d = readQuizDraft(draftKey)
    return d && d.picked?.length === questions.length ? d : null
  }, [draftKey, questions.length])
  const limit = timeLimit > 0 ? timeLimit * 60 : 0
  const [index, setIndex] = useState(draft?.index ?? 0)
  const [picked, setPicked] = useState<(number | null)[]>(() => draft?.picked ?? questions.map(() => null))
  const [flagged, setFlagged] = useState<boolean[]>(() => draft?.flagged ?? questions.map(() => false))
  const [reviewing, setReviewing] = useState(false)
  // Time only runs while the quiz is open; leaving with "Save and exit" pauses it.
  const [elapsed, setElapsed] = useState(draft?.elapsed ?? 0)
  const finished = useRef(false)
  const topRef = useRef<HTMLDivElement>(null)

  const q = questions[index]
  const choice = picked[index]
  const answered = picked.filter((p) => p !== null).length
  const unanswered = questions.length - answered
  const flaggedCount = flagged.filter(Boolean).length
  const remaining = limit ? Math.max(0, limit - elapsed) : 0
  const last = index === questions.length - 1

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!draftKey || finished.current) return
    try {
      localStorage.setItem(draftKey, JSON.stringify({ index, picked, flagged, elapsed }))
    } catch {}
  }, [draftKey, index, picked, flagged, elapsed])

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "start" })
  }, [index, reviewing])

  const submit = (timedOut = false) => {
    if (finished.current) return
    finished.current = true
    const correct = questions.filter((qq, i) => picked[i] === qq.answer).length
    const seconds = limit ? Math.min(elapsed, limit) : elapsed
    clearQuizDraft(draftKey)
    saveAttempt(draftKey, { correct, total: questions.length, seconds, at: Date.now() })
    onFinish({ correct, total: questions.length, minutes: Math.max(1, Math.round(seconds / 60)), seconds, answers: picked, timedOut })
  }

  // Time is up: hand in whatever is answered.
  useEffect(() => {
    if (limit && elapsed >= limit) submit(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, limit])

  const pick = (i: number) => setPicked((p) => p.map((v, j) => (j === index ? i : v)))
  const toggleFlag = () => setFlagged((f) => f.map((v, j) => (j === index ? !v : v)))
  const goNext = () => (last ? setReviewing(true) : setIndex((i) => i + 1))
  const goPrev = () => setIndex((i) => Math.max(0, i - 1))
  const open = (i: number) => {
    setReviewing(false)
    setIndex(i)
  }

  // Keyboard: A to D picks, arrows move, F flags, Enter goes on.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey || reviewing) return
      const k = e.key.toLowerCase()
      const pos = "abcd".indexOf(k) >= 0 ? "abcd".indexOf(k) : "1234".indexOf(k)
      if (pos >= 0 && pos < q.options.length) {
        e.preventDefault()
        pick(pos)
      } else if (k === "f") {
        e.preventDefault()
        toggleFlag()
      } else if (e.key === "ArrowRight" || (e.key === "Enter" && !(t && t.tagName === "BUTTON"))) {
        e.preventDefault()
        goNext()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        goPrev()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const kbd = `rounded-md border px-1.5 py-px text-11 leading-4 ${fontMedium}`
  const lowTime = limit > 0 && remaining <= 60

  return (
    <div ref={topRef} className="flex min-h-dvh-minus-64 scroll-mt-18 flex-col bg-slate-50 md:min-h-dvh-minus-72">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 pb-10 pt-6 md:pt-10">
        {/* Top row: leave (answers and time are kept), one segment per question, and the clock. */}
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
            {questions.map((_, i) => {
              const now = i === index && !reviewing
              return (
                <li key={i} className="flex-1">
                  <button
                    type="button"
                    onClick={() => open(i)}
                    aria-label={`Question ${i + 1}${picked[i] !== null ? ", answered" : ", not answered"}${flagged[i] ? ", flagged" : ""}`}
                    aria-current={now ? "step" : undefined}
                    className={`block h-1.5 w-full rounded-full transition ${
                      flagged[i] ? "bg-secondary-500" : picked[i] !== null ? "bg-primary-700" : "bg-slate-200 hover:bg-slate-300"
                    } ${now ? "ring-2 ring-primary-700 ring-offset-2 ring-offset-slate-50" : ""}`}
                  />
                </li>
              )
            })}
          </ol>
          {limit > 0 ? (
            <span
              role="timer"
              aria-label={`${clockText(remaining)} left`}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-13 tabular-nums ${fontSemi} ${lowTime ? "bg-secondary-100 text-secondary-800" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}
            >
              <HugeiconsIcon icon={Clock01Icon} size={15} strokeWidth={1.8} aria-hidden="true" />
              {clockText(remaining)}
            </span>
          ) : (
            <span className={`shrink-0 text-13 tabular-nums text-slate-600 ${fontMedium}`}>{answered} of {questions.length}</span>
          )}
        </div>

        {reviewing ? (
          <div className="fade-up flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-2">
              <span className={`text-xs uppercase tracking-wider text-primary-700 ${fontSemi}`}>Before you submit</span>
              <h2 className={`m-0 text-2xl leading-snug text-slate-900 ${fontSemi}`}>Review your answers</h2>
              <p className={`m-0 text-sm leading-6 text-slate-600 ${fontRegular}`}>
                {answered} answered · {unanswered} not answered · {flaggedCount} flagged. Open any question to change it.
              </p>
            </div>
            <ol className="grid grid-cols-5 gap-2 sm:grid-cols-8" aria-label="All questions">
              {questions.map((_, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => open(i)}
                    className={`relative flex h-12 w-full items-center justify-center rounded-xl border text-sm tabular-nums transition ${fontSemi} ${
                      picked[i] !== null ? "border-primary-700 bg-primary-50 text-primary-800 hover:bg-primary-100" : "border-dashed border-slate-300 text-slate-500 hover:border-slate-500"
                    }`}
                  >
                    {i + 1}
                    {flagged[i] && <span aria-label="flagged" className="absolute right-1.5 top-1.5 size-2 rounded-full bg-secondary-500" />}
                  </button>
                </li>
              ))}
            </ol>
            <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 ${fontRegular}`}>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary-700" />Answered</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-dashed border-slate-400" />Not answered</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-secondary-500" />Flagged</span>
            </div>
            {unanswered > 0 && (
              <p className={`m-0 rounded-xl bg-secondary-50 px-4 py-3 text-sm leading-6 text-secondary-900 ${fontRegular}`}>
                {unanswered === 1 ? "1 question is" : `${unanswered} questions are`} not answered and will count as wrong.
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-150 pt-5">
              <button type="button" onClick={() => open(index)} className={buttonClass("secondary", "lg")}>
                Back to questions
              </button>
              <button type="button" onClick={() => submit(false)} className={buttonClass("primary", "lg")}>
                Submit quiz
              </button>
            </div>
          </div>
        ) : (
          <div key={index} className="fade-up flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <span className={`text-xs uppercase tracking-wider text-primary-700 ${fontSemi}`}>
                  Question {index + 1} of {questions.length}
                </span>
                <button
                  type="button"
                  onClick={toggleFlag}
                  aria-pressed={flagged[index]}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-13 transition ${fontMedium} ${
                    flagged[index] ? "bg-secondary-100 text-secondary-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <HugeiconsIcon icon={Flag02Icon} size={15} strokeWidth={1.8} aria-hidden="true" />
                  {flagged[index] ? "Flagged" : "Flag for review"}
                </button>
              </div>
              <h2 className={`m-0 text-xl leading-snug text-slate-900 md:text-2xl ${fontSemi}`}>{q.q}</h2>
            </div>

            <div role="radiogroup" aria-label="Answer options" className="flex flex-col gap-2.5">
              {q.options.map((opt, i) => {
                const selected = choice === i
                return (
                  <button
                    key={opt}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => pick(i)}
                    className={`group flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition ${
                      selected ? "border-primary-700 bg-primary-50 ring-1 ring-primary-700" : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-25"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-13 transition ${fontSemi} ${
                        selected ? "bg-primary-700 text-white" : "border border-slate-300 text-slate-600 group-hover:border-slate-500"
                      }`}
                    >
                      {letters[i]}
                    </span>
                    <span className={`min-w-0 flex-1 text-15 leading-6 ${selected ? `text-slate-900 ${fontMedium}` : `text-slate-700 ${fontRegular}`}`}>{opt}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-150 pt-5">
              {index > 0 ? (
                <button type="button" onClick={goPrev} className={buttonClass("ghost", "lg")}>
                  Previous
                </button>
              ) : (
                <span />
              )}
              <button type="button" onClick={goNext} className={buttonClass("primary", "lg")}>
                {last ? "Review answers" : choice === null ? "Next" : "Save and next"}
                <span className={`${kbd} border-white/30 text-white/80`}>Enter</span>
              </button>
            </div>
          </div>
        )}

        <p className={`text-center text-xs text-slate-500 ${fontRegular}`}>
          Press <span className={`${kbd} border-slate-300 text-slate-600`}>A</span> to <span className={`${kbd} border-slate-300 text-slate-600`}>D</span> to answer and{" "}
          <span className={`${kbd} border-slate-300 text-slate-600`}>F</span> to flag. You see your marks after you submit.
        </p>
      </div>
    </div>
  )
}

// Demo rules for the start screen. Instructors write their own in the quiz editor (Instructions).
export const DEMO_QUIZ_INSTRUCTIONS = {
  text: "",
  html: "<ol><li>Answer every question, then review your answers and submit once.</li><li>You see your marks and the right answers after you submit.</li><li>The timer keeps running while the quiz is open. When it runs out, your answers are submitted.</li><li>Answer on your own. Do not use AI tools or search the internet.</li></ol>",
}

export function QuizPanel({
  title,
  questions,
  result,
  instructions,
  onStart,
  onNext,
  draftKey,
  timeLimit = QUIZ_TIME_LIMIT_MIN,
}: {
  title: string
  questions: number
  draftKey?: string
  timeLimit?: number
  result?: QuizResult
  // Optional rules from the instructor, shown before the learner starts.
  instructions?: { text: string; html: string }
  onStart: () => void
  onNext?: () => void
}) {
  const [onlyMissed, setOnlyMissed] = useState(true)
  const [tab, setTab] = useState<"overview" | "answers">("overview")
  const pct = result ? Math.round((result.correct / result.total) * 100) : 0
  const passed = !!result && pct >= PASS_MARK * 100
  const passPct = Math.round(PASS_MARK * 100)
  const draft = readQuizDraft(draftKey)
  const draftAnswered = draft ? draft.picked.filter((p) => p !== null).length : 0
  const saved = readAttempts(draftKey)
  // Always show at least the current try, even if the history was cleared.
  const attempts = saved.length || !result ? saved : [{ correct: result.correct, total: result.total, seconds: result.seconds ?? result.minutes * 60, at: 0 }]
  const best = attempts.length ? Math.max(...attempts.map((a) => Math.round((a.correct / a.total) * 100))) : null
  const seconds = result?.seconds ?? (result ? result.minutes * 60 : 0)

  // Compare with the (demo) cohort: share of learners you beat, average time, and your place on the board.
  const beat = result ? Math.round((cohort.filter((c) => c.correct < result.correct || (c.correct === result.correct && c.seconds > seconds)).length / cohort.length) * 100) : 0
  const avgSeconds = Math.round(cohort.reduce((s, c) => s + c.seconds, 0) / cohort.length)
  const board = result
    ? [...cohort.map((c) => ({ ...c, me: false })), { name: "You", correct: result.correct, seconds, me: true }].sort((a, b) => b.correct - a.correct || a.seconds - b.seconds)
    : []
  const myRank = board.findIndex((b) => b.me) + 1
  const topRows = board.slice(0, 3)

  const review = result?.answers
    ? questionBank.map((qq, i) => ({ qq, i, mine: result.answers![i] })).filter((m) => !onlyMissed || m.mine !== m.qq.answer)
    : []
  const skippedCount = result?.answers ? result.answers.filter((a) => a === null || a === undefined).length : 0
  const wrongCount = result ? result.total - result.correct - skippedCount : 0
  const missedCount = result?.answers ? questionBank.filter((qq, i) => result.answers![i] !== qq.answer).length : 0
  const prevAttempt = attempts.length >= 2 ? attempts[attempts.length - 2] : null
  const change = prevAttempt && result ? pct - Math.round((prevAttempt.correct / prevAttempt.total) * 100) : null
  const minutesEstimate = timeLimit > 0 ? timeLimit : Math.max(1, Math.round(questions * 0.5))
  const verdict = passed
    ? pct >= 90
      ? { title: "Excellent work", body: "You passed. This lesson is now complete on your path." }
      : { title: "You passed", body: "This lesson is now complete on your path." }
    : { title: "Not passed yet", body: `You need ${passPct}% to complete this lesson. Open Review answers to see what you missed, then retake the quiz.` }
  const stats = result
    ? [
        { label: "Correct", value: String(result.correct), icon: CheckmarkCircle02Icon, tone: "text-primary-700" },
        { label: "Not correct", value: String(result.total - result.correct), icon: CancelCircleIcon, tone: "text-secondary-700" },
        { label: "Questions", value: String(result.total), icon: HelpCircleIcon, tone: "text-slate-600" },
        { label: "Time taken", value: clockText(seconds), icon: Clock01Icon, tone: "text-slate-600" },
      ]
    : []
  // Ring for the score: circumference of r=52 is about 326.7.
  const ring = 326.7
  const sectionTitle = `m-0 text-base text-slate-900 ${fontSemi}`

  return (
    <div className="border-b border-slate-200 bg-slate-50">
      {/* Same light toolbar as the article reader, so every lesson type feels like one product. */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5 md:px-8">
        <span className={`flex items-center gap-1.5 text-13 text-slate-600 ${fontMedium}`}>
          <HugeiconsIcon icon={HelpCircleIcon} size={16} strokeWidth={1.8} className="text-primary-700" aria-hidden="true" />
          Quiz · {questions} questions{timeLimit > 0 ? ` · ${timeLimit} min` : ""}
        </span>
        {result && <span className={`text-13 ${passed ? "text-primary-700" : "text-secondary-800"} ${fontRegular}`}>{passed ? "Passed" : "Not passed yet"}</span>}
      </div>

      <div className={`px-4 md:px-8 ${result ? "py-4 md:py-6" : "py-6 md:py-10"}`}>
        <div className="fade-up mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {result ? (
            <div className="flex flex-col gap-5 p-5 md:p-7">
              <div className="flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
                <div className="relative flex size-24 shrink-0 items-center justify-center">
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
                  <span className={`text-2xl tabular-nums text-slate-900 ${fontHeading}`}>{pct}%</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className={`text-xs uppercase tracking-wider text-primary-700 ${fontSemi}`}>Your result · pass mark {passPct}%</span>
                  <h2 className={`m-0 text-2xl text-slate-900 ${fontHeading}`}>{verdict.title}</h2>
                  <p className={`m-0 text-base leading-6 text-slate-600 ${fontRegular}`}>
                    You answered {result.correct} of {result.total} questions correctly{result.timedOut ? " before the time ran out" : ""}. {verdict.body}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 md:ml-auto md:flex-col md:items-stretch">
                  <button
                    type="button"
                    onClick={() => {
                      clearQuizDraft(draftKey)
                      onStart()
                    }}
                    className={buttonClass(passed ? "secondary" : "primary", "md")}
                  >
                    <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={17} strokeWidth={1.8} aria-hidden="true" />
                    Retake quiz
                  </button>
                  {onNext && (
                    <button type="button" onClick={onNext} className={`${buttonClass(passed ? "primary" : "secondary", "md")} group/nx`}>
                      Next lesson
                      <HugeiconsIcon icon={ArrowRight01Icon} size={17} strokeWidth={2} className="transition-transform group-hover/nx:translate-x-0.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="flex flex-col gap-1 bg-white px-4 py-3">
                    <dt className={`flex items-center gap-1.5 text-13 text-slate-500 ${fontRegular}`}>
                      <HugeiconsIcon icon={s.icon} size={15} strokeWidth={1.8} className={s.tone} aria-hidden="true" />
                      {s.label}
                    </dt>
                    <dd className={`m-0 text-xl tabular-nums text-slate-900 ${fontSemi}`}>{s.value}</dd>
                  </div>
                ))}
              </dl>

              {/* Two views keep the result short: the summary first, the full answer review one click away. */}
              <div role="tablist" aria-label="Result views" className="flex gap-1 border-b border-slate-200">
                {[
                  { id: "overview" as const, label: "Overview" },
                  { id: "answers" as const, label: `Review answers${missedCount ? ` · ${missedCount} missed` : ""}` },
                ].map((t) => {
                  const on = tab === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => setTab(t.id)}
                      className={`relative -mb-px border-b-2 px-3 pb-2.5 pt-1 outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-primary-700 text-15 transition ${on ? `border-primary-700 text-slate-900 ${fontSemi}` : `border-transparent text-slate-500 hover:text-slate-900 ${fontMedium}`}`}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>

              {tab === "overview" ? (
                <>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* How you compare with other learners on this quiz. */}
                    <section className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4" aria-label="How you compare">
                      <h3 className={sectionTitle}>How you compare</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-2xl tabular-nums text-slate-900 ${fontSemi}`}>{beat}%</span>
                          <span className={`text-13 leading-5 text-slate-500 ${fontRegular}`}>of learners scored lower than you</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-2xl tabular-nums text-slate-900 ${fontSemi}`}>{clockText(avgSeconds)}</span>
                          <span className={`text-13 leading-5 text-slate-500 ${fontRegular}`}>average time · yours {clockText(seconds)}</span>
                        </div>
                      </div>
                      <ol className="flex flex-col" aria-label="Leaderboard">
                        {topRows.map((r, i) => (
                          <li key={`${r.name}-${i}`} className={`flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-sm ${r.me ? "bg-primary-50" : ""}`}>
                            <span className={`w-5 text-center tabular-nums text-slate-500 ${fontSemi}`}>{i + 1}</span>
                            <span className={`flex-1 ${r.me ? `text-primary-800 ${fontSemi}` : `text-slate-700 ${fontRegular}`}`}>{r.name}</span>
                            <span className={`tabular-nums text-slate-600 ${fontRegular}`}>{clockText(r.seconds)}</span>
                            <span className={`w-12 text-right tabular-nums text-slate-900 ${fontSemi}`}>{Math.round((r.correct / result.total) * 100)}%</span>
                          </li>
                        ))}
                        {myRank > 3 && (
                          <>
                            <li aria-hidden="true" className="px-2.5 text-slate-300">⋯</li>
                            <li className="flex items-center gap-3 rounded-lg bg-primary-50 px-2.5 py-1.5 text-sm">
                              <span className={`w-5 text-center tabular-nums text-slate-500 ${fontSemi}`}>{myRank}</span>
                              <span className={`flex-1 text-primary-800 ${fontSemi}`}>You</span>
                              <span className={`tabular-nums text-slate-600 ${fontRegular}`}>{clockText(seconds)}</span>
                              <span className={`w-12 text-right tabular-nums text-slate-900 ${fontSemi}`}>{pct}%</span>
                            </li>
                          </>
                        )}
                      </ol>
                      <span className={`text-xs text-slate-500 ${fontRegular}`}>Ranked by score, then by time. You are #{myRank} of {board.length}.</span>
                    </section>

                    {/* Progress across tries, so a retake has a clear goal. */}
                    <section className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4" aria-label="Your progress">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className={sectionTitle}>Your progress</h3>
                        {change !== null && (
                          <span className={`text-13 tabular-nums ${change >= 0 ? "text-primary-700" : "text-secondary-800"} ${fontSemi}`}>
                            {change >= 0 ? "+" : ""}
                            {change} points since last try
                          </span>
                        )}
                      </div>
                      <div className="flex h-20 items-end gap-3 border-b border-slate-200 pb-0">
                        {attempts.slice(-6).map((a, i, arr) => {
                          const p = Math.round((a.correct / a.total) * 100)
                          const latest = i === arr.length - 1
                          return (
                            <div key={a.at} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                              <span className={`text-xs tabular-nums ${latest ? `text-slate-900 ${fontSemi}` : `text-slate-500 ${fontRegular}`}`}>{p}%</span>
                              <span
                                className={`w-full max-w-10 rounded-t-md ${latest ? (p >= passPct ? "bg-primary-700" : "bg-secondary-500") : "bg-slate-200"}`}
                                style={{ height: `${Math.max(4, p)}%` }}
                              />
                            </div>
                          )
                        })}
                      </div>
                      <div className={`flex justify-between text-xs text-slate-500 ${fontRegular}`}>
                        <span>{attempts.length === 1 ? "First try" : `${attempts.length} tries`}</span>
                        <span>Best {best ?? pct}% · pass mark {passPct}%</span>
                      </div>
                      <p className={`m-0 text-sm leading-6 text-slate-600 ${fontRegular}`}>
                        {passed
                          ? "Retake any time to beat your best score or your time."
                          : `${Math.max(0, Math.ceil(PASS_MARK * result.total) - result.correct)} more correct answers will get you to the pass mark.`}
                      </p>
                    </section>
                  </div>
                </>
              ) : (
                result.answers && (
                  <section className="flex flex-col gap-5" aria-label="Answers">
                    {/* At a glance: one tile per question, coloured by outcome. Click to jump to it. */}
                    <div className="flex flex-col gap-3">
                      <ol className="grid grid-cols-8 gap-1.5 sm:grid-cols-15" aria-label="Every question">
                        {questionBank.map((qq, i) => {
                          const mine = result.answers![i]
                          const state = mine === null || mine === undefined ? "none" : mine === qq.answer ? "right" : "wrong"
                          return (
                            <li key={i}>
                              <a
                                href={`#quiz-review-${i}`}
                                onClick={(e) => {
                                  e.preventDefault()
                                  if (state === "right" && onlyMissed) setOnlyMissed(false)
                                  setTimeout(() => document.getElementById(`quiz-review-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0)
                                }}
                                aria-label={`Question ${i + 1}: ${state === "right" ? "correct" : state === "wrong" ? "wrong" : "not answered"}`}
                                className={`flex h-9 items-center justify-center gap-0.5 rounded-lg text-13 tabular-nums transition ${fontSemi} ${
                                  state === "right"
                                    ? "bg-primary-700 text-white hover:bg-primary-800"
                                    : state === "wrong"
                                      ? "bg-secondary-100 text-secondary-900 ring-1 ring-inset ring-secondary-500 hover:bg-secondary-200"
                                      : "border border-dashed border-slate-300 text-slate-500 hover:border-slate-500"
                                }`}
                              >
                                {i + 1}
                              </a>
                            </li>
                          )
                        })}
                      </ol>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 ${fontRegular}`}>
                          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary-700" />Correct ({result.correct})</span>
                          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-secondary-100 ring-1 ring-inset ring-secondary-500" />Wrong ({wrongCount})</span>
                          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-dashed border-slate-400" />Not answered ({skippedCount})</span>
                        </div>
                        <div className="flex rounded-lg border border-slate-200 p-0.5" role="group" aria-label="Show">
                          {[
                            { label: "Missed", on: onlyMissed },
                            { label: "All", on: !onlyMissed },
                          ].map((b) => (
                            <button
                              key={b.label}
                              type="button"
                              aria-pressed={b.on}
                              onClick={() => setOnlyMissed(b.label === "Missed")}
                              className={`rounded-md px-3 py-1 text-13 transition ${b.on ? `bg-slate-900 text-white ${fontSemi}` : `text-slate-600 hover:text-slate-900 ${fontMedium}`}`}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {review.length > 0 ? (
                      <ol className="flex flex-col gap-4">
                        {review.map(({ qq, i, mine }) => {
                          const none = mine === null || mine === undefined
                          const right = mine === qq.answer
                          return (
                            <li key={i} id={`quiz-review-${i}`} className="scroll-mt-24 rounded-xl border border-slate-200 p-4">
                              <div className="flex items-start gap-3">
                                <span
                                  aria-hidden="true"
                                  className={`flex size-7 shrink-0 items-center justify-center rounded-full ${right ? "bg-primary-700 text-white" : none ? "bg-slate-100 text-slate-500" : "bg-secondary-500 text-slate-900"}`}
                                >
                                  <HugeiconsIcon icon={right ? Tick02Icon : none ? MinusSignIcon : Cancel01Icon} size={15} strokeWidth={2.4} />
                                </span>
                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                  <span className={`text-xs uppercase tracking-wider ${right ? "text-primary-700" : none ? "text-slate-500" : "text-secondary-800"} ${fontSemi}`}>
                                    Question {i + 1} · {right ? "Correct" : none ? "Not answered" : "Wrong"}
                                  </span>
                                  <p className={`m-0 text-base leading-6 text-slate-900 ${fontSemi}`}>{qq.q}</p>
                                </div>
                              </div>
                              <ul className="mt-4 flex flex-col gap-2 sm:pl-10">
                                {qq.options.map((opt, oi) => {
                                  const isRight = oi === qq.answer
                                  const isMine = oi === mine
                                  return (
                                    <li
                                      key={oi}
                                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                                        isRight ? "border-primary-700 bg-primary-50" : isMine ? "border-secondary-500 bg-secondary-50" : "border-slate-150 text-slate-500"
                                      }`}
                                    >
                                      <span
                                        aria-hidden="true"
                                        className={`flex size-6 shrink-0 items-center justify-center rounded-md text-xs ${fontSemi} ${
                                          isRight ? "bg-primary-700 text-white" : isMine ? "bg-secondary-500 text-slate-900" : "border border-slate-200 text-slate-500"
                                        }`}
                                      >
                                        {letters[oi]}
                                      </span>
                                      <span className={`min-w-0 flex-1 text-sm leading-5 ${isRight || isMine ? `text-slate-900 ${fontMedium}` : fontRegular}`}>{opt}</span>
                                      {isMine && (
                                        <span
                                          className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs ${fontSemi} ${isRight ? "bg-primary-700 text-white" : "bg-secondary-500 text-slate-900"}`}
                                        >
                                          <HugeiconsIcon icon={UserIcon} size={12} strokeWidth={2.2} aria-hidden="true" />
                                          Your answer
                                        </span>
                                      )}
                                      {isRight && !isMine && (
                                        <span className={`flex shrink-0 items-center gap-1 text-xs text-primary-700 ${fontSemi}`}>
                                          <HugeiconsIcon icon={Tick02Icon} size={14} strokeWidth={2.4} aria-hidden="true" />
                                          Right answer
                                        </span>
                                      )}
                                    </li>
                                  )
                                })}
                              </ul>
                              <div className="mt-3 flex gap-2.5 rounded-lg bg-slate-50 px-3 py-3 sm:ml-10">
                                <HugeiconsIcon icon={Idea01Icon} size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-secondary-700" aria-hidden="true" />
                                <p className={`m-0 text-sm leading-6 text-slate-600 ${fontRegular}`}>{qq.explain}</p>
                              </div>
                            </li>
                          )
                        })}
                      </ol>
                    ) : (
                      <p className={`m-0 rounded-xl bg-primary-50 px-4 py-3 text-sm text-primary-800 ${fontMedium}`}>You answered every question correctly.</p>
                    )}
                  </section>
                )
              )}

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
                    { icon: Clock01Icon, label: timeLimit > 0 ? `${minutesEstimate} min time limit` : `About ${minutesEstimate} min` },
                    { icon: CheckmarkCircle02Icon, label: `Pass mark ${passPct}%` },
                    { icon: RepeatIcon, label: best !== null ? `Best ${best}% · ${attempts.length} ${attempts.length === 1 ? "try" : "tries"}` : "Retake any time" },
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
                      {draftAnswered} of {questions} answered{timeLimit > 0 ? ` · ${clockText(Math.max(0, timeLimit * 60 - draft.elapsed))} left` : ""}
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
