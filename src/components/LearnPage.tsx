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
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  BubbleChatQuestionIcon,
  ChartBarLineIcon,
  GridViewIcon,
  HelpCircleIcon,
  InformationCircleIcon,
  Layers01Icon,
  Megaphone01Icon,
  Note01Icon,
  PlayListIcon,
  Share08Icon,
  StarIcon,
  Task01Icon,
  Tick02Icon,
  TranslateIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { buildCurriculum, seedReviews, type Lesson, type Review } from "./CourseDetailsPage"
import LessonPlayer from "./LessonPlayer"
import { DEMO_QUIZ_INSTRUCTIONS, QUIZ_LENGTH, QuizPanel, QuizRunner, type QuizResult } from "./Quiz"
import { ASSIGNMENT_QUESTIONS, AssignmentPanel, type AssignmentState } from "./Assignment"
import { ActionMenu, FilterSelect } from "./Menus"
import { ArticleReader, NoteBody, NoteEditor, NotesPanel, type LessonRef, type Note } from "./Notes"

// Demo playback runs 10x faster than the lesson length so a lesson can be finished in a few seconds.
const SPEED = 10
const tabs = ["Overview", "Q&A", "Notes", "Announcements", "Reviews"] as const
type Tab = typeof tabs[number]
const tabIcons: Record<Tab, IconSvgElement> = {
  Overview: InformationCircleIcon,
  "Q&A": BubbleChatQuestionIcon,
  Notes: Note01Icon,
  Announcements: Megaphone01Icon,
  Reviews: StarIcon,
}

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

// Looks for the course content list: "classic" (section bands, tick-off checkboxes), "minimal" (type-led, quiet), "timeline" (rail with status dots) or "checklist" (type icon left, status right).
const CURRICULUM_STYLE = "classic" as "classic" | "minimal" | "timeline" | "checklist"

function KindIcon({ kind, className = "size-4" }: { kind: Lesson["kind"]; className?: string }) {
  if (kind === "assignment")
    return (
      <Svg className={className}>
        <path d="M8 4h8v3H8zM6 6H5v15h14V6h-1M9 12h6M9 16h4" />
      </Svg>
    )
  if (kind === "quiz")
    return (
      <Svg className={className}>
        <path d="M9 9a3 3 0 115 2.2c-.8.5-1.5 1.1-1.5 2.3M12 17h.01" />
        <circle cx="12" cy="12" r="9" />
      </Svg>
    )
  if (kind === "article")
    return (
      <Svg className={className}>
        <path d="M4 5a2 2 0 012-2h6v18H6a2 2 0 01-2-2zM12 3h6a2 2 0 012 2v14a2 2 0 01-2 2h-6" />
      </Svg>
    )
  return (
    <Svg className={className}>
      <path d="M8 5.5v13l10.5-6.5z" />
    </Svg>
  )
}

const lessonLength = (l: Lesson) =>
  l.kind === "quiz" ? `${QUIZ_LENGTH} questions` : l.kind === "assignment" ? `${ASSIGNMENT_QUESTIONS.length} tasks` : `${l.minutes} min`

const kindLabel: Record<Lesson["kind"], string> = {
  video: "Video",
  article: "Article",
  quiz: "Quiz",
  assignment: "Assignment",
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
  const [rate, setRate] = useLocal("thkee.rate", 1)
  const [autoplay, setAutoplay] = useLocal("thkee.autoplay", true)
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
  const [quizResults, setQuizResults] = useLocal<Record<string, QuizResult>>(
    `thkee.quiz.${course.id}`,
    {},
  )
  const [moreOverview, setMoreOverview] = useState(false)
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

  const toggleDone = (lesson: FlatLesson) =>
    setProgress((p) => ({
      ...p,
      done: p.done.includes(lesson.key) ? p.done.filter((k) => k !== lesson.key) : [...p.done, lesson.key],
    }))

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
        const next = t + (SPEED / 4) * rate
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
  }, [playing, current.key, duration, rate])

  const prev = flat[current.index - 1]
  const next = flat[current.index + 1]

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
    return h ? `${h}h${mins % 60 ? ` ${mins % 60}m` : ""}` : `${mins} min`
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
      <header className="sticky top-0 z-100 flex h-16 items-center gap-3 border-b border-white/10 bg-slate-900 px-3 md:h-18 md:gap-4 md:px-6">
        <div className="group relative shrink-0">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? window.history.back() : goHome())}
            aria-label="Back to my classes"
            className="flex size-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <Svg className="size-5" stroke={2}>
              <path d="M15 6l-6 6 6 6" />
            </Svg>
          </button>
          <span className={`pointer-events-none absolute left-0 top-full mt-2 whitespace-nowrap rounded-md bg-white px-2.5 py-1.5 text-xs text-slate-900 opacity-0 shadow-popover transition group-hover:opacity-100 ${fontMedium}`}>
            Back to my classes
          </span>
        </div>

        <button type="button" onClick={goHome} aria-label="Thkee home" className="shrink-0">
          <img src="/assets/820a1.svg" alt="Thkee" className="h-6 w-auto md:h-7" />
        </button>

        <span className="hidden h-7 w-px bg-white/15 md:block" aria-hidden="true" />

        <div className="hidden min-w-0 flex-1 flex-col md:flex">
          <h1 dir="auto" className={`m-0 truncate text-start text-15 leading-tight text-white ${fontFor(course.title, fontSemi)}`}>
            {course.title}
          </h1>
          <p dir="auto" className={`truncate text-start text-xs leading-tight text-slate-400 ${fontRegular}`}>
            <span className="tabular-nums">
              Lesson {current.index + 1} of {flat.length}
            </span>
            <span className="mx-1.5 text-slate-600" aria-hidden="true">/</span>
            {current.title}
          </p>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 md:gap-3">
          {percent === 100 ? (
            <button
              type="button"
              onClick={certificate}
              className={`flex h-9 items-center gap-2 rounded-lg bg-secondary-500 px-3.5 text-sm text-slate-900 transition hover:bg-secondary-600 ${fontSemi}`}
            >
              <Svg className="size-4" stroke={2}>
                <circle cx="12" cy="9" r="6" />
                <path d="M8.5 14L7 21l5-3 5 3-1.5-7" />
              </Svg>
              <span className="hidden sm:inline">Get certificate</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={certificate}
              title="Finish every lesson to get your certificate"
              aria-label={`${percent}% complete. Finish every lesson to get your certificate`}
              className="flex h-9 items-center gap-3 rounded-lg px-2.5 transition hover:bg-white/10"
            >
              <span className="hidden flex-col items-end gap-1 sm:flex">
                <span className={`text-xs leading-none text-slate-300 ${fontRegular}`}>
                  <span className={`tabular-nums text-white ${fontSemi}`}>{percent}%</span> complete
                </span>
                <span className="h-1 w-28 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
                  <span className="block h-full rounded-full bg-primary-400 transition-all duration-700" style={{ width: `${percent}%` }} />
                </span>
              </span>
              <span className={`text-sm tabular-nums text-white sm:hidden ${fontSemi}`}>{percent}%</span>
            </button>
          )}

          <span className="hidden h-6 w-px bg-white/15 sm:block" aria-hidden="true" />

          <div className="group relative hidden sm:block">
            <button
              type="button"
              onClick={openNotes}
              aria-label="Notes and highlights"
              className="flex size-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <Svg className="size-5">
                <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5M9 13h6M9 17h4" />
              </Svg>
            </button>
            <span className={`pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-md bg-white px-2.5 py-1.5 text-xs text-slate-900 opacity-0 shadow-popover transition group-hover:opacity-100 ${fontMedium}`}>
              Notes and highlights
            </span>
          </div>

          <span
            className={`ml-1 flex size-8 items-center justify-center rounded-full bg-secondary-500 text-xs text-slate-900 ${fontSemi}`}
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
              <LessonPlayer
                course={course}
                current={current}
                prev={prev}
                next={next}
                time={time}
                duration={duration}
                playing={playing}
                rate={rate}
                autoplay={autoplay}
                sidebar={sidebar}
                done={progress.done.includes(current.key)}
                setTime={setTime}
                setPlaying={setPlaying}
                setRate={setRate}
                setAutoplay={setAutoplay}
                onPrev={() => prev && goTo(prev, playing)}
                onNext={() => next && goTo(next, playing)}
                onNote={openNotes}
                onToggleSidebar={() => setSidebar((s) => !s)}
                onCompleteReading={() => complete(current)}
                notify={notify}
              />
            )}

            {/* Tabs */}
            <div
              ref={tabsRef}
              className="sticky top-16 z-10 flex h-14 scroll-mt-18 items-center gap-3 border-b border-slate-200 bg-white/95 px-2 backdrop-blur-md md:top-18 md:px-4"
            >
              <div
                role="tablist"
                className="scrollbar-none flex h-full min-w-0 flex-1 items-stretch gap-1 overflow-x-auto"
              >
                {tabs.map((t) => {
                  const active = tab === t
                  const badge = t === "Notes" && notes.length ? notes.length : null
                  return (
                    <button
                      key={t}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setTab(t)}
                      className={`group/tab relative flex shrink-0 items-center gap-2 px-3 text-sm transition md:px-4 ${
                        active ? `text-slate-900 ${fontSemi}` : `text-slate-500 hover:text-slate-900 ${fontMedium}`
                      }`}
                    >
                      <HugeiconsIcon
                        icon={tabIcons[t]}
                        size={18}
                        strokeWidth={active ? 2 : 1.8}
                        aria-hidden="true"
                        className={active ? "text-primary-700" : "text-slate-400 transition group-hover/tab:text-slate-600"}
                      />
                      {t}
                      {badge !== null && (
                        <span
                          className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-11 leading-none tabular-nums ${
                            active ? "bg-primary-700 text-white" : "bg-slate-100 text-slate-600"
                          } ${fontSemi}`}
                        >
                          {badge}
                        </span>
                      )}
                      <span
                        aria-hidden="true"
                        className={`absolute inset-x-2 bottom-0 h-0.5 rounded-full transition ${
                          active ? "bg-primary-700" : "bg-transparent group-hover/tab:bg-slate-200"
                        }`}
                      />
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={share}
                className={`hidden h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 sm:flex ${fontMedium}`}
              >
                <HugeiconsIcon icon={Share08Icon} size={16} strokeWidth={1.8} aria-hidden="true" />
                Share course
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
            <aside className="lg:h-learn-panel relative flex flex-col border-l border-slate-200 bg-white lg:sticky lg:top-18">
              <button
                type="button"
                onClick={() => setSidebar(false)}
                aria-label="Hide course content"
                className="absolute -left-3 top-7 z-20 hidden size-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-card transition hover:text-slate-900 lg:flex"
              >
                <Svg className="size-3.5" stroke={2.4}>
                  <path d="M9 6l6 6-6 6" />
                </Svg>
              </button>

              <div className="flex flex-col gap-4 border-b border-slate-200 px-5 pb-4 pt-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className={`m-0 text-lg text-slate-900 ${fontHeading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
                    Course content
                  </h2>
                  <span className={`text-sm tabular-nums text-slate-900 ${fontSemi}`}>{percent}%</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div
                    className="h-1 w-full overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Course progress"
                  >
                    <div className="h-full rounded-full bg-primary-700 transition-all duration-700" style={{ width: `${percent}%` }} />
                  </div>
                  <span className={`text-xs tabular-nums text-slate-500 ${fontRegular}`}>
                    {doneCount} of {flat.length} lessons · {minutesLabel(flat.reduce((m, l) => m + l.minutes, 0))} total
                  </span>
                </div>
                <label className="flex h-9 items-center gap-2 rounded-lg bg-slate-100 px-3 transition focus-within:bg-white focus-within:ring-1 focus-within:ring-slate-300">
                  <Svg className="size-4 text-slate-400" stroke={2}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                  </Svg>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search lessons"
                    aria-label="Search lessons"
                    className={`min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 md:text-sm ${fontRegular}`}
                  />
                  {search && (
                    <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="flex size-5 items-center justify-center rounded-full text-slate-400 transition hover:text-slate-700">
                      <Svg className="size-3.5" stroke={2.2}>
                        <path d="M6 6l12 12M18 6L6 18" />
                      </Svg>
                    </button>
                  )}
                </label>
              </div>

              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
                {sectionView.length === 0 && (
                  <p className={`px-5 py-8 text-center text-sm text-slate-500 ${fontRegular}`}>
                    No lessons match "{search}".
                  </p>
                )}
                {sectionView.map((s) => {
                  const all = flat.filter((l) => l.section === s.si)
                  const done = all.filter((l) => progress.done.includes(l.key)).length
                  const open = !!q || openSections.includes(s.si)
                  const isCurrentSection = current.section === s.si
                  return (
                    <div key={s.si} className="border-b border-slate-150 last:border-b-0">
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() =>
                          setOpenSections((list) =>
                            list.includes(s.si) ? list.filter((x) => x !== s.si) : [...list, s.si],
                          )
                        }
                        className={`group flex w-full items-center gap-3 px-5 text-left transition-colors ${CURRICULUM_STYLE === "classic" ? "bg-slate-50 py-3.5 hover:bg-slate-100" : CURRICULUM_STYLE === "minimal" ? "py-4" : `py-4 hover:bg-slate-50 ${open ? "bg-slate-25" : ""}`}`}
                      >
                        {CURRICULUM_STYLE === "classic" ? (
                          <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className={`text-sm leading-snug text-slate-900 ${fontSemi}`}>
                              Section {s.si + 1}: {s.title.replace(/^\d+\.\s*/, "")}
                            </span>
                            <span className={`flex items-center gap-2 text-xs tabular-nums text-slate-500 ${fontRegular}`}>
                              <span className={done === all.length ? `text-primary-700 ${fontMedium}` : ""}>
                                {done} / {all.length}
                              </span>
                              <span className="h-3 w-px bg-slate-300" aria-hidden="true" />
                              {minutesLabel(all.reduce((m, l) => m + l.minutes, 0))}
                            </span>
                          </span>
                        ) : CURRICULUM_STYLE === "minimal" ? (
                          <>
                            <span className="flex min-w-0 flex-1 flex-col gap-1">
                              <span className={`text-15 leading-snug text-slate-900 transition-colors group-hover:text-primary-700 ${fontHeading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
                                {s.title.replace(/^\d+\.\s*/, "")}
                              </span>
                              <span className={`text-xs tabular-nums text-slate-400 ${fontRegular}`}>
                                {all.length} lessons · {minutesLabel(all.reduce((m, l) => m + l.minutes, 0))}
                              </span>
                            </span>
                            <span className={`flex shrink-0 items-center gap-1 text-xs tabular-nums ${done === all.length ? "text-primary-700" : "text-slate-500"} ${fontMedium}`}>
                              {done === all.length ? (
                                <>
                                  <Svg className="size-3.5" stroke={2.4}>
                                    <path d="M5 12l5 5 9-10" />
                                  </Svg>
                                  Completed
                                </>
                              ) : (
                                `${done}/${all.length}`
                              )}
                            </span>
                          </>
                        ) : CURRICULUM_STYLE === "timeline" ? (
                          <>
                        <span className="flex min-w-0 flex-1 flex-col gap-2">
                          <span className="flex flex-col gap-0.5">
                            <span className={`text-15 leading-snug text-slate-900 ${fontSemi}`}>
                              {s.title.replace(/^\d+\.\s*/, "")}
                            </span>
                            <span className={`text-xs text-slate-500 ${fontRegular}`}>
                              Section {s.si + 1} · {all.length} lessons · {minutesLabel(all.reduce((m, l) => m + l.minutes, 0))}
                            </span>
                          </span>
                          <span className="flex items-center gap-2.5">
                            <span className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                              <span
                                className={`block h-full rounded-full transition-all duration-500 ${done === all.length ? "bg-primary-700" : "bg-primary-400"}`}
                                style={{ width: `${(done / all.length) * 100}%` }}
                              />
                            </span>
                            {done === all.length ? (
                              <span className={`flex items-center gap-1 text-xs text-primary-700 ${fontSemi}`}>
                                <Svg className="size-3.5" stroke={2.6}>
                                  <path d="M5 12l5 5 9-10" />
                                </Svg>
                                Completed
                              </span>
                            ) : (
                              <span className={`text-xs ${done > 0 || isCurrentSection ? "text-slate-700" : "text-slate-400"} ${fontMedium}`}>
                                {done}/{all.length} done
                              </span>
                            )}
                          </span>
                        </span>
                          </>
                        ) : (
                          <>
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className={`text-15 leading-snug text-slate-900 ${fontSemi}`}>
                            {s.title.replace(/^\d+\.\s*/, "")}
                          </span>
                          <span className={`text-xs text-slate-500 ${fontRegular}`}>
                            {all.length} lessons · {minutesLabel(all.reduce((m, l) => m + l.minutes, 0))}
                          </span>
                        </span>
                        {done === all.length ? (
                          <span className={`flex shrink-0 items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-xs text-primary-700 ${fontSemi}`}>
                            <Svg className="size-3.5" stroke={2.6}>
                              <path d="M5 12l5 5 9-10" />
                            </Svg>
                            Done
                          </span>
                        ) : (
                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-xs ${fontSemi} ${
                              done > 0 || isCurrentSection ? "bg-primary-50 text-primary-700" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {done}/{all.length}
                          </span>
                        )}
                          </>
                        )}
                        <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition group-hover:bg-white group-hover:text-slate-700 ${open ? "text-slate-700" : ""}`}>
                          <Svg className={`size-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} stroke={2.2}>
                            <path d="M6 9l6 6 6-6" />
                          </Svg>
                        </span>
                      </button>

                      {open && (
                        <ol className={CURRICULUM_STYLE === "classic" ? "fade-up" : CURRICULUM_STYLE === "minimal" ? "fade-up pb-3" : CURRICULUM_STYLE === "timeline" ? "fade-up pb-2" : "fade-up flex flex-col gap-0.5 pb-3"}>
                          {s.items.map((l, i) => {
                            const isDone = progress.done.includes(l.key)
                            const isCurrent = l.key === current.key
                            const last = i === s.items.length - 1
                            return CURRICULUM_STYLE === "classic" ? (
                              <li key={l.key} className={`flex items-start gap-3 py-3 pl-5 pr-5 transition-colors ${isCurrent ? "bg-slate-100" : "hover:bg-slate-50"}`}>
                                <button
                                  type="button"
                                  role="checkbox"
                                  aria-checked={isDone}
                                  aria-label={`Mark "${l.title}" as ${isDone ? "not complete" : "complete"}`}
                                  onClick={() => toggleDone(l)}
                                  className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                                    isDone ? "border-primary-700 bg-primary-700 text-white" : "border-slate-400 bg-white hover:border-slate-600"
                                  }`}
                                >
                                  {isDone && (
                                    <Svg className="size-3" stroke={3}>
                                      <path d="M5 12l5 5 9-10" />
                                    </Svg>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => goTo(l)}
                                  aria-current={isCurrent ? "true" : undefined}
                                  className="flex min-w-0 flex-1 flex-col gap-1 text-left"
                                >
                                  <span className={`text-sm leading-snug ${isCurrent ? `text-slate-900 ${fontSemi}` : `text-slate-800 ${fontRegular}`}`}>
                                    {l.title}
                                  </span>
                                  <span className={`flex items-center gap-1.5 text-xs text-slate-500 ${fontRegular}`}>
                                    <KindIcon kind={l.kind} className="size-3.5" />
                                    {lessonLength(l)}
                                    {isCurrent && playing && <span className={`ml-1 text-primary-700 ${fontMedium}`}>Playing</span>}
                                  </span>
                                </button>
                              </li>
                            ) : CURRICULUM_STYLE === "minimal" ? (
                              <li key={l.key}>
                                <button
                                  type="button"
                                  onClick={() => goTo(l)}
                                  aria-current={isCurrent ? "true" : undefined}
                                  className="group/lesson relative flex w-full items-start gap-3 py-2 pl-5 pr-5 text-left"
                                >
                                  {isCurrent && <span aria-hidden="true" className="absolute inset-y-1.5 left-0 w-0.5 bg-primary-700" />}
                                  <span className="flex h-5 w-4 shrink-0 items-center text-primary-700">
                                    {isDone && (
                                      <Svg className="size-3.5" stroke={2.4}>
                                        <path d="M5 12l5 5 9-10" />
                                      </Svg>
                                    )}
                                    {isDone && <span className="sr-only">Completed</span>}
                                  </span>
                                  <span className="flex min-w-0 flex-1 flex-col">
                                    <span
                                      className={`text-sm leading-5 transition-colors ${
                                        isCurrent
                                          ? `text-slate-900 ${fontSemi}`
                                          : isDone
                                            ? `text-slate-400 group-hover/lesson:text-slate-600 ${fontRegular}`
                                            : `text-slate-700 group-hover/lesson:text-slate-900 ${fontRegular}`
                                      }`}
                                    >
                                      {l.title}
                                    </span>
                                    {isCurrent && (
                                      <span className={`text-xs text-primary-700 ${fontMedium}`}>{playing ? "Now playing" : "Continue here"}</span>
                                    )}
                                  </span>
                                  <span className={`shrink-0 text-xs leading-5 tabular-nums ${isCurrent ? "text-slate-600" : "text-slate-400"} ${fontRegular}`}>
                                    {l.kind === "video" ? lessonLength(l) : `${kindLabel[l.kind]} · ${lessonLength(l)}`}
                                  </span>
                                </button>
                              </li>
                            ) : CURRICULUM_STYLE === "timeline" ? (
                              <li key={l.key} className="relative">
                                {!last && (
                                  <span
                                    aria-hidden="true"
                                    className={`absolute -bottom-5.5 left-8.75 top-5.5 z-1 w-0.5 ${isDone ? "bg-primary-400" : "bg-slate-200"}`}
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={() => goTo(l)}
                                  aria-current={isCurrent ? "true" : undefined}
                                  className={`group/lesson relative flex w-full items-start gap-3 py-2.5 pl-6 pr-5 text-left transition-colors ${
                                    isCurrent ? "bg-primary-50" : "hover:bg-slate-50"
                                  }`}
                                >
                                  {isCurrent && <span aria-hidden="true" className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-primary-700" />}
                                  <span
                                    className={`relative z-2 flex size-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                                      isDone
                                        ? "bg-primary-700 text-white"
                                        : isCurrent
                                          ? "bg-white text-primary-700 ring-2 ring-primary-700"
                                          : "bg-white text-slate-400 ring-1 ring-slate-300 group-hover/lesson:ring-slate-400"
                                    }`}
                                  >
                                    {isDone ? (
                                      <Svg className="size-3.5" stroke={2.8}>
                                        <path d="M5 12l5 5 9-10" />
                                      </Svg>
                                    ) : isCurrent ? (
                                      <svg viewBox="0 0 24 24" className="ml-0.5 size-2.5" fill="currentColor" aria-hidden="true">
                                        <path d="M7 4.5v15l12-7.5z" />
                                      </svg>
                                    ) : (
                                      <span className="size-1.5 rounded-full bg-slate-300 transition-colors group-hover/lesson:bg-slate-400" aria-hidden="true" />
                                    )}
                                  </span>
                                  <span className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
                                    <span
                                      className={`text-sm leading-snug ${
                                        isCurrent ? `text-slate-900 ${fontSemi}` : isDone ? `text-slate-500 ${fontRegular}` : `text-slate-700 ${fontRegular}`
                                      }`}
                                    >
                                      {l.title}
                                    </span>
                                    <span className={`flex items-center gap-2 text-xs ${isCurrent ? "text-primary-700" : "text-slate-400"} ${fontRegular}`}>
                                      <LessonMeta lesson={l} />
                                      <span className="size-0.5 rounded-full bg-current opacity-50" aria-hidden="true" />
                                      {kindLabel[l.kind]}
                                      {isCurrent && (
                                        <span className={`ml-auto flex items-center gap-1 rounded-full bg-primary-700 px-2 py-0.5 text-10 uppercase tracking-label text-white ${fontSemi}`}>
                                          <span className="size-1.5 animate-pulse rounded-full bg-secondary-400" />
                                          {playing ? "Playing" : "Now"}
                                        </span>
                                      )}
                                    </span>
                                  </span>
                                </button>
                              </li>
                            ) : (
                              <li key={l.key} className="px-3">
                                <button
                                  type="button"
                                  onClick={() => goTo(l)}
                                  aria-current={isCurrent ? "true" : undefined}
                                  className={`group/lesson flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                                    isCurrent ? "bg-primary-50 ring-1 ring-primary-200" : "hover:bg-slate-50"
                                  }`}
                                >
                                  <span
                                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                      isCurrent ? "bg-primary-700 text-white shadow-primary-chip" : isDone ? "bg-primary-50 text-primary-700" : "bg-slate-100 text-slate-500 group-hover/lesson:bg-slate-150"
                                    }`}
                                  >
                                    <KindIcon kind={l.kind} />
                                  </span>
                                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                    <span className={`text-sm leading-snug ${isCurrent ? `text-slate-900 ${fontSemi}` : isDone ? `text-slate-500 ${fontRegular}` : `text-slate-800 ${fontRegular}`}`}>
                                      {l.title}
                                    </span>
                                    <span className={`text-xs ${isCurrent ? `text-primary-700 ${fontMedium}` : `text-slate-400 ${fontRegular}`}`}>
                                      {isCurrent ? `${playing ? "Playing" : "Up now"} · ${lessonLength(l)}` : `${kindLabel[l.kind]} · ${lessonLength(l)}`}
                                    </span>
                                  </span>
                                  {isDone ? (
                                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white" aria-label="Completed">
                                      <Svg className="size-3" stroke={3}>
                                        <path d="M5 12l5 5 9-10" />
                                      </Svg>
                                    </span>
                                  ) : isCurrent ? (
                                    <span className="flex h-4 shrink-0 items-end gap-0.5" aria-hidden="true">
                                      {[0, 1, 2].map((n) => (
                                        <span key={n} className={`w-0.5 rounded-full bg-primary-700 ${playing ? "animate-pulse" : ""} ${n === 1 ? "h-4" : n === 0 ? "h-2.5" : "h-3"}`} />
                                      ))}
                                    </span>
                                  ) : (
                                    <span className="size-5 shrink-0 rounded-full border-2 border-slate-200 transition-colors group-hover/lesson:border-slate-300" aria-hidden="true" />
                                  )}
                                </button>
                              </li>
                            )
                          })}
                        </ol>
                      )}
                    </div>
                  )
                })}
              </div>
            </aside>
          ) : (
            <button
              type="button"
              onClick={() => setSidebar(true)}
              aria-label="Show course content"
              title="Show course content"
              className="fixed right-0 top-28 z-20 hidden h-9 w-8 items-center justify-center rounded-l-xl border border-r-0 border-slate-200 bg-white pl-1 text-slate-500 shadow-panel transition-all hover:w-10 hover:text-primary-700 lg:flex"
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

function HIcon({ icon, size = 18, className = "" }: { icon: IconSvgElement; size?: number; className?: string }) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.8} aria-hidden="true" className={`shrink-0 ${className}`} />
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 border-t border-slate-100 py-5 first:border-t-0 first:pt-0 last:pb-0 md:grid-cols-label md:gap-6">
      <h3 className={`text-sm text-slate-900 ${fontSemi}`}>{label}</h3>
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
  const count = (kind: Lesson["kind"]) => lessons.filter((l) => l.kind === kind).length
  const totalMin = lessons.reduce((sum, l) => sum + l.minutes, 0)
  const language = /[؀-ۿ]/.test(course.title) ? "Arabic" : "English"
  const topics = courseTags[course.id] ?? [course.subcategory]
  const initials = course.instructor
    .replace(/^(د\.|Dr\.)\s*/, "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")

  const details: [IconSvgElement, string, string][] = [
    [ChartBarLineIcon, "Level", course.level],
    [UserGroupIcon, "Students", course.students.toLocaleString()],
    [TranslateIcon, "Language", language],
    [PlayListIcon, "Lectures", String(lessons.length)],
    [GridViewIcon, "Category", course.category],
    [HelpCircleIcon, "Quizzes", String(count("quiz"))],
    [Layers01Icon, "Sub category", course.subcategory],
    [Task01Icon, "Assignments", String(count("assignment"))],
  ]

  return (
    <div className="flex max-w-4xl flex-col">
      <Row label="About">
        <p
          dir="auto"
          className={`text-start text-sm leading-relaxed text-slate-700 ${fontFor(course.description, fontRegular, "font-normal")}`}
        >
          {course.description}
        </p>
      </Row>

      <Row label="Instructor">
        <div className="flex items-center gap-3">
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-700 text-sm text-white ${fontSemi}`}>
            {initials}
          </span>
          <div className="min-w-0">
            <p dir="auto" className={`text-start text-sm text-slate-900 ${fontFor(course.instructor, fontSemi, "font-semibold")}`}>
              {course.instructor}
            </p>
            <p className={`flex flex-wrap items-center gap-x-2 text-xs text-slate-500 ${fontRegular}`}>
              {course.subcategory} instructor
              <span className="text-slate-300" aria-hidden="true">•</span>
              <span className="inline-flex items-center gap-1">
                <HIcon icon={StarIcon} size={12} className="fill-current text-secondary-500" />
                <span className={`text-slate-700 ${fontMedium}`}>{course.rating.toFixed(1)}</span>
              </span>
              <span className="text-slate-300" aria-hidden="true">•</span>
              {Math.floor(totalMin / 60)}h {totalMin % 60}m of content
            </p>
          </div>
        </div>
      </Row>

      <Row label="Course details">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
          {details.map(([icon, label, value]) => (
            <div key={label} className={`flex items-start gap-2.5 text-sm ${fontRegular}`}>
              <HIcon icon={icon} size={16} className="mt-0.5 text-slate-400" />
              <dt className="w-24 shrink-0 text-slate-500">{label}</dt>
              <dd className={`m-0 min-w-0 text-slate-900 ${fontMedium}`}>{value}</dd>
            </div>
          ))}
        </dl>
      </Row>

      <Row label="Overview">
        <div className="relative">
          <div
            className={`flex flex-col gap-3 text-sm leading-relaxed text-slate-600 ${fontRegular} ${
              more ? "" : "max-h-24 overflow-hidden"
            }`}
          >
            <p>
              In this {course.level.toLowerCase()} course you learn {course.subcategory.toLowerCase()} step by step
              through {lessons.length} short lessons. Each section ends with a short exercise, so you practise what you
              learn before moving on.
            </p>
            <div>
              <p className={`mb-2 text-slate-900 ${fontMedium}`}>What you will be able to do by the end</p>
              <ul className="flex flex-col gap-1.5">
                {course.outcomes.map((o) => (
                  <li key={o} dir="auto" className="flex items-start gap-2">
                    <HIcon icon={Tick02Icon} size={16} className="mt-0.5 text-primary-700" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`mr-1 text-slate-900 ${fontMedium}`}>Topics</span>
              {topics.map((t) => (
                <span key={t} className={`rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700 ${fontMedium}`}>
                  {t}
                </span>
              ))}
            </div>
          </div>
          {!more && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-white/0" />
          )}
        </div>
        <button
          type="button"
          onClick={onMore}
          aria-expanded={more}
          className={`mt-2 inline-flex items-center gap-1 text-sm text-primary-700 transition hover:text-primary-800 ${fontSemi}`}
        >
          {more ? "Show less" : "Show more"}
          <HIcon icon={ArrowDown01Icon} size={16} className={`transition-transform ${more ? "rotate-180" : ""}`} />
        </button>
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
      date: "Jun 12 · 3:00 PM",
    },
    {
      title: "New practice files added",
      body: "Dear students, updated exercise files for the hands-on section are ready. You can download them from the lesson resources.",
      date: "Jun 4 · 11:30 AM",
    },
    {
      title: "Live Q&A session this week",
      body: "Join me for a live Q&A on Thursday at 7 PM (Riyadh time). Bring your questions about the project.",
      date: "May 27 · 5:15 PM",
    },
    {
      title: "Welcome to the course",
      body: "Welcome, everyone! Start with the introduction section, then introduce yourself in the Q&A tab so we can get to know you.",
      date: "May 20 · 9:00 AM",
    },
  ]
  return (
    <div className="flex max-w-3xl flex-col gap-2">
      <h3 className={`m-0 text-lg text-slate-900 ${fontSemi}`}>Announcements</h3>
      <ul className="divide-y divide-slate-100">
        {items.map((a) => (
          <li key={a.title} className="py-4">
            <p className={`text-xs text-slate-400 ${fontRegular}`}>{a.date}</p>
            <h4 className={`mt-1 text-15 text-slate-900 ${fontSemi}`}>{a.title}</h4>
            <p className={`mt-1 text-sm leading-relaxed text-slate-600 ${fontRegular}`}>{a.body}</p>
          </li>
        ))}
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
