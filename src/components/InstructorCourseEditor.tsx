import { useEffect, useRef, useState, type DragEvent, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon, Attachment01Icon, File02Icon, LockIcon, MaximizeScreenIcon, MinimizeScreenIcon, ViewIcon } from "@hugeicons/core-free-icons";
import { suggestDescription, suggestLectureDescription, suggestLectureTitles, suggestPoints, suggestQuizQuestions, suggestTitles, type CourseContext, type LectureContext, type PointKind, type QuizDraft } from "../aiSuggest";
import { uploadFile } from "../api";
import { BANNER_MAX_UPLOAD_BYTES, BANNER_MIN, prepareBanner } from "../imageShrink";
import { categories } from "../data";
import { fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, openCourseEditor, openInstructorCourses, save, useApp, useStoredState } from "../store";
import { SelectField, TextField } from "./AccountSettingsPage";
import { Checkbox } from "./InstructorAssignments";
import { Toggle } from "./InstructorAvailability";
import { COURSE_DETAILS_KEY, StatusPill, loadInstructorCourses, sampleCover, saveInstructorCourses, todayLabel, type CourseStatus, type InstructorCourse } from "./InstructorCourses";
import { ConfirmDialog } from "./InstructorSessions";
import { InfoTip } from "./InstructorReports";
import { ActionMenu, type ActionItem } from "./Menus";
import { DateField, todayIso } from "./DatePicker";
import CoursePagePreview, { type CoursePreviewData, type PreviewAnchor } from "./CoursePagePreview";
import { NoteBody, NoteEditor } from "./Notes";
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
  promoVideo: { name: string; size: number; url?: string } | null;
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
const VIDEO_URLS_KEY = "thkee.videoUrls";
const AUTOSAVE_DELAY_MS = 1500;
const LECTURE_DESCRIPTION_LIMIT = 500;

const SECTIONS: { id: string; label: string; icon: string }[] = [
  { id: "intended-learners", label: "Intended Learners", icon: "M2 9l10-5 10 5-10 5-10-5zM6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5M20 10v6" },
  { id: "details", label: "Details", icon: "M14 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-7M8 12h5M8 16h8M18 2.5a3 3 0 100 6 3 3 0 000-6z" },
  { id: "curriculum", label: "Curriculum", icon: "M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2zM8 8h8M8 12h8M8 16h5" },
  { id: "promotions", label: "Promotions", icon: "M6 3h12a2 2 0 012 2v16l-3-2-3 2-2-2-2 2-3-2-3 2V5a2 2 0 012-2zM15 8l-6 6M9.5 8.5h.01M14.5 13.5h.01" },
  { id: "pricing", label: "Pricing", icon: "M6 3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3zM15 9c-.5-1-1.5-1.5-3-1.5-2 0-3 1-3 2.2 0 3 6 1.6 6 4.6 0 1.2-1 2.2-3 2.2-1.5 0-2.5-.5-3-1.5M12 6v12" },
  { id: "tips", label: "Tips", icon: "M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0012 3z" },
  { id: "settings", label: "Settings", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 00-2.1-1.2L14 3h-4l-.5 2.7a7 7 0 00-2.1 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 005 12a7 7 0 00.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 002.1 1.2L10 21h4l.5-2.7a7 7 0 002.1-1.2l2.3 1 2-3.4-2-1.5A7 7 0 0019 12z" },
];
// Sections that sit under the divider at the bottom of the menu instead of in the setup list.
const UTILITY_SECTIONS = ["tips", "settings"];

// Course settings take effect as soon as they change, so they are stored apart from the draft that needs saving.
export const COURSE_SETTINGS_KEY = "thkee.courseSettings";
type CourseSettings = { unlisted: boolean; qaDigest: boolean; lectureReady: boolean; monthlyEnrollments: boolean; privacy: "public" | "private" };
const DEFAULT_COURSE_SETTINGS: CourseSettings = { unlisted: false, qaDigest: true, lectureReady: true, monthlyEnrollments: true, privacy: "public" };

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
  settings: { card: { title: "", text: "" }, explain: ["Unlisting hides your course from search and browsing. Students who already enrolled keep their access.", "Email notifications are only about this course. You can change them at any time.", "Enrollment privacy decides whether anyone can enroll or only people you invite. It becomes available once the course is published."] },
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
const EYE = "M2 12s3.600-7 10-7 10 7 10 7-3.600 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z";
const EXPAND = "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7";

// Where the live preview points when a builder section opens, and for fields that sit outside a marked group.
const SECTION_ANCHOR: Record<string, PreviewAnchor> = { details: "banner", "intended-learners": "objectives", curriculum: "content", pricing: "card", promotions: "card" };
const FIELD_ANCHOR: Record<string, PreviewAnchor> = { "course-title": "banner", "course-subtitle": "banner", "course-level": "banner", "course-language": "banner", "course-category": "banner", "course-subcategory": "banner", "course-price": "card" };
const STATUS_LABEL: Record<CourseStatus, string> = { draft: "Draft", pending: "In review", published: "Published", rejected: "Needs changes" };
const STATUS_DOT: Record<CourseStatus, string> = { draft: "#94a3b8", pending: "#f59e0b", published: "#10b981", rejected: "#ef4444" };
const courseSlug = (title: string) => (title || "your-course").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "your-course";

// Live preview width, as a percentage of the builder area.
const PREVIEW_DEFAULT = 50;
const PREVIEW_MIN = 30;
const PREVIEW_MAX = 70;

// The divider between the form and the live preview. Drag it, use the arrow keys, or double-click to reset.
function SplitHandle({ containerRef, value, onChange }: { containerRef: { current: HTMLDivElement | null }; value: number; onChange: (pct: number) => void }) {
  const [dragging, setDragging] = useState(false);
  const clamp = (pct: number) => Math.round(Math.min(PREVIEW_MAX, Math.max(PREVIEW_MIN, pct)));
  const fromPointer = (clientX: number) => {
    const box = containerRef.current?.getBoundingClientRect();
    if (box) onChange(clamp(((box.right - clientX) / box.width) * 100));
  };
  return (
    <div className="hidden @5xl:block">
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize the live preview"
        aria-valuemin={PREVIEW_MIN}
        aria-valuemax={PREVIEW_MAX}
        aria-valuenow={value}
        tabIndex={0}
        title="Drag to resize. Double-click to reset."
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
          document.body.style.userSelect = "none";
          document.body.style.cursor = "col-resize";
        }}
        onPointerMove={(e) => dragging && fromPointer(e.clientX)}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          setDragging(false);
          document.body.style.userSelect = "";
          document.body.style.cursor = "";
        }}
        onDoubleClick={() => onChange(PREVIEW_DEFAULT)}
        onKeyDown={(e) => {
          // The preview sits on the right, so Left makes it wider and Right makes it narrower.
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            onChange(clamp(value + (e.key === "ArrowLeft" ? 2 : -2)));
          } else if (e.key === "Home" || e.key === "End") {
            e.preventDefault();
            onChange(e.key === "Home" ? PREVIEW_MAX : PREVIEW_MIN);
          }
        }}
        className="group sticky top-[88px] mt-7 flex h-[calc(100dvh-112px)] cursor-col-resize touch-none items-center justify-center outline-none"
      >
        <span aria-hidden="true" className={`absolute inset-y-6 left-1/2 w-px -translate-x-1/2 transition-colors ${dragging ? "bg-[#0d5c4b]" : "bg-transparent group-hover:bg-[#cbd5e1] group-focus-visible:bg-[#0d5c4b]"}`} />
        <span aria-hidden="true" className={`relative flex h-10 w-[6px] items-center justify-center rounded-full border transition ${dragging ? "border-[#0d5c4b] bg-[#0d5c4b]" : "border-[#cbd5e1] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] group-hover:border-[#94a3b8] group-focus-visible:border-[#0d5c4b] group-focus-visible:ring-3 group-focus-visible:ring-[#0d5c4b]/15"}`} />
      </div>
    </div>
  );
}

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

function AiInput({ id, label, value, original, placeholder, maxLength, height = "h-12", counter, onKeyDown, onSuggest, onRemove, onChange }: { id?: string; label: string; value: string; original?: string; placeholder: string; maxLength?: number; height?: string; counter?: boolean; onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void; onSuggest?: () => Promise<void>; onRemove?: () => void; onChange: (value: string) => void }) {
  const { notify } = useApp();
  const reveal = "opacity-0 transition group-focus-within/field:opacity-100 group-hover/field:opacity-100 pointer-coarse:opacity-100";
  const canRestore = original !== undefined && original !== value;
  const [busy, setBusy] = useState(false);
  const suggest = async () => {
    if (!onSuggest) return notify("AI suggestions are coming soon");
    setBusy(true);
    try {
      await onSuggest();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={`field-box group/field min-w-0 flex-1 ${height}`}>
      <input id={id} aria-label={id ? undefined : label} value={value} maxLength={maxLength} onKeyDown={onKeyDown} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`min-w-0 flex-1 bg-transparent text-[16px] leading-[20px] text-[#0f172a] outline-none placeholder:text-slate-400 md:text-[14px] ${fontRegular}`} />
      {counter && maxLength && (
        <span aria-hidden="true" className={`shrink-0 text-[12px] tabular-nums opacity-0 transition group-focus-within/field:opacity-100 ${value.length >= maxLength ? "text-[#dc2626]" : "text-[#94a3b8]"} ${fontRegular}`}>
          {maxLength - value.length}
        </span>
      )}
      <button type="button" aria-label={`Suggest ${label.toLowerCase()} with AI`} aria-busy={busy} title={busy ? "Writing a suggestion…" : "Suggest with AI"} disabled={busy} onClick={suggest} className={`flex shrink-0 rounded-[6px] p-1 text-[#0d5c4b] transition hover:bg-[#eef7f3] ${busy ? "animate-pulse opacity-100" : reveal}`}>
        <Icon path={SPARKLE} className="size-5" filled />
      </button>
      <button type="button" aria-label={`Restore saved ${label.toLowerCase()}`} title={canRestore ? "Restore last saved text" : "No changes to restore"} disabled={!canRestore} onClick={() => onChange(original ?? "")} className={`flex shrink-0 p-1 text-[#64748b] disabled:cursor-not-allowed disabled:text-[#cbd5e1] ${reveal}`}>
        <Icon path={HISTORY} className="size-[18px]" />
      </button>
      {onRemove && (
        <>
          <span aria-hidden="true" className={`h-4 w-px shrink-0 bg-[#e2e8f0] ${reveal}`} />
          <button type="button" aria-label={`Remove ${label.toLowerCase()}`} title="Remove" onClick={onRemove} className={`flex shrink-0 rounded-[6px] p-1 text-[#94a3b8] transition hover:bg-[#fef2f2] hover:text-[#dc2626] focus-visible:text-[#dc2626] ${reveal}`}>
            <Icon path={CLOSE} className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}

const GRIP = "M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01";
const TARGET = "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7a5 5 0 100 10 5 5 0 000-10zM12 11a1 1 0 100 2 1 1 0 000-2z";
const TOOLS = "M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z";
const USERS = "M9 11a4 4 0 100-8 4 4 0 000 8zM2 21v-1a6 6 0 016-6h2a6 6 0 016 6v1M16 3.1a4 4 0 010 7.8M22 21v-1a6 6 0 00-4-5.7";
const CHECK = "M5 12.5l4.5 4.5L19 7.5";

// Every card uses the one brand green for its icon, progress bar and filled-row ticks.
type Tone = { tile: string; ink: string; bar: string; track: string };
const BRAND: Tone = { tile: "bg-[#e6f4ee]", ink: "text-[#0d5c4b]", bar: "bg-[#0d5c4b]", track: "bg-[#e6f4ee]" };

function PointList({ label, rows, savedRows, examples, tone, onSuggestRow, onChange }: { label: string; rows: Point[]; savedRows: Point[]; examples: string[]; tone: Tone; onSuggestRow?: (id: string) => Promise<void>; onChange: (next: Point[]) => void }) {
  // Focus requests carry a counter so asking for the same row twice still moves the cursor.
  const [focus, setFocus] = useState({ id: "", n: 0 });
  const [dragging, setDragging] = useState<number | null>(null);
  useEffect(() => {
    if (!focus.id) return;
    const input = document.querySelector<HTMLInputElement>(`[data-point="${focus.id}"] input`);
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, [focus]);
  const focusRow = (id: string) => setFocus((f) => ({ id, n: f.n + 1 }));
  const noun = label.toLowerCase();

  const insertAfter = (index: number) => {
    const row = { id: uid("point"), text: "" };
    onChange([...rows.slice(0, index + 1), row, ...rows.slice(index + 1)]);
    focusRow(row.id);
  };
  const addRow = () => {
    // Reuse an empty row instead of stacking blanks.
    const empty = rows.find((p) => !p.text.trim());
    if (empty) focusRow(empty.id);
    else insertAfter(rows.length - 1);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>, i: number) => {
    const row = rows[i];
    if (e.key === "Enter") {
      e.preventDefault();
      if (!row.text.trim()) return;
      const next = rows[i + 1];
      if (next && !next.text.trim()) focusRow(next.id);
      else insertAfter(i);
    } else if (e.key === "Backspace" && !row.text && rows.length > 1) {
      e.preventDefault();
      onChange(rows.filter((p) => p.id !== row.id));
      focusRow(i > 0 ? rows[i - 1].id : rows[1].id);
    } else if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      const by = e.key === "ArrowUp" ? -1 : 1;
      if (i + by < 0 || i + by >= rows.length) return;
      e.preventDefault();
      onChange(move(rows, i, by));
      focusRow(row.id);
    }
  };

  return (
    <div className="mt-5">
      <ul className="flex flex-col gap-2">
        {rows.map((row, i) => {
          const done = !!row.text.trim();
          return (
            <li
              key={row.id}
              data-point={row.id}
              onDragOver={(e) => {
                if (dragging === null) return;
                e.preventDefault();
                if (dragging !== i) {
                  onChange(move(rows, dragging, i - dragging));
                  setDragging(i);
                }
              }}
              className={`group flex items-center gap-2 transition ${dragging === i ? "opacity-40" : ""}`}
            >
              {/* Shows whether the row is filled; on hover it turns into the drag handle. */}
              <span className="relative hidden size-6 shrink-0 md:block">
                <span aria-hidden="true" className={`absolute inset-0 flex items-center justify-center rounded-full transition ${rows.length > 1 ? "group-hover:opacity-0" : ""} ${done ? `${tone.tile} ${tone.ink}` : "border-[1.5px] border-dashed border-[#cbd5e1]"}`}>
                  {done && <Icon path={CHECK} className="size-3.5" />}
                </span>
                {rows.length > 1 && (
                  <button
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setDragImage(e.currentTarget.closest("li") as HTMLElement, 16, 18);
                      setDragging(i);
                    }}
                    onDragEnd={() => setDragging(null)}
                    aria-label={`Reorder ${noun} ${i + 1}. In the field, Alt and the arrow keys also move it.`}
                    title="Drag to reorder"
                    tabIndex={-1}
                    className="absolute inset-0 flex cursor-grab items-center justify-center rounded-[6px] text-[#64748b] opacity-0 transition hover:bg-[#f1f5f9] group-hover:opacity-100 active:cursor-grabbing"
                  >
                    <Icon path={GRIP} className="size-4" />
                  </button>
                )}
              </span>
              <AiInput
                label={`${label} ${i + 1}`}
                value={row.text}
                original={savedRows.find((p) => p.id === row.id)?.text}
                placeholder={examples[i] ? `e.g. ${examples[i]}` : `Add another ${noun}`}
                maxLength={POINT_LIMIT}
                height=""
                counter
                onKeyDown={(e) => onKey(e, i)}
                onSuggest={onSuggestRow ? () => onSuggestRow(row.id) : undefined}
                onRemove={
                  rows.length > 1
                    ? () => {
                        onChange(rows.filter((p) => p.id !== row.id));
                        focusRow(i > 0 ? rows[i - 1].id : rows[1].id);
                      }
                    : undefined
                }
                onChange={(text) => onChange(rows.map((p) => (p.id === row.id ? { ...p, text } : p)))}
              />
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 md:pl-8">
        <button type="button" onClick={addRow} className={`flex h-9 items-center gap-1.5 rounded-[8px] border border-dashed border-[#cbd5e1] px-3 text-[14px] leading-[20px] text-[#334155] transition hover:border-[#94a3b8] hover:bg-[#f8fafc] ${fontMedium}`}>
          <Icon path={PLUS} className="size-4" />
          Add {noun}
        </button>
        <p className="field-help hidden md:block">Enter adds a line · Alt + ↑↓ reorders</p>
      </div>
    </div>
  );
}

// The progress banner that opens a builder section.
function ProgressBanner({ done, total, title, doneTitle, text }: { done: number; total: number; title: string; doneTitle: string; text: ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-[16px] bg-gradient-to-r from-[#e6f4ee] via-[#f1f8f5] to-[#fdfdfd] p-4 md:p-5">
      <div className="relative size-12 shrink-0">
        <svg viewBox="0 0 36 36" className="size-12 -rotate-90" aria-hidden="true">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#ffffff" strokeWidth="4" />
          <circle cx="18" cy="18" r="15" fill="none" stroke="#0d5c4b" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(done / total) * 94.25} 94.25`} className="transition-[stroke-dasharray] duration-500" />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-[13px] text-[#0d5c4b] ${fontSemi}`}>
          {done}/{total}
        </span>
      </div>
      <div className="min-w-0">
        <p className={`m-0 text-[15px] leading-[22px] text-[#0f172a] ${fontSemi}`}>{done === total ? doneTitle : title}</p>
        <p className={`m-0 mt-0.5 text-[14px] leading-[20px] text-[#475569] [text-wrap:pretty] ${fontRegular}`}>{text}</p>
      </div>
    </div>
  );
}

// `ai` renders the suggestions panel; the card owns whether it is open. Cards without `ai` get no button.
function PointGroup({ icon, tone, title, description, done, min, unit, ai, aiOpen: aiOpenProp, onAiOpenChange, children }: { icon: string; tone: Tone; title: string; description: ReactNode; done: number; min: number; unit?: string; ai?: (close: () => void) => ReactNode; aiOpen?: boolean; onAiOpenChange?: (open: boolean) => void; children: ReactNode }) {
  // Open state can be owned by the card or passed in, so something inside the card can open the AI panel too.
  const [ownOpen, setOwnOpen] = useState(false);
  const aiOpen = aiOpenProp ?? ownOpen;
  const setAiOpen = (open: boolean) => (onAiOpenChange ? onAiOpenChange(open) : setOwnOpen(open));
  const complete = done >= min;
  const progress = complete ? `${done}${unit ?? " added"}` : `${done} of ${min}${unit ?? ""}`;
  return (
    <section className="rounded-[16px] border border-[#e8ecf1] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_16px_rgba(15,23,42,0.04)] md:p-6">
      <div className="flex items-start gap-3.5">
        <span aria-hidden="true" className={`flex size-11 shrink-0 items-center justify-center rounded-[12px] ${tone.tile} ${tone.ink}`}>
          <Icon path={icon} className="size-[22px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <div className="min-w-0">
              <h2 className={`m-0 text-[18px] leading-[26px] text-[#0f172a] ${fontSemi}`}>{title}</h2>
              <p className={`mt-0.5 text-[14px] leading-[22px] text-[#64748b] [text-wrap:pretty] ${fontRegular}`}>{description}</p>
            </div>
            {ai && (
              <button type="button" aria-expanded={aiOpen} onClick={() => setAiOpen(!aiOpen)} className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] leading-[20px] transition ${aiOpen ? "border-[#0d5c4b]/40 bg-[#eef7f3] text-[#0d5c4b]" : "border-[#e2e8f0] bg-white text-[#0f172a] hover:border-[#0d5c4b]/40 hover:bg-[#f3faf7]"} ${fontMedium}`}>
                <Icon path={SPARKLE} className="size-4 text-[#0d5c4b]" filled />
                {aiOpen ? "Hide ideas" : "Suggest with AI"}
              </button>
            )}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className={`h-1.5 flex-1 overflow-hidden rounded-full ${tone.track}`} role="progressbar" aria-label={`${title} progress`} aria-valuemin={0} aria-valuemax={min} aria-valuenow={Math.min(done, min)}>
              <div className={`h-full rounded-full transition-[width] duration-500 ${tone.bar}`} style={{ width: `${Math.min(100, (done / min) * 100)}%` }} />
            </div>
            <span className={`flex shrink-0 items-center gap-1 text-[12px] leading-[16px] ${complete ? tone.ink : "text-[#64748b]"} ${fontMedium}`}>
              {complete && <Icon path={CHECK} className="size-3.5" />}
              {progress}
            </span>
          </div>
        </div>
      </div>
      {ai && aiOpen && <div className="mt-4">{ai(() => setAiOpen(false))}</div>}
      {children}
    </section>
  );
}

const REFRESH = "M20 11a8 8 0 00-14.900-4M4 4v4h4M4 13a8 8 0 0014.900 4M20 20v-4h-4";

// The green panel that holds AI drafts, with Regenerate and Close in its header.
function AiPanel({ loading, note, onRegenerate, onClose, children, footer }: { loading: boolean; note: string; onRegenerate: () => void; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  return (
    <div role="region" aria-label="AI suggestions" aria-busy={loading} className="pop-in rounded-[12px] border border-[#0d5c4b]/15 bg-[#f6fbf9] p-3 md:p-4">
      <div className="flex items-center gap-2">
        <Icon path={SPARKLE} className={`size-4 shrink-0 text-[#0d5c4b] ${loading ? "animate-pulse" : ""}`} filled />
        <p className={`m-0 min-w-0 flex-1 text-[13px] leading-[18px] text-[#0f172a] ${fontSemi}`}>
          {loading ? "Writing suggestions…" : "AI suggestions"} <span className={`text-[#64748b] ${fontRegular}`}>· {note}</span>
        </p>
        <button type="button" onClick={onRegenerate} disabled={loading} className={`flex h-8 items-center gap-1.5 rounded-[8px] px-2 text-[13px] leading-[18px] text-[#0d5c4b] transition hover:bg-[#e6f4ee] disabled:opacity-50 ${fontMedium}`}>
          <Icon path={REFRESH} className={`size-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Regenerate</span>
        </button>
        <button type="button" aria-label="Close suggestions" onClick={onClose} className="flex size-8 items-center justify-center rounded-[8px] text-[#64748b] transition hover:bg-[#e6f4ee] hover:text-[#0f172a]">
          <Icon path={CLOSE} className="size-4" />
        </button>
      </div>
      <div className="mt-3">
        {loading ? (
          <div className="flex flex-col gap-2" aria-hidden="true">
            {["w-11/12", "w-4/5", "w-9/12"].map((w) => (
              <span key={w} className="flex h-10 items-center rounded-[8px] bg-white px-3">
                <span className={`h-2.5 animate-pulse rounded-full bg-[#e2e8f0] ${w}`} />
              </span>
            ))}
          </div>
        ) : (
          children
        )}
      </div>
      {!loading && footer && <div className="mt-3 flex flex-wrap items-center justify-end gap-2">{footer}</div>}
    </div>
  );
}

const aiPrimary = `flex h-9 items-center gap-1.5 rounded-[8px] bg-[#0d5c4b] px-3.5 text-[13px] leading-[18px] text-white transition hover:bg-[#0b4c3e] disabled:cursor-not-allowed disabled:opacity-50 ${fontMedium}`;
const aiSecondary = `flex h-9 items-center rounded-[8px] border border-[#e2e8f0] bg-white px-3.5 text-[13px] leading-[18px] text-[#0f172a] transition hover:bg-[#f8fafc] ${fontMedium}`;

// Loads drafts for a seed and reloads when Regenerate gives a new one. Late answers from an old seed are ignored.
function useDrafts<T>(load: (seed: number) => Promise<T>) {
  const [seed, setSeed] = useState(() => Date.now() % 100000);
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    let live = true;
    setData(null);
    load(seed).then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, [seed]);
  return { data, loading: data === null, regenerate: () => setSeed((s) => s + 7919) };
}

const courseContext = (draft: Draft): CourseContext => ({
  title: draft.title,
  subtitle: draft.subtitle,
  category: draft.category,
  subCategory: draft.subCategory,
  level: draft.level,
  topics: draft.topics,
  objectives: draft.objectives.map((p) => p.text.trim()).filter(Boolean),
});

// AI ideas for a list: one click adds an idea to the list (into the first empty row), and it leaves the ideas.
function PointSuggestions({ kind, draft, rows, onChange, close }: { kind: PointKind; draft: Draft; rows: Point[]; min: number; onChange: (next: Point[]) => void; close: () => void }) {
  const existing = rows.map((p) => p.text.trim()).filter(Boolean);
  const { data, loading, regenerate } = useDrafts((seed) => suggestPoints(kind, courseContext(draft), existing, seed));
  const [added, setAdded] = useState<string[]>([]);
  useEffect(() => setAdded([]), [data]);
  const ideas = (data ?? []).filter((t) => !added.includes(t));

  const add = (list: string[]) => {
    const queue = [...list];
    const next = rows.map((p) => (!p.text.trim() && queue.length ? { ...p, text: queue.shift()! } : p));
    onChange([...next, ...queue.map((text) => ({ id: uid("point"), text }))]);
    setAdded((a) => [...a, ...list]);
  };

  return (
    <div role="region" aria-label="Ideas" aria-busy={loading} className="pop-in rounded-[12px] border border-[#0d5c4b]/15 bg-[#f6fbf9] p-3 md:p-4">
      <div className="flex items-start gap-2">
        <Icon path={SPARKLE} className={`mt-0.5 size-4 shrink-0 text-[#0d5c4b] ${loading ? "animate-pulse" : ""}`} filled />
        <div className="min-w-0 flex-1">
          <p className={`m-0 text-[14px] leading-[20px] text-[#0f172a] ${fontSemi}`}>{loading ? "Finding ideas for your course…" : "Click an idea to add it"}</p>
          <p className={`m-0 text-[13px] leading-[18px] text-[#64748b] ${fontRegular}`}>You can edit or remove it afterwards.</p>
        </div>
        <button type="button" aria-label="Close ideas" onClick={close} className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#64748b] transition hover:bg-[#e6f4ee] hover:text-[#0f172a]">
          <Icon path={CLOSE} className="size-4" />
        </button>
      </div>

      <div className="mt-3">
        {loading ? (
          <div className="flex flex-col gap-2" aria-hidden="true">
            {["w-10/12", "w-8/12", "w-9/12"].map((w) => (
              <span key={w} className="flex h-10 items-center gap-2.5 rounded-[8px] bg-white px-3">
                <span className="size-5 shrink-0 animate-pulse rounded-full bg-[#e2e8f0]" />
                <span className={`h-2.5 animate-pulse rounded-full bg-[#e2e8f0] ${w}`} />
              </span>
            ))}
          </div>
        ) : ideas.length ? (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {ideas.map((text) => (
              <li key={text}>
                <button type="button" onClick={() => add([text])} className={`group flex w-full items-center gap-2.5 rounded-[8px] border border-transparent bg-white px-3 py-2.5 text-left text-[14px] leading-[20px] text-[#0f172a] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#0d5c4b]/30 ${fontRegular}`}>
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#e6f4ee] text-[#0d5c4b] transition group-hover:bg-[#0d5c4b] group-hover:text-white">
                    <Icon path={PLUS} className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">{text}</span>
                  <span className={`shrink-0 text-[12px] text-[#0d5c4b] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100 ${fontMedium}`}>Add</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={`m-0 rounded-[8px] bg-white px-3 py-3 text-[14px] leading-[20px] text-[#475569] ${fontRegular}`}>{added.length ? "All ideas added. Edit them below so they sound like you." : "No new ideas right now. Try a different set."}</p>
        )}
      </div>

      {!loading && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={regenerate} className={`flex h-8 items-center gap-1.5 rounded-[8px] px-2 text-[13px] leading-[18px] text-[#0d5c4b] transition hover:bg-[#e6f4ee] ${fontMedium}`}>
            <Icon path={REFRESH} className="size-4" />
            Show different ideas
          </button>
          {ideas.length > 1 && (
            <button type="button" onClick={() => add(ideas)} className={`h-8 rounded-[8px] px-2 text-[13px] leading-[18px] text-[#0d5c4b] underline-offset-2 transition hover:underline ${fontMedium}`}>
              Add all {ideas.length}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Title and subtitle ideas; clicking one puts it in the field.
function TitleSuggestions({ draft, update, close }: { draft: Draft; update: (patch: Partial<Draft>) => void; close: () => void }) {
  const { notify } = useApp();
  const { data, loading, regenerate } = useDrafts((seed) => suggestTitles(courseContext(draft), seed));
  const option = (text: string, onUse: () => void, current: boolean) => (
    <li key={text}>
      <button type="button" onClick={onUse} className={`group flex w-full items-center gap-3 rounded-[8px] border px-3 py-2.5 text-left text-[14px] leading-[20px] transition ${current ? "border-[#0d5c4b]/30 bg-white text-[#0f172a]" : "border-transparent bg-white/70 text-[#0f172a] hover:border-[#0d5c4b]/30 hover:bg-white"} ${fontRegular}`}>
        <span className="min-w-0 flex-1">{text}</span>
        <span className={`shrink-0 text-[12px] text-[#0d5c4b] ${current ? "" : "opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"} ${fontMedium}`}>{current ? "Using" : "Use"}</span>
      </button>
    </li>
  );
  const heading = `m-0 mb-1.5 text-[12px] leading-[16px] text-[#64748b] ${fontMedium}`;
  return (
    <AiPanel loading={loading} note="Pick one, then make it yours" onRegenerate={regenerate} onClose={close}>
      <p className={heading}>Titles</p>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {data?.titles.map((t) =>
          option(
            t,
            () => {
              update({ title: t });
              notify("Title updated");
            },
            t === draft.title,
          ),
        )}
      </ul>
      <p className={`${heading} mt-3`}>Subtitles</p>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {data?.subtitles.map((s) =>
          option(
            s,
            () => {
              update({ subtitle: s });
              notify("Subtitle updated");
            },
            s === draft.subtitle,
          ),
        )}
      </ul>
    </AiPanel>
  );
}

// A full description draft to read first, then use, replace or add to what is already written.
function DescriptionSuggestions({ draft, onInsert, close }: { draft: Draft; onInsert: (value: { text: string; html: string }) => void; close: () => void }) {
  const { notify } = useApp();
  const { data, loading, regenerate } = useDrafts((seed) => suggestDescription(courseContext(draft), seed));
  const hasText = !!draft.description.text.trim();
  const use = (mode: "replace" | "append") => {
    if (!data) return;
    onInsert(mode === "append" ? { text: `${draft.description.text}\n\n${data.text}`, html: `${draft.description.html}${data.html}` } : data);
    notify(mode === "append" ? "Draft added to your description" : "Description drafted. Read it through and make it yours.");
    close();
  };
  return (
    <AiPanel
      loading={loading}
      note={data ? `${wordCount(data.text)} words, written from your course details` : "Written from your course details"}
      onRegenerate={regenerate}
      onClose={close}
      footer={
        hasText ? (
          <>
            <button type="button" onClick={() => use("append")} className={aiSecondary}>
              Add to end
            </button>
            <button type="button" onClick={() => use("replace")} className={aiPrimary}>
              Replace mine
            </button>
          </>
        ) : (
          <button type="button" onClick={() => use("replace")} className={aiPrimary}>
            <Icon path={CHECK} className="size-4" />
            Use this draft
          </button>
        )
      }
    >
      {data && (
        <div className="max-h-[260px] overflow-y-auto rounded-[8px] bg-white px-4 py-3 [scrollbar-width:thin]">
          <NoteBody note={data} className="text-[14px] leading-[22px]" tone="text-[#334155]" />
        </div>
      )}
    </AiPanel>
  );
}

type SectionProps = { draft: Draft; saved: Draft; update: (patch: Partial<Draft>) => void; onExplain: () => void };

const OBJECTIVE_EXAMPLES = ["Build a complete project from start to finish", "Explain the key ideas in plain language", "Avoid the most common beginner mistakes", "Use what you learn in real work"];
const REQUIREMENT_EXAMPLES = ["A computer with internet access", "No coding experience needed"];
const AUDIENCE_EXAMPLES = ["Beginners who want a practical start", "Professionals adding a new skill to their work"];

function LearnersSection({ draft, saved, update, onExplain }: SectionProps) {
  const { notify } = useApp();
  // Row sparkle: write one new idea into that row, skipping anything already listed.
  const fillRow = (kind: PointKind) => async (id: string) => {
    const rows = draft[kind];
    const [idea] = await suggestPoints(kind, courseContext(draft), rows.map((p) => p.text.trim()).filter(Boolean), Date.now() % 100000);
    if (!idea) return notify("No new ideas right now. Try again in a moment.");
    update({ [kind]: rows.map((p) => (p.id === id ? { ...p, text: idea } : p)) } as Partial<Draft>);
  };
  const groups = [filled(draft.objectives) >= MIN_OBJECTIVES, filled(draft.requirements) >= 1, filled(draft.audience) >= 1];
  const doneGroups = groups.filter(Boolean).length;
  return (
    <div>
      <div className="min-w-0">
        <div className="flex items-center gap-4 rounded-[16px] bg-gradient-to-r from-[#e6f4ee] via-[#f1f8f5] to-[#fdfdfd] p-4 md:p-5">
          <div className="relative size-12 shrink-0">
            <svg viewBox="0 0 36 36" className="size-12 -rotate-90" aria-hidden="true">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#ffffff" strokeWidth="4" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="#0d5c4b" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(doneGroups / 3) * 94.25} 94.25`} className="transition-[stroke-dasharray] duration-500" />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-[13px] text-[#0d5c4b] ${fontSemi}`}>
              {doneGroups}/3
            </span>
          </div>
          <div className="min-w-0">
            <p className={`m-0 text-[15px] leading-[22px] text-[#0f172a] ${fontSemi}`}>{doneGroups === 3 ? "Your learners section is ready" : "Help the right students find you"}</p>
            <p className={`m-0 mt-0.5 text-[14px] leading-[20px] text-[#475569] [text-wrap:pretty] ${fontRegular}`}>
              Students read these on your course page before they enroll.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-5">
          <div data-preview-target="objectives">
            <PointGroup icon={TARGET} tone={BRAND} title="What students will learn" description="Start each one with an action, like Build, Write or Design." done={filled(draft.objectives)} min={MIN_OBJECTIVES} ai={(close) => <PointSuggestions kind="objectives" draft={draft} rows={draft.objectives} min={MIN_OBJECTIVES} onChange={(objectives) => update({ objectives })} close={close} />}>
              <PointList label="Objective" tone={BRAND} examples={OBJECTIVE_EXAMPLES} onSuggestRow={fillRow("objectives")} rows={draft.objectives} savedRows={saved.objectives} onChange={(objectives) => update({ objectives })} />
            </PointGroup>
          </div>
          <div data-preview-target="requirements">
            <PointGroup icon={TOOLS} tone={BRAND} title="Requirements" description="Skills, tools or knowledge students need first. If none, say so." done={filled(draft.requirements)} min={1} ai={(close) => <PointSuggestions kind="requirements" draft={draft} rows={draft.requirements} min={1} onChange={(requirements) => update({ requirements })} close={close} />}>
              <PointList label="Requirement" tone={BRAND} examples={REQUIREMENT_EXAMPLES} onSuggestRow={fillRow("requirements")} rows={draft.requirements} savedRows={saved.requirements} onChange={(requirements) => update({ requirements })} />
            </PointGroup>
          </div>
          <div data-preview-target="audience">
            <PointGroup
              icon={USERS}
              tone={BRAND}
              title="Who this course is for"
              description={
                <>
                  Name the people who will get the most from it.{" "}
                  <button type="button" onClick={onExplain} className={inlineLink}>
                    See tips
                  </button>
                </>
              }
              done={filled(draft.audience)}
              min={1}
              ai={(close) => <PointSuggestions kind="audience" draft={draft} rows={draft.audience} min={1} onChange={(audience) => update({ audience })} close={close} />}
            >
              <PointList label="Learner type" tone={BRAND} examples={AUDIENCE_EXAMPLES} onSuggestRow={fillRow("audience")} rows={draft.audience} savedRows={saved.audience} onChange={(audience) => update({ audience })} />
            </PointGroup>
          </div>
        </div>
      </div>
    </div>
  );
}

const MAX_TOPICS = 3;

// Searchable multi-select: type to filter, Enter picks the highlighted topic, Backspace in an empty box removes the last one.
function TopicsField({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const full = value.length >= MAX_TOPICS;
  const q = query.trim().toLowerCase();
  const matches = TOPIC_OPTIONS.filter((t) => t.toLowerCase().includes(q));
  const custom = q && !TOPIC_OPTIONS.some((t) => t.toLowerCase() === q) && !value.some((t) => t.toLowerCase() === q) ? query.trim() : "";
  const options = [...matches, ...(custom ? [custom] : [])];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  useEffect(() => setCursor(0), [query]);

  const toggle = (topic: string) => {
    if (value.includes(topic)) onChange(value.filter((t) => t !== topic));
    else if (!full) onChange([...value, topic]);
    setQuery("");
    inputRef.current?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setCursor((c) => Math.min(options.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && options[cursor]) toggle(options[cursor]);
    } else if (e.key === "Backspace" && !query && value.length) {
      onChange(value.slice(0, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <div className="field-box h-auto min-h-9 cursor-text flex-wrap gap-1.5 py-[5px] pl-1.5" onClick={() => inputRef.current?.focus()}>
        {value.map((topic) => (
          <span key={topic} className={`flex h-6 items-center gap-1 rounded-full border border-[#0d5c4b]/15 bg-[#eef7f3] pl-2.5 pr-1 text-[12.5px] leading-[16px] text-[#0d5c4b] ${fontMedium}`}>
            {topic}
            <button type="button" aria-label={`Remove ${topic}`} onClick={(e) => (e.stopPropagation(), onChange(value.filter((t) => t !== topic)))} className="flex size-4 items-center justify-center rounded-full text-[#0d5c4b]/70 transition hover:bg-[#0d5c4b] hover:text-white">
              <Icon path="M7 7l10 10M17 7L7 17" className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          role="combobox"
          aria-label="Topics"
          aria-expanded={open}
          aria-controls="topic-options"
          aria-activedescendant={open && options[cursor] ? `topic-option-${cursor}` : undefined}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={onKey}
          placeholder={full ? "" : value.length ? "Add another…" : "Search or add topics"}
          className={`h-6 min-w-[120px] flex-1 bg-transparent px-1.5 text-[16px] leading-[20px] text-[#0f172a] outline-none placeholder:text-slate-400 md:text-[14px] ${fontRegular}`}
        />
        <span className={`shrink-0 pr-0.5 text-[12px] tabular-nums ${full ? "text-[#0d5c4b]" : "text-[#94a3b8]"} ${fontMedium}`}>
          {value.length}/{MAX_TOPICS}
        </span>
      </div>
      {open && (
        <div id="topic-options" role="listbox" aria-label="Topics" aria-multiselectable="true" className="pop-in absolute top-full z-20 mt-1.5 flex max-h-[260px] w-full flex-col gap-0.5 overflow-y-auto rounded-[12px] border border-slate-200 bg-white p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_16px_36px_-8px_rgba(15,23,42,0.2)]">
          {full && <p className="field-help m-0 px-2.5 pb-1.5 pt-1">You've picked {MAX_TOPICS}. Remove one to choose another.</p>}
          {options.length === 0 && <p className={`m-0 px-2.5 py-2 text-[14px] text-[#64748b] ${fontRegular}`}>No topics found</p>}
          {options.map((topic, i) => {
            const on = value.includes(topic);
            const blocked = full && !on;
            return (
              <button
                key={topic}
                id={`topic-option-${i}`}
                type="button"
                role="option"
                aria-selected={on}
                aria-disabled={blocked}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setCursor(i)}
                onClick={() => !blocked && toggle(topic)}
                className={`flex h-9 shrink-0 items-center gap-2.5 rounded-[8px] px-2.5 text-left text-[14px] leading-[20px] transition-colors ${i === cursor && !blocked ? "bg-[#f1f5f9]" : ""} ${blocked ? "cursor-not-allowed text-[#cbd5e1]" : "text-[#0f172a]"} ${fontRegular}`}
              >
                <span className={`flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition ${on ? "border-[#0d5c4b] bg-[#0d5c4b] text-white" : "border-slate-300 bg-white"}`}>{on && <Icon path="M5 12.5l4.5 4.5L19 7.5" className="size-3" />}</span>
                <span className="min-w-0 flex-1 truncate">{topic === custom ? <>Add “{topic}”</> : topic}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const TAG = "M3 12V4a1 1 0 011-1h8l9 9-9 9zM7.5 7.5h.01";
const UPLOAD_CLOUD = "M7 18a4.500 4.500 0 01-.500-8.970A6 6 0 0118 8.500a4 4 0 01-1 7.900M12 12v8M9 15l3-3 3 3";
const SUBTITLE_LIMIT = 120;

// A cover or promo video slot: drop a file on it or click to choose one.
function MediaTile({ title, spec, filled, preview, badge, accept, onFile, onRemove, help }: { title: string; spec: string; filled: boolean; preview: ReactNode; badge?: string; accept: string; onFile: (file?: File) => void; onRemove?: () => void; help: ReactNode }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div className="min-w-0">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          onFile(e.dataTransfer.files?.[0]);
        }}
        className={`group relative aspect-video overflow-hidden rounded-[12px] transition ${over ? "ring-2 ring-[#0d5c4b] ring-offset-2" : ""} ${filled ? "bg-[#0f172a]" : "border border-dashed border-[#cbd5e1] bg-[#f8fafc]"}`}
      >
        {preview}
        {badge && <span className={`absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] leading-[16px] text-white backdrop-blur-sm ${fontMedium}`}>{badge}</span>}
        {!filled && (
          <button type="button" onClick={() => input.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center transition hover:bg-[#f1f5f9]">
            <span className="flex size-10 items-center justify-center rounded-full bg-white text-[#0d5c4b] shadow-[0_1px_3px_rgba(15,23,42,0.1)]">
              <Icon path={UPLOAD_CLOUD} className="size-5" />
            </span>
            <span className={`text-[13px] leading-[18px] text-[#0f172a] ${fontMedium}`}>
              Drop a file or <span className="text-[#0d5c4b] underline">browse</span>
            </span>
          </button>
        )}
      </div>
      <input ref={input} type="file" hidden aria-label={`Choose ${title.toLowerCase()}`} accept={accept} onChange={(e) => onFile(e.target.files?.[0])} />
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`m-0 text-[14px] leading-[20px] text-[#0f172a] ${fontSemi}`}>{title}</p>
          <p className="field-help m-0 mt-0.5">
            {spec} {help}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={() => input.current?.click()} className={`h-8 rounded-[8px] border border-[#e2e8f0] bg-white px-3 text-[13px] leading-[18px] text-[#0f172a] transition hover:bg-[#f8fafc] ${fontMedium}`}>
            {filled ? "Replace" : "Upload"}
          </button>
          {onRemove && (
            <button type="button" aria-label={`Remove ${title.toLowerCase()}`} title="Remove" onClick={onRemove} className="flex size-8 items-center justify-center rounded-[8px] text-[#94a3b8] transition hover:bg-[#fef2f2] hover:text-[#dc2626]">
              <Icon path={TRASH} className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailsSection({ draft, saved, update, fallbackCover, onSupport }: SectionProps & { fallbackCover: string; guide: { title: string; text: string }; onSupport: () => void }) {
  const { notify } = useApp();
  const [videoUrl, setVideoUrl] = useState(draft.promoVideo?.url ?? "");
  const [expanded, setExpanded] = useState(false);
  // The description editor only reads its starting text on mount, so an AI draft remounts it with the new text.
  const [descKey, setDescKey] = useState(0);
  const [descAiOpen, setDescAiOpen] = useState(false);
  const subs = categories.find((c) => c.name === draft.category)?.subs ?? [];

  // Field sparkles: swap in the next suggested title or subtitle that differs from the current one.
  const suggestField = (field: "title" | "subtitle") => async () => {
    const { titles, subtitles } = await suggestTitles(courseContext(draft), Date.now() % 100000);
    const next = (field === "title" ? titles : subtitles).find((s) => s !== draft[field]);
    if (next) update({ [field]: next } as Partial<Draft>);
    else notify("No new ideas right now. Try again in a moment.");
  };
  const words = wordCount(draft.description.text);
  const label = `mb-1.5 flex items-center justify-between gap-3 text-[14px] leading-[20px] text-[#0f172a] ${fontMedium}`;

  useEffect(() => () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  const pickCover = (file?: File) => {
    if (!file) return;
    if (!["image/webp", "image/jpeg", "image/png"].includes(file.type)) return notify("Use a .webp, .jpg, .jpeg or .png image");
    if (file.size > BANNER_MAX_UPLOAD_BYTES) return notify("Please choose an image under 10 MB");
    // Banners are cropped to 16:9, resized to 1600 × 900 px and compressed under 500 KB.
    prepareBanner(file)
      .then(async ({ file: small, lowRes }) => {
        if (lowRes) notify(`This image is smaller than ${BANNER_MIN.width} × ${BANNER_MIN.height} px, so it may look blurry`);
        const url = await uploadFile(small);
        if (url) return update({ cover: url });
        const reader = new FileReader();
        reader.onload = () => update({ cover: String(reader.result) });
        reader.readAsDataURL(small);
      })
      .catch(() => notify("Image upload failed. Please try again"));
  };

  const pickVideo = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) return notify("Choose a video file");
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) return notify(`Videos must be under ${MAX_VIDEO_MB} MB`);
    setVideoUrl(URL.createObjectURL(file));
    update({ promoVideo: { name: file.name, size: file.size } });
    uploadFile(file)
      .then((url) => {
        if (!url) return;
        update({ promoVideo: { name: file.name, size: file.size, url } });
        notify("Promo video saved");
      })
      .catch(() => notify("Promo video upload failed. Please try again"));
  };

  const basicsDone = [draft.title.trim(), draft.subtitle.trim(), draft.topics.length > 0].filter(Boolean).length;
  const setupDone = [draft.category, draft.subCategory, draft.level, draft.language].filter(Boolean).length;
  const mediaDone = [!!draft.cover, !!draft.promoVideo].filter(Boolean).length;
  const groupsDone = [basicsDone === 3, words >= MIN_DESCRIPTION_WORDS, setupDone === 4, mediaDone === 2].filter(Boolean).length;

  return (
    <div>
      <ProgressBanner
        done={groupsDone}
        total={4}
        title="Make a strong first impression"
        doneTitle="Your course page looks complete"
        text={
          <>
            This is what students and search engines see first.{" "}
            <button type="button" onClick={onSupport} className={inlineLink}>
              Title standards
            </button>
          </>
        }
      />
      <div className="mt-5 flex flex-col gap-5">
        <div data-preview-target="banner">
          <PointGroup icon={PENCIL} tone={BRAND} title="Basics" description="A clear title and subtitle help students find your course in search." done={basicsDone} min={3} ai={(close) => <TitleSuggestions draft={draft} update={update} close={close} />}>
            <div className="mt-5 flex flex-col gap-5">
              <div>
                <label htmlFor="course-title" className={label}>
                  Title
                  <span className={`field-help ${draft.title.length >= TITLE_LIMIT ? "!text-[#dc2626]" : ""}`}>
                    {draft.title.length}/{TITLE_LIMIT}
                  </span>
                </label>
                <AiInput id="course-title" label="Title" height="" value={draft.title} original={saved.title} maxLength={TITLE_LIMIT} placeholder="e.g. UI/UX Design with Figma: From Wireframe to Prototype" onSuggest={suggestField("title")} onChange={(title) => update({ title })} />
                {!draft.title.trim() && <p className="field-help mt-1.5 !text-[#dc2626]">Enter a course title</p>}
              </div>
              <div>
                <label htmlFor="course-subtitle" className={label}>
                  Subtitle
                  <span className="field-help">
                    {draft.subtitle.length}/{SUBTITLE_LIMIT}
                  </span>
                </label>
                <AiInput id="course-subtitle" label="Subtitle" height="" value={draft.subtitle} original={saved.subtitle} maxLength={SUBTITLE_LIMIT} placeholder="e.g. Design and test real app screens, step by step" onSuggest={suggestField("subtitle")} onChange={(subtitle) => update({ subtitle })} />
                <p className="field-help mt-1.5">Use one or two keywords and name the main skills students will gain.</p>
              </div>
              <div>
                <p className={label}>
                  Topics
                  <span className="field-help">Helps students find you in search</span>
                </p>
                <TopicsField value={draft.topics} onChange={(topics) => update({ topics: topics.slice(0, 3) })} />
              </div>
            </div>
          </PointGroup>
        </div>

        <div data-preview-target="overview">
          <PointGroup icon={ARTICLE} tone={BRAND} title="Description" description="Say what students will learn, how you teach it and who it is for." done={words}
            min={MIN_DESCRIPTION_WORDS}
            unit=" words"
            aiOpen={descAiOpen}
            onAiOpenChange={setDescAiOpen}
            ai={(close) => (
              <DescriptionSuggestions
                draft={draft}
                close={close}
                onInsert={(description) => {
                  update({ description });
                  setDescKey((k) => k + 1);
                }}
              />
            )}
          >
            <div className="mt-5">
              {expanded && <div aria-hidden="true" onClick={() => setExpanded(false)} className="overlay-fade fixed inset-0 z-40 bg-[#0f172a]/50" />}
              <div className={expanded ? "fixed inset-4 z-50 flex flex-col md:inset-10" : ""}>
                <NoteEditor
                  key={descKey}
                  modern
                  hideActions
                  hideUnderline
                  autoFocus={false}
                  initial={draft.description}
                  placeholder="Start with what students will be able to do after this course…"
                  boxClass={expanded ? "flex-1 shadow-2xl" : "min-h-[240px] max-h-[560px]"}
                  onCancel={() => setExpanded(false)}
                  onChange={(text, html) => update({ description: { text, html } })}
                  toolbarEnd={
                    <span className="flex items-center gap-1">
                      {!words && !descAiOpen && (
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setDescAiOpen(true)} className={`flex h-8 items-center gap-1.5 rounded-full bg-[#eef7f3] px-3 text-[13px] leading-[18px] text-[#0d5c4b] transition hover:bg-[#e0f0e9] ${fontMedium}`}>
                          <Icon path={SPARKLE} className="size-4" filled />
                          Draft with AI
                        </button>
                      )}
                      <span className={`hidden px-2 text-[12px] tabular-nums sm:inline ${words >= MIN_DESCRIPTION_WORDS ? "text-[#0d5c4b]" : "text-slate-400"} ${fontMedium}`}>{words ? `${words} words` : ""}</span>
                      <button type="button" aria-label={expanded ? "Exit full screen" : "Expand description editor"} aria-pressed={expanded} title={expanded ? "Exit full screen" : "Write in full screen"} onMouseDown={(e) => e.preventDefault()} onClick={() => setExpanded((v) => !v)} className="flex size-8 items-center justify-center rounded-[8px] text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                        <HugeiconsIcon icon={expanded ? MinimizeScreenIcon : MaximizeScreenIcon} size={18} strokeWidth={1.8} aria-hidden="true" />
                      </button>
                    </span>
                  }
                />
              </div>
            </div>
          </PointGroup>
        </div>

        <div data-preview-target="banner">
          <PointGroup icon={TAG} tone={BRAND} title="Category and level" description="Puts your course in the right place when students browse." done={setupDone} min={4}>
            <div className="mt-5 grid gap-4 @lg:grid-cols-2">
              <SelectField id="course-category" label="Category" value={draft.category} onChange={(category) => update({ category, subCategory: "" })} placeholder="Select a category" options={[...new Set([...categories.map((c) => c.name as string), ...(draft.category ? [draft.category] : [])])]} />
              <SelectField id="course-subcategory" label="Sub category" value={draft.subCategory} onChange={(subCategory) => update({ subCategory })} placeholder={draft.category ? "Select a sub category" : "Choose a category first"} options={[...subs]} />
              <SelectField id="course-level" label="Level" value={draft.level} onChange={(level) => update({ level })} placeholder="Select a level" options={LEVELS} />
              <SelectField id="course-language" label="Language" value={draft.language} onChange={(language) => update({ language })} placeholder="Select a language" options={LANGUAGES} />
            </div>
          </PointGroup>
        </div>

        <div data-preview-target="card">
          <PointGroup icon={IMAGE} tone={BRAND} title="Cover and promo video" description="Courses with a promo video get noticeably more enrollments." done={mediaDone} min={2}>
            <div className="mt-5 grid gap-5 @lg:grid-cols-2">
              <MediaTile
                title="Cover image"
                spec="16:9, at least 750 × 422 px. JPG, PNG or WEBP, up to 10 MB."
                filled
                badge={draft.cover ? undefined : "Sample image"}
                preview={<img src={draft.cover || fallbackCover} alt="Course cover" className="size-full object-cover" />}
                accept=".webp,.jpg,.jpeg,.png"
                onFile={pickCover}
                onRemove={draft.cover ? () => update({ cover: "" }) : undefined}
                help={
                  <button type="button" onClick={onSupport} className={inlineLink}>
                    Guidelines
                  </button>
                }
              />
              <MediaTile
                title="Promo video"
                spec={`Up to ${MAX_VIDEO_MB} MB. 1–2 minutes works best.`}
                filled={!!draft.promoVideo}
                preview={
                  videoUrl ? (
                    <video src={videoUrl} controls aria-label="Promotional video preview" className="size-full object-contain" />
                  ) : draft.promoVideo ? (
                    <span className="flex size-full flex-col items-center justify-center gap-2 px-4 text-center text-white/80">
                      <Icon path={VIDEO} className="size-8" />
                      <span className={`max-w-full truncate text-[13px] ${fontMedium}`}>{draft.promoVideo.name}</span>
                    </span>
                  ) : null
                }
                accept="video/*"
                onFile={pickVideo}
                onRemove={draft.promoVideo ? () => {
                  setVideoUrl("");
                  update({ promoVideo: null });
                } : undefined}
                help={
                  <button type="button" onClick={onSupport} className={inlineLink}>
                    How to make one
                  </button>
                }
              />
            </div>
          </PointGroup>
        </div>
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
// Each content type gets its own soft colour, so a curriculum scans at a glance.
const KIND_TONES: Record<LectureKind, string> = {
  Video: "bg-[#eef7f3] text-[#0d5c4b]",
  Quiz: "bg-[#fff7e6] text-[#b45309]",
  Assignment: "bg-[#f3f0ff] text-[#6d28d9]",
  Article: "bg-[#eff6ff] text-[#1d4ed8]",
};
const KIND_HINTS: Record<LectureKind, string> = {
  Video: "Teach a topic on camera or screen",
  Quiz: "Check what students learned",
  Assignment: "Give hands-on practice",
  Article: "Add reading or notes",
};
const toSeconds = (duration?: string) => (duration ?? "").split(":").map(Number).reduce((total, part) => (Number.isFinite(part) ? total * 60 + part : total), 0);
const formatTotal = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
};

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
  const link = "underline decoration-[#0d5c4b]/30 underline-offset-4 transition hover:text-[#0d5c4b] hover:decoration-[#0d5c4b]";
  return (
    <div className="flex items-start gap-4 rounded-[16px] border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <span aria-hidden="true" className="hidden size-12 shrink-0 items-center justify-center rounded-[12px] bg-[#eef7f3] text-[#0d5c4b] @lg:flex">
        <svg viewBox="0 0 48 40" className="h-7 w-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 29V12a2 2 0 012-2h22M40 21v8" />
          <path d="M3 31h42v2a2 2 0 01-2 2H5a2 2 0 01-2-2zM20 31v1h8v-1" />
          <path d="M19 24c1-4 4-6 8-6v-3l6 5-6 5v-3c-3 0-5 .5-8 2z" fill="currentColor" />
          <rect x="33" y="3" width="13" height="14" rx="2" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className={`m-0 text-[15px] leading-[26px] text-[#334155] ${fontRegular}`}>
          Organise your course into sections,{" "}
          <button type="button" onClick={onExplain} className={link}>
            lectures
          </button>{" "}
          and practice like{" "}
          <button type="button" onClick={onExplain} className={link}>
            quizzes
          </button>{" "}
          and{" "}
          <button type="button" onClick={onExplain} className={link}>
            assignments
          </button>
          . Follow your course outline and give each section a clear name.
        </p>
        <button type="button" onClick={onSupport} className={`mt-2 inline-flex items-center gap-1.5 text-[14px] leading-[20px] text-[#0d5c4b] transition hover:text-[#0b4c3e] hover:underline ${fontSemi}`}>
          Learn more in the Support Center
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
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
    <div aria-hidden="true" className="float-y relative h-[130px] w-[172px]">
      <span className="absolute inset-y-0 left-[22px] w-[128px] rounded-[12px] bg-[#e3f1eb]" />
      {rows.map((row) => (
        <span key={row.path} className={`absolute flex w-[132px] items-center gap-2 ${row.left} ${row.top}`}>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-[#0d5c4b] text-white shadow-[0_4px_10px_-4px_rgba(13,92,75,0.6)]">
            <Icon path={row.path} className="size-4" />
          </span>
          <span className="flex h-8 flex-1 flex-col justify-center gap-1.5 rounded-[6px] bg-white px-2 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <span className="h-1 w-7 rounded-full bg-[#94a3b8]" />
            <span className="h-1 w-11 rounded-full bg-[#cbd5e1]" />
          </span>
        </span>
      ))}
    </div>
  );
}

function LectureDrawer({ lecture, context, uploadProgress, videoUrl, onCancel, onSave, onUpdateVideo, onLibrary }: { lecture: Lecture; context: LectureContext; uploadProgress?: number; videoUrl?: string; onCancel: () => void; onSave: (patch: Partial<Lecture>) => void; onUpdateVideo: () => void; onLibrary: () => void }) {
  const { notify } = useApp();
  const [title, setTitle] = useState(lecture.title);
  const [preview, setPreview] = useState(!!lecture.preview);
  const [description, setDescription] = useState(lecture.description ?? "");
  const [resources, setResources] = useState(lecture.resources ?? []);
  const [playing, setPlaying] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = uploadProgress !== undefined;
  // AI drafts: written from the course, section and lecture details (see aiSuggest.ts).
  const [titleIdeas, setTitleIdeas] = useState<string[] | null>(null);
  const [titleLoading, setTitleLoading] = useState(false);
  const [descLoading, setDescLoading] = useState(false);
  const [previousDescription, setPreviousDescription] = useState<string | null>(null);
  const typing = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearInterval(typing.current), []);
  const suggestTitle = async () => {
    setTitleLoading(true);
    try {
      setTitleIdeas(await suggestLectureTitles({ ...context, lectureTitle: title }, Date.now() % 100000));
    } finally {
      setTitleLoading(false);
    }
  };
  const writeDescription = async () => {
    setDescLoading(true);
    try {
      const text = await suggestLectureDescription({ ...context, lectureTitle: title }, Date.now() % 100000, LECTURE_DESCRIPTION_LIMIT);
      setPreviousDescription(description);
      // Types the draft in quickly, like a model streaming its answer.
      let shown = 0;
      window.clearInterval(typing.current);
      typing.current = window.setInterval(() => {
        shown = Math.min(text.length, shown + 6);
        setDescription(text.slice(0, shown));
        if (shown >= text.length) window.clearInterval(typing.current);
      }, 16);
    } catch {
      notify("Could not write a description. Please try again");
    } finally {
      setDescLoading(false);
    }
  };
  const aiLink = `flex items-center gap-1.5 rounded-full bg-[#f5f0ff] px-2.5 py-1 text-[12px] leading-[16px] text-[#6016fc] transition hover:bg-[#ece3ff] disabled:opacity-60 ${fontMedium}`;
  const spinner = <span aria-hidden="true" className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />;
  // Compact cards: the whole drawer fits on one screen, so nothing needs scrolling.
  const card = "rounded-[14px] border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]";
  const heading = `m-0 text-[15px] leading-[22px] text-[#0f172a] ${fontSemi}`;
  const hint = `m-0 text-[12px] leading-[18px] text-[#64748b] ${fontRegular}`;
  const options = [
    { value: false, icon: LockIcon, title: "Locked", text: "Only enrolled students can watch it." },
    { value: true, icon: ViewIcon, title: "Free preview", text: "Anyone can watch it before they enroll." },
  ];

  return (
    <Shell title={`Edit ${lectureName(lecture)}`} variant="drawer" drawerWidth="max-w-[640px]" hideHeader onClose={onCancel}>
      <div className="flex min-h-full flex-col bg-[#f8fafc]">
        {/* Header: type, editable title, actions. */}
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-[#e2e8f0] bg-white px-5 py-3">
          <span aria-hidden="true" className={`hidden size-10 shrink-0 items-center justify-center rounded-[12px] sm:flex ${KIND_TONES[lecture.kind]}`}>
            <Icon path={KIND_ICONS[lecture.kind]} className="size-5" />
          </span>
          <div className="min-w-[220px] flex-1">
            <div className="flex items-center gap-2.5">
              <label htmlFor="lecture-title" className={`text-[11px] uppercase leading-[14px] tracking-[0.08em] text-[#0d5c4b] ${fontSemi}`}>
                {lecture.kind} lecture
              </label>
              <button type="button" onClick={suggestTitle} disabled={titleLoading} className={aiLink}>
                {titleLoading ? spinner : <Icon path={SPARKLE} className="size-3.5" filled />}
                {titleLoading ? "Thinking…" : "Suggest titles"}
              </button>
            </div>
            <input id="lecture-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lecture title" className={`-ml-2 mt-0.5 h-8 w-full rounded-[8px] px-2 text-[18px] leading-[26px] text-[#0f172a] outline-none transition hover:bg-[#f8fafc] focus:bg-[#f8fafc] focus:ring-3 focus:ring-[#0d5c4b]/12 ${fontSemi}`} />
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onCancel} className={`h-9 rounded-[10px] border border-[#e2e8f0] bg-white px-4 text-[14px] leading-[20px] text-[#334155] transition hover:bg-[#f8fafc] ${fontMedium}`}>
              Cancel
            </button>
            <button type="button" onClick={() => onSave({ title: title.trim() || lecture.title, preview, description, resources })} className={`h-9 rounded-[10px] bg-[#0d5c4b] px-4 text-[14px] leading-[20px] text-white shadow-[0_1px_2px_rgba(13,92,75,0.25),0_8px_20px_-10px_rgba(13,92,75,0.6)] transition hover:bg-[#0b4c3e] ${fontMedium}`}>
              Save lecture
            </button>
          </div>
          {titleIdeas && (
            <div className="pop-in flex w-full flex-wrap items-center gap-2 rounded-[12px] border border-[#e9dfff] bg-[#faf7ff] p-2.5">
              <span className={`flex items-center gap-1.5 pl-1 text-[12px] leading-[16px] text-[#6016fc] ${fontSemi}`}>
                <Icon path={SPARKLE} className="size-3.5" filled />
                Pick a title
              </span>
              {titleIdeas.length === 0 && <span className={`text-[13px] text-[#64748b] ${fontRegular}`}>No new ideas. Try again.</span>}
              {titleIdeas.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => {
                    setTitle(idea);
                    setTitleIdeas(null);
                  }}
                  className={`rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-left text-[13px] leading-[18px] text-[#0f172a] transition hover:border-[#6016fc]/50 hover:text-[#6016fc] ${fontMedium}`}
                >
                  {idea}
                </button>
              ))}
              <span className="ml-auto flex items-center gap-1">
                <button type="button" onClick={suggestTitle} disabled={titleLoading} className={`rounded-[8px] px-2 py-1 text-[12px] leading-[16px] text-[#6016fc] transition hover:bg-[#f0e9ff] disabled:opacity-60 ${fontMedium}`}>
                  {titleLoading ? "Thinking…" : "Try again"}
                </button>
                <button type="button" aria-label="Close title ideas" onClick={() => setTitleIdeas(null)} className="flex size-7 items-center justify-center rounded-[8px] text-[#64748b] transition hover:bg-[#f0e9ff]">
                  <Icon path={CLOSE} className="size-4" />
                </button>
              </span>
            </div>
          )}
        </div>

        {/* One compact column: video, access, description, resources. */}
        <div className="flex flex-col gap-3 px-5 py-4">
            {lecture.kind === "Video" && (
              <section className={card}>
                {playing && videoUrl ? (
                  <video src={videoUrl} controls autoPlay aria-label="Lecture video" className="aspect-video w-full rounded-[10px] bg-[#0f172a]" />
                ) : (
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      aria-label="Play video"
                      title={busy ? "You can play it when processing is complete" : videoUrl ? "Play video" : "This video can only be previewed in the session it was uploaded"}
                      disabled={busy || !videoUrl}
                      onClick={() => setPlaying(true)}
                      className="group relative flex aspect-video w-[180px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[linear-gradient(135deg,#0f172a,#1e1b4b)] text-white disabled:cursor-not-allowed"
                    >
                      {videoUrl && <video src={videoUrl} preload="metadata" muted aria-hidden="true" tabIndex={-1} className="absolute inset-0 size-full object-cover" />}
                      <span aria-hidden="true" className="absolute inset-0 bg-black/20" />
                      <span className="relative flex size-10 items-center justify-center rounded-full bg-white/95 text-[#0d5c4b] shadow-[0_8px_20px_-6px_rgba(0,0,0,0.5)] transition group-enabled:group-hover:scale-105">
                        <Icon path={PLAY} className="ml-0.5 size-5" filled />
                      </span>
                      {lecture.duration && <span className={`absolute bottom-1.5 right-1.5 rounded-[6px] bg-black/60 px-1.5 py-0.5 text-[11px] leading-[14px] tabular-nums ${fontMedium}`}>{lecture.duration}</span>}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`m-0 truncate text-[14px] leading-[20px] text-[#0f172a] ${fontSemi}`} title={lecture.file}>
                        {lecture.file ?? "No video yet"}
                      </p>
                      <p className={`${hint} mt-0.5`}>MP4, MOV or WEBM, up to {MAX_LECTURE_VIDEO_MB} MB</p>
                      <div className="mt-2.5">
                        <ActionMenu
                          alignLeft
                          label="Update Video"
                          triggerClass={`flex h-8 items-center gap-1.5 rounded-[8px] border border-[#e2e8f0] bg-white px-2.5 text-[13px] leading-[18px] text-[#334155] transition hover:bg-[#f8fafc] ${fontMedium}`}
                          trigger={
                            <>
                              Replace video
                              <Icon path={DOWN} className="size-4" />
                            </>
                          }
                          items={[
                            { label: "Upload a new video", onClick: onUpdateVideo },
                            { label: "Add from Library", onClick: onLibrary },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                )}
                {busy && (
                  <div role="status" className="mt-3">
                    <p className={`m-0 flex items-center justify-between gap-3 text-[12px] leading-[18px] text-[#0d5c4b] ${fontMedium}`}>
                      <span>{uploadProgress < 100 ? "Uploading your video…" : "Processing your video…"}</span>
                      {uploadProgress < 100 && <span className="tabular-nums">{uploadProgress}%</span>}
                    </p>
                    <span aria-hidden="true" className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[#d6ebe2]">
                      <span className={`block h-full rounded-full bg-[#0d5c4b] transition-[width] ${uploadProgress >= 100 ? "animate-pulse" : ""}`} style={{ width: `${Math.min(uploadProgress, 100)}%` }} />
                    </span>
                  </div>
                )}
              </section>
            )}
            <section className={card}>
              <h3 className={heading}>Who can watch</h3>
              <p className={hint}>Free previews help students decide before they buy.</p>
              <div className="mt-2.5 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Item preview">
                {options.map((option) => {
                  const on = preview === option.value;
                  return (
                    <label key={option.title} className={`flex cursor-pointer items-start gap-2.5 rounded-[12px] border p-3 transition has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-[#0d5c4b]/20 ${on ? "border-[#0d5c4b] bg-[#f4faf7] shadow-[0_0_0_1px_#0d5c4b]" : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"}`}>
                      <input type="radio" name="lecture-preview" checked={on} onChange={() => setPreview(option.value)} className="sr-only" />
                      <span className={`flex size-8 shrink-0 items-center justify-center rounded-[9px] ${on ? "bg-[#0d5c4b] text-white" : "bg-[#f1f5f9] text-[#475569]"}`}>
                        <HugeiconsIcon icon={option.icon} size={16} strokeWidth={1.8} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[13px] leading-[18px] text-[#0f172a] ${fontSemi}`}>{option.title}</span>
                        <span className={`mt-0.5 block text-[12px] leading-[17px] text-[#64748b] ${fontRegular}`}>{option.text}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
            <section className={card}>
              <h3 className={heading}>
                <label htmlFor="lecture-description">Description</label>
              </h3>
              <p className={hint}>Tell students what this lecture covers.</p>
              {/* Composer: text, counter and AI in one box that lights up while typing. */}
              <div className="mt-2.5 overflow-hidden rounded-[12px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition focus-within:border-[#0d5c4b]/60 focus-within:shadow-[0_0_0_3px_rgba(13,92,75,0.12)] hover:border-[#cbd5e1]">
                <textarea
                  id="lecture-description"
                  rows={lecture.kind === "Video" ? 4 : 7}
                  maxLength={LECTURE_DESCRIPTION_LIMIT}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will students learn or build in this lecture?"
                  className={`block w-full resize-none bg-transparent px-3.5 pb-2 pt-3 text-[14px] leading-[22px] text-[#0f172a] outline-none placeholder:text-[#94a3b8] ${fontRegular}`}
                />
                <div className="flex items-center justify-between gap-3 border-t border-[#f1f5f9] bg-[#fbfcfd] px-2.5 py-2">
                  <span className={`flex items-center gap-2 pl-1 text-[12px] leading-[16px] tabular-nums ${description.length > LECTURE_DESCRIPTION_LIMIT * 0.9 ? "text-[#b45309]" : "text-[#94a3b8]"} ${fontMedium}`}>
                    {/* Ring fills as the limit gets closer. */}
                    <svg viewBox="0 0 20 20" className="size-4 -rotate-90" aria-hidden="true">
                      <circle cx="10" cy="10" r="8" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
                      <circle cx="10" cy="10" r="8" fill="none" stroke={description.length > LECTURE_DESCRIPTION_LIMIT * 0.9 ? "#f59e0b" : "#0d5c4b"} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${(description.length / LECTURE_DESCRIPTION_LIMIT) * 50.27} 50.27`} className="transition-[stroke-dasharray]" />
                    </svg>
                    {LECTURE_DESCRIPTION_LIMIT - description.length} characters left
                  </span>
                  <span className="flex items-center gap-1.5">
                    {previousDescription !== null && !descLoading && (
                      <button
                        type="button"
                        onClick={() => {
                          window.clearInterval(typing.current);
                          setDescription(previousDescription);
                          setPreviousDescription(null);
                        }}
                        className={`h-8 rounded-[8px] px-2.5 text-[13px] leading-[18px] text-[#475569] transition hover:bg-[#f1f5f9] ${fontMedium}`}
                      >
                        Undo
                      </button>
                    )}
                    <button type="button" onClick={writeDescription} disabled={descLoading} className={`flex h-8 items-center gap-1.5 rounded-[8px] bg-[linear-gradient(135deg,#7c3aed,#6016fc)] px-3 text-[13px] leading-[18px] text-white shadow-[0_6px_16px_-8px_rgba(96,22,252,0.7)] transition hover:brightness-110 disabled:opacity-70 ${fontMedium}`}>
                      {descLoading ? spinner : <Icon path={SPARKLE} className="size-3.5" filled />}
                      {descLoading ? "Writing…" : description.trim() ? "Rewrite with AI" : "Write with AI"}
                    </button>
                  </span>
                </div>
              </div>
            </section>
            <section className={card}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className={heading}>Downloadable resources</h3>
                  <p className={hint}>Slides, worksheets or source files.</p>
                </div>
                <button type="button" onClick={() => fileRef.current?.click()} className={`flex h-8 shrink-0 items-center gap-1.5 rounded-[8px] border border-[#e2e8f0] bg-white px-2.5 text-[13px] leading-[18px] text-[#334155] transition hover:border-[#0d5c4b]/50 hover:text-[#0d5c4b] ${fontMedium}`}>
                  <HugeiconsIcon icon={Attachment01Icon} size={16} strokeWidth={1.8} aria-hidden="true" />
                  Attach files
                </button>
              </div>
              {resources.length > 0 ? (
                // Long lists scroll inside this box, so the drawer itself stays still.
                <ul className="mt-3 flex max-h-[176px] flex-col gap-1.5 overflow-y-auto">
                  {resources.map((file) => (
                    <li key={file.id} className="group flex items-center gap-2.5 rounded-[10px] border border-[#eef1f4] bg-[#fbfcfd] px-2.5 py-1.5">
                      <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-[#eff6ff] text-[#1d4ed8]">
                        <HugeiconsIcon icon={File02Icon} size={15} strokeWidth={1.8} />
                      </span>
                      <span className={`min-w-0 flex-1 truncate text-[13px] leading-[18px] text-[#0f172a] ${fontMedium}`}>{file.name}</span>
                      <span className={`shrink-0 rounded-full bg-[#f1f5f9] px-1.5 py-0.5 text-[10px] uppercase leading-[14px] text-[#475569] ${fontSemi}`}>{file.name.split(".").pop()}</span>
                      <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setResources(resources.filter((f) => f.id !== file.id))} className="flex size-7 shrink-0 items-center justify-center rounded-[7px] text-[#64748b] opacity-0 transition hover:bg-[#fef2f2] hover:text-[#dc2626] focus:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100">
                        <Icon path={TRASH} className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()} className={`mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#cbd5e1] bg-[#fbfcfd] text-[13px] leading-[18px] text-[#64748b] transition hover:border-[#0d5c4b]/50 hover:bg-[#f4faf7] hover:text-[#0d5c4b] ${fontRegular}`}>
                  No files yet. Click to attach.
                </button>
              )}
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
            </section>
        </div>
      </div>
    </Shell>
  );
}

const blankOption = (correct = false): QuizOption => ({ id: uid("option"), text: "", explanation: "", correct, saved: false });
const blankQuestion = (): QuizQuestion => ({ id: uid("question"), text: "", relatedLecture: "", required: false, randomise: false, multiple: false, options: [blankOption(true), blankOption()] });
// A question is ready when it has text, at least two written answers and a correct one among them.
const questionReady = (q: QuizQuestion) => !!q.text.trim() && q.options.filter((o) => o.text.trim()).length >= 2 && q.options.some((o) => o.correct && o.text.trim());
const fromDraft = (d: QuizDraft): QuizQuestion => ({ ...blankQuestion(), text: d.text, options: d.options.map((o) => ({ id: uid("option"), text: o.text, explanation: o.explanation, correct: o.correct, saved: true })) });

function QuizDrawer({ lecture, context, lectureOptions, onCancel, onSave }: { lecture: Lecture; context: LectureContext; lectureOptions: { id: string; label: string }[]; onCancel: () => void; onSave: (patch: Partial<Lecture>) => void }) {
  const { notify } = useApp();
  const defaults: QuizSettings = { passScore: "", retakes: true, shuffle: false };
  const [title, setTitle] = useState(lecture.title);
  const [questions, setQuestions] = useState<QuizQuestion[]>(lecture.questions ?? []);
  const [settings, setSettings] = useState<QuizSettings>(lecture.quizSettings ?? defaults);
  const [activeId, setActiveId] = useState(lecture.questions?.[0]?.id ?? "");
  const [openExplain, setOpenExplain] = useState<Record<string, boolean>>({});
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [removingId, setRemovingId] = useState("");
  const [aiBusy, setAiBusy] = useState<"" | "one" | "set" | "title">("");
  const [titleIdeas, setTitleIdeas] = useState<string[] | null>(null);
  const answerRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const focusNext = useRef("");
  const activeIndex = questions.findIndex((q) => q.id === activeId);
  const active = questions[activeIndex];
  const ready = questions.filter(questionReady).length;
  const dirty = title !== lecture.title || JSON.stringify(questions) !== JSON.stringify(lecture.questions ?? []) || JSON.stringify(settings) !== JSON.stringify(lecture.quizSettings ?? defaults);
  const close = () => (dirty ? setConfirmLeave(true) : onCancel());
  const patchActive = (patch: Partial<QuizQuestion>) => setQuestions((list) => list.map((q) => (q.id === activeId ? { ...q, ...patch } : q)));
  const patchOption = (id: string, patch: Partial<QuizOption>) => active && patchActive({ options: active.options.map((o) => (o.id === id ? { ...o, ...patch } : o)) });

  // Puts the cursor in a new answer after it appears.
  useEffect(() => {
    if (focusNext.current) answerRefs.current[focusNext.current]?.focus();
    focusNext.current = "";
  });

  const addQuestion = () => {
    const question = blankQuestion();
    setQuestions((list) => [...list, question]);
    setActiveId(question.id);
  };
  const addAnswer = () => {
    if (!active) return;
    const option = blankOption();
    focusNext.current = option.id;
    patchActive({ options: [...active.options, option] });
  };
  const removeAnswer = (id: string) => {
    if (!active || active.options.length <= 2) return;
    const options = active.options.filter((o) => o.id !== id);
    if (!options.some((o) => o.correct)) options[0] = { ...options[0], correct: true };
    patchActive({ options });
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
  const setMultiple = (multiple: boolean) => {
    if (!active || active.multiple === multiple) return;
    if (multiple) return patchActive({ multiple: true });
    const firstCorrect = active.options.find((o) => o.correct)?.id;
    patchActive({ multiple: false, options: active.options.map((o) => ({ ...o, correct: o.id === firstCorrect })) });
  };
  const duplicate = (question: QuizQuestion, i: number) => {
    const copy = { ...question, id: uid("question"), options: question.options.map((o) => ({ ...o, id: uid("option") })) };
    setQuestions((list) => [...list.slice(0, i + 1), copy, ...list.slice(i + 1)]);
    setActiveId(copy.id);
  };
  const aiContext = (): LectureContext => {
    const related = lectureOptions.find((o) => o.id === active?.relatedLecture);
    return { ...context, kind: "Quiz", lectureTitle: related ? related.label.replace(/^Lecture \d+ : /, "") : title };
  };
  const generate = async (count: number) => {
    setAiBusy(count === 1 ? "one" : "set");
    try {
      const drafts = await suggestQuizQuestions(aiContext(), count, Date.now() % 100000, questions.map((q) => q.text));
      if (!drafts.length) return notify("No new questions to suggest. Try changing the quiz title");
      const made = drafts.map(fromDraft);
      // One question fills the current empty question; otherwise new questions are added at the end.
      if (count === 1 && active && !active.text.trim() && active.options.every((o) => !o.text.trim())) {
        setQuestions((list) => list.map((q) => (q.id === active.id ? { ...made[0], id: active.id, relatedLecture: q.relatedLecture } : q)));
      } else {
        setQuestions((list) => [...list, ...made]);
        setActiveId(made[0].id);
      }
      notify(made.length === 1 ? "Question added. Check the answers before you save" : `${made.length} questions added. Check the answers before you save`);
    } finally {
      setAiBusy("");
    }
  };
  const suggestTitle = async () => {
    setAiBusy("title");
    try {
      setTitleIdeas(await suggestLectureTitles({ ...context, kind: "Quiz", lectureTitle: title }, Date.now() % 100000));
    } finally {
      setAiBusy("");
    }
  };
  const saveAll = () => {
    // Saves every question as it is. Empty extra answers are dropped, and each question keeps one correct answer.
    const clean = questions.map((q) => {
      const written = q.options.filter((o) => o.text.trim());
      let options = (written.length >= 2 ? written : q.options).map((o) => ({ ...o, text: o.text.trim(), explanation: o.explanation.trim(), saved: true }));
      if (!options.some((o) => o.correct)) options = options.map((o, i) => ({ ...o, correct: i === 0 }));
      return { ...q, text: q.text.trim(), options };
    });
    onSave({ title: title.trim() || lecture.title, questions: clean, quizSettings: settings });
  };

  const aiChip = `flex items-center gap-1.5 rounded-full bg-[#f5f0ff] px-2.5 py-1 text-[12px] leading-[16px] text-[#6016fc] transition hover:bg-[#ece3ff] disabled:opacity-60 ${fontMedium}`;
  const aiButton = `flex h-9 items-center gap-1.5 rounded-[10px] bg-[linear-gradient(135deg,#7c3aed,#6016fc)] px-3.5 text-[13px] leading-[18px] text-white shadow-[0_6px_16px_-8px_rgba(96,22,252,0.7)] transition hover:brightness-110 disabled:opacity-70 ${fontMedium}`;
  const spinner = <span aria-hidden="true" className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />;
  const pill = (on: boolean) => `h-8 rounded-[8px] px-3 text-[13px] leading-[18px] transition ${on ? `bg-white text-[#0f172a] shadow-[0_1px_2px_rgba(15,23,42,0.12)] ${fontSemi}` : `text-[#64748b] hover:text-[#0f172a] ${fontMedium}`}`;
  const check = (on: boolean, label: string, change: () => void) => (
    <label className={`flex cursor-pointer items-center gap-2 text-[13px] leading-[18px] text-[#334155] ${fontMedium}`}>
      <Toggle on={on} label={label} onChange={change} />
      {label}
    </label>
  );

  return (
    <Shell title={`Edit ${lectureName(lecture)}`} variant="drawer" drawerWidth="xl:max-w-[1180px]" hideHeader onClose={close}>
      <div className="@container flex min-h-full flex-col bg-[#f8fafc]">
        {/* Header: quiz title, progress and one save button. */}
        <header className="sticky top-0 z-20 border-b border-[#e2e8f0] bg-white/95 px-5 py-3 backdrop-blur @3xl:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <span aria-hidden="true" className={`hidden size-10 shrink-0 items-center justify-center rounded-[12px] sm:flex ${KIND_TONES.Quiz}`}>
              <Icon path={KIND_ICONS.Quiz} className="size-5" />
            </span>
            <div className="min-w-[200px] flex-1">
              <div className="flex items-center gap-2.5">
                <label htmlFor="quiz-title" className={`text-[11px] uppercase leading-[14px] tracking-[0.08em] text-[#b45309] ${fontSemi}`}>
                  Quiz
                </label>
                <button type="button" onClick={suggestTitle} disabled={aiBusy === "title"} className={aiChip}>
                  {aiBusy === "title" ? spinner : <Icon path={SPARKLE} className="size-3.5" filled />}
                  {aiBusy === "title" ? "Thinking…" : "Suggest titles"}
                </button>
              </div>
              <input id="quiz-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quiz title" className={`-ml-2 mt-0.5 h-8 w-full rounded-[8px] px-2 text-[18px] leading-[26px] text-[#0f172a] outline-none transition hover:bg-[#f8fafc] focus:bg-[#f8fafc] focus:ring-3 focus:ring-[#0d5c4b]/12 ${fontSemi}`} />
            </div>
            {questions.length > 0 && (
              <span className={`hidden items-center gap-2 rounded-full bg-[#f1f5f9] px-3 py-1.5 text-[12px] leading-[16px] text-[#334155] @3xl:flex ${fontMedium}`}>
                <span aria-hidden="true" className="h-1.5 w-16 overflow-hidden rounded-full bg-[#e2e8f0]">
                  <span className="block h-full rounded-full bg-[#0d5c4b] transition-[width]" style={{ width: `${(ready / questions.length) * 100}%` }} />
                </span>
                {ready} of {questions.length} ready
              </span>
            )}
            <div className="flex items-center gap-2">
              <button type="button" onClick={close} className={`h-9 rounded-[10px] border border-[#e2e8f0] bg-white px-4 text-[14px] leading-[20px] text-[#334155] transition hover:bg-[#f8fafc] ${fontMedium}`}>
                Cancel
              </button>
              <button type="button" onClick={saveAll} className={`h-9 rounded-[10px] bg-[#0d5c4b] px-4 text-[14px] leading-[20px] text-white shadow-[0_1px_2px_rgba(13,92,75,0.25),0_8px_20px_-10px_rgba(13,92,75,0.6)] transition hover:bg-[#0b4c3e] ${fontMedium}`}>
                Save quiz
              </button>
            </div>
          </div>
          {titleIdeas && (
            <div className="pop-in mt-3 flex flex-wrap items-center gap-2 rounded-[12px] border border-[#e9dfff] bg-[#faf7ff] p-2.5">
              <span className={`pl-1 text-[12px] leading-[16px] text-[#6016fc] ${fontSemi}`}>Pick a title</span>
              {titleIdeas.map((idea) => (
                <button key={idea} type="button" onClick={() => (setTitle(idea), setTitleIdeas(null))} className={`rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-[13px] leading-[18px] text-[#0f172a] transition hover:border-[#6016fc]/50 hover:text-[#6016fc] ${fontMedium}`}>
                  {idea}
                </button>
              ))}
              <button type="button" aria-label="Close title ideas" onClick={() => setTitleIdeas(null)} className="ml-auto flex size-7 items-center justify-center rounded-[8px] text-[#64748b] transition hover:bg-[#f0e9ff]">
                <Icon path={CLOSE} className="size-4" />
              </button>
            </div>
          )}
        </header>

        {questions.length === 0 ? (
          <div className="mx-auto flex w-full max-w-[560px] flex-col items-center px-5 py-14 text-center">
            <span aria-hidden="true" className={`float-y flex size-16 items-center justify-center rounded-[18px] ${KIND_TONES.Quiz} shadow-[0_12px_30px_-14px_rgba(180,83,9,0.5)]`}>
              <Icon path={KIND_ICONS.Quiz} className="size-8" />
            </span>
            <h3 className={`m-0 mt-5 text-[22px] leading-[30px] text-[#0f172a] ${fontSemi}`}>Build your quiz</h3>
            <p className={`m-0 mt-2 text-[14px] leading-[22px] text-[#475569] ${fontRegular}`}>Write your own questions, or let AI draft a set from your course. You can edit every question before you save.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={addQuestion} className={`flex h-11 items-center gap-2 rounded-[10px] bg-[#0d5c4b] px-5 text-[14px] leading-[20px] text-white shadow-[0_8px_20px_-10px_rgba(13,92,75,0.6)] transition hover:bg-[#0b4c3e] ${fontMedium}`}>
                <Icon path={PLUS} className="size-[18px]" />
                Write a question
              </button>
              <button type="button" onClick={() => generate(3)} disabled={!!aiBusy} className={`${aiButton} h-11 px-5 text-[14px]`}>
                {aiBusy === "set" ? spinner : <Icon path={SPARKLE} className="size-4" filled />}
                {aiBusy === "set" ? "Writing questions…" : "Generate 3 questions with AI"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid flex-1 items-start gap-4 p-4 @4xl:grid-cols-[260px_minmax(0,1fr)] @4xl:gap-5 @4xl:p-5">
            {/* Left: question list and quiz settings. */}
            <aside className="flex flex-col gap-4 @4xl:sticky @4xl:top-[88px]">
              <div className="rounded-[14px] border border-[#e2e8f0] bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <p className={`m-0 px-2 pb-1.5 pt-1 text-[11px] uppercase leading-[14px] tracking-[0.08em] text-[#64748b] ${fontSemi}`}>
                  Questions · {questions.length}
                </p>
                <ol className="flex max-h-[44vh] flex-col gap-0.5 overflow-y-auto">
                  {questions.map((question, i) => {
                    const selected = question.id === activeId;
                    const ok = questionReady(question);
                    return (
                      <li key={question.id} className={`group flex items-center gap-1 rounded-[10px] pr-1 transition ${selected ? "bg-[#eef7f3]" : "hover:bg-[#f8fafc]"}`}>
                        <button type="button" aria-current={selected ? "true" : undefined} onClick={() => setActiveId(question.id)} className="flex min-w-0 flex-1 items-center gap-2.5 px-2 py-2 text-left">
                          <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] leading-[14px] tabular-nums ${selected ? "bg-[#0d5c4b] text-white" : "bg-[#f1f5f9] text-[#475569]"} ${fontSemi}`}>{i + 1}</span>
                          <span className={`min-w-0 flex-1 truncate text-[13px] leading-[18px] ${question.text.trim() ? "text-[#0f172a]" : "text-[#94a3b8]"} ${selected ? fontSemi : fontRegular}`}>{question.text.trim() || "Untitled question"}</span>
                          <span aria-label={ok ? "Ready" : "Needs work"} title={ok ? "Ready" : "Add the question, two answers and a correct answer"} className={`size-2 shrink-0 rounded-full ${ok ? "bg-[#10b981]" : "bg-[#f59e0b]"}`} />
                        </button>
                        <RowMenu
                          label={`More actions for question ${i + 1}`}
                          items={[
                            { label: "Duplicate", onClick: () => duplicate(question, i) },
                            { label: "Move up", disabled: i === 0, onClick: () => setQuestions((list) => move(list, i, -1)) },
                            { label: "Move down", disabled: i === questions.length - 1, onClick: () => setQuestions((list) => move(list, i, 1)) },
                            { label: "Delete question", danger: true, onClick: () => setRemovingId(question.id) },
                          ]}
                        />
                      </li>
                    );
                  })}
                </ol>
                <div className="mt-1.5 grid gap-1.5 border-t border-[#f1f5f9] pt-2">
                  <button type="button" onClick={addQuestion} className={`flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-[#cbd5e1] text-[13px] leading-[18px] text-[#334155] transition hover:border-[#0d5c4b]/50 hover:bg-[#f4faf7] hover:text-[#0d5c4b] ${fontMedium}`}>
                    <Icon path={PLUS} className="size-4" />
                    Add question
                  </button>
                  <button type="button" onClick={() => generate(3)} disabled={!!aiBusy} className={`flex h-9 items-center justify-center gap-1.5 rounded-[10px] text-[13px] leading-[18px] text-[#6016fc] transition hover:bg-[#f5f0ff] disabled:opacity-60 ${fontMedium}`}>
                    {aiBusy === "set" ? spinner : <Icon path={SPARKLE} className="size-3.5" filled />}
                    {aiBusy === "set" ? "Writing…" : "Add 3 with AI"}
                  </button>
                </div>
              </div>

              <div className="rounded-[14px] border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <p className={`m-0 text-[11px] uppercase leading-[14px] tracking-[0.08em] text-[#64748b] ${fontSemi}`}>Quiz settings</p>
                <label htmlFor="quiz-pass" className={`mt-3 flex items-center justify-between gap-3 text-[13px] leading-[18px] text-[#334155] ${fontMedium}`}>
                  Pass score
                  <span className="flex items-center gap-1">
                    <input id="quiz-pass" type="number" min={0} max={100} value={settings.passScore} onChange={(e) => setSettings((v) => ({ ...v, passScore: e.target.value }))} placeholder="—" className="field h-8 w-16 text-right" />
                    <span className="text-[#64748b]">%</span>
                  </span>
                </label>
                <div className="mt-3 flex flex-col gap-2.5">
                  {check(settings.retakes, "Allow retakes", () => setSettings((v) => ({ ...v, retakes: !v.retakes })))}
                  {check(settings.shuffle, "Shuffle questions", () => setSettings((v) => ({ ...v, shuffle: !v.shuffle })))}
                </div>
              </div>
            </aside>

            {/* Right: the question being edited. */}
            {active && (
              <section className="rounded-[16px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-20px_rgba(15,23,42,0.25)]">
                <div className="flex flex-wrap items-center gap-3 border-b border-[#f1f5f9] px-5 py-3">
                  <p className={`m-0 text-[12px] leading-[16px] text-[#64748b] ${fontMedium}`}>
                    Question <span className="text-[#0f172a]">{activeIndex + 1}</span> of {questions.length}
                  </p>
                  <div role="radiogroup" aria-label="Answer type" className="flex rounded-[10px] bg-[#f1f5f9] p-0.5">
                    <button type="button" role="radio" aria-checked={!active.multiple} onClick={() => setMultiple(false)} className={pill(!active.multiple)}>
                      One correct answer
                    </button>
                    <button type="button" role="radio" aria-checked={active.multiple} onClick={() => setMultiple(true)} className={pill(active.multiple)}>
                      Several correct
                    </button>
                  </div>
                  <button type="button" onClick={() => generate(1)} disabled={!!aiBusy} className={`${aiChip} ml-auto`}>
                    {aiBusy === "one" ? spinner : <Icon path={SPARKLE} className="size-3.5" filled />}
                    {aiBusy === "one" ? "Writing…" : active.text.trim() ? "New question with AI" : "Write with AI"}
                  </button>
                </div>

                <div className="p-5">
                  <label htmlFor="quiz-question" className="sr-only">
                    Question
                  </label>
                  <textarea
                    id="quiz-question"
                    rows={2}
                    value={active.text}
                    onChange={(e) => patchActive({ text: e.target.value })}
                    placeholder="Type your question…"
                    className={`block w-full resize-none rounded-[12px] border border-transparent bg-[#f8fafc] px-4 py-3 text-[18px] leading-[28px] text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] hover:border-[#e2e8f0] focus:border-[#0d5c4b]/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(13,92,75,0.12)] ${fontSemi}`}
                  />

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <p className={`m-0 text-[13px] leading-[18px] text-[#0f172a] ${fontSemi}`}>Answers</p>
                    <p className={`m-0 text-[12px] leading-[16px] text-[#64748b] ${fontRegular}`}>{active.multiple ? "Tick every correct answer." : "Click the circle next to the correct answer."}</p>
                  </div>
                  <ol role={active.multiple ? "group" : "radiogroup"} aria-label="Answer options" className="mt-2.5 flex flex-col gap-2">
                    {active.options.map((option, i) => {
                      const letter = String.fromCharCode(65 + i);
                      const showExplain = openExplain[option.id] || !!option.explanation;
                      return (
                        <li key={option.id} className={`rounded-[12px] border transition ${option.correct ? "border-[#10b981]/60 bg-[#f0fbf6]" : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"}`}>
                          <div className="flex items-center gap-3 px-3 py-2">
                            <button
                              type="button"
                              role={active.multiple ? "checkbox" : "radio"}
                              aria-checked={option.correct}
                              aria-label={`Mark answer ${letter} as correct`}
                              onClick={() => setCorrect(option.id)}
                              className={`flex size-6 shrink-0 items-center justify-center border-2 transition ${active.multiple ? "rounded-[7px]" : "rounded-full"} ${option.correct ? "border-[#10b981] bg-[#10b981] text-white" : "border-[#cbd5e1] bg-white text-transparent hover:border-[#10b981] hover:text-[#10b981]/40"}`}
                            >
                              <Icon path="M6 12.500l4 4 8-9" className="size-3.5" />
                            </button>
                            <span className={`flex size-7 shrink-0 items-center justify-center rounded-[8px] text-[12px] leading-[16px] ${option.correct ? "bg-white text-[#047857]" : "bg-[#f1f5f9] text-[#475569]"} ${fontSemi}`}>{letter}</span>
                            <input
                              ref={(el) => {
                                answerRefs.current[option.id] = el;
                              }}
                              aria-label={`Answer ${letter}`}
                              value={option.text}
                              onChange={(e) => patchOption(option.id, { text: e.target.value, saved: true })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && i === active.options.length - 1 && option.text.trim()) {
                                  e.preventDefault();
                                  addAnswer();
                                }
                              }}
                              placeholder={`Answer ${letter}`}
                              className={`h-9 min-w-0 flex-1 bg-transparent text-[15px] leading-[22px] text-[#0f172a] outline-none placeholder:text-[#94a3b8] ${fontMedium}`}
                            />
                            {option.correct && <span className={`hidden shrink-0 rounded-full bg-[#10b981]/15 px-2 py-0.5 text-[11px] leading-[14px] text-[#047857] sm:block ${fontSemi}`}>Correct</span>}
                            {!showExplain && (
                              <button type="button" onClick={() => setOpenExplain((all) => ({ ...all, [option.id]: true }))} className={`hidden shrink-0 rounded-[8px] px-2 py-1 text-[12px] leading-[16px] text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#0f172a] sm:block ${fontMedium}`}>
                                + Why
                              </button>
                            )}
                            <button type="button" aria-label={`Remove answer ${letter}`} disabled={active.options.length <= 2} title={active.options.length <= 2 ? "A question needs at least two answers" : "Remove answer"} onClick={() => removeAnswer(option.id)} className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#94a3b8] transition hover:bg-[#fef2f2] hover:text-[#dc2626] disabled:pointer-events-none disabled:opacity-30">
                              <Icon path={TRASH} className="size-4" />
                            </button>
                          </div>
                          {showExplain && (
                            <div className="border-t border-dashed border-[#e2e8f0] px-3 py-2 pl-[88px]">
                              <input aria-label={`Why answer ${letter} is right or wrong`} value={option.explanation} onChange={(e) => patchOption(option.id, { explanation: e.target.value })} placeholder="Why is this right or wrong? Students see this after they answer." className={`h-8 w-full bg-transparent text-[13px] leading-[20px] text-[#475569] outline-none placeholder:text-[#94a3b8] ${fontRegular}`} />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                  <button type="button" onClick={addAnswer} disabled={active.options.length >= 8} className={`mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-[#cbd5e1] text-[13px] leading-[18px] text-[#334155] transition hover:border-[#0d5c4b]/50 hover:bg-[#f4faf7] hover:text-[#0d5c4b] disabled:opacity-40 ${fontMedium}`}>
                    <Icon path={PLUS} className="size-4" />
                    Add answer
                    <span className={`text-[#94a3b8] ${fontRegular}`}>· or press Enter</span>
                  </button>

                  <div className="mt-5 grid gap-4 rounded-[12px] bg-[#f8fafc] p-4 @2xl:grid-cols-[minmax(0,1fr)_auto] @2xl:items-end">
                    <div>
                      <label htmlFor="quiz-related" className={`block text-[12px] leading-[16px] text-[#334155] ${fontSemi}`}>
                        Related lecture <span className={`text-[#94a3b8] ${fontRegular}`}>(optional)</span>
                      </label>
                      <select id="quiz-related" value={active.relatedLecture} onChange={(e) => patchActive({ relatedLecture: e.target.value })} className="field mt-1.5 h-9">
                        <option value="">Students who get it wrong can rewatch…</option>
                        {lectureOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 @2xl:pb-1">
                      {check(active.required, "Required", () => patchActive({ required: !active.required }))}
                      {check(active.randomise, "Shuffle answers", () => patchActive({ randomise: !active.randomise }))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[#f1f5f9] px-5 py-3">
                  <button type="button" onClick={() => setRemovingId(active.id)} className={`flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[13px] leading-[18px] text-[#64748b] transition hover:bg-[#fef2f2] hover:text-[#dc2626] ${fontMedium}`}>
                    <Icon path={TRASH} className="size-4" />
                    Delete question
                  </button>
                  <div className="flex items-center gap-2">
                    <button type="button" disabled={activeIndex <= 0} onClick={() => setActiveId(questions[activeIndex - 1].id)} className={`h-9 rounded-[10px] border border-[#e2e8f0] bg-white px-3.5 text-[13px] leading-[18px] text-[#334155] transition hover:bg-[#f8fafc] disabled:opacity-40 ${fontMedium}`}>
                      Previous
                    </button>
                    {activeIndex < questions.length - 1 ? (
                      <button type="button" onClick={() => setActiveId(questions[activeIndex + 1].id)} className={`h-9 rounded-[10px] bg-[#0f172a] px-3.5 text-[13px] leading-[18px] text-white transition hover:bg-[#1e293b] ${fontMedium}`}>
                        Next question
                      </button>
                    ) : (
                      <button type="button" onClick={addQuestion} className={`flex h-9 items-center gap-1.5 rounded-[10px] bg-[#0f172a] px-3.5 text-[13px] leading-[18px] text-white transition hover:bg-[#1e293b] ${fontMedium}`}>
                        <Icon path={PLUS} className="size-4" />
                        Next question
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
      {confirmLeave && <ConfirmDialog title="Discard your quiz changes?" body="Anything you changed since opening this quiz will be lost." confirmLabel="Discard changes" onClose={() => setConfirmLeave(false)} onConfirm={onCancel} />}
      {removingId && <ConfirmDialog title="Delete this question?" body="This question and its answers will be removed from the quiz." confirmLabel="Delete" onClose={() => setRemovingId("")} onConfirm={() => removeQuestion(removingId)} />}
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

  const allLectures = sections.flatMap((s) => s.lectures);
  const totalVideo = allLectures.reduce((sum, l) => sum + (l.kind === "Video" ? toSeconds(l.duration) : 0), 0);
  const kindCounts = KINDS.map((kind) => ({ kind, count: allLectures.filter((l) => l.kind === kind).length })).filter((k) => k.count > 0);
  const panel = "mx-3 mb-3 rounded-[14px] border border-[#e2e8f0] bg-[#f8fafc] p-4 sm:mx-4 sm:mb-4 sm:p-5";
  const panelHelp = `m-0 text-[14px] leading-[22px] text-[#475569] ${fontRegular}`;
  const dashedRow = `flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#cbd5e1] bg-white text-[14px] leading-[20px] text-[#334155] transition hover:border-[#0d5c4b]/50 hover:bg-[#f4faf7] hover:text-[#0d5c4b] ${fontMedium}`;
  const uploadTile = `group flex min-h-[64px] min-w-0 flex-1 items-center gap-3 rounded-[12px] border border-dashed border-[#9fc9b8] bg-white px-4 text-left text-[15px] leading-[22px] text-[#0f172a] transition hover:border-[#0d5c4b] hover:bg-[#f4faf7] ${fontMedium}`;

  return (
    <div className="max-w-[830px]">
      <CurriculumIntro onExplain={onExplain} onSupport={onSupport} />
      <input ref={fileRef} type="file" hidden aria-label="Choose lecture video" accept="video/*" onChange={(e) => pickVideo(e.target.files?.[0])} />
      {sections.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-5 rounded-[20px] border border-dashed border-[#cfe3da] bg-[linear-gradient(180deg,#f4faf7_0%,#ffffff_100%)] px-6 py-14 text-center">
          <EmptyArt />
          <div>
            <h2 className={`m-0 text-[22px] leading-[30px] text-[#0f172a] ${fontSemi}`}>No lectures yet</h2>
            <p className={`m-0 mx-auto mt-1.5 max-w-[380px] text-[14px] leading-[22px] text-[#475569] ${fontRegular}`}>Start with a section, then add videos, quizzes, assignments and articles.</p>
          </div>
          <button type="button" onClick={addSection} className={`flex h-11 items-center gap-2 rounded-[10px] bg-[#0d5c4b] px-5 text-[15px] leading-[22px] text-white shadow-[0_1px_2px_rgba(13,92,75,0.25),0_8px_20px_-10px_rgba(13,92,75,0.6)] transition hover:bg-[#0b4c3e] ${fontMedium}`}>
            <Icon path={PLUS} className="size-5" />
            Create your first lecture
          </button>
        </div>
      ) : (
        <>
          {/* Course outline at a glance. */}
          <div className={`mt-6 flex flex-wrap items-center gap-2 text-[13px] leading-[18px] text-[#334155] ${fontMedium}`}>
            <span className="rounded-full bg-[#0f172a] px-3 py-1.5 text-white">
              {sections.length} {sections.length === 1 ? "section" : "sections"}
            </span>
            <span className="rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5">
              {allLectures.length} {allLectures.length === 1 ? "lecture" : "lectures"}
            </span>
            {kindCounts.map(({ kind, count }) => (
              <span key={kind} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 ${KIND_TONES[kind]}`}>
                <Icon path={KIND_ICONS[kind]} className="size-3.5" />
                {count} {kind === "Quiz" ? (count === 1 ? "quiz" : "quizzes") : `${kind.toLowerCase()}${count === 1 ? "" : "s"}`}
              </span>
            ))}
            {totalVideo > 0 && <span className="rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5">{formatTotal(totalVideo)} of video</span>}
          </div>

          <ol className="mt-4 flex flex-col gap-4">
            {sections.map((section, i) => {
              const title = section.title || `Section ${String(i + 1).padStart(3, "0")}`;
              const step = adding?.sectionId === section.id ? adding.step : section.lectures.length === 0 ? "types" : null;
              const sectionVideo = section.lectures.reduce((sum, l) => sum + (l.kind === "Video" ? toSeconds(l.duration) : 0), 0);
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
                  className={`overflow-hidden rounded-[16px] border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-20px_rgba(15,23,42,0.25)] transition-[border-color,box-shadow] ${dropId === section.id ? "border-[#0d5c4b]/50 ring-3 ring-[#0d5c4b]/10" : "border-[#e2e8f0]"}`}
                >
                  <div className={`flex items-center gap-3 bg-[linear-gradient(180deg,#fbfcfd,#f6f8fa)] px-3 py-3.5 sm:px-4 ${section.lectures.length > 0 || step ? "border-b border-[#eef1f4]" : ""}`}>
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
                      <div className="min-w-0 flex-1">
                        <p className={`m-0 text-[11px] uppercase leading-[14px] tracking-[0.08em] text-[#0d5c4b] ${fontSemi}`}>Section {String(i + 1).padStart(2, "0")}</p>
                        <h2 className={`m-0 mt-0.5 truncate text-[17px] leading-[26px] text-[#0f172a] ${fontSemi}`}>{title}</h2>
                      </div>
                    )}
                    {renaming === section.id && <span className="flex-1" />}
                    {renaming !== section.id && section.lectures.length > 0 && (
                      <span className={`hidden shrink-0 text-[13px] leading-[18px] text-[#64748b] sm:block ${fontRegular}`}>
                        {section.lectures.length} {section.lectures.length === 1 ? "lecture" : "lectures"}
                        {sectionVideo > 0 && ` · ${formatTotal(sectionVideo)}`}
                      </span>
                    )}
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
                    <ol className="flex flex-col p-2">
                      {section.lectures.map((lecture, j) => {
                        const name = lectureName(lecture);
                        const progress = uploads.progress[lecture.id];
                        const uploading = progress !== undefined && progress < 100;
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
                            className={`group flex items-center gap-3 rounded-[10px] px-2 py-2 transition-colors ${dropId === lecture.id ? "bg-[#eef7f3]" : "hover:bg-[#f8fafc]"}`}
                          >
                            <DragHandle
                              vertical
                              label={`Drag ${name}`}
                              onDragStart={(e) => {
                                e.stopPropagation();
                                startDrag({ type: "lecture", id: lecture.id, sectionId: section.id }, e.currentTarget.closest("li"), e);
                              }}
                            />
                            <span aria-hidden="true" className={`hidden w-7 shrink-0 text-[12px] leading-[16px] text-[#94a3b8] tabular-nums sm:block ${fontMedium}`}>
                              {i + 1}.{j + 1}
                            </span>
                            <span className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${KIND_TONES[lecture.kind]}`} title={lecture.kind}>
                              <Icon path={KIND_ICONS[lecture.kind]} className="size-[18px]" />
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
                              <div className="min-w-0 flex-1">
                                <p className={`m-0 truncate text-[15px] leading-[22px] text-[#0f172a] ${fontMedium}`}>
                                  <span className="sr-only">{lecture.kind}: </span>
                                  <button type="button" onClick={() => setEditingId(lecture.id)} className="text-left transition hover:text-[#0d5c4b] hover:underline">
                                    {name}
                                  </button>
                                </p>
                                <p className={`m-0 mt-0.5 flex items-center gap-2 text-[12px] leading-[16px] text-[#64748b] ${fontRegular}`}>
                                  <span>{lecture.kind}</span>
                                  {uploading ? (
                                    <>
                                      <span aria-hidden="true" className="h-1 w-20 overflow-hidden rounded-full bg-[#e2e8f0]">
                                        <span className="block h-full rounded-full bg-[#0d5c4b] transition-[width]" style={{ width: `${progress}%` }} />
                                      </span>
                                      <span className="tabular-nums">{progress}%</span>
                                    </>
                                  ) : progress === 100 ? (
                                    <span className="text-[#b45309]">· Processing…</span>
                                  ) : (
                                    lecture.duration && <span className="tabular-nums">· {lecture.duration}</span>
                                  )}
                                  {lecture.kind === "Quiz" && !!lecture.questions?.length && <span>· {lecture.questions.length} {lecture.questions.length === 1 ? "question" : "questions"}</span>}
                                </p>
                              </div>
                            )}
                            {renaming === lecture.id && <span className="flex-1" />}
                            <RowMenu label={`More actions for ${name}`} items={lectureItems} />
                          </li>
                        );
                      })}
                    </ol>
                  )}
                  {step === "types" && (
                    <div className={`${panel} ${section.lectures.length === 0 ? "mt-3 sm:mt-4" : ""}`}>
                      <p className={panelHelp}>
                        Choose the main content type. You can add files or links as resources later.{" "}
                        <button type="button" onClick={onExplain} className={`text-[#0d5c4b] underline decoration-[#0d5c4b]/30 underline-offset-4 transition hover:decoration-[#0d5c4b] ${fontSemi}`}>
                          About content types
                        </button>
                      </p>
                      <div className="mt-4 grid grid-cols-1 gap-3 @lg:grid-cols-2 @3xl:grid-cols-4">
                        {KINDS.map((kind) => (
                          <button
                            key={kind}
                            type="button"
                            onClick={() => (kind === "Video" ? setAdding({ sectionId: section.id, step: "video" }) : addLecture(section.id, kind))}
                            className="group flex items-center gap-3 rounded-[12px] border border-[#e2e8f0] bg-white p-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-px hover:border-[#0d5c4b]/40 hover:shadow-[0_8px_20px_-12px_rgba(13,92,75,0.45)] @3xl:flex-col @3xl:items-start"
                          >
                            <span className={`flex size-10 shrink-0 items-center justify-center rounded-[10px] ${KIND_TONES[kind]}`}>
                              <Icon path={KIND_ICONS[kind]} className="size-5" />
                            </span>
                            <span className="min-w-0">
                              <span className={`block text-[15px] leading-[22px] text-[#0f172a] ${fontSemi}`}>{kind}</span>
                              <span className={`block text-[12px] leading-[17px] text-[#64748b] ${fontRegular}`}>{KIND_HINTS[kind]}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {step === "video" && (
                    <div className={`${panel} ${section.lectures.length === 0 ? "mt-3 sm:mt-4" : ""}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className={panelHelp}>
                          Upload a video from your computer or your library.{" "}
                          <button type="button" onClick={onSupport} className={`text-[#0d5c4b] underline decoration-[#0d5c4b]/30 underline-offset-4 transition hover:decoration-[#0d5c4b] ${fontSemi}`}>
                            About the video library
                          </button>
                        </p>
                        <button type="button" onClick={() => setAdding({ sectionId: section.id, step: "types" })} className={`flex h-8 shrink-0 items-center gap-1.5 rounded-[8px] px-2.5 text-[13px] leading-[18px] text-[#334155] transition hover:bg-[#e2e8f0] ${fontMedium}`}>
                          <Icon path="M15 6l-6 6 6 6" className="size-4" />
                          Back
                        </button>
                      </div>
                      <div className="mt-4 flex flex-col items-stretch gap-3 @2xl:flex-row">
                        <button type="button" onClick={() => chooseVideo({ sectionId: section.id })} className={uploadTile}>
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#eef7f3] text-[#0d5c4b] transition group-hover:bg-[#0d5c4b] group-hover:text-white">
                            <Icon path={UPLOAD} className="size-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block">Upload video</span>
                            <span className={`block text-[12px] leading-[17px] text-[#64748b] ${fontRegular}`}>MP4, MOV or WEBM from your computer</span>
                          </span>
                        </button>
                        <button type="button" onClick={() => setLibrary({ sectionId: section.id })} className={uploadTile}>
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#eef7f3] text-[#0d5c4b] transition group-hover:bg-[#0d5c4b] group-hover:text-white">
                            <Icon path={LIBRARY} className="size-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block">Add from library</span>
                            <span className={`block text-[12px] leading-[17px] text-[#64748b] ${fontRegular}`}>Reuse a video from any of your courses</span>
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                  {!step && (
                    <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                      <button type="button" onClick={() => setAdding({ sectionId: section.id, step: "types" })} className={`h-11 ${dashedRow}`}>
                        <Icon path={PLUS} className="size-[18px]" />
                        Add lecture
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          {sections.every((s) => s.lectures.length > 0) && !adding && (
            <button type="button" onClick={addSection} className={`mt-4 h-12 rounded-[14px] ${dashedRow}`}>
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
          context={(() => {
            const home = sections.find((sec) => sec.lectures.some((l) => l.id === editing.id));
            return { course: courseContext(draft), sectionTitle: home?.title ?? "", lectureTitle: editing.title, kind: editing.kind, siblings: home?.lectures.filter((l) => l.id !== editing.id).map((l) => l.title) ?? [] };
          })()}
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
          context={(() => {
            const home = sections.find((sec) => sec.lectures.some((l) => l.id === editing.id));
            return { course: courseContext(draft), sectionTitle: home?.title ?? "", lectureTitle: editing.title, kind: editing.kind, siblings: home?.lectures.filter((l) => l.id !== editing.id).map((l) => l.title) ?? [] };
          })()}
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
        <DateField id="coupon-expires" label="Ends on" value={expires} onChange={setExpires} error={dateError} min={todayIso()} />
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

// Rich guide card: Liniqo illustration, a short message, and up to two links.
type GuideLink = { label: string; onClick: () => void };
function RichGuide({ eyebrow, title, text, image, primary, secondary }: { eyebrow: string; title: string; text: string; image: string; primary: GuideLink; secondary?: GuideLink }) {
  const arrow = <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} strokeWidth={2} aria-hidden="true" />;
  return (
    <aside className="@container relative rounded-[16px] border border-b-[3px] border-r-[3px] border-[#cfe3da] bg-[linear-gradient(135deg,#eaf5f0_0%,#f4faf7_55%,#ffffff_100%)] p-6">
      {/* Soft green shapes, kept inside the rounded card. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[14px]">
        <span className="absolute -right-20 -top-24 size-72 rounded-full bg-[#0d5c4b]/[0.06]" />
        <span className="absolute -bottom-28 right-24 size-56 rounded-full bg-[#12b981]/[0.06]" />
        <span className="absolute inset-y-0 right-0 w-1/2 opacity-[0.14] [background-image:radial-gradient(#0d5c4b_1px,transparent_1px)] [background-size:14px_14px] [mask-image:linear-gradient(to_left,black,transparent)]" />
      </span>
      <svg viewBox="0 0 24 48" className="absolute -top-3 right-8 h-10 w-5 text-[#0f172a]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
        <path d="M17 12v24a5 5 0 01-10 0V9a3.5 3.5 0 017 0v25a1.5 1.5 0 01-3 0V13" />
      </svg>
      <div className="relative flex flex-col gap-5 @xl:flex-row @xl:items-center @xl:gap-7">
        <span className="flex size-[132px] shrink-0 items-center justify-center rounded-[16px] bg-white shadow-[0_1px_2px_rgba(13,92,75,0.08),0_8px_24px_-12px_rgba(13,92,75,0.25)] ring-1 ring-[#d4e8df] @xl:size-[150px]">
          <img src={image} alt="" width={1000} height={1000} className="float-y size-[124px] @xl:size-[140px]" />
        </span>
        <div className="min-w-0">
          <p className={`m-0 inline-flex rounded-full bg-white/70 px-2.5 py-1 text-[11px] uppercase leading-[14px] tracking-[0.08em] text-[#0d5c4b] ring-1 ring-[#cfe3da] ${fontSemi}`}>{eyebrow}</p>
          <h2 className={`m-0 mt-2.5 text-[20px] leading-[28px] text-[#0f172a] ${fontSemi}`}>{title}</h2>
          <p className={`m-0 mt-1.5 max-w-[460px] text-[14px] leading-[24px] text-[#334155] ${fontRegular}`}>{text}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
            <button type="button" onClick={primary.onClick} className={`flex h-9 items-center gap-1.5 rounded-[8px] bg-[#0d5c4b] px-3.5 text-[14px] leading-[20px] text-white shadow-[0_1px_2px_rgba(13,92,75,0.25)] transition hover:bg-[#0b4c3e] ${fontMedium}`}>
              {primary.label}
              {arrow}
            </button>
            {secondary && (
              <button type="button" onClick={secondary.onClick} className={`flex items-center gap-1.5 text-[14px] leading-[20px] text-[#0d5c4b] transition hover:text-[#0b4c3e] hover:underline ${fontMedium}`}>
                {secondary.label}
                {arrow}
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function PricingGuide({ onCoupons, onTips }: { onCoupons: () => void; onTips: () => void }) {
  return (
    <RichGuide
      eyebrow="Pricing tips"
      title="Price With Confidence"
      text="Look at similar courses in your category, then choose a price that reflects the value you offer."
      image="/illustrations/course-pricing-card.svg"
      primary={{ label: "Create a launch coupon", onClick: onCoupons }}
      secondary={{ label: "See all course tips", onClick: onTips }}
    />
  );
}

function PromotionsGuide({ onTips }: { onTips: () => void }) {
  // Jumps to the coupon form at the top of this section.
  const addCoupon = () => {
    const field = document.getElementById("coupon-code");
    field?.scrollIntoView({ behavior: "smooth", block: "center" });
    field?.focus({ preventScroll: true });
  };
  return (
    <RichGuide
      eyebrow="Promotion tips"
      title="Reach More Students"
      text="A limited-time coupon gives new students a reason to enroll today."
      image="/illustrations/early-bird-ticket.svg"
      primary={{ label: "Add a coupon", onClick: addCoupon }}
      secondary={{ label: "See all course tips", onClick: onTips }}
    />
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
    <aside className="relative rounded-[16px] border-b-[3px] border-r-[3px] border-[#e2e8f0] bg-[#f8fafc] p-6 @4xl:sticky @4xl:top-[88px]">
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

const STATUS_TEXT: Record<CourseStatus, string> = {
  draft: "This course is not published on the Thkee marketplace.",
  pending: "This course is being reviewed. We'll email you when it's live.",
  published: "This course is live on the Thkee marketplace.",
  rejected: "This course needs changes before it can be published.",
};

function SettingsSection({ course, status, settings, onChange }: { course: InstructorCourse; status: CourseStatus; settings: CourseSettings; onChange: (patch: Partial<CourseSettings>) => void }) {
  const { notify } = useApp();
  const [deleting, setDeleting] = useState(false);
  const hasStudents = course.purchases > 0;
  const published = status === "published";
  const heading = `m-0 text-[16px] leading-[24px] text-[#0f172a] ${fontSemi}`;
  const text = `text-[14px] leading-[22px] text-[#64748b] ${fontRegular}`;
  const row = "flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6";
  const outline = `h-9 shrink-0 rounded-[8px] border border-[#cbd5e1] bg-white px-4 text-[14px] leading-[20px] text-[#1e293b] transition hover:bg-[#f8fafc] ${fontMedium}`;

  const toggleNotice = (key: "qaDigest" | "lectureReady" | "monthlyEnrollments") => {
    onChange({ [key]: !settings[key] });
    notify("Email notifications updated");
  };

  const remove = () => {
    saveInstructorCourses(loadInstructorCourses().filter((c) => c.id !== course.id));
    const { [course.id]: _gone, ...rest } = load<Record<string, StoredDetails>>(COURSE_DETAILS_KEY, {});
    save(COURSE_DETAILS_KEY, rest);
    openInstructorCourses();
    notify("Course deleted");
  };

  const notices: { key: "qaDigest" | "lectureReady" | "monthlyEnrollments"; label: string; tip: string }[] = [
    { key: "qaDigest", label: "Daily Q&A digest", tip: "One email a day with new student questions on this course." },
    { key: "lectureReady", label: "Email me when a lecture is ready", tip: "We email you when an uploaded video has finished processing." },
    { key: "monthlyEnrollments", label: "Monthly update on new enrollments", tip: "A summary of how many students enrolled this month." },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className={heading}>Course status</h2>
            <p className={text}>{STATUS_TEXT[status]}</p>
          </div>
          <StatusPill status={status} />
        </div>
        <div className="divide-y divide-[#e2e8f0] rounded-[12px] border border-[#e2e8f0] bg-white">
          <div className={row}>
            <div className="min-w-0">
              <p className={`text-[14px] leading-[20px] text-[#0f172a] ${fontMedium}`}>{settings.unlisted ? "Unlisted" : "Listed in search"}</p>
              <p className={text}>{settings.unlisted ? "New students can't find this course in search. Students who already enrolled keep their access." : "Unlist to hide this course from search. Students who already enrolled keep their access."}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onChange({ unlisted: !settings.unlisted });
                notify(settings.unlisted ? "Course is listed in search again" : "Course unlisted");
              }}
              className={outline}
            >
              {settings.unlisted ? "List course" : "Unlist"}
            </button>
          </div>
          <div className={row}>
            <div className="min-w-0">
              <p className={`text-[14px] leading-[20px] text-[#b91c1c] ${fontMedium}`}>Delete course</p>
              <p className={text}>{hasStudents ? `${course.purchases} ${course.purchases === 1 ? "student has" : "students have"} enrolled. We promise students lifetime access, so this course can't be deleted.` : "Permanently delete this course and everything in it. This can't be undone."}</p>
            </div>
            <button type="button" disabled={hasStudents} onClick={() => setDeleting(true)} className={`h-9 shrink-0 rounded-[8px] bg-[#dc2626] px-4 text-[14px] leading-[20px] text-white transition hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#dc2626] ${fontMedium}`}>
              Delete
            </button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-[#e2e8f0] pt-8">
        <div>
          <h2 className={heading}>Email notifications</h2>
          <p className={text}>Choose which emails you get about this course.</p>
        </div>
        <div className="flex flex-col gap-3">
          {notices.map((n) => (
            <div key={n.key} className="flex items-center gap-1.5">
              <Checkbox checked={settings[n.key]} onChange={() => toggleNotice(n.key)}>
                <span className={`text-[14px] leading-[20px] text-[#1e293b] ${fontRegular}`}>{n.label}</span>
              </Checkbox>
              <InfoTip text={n.tip} />
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-[#e2e8f0] pt-8">
        <div>
          <h2 className={heading}>Enrollment privacy</h2>
          <p className={text}>Control who can enroll in this course.</p>
        </div>
        {published ? (
          <div role="radiogroup" aria-label="Enrollment privacy" className="grid gap-3 sm:grid-cols-2">
            {(
              [
                { value: "public", title: "Public", body: "Anyone on Thkee can find and enroll in this course." },
                { value: "private", title: "Private", body: "Only people you invite can enroll." },
              ] as const
            ).map((o) => {
              const on = settings.privacy === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    onChange({ privacy: o.value });
                    notify("Enrollment privacy updated");
                  }}
                  className={`flex items-start gap-3 rounded-[12px] border p-4 text-left transition ${on ? "border-[#0d5c4b] bg-[#eef7f3]" : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"}`}
                >
                  <span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-[#0d5c4b]" : "border-[#cbd5e1]"}`}>{on && <span className="size-1.5 rounded-full bg-[#0d5c4b]" />}</span>
                  <span>
                    <span className={`block text-[14px] leading-[20px] text-[#0f172a] ${fontMedium}`}>{o.title}</span>
                    <span className={`block ${text}`}>{o.body}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] p-4 sm:max-w-[460px]">
            <Icon path="M12 3a9 9 0 100 18 9 9 0 000-18zM12 8v4M12 16h.01" className="mt-0.5 size-[18px] shrink-0 text-[#64748b]" />
            <div>
              <p className={`text-[14px] leading-[20px] text-[#0f172a] ${fontMedium}`}>Publish to enable privacy settings</p>
              <p className={text}>Privacy settings become available after your course is published for the first time.</p>
            </div>
          </div>
        )}
      </section>

      {deleting && <ConfirmDialog title="Delete this course?" body={`"${course.title}" and all its lectures, quizzes and settings will be permanently deleted.`} confirmLabel="Delete course" onClose={() => setDeleting(false)} onConfirm={remove} />}
    </div>
  );
}

function Editor({ course, stored, section }: { course: InstructorCourse; stored?: StoredDetails; section: string }) {
  const { notify, user } = useApp();
  const [showPreview, setShowPreview] = useStoredState("thkee.builderPreview", true);
  // Width of the live preview as a share of the builder area; the divider between the columns changes it.
  const [previewPct, setPreviewPct] = useStoredState("thkee.builderSplit", PREVIEW_DEFAULT);
  const splitRef = useRef<HTMLDivElement>(null);
  const [fullPreview, setFullPreview] = useState(false);
  const [focusAnchor, setFocusAnchor] = useState<PreviewAnchor | null>(null);
  useEffect(() => setFocusAnchor(null), [section]);
  useEffect(() => {
    if (!fullPreview) return;
    const close = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setFullPreview(false);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [fullPreview]);
  const [initial] = useState(() => toDraft(course, { ...blankDetails(), ...stored }));
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [status, setStatus] = useState<CourseStatus>(course.status);
  const [allSettings, setAllSettings] = useStoredState<Record<string, CourseSettings>>(COURSE_SETTINGS_KEY, {});
  const settings = { ...DEFAULT_COURSE_SETTINGS, ...allSettings[course.id] };
  const changeSettings = (patch: Partial<CourseSettings>) => setAllSettings((all) => ({ ...all, [course.id]: { ...DEFAULT_COURSE_SETTINGS, ...all[course.id], ...patch } }));
  const [savedAt, setSavedAt] = useState(stored?.savedAt);
  const [now, setNow] = useState(() => Date.now());
  const [leaving, setLeaving] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  // Lecture videos the owner uploaded to the server, by file name.
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>(() => load<Record<string, string>>(VIDEO_URLS_KEY, {}));
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
    uploadFile(file)
      .then((serverUrl) => {
        if (!serverUrl) return;
        save(VIDEO_URLS_KEY, { ...load<Record<string, string>>(VIDEO_URLS_KEY, {}), [file.name]: serverUrl });
        setVideoUrls((urls) => ({ ...urls, [file.name]: serverUrl }));
      })
      .catch(() => notify(`Upload failed for ${file.name}. Please try again`));
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

  // auto: a quiet autosave. It skips the checks and messages, keeps the last good title and price,
  // and leaves the draft as typed so the cursor never jumps.
  const persist = (nextStatus: CourseStatus, auto = false) => {
    if (!auto && !draft.title.trim()) {
      notify("Add a title before saving");
      openCourseEditor(course.id, "details");
      return false;
    }
    if (!auto && !priceIsValid(draft.price)) {
      notify("Enter a price before saving");
      openCourseEditor(course.id, "pricing");
      return false;
    }
    const clean = auto ? draft : { ...draft, title: draft.title.trim() };
    const { title, category, price, ...details } = clean;
    const stamp = Date.now();
    const priceValue = Number(price);
    saveInstructorCourses(
      loadInstructorCourses().map((c) =>
        c.id === course.id
          ? { ...c, ...(title.trim() ? { title: title.trim() } : {}), category, status: nextStatus, ...(priceIsValid(price) ? { price: priceValue === 0 ? "Free" : `$${priceValue.toFixed(2)}` } : {}), updated: todayLabel() }
          : c,
      ),
    );
    save(COURSE_DETAILS_KEY, { ...load<Record<string, StoredDetails>>(COURSE_DETAILS_KEY, {}), [course.id]: { ...details, savedAt: stamp } });
    if (!auto) setDraft(clean);
    setSaved(clean);
    setStatus(nextStatus);
    setSavedAt(stamp);
    setNow(stamp);
    return true;
  };

  // Autosave: drafts and courses in review save 1.5 seconds after the last change.
  // Published courses keep the Save button, so half-finished edits never go live.
  const autoSave = status !== "published";
  const latestSave = useRef(() => {});
  latestSave.current = () => {
    if (autoSave && JSON.stringify(draft) !== JSON.stringify(saved)) persist(status, true);
  };
  useEffect(() => {
    if (!autoSave || !dirty) return;
    const timer = setTimeout(() => latestSave.current(), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft, autoSave, dirty]);
  // Saves right away when the tab closes or the editor is left.
  useEffect(() => {
    const flush = () => latestSave.current();
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

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
  const navItem = (active: boolean) => `flex h-8 shrink-0 items-center gap-2 rounded-[6px] px-2.5 text-left text-[13px] leading-[18px] transition-colors md:w-full ${active ? `bg-[#eef7f3] text-[#0d5c4b] ${fontMedium}` : `text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] ${fontRegular}`}`;
  const props: SectionProps = { draft, saved, update, onExplain: () => setExplaining(true) };

  // Course builder: the student course page, redrawn from the draft beside the form.
  const builder = !UTILITY_SECTIONS.includes(current.id);
  const previewData: CoursePreviewData = {
    title: draft.title,
    subtitle: draft.subtitle,
    category: draft.category,
    subCategory: draft.subCategory,
    topics: draft.topics,
    level: draft.level,
    language: draft.language,
    price: draft.price,
    discount: draft.coupons.reduce((best, c) => Math.max(best, c.percent), 0),
    cover: draft.cover || sampleCover(course),
    hasPromoVideo: !!draft.promoVideo,
    description: draft.description.text,
    descriptionHtml: draft.description.html,
    objectives: draft.objectives.map((p) => p.text.trim()).filter(Boolean),
    requirements: draft.requirements.map((p) => p.text.trim()).filter(Boolean),
    audience: draft.audience.map((p) => p.text.trim()).filter(Boolean),
    curriculum: draft.curriculum,
    instructor: user?.name ?? "",
  };
  const anchor = focusAnchor ?? SECTION_ANCHOR[current.id] ?? null;
  const trackFocus = (e: FocusEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    const target = el.closest<HTMLElement>("[data-preview-target]")?.dataset.previewTarget as PreviewAnchor | undefined;
    setFocusAnchor(target ?? (el.closest("[contenteditable]") ? "overview" : FIELD_ANCHOR[el.id] ?? null));
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white">
      {/* One calm row: back, course name with its state underneath, and the two actions. */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[#e2e8f0] bg-white px-3 md:px-5">
        <button type="button" aria-label="Back to my courses" title="Back to my courses" onClick={() => (dirty && !autoSave ? setLeaving(true) : openInstructorCourses())} className="flex size-9 shrink-0 items-center justify-center rounded-[8px] border border-[#e2e8f0] text-[#334155] transition hover:bg-[#f8fafc] hover:text-[#0f172a]">
          <Icon path="M15 6l-6 6 6 6" className="size-[18px]" />
        </button>
        <div className="min-w-0 flex-1">
          <p className={`m-0 truncate text-[15px] leading-[20px] text-[#0f172a] ${fontSemi}`}>{draft.title || "Untitled course"}</p>
          <p className={`m-0 mt-0.5 flex min-w-0 items-center gap-1.5 text-[12px] leading-[16px] text-[#64748b] ${fontRegular}`}>
            <span className="flex shrink-0 items-center gap-1.5">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: STATUS_DOT[status] }} />
              <span className={`text-[#334155] ${fontMedium}`}>{STATUS_LABEL[status]}</span>
            </span>
            {settings.unlisted && (
              <>
                <span aria-hidden="true">·</span>
                <span className="shrink-0">Unlisted</span>
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Save status, top right: saving, saved, or unsaved for published courses. */}
          <p aria-live="polite" className={`m-0 mr-1 hidden items-center gap-1.5 text-[13px] leading-[18px] sm:flex ${dirty && !autoSave ? "text-[#b45309]" : "text-[#64748b]"} ${fontRegular}`}>
            {dirty && autoSave ? (
              <>
                <span aria-hidden="true" className="size-3.5 animate-spin rounded-full border-2 border-[#cbd5e1] border-t-[#0d5c4b]" />
                Saving…
              </>
            ) : dirty ? (
              <>
                <span aria-hidden="true" className="size-1.5 rounded-full bg-[#f59e0b]" />
                Unsaved changes
              </>
            ) : (
              <>
                <Icon path="M7 18a4.5 4.5 0 01-.6-8.96A6 6 0 0117.8 8.6 4.5 4.5 0 0117.5 18H7zM9.5 13l2 2 3.5-3.5" className="size-[18px] text-[#0d5c4b]" />
                {savedLabel(savedAt, course.updated, now)}
              </>
            )}
          </p>
          <button type="button" aria-label="Preview as a student" onClick={() => setFullPreview(true)} className={`flex h-9 items-center gap-2 rounded-[8px] border border-[#e2e8f0] bg-white px-2.5 text-[14px] leading-[20px] text-[#0f172a] transition hover:bg-[#f8fafc] sm:px-3 ${fontMedium}`}>
            <Icon path={EYE} className="size-[18px] text-[#475569]" />
            <span className="hidden sm:inline">Preview</span>
          </button>
          <div className="flex h-9 rounded-[8px] bg-[#0d5c4b] text-white shadow-[0_1px_2px_rgba(13,92,75,0.25)]">
            <button type="button" onClick={saveNow} disabled={!dirty} className={`flex items-center gap-1.5 rounded-l-[8px] pl-3.5 pr-3 text-[14px] leading-[20px] transition hover:bg-[#0b4c3e] disabled:cursor-default disabled:hover:bg-transparent ${fontMedium}`}>
              {!dirty && <Icon path="M5 12.5l4.5 4.5L19 7.5" className="size-4" />}
              {dirty ? (autoSave ? "Saving…" : "Save") : "Saved"}
            </button>
            <span aria-hidden="true" className="my-2 w-px bg-white/25" />
            <ActionMenu label="More save options" triggerClass="flex h-9 items-center rounded-r-[8px] px-2 transition hover:bg-[#0b4c3e]" trigger={<Icon path="M6 9l6 6 6-6" className="size-4" />} items={[{ label: "Save and continue", onClick: saveAndNext }, ...(statusAction ? [statusAction] : [])]} />
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="flex shrink-0 flex-col gap-4 border-b border-[#e2e8f0] bg-[#f8fafc] p-3 md:sticky md:top-16 md:h-[calc(100dvh-64px)] md:w-[212px] md:gap-3 md:overflow-y-auto md:border-b-0 md:border-r md:px-3 md:py-4">
          <div className="flex flex-col gap-3">
            <div className="hidden px-2.5 pb-1 md:block">
              <div className="flex items-baseline justify-between gap-2">
                <p className={`text-[12px] leading-[16px] text-[#0f172a] ${fontSemi}`}>Course setup</p>
                <p className={`text-[11px] leading-[16px] text-[#64748b] ${fontRegular}`}>
                  {steps.filter((s) => s.done).length} of {steps.length} done
                </p>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#e2e8f0]" role="progressbar" aria-label="Course setup progress" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={steps.filter((s) => s.done).length}>
                <div className="h-full rounded-full bg-[#0d5c4b] transition-[width] duration-500" style={{ width: `${(steps.filter((s) => s.done).length / steps.length) * 100}%` }} />
              </div>
            </div>
            <nav aria-label="Course setup" className="flex gap-1 overflow-x-auto md:flex-col md:gap-px md:overflow-visible">
              {SECTIONS.map((item) => {
                const own = steps.filter((s) => s.section === item.id);
                const done = own.length > 0 && own.every((s) => s.done);
                return (
                  <button key={item.id} type="button" aria-current={item.id === current.id ? "page" : undefined} onClick={() => openCourseEditor(course.id, item.id)} className={`${navItem(item.id === current.id)} ${UTILITY_SECTIONS.includes(item.id) ? "md:hidden" : ""}`}>
                    <Icon path={item.icon} className="size-4 shrink-0" />
                    <span className="flex-1 whitespace-nowrap">{item.label}</span>
                    {UTILITY_SECTIONS.includes(item.id) ? null : own.length > 0 ? (
                      <span role="img" aria-label={done ? "Done" : `${own.filter((s) => s.done).length} of ${own.length} done`} className="hidden md:flex">
                        {done ? <Icon path={CHECK_CIRCLE} className="size-3.5 text-[#059669]" /> : <span className="size-3 rounded-full border-[1.5px] border-[#cbd5e1]" />}
                      </span>
                    ) : (
                      <span className={`hidden text-[10.5px] leading-[14px] text-[#94a3b8] md:inline ${fontRegular}`}>Optional</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="hidden flex-col gap-px border-t border-[#e2e8f0] pt-2 md:flex">
            <button type="button" aria-current={current.id === "tips" ? "page" : undefined} onClick={() => openCourseEditor(course.id, "tips")} className={navItem(current.id === "tips")}>
              <Icon path={SECTIONS.find((s) => s.id === "tips")!.icon} className="size-4 shrink-0" />
              Tips
            </button>
            <button type="button" onClick={() => notify("Help is coming soon")} className={navItem(false)}>
              <Icon path="M12 3a9 9 0 100 18 9 9 0 000-18zM9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.2-1.5 2M12 17h.01" className="size-4 shrink-0" />
              Help
            </button>
            <button type="button" aria-current={current.id === "settings" ? "page" : undefined} onClick={() => openCourseEditor(course.id, "settings")} className={navItem(current.id === "settings")}>
              <Icon path="M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 00-2.1-1.2L14 3h-4l-.5 2.7a7 7 0 00-2.1 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 005 12a7 7 0 00.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 002.1 1.2L10 21h4l.5-2.7a7 7 0 002.1-1.2l2.3 1 2-3.4-2-1.5A7 7 0 0019 12z" className="size-4 shrink-0" />
              Settings
            </button>
          </div>
        </aside>
        <main className="@container min-w-0 flex-1 bg-[#fdfdfd] px-4 pb-24 pt-7 md:px-10">
          <div className={`mx-auto ${builder && showPreview ? "max-w-[1720px]" : "max-w-[1110px]"}`}>
            <div className="relative">
              <SectionTitle>{current.label}</SectionTitle>
              {builder && (
                <div className="absolute right-0 top-0 flex items-center gap-2">
                  {!showPreview && (
                    <button type="button" onClick={() => setShowPreview(true)} className={`hidden h-9 items-center gap-2 rounded-[8px] border border-[#e2e8f0] bg-white px-3 text-[13px] leading-[20px] text-[#0f172a] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-[#f8fafc] @5xl:flex ${fontMedium}`}>
                      <Icon path={PANEL} className="size-4" />
                      Show live preview
                    </button>
                  )}
                </div>
              )}
            </div>
            <div ref={splitRef} style={{ ["--preview-w" as string]: `${previewPct}%` }} className={builder && showPreview ? "grid gap-8 @5xl:grid-cols-[minmax(0,1fr)_24px_var(--preview-w)] @5xl:gap-0" : ""}>
            <div className="@container min-w-0" onFocus={builder ? trackFocus : undefined}>
            {current.id === "details" ? (
              <div className="mt-7">
                <DetailsSection {...props} fallbackCover={sampleCover(course)} guide={guide.card} onSupport={() => notify("The Support Center is coming soon")} />
              </div>
            ) : (
              <div className={`mt-7 grid gap-8 ${guide.card.title && current.id !== "intended-learners" ? "@4xl:grid-cols-[minmax(0,1fr)_340px] @4xl:gap-12" : ""}`}>
                <div className="min-w-0">
                  {current.id === "intended-learners" && <LearnersSection {...props} />}
                  {current.id === "curriculum" && <CurriculumSection {...props} onSupport={() => notify("The Support Center is coming soon")} uploads={{ progress: uploadProgress, urls: videoUrls, start: startUpload }} />}
                  {current.id === "promotions" && <PromotionsSection {...props} />}
                  {current.id === "pricing" && <PricingSection {...props} />}
                  {current.id === "tips" && <TipsSection draft={draft} courseId={course.id} />}
                  {current.id === "settings" && <SettingsSection course={course} status={status} settings={settings} onChange={changeSettings} />}
                </div>
                {guide.card.title && current.id !== "intended-learners" && (
                  <div>
                    {current.id === "pricing" ? (
                      <PricingGuide onCoupons={() => openCourseEditor(course.id, "promotions")} onTips={() => openCourseEditor(course.id, "tips")} />
                    ) : current.id === "promotions" ? (
                      <PromotionsGuide onTips={() => openCourseEditor(course.id, "tips")} />
                    ) : (
                      <GuideCard title={guide.card.title} text={guide.card.text} onOpen={() => openCourseEditor(course.id, "tips")} />
                    )}
                  </div>
                )}
              </div>
            )}
            </div>
            {builder && showPreview && (
              <>
              <SplitHandle containerRef={splitRef} value={previewPct} onChange={setPreviewPct} />
              <aside aria-label="Live course page preview" className="hidden min-w-0 @5xl:mt-7 @5xl:sticky @5xl:top-[88px] @5xl:flex @5xl:h-[calc(100dvh-112px)] @5xl:flex-col @5xl:self-start">
                <div className="flex h-full flex-col overflow-hidden rounded-[16px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center gap-3 border-b border-[#eef1f5] px-4 py-2.5">
                    <div className="flex gap-1.5" aria-hidden="true">
                      <span className="size-2.5 rounded-full bg-[#fca5a5]" />
                      <span className="size-2.5 rounded-full bg-[#fcd34d]" />
                      <span className="size-2.5 rounded-full bg-[#86efac]" />
                    </div>
                    <span className={`flex shrink-0 items-center gap-1.5 text-[12px] leading-[16px] text-[#0d5c4b] ${fontMedium}`}>
                      <span className="relative flex size-2">
                        <span className="absolute inset-0 animate-ping rounded-full bg-[#10b981] opacity-60 motion-reduce:animate-none" />
                        <span className="relative size-2 rounded-full bg-[#10b981]" />
                      </span>
                      Live preview
                    </span>
                    <span className={`min-w-0 flex-1 truncate rounded-[6px] bg-[#f1f5f9] px-3 py-1 text-center text-[11px] leading-[16px] text-[#64748b] ${fontRegular}`}>thkee.com/course/{courseSlug(draft.title)}</span>
                    <button type="button" aria-label="Open full-size preview" title="Full size" onClick={() => setFullPreview(true)} className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#0f172a]">
                      <Icon path={EXPAND} className="size-4" />
                    </button>
                    <button type="button" aria-label="Hide preview" title="Hide preview" onClick={() => setShowPreview(false)} className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#0f172a]">
                      <Icon path={CLOSE} className="size-4" />
                    </button>
                  </div>
                  <div data-preview-frame className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] [scrollbar-width:thin]">
                    <CoursePagePreview data={previewData} focus={anchor} />
                  </div>
                </div>
              </aside>
              </>
            )}
            </div>
          </div>
        </main>
      </div>
      {fullPreview && (
        <div role="dialog" aria-modal="true" aria-label="Course page preview" className="fixed inset-0 z-50 flex flex-col bg-[#0f172a]/60 p-2 backdrop-blur-[2px] md:p-6" onClick={(e) => e.target === e.currentTarget && setFullPreview(false)}>
          <div className="mx-auto flex min-h-0 w-full max-w-[1120px] flex-1 flex-col overflow-hidden rounded-[16px] bg-white shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[#eef1f5] px-4 py-3">
              <span className={`text-[14px] leading-[20px] text-[#0f172a] ${fontSemi}`}>Preview as a student</span>
              <span className={`min-w-0 flex-1 truncate rounded-[6px] bg-[#f1f5f9] px-3 py-1 text-center text-[12px] leading-[16px] text-[#64748b] ${fontRegular}`}>thkee.com/course/{courseSlug(draft.title)}</span>
              <button type="button" autoFocus aria-label="Close preview" onClick={() => setFullPreview(false)} className="flex size-9 shrink-0 items-center justify-center rounded-[8px] text-[#334155] transition hover:bg-[#f1f5f9]">
                <Icon path={CLOSE} className="size-5" />
              </button>
            </div>
            <div data-preview-frame className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc]">
              <CoursePagePreview data={previewData} fit={false} />
            </div>
          </div>
        </div>
      )}
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
