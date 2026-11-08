import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { categories } from "../data";
import { fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, openCourseEditor, openInstructorCourses, save, useApp } from "../store";
import { SelectField, TextField } from "./AccountSettingsPage";
import { Checkbox } from "./InstructorAssignments";
import { Toggle } from "./InstructorAvailability";
import { COURSE_DETAILS_KEY, StatusPill, loadInstructorCourses, sampleCover, saveInstructorCourses, todayLabel, type CourseStatus, type InstructorCourse } from "./InstructorCourses";
import { ConfirmDialog } from "./InstructorSessions";
import { InfoTip } from "./InstructorReports";
import { ActionMenu, type ActionItem } from "./Menus";
import { NoteEditor } from "./Notes";
import { Shell } from "./Overlays";

type Point = { id: string; text: string };
type LectureKind = "Video" | "Quiz" | "Assignment" | "Article";
type Lecture = { id: string; title: string; kind: LectureKind; duration?: string; file?: string; preview?: boolean; description?: string; resources?: { id: string; name: string }[]; questions?: QuizQuestion[]; quizSettings?: QuizSettings };
type QuizOption = { id: string; text: string; explanation: string; correct: boolean; saved: boolean };
type QuizQuestion = { id: string; text: string; relatedLecture: string; required: boolean; randomise: boolean; multiple: boolean; options: QuizOption[] };
type QuizSettings = { passScore: string; retakes: boolean; shuffle: boolean };
// Upload progress by lecture id (100 means processing) and session-only video previews by file name.
type Uploads = { progress: Record<string, number>; urls: Record<string, string>; start: (file: File, lectureId: string) => void };
type CourseSection = { id: string; title: string; lectures: Lecture[] };
type Coupon = { id: string; code: string; percent: number; expires: string };
type Details = {
  objectives: Point[];
  requirements: Point[];
  audience: Point[];
  subtitle: string;
  topics: string[];
  subCategory: string;
  level: string;
  language: string;
  description: { text: string; html: string };
  cover: string;
  promoVideo: { name: string; size: number } | null;
  curriculum: CourseSection[];
  coupons: Coupon[];
  dealsAgreed: boolean;
};
type StoredDetails = Details & { savedAt?: number };
type Draft = Details & { title: string; category: string; price: string };

let idCounter = 0;
const uid = (prefix: string) => `${prefix}-${Date.now()}-${idCounter++}`;
const blankPoints = (count: number): Point[] => Array.from({ length: count }, () => ({ id: uid("point"), text: "" }));

const blankDetails = (): Details => ({
  objectives: blankPoints(4),
  requirements: blankPoints(2),
  audience: blankPoints(2),
  subtitle: "",
  topics: [],
  subCategory: "",
  level: "",
  language: "",
  description: { text: "", html: "" },
  cover: "",
  promoVideo: null,
  curriculum: [],
  coupons: [],
  dealsAgreed: false,
});

const TITLE_LIMIT = 60;
const POINT_LIMIT = 160;
const MIN_OBJECTIVES = 4;
const MIN_DESCRIPTION_WORDS = 200;
const LEVELS = ["Beginner", "Intermediate", "Advanced", "All levels"];
const LANGUAGES = ["English", "Arabic"];
const TOPIC_OPTIONS = ["Prototyping", "Wireframing", "Usability", "UI Design", "UX Research", "Figma", "Web Development", "Python", "Data Analysis", "Leadership", "Digital Marketing", "Entrepreneurship"];
const MAX_VIDEO_MB = 200;
const MAX_LECTURE_VIDEO_MB = 700;
const LECTURE_DESCRIPTION_LIMIT = 500;

const SECTIONS: { id: string; label: string; icon: string }[] = [
  { id: "intended-learners", label: "Intended Learners", icon: "M2 9l10-5 10 5-10 5-10-5zM6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5M20 10v6" },
  { id: "details", label: "Details", icon: "M14 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-7M8 12h5M8 16h8M18 2.5a3 3 0 100 6 3 3 0 000-6z" },
  { id: "curriculum", label: "Curriculum", icon: "M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2zM8 8h8M8 12h8M8 16h5" },
  { id: "promotions", label: "Promotions", icon: "M6 3h12a2 2 0 012 2v16l-3-2-3 2-2-2-2 2-3-2-3 2V5a2 2 0 012-2zM15 8l-6 6M9.5 8.5h.01M14.5 13.5h.01" },
  { id: "pricing", label: "Pricing", icon: "M6 3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3zM15 9c-.5-1-1.5-1.5-3-1.5-2 0-3 1-3 2.2 0 3 6 1.6 6 4.6 0 1.2-1 2.2-3 2.2-1.5 0-2.5-.5-3-1.5M12 6v12" },
  { id: "tips", label: "Tips", icon: "M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0012 3z" },
];

const GUIDES: Record<string, { card: { title: string; text: string }; explain: string[] }> = {
  "intended-learners": {
    card: { title: "Craft Your Perfect Course Details", text: "Learn how to craft descriptions that attract the right learners and boost engagement." },
    explain: ["Course objectives tell students what they will be able to do after your course. Start each one with an action, like \"Build\" or \"Design\". You need at least four.", "Requirements list the skills or tools students need first. If there are none, say the course suits beginners.", "Who this course is for helps the right students recognise themselves, so name specific people and goals."],
  },
  details: {
    card: { title: "Pro Tips!", text: "Create a captivating promo video: Keep it short, focus on key benefits, and show your teaching style to attract students." },
    explain: ["Use a clear title that says what students will learn, and a subtitle with one or two keywords.", "Choose your topics, level, language, category and sub category so your course shows up in the right searches.", `The description needs at least ${MIN_DESCRIPTION_WORDS} words. Add a cover image in a 7:4 ratio and a promotional video of up to ${MAX_VIDEO_MB} MB to help students decide.`],
  },
  curriculum: {
    card: { title: "", text: "" },
    explain: ["Sections group your lectures by topic. Name each one clearly and order them from simple to advanced.", "Choose a content type for each lecture. A video teaches a topic, a quiz checks understanding, an assignment gives practice and an article adds reading.", "Drag the handles to reorder sections and lectures, or use the menu on each row. Your course needs at least one lecture before you can submit it."],
  },
  promotions: {
    card: { title: "Reach More Students", text: "A limited-time coupon gives new students a reason to enroll today." },
    explain: ["Coupons give students a percentage off until the date you choose. Share the code with your audience.", "The Deals Program is optional. It lets Thkee promote your course at a discount in targeted campaigns."],
  },
  pricing: {
    card: { title: "Price With Confidence", text: "Look at similar courses in your category, then choose a price that reflects the value you offer." },
    explain: ["Enter the price students pay in US dollars. Enter 0 to offer the course for free.", "Coupons from the Promotions section are taken off this price."],
  },
  tips: { card: { title: "", text: "" }, explain: ["This checklist shows what is left before you can submit your course for review. Select an item to go to it.", "The tips below it are general guidance for organising a course that students finish."] },
};

const TIPS = [
  { title: "Start with the outcome", text: "Decide what students should be able to do at the end, then work backwards to the lectures that get them there." },
  { title: "Keep lectures short", text: "One idea per lecture makes a course easier to follow and easier to come back to." },
  { title: "Practice in every section", text: "A quiz or assignment after each section helps students check what they have learned." },
  { title: "Show the first win early", text: "Let students make or solve something in the first section so they want to continue." },
];

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
const filled = (points: Point[]) => points.filter((p) => p.text.trim()).length;
const lectureCount = (draft: Draft) => draft.curriculum.reduce((sum, s) => sum + s.lectures.filter((l) => l.title.trim()).length, 0);
const priceIsValid = (price: string) => price.trim() !== "" && Number.isFinite(Number(price)) && Number(price) >= 0;

const checklist = (draft: Draft): { section: string; label: string; done: boolean }[] => [
  { section: "intended-learners", label: `Add at least ${MIN_OBJECTIVES} course objectives`, done: filled(draft.objectives) >= MIN_OBJECTIVES },
  { section: "intended-learners", label: "Add at least one requirement", done: filled(draft.requirements) >= 1 },
  { section: "intended-learners", label: "Add who this course is for", done: filled(draft.audience) >= 1 },
  { section: "details", label: "Add a title and subtitle", done: !!draft.title.trim() && !!draft.subtitle.trim() },
  { section: "details", label: "Choose a category, level and language", done: !!draft.category && !!draft.level && !!draft.language },
  { section: "details", label: `Write at least ${MIN_DESCRIPTION_WORDS} words in the description`, done: wordCount(draft.description.text) >= MIN_DESCRIPTION_WORDS },
  { section: "curriculum", label: "Add at least one lecture", done: lectureCount(draft) >= 1 },
  { section: "pricing", label: "Set a price", done: priceIsValid(draft.price) },
];

const savedLabel = (savedAt: number | undefined, updated: string, now: number) => {
  if (!savedAt) return `Last updated ${updated}`;
  const seconds = Math.max(0, Math.round((now - savedAt) / 1000));
  if (seconds < 10) return "Last saved just now";
  if (seconds < 60) return `Last saved ${seconds} seconds ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `Last saved ${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Last saved ${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  return `Last saved ${new Date(savedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}`;
};

function Icon({ path, className = "size-5", filled: solid }: { path: string; className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={solid ? "currentColor" : "none"} stroke={solid ? "none" : "currentColor"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
const PLUS = "M12 5v14M5 12h14";
const TRASH = "M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6";
const SPARKLE = "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8zM5 15l.6 1.4L7 17l-1.4.6L5 19l-.6-1.4L3 17l1.4-.6z";
const HISTORY = "M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8M3 3v5h5M12 7v5l3 2";
const DOWN = "M6 9l6 6 6-6";
const IMAGE = "M4 7h13a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2zM2 17l5-5 4 4 3-3 5 5M7 4h13a2 2 0 012 2v9M14 11h.01";
const VIDEO = "M4 5h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2zM10 9l5 3-5 3zM2 16h20";
const BELL = "M6 16V11a6 6 0 0112 0v5l2 3H4l2-3zM10 21h4M12 3v2";
const QUESTION = "M2 13l3.500 3.500L12 9M10 15l1.500 1.500L22 7";
const PANEL = "M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zM15 4v16M17.500 8.500h1M17.500 11.500h1";
const CLOSE = "M6 6l12 12M18 6L6 18";
const PENCIL = "M4 20l1-4L16.5 4.500a2.100 2.100 0 013 3L8 19l-4 1zM14 20h7";
const PLAY = "M12 3a9 9 0 100 18 9 9 0 000-18zM10 8.500l5.500 3.500-5.500 3.500z";
const QUIZ = "M12.0 2.4 L15.1 4.5 L18.8 5.2 L19.5 8.9 L21.6 12.0 L19.5 15.1 L18.8 18.8 L15.1 19.5 L12.0 21.6 L8.9 19.5 L5.2 18.8 L4.5 15.1 L2.4 12.0 L4.5 8.9 L5.2 5.2 L8.9 4.5zM9.8 9.7a2.3 2.3 0 114 1.5c-.8.7-1.8 1.1-1.8 2.2M12 16h.01";
const ASSIGNMENT = "M16 11V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2h5M8 8h4M8 12h4M14 21l.7-2.800 5.200-5.200a1.400 1.400 0 012 2l-5.200 5.200z";
const ARTICLE = "M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM9 8h6M9 12h6M9 16h4";
const UPLOAD = "M12 3a9 9 0 100 18 9 9 0 000-18zM8.500 7.500h7M12 17v-6.500M9 13l3-3 3 3";
const LIBRARY = "M7 7V5a1 1 0 011-1h8a1 1 0 011 1v2M4 7h16M5.500 10h13L17 20a1.500 1.500 0 01-1.500 1h-7A1.500 1.500 0 017 20z";
const CHECK_CIRCLE = "M12 3a9 9 0 100 18 9 9 0 000-18zM8 12l3 3 5-6";

const inlineLink = "text-[#c98003] underline transition hover:text-[#976002]";
const iconButton = "flex size-9 shrink-0 items-center justify-center rounded-[8px] text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-40";
const fieldHint = `text-[12px] leading-[18px] text-[#64748b] ${fontRegular}`;

const move = <T,>(list: T[], index: number, by: number) => {
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(index + by, 0, item);
  return next;
};

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="relative border-b border-[#e2e8f0] pb-2.5">
      <h1 className={`m-0 text-[22px] leading-[30px] tracking-[-0.2px] text-[#0f172a] ${fontSemi}`}>{children}</h1>
      <span aria-hidden="true" className="absolute -bottom-px left-0 h-0.5 w-11 bg-[#faa104]" />
    </div>
  );
}

function AiInput({ id, label, value, original, placeholder, maxLength, height = "h-12", onChange }: { id?: string; label: string; value: string; original?: string; placeholder: string; maxLength?: number; height?: string; onChange: (value: string) => void }) {
  const { notify } = useApp();
  const reveal = "opacity-0 transition group-focus-within/field:opacity-100 group-hover/field:opacity-100 pointer-coarse:opacity-100";
  const canRestore = original !== undefined && original !== value;
  return (
    <div className={`field-box group/field min-w-0 flex-1 focus-within:border-[#334155] focus-within:shadow-none ${height}`}>
      <input id={id} aria-label={id ? undefined : label} value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`min-w-0 flex-1 bg-transparent text-[16px] leading-[24px] text-[#1e293b] outline-none placeholder:text-[#94a3b8] md:text-[14px] ${fontRegular}`} />
      <button type="button" aria-label={`Suggest ${label.toLowerCase()} with AI`} title="Suggest with AI" onClick={() => notify("AI suggestions are coming soon")} className={`flex shrink-0 p-1 text-[#6016fc] ${reveal}`}>
        <Icon path={SPARKLE} className="size-5" filled />
      </button>
      <button type="button" aria-label={`Restore saved ${label.toLowerCase()}`} title={canRestore ? "Restore last saved text" : "No changes to restore"} disabled={!canRestore} onClick={() => onChange(original ?? "")} className={`flex shrink-0 p-1 text-[#64748b] disabled:cursor-not-allowed disabled:text-[#cbd5e1] ${reveal}`}>
        <Icon path={HISTORY} className="size-[18px]" />
      </button>
    </div>
  );
}

function PointList({ label, rows, savedRows, placeholder, onChange }: { label: string; rows: Point[]; savedRows: Point[]; placeholder: string; onChange: (next: Point[]) => void }) {
  const [focusId, setFocusId] = useState("");
  useEffect(() => {
    if (focusId) document.querySelector<HTMLInputElement>(`[data-point="${focusId}"] input`)?.focus();
  }, [focusId]);
  return (
    <div className="mt-5">
      <ul className="flex flex-col gap-3">
        {rows.map((row, i) => {
          return (
            <li key={row.id} data-point={row.id} className="group flex items-center gap-3">
              <AiInput label={`${label} ${i + 1}`} value={row.text} original={savedRows.find((p) => p.id === row.id)?.text} placeholder={placeholder} maxLength={POINT_LIMIT} onChange={(text) => onChange(rows.map((p) => (p.id === row.id ? { ...p, text } : p)))} />
              <button type="button" aria-label={`Remove ${label.toLowerCase()} ${i + 1}`} disabled={rows.length === 1} onClick={() => onChange(rows.filter((p) => p.id !== row.id))} className="flex size-9 shrink-0 items-center justify-center rounded-[8px] text-[#ef4444] transition group-focus-within:bg-[#fef2f2] group-hover:bg-[#fef2f2] disabled:cursor-not-allowed disabled:opacity-40">
                <Icon path={TRASH} className="size-[18px]" />
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => {
          const row = { id: uid("point"), text: "" };
          setFocusId(row.id);
          onChange([...rows, row]);
        }}
        className={`mt-3 flex h-10 items-center gap-2 rounded-[8px] px-4 text-[14px] leading-[20px] text-[#1e293b] transition hover:bg-[#f1f5f9] ${fontMedium}`}
      >
        <Icon path={PLUS} className="size-[18px] text-[#64748b]" />
        Add new
      </button>
    </div>
  );
}

function PointGroup({ emoji, title, children }: { emoji: string; title: string; children: ReactNode }) {
  const { notify } = useApp();
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className={`m-0 flex items-center gap-2 text-[20px] leading-[28px] text-[#1e293b] ${fontMedium}`}>
        <span aria-hidden="true" className="text-[18px]">
          {emoji}
        </span>
        {title}
      </h2>
      <button type="button" onClick={() => notify("AI suggestions are coming soon")} className={`flex items-center gap-2 rounded-[6px] text-[14px] leading-[20px] text-[#1e293b] transition hover:text-[#6016fc] ${fontMedium}`}>
        <Icon path={SPARKLE} className="size-5 text-[#6016fc]" filled />
        Bulk Generate
      </button>
      <div className="w-full">{children}</div>
    </div>
  );
}

type SectionProps = { draft: Draft; saved: Draft; update: (patch: Partial<Draft>) => void; onExplain: () => void };

function LearnersSection({ draft, saved, update, onExplain }: SectionProps) {
  const { notify } = useApp();
  const text = `text-[14px] leading-[24px] text-[#475569] ${fontRegular}`;
  return (
    <>
      <p className={`text-[16px] leading-[28px] text-[#475569] ${fontRegular}`}>
        These descriptions will appear on your{" "}
        <button type="button" onClick={() => notify("The course landing page preview is coming soon")} className={inlineLink}>
          Course Landing Page
        </button>{" "}
        and help learners decide if your course suits them, directly impacting its performance.
      </p>
      <section className="mt-10">
        <PointGroup emoji="🎯" title="Course Objectives">
          <p className={text}>What skills or knowledge will your students gain?</p>
          <PointList label="Objective" placeholder="Write here.." rows={draft.objectives} savedRows={saved.objectives} onChange={(objectives) => update({ objectives })} />
        </PointGroup>
      </section>
      <section className="mt-10">
        <PointGroup emoji="🛠️" title="Course Requirements">
          <p className={text}>Mention any skills, tools, or prior knowledge learners need before starting.</p>
          <PointList label="Requirement" placeholder="Write here.." rows={draft.requirements} savedRows={saved.requirements} onChange={(requirements) => update({ requirements })} />
        </PointGroup>
      </section>
      <section className="mt-10">
        <PointGroup emoji="🎓" title="Who This Course Is For">
          <p className={text}>
            Describe your{" "}
            <button type="button" onClick={onExplain} className={inlineLink}>
              intended learners
            </button>{" "}
            — who will benefit most and why this course is right for them.
          </p>
          <PointList label="Audience point" placeholder="Write here.." rows={draft.audience} savedRows={saved.audience} onChange={(audience) => update({ audience })} />
        </PointGroup>
      </section>
    </>
  );
}

function TopicsField({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={ref} className="relative" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <div className="field-box h-auto min-h-11 flex-wrap py-1.5">
        {value.map((topic) => (
          <span key={topic} className={`flex items-center gap-1.5 rounded-[4px] bg-[#f1f5f9] py-1 pl-2 pr-1.5 text-[12px] leading-[18px] text-[#1e293b] ${fontMedium}`}>
            {topic}
            <button type="button" aria-label={`Remove topic ${topic}`} onClick={() => onChange(value.filter((t) => t !== topic))} className="flex text-[#334155] transition hover:text-[#dc2626]">
              <Icon path="M6 6l12 12M18 6L6 18" className="size-3.5" />
            </button>
          </span>
        ))}
        <button type="button" aria-label="Choose topics" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((v) => !v)} className={`flex h-7 min-w-[120px] flex-1 items-center justify-between gap-2 text-left text-[14px] text-[#94a3b8] ${fontRegular}`}>
          {value.length === 0 ? "Select topics" : <span />}
          <Icon path={DOWN} className={`size-4 shrink-0 text-[#64748b] transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <div role="listbox" aria-label="Topics" aria-multiselectable="true" className="pop-in absolute top-full z-20 mt-1 flex max-h-[240px] w-full flex-col gap-0.5 overflow-y-auto rounded-[6px] bg-white p-1 shadow-[0_8px_24px_rgba(15,23,42,0.15)]">
          {TOPIC_OPTIONS.map((topic) => {
            const on = value.includes(topic);
            return (
              <button key={topic} type="button" role="option" aria-selected={on} onClick={() => onChange(on ? value.filter((t) => t !== topic) : [...value, topic])} className={`flex items-center justify-between gap-2 rounded-[4px] px-3 py-2 text-left text-[14px] leading-[20px] transition hover:bg-[#f8fafc] ${on ? `text-[#0f172a] ${fontMedium}` : `text-[#334155] ${fontRegular}`}`}>
                {topic}
                {on && <Icon path="M5 13l4 4L19 7" className="size-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MediaBlock({ preview, title, text, canReset, onBrowse, onReset }: { preview: ReactNode; title: string; text: ReactNode; canReset: boolean; onBrowse: () => void; onReset: () => void }) {
  return (
    <div className="flex flex-col gap-6 @2xl:flex-row @2xl:items-center">
      <div className="flex aspect-[7/4] w-full shrink-0 flex-col items-center justify-center gap-3 overflow-hidden rounded-[12px] bg-[#f8fafc] @2xl:w-[320px]">{preview}</div>
      <div className="min-w-0">
        <p className={`text-[16px] leading-[24px] text-[#1e293b] ${fontSemi}`}>{title}</p>
        <p className={`mt-2 text-[14px] leading-[24px] text-[#64748b] ${fontRegular}`}>{text}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={onBrowse} className={`h-11 rounded-[8px] bg-[#475569] px-4 text-[16px] leading-[20px] text-white transition hover:bg-[#334155] ${fontMedium}`}>
            Browse Files
          </button>
          <button type="button" disabled={!canReset} onClick={onReset} className={`h-11 rounded-[8px] border border-[#cbd5e1] bg-white px-5 text-[16px] leading-[20px] text-[#1e293b] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50 ${fontMedium}`}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

function MediaPlaceholder({ path, label }: { path: string; label: string }) {
  return (
    <>
      <span className="flex size-[90px] items-center justify-center rounded-full bg-white text-[#94a3b8]">
        <Icon path={path} className="size-11" />
      </span>
      <span className={`max-w-full truncate px-4 text-[14px] leading-[20px] text-[#475569] ${fontMedium}`}>{label}</span>
    </>
  );
}

function DetailsSection({ draft, saved, update, fallbackCover, guide, onSupport }: SectionProps & { fallbackCover: string; guide: { title: string; text: string }; onSupport: () => void }) {
  const { notify } = useApp();
  const coverInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [expanded, setExpanded] = useState(false);
  const subs = categories.find((c) => c.name === draft.category)?.subs ?? [];
  const cover = draft.cover || fallbackCover;
  const label = `text-[14px] leading-[20px] text-[#1e293b] ${fontSemi}`;

  useEffect(() => () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  const pickCover = (file?: File) => {
    if (coverInput.current) coverInput.current.value = "";
    if (!file) return;
    if (!["image/webp", "image/jpeg", "image/png"].includes(file.type)) return notify("Use a .webp, .jpg, .jpeg or .png image");
    if (file.size > 1024 * 1024) return notify("Images must be under 1 MB for now");
    const reader = new FileReader();
    reader.onload = () => update({ cover: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const pickVideo = (file?: File) => {
    if (videoInput.current) videoInput.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/")) return notify("Choose a video file");
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) return notify(`Videos must be under ${MAX_VIDEO_MB} MB`);
    setVideoUrl(URL.createObjectURL(file));
    update({ promoVideo: { name: file.name, size: file.size } });
  };

  return (
    <div className="grid gap-x-12 gap-y-10 @4xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-6 @4xl:col-start-1">
        <div className="flex items-center gap-6 rounded-[12px] bg-[#f1f5f9] px-5 py-4">
          <p className={`min-w-0 flex-1 text-[14px] leading-[22px] text-[#1e293b] ${fontRegular}`}>
            Your course landing page is your key to success—attract learners and boost visibility on Google. Make it compelling to inspire enrolments. Go to Support page for more about{" "}
            <button type="button" onClick={onSupport} className={`text-[#0f172a] underline transition hover:text-[#475569] ${fontSemi}`}>
              Course Title Standards
            </button>
          </p>
          <span aria-hidden="true" className="hidden size-[88px] shrink-0 items-center justify-center rounded-[8px] bg-white text-[#334155] sm:flex">
            <svg viewBox="0 0 48 40" className="h-10 w-12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="1" width="44" height="32" rx="3" />
              <path d="M1 8h44M36 4.5h.01M39.5 4.5h.01M42 4.5h.01" strokeLinecap="round" />
              <rect x="6" y="13" width="9" height="7" />
              <rect x="6" y="23" width="9" height="6" />
              <path d="M20 13h20v16H20z" />
              <circle cx="41" cy="33" r="6" fill="currentColor" stroke="none" />
              <path d="M38.5 34l2.5-2.5 2.5 2.5" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label htmlFor="course-title" className={label}>
              Title
            </label>
            <span className={fieldHint}>{Math.max(0, TITLE_LIMIT - draft.title.length)} characters left!</span>
          </div>
          <AiInput id="course-title" label="Title" height="h-11" value={draft.title} original={saved.title} maxLength={TITLE_LIMIT} placeholder="Write here.." onChange={(title) => update({ title })} />
          {draft.title.trim() ? <p className={`mt-1.5 ${fieldHint}`}>Make your title catchy, clear, and easy for people to find in a search.</p> : <p className={`mt-1.5 text-[12px] leading-[18px] text-[#dc2626] ${fontRegular}`}>Enter a course title</p>}
        </div>
        <div>
          <label htmlFor="course-subtitle" className={`mb-1.5 block ${label}`}>
            Subtitle
          </label>
          <AiInput id="course-subtitle" label="Subtitle" height="h-11" value={draft.subtitle} original={saved.subtitle} placeholder="Write here.." onChange={(subtitle) => update({ subtitle })} />
          <p className={`mt-1.5 ${fieldHint}`}>Include 1–2 relevant keywords and highlight 3–4 key topics or skills your course covers to make it clear and engaging.</p>
        </div>
        <div>
          <p className={`mb-1.5 ${label}`}>Topics</p>
          <TopicsField value={draft.topics} onChange={(topics) => update({ topics })} />
        </div>
        <div>
          <p className={`mb-1.5 flex items-center gap-1.5 ${label}`}>
            Description
            <InfoTip text="Explain what students will learn, how the course is taught and who it is for." />
          </p>
          {expanded && <div aria-hidden="true" onClick={() => setExpanded(false)} className="overlay-fade fixed inset-0 z-40 bg-[#0f172a]/50" />}
          <div className={expanded ? "fixed inset-4 z-50 flex flex-col rounded-[8px] bg-white md:inset-10" : ""}>
            <NoteEditor
              toolbarTop
              hideActions
              hideUnderline
              autoFocus={false}
              initial={draft.description}
              placeholder="Course description..."
              boxClass={expanded ? "flex-1 !bg-white" : "min-h-[226px] !bg-white"}
              onCancel={() => setExpanded(false)}
              onChange={(text, html) => update({ description: { text, html } })}
              toolbarEnd={
                <button type="button" aria-label={expanded ? "Exit full screen" : "Expand description editor"} aria-pressed={expanded} title={expanded ? "Exit full screen" : "Expand"} onClick={() => setExpanded((v) => !v)} className="flex size-7 items-center justify-center rounded-[4px] text-[#334155] transition hover:bg-[#f1f5f9]">
                  <Icon path={expanded ? "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" : "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"} className="size-[18px]" />
                </button>
              }
            />
          </div>
          <p className={`mt-1.5 ${fieldHint}`}>
            Write at least {MIN_DESCRIPTION_WORDS} words. {wordCount(draft.description.text) > 0 && `(${wordCount(draft.description.text)} so far)`}
          </p>
        </div>
        <div className="grid gap-6 @lg:grid-cols-2">
          <SelectField id="course-level" label="Level" value={draft.level} onChange={(level) => update({ level })} placeholder="Select a level" options={LEVELS} />
          <SelectField id="course-language" label="Language" value={draft.language} onChange={(language) => update({ language })} placeholder="Select a language" options={LANGUAGES} />
          <SelectField id="course-category" label="Category" value={draft.category} onChange={(category) => update({ category, subCategory: "" })} placeholder="Select a category" options={[...new Set([...categories.map((c) => c.name as string), ...(draft.category ? [draft.category] : [])])]} />
          <SelectField id="course-subcategory" label="Sub category" value={draft.subCategory} onChange={(subCategory) => update({ subCategory })} placeholder="Select a sub category" options={[...subs]} />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-10 @4xl:col-start-1">
        <MediaBlock
          preview={cover ? <img src={cover} alt="Course cover preview" className="size-full object-cover" /> : <MediaPlaceholder path={IMAGE} label="No image" />}
          title="Cover Image"
          text={
            <>
              Upload your course image here. Supported files are .webp, .jpg, .jpeg, or .png. Best Size:(7:4 ratio) or <span className={`text-[#334155] ${fontSemi}`}>(580px × 330px)</span> See our{" "}
              <button type="button" onClick={onSupport} className={inlineLink}>
                image guidelines.
              </button>
            </>
          }
          canReset={!!draft.cover}
          onBrowse={() => coverInput.current?.click()}
          onReset={() => update({ cover: "" })}
        />
        <input ref={coverInput} type="file" hidden aria-label="Choose cover image" accept=".webp,.jpg,.jpeg,.png" onChange={(e) => pickCover(e.target.files?.[0])} />
        <MediaBlock
          preview={videoUrl ? <video src={videoUrl} controls aria-label="Promotional video preview" className="size-full bg-[#0f172a] object-contain" /> : <MediaPlaceholder path={VIDEO} label={draft.promoVideo?.name ?? "Video not available"} />}
          title="Promotional Video"
          text={
            <>
              Upload your course's promotional video here. Maximum of <span className={`text-[#334155] ${fontSemi}`}>{MAX_VIDEO_MB}MB</span>. See{" "}
              <button type="button" onClick={onSupport} className={inlineLink}>
                how to create video.
              </button>
            </>
          }
          canReset={!!draft.promoVideo}
          onBrowse={() => videoInput.current?.click()}
          onReset={() => {
            setVideoUrl("");
            update({ promoVideo: null });
          }}
        />
        <input ref={videoInput} type="file" hidden aria-label="Choose promotional video" accept="video/*" onChange={(e) => pickVideo(e.target.files?.[0])} />
      </div>
      <div className="@4xl:col-start-2 @4xl:row-start-2">
        <GuideCard
          title={guide.title}
          text={guide.text}
          linkLabel="Go to Support Center"
          onOpen={onSupport}
          icon={
            <span aria-hidden="true" className="text-[28px] leading-none">
              💡
            </span>
          }
          inlineIcon
        />
      </div>
    </div>
  );
}

const KIND_ICONS: Record<LectureKind, string> = {
  Video: PLAY,
  Quiz: QUIZ,
  Assignment: ASSIGNMENT,
  Article: ARTICLE,
};
const KINDS = Object.keys(KIND_ICONS) as LectureKind[];

const sectionDate = (date: Date) => {
  const day = date.getDate();
  const tens = day % 100;
  const suffix = tens >= 11 && tens <= 13 ? "th" : (["th", "st", "nd", "rd"][day % 10] ?? "th");
  return `${date.toLocaleDateString("en-US", { month: "short" })} ${day}${suffix}, ${date.getFullYear()}`;
};
// Counts past renamed and deleted rows, so two rows never get the same default name.
const nextNumber = (titles: string[], pattern: RegExp) => String(Math.max(titles.length, ...titles.map((t) => Number(t.match(pattern)?.[1] ?? 0))) + 1).padStart(3, "0");
const formatDuration = (seconds: number) => {
  const total = Math.round(seconds);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};
const lectureName = (lecture: Lecture) => lecture.title || `New ${lecture.kind === "Video" ? "video" : lecture.kind} Lecture`;

function DragHandle({ label, vertical, onDragStart }: { label: string; vertical?: boolean; onDragStart: (e: DragEvent<HTMLSpanElement>) => void }) {
  const dots = vertical ? [[5, 3], [11, 3], [5, 8], [11, 8], [5, 13], [11, 13]] : [[3, 5], [8, 5], [13, 5], [3, 11], [8, 11], [13, 11]];
  return (
    <span role="img" aria-label={label} title="Drag to reorder" draggable onDragStart={onDragStart} className="flex size-5 shrink-0 cursor-grab items-center justify-center text-[#94a3b8] transition hover:text-[#475569] active:cursor-grabbing">
      <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden="true">
        {dots.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.1" />
        ))}
      </svg>
    </span>
  );
}

function RowMenu({ label, items }: { label: string; items: ActionItem[] }) {
  return (
    <ActionMenu
      label={label}
      triggerClass="flex size-9 shrink-0 items-center justify-center rounded-[8px] text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#0f172a]"
      trigger={
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      }
      items={items}
    />
  );
}

function InlineTitle({ label, value, className, onDone }: { label: string; value: string; className: string; onDone: (next?: string) => void }) {
  const [text, setText] = useState(value);
  const commit = () => onDone(text.trim() || undefined);
  return (
    <input
      autoFocus
      aria-label={label}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") onDone();
      }}
      className={`field h-9 min-w-0 flex-1 ${className}`}
    />
  );
}

function CurriculumIntro({ onExplain, onSupport }: { onExplain: () => void; onSupport: () => void }) {
  const link = "underline transition hover:text-[#475569]";
  return (
    <div className="flex items-start gap-8">
      <p className={`min-w-0 flex-1 text-[16px] leading-[28px] text-[#1e293b] ${fontRegular}`}>
        Begin by organizing your course into sections,{" "}
        <button type="button" onClick={onExplain} className={link}>
          lectures
        </button>
        , and practice activities like{" "}
        <button type="button" onClick={onExplain} className={link}>
          quizzes
        </button>{" "}
        ,{" "}
        <button type="button" onClick={onExplain} className={link}>
          assignments
        </button>
        . Use your course outline to structure the content and clearly label each section.{" "}
        <button type="button" onClick={onSupport} className={`block ${link} ${fontSemi}`}>
          Learn more from our Support Center.
        </button>
      </p>
      <span aria-hidden="true" className="hidden size-[80px] shrink-0 items-center justify-center rounded-[8px] bg-[#eff6ff] text-[#0b3fb0] @lg:flex">
        <svg viewBox="0 0 48 40" className="h-10 w-12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 29V12a2 2 0 012-2h22M40 21v8" />
          <path d="M3 31h42v2a2 2 0 01-2 2H5a2 2 0 01-2-2zM20 31v1h8v-1" />
          <path d="M19 24c1-4 4-6 8-6v-3l6 5-6 5v-3c-3 0-5 .5-8 2z" fill="currentColor" />
          <rect x="33" y="3" width="13" height="14" rx="2" fill="currentColor" stroke="none" />
          <circle cx="39.5" cy="8" r="2" fill="#fff" stroke="none" />
          <path d="M36 14c.4-2 1.700-3 3.500-3s3.100 1 3.500 3z" fill="#fff" stroke="none" />
        </svg>
      </span>
    </div>
  );
}

function EmptyArt() {
  const rows = [
    { path: PLAY, left: "left-0", top: "top-3" },
    { path: QUIZ, left: "left-[30px]", top: "top-[52px]" },
    { path: ASSIGNMENT, left: "left-0", top: "top-[92px]" },
  ];
  return (
    <div aria-hidden="true" className="relative h-[130px] w-[172px]">
      <span className="absolute inset-y-0 left-[22px] w-[128px] rounded-[10px] bg-[#f1f5f9]" />
      {rows.map((row) => (
        <span key={row.path} className={`absolute flex w-[132px] items-center gap-2 ${row.left} ${row.top}`}>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[#334155] text-white">
            <Icon path={row.path} className="size-4" />
          </span>
          <span className="flex h-8 flex-1 flex-col justify-center gap-1.5 rounded-[4px] bg-white px-2">
            <span className="h-1 w-7 rounded-full bg-[#94a3b8]" />
            <span className="h-1 w-11 rounded-full bg-[#cbd5e1]" />
          </span>
        </span>
      ))}
    </div>
  );
}

function LectureDrawer({ lecture, uploadProgress, videoUrl, onCancel, onSave, onUpdateVideo, onLibrary }: { lecture: Lecture; uploadProgress?: number; videoUrl?: string; onCancel: () => void; onSave: (patch: Partial<Lecture>) => void; onUpdateVideo: () => void; onLibrary: () => void }) {
  const { notify } = useApp();
  const [title, setTitle] = useState(lecture.title);
  const [preview, setPreview] = useState(!!lecture.preview);
  const [description, setDescription] = useState(lecture.description ?? "");
  const [resources, setResources] = useState(lecture.resources ?? []);
  const [playing, setPlaying] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = uploadProgress !== undefined;
  const generate = () => notify("AI suggestions are coming soon");
  const aiLink = `flex items-center gap-1.5 text-[#6016fc] transition hover:opacity-70 ${fontMedium}`;
  const row = "grid gap-3 py-5 first:pt-0 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-8";
  const heading = `m-0 text-[16px] leading-[24px] text-[#334155] ${fontSemi}`;
  const hint = `mt-1 text-[14px] leading-[24px] text-[#64748b] ${fontRegular}`;
  const radio = `flex cursor-pointer items-center gap-2.5 text-[14px] leading-[22px] text-[#475569] ${fontRegular}`;

  return (
    <Shell title={`Edit ${lectureName(lecture)}`} variant="drawer" drawerWidth="max-w-[980px]" hideHeader onClose={onCancel}>
      <div className="flex min-h-full flex-col">
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-4 border-b border-[#e2e8f0] bg-white px-5 py-3 md:px-8">
          <div className="min-w-[220px] flex-1">
            <div className="flex items-center gap-3 px-2 text-[13px] leading-[20px]">
              <label htmlFor="lecture-title" className={`text-[#64748b] ${fontRegular}`}>
                Title
              </label>
              <button type="button" onClick={generate} className={aiLink}>
                <Icon path={SPARKLE} className="size-4" filled />
                Generate With AI
              </button>
            </div>
            <input id="lecture-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lecture title" className={`mt-0.5 h-8 w-full rounded-[4px] bg-[#f8fafc] px-2 text-[18px] leading-[24px] text-[#1e293b] outline-none focus:ring-2 focus:ring-[#cbd5e1] ${fontRegular}`} />
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onCancel} className={`h-10 rounded-[8px] border border-[#cbd5e1] bg-white px-5 text-[16px] leading-[20px] text-[#334155] transition hover:bg-[#f8fafc] ${fontMedium}`}>
              Cancel
            </button>
            <button type="button" onClick={() => onSave({ title: title.trim() || lecture.title, preview, description, resources })} className={`h-10 rounded-[8px] bg-[#1e293b] px-5 text-[16px] leading-[20px] text-white transition hover:bg-[#0f172a] ${fontMedium}`}>
              Save
            </button>
          </div>
        </div>
        <div className="flex flex-col divide-y divide-transparent px-5 py-6 md:px-8">
          {lecture.kind === "Video" && (
            <section className={row}>
              <div>
                <h3 className={heading}>File</h3>
                <p className={hint}>Keep your video size Maximum of {MAX_LECTURE_VIDEO_MB}MB</p>
              </div>
              <div className="min-w-0">
                {playing && videoUrl ? (
                  <video src={videoUrl} controls autoPlay aria-label="Lecture video" className="aspect-video w-full rounded-[8px] bg-[#0f172a]" />
                ) : (
                  <div className="flex items-center gap-4">
                    <button type="button" aria-label="Play video" title={busy ? "You can play it when processing is complete" : videoUrl ? "Play video" : "This video can only be previewed in the session it was uploaded"} disabled={busy || !videoUrl} onClick={() => setPlaying(true)} className="relative flex h-[70px] w-[116px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#1e1b4b] text-white disabled:cursor-not-allowed">
                      {videoUrl && <video src={videoUrl} preload="metadata" muted aria-hidden="true" tabIndex={-1} className="absolute inset-0 size-full object-cover" />}
                      <span className="relative flex">
                        <Icon path={PLAY} className="size-8" />
                      </span>
                    </button>
                    <div className="min-w-0">
                      <p className={`truncate text-[16px] leading-[24px] text-[#334155] ${fontRegular}`}>{lecture.file ?? "No video yet"}</p>
                      {lecture.duration && <p className={`mt-1 text-[14px] leading-[20px] text-[#94a3b8] ${fontRegular}`}>{lecture.duration}m</p>}
                    </div>
                  </div>
                )}
                <div className="mt-4">
                  <ActionMenu
                    alignLeft
                    label="Update Video"
                    triggerClass={`flex h-10 items-center gap-3 rounded-[8px] bg-[#f1f5f9] px-3.5 text-[16px] leading-[20px] text-[#334155] transition hover:bg-[#e2e8f0] ${fontRegular}`}
                    trigger={
                      <>
                        Update Video
                        <Icon path={DOWN} className="size-4" />
                      </>
                    }
                    items={[
                      { label: "Upload a new video", onClick: onUpdateVideo },
                      { label: "Add from Library", onClick: onLibrary },
                    ]}
                  />
                </div>
                {busy && (
                  <p role="status" className={`mt-4 flex gap-3 rounded-[8px] border border-[#a7f3d0] bg-[#ecfdf5] px-4 py-2.5 text-[14px] italic leading-[22px] text-[#059669] ${fontMedium}`}>
                    <Icon path={BELL} className="mt-0.5 size-5 shrink-0" />
                    {uploadProgress < 100 ? `This video is uploading (${uploadProgress}%). You can play it when it's complete.` : "This video is currently being processed. You can play when it's complete."}
                  </p>
                )}
              </div>
            </section>
          )}
          <section className={row}>
            <div>
              <h3 className={heading}>Item Preview</h3>
              <p className={hint}>Choose where you want to be visible this lecture or not.</p>
            </div>
            <div className="flex flex-col gap-3 md:pt-1" role="radiogroup" aria-label="Item preview">
              <label className={radio}>
                <input type="radio" name="lecture-preview" checked={!preview} onChange={() => setPreview(false)} className="size-[18px] shrink-0 accent-[#334155]" />
                <span>
                  <span className={`text-[#334155] ${fontMedium}`}>Locked:</span> User can't view this lecture
                </span>
              </label>
              <label className={radio}>
                <input type="radio" name="lecture-preview" checked={preview} onChange={() => setPreview(true)} className="size-[18px] shrink-0 accent-[#334155]" />
                <span>
                  <span className={`text-[#334155] ${fontMedium}`}>Available for Preview:</span> User can view this lecture
                </span>
              </label>
            </div>
          </section>
          <section className={row}>
            <div>
              <h3 className={heading}>
                <label htmlFor="lecture-description">Description</label>
              </h3>
              <p className={hint}>It will help students to understand overview.</p>
            </div>
            <div className="min-w-0">
              <textarea id="lecture-description" rows={7} maxLength={LECTURE_DESCRIPTION_LIMIT} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Write here.." className="field leading-[24px]" />
              <div className="mt-1.5 flex items-center justify-between gap-3 text-[14px] leading-[20px]">
                <span className={`text-[12px] text-[#64748b] ${fontRegular}`}>
                  {description.length}/{LECTURE_DESCRIPTION_LIMIT}
                </span>
                <button type="button" onClick={generate} className={aiLink}>
                  <Icon path={SPARKLE} className="size-4" filled />
                  Generate With AI
                </button>
              </div>
            </div>
          </section>
          <section className={row}>
            <div>
              <h3 className={heading}>Downloadable Resources</h3>
              <p className={hint}>It support multiple file to add.</p>
            </div>
            <div className="min-w-0">
              {resources.length > 0 && (
                <ul className="mb-3 flex flex-col">
                  {resources.map((file) => (
                    <li key={file.id} className="group flex items-center gap-3 py-1">
                      <span aria-hidden="true" className="ml-1 size-1 shrink-0 rounded-full bg-[#334155]" />
                      <span className={`min-w-0 flex-1 truncate text-[14px] leading-[24px] text-[#1e293b] ${fontSemi}`}>{file.name}</span>
                      <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setResources(resources.filter((f) => f.id !== file.id))} className="flex size-8 shrink-0 items-center justify-center rounded-[6px] text-[#64748b] opacity-0 transition hover:bg-[#fef2f2] hover:text-[#dc2626] focus:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100">
                        <Icon path={TRASH} className="size-[18px]" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" onClick={() => fileRef.current?.click()} className={`flex h-10 items-center gap-2 rounded-[8px] bg-[#f1f5f9] px-3.5 text-[16px] leading-[20px] text-[#334155] transition hover:bg-[#e2e8f0] ${fontRegular}`}>
                <Icon path={PLUS} className="size-[18px]" />
                Attach File
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                hidden
                aria-label="Choose resource files"
                onChange={(e) => {
                  const picked = [...(e.target.files ?? [])].map((f) => ({ id: uid("resource"), name: f.name }));
                  setResources((list) => [...list, ...picked]);
                  e.target.value = "";
                }}
              />
            </div>
          </section>
        </div>
      </div>
    </Shell>
  );
}

const blankOption = (correct = false): QuizOption => ({ id: uid("option"), text: "", explanation: "", correct, saved: false });
const blankQuestion = (): QuizQuestion => ({ id: uid("question"), text: "", relatedLecture: "", required: false, randomise: false, multiple: false, options: [blankOption(true), blankOption()] });
const questionLabel = (question: QuizQuestion, index: number) => question.text.trim() || `Q${index + 1}. Untitled Mult. Choice - ${String(index + 1).padStart(3, "0")}`;

function ClipboardArt() {
  return (
    <svg viewBox="0 0 180 190" className="h-[160px] w-[152px] text-[#94a3b8]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 24l118-2 8 164-126 2z" strokeWidth="2" />
      <rect x="48" y="14" width="66" height="14" rx="2" fill="currentColor" stroke="none" />
      <circle cx="81" cy="10" r="4" />
      <path d="M38 46l6-6 30 92-8 4z" />
      <path d="M38 46l32 92" strokeWidth="3" />
      <path d="M86 150l26-20M92 154l22-18M98 166l40-2M98 174l36-1" strokeWidth="1" />
      <path d="M2 188h176M60 191h70" strokeWidth="2.500" />
    </svg>
  );
}

function OptionCard({ option, index, multiple, canDelete, draft, onDraft, onCorrect, onSave, onDiscard, onDelete, onEdit, onAi }: { option: QuizOption; index: number; multiple: boolean; canDelete: boolean; draft?: { text: string; explanation: string }; onDraft: (next: { text: string; explanation: string }) => void; onCorrect: () => void; onSave: () => void; onDiscard: () => void; onDelete: () => void; onEdit: () => void; onAi: () => void }) {
  const letter = String.fromCharCode(65 + index);
  const open = !option.saved || !!draft;
  const text = draft?.text ?? option.text;
  const explanation = draft?.explanation ?? option.explanation;
  const changed = !!draft && (draft.text !== option.text || draft.explanation !== option.explanation);
  const mark = (
    <button type="button" role={multiple ? "checkbox" : "radio"} aria-checked={option.correct} aria-label={`Mark option ${letter} as correct`} onClick={onCorrect} className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border transition ${option.correct ? "border-[#10b981] bg-[#10b981] text-white" : "border-[#94a3b8] bg-[#f1f5f9] hover:border-[#475569]"}`}>
      {option.correct && <Icon path="M6 12.500l4 4 8-9" className="size-3.5" />}
    </button>
  );
  const badge = (tint: string) => (
    <div className="flex items-center gap-2">
      <span className={`flex size-8 items-center justify-center rounded-[6px] text-[14px] leading-[20px] text-[#1e293b] ${tint} ${fontSemi}`}>{letter}</span>
      {option.correct && <span className={`text-[13px] leading-[18px] text-[#059669] ${fontSemi}`}>Correct Ans.</span>}
    </div>
  );
  return (
    <li className="flex items-start gap-3 sm:gap-4">
      <span className="flex w-[18px] shrink-0 justify-center pt-2">{(open || option.correct) && mark}</span>
      {open ? (
        <div className={`min-w-0 flex-1 rounded-[12px] border bg-white p-4 sm:p-5 ${option.correct ? "border-[#10b981]" : "border-[#334155]"}`}>
          <div className="flex items-center justify-between gap-2">
            {badge("bg-[#f1f5f9]")}
            <button type="button" aria-label={`Suggest option ${letter} with AI`} title="Suggest with AI" onClick={onAi} className="flex p-1 text-[#6016fc] transition hover:opacity-70">
              <Icon path={SPARKLE} className="size-[18px]" />
            </button>
          </div>
          <input aria-label={`Option ${letter} answer`} value={text} onChange={(e) => onDraft({ text: e.target.value, explanation })} placeholder="Your answer" className={`field mt-4 h-[36px] ${text ? fontMedium : ""}`} />
          <textarea aria-label={`Option ${letter} explanation`} rows={3} value={explanation} onChange={(e) => onDraft({ text, explanation: e.target.value })} placeholder="Explain why this option is correct or incorrect(Optional)" className="field mt-3 leading-[24px]" />
          <div className="mt-3 flex justify-end gap-3">
            {changed ? (
              <button type="button" onClick={onDiscard} className={`h-9 rounded-[8px] border border-[#cbd5e1] bg-white px-4 text-[14px] leading-[20px] text-[#334155] transition hover:bg-[#f8fafc] ${fontRegular}`}>
                Discard
              </button>
            ) : (
              <button type="button" disabled={!canDelete} title={canDelete ? undefined : "A question needs at least two options"} onClick={onDelete} className={`h-9 rounded-[8px] border border-[#cbd5e1] bg-white px-4 text-[14px] leading-[20px] text-[#334155] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50 ${fontRegular}`}>
                Delete
              </button>
            )}
            <button type="button" onClick={onSave} className={`h-9 rounded-[8px] bg-[#f1f5f9] px-5 text-[14px] leading-[20px] text-[#1e293b] transition hover:bg-[#e2e8f0] ${fontRegular}`}>
              Save
            </button>
          </div>
        </div>
      ) : (
        <button type="button" aria-label={`Edit option ${letter}`} onClick={onEdit} className={`min-w-0 flex-1 rounded-[12px] border p-4 text-left transition sm:p-5 ${option.correct ? "border-[#10b981] bg-[#ecf8f3] hover:bg-[#e3f5ed]" : "border-[#f1f5f9] bg-white hover:border-[#cbd5e1]"}`}>
          {badge(option.correct ? "bg-white" : "bg-[#f1f5f9]")}
          <span className={`mt-3 block text-[14px] leading-[22px] text-[#1e293b] ${fontMedium}`}>{option.text}</span>
          {option.explanation && <span className={`mt-1.5 block text-[14px] leading-[24px] text-[#475569] ${fontRegular}`}>{option.explanation}</span>}
        </button>
      )}
    </li>
  );
}

function QuizDrawer({ lecture, lectureOptions, onCancel, onSave }: { lecture: Lecture; lectureOptions: { id: string; label: string }[]; onCancel: () => void; onSave: (patch: Partial<Lecture>) => void }) {
  const { notify } = useApp();
  const [title, setTitle] = useState(lecture.title);
  const [questions, setQuestions] = useState<QuizQuestion[]>(lecture.questions ?? []);
  const [settings, setSettings] = useState<QuizSettings>(lecture.quizSettings ?? { passScore: "", retakes: true, shuffle: false });
  const [activeId, setActiveId] = useState(lecture.questions?.[0]?.id ?? "");
  const [tab, setTab] = useState<"overview" | "settings">("overview");
  const [panelOpen, setPanelOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, { text: string; explanation: string }>>({});
  const [committed, setCommitted] = useState<Record<string, QuizQuestion>>(() => Object.fromEntries((lecture.questions ?? []).map((q) => [q.id, q])));
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [removingId, setRemovingId] = useState("");
  const activeIndex = questions.findIndex((q) => q.id === activeId);
  const active = questions[activeIndex];
  const ai = () => notify("AI suggestions are coming soon");
  const dirty = title !== lecture.title || JSON.stringify(questions) !== JSON.stringify(lecture.questions ?? []) || JSON.stringify(settings) !== JSON.stringify(lecture.quizSettings ?? { passScore: "", retakes: true, shuffle: false }) || Object.keys(drafts).length > 0;
  const close = () => (dirty ? setConfirmLeave(true) : onCancel());
  const patchActive = (patch: Partial<QuizQuestion>) => setQuestions((list) => list.map((q) => (q.id === activeId ? { ...q, ...patch } : q)));
  const clearDraft = (id: string) =>
    setDrafts((all) => {
      const { [id]: _gone, ...rest } = all;
      return rest;
    });

  const addQuestion = () => {
    const question = blankQuestion();
    setQuestions((list) => [...list, question]);
    setActiveId(question.id);
  };
  const removeQuestion = (id: string) => {
    const index = questions.findIndex((q) => q.id === id);
    const next = questions.filter((q) => q.id !== id);
    setQuestions(next);
    if (id === activeId) setActiveId(next[Math.min(index, next.length - 1)]?.id ?? "");
    setRemovingId("");
  };
  const setCorrect = (optionId: string) => {
    if (!active) return;
    if (!active.multiple) return patchActive({ options: active.options.map((o) => ({ ...o, correct: o.id === optionId })) });
    const target = active.options.find((o) => o.id === optionId);
    if (target?.correct && active.options.filter((o) => o.correct).length === 1) return notify("Keep at least one correct answer");
    patchActive({ options: active.options.map((o) => (o.id === optionId ? { ...o, correct: !o.correct } : o)) });
  };
  const saveOption = (option: QuizOption) => {
    const text = (drafts[option.id]?.text ?? option.text).trim();
    if (!text) return notify("Write an answer first");
    patchActive({ options: active.options.map((o) => (o.id === option.id ? { ...o, text, explanation: (drafts[option.id]?.explanation ?? o.explanation).trim(), saved: true } : o)) });
    clearDraft(option.id);
  };
  const deleteOption = (option: QuizOption) => {
    const options = active.options.filter((o) => o.id !== option.id);
    if (!options.some((o) => o.correct)) options[0] = { ...options[0], correct: true };
    patchActive({ options });
    clearDraft(option.id);
  };
  const toggleMultiple = () => {
    if (!active) return;
    if (active.multiple) {
      const firstCorrect = active.options.find((o) => o.correct)?.id;
      patchActive({ multiple: false, options: active.options.map((o) => ({ ...o, correct: o.id === firstCorrect })) });
    } else patchActive({ multiple: true });
  };
  const allOptionsSaved = !!active && active.options.every((o) => o.saved && !drafts[o.id]);
  const saveQuestion = () => {
    if (!active.text.trim()) return notify("Write the question first");
    setCommitted((all) => ({ ...all, [active.id]: active }));
    notify("Question saved");
  };
  const cancelQuestion = () => {
    const fresh = blankQuestion();
    patchActive(committed[active.id] ? committed[active.id] : { ...fresh, id: active.id });
  };
  const saveAll = () => {
    const flushed = questions.map((q) => ({ ...q, options: q.options.map((o) => (drafts[o.id]?.text.trim() ? { ...o, text: drafts[o.id].text.trim(), explanation: drafts[o.id].explanation.trim(), saved: true } : o)) }));
    onSave({ title: title.trim() || lecture.title, questions: flushed, quizSettings: settings });
  };

  const tabButton = (key: "overview" | "settings", label: string) => (
    <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`-mb-px h-10 border-b-2 px-5 text-[15px] leading-[20px] transition ${tab === key ? `border-[#faa104] text-[#1e293b] ${fontMedium}` : `border-transparent text-[#64748b] hover:text-[#1e293b] ${fontRegular}`}`}>
      {label}
    </button>
  );

  return (
    <Shell title={`Edit ${lectureName(lecture)}`} variant="drawer" drawerWidth="xl:max-w-[80vw]" hideHeader onClose={close}>
      <div className="@container flex min-h-full flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[#e2e8f0] bg-white px-4 pt-3 @3xl:px-6">
          <div className="min-w-[180px] flex-1 pb-3">
            <div className="flex items-center gap-3">
              <label htmlFor="quiz-title" className={`text-[13px] leading-[20px] text-[#64748b] ${fontRegular}`}>
                Title
              </label>
              <button type="button" aria-label="Suggest quiz title with AI" title="Suggest with AI" onClick={ai} className="flex text-[#6016fc] transition hover:opacity-70">
                <Icon path={SPARKLE} className="size-[18px]" filled />
              </button>
              <button type="button" aria-label="Restore saved quiz title" title="Restore last saved title" disabled={title === lecture.title} onClick={() => setTitle(lecture.title)} className="flex text-[#64748b] transition hover:text-[#1e293b] disabled:cursor-not-allowed disabled:text-[#cbd5e1]">
                <Icon path={HISTORY} className="size-[18px]" />
              </button>
            </div>
            <input id="quiz-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quiz title" className={`mt-0.5 w-full rounded-[4px] bg-transparent text-[18px] leading-[26px] text-[#0f172a] outline-none focus:bg-[#f8fafc] ${fontSemi}`} />
          </div>
          <div role="tablist" aria-label="Quiz" className="order-last flex w-full justify-center @3xl:order-none @3xl:w-auto">
            {tabButton("overview", "Overview")}
            {tabButton("settings", "Settings")}
          </div>
          <div className="flex flex-1 items-center justify-end gap-3 self-center pb-2">
            <button type="button" onClick={close} className={`h-9 rounded-[8px] border border-[#cbd5e1] bg-white px-4 text-[14px] leading-[20px] text-[#334155] transition hover:bg-[#f8fafc] ${fontRegular}`}>
              Cancel
            </button>
            <button type="button" onClick={saveAll} className={`h-9 rounded-[8px] bg-[#1e293b] px-4 text-[14px] leading-[20px] text-white transition hover:bg-[#0f172a] ${fontMedium}`}>
              Save all
            </button>
          </div>
        </header>

        {tab === "settings" ? (
          <div className="mx-auto flex w-full max-w-[560px] flex-col gap-6 px-4 py-8">
            <TextField id="quiz-pass" label="Passing score (%)" type="number" value={settings.passScore} onChange={(passScore) => setSettings((v) => ({ ...v, passScore }))} placeholder="e.g. 70" hint="Leave empty if students don't need a minimum score." />
            <div className="flex items-center gap-3">
              <Toggle on={settings.retakes} label="Allow retakes" onChange={() => setSettings((v) => ({ ...v, retakes: !v.retakes }))} />
              <span className={`text-[14px] leading-[20px] text-[#334155] ${fontRegular}`}>Allow retakes</span>
            </div>
            <div className="flex items-center gap-3">
              <Toggle on={settings.shuffle} label="Shuffle question order" onChange={() => setSettings((v) => ({ ...v, shuffle: !v.shuffle }))} />
              <span className={`text-[14px] leading-[20px] text-[#334155] ${fontRegular}`}>Shuffle question order</span>
            </div>
          </div>
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <ClipboardArt />
            <h3 className={`m-0 mt-6 text-[20px] leading-[28px] text-[#1e293b] ${fontSemi}`}>No Questions Yet.</h3>
            <p className={`mt-3 max-w-[500px] text-[16px] leading-[28px] text-[#475569] ${fontRegular}`}>Start building your quiz by adding the first question. You can add multiple question types and customize them as needed.</p>
            <button type="button" onClick={addQuestion} className={`mt-8 flex h-12 items-center gap-3 rounded-[8px] bg-[#ffb20d] px-8 text-[16px] leading-[20px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
              <Icon path={PLUS} className="size-[18px]" />
              Add first question
            </button>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col @4xl:flex-row">
            <aside className="shrink-0 border-b border-[#e2e8f0] p-4 @4xl:w-[300px] @4xl:border-b-0 @4xl:border-r @4xl:p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className={`m-0 text-[18px] leading-[26px] text-[#334155] ${fontSemi}`}>Questions</h3>
                <button type="button" onClick={addQuestion} className={`flex h-9 items-center gap-1.5 rounded-[8px] bg-[#ffb20d] px-3 text-[14px] leading-[20px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
                  <Icon path={PLUS} className="size-4" />
                  Add New
                </button>
              </div>
              <ul className="mt-5 flex flex-col gap-3">
                {questions.map((question, i) => {
                  const selected = question.id === activeId;
                  return (
                    <li key={question.id} className="flex items-start gap-1">
                      <button type="button" aria-current={selected ? "true" : undefined} onClick={() => setActiveId(question.id)} className="flex min-w-0 flex-1 items-start gap-2.5 rounded-[6px] py-0.5 text-left">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-[6px] bg-[#f1f5f9] text-[#64748b]">
                          <Icon path={QUESTION} className="size-3.5" />
                        </span>
                        <span className={`line-clamp-2 text-[14px] leading-[20px] ${selected ? `text-[#1e293b] ${fontSemi}` : `text-[#64748b] ${fontRegular}`}`}>{questionLabel(question, i)}</span>
                      </button>
                      <RowMenu
                        label={`More actions for question ${i + 1}`}
                        items={[
                          {
                            label: "Duplicate",
                            onClick: () => {
                              const copy = { ...question, id: uid("question"), options: question.options.map((o) => ({ ...o, id: uid("option") })) };
                              setQuestions((list) => [...list.slice(0, i + 1), copy, ...list.slice(i + 1)]);
                              setActiveId(copy.id);
                            },
                          },
                          { label: "Move up", disabled: i === 0, onClick: () => setQuestions((list) => move(list, i, -1)) },
                          { label: "Move down", disabled: i === questions.length - 1, onClick: () => setQuestions((list) => move(list, i, 1)) },
                          { label: "Delete question", danger: true, onClick: () => setRemovingId(question.id) },
                        ]}
                      />
                    </li>
                  );
                })}
              </ul>
            </aside>
            {active && (
              <>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex-1 p-4 @4xl:p-5">
                    <label htmlFor="quiz-related" className={`block text-[14px] leading-[20px] text-[#334155] ${fontRegular}`}>
                      Related Lecture(Optional)
                    </label>
                    <p className={`mt-1 text-[12px] leading-[18px] text-[#94a3b8] ${fontRegular}`}>Select the lecture most relevant to your quiz.</p>
                    <select id="quiz-related" value={active.relatedLecture} onChange={(e) => patchActive({ relatedLecture: e.target.value })} className="field mt-2 h-10">
                      <option value="">Select a lecture</option>
                      {lectureOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={ai} className={`mt-3 flex h-9 items-center gap-2 rounded-[6px] bg-gradient-to-r from-[#7c3aed] to-[#4f1fe0] px-3 text-[14px] leading-[20px] text-white transition hover:opacity-90 ${fontMedium}`}>
                      <Icon path={SPARKLE} className="size-[18px]" filled />
                      Generate Set with AI
                    </button>
                    <div className="mt-8">
                      <div className="flex items-end justify-between gap-3">
                        <label htmlFor="quiz-question" className={`rounded-t-[8px] bg-[#f1f5f9] px-4 pb-1 pt-2 text-[14px] leading-[20px] text-[#1e293b] ${fontSemi}`}>
                          Question
                        </label>
                        <button type="button" onClick={ai} className={`flex items-center gap-1.5 pb-1 text-[14px] leading-[20px] text-[#6016fc] transition hover:opacity-70 ${fontMedium}`}>
                          <Icon path={SPARKLE} className="size-[18px]" />
                          Generate With AI
                        </button>
                      </div>
                      <div className="rounded-[0_8px_8px_8px] bg-[#f1f5f9] p-2">
                        <div className="flex h-12 items-center gap-2 rounded-[8px] border border-transparent bg-white px-4 focus-within:border-[#334155]">
                          <input id="quiz-question" value={active.text} onChange={(e) => patchActive({ text: e.target.value })} placeholder="Write question here" className={`min-w-0 flex-1 bg-transparent text-[18px] leading-[24px] text-[#1e293b] outline-none placeholder:text-[#94a3b8] ${fontRegular}`} />
                          {active.text && (
                            <button type="button" aria-label="Clear question" onClick={() => patchActive({ text: "" })} className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#cbd5e1] text-white transition hover:bg-[#94a3b8]">
                              <Icon path={CLOSE} className="size-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-6">
                      <p className={`m-0 inline-block rounded-t-[8px] border border-b-0 border-[#f1f5f9] bg-[#f8fafc] px-4 pb-1 pt-2 text-[14px] leading-[20px] text-[#1e293b] ${fontSemi}`}>Options</p>
                      <div className="rounded-[0_8px_8px_8px] border border-[#f1f5f9] bg-[#f8fafc] p-3 sm:p-4">
                        <ol role={active.multiple ? "group" : "radiogroup"} aria-label="Answer options" className="flex flex-col gap-4">
                          {active.options.map((option, i) => (
                            <OptionCard
                              key={option.id}
                              option={option}
                              index={i}
                              multiple={active.multiple}
                              canDelete={active.options.length > 2}
                              draft={drafts[option.id]}
                              onDraft={(next) => setDrafts((all) => ({ ...all, [option.id]: next }))}
                              onCorrect={() => setCorrect(option.id)}
                              onSave={() => saveOption(option)}
                              onDiscard={() => clearDraft(option.id)}
                              onDelete={() => deleteOption(option)}
                              onEdit={() => setDrafts((all) => ({ ...all, [option.id]: { text: option.text, explanation: option.explanation } }))}
                              onAi={ai}
                            />
                          ))}
                        </ol>
                        <button type="button" onClick={() => patchActive({ options: [...active.options, blankOption()] })} className={`mt-4 flex h-9 items-center gap-2 text-[14px] leading-[20px] text-[#334155] transition hover:text-[#0f172a] ${fontRegular}`}>
                          <Icon path={PLUS} className="size-5" />
                          Add Option
                        </button>
                      </div>
                    </div>
                  </div>
                  {allOptionsSaved && (
                    <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[#e2e8f0] bg-white px-4 py-3 @4xl:px-5">
                      <button type="button" onClick={cancelQuestion} className={`h-10 rounded-[8px] border border-[#cbd5e1] bg-white px-5 text-[14px] leading-[20px] text-[#334155] transition hover:bg-[#f8fafc] ${fontRegular}`}>
                        Cancel
                      </button>
                      <button type="button" onClick={saveQuestion} className={`h-10 rounded-[8px] bg-[#1e293b] px-5 text-[14px] leading-[20px] text-white transition hover:bg-[#0f172a] ${fontMedium}`}>
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
                <aside className={`relative shrink-0 border-t border-[#e2e8f0] bg-[#f8fafc] @4xl:border-l @4xl:border-t-0 ${panelOpen ? "@4xl:w-[260px]" : "@4xl:w-[56px]"}`}>
                  <button type="button" aria-label={panelOpen ? "Hide question settings" : "Show question settings"} aria-expanded={panelOpen} onClick={() => setPanelOpen((v) => !v)} className="absolute right-2 top-3 flex size-9 items-center justify-center rounded-[8px] bg-white text-[#334155] transition hover:bg-[#f1f5f9]">
                    <Icon path={PANEL} className="size-5" />
                  </button>
                  {panelOpen ? (
                    <div className="p-4 pt-16">
                      <h4 className={`m-0 text-[14px] leading-[20px] text-[#1e293b] ${fontSemi}`}>Question Type</h4>
                      <p className={`mt-3 flex items-center gap-2 text-[14px] leading-[20px] text-[#334155] ${fontRegular}`}>
                        <span className="flex size-6 items-center justify-center rounded-[6px] bg-[#f1f5f9] text-[#64748b]">
                          <Icon path={QUESTION} className="size-3.5" />
                        </span>
                        Multiple choice
                      </p>
                      <hr className="my-5 border-[#e2e8f0]" />
                      <h4 className={`m-0 text-[14px] leading-[20px] text-[#1e293b] ${fontSemi}`}>Conditions</h4>
                      <div className="mt-3 flex flex-col gap-3">
                        {[
                          { label: "Ans Required", on: active.required, change: () => patchActive({ required: !active.required }) },
                          { label: "Randomise Choice", on: active.randomise, change: () => patchActive({ randomise: !active.randomise }) },
                          { label: "Multiple Correct Answer", on: active.multiple, change: toggleMultiple },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center gap-2.5">
                            <Toggle on={item.on} label={item.label} onChange={item.change} />
                            <span className={`text-[14px] leading-[20px] text-[#334155] ${fontRegular}`}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-[60px] @4xl:h-auto" />
                  )}
                </aside>
              </>
            )}
          </div>
        )}
      </div>
      {confirmLeave && <ConfirmDialog title="Discard your quiz changes?" body="Anything you changed since opening this quiz will be lost." confirmLabel="Discard changes" onClose={() => setConfirmLeave(false)} onConfirm={onCancel} />}
      {removingId && <ConfirmDialog title="Delete this question?" body="This question and its options will be removed from the quiz." confirmLabel="Delete" onClose={() => setRemovingId("")} onConfirm={() => removeQuestion(removingId)} />}
    </Shell>
  );
}

type DragItem = { type: "section"; id: string } | { type: "lecture"; id: string; sectionId: string };

function CurriculumSection({ draft, update, onExplain, onSupport, uploads }: SectionProps & { onSupport: () => void; uploads: Uploads }) {
  const { notify } = useApp();
  const sections = draft.curriculum;
  const latest = useRef(sections);
  latest.current = sections;
  const fileRef = useRef<HTMLInputElement>(null);
  const dragging = useRef<DragItem | null>(null);
  const [dropId, setDropId] = useState("");
  const [adding, setAdding] = useState<{ sectionId: string; step: "types" | "video" } | null>(null);
  const [renaming, setRenaming] = useState("");
  const [library, setLibrary] = useState<{ sectionId?: string; lectureId?: string } | null>(null);
  const [editingId, setEditingId] = useState("");
  const pickTarget = useRef<{ sectionId?: string; lectureId?: string }>({});
  const [removing, setRemoving] = useState<{ title: string; body: string; run: () => void } | null>(null);
  const setSections = (curriculum: CourseSection[]) => update({ curriculum });
  const patchSection = (id: string, patch: Partial<CourseSection>) => setSections(latest.current.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const addSection = () => {
    const section = { id: uid("section"), title: `Section ${nextNumber(sections.map((s) => s.title), /^Section (\d+)/)} - ${sectionDate(new Date())}`, lectures: [] };
    setSections([...sections, section]);
    setAdding({ sectionId: section.id, step: "types" });
  };

  const patchLecture = (id: string, patch: Partial<Lecture>) => setSections(latest.current.map((s) => ({ ...s, lectures: s.lectures.map((l) => (l.id === id ? { ...l, ...patch } : l)) })));

  const addLecture = (sectionId: string, kind: LectureKind, video?: { file: string; duration?: string }) => {
    const section = latest.current.find((s) => s.id === sectionId);
    if (!section) return "";
    const id = uid("lecture");
    const name = kind === "Video" ? "video" : kind;
    const number = nextNumber(section.lectures.filter((l) => l.kind === kind).map((l) => l.title), new RegExp(`^New ${name} Lecture - (\\d+)`));
    patchSection(sectionId, { lectures: [...section.lectures, { id, title: `New ${name} Lecture - ${number}`, kind, ...video }] });
    setAdding(null);
    return id;
  };

  const chooseVideo = (target: { sectionId?: string; lectureId?: string }) => {
    pickTarget.current = target;
    fileRef.current?.click();
  };
  const pickVideo = (file?: File) => {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/")) return notify("Choose a video file");
    if (file.size > MAX_LECTURE_VIDEO_MB * 1024 * 1024) return notify(`Videos must be under ${MAX_LECTURE_VIDEO_MB} MB`);
    const { sectionId, lectureId } = pickTarget.current;
    if (lectureId) patchLecture(lectureId, { file: file.name, duration: undefined });
    const id = lectureId ?? (sectionId ? addLecture(sectionId, "Video", { file: file.name }) : "");
    if (id) uploads.start(file, id);
  };

  const libraryVideos = () => {
    const stored = Object.values(load<Record<string, StoredDetails>>(COURSE_DETAILS_KEY, {})).flatMap((d) => d.curriculum ?? []);
    const seen = new Map<string, Lecture>();
    [...sections, ...stored].forEach((s) => s.lectures.forEach((l) => l.file && !seen.has(l.file) && seen.set(l.file, l)));
    return [...seen.values()];
  };

  const moveLectureBy = (section: CourseSection, index: number, by: number) => patchSection(section.id, { lectures: move(section.lectures, index, by) });
  const dropOnSection = (targetId: string) => {
    const item = dragging.current;
    if (!item) return;
    if (item.type === "section") {
      const from = sections.findIndex((s) => s.id === item.id);
      const to = sections.findIndex((s) => s.id === targetId);
      if (from !== to) setSections(move(sections, from, to - from));
    } else if (item.sectionId !== targetId) {
      const lecture = sections.find((s) => s.id === item.sectionId)?.lectures.find((l) => l.id === item.id);
      if (lecture) setSections(sections.map((s) => (s.id === item.sectionId ? { ...s, lectures: s.lectures.filter((l) => l.id !== item.id) } : s.id === targetId ? { ...s, lectures: [...s.lectures, lecture] } : s)));
    }
  };
  const dropOnLecture = (targetSectionId: string, targetId: string) => {
    const item = dragging.current;
    if (item?.type !== "lecture" || item.id === targetId) return;
    const lecture = sections.find((s) => s.id === item.sectionId)?.lectures.find((l) => l.id === item.id);
    if (!lecture) return;
    if (item.sectionId === targetSectionId) {
      const list = sections.find((s) => s.id === targetSectionId)?.lectures ?? [];
      const from = list.findIndex((l) => l.id === item.id);
      patchSection(targetSectionId, { lectures: move(list, from, list.findIndex((l) => l.id === targetId) - from) });
      return;
    }
    setSections(
      sections.map((s) => {
        if (s.id === item.sectionId) return { ...s, lectures: s.lectures.filter((l) => l.id !== item.id) };
        if (s.id !== targetSectionId) return s;
        const lectures = [...s.lectures];
        lectures.splice(lectures.findIndex((l) => l.id === targetId), 0, lecture);
        return { ...s, lectures };
      }),
    );
  };
  const startDrag = (item: DragItem, row: HTMLElement | null, e: DragEvent<HTMLSpanElement>) => {
    dragging.current = item;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item.id);
    if (row) e.dataTransfer.setDragImage(row, 16, 16);
  };
  const endDrag = () => {
    dragging.current = null;
    setDropId("");
  };

  const closeButton = "flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-[#f8fafc] text-[#1e293b] transition hover:bg-[#f1f5f9]";
  const editing = sections.flatMap((s) => s.lectures).find((l) => l.id === editingId);
  const helper = `text-center text-[16px] leading-[28px] text-[#334155] ${fontRegular}`;
  const helperLink = `underline transition hover:text-[#475569] ${fontSemi}`;
  const dashed = `flex h-[54px] min-w-0 flex-1 items-center justify-center gap-2.5 rounded-[8px] border border-dashed border-[#475569] bg-white px-3 text-[16px] leading-[24px] text-[#1e293b] transition hover:bg-[#f8fafc] ${fontRegular}`;

  return (
    <div className="max-w-[830px]">
      <CurriculumIntro onExplain={onExplain} onSupport={onSupport} />
      <input ref={fileRef} type="file" hidden aria-label="Choose lecture video" accept="video/*" onChange={(e) => pickVideo(e.target.files?.[0])} />
      {sections.length === 0 ? (
        <div className="mt-14 flex flex-col items-center gap-6 text-center">
          <EmptyArt />
          <h2 className={`m-0 text-[22px] leading-[30px] text-[#27272a] ${fontSemi}`}>No lecture Created Yet</h2>
          <button type="button" onClick={addSection} className={`flex h-12 items-center gap-3 rounded-[8px] border border-[#1e293b] bg-white px-6 text-[16px] leading-[24px] text-[#1e293b] transition hover:bg-[#f8fafc] ${fontRegular}`}>
            <Icon path={PLUS} className="size-5" />
            Create your first lecture
          </button>
        </div>
      ) : (
        <>
          <ol className="mt-10 flex flex-col gap-5">
            {sections.map((section, i) => {
              const title = section.title || `Section ${String(i + 1).padStart(3, "0")}`;
              const step = adding?.sectionId === section.id ? adding.step : section.lectures.length === 0 ? "types" : null;
              const sectionItems: ActionItem[] = [
                { label: "Add lecture", onClick: () => setAdding({ sectionId: section.id, step: "types" }) },
                { label: "Move up", disabled: i === 0, onClick: () => setSections(move(sections, i, -1)) },
                { label: "Move down", disabled: i === sections.length - 1, onClick: () => setSections(move(sections, i, 1)) },
                { label: "Delete section", danger: true, onClick: () => (section.lectures.length ? setRemoving({ title: "Delete this section?", body: `"${title}" and its ${section.lectures.length} ${section.lectures.length === 1 ? "lecture" : "lectures"} will be removed.`, run: () => setSections(latest.current.filter((s) => s.id !== section.id)) }) : setSections(sections.filter((s) => s.id !== section.id))) },
              ];
              return (
                <li
                  key={section.id}
                  data-section={section.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropId(section.id);
                  }}
                  onDragLeave={() => setDropId((id) => (id === section.id ? "" : id))}
                  onDrop={(e) => {
                    e.preventDefault();
                    dropOnSection(section.id);
                    endDrag();
                  }}
                  onDragEnd={endDrag}
                  className={`rounded-[16px] border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-colors sm:px-5 ${dropId === section.id ? "border-[#faa104]" : "border-[#e2e8f0]"}`}
                >
                  <div className="flex items-center gap-3">
                    <DragHandle label={`Drag ${title}`} onDragStart={(e) => startDrag({ type: "section", id: section.id }, e.currentTarget.closest("li"), e)} />
                    {renaming === section.id ? (
                      <InlineTitle
                        label="Section title"
                        value={section.title}
                        className="max-w-[420px]"
                        onDone={(next) => {
                          if (next) patchSection(section.id, { title: next });
                          setRenaming("");
                        }}
                      />
                    ) : (
                      <h2 className={`m-0 min-w-0 flex-1 text-[18px] leading-[28px] text-[#1e293b] ${fontSemi}`}>{title}</h2>
                    )}
                    {renaming === section.id && <span className="flex-1" />}
                    <button type="button" aria-label={`Rename ${title}`} title="Rename" onClick={() => setRenaming(section.id)} className={iconButton}>
                      <Icon path={PENCIL} className="size-[18px]" />
                    </button>
                    {section.lectures.length > 0 && step ? (
                      <button type="button" aria-label={`Stop adding a lecture to ${title}`} title="Close" onClick={() => setAdding(null)} className={closeButton}>
                        <Icon path={CLOSE} className="size-5" />
                      </button>
                    ) : section.lectures.length === 0 && sections.length > 1 ? (
                      <button
                        type="button"
                        aria-label={`Remove ${title}`}
                        title="Remove section"
                        onClick={() => {
                          setSections(sections.filter((s) => s.id !== section.id));
                          setAdding(null);
                        }}
                        className={closeButton}
                      >
                        <Icon path={CLOSE} className="size-5" />
                      </button>
                    ) : (
                      <RowMenu label={`More actions for ${title}`} items={sectionItems} />
                    )}
                  </div>
                  {section.lectures.length > 0 && (
                    <ol className="mt-3 flex flex-col gap-1">
                      {section.lectures.map((lecture, j) => {
                        const name = lectureName(lecture);
                        const lectureItems: ActionItem[] = [
                          { label: "Edit lecture", onClick: () => setEditingId(lecture.id) },
                          { label: "Rename", onClick: () => setRenaming(lecture.id) },
                          { label: "Move up", disabled: j === 0, onClick: () => moveLectureBy(section, j, -1) },
                          { label: "Move down", disabled: j === section.lectures.length - 1, onClick: () => moveLectureBy(section, j, 1) },
                          { label: "Delete lecture", danger: true, onClick: () => setRemoving({ title: "Delete this lecture?", body: `"${name}" will be removed from this section.`, run: () => patchSection(section.id, { lectures: (latest.current.find((s) => s.id === section.id)?.lectures ?? []).filter((l) => l.id !== lecture.id) }) }) },
                        ];
                        return (
                          <li
                            key={lecture.id}
                            data-lecture={lecture.id}
                            onDragOver={(e) => {
                              if (dragging.current?.type !== "lecture") return;
                              e.preventDefault();
                              e.stopPropagation();
                              setDropId(lecture.id);
                            }}
                            onDrop={(e) => {
                              if (dragging.current?.type !== "lecture") return;
                              e.preventDefault();
                              e.stopPropagation();
                              dropOnLecture(section.id, lecture.id);
                              endDrag();
                            }}
                            className={`flex items-center gap-3 rounded-[8px] py-1 transition-colors ${dropId === lecture.id ? "bg-[#fff9f0]" : ""}`}
                          >
                            <DragHandle
                              vertical
                              label={`Drag ${name}`}
                              onDragStart={(e) => {
                                e.stopPropagation();
                                startDrag({ type: "lecture", id: lecture.id, sectionId: section.id }, e.currentTarget.closest("li"), e);
                              }}
                            />
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-[#f8fafc] text-[#334155]" title={lecture.kind}>
                              <Icon path={KIND_ICONS[lecture.kind]} className="size-5" />
                            </span>
                            {renaming === lecture.id ? (
                              <InlineTitle
                                label="Lecture title"
                                value={lecture.title}
                                className="max-w-[420px]"
                                onDone={(next) => {
                                  if (next) patchSection(section.id, { lectures: section.lectures.map((l) => (l.id === lecture.id ? { ...l, title: next } : l)) });
                                  setRenaming("");
                                }}
                              />
                            ) : (
                              <p className={`min-w-0 flex-1 text-[16px] leading-[24px] text-[#334155] md:text-[15px] ${fontRegular}`}>
                                <span className="sr-only">{lecture.kind}: </span>
                                <button type="button" onClick={() => setEditingId(lecture.id)} className="text-left transition hover:text-[#0f172a] hover:underline">
                                  {name}
                                </button>
                                <span className="text-[#94a3b8]">
                                  {uploads.progress[lecture.id] === undefined || uploads.progress[lecture.id] === 100 ? lecture.duration && ` • ${lecture.duration}` : ` • ${uploads.progress[lecture.id]}%`}
                                  {uploads.progress[lecture.id] === 100 && " • Processing.."}
                                  {lecture.kind === "Quiz" && !!lecture.questions?.length && ` • ${lecture.questions.length} ${lecture.questions.length === 1 ? "question" : "questions"}`}
                                </span>
                              </p>
                            )}
                            {renaming === lecture.id && <span className="flex-1" />}
                            <RowMenu label={`More actions for ${name}`} items={lectureItems} />
                          </li>
                        );
                      })}
                    </ol>
                  )}
                  {step === "types" && (
                    <div className="px-1 pb-6 pt-8 sm:px-6">
                      <p className={helper}>
                        Select the main content type. Add files or links as resources.
                        <br />
                        Learn more about{" "}
                        <button type="button" onClick={onExplain} className={helperLink}>
                          content types
                        </button>
                        .
                      </p>
                      <div className="mt-6 grid grid-cols-2 gap-3 @2xl:grid-cols-4 @2xl:gap-4">
                        {KINDS.map((kind) => (
                          <button key={kind} type="button" onClick={() => (kind === "Video" ? setAdding({ sectionId: section.id, step: "video" }) : addLecture(section.id, kind))} className={`flex h-[54px] items-center justify-center gap-2.5 rounded-[8px] border border-[#e2e8f0] bg-white px-2 text-[16px] leading-[24px] text-[#1e293b] transition hover:border-[#94a3b8] hover:bg-[#f8fafc] ${fontRegular}`}>
                            <Icon path={KIND_ICONS[kind]} className="size-5 shrink-0" />
                            {kind}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {step === "video" && (
                    <div className="px-1 pb-6 pt-8 sm:px-6">
                      <p className={helper}>
                        Upload a video from your system or library.
                        <br />
                        Visit the{" "}
                        <button type="button" onClick={onSupport} className={helperLink}>
                          support centre for video Library
                        </button>
                        .
                      </p>
                      <div className="mt-6 flex flex-col items-stretch gap-3 @2xl:flex-row @2xl:items-center @2xl:gap-4">
                        <button type="button" onClick={() => setAdding({ sectionId: section.id, step: "types" })} className={`flex h-[54px] shrink-0 items-center justify-center gap-3 rounded-[8px] bg-[#f1f5f9] px-8 text-[16px] leading-[24px] text-[#1e293b] transition hover:bg-[#e2e8f0] ${fontRegular}`}>
                          <Icon path="M15 6l-6 6 6 6" className="size-4" />
                          Back
                        </button>
                        <span aria-hidden="true" className="hidden h-[54px] w-px shrink-0 bg-[#e2e8f0] @2xl:block" />
                        <button type="button" onClick={() => chooseVideo({ sectionId: section.id })} className={dashed}>
                          <Icon path={UPLOAD} className="size-6 shrink-0" />
                          Upload Video
                        </button>
                        <span className={`shrink-0 text-center text-[14px] leading-[20px] text-[#94a3b8] ${fontRegular}`}>Or</span>
                        <button type="button" onClick={() => setLibrary({ sectionId: section.id })} className={dashed}>
                          <Icon path={LIBRARY} className="size-6 shrink-0" />
                          Add from Library
                        </button>
                      </div>
                    </div>
                  )}
                  {!step && (
                    <button type="button" onClick={() => setAdding({ sectionId: section.id, step: "types" })} className={`ml-8 mt-4 flex h-10 items-center gap-2 rounded-[8px] border border-[#cbd5e1] bg-white px-3.5 text-[14px] leading-[20px] text-[#334155] transition hover:bg-[#f8fafc] ${fontMedium}`}>
                      <Icon path={PLUS} className="size-[18px]" />
                      Add lecture
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
          {sections.every((s) => s.lectures.length > 0) && !adding && (
            <button type="button" onClick={addSection} className={`mt-5 flex h-10 items-center gap-2 rounded-[8px] bg-[#f1f5f9] px-3.5 text-[14px] leading-[20px] text-[#1e293b] transition hover:bg-[#e2e8f0] ${fontMedium}`}>
              <Icon path={PLUS} className="size-[18px]" />
              Add New Section
            </button>
          )}
        </>
      )}
      {editing?.kind === "Quiz" && (
        <QuizDrawer
          key={editing.id}
          lecture={editing}
          lectureOptions={sections.flatMap((s) => s.lectures).filter((l) => l.kind !== "Quiz").map((l, i) => ({ id: l.id, label: `Lecture ${i + 1} : ${lectureName(l)}` }))}
          onCancel={() => setEditingId("")}
          onSave={(patch) => {
            patchLecture(editing.id, patch);
            setEditingId("");
          }}
        />
      )}
      {editing && editing.kind !== "Quiz" && (
        <LectureDrawer
          key={editing.id}
          lecture={editing}
          uploadProgress={uploads.progress[editing.id]}
          videoUrl={editing.file ? uploads.urls[editing.file] : undefined}
          onCancel={() => setEditingId("")}
          onSave={(patch) => {
            patchLecture(editing.id, patch);
            setEditingId("");
          }}
          onUpdateVideo={() => chooseVideo({ lectureId: editing.id })}
          onLibrary={() => setLibrary({ lectureId: editing.id })}
        />
      )}
      {library && (
        <Shell title="Add from Library" onClose={() => setLibrary(null)} width="max-w-[520px]" radius="sm:rounded-[12px]">
          {libraryVideos().length === 0 ? (
            <p className={`px-6 py-10 text-center text-[14px] leading-[22px] text-[#64748b] ${fontRegular}`}>Your library is empty. Videos you upload to any course appear here.</p>
          ) : (
            <ul className="flex flex-col p-3">
              {libraryVideos().map((video) => (
                <li key={video.file}>
                  <button
                    type="button"
                    onClick={() => {
                      const picked = { file: video.file ?? "", duration: video.duration };
                      if (library.lectureId) patchLecture(library.lectureId, picked);
                      else if (library.sectionId) addLecture(library.sectionId, "Video", picked);
                      setLibrary(null);
                    }}
                    className="flex w-full items-center gap-3 rounded-[8px] p-2 text-left transition hover:bg-[#f8fafc]"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-[#f1f5f9] text-[#334155]">
                      <Icon path={PLAY} className="size-5" />
                    </span>
                    <span className={`min-w-0 flex-1 truncate text-[14px] leading-[20px] text-[#1e293b] ${fontMedium}`}>{video.file}</span>
                    {video.duration && <span className={`shrink-0 text-[13px] text-[#94a3b8] ${fontRegular}`}>{video.duration}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Shell>
      )}
      {removing && (
        <ConfirmDialog
          title={removing.title}
          body={removing.body}
          confirmLabel="Delete"
          onClose={() => setRemoving(null)}
          onConfirm={() => {
            removing.run();
            setRemoving(null);
          }}
        />
      )}
    </div>
  );
}

function PromotionsSection({ draft, update }: SectionProps) {
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("");
  const [expires, setExpires] = useState("");
  const [attempted, setAttempted] = useState(false);
  const cleanCode = code.trim().toUpperCase();
  const percentValue = Number(percent);
  const duplicate = draft.coupons.some((c) => c.code === cleanCode);
  const codeError = !attempted ? "" : !cleanCode ? "Enter a coupon code" : duplicate ? "You already have this code" : "";
  const percentError = attempted && !(percentValue >= 1 && percentValue <= 100) ? "Enter a discount from 1 to 100" : "";
  const dateError = attempted && !expires ? "Choose an end date" : "";

  const addCoupon = () => {
    setAttempted(true);
    if (!cleanCode || duplicate || !(percentValue >= 1 && percentValue <= 100) || !expires) return;
    update({ coupons: [...draft.coupons, { id: uid("coupon"), code: cleanCode, percent: percentValue, expires }] });
    setCode("");
    setPercent("");
    setExpires("");
    setAttempted(false);
  };

  return (
    <>
      <h2 className={`m-0 text-[20px] leading-[28px] text-[#1e293b] ${fontMedium}`}>Coupons</h2>
      <p className={`mt-1 text-[14px] leading-[24px] text-[#475569] ${fontRegular}`}>Create a code that gives students a discount until the date you choose.</p>
      <div className="mt-5 grid items-start gap-4 sm:grid-cols-3">
        <TextField id="coupon-code" label="Coupon code" value={code} onChange={setCode} placeholder="e.g. LAUNCH20" error={codeError} />
        <TextField id="coupon-percent" label="Discount (%)" type="number" value={percent} onChange={setPercent} placeholder="20" error={percentError} />
        <TextField id="coupon-expires" label="Ends on" type="date" value={expires} onChange={setExpires} error={dateError} />
      </div>
      <button type="button" onClick={addCoupon} className={`mt-4 flex h-10 items-center gap-2 rounded-[8px] border border-[#cbd5e1] bg-white px-4 text-[14px] leading-[20px] text-[#1e293b] transition hover:bg-[#f8fafc] ${fontMedium}`}>
        <Icon path={PLUS} className="size-[18px] text-[#64748b]" />
        Add coupon
      </button>
      {draft.coupons.length > 0 && (
        <ul className="mt-5 flex flex-col divide-y divide-[#e2e8f0] rounded-[12px] border border-[#e2e8f0] bg-white">
          {draft.coupons.map((coupon) => (
            <li key={coupon.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <p className={`min-w-0 text-[14px] leading-[20px] text-[#475569] ${fontRegular}`}>
                <span className={`text-[#1e293b] ${fontSemi}`}>{coupon.code}</span> · {coupon.percent}% off, ends {new Date(`${coupon.expires}T00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
              <button type="button" aria-label={`Remove coupon ${coupon.code}`} onClick={() => update({ coupons: draft.coupons.filter((c) => c.id !== coupon.id) })} className={`${iconButton} text-[#ef4444] hover:bg-[#fef2f2] hover:text-[#dc2626]`}>
                <Icon path={TRASH} className="size-[18px]" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <hr className="my-8 border-[#e2e8f0]" />
      <h2 className={`m-0 text-[20px] leading-[28px] text-[#1e293b] ${fontMedium}`}>Deals Program</h2>
      <p className={`mt-1 text-[14px] leading-[24px] text-[#475569] ${fontRegular}`}>Thkee can promote your course to a wider audience at a discount through targeted campaigns. There is no up-front cost, and you can change this at any time.</p>
      <div className="mt-4">
        <Checkbox checked={draft.dealsAgreed} onChange={() => update({ dealsAgreed: !draft.dealsAgreed })}>
          <span className={`text-[14px] leading-[20px] text-[#334155] ${fontRegular}`}>Include this course in the Thkee Deals Program.</span>
        </Checkbox>
      </div>
    </>
  );
}

function PricingSection({ draft, update }: SectionProps) {
  const free = priceIsValid(draft.price) && Number(draft.price) === 0;
  return (
    <>
      <p className={`text-[16px] leading-[28px] text-[#475569] ${fontRegular}`}>Set what students pay for this course. Coupons from Promotions are taken off this price.</p>
      <div className="mt-6 max-w-[320px]">
        <TextField id="course-price" label="Price (USD)" required type="number" value={draft.price} onChange={(price) => update({ price })} placeholder="0 for a free course" error={priceIsValid(draft.price) ? "" : "Enter a price of 0 or more"} hint={free ? "This course will be free." : "Enter 0 to make this course free."} />
      </div>
    </>
  );
}

function TipsSection({ draft, courseId }: { draft: Draft; courseId: string }) {
  const items = checklist(draft);
  const done = items.filter((item) => item.done).length;
  return (
    <>
      <h2 className={`m-0 text-[20px] leading-[28px] text-[#1e293b] ${fontMedium}`}>Ready to submit?</h2>
      <p className={`mt-1 text-[14px] leading-[24px] text-[#475569] ${fontRegular}`}>
        {done} of {items.length} steps are finished.
      </p>
      <ul className="mt-4 flex flex-col divide-y divide-[#e2e8f0] rounded-[12px] border border-[#e2e8f0] bg-white">
        {items.map((item) => (
          <li key={item.label}>
            <button type="button" onClick={() => openCourseEditor(courseId, item.section)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#f8fafc]">
              <Icon path={CHECK_CIRCLE} className={`size-5 shrink-0 ${item.done ? "text-[#059669]" : "text-[#cbd5e1]"}`} />
              <span className={`min-w-0 flex-1 text-[14px] leading-[20px] ${item.done ? "text-[#64748b]" : "text-[#1e293b]"} ${fontRegular}`}>
                <span className="sr-only">{item.done ? "Done: " : "To do: "}</span>
                {item.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <h2 className={`m-0 mt-10 text-[20px] leading-[28px] text-[#1e293b] ${fontMedium}`}>Organizing your course</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {TIPS.map((tip) => (
          <div key={tip.title} className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
            <p className={`text-[14px] leading-[20px] text-[#1e293b] ${fontSemi}`}>{tip.title}</p>
            <p className={`mt-1 text-[14px] leading-[22px] text-[#475569] ${fontRegular}`}>{tip.text}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function GuideCard({ title, text, linkLabel = "See Course Organization", icon, inlineIcon, onOpen }: { title: string; text: string; linkLabel?: string; icon?: ReactNode; inlineIcon?: boolean; onOpen: () => void }) {
  const art = icon ?? (
    <svg viewBox="0 0 66 50" className="h-[50px] w-[66px] text-[#0b3fb0]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="1" y="1" width="64" height="48" rx="3" />
      <path d="M1 10h64M9 5.5h.01M14 5.5h.01M19 5.5h.01" strokeLinecap="round" />
      <rect x="8" y="16" width="22" height="26" />
      <path d="M8 16l22 26M30 16L8 42" />
      <rect x="36" y="16" width="22" height="11" fill="currentColor" />
      <path d="M36 32h22M36 38h14" />
    </svg>
  );
  return (
    <aside className="relative rounded-[16px] border-b-[3px] border-r-[3px] border-[#e2e8f0] bg-[#f8fafc] p-6 @4xl:sticky @4xl:top-[94px]">
      <svg viewBox="0 0 24 48" className="absolute -top-3 right-8 h-10 w-5 text-[#0f172a]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
        <path d="M17 12v24a5 5 0 01-10 0V9a3.5 3.5 0 017 0v25a1.5 1.5 0 01-3 0V13" />
      </svg>
      {inlineIcon ? (
        <div className="flex items-center gap-3">
          {art}
          <h2 className={`m-0 text-[20px] leading-[28px] text-[#0f172a] ${fontSemi}`}>{title}</h2>
        </div>
      ) : (
        <>
          {art}
          <h2 className={`m-0 mt-5 text-[20px] leading-[28px] text-[#0f172a] ${fontSemi}`}>{title}</h2>
        </>
      )}
      <p className={`mt-3 text-[14px] leading-[24px] text-[#334155] ${fontRegular}`}>{text}</p>
      <button type="button" onClick={onOpen} className={`mt-5 flex items-center gap-3 text-[14px] leading-[20px] text-[#0f172a] transition hover:text-[#976002] ${fontSemi}`}>
        {linkLabel}
        <Icon path="M7 17L17 7M8 7h9v9" className="size-4" />
      </button>
    </aside>
  );
}

const toDraft = (course: InstructorCourse, details: Details): Draft => ({ ...details, title: course.title, category: course.category, price: course.price === "Free" ? "0" : course.price.replace(/[^0-9.]/g, "") });

function Editor({ course, stored, section }: { course: InstructorCourse; stored?: StoredDetails; section: string }) {
  const { notify } = useApp();
  const [initial] = useState(() => toDraft(course, { ...blankDetails(), ...stored }));
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [status, setStatus] = useState<CourseStatus>(course.status);
  const [savedAt, setSavedAt] = useState(stored?.savedAt);
  const [now, setNow] = useState(() => Date.now());
  const [leaving, setLeaving] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});
  const uploadTimers = useRef(new Map<string, number>());
  const createdUrls = useRef<string[]>([]);
  useEffect(() => {
    const timers = uploadTimers.current;
    const urls = createdUrls.current;
    return () => {
      timers.forEach((timer) => {
        clearInterval(timer);
        clearTimeout(timer);
      });
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);
  // There's no upload server yet, so progress and processing are timed on the page.
  const startUpload = (file: File, lectureId: string) => {
    const url = URL.createObjectURL(file);
    createdUrls.current.push(url);
    setVideoUrls((urls) => ({ ...urls, [file.name]: url }));
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      if (!Number.isFinite(probe.duration)) return;
      const duration = formatDuration(probe.duration);
      setDraft((d) => ({ ...d, curriculum: d.curriculum.map((s) => ({ ...s, lectures: s.lectures.map((l) => (l.id === lectureId ? { ...l, duration } : l)) })) }));
    };
    probe.src = url;
    const previous = uploadTimers.current.get(lectureId);
    if (previous) {
      clearInterval(previous);
      clearTimeout(previous);
    }
    let percent = 0;
    setUploadProgress((p) => ({ ...p, [lectureId]: percent }));
    const ticker = window.setInterval(() => {
      percent = Math.min(100, percent + 7);
      setUploadProgress((p) => ({ ...p, [lectureId]: percent }));
      if (percent < 100) return;
      clearInterval(ticker);
      uploadTimers.current.set(
        lectureId,
        window.setTimeout(() => {
          uploadTimers.current.delete(lectureId);
          setUploadProgress(({ [lectureId]: _done, ...rest }) => rest);
        }, 2500),
      );
    }, 200);
    uploadTimers.current.set(lectureId, ticker);
  };
  const current = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const steps = checklist(draft);
  const ready = steps.every((step) => step.done);
  const guide = GUIDES[current.id];

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [current.id]);

  const persist = (nextStatus: CourseStatus) => {
    if (!draft.title.trim()) {
      notify("Add a title before saving");
      openCourseEditor(course.id, "details");
      return false;
    }
    if (!priceIsValid(draft.price)) {
      notify("Enter a price before saving");
      openCourseEditor(course.id, "pricing");
      return false;
    }
    const clean = { ...draft, title: draft.title.trim() };
    const { title, category, price, ...details } = clean;
    const stamp = Date.now();
    const priceValue = Number(price);
    saveInstructorCourses(loadInstructorCourses().map((c) => (c.id === course.id ? { ...c, title, category, status: nextStatus, price: priceValue === 0 ? "Free" : `$${priceValue.toFixed(2)}`, updated: todayLabel() } : c)));
    save(COURSE_DETAILS_KEY, { ...load<Record<string, StoredDetails>>(COURSE_DETAILS_KEY, {}), [course.id]: { ...details, savedAt: stamp } });
    setDraft(clean);
    setSaved(clean);
    setStatus(nextStatus);
    setSavedAt(stamp);
    setNow(stamp);
    return true;
  };

  const saveNow = () => {
    if (persist(status)) notify("Saved");
  };
  const saveAndNext = () => {
    if (!persist(status)) return;
    notify("Saved");
    const next = SECTIONS[SECTIONS.findIndex((s) => s.id === current.id) + 1];
    if (next) openCourseEditor(course.id, next.id);
  };
  const submit = () => {
    const problem = steps.find((step) => !step.done);
    if (problem) {
      notify(problem.label);
      openCourseEditor(course.id, problem.section);
      return;
    }
    if (persist("pending")) notify("Submitted for review");
  };

  const statusAction = status === "published" ? { label: "Unpublish course", onClick: () => persist("draft") && notify("Course unpublished") } : status === "pending" ? null : { label: "Submit for review", onClick: submit };
  const navItem = (active: boolean) => `flex h-11 shrink-0 items-center gap-3 rounded-[10px] px-4 text-left text-[14px] leading-[20px] transition md:w-full ${active ? `bg-white text-[#1e293b] shadow-[0_1px_4px_rgba(15,23,42,0.12)] ${fontMedium}` : `text-[#475569] hover:bg-[#f1f5f9] ${fontRegular}`}`;
  const props: SectionProps = { draft, saved, update, onExplain: () => setExplaining(true) };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white">
      <header className="sticky top-0 z-30 flex min-h-[70px] flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[#e2e8f0] bg-white px-4 py-2 md:px-8">
        <div className="flex w-full min-w-0 flex-wrap items-center gap-x-4 gap-y-1 lg:w-auto lg:flex-1">
          <button type="button" onClick={() => (dirty ? setLeaving(true) : openInstructorCourses())} className={`flex shrink-0 items-center gap-2 border-r border-[#e2e8f0] pr-4 text-[14px] leading-[20px] text-[#1e293b] transition hover:text-[#64748b] ${fontRegular}`}>
            <Icon path="M15 6l-6 6 6 6" className="size-5" />
            Back
          </button>
          <p className={`min-w-0 max-w-full truncate text-[16px] leading-[24px] text-[#0f172a] md:max-w-[360px] ${fontSemi}`}>{draft.title || "Untitled course"}</p>
          <span role="img" aria-label={ready ? "All submission steps finished" : `${steps.filter((s) => s.done).length} of ${steps.length} submission steps finished`} title={ready ? "Ready to submit" : `${steps.filter((s) => s.done).length} of ${steps.length} steps finished`} className="flex shrink-0">
            <Icon path={CHECK_CIRCLE} className={`size-5 ${ready ? "text-[#059669]" : "text-[#94a3b8]"}`} />
          </span>
          <span className={`flex shrink-0 items-center gap-1.5 rounded-full bg-[#f2f4f7] py-0.5 pl-2 pr-2.5 text-[12px] leading-[18px] text-[#334155] ${fontMedium}`}>
            <span className="size-1.5 rounded-full bg-[#64748b]" />
            Unlisted
          </span>
          <StatusPill status={status} />
          <span className={`text-[13px] italic leading-[20px] text-[#64748b] ${fontRegular}`}>{dirty ? "Unsaved changes" : savedLabel(savedAt, course.updated, now)}</span>
        </div>
        <div className="flex items-center gap-3">
          <ActionMenu
            label="Preview"
            triggerClass={`flex h-9 items-center gap-2 rounded-[8px] bg-[#f1f5f9] px-3 text-[14px] leading-[20px] text-[#1e293b] transition hover:bg-[#e2e8f0] ${fontRegular}`}
            trigger={
              <>
                Preview
                <Icon path="M6 9l6 6 6-6" className="size-4" />
              </>
            }
            items={[{ label: "Preview as student", onClick: () => notify("The student preview is coming soon") }]}
          />
          <div className="flex h-9 overflow-visible rounded-[8px] bg-[#1e293b] text-white">
            <button type="button" onClick={saveNow} className={`rounded-l-[8px] pl-4 pr-3 text-[14px] leading-[20px] transition hover:bg-[#0f172a] ${fontMedium}`}>
              Save
            </button>
            <span aria-hidden="true" className="my-2 w-px bg-white/30" />
            <ActionMenu label="More save options" triggerClass="flex h-9 items-center rounded-r-[8px] px-2.5 transition hover:bg-[#0f172a]" trigger={<Icon path="M6 9l6 6 6-6" className="size-4" />} items={[{ label: "Save and continue", onClick: saveAndNext }, ...(statusAction ? [statusAction] : [])]} />
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="flex shrink-0 flex-col justify-between border-b border-[#e2e8f0] bg-[#f8fafc] p-3 md:sticky md:top-[70px] md:h-[calc(100dvh-70px)] md:w-[268px] md:border-b-0 md:border-r md:p-5">
          <nav aria-label="Course setup" className="flex gap-1 overflow-x-auto md:flex-col md:gap-2 md:overflow-visible">
            {SECTIONS.map((item) => (
              <button key={item.id} type="button" aria-current={item.id === current.id ? "page" : undefined} onClick={() => openCourseEditor(course.id, item.id)} className={navItem(item.id === current.id)}>
                <Icon path={item.icon} className="size-5 shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="hidden flex-col gap-2 md:flex">
            <button type="button" onClick={() => notify("Help is coming soon")} className={navItem(false)}>
              <Icon path="M12 3a9 9 0 100 18 9 9 0 000-18zM9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.2-1.5 2M12 17h.01" className="size-5 shrink-0" />
              Help
            </button>
            <button type="button" onClick={() => notify("Course settings are coming soon")} className={navItem(false)}>
              <Icon path="M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 00-2.1-1.2L14 3h-4l-.5 2.7a7 7 0 00-2.1 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 005 12a7 7 0 00.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 002.1 1.2L10 21h4l.5-2.7a7 7 0 002.1-1.2l2.3 1 2-3.4-2-1.5A7 7 0 0019 12z" className="size-5 shrink-0" />
              Settings
            </button>
          </div>
        </aside>
        <main className="@container min-w-0 flex-1 bg-[#fdfdfd] px-4 pb-24 pt-7 md:px-10">
          <div className="mx-auto max-w-[1110px]">
            <SectionTitle>{current.label}</SectionTitle>
            {current.id === "details" ? (
              <div className="mt-7">
                <DetailsSection {...props} fallbackCover={sampleCover(course)} guide={guide.card} onSupport={() => notify("The Support Center is coming soon")} />
              </div>
            ) : (
              <div className={`mt-7 grid gap-8 ${guide.card.title ? "@4xl:grid-cols-[minmax(0,1fr)_340px] @4xl:gap-12" : ""}`}>
                <div className="min-w-0">
                  {current.id === "intended-learners" && <LearnersSection {...props} />}
                  {current.id === "curriculum" && <CurriculumSection {...props} onSupport={() => notify("The Support Center is coming soon")} uploads={{ progress: uploadProgress, urls: videoUrls, start: startUpload }} />}
                  {current.id === "promotions" && <PromotionsSection {...props} />}
                  {current.id === "pricing" && <PricingSection {...props} />}
                  {current.id === "tips" && <TipsSection draft={draft} courseId={course.id} />}
                </div>
                {guide.card.title && (
                  <div>
                    <GuideCard title={guide.card.title} text={guide.card.text} onOpen={() => openCourseEditor(course.id, "tips")} />
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
      <button type="button" onClick={() => setExplaining(true)} className={`fixed bottom-5 right-5 z-20 flex h-11 items-center gap-2 rounded-[10px] bg-[#2e0a78] px-4 text-[14px] leading-[20px] text-white shadow-[0_6px_16px_rgba(46,10,120,0.3)] transition hover:bg-[#3d1299] md:bottom-8 md:right-8 ${fontMedium}`}>
        <Icon path="M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0012 3z" className="size-[18px]" />
        Explain me
      </button>
      {explaining && (
        <Shell title={current.label} onClose={() => setExplaining(false)} width="max-w-[520px]" radius="sm:rounded-[12px]">
          <div className="flex flex-col gap-3 p-6">
            {guide.explain.map((line) => (
              <p key={line} className={`text-[14px] leading-[24px] text-[#334155] ${fontRegular}`}>
                {line}
              </p>
            ))}
          </div>
        </Shell>
      )}
      {leaving && <ConfirmDialog title="Leave without saving?" body="Your unsaved changes to this course will be lost." confirmLabel="Leave without saving" onClose={() => setLeaving(false)} onConfirm={() => openInstructorCourses()} />}
    </div>
  );
}

export default function InstructorCourseEditor({ id, section }: { id: string; section?: string }) {
  const [course] = useState(() => loadInstructorCourses().find((c) => c.id === id));
  const [stored] = useState(() => load<Record<string, StoredDetails>>(COURSE_DETAILS_KEY, {})[id]);

  useEffect(() => {
    if (!course) openInstructorCourses();
  }, [course]);

  if (!course) return null;
  return <Editor course={course} stored={stored} section={section ?? SECTIONS[0].id} />;
}
