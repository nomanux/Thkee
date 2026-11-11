import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"
import { courses, courseTags, type Course } from "../data"
import {
  fontBold,
  fontFor,
  fontHeading,
  fontMedium,
  fontRegular,
  fontSemi,
} from "../fonts"
import { useApp } from "../store"
import { buildCurriculum, seedReviews, type Lesson, type Review } from "./CourseDetailsPage"
import { CourseThumb } from "./Overlays"
import { DEMO_QUIZ_INSTRUCTIONS, QUIZ_LENGTH, QuizPanel, QuizRunner, type QuizResult } from "./Quiz"
import { ASSIGNMENT_QUESTIONS, AssignmentPanel, type AssignmentState } from "./Assignment"
import { ActionMenu, FilterSelect } from "./Menus"
import { ArticleReader, NoteBody, NoteEditor, NotesPanel, type LessonRef, type Note } from "./Notes"

// Demo playback runs 10x faster than the lesson length so a lesson can be finished in a few seconds.
const SPEED = 10
const qualities = ["1080p", "720p", "480p", "360p", "144p", "Auto"]
const tabs = ["Overview", "Q&A", "Notes", "Announcements", "Reviews"] as const
type Tab = typeof tabs[number]

type FlatLesson = Lesson & { key: string; section: number; index: number }
type QaAnswer = {
  id: number
  name: string
  text: string
  html?: string
  when: string
  votes: number
  instructor?: boolean
  mine?: boolean
}
type Question = {
  id: number
  name: string
  title: string
  text: string
  lecture: number
  when: string
  created: number
  votes: number
  answers: QaAnswer[]
  mine?: boolean
}

function useLocal<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) as T : fallback
    } catch {
      return fallback
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  }, [key, value])
  return [value, setValue] as const
}

const clock = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`

function Svg({
  children,
  className = "size-5",
  stroke = 1.8,
}: {
  children: ReactNode
  className?: string
  stroke?: number
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  )
}

function LessonMeta({ lesson }: { lesson: Lesson }) {
  if (lesson.kind === "assignment")
    return (
      <span className="flex items-center gap-1.5">
        <Svg className="size-[14px]">
          <path d="M8 4h8v3H8zM6 6H5v15h14V6h-1M9 12h6M9 16h4" />
        </Svg>
        {ASSIGNMENT_QUESTIONS.length} asgmt.
      </span>
    )
  if (lesson.kind === "quiz")
    return (
      <span className="flex items-center gap-1.5">
        <Svg className="size-[14px]">
          <path d="M9 9a3 3 0 115 2.2c-.8.5-1.5 1.1-1.5 2.3M12 17h.01" />
          <circle cx="12" cy="12" r="9" />
        </Svg>
        {QUIZ_LENGTH} ques.
      </span>
    )
  return (
    <span className="flex items-center gap-1.5">
      {lesson.kind === "article" ? (
        <Svg className="size-[14px]">
          <path d="M4 5a2 2 0 012-2h6v18H6a2 2 0 01-2-2zM12 3h6a2 2 0 012 2v14a2 2 0 01-2 2h-6" />
        </Svg>
      ) : (
        <Svg className="size-[14px]">
          <circle cx="12" cy="12" r="9" />
          <path d="M10 9l5 3-5 3z" />
        </Svg>
      )}
      {lesson.minutes} min
    </span>
  )
}

function SectionStatus({
  done,
  total,
  active,
}: {
  done: number
  total: number
  active: boolean
}) {
  if (done === total)
    return (
      <Svg className="size-5 text-[#16a34a]" stroke={2.4}>
        <path d="M5 12l5 5 9-10" />
      </Svg>
    )
  if (done > 0 || active) {
    const pct = Math.max(0.12, done / total)
    return (
      <svg viewBox="0 0 24 24" className="size-5 -rotate-90" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="#dcfce7"
          strokeWidth="2.5"
        />
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="#16a34a"
          strokeWidth="2.5"
          strokeDasharray={`${pct * 56.5} 56.5`}
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return <span className="size-5 rounded-full border-2 border-[#cbd5e1]" />
}

export default function LearnPage({ id }: { id: string }) {
  const course = courses.find((c) => c.id === id)
  const { goHome, openSearch } = useApp()
  if (!course)
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#f8fafc] px-4 text-center">
        <p className={`text-[22px] text-[#0f172a] ${fontHeading}`}>
          Course not found
        </p>
        <button
          type="button"
          onClick={() => openSearch({})}
          className={`h-[42px] rounded-[8px] bg-[#ffb20d] px-5 text-[14px] text-[#1e293b] ${fontSemi}`}
        >
          Browse courses
        </button>
        <button
          type="button"
          onClick={goHome}
          className={`text-[14px] text-[#64748b] underline ${fontRegular}`}
        >
          Go home
        </button>
      </main>
    )
  return <Player course={course} />
}

function Player({ course }: { course: Course }) {
  const { user, notify, goHome } = useApp()
  const sections = useMemo(() => buildCurriculum(course), [course])
  const flat = useMemo<FlatLesson[]>(() => {
    let index = 0
    return sections.flatMap((s, si) =>
      s.lessons.map((l, li) => ({
        ...l,
        key: `${si}-${li}`,
        section: si,
        index: index++,
      })),
    )
  }, [sections])

  const [progress, setProgress] = useLocal<{ done: string[]; current: string }>(
    `thkee.progress.${course.id}`,
    { done: [], current: "0-0" },
  )
  const current = flat.find((l) => l.key === progress.current) ?? flat[0]
  const duration = current.minutes * 60

  useEffect(() => {
    try {
      localStorage.setItem(`thkee.lastOpened.${course.id}`, String(Date.now()))
    } catch {}
  }, [course.id])

  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [quality, setQuality] = useState("Auto")
  const [autoplay, setAutoplay] = useLocal("thkee.autoplay", true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebar, setSidebar] = useState(true)
  const [openSections, setOpenSections] = useState<number[]>(() => [
    current.section,
  ])
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<Tab>("Overview")
  const [quizMode, setQuizMode] = useState(false)
  const [notes, setNotes] = useLocal<Note[]>(`thkee.notes2.${course.id}`, [])
  const [editNoteId, setEditNoteId] = useState<number | null>(null)
  const [assignments, setAssignments] = useLocal<Record<string, AssignmentState>>(`thkee.asg.${course.id}`, {})
  const [tip, setTip] = useState<{ si: number; top: number; right: number } | null>(null)
  const [quizResults, setQuizResults] = useLocal<Record<string, QuizResult>>(
    `thkee.quiz.${course.id}`,
    {},
  )
  const [moreOverview, setMoreOverview] = useState(false)
  const playerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)

  const doneCount = progress.done.length
  const percent = Math.round((doneCount / flat.length) * 100)

  const goTo = (lesson: FlatLesson, play = false) => {
    setProgress((p) => ({ ...p, current: lesson.key }))
    setTime(0)
    setPlaying(play && lesson.kind === "video")
    setOpenSections((s) =>
      s.includes(lesson.section) ? s : [...s, lesson.section],
    )
  }

  const markDone = (lesson: FlatLesson) =>
    setProgress((p) => (p.done.includes(lesson.key) ? p : { ...p, done: [...p.done, lesson.key] }))

  const complete = (lesson: FlatLesson) => {
    setProgress((p) =>
      p.done.includes(lesson.key) ? p : { ...p, done: [...p.done, lesson.key] },
    )
    const next = flat[lesson.index + 1]
    if (next && autoplay) goTo(next, true)
    else setPlaying(false)
    if (!next) notify("You finished the last lesson 🎉")
  }

  useEffect(() => {
    document.title = `${course.title} | Thkee`
    return () => {
      document.title = "Thkee"
    }
  }, [course.title])

  useEffect(() => {
    if (!playing) return
    const timer = setInterval(() => {
      setTime((t) => {
        const next = t + SPEED / 4
        if (next >= duration) {
          clearInterval(timer)
          setTimeout(() => complete(current), 0)
          return duration
        }
        return next
      })
    }, 250)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, current.key, duration])

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) =>
      menuRef.current &&
      !menuRef.current.contains(e.target as Node) &&
      setMenuOpen(false)
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [menuOpen])

  const prev = flat[current.index - 1]
  const next = flat[current.index + 1]

  const fullscreen = () => {
    const el = playerRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else
      el
        .requestFullscreen?.()
        .catch(() => notify("Fullscreen isn’t available here"))
  }

  const certificate = () => {
    if (doneCount === flat.length)
      notify("Your certificate is ready — check your email 🎓")
    else
      notify(
        `Finish all lessons to get your certificate (${doneCount}/${flat.length} done)`,
      )
  }

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/course/${course.id}`
    try {
      await navigator.clipboard.writeText(url)
      notify("Course link copied")
    } catch {
      notify("Copy this link: " + url)
    }
  }

  const openNotes = () => {
    setTab("Notes")
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const lessonRef = (l: FlatLesson): LessonRef => ({
    key: l.key,
    title: l.title,
    sectionTitle: sections[l.section].title,
    kind: l.kind,
    minutes: l.minutes,
  })

  const jumpToNote = (note: Note) => {
    const lesson = flat.find((l) => l.key === note.lessonKey)
    if (!lesson) return
    goTo(lesson)
    if (note.at !== undefined) setTime(note.at)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const minutesLabel = (mins: number) => {
    const h = Math.floor(mins / 60)
    return h ? `${h}hrs${mins % 60 ? `${mins % 60}min` : ""}` : `${mins}min`
  }

  const initials = (user?.name ?? "Guest")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const q = search.trim().toLowerCase()
  const sectionView = sections
    .map((s, si) => ({
      ...s,
      si,
      items: flat.filter(
        (l) => l.section === si && (!q || l.title.toLowerCase().includes(q)),
      ),
    }))
    .filter((s) => s.items.length)

  return (
    <div className="flex min-h-dvh w-full flex-col bg-[#f8fafc]">
      {/* Header */}
      <header className="sticky top-0 z-[100] flex h-[64px] items-center gap-4 bg-[#0f172a] px-4 md:h-[72px] md:px-8">
        <button
          type="button"
          onClick={goHome}
          aria-label="Thkee home"
          className="shrink-0"
        >
          <img
            src="/assets/820a1.svg"
            alt="Thkee"
            className="h-[26px] w-[88px] md:h-[28px] md:w-[95px]"
          />
        </button>
        <span className="hidden h-8 w-px bg-white/25 md:block" />
        <h1
          dir="auto"
          className={`m-0 hidden min-w-0 flex-1 truncate text-left text-[18px] text-white md:block ${fontFor(course.title, fontMedium, "font-medium")}`}
        >
          {course.title}
        </h1>
        <div className="ml-auto flex shrink-0 items-center gap-3 md:gap-5">
          <button
            type="button"
            onClick={() =>
              window.history.length > 1 ? window.history.back() : goHome()
            }
            className={`flex h-[38px] items-center gap-2 rounded-[6px] border border-white/80 px-3 text-[14px] text-white transition hover:bg-white hover:text-[#0f172a] md:px-4 md:text-[15px] ${fontMedium}`}
          >
            <Svg className="size-4" stroke={2}>
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </Svg>
            <span className="hidden sm:inline">Back to classes</span>
          </button>
          <button
            type="button"
            onClick={certificate}
            aria-label={percent === 100 ? "Get certificate" : `${percent}% completed`}
            className={`hidden items-center gap-2.5 text-[15px] transition sm:flex ${percent === 100 ? "text-[#4ade80] hover:text-[#86efac]" : "text-white hover:text-white/80"} ${fontSemi}`}
          >
            <span className="relative flex size-[36px] items-center justify-center">
              <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90" aria-hidden="true">
                <circle cx="20" cy="20" r="18" fill="none" stroke="#e2e8f0" strokeOpacity="0.35" strokeWidth="3" />
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${(percent / 100) * 113.1} 113.1`}
                  className="transition-[stroke-dasharray] duration-700"
                />
              </svg>
              <span className="flex size-[26px] items-center justify-center rounded-full bg-[#334155]">
                <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
                  <path d="M8 14l-2.5 6 3-1 1.5 2.5L12 16M16 14l2.5 6-3-1-1.5 2.5L12 16" fill="white" />
                  <circle cx="12" cy="10" r="6" fill="#ffb20d" />
                  <path d="M12 6.8l.95 1.95 2.15.3-1.55 1.5.37 2.13L12 11.65l-1.92 1.03.37-2.13L8.9 9.05l2.15-.3z" fill="#1e293b" />
                </svg>
              </span>
            </span>
            <span className="hidden lg:inline">{percent === 100 ? "Get certificate" : `${percent}% Completed`}</span>
          </button>
          <div className="group relative hidden sm:block">
            <button
              type="button"
              onClick={openNotes}
              aria-label="Notes & highlights"
              className="flex size-[36px] items-center justify-center rounded-[8px] bg-white/15 text-white transition hover:bg-white/25"
            >
              <Svg className="size-5">
                <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5M9 13h6M9 17h4" />
              </Svg>
            </button>
            <span
              className={`pointer-events-none absolute right-0 top-[calc(100%+10px)] whitespace-nowrap rounded-[6px] bg-white px-3 py-2 text-[13px] text-[#1e293b] opacity-0 shadow-[0_8px_20px_rgba(15,23,42,0.15)] transition group-hover:opacity-100 ${fontRegular}`}
            >
              Note &amp; Highlights
            </span>
          </div>
          <span
            className={`flex size-[38px] items-center justify-center rounded-full bg-[#ffb20d] text-[14px] text-[#1e293b] ring-2 ring-white/30 ${fontSemi}`}
            title={user?.name ?? "Guest"}
          >
            {initials}
          </span>
        </div>
      </header>

      {quizMode ? (
        <QuizRunner
          onExit={() => setQuizMode(false)}
          onFinish={(result) => {
            setQuizResults((r) => ({ ...r, [current.key]: result }))
            setProgress((p) =>
              p.done.includes(current.key)
                ? p
                : { ...p, done: [...p.done, current.key] },
            )
            setQuizMode(false)
            window.scrollTo({ top: 0, behavior: "smooth" })
          }}
        />
      ) : (
        <div
          className={`grid flex-1 grid-cols-1 ${
            sidebar
              ? "lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]"
              : ""
          }`}
        >
          <div className="min-w-0">
            {/* Player */}
            {current.kind === "quiz" ? (
              <QuizPanel
                key={current.key}
                title={current.title}
                questions={QUIZ_LENGTH}
                instructions={DEMO_QUIZ_INSTRUCTIONS}
                result={quizResults[current.key]}
                onStart={() => setQuizMode(true)}
                onNext={next ? () => goTo(next) : undefined}
              />
            ) : current.kind === "assignment" ? (
              <AssignmentPanel
                key={current.key}
                title={current.title}
                state={assignments[current.key]}
                onSave={(st) => {
                  setAssignments((a) => ({ ...a, [current.key]: st }))
                  if (st.submitted) markDone(current)
                }}
                onNext={next ? () => goTo(next) : undefined}
                notify={notify}
              />
            ) : current.kind === "article" ? (
              <ArticleReader
                key={current.key}
                lesson={lessonRef(current)}
                notes={notes}
                done={progress.done.includes(current.key)}
                setNotes={setNotes}
                onComplete={() => markDone(current)}
                onBack={prev ? () => goTo(prev) : undefined}
                onNext={
                  next
                    ? () => {
                        markDone(current)
                        goTo(next)
                      }
                    : undefined
                }
                notify={notify}
                expanded={!sidebar}
                onToggleExpand={() => setSidebar((v) => !v)}
              />
            ) : (
              <div
                ref={playerRef}
                className="group/player relative w-full overflow-hidden bg-black"
              >
                <div className="relative aspect-video w-full lg:max-h-[calc(100dvh-72px-60px)]">
                  {current.kind === "video" ? (
                    <>
                      <CourseThumb
                        course={course}
                        showTitle={false}
                        className="absolute inset-0 size-full [&>img:last-of-type]:object-cover [&>span]:hidden"
                      />
                      <div
                        className={`absolute inset-0 bg-[#0f172a] transition-opacity ${
                          playing ? "opacity-10" : "opacity-45"
                        }`}
                      />
                      {!playing && (
                        <button
                          type="button"
                          onClick={() => setPlaying(true)}
                          aria-label="Play lesson"
                          className="absolute inset-0 m-auto flex size-[72px] items-center justify-center rounded-full bg-white/90 text-[#0f172a] shadow-xl transition hover:scale-105"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="ml-1 size-8"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#0f172a] to-[#0d5c4b] px-6 text-center text-white">
                      <span
                        className={`rounded-full bg-white/15 px-3 py-1 text-[12px] uppercase tracking-[1px] ${fontSemi}`}
                      >
                        Reading
                      </span>
                      <p
                        className={`max-w-[560px] text-[22px] leading-[1.3] md:text-[28px] ${fontHeading}`}
                      >
                        {current.title}
                      </p>
                      <p
                        className={`max-w-[520px] text-[14px] text-white/75 ${fontRegular}`}
                      >
                        {`A ${current.minutes}-minute read that sums up the key ideas from this section, with examples you can reuse.`}
                      </p>
                      <button
                        type="button"
                        onClick={() => complete(current)}
                        className={`h-[42px] rounded-[8px] bg-[#ffb20d] px-5 text-[14px] text-[#1e293b] transition hover:bg-[#faa104] ${fontSemi}`}
                      >
                        {progress.done.includes(current.key)
                          ? "Completed ✓ — Next lesson"
                          : "Mark as complete"}
                      </button>
                    </div>
                  )}

                  {prev && (
                    <button
                      type="button"
                      onClick={() => goTo(prev, playing)}
                      aria-label={`Previous: ${prev.title}`}
                      className="group/prev absolute left-0 top-1/2 flex -translate-y-1/2 items-center"
                    >
                      <span className="flex h-[44px] w-[38px] items-center justify-center bg-[#0f172a]/80 text-white transition group-hover/prev:bg-[#0f172a]">
                        <Svg className="size-5" stroke={2}>
                          <path d="M15 6l-6 6 6 6" />
                        </Svg>
                      </span>
                      <span
                        className={`hidden h-[44px] max-w-[260px] items-center truncate bg-[#0f172a]/80 px-3 text-[14px] text-white group-hover/prev:flex ${fontRegular}`}
                      >
                        {prev.title}
                      </span>
                    </button>
                  )}
                  {next && (
                    <button
                      type="button"
                      onClick={() => goTo(next, playing)}
                      aria-label={`Next: ${next.title}`}
                      className="group/next absolute right-0 top-1/2 flex -translate-y-1/2 flex-row-reverse items-center"
                    >
                      <span className="flex h-[44px] w-[38px] items-center justify-center bg-[#0f172a]/80 text-white transition group-hover/next:bg-[#0f172a]">
                        <Svg className="size-5" stroke={2}>
                          <path d="M9 6l6 6-6 6" />
                        </Svg>
                      </span>
                      <span
                        className={`hidden h-[44px] max-w-[260px] items-center truncate bg-[#0f172a]/80 px-3 text-[14px] text-white group-hover/next:flex ${fontRegular}`}
                      >
                        {next.title}
                      </span>
                    </button>
                  )}

                  {menuOpen && (
                    <div
                      ref={menuRef}
                      className="pop-in absolute bottom-[56px] right-3 z-20 w-[240px] overflow-hidden rounded-[8px] bg-white py-1 shadow-[0_16px_40px_rgba(0,0,0,0.35)] sm:right-[60px] sm:w-[272px]"
                    >
                      {qualities.map((qOpt) => (
                        <button
                          key={qOpt}
                          type="button"
                          onClick={() => (setQuality(qOpt), setMenuOpen(false))}
                          className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[14px] text-[#1e293b] hover:bg-[#f1f5f9] ${fontRegular}`}
                        >
                          {qOpt}
                          {quality === qOpt && (
                            <span className="text-[#0d5c4b]">✓</span>
                          )}
                        </button>
                      ))}
                      <div className="my-1 border-t border-[#e2e8f0]" />
                      <button
                        type="button"
                        role="switch"
                        aria-checked={autoplay}
                        onClick={() => setAutoplay((a) => !a)}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-[14px] text-[#1e293b] hover:bg-[#f1f5f9] ${fontRegular}`}
                      >
                        Autoplay
                        <span
                          className={`flex h-[22px] w-[38px] items-center rounded-full p-[3px] transition ${
                            autoplay ? "bg-[#1e293b]" : "bg-[#cbd5e1]"
                          }`}
                        >
                          <span
                            className={`size-4 rounded-full bg-white transition ${
                              autoplay ? "translate-x-4" : ""
                            }`}
                          />
                        </span>
                      </button>
                      <div className="my-1 border-t border-[#e2e8f0]" />
                      <button
                        type="button"
                        onClick={() => (
                          setMenuOpen(false),
                          notify(
                            `${current.title} · ${current.minutes} min · ${quality}`,
                          )
                        )}
                        className={`block w-full px-4 py-2.5 text-left text-[14px] text-[#1e293b] hover:bg-[#f1f5f9] ${fontRegular}`}
                      >
                        Content Information
                      </button>
                      <button
                        type="button"
                        onClick={() => (
                          setMenuOpen(false),
                          notify("Thanks — our team will review this lesson")
                        )}
                        className={`block w-full px-4 py-2.5 text-left text-[14px] text-[#1e293b] hover:bg-[#f1f5f9] ${fontRegular}`}
                      >
                        Report Abuse
                      </button>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="relative bg-[#0f172a] text-white">
                  <button
                    type="button"
                    aria-label="Seek"
                    disabled={current.kind !== "video"}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setTime(
                        Math.max(
                          0,
                          Math.min(
                            duration,
                            ((e.clientX - rect.left) / rect.width) * duration,
                          ),
                        ),
                      )
                    }}
                    className="group/seek absolute inset-x-0 -top-[3px] h-[6px] cursor-pointer bg-white/25"
                  >
                    <span
                      className="block h-full bg-white transition-[width] duration-200"
                      style={{
                        width: `${
                          current.kind === "video"
                            ? (time / duration) * 100
                            : progress.done.includes(current.key)
                              ? 100
                              : 0
                        }%`,
                      }}
                    />
                  </button>
                  <div
                    className={`flex h-[52px] items-center gap-4 px-4 text-[14px] md:gap-5 md:px-6 ${fontRegular}`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        current.kind === "video"
                          ? setPlaying((p) => !p)
                          : complete(current)
                      }
                      aria-label={playing ? "Pause" : "Play"}
                      className="hover:text-[#ffb20d]"
                    >
                      {playing ? (
                        <svg
                          viewBox="0 0 24 24"
                          className="size-5"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          className="size-5"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M7 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTime((t) => Math.max(0, t - 10))}
                      aria-label="Back 10 seconds"
                      className="hover:text-[#ffb20d]"
                    >
                      <Svg className="size-5">
                        <path d="M4 12a8 8 0 108-8H8M8 4L5 7l3 3" />
                      </Svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMuted((m) => !m)}
                      aria-label={muted ? "Unmute" : "Mute"}
                      className="hover:text-[#ffb20d]"
                    >
                      <Svg className="size-5">
                        <path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" />
                        {muted ? (
                          <path d="M17 9l5 6M22 9l-5 6" />
                        ) : (
                          <path d="M17 8.5a5 5 0 010 7M19.5 6a8.5 8.5 0 010 12" />
                        )}
                      </Svg>
                    </button>
                    <span className="tabular-nums">
                      {clock(current.kind === "video" ? time : 0)}/
                      {clock(duration)}
                    </span>
                    <button
                      type="button"
                      onClick={openNotes}
                      aria-label="Add a note"
                      className="hover:text-[#ffb20d]"
                    >
                      <Svg className="size-5">
                        <path d="M4 6h12M4 10h12M4 14h7M15 19l5-5-2-2-5 5v2z" />
                      </Svg>
                    </button>
                    <span className="ml-auto text-[13px] text-white/90">
                      {quality}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMenuOpen((o) => !o)}
                      aria-label="Settings"
                      aria-expanded={menuOpen}
                      className={`transition hover:text-[#ffb20d] ${
                        menuOpen ? "rotate-45 text-[#ffb20d]" : ""
                      }`}
                    >
                      <Svg className="size-5">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
                      </Svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSidebar((s) => !s)}
                      aria-label={
                        sidebar ? "Hide course content" : "Show course content"
                      }
                      className="hidden hover:text-[#ffb20d] lg:block"
                    >
                      <Svg className="size-5">
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="M13 11h5v5h-5z" fill="currentColor" />
                      </Svg>
                    </button>
                    <button
                      type="button"
                      onClick={fullscreen}
                      aria-label="Fullscreen"
                      className="hover:text-[#ffb20d]"
                    >
                      <Svg className="size-5">
                        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                      </Svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div
              ref={tabsRef}
              className="sticky top-[64px] z-10 flex scroll-mt-[72px] items-center border-b border-[#e2e8f0] bg-[#f1f5f9] md:top-[72px]"
            >
              <div
                role="tablist"
                className="flex min-w-0 flex-1 overflow-x-auto px-2 md:px-4"
              >
                {tabs.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={tab === t}
                    onClick={() => setTab(t)}
                    className={`shrink-0 border-b-2 px-4 py-4 text-[15px] transition md:px-6 ${
                      tab === t
                        ? `border-[#0f172a] text-[#0f172a] ${fontMedium}`
                        : `border-transparent text-[#64748b] hover:text-[#0f172a] ${fontRegular}`
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={share}
                className={`hidden shrink-0 items-center gap-2 px-6 text-[14px] uppercase tracking-[0.3px] text-[#0f172a] hover:text-[#0d5c4b] sm:flex ${fontBold}`}
              >
                Share course
                <Svg className="size-5" stroke={2}>
                  <path d="M14 5l7 7-7 7M21 12H9a6 6 0 00-6 6" />
                </Svg>
              </button>
            </div>

            <div className="bg-white px-4 py-8 md:px-6">
              {tab === "Overview" && (
                <OverviewTab
                  course={course}
                  lessons={flat}
                  more={moreOverview}
                  onMore={() => setMoreOverview((m) => !m)}
                />
              )}
              {tab === "Q&A" && (
                <QaTab
                  course={course}
                  lecture={current.index + 1}
                  onOpenLecture={(n) => {
                    if (!flat[n - 1]) return
                    goTo(flat[n - 1])
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                />
              )}
              {tab === "Notes" && (
                <NotesPanel
                  notes={notes}
                  setNotes={setNotes}
                  current={lessonRef(current)}
                  time={time}
                  editId={editNoteId}
                  setEditId={setEditNoteId}
                  onJump={jumpToNote}
                />
              )}
              {tab === "Announcements" && <AnnouncementsTab course={course} />}
              {tab === "Reviews" && (
                <ReviewsTab course={course} />
              )}
            </div>
          </div>

          {/* Course content sidebar */}
          {sidebar ? (
            <aside className="relative border-l border-[#e2e8f0] bg-white lg:sticky lg:top-[72px] lg:h-[calc(100dvh-72px)] lg:overflow-y-auto">
              <button
                type="button"
                onClick={() => setSidebar(false)}
                aria-label="Hide course content"
                className="absolute -left-3 top-[50px] hidden size-6 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#475569] shadow-sm hover:text-[#0f172a] lg:flex"
              >
                <Svg className="size-3.5" stroke={2.4}>
                  <path d="M9 6l6 6-6 6" />
                </Svg>
              </button>
              <div className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] px-6 py-5">
                <h2 className={`m-0 text-[17px] text-[#0f172a] ${fontBold}`}>
                  Course Content
                </h2>
                <span className={`text-[13px] text-[#64748b] ${fontMedium}`}>
                  {doneCount}/{flat.length} · {percent}%
                </span>
              </div>
              <div className="px-6 py-4">
                <label className="field-box">
                  <Svg className="size-[18px] text-[#0f172a]" stroke={2}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                  </Svg>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search here"
                    aria-label="Search lessons"
                    className={`min-w-0 flex-1 bg-transparent text-[16px] md:text-[14px] text-[#0f172a] outline-none placeholder:text-slate-400 ${fontRegular}`}
                  />
                </label>
              </div>
              {sectionView.length === 0 && (
                <p
                  className={`px-6 pb-6 text-[14px] text-[#64748b] ${fontRegular}`}
                >
                  No lessons match “{search}”.
                </p>
              )}
              {sectionView.map((s) => {
                const all = flat.filter((l) => l.section === s.si)
                const done = all.filter((l) =>
                  progress.done.includes(l.key),
                ).length
                const open = !!q || openSections.includes(s.si)
                return (
                  <div
                    key={s.si}
                    className="relative border-b border-[#e2e8f0]"
                    onMouseEnter={(e) => {
                      const r = e.currentTarget.getBoundingClientRect()
                      setTip({ si: s.si, top: r.top + 8, right: window.innerWidth - r.left + 12 })
                    }}
                    onMouseLeave={() => setTip(null)}
                  >
                    {tip?.si === s.si && (
                    <span
                      role="tooltip"
                      style={{ top: tip.top, right: tip.right }}
                      className={`pointer-events-none fixed z-[120] hidden w-max rounded-[6px] bg-[#0f172a] px-4 py-3 text-white shadow-[0_12px_30px_rgba(0,0,0,0.3)] lg:block ${fontRegular}`}
                    >
                      <span className={`block text-[14px] ${fontMedium}`}>
                        {s.title.replace(/^\d+\.\s*/, "")}
                      </span>
                      <span className="mt-2 block text-[13px] text-white/70">
                        {done}/{all.length} Completed
                        <span className="mx-2 text-white/30">|</span>
                        {minutesLabel(all.reduce((m, l) => m + l.minutes, 0))}
                      </span>
                    </span>
                    )}
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() =>
                        setOpenSections((list) =>
                          list.includes(s.si)
                            ? list.filter((x) => x !== s.si)
                            : [...list, s.si],
                        )
                      }
                      className="flex w-full items-center gap-3 px-6 py-4 text-left hover:bg-[#f8fafc]"
                    >
                      <SectionStatus
                        done={done}
                        total={all.length}
                        active={current.section === s.si}
                      />
                      <span
                        className={`flex-1 text-[15px] text-[#1e293b] ${fontSemi}`}
                      >
                        {s.title.replace(/^\d+\.\s*/, "")}
                      </span>
                      <Svg
                        className={`size-5 text-[#94a3b8] transition-transform ${
                          open ? "rotate-180 text-[#0f172a]" : ""
                        }`}
                        stroke={2}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </Svg>
                    </button>
                    {open && (
                      <ol className="relative pb-2">
                        <span
                          aria-hidden="true"
                          className="absolute bottom-6 left-[32px] top-4 w-[2px] bg-[#e2e8f0]"
                        />
                        {s.items.map((l) => {
                          const isDone = progress.done.includes(l.key)
                          const isCurrent = l.key === current.key
                          return (
                            <li key={l.key}>
                              <button
                                type="button"
                                onClick={() => goTo(l)}
                                className={`relative flex w-full items-start gap-4 py-3 pl-[25px] pr-6 text-left transition ${
                                  isCurrent
                                    ? "bg-[#e7eef6]"
                                    : "hover:bg-[#f8fafc]"
                                }`}
                              >
                                <span
                                  className={`relative z-[1] mt-0.5 size-4 shrink-0 rounded-full ${
                                    isDone
                                      ? "bg-[#16a34a]"
                                      : isCurrent
                                        ? "border-2 border-[#16a34a] bg-white"
                                        : "border-2 border-[#cbd5e1] bg-white"
                                  }`}
                                />
                                <span
                                  className={`min-w-0 flex-1 text-[13px] leading-[20px] ${
                                    isCurrent
                                      ? "text-[#0f172a]"
                                      : "text-[#334155]"
                                  } ${isCurrent ? fontMedium : fontRegular}`}
                                >
                                  {l.title}
                                </span>
                                <span
                                  className={`shrink-0 pt-0.5 text-[11px] text-[#64748b] ${fontRegular}`}
                                >
                                  <LessonMeta lesson={l} />
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ol>
                    )}
                  </div>
                )
              })}
            </aside>
          ) : (
            <button
              type="button"
              onClick={() => setSidebar(true)}
              aria-label="Show course content"
              title="Show course content"
              className="fixed right-0 top-[112px] z-20 hidden h-8 w-7 items-center justify-center rounded-l-full border border-r-0 border-[#e2e8f0] bg-white pl-1 text-[#475569] shadow-[0_4px_12px_rgba(15,23,42,0.12)] transition hover:w-9 hover:text-[#0f172a] lg:flex"
            >
              <Svg className="size-4" stroke={2.2}>
                <path d="M15 6l-6 6 6 6" />
              </Svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 border-t border-[#e2e8f0] py-8 first:border-t-0 first:pt-0 md:grid-cols-[192px_minmax(0,1fr)]">
      <p className={`text-[16px] text-[#0f172a] ${fontSemi}`}>{label}</p>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function OverviewTab({
  course,
  lessons,
  more,
  onMore,
}: {
  course: Course
  lessons: FlatLesson[]
  more: boolean
  onMore: () => void
}) {
  const quizzes = lessons.filter((l) => l.kind === "quiz").length
  const articles = lessons.filter((l) => l.kind === "assignment").length
  const details: [string, string, ReactNode][] = [
    [
      "Level",
      course.level,
      <path key="i" d="M5 20v-4M10 20v-8M15 20V8M20 20V4" />,
    ],
    [
      "Students",
      course.students.toLocaleString(),
      <path
        key="i"
        d="M16 19v-1a4 4 0 00-8 0v1M12 11a3 3 0 100-6 3 3 0 000 6zM20 19v-1a3 3 0 00-2-2.8M4 19v-1a3 3 0 012-2.8"
      />,
    ],
    [
      "Language",
      /[؀-ۿ]/.test(course.title) ? "Arabic" : "English",
      <path
        key="i"
        d="M4 6h10M9 4v2M6 6c0 4 3 7 7 8M12 6c0 3-3 7-7 9M14 20l4-9 4 9M15.5 17h5"
      />,
    ],
    [
      "Lectures",
      String(lessons.length),
      <path
        key="i"
        d="M4 5a2 2 0 012-2h5v17H6a2 2 0 01-2-2zM11 3h7a2 2 0 012 2v13a2 2 0 01-2 2h-7"
      />,
    ],
    [
      "Category",
      course.category,
      <path key="i" d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
    ],
    [
      "Quizzes",
      String(quizzes),
      <path
        key="i"
        d="M9 9a3 3 0 115 2.2c-.8.5-1.5 1.1-1.5 2.3M12 17h.01M12 21a9 9 0 100-18 9 9 0 000 18z"
      />,
    ],
    [
      "Sub Category",
      course.subcategory,
      <path
        key="i"
        d="M4 4v14a2 2 0 002 2h4M4 9h6M14 7h6v6h-6zM14 15h6v5h-6z"
      />,
    ],
    [
      "Assignments",
      String(articles),
      <path key="i" d="M8 4h8v3H8zM6 6H5v15h14V6h-1M9 12h6M9 16h4" />,
    ],
  ]
  return (
    <div className="flex max-w-[980px] flex-col">
      <Row label="About">
        <p
          dir="auto"
          className={`text-left text-[14px] leading-[22px] text-[#1e293b] ${fontFor(course.description, fontRegular, "font-normal")}`}
        >
          {course.description}
        </p>
      </Row>
      <Row label="Instructor">
        <div className="flex items-center gap-3">
          <span
            className={`flex size-10 items-center justify-center rounded-full bg-[#e7f5f1] text-[14px] text-[#0d5c4b] ${fontSemi}`}
          >
            {course.instructor
              .replace(/^(د\.|Dr\.)\s*/, "")
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")}
          </span>
          <div>
            <p
              dir="auto"
              className={`text-left text-[16px] text-[#0f172a] ${fontFor(course.instructor, fontMedium, "font-medium")}`}
            >
              {course.instructor}
            </p>
            <p className={`text-[12px] text-[#64748b] ${fontRegular}`}>
              {course.subcategory} instructor
            </p>
          </div>
        </div>
      </Row>
      <Row label="Course Details:">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {details.map(([label, value, icon]) => (
            <div
              key={label}
              className={`flex items-center gap-3 text-[14px] ${fontRegular}`}
            >
              <Svg className="size-[18px] shrink-0 text-[#94a3b8]">{icon}</Svg>
              <dt className="text-[#1e293b]">{label}:</dt>
              <dd className="m-0 text-[#64748b]">{value}</dd>
            </div>
          ))}
        </dl>
      </Row>
      <Row label="Overview">
        <div className="relative">
          <div
            className={`flex flex-col gap-4 text-[14px] leading-[22px] text-[#475569] ${fontRegular} ${
              more ? "" : "max-h-[150px] overflow-hidden"
            }`}
          >
            <p>
              In this {course.level.toLowerCase()} course you learn{" "}
              {course.subcategory.toLowerCase()} step by step through{" "}
              {lessons.length} short lessons. Each section ends with a short
              exercise, so you practise what you learn before moving on.
            </p>
            <p>What you will be able to do by the end:</p>
            <ul className="list-disc pl-5">
              {course.outcomes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
            <p>
              Topics covered:{" "}
              {(courseTags[course.id] ?? [course.subcategory]).join(", ")}.
            </p>
          </div>
          {!more && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-white/0" />
          )}
        </div>
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onMore}
            className={`flex h-[40px] items-center gap-2 rounded-[6px] border border-[#cbd5e1] px-4 text-[15px] text-[#1e293b] hover:border-[#1e293b] ${fontMedium}`}
          >
            {more ? "Show Less" : "Show More"}
            <Svg
              className={`size-4 transition-transform ${
                more ? "rotate-180" : ""
              }`}
              stroke={2}
            >
              <path d="M6 9l6 6 6-6" />
            </Svg>
          </button>
        </div>
      </Row>
    </div>
  )
}

const avatarColors = ["#0d5c4b", "#1d4ed8", "#b45309", "#7c3aed", "#be123c"]

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
  return (
    <span
      className={`flex size-[44px] shrink-0 items-center justify-center rounded-full text-[14px] text-white ${fontSemi}`}
      style={{ background: avatarColors[name.length % avatarColors.length] }}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

function seedQuestions(course: Course): Question[] {
  return [
    {
      id: 1,
      name: "Esther Howard",
      title: "Will the project files be updated if the tools change?",
      text: "I am working through the project with a newer version of the software. Will the exercise files stay up to date, or should I follow the older version shown in the videos?",
      lecture: 3,
      when: "2 days ago",
      created: 998,
      votes: 5,
      answers: [
        { id: 101, name: "Omar K.", text: "Most steps still work the same way in the newer version, so you can keep going.", when: "1 day ago", votes: 1 },
        { id: 102, name: course.instructor, instructor: true, text: "The instructor updates the resources section whenever a tool changes. Check there first.", when: "1 day ago", votes: 4 },
      ],
    },
    {
      id: 2,
      name: "Omar Khalid",
      title: "Is there a recommended order for the practice exercises?",
      text: "Should I finish each exercise before moving to the next lecture, or is it better to watch the full section first and then come back to practise?",
      lecture: 2,
      when: "1 week ago",
      created: 993,
      votes: 12,
      answers: [
        { id: 201, name: course.instructor, instructor: true, text: "I watched the full section first, and the exercises made more sense after that.", when: "5 days ago", votes: 3 },
      ],
    },
    {
      id: 3,
      name: "Lina Ahmed",
      title: "Can I download the lessons to watch offline?",
      text: "I travel often and do not always have a stable connection. Is there a way to save the lessons and watch them without internet access?",
      lecture: 1,
      when: "2 weeks ago",
      created: 986,
      votes: 8,
      answers: [],
    },
    {
      id: 4,
      name: "Yousef Saad",
      title: "How long should I spend on the assignment in each section?",
      text: "The assignment takes me much longer than the lessons. How much time do most learners spend on it, and is it fine to come back to it later?",
      lecture: 4,
      when: "1 month ago",
      created: 970,
      votes: 2,
      answers: [
        { id: 401, name: course.instructor, instructor: true, text: "About an hour for me. It is fine to return to it later, since there is no deadline.", when: "3 weeks ago", votes: 2 },
      ],
    },
  ]
}

const qaLectureOptions = [
  { value: "all", label: "All Lectures" },
  { value: "current", label: "Current Lectures" },
]
const qaSortOptions = [
  { value: "recent", label: "Most Recent" },
  { value: "upvoted", label: "Most Upvoted" },
  { value: "recommended", label: "Recommended" },
]
const qaShowOptions = [
  { value: "all", label: "All questions" },
  { value: "following", label: "I'm following" },
  { value: "asked", label: "I asked" },
  { value: "unanswered", label: "Questions but no response" },
]

function UpvoteButton({
  count,
  active,
  onClick,
}: {
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={active ? `Remove upvote, ${count} upvotes` : `Upvote, ${count} upvotes`}
      aria-pressed={active}
      onClick={onClick}
      className={`flex items-center gap-1.5 text-[14px] tabular-nums transition hover:text-[#6016fc] ${active ? "text-[#6016fc]" : "text-[#64748b]"} ${fontMedium}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="4" y="4" width="16" height="16" rx="2.5" />
        <path d="M12 16.5v-9M8.5 11L12 7.5l3.5 3.5" stroke={active ? "white" : "currentColor"} />
      </svg>
      {count}
    </button>
  )
}

function QuestionSummary({
  question,
  voted,
  onVote,
  onOpenLecture,
  onOpen,
}: {
  question: Question
  voted: number[]
  onVote: (id: number) => void
  onOpenLecture: (n: number) => void
  onOpen?: () => void
}) {
  const titleCls = `text-left text-[14px] leading-[22px] text-[#1e293b] ${fontFor(question.title, fontSemi)}`
  const answerCount = (
    <>
      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
        <path d="M4 4h12a2 2 0 012 2v7a2 2 0 01-2 2H9.5L5 18.5V15H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
        <path d="M20 8.5h.5A1.5 1.5 0 0122 10v6.5a1.5 1.5 0 01-1.5 1.5H20v3l-3.8-3H11v-1.5h5.5A3.5 3.5 0 0020 13z" />
      </svg>
      {question.answers.length}
    </>
  )
  const countCls = `flex items-center gap-1.5 text-[14px] tabular-nums text-[#334155] ${fontMedium}`
  return (
    <div className="flex gap-3 md:gap-5">
      <Avatar name={question.name} />
      <div className="flex min-w-0 flex-1 gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {onOpen ? (
            <button type="button" dir="auto" onClick={onOpen} className={`${titleCls} transition-colors hover:text-[#6016fc]`}>
              {question.title}
            </button>
          ) : (
            <p dir="auto" className={titleCls}>
              {question.title}
            </p>
          )}
          <div className={`text-[14px] leading-[22px] text-[#475569] ${fontRegular}`}>
            <p>Question:</p>
            <p dir="auto" className={`text-left ${fontFor(question.text, fontRegular, "font-normal")}`}>
              {question.text}
            </p>
          </div>
          <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[#6016fc] ${fontRegular}`}>
            <span dir="auto" className={`underline underline-offset-2 ${fontFor(question.name, fontRegular, "font-normal")}`}>
              {question.name}
            </span>
            <span className="text-[#94a3b8]">·</span>
            <button
              type="button"
              onClick={() => onOpenLecture(question.lecture)}
              className="flex items-center gap-1 transition hover:text-[#4f0fd6] hover:underline"
            >
              Lecture {question.lecture}
              <Svg className="size-3.5">
                <path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 01-1 1H6a1 1 0 01-1-1V7a1 1 0 011-1h4" />
              </Svg>
            </button>
            <span className="text-[#94a3b8]">·</span>
            <span className="text-[#64748b]">{question.when}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-3">
          <UpvoteButton
            count={question.votes + (voted.includes(question.id) ? 1 : 0)}
            active={voted.includes(question.id)}
            onClick={() => onVote(question.id)}
          />
          {onOpen ? (
            <button
              type="button"
              aria-label={`Open question, ${question.answers.length} replies`}
              onClick={onOpen}
              className={`${countCls} transition hover:text-[#6016fc]`}
            >
              {answerCount}
            </button>
          ) : (
            <span className={countCls} aria-label={`${question.answers.length} replies`}>
              {answerCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function ReplyRow({
  reply,
  voted,
  reported,
  onVote,
  onReport,
  onEdit,
  onDelete,
}: {
  reply: QaAnswer
  voted: boolean
  reported: boolean
  onVote: () => void
  onReport: () => void
  onEdit: (text: string, html: string) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  return (
    <div className="flex gap-3">
      <Avatar name={reply.name} />
      {editing ? (
        <NoteEditor
          extras
          initial={reply}
          placeholder="Add a comment...."
          saveClass={replyBtnClass}
          onSave={(text, html) => {
            onEdit(text, html)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-3">
            <p className={`flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[#64748b] ${fontRegular}`}>
              <span dir="auto" className={`text-[14px] text-[#6016fc] ${fontFor(reply.name, fontSemi)}`}>
                {reply.name}
              </span>
              {reply.instructor ? (
                <span className={`rounded-[2px] bg-[#f97316] px-1.5 py-0.5 text-[11px] leading-none text-white ${fontMedium}`}>
                  Instructor
                </span>
              ) : (
                <span className="text-[#94a3b8]">·</span>
              )}
              <span>{reply.when}</span>
            </p>
            <UpvoteButton count={reply.votes + (voted ? 1 : 0)} active={voted} onClick={onVote} />
            <ActionMenu
              label="Reply options"
              triggerClass={kebabClass}
              trigger={kebabIcon}
              items={
                reply.mine
                  ? [
                      { label: "Edit", onClick: () => setEditing(true) },
                      { label: "Delete", onClick: onDelete },
                    ]
                  : [{ label: reported ? "Reported" : "Report Abuse", onClick: onReport, disabled: reported }]
              }
            />
          </div>
          <NoteBody note={reply} tone="text-[#475569]" />
        </div>
      )}
    </div>
  )
}

const replyBtnClass = "bg-[#4f46e5] text-white hover:bg-[#4338ca]"

function QuestionDetail({
  course,
  question,
  total,
  voted,
  following,
  onVote,
  onFollow,
  onOpenLecture,
  onBack,
  onReply,
  onEditReply,
  onDeleteReply,
}: {
  course: Course
  question: Question
  total: number
  voted: number[]
  following: boolean
  onVote: (id: number) => void
  onFollow: () => void
  onOpenLecture: (n: number) => void
  onBack: () => void
  onReply: (text: string, html: string) => void
  onEditReply: (id: number, text: string, html: string) => void
  onDeleteReply: (id: number) => void
}) {
  const { user, notify } = useApp()
  const [reported, setReported] = useLocal<number[]>(`thkee.qaReported.${course.id}`, [])
  // Remounts the comment box so it empties after each reply.
  const [composerKey, setComposerKey] = useState(0)
  const score = (a: QaAnswer) => a.votes + (voted.includes(a.id) ? 1 : 0)
  // The most upvoted replies always stay first.
  const replies = [...question.answers].sort((a, b) => score(b) - score(a) || b.id - a.id)

  return (
    <div className="flex flex-col gap-6">
      <h3 className={`m-0 border-b border-[#e2e8f0] pb-4 text-[22px] text-[#0f172a] ${fontRegular}`}>
        Questions and answers ({total})
      </h3>
      <button
        type="button"
        onClick={onBack}
        className={`flex h-[32px] items-center gap-2 self-start rounded-[6px] bg-[#e2e8f0] px-3 text-[14px] text-[#1e293b] transition hover:bg-[#cbd5e1] ${fontMedium}`}
      >
        <Svg className="size-4" stroke={2}>
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </Svg>
        Go Back to the Questions
      </button>
      <QuestionSummary question={question} voted={voted} onVote={onVote} onOpenLecture={onOpenLecture} />
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className={`text-[14px] text-[#0f172a] ${fontSemi}`}>
            {question.answers.length === 1 ? "1 reply" : `${question.answers.length} replies`}
          </p>
          <button
            type="button"
            aria-pressed={following}
            onClick={onFollow}
            className={`text-[14px] underline underline-offset-4 transition hover:text-[#4f0fd6] ${following ? "text-[#64748b]" : "text-[#6016fc]"} ${fontMedium}`}
          >
            {following ? "Following" : "Follow question"}
          </button>
        </div>
        <div className="flex flex-col gap-6 rounded-[6px] border border-[#e2e8f0] p-4 md:p-5">
          {replies.map((reply) => (
            <ReplyRow
              key={reply.id}
              reply={reply}
              voted={voted.includes(reply.id)}
              reported={reported.includes(reply.id)}
              onVote={() => onVote(reply.id)}
              onReport={() => {
                setReported((list) => [...list, reply.id])
                notify("Thanks, we'll take a look at this reply")
              }}
              onEdit={(text, html) => onEditReply(reply.id, text, html)}
              onDelete={() => onDeleteReply(reply.id)}
            />
          ))}
          <div className="flex gap-3">
            <Avatar name={user?.name ?? "You"} />
            <NoteEditor
              key={composerKey}
              extras
              placeholder="Add a comment...."
              saveLabel="Reply"
              saveClass={replyBtnClass}
              onSave={(text, html) => {
                onReply(text, html)
                setComposerKey((k) => k + 1)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function QuestionRow({
  question,
  voted,
  onVote,
  onOpen,
  onOpenLecture,
}: {
  question: Question
  voted: number[]
  onVote: (id: number) => void
  onOpen: () => void
  onOpenLecture: (n: number) => void
}) {
  return (
    <li>
      <QuestionSummary question={question} voted={voted} onVote={onVote} onOpen={onOpen} onOpenLecture={onOpenLecture} />
    </li>
  )
}

function QaTab({
  course,
  lecture,
  onOpenLecture,
}: {
  course: Course
  lecture: number
  onOpenLecture: (n: number) => void
}) {
  const { user, notify } = useApp()
  const [items, setItems] = useLocal<Question[]>(`thkee.qa3.${course.id}`, seedQuestions(course))
  const [voted, setVoted] = useLocal<number[]>(`thkee.qaVoted.${course.id}`, [])
  const [followed, setFollowed] = useLocal<number[]>(`thkee.qaFollowed.${course.id}`, [])
  const [search, setSearch] = useState("")
  const [lectureFilter, setLectureFilter] = useState("all")
  // Starts on Most Upvoted so upvoted questions move to the front, as the design note asks.
  const [sort, setSort] = useState("upvoted")
  const [show, setShow] = useState("all")
  const [asking, setAsking] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (openId !== null) rootRef.current?.scrollIntoView({ block: "start" })
  }, [openId])

  const [title, setTitle] = useState("")
  const [text, setText] = useState("")

  const toggle = (setter: typeof setVoted, id: number) =>
    setter((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))
  const score = (q: Question) => q.votes + (voted.includes(q.id) ? 1 : 0)

  const q = search.trim().toLowerCase()
  const shown = items
    .filter((item) => !q || `${item.title} ${item.text}`.toLowerCase().includes(q))
    .filter((item) => lectureFilter === "all" || item.lecture === lecture)
    .filter((item) =>
      show === "following"
        ? followed.includes(item.id)
        : show === "asked"
          ? item.mine
          : show === "unanswered"
            ? item.answers.length === 0
            : true,
    )
    .sort((a, b) =>
      sort === "recent"
        ? b.created - a.created
        : sort === "upvoted"
          ? score(b) - score(a) || b.created - a.created
          : score(b) + b.answers.length * 2 - (score(a) + a.answers.length * 2),
    )

  const post = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !text.trim()) return
    const now = Date.now()
    setItems((list) => [
      { id: now, name: user?.name ?? "You", title: title.trim(), text: text.trim(), lecture, when: "just now", created: now, votes: 0, answers: [], mine: true },
      ...list,
    ])
    setSearch("")
    setLectureFilter("all")
    setShow("all")
    setSort("recent")
    setTitle("")
    setText("")
    setAsking(false)
    notify("Your question is posted ✓")
  }

  const updateAnswers = (id: number, change: (list: QaAnswer[]) => QaAnswer[]) =>
    setItems((list) => list.map((item) => (item.id === id ? { ...item, answers: change(item.answers) } : item)))

  const opened = items.find((item) => item.id === openId)
  if (opened)
    return (
      <div ref={rootRef} className="scroll-mt-[140px]">
        <QuestionDetail
          course={course}
          question={opened}
          total={items.length}
          voted={voted}
          following={followed.includes(opened.id)}
          onVote={(id) => toggle(setVoted, id)}
          onFollow={() => toggle(setFollowed, opened.id)}
          onOpenLecture={onOpenLecture}
          onBack={() => setOpenId(null)}
          onReply={(value, html) =>
            updateAnswers(opened.id, (list) => [...list, { id: Date.now(), name: user?.name ?? "You", text: value, html, when: "just now", votes: 0, mine: true }])
          }
          onEditReply={(id, value, html) =>
            updateAnswers(opened.id, (list) => list.map((a) => (a.id === id ? { ...a, text: value, html } : a)))
          }
          onDeleteReply={(id) => updateAnswers(opened.id, (list) => list.filter((a) => a.id !== id))}
        />
      </div>
    )

  const fieldCls = "field"

  return (
    <div ref={rootRef} className="flex scroll-mt-[140px] flex-col gap-6">
      <label className="field-box">
        <Svg className="size-[18px] shrink-0 text-[#475569]" stroke={2}>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </Svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search all course questions."
          aria-label="Search all course questions"
          className={`min-w-0 flex-1 bg-transparent text-[16px] text-[#0f172a] outline-none placeholder:text-slate-400 md:text-[14px] ${fontRegular}`}
        />
      </label>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <FilterSelect label="Filter by" options={qaLectureOptions} value={lectureFilter} onChange={setLectureFilter} />
        <FilterSelect label="Sort by" options={qaSortOptions} value={sort} onChange={setSort} />
        <FilterSelect label="Filter Questions" options={qaShowOptions} value={show} onChange={setShow} alignRight />
      </div>
      <h3 className={`m-0 border-b border-[#e2e8f0] pb-4 text-[22px] text-[#0f172a] ${fontRegular}`}>
        Questions and answers ({shown.length})
      </h3>
      {shown.length === 0 ? (
        <p className={`py-8 text-center text-[14px] text-[#64748b] ${fontRegular}`}>
          No questions match these filters.
        </p>
      ) : (
        <ul className="flex flex-col gap-8">
          {shown.map((item) => (
            <QuestionRow
              key={item.id}
              question={item}
              voted={voted}
              onVote={(id) => toggle(setVoted, id)}
              onOpen={() => setOpenId(item.id)}
              onOpenLecture={onOpenLecture}
            />
          ))}
        </ul>
      )}
      {asking ? (
        <form onSubmit={post} className="flex flex-col gap-3 rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-4 md:p-5">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Question title"
            aria-label="Question title"
            className={fieldCls}
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="What would you like to ask the instructor or other learners?"
            aria-label="Your question"
            className={fieldCls}
          />
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setAsking(false)}
              className={`h-[44px] rounded-[8px] px-4 text-[14px] text-[#0f172a] transition hover:bg-[#e2e8f0] ${fontMedium}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !text.trim()}
              className={`h-[44px] rounded-[8px] bg-[#ffb20d] px-5 text-[14px] text-[#1e293b] transition hover:bg-[#faa104] disabled:opacity-50 ${fontMedium}`}
            >
              Post question
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAsking(true)}
          className={`h-[44px] self-center rounded-[8px] bg-[#ffb20d] px-5 text-[14px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}
        >
          Ask your Questions
        </button>
      )}
    </div>
  )
}

function AnnouncementsTab({ course }: { course: Course }) {
  const items = [
    {
      title: "Urgent assignment submissions",
      body: `Dear students, we already uploaded two videos about this week's assignment for ${course.title}. Please watch them and submit your work before Thursday.`,
      month: "June",
      time: "3:00 PM",
    },
    {
      title: "New practice files added",
      body: "Dear students, updated exercise files for the hands-on section are ready. You can download them from the lesson resources.",
      month: "June",
      time: "11:30 AM",
    },
    {
      title: "Live Q&A session this week",
      body: "Join me for a live Q&A on Thursday at 7 PM (Riyadh time). Bring your questions about the project.",
      month: "May",
      time: "5:15 PM",
    },
    {
      title: "Welcome to the course",
      body: "Welcome, everyone! Start with the introduction section, then introduce yourself in the Q&A tab so we can get to know you.",
      month: "May",
      time: "9:00 AM",
    },
  ]
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="flex flex-col gap-6">
      <h3 className={`m-0 text-[22px] text-[#0f172a] ${fontRegular}`}>
        Instructor Announcements
      </h3>
      <ul className="flex flex-col gap-3">
        {items.map((a) => {
          const expanded = open === a.title
          return (
            <li key={a.title}>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : a.title)}
                className="flex w-full gap-3 rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] p-2 text-left transition hover:border-[#cbd5e1] sm:gap-4"
              >
                <span
                  className={`flex w-[72px] shrink-0 flex-col items-center justify-center gap-3 border-r border-[#e2e8f0] py-2 sm:w-[64px] ${fontRegular}`}
                >
                  <span className="text-[14px] text-[#475569]">{a.month}</span>
                  <span className="text-[12px] text-[#64748b]">{a.time}</span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-2 py-2 pr-2">
                  <span className={`text-[14px] text-[#1e293b] ${fontSemi}`}>
                    {a.title}
                  </span>
                  <span
                    className={`text-[14px] leading-[22px] text-[#475569] ${expanded ? "" : "truncate"} ${fontRegular}`}
                  >
                    {a.body}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <span
      className="relative inline-flex text-[16px] leading-none"
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5`}
    >
      <span className="text-[#e2e8f0]">★★★★★</span>
      <span
        className="absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap text-[#ffb20d]"
        style={{ width: `${(rating / 5) * 100}%` }}
      >
        ★★★★★
      </span>
    </span>
  )
}


function ReviewForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Review
  onSave: (rating: number, body: string) => void
  onCancel: () => void
}) {
  const [stars, setStars] = useState(initial?.rating ?? 0)
  const [hover, setHover] = useState(0)
  const [body, setBody] = useState(initial?.body ?? "")
  const [error, setError] = useState("")

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!stars) return setError("Please choose a star rating.")
    if (body.trim().length < 10)
      return setError("Please write at least 10 characters.")
    onSave(stars, body.trim())
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-4 rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-4 md:p-5"
    >
      <div
        className="flex items-center gap-1"
        role="group"
        aria-label="Your rating"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            aria-pressed={stars === n}
            onMouseEnter={() => setHover(n)}
            onClick={() => setStars(n)}
            className={`text-[24px] leading-none transition ${n <= (hover || stars) ? "text-[#ffb20d]" : "text-[#cbd5e1]"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        autoFocus
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="Share what you liked and what could be better"
        aria-label="Your review"
        className={"field"}
      />
      {error && (
        <p className={`text-[14px] text-[#dc2626] ${fontRegular}`}>{error}</p>
      )}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className={`h-[44px] rounded-[8px] px-4 text-[14px] text-[#0f172a] transition hover:bg-[#e2e8f0] ${fontMedium}`}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`h-[44px] rounded-[8px] bg-[#ffb20d] px-5 text-[14px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}
        >
          {initial ? "Save review" : "Submit review"}
        </button>
      </div>
    </form>
  )
}

const kebabClass =
  "flex size-7 items-center justify-center rounded-[6px] text-[#334155] transition hover:bg-[#f1f5f9]"
const kebabIcon = (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="12" cy="19" r="1.8" />
  </svg>
)

const thumbIcon =
  "M7 10v11H4a1 1 0 01-1-1v-9a1 1 0 011-1zM7 10l4-8a3 3 0 013 3v4h5.5a2 2 0 012 2.3l-1.3 8a2 2 0 01-2 1.7H7"

function ReviewRow({
  review,
  own,
  vote,
  reported,
  likes,
  onVote,
  onReport,
  onEdit,
}: {
  review: Review
  own: boolean
  vote?: "up" | "down"
  reported: boolean
  likes: number
  onVote: (vote: "up" | "down") => void
  onReport: () => void
  onEdit: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const long = review.body.length > 240

  const voteButton = (kind: "up" | "down") => (
    <button
      type="button"
      aria-label={kind === "up" ? "Helpful" : "Not helpful"}
      aria-pressed={vote === kind}
      onClick={() => onVote(kind)}
      className={`transition hover:text-[#0d5c4b] ${vote === kind ? "text-[#0d5c4b]" : "text-[#334155]"}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`size-[18px] ${kind === "down" ? "rotate-180" : ""}`}
        fill={vote === kind ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={thumbIcon} />
      </svg>
    </button>
  )

  return (
    <div className="flex gap-3 md:gap-4">
      <Avatar name={review.name} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <p
            dir="auto"
            className={`min-w-0 truncate text-left text-[16px] text-[#1e293b] ${fontFor(review.name, fontMedium, "font-medium")}`}
          >
            {review.name}
          </p>
          {own && (
            <div className="shrink-0">
              <ActionMenu
                label="Review options"
                triggerClass={kebabClass}
                trigger={kebabIcon}
                items={[{ label: "Edit", onClick: onEdit }]}
              />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`text-[14px] text-[#f5a524] ${fontMedium}`}>
            {review.rating.toFixed(1)}
          </span>
          <ReviewStars rating={review.rating} />
          <span className={`text-[12px] text-[#64748b] ${fontRegular}`}>
            Posted {review.when}
          </span>
        </div>
        <div className="relative">
          <p
            dir="auto"
            className={`text-left text-[14px] leading-[22px] text-[#1e293b] ${long && !expanded ? "line-clamp-3" : ""} ${fontFor(review.body, fontRegular, "font-normal")}`}
          >
            {review.body}
          </p>
          {long && !expanded && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[32px] bg-gradient-to-t from-white to-transparent" />
          )}
        </div>
        {long && (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className={`flex items-center gap-1 self-center text-[14px] text-[#f5a524] transition hover:text-[#b45309] ${fontMedium}`}
          >
            {expanded ? "Show less" : "Show more"}
            <Svg className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} stroke={2.2}>
              <path d="M6 9l6 6 6-6" />
            </Svg>
          </button>
        )}
        <div className={`mt-1 flex items-center gap-3 text-[14px] text-[#334155] ${fontRegular}`}>
          {voteButton("up")}
          <span className="tabular-nums">{likes}</span>
          {voteButton("down")}
          {!own && (
            <button
              type="button"
              onClick={onReport}
              disabled={reported}
              className="underline underline-offset-4 transition hover:text-[#0d5c4b] disabled:text-[#94a3b8] disabled:no-underline"
            >
              {reported ? "Reported" : "Report"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ReviewsTab({ course }: { course: Course }) {
  const { user, notify } = useApp()
  // Same key as the course page, so a review written in either place shows in both.
  const [mine, setMine] = useLocal<Review[]>(`thkee.reviews.${course.id}`, [])
  const [votes, setVotes] = useLocal<Record<string, "up" | "down">>(
    `thkee.reviewVotes.${course.id}`,
    {},
  )
  const [reports, setReports] = useLocal<string[]>(
    `thkee.reviewReports.${course.id}`,
    [],
  )
  const [editing, setEditing] = useState<number | "new" | null>(null)
  const count = Math.round(course.students * 0.23) + mine.length

  const save = (rating: number, body: string) => {
    if (editing === "new") {
      setMine((list) => [
        { name: user?.name ?? "You", when: "just now", rating, title: "My review", body },
        ...list,
      ])
      notify("Thanks! Your review is posted ✓")
    } else {
      setMine((list) =>
        list.map((r, i) => (i === editing ? { ...r, rating, body } : r)),
      )
      notify("Your review is updated ✓")
    }
    setEditing(null)
  }

  const row = (review: Review, own: boolean, baseLikes: number, onEdit: () => void) => {
    const vote = votes[review.name]
    return (
      <ReviewRow
        review={review}
        own={own}
        vote={vote}
        reported={reports.includes(review.name)}
        likes={baseLikes + (vote === "up" ? 1 : 0)}
        onVote={(kind) =>
          setVotes(({ [review.name]: current, ...rest }) =>
            current === kind ? rest : { ...rest, [review.name]: kind },
          )
        }
        onReport={() => {
          setReports((list) => [...list, review.name])
          notify("Thanks, we'll take a look at this review")
        }}
        onEdit={onEdit}
      />
    )
  }

  return (
    <div className="flex flex-col">
      <h3
        className={`-mx-4 m-0 border-b border-[#e2e8f0] px-4 pb-5 text-[22px] text-[#0f172a] md:-mx-6 md:px-6 ${fontRegular}`}
      >
        Course Reviews
      </h3>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2e8f0] py-6">
        <div className="flex flex-col gap-1.5">
          <p className={`text-[14px] text-[#94a3b8] ${fontRegular}`}>
            <span className={`text-[22px] text-[#0f172a] ${fontBold}`}>
              {course.rating.toFixed(1)}
            </span>{" "}
            out of 5
          </p>
          <div className="flex items-center gap-2">
            <ReviewStars rating={course.rating} />
            <span className={`text-[14px] text-[#94a3b8] ${fontRegular}`}>
              {count.toLocaleString()} reviews
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(mine.length ? 0 : "new")}
          className={`h-[44px] rounded-[8px] bg-[#ffb20d] px-5 text-[14px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}
        >
          {mine.length ? "Edit your review" : "Write a review"}
        </button>
      </div>
      {editing === "new" && (
        <div className="pt-6">
          <ReviewForm onSave={save} onCancel={() => setEditing(null)} />
        </div>
      )}
      <ul className="flex flex-col gap-8 pt-8">
        {mine.map((r, i) => (
          <li key={i}>
            {editing === i ? (
              <ReviewForm initial={r} onSave={save} onCancel={() => setEditing(null)} />
            ) : (
              row(r, true, 0, () => setEditing(i))
            )}
          </li>
        ))}
        {seedReviews.map((r) => (
          <li key={r.name}>{row(r, false, (r.name.length % 5) + 1, () => {})}</li>
        ))}
      </ul>
    </div>
  )
}
