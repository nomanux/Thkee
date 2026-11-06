import { useEffect, useRef, useState, type ReactNode } from "react";
import { fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, openCreateSession, openInstructorSessions, openLiveEditor, save, useApp } from "../store";
import { formatClock, loadSchedules } from "./InstructorAvailability";
import LiveScheduleSection, { hasScheduleProblem, seedSchedule, type ScheduleFields } from "./InstructorLiveSchedule";
import { Checkbox } from "./InstructorAssignments";
import { ConfirmDialog, LIVE_COURSES, MultiSessionBadge, SingleSessionBadge } from "./InstructorSessions";
import { ActionMenu, FilterSelect } from "./Menus";
import { NoteEditor } from "./Notes";

const imgLogo = "/assets/4c1d1.svg";
const DRAFTS_KEY = "thkee.liveDrafts";
const LIMITS_KEY = "thkee.liveLimitDefaults";

type Kind = "single" | "multi";
type Limits = { alertBefore: string; alertAfter: string; noticeValue: string; noticeUnit: string; slotInterval: string; remember: boolean };
export type LiveDraft = Limits & ScheduleFields & {
  id: string;
  kind: Kind;
  status: "draft" | "published";
  title: string;
  category: string;
  subtitle: string;
  topic: string;
  description: { text: string; html: string };
  cover: string;
  objectives: string[];
  requirements: string[];
  audience: string[];
  duration: string;
  seats: string;
  currency: string;
  price: string;
  dealsAgreed: boolean;
  availabilityId?: string;
};

export const loadLiveDrafts = () => load<LiveDraft[]>(DRAFTS_KEY, []);

const DEFAULT_LIMITS: Limits = { alertBefore: "none", alertAfter: "none", noticeValue: "", noticeUnit: "minutes", slotInterval: "default", remember: false };
const makeDraft = (id: string, kind: Kind, title: string, category: string, status: LiveDraft["status"] = "draft"): LiveDraft => ({
  ...DEFAULT_LIMITS,
  ...load<Partial<Limits>>(LIMITS_KEY, {}),
  id,
  kind,
  status,
  title,
  category,
  subtitle: "",
  topic: "",
  description: { text: "", html: "" },
  cover: "",
  objectives: ["", "", "", ""],
  requirements: [""],
  audience: ["", ""],
  duration: "",
  seats: "",
  currency: "USD",
  price: "",
  dealsAgreed: false,
  series: [],
  singleSessions: [],
});

const CATEGORIES = ["Design", "Development", "Business", "Marketing", "Data Science", "Personal Development"];
const TOPICS = ["UI Design", "UX Research", "Figma", "Web Development", "Python", "Leadership", "Digital Marketing"];
const BUFFER_OPTIONS = [{ value: "none", label: "No buffer time" }, ...[5, 10, 15, 30, 60].map((n) => ({ value: String(n), label: `${n} minutes` }))];
const INTERVAL_OPTIONS = [{ value: "default", label: "Use event length (default)" }, ...[5, 10, 15, 20, 30, 45, 60].map((n) => ({ value: String(n), label: `${n} minutes` }))];
const PRICE_TIERS: Record<string, string[]> = { USD: ["Free", "$9.99", "$19.99", "$29.99", "$49.99", "$99.99"], SAR: ["Free", "37 SR", "75 SR", "110 SR", "185 SR", "375 SR"] };
const TITLE_LIMIT = 60;
const POINT_LIMIT = 160;
const MIN_OBJECTIVES = 4;
const MIN_DESCRIPTION_WORDS = 200;

const SECTIONS: { id: string; label: string; icon: string }[] = [
  { id: "intended-learners", label: "Intended Learners", icon: "M2 9l10-5 10 5-10 5-10-5zM6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5M20 10v6" },
  { id: "details", label: "Details", icon: "M14 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-7M8 12h5M8 16h8M18 2.5a3 3 0 100 6 3 3 0 000-6z" },
  { id: "class-setup", label: "Class Setup", icon: "M9 3h11v9H9zM5 8H4v8h16M3 16v5h18v-5M13 7h3" },
  { id: "limits", label: "Limits", icon: "M12 3a9 9 0 00-7 14.7h14A9 9 0 0012 3zM12 13l4-4" },
  { id: "pricing", label: "Pricing", icon: "M6 3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3zM15 9c-.5-1-1.5-1.5-3-1.5-2 0-3 1-3 2.2 0 3 6 1.6 6 4.6 0 1.2-1 2.2-3 2.2-1.5 0-2.5-.5-3-1.5M12 6v12" },
  { id: "availability", label: "Availability", icon: "M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2zM3 10h18M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" },
  { id: "schedule", label: "Schedule", icon: "M6 3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3zM8 11l4 4 4-7" },
];

function Icon({ path, className = "size-5" }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
const PLUS = "M12 5v14M5 12h14";
const TRASH = "M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6";
const SPARKLE = "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8zM5 15l.6 1.4L7 17l-1.4.6L5 19l-.6-1.4L3 17l1.4-.6z";
const ARROW_RIGHT = "M5 12h14M13 6l6 6-6 6";

const inputClass = "field";
const labelClass = `text-[14px] leading-[20px] text-[#1e293b] ${fontSemi}`;
const yellowButton = `flex h-[44px] w-full max-w-[260px] items-center justify-center gap-2 rounded-[8px] bg-[#ffb20d] px-4 text-[16px] leading-[20px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`;
const inlineLink = "text-[#faa104] underline transition hover:text-[#c98003]";

function Select({ label, value, options, onChange, error }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; error?: boolean }) {
  return (
    <div className={`[&_ul]:max-h-[240px] [&_ul]:w-full [&_ul]:overflow-y-auto ${error ? "[&_button[aria-haspopup]]:border-[#f87171]" : ""}`}>
      <FilterSelect plain label={label} value={value} onChange={onChange} options={options} />
    </div>
  );
}

function StartShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f5f2ec]">
      <header className="flex h-[70px] shrink-0 items-center justify-between gap-4 bg-[#1e293b] px-4 md:px-8">
        <img src={imgLogo} alt="Thkee" className="h-[30px] w-[101.6px]" />
        <button type="button" onClick={() => openInstructorSessions()} className={`flex items-center gap-1.5 text-[16px] leading-[24px] text-white transition hover:text-[#ffb20d] ${fontRegular}`}>
          <Icon path="M15 6l-6 6 6 6" className="size-4" />
          Back to Dashboard
        </button>
      </header>
      <main className="flex flex-1 justify-center px-4 py-10 md:py-20">
        <div className="relative h-fit w-full max-w-[852px] rounded-[20px] bg-white px-5 py-12 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)] md:px-10">{children}</div>
      </main>
    </div>
  );
}

function StartHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mx-auto max-w-[440px] text-center">
      <h1 className={`m-0 text-[30px] leading-[38px] tracking-[-0.5px] text-[#1e293b] ${fontHeading}`}>{title}</h1>
      <p className={`mt-3 text-[16px] leading-[28px] text-[#334155] ${fontRegular}`}>{subtitle}</p>
    </div>
  );
}

const TYPE_OPTIONS: { kind: Kind; label: string; text: string; icon: string }[] = [
  { kind: "single", label: "Single Session", text: "Conduct a one-time live session with multiple students. Best for focused lessons, Q&A, and one-time training.", icon: "M20 11a8 8 0 11-7-7.9M16 12a4 4 0 11-4-4M12 12l6-6M18 3v3h3" },
  { kind: "multi", label: "Multi Session", text: "Plan a structured series of live sessions where students can join multiple scheduled classes.", icon: "M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2zM3 10h18M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" },
];

function StartFlow() {
  const [step, setStep] = useState<"type" | "setup">("type");
  const [kind, setKind] = useState<Kind>("single");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [attempted, setAttempted] = useState(false);

  const proceed = () => {
    setAttempted(true);
    if (!title.trim() || !category) return;
    const draft = makeDraft(`draft-${Date.now()}`, kind, title.trim(), category);
    save(DRAFTS_KEY, [draft, ...loadLiveDrafts()]);
    openLiveEditor(draft.id);
  };

  if (step === "type") {
    return (
      <StartShell>
        <StartHeading title="Welcome to Live Session" subtitle="Select the session type that best fits your teaching needs." />
        <div role="radiogroup" aria-label="Session type" className="mx-auto mt-6 flex max-w-[440px] flex-col gap-4">
          {TYPE_OPTIONS.map((option) => {
            const selected = option.kind === kind;
            return (
              <label key={option.kind} className={`relative block cursor-pointer rounded-[12px] border-2 p-5 pr-14 transition ${selected ? "border-[#faa104] bg-white" : "border-[#f8fafc] bg-[#f8fafc] hover:border-[#e2e8f0]"}`}>
                <input type="radio" name="session-type" checked={selected} onChange={() => setKind(option.kind)} className="peer sr-only" />
                <span className={`flex items-center gap-3 text-[#1e293b] ${selected ? "text-[18px]" : "text-[16px]"} leading-[28px] ${fontSemi}`}>
                  <Icon path={option.icon} className="size-7 shrink-0" />
                  {option.label}
                </span>
                <span className={`mt-2 block text-[14px] leading-[24px] text-[#334155] ${fontRegular}`}>{option.text}</span>
                <span aria-hidden="true" className={`absolute right-5 top-5 flex size-6 items-center justify-center rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#1e293b] ${selected ? "bg-[#334155]" : "border border-[#cbd5e1] bg-white"}`}>{selected && <span className="size-2 rounded-full bg-white" />}</span>
              </label>
            );
          })}
        </div>
        <div className="mt-10 flex justify-center">
          <button type="button" onClick={() => setStep("setup")} className={yellowButton}>
            Next
            <Icon path={ARROW_RIGHT} className="size-4" />
          </button>
        </div>
      </StartShell>
    );
  }

  return (
    <StartShell>
      <button type="button" onClick={() => setStep("type")} aria-label="Back to session type" className="mb-4 flex size-11 items-center justify-center rounded-[8px] bg-[#f1f5f9] text-[#1e293b] transition hover:bg-[#e2e8f0] md:absolute md:left-9 md:top-12 md:mb-0">
        <Icon path="M20 12H4M10 6l-6 6 6 6" />
      </button>
      <StartHeading title={`Set Up Your ${kind === "single" ? "Single" : "Multi"} Live Session`} subtitle="Define your session title and category to get started with your live class." />
      <form
        className="mx-auto mt-8 flex max-w-[440px] flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          proceed();
        }}
      >
        <label htmlFor="live-title" className={labelClass}>
          Live Course Title
        </label>
        <input id="live-title" value={title} maxLength={TITLE_LIMIT} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Learn Blender in 60 minutes" className={`mt-2 ${inputClass} ${attempted && !title.trim() ? "border-[#f87171]" : ""}`} />
        <div className="mt-1 flex justify-between gap-3 text-[12px] leading-[18px]">
          <span className={`text-[#dc2626] ${fontRegular}`}>{attempted && !title.trim() ? "This is required" : ""}</span>
          <span className={`text-[#64748b] ${fontRegular}`}>{TITLE_LIMIT - title.length} characters left!</span>
        </div>
        <p className={`mb-2 mt-4 ${labelClass}`}>Category</p>
        <Select label="Category" value={category} onChange={setCategory} error={attempted && !category} options={[{ value: "", label: "Select here" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} />
        {attempted && !category && <p className={`mt-1 text-[12px] leading-[18px] text-[#dc2626] ${fontRegular}`}>This is required</p>}
        <button type="submit" className={`${yellowButton} mx-auto mt-10`}>
          Proceed to Session Setup
          <Icon path={ARROW_RIGHT} className="size-4" />
        </button>
      </form>
    </StartShell>
  );
}

function PointList({ placeholder, values, onChange, keepFirst, counterOnFirst, addLink, label }: { placeholder: string; values: string[]; onChange: (next: string[]) => void; keepFirst?: boolean; counterOnFirst?: boolean; addLink?: boolean; label: string }) {
  const { notify } = useApp();
  return (
    <div className="mt-4">
      <ul className="flex flex-col gap-3">
        {values.map((value, i) => {
          const fixed = values.length === 1 || (keepFirst && i === 0);
          const counter = counterOnFirst && i === 0;
          return (
            <li key={i} className="flex items-center gap-3">
              <div className={`field-box min-w-0 flex-1 ${counter ? "md:mr-0" : ""}`}>
                <input aria-label={`${label} ${i + 1}`} value={value} maxLength={POINT_LIMIT} onChange={(e) => onChange(values.map((v, j) => (j === i ? e.target.value : v)))} placeholder={placeholder} className={`min-w-0 flex-1 bg-transparent text-[14px] leading-[24px] text-[#334155] outline-none placeholder:text-[#94a3b8] ${fontRegular}`} />
                {counter ? (
                  <span className={`shrink-0 text-[14px] text-[#cbd5e1] ${fontRegular}`}>{POINT_LIMIT - value.length}</span>
                ) : (
                  <button type="button" aria-label={`Suggest ${label.toLowerCase()} ${i + 1} with AI`} onClick={() => notify("AI suggestions are coming soon")} className="flex shrink-0 text-[#6016fc] transition hover:opacity-70">
                    <Icon path={SPARKLE} className="size-5" />
                  </button>
                )}
              </div>
              {!counter && !(keepFirst && i === 0) && (
                <button type="button" aria-label={`Remove ${label.toLowerCase()} ${i + 1}`} disabled={fixed} onClick={() => onChange(values.filter((_, j) => j !== i))} className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f8fafc] text-[#475569] transition hover:bg-[#f1f5f9] disabled:cursor-not-allowed disabled:opacity-40">
                  <Icon path={TRASH} className="size-4" />
                </button>
              )}
              {keepFirst && i === 0 && !counter && <span aria-hidden="true" className="size-8 shrink-0" />}
            </li>
          );
        })}
      </ul>
      <button type="button" onClick={() => onChange([...values, ""])} className={`mt-4 flex items-center gap-2 text-[14px] leading-[20px] text-[#1e293b] transition ${addLink ? "hover:text-[#64748b]" : "h-9 rounded-[8px] border border-[#cbd5e1] px-3 hover:bg-[#f8fafc]"} ${fontMedium}`}>
        <Icon path={PLUS} className="size-[18px]" />
        Add New
      </button>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h1 className={`m-0 text-[20px] leading-[28px] text-[#1e293b] ${fontSemi}`}>{children}</h1>;
}

type SectionProps = { draft: LiveDraft; update: (patch: Partial<LiveDraft>) => void; attempted: boolean };

function LearnersSection({ draft, update }: SectionProps) {
  const { notify } = useApp();
  const heading = `text-[16px] leading-[24px] text-[#1e293b] ${fontSemi}`;
  const text = `mt-2 text-[14px] leading-[24px] text-[#475569] ${fontRegular}`;
  return (
    <>
      <SectionTitle>Intended Learners</SectionTitle>
      <p className={`mt-6 text-[16px] leading-[28px] text-[#334155] ${fontRegular}`}>
        These descriptions will appear on your{" "}
        <button type="button" onClick={() => notify("The course landing page preview is coming soon")} className={inlineLink}>
          Course Landing Page
        </button>{" "}
        and help learners decide if your course suits them, directly impacting its performance.
      </p>
      <section className="mt-10">
        <h2 className={heading}>What will students learn in your course? - Course Objective</h2>
        <p className={text}>List at least {MIN_OBJECTIVES} key objectives to inspire learners and showcase their achievements after completing your course.</p>
        <PointList label="Objective" keepFirst placeholder="e.g. Learn about Control Structures" values={draft.objectives} onChange={(objectives) => update({ objectives })} />
      </section>
      <section className="mt-12">
        <h2 className={heading}>What are the requirements for this course? - Requirements</h2>
        <p className={text}>List any skills, tools, or prior knowledge needed for students to succeed in your course. If there are no requirements, mention that the course is suitable for beginners.</p>
        <PointList label="Requirement" placeholder="e.g. Learn about Control Structures" values={draft.requirements} onChange={(requirements) => update({ requirements })} />
      </section>
      <section className="mt-12">
        <h2 className={heading}>Who should take this course and what do they need to know? - Who this course is for</h2>
        <p className={text}>
          Add points for{" "}
          <button type="button" onClick={() => notify("Guidance on intended learners is coming soon")} className={inlineLink}>
            intended learners
          </button>{" "}
          why it's valuable to them and who will benefit most from your course. This will help attract the right learners.
        </p>
        <PointList label="Audience point" keepFirst counterOnFirst addLink placeholder="e.g. Aspiring Programmers" values={draft.audience} onChange={(audience) => update({ audience })} />
      </section>
    </>
  );
}

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

function DetailsSection({ draft, update }: SectionProps) {
  const { notify } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const hint = `mt-2 text-[12px] leading-[18px] text-[#475569] ${fontRegular}`;
  const words = wordCount(draft.description.text);

  const pickCover = (file?: File) => {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    if (!["image/webp", "image/jpeg", "image/png"].includes(file.type)) return notify("Use a .webp, .jpg, .jpeg or .png image");
    if (file.size > 1024 * 1024) return notify("Images must be under 1 MB for now");
    const reader = new FileReader();
    reader.onload = () => update({ cover: String(reader.result) });
    reader.readAsDataURL(file);
  };

  return (
    <>
      <SectionTitle>Details</SectionTitle>
      <div className="mt-8 flex flex-col gap-7">
        <div>
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="detail-title" className={labelClass}>
              Title
            </label>
            <span className={`text-[12px] leading-[18px] text-[#64748b] ${fontRegular}`}>{TITLE_LIMIT - draft.title.length} characters left!</span>
          </div>
          <input id="detail-title" value={draft.title} maxLength={TITLE_LIMIT} onChange={(e) => update({ title: e.target.value })} className={`mt-2 ${inputClass}`} />
          <p className={hint}>Make your title catchy, clear, and easy for people to find in a search.</p>
        </div>
        <div>
          <label htmlFor="detail-subtitle" className={labelClass}>
            Subtitle
          </label>
          <input id="detail-subtitle" value={draft.subtitle} onChange={(e) => update({ subtitle: e.target.value })} placeholder="e.g. Learn how to create anything from shapes in Blender!" className={`mt-2 ${inputClass}`} />
          <p className={hint}>Include 1–2 relevant keywords and highlight 3–4 key topics or skills your course covers to make it clear and engaging.</p>
        </div>
        <div>
          <p className={`mb-2 ${labelClass}`}>Topics</p>
          <Select label="Topics" value={draft.topic} onChange={(topic) => update({ topic })} options={[{ value: "", label: "Choose topic" }, ...TOPICS.map((t) => ({ value: t, label: t }))]} />
        </div>
        <div>
          <p className={`mb-2 ${labelClass}`}>Description</p>
          <NoteEditor toolbarTop hideActions autoFocus={false} initial={draft.description} placeholder="Course description..." onChange={(text, html) => update({ description: { text, html } })} />
          <p className={hint}>
            Write at least {MIN_DESCRIPTION_WORDS} words. {words > 0 && `(${words} so far)`}
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-6 md:flex-row">
          <div className="flex aspect-[7/4] w-full shrink-0 flex-col items-center justify-center gap-3 overflow-hidden rounded-[8px] bg-[#f8fafc] md:w-[310px]">
            {draft.cover ? (
              <img src={draft.cover} alt="Course cover preview" className="size-full object-cover" />
            ) : (
              <>
                <span className="flex size-[90px] items-center justify-center rounded-full bg-white text-[#94a3b8]">
                  <Icon path="M4 7h13a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2zM2 17l5-5 4 4 3-3 5 5M7 4h13a2 2 0 012 2v9M14 11h.01" className="size-11" />
                </span>
                <span className={`text-[14px] leading-[20px] text-[#475569] ${fontMedium}`}>No image</span>
              </>
            )}
          </div>
          <div className="min-w-0">
            <p className={`text-[16px] leading-[24px] text-[#1e293b] ${fontSemi}`}>Cover Image</p>
            <p className={`mt-2 text-[14px] leading-[24px] text-[#475569] ${fontRegular}`}>
              Upload your course image here. Supported files are .webp, .jpg, .jpeg, or .png. Best Size:(7:4 ratio) or <span className={fontSemi}>(580px × 330px)</span> See our{" "}
              <button type="button" onClick={() => notify("Image guidelines are coming soon")} className={inlineLink}>
                image guidelines.
              </button>
            </p>
            <div className="mt-4 flex gap-4">
              <button type="button" onClick={() => fileRef.current?.click()} className={`h-[44px] rounded-[8px] bg-[#475569] px-4 text-[16px] leading-[20px] text-white transition hover:bg-[#334155] ${fontMedium}`}>
                Browse Files
              </button>
              <button type="button" disabled={!draft.cover} onClick={() => update({ cover: "" })} className={`h-[44px] rounded-[8px] border border-[#cbd5e1] px-5 text-[16px] leading-[20px] text-[#1e293b] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50 ${fontMedium}`}>
                Reset
              </button>
              <input ref={fileRef} type="file" hidden aria-label="Choose cover image" accept=".webp,.jpg,.jpeg,.png" onChange={(e) => pickCover(e.target.files?.[0])} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const fieldTitle = `text-[14px] leading-[20px] text-[#1e293b] ${fontRegular}`;

function ClassSection({ draft, update }: SectionProps) {
  return (
    <>
      <SectionTitle>Class Setup</SectionTitle>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="class-duration" className={fieldTitle}>
            Session Duration
          </label>
          <div className="mt-2 flex">
            <input id="class-duration" type="number" min={1} value={draft.duration} onChange={(e) => update({ duration: e.target.value })} placeholder="60" className={`${inputClass} rounded-r-none`} />
            <span className={`flex h-[36px] shrink-0 items-center rounded-r-[8px] border border-l-0 border-[#e2e8f0] bg-[#f1f5f9] px-3.5 text-[14px] text-[#475569] ${fontRegular}`}>Minute</span>
          </div>
        </div>
        <div>
          <label htmlFor="class-seats" className={fieldTitle}>
            Available Seat
          </label>
          <input id="class-seats" type="number" min={1} value={draft.seats} onChange={(e) => update({ seats: e.target.value })} placeholder="50 person" className={`mt-2 ${inputClass}`} />
        </div>
      </div>
    </>
  );
}

function HelpLabel({ label, help, htmlFor }: { label: string; help: string; htmlFor?: string }) {
  return (
    <p className="mb-2 flex items-center gap-1.5">
      <label htmlFor={htmlFor} className={fieldTitle}>
        {label}
      </label>
      <span className="group/tip relative flex">
        <button type="button" aria-label={help} className="flex size-3.5 items-center justify-center rounded-full bg-[#94a3b8] text-[10px] leading-none text-white">
          ?
        </button>
        <span role="tooltip" className={`pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-[230px] -translate-x-1/2 rounded-[6px] bg-[#1e293b] px-2.5 py-2 text-[12px] leading-[18px] text-white group-focus-within/tip:block group-hover/tip:block ${fontRegular}`}>
          {help}
        </span>
      </span>
    </p>
  );
}

function LimitsSection({ draft, update }: SectionProps) {
  return (
    <>
      <SectionTitle>Limits</SectionTitle>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div>
          <HelpLabel label="Show Alert Before Event" help="How long before the session you should be reminded." />
          <Select label="Show Alert Before Event" value={draft.alertBefore} onChange={(alertBefore) => update({ alertBefore })} options={BUFFER_OPTIONS} />
        </div>
        <div>
          <HelpLabel label="After Event" help="Free time kept open after the session ends." />
          <Select label="After Event" value={draft.alertAfter} onChange={(alertAfter) => update({ alertAfter })} options={BUFFER_OPTIONS} />
        </div>
        <div>
          <HelpLabel htmlFor="minimum-notice" label="Minimum Notice" help="How far ahead students must book." />
          <div className="flex gap-2">
            <input id="minimum-notice" type="number" min={0} value={draft.noticeValue} onChange={(e) => update({ noticeValue: e.target.value })} placeholder="60" className={`${inputClass} min-w-0 flex-1`} />
            <div className="w-[130px] shrink-0">
              <Select
                label="Minimum notice unit"
                value={draft.noticeUnit}
                onChange={(noticeUnit) => update({ noticeUnit })}
                options={[
                  { value: "minutes", label: "Minutes" },
                  { value: "hours", label: "Hours" },
                  { value: "days", label: "Days" },
                ]}
              />
            </div>
          </div>
        </div>
        <div>
          <HelpLabel label="Time Slot Interval" help="How often a new start time is offered to students." />
          <Select label="Time Slot Interval" value={draft.slotInterval} onChange={(slotInterval) => update({ slotInterval })} options={INTERVAL_OPTIONS} />
        </div>
      </div>
      <div className="mt-4">
        <Checkbox checked={draft.remember} onChange={() => update({ remember: !draft.remember })}>
          <span className={`text-[14px] leading-[20px] text-[#475569] ${fontRegular}`}>Remember this setting</span>
        </Checkbox>
      </div>
    </>
  );
}

function PricingSection({ draft, update, attempted }: SectionProps) {
  const { notify } = useApp();
  const text = `text-[14px] leading-[24px] text-[#475569] ${fontRegular}`;
  const missing = attempted && !draft.price;
  return (
    <>
      <SectionTitle>Pricing</SectionTitle>
      <p className={`mt-6 ${text}`}>Please select the price tier for your live session below and click 'Save'. The list price that students will see in other currencies is determined using the price tier matrix. If you intend to offer your course for free, the total length of video content must be less than 2 hours.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-[245px_minmax(0,1fr)]">
        <div>
          <p className={`mb-2 ${fieldTitle}`}>Currency</p>
          <Select
            label="Currency"
            value={draft.currency}
            onChange={(currency) => update({ currency, price: "" })}
            options={[
              { value: "USD", label: "USD" },
              { value: "SAR", label: "SAR" },
            ]}
          />
        </div>
        <div>
          <p className={`mb-2 ${fieldTitle}`}>Prices</p>
          <Select label="Prices" value={draft.price} error={missing} onChange={(price) => update({ price })} options={[{ value: "", label: "Select a price" }, ...PRICE_TIERS[draft.currency].map((p) => ({ value: p, label: p }))]} />
          {missing && <p className={`mt-1.5 text-[12px] leading-[18px] text-[#dc2626] ${fontRegular}`}>This is required</p>}
        </div>
      </div>
      <hr className="my-10 border-[#e2e8f0]" />
      <h2 className={`text-[16px] leading-[24px] text-[#1e293b] ${fontSemi}`}>Thkee's Promotional Programs</h2>
      <p className={`mt-2 ${text}`}>
        Thkee offers several optional marketing programs in which you can choose to participate. These programs can help increase your revenue potential on Thkee by finding the optimal price point for your content and promoting it through additional marketing channels.
        <br />
        There is no up-front cost to participate in these programs, and you can modify your participation status at any time. However, changes you make will not apply to currently active campaigns.
        <br />
        These programs are subject to the terms of our{" "}
        <button type="button" onClick={() => notify("The Promotions Policy is coming soon")} className={inlineLink}>
          Promotions Policy
        </button>
        , so you should read it carefully.
      </p>
      <h2 className={`mt-5 text-[16px] leading-[24px] text-[#1e293b] ${fontSemi}`}>Deals Program</h2>
      <p className={`mt-2 ${text}`}>We will take care of promoting your content to a huge range of audiences using our advanced marketing tools. Participation can increase your revenue potential by enabling Thkee to offer your content at a compelling discount via targeted promotions.</p>
      <p className={`mt-6 ${text}`}>The Deals Program allows Thkee to offer your content for a price no lower than 75 SR (or local equivalent) except in select countries or to certain resellers. It also allows Thkee to optimize your list price in different markets.</p>
      <div className="mt-6">
        <Checkbox checked={draft.dealsAgreed} onChange={() => update({ dealsAgreed: !draft.dealsAgreed })}>
          <span className={`text-[14px] leading-[20px] text-[#334155] ${fontRegular}`}>I have read and agree to the Promotions Policy terms for the Thkee Deals Program.</span>
        </Checkbox>
      </div>
    </>
  );
}

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function AvailabilitySection({ draft, update }: SectionProps) {
  const [schedules, setSchedules] = useState(loadSchedules);
  // Edit availability opens in another tab, so pick up any changes when the instructor comes back.
  useEffect(() => {
    const refresh = () => setSchedules(loadSchedules());
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);
  const schedule = schedules.find((s) => s.id === draft.availabilityId) ?? schedules.find((s) => s.isDefault) ?? schedules[0];
  const row = `grid grid-cols-[110px_minmax(0,1fr)] gap-x-4 text-[14px] leading-[24px] sm:grid-cols-[168px_minmax(0,1fr)] ${fontRegular}`;

  return (
    <>
      <SectionTitle>Appointment Time</SectionTitle>
      {!schedule ? (
        <p className={`mt-8 rounded-[8px] border border-[#e2e8f0] px-6 py-12 text-center text-[14px] leading-[24px] text-[#64748b] ${fontRegular}`}>You don't have any availability schedules yet.</p>
      ) : (
        <div className="mt-8 rounded-[12px] border border-[#e2e8f0]">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-[12px] bg-[#f1f5f9] px-6 py-4">
            <p className={`flex items-center gap-2.5 text-[14px] leading-[20px] text-[#1e293b] ${fontRegular}`}>
              <Icon path="M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" className="size-[18px] shrink-0" />
              {schedule.timezone}
            </p>
            <a href={`#/instructor/availability/${encodeURIComponent(schedule.id)}`} target="_blank" rel="noreferrer" className={`flex items-center gap-2 text-[16px] leading-[24px] text-[#1e293b] transition hover:text-[#64748b] ${fontMedium}`}>
              <Icon path="M18 13v5a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h5M14 4h6v6M20 4l-8 8" className="size-[18px]" />
              Edit availability
            </a>
          </div>
          <div className="border-b border-[#e2e8f0] px-6 py-6">
            <p className={`mb-1.5 ${fieldTitle}`}>Availability</p>
            <Select label="Availability" value={schedule.id} onChange={(availabilityId) => update({ availabilityId })} options={schedules.map((s) => ({ value: s.id, label: s.isDefault ? `${s.name} (Default)` : s.name }))} />
          </div>
          <ul className="flex flex-col gap-3.5 px-6 py-5">
            {schedule.days.map((day, i) => (
              <li key={DAY_LABELS[i]} className={row}>
                {day.on ? (
                  <>
                    <span className="text-[#1e293b]">{DAY_LABELS[i]}</span>
                    <span className="flex flex-col gap-2.5 text-[#334155]">
                      {day.slots.map((slot, j) => (
                        <span key={j} className="whitespace-nowrap">
                          {formatClock(slot.start)}
                          <span className="mx-3">-</span>
                          {formatClock(slot.end)}
                        </span>
                      ))}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[#94a3b8] line-through">{DAY_LABELS[i]}</span>
                    <span className="text-[#94a3b8]">Unavailable</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

const firstProblem = (draft: LiveDraft): { section: string; message: string } | null => {
  const filled = (list: string[]) => list.filter((v) => v.trim()).length;
  if (filled(draft.objectives) < MIN_OBJECTIVES) return { section: "intended-learners", message: `Add at least ${MIN_OBJECTIVES} course objectives` };
  if (filled(draft.requirements) < 1) return { section: "intended-learners", message: "Add at least one requirement" };
  if (filled(draft.audience) < 1) return { section: "intended-learners", message: "Add who this course is for" };
  if (!draft.title.trim()) return { section: "details", message: "Add a title" };
  if (!draft.topic) return { section: "details", message: "Choose a topic" };
  if (wordCount(draft.description.text) < MIN_DESCRIPTION_WORDS) return { section: "details", message: `Write at least ${MIN_DESCRIPTION_WORDS} words in the description` };
  if (!draft.cover) return { section: "details", message: "Add a cover image" };
  if (!draft.duration) return { section: "class-setup", message: "Add the session duration" };
  if (!draft.seats) return { section: "class-setup", message: "Add the available seats" };
  if (!draft.price) return { section: "pricing", message: "Select a price" };
  const scheduleProblem = hasScheduleProblem(draft);
  if (scheduleProblem) return { section: "schedule", message: scheduleProblem };
  return null;
};

function Editor({ initial, section }: { initial: LiveDraft; section: string }) {
  const { notify } = useApp();
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [attempted, setAttempted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const update = (patch: Partial<LiveDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const current = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const persist = (next: LiveDraft) => {
    if (!next.title.trim()) {
      notify("Add a title before saving");
      openLiveEditor(next.id, "details");
      return false;
    }
    const clean = { ...next, title: next.title.trim() };
    save(DRAFTS_KEY, [clean, ...loadLiveDrafts().filter((d) => d.id !== clean.id)]);
    if (clean.remember) save(LIMITS_KEY, { alertBefore: clean.alertBefore, alertAfter: clean.alertAfter, noticeValue: clean.noticeValue, noticeUnit: clean.noticeUnit, slotInterval: clean.slotInterval, remember: true });
    setDraft(clean);
    setSaved(clean);
    return true;
  };
  const saveNow = () => {
    if (current.id === "pricing") setAttempted(true);
    if (persist(draft)) notify("Saved");
  };
  const saveAndNext = () => {
    if (!persist(draft)) return;
    notify("Saved");
    const next = SECTIONS[SECTIONS.findIndex((s) => s.id === current.id) + 1];
    if (next) openLiveEditor(draft.id, next.id);
  };
  const publish = () => {
    setAttempted(true);
    const problem = firstProblem(draft);
    if (problem) {
      notify(problem.message);
      openLiveEditor(draft.id, problem.section);
      return;
    }
    if (persist({ ...draft, status: "published" })) {
      notify("Session published");
      openInstructorSessions();
    }
  };

  const navItem = (active: boolean) => `flex h-10 shrink-0 items-center gap-3 rounded-[8px] px-4 text-left text-[14px] leading-[20px] transition md:w-full ${active ? "bg-[#f1f5f9] text-[#1e293b]" : "text-[#475569] hover:bg-[#f8fafc]"} ${fontRegular}`;
  const props: SectionProps = { draft, update, attempted };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white">
      <header className="sticky top-0 z-30 flex min-h-[70px] flex-wrap items-center justify-between gap-3 border-b border-[#e2e8f0] bg-white px-4 py-2 md:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <button type="button" onClick={() => (dirty ? setLeaving(true) : openInstructorSessions())} className={`flex shrink-0 items-center gap-2 border-r border-[#e2e8f0] pr-4 text-[14px] leading-[20px] text-[#1e293b] transition hover:text-[#64748b] ${fontRegular}`}>
            <Icon path="M15 6l-6 6 6 6" className="size-5" />
            Back
          </button>
          <div className="min-w-0">
            <p className={`truncate text-[16px] leading-[24px] text-[#0f172a] ${fontSemi}`}>{draft.title || "Untitled session"}</p>
            <p className={`mt-0.5 flex flex-wrap items-center gap-3 text-[12px] leading-[18px] text-[#ef4444] ${fontRegular}`}>
              <span className="flex items-center gap-1.5">
                <Icon path="M3 6h13a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1zM17 11l5-3v8l-5-3M8 10l3 2-3 2z" className="size-4" />
                <span>
                  Live session<span className={fontSemi}>({draft.kind === "single" ? "Single" : "Multi Session"})</span>
                </span>
              </span>
              {draft.kind === "single" ? <SingleSessionBadge /> : <MultiSessionBadge />}
            </p>
          </div>
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
            <ActionMenu
              label="More save options"
              triggerClass="flex h-9 items-center rounded-r-[8px] px-2.5 transition hover:bg-[#0f172a]"
              trigger={<Icon path="M6 9l6 6 6-6" className="size-4" />}
              items={[
                { label: "Save and continue", onClick: saveAndNext },
                { label: draft.status === "published" ? "Update published session" : "Publish session", onClick: publish },
              ]}
            />
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="flex shrink-0 flex-col justify-between border-b border-[#e2e8f0] p-3 md:sticky md:top-[70px] md:h-[calc(100dvh-70px)] md:w-[268px] md:border-b-0 md:border-r md:p-6">
          <nav aria-label="Session setup" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            {SECTIONS.map((item) => (
              <button key={item.id} type="button" aria-current={item.id === current.id ? "page" : undefined} onClick={() => openLiveEditor(draft.id, item.id)} className={navItem(item.id === current.id)}>
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
            <button type="button" onClick={() => notify("Session settings are coming soon")} className={navItem(false)}>
              <Icon path="M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 00-2.1-1.2L14 3h-4l-.5 2.7a7 7 0 00-2.1 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 005 12a7 7 0 00.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 002.1 1.2L10 21h4l.5-2.7a7 7 0 002.1-1.2l2.3 1 2-3.4-2-1.5A7 7 0 0019 12z" className="size-5 shrink-0" />
              Settings
            </button>
          </div>
        </aside>
        <main className="min-w-0 flex-1 bg-[#fdfdfd] px-4 pb-16 pt-7 md:px-10">
          <div className="mx-auto max-w-[770px]">
            {current.id === "intended-learners" && <LearnersSection {...props} />}
            {current.id === "details" && <DetailsSection {...props} />}
            {current.id === "class-setup" && <ClassSection {...props} />}
            {current.id === "limits" && <LimitsSection {...props} />}
            {current.id === "pricing" && <PricingSection {...props} />}
            {current.id === "availability" && <AvailabilitySection {...props} />}
            {current.id === "schedule" && <LiveScheduleSection draft={draft} update={update} />}
          </div>
        </main>
      </div>
      {leaving && <ConfirmDialog title="Leave without saving?" body="Your unsaved changes to this session will be lost." confirmLabel="Leave without saving" onClose={() => setLeaving(false)} onConfirm={() => openInstructorSessions()} />}
    </div>
  );
}

export default function InstructorLiveCreate({ draftId, section }: { draftId?: string; section?: string }) {
  const [initial] = useState<LiveDraft | null>(() => {
    if (!draftId) return null;
    const stored = loadLiveDrafts().find((d) => d.id === draftId);
    const course = LIVE_COURSES.find((c) => c.id === draftId);
    if (course) return { ...makeDraft(course.id, course.kind, course.title, "", course.status === "draft" ? "draft" : "published"), ...seedSchedule(course.kind), ...stored };
    return stored ? { ...makeDraft(stored.id, stored.kind, stored.title, stored.category), ...stored } : null;
  });

  useEffect(() => {
    if (draftId && !initial) openCreateSession();
  }, [draftId, initial]);

  if (draftId && initial) return <Editor initial={initial} section={section ?? SECTIONS[0].id} />;
  return <StartFlow />;
}
