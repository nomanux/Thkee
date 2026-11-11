import { useEffect, useMemo, useRef, useState } from "react"
import { NoteBody } from "./Notes"
import {
  fontBold,
  fontHeading,
  fontMedium,
  fontRegular,
  fontSemi,
} from "../fonts"

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
      className="flex min-h-[calc(100dvh-64px)] scroll-mt-[72px] flex-col bg-white md:min-h-[calc(100dvh-72px)]"
    >
      <div className="mx-auto w-full max-w-[800px] flex-1 px-4 pb-10 pt-8 md:px-8 md:pt-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onExit}
            className={`flex items-center gap-1.5 text-[14px] text-[#64748b] hover:text-[#0f172a] ${fontMedium}`}
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
          <p className={`text-[14px] text-[#64748b] ${fontMedium}`}>
            Question {index + 1} of {questions.length}
          </p>
          <span className="w-[72px]" aria-hidden="true" />
        </div>

        <h2
          key={index}
          className={`fade-up m-0 text-[18px] leading-[1.5] text-[#0f172a] md:text-[19px] ${fontSemi}`}
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
                className={`flex w-full items-center gap-3.5 rounded-[8px] border px-4 py-2.5 text-left text-[14px] transition ${fontRegular} ${
                  showRight
                    ? "border-[#86efac] bg-[#f0fdf4] text-[#14532d]"
                    : showWrong
                      ? "border-[#fca5a5] bg-[#fef2f2] text-[#7f1d1d]"
                      : selected
                        ? "border-transparent bg-[#f1f5f9] text-[#0f172a]"
                        : "border-transparent text-[#1e293b] hover:bg-[#f8fafc]"
                } disabled:cursor-default`}
              >
                <span
                  className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                    selected ? "border-[#1e293b]" : "border-[#cbd5e1]"
                  }`}
                >
                  {selected && (
                    <span className="size-2 rounded-full bg-[#1e293b]" />
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
            className={`fade-up mt-8 flex gap-3 rounded-[6px] border-l-4 px-5 py-4 ${
              isCorrect
                ? "border-[#16a34a] bg-[#f0fdf4]"
                : "border-[#ef4444] bg-[#fef2f2]"
            }`}
          >
            <span
              className={`mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full text-[13px] text-white ${
                isCorrect ? "bg-[#16a34a]" : "bg-[#dc2626]"
              } ${fontBold}`}
            >
              {isCorrect ? "✓" : "✕"}
            </span>
            <div>
              <p
                className={`text-[17px] ${
                  isCorrect ? "text-[#15803d]" : "text-[#b91c1c]"
                } ${fontSemi}`}
              >
                {isCorrect ? "Correct answer" : "Wrong answer"}
              </p>
              <p
                className={`mt-1 text-[14px] leading-[24px] text-[#1e293b] ${fontRegular}`}
              >
                {q.explain}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-[#e2e8f0] bg-white">
        <div className="mx-auto w-full max-w-[800px] px-4 pb-5 pt-5 md:px-8">
          <div
            className={`flex items-center justify-between text-[14px] text-[#334155] ${fontRegular}`}
          >
            <span>Progress</span>
            <span>{percent}% Complete</span>
          </div>
          <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-[#e2e8f0]">
            <div
              className="h-full rounded-full bg-[#12b981] transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-5 grid grid-cols-3 items-center gap-3">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className={`h-[42px] justify-self-start rounded-[6px] bg-[#f1f5f9] px-4 text-[15px] text-[#1e293b] transition hover:bg-[#e2e8f0] disabled:opacity-40 ${fontMedium}`}
            >
              Previous
            </button>
            {!isSubmitted ? (
              <button
                type="button"
                onClick={submit}
                disabled={choice === null}
                className={`h-[42px] justify-self-center rounded-[6px] px-8 text-[15px] text-white transition disabled:cursor-not-allowed disabled:bg-[#94a3b8] ${
                  choice === null ? "" : "bg-[#1e293b] hover:bg-[#0f172a]"
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
              className={`h-[42px] justify-self-end rounded-[6px] bg-[#ffb20d] px-6 text-[15px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}
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
  const message =
    pct >= 80
      ? "🎉 Great Job!"
      : pct >= 50
        ? "👍 Good effort!"
        : "💪 Keep practising!"
  const stats = useMemo(
    () =>
      result
        ? [
            {
              value: result.correct,
              label: "Correct",
              color: "text-[#16a34a]",
            },
            {
              value: result.total - result.correct,
              label: "Incorrect",
              color: "text-[#dc2626]",
            },
            {
              value: result.total,
              label: "Total Marks",
              color: "text-[#f59e0b]",
            },
            {
              value: result.minutes,
              label: result.minutes === 1 ? "Minute" : "Minutes",
              color: "text-[#0284c7]",
            },
          ]
        : [],
    [result],
  )

  return (
    <div className="bg-gradient-to-b from-[#0050c8] via-[#0a6be0] to-[#0f2f6a]">
      <p
        className={`bg-[#003a8c] px-4 py-3 text-[16px] text-white md:text-[18px] ${fontRegular}`}
      >
        {title}
      </p>
      <div className="p-3 md:p-4">
        <div className="fade-up rounded-[10px] bg-white px-5 py-8 md:px-10 md:py-10">
          {result ? (
            <>
              <h2
                className={`m-0 text-center text-[24px] text-[#0f172a] md:text-[30px] ${fontHeading}`}
                style={{ fontVariationSettings: '"wdth" 100' }}
              >
                🎯 Your Quiz Performance
              </h2>
              <div className="mt-8 flex flex-col items-center gap-8 md:flex-row md:gap-12">
                <div className="flex shrink-0 flex-col items-center gap-4">
                  <span
                    className={`flex size-[150px] items-center justify-center rounded-full bg-[#0b4fd6] text-[46px] text-white shadow-[0_12px_30px_rgba(11,79,214,0.35)] md:size-[166px] md:text-[52px] ${fontHeading}`}
                  >
                    {pct}%
                  </span>
                  <p className={`text-[16px] text-[#0f172a] ${fontSemi}`}>
                    {message}
                  </p>
                  <div className="h-[7px] w-[180px] overflow-hidden rounded-full bg-[#e2e8f0]">
                    <div
                      className="h-full rounded-full bg-[#12b981]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
                  {stats.map((s) => (
                    <div
                      key={s.label}
                      className="flex flex-col items-center justify-center gap-1 rounded-[16px] border border-[#e2e8f0] px-3 py-6 text-center"
                    >
                      <span className={`text-[22px] ${s.color} ${fontBold}`}>
                        {s.value}
                      </span>
                      <span
                        className={`text-[14px] text-[#64748b] ${fontRegular}`}
                      >
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <button
                  type="button"
                  onClick={onStart}
                  className={`flex h-[38px] items-center gap-2 rounded-[6px] bg-[#f1f5f9] px-3.5 text-[14px] text-[#1e293b] transition hover:bg-[#e2e8f0] ${fontMedium}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-[18px]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M4 12a8 8 0 108-8H8M8 4L5 7l3 3" />
                  </svg>
                  Retake Quiz
                </button>
                {onNext && (
                  <button
                    type="button"
                    onClick={onNext}
                    className={`flex h-[38px] items-center gap-2 rounded-[6px] bg-[#ffb20d] px-3.5 text-[14px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}
                  >
                    Go to next
                    <svg
                      viewBox="0 0 24 24"
                      className="size-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <span className="text-[44px]">📝</span>
              <h2
                className={`m-0 text-[24px] text-[#0f172a] md:text-[28px] ${fontHeading}`}
              >
                Ready for the quiz?
              </h2>
              <p
                className={`max-w-[460px] text-[14px] leading-[22px] text-[#475569] ${fontRegular}`}
              >
                {questions} questions on UI/UX design. Pick an answer, submit to
                see if you’re right, and read the short explanation before
                moving on.
              </p>
              {instructions && (instructions.html || instructions.text.trim()) && (
                <div className="mt-2 w-full max-w-[560px] rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] px-5 py-4 text-left">
                  <p className={`m-0 text-[12px] uppercase tracking-[0.08em] text-[#64748b] ${fontSemi}`}>
                    Before you start
                  </p>
                  <NoteBody note={instructions} className="mt-2" tone="text-[#334155]" />
                </div>
              )}
              <button
                type="button"
                onClick={onStart}
                className={`mt-2 h-[42px] rounded-[6px] bg-[#ffb20d] px-6 text-[15px] text-[#1e293b] transition hover:bg-[#faa104] ${fontSemi}`}
              >
                Start quiz
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const QUIZ_LENGTH = questionBank.length
