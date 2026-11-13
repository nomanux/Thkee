import { Fragment, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { uploadFile } from "../api";
import { shrinkImage } from "../imageShrink";
import { fontMedium, fontRegular, fontSemi } from "../fonts";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ArrowUpDownIcon, Image01Icon, LeftToRightListBulletIcon, NoteAddIcon, LeftToRightListNumberIcon, Link01Icon, SourceCodeIcon, TextBoldIcon, TextItalicIcon, TextUnderlineIcon } from "@hugeicons/core-free-icons";
import { buttonClass, type ButtonSize, type ButtonVariant } from "./Button"

export type Note = {
  id: number;
  lessonKey: string;
  lessonTitle: string;
  sectionTitle: string;
  kind: "video" | "article" | "quiz" | "assignment";
  text: string;
  // Formatted copy of text, written by the notes editor.
  html?: string;
  created: number;
  at?: number;
  quote?: string;
  para?: number;
  start?: number;
  end?: number;
};

export type LessonRef = { key: string; title: string; sectionTitle: string; kind: Note["kind"]; minutes: number };

export const clock = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

// Demo article text about UX empathy, shared by every reading lesson.
const article: { heading?: string; text: string }[] = [
  {
    text: "The name UX design says it all: the user’s experience is at the center of how we design products. The best way for you to create great user experiences is to know and empathize with your user. As you might recall, empathy is the ability to understand someone else’s feelings or thoughts in a situation.",
  },
  {
    text: "As a UX designer, empathizing with users enhances the products you create because you experience the product the way your user does. The better you are at anticipating a user’s desires and needs, the more comfortable they will be with your design, and the more likely they will be to engage with your product long-term.",
  },
  { text: "So, let’s explore how empathy can make you a more effective UX designer!" },
  {
    heading: "How to empathize with users",
    text: "If empathizing with users sounds like a big task, fear not! The ability to empathize with users is a skill that can be learned with practice. Here are six tips that can help you become a more empathetic UX designer.",
  },
  {
    text: "Ask lots of questions. Don’t assume you already know what users want. Interviews and conversations reveal goals, frustrations and the context people work in.",
  },
  {
    text: "Be open-minded and curious. Treat every surprising answer as a clue rather than a mistake. The users who struggle the most often teach you the most.",
  },
  {
    text: "Listen more than you talk. Silence gives people room to share details they would otherwise skip, and those details often shape the best design decisions.",
  },
  {
    heading: "Putting empathy into practice",
    text: "Turn what you learn into artefacts the whole team can use: personas, empathy maps and journey maps keep real people in the room long after the research sessions end.",
  },
];

type RangeKind = "highlight" | "note" | "pending";
type MarkRange = { start: number; end: number; kind: RangeKind; id: number };

// Yellow is a plain highlight, mint is a highlight with a note. Saved notes get their colour from whether they have text.
const markClass: Record<RangeKind, string> = {
  highlight: "cursor-pointer bg-yellow-100 hover:bg-amber-200",
  note: "cursor-pointer bg-emerald-100 hover:bg-emerald-200",
  pending: "bg-blue-100",
};

function Paragraph({ text, ranges, index, onOpen }: { text: string; ranges: MarkRange[]; index: number; onOpen: (id: number, el: HTMLElement) => void }) {
  const parts: ReactNode[] = [];
  let pos = 0;
  [...ranges]
    .sort((a, b) => a.start - b.start)
    .forEach((r) => {
      if (r.start > pos) parts.push(text.slice(pos, r.start));
      const open = r.kind !== "pending";
      parts.push(
        <mark
          key={r.id}
          data-note={open ? r.id : undefined}
          role={open ? "button" : undefined}
          tabIndex={open ? 0 : undefined}
          aria-label={open ? (r.kind === "note" ? "Open note" : "Open highlight") : undefined}
          onClick={open ? (e) => onOpen(r.id, e.currentTarget) : undefined}
          onKeyDown={
            open
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(r.id, e.currentTarget);
                  }
                }
              : undefined
          }
          className={`rounded-xs text-inherit transition-colors ${markClass[r.kind]}`}
        >
          {text.slice(r.start, r.end)}
        </mark>,
      );
      pos = r.end;
    });
  if (pos < text.length) parts.push(text.slice(pos));
  return <p data-para={index}>{parts}</p>;
}

const allowedTags = new Set(["B", "STRONG", "I", "EM", "U", "UL", "OL", "LI", "P", "DIV", "BR", "CODE", "A", "IMG", "H3"]);

// Notes are rendered as HTML, so only the editor's own tags survive, with only safe links and embedded images.
function sanitizeNote(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const clean = (node: Element) => {
    [...node.children].forEach((el) => {
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE") return el.remove();
      clean(el);
      if (!allowedTags.has(el.tagName)) return el.replaceWith(...el.childNodes);
      const href = el.getAttribute("href") ?? "";
      const src = el.getAttribute("src") ?? "";
      [...el.attributes].forEach((a) => el.removeAttribute(a.name));
      if (el.tagName === "A" && /^https?:\/\//i.test(href)) {
        el.setAttribute("href", href);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      }
      if (el.tagName === "IMG") {
        // Embedded images, uploaded files on this site (/thkee-api/uploads/...) and https images are kept.
        if (/^data:image\/(png|jpeg|gif|webp);base64,/.test(src) || /^\/[\w\-./]+\.(png|jpe?g|gif|webp)$/i.test(src) || /^https:\/\//i.test(src)) el.setAttribute("src", src);
        else el.remove();
      }
    });
  };
  clean(doc.body);
  return doc.body.innerHTML;
}

const richText = "[&_b]:font-inter-bold [&_strong]:font-inter-bold [&_i]:font-synthesis-style [&_em]:font-synthesis-style [&_u]:underline [&_a]:text-ai-600 [&_a]:underline [&_code]:rounded-sm [&_code]:bg-slate-150 [&_code]:px-1 [&_code]:font-mono [&_img]:max-w-full [&_img]:rounded-md [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_h3]:mb-1.5 [&_h3]:mt-4 [&_h3]:text-em-115 [&_h3]:leading-snug [&_h3]:font-inter-bold [&_h3]:text-slate-900";

export function NoteBody({ note, className = "", tone = "text-slate-900" }: { note: Pick<Note, "text" | "html">; className?: string; tone?: string }) {
  const cls = `text-sm leading-5.5 ${tone} ${fontRegular} ${className}`;
  if (note.html) return <div className={`${cls} ${richText}`} dangerouslySetInnerHTML={{ __html: sanitizeNote(note.html) }} />;
  return <p className={`whitespace-pre-wrap ${cls}`}>{note.text}</p>;
}

function Svg({ className = "size-4.5", children }: { className?: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const penIcon = <path d="M15 4l5 5-9 9H6v-5zM4 21h16" />;
const noteIcon = <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5M9 13h6M9 17h4" />;

function ToolButton({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`group/tip relative flex size-8 items-center justify-center rounded-sm hover:bg-slate-150 ${danger ? "text-red-600" : "text-slate-900"}`}
    >
      {children}
      <span role="tooltip" className={`pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xs bg-black px-3 py-1.5 text-sm leading-4.5 text-white group-hover/tip:block group-focus-visible/tip:block ${fontRegular}`}>
        {label}
        <span className="absolute left-1/2 top-full size-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-black" />
      </span>
    </button>
  );
}

type Anchor = { x: number; top: number; bottom: number };

function Floating({ anchor, width, height, boxWidth, margin = 8, arrow, children }: { anchor: Anchor; width: number; height: number; boxWidth: number; margin?: number; arrow?: boolean; children: ReactNode }) {
  // Opens above the text, or below it when the top of the reader has no room.
  const above = anchor.top >= height + 10;
  const left = Math.max(margin, Math.min(anchor.x - width / 2, boxWidth - width - margin));
  return (
    <div className={`pop-in absolute z-20 ${above ? "-translate-y-full" : ""}`} style={{ left, width, top: above ? anchor.top - 8 : anchor.bottom + 8 }}>
      {children}
      {arrow && <span className={`absolute size-2.5 rotate-45 bg-white ${above ? "-bottom-1" : "-top-1"}`} style={{ left: Math.max(12, Math.min(anchor.x - left - 5, width - 22)) }} />}
    </div>
  );
}

const floatingCard = "rounded-lg bg-white p-3 shadow-2xl";

type Target = { para: number; start: number; end: number; quote: string };

export function ArticleReader({
  lesson,
  notes,
  done,
  setNotes,
  onComplete,
  onBack,
  onNext,
  notify,
  expanded,
  onToggleExpand,
}: {
  lesson: LessonRef;
  notes: Note[];
  done: boolean;
  setNotes: (update: (list: Note[]) => Note[]) => void;
  onComplete: () => void;
  onBack?: () => void;
  onNext?: () => void;
  notify: (message: string) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const [zoom, setZoom] = useState(100);
  const [left, setLeft] = useState(lesson.minutes * 60);
  const [read, setRead] = useState(0);
  // tools: highlight / note icons. view: a saved note. write: the note box. target is a new selection, noteId a saved mark.
  const [pop, setPop] = useState<{ mode: "tools" | "view" | "write"; anchor: Anchor; target?: Target; noteId?: number } | null>(null);
  const [draft, setDraft] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (done || left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, done]);

  const highlights = useMemo(() => notes.filter((n) => n.lessonKey === lesson.key && n.para !== undefined && n.start !== undefined && n.end !== undefined), [notes, lesson.key]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setRead(max > 0 ? el.scrollTop / max : 1);
    setPop(null);
    if (!done && el.scrollTop + el.clientHeight >= el.scrollHeight - 8) onComplete();
  };

  const anchorFrom = (rect: DOMRect): Anchor => {
    const box = wrapRef.current!.getBoundingClientRect();
    return { x: rect.left - box.left + rect.width / 2, top: rect.top - box.top, bottom: rect.bottom - box.top };
  };

  const onMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !wrapRef.current) {
      if (!(e.target as HTMLElement).closest("[data-note]")) setPop(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const startP = (range.startContainer.parentElement as HTMLElement | null)?.closest<HTMLElement>("[data-para]");
    const endP = (range.endContainer.parentElement as HTMLElement | null)?.closest<HTMLElement>("[data-para]");
    if (!startP || startP !== endP) {
      setPop(null);
      if (startP !== endP) notify("Select text within one paragraph to highlight it");
      return;
    }
    const pre = document.createRange();
    pre.selectNodeContents(startP);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length;
    const quote = range.toString();
    if (!quote.trim()) return setPop(null);
    const para = Number(startP.dataset.para);
    const end = start + quote.length;
    if (highlights.some((h) => h.para === para && start < (h.end ?? 0) && end > (h.start ?? 0))) {
      setPop(null);
      return notify("Part of this text is already highlighted");
    }
    setPop({ mode: "tools", anchor: anchorFrom(range.getBoundingClientRect()), target: { para, start, end, quote: quote.trim() } });
  };

  const openMark = (id: number, el: HTMLElement) => {
    const note = highlights.find((h) => h.id === id);
    if (!note) return;
    setPop({ mode: note.text ? "view" : "tools", anchor: anchorFrom(el.getBoundingClientRect()), noteId: id });
  };

  const addRecord = (target: Target, text: string) => {
    const id = Date.now();
    setNotes((list) => [{ id, created: id, lessonKey: lesson.key, lessonTitle: lesson.title, sectionTitle: lesson.sectionTitle, kind: "article", text, quote: target.quote, para: target.para, start: target.start, end: target.end }, ...list]);
  };

  const highlight = () => {
    if (pop?.target) addRecord(pop.target, "");
    window.getSelection()?.removeAllRanges();
    setPop(null);
  };

  const removeRecord = () => {
    setNotes((list) => list.filter((n) => n.id !== pop?.noteId));
    setPop(null);
  };

  const startWriting = () => {
    if (!pop) return;
    setDraft(highlights.find((h) => h.id === pop.noteId)?.text ?? "");
    window.getSelection()?.removeAllRanges();
    setPop({ ...pop, mode: "write" });
  };

  const finishWriting = () => {
    const text = draft.trim();
    if (!text) return;
    if (pop?.target) addRecord(pop.target, text);
    else setNotes((list) => list.map((n) => (n.id === pop?.noteId ? { ...n, text, html: undefined } : n)));
    setPop(null);
  };

  const openNote = highlights.find((h) => h.id === pop?.noteId);
  const boxWidth = wrapRef.current?.clientWidth ?? 0;

  const iconBtn = "flex size-8 items-center justify-center rounded-md text-slate-900 transition hover:bg-white";

  return (
    <div className="bg-slate-800">
      <div className="flex flex-wrap items-center gap-3 bg-cyan-950 px-4 py-3 md:px-4">
        <p className={`min-w-0 flex-1 truncate text-base text-white md:text-lg ${fontRegular}`}>{lesson.title}</p>
        <span className={`flex items-center gap-1.5 text-sm text-white/90 tabular-nums ${fontRegular}`}>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          {done ? "Completed" : `${clock(Math.max(0, left))} min left`}
        </span>
        <button type="button" onClick={onBack} disabled={!onBack} className={`h-8.5 rounded-md bg-white px-3 text-sm text-slate-900 transition hover:bg-slate-150 disabled:opacity-40 ${fontMedium}`}>
          Back
        </button>
        <button type="button" onClick={onNext} disabled={!onNext} className={`${buttonClass("yellow", "md")}`}>
          Next
        </button>
      </div>

      <div className="p-3 md:p-4">
        <div ref={wrapRef} className="relative overflow-hidden rounded-md bg-secondary-50">
          <div className="flex items-center justify-center gap-2 bg-slate-200 px-3 py-2">
            <button type="button" onClick={() => setZoom((z) => Math.max(80, z - 10))} aria-label="Zoom out" className={iconBtn}>
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14" />
              </svg>
            </button>
            <span className={`w-12 rounded-sm bg-white py-1 text-center text-11 text-slate-900 ${fontRegular}`}>{zoom}%</span>
            <button type="button" onClick={() => setZoom((z) => Math.min(150, z + 10))} aria-label="Zoom in" className={iconBtn}>
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <button type="button" onClick={onToggleExpand} aria-label={expanded ? "Exit expanded view" : "Expand reading view"} aria-pressed={expanded} className={`${iconBtn} absolute right-3`}>
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {expanded ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
              </svg>
            </button>
          </div>

          <div ref={scrollRef} onScroll={onScroll} onMouseUp={onMouseUp} className={`overflow-y-auto px-5 py-6 transition-all duration-300 md:px-8 md:py-8 ${expanded ? "max-h-dvh-minus-218 min-h-110" : "max-h-110"}`}>
            <div className={`flex flex-col gap-6 text-slate-800 ${fontRegular}`} style={{ fontSize: `${(14 * zoom) / 100}px`, lineHeight: 1.75 }}>
              {article.map((block, i) => (
                <div key={i} className="flex flex-col gap-1">
                  {block.heading && <h3 className={`m-0 text-em-115 text-slate-900 ${fontMedium}`}>{block.heading}</h3>}
                  <Paragraph
                    index={i}
                    text={block.text}
                    onOpen={openMark}
                    ranges={[
                      ...highlights.filter((h) => h.para === i).map((h): MarkRange => ({ start: h.start!, end: h.end!, kind: h.text ? "note" : "highlight", id: h.id })),
                      ...(pop?.mode === "write" && pop.target?.para === i ? [{ start: pop.target.start, end: pop.target.end, kind: "pending" as const, id: -1 }] : []),
                    ]}
                  />
                </div>
              ))}
              {!done && (
                <button type="button" onClick={onComplete} className={`self-start rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 ${fontMedium}`}>
                  Mark as complete
                </button>
              )}
            </div>
          </div>

          {pop?.mode === "tools" && (
            <Floating anchor={pop.anchor} width={78} height={84} boxWidth={boxWidth} margin={50}>
              <div className="flex gap-1 rounded-sm border border-slate-200 bg-white p-1 shadow-xl">
                {pop.target ? (
                  <ToolButton label="Highlight" onClick={highlight}>
                    <Svg>{penIcon}</Svg>
                  </ToolButton>
                ) : (
                  <ToolButton label="Remove Highlight" onClick={removeRecord}>
                    <Svg>
                      {penIcon}
                      <path d="M4 4l16 16" />
                    </Svg>
                  </ToolButton>
                )}
                <ToolButton label="Add Note" onClick={startWriting}>
                  <Svg>{noteIcon}</Svg>
                </ToolButton>
              </div>
            </Floating>
          )}

          {pop?.mode === "write" && (
            <Floating anchor={pop.anchor} width={272} height={190} boxWidth={boxWidth} arrow>
              <div className={`${floatingCard} flex flex-col gap-3`}>
                <textarea
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setPop(null)}
                  rows={4}
                  placeholder="Add a note here."
                  aria-label="Note"
                  className={"field"}
                />
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setPop(null)} className={`h-9 rounded-md border border-slate-600 text-sm text-slate-600 transition hover:bg-slate-150 ${fontMedium}`}>
                    Cancel
                  </button>
                  <button type="button" onClick={finishWriting} disabled={!draft.trim()} className={`h-9 rounded-md bg-ai-600 text-sm text-white transition hover:bg-indigo-700 disabled:opacity-50 ${fontMedium}`}>
                    Done
                  </button>
                </div>
              </div>
            </Floating>
          )}

          {pop?.mode === "view" && openNote && (
            <Floating anchor={pop.anchor} width={232} height={170} boxWidth={boxWidth} arrow>
              <div className={`${floatingCard} flex flex-col gap-2`}>
                <div className="flex max-h-24 gap-2 overflow-y-auto rounded-xs border border-slate-200">
                  <span className="w-0.75 shrink-0 bg-violet-400" />
                  <NoteBody note={openNote} className="min-w-0 flex-1 break-words py-1.5 pr-2" />
                </div>
                <div className="flex justify-center gap-2">
                  <ToolButton label="Edit note" onClick={startWriting}>
                    <Svg>{noteIcon}</Svg>
                  </ToolButton>
                  <ToolButton label="Remove note" danger onClick={removeRecord}>
                    <Svg>
                      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4h6v3" />
                    </Svg>
                  </ToolButton>
                </div>
              </div>
            </Floating>
          )}

          {read > 0.05 && (
            <button
              type="button"
              onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Back to top of article"
              className={`fade-up absolute right-5 flex size-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-xl transition hover:scale-105 ${done ? "bottom-18" : "bottom-5"}`}
            >
              <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90" aria-hidden="true">
                <circle cx="20" cy="20" r="18" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
                <circle cx="20" cy="20" r="18" fill="none" stroke="#ffb20d" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${read * 113.1} 113.1`} />
              </svg>
              <svg viewBox="0 0 24 24" className="relative size-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 19V5M6 11l6-6 6 6" />
              </svg>
            </button>
          )}

          {done && <span className={`fade-up absolute bottom-4 right-4 rounded-md bg-emerald-700 px-3 py-2 text-sm text-white shadow-lg ${fontMedium}`}>Completed!</span>}
        </div>
      </div>
    </div>
  );
}

function KindBadge({ kind }: { kind: Note["kind"] }) {
  return (
    <span className={`flex shrink-0 items-center gap-1 rounded-sm bg-slate-800 px-1.5 py-1 text-xs leading-none text-white ${fontRegular}`}>
      {kind === "video" ? (
        <svg viewBox="0 0 24 24" className="size-3" fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-2 6l6 4-6 4z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-3" fill="currentColor" aria-hidden="true">
          <path d="M3 5h7v14H3zM14 5h7v14h-7z" />
        </svg>
      )}
      {kind === "video" ? "Video" : kind === "quiz" ? "Quiz" : kind === "assignment" ? "Assignment" : "Article"}
    </span>
  );
}

// Toolbar icons come from Hugeicons, like the rest of the app's menus.
const editorTools: { command: string; label: string; icon: IconSvgElement }[] = [
  { command: "bold", label: "Bold", icon: TextBoldIcon },
  { command: "italic", label: "Italic", icon: TextItalicIcon },
  { command: "underline", label: "Underline", icon: TextUnderlineIcon },
  { command: "insertUnorderedList", label: "Bulleted list", icon: LeftToRightListBulletIcon },
  { command: "insertOrderedList", label: "Numbered list", icon: LeftToRightListNumberIcon },
];

const editorExtraIcons = { image: Image01Icon, link: Link01Icon, code: SourceCodeIcon };

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function NoteEditor({
  initial,
  allowEmpty,
  placeholder = "Insert note here",
  saveLabel = "Save",
  saveClass = "",
  saveVariant = "yellow",
  saveSize = "md",
  extras,
  imageOnly,
  sideAction,
  submitOnEnter,
  hideActions,
  clearOnSave,
  toolbarTop,
  modern,
  page,
  linkOnly,
  hideUnderline,
  toolbarEnd,
  boxClass = "min-h-31.5",
  autoFocus = true,
  onChange,
  onSave,
  onCancel,
}: {
  initial?: Pick<Note, "text" | "html">;
  allowEmpty?: boolean;
  placeholder?: string;
  saveLabel?: string;
  // Extra classes for the save button. Prefer saveVariant and saveSize.
  saveClass?: string;
  saveVariant?: ButtonVariant;
  saveSize?: ButtonSize;
  // Adds the image, link and code buttons.
  extras?: boolean;
  // Adds only the image button.
  imageOnly?: boolean;
  // Puts the save button beside the box instead of below it.
  sideAction?: boolean;
  // Enter saves, Shift+Enter adds a new line.
  submitOnEnter?: boolean;
  hideActions?: boolean;
  clearOnSave?: boolean;
  // Puts the formatting buttons above the text instead of below it.
  toolbarTop?: boolean;
  // Writing-first look: content on top, a quiet grouped toolbar along the bottom, larger text.
  modern?: boolean;
  // Document look for long writing (articles): no box, larger text, toolbar pinned at the top while scrolling.
  page?: boolean;
  // With extras, keeps the link button but leaves out image and code.
  linkOnly?: boolean;
  hideUnderline?: boolean;
  // Sits at the far end of the formatting buttons.
  toolbarEnd?: ReactNode;
  // Sizing for the text box.
  boxClass?: string;
  autoFocus?: boolean;
  onChange?: (text: string, html: string) => void;
  onSave?: (text: string, html: string) => void;
  onCancel?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [empty, setEmpty] = useState(!initial?.text && !initial?.html);
  const [active, setActive] = useState<string[]>([]);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [error, setError] = useState("");
  // Floating toolbar over selected text (page mode), like Medium and Notion.
  const [bubble, setBubble] = useState<{ x: number; y: number } | null>(null);
  const [isHeading, setIsHeading] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (initial?.html) el.innerHTML = sanitizeNote(initial.html);
    else el.textContent = initial?.text ?? "";
    if (autoFocus) el.focus();
    const refresh = () => {
      setActive(document.activeElement === el ? editorTools.map((t) => t.command).filter((c) => document.queryCommandState(c)) : []);
      if (!page) return;
      const sel = window.getSelection();
      const range = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
      if (!sel || sel.isCollapsed || !range || !el.contains(range.commonAncestorContainer)) return setBubble(null);
      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) return setBubble(null);
      setBubble({ x: rect.left + rect.width / 2, y: rect.top });
      setIsHeading(String(document.queryCommandValue("formatBlock")).toLowerCase() === "h3");
    };
    document.addEventListener("selectionchange", refresh);
    const hide = () => setBubble(null);
    window.addEventListener("scroll", hide, true);
    return () => {
      document.removeEventListener("selectionchange", refresh);
      window.removeEventListener("scroll", hide, true);
    };
  }, []);

  const onInput = () => {
    const el = ref.current;
    if (!el) return;
    setEmpty(!el.innerText.trim() && !el.querySelector("li,img"));
    onChange?.(el.innerText.trim(), sanitizeNote(el.innerHTML));
  };

  const run = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    onInput();
  };

  // Link and image pick take focus away, so the cursor is remembered and put back afterwards.
  const rememberCursor = () => {
    const sel = window.getSelection();
    const range = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
    savedRange.current = range && ref.current?.contains(range.commonAncestorContainer) ? range.cloneRange() : null;
  };
  const restoreCursor = () => {
    ref.current?.focus();
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const insertCode = () => {
    const text = window.getSelection()?.toString();
    if (text) run("insertHTML", `<code>${escapeHtml(text)}</code>`);
  };

  const pickImage = (file?: File) => {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setError("");
    // Large images shrink automatically to under 1 MB.
    shrinkImage(file)
      .then(async (small) => {
        const url = await uploadFile(small);
        if (url) {
          restoreCursor();
          return run("insertImage", url);
        }
        const reader = new FileReader();
        reader.onload = () => {
          restoreCursor();
          run("insertImage", String(reader.result));
        };
        reader.readAsDataURL(small);
      })
      .catch(() => setError("Image upload failed. Please try again."));
  };

  const addLink = () => {
    const value = linkUrl.trim();
    if (!value) return;
    const url = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      new URL(url);
    } catch {
      return setError("Enter a valid link.");
    }
    setError("");
    restoreCursor();
    if (window.getSelection()?.isCollapsed) run("insertHTML", `<a href="${escapeHtml(url)}">${escapeHtml(value)}</a>`);
    else run("createLink", url);
    setLinkUrl("");
    setLinkOpen(false);
  };

  const save = () => {
    const el = ref.current;
    if (!el) return;
    onSave?.(el.innerText.trim(), sanitizeNote(el.innerHTML));
    if (clearOnSave) {
      el.innerHTML = "";
      setEmpty(true);
    }
  };

  const toolCls = (on: boolean) =>
    modern
      ? `flex size-8 items-center justify-center rounded-lg transition ${on ? "bg-primary-100 text-primary-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`
      : `flex size-7 items-center justify-center rounded-sm transition hover:bg-slate-150 hover:text-slate-900 ${on ? "bg-slate-200 text-slate-900" : "text-slate-500"}`;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className={sideAction ? "flex items-end gap-3" : "contents"}>
      {/* The toolbar-on-top variant matches the standard .field look: white box, slate border, green focus ring and a light toolbar strip. */}
      <div className={`flex ${boxClass} ${page ? "flex-col-reverse" : `flex-col overflow-auto ${modern ? "rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 focus-within:!border-primary-700/50 focus-within:shadow-xs shadow-primary-700/12" : toolbarTop ? "flex-col-reverse rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 focus-within:!border-primary-700/60 focus-within:shadow-xs shadow-primary-700/18" : "resize-y gap-2 rounded-lg border border-slate-300 bg-white p-4 focus-within:border-slate-800"}`} ${sideAction ? "min-w-0 flex-1" : ""}`}>
        <div className={`relative flex-1 ${page ? "mt-3" : modern ? "mx-4 mb-3 mt-3.5" : toolbarTop ? "mx-3 my-2.5" : ""}`}>
          {empty && <span className={`pointer-events-none absolute left-0 top-0 text-slate-400 ${page ? "text-base leading-7" : modern ? "text-15 leading-6.5" : "text-base md:text-sm"} ${fontRegular}`}>{placeholder}</span>}
          <div
            ref={ref}
            role="textbox"
            aria-multiline="true"
            aria-label={placeholder}
            contentEditable
            suppressContentEditableWarning
            onInput={onInput}
            onKeyDown={(e) => {
              if (e.key === "Escape") onCancel?.();
              if (submitOnEnter && e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (!empty || allowEmpty) save();
              }
            }}
            className={`min-h-12 whitespace-pre-wrap break-words text-slate-900 outline-none ${page ? "text-base leading-7 text-slate-800 [&_li]:my-0.5 [&_ol]:my-2 [&_p]:mb-2 [&_ul]:my-2" : modern ? "text-15 leading-6.5 [&_li]:my-0.5 [&_ol]:my-2 [&_ul]:my-2" : "text-base leading-5.5 md:text-sm"} ${richText} ${fontRegular}`}
          />
        </div>
        {linkOpen && (
          <div className={`flex items-center gap-2 ${modern ? "mx-4 mb-3" : toolbarTop ? "mx-3 mb-2.5" : ""}`}>
            <input
              autoFocus
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLink();
                }
                if (e.key === "Escape") setLinkOpen(false);
              }}
              placeholder="Paste a link"
              aria-label="Link address"
              className={"field h-8 min-w-0 flex-1"}
            />
            <button type="button" onClick={addLink} className={`h-8 rounded-sm bg-slate-150 px-3 text-sm text-slate-900 hover:bg-slate-200 ${fontMedium}`}>
              Add
            </button>
          </div>
        )}
        {page && bubble && !linkOpen && createPortal(
          <div
            role="toolbar"
            aria-label="Format selected text"
            onMouseDown={(e) => e.preventDefault()}
            style={{ left: bubble.x, top: bubble.y }}
            className="fixed z-1000 flex -translate-x-1/2 translate-y-above items-center gap-0.5 rounded-xl bg-slate-900 p-1 text-white shadow-2xl"
          >
            {[
              { key: "bold", label: "Bold", on: active.includes("bold"), icon: TextBoldIcon, act: () => run("bold") },
              { key: "italic", label: "Italic", on: active.includes("italic"), icon: TextItalicIcon, act: () => run("italic") },
              { key: "h3", label: isHeading ? "Normal text" : "Heading", on: isHeading, icon: null, act: () => { run("formatBlock", isHeading ? "P" : "H3"); setIsHeading(!isHeading); } },
              { key: "ul", label: "Bullet list", on: active.includes("insertUnorderedList"), icon: LeftToRightListBulletIcon, act: () => run("insertUnorderedList") },
              { key: "link", label: "Add link", on: false, icon: editorExtraIcons.link, act: () => { rememberCursor(); setBubble(null); setLinkOpen(true); } },
              { key: "code", label: "Format as code", on: false, icon: editorExtraIcons.code, act: insertCode },
            ].map((b) => (
              <button key={b.key} type="button" aria-label={b.label} title={b.label} aria-pressed={b.on} onClick={b.act} className={`flex size-7 items-center justify-center rounded-md transition ${b.on ? "bg-white/20 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
                {b.icon ? <HugeiconsIcon icon={b.icon} size={16} strokeWidth={2} aria-hidden="true" /> : <span className={`text-13 ${fontSemi}`}>H</span>}
              </button>
            ))}
          </div>,
          document.body,
        )}
        {page && (
          // Page toolbar: full width, grouped by purpose (text style, lists, insert), with clear labels on hover.
          <div role="toolbar" aria-label="Formatting" onMouseDown={(e) => e.preventDefault()} className="sticky top-14.25 z-2 flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-25/95 p-1 backdrop-blur-sm">
            {[
              [
                { key: "h3", label: isHeading ? "Normal text" : "Heading", on: isHeading, icon: null, act: () => { run("formatBlock", isHeading ? "P" : "H3"); setIsHeading(!isHeading); } },
                { key: "bold", label: "Bold", on: active.includes("bold"), icon: TextBoldIcon, act: () => run("bold") },
                { key: "italic", label: "Italic", on: active.includes("italic"), icon: TextItalicIcon, act: () => run("italic") },
                ...(hideUnderline ? [] : [{ key: "underline", label: "Underline", on: active.includes("underline"), icon: TextUnderlineIcon, act: () => run("underline") }]),
              ],
              [
                { key: "ul", label: "Bullet list", on: active.includes("insertUnorderedList"), icon: LeftToRightListBulletIcon, act: () => run("insertUnorderedList") },
                { key: "ol", label: "Numbered list", on: active.includes("insertOrderedList"), icon: LeftToRightListNumberIcon, act: () => run("insertOrderedList") },
              ],
              [
                { key: "image", label: "Add image", on: false, icon: editorExtraIcons.image, act: () => { rememberCursor(); fileRef.current?.click(); } },
                { key: "link", label: "Add link", on: linkOpen, icon: editorExtraIcons.link, act: () => { rememberCursor(); setLinkOpen((o) => !o); } },
                { key: "code", label: "Format as code", on: false, icon: editorExtraIcons.code, act: insertCode },
              ],
            ].map((group, i) => (
              <Fragment key={i}>
                {i > 0 && <span aria-hidden="true" className="mx-1 h-5 w-px bg-slate-200" />}
                <div className="flex items-center gap-0.5">
                  {group.map((b) => (
                    <button key={b.key} type="button" aria-label={b.label} title={b.label} aria-pressed={b.on} onClick={b.act} className={`flex h-9 min-w-10 items-center justify-center rounded-lg px-2 transition ${b.on ? "bg-white text-primary-700 shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"}`}>
                      {b.icon ? <HugeiconsIcon icon={b.icon} size={19} strokeWidth={1.8} aria-hidden="true" /> : <span className={`text-15 leading-none ${fontSemi}`}>H</span>}
                    </button>
                  ))}
                </div>
              </Fragment>
            ))}
            <span className={`ml-auto hidden pr-2 text-xs text-slate-400 sm:inline ${fontRegular}`}>Select text for quick styles</span>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={(e) => pickImage(e.target.files?.[0])} />
          </div>
        )}
        {!page && (
        <div className={`flex flex-wrap items-center gap-0.5 ${page ? "" : modern ? "sticky bottom-0 z-1 border-t border-slate-100 bg-white/95 px-2 py-1.5 backdrop-blur-sm" : toolbarTop ? "sticky top-0 z-1 border-b border-slate-200 bg-slate-50 px-1.5 py-1" : ""}`}>
          {toolbarEnd && <span className="order-last ml-auto flex">{toolbarEnd}</span>}
          {editorTools.filter((tool) => !(hideUnderline && tool.command === "underline")).map((tool) => (
            <Fragment key={tool.command}>
            {/* Modern toolbar: a thin divider separates text styles from lists. */}
            {modern && tool.command === "insertUnorderedList" && <span aria-hidden="true" className="mx-1 h-5 w-px bg-slate-200" />}
            <button type="button" aria-label={tool.label} title={tool.label} aria-pressed={active.includes(tool.command)} onMouseDown={(e) => e.preventDefault()} onClick={() => run(tool.command)} className={toolCls(active.includes(tool.command))}>
              <HugeiconsIcon icon={tool.icon} size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>
            </Fragment>
          ))}
          {(extras || imageOnly) && !linkOnly && (
            <>
              <button
                type="button"
                aria-label="Add image"
                title="Add image"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  rememberCursor();
                  fileRef.current?.click();
                }}
                className={toolCls(false)}
              >
                <HugeiconsIcon icon={editorExtraIcons.image} size={18} strokeWidth={1.8} aria-hidden="true" />
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={(e) => pickImage(e.target.files?.[0])} />
            </>
          )}
          {extras && (
            <>
              <button
                type="button"
                aria-label="Add link"
                title="Add link"
                aria-expanded={linkOpen}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  rememberCursor();
                  setLinkOpen((o) => !o);
                }}
                className={toolCls(linkOpen)}
              >
                <HugeiconsIcon icon={editorExtraIcons.link} size={18} strokeWidth={1.8} aria-hidden="true" />
              </button>
              {!linkOnly && (
                <button type="button" aria-label="Format as code" title="Format as code" onMouseDown={(e) => e.preventDefault()} onClick={insertCode} className={toolCls(false)}>
                  <HugeiconsIcon icon={editorExtraIcons.code} size={18} strokeWidth={1.8} aria-hidden="true" />
                </button>
              )}
            </>
          )}
        </div>
        )}
      </div>
      {!hideActions && (
        <div className="flex items-center justify-end gap-3">
          {onCancel && (
            <button type="button" onClick={onCancel} className={buttonClass("ghost", saveSize)}>
              Cancel
            </button>
          )}
          <button type="button" onClick={save} disabled={empty && !allowEmpty} className={`${buttonClass(saveVariant, saveSize)} ${saveClass}`}>
            {saveLabel}
          </button>
        </div>
      )}
      </div>
      {error && <p className={`text-sm text-red-600 ${fontRegular}`}>{error}</p>}
    </div>
  );
}

const selectCls = "field w-auto";

export function NotesPanel({
  notes,
  setNotes,
  current,
  time,
  editId,
  setEditId,
  onJump,
  compact = false,
}: {
  compact?: boolean;
  notes: Note[];
  setNotes: (update: (list: Note[]) => Note[]) => void;
  current: LessonRef;
  time: number;
  editId: number | null;
  setEditId: (id: number | null) => void;
  onJump: (note: Note) => void;
}) {
  const pad = compact ? "px-4" : "px-4 md:px-8";
  // The time is pinned when the note is opened, so it stays put while the video plays on.
  const [composing, setComposing] = useState<{ at?: number } | null>(null);
  const [scope, setScope] = useState<"all" | "current">(compact ? "current" : "all");
  const [sort, setSort] = useState<"recent" | "oldest">("recent");
  const [show, setShow] = useState<"all" | "notes" | "highlights">("all");

  const add = (noteText: string, html: string) => {
    setNotes((list) => [
      { id: Date.now(), created: Date.now(), lessonKey: current.key, lessonTitle: current.title, sectionTitle: current.sectionTitle, kind: current.kind, text: noteText, html, at: composing?.at },
      ...list,
    ]);
    setComposing(null);
  };

  const saveEdit = (id: number, noteText: string, html: string) => {
    setNotes((list) => list.map((n) => (n.id === id ? { ...n, text: noteText, html } : n)));
    setEditId(null);
  };

  const pin = current.kind === "video" ? (composing?.at ?? Math.floor(time)) : undefined;
  const pinLabel = pin !== undefined ? clock(pin) : current.kind === "quiz" ? "Quiz" : "Article";

  const shown = notes
    .filter((n) => scope === "all" || n.lessonKey === current.key)
    .filter((n) => show === "all" || (show === "highlights" ? !!n.quote : !!n.text))
    .sort((a, b) => (sort === "recent" ? b.created - a.created : a.created - b.created));

  const hasHighlights = notes.some((n) => n.quote);
  const lessonCount = notes.filter((n) => n.lessonKey === current.key).length;

  const compactHead = (
    <div className="flex flex-col gap-4 border-b border-slate-200 px-4 pb-4 pt-4">
      {composing ? (
        <div className="flex flex-col gap-2">
          <span className={`self-start rounded-full bg-primary-50 px-2.5 py-1 text-xs tabular-nums text-primary-700 ${fontSemi}`}>
            {pin !== undefined ? `Note at ${pinLabel}` : pinLabel}
          </span>
          <NoteEditor key={current.key} onSave={add} onCancel={() => setComposing(null)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setComposing({ at: pin })}
          className="group/add flex h-12 w-full items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-25 px-3 text-left transition hover:border-primary-500 hover:bg-primary-50"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary-700 shadow-sm ring-1 ring-slate-200 transition group-hover/add:ring-primary-200">
            <HugeiconsIcon icon={NoteAddIcon} size={17} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className={`min-w-0 flex-1 truncate text-sm text-slate-600 transition group-hover/add:text-slate-900 ${fontMedium}`}>
            {pin !== undefined ? <>Add a note at <span className={`tabular-nums text-slate-900 ${fontSemi}`}>{pinLabel}</span></> : "Add a note"}
          </span>
          <kbd className={`hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-11 text-slate-500 sm:block ${fontMedium}`}>N</kbd>
        </button>
      )}

      <div className="flex items-center justify-between gap-3">
        <h3 className={`m-0 flex items-center gap-2 text-base text-slate-900 ${fontSemi}`}>
          Your notes
          <span className={`rounded-full bg-slate-100 px-2 py-0.5 text-xs tabular-nums text-slate-600 ${fontSemi}`}>{shown.length}</span>
        </h3>
        <button
          type="button"
          onClick={() => setSort((v) => (v === "recent" ? "oldest" : "recent"))}
          aria-label={`Sorted by ${sort === "recent" ? "newest" : "oldest"} first. Change sort order`}
          className={`flex h-8 items-center gap-1.5 rounded-lg px-2 text-13 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 ${fontMedium}`}
        >
          <HugeiconsIcon icon={ArrowUpDownIcon} size={15} strokeWidth={1.8} aria-hidden="true" />
          {sort === "recent" ? "Newest first" : "Oldest first"}
        </button>
      </div>

      <div role="group" aria-label="Which notes to show" className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
        {(
          [
            ["current", "This lesson", lessonCount],
            ["all", "All lessons", notes.length],
          ] as const
        ).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            aria-pressed={scope === value}
            onClick={() => setScope(value)}
            className={`flex h-8 items-center justify-center gap-1.5 rounded-md text-13 transition ${
              scope === value ? `bg-white text-slate-900 shadow-sm ${fontSemi}` : `text-slate-500 hover:text-slate-900 ${fontMedium}`
            }`}
          >
            {label}
            <span className="tabular-nums text-slate-400">{count}</span>
          </button>
        ))}
      </div>

      {hasHighlights && (
        <div role="group" aria-label="Note type" className="flex flex-wrap gap-1.5">
          {(
            [
              ["all", "Everything"],
              ["notes", "Notes"],
              ["highlights", "Highlights"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={show === value}
              onClick={() => setShow(value)}
              className={`h-7 rounded-full border px-3 text-xs transition ${
                show === value ? `border-primary-700 bg-primary-50 text-primary-700 ${fontSemi}` : `border-slate-200 text-slate-600 hover:border-slate-300 ${fontMedium}`
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={compact ? "" : "-mx-4 -my-8 md:-mx-6"}>
      {compact ? compactHead : (<>
      <div className={`flex items-start gap-4 py-6 ${pad}`}>
        <span className={`mt-3 shrink-0 rounded-full bg-slate-700 px-2.5 py-1 text-xs text-white tabular-nums ${fontMedium}`}>{pinLabel}</span>
        {composing ? (
          <NoteEditor key={current.key} onSave={add} onCancel={() => setComposing(null)} />
        ) : (
          <button type="button" onClick={() => setComposing({ at: pin })} className="flex h-13 min-w-0 flex-1 items-center justify-between gap-3 rounded-md border border-slate-300 bg-white px-4 text-left transition hover:border-slate-800">
            <span className={`truncate text-sm text-slate-500 ${fontRegular}`}>{pin !== undefined ? `Add your note at ${clock(pin)}` : "Add your note"}</span>
            <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-slate-900" fill="currentColor" aria-hidden="true">
              <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75zM20.7 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75z" />
            </svg>
          </button>
        )}
      </div>

      <div className={`flex flex-col gap-4 border-b border-slate-200 pb-4 ${pad} ${compact ? "" : "lg:flex-row lg:items-center lg:justify-between"}`}>
        <h3 className={`m-0 text-slate-900 ${compact ? `text-lg ${fontSemi}` : `text-22 ${fontRegular}`}`}>Your Notes</h3>
        <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-700 ${fontRegular}`}>
          <label className="flex items-center gap-2">
            Filter by
            <select value={scope} onChange={(e) => setScope(e.target.value as typeof scope)} className={selectCls}>
              <option value="all">All lectures</option>
              <option value="current">Current lecture</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={selectCls}>
              <option value="recent">Most recent</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            Show
            <select value={show} onChange={(e) => setShow(e.target.value as typeof show)} className={selectCls}>
              <option value="all">Note &amp; Highlights</option>
              <option value="notes">Notes only</option>
              <option value="highlights">Highlights only</option>
            </select>
          </label>
        </div>
      </div>
      </>)}

      {shown.length === 0 ? (
        <p className={`py-10 text-center text-sm text-slate-500 ${pad} ${fontRegular}`}>
          {compact
            ? scope === "current" && notes.length
              ? "No notes in this lesson yet. Press N while watching to save one at that second."
              : notes.length
                ? "No notes match this filter."
                : "No notes yet. Press N while watching, or use Save note in the transcript."
            : notes.length
              ? "No notes match these filters."
              : "No notes yet. Add a note above, or select text in a reading lesson to highlight it."}
        </p>
      ) : (
        <ul className={`flex flex-col ${pad}`}>
          {shown.map((n) => {
            const editing = editId === n.id;
            return (
              <li key={n.id} className="group/note border-b border-slate-200 py-6 last:border-b-0">
                <div className="flex items-center gap-3 border-b border-slate-150 pb-4">
                  <KindBadge kind={n.kind} />
                  <p className={`min-w-0 flex-1 truncate text-sm text-slate-800 ${fontRegular}`}>
                    {n.sectionTitle} <span className="mx-1 text-slate-300">|</span> {n.lessonTitle}
                  </p>
                  {/* On a mouse or trackpad the actions appear on hover or keyboard focus. On touch screens they stay visible. */}
                  <span className={`flex shrink-0 items-center gap-1 transition-opacity ${editing ? "" : "pointer-fine:opacity-0 pointer-fine:group-hover/note:opacity-100 pointer-fine:group-focus-within/note:opacity-100"}`}>
                  <button type="button" onClick={() => setEditId(editing ? null : n.id)} aria-label="Edit note" className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M11 4H5a2 2 0 00-2 2v13a2 2 0 002 2h13a2 2 0 002-2v-6M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4z" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => setNotes((list) => list.filter((x) => x.id !== n.id))} aria-label="Delete note" className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600">
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4h6v3" />
                    </svg>
                  </button>
                  </span>
                </div>
                <div className="mt-4 flex gap-3">
                  <span className={`w-0.75 shrink-0 rounded-full ${!n.quote ? "bg-cyan-400" : n.text ? "bg-teal-500" : "bg-amber-300"}`} />
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    {n.quote && <p className={`text-sm leading-5.5 text-slate-800 ${fontRegular}`}>{n.quote}</p>}
                    {n.at !== undefined && (
                      <button type="button" onClick={() => onJump(n)} className={`self-start rounded-sm bg-slate-150 px-2 py-1 text-xs text-slate-500 hover:bg-slate-200 ${fontRegular}`}>
                        Play video from <span className={`text-slate-900 ${fontSemi}`}>{clock(n.at)}</span>
                      </button>
                    )}
                    {editing ? (
                      <NoteEditor initial={n} allowEmpty={!!n.quote} onSave={(noteText, html) => saveEdit(n.id, noteText, html)} onCancel={() => setEditId(null)} />
                    ) : (
                      n.text && <NoteBody note={n} />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
