import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Doc01Icon,
  Download04Icon,
  File02Icon,
  GoBackward10SecIcon,
  Megaphone01Icon,
  NoteAddIcon,
  Pdf01Icon,
  PlayIcon,
  Search01Icon,
  SentIcon,
  Shield01Icon,
  SparklesIcon,
  StarIcon,
  Target02Icon,
  Tick02Icon,
  Txt01Icon,
  Xls01Icon,
  Zip01Icon,
} from "@hugeicons/core-free-icons"
import { fontFor, fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts"
import { buttonClass } from "./Button"

/* Demo learning content for a lesson: chapters, transcript, checkpoints, key points.
   Real courses would load these from the instructor's lesson data. */

export type LessonInfo = { key: string; title: string; kind: string; minutes: number }
export type Chapter = { index: number; title: string; start: number; end: number }
export type TranscriptLine = { sec: number; en: string; ar: string; chapter: number }
export type Checkpoint = { id: string; chapter: number; question: string; options: string[]; answer: number; rewatchAt: number }
export type CheckResult = { correct: boolean }

const headingStyle = { fontVariationSettings: '"wdth" 100' }

export const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`

function Icon({ icon, size = 18, className = "" }: { icon: IconSvgElement; size?: number; className?: string }) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.8} aria-hidden="true" className={`shrink-0 ${className}`} />
}

const CHAPTER_TITLES = ["Why it matters", "Key ideas", "Worked example", "Common mistakes"]
const CHAPTER_WEIGHTS = [3, 4, 5, 3]

export function buildChapters(lesson: LessonInfo): Chapter[] {
  const count = lesson.minutes >= 12 ? 4 : lesson.minutes >= 6 ? 3 : 2
  const titles = count === 2 ? ["Key ideas", "Worked example"] : count === 3 ? CHAPTER_TITLES.slice(0, 3) : CHAPTER_TITLES
  const weights = count === 2 ? [1, 1] : CHAPTER_WEIGHTS.slice(0, count)
  const total = weights.reduce((a, b) => a + b, 0)
  const duration = lesson.minutes * 60
  let start = 0
  return titles.map((title, index) => {
    const end = index === count - 1 ? duration : Math.round(start + (weights[index] / total) * duration)
    const chapter = { index, title, start, end }
    start = end
    return chapter
  })
}

const PHRASES: [string, string][] = [
  ["Welcome. Here is what this lesson covers and why it matters.", "مرحبًا. إليك ما يغطيه هذا الدرس ولماذا هو مهم."],
  ["Let's start with the core idea before we touch any tools.", "لنبدأ بالفكرة الأساسية قبل أن نستخدم أي أداة."],
  ["You will use this in almost every project, so take your time.", "ستستخدم هذا في كل مشروع تقريبًا، لذا خذ وقتك."],
  ["Pay attention to the details here. They change the result.", "انتبه إلى التفاصيل هنا، فهي تغيّر النتيجة."],
  ["Let me show you a quick example, step by step.", "دعني أريك مثالًا سريعًا، خطوة بخطوة."],
  ["Notice how this connects to what we covered earlier.", "لاحظ كيف يرتبط هذا بما شرحناه سابقًا."],
  ["Here is a common mistake people make, and how to avoid it.", "إليك خطأ شائعًا يقع فيه كثيرون، وكيف تتجنبه."],
  ["Keep it simple first. Add detail only when you need it.", "ابدأ بالبساطة، وأضف التفاصيل فقط عند الحاجة."],
  ["Practise this on your own before you move forward.", "تدرّب على هذا بنفسك قبل أن تنتقل إلى ما بعده."],
  ["Compare your result with mine. Small differences are fine.", "قارن نتيجتك بنتيجتي. الفروق الصغيرة لا بأس بها."],
  ["This technique will save you a lot of time later.", "ستوفر عليك هذه الطريقة وقتًا كثيرًا لاحقًا."],
  ["Let's look at how this works in a real situation.", "لنرَ كيف يعمل هذا في موقف حقيقي."],
  ["If something fails, check the last step you changed.", "إذا فشل شيء ما، فراجع آخر خطوة غيّرتها."],
  ["Write down the one idea you want to remember from this part.", "دوّن الفكرة الواحدة التي تريد تذكرها من هذا الجزء."],
  ["That wraps up this lesson. See you in the next one.", "بهذا ينتهي هذا الدرس. أراك في الدرس التالي."],
]

export function buildTranscript(lesson: LessonInfo, chapters: Chapter[]): TranscriptLine[] {
  const duration = lesson.minutes * 60
  const count = Math.max(8, Math.min(30, Math.floor(lesson.minutes * 1.5)))
  const offset = lesson.title.length % PHRASES.length
  return Array.from({ length: count }, (_, i) => {
    const sec = Math.floor((i / count) * duration)
    const [en, ar] = i === 0 ? PHRASES[0] : i === count - 1 ? PHRASES[PHRASES.length - 1] : PHRASES[1 + ((i + offset) % (PHRASES.length - 2))]
    const chapter = Math.max(0, chapters.findIndex((c) => sec >= c.start && sec < c.end))
    return { sec, en: i === 0 ? `Welcome. This lesson is "${lesson.title}". Here is what we will cover.` : en, ar, chapter }
  })
}

const WRONG_CLAIMS = [
  "Skip the basics and go straight to advanced tools.",
  "You only need this once, so practice is not needed.",
  "Copy the example exactly and never change it.",
  "Details rarely change the result, so move fast.",
]

export function buildCheckpoints(lesson: LessonInfo, chapters: Chapter[], lines: TranscriptLine[]): Checkpoint[] {
  return chapters.map((c) => {
    const own = lines.filter((l) => l.chapter === c.index && l.sec > 0)
    const right = (own.at(-1) ?? own.at(0) ?? lines.at(1) ?? lines[0]).en
    const wrong = [WRONG_CLAIMS[(c.index + lesson.minutes) % 4], WRONG_CLAIMS[(c.index + lesson.minutes + 1) % 4]]
    const answer = (c.index + lesson.title.length) % 3
    const options = [...wrong]
    options.splice(answer, 0, right)
    return {
      id: `${lesson.key}:${c.index}`,
      chapter: c.index,
      question: `Which point did the instructor make in "${c.title}"?`,
      options,
      answer,
      rewatchAt: own.at(-1)?.sec ?? c.start,
    }
  })
}

export const lessonGoal = (lesson: LessonInfo) => `In this lesson: ${lesson.title}. Watch, then check yourself at the end of each chapter.`

export function keyPoints(lesson: LessonInfo, chapters: Chapter[]) {
  return chapters.slice(0, 3).map((c, i) =>
    [
      `Why "${lesson.title}" matters and where you will use it.`,
      `The core idea, explained in plain steps you can repeat.`,
      `A worked example you can copy, then adapt to your own work.`,
    ].at(i) ?? c.title,
  )
}

/* ---------------------------------------------------------------- checkpoint overlay */

export function CheckpointCard({
  checkpoint,
  total,
  onAnswer,
  onRewatch,
  onContinue,
}: {
  checkpoint: Checkpoint
  total: number
  onAnswer: (correct: boolean) => void
  onRewatch: () => void
  onContinue: () => void
}) {
  const [picked, setPicked] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const correct = picked === checkpoint.answer
  useEffect(() => {
    setPicked(null)
    setChecked(false)
  }, [checkpoint.id])

  const check = () => {
    if (picked === null) return
    setChecked(true)
    onAnswer(picked === checkpoint.answer)
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-slate-900/70 p-4 backdrop-blur-sm md:p-8">
      <div role="dialog" aria-label="Checkpoint" className="pop-in flex w-full max-w-lg flex-col gap-4 rounded-2xl bg-white p-5 shadow-2xl md:p-7">
        <div className="flex items-center justify-between gap-3">
          <span className={`text-xs uppercase tracking-label text-primary-700 ${fontSemi}`}>
            Checkpoint {checkpoint.chapter + 1} of {total}
          </span>
          <span className={`text-xs text-slate-500 ${fontRegular}`}>Not graded</span>
        </div>
        <p className={`m-0 text-lg leading-snug text-slate-900 md:text-xl ${fontHeading}`} style={headingStyle}>
          {checkpoint.question}
        </p>
        <div role="radiogroup" aria-label="Answer options" className="flex flex-col gap-2">
          {checkpoint.options.map((o, i) => {
            const isPicked = picked === i
            const showRight = checked && i === checkpoint.answer
            const showWrong = checked && isPicked && !correct
            return (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={isPicked}
                disabled={checked}
                onClick={() => setPicked(i)}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm leading-relaxed transition md:text-15 ${fontRegular} ${
                  showRight
                    ? "border-primary-700 bg-primary-50 text-slate-900"
                    : showWrong
                      ? "border-red-300 bg-red-50 text-slate-900"
                      : isPicked
                        ? "border-primary-700 bg-primary-50 text-slate-900 ring-1 ring-primary-700"
                        : "border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <span
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    showRight ? "border-primary-700 bg-primary-700 text-white" : showWrong ? "border-red-500 bg-red-500 text-white" : isPicked ? "border-primary-700" : "border-slate-300"
                  }`}
                >
                  {showRight && <Icon icon={Tick02Icon} size={12} />}
                  {showWrong && <Icon icon={Cancel01Icon} size={12} />}
                  {!checked && isPicked && <span className="size-2 rounded-full bg-primary-700" />}
                </span>
                {o}
              </button>
            )
          })}
        </div>

        {checked && (
          <p className={`fade-up m-0 rounded-xl px-4 py-3 text-sm leading-relaxed ${correct ? "bg-primary-50 text-primary-800" : "bg-amber-50 text-amber-900"} ${fontRegular}`}>
            {correct ? "Right. You caught the key point of this chapter." : "Not quite. Rewatch the short part that explains it, then carry on."}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {!checked ? (
            <button
              type="button"
              onClick={check}
              disabled={picked === null}
              className={`${buttonClass("yellow", "lg")}`}
            >
              Check answer
            </button>
          ) : (
            <button type="button" onClick={onContinue} className={`${buttonClass("dark", "lg")}`}>
              Continue
              <Icon icon={ArrowRight01Icon} size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={onRewatch}
            className={`${buttonClass("secondary", "lg")}`}
          >
            <Icon icon={GoBackward10SecIcon} size={16} />
            Rewatch from {clock(checkpoint.rewatchAt)}
          </button>
          {!checked && (
            <button type="button" onClick={onContinue} className={`ml-auto h-11 px-2 text-sm text-slate-500 transition hover:text-slate-900 ${fontMedium}`}>
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- transcript panel */

export function TranscriptPanel({
  lines,
  time,
  isVideo,
  onSeek,
  onSaveNote,
  onAsk,
}: {
  lines: TranscriptLine[]
  time: number
  isVideo: boolean
  onSeek: (sec: number) => void
  onSaveNote: (line: TranscriptLine) => void
  onAsk: (line: TranscriptLine) => void
}) {
  const [query, setQuery] = useState("")
  const [lang, setLang] = useState<"en" | "ar">("en")
  const activeRef = useRef<HTMLDivElement>(null)
  const activeIndex = isVideo ? lines.reduce((acc, l, i) => (l.sec <= time ? i : acc), 0) : -1
  const q = query.trim().toLowerCase()
  const shown = lines.map((l, i) => ({ ...l, i })).filter((l) => !q || l.en.toLowerCase().includes(q) || l.ar.includes(query.trim()))

  useEffect(() => {
    if (!q) activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [activeIndex, q])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex gap-2 px-4 pb-2 pt-3">
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg bg-slate-100 px-3 transition focus-within:bg-white focus-within:ring-1 focus-within:ring-slate-300">
          <Icon icon={Search01Icon} size={16} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this lesson"
            aria-label="Search transcript"
            className={`min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 md:text-sm ${fontRegular}`}
          />
        </label>
        <div role="group" aria-label="Transcript language" className="flex rounded-lg bg-slate-100 p-0.5">
          {(["en", "ar"] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={lang === l}
              onClick={() => setLang(l)}
              className={`h-9 rounded-md px-2.5 text-xs uppercase transition ${lang === l ? `bg-white text-slate-900 shadow-sm ${fontSemi}` : `text-slate-500 hover:text-slate-900 ${fontMedium}`}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto pb-3" dir={lang === "ar" ? "rtl" : "ltr"}>
        {shown.length === 0 && <p className={`px-5 py-8 text-center text-sm text-slate-500 ${fontRegular}`}>No lines match "{query}".</p>}
        {shown.map((l) => {
          const active = l.i === activeIndex
          const past = isVideo && l.i < activeIndex
          return (
            <div
              key={l.i}
              ref={active ? activeRef : undefined}
              className={`group/line border-s-3 px-4 py-2.5 transition-colors ${active ? "border-primary-700 bg-primary-50" : "border-transparent hover:bg-slate-50"}`}
            >
              <button type="button" onClick={() => onSeek(l.sec)} className="flex w-full gap-3 text-start">
                <span className={`w-9 shrink-0 pt-0.5 text-xs tabular-nums ${active ? `text-primary-700 ${fontSemi}` : `text-slate-400 ${fontMedium}`}`} dir="ltr">
                  {clock(l.sec)}
                </span>
                <span
                  className={`text-sm leading-relaxed ${active ? "text-slate-900" : past ? "text-slate-400" : "text-slate-700"} ${lang === "ar" ? fontFor(l.ar, fontRegular, "font-normal") : fontRegular}`}
                >
                  {lang === "ar" ? l.ar : l.en}
                </span>
              </button>
              <div className={`mt-2 gap-2 ps-12 ${active ? "flex" : "hidden group-hover/line:flex"}`}>
                <button
                  type="button"
                  onClick={() => onSaveNote(l)}
                  className={`${buttonClass("secondary", "md")}`}
                >
                  <Icon icon={NoteAddIcon} size={14} />
                  Save note
                </button>
                <button
                  type="button"
                  onClick={() => onAsk(l)}
                  className={`${buttonClass("secondary", "md")}`}
                >
                  <Icon icon={SparklesIcon} size={14} />
                  Ask about this
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <p className={`border-t border-slate-100 px-4 py-3 text-xs text-slate-500 ${fontRegular}`}>Press N to save a note at the current second.</p>
    </div>
  )
}

/* ---------------------------------------------------------------- ask panel (local demo tutor) */

type Msg = { id: number; from: "you" | "tutor"; text: string; at?: number; cite?: TranscriptLine; check?: string; offTopic?: boolean }

const STOP = new Set(["what", "when", "where", "which", "this", "that", "there", "their", "about", "should", "would", "could", "with", "from", "have", "does", "your", "into", "why", "how", "the", "and", "for", "you"])

function bestLine(lines: TranscriptLine[], question: string) {
  const words = question.toLowerCase().match(/[a-z]{4,}/g)?.filter((w) => !STOP.has(w)) ?? []
  let best: TranscriptLine | null = null
  let score = 0
  for (const l of lines) {
    const text = l.en.toLowerCase()
    const s = words.reduce((n, w) => n + (text.includes(w.slice(0, 5)) ? 1 : 0), 0)
    if (s > score) {
      score = s
      best = l
    }
  }
  return best
}

export function AskPanel({
  lessonTitle,
  instructor,
  lines,
  chapters,
  time,
  isVideo,
  seed,
  onSeek,
  onPostToDiscussion,
}: {
  lessonTitle: string
  instructor: string
  lines: TranscriptLine[]
  chapters: Chapter[]
  time: number
  isVideo: boolean
  seed: TranscriptLine | null
  onSeek: (sec: number) => void
  onPostToDiscussion: (question: string) => void
}) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [draft, setDraft] = useState("")
  const [thinking, setThinking] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const lastQuestion = [...messages].reverse().find((m) => m.from === "you")?.text ?? ""

  useEffect(() => {
    setMessages([])
  }, [lessonTitle])

  useEffect(() => {
    if (seed) setDraft(`Can you explain this part? "${seed.en}"`)
  }, [seed])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, thinking])

  const reply = (question: string, mode: "ask" | "simpler" | "arabic" | "example") => {
    const at = isVideo ? Math.floor(time) : undefined
    setMessages((m) => [...m, { id: Date.now(), from: "you", text: question, at }])
    setThinking(true)
    window.setTimeout(() => {
      const line = mode === "ask" ? bestLine(lines, question) : (bestLine(lines, lastQuestion || question) ?? lines.find((l) => l.sec <= time && l.sec > 0) ?? lines[1])
      const chapter = line ? chapters.at(line.chapter) : undefined
      let msg: Msg
      if (!line) {
        msg = {
          id: Date.now() + 1,
          from: "tutor",
          text: `This lesson doesn't cover that directly, so I won't guess. ${instructor} can answer it in Discussion.`,
          offTopic: true,
        }
      } else if (mode === "arabic") {
        msg = { id: Date.now() + 1, from: "tutor", text: line.ar, cite: line }
      } else if (mode === "simpler") {
        msg = {
          id: Date.now() + 1,
          from: "tutor",
          text: `In short: ${line.en} That is the heart of "${chapter?.title ?? "this part"}". Rewatch the clip, then say it back in one sentence.`,
          cite: line,
        }
      } else if (mode === "example") {
        msg = {
          id: Date.now() + 1,
          from: "tutor",
          text: `Picture a task from your own work. Apply this step to it: ${line.en.toLowerCase()} Then compare your result with the worked example in the lesson.`,
          cite: line,
        }
      } else {
        msg = {
          id: Date.now() + 1,
          from: "tutor",
          text: `The instructor covers this in "${chapter?.title ?? "this lesson"}": ${line.en}`,
          cite: line,
          check: "Check yourself: can you explain this step in your own words, without the video?",
        }
      }
      setMessages((m) => [...m, msg])
      setThinking(false)
    }, 650)
  }

  const send = (e: FormEvent) => {
    e.preventDefault()
    const q = draft.trim()
    if (!q || thinking) return
    setDraft("")
    reply(q, "ask")
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={`mx-4 mt-3 flex items-start gap-2.5 rounded-xl bg-primary-50 px-3.5 py-3 text-xs leading-relaxed text-primary-800 ${fontRegular}`}>
        <Icon icon={Shield01Icon} size={16} className="mt-0.5 text-primary-700" />
        <span>Answers come from this lesson and point you to the moment to rewatch.</span>
      </div>

      <div ref={listRef} className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col gap-3 py-2">
            <p className={`m-0 text-sm text-slate-600 ${fontRegular}`}>Stuck on something in "{lessonTitle}"? Ask in your own words.</p>
            {["What is the main idea of this lesson?", "What mistake should I avoid here?"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => reply(s, "ask")}
                className={`self-start rounded-full border border-slate-200 px-3 py-1.5 text-left text-13 text-slate-700 transition hover:border-primary-300 hover:text-primary-700 ${fontMedium}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m) =>
          m.from === "you" ? (
            <div key={m.id} className="flex max-w-11/12 flex-col items-end gap-1 self-end">
              {m.at !== undefined && <span className={`text-11 text-slate-400 ${fontRegular}`}>You, at {clock(m.at)}</span>}
              <p className={`m-0 rounded-2xl rounded-br-sm bg-slate-900 px-3.5 py-2.5 text-sm leading-relaxed text-white ${fontRegular}`}>{m.text}</p>
            </div>
          ) : (
            <div key={m.id} className="fade-up flex max-w-11/12 flex-col gap-2 self-start">
              <span className={`flex items-center gap-1.5 text-11 text-slate-400 ${fontMedium}`}>
                <span className={`flex size-4.5 items-center justify-center rounded-full bg-primary-700 text-10 text-white ${fontSemi}`}>T</span>
                Thkee tutor
              </span>
              <div className="flex flex-col gap-2.5 rounded-2xl rounded-tl-sm border border-slate-200 bg-slate-50 px-3.5 py-3">
                <p dir="auto" className={`m-0 text-start text-sm leading-relaxed text-slate-800 ${fontFor(m.text, fontRegular, "font-normal")}`}>
                  {m.text}
                </p>
                {m.cite && isVideo && (
                  <button
                    type="button"
                    onClick={() => onSeek(m.cite!.sec)}
                    className={`flex items-center gap-2 self-start rounded-lg border border-primary-200 bg-white px-2.5 py-1.5 text-xs text-primary-700 transition hover:bg-primary-50 ${fontMedium}`}
                  >
                    <Icon icon={PlayIcon} size={13} className="fill-current" />
                    Rewatch from {clock(m.cite.sec)}
                  </button>
                )}
                {m.check && <p className={`m-0 border-t border-slate-200 pt-2.5 text-13 text-slate-700 ${fontMedium}`}>{m.check}</p>}
                {m.offTopic && (
                  <button
                    type="button"
                    onClick={() => onPostToDiscussion(lastQuestion)}
                    className={`self-start rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white transition hover:bg-slate-700 ${fontMedium}`}
                  >
                    Post to Discussion
                  </button>
                )}
              </div>
            </div>
          ),
        )}
        {thinking && <span className={`self-start text-xs text-slate-400 ${fontRegular}`}>Thkee tutor is looking through the lesson…</span>}
        {messages.length > 0 && !thinking && (
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["Explain more simply", "simpler"],
                ["Explain in Arabic", "arabic"],
                ["Give an example", "example"],
              ] as const
            ).map(([label, mode]) => (
              <button
                key={mode}
                type="button"
                onClick={() => reply(label, mode)}
                className={`h-8 rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-700 transition hover:border-primary-300 hover:text-primary-700 ${fontMedium}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={send} className="flex flex-col gap-2 border-t border-slate-200 px-4 pb-4 pt-3">
        <div className="flex items-end gap-2 rounded-xl border border-slate-300 py-1.5 pe-1.5 ps-3 transition focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) send(e)
            }}
            rows={2}
            placeholder="Ask about this lesson"
            aria-label="Ask about this lesson"
            className={`min-w-0 flex-1 resize-none bg-transparent py-1.5 text-base text-slate-900 outline-none placeholder:text-slate-400 md:text-sm ${fontRegular}`}
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!draft.trim() || thinking}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-700 text-white transition hover:bg-primary-800 disabled:opacity-40"
          >
            <Icon icon={SentIcon} size={18} />
          </button>
        </div>
        <div className={`flex items-center justify-between gap-2 text-xs text-slate-500 ${fontRegular}`}>
          <span>Still stuck?</span>
          <button type="button" onClick={() => onPostToDiscussion(lastQuestion || draft)} className={`text-primary-700 transition hover:text-primary-800 ${fontSemi}`}>
            Post to Discussion for {instructor.split(" ")[0]}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ---------------------------------------------------------------- lesson section (below the video) */

// Icon and colour come from the uploaded file's extension.
function fileStyle(name: string): { icon: IconSvgElement; tone: string } {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  if (ext === "pdf") return { icon: Pdf01Icon, tone: "bg-red-50 text-red-600" }
  if (["doc", "docx"].includes(ext)) return { icon: Doc01Icon, tone: "bg-blue-50 text-blue-600" }
  if (["xls", "xlsx", "csv"].includes(ext)) return { icon: Xls01Icon, tone: "bg-emerald-50 text-emerald-600" }
  if (["zip", "rar"].includes(ext)) return { icon: Zip01Icon, tone: "bg-amber-50 text-amber-600" }
  if (ext === "txt") return { icon: Txt01Icon, tone: "bg-slate-100 text-slate-600" }
  return { icon: File02Icon, tone: "bg-slate-100 text-slate-600" }
}

export function LessonSection({
  lesson,
  chapters,
  liveSession,
  instructor,
  ratingPrompt,
  onRate,
  onRateLater,
  onSeek,
  notify,
}: {
  lesson: LessonInfo
  chapters: Chapter[]
  liveSession: boolean
  instructor: string
  ratingPrompt: boolean
  onRate: (stars: number) => void
  onRateLater: () => void
  onSeek?: (sec: number) => void
  notify: (msg: string) => void
}) {
  const [hoverStar, setHoverStar] = useState(0)
  const [downloaded, setDownloaded] = useState<string[]>([])
  useEffect(() => setDownloaded([]), [lesson.key])
  const files = [
    {
      name: `${lesson.title} checklist.pdf`,
      size: "120 KB",
    },
    {
      name: "Worked example templates.docx",
      size: "38 KB",
    },
    {
      name: "Practice examples.txt",
      size: "4 KB",
    },
  ]
  const allDone = files.every((f) => downloaded.includes(f.name))
  const points = useMemo(() => keyPoints(lesson, chapters), [lesson, chapters])
  const card = "flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5"
  const h = `m-0 text-lg text-slate-900 ${fontHeading}`

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {ratingPrompt && (
        <section className="fade-up flex flex-col gap-3 rounded-2xl border border-secondary-200 bg-secondary-50 p-5 xl:col-span-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h2 className={`m-0 text-base text-slate-900 ${fontSemi}`}>How is the course going so far?</h2>
            <p className={`m-0 text-sm text-slate-600 ${fontRegular}`}>Your rating helps other learners and tells {instructor.split(" ")[0]} what to improve.</p>
          </div>
          <div className="flex items-center gap-1" onMouseLeave={() => setHoverStar(0)}>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                aria-label={`${s} star${s > 1 ? "s" : ""}`}
                onMouseEnter={() => setHoverStar(s)}
                onClick={() => onRate(s)}
                className={`flex size-9 items-center justify-center rounded-lg transition hover:bg-white ${s <= hoverStar ? "text-secondary-500" : "text-slate-300"}`}
              >
                <Icon icon={StarIcon} size={22} className={s <= hoverStar ? "fill-current" : ""} />
              </button>
            ))}
          </div>
          <button type="button" onClick={onRateLater} className={`self-start text-sm text-slate-500 transition hover:text-slate-900 sm:self-center ${fontMedium}`}>
            Later
          </button>
        </section>
      )}

      <section className="flex flex-col gap-2.5 xl:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className={`m-0 flex items-center gap-2 text-sm text-slate-900 ${fontSemi}`}>
            Lesson materials
            <span className={`rounded-full bg-slate-100 px-2 py-0.5 text-11 tabular-nums text-slate-600 ${fontMedium}`}>{files.length}</span>
          </h2>
          <button
            type="button"
            onClick={() => {
              setDownloaded(files.map((f) => f.name))
              notify(`Downloading ${files.length} files`)
            }}
            className={`flex items-center gap-1.5 text-13 transition ${allDone ? "text-primary-700" : "text-slate-600 hover:text-primary-700"} ${fontMedium}`}
          >
            <Icon icon={allDone ? Tick02Icon : Download04Icon} size={15} />
            {allDone ? "All downloaded" : "Download all"}
          </button>
        </div>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {files.map((f) => {
            const done = downloaded.includes(f.name)
            const style = fileStyle(f.name)
            return (
              <li key={f.name} className="min-w-0 max-w-full">
                <button
                  type="button"
                  aria-label={done ? `${f.name}, downloaded. Download again` : `Download ${f.name}, ${f.size}`}
                  onClick={() => {
                    setDownloaded((list) => (list.includes(f.name) ? list : [...list, f.name]))
                    notify(`Downloading ${f.name}`)
                  }}
                  className="group flex h-11 max-w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white pl-1.5 pr-3 text-left transition hover:border-slate-300 hover:shadow-sm"
                >
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${style.tone}`}>
                    <Icon icon={style.icon} size={17} />
                  </span>
                  <span dir="auto" className={`min-w-0 truncate text-13 text-slate-900 ${fontMedium}`}>
                    {f.name}
                  </span>
                  <span className={`shrink-0 text-xs tabular-nums text-slate-400 ${fontRegular}`}>{f.size}</span>
                  <Icon
                    icon={done ? Tick02Icon : Download04Icon}
                    size={16}
                    className={`shrink-0 ${done ? "text-primary-700" : "text-slate-400 group-hover:text-primary-700"}`}
                  />
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className={card}>
        <h2 className={h} style={headingStyle}>
          Key points
        </h2>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {points.map((p) => (
            <li key={p} className={`flex items-start gap-3 text-sm leading-relaxed text-slate-700 ${fontRegular}`}>
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                <Icon icon={Tick02Icon} size={12} />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </section>

      {liveSession && (
        <section className="flex flex-col gap-2.5 rounded-2xl bg-primary-900 p-5 text-white">
          <span className={`text-xs uppercase tracking-label text-primary-400 ${fontSemi}`}>Live session</span>
          <h2 className={`m-0 text-lg text-white ${fontHeading}`} style={headingStyle}>
            Thursday, 7:00 PM with {instructor}
          </h2>
          <p className={`m-0 text-sm leading-relaxed text-primary-300 ${fontRegular}`}>Stuck on this lesson? Bring your question to the live session.</p>
          <button
            type="button"
            onClick={() => notify("Seat reserved for Thursday's live session ✓")}
            className={`${buttonClass("yellow", "lg")} mt-1 self-start`}
          >
            Reserve a seat
          </button>
        </section>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- announcements */

export type Announcement = { id: string; title: string; body: string; date: string }

export function announcementsFor(courseTitle: string): Announcement[] {
  return [
    {
      id: "a4",
      title: "Assignment deadline this Thursday",
      body: `We uploaded two short videos about this week's assignment for ${courseTitle}. Please watch them and submit your work before Thursday.`,
      date: "Jun 12, 3:00 PM",
    },
    { id: "a3", title: "New practice files added", body: "Updated exercise files for the hands-on section are ready in each lesson's materials.", date: "Jun 4, 11:30 AM" },
    { id: "a2", title: "Live Q&A this week", body: "Join the live Q&A on Thursday at 7 PM (Riyadh time). Bring your questions about the project.", date: "May 27, 5:15 PM" },
    { id: "a1", title: "Welcome to the course", body: "Start with the introduction section, then say hello in Discussion so we can get to know you.", date: "May 20, 9:00 AM" },
  ]
}

export function AnnouncementBanner({ item, onView, onDismiss }: { item: Announcement; onView: () => void; onDismiss: () => void }) {
  return (
    <div role="status" className="flex items-center gap-3 border-b border-secondary-200 bg-secondary-50 px-4 py-2.5 md:px-8">
      <Icon icon={Megaphone01Icon} size={18} className="text-secondary-700" />
      <p className={`m-0 min-w-0 flex-1 truncate text-sm text-slate-800 ${fontRegular}`}>
        <span className={fontSemi}>New from your instructor:</span> {item.title}
      </p>
      <button type="button" onClick={onView} className={`shrink-0 text-sm text-primary-700 transition hover:text-primary-800 ${fontSemi}`}>
        Read
      </button>
      <button type="button" onClick={onDismiss} aria-label="Dismiss announcement" className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-900">
        <Icon icon={Cancel01Icon} size={16} />
      </button>
    </div>
  )
}

export function PinnedAnnouncements({ items }: { items: Announcement[] }) {
  const [all, setAll] = useState(false)
  const shown = all ? items : items.slice(0, 1)
  return (
    <div className="mb-6 flex flex-col gap-3">
      {shown.map((a) => (
        <article key={a.id} className="flex gap-3 rounded-2xl border border-secondary-200 bg-secondary-50 p-4">
          <Icon icon={Megaphone01Icon} size={18} className="mt-0.5 text-secondary-700" />
          <div className="flex min-w-0 flex-col gap-1">
            <span className={`text-xs text-slate-500 ${fontRegular}`}>Pinned by instructor, {a.date}</span>
            <h3 className={`m-0 text-15 text-slate-900 ${fontSemi}`}>{a.title}</h3>
            <p className={`m-0 text-sm leading-relaxed text-slate-600 ${fontRegular}`}>{a.body}</p>
          </div>
        </article>
      ))}
      {items.length > 1 && (
        <button type="button" onClick={() => setAll((v) => !v)} className={`self-start text-sm text-primary-700 transition hover:text-primary-800 ${fontSemi}`}>
          {all ? "Show fewer announcements" : `Show all ${items.length} announcements`}
        </button>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- lesson bar */

export function LessonBar({
  sectionTitle,
  title,
  minutes,
  done,
  hasNext,
  checksDone,
  checksTotal,
  onToggleDone,
  onNext,
}: {
  sectionTitle: string
  title: string
  minutes: number
  done: boolean
  hasNext: boolean
  checksDone: number
  checksTotal: number
  onToggleDone: () => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-5 md:flex-row md:items-center md:justify-between md:px-8">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h2 dir="auto" className={`m-0 text-start text-xl leading-tight text-slate-900 md:text-2xl ${fontFor(title, fontHeading)}`} style={headingStyle}>
          {title}
        </h2>
        <span className={`flex flex-wrap items-center gap-x-2 text-13 text-slate-500 ${fontMedium}`}>
          {minutes} min
          {checksTotal > 0 && (
            <>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <span className={`flex items-center gap-1 ${checksDone === checksTotal ? "text-primary-700" : ""}`}>
                <Icon icon={Target02Icon} size={13} />
                {checksDone} of {checksTotal} checkpoints
              </span>
            </>
          )}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onToggleDone}
          aria-pressed={done}
          className={buttonClass(done ? "soft" : "secondary", "lg")}
        >
          <Icon icon={done ? CheckmarkCircle02Icon : Tick02Icon} size={17} />
          {done ? "Completed" : "Mark complete"}
        </button>
        {hasNext && (
          <button type="button" onClick={onNext} className={`${buttonClass("dark", "lg")} group/nx`}>
            Next lesson
            <Icon icon={ArrowRight01Icon} size={16} className="transition-transform group-hover/nx:translate-x-0.5" />
          </button>
        )}
      </div>
    </div>
  )
}
