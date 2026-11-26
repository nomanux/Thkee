import { createContext, Fragment, useContext, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowLeft01Icon, BookOpen01Icon, Cancel01Icon, MoreVerticalIcon, PencilEdit02Icon, Search01Icon, SentIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { courses, type Course } from "../data";
import { fontFor, fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, openLearning, useApp, useStoredState } from "../store";
import { ActionMenu, HoverPill, useHoverHighlight } from "./Menus";
import { NoteBody, NoteEditor } from "./Notes";
import { CourseThumb, Shell } from "./Overlays";
import { buttonClass } from "./Button"

// courseId: which of the instructor's courses the message is about.
type Message = { id: string; mine: boolean; text: string; html?: string; at: string; courseId?: string };
type Thread = { id: string; name: string; unread: number; messages: Message[] };

const HOUR = 60 * 60 * 1000;
// Messages from the same person this close together share one avatar and timestamp.
const GROUP_GAP = 5 * 60 * 1000;
const issueTypes = ["Inappropriate Course Content", "Inappropriate Behavior", "Spammy Content", "Other"];
const courseById = (id?: string) => courses.find((c) => c.id === id);
const lastCourseId = (thread: Thread) => [...thread.messages].reverse().find((m) => m.courseId)?.courseId;
const headingStyle = { fontVariationSettings: '"wdth" 100' };

type DemoChat = { name: string; unread: number; hoursAgo: number; lines: (string | { text: string; course: string })[] };

// Students see the page from their side by default; the instructor dashboard uses the instructor side.
const SideContext = createContext<Side | null>(null);
const useSide = () => useContext(SideContext)!;

// Students open enrolled courses in the player; anything else opens the course details page.
function useOpenCourse() {
  const { enrolledIds, setOverlay } = useApp();
  const side = useSide();
  return (course: Course) => (side.instructor || !enrolledIds.includes(course.id) ? setOverlay({ type: "course", id: course.id }) : openLearning(course.id));
}

const studentChats: DemoChat[] = [
  {
    name: "Waleed Elsafoury",
    unread: 1,
    hoursAgo: 6,
    lines: [
      "Welcome! I see you're taking three of my networking courses. Ask me anything about any of them.",
      { text: "Thanks! In the 3G course, what does the RNC actually do?", course: "3g-networks" },
      { text: "The RNC manages radio resources and handovers for all the NodeBs connected to it.", course: "3g-networks" },
      { text: "Got it. And in TCP/IP, why does the handshake need three steps instead of two?", course: "tcp-ip" },
      { text: "Both sides need to confirm the other's starting sequence number. Two steps would only confirm one side.", course: "tcp-ip" },
    ],
  },
  {
    name: "Dr. Sara Al-Qahtani",
    unread: 2,
    hoursAgo: 16,
    lines: ["Hi, welcome to AI Foundations for Everyone. You can take the course however you'd like, but the idea is to finish one short lesson per day.", "Okay, thank you for taking me on this journey!", "Great! Let me know if any lesson feels too fast, and I'll share extra material."],
  },
  { name: "Omar Al-Harbi", unread: 0, hoursAgo: 20, lines: ["Hi, how is the Python course going so far?", "Really well. The data section is my favourite."] },
  { name: "Layla Hassan", unread: 2, hoursAgo: 26, lines: ["Thanks for joining the Prompt Engineering Masterclass.", "Happy to be here!", "I've added a new practice exercise, have a look when you can."] },
  { name: "Thomas Greene", unread: 0, hoursAgo: 40, lines: ["Your color palette assignment looks great.", "Thank you, that means a lot."] },
  { name: "Ava Lee", unread: 0, hoursAgo: 52, lines: ["Do you have a question about the Figma project?", "Not right now, thanks!"] },
  { name: "Daniel Okafor", unread: 2, hoursAgo: 70, lines: ["The next React module is now available.", "I'll start it this weekend.", "Perfect, tell me how it goes."] },
  { name: "Junko Tanaka", unread: 0, hoursAgo: 96, lines: ["Welcome to Mobile Apps with Flutter!", "Thanks, looking forward to it."] },
  { name: "Jessica Smith", unread: 2, hoursAgo: 120, lines: ["Your sprint planning question has been answered in the Q&A.", "I saw it, thank you!", "You're welcome. Any other questions, just ask."] },
];

// Students who message the instructor, and which of the instructor's courses each one takes.
const STUDENT_COURSES: Record<string, string[]> = {
  "Casey Johnson": ["ui-ux-figma", "react-modern"],
  "Riley Thompson": ["python-data"],
  "Sydney Brown": ["ui-ux-figma"],
  "Morgan Patel": ["ui-ux-figma"],
  "Jamie Chen": ["react-modern", "python-data"],
  "Taylor Smith": ["python-data"],
};
const instructorChats: DemoChat[] = [
  {
    name: "Casey Johnson",
    unread: 1,
    hoursAgo: 2,
    lines: [
      { text: "Hi! In the Figma course, how do I make auto layout hug the text instead of cutting it off?", course: "ui-ux-figma" },
      { text: "Set the button to Hug contents and the text layer to Auto width. Then the padding controls the spacing.", course: "ui-ux-figma" },
      { text: "That worked, thanks! One more about React: should I finish the hooks lessons before the context lesson?", course: "react-modern" },
    ],
  },
  { name: "Riley Thompson", unread: 1, hoursAgo: 5, lines: ["Is there a dataset I can use for the final project, or should I find my own?"] },
  {
    name: "Sydney Brown",
    unread: 1,
    hoursAgo: 20,
    lines: ["I uploaded my wireframes for Assignment 1.", "Thanks, I'll review them this week.", "Great, I also added a second version with a simpler navigation."],
  },
  { name: "Morgan Patel", unread: 0, hoursAgo: 30, lines: ["Could you share the Figma file from lesson 4?", "It's in the Resources tab of lesson 4 now."] },
  { name: "Jamie Chen", unread: 0, hoursAgo: 54, lines: ["Thank you for the course, I just finished the React module!", "Congratulations! The next module goes live on Monday."] },
  { name: "Taylor Smith", unread: 0, hoursAgo: 80, lines: ["When is the next live Q&A?", "Thursday at 7 PM. I'll post the link in Announcements."] },
];

function buildThreads(chats: DemoChat[]): Thread[] {
  const now = Date.now();
  return chats.map(({ name, unread, hoursAgo, lines }) => ({
    id: name,
    name,
    unread,
    messages: lines.map((line, i) => ({
      id: `${name}-${i}`,
      mine: i % 2 === 1,
      text: typeof line === "string" ? line : line.text,
      courseId: typeof line === "string" ? undefined : line.course,
      at: new Date(now - (hoursAgo + (lines.length - 1 - i)) * HOUR).toISOString(),
    })),
  }));
}

type Side = {
  instructor: boolean;
  storeKey: string;
  chats: DemoChat[];
  people: string[];
  coursesFor: (name: string) => Course[];
  role: string;
  subtitle: (name: string) => string;
  pickerLabel: string;
  askVerb: string;
  courseAction: string;
  peopleLabel: string;
};
const STUDENT_SIDE: Side = {
  instructor: false,
  storeKey: "thkee.threads.v2",
  chats: studentChats,
  people: [...new Set(courses.map((c) => c.instructor))],
  coursesFor: (name) => courses.filter((c) => c.instructor === name),
  role: "Instructor",
  subtitle: () => "Instructor · Usually replies within a few hours",
  pickerLabel: "Asking about",
  askVerb: "Ask about",
  courseAction: "Go to course",
  peopleLabel: "instructors",
};
const INSTRUCTOR_SIDE: Side = {
  instructor: true,
  storeKey: "thkee.instructorThreads",
  chats: instructorChats,
  people: Object.keys(STUDENT_COURSES),
  coursesFor: (name) => (STUDENT_COURSES[name] ?? []).map((id) => courses.find((c) => c.id === id)).filter((c): c is Course => !!c),
  role: "Student",
  subtitle: (name) => {
    const n = (STUDENT_COURSES[name] ?? []).length;
    return `Student · Enrolled in ${n} of your courses`;
  },
  pickerLabel: "Replying about",
  askVerb: "Reply about",
  courseAction: "View course page",
  peopleLabel: "students",
};

const formatClock = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const daysAgo = (iso: string) => Math.round((new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / (24 * HOUR));

function dayLabel(iso: string) {
  const days = daysAgo(iso);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  const date = new Date(iso);
  if (days < 7) return date.toLocaleDateString("en-US", { weekday: "long" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}

// Short stamp for the conversation list: a time today, then Yesterday, a weekday, or a date.
function listStamp(iso: string) {
  const days = daysAgo(iso);
  if (days === 0) return formatClock(iso);
  if (days === 1) return "Yesterday";
  const date = new Date(iso);
  if (days < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Icon({ icon, size = 18, className = "" }: { icon: IconSvgElement; size?: number; className?: string }) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.8} aria-hidden="true" className={`shrink-0 ${className}`} />;
}

// Sample profile photos for some instructors; everyone else shows their initials.
const photos: Record<string, string> = {
  "Waleed Elsafoury": "https://randomuser.me/api/portraits/men/32.jpg",
  "Dr. Sara Al-Qahtani": "https://randomuser.me/api/portraits/women/44.jpg",
  "Layla Hassan": "https://randomuser.me/api/portraits/women/68.jpg",
  "Ava Lee": "https://randomuser.me/api/portraits/women/79.jpg",
  "Daniel Okafor": "https://randomuser.me/api/portraits/men/75.jpg",
  "Jessica Smith": "https://randomuser.me/api/portraits/women/65.jpg",
  "Ahmed Al-Shehri": "https://randomuser.me/api/portraits/men/46.jpg",
  "Casey Johnson": "https://randomuser.me/api/portraits/women/26.jpg",
  "Sydney Brown": "https://randomuser.me/api/portraits/women/12.jpg",
  "Jamie Chen": "https://randomuser.me/api/portraits/men/22.jpg",
};

function Avatar({ name, className = "size-10 text-sm" }: { name: string; className?: string }) {
  const photo = photos[name];
  if (photo) return <img src={photo} alt="" loading="lazy" className={`shrink-0 rounded-full bg-primary-100 object-cover ${className}`} />;
  const initials = name
    .replace(/^Dr\.\s*/, "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 ${className} ${fontSemi}`}>
      {initials || "?"}
    </span>
  );
}

const iconButton = "flex size-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900";
const dots = <Icon icon={MoreVerticalIcon} />;

function Chevron({ open, className = "size-4 text-slate-900" }: { open?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`transition-transform ${open ? "rotate-180" : ""} ${className}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ReportAbuseDialog({ onClose }: { onClose: () => void }) {
  const [issue, setIssue] = useState("");
  const [open, setOpen] = useState(false);
  const [showError, setShowError] = useState(false);
  const [done, setDone] = useState(false);
  const issueHighlight = useHoverHighlight("rounded-sm bg-slate-150");
  const footer = "flex items-center justify-end gap-4 border-t border-slate-200 px-6 py-4";

  if (done) {
    return (
      <Shell title="Report abuse" onClose={onClose} width="max-w-141" radius="sm:rounded-xl">
        <p className={`p-6 text-sm leading-6 text-slate-500 ${fontRegular}`}>Thank you for helping maintain the integrity of our marketplace. We will review your report as soon as possible. As a matter of policy we will only follow up if we require additional information.</p>
        <div className={footer}>
          <button type="button" onClick={onClose} className={`${buttonClass("yellow", "lg")}`}>
            OK
          </button>
        </div>
      </Shell>
    );
  }

  const invalid = showError && !issue;
  return (
    <Shell title="Report abuse" onClose={onClose} width="max-w-141" radius="sm:rounded-xl">
      <div className="flex flex-col gap-6 p-6">
        <p className={`text-sm leading-6 text-slate-500 ${fontRegular}`}>Flagged content is reviewed by Thkee staff to determine whether it violates Terms of Service or Community Guidelines. If you have a question or technical issue, please contact our Support team here.</p>
        <div className="flex flex-col gap-2">
          <span id="issue-type" className={`text-sm leading-5 text-slate-900 ${fontMedium}`}>
            Issue type
          </span>
          <div
            className="relative"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape" && open) {
                e.stopPropagation();
                setOpen(false);
              }
            }}
          >
            <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-labelledby="issue-type" aria-invalid={invalid} onClick={() => setOpen((o) => !o)} className={`flex h-11 w-full items-center justify-between rounded-lg border bg-white px-4 text-left text-sm transition ${invalid ? "border-red-500" : "border-slate-200"} ${issue ? "text-slate-900" : "text-slate-400"} ${fontRegular}`}>
              {issue || "Select an issue"}
              <Chevron open={open} className="size-4 text-slate-500" />
            </button>
            {open && (
              <ul role="listbox" aria-labelledby="issue-type" {...issueHighlight.props} className="pop-in absolute inset-x-0 top-full mt-1 z-20 isolate flex flex-col gap-0.5 rounded-lg bg-white p-1 shadow-2xl">
                {issueHighlight.pill}
                {issueTypes.map((type) => (
                  <li key={type} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={issue === type}
                      onClick={() => {
                        setIssue(type);
                        setOpen(false);
                      }}
                      className={`w-full rounded-sm px-3 py-2 text-left text-sm leading-5 text-slate-700 outline-none transition ${issue === type ? "bg-secondary-100" : ""} ${fontRegular}`}
                    >
                      {type}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {invalid && <p className={`text-xs leading-4.5 text-red-600 ${fontRegular}`}>Please select an issue.</p>}
        </div>
        <div className="flex flex-col gap-2">
          <span className={`text-sm leading-5 text-slate-900 ${fontMedium}`}>Issue details</span>
          <NoteEditor placeholder="Tell us more about the issue" hideActions autoFocus={false} />
        </div>
      </div>
      <div className={footer}>
        <button type="button" onClick={onClose} className={`h-11 rounded-lg px-4 text-sm text-slate-800 transition hover:bg-slate-150 ${fontMedium}`}>
          Cancel
        </button>
        <button type="button" onClick={() => (issue ? setDone(true) : setShowError(true))} className={`h-11 w-37.5 rounded-lg bg-secondary-500 text-sm text-slate-800 transition hover:bg-secondary-600 ${fontMedium}`}>
          Save
        </button>
      </div>
    </Shell>
  );
}

function ThreadRow({ thread, selected, hovered, onHover, onOpen, onToggleRead, onReport }: { thread: Thread; selected: boolean; hovered: boolean; onHover: () => void; onOpen: () => void; onToggleRead: () => void; onReport: () => void }) {
  const last = thread.messages[thread.messages.length - 1];
  const unread = thread.unread > 0;
  const side = useSide();
  const all = side.coursesFor(thread.name);
  const course = (courseById(lastCourseId(thread)) ?? all[0])?.title;
  const preview = last ? `${last.mine ? "You: " : ""}${last.text || "Sent an image"}` : "No messages yet";
  return (
    <li className="group relative px-3" onPointerEnter={onHover}>
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        aria-label={unread ? `${thread.name}, ${thread.unread} unread` : undefined}
        onClick={onOpen}
        onFocus={onHover}
        className={`relative flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left outline-none transition-colors ${selected ? "bg-primary-100 ring-1 ring-inset ring-primary-200" : ""}`}
      >
        {hovered && !selected && <HoverPill group="message-threads" className="rounded-xl bg-primary-50" />}
        <Avatar name={thread.name} className="relative size-12 text-15" />
        <span className="relative flex min-w-0 flex-1 flex-col">
          <span className="flex items-baseline gap-2">
            <span dir="auto" className={`min-w-0 flex-1 truncate text-sm leading-5 text-slate-900 ${fontFor(thread.name, unread ? fontSemi : fontMedium)}`}>
              {thread.name}
            </span>
            {last && (
              <span className={`shrink-0 text-xs leading-4 transition-opacity group-focus-within:opacity-0 [@media(hover:hover)]:group-hover:opacity-0 ${unread ? `text-primary-700 ${fontMedium}` : `text-slate-500 ${fontRegular}`}`}>{listStamp(last.at)}</span>
            )}
          </span>
          {course && (
            <span dir="auto" className={`truncate text-xs leading-4.5 text-slate-500 ${fontFor(course, fontRegular)}`}>
              {course}
              {all.length > 1 && ` +${all.length - 1} more`}
            </span>
          )}
          <span className="mt-0.5 flex items-center gap-2">
            <span dir="auto" className={`min-w-0 flex-1 truncate text-13 leading-5 ${unread ? `text-slate-900 ${fontMedium}` : `text-slate-500 ${fontRegular}`}`}>
              {preview}
            </span>
            {unread && <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-primary-700" />}
          </span>
        </span>
      </button>
      {/* Row actions show on hover for mouse users; touch users get the same actions in the conversation header. */}
      {/* It takes the place of the time, so it never covers the message preview. */}
      <div className="absolute right-4 top-2 hidden opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:block">
        <ActionMenu
          label={`Options for ${thread.name}`}
          triggerClass="flex size-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-slate-900"
          trigger={<Icon icon={MoreVerticalIcon} size={16} />}
          items={[
            { label: unread ? "Mark as read" : "Mark as unread", onClick: onToggleRead },
            { label: "Report abuse", onClick: onReport, danger: true },
          ]}
        />
      </div>
    </li>
  );
}

// Marks where the conversation moves to another of the instructor's courses.
function TopicDivider({ course }: { course: Course }) {
  return (
    <li aria-label={`About ${course.title}`} className="mb-3 mt-7 flex items-center gap-3">
      <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
      <span className="flex min-w-0 max-w-4/5 items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 ring-1 ring-slate-200">
        <CourseThumb course={course} showTitle={false} className="aspect-video w-8 shrink-0 rounded-full" />
        <span dir="auto" className={`truncate text-xs leading-4.5 text-slate-700 ${fontFor(course.title, fontMedium)}`}>
          {course.title}
        </span>
      </span>
      <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
    </li>
  );
}

function DayDivider({ label }: { label: string }) {
  return <p className={`mb-2 mt-6 text-center text-xs leading-4.5 text-slate-500 first:mt-0 ${fontMedium}`}>{label}</p>;
}

function ThreadView({ thread, topic, onTopic, onShowCourses, onBack, onSend, onMarkUnread, onReport }: { thread: Thread; topic?: string; onTopic: (id: string) => void; onShowCourses: () => void; onBack: () => void; onSend: (text: string, html: string) => void; onMarkUnread: () => void; onReport: () => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const side = useSide();
  const options = side.coursesFor(thread.name);
  const multi = options.length > 1;
  const course = courseById(topic) ?? options[0];
  const openCourse = useOpenCourse();
  const { messages } = thread;

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [thread.id, messages.length]);

  const sameGroup = (a?: Message, b?: Message) => !!a && !!b && a.mine === b.mine && dayLabel(a.at) === dayLabel(b.at) && Math.abs(new Date(b.at).getTime() - new Date(a.at).getTime()) < GROUP_GAP;
  const lastMine = [...messages].reverse().find((m) => m.mine);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-18 shrink-0 items-center gap-3 border-b border-slate-200 px-4 sm:px-6">
        <button type="button" onClick={onBack} aria-label="Back to messages" className={`${iconButton} -ml-2 md:hidden`}>
          <Icon icon={ArrowLeft01Icon} size={20} />
        </button>
        <Avatar name={thread.name} />
        <div className="min-w-0 flex-1">
          <p dir="auto" className={`truncate text-15 leading-5.5 text-slate-900 ${fontFor(thread.name, fontSemi)}`}>
            {thread.name}
          </p>
          <p className={`truncate text-xs leading-4.5 text-slate-500 ${fontRegular}`}>{side.subtitle(thread.name)}</p>
        </div>
        {course && (
          <>
            <button type="button" onClick={onShowCourses} aria-label={multi ? "Courses" : "Course details"} className={`${iconButton} sm:hidden`}>
              <Icon icon={BookOpen01Icon} size={20} />
            </button>
            <button type="button" onClick={onShowCourses} className={`${buttonClass("secondary", "md")} hidden sm:inline-flex xl:hidden`}>
              {multi ? `Courses (${options.length})` : "View course"}
            </button>
          </>
        )}
        <ActionMenu
          label={`Options for ${thread.name}`}
          triggerClass={iconButton}
          trigger={dots}
          items={[
            { label: "Mark as unread", onClick: onMarkUnread, disabled: messages.length === 0 },
            { label: "Report abuse", onClick: onReport, danger: true },
          ]}
        />
      </header>

      <div ref={scroller} className="scrollbar-soft min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Avatar name={thread.name} className="size-16 text-xl" />
            <p dir="auto" className={`mt-2 text-base leading-6 text-slate-900 ${fontFor(thread.name, fontSemi)}`}>
              {thread.name}
            </p>
            {course && <p className={`text-13 leading-4.5 text-slate-500 ${fontRegular}`}>{side.role} · {course.title}</p>}
            <p className={`mt-2 max-w-80 text-sm leading-5 text-slate-600 ${fontRegular}`}>This is the start of your conversation. Ask a question about the course or say hello.</p>
          </div>
        ) : (
          <ol className="mx-auto flex max-w-180 flex-col">
            {messages.map((message, i) => {
              const prev = messages[i - 1];
              const next = messages[i + 1];
              const newDay = !prev || dayLabel(prev.at) !== dayLabel(message.at);
              // A new course starts a new group, so its tag is shown.
              const courseChanged = multi && !!message.courseId && message.courseId !== prev?.courseId;
              const first = !sameGroup(prev, message) || courseChanged;
              const lastInGroup = !sameGroup(message, next);
              const mine = message.mine;
              return (
                <Fragment key={message.id}>
                  {newDay && <DayDivider label={dayLabel(message.at)} />}
                  {courseChanged && courseById(message.courseId) && <TopicDivider course={courseById(message.courseId)!} />}
                  <li className={`flex gap-3 ${mine ? "justify-end" : ""} ${first && !newDay && !courseChanged ? "mt-5" : "mt-1"}`}>
                    {!mine && (first ? <Avatar name={thread.name} className="size-8 text-xs" /> : <span className="w-8 shrink-0" />)}
                    <div className={`flex min-w-0 max-w-4/5 flex-col sm:max-w-120 ${mine ? "items-end" : "items-start"}`}>
                      {first && (
                        <p className={`mb-1 px-1 text-xs leading-4.5 text-slate-500 ${fontRegular}`}>
                          {!mine && <span className={`text-slate-700 ${fontMedium}`}>{thread.name} · {side.role} </span>}
                          {formatClock(message.at)}
                        </p>
                      )}
                      <div
                        className={`max-w-full rounded-2xl px-4 py-2.5 ${
                          mine ? `bg-primary-600 [&_a]:!text-white [&_code]:!bg-white/15 ${first ? "rounded-tr-md" : ""}` : `bg-slate-100 ${first ? "rounded-tl-md" : ""}`
                        }`}
                      >
                        <NoteBody note={message} tone={mine ? "text-white" : "text-slate-800"} className="break-words" />
                      </div>
                      {mine && message.id === lastMine?.id && i === messages.length - 1 && lastInGroup && (
                        <span className={`mt-1 px-1 text-11 leading-4 text-slate-400 ${fontRegular}`}>Sent</span>
                      )}
                    </div>
                  </li>
                </Fragment>
              );
            })}
          </ol>
        )}
      </div>

      <div className="shrink-0 px-4 pb-5 pt-2 sm:px-8">
        <div className="mx-auto max-w-180">
          {multi && course && (
            <div className="mb-2.5">
              <ActionMenu
                label={`Course for this message: ${course.title}`}
                alignLeft
                triggerClass="group flex h-11 max-w-full items-center gap-2.5 rounded-xl bg-primary-50 pl-1.5 pr-3 text-left ring-1 ring-primary-200 transition hover:bg-primary-100"
                trigger={
                  <>
                    <CourseThumb course={course} showTitle={false} className="aspect-video w-12 shrink-0 rounded-lg" />
                    <span className="flex min-w-0 flex-col">
                      <span className={`text-11 uppercase leading-3.5 tracking-wider text-primary-700 ${fontSemi}`}>{side.pickerLabel}</span>
                      <span dir="auto" className={`truncate text-13 leading-4.5 text-slate-900 ${fontFor(course.title, fontSemi)}`}>{course.title}</span>
                    </span>
                    <Icon icon={ArrowDown01Icon} size={16} className="ml-1 text-primary-700" />
                  </>
                }
                items={options.map((c) => ({
                  label: c.title,
                  onClick: () => onTopic(c.id),
                  icon: <span className="flex size-4 items-center justify-center text-primary-700">{c.id === course.id && <Icon icon={Tick02Icon} size={16} />}</span>,
                }))}
              />
            </div>
          )}
          <NoteEditor
            key={thread.id}
            placeholder={multi && course ? `${side.askVerb} ${course.title}` : `Write a message to ${thread.name.replace(/^Dr\.\s*/, "").split(" ")[0]}`}
            saveLabel="Send message"
            boxClass="max-h-60"
            modern
            attachMenu
            plain
            sendInside
            submitOnEnter
            clearOnSave
            autoFocus={false}
            onSave={onSend}
          />
        </div>
      </div>
    </div>
  );
}

const courseHeading = (side: Side, name: string, topic?: string) => {
  const options = side.coursesFor(name);
  return options.length > 1 ? `Courses (${options.length})` : courseById(topic) ?? options[0] ? "Course" : side.role;
};

// The course (or the instructor's courses) behind a conversation. Used by the side panel and the phone sheet.
function CourseInfo({ name, topic, onTopic }: { name: string; topic?: string; onTopic: (id: string) => void }) {
  const side = useSide();
  const options = side.coursesFor(name);
  const course = courseById(topic) ?? options[0];
  const openCourse = useOpenCourse();
  return (
    <>
    {options.length > 1 && course ? (
      <div className="flex flex-col gap-3">
        <ul className="flex flex-col divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
          {options.map((c) => {
            const on = c.id === course.id;
            return (
              <li key={c.id}>
                <button type="button" aria-pressed={on} onClick={() => onTopic(c.id)} className={`flex w-full items-center gap-3 p-2.5 text-left transition-colors ${on ? "bg-slate-50" : "hover:bg-slate-25"}`}>
                  <CourseThumb course={c} showTitle={false} className="aspect-video w-14 shrink-0 rounded-md" />
                  <span className="min-w-0 flex-1">
                    <span dir="auto" className={`line-clamp-2 text-13 leading-4.5 text-slate-900 ${fontFor(c.title, on ? fontSemi : fontMedium)}`}>
                      {c.title}
                    </span>
                    <span className={`block text-xs leading-4 text-slate-500 ${fontRegular}`}>
                      {c.lessons} lessons · {c.level}
                    </span>
                  </span>
                  {on && <Icon icon={Tick02Icon} size={16} className="text-primary-700" />}
                </button>
              </li>
            );
          })}
        </ul>
        <p className={`text-xs leading-4.5 text-slate-500 ${fontRegular}`}>Your next message will be about the selected course.</p>
        <button type="button" onClick={() => openCourse(course)} className={`${buttonClass("soft", "md")} w-full`}>
          {side.courseAction}
        </button>
      </div>
    ) : course ? (
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3">
        <div className="flex items-start gap-3">
          <CourseThumb course={course} showTitle={false} className="aspect-video w-20 shrink-0 rounded-lg" />
          <div className="min-w-0">
            <p dir="auto" className={`line-clamp-2 text-sm leading-5 text-slate-900 ${fontFor(course.title, fontSemi)}`}>
              {course.title}
            </p>
            <p className={`truncate text-xs leading-4.5 text-slate-500 ${fontRegular}`}>{course.category}</p>
          </div>
        </div>
        <p className={`text-xs leading-4.5 text-slate-500 ${fontRegular}`}>
          {course.lessons} lessons · {course.hours} hours · {course.level}
        </p>
        <button type="button" onClick={() => openCourse(course)} className={`${buttonClass("soft", "md")} w-full`}>
          {side.courseAction}
        </button>
      </div>
    ) : (
      <div className="flex items-center gap-3">
        <Avatar name={name} />
        <div className="min-w-0">
          <p dir="auto" className={`truncate text-sm leading-5 text-slate-900 ${fontFor(name, fontSemi)}`}>
            {name}
          </p>
          <p className={`text-xs leading-4.5 text-slate-500 ${fontRegular}`}>{side.subtitle(name)}</p>
        </div>
      </div>
    )}
    </>
  );
}

function CoursePanel({ name, topic, onTopic }: { name: string; topic?: string; onTopic: (id: string) => void }) {
  return (
    <aside className="scrollbar-soft hidden w-72 shrink-0 flex-col overflow-y-auto border-l border-slate-200 xl:flex">
      <header className="flex h-18 shrink-0 items-center border-b border-slate-200 px-5">
        <p className={`text-15 leading-5.5 text-slate-900 ${fontSemi}`}>{courseHeading(useSide(), name, topic)}</p>
      </header>
      <div className="p-5">
        <CourseInfo name={name} topic={topic} onTopic={onTopic} />
      </div>
    </aside>
  );
}

// Phones and tablets: the same course details in a bottom sheet (a centred dialog from the sm breakpoint).
function CourseSheet({ name, topic, onTopic, onClose }: { name: string; topic?: string; onTopic: (id: string) => void; onClose: () => void }) {
  const side = useSide();
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6 xl:hidden" role="dialog" aria-modal="true" aria-label={courseHeading(side, name, topic)}>
      <button type="button" aria-label="Close" onClick={onClose} className="overlay-fade absolute inset-0 bg-slate-900/40" />
      <div className="sheet-in relative flex max-h-dvh-minus-56 w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-panel sm:max-w-md sm:rounded-2xl">
        <span aria-hidden="true" className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-slate-200 sm:hidden" />
        <header className="flex shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-3 sm:pt-5">
          <p className={`text-15 leading-5.5 text-slate-900 ${fontSemi}`}>{courseHeading(side, name, topic)}</p>
          <button type="button" onClick={onClose} aria-label="Close" className={`${iconButton} -mr-2`}>
            <Icon icon={Cancel01Icon} size={18} />
          </button>
        </header>
        <div className="scrollbar-soft overflow-y-auto px-5 pb-6 pt-2">
          <CourseInfo
            name={name}
            topic={topic}
            onTopic={(id) => {
              onTopic(id);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}

function EmptyThread({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-25 p-6">
      <div className="fade-up flex w-full max-w-sm flex-col items-center rounded-3xl bg-primary-50 p-7 text-center ring-1 ring-primary-200">
        <img src="/illustrations/chat-threads.svg" alt="" className="h-auto w-64" />
        <p className={`text-3xl leading-9 text-primary-900 ${fontHeading}`} style={headingStyle}>
          Pick a conversation.
        </p>
        <p className={`mt-2 max-w-72 text-sm leading-5 text-slate-600 ${fontRegular}`}>Choose a chat from the list, or start a new one with {useSide().instructor ? "a student" : "an instructor"}.</p>
        <button type="button" onClick={onNew} className={`${buttonClass("primary", "lg")} mt-6`}>
          <Icon icon={PencilEdit02Icon} size={16} />
          New message
        </button>
      </div>
    </div>
  );
}

function NewChat({ onPick, onBack }: { onPick: (name: string) => void; onBack: () => void }) {
  const [query, setQuery] = useState("");
  const side = useSide();
  const matches = side.people.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-18 shrink-0 items-center gap-3 border-b border-slate-200 px-4 sm:px-6">
        <button type="button" onClick={onBack} aria-label="Back to messages" className={`${iconButton} md:hidden`}>
          <Icon icon={ArrowLeft01Icon} size={20} />
        </button>
        <p className={`text-15 leading-5.5 text-slate-900 ${fontSemi}`}>New message</p>
      </header>
      <div className="flex flex-col gap-2 border-b border-slate-200 px-3 py-3 sm:px-5">
        <label className="field-box">
          <span className={`text-sm text-slate-500 ${fontRegular}`}>To:</span>
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Escape" && onBack()} placeholder={`Search ${side.peopleLabel}`} aria-label={`Search ${side.peopleLabel}`} className={`min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 md:text-sm ${fontRegular}`} />
        </label>
      </div>
      <p className={`px-5 pb-1 pt-4 text-xs uppercase tracking-wider text-slate-500 ${fontMedium}`}>Your {side.peopleLabel}</p>
      <ul className="scrollbar-soft min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {matches.map((name) => (
          <li key={name}>
            <button type="button" onClick={() => onPick(name)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50">
              <Avatar name={name} className="size-9 text-13" />
              <span className="flex min-w-0 flex-col">
                <span dir="auto" className={`truncate text-sm leading-5 text-slate-900 ${fontFor(name, fontMedium)}`}>
                  {name}
                </span>
                {side.coursesFor(name)[0] && <span className={`truncate text-xs leading-4 text-slate-500 ${fontRegular}`}>{side.coursesFor(name)[0].title}</span>}
              </span>
            </button>
          </li>
        ))}
        {matches.length === 0 && <li className={`px-3 py-4 text-sm text-slate-500 ${fontRegular}`}>No {side.peopleLabel} match your search.</li>}
      </ul>
    </div>
  );
}

// Unread student conversations, for the badge in the instructor sidebar.
export const unreadStudentThreads = () => load<Thread[]>(INSTRUCTOR_SIDE.storeKey, buildThreads(INSTRUCTOR_SIDE.chats)).filter((t) => t.unread > 0).length;

export default function MessagesPage({ instructor = false }: { instructor?: boolean }) {
  const side = instructor ? INSTRUCTOR_SIDE : STUDENT_SIDE;
  return (
    <SideContext.Provider value={side}>
      <Inbox key={side.storeKey} side={side} />
    </SideContext.Provider>
  );
}

function Inbox({ side }: { side: Side }) {
  const { notify } = useApp();
  const [threads, setThreads] = useStoredState<Thread[]>(side.storeKey, buildThreads(side.chats));
  const [openName, setOpenName] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  // The course each conversation is currently about: chosen in the picker, else the last tagged message.
  const [topics, setTopics] = useState<Record<string, string>>({});
  const [courseSheet, setCourseSheet] = useState(false);
  const topicOf = (thread: Thread) => topics[thread.id] ?? lastCourseId(thread) ?? side.coursesFor(thread.name)[0]?.id;
  const still = useReducedMotion();

  const open = openName ? (threads.find((t) => t.id === openName) ?? { id: openName, name: openName, unread: 0, messages: [] }) : null;
  // Esc closes the open chat, like WhatsApp Web. An open menu, sheet or dialog takes the Esc first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || reporting || courseSheet) return;
      if (document.querySelector('[role="menu"], [role="listbox"], [role="dialog"]')) return;
      setOpenName(null);
      setCreating(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reporting, courseSheet]);
  const chooseTopic = (id: string) => {
    if (open) setTopics((map) => ({ ...map, [open.id]: id }));
  };
  const q = query.trim().toLowerCase();
  const unreadCount = threads.filter((t) => t.unread > 0).length;
  const shown = threads.filter((t) => (!unreadOnly || t.unread > 0) && (!q || t.name.toLowerCase().includes(q) || t.messages.some((m) => m.text.toLowerCase().includes(q))));
  const setUnread = (id: string, unread: number) => setThreads((list) => list.map((t) => (t.id === id ? { ...t, unread } : t)));

  const openThread = (name: string) => {
    setOpenName(name);
    setCreating(false);
    setUnread(name, 0);
  };
  // On wide screens, open the latest conversation instead of leaving the right side empty. Phones start on the list.
  useEffect(() => {
    if (threads[0] && window.matchMedia("(min-width: 768px)").matches) openThread(threads[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const send = (text: string, html: string) => {
    if (!open) return;
    const message: Message = { id: `${Date.now()}`, mine: true, text, html, at: new Date().toISOString(), courseId: topicOf(open) };
    setThreads((list) => [{ ...open, unread: 0, messages: [...open.messages, message] }, ...list.filter((t) => t.id !== open.id)]);
  };
  const markAllRead = () => {
    setThreads((list) => list.map((t) => ({ ...t, unread: 0 })));
    notify("All messages marked as read");
  };
  const markUnread = () => {
    if (!open) return;
    setUnread(open.id, 1);
    setOpenName(null);
  };
  const paneOpen = creating || !!open;
  const chip = (active: boolean) =>
    `relative flex h-8 items-center gap-1.5 rounded-full px-3.5 text-13 transition-colors ${active ? `text-white ${fontMedium}` : `text-slate-700 ring-1 ring-inset ring-slate-200 hover:ring-slate-400 ${fontRegular}`}`;
  const chipPill = (active: boolean) =>
    active && (
      <motion.span
        layoutId="message-filter"
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-slate-900"
        transition={still ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
      />
    );

  return (
    <main className={side.instructor ? "flex w-full flex-1 bg-white" : "w-full bg-white pt-14"}>
      <div className={`flex min-h-130 w-full ${side.instructor ? "h-dvh-minus-64 md:h-dvh-minus-72" : "h-dvh-minus-56 border-t border-slate-200"}`}>
        <aside className={`min-h-0 w-full flex-col border-slate-200 md:flex md:w-80 md:shrink-0 md:border-r lg:w-96 ${paneOpen ? "hidden" : "flex"}`}>
          <div className="flex flex-col gap-4 px-6 pb-4 pt-6">
            <div className="flex h-9 items-center justify-between gap-2">
              <h1 className="m-0 font-instrument-medium text-26 font-medium leading-8 text-slate-900" style={headingStyle}>
                Messages
              </h1>
              <div className="-mr-2 flex items-center gap-0.5">
                <button
                  type="button"
                  title="New message"
                  aria-label="New message"
                  onClick={() => {
                    setCreating(true);
                    setOpenName(null);
                  }}
                  className={`${iconButton} ${creating ? "bg-slate-100 text-slate-900" : ""}`}
                >
                  <Icon icon={PencilEdit02Icon} size={20} />
                </button>
                <ActionMenu label="Message list options" triggerClass={iconButton} trigger={dots} items={[{ label: "Mark all as read", onClick: markAllRead, disabled: unreadCount === 0 }]} />
              </div>
            </div>
            <label className="field-box">
              <Icon icon={Search01Icon} size={16} className="text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search messages" aria-label="Search messages" className={`min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 md:text-sm ${fontRegular}`} />
            </label>
            <div role="tablist" aria-label="Filter conversations" className="flex gap-2">
              <button type="button" role="tab" aria-selected={!unreadOnly} onClick={() => setUnreadOnly(false)} className={chip(!unreadOnly)}>
                {chipPill(!unreadOnly)}
                <span className="relative">All</span>
              </button>
              <button type="button" role="tab" aria-selected={unreadOnly} onClick={() => setUnreadOnly(true)} className={chip(unreadOnly)}>
                {chipPill(unreadOnly)}
                <span className="relative">Unread</span>
                {unreadCount > 0 && <span className={`relative tabular-nums ${unreadOnly ? "text-white/70" : "text-slate-400"}`}>{unreadCount}</span>}
              </button>
            </div>
          </div>
          <ul className="scrollbar-soft min-h-0 flex-1 overflow-y-auto pb-3" onPointerLeave={() => setHovered(null)}>
            {shown.map((thread) => (
              <ThreadRow key={thread.id} thread={thread} selected={thread.id === openName} hovered={hovered === thread.id} onHover={() => setHovered(thread.id)} onOpen={() => openThread(thread.id)} onToggleRead={() => setUnread(thread.id, thread.unread ? 0 : 1)} onReport={() => setReporting(true)} />
            ))}
            {shown.length === 0 && (
              <li className="flex flex-col items-center gap-1 px-6 py-12 text-center">
                <p className={`text-sm text-slate-900 ${fontMedium}`}>{q ? "No results" : "You're all caught up"}</p>
                <p className={`text-13 text-slate-500 ${fontRegular}`}>{q ? "No conversations match your search." : "There are no unread messages."}</p>
              </li>
            )}
          </ul>
        </aside>
        <section className={`min-h-0 min-w-0 flex-1 flex-col md:flex ${paneOpen ? "flex" : "hidden"}`}>
          {creating ? <NewChat onPick={openThread} onBack={() => setCreating(false)} /> : open ? <ThreadView key={open.id} thread={open} topic={topicOf(open)} onTopic={chooseTopic} onShowCourses={() => setCourseSheet(true)} onBack={() => setOpenName(null)} onSend={send} onMarkUnread={markUnread} onReport={() => setReporting(true)} /> : <EmptyThread onNew={() => setCreating(true)} />}
        </section>
        {open && !creating && <CoursePanel name={open.name} topic={topicOf(open)} onTopic={chooseTopic} />}
      </div>
      {courseSheet && open && !creating && <CourseSheet name={open.name} topic={topicOf(open)} onTopic={chooseTopic} onClose={() => setCourseSheet(false)} />}
      {reporting && <ReportAbuseDialog onClose={() => setReporting(false)} />}
    </main>
  );
}
