import { useEffect, useRef, useState, type ReactNode } from "react";
import { fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, openCreateSession, openInstructorSessions, openLiveEditor, openMessages, save, useApp } from "../store";
import { loadLiveDrafts } from "./InstructorLiveCreate";
import { CreateModal, DeleteModal, EditModal, type Announcement } from "./InstructorAnnouncements";
import { Checkbox } from "./InstructorAssignments";
import { ActionMenu, FilterSelect } from "./Menus";
import { Shell } from "./Overlays";

const imgClose = "/assets/53e9a.svg";
const imgPlusSmall = "/assets/51771.svg";
const imgMegaphone = "/assets/48fdd.svg";

type SessionStatus = "Completed" | "In progress" | "Upcoming";
type Session = { id: string; name: string; date: string; time: string; status: SessionStatus };
type Series = { id: string; name: string; sessions: Session[] };
type Material = { id: string; name: string; size: string };
type SessionAnnouncement = Announcement & { posted: string; pinned?: boolean };
type Store = { series: Series[]; materials: Material[]; announcements: SessionAnnouncement[] };

const TITLE = "UX Battle MS: Compete to Design the Best User Experience";
const TIME = "2:00 PM – 3:00 PM";
const SESSION_DATES = ["Mon, 01 Jun", "Tue, 02 Jun", "Wed, 03 Jun", "Thu, 04 Jun", "Fri, 05 Jun", "Sat, 06 Jun", "Sun, 07 Jun"];
const SERIES_STATUS: SessionStatus[] = ["Completed", "Completed", "Completed", "In progress", "Upcoming", "Upcoming", "Upcoming"];

const seedSeries = (letter: string, finished: boolean): Series => ({
  id: `series-${letter.toLowerCase()}`,
  name: `Series ${letter}`,
  sessions: SESSION_DATES.map((date, i) => ({ id: `session-${i + 1}`, name: `Session ${String(i + 1).padStart(2, "0")}`, date, time: TIME, status: finished ? SERIES_STATUS[i] : "Upcoming" })),
});
const makeAnnouncement = (id: string, title: string, preview: string, posted: string, pinned = false): SessionAnnouncement => ({ id, title, preview, text: preview, published: posted, stamp: posted, posted, pinned });
const SEED: Store = {
  series: [seedSeries("A", true), seedSeries("B", true), seedSeries("C", false), seedSeries("D", false), seedSeries("E", false)],
  materials: [
    { id: "m1", name: "Django_Architecture_Guide.pdf", size: "16 KB" },
    { id: "m2", name: "Django_Best_Practices.pdf", size: "16 KB" },
    { id: "m3", name: "Django_Development_Standards.pdf", size: "16 KB" },
  ],
  announcements: [
    makeAnnouncement("n1", "Attention: The final project deadline has been moved to January 15th.", "Attention Students: The exam originally scheduled for March 15th has been postponed to March 22nd.", "Jan 05, 2021", true),
    makeAnnouncement("n2", "New resources for the course have just been uploaded. Check them out!", "Hi Students: The exam date has been rescheduled from June 20th to June 27th due to unforeseen circumstances.", "Jun 30, 2021"),
    makeAnnouncement("n3", "Notice: The upcoming webinar on advanced topics will now take place on January 20th.", "Hello Students: We want to inform you that the exam date has been moved from April 10th to April 17th.", "May 5, 2022"),
    makeAnnouncement("n4", "Update: The live Q&A session will now be held on January 18th.", "Dear Students: Please be informed that the exam date has been altered from July 15th to July 22nd.", "Apr 12, 2023"),
    makeAnnouncement("n5", "Reminder: The group discussion session has been rescheduled for January 25th.", "Dear Students: Please be advised that the exam date has changed from May 5th to May 12th.", "Jul 15, 2020"),
    makeAnnouncement("n6", "Heads up: The assignment submission date has changed to January 22nd.", "Attention Students: The exam date has been shifted from August 10th to August 17th because of a scheduling conflict.", "Sep 10, 2018"),
    makeAnnouncement("n7", "Important: The tutorial on project management tools is now set for January 28th.", "Hello Students: We regret to inform you that the exam date has been changed from September 5th to September 12th.", "Aug 22, 2019"),
  ],
};
const COURSE = { id: "ux-battle", title: TITLE, image: "/assets/be57c.png" };
export type LiveCourse = { id: string; title: string; kind: "single" | "multi"; status?: "published" | "draft"; sessions: string; image: string; state?: "completed" | "upcoming"; durationText?: string; editorOnly?: boolean };
export const LIVE_COURSES: LiveCourse[] = [
  { id: "ui-ux-trends", title: "UI/UX MS Design Trends for the Ultimate Beginner", kind: "multi", status: "published", sessions: "2 group sessions", image: "/assets/courses/ui-ux-figma.jpg" },
  { id: "empathy-design", title: "SS Empathy-Driven Design: Building User-Centred Interfaces", kind: "single", status: "published", sessions: "20 individual sessions", image: "/assets/courses/react-web-apps-v2.jpg", state: "completed" },
  { id: "ux-battle", title: TITLE, kind: "multi", status: "draft", sessions: "2 group sessions", image: "/assets/courses/python-programming.jpg" },
  { id: "figma-auto-layout", title: "Figma tutorial SS: Auto layout review card iterations", kind: "single", sessions: "20 individual sessions", image: "/assets/courses/ai-foundations-sara.jpg", state: "upcoming" },
];
const STORE_KEY = "thkee.instructorSessions";
const EXTRAS_KEY = "thkee.instructorSessions.extras";

const headingClass = `text-[24px] leading-[32px] text-[#0f172a] ${fontHeading}`;
const sectionTitle = `text-[18px] leading-[28px] text-[#1e293b] ${fontSemi}`;
const iconButton = "flex size-8 shrink-0 items-center justify-center rounded-[6px] text-[#475569] transition hover:bg-[#f1f5f9]";

function Icon({ path, className = "size-5" }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
const LIST = "M9 7h8M9 12h8M9 17h8M6 7h.01M6 12h.01M6 17h.01M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z";
const PENCIL = "M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19l-4 1z";
const EYE = "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7zM12 15a3 3 0 100-6 3 3 0 000 6z";
const SCREEN = "M13 4H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-3M12 17v4M8 21h8M16 3h5v5h-5z";
const FILE = "M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V7l-5-5zM14 2v5h5M9 13h6M9 17h4";
const TRASH = "M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6";
const PIN = "M15 3l6 6-3 1-4 4 1 4-2 2-4-5-5 5-1-1 5-5-5-4 2-2 4 1 4-4 1-3z";
const Dots = (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="12" cy="19" r="1.7" />
  </svg>
);

function NameDialog({ title, label, initial, onClose, onSave }: { title: string; label: string; initial: string; onClose: () => void; onSave: (name: string) => void }) {
  const { notify } = useApp();
  const [name, setName] = useState(initial);
  const submit = () => (name.trim() ? onSave(name.trim()) : notify(`Add a ${label.toLowerCase()} first`));
  return (
    <Shell title={title} onClose={onClose} hideHeader width="max-w-[480px]" radius="sm:rounded-[12px]">
      <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-5">
        <h2 className={`text-[18px] leading-[28px] text-[#1e293b] ${fontSemi}`}>{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="flex transition hover:opacity-70">
          <img src={imgClose} alt="" width={20} height={20} className="size-5" />
        </button>
      </div>
      <form
        className="flex flex-col gap-2 px-6 py-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="session-name" className={`text-[14px] leading-[20px] text-[#0f172a] ${fontMedium}`}>
          {label}
        </label>
        <input id="session-name" value={name} onChange={(e) => setName(e.target.value)} className="field" />
      </form>
      <div className="flex items-center justify-end gap-8 border-t border-[#e2e8f0] px-6 py-4">
        <button type="button" onClick={onClose} className={`text-[16px] leading-[24px] text-[#1e293b] transition hover:text-[#64748b] ${fontMedium}`}>
          Cancel
        </button>
        <button type="button" onClick={submit} className={`h-[44px] rounded-[8px] bg-[#ffb20d] px-5 text-[16px] leading-[20px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
          Save
        </button>
      </div>
    </Shell>
  );
}

export function ConfirmDialog({ title, body, confirmLabel, onClose, onConfirm }: { title: string; body: string; confirmLabel: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <Shell title={title} onClose={onClose} hideHeader width="max-w-[480px]" radius="sm:rounded-[12px]">
      <div className="flex flex-col gap-2 px-6 py-6">
        <h2 className={`text-[18px] leading-[28px] text-[#1e293b] ${fontSemi}`}>{title}</h2>
        <p className={`text-[14px] leading-[24px] text-[#64748b] ${fontRegular}`}>{body}</p>
      </div>
      <div className="flex items-center justify-end gap-8 border-t border-[#e2e8f0] px-6 py-4">
        <button type="button" onClick={onClose} className={`text-[16px] leading-[24px] text-[#1e293b] transition hover:text-[#64748b] ${fontMedium}`}>
          Cancel
        </button>
        <button type="button" onClick={onConfirm} className={`h-[44px] rounded-[8px] bg-[#ef4444] px-5 text-[16px] leading-[20px] text-white transition hover:bg-[#dc2626] ${fontMedium}`}>
          {confirmLabel}
        </button>
      </div>
    </Shell>
  );
}

export function MultiSessionBadge() {
  return (
    <span className={`inline-flex h-[22px] items-center gap-1.5 rounded-full bg-[#fff0d7] px-2 text-[12px] leading-[18px] text-[#9a3412] ${fontMedium}`}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-[#f97316]" />
      Multi Session
    </span>
  );
}
const Separator = () => (
  <span aria-hidden="true" className="size-1 rounded-full bg-[#cbd5e1]" />
);

function StatusLabel({ status }: { status: SessionStatus }) {
  if (status === "In progress") {
    return (
      <span className={`inline-flex items-center gap-2 text-[12px] italic leading-[18px] text-[#ef4444] [font-synthesis:style] ${fontMedium}`}>
        <span aria-hidden="true" className="flex size-[18px] items-center justify-center rounded-full bg-[#fee2e2]">
          <span className="size-2 rounded-full bg-[#ef4444] motion-safe:animate-pulse" />
        </span>
        In progress
      </span>
    );
  }
  const completed = status === "Completed";
  return (
    <span className={`inline-flex h-[22px] items-center gap-1.5 rounded-full px-2 text-[12px] leading-[18px] ${completed ? "bg-[#f1f5f9] text-[#475569]" : "bg-[#ecfdf5] text-[#059669]"} ${fontMedium}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${completed ? "bg-[#64748b]" : "bg-[#10b981]"}`} />
      {status}
    </span>
  );
}

function OverviewTab({ store, setSeries, courseId }: { store: Store; setSeries: (next: Series[]) => void; courseId: string }) {
  const { notify } = useApp();
  const [activeId, setActiveId] = useState(store.series[0]?.id);
  const [renaming, setRenaming] = useState<Series | null>(null);
  const active = store.series.find((s) => s.id === activeId) ?? store.series[0];

  const copyLink = (series: Series, session: Session) => {
    const url = `${window.location.origin}${window.location.pathname}#/instructor/sessions/${series.id}/${session.id}/${courseId}`;
    navigator.clipboard?.writeText(url).then(
      () => notify("Session link copied"),
      () => notify("Couldn't copy the link"),
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:flex-row">
      <ul className="flex shrink-0 gap-2 overflow-x-auto lg:w-[197px] lg:flex-col">
        {store.series.map((s) => {
          const selected = s.id === active.id;
          return (
            <li key={s.id} className={`group relative shrink-0 rounded-[8px] transition lg:w-full ${selected ? "bg-[#f1f5f9]" : "hover:bg-[#f8fafc]"}`}>
              <button type="button" aria-current={selected ? "true" : undefined} onClick={() => setActiveId(s.id)} className="flex w-full flex-col gap-3 py-3 pl-3 pr-10 text-left">
                <span className={`flex items-center gap-3 text-[14px] leading-[20px] text-[#1e293b] ${fontSemi}`}>
                  <Icon path={LIST} className="size-4 shrink-0 text-[#64748b]" />
                  {s.name}
                </span>
                <span className={`text-[12px] leading-[18px] text-[#475569] ${fontRegular}`}>{s.sessions.length} Class</span>
              </button>
              <button type="button" aria-label={`Rename ${s.name}`} onClick={() => setRenaming(s)} className="absolute right-3 top-3 flex text-[#94a3b8] opacity-0 transition hover:text-[#475569] focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
                <Icon path={PENCIL} className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>
      <section className="min-w-0 flex-1 rounded-[12px] bg-[#f1f5f9] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Icon path={LIST} className="size-4 text-[#64748b]" />
              <h2 className={`text-[18px] leading-[28px] text-[#1e293b] ${fontSemi}`}>{active.name}</h2>
              <span className={`rounded-full bg-[#e2e8f0] px-2 py-0.5 text-[12px] leading-[18px] text-[#475569] ${fontMedium}`}>DRAFT</span>
            </div>
            <p className={`mt-1 text-[14px] leading-[20px] text-[#475569] ${fontRegular}`}>{active.sessions.length} session available</p>
          </div>
          <div className="flex items-center gap-4">
            <p className={`text-[14px] leading-[20px] text-[#94a3b8] ${fontRegular}`}>
              Timezone: <span className={`ml-1 text-[#1e293b] ${fontMedium}`}>( GMT +6:00) Astana,Dhaka</span>
            </p>
            <ActionMenu label={`More actions for ${active.name}`} trigger={Dots} triggerClass={iconButton} items={[{ label: "Rename series", onClick: () => setRenaming(active) }]} />
          </div>
        </div>
        <div className="mt-6 overflow-x-auto rounded-[8px] bg-white">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead>
              <tr className={`text-[12px] leading-[18px] text-[#475569] ${fontMedium}`}>
                <th scope="col" className="px-6 py-3 font-medium">
                  Name
                </th>
                <th scope="col" className="px-3 py-3 text-center font-medium">
                  Schedule
                </th>
                <th scope="col" className="px-3 py-3 text-center font-medium">
                  Status
                </th>
                <th scope="col" className="px-3 py-3 text-center font-medium">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {active.sessions.map((session) => (
                <tr key={session.id} className="border-t border-[#f1f5f9]">
                  <td className="px-5 py-3">
                    <span className={`flex items-center gap-2.5 whitespace-nowrap text-[14px] leading-[20px] text-[#1e293b] ${fontRegular}`}>
                      <Icon path={SCREEN} className="size-[18px] shrink-0 text-[#64748b]" />
                      {session.name}
                    </span>
                  </td>
                  <td className={`whitespace-nowrap px-3 py-3 text-center text-[14px] leading-[20px] text-[#94a3b8] ${fontRegular}`}>
                    {session.date} • {session.time}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <StatusLabel status={session.status} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-3">
                      <button type="button" aria-label={`View ${session.name}`} onClick={() => openInstructorSessions(active.id, session.id, courseId)} className={iconButton}>
                        <Icon path={EYE} />
                      </button>
                      <ActionMenu
                        label={`More actions for ${session.name}`}
                        trigger={Dots}
                        triggerClass={iconButton}
                        items={[
                          { label: "View details", onClick: () => openInstructorSessions(active.id, session.id, courseId) },
                          { label: "Copy link", onClick: () => copyLink(active, session) },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {renaming && (
        <NameDialog
          title="Rename series"
          label="Series name"
          initial={renaming.name}
          onClose={() => setRenaming(null)}
          onSave={(name) => {
            setSeries(store.series.map((s) => (s.id === renaming.id ? { ...s, name } : s)));
            setRenaming(null);
          }}
        />
      )}
    </div>
  );
}

function StudyMaterialsTab({ materials, setMaterials }: { materials: Material[]; setMaterials: (next: Material[]) => void }) {
  const { notify } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [renaming, setRenaming] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState<Material | null>(null);

  const addFile = (file?: File) => {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setMaterials([...materials, { id: `m-${Date.now()}`, name: file.name, size: `${Math.max(1, Math.round(file.size / 1024))} KB` }]);
    notify("Study material added");
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className={sectionTitle}>Study Materials</h2>
          <p className={`mt-1 text-[14px] leading-[20px] text-[#64748b] ${fontRegular}`}>Related study materials add in here.</p>
        </div>
        <button type="button" onClick={() => fileRef.current?.click()} className={`flex h-[36px] items-center gap-2 rounded-[8px] bg-[#ffb20d] px-3 text-[14px] leading-[20px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
          <img src={imgPlusSmall} alt="" width={18} height={18} className="size-[18px]" />
          Add new
        </button>
        <input ref={fileRef} type="file" hidden aria-label="Add study material" onChange={(e) => addFile(e.target.files?.[0])} />
      </div>
      {materials.length === 0 ? (
        <p className={`mt-6 rounded-[8px] border border-[#e2e8f0] px-6 py-12 text-center text-[14px] text-[#64748b] ${fontRegular}`}>No study materials yet.</p>
      ) : (
        <ul className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {materials.map((m) => (
            <li key={m.id} className="flex items-center gap-4 rounded-[8px] border border-[#e2e8f0] p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#f8fafc] text-[#475569]">
                <Icon path={FILE} className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p title={m.name} className={`truncate text-[14px] leading-[20px] text-[#334155] ${fontRegular}`}>
                  {m.name}
                </p>
                <p className={`mt-0.5 text-[14px] leading-[20px] text-[#94a3b8] ${fontRegular}`}>{m.size}</p>
              </div>
              <ActionMenu
                label={`More actions for ${m.name}`}
                trigger={Dots}
                triggerClass={iconButton}
                items={[
                  { label: "Rename", onClick: () => setRenaming(m) },
                  { label: "Delete", danger: true, onClick: () => setDeleting(m) },
                ]}
              />
            </li>
          ))}
        </ul>
      )}
      {renaming && (
        <NameDialog
          title="Rename file"
          label="File name"
          initial={renaming.name}
          onClose={() => setRenaming(null)}
          onSave={(name) => {
            setMaterials(materials.map((m) => (m.id === renaming.id ? { ...m, name } : m)));
            setRenaming(null);
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete this file?"
          body={`"${deleting.name}" will be removed from this session. You can't restore it.`}
          confirmLabel="Yes, delete"
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            setMaterials(materials.filter((m) => m.id !== deleting.id));
            setDeleting(null);
            notify("Study material deleted");
          }}
        />
      )}
    </div>
  );
}

function AnnouncementsTab({ items, setItems, courseTitle }: { items: SessionAnnouncement[]; setItems: (next: SessionAnnouncement[]) => void; courseTitle: string }) {
  const { notify } = useApp();
  const course = { ...COURSE, title: courseTitle };
  const [selected, setSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SessionAnnouncement | null>(null);
  const [deleting, setDeleting] = useState<SessionAnnouncement | null>(null);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const sorted = [...items].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
  const allSelected = items.length > 0 && selected.length === items.length;
  const mask = `url(${imgMegaphone}) center / contain no-repeat`;

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className={sectionTitle}>Announcement</h2>
          <p className={`mt-1 text-[14px] leading-[20px] text-[#64748b] ${fontRegular}`}>All the announcement show in here</p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <button type="button" disabled={selected.length === 0} onClick={() => setDeletingSelected(true)} className={`flex h-[36px] items-center gap-2 rounded-[8px] bg-[#f8fafc] px-3 text-[14px] leading-[20px] text-[#dc2626] transition hover:bg-[#fef2f2] disabled:cursor-not-allowed disabled:text-[#94a3b8] disabled:hover:bg-[#f8fafc] ${fontMedium}`}>
            <Icon path={TRASH} className="size-[18px]" />
            {allSelected || selected.length === 0 ? "Delete all" : `Delete ${selected.length} selected`}
          </button>
          <button type="button" onClick={() => setCreating(true)} className={`flex h-[36px] items-center gap-2 rounded-[8px] bg-[#ffb20d] px-3 text-[14px] leading-[20px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
            <img src={imgPlusSmall} alt="" width={18} height={18} className="size-[18px]" />
            Create Announcement
          </button>
        </div>
      </div>
      <div className="mt-6 overflow-x-auto rounded-[12px] border border-[#e2e8f0]">
        <div className="min-w-[820px]">
          <div className={`grid grid-cols-[64px_minmax(0,1fr)_170px_170px] items-center py-3 text-[12px] leading-[18px] text-[#475569] ${fontMedium}`}>
            <span className="flex justify-center">
              <Checkbox checked={allSelected} onChange={() => setSelected(allSelected ? [] : items.map((i) => i.id))}>
                <span className="sr-only">Select all announcements</span>
              </Checkbox>
            </span>
            <span>Announcements</span>
            <span className="text-center">Posted Date</span>
            <span className="text-center">Action</span>
          </div>
          {sorted.length === 0 && <p className={`border-t border-[#f1f5f9] px-6 py-12 text-center text-[14px] text-[#64748b] ${fontRegular}`}>No announcements yet.</p>}
          {sorted.map((item) => (
            <div key={item.id} className="grid grid-cols-[64px_minmax(0,1fr)_170px_170px] items-center border-t border-[#f1f5f9] py-4">
              <span className="flex justify-center">
                <Checkbox checked={selected.includes(item.id)} onChange={() => setSelected((list) => (list.includes(item.id) ? list.filter((id) => id !== item.id) : [...list, item.id]))}>
                  <span className="sr-only">Select {item.title}</span>
                </Checkbox>
              </span>
              <div className="flex min-w-0 items-center gap-8">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f8fafc]">
                  <span aria-hidden="true" className="size-[18px] bg-[#475569]" style={{ mask, WebkitMask: mask }} />
                </span>
                <div className="min-w-0">
                  <p className={`truncate text-[14px] leading-[24px] text-[#334155] ${fontMedium}`}>{item.title}</p>
                  <p className={`truncate text-[12px] leading-[20px] text-[#64748b] ${fontRegular}`}>{item.preview}</p>
                </div>
              </div>
              <p className={`text-center text-[14px] leading-[20px] text-[#475569] ${fontRegular}`}>{item.posted}</p>
              <div className="flex items-center justify-center gap-2">
                <button type="button" aria-label={`Edit ${item.title}`} onClick={() => setEditing(item)} className={iconButton}>
                  <Icon path={PENCIL} className="size-[18px]" />
                </button>
                <button type="button" aria-label={`Delete ${item.title}`} onClick={() => setDeleting(item)} className={iconButton}>
                  <Icon path={TRASH} className="size-[18px]" />
                </button>
                <button type="button" aria-label={item.pinned ? `Unpin ${item.title}` : `Pin ${item.title}`} aria-pressed={Boolean(item.pinned)} onClick={() => setItems(items.map((i) => (i.id === item.id ? { ...i, pinned: !i.pinned } : i)))} className={iconButton}>
                  <svg viewBox="0 0 24 24" className="size-[18px]" fill={item.pinned ? "#334155" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={PIN} />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {creating && (
        <CreateModal
          fixedCourse={course}
          onClose={() => setCreating(false)}
          onPublish={(_, announcement) => {
            const posted = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
            setItems([{ ...announcement, posted }, ...items]);
            setCreating(false);
          }}
        />
      )}
      {editing && (
        <EditModal
          course={course}
          announcement={editing}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            setItems(items.map((i) => (i.id === next.id ? { ...i, ...next } : i)));
            setEditing(null);
          }}
        />
      )}
      {deleting && (
        <DeleteModal
          announcement={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            setItems(items.filter((i) => i.id !== deleting.id));
            setSelected((list) => list.filter((id) => id !== deleting.id));
            setDeleting(null);
            notify("Announcement deleted");
          }}
        />
      )}
      {deletingSelected && (
        <ConfirmDialog
          title={`Delete ${selected.length} ${selected.length === 1 ? "announcement" : "announcements"}?`}
          body="The selected announcements will be removed. You can't restore them."
          confirmLabel="Yes, delete"
          onClose={() => setDeletingSelected(false)}
          onConfirm={() => {
            setItems(items.filter((i) => !selected.includes(i.id)));
            setSelected([]);
            setDeletingSelected(false);
            notify("Announcements deleted");
          }}
        />
      )}
    </div>
  );
}

const PARTICIPANTS: { name: string; instructor?: boolean; color: string; lastActive: string }[] = [
  { name: "Abdullah Al Noman", instructor: true, color: "#1e293b", lastActive: "Jan 05, 2021" },
  { name: "Wade Warren", color: "#0891b2", lastActive: "Jun 30, 2021" },
  { name: "Leslie Alexander", color: "#db2777", lastActive: "May 5, 2022" },
  { name: "Devon Lane", color: "#7c3aed", lastActive: "Apr 12, 2023" },
  { name: "Ralph Edwards", color: "#16a34a", lastActive: "Jul 15, 2020" },
  { name: "Jerome Bell", color: "#ea580c", lastActive: "Sep 10, 2018" },
  { name: "Theresa Webb", color: "#b91c1c", lastActive: "Aug 22, 2019" },
  { name: "Kathryn Murphy", color: "#475569", lastActive: "Oct 25, 2017" },
  { name: "Esther Howard", color: "#0369a1", lastActive: "Dec 18, 2015" },
  { name: "Arlene McCoy", color: "#a16207", lastActive: "Jan 29, 2014" },
  { name: "Jacob Jones", color: "#7a9cc6", lastActive: "Feb 14, 2013" },
  { name: "Courtney Henry", color: "#0f766e", lastActive: "Nov 3, 2016" },
];

function ParticipantsTab() {
  const { notify } = useApp();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const term = query.trim().toLowerCase();
  const visible = PARTICIPANTS.filter((p) => p.name.toLowerCase().includes(term));
  const names = visible.map((p) => p.name);
  const allVisibleSelected = names.length > 0 && names.every((name) => selected.includes(name));
  const toggleVisible = () => setSelected((list) => (allVisibleSelected ? list.filter((name) => !names.includes(name)) : [...new Set([...list, ...names])]));

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="field-box w-full max-w-[378px]">
          <Icon path="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3" className="size-[18px] shrink-0 text-[#64748b]" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" aria-label="Search participants" className={`min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-[#1e293b] outline-none placeholder:text-slate-400 ${fontRegular}`} />
        </label>
        <div className="flex flex-wrap items-center gap-5">
          {selected.length > 0 && (
            <p aria-live="polite" className={`text-[14px] leading-[20px] text-[#334155] ${fontRegular}`}>
              {selected.length} {selected.length === 1 ? "user" : "users"} selected
            </p>
          )}
          <button type="button" disabled={selected.length === 0} onClick={() => notify("Bulk messaging is coming soon")} className={`flex h-9 items-center gap-2 rounded-[8px] bg-[#ffb20d] px-3 text-[14px] leading-[20px] text-[#1e293b] transition hover:bg-[#faa104] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#ffb20d] ${fontMedium}`}>
            <Icon path="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z" className="size-[18px]" />
            Send bulk Message
          </button>
        </div>
      </div>
      <div className="mt-6 overflow-x-auto rounded-[12px] border border-[#e2e8f0]">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className={`text-[12px] leading-[18px] text-[#475569] ${fontMedium}`}>
              <th scope="col" className="w-[64px] py-3 pl-6">
                <Checkbox checked={allVisibleSelected} onChange={toggleVisible}>
                  <span className="sr-only">Select all participants shown</span>
                </Checkbox>
              </th>
              <th scope="col" className="py-3 font-medium">
                Name
              </th>
              <th scope="col" className="py-3 text-center font-medium">
                Role
              </th>
              <th scope="col" className="py-3 text-center font-medium">
                Last Active Date
              </th>
              <th scope="col" className="py-3 text-center font-medium">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((person) => (
              <tr key={person.name} className="border-t border-[#f1f5f9]">
                <td className="py-3 pl-6">
                  <Checkbox checked={selected.includes(person.name)} onChange={() => setSelected((list) => (list.includes(person.name) ? list.filter((name) => name !== person.name) : [...list, person.name]))}>
                    <span className="sr-only">Select {person.name}</span>
                  </Checkbox>
                </td>
                <td className="py-3">
                  <span className={`flex items-center gap-4 text-[14px] leading-[20px] text-[#1e293b] ${fontSemi}`}>
                    <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] text-white" style={{ backgroundColor: person.color }}>
                      {person.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    {person.name}
                  </span>
                </td>
                <td className={`py-3 text-center text-[14px] leading-[20px] text-[#64748b] ${fontRegular}`}>{person.instructor ? <span className={`inline-flex h-[26px] items-center rounded-[8px] bg-[#1e293b] px-3 text-[12px] leading-[18px] text-white ${fontMedium}`}>Instructor</span> : "Student"}</td>
                <td className={`whitespace-nowrap py-3 text-center text-[14px] leading-[20px] text-[#475569] ${fontRegular}`}>{person.lastActive}</td>
                <td className="py-3">
                  <div className="flex justify-center">
                    <button type="button" aria-label={`Send a message to ${person.name}`} onClick={openMessages} className={`flex items-center gap-2 text-[14px] leading-[20px] text-[#faa104] transition hover:text-[#c98003] ${fontRegular}`}>
                      <Icon path="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM3 7l9 6 9-6" className="size-[18px]" />
                      Send Message
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr className="border-t border-[#f1f5f9]">
                <td colSpan={5} className={`px-6 py-12 text-center text-[14px] text-[#64748b] ${fontRegular}`}>
                  No participants match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabPlaceholder({ label }: { label: string }) {
  return <p className={`px-6 py-16 text-center text-[14px] leading-[24px] text-[#64748b] ${fontRegular}`}>{label} is coming soon.</p>;
}

function Crumb({ onClick, current, children }: { onClick?: () => void; current?: boolean; children: ReactNode }) {
  if (current) return <span className="text-[#334155]">{children}</span>;
  return (
    <button type="button" onClick={onClick} className="transition hover:text-[#1e293b] hover:underline">
      {children}
    </button>
  );
}
const CrumbArrow = () => <Icon path="M9 6l6 6-6 6" className="size-3 text-[#64748b]" />;

const MULTI_TABS = ["Overview", "Study Materials", "Participants", "Announcements", "Messages"];

function MultiSessionPage({ store, setStore, course }: { store: Store; setStore: (next: Store) => void; course: LiveCourse }) {
  const [tab, setTab] = useState("Overview");
  return (
    <main className="flex flex-1 flex-col bg-white">
      <div className="border-b border-[#e2e8f0] px-4 py-6 md:px-7">
        <nav aria-label="Breadcrumb" className={`flex flex-wrap items-center gap-2 text-[12px] leading-[18px] ${fontRegular}`}>
          <span className="text-[#1e293b]">
            <Crumb onClick={() => openInstructorSessions()}>Session List</Crumb>
          </span>
          <CrumbArrow />
          <span className="max-w-[320px] truncate text-[#64748b]">{course.title}</span>
        </nav>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <h1 className={`m-0 ${headingClass}`}>{course.title}</h1>
          <button type="button" onClick={() => openLiveEditor(course.id)} className={`h-[36px] shrink-0 rounded-[8px] border border-[#1e293b] px-3 text-[14px] leading-[20px] text-[#1e293b] transition hover:bg-[#f8fafc] ${fontMedium}`}>
            Edit Session
          </button>
        </div>
        <div className={`mt-2 flex flex-wrap items-center gap-3 text-[12px] leading-[18px] text-[#64748b] ${fontRegular}`}>
          <MultiSessionBadge />
          <Separator />
          <span className="flex items-center gap-1.5">
            <Icon path="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" className="size-4 text-[#94a3b8]" />
            {store.series.length} Series
          </span>
          <Separator />
          154 Participants
          {course.status === "draft" && <span className={`rounded-full bg-[#1e293b] px-2 py-0.5 text-white ${fontMedium}`}>Draft</span>}
        </div>
      </div>
      <div className="px-4 py-6 md:px-7">
        <div className="rounded-[12px] border border-[#e2e8f0]">
          <div role="tablist" aria-label="Multi session sections" className="flex overflow-x-auto border-b border-[#e2e8f0] px-3 pt-2">
            {MULTI_TABS.map((t) => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`shrink-0 border-b-2 px-6 py-3 text-[14px] leading-[24px] transition ${tab === t ? `border-[#ffb20d] text-[#1e293b] ${fontSemi}` : `border-transparent text-[#64748b] hover:text-[#1e293b] ${fontRegular}`}`}>
                {t}
              </button>
            ))}
          </div>
          {tab === "Overview" && <OverviewTab store={store} courseId={course.id} setSeries={(series) => setStore({ ...store, series })} />}
          {tab === "Study Materials" && <StudyMaterialsTab materials={store.materials} setMaterials={(materials) => setStore({ ...store, materials })} />}
          {tab === "Announcements" && <AnnouncementsTab courseTitle={course.title} items={store.announcements} setItems={(announcements) => setStore({ ...store, announcements })} />}
          {tab === "Participants" && <ParticipantsTab />}
          {tab === "Messages" && <TabPlaceholder label={tab} />}
        </div>
      </div>
    </main>
  );
}

function RecordingPlayer() {
  const { notify } = useApp();
  const control = "flex text-white transition hover:text-[#ffb20d]";
  const unavailable = () => notify("No recording has been uploaded for this sample session");
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[12px] bg-gradient-to-br from-[#04211f] via-[#1e1b4b] to-[#020617]">
      <button type="button" onClick={unavailable} aria-label="Play recording" className="absolute left-1/2 top-1/2 flex size-[66px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white text-white transition hover:scale-105">
        <svg viewBox="0 0 24 24" className="ml-1 size-8" fill="currentColor" aria-hidden="true">
          <path d="M7 4l14 8-14 8z" />
        </svg>
      </button>
      <div className="absolute inset-x-0 bottom-0 px-3 pb-2.5">
        <div className="relative h-0.5 rounded-full bg-white/30">
          <span className="absolute inset-y-0 left-0 w-[6%] rounded-full bg-white" />
        </div>
        <div className="mt-3 flex items-center gap-4 text-[10px] text-white">
          <button type="button" onClick={unavailable} aria-label="Play" className={control}>
            <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden="true">
              <path d="M7 4l14 8-14 8z" />
            </svg>
          </button>
          <button type="button" onClick={unavailable} aria-label="Mute" className={control}>
            <Icon path="M4 9v6h4l5 4V5L8 9H4z" className="size-4" />
          </button>
          <span className={fontRegular}>0:00/1:30:00</span>
          <span className={`ml-auto ${fontRegular}`}>Auto</span>
          <button type="button" onClick={unavailable} aria-label="Full screen" className={control}>
            <Icon path="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function LivePanel() {
  const { notify } = useApp();
  return (
    <>
      <h2 className={sectionTitle}>Session Recording & Key Takeaways</h2>
      <p className={`mt-1 text-[14px] leading-[20px] text-[#64748b] ${fontRegular}`}>This session covered core project objectives, key concepts, and practical insights.</p>
      <div className="mt-5 rounded-[24px] bg-[#f1f5f9] p-4 sm:p-8">
        <div className="flex flex-col items-center rounded-[20px] border border-[#e2e8f0] bg-white px-5 py-12 text-center">
          <h3 className={`text-[18px] leading-[28px] text-[#1e293b] ${fontSemi}`}>Your Live Class is in Progress</h3>
          <p className={`mt-3 text-[16px] leading-[24px] text-[#475569] ${fontRegular}`}>Students are waiting for you. Click below to start your session.</p>
          <p className={`mt-4 flex items-center gap-2 text-[16px] leading-[24px] text-[#ef4444] ${fontSemi}`}>
            <span aria-hidden="true" className="flex size-[18px] items-center justify-center rounded-full bg-[#fee2e2]">
              <span className="size-2 rounded-full bg-[#ef4444] motion-safe:animate-pulse" />
            </span>
            Session In Progress
          </p>
          <button type="button" onClick={() => notify("The live classroom isn't connected yet")} className={`mt-3 h-9 rounded-[8px] bg-[#ef4444] px-3 text-[14px] leading-[20px] text-white transition hover:bg-[#dc2626] ${fontMedium}`}>
            Join Live Class
          </button>
        </div>
      </div>
    </>
  );
}

const COUNTDOWN_SECONDS = 4 * 3600 + 12 * 60 + 34;

function CountdownPanel() {
  const [target] = useState(() => Date.now() + COUNTDOWN_SECONDS * 1000);
  const [left, setLeft] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    const timer = window.setInterval(() => setLeft(Math.max(0, Math.round((target - Date.now()) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  if (left === 0) return <LivePanel />;
  const units = [
    { label: "HOURS", value: Math.floor(left / 3600) },
    { label: "MINUTES", value: Math.floor(left / 60) % 60 },
    { label: "SECONDS", value: left % 60 },
  ];
  return (
    <div className="rounded-[24px] bg-[#f1f5f9] p-4 sm:p-8">
      <p className={`text-center text-[14px] leading-[20px] tracking-[3px] text-[#94a3b8] ${fontSemi}`}>WE ARE GETTING READY</p>
      <div role="timer" aria-label="Time until the session starts" className="mt-5 flex justify-center gap-3">
        {units.map((unit) => (
          <div key={unit.label} className="flex w-[100px] max-w-[30%] flex-col items-center rounded-[16px] bg-[#0f172a] py-4 text-white">
            <span className={`text-[36px] leading-[44px] tabular-nums ${fontHeading}`}>{String(unit.value).padStart(2, "0")}</span>
            <span className={`text-[12px] leading-[18px] sm:text-[14px] ${fontRegular}`}>{unit.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-9 rounded-[20px] border border-[#e2e8f0] bg-white px-5 py-5 text-center">
        <h2 className={`text-[18px] leading-[28px] text-[#1e293b] ${fontSemi}`}>⏳ Session Not Started Yet</h2>
        <p className={`mx-auto mt-2 max-w-[460px] text-[16px] leading-[28px] text-[#475569] ${fontRegular}`}>The session will begin soon. In the meantime, you can review the provided learning materials to prepare.</p>
      </div>
    </div>
  );
}

const ROSTER: { name: string; color: string; present: boolean; messageOnly?: boolean }[] = [
  { name: "Abdullah Al Noman", color: "#1e293b", present: true },
  { name: "Wade Warren", color: "#0891b2", present: true },
  { name: "Leslie Alexander", color: "#db2777", present: true },
  { name: "Devon Lane", color: "#7c3aed", present: false },
  { name: "Ralph Edwards", color: "#16a34a", present: true },
  { name: "Jerome Bell", color: "#ea580c", present: false },
  { name: "Theresa Webb", color: "#b91c1c", present: true },
  { name: "Kathryn Murphy", color: "#475569", present: true },
  { name: "Esther Howard", color: "#0369a1", present: false },
  { name: "Arlene McCoy", color: "#a16207", present: true },
  { name: "Jacob Jones", color: "#7a9cc6", present: true, messageOnly: true },
];

function AttendeesTab({ attendance, setAttendance }: { attendance: Record<string, boolean>; setAttendance: (next: Record<string, boolean>) => void }) {
  const { notify } = useApp();
  const [selected, setSelected] = useState<string[]>([]);
  const isPresent = (person: (typeof ROSTER)[number]) => attendance[person.name] ?? person.present;
  const allSelected = selected.length === ROSTER.length;
  const markMany = (present: boolean) => {
    const names = selected.length > 0 ? selected : ROSTER.map((p) => p.name);
    setAttendance({ ...attendance, ...Object.fromEntries(names.map((name) => [name, present])) });
    notify(`${names.length} ${names.length === 1 ? "person" : "people"} marked ${present ? "present" : "absent"}`);
    setSelected([]);
  };
  const scope = selected.length > 0 ? `${selected.length} Selected` : "All";
  const actionButton = `flex items-center gap-2 text-[14px] leading-[20px] transition ${fontRegular}`;

  return (
    <div className="mt-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className={sectionTitle}>Attendance List</h2>
          <p className={`mt-1 text-[14px] leading-[20px] text-[#64748b] ${fontRegular}`}>Manage class attendance efficiently.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => markMany(true)} className={`h-9 rounded-[8px] bg-[#1e293b] px-3 text-[14px] leading-[20px] text-white transition hover:bg-[#0f172a] ${fontMedium}`}>
            Mark {scope} Present
          </button>
          <button type="button" onClick={() => markMany(false)} className={`h-9 rounded-[8px] bg-[#f1f5f9] px-3 text-[14px] leading-[20px] text-[#1e293b] transition hover:bg-[#e2e8f0] ${fontMedium}`}>
            Mark {scope} Absent
          </button>
        </div>
      </div>
      <div className="mt-6 overflow-x-auto rounded-[12px] border border-[#e2e8f0]">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className={`text-[12px] leading-[18px] text-[#475569] ${fontMedium}`}>
              <th scope="col" className="w-[64px] py-3 pl-6">
                <Checkbox checked={allSelected} onChange={() => setSelected(allSelected ? [] : ROSTER.map((p) => p.name))}>
                  <span className="sr-only">Select everyone</span>
                </Checkbox>
              </th>
              <th scope="col" className="py-3 font-medium">
                Name
              </th>
              <th scope="col" className="py-3 text-center font-medium">
                Status
              </th>
              <th scope="col" className="py-3 text-center font-medium">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {ROSTER.map((person) => {
              const present = isPresent(person);
              return (
                <tr key={person.name} className="border-t border-[#f1f5f9]">
                  <td className="py-3 pl-6">
                    <Checkbox checked={selected.includes(person.name)} onChange={() => setSelected((list) => (list.includes(person.name) ? list.filter((n) => n !== person.name) : [...list, person.name]))}>
                      <span className="sr-only">Select {person.name}</span>
                    </Checkbox>
                  </td>
                  <td className="py-3">
                    <span className={`flex items-center gap-4 text-[14px] leading-[20px] text-[#1e293b] ${fontSemi}`}>
                      <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] text-white" style={{ backgroundColor: person.color }}>
                        {person.name
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                      {person.name}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[14px] leading-[20px] ${present ? "bg-[#ecfdf5] text-[#047857]" : "bg-[#fef2f2] text-[#b91c1c]"} ${fontRegular}`}>
                      <span aria-hidden="true" className={`size-1.5 rounded-full ${present ? "bg-[#10b981]" : "bg-[#ef4444]"}`} />
                      {present ? "Present" : "Absent"}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex justify-center">
                      {!present ? (
                        <button type="button" aria-label={`Mark ${person.name} as present`} onClick={() => setAttendance({ ...attendance, [person.name]: true })} className={`${actionButton} text-[#faa104] hover:text-[#c98003]`}>
                          <Icon path="M2 13l4 4L15 8M11 16l1 1 10-10" className="size-4" />
                          Mark as Present
                        </button>
                      ) : person.messageOnly ? (
                        <button type="button" aria-label={`Send a message to ${person.name}`} onClick={openMessages} className={`${actionButton} text-[#faa104] hover:text-[#c98003]`}>
                          <Icon path="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM3 7l9 6 9-6" className="size-[18px]" />
                          Send Message
                        </button>
                      ) : (
                        <button type="button" aria-label={`Mark ${person.name} as absent`} onClick={() => setAttendance({ ...attendance, [person.name]: false })} className={`${actionButton} text-[#475569] hover:text-[#0f172a]`}>
                          <Icon path="M6 5h4v14H6zM14 5h4v14h-4z" className="size-4" />
                          Mark Absent
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const SESSION_TABS = ["Overview", "Attendees", "AI Summary", "Transcripts"];

type DetailView = { kind: "single" | "multi"; title: string; courseCrumb: string; lastCrumb: string; status: SessionStatus; date: string; seriesName?: string; onBack: () => void };

function SessionDetail({ view, materials, attendance, setAttendance, onRename }: { view: DetailView; materials: Material[]; attendance: Record<string, boolean>; setAttendance: (next: Record<string, boolean>) => void; onRename: (name: string) => void }) {
  const { notify } = useApp();
  const [tab, setTab] = useState("Overview");
  const [renaming, setRenaming] = useState(false);
  const single = view.kind === "single";
  const share = () =>
    navigator.clipboard?.writeText(window.location.href).then(
      () => notify("Session link copied"),
      () => notify("Couldn't copy the link"),
    );

  return (
    <main className="flex flex-1 flex-col bg-[#f1f5f9]">
      <div className="bg-white px-4 py-6 md:px-7">
        <nav aria-label="Breadcrumb" className={`flex flex-wrap items-center gap-2 text-[12px] leading-[18px] text-[#94a3b8] ${fontRegular}`}>
          <Crumb onClick={() => openInstructorSessions()}>Session List</Crumb>
          <CrumbArrow />
          <span className="max-w-[320px] truncate">
            <Crumb onClick={view.onBack}>{view.courseCrumb}</Crumb>
          </span>
          <CrumbArrow />
          <Crumb current>{view.lastCrumb}</Crumb>
        </nav>
        <div className="mt-3 flex items-center gap-4">
          <button type="button" onClick={view.onBack} aria-label="Back to sessions" className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-[#f8fafc] text-[#1e293b] transition hover:bg-[#f1f5f9]">
            <Icon path="M15 6l-6 6 6 6" className="size-4" />
          </button>
          <h1 className={`m-0 ${headingClass}`}>{view.title}</h1>
          <button type="button" onClick={() => setRenaming(true)} aria-label="Rename session" className="flex shrink-0 text-[#94a3b8] transition hover:text-[#475569]">
            <Icon path={PENCIL} className="size-[18px]" />
          </button>
        </div>
        {view.seriesName && (
          <p className={`mt-2.5 flex flex-wrap items-center gap-2.5 text-[16px] leading-[24px] text-[#334155] ${fontRegular}`}>
            <Icon path={SCREEN} className="size-[18px] text-[#94a3b8]" />
            <span className="text-[#64748b]">{view.seriesName}</span>
            <span aria-hidden="true" className="h-4 w-px bg-[#94a3b8]" />
            {view.courseCrumb}
          </p>
        )}
        <div className={`mt-2.5 flex flex-wrap items-center gap-3 text-[14px] leading-[20px] text-[#64748b] ${single ? "md:pl-12" : ""} ${fontRegular}`}>
          {single ? <SingleSessionBadge /> : <MultiSessionBadge />}
          <Separator />
          {view.status === "Completed" ? (
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="flex size-4 items-center justify-center rounded-[3px] bg-[#10b981] text-white">
                <Icon path="M5 12l5 5 9-10" className="size-3" />
              </span>
              Completed
            </span>
          ) : (
            <StatusLabel status={view.status} />
          )}
          <Separator />
          <span className="flex items-center gap-1.5">
            <Icon path="M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z" className="size-4" />
            {view.date}
            {view.status === "Completed" ? " (Ended)" : ""}
          </span>
          <Separator />
          <span className="flex items-center gap-1.5">
            <Icon path="M16 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-1a4 4 0 00-3-3.8M16 4.2a3.5 3.5 0 010 6.6" className="size-4" />
            23 Participants
          </span>
        </div>
      </div>
      <div className="px-4 py-6 md:px-7">
        <div className="rounded-[12px] bg-white p-6">
          <div role="tablist" aria-label="Session sections" className="flex gap-2 overflow-x-auto">
            {SESSION_TABS.map((t) => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`h-8 shrink-0 rounded-[6px] px-3 text-[14px] leading-[20px] transition ${tab === t ? `bg-[#f1f5f9] text-[#1e293b] ${fontSemi}` : `text-[#64748b] hover:text-[#1e293b] ${fontRegular}`}`}>
                {t}
              </button>
            ))}
          </div>
          {tab === "Overview" && (
            <div className="mt-7 max-w-[680px]">
              {view.status === "Upcoming" && <CountdownPanel />}
              {view.status === "In progress" && <LivePanel />}
              {view.status === "Completed" && (
                <>
                  <RecordingPlayer />
                  <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className={`text-[16px] leading-[24px] text-[#1e293b] ${fontSemi}`}>{view.title}</p>
                      <p className={`mt-1 text-[14px] leading-[20px] text-[#94a3b8] ${fontRegular}`}>
                        Duration: <span className="text-[#475569]">1h 30 min</span>
                      </p>
                    </div>
                    <button type="button" onClick={share} className={`flex h-9 shrink-0 items-center gap-2 rounded-[8px] bg-[#f8fafc] px-3 text-[14px] leading-[20px] text-[#334155] transition hover:bg-[#f1f5f9] ${fontMedium}`}>
                      <Icon path="M12 15V3M8 7l4-4 4 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" className="size-[18px]" />
                      Copy & Share
                    </button>
                  </div>
                </>
              )}
              <h2 className={`mt-10 ${sectionTitle}`}>Additional Learning Materials</h2>
              <p className={`mt-1 text-[14px] leading-[20px] text-[#64748b] ${fontRegular}`}>Download essential documents to revisit concepts and best practices.</p>
              <ul className="mt-5 flex flex-col gap-4">
                {materials.map((m) => (
                  <li key={m.id} className="flex items-center gap-4 rounded-[8px] border border-[#e2e8f0] px-5 py-3.5">
                    <Icon path={FILE} className="size-8 shrink-0 text-[#475569]" />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[14px] leading-[20px] text-[#334155] ${fontRegular}`}>{m.name}</p>
                      <p className={`mt-0.5 text-[14px] leading-[20px] text-[#64748b] ${fontRegular}`}>{m.size}</p>
                    </div>
                    <button type="button" onClick={() => notify("Downloads will work once files are stored on a server")} className={`flex h-9 shrink-0 items-center gap-2 rounded-[8px] bg-[#f8fafc] px-3 text-[14px] leading-[20px] text-[#334155] transition hover:bg-[#f1f5f9] ${fontMedium}`}>
                      <Icon path="M12 4v11M8 11l4 4 4-4M5 20h14" className="size-[18px]" />
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tab === "Attendees" &&
            (view.status === "Upcoming" ? (
              <p className={`px-6 py-16 text-center text-[14px] leading-[24px] text-[#64748b] ${fontRegular}`}>Attendance opens when the session starts.</p>
            ) : (
              <AttendeesTab attendance={attendance} setAttendance={setAttendance} />
            ))}
          {(tab === "AI Summary" || tab === "Transcripts") && <TabPlaceholder label={tab} />}
        </div>
      </div>
      {renaming && (
        <NameDialog
          title="Rename session"
          label="Session name"
          initial={view.title}
          onClose={() => setRenaming(false)}
          onSave={(name) => {
            onRename(name);
            setRenaming(false);
          }}
        />
      )}
    </main>
  );
}

const SINGLE_STATES: Record<string, SessionStatus> = { completed: "Completed", upcoming: "Upcoming", live: "In progress" };
type Extras = { titles: Record<string, string>; attendance: Record<string, Record<string, boolean>> };

export function SingleSessionBadge() {
  return (
    <span className={`inline-flex h-[22px] items-center gap-1.5 rounded-full bg-[#e0e7ff] px-2 text-[12px] leading-[18px] text-[#3730a3] ${fontMedium}`}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-[#4338ca]" />
      Single Session
    </span>
  );
}

export const openCourse = (course: LiveCourse) => (course.kind === "multi" ? openInstructorSessions("multi", course.id) : openInstructorSessions("single", course.state ?? "completed", course.id));

function MySessions({ titleOf }: { titleOf: (course: LiveCourse) => string }) {
  const [sort, setSort] = useState("published");
  const drafts = loadLiveDrafts();
  const fromDraft: LiveCourse[] = drafts
    .filter((d) => !LIVE_COURSES.some((c) => c.id === d.id))
    .map((d) => ({ id: d.id, title: d.title, kind: d.kind, status: d.status, sessions: d.kind === "multi" ? `${d.series?.length ?? 0} group sessions` : `${d.singleSessions?.length ?? 0} individual sessions`, image: d.cover, durationText: d.duration ? `${d.duration} min` : "Not set", editorOnly: true }));
  const fromSample = LIVE_COURSES.map((c) => {
    const edited = drafts.find((d) => d.id === c.id);
    return edited ? { ...c, title: edited.title, status: edited.status, image: edited.cover || c.image } : c;
  });
  const courses = [...fromDraft, ...fromSample];
  const visible = [...courses].sort((a, b) => Number(b.status === sort) - Number(a.status === sort));

  return (
    <main className="flex flex-1 flex-col bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2e8f0] px-4 py-4 md:px-7">
        <div>
          <h1 className="m-0 font-['Instrument_Sans:Medium'] text-[24px] font-medium leading-[32px] text-[#0f172a]" style={{ fontVariationSettings: '"wdth" 100' }}>
            My Sessions
          </h1>
          <p className={`mt-1 text-[14px] leading-[20px] text-[#64748b] ${fontRegular}`}>You have total {courses.length} sessions</p>
        </div>
        <button type="button" onClick={openCreateSession} className={`flex h-[36px] items-center gap-2 rounded-[8px] bg-[#ffb20d] px-3 text-[14px] leading-[20px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
          <img src={imgPlusSmall} alt="" width={18} height={18} className="size-[18px]" />
          Create Live Course
        </button>
      </div>
      <div className="flex flex-1 flex-col px-4 py-6 md:px-7">
        <section className="flex-1 rounded-[12px] border border-[#e2e8f0] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] bg-[#f8fafc] px-5 py-3.5">
            <h2 className={`text-[16px] leading-[24px] text-[#1e293b] ${fontSemi}`}>Live Courses</h2>
            <FilterSelect
              large
              alignRight
              label="Sort by"
              value={sort}
              onChange={setSort}
              options={[
                { value: "published", label: "Published" },
                { value: "draft", label: "Draft" },
              ]}
            />
          </div>
          <ul className="mt-5 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((course) => {
              const title = titleOf(course);
              return (
                <li key={course.id} className="relative overflow-hidden rounded-[12px] border border-[#e2e8f0] bg-white p-4 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.06)] transition-shadow focus-within:shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
                  {course.status === "draft" && (
                    <span className="pointer-events-none absolute left-0 top-0 z-10 size-[64px] bg-[#ffb20d] [clip-path:polygon(0_0,100%_0,0_100%)]">
                      <span className={`absolute left-1 top-3.5 -rotate-45 text-[12px] leading-[18px] text-[#1e293b] ${fontMedium}`}>Draft</span>
                    </span>
                  )}
                  {course.image ? <img src={course.image} alt="" className="aspect-[16/9] w-full rounded-[8px] object-cover" /> : <span className={`flex aspect-[16/9] w-full items-center justify-center rounded-[8px] bg-[#f1f5f9] text-[14px] text-[#64748b] ${fontMedium}`}>No image</span>}
                  <div className="mt-5 flex min-h-[22px] items-center justify-between gap-2 px-1">
                    {course.kind === "multi" ? <MultiSessionBadge /> : <SingleSessionBadge />}
                    {course.status === "published" && <span className={`rounded-full bg-[#059669] px-2 py-0.5 text-[12px] leading-[18px] text-white ${fontMedium}`}>Published</span>}
                  </div>
                  <h3 className={`mt-3 px-1 text-[16px] leading-[28px] text-[#1e293b] ${fontSemi}`}>
                    <button type="button" onClick={() => (course.editorOnly ? openLiveEditor(course.id) : openCourse(course))} className="text-left after:absolute after:inset-0 after:content-['']">
                      {title}
                    </button>
                  </h3>
                  <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-[12px] leading-[18px] text-[#64748b] ${fontRegular}`}>
                    <span className="flex items-center gap-1.5">
                      <Icon path="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" className="size-4 text-[#94a3b8]" />
                      {course.sessions}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Icon path="M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z" className="size-4 text-[#94a3b8]" />
                      {course.durationText ?? "1h 30m"}
                    </span>
                  </div>
                  {course.status === "draft" && (
                    <button type="button" onClick={() => openLiveEditor(course.id)} className={`relative z-10 mt-3 h-9 w-full rounded-[8px] bg-[#1e293b] text-[14px] leading-[20px] text-white transition hover:bg-[#0f172a] ${fontMedium}`}>
                      Edit Course
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}

export default function InstructorSessions({ seriesId, sessionId, courseId }: { seriesId?: string; sessionId?: string; courseId?: string }) {
  const [store, setStore] = useState<Store>(() => load(STORE_KEY, SEED));
  const [extras, setExtras] = useState<Extras>(() => load(EXTRAS_KEY, { titles: {}, attendance: {} }));
  useEffect(() => save(STORE_KEY, store), [store]);
  useEffect(() => save(EXTRAS_KEY, extras), [extras]);

  const attendanceFor = (key: string) => ({
    attendance: extras.attendance[key] ?? {},
    setAttendance: (next: Record<string, boolean>) => setExtras((e) => ({ ...e, attendance: { ...e.attendance, [key]: next } })),
  });
  const titleOf = (course: LiveCourse) => extras.titles?.[course.id] ?? course.title;
  const courseFor = (kind: LiveCourse["kind"], id?: string) => LIVE_COURSES.find((c) => c.kind === kind && c.id === id) ?? LIVE_COURSES.find((c) => c.kind === kind)!;

  const singleStatus = seriesId === "single" && sessionId ? SINGLE_STATES[sessionId] : undefined;
  if (singleStatus) {
    const course = courseFor("single", courseId);
    const key = `single-${sessionId}-${course.id}`;
    return (
      <SessionDetail
        key={key}
        view={{ kind: "single", title: titleOf(course), courseCrumb: titleOf(course), lastCrumb: "Session 02", status: singleStatus, date: "13 May", onBack: () => openInstructorSessions() }}
        materials={store.materials}
        {...attendanceFor(key)}
        onRename={(name) => setExtras((e) => ({ ...e, titles: { ...e.titles, [course.id]: name } }))}
      />
    );
  }

  const series = store.series.find((s) => s.id === seriesId);
  const session = series?.sessions.find((s) => s.id === sessionId);
  if (series && session) {
    const course = courseFor("multi", courseId);
    const key = `${course.id}-${series.id}-${session.id}`;
    return (
      <SessionDetail
        key={key}
        view={{ kind: "multi", title: session.name, courseCrumb: titleOf(course), lastCrumb: `${series.name}-${session.name}`, status: session.status, date: session.date.split(", ")[1] ?? session.date, seriesName: series.name, onBack: () => openInstructorSessions("multi", course.id) }}
        materials={store.materials}
        {...attendanceFor(key)}
        onRename={(name) => setStore({ ...store, series: store.series.map((s) => (s.id === series.id ? { ...s, sessions: s.sessions.map((item) => (item.id === session.id ? { ...item, name } : item)) } : s)) })}
      />
    );
  }

  if (seriesId === "multi") {
    const course = courseFor("multi", sessionId);
    return <MultiSessionPage key={course.id} store={store} setStore={setStore} course={{ ...course, title: titleOf(course) }} />;
  }
  return <MySessions titleOf={titleOf} />;
}
