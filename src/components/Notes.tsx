import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { fontMedium, fontRegular, fontSemi } from "../fonts";

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
  highlight: "cursor-pointer bg-[#fdf1a6] hover:bg-[#fae98a]",
  note: "cursor-pointer bg-[#c6f0e4] hover:bg-[#a9e8d6]",
  pending: "bg-[#dbeafe]",
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
          className={`rounded-[2px] text-inherit transition-colors ${markClass[r.kind]}`}
        >
          {text.slice(r.start, r.end)}
        </mark>,
      );
      pos = r.end;
    });
  if (pos < text.length) parts.push(text.slice(pos));
  return <p data-para={index}>{parts}</p>;
}

const allowedTags = new Set(["B", "STRONG", "I", "EM", "U", "UL", "OL", "LI", "P", "DIV", "BR", "CODE", "A", "IMG"]);

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
        if (/^data:image\/(png|jpeg|gif|webp);base64,/.test(src)) el.setAttribute("src", src);
        else el.remove();
      }
    });
  };
  clean(doc.body);
  return doc.body.innerHTML;
}

const richText = "[&_a]:text-[#6016fc] [&_a]:underline [&_code]:rounded-[4px] [&_code]:bg-[#f1f5f9] [&_code]:px-1 [&_code]:font-mono [&_img]:max-w-full [&_img]:rounded-[6px] [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5";

export function NoteBody({ note, className = "", tone = "text-[#0f172a]" }: { note: Pick<Note, "text" | "html">; className?: string; tone?: string }) {
  const cls = `text-[14px] leading-[22px] ${tone} ${fontRegular} ${className}`;
  if (note.html) return <div className={`${cls} ${richText}`} dangerouslySetInnerHTML={{ __html: sanitizeNote(note.html) }} />;
  return <p className={`whitespace-pre-wrap ${cls}`}>{note.text}</p>;
}

function Svg({ className = "size-[18px]", children }: { className?: string; children: ReactNode }) {
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
      className={`group/tip relative flex size-8 items-center justify-center rounded-[4px] hover:bg-[#f1f5f9] ${danger ? "text-[#dc2626]" : "text-[#0f172a]"}`}
    >
      {children}
      <span role="tooltip" className={`pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-[2px] bg-black px-3 py-1.5 text-[14px] leading-[18px] text-white group-hover/tip:block group-focus-visible/tip:block ${fontRegular}`}>
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

const floatingCard = "rounded-[8px] bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.2)]";

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

  const iconBtn = "flex size-8 items-center justify-center rounded-[6px] text-[#0f172a] transition hover:bg-white";

  return (
    <div className="bg-[#1e293b]">
      <div className="flex flex-wrap items-center gap-3 bg-[#253247] px-4 py-3 md:px-4">
        <p className={`min-w-0 flex-1 truncate text-[16px] text-white md:text-[18px] ${fontRegular}`}>{lesson.title}</p>
        <span className={`flex items-center gap-1.5 text-[14px] text-white/90 tabular-nums ${fontRegular}`}>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          {done ? "Completed" : `${clock(Math.max(0, left))} min left`}
        </span>
        <button type="button" onClick={onBack} disabled={!onBack} className={`h-[34px] rounded-[6px] bg-white px-3 text-[14px] text-[#0f172a] transition hover:bg-[#f1f5f9] disabled:opacity-40 ${fontMedium}`}>
          Back
        </button>
        <button type="button" onClick={onNext} disabled={!onNext} className={`h-[34px] rounded-[6px] bg-[#ffb20d] px-3 text-[14px] text-[#1e293b] transition hover:bg-[#faa104] disabled:opacity-40 ${fontMedium}`}>
          Next
        </button>
      </div>

      <div className="p-3 md:p-4">
        <div ref={wrapRef} className="relative overflow-hidden rounded-[6px] bg-[#fffdf6]">
          <div className="flex items-center justify-center gap-2 bg-[#e2e8f0] px-3 py-2">
            <button type="button" onClick={() => setZoom((z) => Math.max(80, z - 10))} aria-label="Zoom out" className={iconBtn}>
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14" />
              </svg>
            </button>
            <span className={`w-[48px] rounded-[4px] bg-white py-1 text-center text-[11px] text-[#0f172a] ${fontRegular}`}>{zoom}%</span>
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

          <div ref={scrollRef} onScroll={onScroll} onMouseUp={onMouseUp} className={`overflow-y-auto px-5 py-6 transition-[max-height] duration-300 md:px-8 md:py-8 ${expanded ? "max-h-[calc(100dvh-72px-66px-80px)] min-h-[440px]" : "max-h-[440px]"}`}>
            <div className={`flex flex-col gap-6 text-[#1e293b] ${fontRegular}`} style={{ fontSize: `${(14 * zoom) / 100}px`, lineHeight: 1.75 }}>
              {article.map((block, i) => (
                <div key={i} className="flex flex-col gap-1">
                  {block.heading && <h3 className={`m-0 text-[1.15em] text-[#0f172a] ${fontMedium}`}>{block.heading}</h3>}
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
                <button type="button" onClick={onComplete} className={`self-start rounded-[6px] bg-[#0f172a] px-4 py-2 text-[14px] text-white hover:bg-[#1e293b] ${fontMedium}`}>
                  Mark as complete
                </button>
              )}
            </div>
          </div>

          {pop?.mode === "tools" && (
            <Floating anchor={pop.anchor} width={78} height={84} boxWidth={boxWidth} margin={50}>
              <div className="flex gap-1 rounded-[4px] border border-[#e2e8f0] bg-white p-1 shadow-[0_8px_20px_rgba(15,23,42,0.15)]">
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
                  className={`w-full resize-y rounded-[6px] border border-[#cbd5e1] px-3 py-2 text-[16px] text-[#0f172a] outline-none placeholder:text-[#64748b] focus:border-[#1e293b] md:text-[14px] ${fontRegular}`}
                />
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setPop(null)} className={`h-[36px] rounded-[6px] border border-[#475569] text-[14px] text-[#475569] transition hover:bg-[#f1f5f9] ${fontMedium}`}>
                    Cancel
                  </button>
                  <button type="button" onClick={finishWriting} disabled={!draft.trim()} className={`h-[36px] rounded-[6px] bg-[#6016fc] text-[14px] text-white transition hover:bg-[#4f0fd6] disabled:opacity-50 ${fontMedium}`}>
                    Done
                  </button>
                </div>
              </div>
            </Floating>
          )}

          {pop?.mode === "view" && openNote && (
            <Floating anchor={pop.anchor} width={232} height={170} boxWidth={boxWidth} arrow>
              <div className={`${floatingCard} flex flex-col gap-2`}>
                <div className="flex max-h-[96px] gap-2 overflow-y-auto rounded-[2px] border border-[#e2e8f0]">
                  <span className="w-[3px] shrink-0 bg-[#a78bfa]" />
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
              className={`fade-up absolute right-5 flex size-10 items-center justify-center rounded-full bg-white text-[#0f172a] shadow-[0_6px_16px_rgba(15,23,42,0.18)] transition hover:scale-105 ${done ? "bottom-[72px]" : "bottom-5"}`}
            >
              <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90" aria-hidden="true">
                <circle cx="20" cy="20" r="18" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
                <circle cx="20" cy="20" r="18" fill="none" stroke="#ffb20d" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${read * 113.1} 113.1`} />
              </svg>
              <svg viewBox="0 0 24 24" className="relative size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 19V5M6 11l6-6 6 6" />
              </svg>
            </button>
          )}

          {done && <span className={`fade-up absolute bottom-4 right-4 rounded-[6px] bg-[#0d7a5c] px-3 py-2 text-[14px] text-white shadow-lg ${fontMedium}`}>Completed!</span>}
        </div>
      </div>
    </div>
  );
}

function KindBadge({ kind }: { kind: Note["kind"] }) {
  return (
    <span className={`flex shrink-0 items-center gap-1 rounded-[3px] bg-[#1e293b] px-1.5 py-1 text-[12px] leading-none text-white ${fontRegular}`}>
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

const editorTools: { command: string; label: string; icon: ReactNode }[] = [
  { command: "bold", label: "Bold", icon: <path d="M7 5h6a3.5 3.5 0 010 7H7zM7 12h7a3.5 3.5 0 010 7H7z" /> },
  { command: "italic", label: "Italic", icon: <path d="M10 5h7M7 19h7M14 5l-4 14" /> },
  { command: "underline", label: "Underline", icon: <path d="M7 4v7a5 5 0 0010 0V4M5 20h14" /> },
  { command: "insertUnorderedList", label: "Bulleted list", icon: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" /> },
  { command: "insertOrderedList", label: "Numbered list", icon: <path d="M10 6h10M10 12h10M10 18h10M4 5l1.5-1v5M3.5 14.5a1.2 1.2 0 012.2.7c0 1-2.2 2-2.2 3.3h2.5" /> },
];

const editorExtraIcons = {
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M21 16l-5-5-9 9" />
    </>
  ),
  link: <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" />,
  code: <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />,
};

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function NoteEditor({
  initial,
  allowEmpty,
  placeholder = "Insert note here",
  saveLabel = "Save",
  saveClass = "bg-[#ffb20d] text-[#1e293b] hover:bg-[#faa104]",
  extras,
  imageOnly,
  sideAction,
  hideActions,
  clearOnSave,
  autoFocus = true,
  onChange,
  onSave,
  onCancel,
}: {
  initial?: Pick<Note, "text" | "html">;
  allowEmpty?: boolean;
  placeholder?: string;
  saveLabel?: string;
  saveClass?: string;
  // Adds the image, link and code buttons.
  extras?: boolean;
  // Adds only the image button.
  imageOnly?: boolean;
  // Puts the save button beside the box instead of below it.
  sideAction?: boolean;
  hideActions?: boolean;
  clearOnSave?: boolean;
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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (initial?.html) el.innerHTML = sanitizeNote(initial.html);
    else el.textContent = initial?.text ?? "";
    if (autoFocus) el.focus();
    const refresh = () => setActive(document.activeElement === el ? editorTools.map((t) => t.command).filter((c) => document.queryCommandState(c)) : []);
    document.addEventListener("selectionchange", refresh);
    return () => document.removeEventListener("selectionchange", refresh);
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
    if (file.size > 1024 * 1024) return setError("Images must be under 1 MB.");
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      restoreCursor();
      run("insertImage", String(reader.result));
    };
    reader.readAsDataURL(file);
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

  const toolCls = (on: boolean) => `flex size-7 items-center justify-center rounded-[4px] transition hover:bg-[#f1f5f9] hover:text-[#0f172a] ${on ? "bg-[#e2e8f0] text-[#0f172a]" : "text-[#64748b]"}`;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className={sideAction ? "flex items-start gap-4 sm:gap-6" : "contents"}>
      <div className={`flex min-h-[126px] resize-y flex-col gap-2 overflow-auto rounded-[8px] border border-[#cbd5e1] bg-white p-4 focus-within:border-[#1e293b] ${sideAction ? "min-w-0 flex-1" : ""}`}>
        <div className="relative flex-1">
          {empty && <span className={`pointer-events-none absolute left-0 top-0 text-[16px] text-[#94a3b8] md:text-[14px] ${fontRegular}`}>{placeholder}</span>}
          <div
            ref={ref}
            role="textbox"
            aria-multiline="true"
            aria-label={placeholder}
            contentEditable
            suppressContentEditableWarning
            onInput={onInput}
            onKeyDown={(e) => e.key === "Escape" && onCancel?.()}
            className={`min-h-[48px] whitespace-pre-wrap break-words text-[16px] leading-[22px] text-[#0f172a] outline-none md:text-[14px] ${richText} ${fontRegular}`}
          />
        </div>
        {linkOpen && (
          <div className="flex items-center gap-2">
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
              className={`h-[32px] min-w-0 flex-1 rounded-[4px] border border-[#cbd5e1] px-2 text-[16px] text-[#0f172a] outline-none focus:border-[#1e293b] md:text-[14px] ${fontRegular}`}
            />
            <button type="button" onClick={addLink} className={`h-[32px] rounded-[4px] bg-[#f1f5f9] px-3 text-[14px] text-[#0f172a] hover:bg-[#e2e8f0] ${fontMedium}`}>
              Add
            </button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1">
          {editorTools.map((tool) => (
            <button key={tool.command} type="button" aria-label={tool.label} title={tool.label} aria-pressed={active.includes(tool.command)} onMouseDown={(e) => e.preventDefault()} onClick={() => run(tool.command)} className={toolCls(active.includes(tool.command))}>
              <Svg>{tool.icon}</Svg>
            </button>
          ))}
          {(extras || imageOnly) && (
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
                <Svg>{editorExtraIcons.image}</Svg>
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
                <Svg>{editorExtraIcons.link}</Svg>
              </button>
              <button type="button" aria-label="Format as code" title="Format as code" onMouseDown={(e) => e.preventDefault()} onClick={insertCode} className={toolCls(false)}>
                <Svg>{editorExtraIcons.code}</Svg>
              </button>
            </>
          )}
        </div>
      </div>
      {!hideActions && (
        <div className="flex items-center justify-end gap-3">
          {onCancel && (
            <button type="button" onClick={onCancel} className={`h-[44px] rounded-[8px] px-4 text-[14px] text-[#0f172a] transition hover:bg-[#f1f5f9] ${fontMedium}`}>
              Cancel
            </button>
          )}
          <button type="button" onClick={save} disabled={empty && !allowEmpty} className={`h-[44px] rounded-[8px] px-5 text-[14px] transition disabled:opacity-50 ${saveClass} ${fontMedium}`}>
            {saveLabel}
          </button>
        </div>
      )}
      </div>
      {error && <p className={`text-[14px] text-[#dc2626] ${fontRegular}`}>{error}</p>}
    </div>
  );
}

const selectCls = `h-[40px] rounded-[6px] border border-[#cbd5e1] bg-white px-3 pr-8 text-[14px] text-[#334155] outline-none focus:border-[#1e293b] ${fontRegular}`;

export function NotesPanel({
  notes,
  setNotes,
  current,
  time,
  editId,
  setEditId,
  onJump,
}: {
  notes: Note[];
  setNotes: (update: (list: Note[]) => Note[]) => void;
  current: LessonRef;
  time: number;
  editId: number | null;
  setEditId: (id: number | null) => void;
  onJump: (note: Note) => void;
}) {
  // The time is pinned when the note is opened, so it stays put while the video plays on.
  const [composing, setComposing] = useState<{ at?: number } | null>(null);
  const [scope, setScope] = useState<"all" | "current">("all");
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

  return (
    <div className="-mx-4 -my-8 md:-mx-6">
      <div className="flex items-start gap-4 px-4 py-6 md:px-8">
        <span className={`mt-3 shrink-0 rounded-full bg-[#334155] px-2.5 py-1 text-[12px] text-white tabular-nums ${fontMedium}`}>{pinLabel}</span>
        {composing ? (
          <NoteEditor key={current.key} onSave={add} onCancel={() => setComposing(null)} />
        ) : (
          <button type="button" onClick={() => setComposing({ at: pin })} className="flex h-[52px] min-w-0 flex-1 items-center justify-between gap-3 rounded-[6px] border border-[#cbd5e1] bg-white px-4 text-left transition hover:border-[#1e293b]">
            <span className={`truncate text-[14px] text-[#64748b] ${fontRegular}`}>{pin !== undefined ? `Add your note at ${clock(pin)}` : "Add your note"}</span>
            <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-[#0f172a]" fill="currentColor" aria-hidden="true">
              <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75zM20.7 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75z" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 border-b border-[#e2e8f0] px-4 pb-4 md:px-8 lg:flex-row lg:items-center lg:justify-between">
        <h3 className={`m-0 text-[22px] text-[#0f172a] ${fontRegular}`}>Your Notes</h3>
        <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px] text-[#334155] ${fontRegular}`}>
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

      {shown.length === 0 ? (
        <p className={`px-4 py-10 text-center text-[14px] text-[#64748b] md:px-8 ${fontRegular}`}>
          {notes.length ? "No notes match these filters." : "No notes yet. Add a note above, or select text in a reading lesson to highlight it."}
        </p>
      ) : (
        <ul className="flex flex-col px-4 md:px-8">
          {shown.map((n) => {
            const editing = editId === n.id;
            return (
              <li key={n.id} className="border-b border-[#e2e8f0] py-6 last:border-b-0">
                <div className="flex items-center gap-3 border-b border-[#f1f5f9] pb-4">
                  <KindBadge kind={n.kind} />
                  <p className={`min-w-0 flex-1 truncate text-[14px] text-[#1e293b] ${fontRegular}`}>
                    {n.sectionTitle} <span className="mx-1 text-[#cbd5e1]">|</span> {n.lessonTitle}
                  </p>
                  <button type="button" onClick={() => setEditId(editing ? null : n.id)} aria-label="Edit note" className="flex size-7 items-center justify-center rounded-[4px] bg-[#f1f5f9] text-[#475569] hover:text-[#0f172a]">
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M11 4H5a2 2 0 00-2 2v13a2 2 0 002 2h13a2 2 0 002-2v-6M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4z" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => setNotes((list) => list.filter((x) => x.id !== n.id))} aria-label="Delete note" className="flex size-7 items-center justify-center rounded-[4px] bg-[#f1f5f9] text-[#94a3b8] hover:bg-[#fee2e2] hover:text-[#dc2626]">
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4h6v3" />
                    </svg>
                  </button>
                </div>
                <div className="mt-4 flex gap-3">
                  <span className={`w-[3px] shrink-0 rounded-full ${!n.quote ? "bg-[#22d3ee]" : n.text ? "bg-[#12b9a5]" : "bg-[#f5d64e]"}`} />
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    {n.quote && <p className={`text-[14px] leading-[22px] text-[#1e293b] ${fontRegular}`}>{n.quote}</p>}
                    {n.at !== undefined && (
                      <button type="button" onClick={() => onJump(n)} className={`self-start rounded-[4px] bg-[#f1f5f9] px-2 py-1 text-[12px] text-[#64748b] hover:bg-[#e2e8f0] ${fontRegular}`}>
                        Play video from <span className={`text-[#0f172a] ${fontSemi}`}>{clock(n.at)}</span>
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
