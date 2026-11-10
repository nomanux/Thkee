import { useEffect, useState } from "react";
import { fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, openInstructorAnnouncements, save, useApp } from "../store";
import { DatePicker } from "./DatePicker";
import { Checkbox } from "./InstructorAssignments";
import { Pagination } from "./InstructorCourses";
import { ActionMenu, FilterSelect } from "./Menus";
import { NoteBody, NoteEditor } from "./Notes";
import { Shell } from "./Overlays";

const imgMegaphone = "/assets/48fdd.svg";
const imgPencil = "/assets/5f49c.svg";
const imgClose = "/assets/53e9a.svg";

export type AnnouncementCourse = { id: string; title: string; image: string };
export type Announcement = { id: string; title: string; preview: string; text: string; html?: string; published: string; stamp: string };
type Store = { quota: number; items: Record<string, Announcement[]> };

const COURSES: AnnouncementCourse[] = [
  { id: "responsive-design", title: "Responsive Design and Cross-Platform Compatibility", image: "/assets/courses/ui-ux-figma.jpg" },
  { id: "adobe-xd", title: "Adobe Xd: The Absolute Beginner to Pro Class", image: "/assets/be57c.png" },
  { id: "usability-testing", title: "Usability Testing and User Feedback Analysis", image: "/assets/courses/react-web-apps-v2.jpg" },
  { id: "python-programming", title: "Python Programming for Beginners", image: "/assets/courses/python-programming.jpg" },
  { id: "leadership", title: "Leadership Essentials", image: "/assets/courses/leadership-essentials.jpg" },
];

const seedAnnouncement = (course: string, i: number): Announcement => ({
  id: `${course}-${i}`,
  title: "Urgent assignment submissions",
  preview: "Dear students, we already uploaded two videos about this.......",
  text: "📣 Attention Students! Join us on 13 January to explore valuable insights on conquering urgent assignment challenges. Learn effective strategies for last-minute submissions, time management, stress reduction, and maintaining quality work under pressure. Don't miss out on enhancing your academic success!",
  html: "📣 Attention Students! Join us on <b>13 January</b> to explore valuable insights on conquering urgent assignment challenges. Learn effective strategies for last-minute submissions, time management, stress reduction, and maintaining quality work under pressure. Don't miss out on enhancing your academic success!",
  published: "Dec 24, 2023 to Dec 28, 2023",
  stamp: "03:20 AM  15 July 2020",
});
const seedList = (course: string, count: number) => Array.from({ length: count }, (_, i) => seedAnnouncement(course, i));
const SEED: Store = { quota: 4, items: { "responsive-design": seedList("responsive-design", 8), "usability-testing": seedList("usability-testing", 8), "python-programming": seedList("python-programming", 3) } };

const STORE_KEY = "thkee.instructorAnnouncements";
const COURSE_PAGE = 3;
const DETAIL_PAGE = 6;
const titleClass = "m-0 font-['Instrument_Sans:Medium'] text-[24px] font-medium leading-[32px] text-[#0f172a]";
const titleStyle = { fontVariationSettings: '"wdth" 100' };
const yellowButton = `flex h-[36px] shrink-0 items-center rounded-[8px] bg-[#ffb20d] px-5 text-[16px] leading-[20px] tracking-[-0.01px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`;

const formatDateTime = (date: Date) => {
  const day = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day}, ${time}`;
};
const pad = (n: number) => String(n).padStart(2, "0");
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const makePreview = (text: string) => (text.length > 60 ? `${text.slice(0, 60).trimEnd()}.......` : text);

function GreenMegaphone() {
  const mask = `url(${imgMegaphone}) center / contain no-repeat`;
  return <span aria-hidden="true" className="mt-0.5 size-[22px] shrink-0 bg-[#059669]" style={{ mask, WebkitMask: mask }} />;
}

function EmptyAnnouncements() {
  return (
    <div className="flex flex-col items-center gap-5 px-6 py-6 text-center">
      <svg viewBox="0 0 64 72" className="h-[64px] w-[56px] text-[#38bdf8]" fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
        <path d="M8 30l24-8 24 8-24 8-24-8zM8 30v28l24 10 24-10V30M32 38v30" />
        <path d="M8 30L2 38l24 8 6-8M56 30l6 8-24 8-6-8" />
        <path d="M32 30l12-4-12-4-12 4 12 4z" fill="currentColor" fillOpacity="0.25" />
        <circle cx="46" cy="9" r="8" />
        <path d="M24 56h.01M38 54h.01M30 60c1-2 3-2 4 0M32 14l-4-4M26 20l-3-3" />
      </svg>
      <p className={`text-[14px] leading-[24px] text-[#475569] ${fontRegular}`}>No Announcement.</p>
    </div>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#f1f5f9] px-6 py-5">
      <h2 className={`text-[16px] leading-[24px] text-[#0f172a] ${fontSemi}`}>{title}</h2>
      <button type="button" onClick={onClose} aria-label="Close" className="flex transition hover:opacity-70">
        <img src={imgClose} alt="" width={20} height={20} className="size-5" />
      </button>
    </div>
  );
}

const fieldLabel = `text-[14px] leading-[20px] text-[#1e293b] ${fontMedium}`;
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
    <div className="flex items-center justify-end gap-8 border-t border-[#f1f5f9] px-6 py-4">
      <button type="button" onClick={onCancel} className={`text-[16px] leading-[24px] text-[#1e293b] transition hover:text-[#64748b] ${fontMedium}`}>
        Cancel
      </button>
      <button type="button" onClick={onPublish} className={`h-[44px] w-[150px] rounded-[8px] bg-[#ffb20d] text-[16px] leading-[20px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
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
    onPublish(courseId, { id: `a-${Date.now()}`, title: title.trim(), preview: makePreview(body.text), text: body.text, html: body.html, published: formatDateTime(scheduled), stamp: formatDateTime(scheduled) });
    notify(sendEmail ? "Announcement published and emailed to students" : "Announcement published");
  };

  return (
    <Shell title="Create Announcement" onClose={onClose} hideHeader width="max-w-[638px]" radius="sm:rounded-[16px]">
      <ModalHeader title="Create Announcement" onClose={onClose} />
      <div className="flex flex-col gap-4 px-6 py-5">
        {fixedCourse ? (
          <p className={`text-[18px] leading-[28px] text-[#1e293b] ${fontSemi}`}>{fixedCourse.title}</p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className={fieldLabel}>Course</p>
            <div className="[&_ul]:w-full">
              <FilterSelect plain label="Course" value={courseId} onChange={setCourseId} options={[{ value: "", label: "Choose a course" }, ...COURSES.map((c) => ({ value: c.id, label: c.title }))]} />
            </div>
          </div>
        )}
        <div className="grid gap-[26px] sm:grid-cols-2">
          <label className="flex h-[40px] cursor-pointer items-center gap-2.5 rounded-[8px] border border-[#cbd5e1] bg-[#f8fafc] px-4">
            <input type="radio" name="announcement-type" checked readOnly className="size-4 accent-[#1e293b]" />
            <span className={`text-[14px] leading-[20px] text-[#1e293b] ${fontMedium}`}>Educational announcement</span>
          </label>
          <label className="flex h-[40px] cursor-not-allowed items-center gap-2.5 rounded-[8px] border border-[#f1f5f9] px-4">
            <input type="radio" name="announcement-type" disabled className="size-4" />
            <span className={`text-[14px] leading-[20px] text-[#64748b] ${fontRegular}`}>Promotional email(Upcoming)</span>
          </label>
        </div>
        <p className={`text-[16px] leading-[24px] text-[#1e293b] ${fontMedium}`}>Announcement Details</p>
        <Checkbox checked={publishNow} onChange={() => setPublishNow(!publishNow)}>
          <span className={`text-[14px] leading-[20px] text-[#334155] ${fontRegular}`}>Publish Now</span>
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
        <p className={`flex items-center gap-2.5 rounded-[8px] bg-[#ecfdf5] px-3 py-3.5 text-[12px] leading-[18px] text-[#059669] ${fontRegular}`}>
          <GreenMegaphone />
          <span>
            This announcement will be published at <span className={fontSemi}>{notice}</span>
          </span>
        </p>
        <AnnouncementFields title={title} setTitle={setTitle} onBody={(text, html) => setBody({ text, html })} />
        <Checkbox checked={sendEmail} onChange={() => setSendEmail(!sendEmail)}>
          <span className={`text-[14px] leading-[20px] text-[#334155] ${fontRegular}`}>Send this as an email to students.</span>
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
    <Shell title="Edit" onClose={onClose} hideHeader width="max-w-[638px]" radius="sm:rounded-[16px]">
      <ModalHeader title="Edit" onClose={onClose} />
      <div className="flex flex-col gap-4 px-6 py-5">
        <p className={`text-[18px] leading-[28px] text-[#1e293b] ${fontSemi}`}>{course.title}</p>
        <p className={`mt-3 text-[16px] leading-[24px] text-[#1e293b] ${fontMedium}`}>Announcement Details</p>
        <AnnouncementFields title={title} setTitle={setTitle} initial={announcement} onBody={(text, html) => setBody({ text, html })} />
      </div>
      <ModalFooter onCancel={onClose} onPublish={publish} />
    </Shell>
  );
}

export function DeleteModal({ announcement, onClose, onConfirm }: { announcement: Announcement; onClose: () => void; onConfirm: () => void }) {
  return (
    <Shell title="Please confirm" onClose={onClose} hideHeader width="max-w-[634px]" radius="sm:rounded-[16px]">
      <ModalHeader title="Please confirm" onClose={onClose} />
      <div className="flex flex-col gap-5 px-6 py-5">
        <p className={`text-[16px] leading-[24px] text-[#334155] ${fontMedium}`}>Are you sure you want to delete this announcement?</p>
        <div className="rounded-[6px] bg-[#fef2f2] px-2 py-3">
          <p className={`whitespace-pre-wrap text-[12px] leading-[18px] text-[#94a3b8] ${fontRegular}`}>{announcement.stamp}</p>
          <p className={`mt-3 text-[14px] leading-[20px] text-[#dc2626] ${fontSemi}`}>{announcement.title}</p>
        </div>
        <p className={`text-[14px] leading-[20px] text-[#64748b] ${fontRegular}`}>N.B.: If you delete this announcement, you can't restore it.</p>
      </div>
      <div className="flex items-center justify-end gap-8 border-t border-[#f1f5f9] px-6 py-4">
        <button type="button" onClick={onClose} className={`text-[16px] leading-[24px] text-[#1e293b] transition hover:text-[#64748b] ${fontMedium}`}>
          Cancel
        </button>
        <button type="button" onClick={onConfirm} className={`h-[44px] rounded-[8px] bg-[#ef4444] px-6 text-[16px] leading-[20px] text-white transition hover:bg-[#dc2626] ${fontMedium}`}>
          Yes, I confirm
        </button>
      </div>
    </Shell>
  );
}

function CourseList({ store, onCreate, onShow }: { store: Store; onCreate: () => void; onShow: (courseId: string, announcementId: string) => void }) {
  const [page, setPage] = useState(1);
  const start = (page - 1) * COURSE_PAGE;
  const shown = COURSES.slice(start, start + COURSE_PAGE);

  return (
    <main className="flex flex-1 flex-col bg-white">
      <div className="flex flex-wrap items-center gap-6 border-b border-[#e2e8f0] px-4 py-6 md:px-7">
        <h1 className={`flex h-[42px] items-center ${titleClass}`} style={titleStyle}>
          Announcements
        </h1>
        <button type="button" onClick={onCreate} className={yellowButton}>
          Create announcement
        </button>
        <p className={`text-[12px] leading-[18px] text-[#475569] ${fontRegular}`}>
          <span className={`text-[#334155] ${fontSemi}`}>
            {store.quota} of {SEED.quota}
          </span>{" "}
          left this month
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-3.5 px-4 py-6 md:px-7">
        {shown.map((course) => {
          const items = (store.items[course.id] ?? []).slice(0, 2);
          return (
            <section key={course.id} className="rounded-[8px] border border-[#e2e8f0]">
              <div className="flex flex-wrap items-center gap-4 border-b border-[#e2e8f0] px-4 py-4">
                <img src={course.image} alt="" className="h-10 w-[50px] shrink-0 rounded-[4px] object-cover" />
                <h2 className={`min-w-0 flex-1 text-[16px] leading-[24px] text-[#0f172a] ${fontSemi}`}>{course.title}</h2>
                <button type="button" onClick={() => openInstructorAnnouncements(course.id)} className={`h-[43px] rounded-[8px] border border-[#ffb20d] px-4 text-[16px] leading-[20px] text-[#1e293b] transition hover:bg-[#fff9f0] ${fontRegular}`}>
                  See All
                </button>
              </div>
              {items.length === 0 ? (
                <EmptyAnnouncements />
              ) : (
                <ul className="divide-y divide-[#f1f5f9]">
                  {items.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center gap-4 px-4 py-4">
                      <GreenMegaphone />
                      <div className="min-w-0 flex-1">
                        <p className={`text-[14px] leading-[24px] text-[#475569] ${fontSemi}`}>{item.title}</p>
                        <p className={`truncate text-[14px] leading-[24px] text-[#64748b] ${fontRegular}`}>{item.preview}</p>
                      </div>
                      <button type="button" onClick={() => onShow(course.id, item.id)} className={`h-[35px] rounded-[6px] bg-[#f1f5f9] px-3 text-[14px] leading-[20px] text-[#1e293b] transition hover:bg-[#e2e8f0] ${fontMedium}`}>
                        Show Announcement
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
      <Pagination page={page} pageCount={Math.ceil(COURSES.length / COURSE_PAGE)} start={start} shown={shown.length} total={COURSES.length} onPage={setPage} />
    </main>
  );
}

function CourseDetail({ course, items, expanded, setExpanded, onCreate, onEdit, onDelete }: { course: AnnouncementCourse; items: Announcement[]; expanded: string | null; setExpanded: (id: string | null) => void; onCreate: () => void; onEdit: (item: Announcement) => void; onDelete: (item: Announcement) => void }) {
  const [tab, setTab] = useState<"educational" | "promotional">("educational");
  const [page, setPage] = useState(() => {
    const index = items.findIndex((i) => i.id === expanded);
    return index < 0 ? 1 : Math.floor(index / DETAIL_PAGE) + 1;
  });
  const list = tab === "educational" ? items : [];
  const pageCount = Math.max(1, Math.ceil(list.length / DETAIL_PAGE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * DETAIL_PAGE;
  const shown = list.slice(start, start + DETAIL_PAGE);

  return (
    <main className="flex flex-1 flex-col bg-[#f1f5f9]">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white px-4 py-3 md:px-7">
        <h1 className={`max-w-[480px] ${titleClass}`} style={titleStyle}>
          {course.title}
        </h1>
        <nav aria-label="Breadcrumb" className={`flex flex-wrap items-center gap-2 text-[12px] leading-[18px] text-[#475569] ${fontRegular}`}>
          <button type="button" onClick={() => openInstructorAnnouncements()} className="text-[#1e293b] transition hover:underline">
            Announcements
          </button>
          <svg viewBox="0 0 24 24" className="size-3 text-[#94a3b8]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
          <span aria-current="page">{course.title}</span>
        </nav>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 pb-6 pt-6 md:px-7">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-4">
          <div role="tablist" aria-label="Announcement type" className="flex">
            {[
              { key: "educational", label: "Educational announcements" },
              { key: "promotional", label: "Promotional emails" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => {
                  setTab(t.key as "educational" | "promotional");
                  setPage(1);
                }}
                className={`border-b-2 px-6 pb-4 pt-1 text-[14px] leading-[24px] transition ${tab === t.key ? "border-[#ffb20d] text-[#334155]" : "border-transparent text-[#64748b] hover:text-[#334155]"} ${fontSemi}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={onCreate} className={yellowButton}>
            Create announcement
          </button>
        </div>
        {shown.length === 0 && (
          <div className="rounded-[8px] bg-white">
            <EmptyAnnouncements />
          </div>
        )}
        {shown.map((item) => {
          const open = expanded === item.id;
          return (
            <article key={item.id} className={`rounded-[8px] border bg-white px-6 py-[18px] ${open ? "border-[#1e293b]" : "border-white"}`}>
              <div className="flex items-start gap-4">
                <GreenMegaphone />
                <button type="button" aria-expanded={open} onClick={() => setExpanded(open ? null : item.id)} className="min-w-0 flex-1 text-left">
                  <span className={`block text-[14px] leading-[24px] text-[#1e293b] ${open ? fontSemi : fontMedium}`}>{item.title}</span>
                  {!open && <span className={`block truncate text-[14px] leading-[28px] text-[#64748b] ${fontRegular}`}>{item.preview}</span>}
                </button>
                <ActionMenu
                  label={`More actions for ${item.title}`}
                  triggerClass="flex size-[31px] items-center justify-center rounded-[6px] bg-[#f1f5f9] text-[#1e293b] transition hover:bg-[#e2e8f0]"
                  trigger={
                    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                      <circle cx="5" cy="12" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="19" cy="12" r="2" />
                    </svg>
                  }
                  items={[
                    { label: "Edit", icon: <img src={imgPencil} alt="" width={14} height={14} className="size-3.5" />, onClick: () => onEdit(item) },
                    {
                      label: "Delete",
                      danger: true,
                      icon: (
                        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" />
                        </svg>
                      ),
                      onClick: () => onDelete(item),
                    },
                  ]}
                />
                <button type="button" aria-label={open ? "Collapse announcement" : "Expand announcement"} onClick={() => setExpanded(open ? null : item.id)} className={`flex size-[31px] items-center justify-center transition ${open ? "text-[#1e293b]" : "text-[#94a3b8]"}`}>
                  <svg viewBox="0 0 24 24" className={`size-5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
              {open && (
                <div className="mt-3 md:pl-[38px] md:pr-[150px]">
                  <NoteBody note={{ text: item.text, html: item.html }} tone="text-[#64748b]" className="!leading-[28px]" />
                  <p className={`mt-5 flex items-center gap-3 text-[12px] leading-[18px] text-[#1e293b] ${fontRegular}`}>
                    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-[#94a3b8]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="5" width="18" height="16" rx="2" />
                      <path d="M3 10h18M8 3v4M16 3v4" />
                    </svg>
                    <span className="italic [font-synthesis:style]">Published Time: {item.published}</span>
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <Pagination page={current} pageCount={pageCount} start={start} shown={shown.length} total={list.length} onPage={setPage} />
    </main>
  );
}

export default function InstructorAnnouncements({ courseId }: { courseId?: string }) {
  const { notify } = useApp();
  const [store, setStore] = useState<Store>(() => load(STORE_KEY, SEED));
  const [expanded, setExpanded] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);

  useEffect(() => save(STORE_KEY, store), [store]);

  const course = COURSES.find((c) => c.id === courseId);
  const items = course ? store.items[course.id] ?? [] : [];
  const setItems = (id: string, next: (list: Announcement[]) => Announcement[]) => setStore((s) => ({ ...s, items: { ...s.items, [id]: next(s.items[id] ?? []) } }));
  const startCreate = () => {
    if (store.quota <= 0) return notify("You have used all your announcements for this month");
    setCreating(true);
  };

  return (
    <>
      {course ? (
        <CourseDetail key={course.id} course={course} items={items} expanded={expanded} setExpanded={setExpanded} onCreate={startCreate} onEdit={setEditing} onDelete={setDeleting} />
      ) : (
        <CourseList
          store={store}
          onCreate={startCreate}
          onShow={(id, announcementId) => {
            setExpanded(announcementId);
            openInstructorAnnouncements(id);
          }}
        />
      )}
      {creating && (
        <CreateModal
          fixedCourse={course}
          onClose={() => setCreating(false)}
          onPublish={(id, announcement) => {
            setStore((s) => ({ quota: s.quota - 1, items: { ...s.items, [id]: [announcement, ...(s.items[id] ?? [])] } }));
            setExpanded(announcement.id);
            setCreating(false);
          }}
        />
      )}
      {editing && course && (
        <EditModal
          course={course}
          announcement={editing}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            setItems(course.id, (list) => list.map((i) => (i.id === next.id ? next : i)));
            setEditing(null);
          }}
        />
      )}
      {deleting && course && (
        <DeleteModal
          announcement={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            setItems(course.id, (list) => list.filter((i) => i.id !== deleting.id));
            setDeleting(null);
            notify("Announcement deleted");
          }}
        />
      )}
    </>
  );
}
