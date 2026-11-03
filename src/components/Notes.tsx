import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { fontMedium, fontRegular, fontSemi } from "../fonts";

export type HighlightColor = "green" | "yellow";

export type Note = {
  id: number;
  lessonKey: string;
  lessonTitle: string;
  sectionTitle: string;
  kind: "video" | "article" | "quiz" | "assignment";
  text: string;
  created: number;
  at?: number;
  quote?: string;
  color?: HighlightColor;
  para?: number;
  start?: number;
  end?: number;
};

export type LessonRef = { key: string; title: string; sectionTitle: string; kind: Note["kind"]; minutes: number };

const markColor: Record<HighlightColor, string> = { green: "bg-[#c6f0dd]", yellow: "bg-[#fdf1a6]" };
const barColor: Record<HighlightColor, string> = { green: "bg-[#12b9a5]", yellow: "bg-[#f5d64e]" };

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

type Range = { start: number; end: number; color: HighlightColor; id: number };

function Paragraph({ text, ranges, index }: { text: string; ranges: Range[]; index: number }) {
  const parts: ReactNode[] = [];
  let pos = 0;
  [...ranges]
    .sort((a, b) => a.start - b.start)
    .forEach((r) => {
      if (r.start > pos) parts.push(text.slice(pos, r.start));
      parts.push(
        <mark key={r.id} className={`rounded-[2px] text-inherit ${markColor[r.color]}`}>
          {text.slice(r.start, r.end)}
        </mark>,
      );
      pos = r.end;
    });
  if (pos < text.length) parts.push(text.slice(pos));
  return <p data-para={index}>{parts}</p>;
}

export function ArticleReader({
  lesson,
  notes,
  done,
  onAddNote,
  onComplete,
  onBack,
  onNext,
  onOpenNotes,
  notify,
  expanded,
  onToggleExpand,
}: {
  lesson: LessonRef;
  notes: Note[];
  done: boolean;
  onAddNote: (note: Omit<Note, "id" | "created">, edit?: boolean) => void;
  onComplete: () => void;
  onBack?: () => void;
  onNext?: () => void;
  onOpenNotes: () => void;
  notify: (message: string) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const [zoom, setZoom] = useState(100);
  const [left, setLeft] = useState(lesson.minutes * 60);
  const [read, setRead] = useState(0);
  const [toolbar, setToolbar] = useState<{ x: number; y: number; para: number; start: number; end: number; quote: string } | null>(null);
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
    setToolbar(null);
    if (!done && el.scrollTop + el.clientHeight >= el.scrollHeight - 8) onComplete();
  };

  const onMouseUp = () => {
    const sel = window.getSelection();
    const wrap = wrapRef.current;
    if (!sel || sel.isCollapsed || !wrap) return setToolbar(null);
    const range = sel.getRangeAt(0);
    const startP = (range.startContainer.parentElement as HTMLElement | null)?.closest<HTMLElement>("[data-para]");
    const endP = (range.endContainer.parentElement as HTMLElement | null)?.closest<HTMLElement>("[data-para]");
    if (!startP || startP !== endP) {
      setToolbar(null);
      if (startP !== endP) notify("Select text within one paragraph to highlight it");
      return;
    }
    const pre = document.createRange();
    pre.selectNodeContents(startP);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length;
    const quote = range.toString();
    if (!quote.trim()) return setToolbar(null);
    const rect = range.getBoundingClientRect();
    const box = wrap.getBoundingClientRect();
    setToolbar({ x: rect.left - box.left + rect.width / 2, y: rect.top - box.top, para: Number(startP.dataset.para), start, end: start + quote.length, quote: quote.trim() });
  };

  const save = (color: HighlightColor, edit: boolean) => {
    if (!toolbar) return;
    const clash = highlights.some((h) => h.para === toolbar.para && toolbar.start < (h.end ?? 0) && toolbar.end > (h.start ?? 0));
    if (clash) {
      notify("Part of this text is already highlighted");
    } else {
      onAddNote({ lessonKey: lesson.key, lessonTitle: lesson.title, sectionTitle: lesson.sectionTitle, kind: "article", text: "", quote: toolbar.quote, color, para: toolbar.para, start: toolbar.start, end: toolbar.end }, edit);
      if (!edit) notify("Highlight saved to your notes");
    }
    window.getSelection()?.removeAllRanges();
    setToolbar(null);
  };

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
            <div className={`flex flex-col gap-6 text-[#1e293b] ${fontRegular}`} style={{ fontSize: `${(16 * zoom) / 100}px`, lineHeight: 1.75 }}>
              {article.map((block, i) => (
                <div key={i} className="flex flex-col gap-1">
                  {block.heading && <h3 className={`m-0 text-[1.15em] text-[#0f172a] ${fontMedium}`}>{block.heading}</h3>}
                  <Paragraph
                    index={i}
                    text={block.text}
                    ranges={highlights.filter((h) => h.para === i).map((h) => ({ start: h.start!, end: h.end!, color: h.color ?? "green", id: h.id }))}
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

          {toolbar && (
            <div className="pop-in absolute z-10 flex -translate-x-1/2 -translate-y-full gap-1 rounded-[6px] border border-[#e2e8f0] bg-white p-1 shadow-[0_8px_20px_rgba(15,23,42,0.15)]" style={{ left: toolbar.x, top: toolbar.y - 6 }}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => save("green", false)} title="Highlight" aria-label="Highlight selection" className="flex size-8 items-center justify-center rounded-[4px] text-[#0f172a] hover:bg-[#f1f5f9]">
                <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 4l5 5-9 9H6v-5zM4 21h16" />
                </svg>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  save("yellow", true);
                  onOpenNotes();
                }}
                title="Add a note"
                aria-label="Add a note to selection"
                className="flex size-8 items-center justify-center rounded-[4px] text-[#0f172a] hover:bg-[#f1f5f9]"
              >
                <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5M9 13h6M9 17h4" />
                </svg>
              </button>
            </div>
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
  const [text, setText] = useState("");
  const [scope, setScope] = useState<"all" | "current">("all");
  const [sort, setSort] = useState<"recent" | "oldest">("recent");
  const [show, setShow] = useState<"all" | "notes" | "highlights">("all");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const n = notes.find((x) => x.id === editId);
    setDraft(n?.text ?? "");
  }, [editId]);

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setNotes((list) => [
      { id: Date.now(), created: Date.now(), lessonKey: current.key, lessonTitle: current.title, sectionTitle: current.sectionTitle, kind: current.kind, text: text.trim(), at: current.kind === "video" ? Math.floor(time) : undefined },
      ...list,
    ]);
    setText("");
  };

  const saveEdit = (id: number) => {
    setNotes((list) => list.map((n) => (n.id === id ? { ...n, text: draft.trim() } : n)));
    setEditId(null);
  };

  const onEditKey = (e: KeyboardEvent<HTMLTextAreaElement>, id: number) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEdit(id);
    } else if (e.key === "Escape") setEditId(null);
  };

  const shown = notes
    .filter((n) => scope === "all" || n.lessonKey === current.key)
    .filter((n) => show === "all" || (show === "highlights" ? !!n.quote : !!n.text))
    .sort((a, b) => (sort === "recent" ? b.created - a.created : a.created - b.created));

  return (
    <div className="-mx-4 -my-8 md:-mx-6">
      <form onSubmit={add} className="flex items-center gap-4 px-4 py-6 md:px-8">
        <span className={`shrink-0 rounded-full bg-[#334155] px-2.5 py-1 text-[12px] text-white ${fontMedium}`}>{current.kind === "video" ? `Video · ${clock(time)}` : current.kind === "quiz" ? "Quiz" : "Article"}</span>
        <label className="flex h-[52px] min-w-0 flex-1 items-center gap-3 rounded-[6px] border border-[#cbd5e1] bg-white px-4 focus-within:border-[#1e293b]">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add new note" aria-label="Add new note" className={`min-w-0 flex-1 bg-transparent text-[16px] text-[#0f172a] outline-none placeholder:text-[#94a3b8] ${fontRegular}`} />
          <button type="submit" aria-label="Save note" className="text-[#0f172a] hover:text-[#0d5c4b]">
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
              <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75zM20.7 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75z" />
            </svg>
          </button>
        </label>
      </form>

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
                  <p className={`min-w-0 flex-1 truncate text-[15px] text-[#1e293b] ${fontRegular}`}>
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
                  <span className={`w-[3px] shrink-0 rounded-full ${n.color ? barColor[n.color] : "bg-[#22d3ee]"}`} />
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    {n.quote && <p className={`text-[16px] leading-[26px] text-[#1e293b] ${fontRegular}`}>{n.quote}</p>}
                    {n.at !== undefined && (
                      <button type="button" onClick={() => onJump(n)} className={`self-start rounded-[4px] bg-[#f1f5f9] px-2 py-1 text-[12px] text-[#64748b] hover:bg-[#e2e8f0] ${fontRegular}`}>
                        Play video from <span className={`text-[#0f172a] ${fontSemi}`}>{clock(n.at)}</span>
                      </button>
                    )}
                    {editing ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => onEditKey(e, n.id)}
                          rows={2}
                          placeholder="Write your note…"
                          className={`w-full resize-y rounded-[6px] border border-[#cbd5e1] px-3 py-2 text-[15px] text-[#0f172a] outline-none focus:border-[#1e293b] ${fontRegular}`}
                        />
                        <div className="flex gap-2">
                          <button type="button" onClick={() => saveEdit(n.id)} className={`h-[34px] rounded-[6px] bg-[#1e293b] px-3 text-[13px] text-white hover:bg-[#0f172a] ${fontMedium}`}>
                            Save
                          </button>
                          <button type="button" onClick={() => setEditId(null)} className={`h-[34px] rounded-[6px] bg-[#f1f5f9] px-3 text-[13px] text-[#334155] hover:bg-[#e2e8f0] ${fontMedium}`}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      n.text && <p className={`whitespace-pre-wrap text-[15px] text-[#0f172a] ${fontSemi}`}>{n.text}</p>
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
