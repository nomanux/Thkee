import { Fragment, useEffect, useRef, useState } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ArrowLeft01Icon, MessageMultiple01Icon, MoreVerticalIcon, PencilEdit02Icon, Search01Icon, SentIcon } from "@hugeicons/core-free-icons";
import { courses } from "../data";
import { fontFor, fontMedium, fontRegular, fontSemi } from "../fonts";
import { useApp, useStoredState } from "../store";
import { ActionMenu } from "./Menus";
import { NoteBody, NoteEditor } from "./Notes";
import { Shell } from "./Overlays";
import { buttonClass } from "./Button"

type Message = { id: string; mine: boolean; text: string; html?: string; at: string };
type Thread = { id: string; name: string; unread: number; messages: Message[] };

const HOUR = 60 * 60 * 1000;
// Messages from the same person this close together share one avatar and timestamp.
const GROUP_GAP = 5 * 60 * 1000;
const avatarColors = ["#0d5c4b", "#1d4ed8", "#7c3aed", "#b45309", "#be123c", "#0f766e", "#475569"];
const issueTypes = ["Inappropriate Course Content", "Inappropriate Behavior", "Spammy Content", "Other"];
const people = [...new Set(courses.map((c) => c.instructor))];
const courseOf = (name: string) => courses.find((c) => c.instructor === name)?.title;
const headingStyle = { fontVariationSettings: '"wdth" 100' };

const demoChats: { name: string; unread: number; hoursAgo: number; lines: string[] }[] = [
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

function demoThreads(): Thread[] {
  const now = Date.now();
  return demoChats.map(({ name, unread, hoursAgo, lines }) => ({
    id: name,
    name,
    unread,
    messages: lines.map((text, i) => ({ id: `${name}-${i}`, mine: i % 2 === 1, text, at: new Date(now - (hoursAgo + (lines.length - 1 - i)) * HOUR).toISOString() })),
  }));
}

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

function Avatar({ name, className = "size-10 text-sm" }: { name: string; className?: string }) {
  const initials = name
    .replace(/^Dr\.\s*/, "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const color = avatarColors[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % avatarColors.length];
  return (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-full text-white ${className} ${fontSemi}`} style={{ backgroundColor: color }}>
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
              <ul role="listbox" aria-labelledby="issue-type" className="pop-in absolute inset-x-0 top-full mt-1 z-20 flex flex-col gap-0.5 rounded-lg bg-white p-1 shadow-2xl">
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
                      className={`w-full rounded-sm px-3 py-2 text-left text-sm leading-5 text-slate-700 transition ${issue === type ? "bg-secondary-100" : "hover:bg-slate-150"} ${fontRegular}`}
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

function ThreadRow({ thread, selected, onOpen, onToggleRead, onReport }: { thread: Thread; selected: boolean; onOpen: () => void; onToggleRead: () => void; onReport: () => void }) {
  const last = thread.messages[thread.messages.length - 1];
  const unread = thread.unread > 0;
  const preview = last ? `${last.mine ? "You: " : ""}${last.text || "Sent an image"}` : "No messages yet";
  return (
    <li className="group relative px-2">
      <button type="button" aria-current={selected ? "true" : undefined} onClick={onOpen} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${selected ? "bg-primary-100" : "hover:bg-slate-50"}`}>
        <Avatar name={thread.name} className="size-11 text-15" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-baseline gap-2">
            <span dir="auto" className={`min-w-0 flex-1 truncate text-sm leading-5 text-slate-900 ${fontFor(thread.name, unread ? fontSemi : fontMedium)}`}>
              {thread.name}
            </span>
            {last && <span className={`shrink-0 text-xs leading-4 ${unread ? `text-primary-700 ${fontMedium}` : `text-slate-500 ${fontRegular}`}`}>{listStamp(last.at)}</span>}
          </span>
          <span className="flex items-center gap-2">
            <span dir="auto" className={`min-w-0 flex-1 truncate text-13 leading-5 ${unread ? `text-slate-800 ${fontMedium}` : `text-slate-500 ${fontRegular}`}`}>
              {preview}
            </span>
            {unread && (
              <span aria-label={`${thread.unread} unread`} className={`flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary-700 px-1.5 text-11 text-white ${fontSemi}`}>
                {thread.unread}
              </span>
            )}
          </span>
        </span>
      </button>
      {/* Row actions show on hover for mouse users; touch users get the same actions in the conversation header. */}
      <div className="absolute right-4 top-2 hidden opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:block">
        <ActionMenu
          label={`Options for ${thread.name}`}
          triggerClass="flex size-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:text-slate-900"
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

function DayDivider({ label }: { label: string }) {
  return (
    <div className="my-2 flex justify-center">
      <span className={`rounded-full border border-slate-200 bg-white px-3 py-0.5 text-xs leading-4.5 text-slate-500 ${fontMedium}`}>{label}</span>
    </div>
  );
}

function ThreadView({ thread, onBack, onSend, onMarkUnread, onReport }: { thread: Thread; onBack: () => void; onSend: (text: string, html: string) => void; onMarkUnread: () => void; onReport: () => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const course = courseOf(thread.name);
  const { messages } = thread;

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [thread.id, messages.length]);

  const sameGroup = (a?: Message, b?: Message) => !!a && !!b && a.mine === b.mine && dayLabel(a.at) === dayLabel(b.at) && Math.abs(new Date(b.at).getTime() - new Date(a.at).getTime()) < GROUP_GAP;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-17 shrink-0 items-center gap-3 border-b border-slate-200 px-3 sm:px-5">
        <button type="button" onClick={onBack} aria-label="Back to messages" className={`${iconButton} md:hidden`}>
          <Icon icon={ArrowLeft01Icon} size={20} />
        </button>
        <Avatar name={thread.name} />
        <div className="min-w-0 flex-1">
          <p dir="auto" className={`truncate text-15 leading-5.5 text-slate-900 ${fontFor(thread.name, fontSemi)}`}>
            {thread.name}
          </p>
          <p className={`truncate text-13 leading-4.5 text-slate-500 ${fontRegular}`}>{course ? `Instructor · ${course}` : "Instructor"}</p>
        </div>
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

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 px-3 py-5 sm:px-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Avatar name={thread.name} className="size-16 text-xl" />
            <p dir="auto" className={`mt-2 text-base leading-6 text-slate-900 ${fontFor(thread.name, fontSemi)}`}>
              {thread.name}
            </p>
            {course && <p className={`text-13 leading-4.5 text-slate-500 ${fontRegular}`}>Instructor · {course}</p>}
            <p className={`mt-2 max-w-80 text-sm leading-5 text-slate-600 ${fontRegular}`}>This is the start of your conversation. Ask a question about the course or say hello.</p>
          </div>
        ) : (
          <ol className="flex flex-col">
            {messages.map((message, i) => {
              const prev = messages[i - 1];
              const next = messages[i + 1];
              const newDay = !prev || dayLabel(prev.at) !== dayLabel(message.at);
              const first = !sameGroup(prev, message);
              const lastInGroup = !sameGroup(message, next);
              const mine = message.mine;
              return (
                <Fragment key={message.id}>
                  {newDay && <DayDivider label={dayLabel(message.at)} />}
                  <li className={`flex items-end gap-2 ${mine ? "justify-end" : ""} ${first && !newDay ? "mt-4" : "mt-1"}`}>
                    {!mine && (lastInGroup ? <Avatar name={thread.name} className="size-8 text-xs" /> : <span className="w-8 shrink-0" />)}
                    <div className={`flex min-w-0 max-w-4/5 flex-col sm:max-w-130 ${mine ? "items-end" : "items-start"}`}>
                      <div
                        className={`max-w-full rounded-2xl px-3.5 py-2 ${
                          mine ? `bg-primary-700 [&_a]:!text-white [&_code]:!bg-white/15 ${lastInGroup ? "rounded-br-md" : ""}` : `border border-slate-200 bg-white ${lastInGroup ? "rounded-bl-md" : ""}`
                        }`}
                      >
                        <NoteBody note={message} tone={mine ? "text-white" : "text-slate-800"} className="break-words" />
                      </div>
                      {lastInGroup && <span className={`mt-1 px-1 text-11 leading-4 text-slate-400 ${fontRegular}`}>{formatClock(message.at)}</span>}
                    </div>
                  </li>
                </Fragment>
              );
            })}
          </ol>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white p-3 sm:px-5 sm:py-4">
        <NoteEditor
          key={thread.id}
          placeholder={`Message ${thread.name}`}
          saveLabel="Send"
          saveSize="lg"
          boxClass="min-h-24 max-h-60 !p-3"
          imageOnly
          sideAction
          submitOnEnter
          clearOnSave
          autoFocus={false}
          onSave={onSend}
        />
        <p className={`mt-2 hidden text-xs leading-4 text-slate-400 sm:block ${fontRegular}`}>Press Enter to send, Shift + Enter for a new line.</p>
      </div>
    </div>
  );
}

function EmptyThread() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-slate-50/70 p-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary-100 text-primary-700">
        <Icon icon={MessageMultiple01Icon} size={26} />
      </span>
      <p className={`mt-1 text-base leading-6 text-slate-900 ${fontSemi}`}>Your messages</p>
      <p className={`max-w-75 text-sm leading-5 text-slate-500 ${fontRegular}`}>Pick a conversation from the list, or start a new one with an instructor.</p>
    </div>
  );
}

function NewChat({ onPick, onBack }: { onPick: (name: string) => void; onBack: () => void }) {
  const [query, setQuery] = useState("");
  const matches = people.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-17 shrink-0 items-center gap-3 border-b border-slate-200 px-3 sm:px-5">
        <button type="button" onClick={onBack} aria-label="Back to messages" className={`${iconButton} md:hidden`}>
          <Icon icon={ArrowLeft01Icon} size={20} />
        </button>
        <p className={`text-15 leading-5.5 text-slate-900 ${fontSemi}`}>New message</p>
      </header>
      <div className="flex flex-col gap-2 border-b border-slate-200 px-3 py-3 sm:px-5">
        <label className="field-box">
          <span className={`text-sm text-slate-500 ${fontRegular}`}>To:</span>
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Escape" && onBack()} placeholder="Search instructors" aria-label="Search instructors" className={`min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 md:text-sm ${fontRegular}`} />
        </label>
      </div>
      <p className={`px-5 pb-1 pt-4 text-xs uppercase tracking-wider text-slate-500 ${fontMedium}`}>Your instructors</p>
      <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {matches.map((name) => (
          <li key={name}>
            <button type="button" onClick={() => onPick(name)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50">
              <Avatar name={name} className="size-9 text-13" />
              <span className="flex min-w-0 flex-col">
                <span dir="auto" className={`truncate text-sm leading-5 text-slate-900 ${fontFor(name, fontMedium)}`}>
                  {name}
                </span>
                {courseOf(name) && <span className={`truncate text-xs leading-4 text-slate-500 ${fontRegular}`}>{courseOf(name)}</span>}
              </span>
            </button>
          </li>
        ))}
        {matches.length === 0 && <li className={`px-3 py-4 text-sm text-slate-500 ${fontRegular}`}>No instructors match your search.</li>}
      </ul>
    </div>
  );
}

export default function MessagesPage() {
  const { notify } = useApp();
  const [threads, setThreads] = useStoredState<Thread[]>("thkee.threads", demoThreads());
  const [openName, setOpenName] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [reporting, setReporting] = useState(false);

  const open = openName ? (threads.find((t) => t.id === openName) ?? { id: openName, name: openName, unread: 0, messages: [] }) : null;
  const q = query.trim().toLowerCase();
  const unreadCount = threads.filter((t) => t.unread > 0).length;
  const shown = threads.filter((t) => (!unreadOnly || t.unread > 0) && (!q || t.name.toLowerCase().includes(q) || t.messages.some((m) => m.text.toLowerCase().includes(q))));
  const setUnread = (id: string, unread: number) => setThreads((list) => list.map((t) => (t.id === id ? { ...t, unread } : t)));

  const openThread = (name: string) => {
    setOpenName(name);
    setCreating(false);
    setUnread(name, 0);
  };
  const send = (text: string, html: string) => {
    if (!open) return;
    const message: Message = { id: `${Date.now()}`, mine: true, text, html, at: new Date().toISOString() };
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
  const tab = (active: boolean) => `flex h-7.5 flex-1 items-center justify-center gap-1.5 rounded-md text-13 transition-colors ${active ? `bg-white text-slate-900 shadow-sm ${fontMedium}` : `text-slate-600 hover:text-slate-900 ${fontRegular}`}`;

  return (
    <main className="w-full bg-white pt-14">
      <div className="mx-auto max-w-318 px-0 sm:px-4 sm:pb-8 sm:pt-6 md:pt-8">
        <div className="flex h-dvh-minus-56 min-h-130 overflow-hidden bg-white sm:h-dvh-minus-112 sm:rounded-xl sm:border sm:border-slate-200 sm:shadow-sm md:h-dvh-minus-120">
          <aside className={`min-h-0 w-full flex-col border-slate-200 md:flex md:w-80 md:shrink-0 md:border-r lg:w-90 ${paneOpen ? "hidden" : "flex"}`}>
            <div className="flex flex-col gap-3 px-4 pb-3 pt-4">
              <div className="flex h-9 items-center justify-between gap-2">
                <h1 className="m-0 font-instrument-medium text-22 font-medium leading-7 text-slate-900" style={headingStyle}>
                  Messages
                </h1>
                <div className="flex items-center gap-0.5">
                  <ActionMenu label="Message list options" triggerClass={iconButton} trigger={dots} items={[{ label: "Mark all as read", onClick: markAllRead, disabled: unreadCount === 0 }]} />
                  <button
                    type="button"
                    title="New message"
                    aria-label="New message"
                    onClick={() => {
                      setCreating(true);
                      setOpenName(null);
                    }}
                    className={`${iconButton} ${creating ? "bg-primary-100 text-primary-700" : ""}`}
                  >
                    <Icon icon={PencilEdit02Icon} size={20} />
                  </button>
                </div>
              </div>
              <label className="field-box">
                <Icon icon={Search01Icon} size={16} className="text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search messages" aria-label="Search messages" className={`min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 md:text-sm ${fontRegular}`} />
              </label>
              <div role="tablist" aria-label="Filter conversations" className="flex rounded-lg bg-slate-100 p-0.5">
                <button type="button" role="tab" aria-selected={!unreadOnly} onClick={() => setUnreadOnly(false)} className={tab(!unreadOnly)}>
                  All
                </button>
                <button type="button" role="tab" aria-selected={unreadOnly} onClick={() => setUnreadOnly(true)} className={tab(unreadOnly)}>
                  Unread
                  {unreadCount > 0 && <span className={`rounded-full bg-primary-700 px-1.5 text-11 leading-4 text-white ${fontSemi}`}>{unreadCount}</span>}
                </button>
              </div>
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto pb-2">
              {shown.map((thread) => (
                <ThreadRow key={thread.id} thread={thread} selected={thread.id === openName} onOpen={() => openThread(thread.id)} onToggleRead={() => setUnread(thread.id, thread.unread ? 0 : 1)} onReport={() => setReporting(true)} />
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
            {creating ? <NewChat onPick={openThread} onBack={() => setCreating(false)} /> : open ? <ThreadView thread={open} onBack={() => setOpenName(null)} onSend={send} onMarkUnread={markUnread} onReport={() => setReporting(true)} /> : <EmptyThread />}
          </section>
        </div>
      </div>
      {reporting && <ReportAbuseDialog onClose={() => setReporting(false)} />}
    </main>
  );
}
