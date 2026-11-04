import { useEffect, useRef, useState, type ReactNode } from "react";
import { courses } from "../data";
import { fontFor, fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, useApp, useStoredState } from "../store";
import { ActionMenu } from "./Menus";
import { NoteBody, NoteEditor } from "./Notes";
import { Shell } from "./Overlays";

type Message = { id: string; mine: boolean; text: string; html?: string; at: string };
type Thread = { id: string; name: string; unread: number; messages: Message[] };

const HOUR = 60 * 60 * 1000;
const avatarColors = ["#0d5c4b", "#1d4ed8", "#7c3aed", "#b45309", "#be123c", "#0f766e", "#475569"];
const issueTypes = ["Inappropriate Course Content", "Inappropriate Behavior", "Spammy Content", "Other"];
const people = [...new Set(courses.map((c) => c.instructor))];

const demoChats: { name: string; unread: number; hoursAgo: number; lines: string[] }[] = [
  {
    name: "Dr. Sara Al-Qahtani",
    unread: 2,
    hoursAgo: 16,
    lines: ["Hi, welcome to AI Foundations for Everyone. You can take the course however you'd like, but the idea is to finish one short lesson per day.", "Okay, thank you for taking me on this journey!", "Great! Let me know if any lesson feels too fast, and I'll share extra material.", "Okay, thank you!"],
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

const formatClock = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

function dayLabel(iso: string) {
  const date = new Date(iso);
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / (24 * HOUR));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(iso: string) {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / HOUR);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

function Avatar({ name, photo, className = "size-10 rounded-full text-[14px]" }: { name: string; photo?: string; className?: string }) {
  if (photo) return <img src={photo} alt="" className={`shrink-0 object-cover ${className}`} />;
  const initials = name
    .replace(/^Dr\.\s*/, "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const color = avatarColors[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % avatarColors.length];
  return (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center text-white ${className} ${fontSemi}`} style={{ backgroundColor: color }}>
      {initials || "?"}
    </span>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-[#475569]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function Chevron({ open, className = "size-4 text-[#0f172a]" }: { open?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`transition-transform ${open ? "rotate-180" : ""} ${className}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

const dots = (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5.5" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="12" cy="18.5" r="1.6" />
  </svg>
);
const dotsButton = "flex size-7 items-center justify-center rounded-full bg-white text-[#64748b] shadow-[0_1px_3px_rgba(15,23,42,0.12)] transition hover:text-[#0f172a]";

function ReportAbuseDialog({ onClose }: { onClose: () => void }) {
  const [issue, setIssue] = useState("");
  const [open, setOpen] = useState(false);
  const [showError, setShowError] = useState(false);
  const [done, setDone] = useState(false);
  const footer = "flex items-center justify-end gap-4 border-t border-[#e2e8f0] px-6 py-4";

  if (done) {
    return (
      <Shell title="Report abuse" onClose={onClose} width="max-w-[564px]" radius="sm:rounded-[12px]">
        <p className={`p-6 text-[14px] leading-[24px] text-[#64748b] ${fontRegular}`}>Thank you for helping maintain the integrity of our marketplace. We will review your report as soon as possible. As a matter of policy we will only follow up if we require additional information.</p>
        <div className={footer}>
          <button type="button" onClick={onClose} className={`h-[44px] rounded-[8px] bg-[#ffb20d] px-8 text-[14px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
            OK
          </button>
        </div>
      </Shell>
    );
  }

  const invalid = showError && !issue;
  return (
    <Shell title="Report abuse" onClose={onClose} width="max-w-[564px]" radius="sm:rounded-[12px]">
      <div className="flex flex-col gap-6 p-6">
        <p className={`text-[14px] leading-[24px] text-[#64748b] ${fontRegular}`}>Flagged content is reviewed by Thkee staff to determine whether it violates Terms of Service or Community Guidelines. If you have a question or technical issue, please contact our Support team here.</p>
        <div className="flex flex-col gap-2">
          <span id="issue-type" className={`text-[14px] leading-[20px] text-[#0f172a] ${fontMedium}`}>
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
            <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-labelledby="issue-type" aria-invalid={invalid} onClick={() => setOpen((o) => !o)} className={`flex h-[44px] w-full items-center justify-between rounded-[8px] border bg-white px-4 text-left text-[14px] transition ${invalid ? "border-[#ef4444]" : "border-[#e2e8f0]"} ${issue ? "text-[#0f172a]" : "text-[#94a3b8]"} ${fontRegular}`}>
              {issue || "Select an issue"}
              <Chevron open={open} className="size-4 text-[#64748b]" />
            </button>
            {open && (
              <ul role="listbox" aria-labelledby="issue-type" className="pop-in absolute inset-x-0 top-[calc(100%+4px)] z-20 flex flex-col gap-0.5 rounded-[8px] bg-white p-1 shadow-[0_8px_24px_rgba(15,23,42,0.15)]">
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
                      className={`w-full rounded-[4px] px-3 py-2 text-left text-[14px] leading-[20px] text-[#334155] transition ${issue === type ? "bg-[#ffefd6]" : "hover:bg-[#f1f5f9]"} ${fontRegular}`}
                    >
                      {type}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {invalid && <p className={`text-[12px] leading-[18px] text-[#dc2626] ${fontRegular}`}>Please select an issue.</p>}
        </div>
        <div className="flex flex-col gap-2">
          <span className={`text-[14px] leading-[20px] text-[#0f172a] ${fontMedium}`}>Issue details</span>
          <NoteEditor placeholder="Tell us more about the issue" hideActions autoFocus={false} />
        </div>
      </div>
      <div className={footer}>
        <button type="button" onClick={onClose} className={`h-[44px] rounded-[8px] px-4 text-[14px] text-[#1e293b] transition hover:bg-[#f1f5f9] ${fontMedium}`}>
          Cancel
        </button>
        <button type="button" onClick={() => (issue ? setDone(true) : setShowError(true))} className={`h-[44px] w-[150px] rounded-[8px] bg-[#ffb20d] text-[14px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
          Save
        </button>
      </div>
    </Shell>
  );
}

function ThreadRow({ thread, selected, onOpen, onToggleRead, onReport }: { thread: Thread; selected: boolean; onOpen: () => void; onToggleRead: () => void; onReport: () => void }) {
  const last = thread.messages[thread.messages.length - 1];
  const unread = thread.unread > 0;
  const preview = last ? (last.text || "Sent an image") : "";
  return (
    <li className={`relative transition ${selected ? "bg-[#f1f5f9]" : "hover:bg-[#f8fafc]"}`}>
      <button type="button" aria-current={selected ? "true" : undefined} onClick={onOpen} className="flex w-full items-start gap-3 py-4 pl-4 pr-[52px] text-left">
        <Avatar name={thread.name} />
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span dir="auto" className={`truncate pr-16 text-[14px] leading-[22px] ${unread || selected ? `text-[#0f172a] ${fontFor(thread.name, fontSemi)}` : `text-[#475569] ${fontFor(thread.name, fontRegular, "font-normal")}`}`}>
            {thread.name}
          </span>
          <span dir="auto" className={`truncate text-[14px] leading-[22px] ${unread || selected ? "text-[#1e293b]" : "text-[#94a3b8]"} ${fontRegular}`}>
            {preview}
          </span>
        </span>
      </button>
      <span className={`pointer-events-none absolute right-4 top-4 text-[12px] leading-[18px] text-[#64748b] ${fontRegular}`}>{last ? (selected ? `${dayLabel(last.at)}, ${formatClock(last.at)}` : timeAgo(last.at)) : ""}</span>
      <div className="absolute bottom-3.5 right-4 flex items-center gap-2">
        {unread && (
          <span aria-label={`${thread.unread} unread`} className={`flex size-6 items-center justify-center rounded-full bg-[#10b981] text-[12px] text-white ${fontMedium}`}>
            {thread.unread}
          </span>
        )}
        {!selected && (
          <ActionMenu
            label={`Options for ${thread.name}`}
            triggerClass={dotsButton}
            trigger={dots}
            items={[
              { label: unread ? "Mark as read" : "Mark as unread", onClick: onToggleRead },
              { label: "Report abuse", onClick: onReport },
            ]}
          />
        )}
      </div>
    </li>
  );
}

function ThreadView({ thread, onBack, onSend, onReport }: { thread: Thread; onBack: () => void; onSend: (text: string, html: string) => void; onReport: () => void }) {
  const { user } = useApp();
  const myPhoto = load("thkee.profile", { photo: "" }).photo;
  const scroller = useRef<HTMLDivElement>(null);
  const last = thread.messages[thread.messages.length - 1];

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [thread.id, thread.messages.length]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 sm:gap-4 sm:px-6">
        <button type="button" onClick={onBack} aria-label="Back to messages" className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#334155] hover:bg-[#f1f5f9] md:hidden">
          <Chevron className="size-5 rotate-90" />
        </button>
        <Avatar name={thread.name} className="size-14 rounded-full text-[18px]" />
        <div className="min-w-0 flex-1">
          <p dir="auto" className={`truncate text-[18px] leading-[28px] text-[#1e293b] ${fontFor(thread.name, fontSemi)}`}>
            {thread.name}
          </p>
          <p className={`text-[14px] leading-[22px] text-[#64748b] ${fontRegular}`}>{last ? `${dayLabel(last.at)} at ${formatClock(last.at)}` : "New conversation"}</p>
        </div>
        <ActionMenu label={`Options for ${thread.name}`} triggerClass={dotsButton} trigger={dots} items={[{ label: "Report abuse", onClick: onReport }]} />
      </header>
      <div ref={scroller} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-5">
        {thread.messages.map((message, i) => {
          const day = dayLabel(message.at);
          const newDay = i === 0 || dayLabel(thread.messages[i - 1].at) !== day;
          return (
            <div key={message.id} className="flex flex-col gap-4">
              {newDay && (
                <div className="flex items-center gap-5">
                  <span className="h-px flex-1 bg-[#e2e8f0]" />
                  <span className={`text-[12px] uppercase leading-[18px] text-[#94a3b8] ${fontRegular}`}>{day}</span>
                  <span className="h-px flex-1 bg-[#e2e8f0]" />
                </div>
              )}
              <div className={`flex gap-4 ${message.mine ? "flex-row-reverse" : ""}`}>
                {message.mine ? <Avatar name={user?.name ?? "You"} photo={myPhoto} /> : <Avatar name={thread.name} />}
                <div className={`flex min-w-0 max-w-[456px] flex-col gap-2 ${message.mine ? "items-end" : "items-start"}`}>
                  <p className={`flex items-baseline gap-3 ${message.mine ? "flex-row-reverse" : ""}`}>
                    <span dir="auto" className={`text-[16px] leading-[24px] text-[#1e293b] ${message.mine ? fontSemi : fontFor(thread.name, fontSemi)}`}>
                      {message.mine ? "You" : thread.name}
                    </span>
                    <span className={`text-[12px] leading-[18px] text-[#64748b] ${fontRegular}`}>{formatClock(message.at)}</span>
                  </p>
                  <div className={`max-w-full rounded-[12px] px-4 py-3 ${message.mine ? "border border-[#fdce7c] bg-[#fff9f0]" : "bg-[#f8fafc]"}`}>
                    <NoteBody note={message} tone={message.mine ? "text-[#5c3d00]" : "text-[#1e293b]"} className="break-words" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-[#f8fafc] p-4 sm:p-6">
        <NoteEditor key={thread.id} placeholder="Type your message" saveLabel="Send" saveClass="!h-[56px] w-[80px] shrink-0 !px-0 border border-[#1e293b] bg-[#fdce7c] text-[#1e293b] hover:bg-[#ffb20d]" imageOnly sideAction clearOnSave autoFocus={false} onSave={onSend} />
      </div>
    </div>
  );
}

function EmptyThread() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <svg viewBox="0 0 208 188" className="w-[208px]" fill="none" aria-hidden="true">
        <path d="M6 4h124a4 4 0 014 4v36a4 4 0 01-4 4H34L14 66l2-18H6a4 4 0 01-4-4V8a4 4 0 014-4z" fill="#fff" stroke="#94a3b8" />
        <circle cx="16" cy="15" r="4.5" fill="#cbd5e1" />
        <path d="M12 26h76" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        <path d="M12 37h112" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        <path d="M78 62h124a4 4 0 014 4v36a4 4 0 01-4 4h-10l2 18-20-18H78a4 4 0 01-4-4V66a4 4 0 014-4z" fill="#fff" stroke="#475569" />
        <circle cx="88" cy="72" r="4.5" fill="#475569" />
        <path d="M84 83h76" stroke="#ffb20d" strokeWidth="4" strokeLinecap="round" />
        <path d="M84 94h112" stroke="#ffb20d" strokeWidth="4" strokeLinecap="round" />
        <path d="M6 122h124a4 4 0 014 4v36a4 4 0 01-4 4H34l-20 18 2-18H6a4 4 0 01-4-4v-36a4 4 0 014-4z" fill="#fff" stroke="#94a3b8" />
        <circle cx="16" cy="133" r="4.5" fill="#cbd5e1" />
        <path d="M12 144h76" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        <path d="M12 155h112" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <p className={`text-[14px] leading-[24px] text-[#1e293b] ${fontRegular}`}>Select a message thread to read it here.</p>
    </div>
  );
}

function NewChat({ onPick, onBack }: { onPick: (name: string) => void; onBack: () => void }) {
  const [query, setQuery] = useState("");
  const matches = people.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-[#e2e8f0] p-4 sm:px-6">
        <button type="button" onClick={onBack} aria-label="Back to messages" className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#334155] hover:bg-[#f1f5f9] md:hidden">
          <Chevron className="size-5 rotate-90" />
        </button>
        <label className="flex h-[44px] flex-1 items-center gap-2.5 rounded-[8px] border border-[#334155] bg-white px-4">
          <SearchIcon />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Escape" && onBack()} placeholder="Search user or chat" aria-label="Search user or chat" className={`min-w-0 flex-1 bg-transparent text-[16px] text-[#0f172a] outline-none placeholder:text-[#94a3b8] md:text-[14px] ${fontRegular}`} />
        </label>
      </div>
      <ul className="min-h-0 overflow-y-auto py-3 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
        {matches.map((name) => (
          <li key={name}>
            <button type="button" onClick={() => onPick(name)} className="flex w-full items-center gap-3 px-6 py-2 text-left transition hover:bg-[#fff9f0]">
              <Avatar name={name} className="size-9 rounded-[4px] text-[12px]" />
              <span dir="auto" className={`truncate text-[14px] leading-[22px] text-[#334155] ${fontFor(name, fontMedium)}`}>
                {name}
              </span>
            </button>
          </li>
        ))}
        {matches.length === 0 && <li className={`px-6 py-4 text-[14px] text-[#64748b] ${fontRegular}`}>No users match your search.</li>}
      </ul>
    </div>
  );
}

function MenuTrigger({ children, open }: { children: ReactNode; open?: boolean }) {
  return (
    <span className={`flex items-center gap-2 text-[14px] leading-[22px] text-[#0f172a] ${fontMedium}`}>
      {children}
      <Chevron open={open} />
    </span>
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
  const paneOpen = creating || !!open;

  return (
    <main className="w-full bg-white pt-[72px]">
      <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-4 md:px-8 xl:px-20">
        <h1 className="mx-auto m-0 flex h-[122px] max-w-[1280px] items-center font-['Instrument_Sans:Medium'] text-[24px] font-medium leading-[32px] text-[#0f172a]" style={{ fontVariationSettings: '"wdth" 100' }}>
          Messages
        </h1>
      </div>
      <div className="px-4 py-6 md:px-8 xl:px-20">
        <div className="mx-auto flex h-[calc(100dvh-120px)] min-h-[560px] max-w-[1280px] overflow-hidden rounded-[8px] border border-[#e2e8f0] md:h-[max(640px,calc(100dvh-200px))]">
          <aside className={`min-h-0 w-full flex-col border-[#e2e8f0] md:flex md:w-[340px] md:shrink-0 md:border-r lg:w-[414px] ${paneOpen ? "hidden" : "flex"}`}>
            <div className="flex flex-col gap-4 border-b border-[#e2e8f0] p-6">
              <button
                type="button"
                onClick={() => {
                  setCreating(true);
                  setOpenName(null);
                }}
                className={`h-[44px] rounded-[6px] bg-[#334155] text-[14px] text-white transition hover:bg-[#1e293b] ${fontMedium}`}
              >
                Create New
              </button>
              {!creating && (
                <label className="flex h-[42px] items-center gap-2.5 rounded-[8px] bg-[#f1f5f9] px-4">
                  <SearchIcon />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search user or chat" aria-label="Search user or chat" className={`min-w-0 flex-1 bg-transparent text-[16px] text-[#0f172a] outline-none placeholder:text-[#94a3b8] md:text-[14px] ${fontRegular}`} />
                </label>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 px-6 py-3">
              <ActionMenu
                label="Filter messages"
                triggerClass=""
                trigger={<MenuTrigger>{unreadOnly ? "Unread" : "All messages"}</MenuTrigger>}
                items={[
                  { label: "All messages", onClick: () => setUnreadOnly(false) },
                  { label: "Unread", onClick: () => setUnreadOnly(true) },
                ]}
                alignLeft
              />
              <button type="button" onClick={markAllRead} className={`text-[14px] leading-[22px] text-[#059669] transition hover:text-[#047857] ${fontMedium}`}>
                Mark all Read
              </button>
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {shown.map((thread) => (
                <ThreadRow key={thread.id} thread={thread} selected={thread.id === openName} onOpen={() => openThread(thread.id)} onToggleRead={() => setUnread(thread.id, thread.unread ? 0 : 1)} onReport={() => setReporting(true)} />
              ))}
              {shown.length === 0 && <li className={`px-6 py-10 text-center text-[14px] text-[#64748b] ${fontRegular}`}>{q ? "No conversations match your search." : "No unread messages."}</li>}
            </ul>
          </aside>
          <section className={`min-h-0 min-w-0 flex-1 flex-col md:flex ${paneOpen ? "flex" : "hidden"}`}>
            {creating ? <NewChat onPick={openThread} onBack={() => setCreating(false)} /> : open ? <ThreadView thread={open} onBack={() => setOpenName(null)} onSend={send} onReport={() => setReporting(true)} /> : <EmptyThread />}
          </section>
        </div>
      </div>
      {reporting && <ReportAbuseDialog onClose={() => setReporting(false)} />}
    </main>
  );
}
