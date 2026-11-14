import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { courses, type Course } from "../data";
import {
  fontBold,
  fontFor,
  fontHeading,
  fontMedium,
  fontRegular,
  fontSemi,
} from "../fonts";
import { useApp } from "../store";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  CheckmarkBadge01Icon,
  Comment01Icon,
  Notification01Icon,
  ThumbsUpIcon,
  BubbleChatQuestionIcon,
  ChartBarLineIcon,
  GridViewIcon,
  HelpCircleIcon,
  InformationCircleIcon,
  Layers01Icon,
  Route01Icon,
  Megaphone01Icon,
  Note01Icon,
  PlayListIcon,
  SparklesIcon,
  Share08Icon,
  StarIcon,
  Task01Icon,
  Tick02Icon,
  TranslateIcon,
  UserGroupIcon,
  Folder01Icon,
} from "@hugeicons/core-free-icons";
import { buildCurriculum, type Lesson } from "./CourseDetailsPage";
import LessonPlayer from "./LessonPlayer";
import ShareCourseDialog from "./ShareCourseDialog";
import {
  DEMO_QUIZ_INSTRUCTIONS,
  QUIZ_LENGTH,
  QuizPanel,
  QuizRunner,
  PASS_MARK,
  type QuizResult,
} from "./Quiz";
import {
  ASSIGNMENT_QUESTIONS,
  AssignmentPanel,
  type AssignmentState,
} from "./Assignment";
import { ActionMenu, FilterSelect } from "./Menus";
import {
  ArticleReader,
  NoteBody,
  NoteEditor,
  NotesPanel,
  type LessonRef,
  type Note,
} from "./Notes";
import {
  AnnouncementBanner,
  AskPanel,
  CheckpointCard,
  LessonBar,
  LessonSection,
  PinnedAnnouncements,
  TranscriptPanel,
  announcementsFor,
  buildChapters,
  buildCheckpoints,
  buildTranscript,
  clock as clockLabel,
  lessonGoal,
  type CheckResult,
  type TranscriptLine,
} from "./LessonLearning";
import { buttonClass } from "./Button";

// Demo playback runs 10x faster than the lesson length so a lesson can be finished in a few seconds.
const SPEED = 10;
// Tools used while watching sit in the side panel; reading material sits under the video.
const panels = ["Contents", "Notes", "Transcript", "Ask"] as const;
type Panel = (typeof panels)[number];
const panelIcons: Record<Panel, IconSvgElement> = {
  Contents: Route01Icon,
  Notes: Note01Icon,
  Transcript: PlayListIcon,
  Ask: SparklesIcon,
};
const belowTabs = ["Resources", "Lesson", "Discussion", "Course"] as const;
type Below = (typeof belowTabs)[number];
const belowIcons: Record<Below, IconSvgElement> = {
  Resources: Folder01Icon,
  Lesson: InformationCircleIcon,
  Discussion: BubbleChatQuestionIcon,
  Course: Layers01Icon,
};

type FlatLesson = Lesson & { key: string; section: number; index: number };
type QaAnswer = {
  id: number;
  name: string;
  text: string;
  html?: string;
  when: string;
  votes: number;
  instructor?: boolean;
  mine?: boolean;
};
type Question = {
  id: number;
  name: string;
  title: string;
  text: string;
  lecture: number;
  when: string;
  created: number;
  votes: number;
  answers: QaAnswer[];
  mine?: boolean;
};

function useLocal<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue] as const;
}

const clock = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

function Svg({
  children,
  className = "size-5",
  stroke = 1.8,
}: {
  children: ReactNode;
  className?: string;
  stroke?: number;
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
  );
}

function LessonMeta({ lesson }: { lesson: Lesson }) {
  if (lesson.kind === "assignment")
    return (
      <span className="flex items-center gap-1.5">
        <Svg className="size-3.5">
          <path d="M8 4h8v3H8zM6 6H5v15h14V6h-1M9 12h6M9 16h4" />
        </Svg>
        {ASSIGNMENT_QUESTIONS.length} asgmt.
      </span>
    );
  if (lesson.kind === "quiz")
    return (
      <span className="flex items-center gap-1.5">
        <Svg className="size-3.5">
          <path d="M9 9a3 3 0 115 2.2c-.8.5-1.5 1.1-1.5 2.3M12 17h.01" />
          <circle cx="12" cy="12" r="9" />
        </Svg>
        {QUIZ_LENGTH} ques.
      </span>
    );
  return (
    <span className="flex items-center gap-1.5">
      {lesson.kind === "article" ? (
        <Svg className="size-3.5">
          <path d="M4 5a2 2 0 012-2h6v18H6a2 2 0 01-2-2zM12 3h6a2 2 0 012 2v14a2 2 0 01-2 2h-6" />
        </Svg>
      ) : (
        <Svg className="size-3.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M10 9l5 3-5 3z" />
        </Svg>
      )}
      {lesson.minutes} min
    </span>
  );
}

// Looks for the course content list: "classic" (section bands, tick-off checkboxes), "minimal" (type-led, quiet), "timeline" (rail with status dots) or "checklist" (type icon left, status right).
const CURRICULUM_STYLE = "classic" as
  | "classic"
  | "minimal"
  | "timeline"
  | "checklist";

function KindIcon({
  kind,
  className = "size-4",
}: {
  kind: Lesson["kind"];
  className?: string;
}) {
  if (kind === "assignment")
    return (
      <Svg className={className}>
        <path d="M8 4h8v3H8zM6 6H5v15h14V6h-1M9 12h6M9 16h4" />
      </Svg>
    );
  if (kind === "quiz")
    return (
      <Svg className={className}>
        <path d="M9 9a3 3 0 115 2.2c-.8.5-1.5 1.1-1.5 2.3M12 17h.01" />
        <circle cx="12" cy="12" r="9" />
      </Svg>
    );
  if (kind === "article")
    return (
      <Svg className={className}>
        <path d="M4 5a2 2 0 012-2h6v18H6a2 2 0 01-2-2zM12 3h6a2 2 0 012 2v14a2 2 0 01-2 2h-6" />
      </Svg>
    );
  return (
    <Svg className={className}>
      <path d="M8 5.5v13l10.5-6.5z" />
    </Svg>
  );
}

const lessonLength = (l: Lesson) =>
  l.kind === "quiz"
    ? `${QUIZ_LENGTH} questions`
    : l.kind === "assignment"
      ? `${ASSIGNMENT_QUESTIONS.length} tasks`
      : `${l.minutes} min`;

const kindLabel: Record<Lesson["kind"], string> = {
  video: "Video",
  article: "Article",
  quiz: "Quiz",
  assignment: "Assignment",
};

// The course outline as a path: one stop per chapter, the current chapter opened with its lessons,
// and the certificate as the last stop. Replaces the classic "Course content" checklist.
function PathRail({
  sections,
  flat,
  done,
  current,
  playing,
  onOpen,
  onCertificate,
}: {
  sections: { title: string }[];
  flat: FlatLesson[];
  done: string[];
  current: FlatLesson;
  playing: boolean;
  onOpen: (lesson: FlatLesson) => void;
  onCertificate: () => void;
}) {
  const [open, setOpen] = useState<number | null>(current.section);
  useEffect(() => setOpen(current.section), [current.section]);

  const chapterLessons = sections.map((_, si) => flat.filter((l) => l.section === si));
  const chapterDone = chapterLessons.map((items) => items.length > 0 && items.every((l) => done.includes(l.key)));
  const chaptersFinished = chapterDone.filter(Boolean).length;
  const allDone = done.length >= flat.length;
  const cleanTitle = (t: string) => t.replace(/^\d+\.\s*/, "");
  const minutesOf = (items: FlatLesson[]) => {
    const m = items.reduce((sum, l) => sum + (l.kind === "video" || l.kind === "article" ? l.minutes : 0), 0);
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-1 border-b border-slate-200 px-5 pb-4 pt-5">
        <span className={`text-xs uppercase tracking-wider text-slate-500 ${fontSemi}`}>Your path</span>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className={`m-0 text-lg text-slate-900 ${fontHeading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
            {chaptersFinished} of {sections.length} chapters
          </h2>
          <span className={`text-13 tabular-nums text-slate-500 ${fontRegular}`}>
            {done.length}/{flat.length} lessons
          </span>
        </div>
      </div>

      <ol className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {sections.map((s, si) => {
          const items = chapterLessons[si];
          const finished = chapterDone[si];
          const isCurrent = current.section === si;
          const expanded = open === si;
          const count = items.filter((l) => done.includes(l.key)).length;
          return (
            <li key={si} className="relative pb-2">
              {/* Connector to the next stop: solid once this chapter is finished, dashed while it is still ahead. */}
              <span
                aria-hidden="true"
                className={`absolute bottom-0 left-3.5 top-9 border-l-2 ${finished ? "border-primary-700" : "border-dashed border-slate-300"}`}
              />
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : si)}
                aria-expanded={expanded}
                className="group relative flex w-full items-start gap-3 rounded-xl px-1 py-1.5 text-left"
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-11 tabular-nums ${fontSemi} ${
                    finished
                      ? "bg-primary-700 text-white"
                      : isCurrent
                        ? "bg-white text-primary-700 ring-2 ring-primary-700"
                        : "bg-white text-slate-500 ring-1 ring-slate-300"
                  }`}
                >
                  {finished ? (
                    <Svg className="size-3.5" stroke={3}>
                      <path d="M5 12l5 5 9-10" />
                    </Svg>
                  ) : (
                    si + 1
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    dir="auto"
                    className={`text-start text-sm leading-snug transition-colors group-hover:text-primary-800 ${isCurrent ? `text-slate-900 ${fontSemi}` : `text-slate-700 ${fontMedium}`}`}
                  >
                    {cleanTitle(s.title)}
                  </span>
                  <span className={`text-xs tabular-nums text-slate-500 ${fontRegular}`}>
                    {finished ? "Finished" : `${count}/${items.length} lessons`} · {minutesOf(items)}
                  </span>
                </span>
                <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-md text-slate-500 transition group-hover:bg-slate-100">
                  <Svg className={`size-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} stroke={2.2}>
                    <path d="M6 9l6 6 6-6" />
                  </Svg>
                </span>
              </button>

              {expanded && (
                // Lessons sit on the same line as the chapters, like stops between two stations.
                <ul className="fade-up relative mt-1 flex flex-col pl-8">
                  {items.map((l) => {
                    const isDone = done.includes(l.key);
                    const isNow = l.key === current.key;
                    return (
                      <li key={l.key} className="relative">
                        <span
                          aria-hidden="true"
                          className={`absolute -left-5.5 top-3.5 size-2.5 rounded-full ${
                            isDone ? "bg-primary-700" : isNow ? "bg-secondary-500 ring-4 ring-secondary-100" : "bg-white ring-2 ring-slate-300"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => onOpen(l)}
                          aria-current={isNow ? "step" : undefined}
                          className={`group/l flex w-full items-baseline gap-3 rounded-lg px-2.5 py-2 text-left transition ${isNow ? "bg-slate-100" : "hover:bg-slate-50"}`}
                        >
                          <span
                            dir="auto"
                            className={`min-w-0 flex-1 text-start text-13 leading-5 ${
                              isNow ? `text-slate-900 ${fontSemi}` : isDone ? `text-slate-500 ${fontRegular}` : `text-slate-800 group-hover/l:text-slate-900 ${fontRegular}`
                            }`}
                          >
                            {l.title}
                            {isNow && <span className={`ml-2 align-middle text-11 uppercase tracking-wider text-secondary-800 ${fontSemi}`}>{playing ? "Playing" : "Now"}</span>}
                          </span>
                          <span className={`flex shrink-0 items-center gap-1 text-xs tabular-nums text-slate-500 ${fontRegular}`}>
                            {l.kind !== "video" && <KindIcon kind={l.kind} className="size-3.5" />}
                            {l.kind === "quiz" ? `${QUIZ_LENGTH} Q` : l.kind === "assignment" ? "Task" : `${l.minutes}:00`}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}

        <li className="relative">
          <button type="button" onClick={onCertificate} className="group flex w-full items-start gap-3 rounded-xl px-1 py-1.5 text-left">
            <span
              aria-hidden="true"
              className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg ${allDone ? "bg-secondary-500 text-slate-900" : "bg-slate-100 text-slate-500"}`}
            >
              <Svg className="size-3.5" stroke={2}>
                <circle cx="12" cy="9" r="6" />
                <path d="M8.5 14L7 21l5-3 5 3-1.5-7" />
              </Svg>
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className={`text-sm text-slate-900 transition-colors group-hover:text-primary-800 ${fontSemi}`}>Certificate</span>
              <span className={`text-xs text-slate-500 ${fontRegular}`}>
                {allDone ? "Ready to download" : `Unlocks after ${flat.length - done.length} more lessons`}
              </span>
            </span>
          </button>
        </li>
      </ol>
    </div>
  );
}

// Announcements are hidden for now. Set to true to show the banner and the pinned list in Discussion again.
const SHOW_ANNOUNCEMENTS = false;

export default function LearnPage({ id }: { id: string }) {
  const course = courses.find((c) => c.id === id);
  const { goHome, openSearch } = useApp();
  if (!course)
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-25 px-4 text-center">
        <p className={`text-22 text-slate-900 ${fontHeading}`}>
          Course not found
        </p>
        <button
          type="button"
          onClick={() => openSearch({})}
          className={`${buttonClass("yellow", "lg")}`}
        >
          Browse courses
        </button>
        <button
          type="button"
          onClick={goHome}
          className={`text-sm text-slate-500 underline ${fontRegular}`}
        >
          Go home
        </button>
      </main>
    );
  return <Player course={course} />;
}

function Player({ course }: { course: Course }) {
  const { user, notify, goHome } = useApp();
  const sections = useMemo(() => buildCurriculum(course), [course]);
  const flat = useMemo<FlatLesson[]>(() => {
    let index = 0;
    return sections.flatMap((s, si) =>
      s.lessons.map((l, li) => ({
        ...l,
        key: `${si}-${li}`,
        section: si,
        index: index++,
      })),
    );
  }, [sections]);

  const [progress, setProgress] = useLocal<{ done: string[]; current: string }>(
    `thkee.progress.${course.id}`,
    { done: [], current: "0-0" },
  );
  const current = flat.find((l) => l.key === progress.current) ?? flat[0];
  const duration = current.minutes * 60;

  useEffect(() => {
    try {
      localStorage.setItem(`thkee.lastOpened.${course.id}`, String(Date.now()));
    } catch {}
  }, [course.id]);

  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useLocal("thkee.rate", 1);
  const [autoplay, setAutoplay] = useLocal("thkee.autoplay", true);
  const [sidebar, setSidebar] = useState(true);
  const [openSections, setOpenSections] = useState<number[]>(() => [
    current.section,
  ]);
  const [search, setSearch] = useState("");
  const [panel, setPanel] = useState<Panel>("Contents");
  const [below, setBelow] = useState<Below>("Resources");
  const [askSeed, setAskSeed] = useState<TranscriptLine | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  // The quiz opens on top of the lesson without changing the URL, so it gets its own history entry.
  // Back (browser or header arrow) then closes the quiz and returns to the lesson instead of leaving the course.
  // Set while a Back is in flight, so a double click on "Exit quiz" doesn't also leave the lesson.
  const leavingQuiz = useRef(false);
  const startQuiz = () => {
    leavingQuiz.current = false;
    window.history.pushState({ thkeeQuiz: true }, "", window.location.href);
    setQuizMode(true);
  };
  const exitQuiz = () => {
    if (leavingQuiz.current) return;
    if (window.history.state?.thkeeQuiz) {
      leavingQuiz.current = true;
      window.history.back();
    } else setQuizMode(false);
  };
  useEffect(() => {
    // A reload while the quiz was open leaves a stale entry behind; clear it so Back works first time.
    if (window.history.state?.thkeeQuiz) window.history.replaceState(null, "", window.location.href);
  }, []);
  useEffect(() => {
    if (!quizMode) return;
    const onPop = () => {
      leavingQuiz.current = false;
      setQuizMode(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [quizMode]);
  const [notes, setNotes] = useLocal<Note[]>(`thkee.notes2.${course.id}`, []);
  const [editNoteId, setEditNoteId] = useState<number | null>(null);
  const [assignments, setAssignments] = useLocal<
    Record<string, AssignmentState>
  >(`thkee.asg.${course.id}`, {});
  const [quizResults, setQuizResults] = useLocal<Record<string, QuizResult>>(
    `thkee.quiz.${course.id}`,
    {},
  );
  const [checks, setChecks] = useLocal<Record<string, CheckResult>>(
    `thkee.checks.${course.id}`,
    {},
  );
  const [activeCheck, setActiveCheck] = useState<number | null>(null);
  const [passed, setPassed] = useState<string[]>([]);
  const [annSeen, setAnnSeen] = useLocal(`thkee.annSeen.${course.id}`, "");
  const [ratePrompt, setRatePrompt] = useLocal<"none" | "later" | "done">(
    `thkee.ratePrompt.${course.id}`,
    "none",
  );
  const tabsRef = useRef<HTMLDivElement>(null);

  const doneCount = progress.done.length;
  const percent = Math.round((doneCount / flat.length) * 100);

  const chapters = useMemo(() => buildChapters(current), [current]);
  const lines = useMemo(
    () => buildTranscript(current, chapters),
    [current, chapters],
  );
  const checkpoints = useMemo(
    () =>
      current.kind === "video"
        ? buildCheckpoints(current, chapters, lines)
        : [],
    [current, chapters, lines],
  );
  const lessonChecksDone = checkpoints.filter((c) => checks[c.id]).length;
  const skillsChecked = Object.values(checks).filter((c) => c.correct).length;
  const announcements = useMemo(
    () => announcementsFor(course.title),
    [course.title],
  );
  const bannerItem = annSeen === announcements[0].id ? null : announcements[0];
  const showRating =
    (ratePrompt === "none" && percent >= 30) ||
    (ratePrompt === "later" && percent === 100);

  const goTo = (lesson: FlatLesson, play = false) => {
    setProgress((p) => ({ ...p, current: lesson.key }));
    setTime(0);
    setPlaying(play && lesson.kind === "video");
    setActiveCheck(null);
    setPassed([]);
    setOpenSections((s) =>
      s.includes(lesson.section) ? s : [...s, lesson.section],
    );
  };

  const markDone = (lesson: FlatLesson) =>
    setProgress((p) =>
      p.done.includes(lesson.key) ? p : { ...p, done: [...p.done, lesson.key] },
    );

  const toggleDone = (lesson: FlatLesson) =>
    setProgress((p) => ({
      ...p,
      done: p.done.includes(lesson.key)
        ? p.done.filter((k) => k !== lesson.key)
        : [...p.done, lesson.key],
    }));

  const complete = (lesson: FlatLesson) => {
    setProgress((p) =>
      p.done.includes(lesson.key) ? p : { ...p, done: [...p.done, lesson.key] },
    );
    const next = flat[lesson.index + 1];
    if (next && autoplay) goTo(next, true);
    else setPlaying(false);
    if (!next) notify("You finished the last lesson 🎉");
  };

  useEffect(() => {
    document.title = `${course.title} | Thkee`;
    return () => {
      document.title = "Thkee";
    };
  }, [course.title]);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setTime((t) => {
        const next = t + (SPEED / 4) * rate;
        const due = checkpoints.find((c) => {
          const end = chapters.at(c.chapter)?.end ?? duration;
          return (
            t < end - 0.05 &&
            next >= end - 0.05 &&
            !checks[c.id] &&
            !passed.includes(c.id)
          );
        });
        if (due) {
          clearInterval(timer);
          setTimeout(() => {
            setPlaying(false);
            setActiveCheck(due.chapter);
          }, 0);
          return (chapters.at(due.chapter)?.end ?? duration) - 0.05;
        }
        if (next >= duration) {
          clearInterval(timer);
          setTimeout(() => complete(current), 0);
          return duration;
        }
        return next;
      });
    }, 250);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, current.key, duration, rate, checkpoints, checks, passed]);

  const prev = flat[current.index - 1];
  const next = flat[current.index + 1];

  const certificate = () => {
    if (doneCount === flat.length)
      notify("Your certificate is ready — check your email 🎓");
    else
      notify(
        `Finish all lessons to get your certificate (${doneCount}/${flat.length} done)`,
      );
  };

  const [sharing, setSharing] = useState(false);
  const share = () => setSharing(true);

  const openNotes = () => {
    setSidebar(true);
    setPanel("Notes");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
      )
        return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.toLowerCase() !== "n")
        return;
      setSidebar(true);
      setPanel("Notes");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const seekTo = (sec: number) => {
    if (current.kind !== "video") return;
    setActiveCheck(null);
    setTime(sec);
  };

  const saveLineNote = (line: TranscriptLine) => {
    const text = line.en;
    setNotes((list) => [
      {
        id: Date.now(),
        created: Date.now(),
        lessonKey: current.key,
        lessonTitle: current.title,
        sectionTitle: sections[current.section].title,
        kind: current.kind as Note["kind"],
        text,
        html: `<p>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`,
        at: current.kind === "video" ? line.sec : undefined,
      },
      ...list,
    ]);
    notify(`Note saved at ${clockLabel(line.sec)}`);
  };

  const openBelow = (t: Below) => {
    setBelow(t);
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const activeCheckpoint =
    activeCheck === null ? undefined : checkpoints.at(activeCheck);

  const lessonRef = (l: FlatLesson): LessonRef => ({
    key: l.key,
    title: l.title,
    sectionTitle: sections[l.section].title,
    kind: l.kind,
    minutes: l.minutes,
  });

  const jumpToNote = (note: Note) => {
    const lesson = flat.find((l) => l.key === note.lessonKey);
    if (!lesson) return;
    goTo(lesson);
    if (note.at !== undefined) setTime(note.at);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const minutesLabel = (mins: number) => {
    const h = Math.floor(mins / 60);
    return h ? `${h}h${mins % 60 ? ` ${mins % 60}m` : ""}` : `${mins} min`;
  };

  const initials = (user?.name ?? "Guest")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const q = search.trim().toLowerCase();
  const sectionView = sections
    .map((s, si) => ({
      ...s,
      si,
      items: flat.filter(
        (l) => l.section === si && (!q || l.title.toLowerCase().includes(q)),
      ),
    }))
    .filter((s) => s.items.length);

  return (
    <div className="flex min-h-dvh w-full flex-col bg-slate-25">
      {/* Header */}
      <header className="sticky top-0 z-100 flex h-16 items-center gap-3 border-b border-white/10 bg-slate-900 px-3 md:h-18 md:gap-4 md:px-6">
        <div className="group relative shrink-0">
          <button
            type="button"
            onClick={() =>
              quizMode
                ? exitQuiz()
                : window.history.length > 1
                  ? window.history.back()
                  : goHome()
            }
            aria-label={quizMode ? "Back to the lesson" : "Back to my classes"}
            className="flex size-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <Svg className="size-5" stroke={2}>
              <path d="M15 6l-6 6 6 6" />
            </Svg>
          </button>
          <span
            className={`pointer-events-none absolute left-0 top-full mt-2 whitespace-nowrap rounded-md bg-white px-2.5 py-1.5 text-xs text-slate-900 opacity-0 shadow-popover transition group-hover:opacity-100 ${fontMedium}`}
          >
            {quizMode ? "Back to the lesson" : "Back to my classes"}
          </span>
        </div>

        <button
          type="button"
          onClick={goHome}
          aria-label="Thkee home"
          className="shrink-0"
        >
          <img
            src="/assets/820a1.svg"
            alt="Thkee"
            className="h-6 w-auto md:h-7"
          />
        </button>

        <span
          className="hidden h-7 w-px bg-white/15 md:block"
          aria-hidden="true"
        />

        <div className="hidden min-w-0 flex-1 flex-col md:flex">
          <h1
            dir="auto"
            className={`m-0 truncate text-start text-15 leading-tight text-white ${fontFor(course.title, fontSemi)}`}
          >
            {course.title}
          </h1>
          <p
            dir="auto"
            className={`truncate text-start text-xs leading-tight text-slate-400 ${fontRegular}`}
          >
            <span className="tabular-nums">
              Lesson {current.index + 1} of {flat.length}
            </span>
            <span className="mx-1.5 text-slate-600" aria-hidden="true">
              /
            </span>
            {current.title}
          </p>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 md:gap-3">
          {percent === 100 ? (
            <button
              type="button"
              onClick={certificate}
              className={`${buttonClass("yellow", "md")}`}
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
                <span
                  className={`text-xs leading-none text-slate-300 ${fontRegular}`}
                >
                  Chapter{" "}
                  <span className={`tabular-nums text-white ${fontSemi}`}>
                    {current.section + 1} of {sections.length}
                  </span>
                </span>
                <span className="flex w-36 gap-0.5" aria-hidden="true">
                  {sections.map((_, si) => {
                    const items = flat.filter((l) => l.section === si);
                    const part = items.length ? items.filter((l) => progress.done.includes(l.key)).length / items.length : 0;
                    return (
                      <span key={si} className={`h-1.5 flex-1 overflow-hidden rounded-full ${si === current.section ? "bg-white/30" : "bg-white/15"}`}>
                        <span className="block h-full rounded-full bg-primary-400 transition-all duration-700" style={{ width: `${part * 100}%` }} />
                      </span>
                    );
                  })}
                </span>
              </span>
              <span
                className={`text-sm tabular-nums text-white sm:hidden ${fontSemi}`}
              >
                {percent}%
              </span>
            </button>
          )}

          <span
            className="hidden h-6 w-px bg-white/15 sm:block"
            aria-hidden="true"
          />

          <div className="group relative hidden sm:block">
            <button
              type="button"
              onClick={share}
              aria-label="Share course"
              className="flex size-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <HugeiconsIcon icon={Share08Icon} size={19} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <span
              className={`pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-md bg-white px-2.5 py-1.5 text-xs text-slate-900 opacity-0 shadow-popover transition group-hover:opacity-100 ${fontMedium}`}
            >
              Share course
            </span>
          </div>

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
            <span
              className={`pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-md bg-white px-2.5 py-1.5 text-xs text-slate-900 opacity-0 shadow-popover transition group-hover:opacity-100 ${fontMedium}`}
            >
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
          key={current.key}
          draftKey={`thkee.quizDraft.${course.id}.${current.key}`}
          onExit={exitQuiz}
          onFinish={(result) => {
            setQuizResults((r) => ({ ...r, [current.key]: result }));
            // The lesson only counts as done once the learner reaches the pass mark.
            const passed = result.correct / result.total >= PASS_MARK;
            setProgress((p) =>
              !passed || p.done.includes(current.key)
                ? p
                : { ...p, done: [...p.done, current.key] },
            );
            exitQuiz();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      ) : (
        <div
          className={`grid flex-1 grid-cols-1 ${
            sidebar ? "lg:grid-cols-main-380 xl:grid-cols-main-420" : ""
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
                draftKey={`thkee.quizDraft.${course.id}.${current.key}`}
                onStart={startQuiz}
                onNext={next ? () => goTo(next) : undefined}
              />
            ) : current.kind === "assignment" ? (
              <AssignmentPanel
                key={current.key}
                title={current.title}
                state={assignments[current.key]}
                onSave={(st) => {
                  setAssignments((a) => ({ ...a, [current.key]: st }));
                  if (st.submitted) markDone(current);
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
                        markDone(current);
                        goTo(next);
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
                chapters={current.kind === "video" ? chapters : []}
                goal={lessonGoal(current)}
                overlay={
                  activeCheckpoint ? (
                    <CheckpointCard
                      checkpoint={activeCheckpoint}
                      total={checkpoints.length}
                      onAnswer={(correct) =>
                        setChecks((c) => ({
                          ...c,
                          [activeCheckpoint.id]: { correct },
                        }))
                      }
                      onRewatch={() => {
                        setActiveCheck(null);
                        setTime(activeCheckpoint.rewatchAt);
                        setPlaying(true);
                      }}
                      onContinue={() => {
                        setPassed((list) => [...list, activeCheckpoint.id]);
                        setActiveCheck(null);
                        setPlaying(true);
                      }}
                    />
                  ) : undefined
                }
              />
            )}

            {current.kind === "video" && (
              <LessonBar
                sectionTitle={sections[current.section].title.replace(
                  /^\d+\.\s*/,
                  "",
                )}
                title={current.title}
                minutes={current.minutes}
                done={progress.done.includes(current.key)}
                hasNext={!!next}
                nextTitle={next?.title}
                chapterLabel={`Chapter ${current.section + 1} · lesson ${current.index - flat.findIndex((l) => l.section === current.section) + 1} of ${flat.filter((l) => l.section === current.section).length}`}
                checksDone={lessonChecksDone}
                checksTotal={checkpoints.length}
                onToggleDone={() => toggleDone(current)}
                onNext={() => {
                  if (!next) return;
                  markDone(current);
                  goTo(next, true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}

            {SHOW_ANNOUNCEMENTS && bannerItem && (
              <AnnouncementBanner
                item={bannerItem}
                onView={() => {
                  setAnnSeen(bannerItem.id);
                  openBelow("Discussion");
                }}
                onDismiss={() => setAnnSeen(bannerItem.id)}
              />
            )}

            <div
              ref={tabsRef}
              className="sticky top-16 z-10 flex h-14 scroll-mt-18 items-center gap-3 border-b border-slate-200 bg-white/95 px-2 backdrop-blur-md md:top-18 md:px-6"
            >
              <div
                role="tablist"
                aria-label="Lesson sections"
                className="flex h-full min-w-0 flex-1 items-stretch gap-1"
              >
                {belowTabs.map((t) => {
                  const active = below === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setBelow(t)}
                      className={`group/tab relative flex shrink-0 items-center gap-2 px-3 text-15 transition md:px-4 ${t === "Course" ? "lg:hidden" : ""} ${
                        active
                          ? `text-slate-900 ${fontSemi}`
                          : `text-slate-500 hover:text-slate-900 ${fontMedium}`
                      }`}
                    >
                      <HugeiconsIcon
                        icon={belowIcons[t]}
                        size={18}
                        strokeWidth={active ? 2 : 1.8}
                        aria-hidden="true"
                        className={
                          active
                            ? "text-primary-700"
                            : "text-slate-400 transition group-hover/tab:text-slate-600"
                        }
                      />
                      {t}
                      <span
                        aria-hidden="true"
                        className={`absolute inset-x-2 bottom-0 h-0.5 rounded-full transition ${active ? "bg-primary-700" : "bg-transparent group-hover/tab:bg-slate-200"}`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-25 px-4 py-6 md:px-8 md:py-8">
              {below === "Resources" && (
                <LessonSection
                  part="resources"
                  lesson={current}
                  chapters={chapters}
                  liveSession={course.live}
                  instructor={course.instructor}
                  ratingPrompt={false}
                  onRate={() => {}}
                  onRateLater={() => {}}
                  notify={notify}
                />
              )}
              {below === "Lesson" && (
                <LessonSection
                  lesson={current}
                  chapters={chapters}
                  liveSession={course.live}
                  instructor={course.instructor}
                  ratingPrompt={showRating}
                  onRate={(stars) => {
                    setRatePrompt("done");
                    notify(
                      `Thanks for rating this course ${stars} star${stars > 1 ? "s" : ""}`,
                    );
                  }}
                  onRateLater={() => setRatePrompt("later")}
                  onSeek={current.kind === "video" ? seekTo : undefined}
                  notify={notify}
                />
              )}
              {below === "Discussion" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
                  {SHOW_ANNOUNCEMENTS && (
                    <PinnedAnnouncements items={announcements} />
                  )}
                  <QaTab
                    course={course}
                    lecture={current.index + 1}
                    onOpenLecture={(n) => {
                      if (!flat[n - 1]) return;
                      goTo(flat[n - 1]);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                </div>
              )}
              {below === "Course" && (
                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white lg:hidden">
                  <div
                    role="tablist"
                    aria-label="Course tools"
                    className="flex gap-1 border-b border-slate-200 p-2"
                  >
                    {panels.map((p) => {
                      const active = panel === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setPanel(p)}
                          className={`flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg text-13 transition ${
                            active
                              ? `bg-slate-100 text-slate-900 ${fontSemi}`
                              : `text-slate-500 hover:bg-slate-50 hover:text-slate-900 ${fontMedium}`
                          }`}
                        >
                          <HugeiconsIcon
                            icon={panelIcons[p]}
                            size={16}
                            strokeWidth={active ? 2 : 1.8}
                            aria-hidden="true"
                            className={active ? "text-primary-700" : ""}
                          />
                          <span className="truncate">{p === "Contents" ? "Path" : p}</span>
                          {p === "Notes" && notes.length > 0 && (
                            <span
                              className={`rounded-full bg-slate-200 px-1.5 text-10 tabular-nums text-slate-700 ${fontSemi}`}
                            >
                              {notes.length}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="max-h-120 min-h-60 overflow-y-auto">
                    {panel === "Notes" && (
                      <NotesPanel
                        compact
                        notes={notes}
                        setNotes={setNotes}
                        current={lessonRef(current)}
                        time={time}
                        editId={editNoteId}
                        setEditId={setEditNoteId}
                        onJump={jumpToNote}
                      />
                    )}
                    {panel === "Transcript" && (
                      <TranscriptPanel
                        lines={lines}
                        time={time}
                        isVideo={current.kind === "video"}
                        onSeek={seekTo}
                        onSaveNote={saveLineNote}
                        onAsk={(line) => {
                          setAskSeed(line);
                          setPanel("Ask");
                        }}
                      />
                    )}
                    {panel === "Ask" && (
                      <AskPanel
                        lessonTitle={current.title}
                        instructor={course.instructor}
                        lines={lines}
                        chapters={chapters}
                        time={time}
                        isVideo={current.kind === "video"}
                        seed={askSeed}
                        onSeek={seekTo}
                        onPostToDiscussion={() => {
                          openBelow("Discussion");
                          notify(
                            "Ask your question in Discussion. Your instructor gets notified.",
                          );
                        }}
                      />
                    )}
                    {panel === "Contents" && (
                      <PathRail sections={sections} flat={flat} done={progress.done} current={current} playing={playing} onOpen={(l) => goTo(l)} onCertificate={certificate} />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Course content sidebar */}
          {sidebar ? (
            <aside
              aria-label="Lesson tools"
              className="h-dvh-minus-120 relative flex flex-col border-l border-slate-200 bg-white lg:sticky lg:top-18 lg:h-learn-panel"
            >
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

              <div
                role="tablist"
                aria-label="Lesson tools"
                className="flex gap-1 border-b border-slate-200 p-2"
              >
                {panels.map((p) => {
                  const active = panel === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setPanel(p)}
                      className={`flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg text-13 transition ${
                        active
                          ? `bg-slate-100 text-slate-900 ${fontSemi}`
                          : `text-slate-500 hover:bg-slate-50 hover:text-slate-900 ${fontMedium}`
                      }`}
                    >
                      <HugeiconsIcon
                        icon={panelIcons[p]}
                        size={16}
                        strokeWidth={active ? 2 : 1.8}
                        aria-hidden="true"
                        className={active ? "text-primary-700" : ""}
                      />
                      <span className="truncate">{p === "Contents" ? "Path" : p}</span>
                      {p === "Notes" && notes.length > 0 && (
                        <span
                          className={`rounded-full bg-slate-200 px-1.5 text-10 tabular-nums text-slate-700 ${fontSemi}`}
                        >
                          {notes.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {panel === "Notes" && (
                <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
                  <NotesPanel
                    compact
                    notes={notes}
                    setNotes={setNotes}
                    current={lessonRef(current)}
                    time={time}
                    editId={editNoteId}
                    setEditId={setEditNoteId}
                    onJump={jumpToNote}
                  />
                </div>
              )}
              {panel === "Transcript" && (
                <TranscriptPanel
                  lines={lines}
                  time={time}
                  isVideo={current.kind === "video"}
                  onSeek={seekTo}
                  onSaveNote={saveLineNote}
                  onAsk={(line) => {
                    setAskSeed(line);
                    setPanel("Ask");
                  }}
                />
              )}
              {panel === "Ask" && (
                <AskPanel
                  lessonTitle={current.title}
                  instructor={course.instructor}
                  lines={lines}
                  chapters={chapters}
                  time={time}
                  isVideo={current.kind === "video"}
                  seed={askSeed}
                  onSeek={seekTo}
                  onPostToDiscussion={() => {
                    openBelow("Discussion");
                    notify(
                      "Ask your question in Discussion. Your instructor gets notified.",
                    );
                  }}
                />
              )}

              {panel === "Contents" && (
                <PathRail sections={sections} flat={flat} done={progress.done} current={current} playing={playing} onOpen={(l) => goTo(l)} onCertificate={certificate} />
              )}
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
      {sharing && (
        <ShareCourseDialog
          course={course}
          url={`${window.location.origin}${window.location.pathname}#/course/${course.id}`}
          onClose={() => setSharing(false)}
        />
      )}
    </div>
  );
}

const avatarColors = ["#0d5c4b", "#1d4ed8", "#b45309", "#7c3aed", "#be123c"];

function Avatar({
  name,
  small = false,
  medium = false,
}: {
  name: string;
  small?: boolean;
  medium?: boolean;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ${small ? "size-6 text-10" : medium ? "size-9 text-xs" : "size-11 text-sm"} ${fontSemi}`}
      style={{
        background: `${avatarColors[name.length % avatarColors.length]}1a`,
        color: avatarColors[name.length % avatarColors.length],
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
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
        {
          id: 101,
          name: "Omar K.",
          text: "Most steps still work the same way in the newer version, so you can keep going.",
          when: "1 day ago",
          votes: 1,
        },
        {
          id: 102,
          name: course.instructor,
          instructor: true,
          text: "The instructor updates the resources section whenever a tool changes. Check there first.",
          when: "1 day ago",
          votes: 4,
        },
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
        {
          id: 201,
          name: course.instructor,
          instructor: true,
          text: "Watch the full section first, then do the exercises. They build on each other, so they make more sense once you have seen the whole idea.",
          when: "5 days ago",
          votes: 3,
        },
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
        {
          id: 401,
          name: course.instructor,
          instructor: true,
          text: "Plan for about an hour. There is no deadline, so you can come back to it later.",
          when: "3 weeks ago",
          votes: 2,
        },
      ],
    },
  ];
}

type QaScope = "lesson" | "all" | "mine" | "following";

function UpvoteButton({
  count,
  active,
  onClick,
}: {
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={
        active ? `Remove upvote, ${count} upvotes` : `Upvote, ${count} upvotes`
      }
      aria-pressed={active}
      onClick={onClick}
      className={`flex items-center gap-1.5 text-sm tabular-nums transition hover:text-primary-700 ${active ? "text-primary-700" : "text-slate-500"} ${fontMedium}`}
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
        <path
          d="M12 16.5v-9M8.5 11L12 7.5l3.5 3.5"
          stroke={active ? "white" : "currentColor"}
        />
      </svg>
      {count}
    </button>
  );
}

const actionCls = `flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm transition hover:bg-slate-100 ${fontMedium}`;

function VoteAction({
  count,
  active,
  onClick,
}: {
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={
        active
          ? `Remove your vote, ${count} votes`
          : `Mark as helpful, ${count} votes`
      }
      onClick={onClick}
      className={`${actionCls} tabular-nums ${active ? "text-primary-700" : "text-slate-400 hover:text-slate-700"}`}
    >
      <HugeiconsIcon
        icon={ThumbsUpIcon}
        size={17}
        strokeWidth={active ? 2.2 : 1.8}
      />
      {count}
    </button>
  );
}

function ReplyAction({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${actionCls} text-slate-400 hover:text-slate-700`}
    >
      <HugeiconsIcon icon={Comment01Icon} size={17} strokeWidth={1.8} />
      Reply
    </button>
  );
}

function ThreadReply({
  reply,
  voted,
  reported,
  onVote,
  onReply,
  onReport,
  onEdit,
  onDelete,
}: {
  reply: QaAnswer;
  voted: boolean;
  reported: boolean;
  onVote: () => void;
  onReply: () => void;
  onReport: () => void;
  onEdit: (text: string, html: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="relative flex gap-3">
      <span
        className="absolute -left-6 top-0 h-4.5 w-5 rounded-bl-xl border-b border-l border-slate-200"
        aria-hidden="true"
      />
      <Avatar name={reply.name} medium />
      <div className="min-w-0 flex-1">
        <div className="flex min-h-9 flex-wrap items-center gap-x-2 gap-y-1">
          <span
            dir="auto"
            className={`text-13 text-slate-700 ${fontFor(reply.name, fontMedium)}`}
          >
            {reply.name}
          </span>
          {reply.instructor && (
            <span
              className={`flex items-center gap-1 text-xs text-primary-700 ${fontMedium}`}
            >
              <HugeiconsIcon
                icon={CheckmarkBadge01Icon}
                size={14}
                strokeWidth={2}
              />
              Instructor
            </span>
          )}
          {reply.mine && !reply.instructor && (
            <span
              className={`rounded-full bg-slate-100 px-2 py-0.5 text-11 text-slate-600 ${fontMedium}`}
            >
              You
            </span>
          )}
          <span className={`text-xs text-slate-400 ${fontRegular}`}>
            {reply.when}
          </span>
        </div>
        {editing ? (
          <div className="mt-2">
            <NoteEditor
              extras
              modern
              boxClass="min-h-24"
              initial={reply}
              placeholder="Edit your reply"
              saveVariant="primary"
              onSave={(text, html) => {
                onEdit(text, html);
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
            />
          </div>
        ) : (
          <>
            <NoteBody note={reply} tone="text-slate-600" />
            <div className="-ml-2 mt-1 flex items-center gap-1">
              <VoteAction
                count={reply.votes + (voted ? 1 : 0)}
                active={voted}
                onClick={onVote}
              />
              <ReplyAction onClick={onReply} />
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
                    : [
                        {
                          label: reported ? "Reported" : "Report abuse",
                          onClick: onReport,
                          disabled: reported,
                        },
                      ]
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function QuestionThread({
  question,
  voted,
  reported,
  following,
  onVote,
  onFollow,
  onReport,
  onOpenLecture,
  onReply,
  onEditReply,
  onDeleteReply,
}: {
  question: Question;
  voted: number[];
  reported: number[];
  following: boolean;
  onVote: (id: number) => void;
  onFollow: () => void;
  onReport: (id: number) => void;
  onOpenLecture: (n: number) => void;
  onReply: (text: string, html: string) => void;
  onEditReply: (id: number, text: string, html: string) => void;
  onDeleteReply: (id: number) => void;
}) {
  const { user } = useApp();
  const [replying, setReplying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const score = (a: QaAnswer) => a.votes + (voted.includes(a.id) ? 1 : 0);
  // Instructor replies first, then the most helpful.
  const replies = [...question.answers].sort(
    (a, b) =>
      Number(!!b.instructor) - Number(!!a.instructor) ||
      score(b) - score(a) ||
      b.id - a.id,
  );
  const visible = expanded ? replies : replies.slice(0, 2);
  const hidden = replies.length - visible.length;
  const isVoted = voted.includes(question.id);

  return (
    <li className="py-5">
      <div className="flex gap-3">
        <Avatar name={question.name} medium />
        <div className="min-w-0 flex-1">
          <div
            className={`flex min-h-9 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 ${fontRegular}`}
          >
            <span
              dir="auto"
              className={`text-13 text-slate-700 ${fontFor(question.name, fontMedium)}`}
            >
              {question.name}
            </span>
            {question.mine && (
              <span
                className={`rounded-full bg-slate-100 px-2 py-0.5 text-11 text-slate-600 ${fontMedium}`}
              >
                You
              </span>
            )}
            <span>{question.when}</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onOpenLecture(question.lecture)}
              title={`Go to lecture ${question.lecture}`}
              className="transition hover:text-primary-700 hover:underline"
            >
              Lecture {question.lecture}
            </button>
            {question.answers.some((a) => a.instructor) && (
              <span className={`inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-11 text-primary-700 ${fontMedium}`}>
                <HugeiconsIcon icon={CheckmarkBadge01Icon} size={12} strokeWidth={2} />
                Instructor answered
              </span>
            )}
          </div>
          <h3
            dir="auto"
            className={`m-0 text-15 leading-snug text-slate-900 ${fontFor(question.title, fontSemi)}`}
          >
            {question.title}
          </h3>
          <p
            dir="auto"
            className={`m-0 mt-1 text-sm leading-relaxed text-slate-600 ${fontFor(question.text, fontRegular, "font-normal")}`}
          >
            {question.text}
          </p>
          <div className="-ml-2 mt-1.5 flex flex-wrap items-center gap-1">
            <VoteAction
              count={question.votes + (isVoted ? 1 : 0)}
              active={isVoted}
              onClick={() => onVote(question.id)}
            />
            <ReplyAction onClick={() => setReplying(true)} />
            <button
              type="button"
              aria-pressed={following}
              onClick={onFollow}
              className={`${actionCls} ${following ? "text-primary-700" : "text-slate-400 hover:text-slate-700"}`}
            >
              <HugeiconsIcon
                icon={following ? Tick02Icon : Notification01Icon}
                size={16}
                strokeWidth={1.8}
              />
              {following ? "Following" : "Follow"}
            </button>
            {!question.mine && (
              <ActionMenu
                label="Question options"
                triggerClass={kebabClass}
                trigger={kebabIcon}
                items={[
                  {
                    label: reported.includes(question.id)
                      ? "Reported"
                      : "Report abuse",
                    onClick: () => onReport(question.id),
                    disabled: reported.includes(question.id),
                  },
                ]}
              />
            )}
          </div>
        </div>
      </div>

      {(replies.length > 0 || replying) && (
        <div className="ml-4.5 mt-2 flex flex-col gap-4 border-l border-slate-200 pl-6 pt-2">
          {visible.map((reply) => (
            <ThreadReply
              key={reply.id}
              reply={reply}
              voted={voted.includes(reply.id)}
              reported={reported.includes(reply.id)}
              onVote={() => onVote(reply.id)}
              onReply={() => setReplying(true)}
              onReport={() => onReport(reply.id)}
              onEdit={(text, html) => onEditReply(reply.id, text, html)}
              onDelete={() => onDeleteReply(reply.id)}
            />
          ))}
          {hidden > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className={`self-start text-sm text-primary-700 transition hover:text-primary-800 hover:underline ${fontMedium}`}
            >
              View {hidden} more {hidden === 1 ? "reply" : "replies"}
            </button>
          )}
          {replying && (
            <div className="relative flex gap-3">
              <span
                className="absolute -left-6 top-0 h-4.5 w-5 rounded-bl-xl border-b border-l border-slate-200"
                aria-hidden="true"
              />
              <Avatar name={user?.name ?? "You"} medium />
              <div className="min-w-0 flex-1">
                <NoteEditor
                  extras
                  modern
                  boxClass="min-h-24"
                  placeholder="Write a reply"
                  saveLabel="Reply"
                  saveVariant="primary"
                  onSave={(text, html) => {
                    onReply(text, html);
                    setReplying(false);
                    setExpanded(true);
                  }}
                  onCancel={() => setReplying(false)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function QaTab({
  course,
  lecture,
  onOpenLecture,
}: {
  course: Course;
  lecture: number;
  onOpenLecture: (n: number) => void;
}) {
  const { user, notify } = useApp();
  const [items, setItems] = useLocal<Question[]>(
    `thkee.qa4.${course.id}`,
    seedQuestions(course),
  );
  const [voted, setVoted] = useLocal<number[]>(
    `thkee.qaVoted.${course.id}`,
    [],
  );
  const [followed, setFollowed] = useLocal<number[]>(
    `thkee.qaFollowed.${course.id}`,
    [],
  );
  const [search, setSearch] = useState("");
  // Learners usually arrive stuck on the lesson they are watching, so start there.
  const [scope, setScope] = useState<QaScope>("lesson");
  const [sort, setSort] = useState<"top" | "newest">("top");
  const [asking, setAsking] = useState(false);
  const [reported, setReported] = useLocal<number[]>(
    `thkee.qaReported.${course.id}`,
    [],
  );

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");

  const toggle = (setter: typeof setVoted, id: number) =>
    setter((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    );
  const score = (q: Question) => q.votes + (voted.includes(q.id) ? 1 : 0);

  const inScope = (item: Question, sc: QaScope) =>
    sc === "lesson"
      ? item.lecture === lecture
      : sc === "mine"
        ? !!item.mine
        : sc === "following"
          ? followed.includes(item.id)
          : true;
  const scopes: { id: QaScope; label: string; count: number }[] = [
    { id: "lesson" as const, label: "This lesson", count: items.filter((i) => inScope(i, "lesson")).length },
    { id: "all" as const, label: "All lessons", count: items.length },
    { id: "mine" as const, label: "My questions", count: items.filter((i) => inScope(i, "mine")).length },
    { id: "following" as const, label: "Following", count: items.filter((i) => inScope(i, "following")).length },
  ].filter((sc) => sc.id === "lesson" || sc.id === "all" || sc.count > 0 || sc.id === scope);

  const q = search.trim().toLowerCase();
  // A search always looks across the whole course: the answer may sit under another lesson.
  const shown = items
    .filter((item) => (q ? `${item.title} ${item.text}`.toLowerCase().includes(q) : inScope(item, scope)))
    .sort((a, b) =>
      sort === "newest"
        ? b.created - a.created
        : score(b) - score(a) || b.created - a.created,
    );

  const startAsking = () => {
    if (search.trim()) setTitle(search.trim());
    setAsking(true);
  };

  const post = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;
    const now = Date.now();
    setItems((list) => [
      {
        id: now,
        name: user?.name ?? "You",
        title: title.trim(),
        text: text.trim(),
        lecture,
        when: "just now",
        created: now,
        votes: 0,
        answers: [],
        mine: true,
      },
      ...list,
    ]);
    setSearch("");
    setScope("mine");
    setSort("newest");
    setTitle("");
    setText("");
    setAsking(false);
    notify("Your question is posted ✓");
  };

  const updateAnswers = (
    id: number,
    change: (list: QaAnswer[]) => QaAnswer[],
  ) =>
    setItems((list) =>
      list.map((item) =>
        item.id === id ? { ...item, answers: change(item.answers) } : item,
      ),
    );

  const fieldCls = "field";

  return (
    <div className="flex flex-col gap-5">
      {/* Search first: most learners want to know if their question is already answered. */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="field-box min-w-0 flex-1">
          <Svg className="size-4.5 shrink-0 text-slate-400" stroke={2}>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </Svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Stuck? Search questions from other learners"
            aria-label="Search questions"
            className={`min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 md:text-sm ${fontRegular}`}
          />
        </label>
        {!asking && (
          <button
            type="button"
            onClick={startAsking}
            className={`${buttonClass("primary", "lg")} shrink-0`}
          >
            <Svg className="size-4" stroke={2.2}>
              <path d="M12 5v14M5 12h14" />
            </Svg>
            Ask a question
          </button>
        )}
      </div>

      {asking && (
        <form
          onSubmit={post}
          className="fade-up flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-25 p-4 md:p-5"
        >
          <p className={`m-0 text-sm text-slate-600 ${fontRegular}`}>
            Asking about{" "}
            <span className={`text-slate-900 ${fontSemi}`}>
              Lecture {lecture}
            </span>
            . Search first, someone may have asked already.
          </p>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Your question in one line"
            aria-label="Question title"
            className={fieldCls}
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Add details: what you tried and where you got stuck"
            aria-label="Your question"
            className={fieldCls}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setAsking(false)}
              className={`h-11 rounded-xl px-4 text-sm text-slate-700 transition hover:bg-slate-100 ${fontMedium}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !text.trim()}
              className={`${buttonClass("yellow", "lg")}`}
            >
              Post question
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {q ? (
          <p className={`m-0 text-sm text-slate-500 ${fontRegular}`}>
            {shown.length} {shown.length === 1 ? "result" : "results"} across all lessons
          </p>
        ) : (
          <div role="tablist" aria-label="Which questions" className="flex flex-wrap gap-1.5">
            {scopes.map((sc) => {
              const active = scope === sc.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setScope(sc.id)}
                  className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-13 transition ${
                    active ? `bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200 ${fontSemi}` : `text-slate-500 hover:bg-slate-100 hover:text-slate-700 ${fontMedium}`
                  }`}
                >
                  {sc.label}
                  <span className="tabular-nums opacity-70">{sc.count}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className={`ml-auto flex items-center gap-1 text-13 ${fontMedium}`} role="group" aria-label="Sort">
          {(["top", "newest"] as const).map((o) => (
            <button
              key={o}
              type="button"
              aria-pressed={sort === o}
              onClick={() => setSort(o)}
              className={`rounded-md px-2 py-1 transition ${sort === o ? "text-slate-900" : "text-slate-400 hover:text-slate-700"}`}
            >
              {o === "top" ? "Most helpful" : "Newest"}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center">
          <p className={`m-0 text-15 text-slate-800 ${fontSemi}`}>
            {q ? "No one has asked this yet" : scope === "lesson" ? "No questions on this lesson yet" : "Nothing here yet"}
          </p>
          <p className={`m-0 text-sm text-slate-500 ${fontRegular}`}>
            {q ? "Ask it and your instructor gets notified." : "Be the first to ask, or browse all lessons."}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {!asking && (
              <button type="button" onClick={startAsking} className={buttonClass("primary", "md")}>
                {q ? `Ask "${search.trim().slice(0, 40)}${search.trim().length > 40 ? "…" : ""}"` : "Ask a question"}
              </button>
            )}
            {!q && scope !== "all" && (
              <button type="button" onClick={() => setScope("all")} className={buttonClass("secondary", "md")}>
                Browse all lessons
              </button>
            )}
          </div>
        </div>
      ) : (
        <ul className="m-0 flex list-none flex-col divide-y divide-slate-100 p-0">
          {shown.map((item) => (
            <QuestionThread
              key={item.id}
              question={item}
              voted={voted}
              reported={reported}
              following={followed.includes(item.id)}
              onVote={(id) => toggle(setVoted, id)}
              onFollow={() => toggle(setFollowed, item.id)}
              onReport={(id) => {
                setReported((list) => [...list, id]);
                notify("Thanks, we'll take a look at this");
              }}
              onOpenLecture={onOpenLecture}
              onReply={(value, html) =>
                updateAnswers(item.id, (list) => [
                  ...list,
                  {
                    id: Date.now(),
                    name: user?.name ?? "You",
                    text: value,
                    html,
                    when: "just now",
                    votes: 0,
                    mine: true,
                  },
                ])
              }
              onEditReply={(id, value, html) =>
                updateAnswers(item.id, (list) =>
                  list.map((a) =>
                    a.id === id ? { ...a, text: value, html } : a,
                  ),
                )
              }
              onDeleteReply={(id) =>
                updateAnswers(item.id, (list) =>
                  list.filter((a) => a.id !== id),
                )
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}

const kebabClass =
  "flex size-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700";
const kebabIcon = (
  <svg
    viewBox="0 0 24 24"
    className="size-4"
    fill="currentColor"
    aria-hidden="true"
  >
    <circle cx="12" cy="5" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="12" cy="19" r="1.8" />
  </svg>
);

const thumbIcon =
  "M7 10v11H4a1 1 0 01-1-1v-9a1 1 0 011-1zM7 10l4-8a3 3 0 013 3v4h5.5a2 2 0 012 2.3l-1.3 8a2 2 0 01-2 1.7H7";
