import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Calendar03Icon, Mail01Icon, Megaphone01Icon, PlusSignIcon, Search01Icon, ViewIcon } from "@hugeicons/core-free-icons";
import { buttonClass } from "./Button";
import { fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, save, useApp } from "../store";
import { DatePicker } from "./DatePicker";
import { Checkbox } from "./InstructorAssignments";
import { Pagination } from "./InstructorCourses";
import { ActionMenu, FilterSelect } from "./Menus";
import { NoteBody, NoteEditor } from "./Notes";
import { Shell } from "./Overlays";

const imgClose = "/assets/53e9a.svg";

export type AnnouncementCourse = { id: string; title: string; image: string };
// at: ISO time it goes out (scheduled if in the future). emailed: also sent to students' inboxes.
export type Announcement = { id: string; title: string; preview: string; text: string; html?: string; published: string; stamp: string; at?: string; emailed?: boolean };
type Store = { quota: number; items: Record<string, Announcement[]> };

const COURSES: AnnouncementCourse[] = [
  { id: "responsive-design", title: "Responsive Design and Cross-Platform Compatibility", image: "/assets/courses/ui-ux-figma.jpg" },
  { id: "adobe-xd", title: "Adobe Xd: The Absolute Beginner to Pro Class", image: "/assets/be57c.png" },
  { id: "usability-testing", title: "Usability Testing and User Feedback Analysis", image: "/assets/courses/react-web-apps-v2.jpg" },
  { id: "python-programming", title: "Python Programming for Beginners", image: "/assets/courses/python-programming.jpg" },
  { id: "leadership", title: "Leadership Essentials", image: "/assets/courses/leadership-essentials.jpg" },
];
// Enrolled students per course, for the "emailed to" and "seen by" numbers.
const STUDENTS: Record<string, number> = { "responsive-design": 248, "adobe-xd": 96, "usability-testing": 132, "python-programming": 512, leadership: 74 };

const DAY = 24 * 60 * 60 * 1000;
const formatDateTime = (date: Date) => {
  const day = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day}, ${time}`;
};
const pad = (n: number) => String(n).padStart(2, "0");
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const makePreview = (text: string) => (text.length > 120 ? `${text.slice(0, 120).trimEnd()}…` : text);

const seed = (id: string, daysFromNow: number, title: string, text: string, emailed = true): Announcement => {
  const at = new Date(Date.now() + daysFromNow * DAY);
  at.setHours(daysFromNow > 0 ? 19 : 10, 0, 0, 0);
  return { id, title, text, preview: makePreview(text), published: formatDateTime(at), stamp: formatDateTime(at), at: at.toISOString(), emailed };
};
const SEED: Store = {
  quota: 3,
  items: {
    "responsive-design": [
      seed("rd-3", 3, "Live Q&A this Thursday", "Join me live on Thursday for a 45-minute Q&A on layout and breakpoints. Bring your questions from Section 3 and your current project."),
      seed("rd-2", -2, "New lesson: fluid type with clamp()", "I've added a 12-minute lesson on fluid typography with CSS clamp(). It replaces the older media-query approach in Section 3, so watch it before you start Assignment 2."),
      seed("rd-1", -9, "Assignment 2 deadline moved to Friday", "A few of you asked for more time, so the Assignment 2 deadline is now Friday at midnight. Use the extra days to test your layout on a real phone.", false),
    ],
    "usability-testing": [
      seed("ut-2", -5, "Download the interview script template", "The interview script template is now in the Resources tab. Use it for your first three user interviews and adjust the questions to your product."),
      seed("ut-1", -14, "Feedback on your first usability reports", "I've finished reviewing the first reports. The strongest ones clearly separated what users did from what they said. Check your comments in Assignments."),
    ],
    "python-programming": [
      seed("py-2", 6, "Office hours moved to Sunday", "This week's office hours move from Saturday to Sunday at 7 PM. The link stays the same."),
      seed("py-1", -1, "Section 4 exercises are updated", "The Section 4 exercises now include solutions and two extra practice problems on loops. Try them before looking at the answers."),
    ],
  },
};

const STORE_KEY = "thkee.instructorAnnouncements.v2";
const FEED_PAGE = 8;
const titleClass = "m-0 font-instrument-medium text-2xl font-medium leading-8 text-slate-900";
const titleStyle = { fontVariationSettings: '"wdth" 100' };

const isScheduled = (a: Announcement) => !!a.at && new Date(a.at).getTime() > Date.now();
const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const shortDateTime = (iso: string) => `${shortDate(iso)}, ${new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
// A stable "seen by" share for each published announcement (demo data).
const seenShare = (id: string) => 0.45 + ([...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 40) / 100;

function GreenMegaphone() {
  return <HugeiconsIcon icon={Megaphone01Icon} size={20} strokeWidth={1.8} aria-hidden="true" className="mt-0.5 shrink-0 text-primary-700" />;
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-150 px-6 py-5">
      <h2 className={`text-base leading-6 text-slate-900 ${fontSemi}`}>{title}</h2>
      <button type="button" onClick={onClose} aria-label="Close" className="flex transition hover:opacity-70">
        <img src={imgClose} alt="" width={20} height={20} className="size-5" />
      </button>
    </div>
  );
}

const fieldLabel = `text-sm leading-5 text-slate-800 ${fontMedium}`;
const fieldInput = "field";

function AnnouncementFields({ title, setTitle, initial, onBody }: { title: string; setTitle: (v: string) => void; initial?: Announcement; onBody: (text: string, html: string) => void }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <label htmlFor="announcement-title" className={fieldLabel}>
          Title of announcement
        </label>
        <input id="announcement-title" value={title} maxLength={55} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement and email title( 55 character max)" className={fieldInput} />
      </div>
      <div className="flex flex-col gap-2">
        <p className={fieldLabel}>Description</p>
        <NoteEditor imageOnly hideActions autoFocus={false} initial={initial ? { text: initial.text, html: initial.html } : undefined} placeholder="Type your message" onChange={onBody} />
      </div>
    </>
  );
}

function ModalFooter({ onCancel, onPublish }: { onCancel: () => void; onPublish: () => void }) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-slate-150 px-6 py-4">
      <button type="button" onClick={onCancel} className={buttonClass("ghost", "lg")}>
        Cancel
      </button>
      <button type="button" onClick={onPublish} className={buttonClass("primary", "lg")}>
        Publish
      </button>
    </div>
  );
}

export function CreateModal({ fixedCourse, onClose, onPublish }: { fixedCourse?: AnnouncementCourse; onClose: () => void; onPublish: (courseId: string, announcement: Announcement) => void }) {
  const { notify } = useApp();
  const [courseId, setCourseId] = useState(fixedCourse?.id ?? "");
  const [publishNow, setPublishNow] = useState(false);
  const [date, setDate] = useState(() => toDateInput(new Date()));
  const [time, setTime] = useState("12:00");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState({ text: "", html: "" });
  const [sendEmail, setSendEmail] = useState(true);

  const scheduled = publishNow ? new Date() : new Date(`${date}T${time}`);
  const validDate = !Number.isNaN(scheduled.getTime());
  const notice = validDate ? formatDateTime(scheduled) : "";

  const publish = () => {
    if (!courseId) return notify("Select a course first");
    if (!validDate) return notify("Pick a publish date and time");
    if (!publishNow && scheduled.getTime() < Date.now()) return notify("Pick a publish time in the future");
    if (!title.trim()) return notify("Add a title first");
    if (!body.text && !body.html) return notify("Write a description first");
    onPublish(courseId, { id: `a-${Date.now()}`, title: title.trim(), preview: makePreview(body.text), text: body.text, html: body.html, published: formatDateTime(scheduled), stamp: formatDateTime(scheduled), at: scheduled.toISOString(), emailed: sendEmail });
    notify(publishNow ? (sendEmail ? "Announcement published and emailed to students" : "Announcement published") : `Announcement scheduled for ${notice}`);
  };

  return (
    <Shell title="Create Announcement" onClose={onClose} hideHeader width="max-w-159.5" radius="sm:rounded-2xl">
      <ModalHeader title="Create Announcement" onClose={onClose} />
      <div className="flex flex-col gap-4 px-6 py-5">
        {fixedCourse ? (
          <p className={`text-lg leading-7 text-slate-800 ${fontSemi}`}>{fixedCourse.title}</p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className={fieldLabel}>Course</p>
            <div className="[&_ul]:w-full">
              <FilterSelect plain label="Course" value={courseId} onChange={setCourseId} options={[{ value: "", label: "Choose a course" }, ...COURSES.map((c) => ({ value: c.id, label: c.title }))]} />
            </div>
          </div>
        )}
        <p className={`text-base leading-6 text-slate-800 ${fontMedium}`}>Announcement Details</p>
        <Checkbox checked={publishNow} onChange={() => setPublishNow(!publishNow)}>
          <span className={`text-sm leading-5 text-slate-700 ${fontRegular}`}>Publish Now</span>
        </Checkbox>
        <div className={`grid gap-5 sm:grid-cols-2 ${publishNow ? "opacity-50" : ""}`}>
          <div className="flex flex-col gap-2">
            <label htmlFor="announcement-date" className={fieldLabel}>
              Published at
            </label>
            <DatePicker id="announcement-date" value={date} min={toDateInput(new Date())} disabled={publishNow} onChange={setDate} clearable={false} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="announcement-time" className={fieldLabel}>
              Published time
            </label>
            <input id="announcement-time" type="time" value={time} disabled={publishNow} onChange={(e) => setTime(e.target.value)} className={fieldInput} />
          </div>
        </div>
        <p className={`flex items-center gap-2.5 rounded-xl bg-primary-50 px-3 py-3 text-xs leading-4.5 text-primary-800 ${fontRegular}`}>
          <GreenMegaphone />
          <span>
            This announcement will be published at <span className={fontSemi}>{notice}</span>
          </span>
        </p>
        <AnnouncementFields title={title} setTitle={setTitle} onBody={(text, html) => setBody({ text, html })} />
        <Checkbox checked={sendEmail} onChange={() => setSendEmail(!sendEmail)}>
          <span className={`text-sm leading-5 text-slate-700 ${fontRegular}`}>Send this as an email to students.</span>
        </Checkbox>
      </div>
      <ModalFooter onCancel={onClose} onPublish={publish} />
    </Shell>
  );
}

export function EditModal({ course, announcement, onClose, onSave }: { course: AnnouncementCourse; announcement: Announcement; onClose: () => void; onSave: (next: Announcement) => void }) {
  const { notify } = useApp();
  const [title, setTitle] = useState(announcement.title);
  const [body, setBody] = useState({ text: announcement.text, html: announcement.html ?? "" });

  const publish = () => {
    if (!title.trim()) return notify("Add a title first");
    if (!body.text && !body.html) return notify("Write a description first");
    const changedText = body.text !== announcement.text;
    onSave({ ...announcement, title: title.trim(), text: body.text, html: body.html, preview: changedText ? makePreview(body.text) : announcement.preview });
    notify("Announcement updated");
  };

  return (
    <Shell title="Edit" onClose={onClose} hideHeader width="max-w-159.5" radius="sm:rounded-2xl">
      <ModalHeader title="Edit" onClose={onClose} />
      <div className="flex flex-col gap-4 px-6 py-5">
        <p className={`text-lg leading-7 text-slate-800 ${fontSemi}`}>{course.title}</p>
        <p className={`mt-3 text-base leading-6 text-slate-800 ${fontMedium}`}>Announcement Details</p>
        <AnnouncementFields title={title} setTitle={setTitle} initial={announcement} onBody={(text, html) => setBody({ text, html })} />
      </div>
      <ModalFooter onCancel={onClose} onPublish={publish} />
    </Shell>
  );
}

export function DeleteModal({ announcement, onClose, onConfirm }: { announcement: Announcement; onClose: () => void; onConfirm: () => void }) {
  return (
    <Shell title="Please confirm" onClose={onClose} hideHeader width="max-w-158.5" radius="sm:rounded-2xl">
      <ModalHeader title="Please confirm" onClose={onClose} />
      <div className="flex flex-col gap-5 px-6 py-5">
        <p className={`text-base leading-6 text-slate-700 ${fontMedium}`}>Are you sure you want to delete this announcement?</p>
        <div className="rounded-md bg-red-50 px-2 py-3">
          <p className={`whitespace-pre-wrap text-xs leading-4.5 text-slate-400 ${fontRegular}`}>{announcement.stamp}</p>
          <p className={`mt-3 text-sm leading-5 text-red-600 ${fontSemi}`}>{announcement.title}</p>
        </div>
        <p className={`text-sm leading-5 text-slate-500 ${fontRegular}`}>N.B.: If you delete this announcement, you can't restore it.</p>
      </div>
      <div className="flex items-center justify-end gap-8 border-t border-slate-150 px-6 py-4">
        <button type="button" onClick={onClose} className={`text-base leading-6 text-slate-800 transition hover:text-slate-500 ${fontMedium}`}>
          Cancel
        </button>
        <button type="button" onClick={onConfirm} className={`h-11 rounded-lg bg-red-500 px-6 text-base leading-5 text-white transition hover:bg-red-600 ${fontMedium}`}>
          Yes, I confirm
        </button>
      </div>
    </Shell>
  );
}

type Entry = Announcement & { course: AnnouncementCourse };
type Tab = "all" | "published" | "scheduled";

function Meta({ icon, children }: { icon: IconSvgElement; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <HugeiconsIcon icon={icon} size={14} strokeWidth={1.8} aria-hidden="true" className="text-slate-400" />
      {children}
    </span>
  );
}

function AnnouncementCard({ entry, open, onToggle, onEdit, onDelete, onPublishNow }: { entry: Entry; open: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void; onPublishNow: () => void }) {
  const scheduled = isScheduled(entry);
  const reach = STUDENTS[entry.course.id] ?? 0;
  const seen = Math.round(reach * seenShare(entry.id));
  return (
    <article id={`announcement-${entry.id}`} className={`rounded-2xl border bg-white p-4 transition-colors md:p-5 ${open ? "border-primary-200" : "border-slate-200 hover:border-slate-300"}`}>
      <div className="flex gap-4">
        <img src={entry.course.image} alt="" className="hidden aspect-video w-24 shrink-0 self-start rounded-lg object-cover sm:block" />
        <div className="min-w-0 flex-1">
          <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-4.5 text-slate-500 ${fontRegular}`}>
            <span className="min-w-0 truncate">{entry.course.title}</span>
            <span
              className={`inline-flex h-5.5 shrink-0 items-center rounded-full px-2 text-11 ring-1 ring-inset ${scheduled ? "bg-secondary-50 text-secondary-800 ring-secondary-200" : "bg-primary-50 text-primary-700 ring-primary-200"} ${fontSemi}`}
            >
              {scheduled ? "Scheduled" : "Published"}
            </span>
          </div>
          <button type="button" aria-expanded={open} onClick={onToggle} className="mt-1 block w-full text-left">
            <h3 className={`text-15 leading-5.5 text-slate-900 transition-colors hover:text-primary-800 ${fontSemi}`}>{entry.title}</h3>
            {!open && <p className={`mt-1 line-clamp-2 text-sm leading-5.5 text-slate-600 ${fontRegular}`}>{entry.text}</p>}
          </button>
          {open && <NoteBody note={{ text: entry.text, html: entry.html }} tone="text-slate-700" className="mt-1 !leading-6" />}
          <div className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs leading-4.5 text-slate-500 ${fontRegular}`}>
            {entry.at && <Meta icon={Calendar03Icon}>{scheduled ? `Goes out ${shortDateTime(entry.at)}` : `Published ${shortDate(entry.at)}`}</Meta>}
            {entry.emailed !== false && <Meta icon={Mail01Icon}>{scheduled ? `Will email ${reach} students` : `Emailed to ${reach} students`}</Meta>}
            {!scheduled && reach > 0 && (
              <Meta icon={ViewIcon}>
                Seen by {seen} ({Math.round((seen / reach) * 100)}%)
              </Meta>
            )}
            <button type="button" onClick={onToggle} className={`ml-auto text-primary-700 transition hover:text-primary-800 hover:underline ${fontMedium}`}>
              {open ? "Show less" : "Read more"}
            </button>
          </div>
        </div>
        <ActionMenu
          label={`More actions for ${entry.title}`}
          triggerClass="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          trigger={
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="5" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="12" cy="19" r="1.8" />
            </svg>
          }
          items={[
            ...(scheduled ? [{ label: "Publish now", onClick: onPublishNow }] : []),
            { label: "Edit", onClick: onEdit },
            { label: "Delete", danger: true, onClick: onDelete },
          ]}
        />
      </div>
    </article>
  );
}

function QuotaMeter({ left, total }: { left: number; total: number }) {
  return (
    <div className="flex flex-col gap-1.5" title="Announcements you can still post this month">
      <span className={`text-xs leading-4 text-slate-500 ${fontRegular}`}>
        <span className={`text-slate-900 ${fontSemi}`}>
          {left} of {total}
        </span>{" "}
        left this month
      </span>
      <span className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-1.5 w-7 rounded-full ${i < total - left ? "bg-slate-200" : "bg-primary-700"}`} />
        ))}
      </span>
    </div>
  );
}

const MONTHLY_LIMIT = 4;

export default function InstructorAnnouncements({ courseId }: { courseId?: string }) {
  const { notify } = useApp();
  const still = useReducedMotion();
  const [store, setStore] = useState<Store>(() => load(STORE_KEY, SEED));
  const [tab, setTab] = useState<Tab>("all");
  const [course, setCourse] = useState(courseId ?? "all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [creating, setCreating] = useState<AnnouncementCourse | true | null>(null);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [deleting, setDeleting] = useState<Entry | null>(null);

  useEffect(() => save(STORE_KEY, store), [store]);
  useEffect(() => setCourse(courseId ?? "all"), [courseId]);

  const setItems = (id: string, next: (list: Announcement[]) => Announcement[]) => setStore((s) => ({ ...s, items: { ...s.items, [id]: next(s.items[id] ?? []) } }));
  const startCreate = (fixed?: AnnouncementCourse) => {
    if (store.quota <= 0) return notify("You've used all your announcements for this month");
    setCreating(fixed ?? true);
  };

  const all: Entry[] = COURSES.flatMap((c) => (store.items[c.id] ?? []).map((a) => ({ ...a, course: c }))).sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
  const q = query.trim().toLowerCase();
  const scoped = all.filter((e) => (course === "all" || e.course.id === course) && (!q || `${e.title} ${e.text}`.toLowerCase().includes(q)));
  const counts = { all: scoped.length, published: scoped.filter((e) => !isScheduled(e)).length, scheduled: scoped.filter(isScheduled).length };
  const list = scoped.filter((e) => tab === "all" || (tab === "scheduled" ? isScheduled(e) : !isScheduled(e)));
  const pageCount = Math.max(1, Math.ceil(list.length / FEED_PAGE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * FEED_PAGE;
  const shown = list.slice(start, start + FEED_PAGE);
  // Courses students haven't heard from yet: a gentle nudge at the top of the feed.
  const quiet = COURSES.filter((c) => !(store.items[c.id] ?? []).length && (course === "all" || c.id === course));

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "published", label: "Published" },
    { key: "scheduled", label: "Scheduled" },
  ];

  return (
    <main className="flex flex-1 flex-col bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-4 py-6 md:px-7">
        <div className="min-w-0">
          <h1 className={titleClass} style={titleStyle}>
            Announcements
          </h1>
          <p className={`mt-1 text-sm leading-5 text-slate-500 ${fontRegular}`}>Share updates with the students of a course. They see them in the course and can get them by email.</p>
        </div>
        <div className="flex items-center gap-5">
          <QuotaMeter left={store.quota} total={MONTHLY_LIMIT} />
          <button type="button" onClick={() => startCreate(COURSES.find((c) => c.id === course))} disabled={store.quota <= 0} className={buttonClass("primary", "lg")}>
            <HugeiconsIcon icon={PlusSignIcon} size={18} strokeWidth={2} aria-hidden="true" />
            New announcement
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 py-6 md:px-7">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200">
          <div role="tablist" aria-label="Announcement status" className="-mb-px flex gap-1 overflow-x-auto">
            {tabs.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setTab(t.key);
                    setPage(1);
                  }}
                  className={`relative flex shrink-0 items-center gap-2 px-3 pb-3.5 pt-2 text-sm transition-colors ${active ? `text-slate-900 ${fontSemi}` : `text-slate-500 hover:text-slate-900 ${fontMedium}`}`}
                >
                  {t.label}
                  <span className={`rounded-full px-2 py-0.5 text-11 leading-3.5 tabular-nums ${active ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-500"} ${fontSemi}`}>{counts[t.key]}</span>
                  {active && (
                    <motion.span
                      layoutId="announcement-tabs"
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary-700"
                      transition={still ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 pb-3 md:w-auto">
            <label className="field-box min-w-0 flex-1 md:w-56 md:flex-none">
              <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.8} aria-hidden="true" className="shrink-0 text-slate-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search announcements"
                aria-label="Search announcements"
                className={`min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 md:text-sm ${fontRegular}`}
              />
            </label>
            <FilterSelect
              large
              alignRight
              label="Course"
              value={course}
              onChange={(next) => {
                setCourse(next);
                setPage(1);
              }}
              options={[{ value: "all", label: "All courses" }, ...COURSES.map((c) => ({ value: c.id, label: c.title }))]}
            />
          </div>
        </div>

        {quiet.length > 0 && tab !== "scheduled" && !q && (
          <section aria-labelledby="quiet-courses" className="rounded-2xl bg-primary-50 p-4 ring-1 ring-inset ring-primary-200">
            <div className="flex items-start gap-3">
              <GreenMegaphone />
              <div className="min-w-0">
                <h2 id="quiet-courses" className={`text-sm leading-5 text-slate-900 ${fontSemi}`}>
                  {quiet.length === 1 ? "This course has no announcements yet" : "These courses have no announcements yet"}
                </h2>
                <p className={`text-13 leading-5 text-slate-600 ${fontRegular}`}>Their students haven't heard from you. A short welcome message helps them get started.</p>
              </div>
            </div>
            <ul className="mt-3 flex flex-col gap-2 sm:pl-8">
              {quiet.map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-xl bg-white p-2 pr-3 ring-1 ring-primary-100">
                  <img src={c.image} alt="" className="aspect-video w-14 shrink-0 rounded-md object-cover" />
                  <span className={`min-w-0 flex-1 truncate text-sm leading-5 text-slate-900 ${fontMedium}`}>{c.title}</span>
                  <button type="button" onClick={() => startCreate(c)} className={buttonClass("soft", "md")}>
                    Write announcement
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div key={`${tab}-${course}`} className="fade-up flex flex-col gap-3">
          {shown.map((entry) => (
            <AnnouncementCard
              key={entry.id}
              entry={entry}
              open={expanded === entry.id}
              onToggle={() => setExpanded(expanded === entry.id ? null : entry.id)}
              onEdit={() => setEditing(entry)}
              onDelete={() => setDeleting(entry)}
              onPublishNow={() => {
                const now = new Date();
                setItems(entry.course.id, (items) => items.map((a) => (a.id === entry.id ? { ...a, at: now.toISOString(), published: formatDateTime(now), stamp: formatDateTime(now) } : a)));
                notify("Announcement published");
              }}
            />
          ))}
          {shown.length === 0 && (
            <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-slate-200 px-6 py-14 text-center">
              <p className={`text-15 text-slate-900 ${fontSemi}`}>{q ? "No announcements match your search" : tab === "scheduled" ? "Nothing scheduled" : "No announcements yet"}</p>
              <p className={`text-sm text-slate-500 ${fontRegular}`}>{q ? "Try different words or another course." : "Post an update and your students will see it in the course."}</p>
            </div>
          )}
        </div>
      </div>
      {list.length > FEED_PAGE && <Pagination page={current} pageCount={pageCount} start={start} shown={shown.length} total={list.length} onPage={setPage} />}

      {creating && (
        <CreateModal
          fixedCourse={creating === true ? undefined : creating}
          onClose={() => setCreating(null)}
          onPublish={(id, announcement) => {
            setStore((s) => ({ quota: s.quota - 1, items: { ...s.items, [id]: [announcement, ...(s.items[id] ?? [])] } }));
            setExpanded(announcement.id);
            setTab("all");
            setCreating(null);
          }}
        />
      )}
      {editing && (
        <EditModal
          course={editing.course}
          announcement={editing}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            setItems(editing.course.id, (items) => items.map((i) => (i.id === next.id ? { ...i, ...next } : i)));
            setEditing(null);
          }}
        />
      )}
      {deleting && (
        <DeleteModal
          announcement={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            setItems(deleting.course.id, (items) => items.filter((i) => i.id !== deleting.id));
            setDeleting(null);
            notify("Announcement deleted");
          }}
        />
      )}
    </main>
  );
}
