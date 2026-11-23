import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, ArrowLeft01Icon, ArrowRight01Icon, ArrowUp02Icon, CheckmarkCircle02Icon, CloudSavingDone01Icon, Loading03Icon, PencilEdit02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { fontMedium, fontRegular, fontSemi } from "../fonts";

export const ASSIGNMENT_QUESTIONS = [
  "Describe one product you use every day. Who is its main user, and what problem does it solve for them?",
  "Pick a screen from that product. List two usability problems you notice and explain why they cause friction.",
  "Write a short user persona (name, goal, frustration) for the person most affected by those problems.",
  "Propose a redesign for one of the problems. What would you change in the layout, wording or flow?",
  "How would you run a quick usability test to check that your redesign works? Describe the task and what you would measure.",
];

export type AssignmentState = { answers: string[]; submitted: boolean; submittedAt?: number };

// Word target that marks an answer as detailed enough.
const TARGET_WORDS = 35;
const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

type Rating = { label: string; tone: string; bar: string };
const ratingFor = (answer: string): Rating => {
  const words = countWords(answer);
  if (words < 12) return { label: "Needs more detail", tone: "bg-secondary-50 text-slate-800 ring-secondary-500", bar: "border-secondary-500" };
  if (words < TARGET_WORDS) return { label: "Good", tone: "bg-ai-50 text-ai-800 ring-ai-200", bar: "border-ai-600" };
  return { label: "Excellent", tone: "bg-primary-100 text-primary-800 ring-primary-400", bar: "border-primary-700" };
};

const feedbackFor = (answer: string, i: number) => {
  const words = countWords(answer);
  if (words < 12) return "This answer is too short to show your thinking. Expand it with a concrete example and explain your reasoning in more detail.";
  if (words < TARGET_WORDS)
    return [
      "Good start. You identified the key point. Add one specific example from the product to make it stronger.",
      "Clear observations. Next time, link each problem to a usability principle such as consistency or feedback.",
      "Nice persona basics. Add context about where and when they use the product to make it more useful for design.",
      "Solid idea. Describe the before and after so the change is easy for the team to picture.",
      "Reasonable test plan. Define a success metric (for example, task completion rate) before you start.",
    ][i % 5];
  return "Excellent, well-reasoned answer with clear examples. This is the level of detail we look for. Keep it up!";
};

const total = ASSIGNMENT_QUESTIONS.length;

function Frame({ title, meta, actions, children }: { title: string; meta: React.ReactNode; actions: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-gradient-to-b from-ai-600 to-ai-900">
      <div className="flex flex-wrap items-center gap-3 bg-ai-900 px-4 py-3 md:px-6">
        <div className="min-w-0 flex-1">
          <p className={`truncate text-17 text-white md:text-xl ${fontRegular}`}>{title}</p>
          <div className={`mt-0.5 flex items-center gap-2 text-13 text-white/70 ${fontRegular}`}>{meta}</div>
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      <div className="p-3 md:p-5">{children}</div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
      <span className="block h-full rounded-full bg-secondary-500 transition-all duration-300" style={{ width: `${value * 100}%` }} />
    </span>
  );
}

export function AssignmentPanel({
  title,
  state,
  onSave,
  onNext,
  notify,
}: {
  title: string;
  state: AssignmentState | undefined;
  onSave: (s: AssignmentState) => void;
  onNext?: () => void;
  notify: (m: string) => void;
}) {
  const [answers, setAnswers] = useState<string[]>(() => state?.answers ?? ASSIGNMENT_QUESTIONS.map(() => ""));
  const [mode, setMode] = useState<"edit" | "review" | "result">(state?.submitted ? "result" : "edit");
  const [current, setCurrent] = useState(() => {
    const first = (state?.answers ?? []).findIndex((a) => !a.trim());
    return first === -1 ? 0 : first;
  });
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [read, setRead] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastSaved = useRef(JSON.stringify(state?.answers ?? ASSIGNMENT_QUESTIONS.map(() => "")));
  const mounted = useRef(false);

  const answered = answers.filter((a) => a.trim()).length;
  const missing = total - answered;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setRead(0);
  }, [mode]);

  // Move focus to the answer box when the learner switches question.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (mode === "edit") inputRef.current?.focus({ preventScroll: true });
  }, [current, mode]);

  // Autosave drafts shortly after the learner stops typing.
  useEffect(() => {
    if (mode !== "edit") return;
    const snapshot = JSON.stringify(answers);
    if (snapshot === lastSaved.current) return;
    setSaving("saving");
    const t = setTimeout(() => {
      onSave({ answers, submitted: false });
      lastSaved.current = snapshot;
      setSaving("saved");
    }, 700);
    return () => clearTimeout(t);
  }, [answers, mode, onSave]);

  // Save any pending draft if the learner leaves before the autosave fires.
  const pending = useRef({ answers, mode, onSave });
  pending.current = { answers, mode, onSave };
  useEffect(
    () => () => {
      const p = pending.current;
      if (p.mode === "edit" && JSON.stringify(p.answers) !== lastSaved.current) p.onSave({ answers: p.answers, submitted: false });
    },
    [],
  );

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setRead(max > 0 ? el.scrollTop / max : 0);
  };

  const flush = () => {
    onSave({ answers, submitted: false });
    lastSaved.current = JSON.stringify(answers);
  };

  const goReview = () => {
    flush();
    setMode("review");
  };

  const editAt = (i: number) => {
    setCurrent(i);
    setMode("edit");
  };

  const submit = () => {
    onSave({ answers, submitted: true, submittedAt: Date.now() });
    lastSaved.current = JSON.stringify(answers);
    setMode("result");
    notify("Assignment submitted. Your feedback is ready.");
  };

  const ghostBtn = `flex h-9.5 items-center gap-1.5 rounded-md px-3 text-sm text-white transition hover:bg-white/10 ${fontMedium}`;
  const whiteBtn = `flex h-9.5 items-center gap-1.5 rounded-md bg-white px-4 text-sm text-slate-900 transition hover:bg-slate-150 disabled:cursor-not-allowed disabled:opacity-50 ${fontMedium}`;
  const yellowBtn = `flex h-9.5 items-center gap-1.5 rounded-md bg-secondary-500 px-4 text-sm text-slate-800 transition hover:bg-secondary-600 disabled:opacity-50 ${fontMedium}`;

  const saveStatus =
    saving === "saving" ? (
      <span className="flex items-center gap-1">
        <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" aria-hidden="true" /> Saving…
      </span>
    ) : saving === "saved" ? (
      <span className="flex items-center gap-1">
        <HugeiconsIcon icon={CloudSavingDone01Icon} size={14} aria-hidden="true" /> Draft saved
      </span>
    ) : null;

  const meta =
    mode === "result" ? (
      <span>
        Submitted{state?.submittedAt ? ` ${new Date(state.submittedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}` : ""}
      </span>
    ) : (
      <>
        <ProgressBar value={answered / total} />
        <span>
          {answered} of {total} answered
        </span>
        {mode === "edit" && saveStatus && <span className="hidden sm:inline">·</span>}
        {mode === "edit" && <span className="hidden sm:inline">{saveStatus}</span>}
      </>
    );

  const actions =
    mode === "edit" ? (
      <button type="button" onClick={goReview} disabled={answered === 0} className={whiteBtn}>
        Review and submit
      </button>
    ) : mode === "review" ? (
      <>
        <button type="button" onClick={() => setMode("edit")} className={ghostBtn}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} aria-hidden="true" /> Back
        </button>
        <button type="button" onClick={submit} className={yellowBtn}>
          Submit assignment
        </button>
      </>
    ) : (
      <>
        <button type="button" onClick={() => editAt(0)} className={ghostBtn}>
          <HugeiconsIcon icon={PencilEdit02Icon} size={16} aria-hidden="true" /> Edit and resubmit
        </button>
        {onNext && (
          <button type="button" onClick={onNext} className={yellowBtn}>
            Next lesson <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
          </button>
        )}
      </>
    );

  const words = countWords(answers[current]);
  const isLast = current === total - 1;

  return (
    <Frame title={title} meta={meta} actions={actions}>
      <div className="relative overflow-hidden rounded-xl bg-white shadow-panel">
        {mode === "edit" && (
          <div key="edit" className="fade-up flex flex-col md:h-140 md:flex-row">
            {/* Question navigator: chips on phones, a list on larger screens. */}
            <nav aria-label="Questions" className="shrink-0 border-b border-slate-200 bg-slate-50 md:w-64 md:border-b-0 md:border-r">
              <p className={`hidden px-5 pb-2 pt-5 text-11 uppercase tracking-wider text-slate-500 md:block ${fontSemi}`}>Questions</p>
              <ol className="scrollbar-thin flex gap-2 overflow-x-auto p-3 md:flex-col md:gap-1 md:overflow-y-auto md:px-3 md:pb-4 md:pt-0">
                {ASSIGNMENT_QUESTIONS.map((q, i) => {
                  const done = !!answers[i].trim();
                  const active = i === current;
                  return (
                    <li key={i} className="shrink-0">
                      <button
                        type="button"
                        onClick={() => setCurrent(i)}
                        aria-current={active ? "step" : undefined}
                        className={`flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition md:px-2.5 md:py-2.5 ${active ? "bg-white shadow-card ring-1 ring-slate-200" : "hover:bg-slate-150"}`}
                      >
                        <span
                          className={`flex size-7 shrink-0 items-center justify-center rounded-full text-13 transition ${fontSemi} ${
                            done ? "bg-primary-700 text-white" : active ? "bg-ai-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-300"
                          }`}
                        >
                          {done ? <HugeiconsIcon icon={Tick02Icon} size={14} strokeWidth={2.4} aria-label="Answered" /> : i + 1}
                        </span>
                        <span className={`hidden min-w-0 flex-1 text-13 leading-4.5 md:line-clamp-2 ${active ? `text-slate-900 ${fontMedium}` : `text-slate-600 ${fontRegular}`}`}>{q}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>

            {/* Current question */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-6 md:px-10 md:py-8">
                <p className={`text-13 text-ai-600 ${fontSemi}`}>
                  Question {current + 1} of {total}
                </p>
                <label htmlFor={`asg-${current}`} className={`text-lg leading-7 text-slate-900 md:text-xl md:leading-8 ${fontSemi}`}>
                  {ASSIGNMENT_QUESTIONS[current]}
                </label>
                <textarea
                  ref={inputRef}
                  id={`asg-${current}`}
                  value={answers[current]}
                  onChange={(e) => setAnswers((a) => a.map((v, j) => (j === current ? e.target.value : v)))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      if (isLast) goReview();
                      else setCurrent((c) => c + 1);
                    }
                  }}
                  rows={8}
                  placeholder="Write your answer here. Use a real example to explain your thinking."
                  className="field flex-1 leading-6"
                />
                <div className={`flex flex-wrap items-center gap-3 text-13 text-slate-500 ${fontRegular}`}>
                  <span className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-150" aria-hidden="true">
                    <span
                      className={`block h-full rounded-full transition-all duration-300 ${words >= TARGET_WORDS ? "bg-primary-700" : "bg-ai-600"}`}
                      style={{ width: `${Math.min(words / TARGET_WORDS, 1) * 100}%` }}
                    />
                  </span>
                  <span className={words >= TARGET_WORDS ? `text-primary-700 ${fontMedium}` : ""}>
                    {words} {words === 1 ? "word" : "words"}
                    {words < TARGET_WORDS ? ` · aim for ${TARGET_WORDS}+` : " · great detail"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-200 px-5 py-3.5 md:px-10">
                <button
                  type="button"
                  onClick={() => setCurrent((c) => c - 1)}
                  disabled={current === 0}
                  className={`flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm text-slate-700 transition hover:bg-slate-150 disabled:invisible ${fontMedium}`}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={16} aria-hidden="true" /> Previous
                </button>
                <span className={`ml-auto hidden text-xs text-slate-400 lg:inline ${fontRegular}`}>Ctrl + Enter to continue</span>
                <button
                  type="button"
                  onClick={() => (isLast ? goReview() : setCurrent((c) => c + 1))}
                  disabled={isLast && answered === 0}
                  className={`ml-auto flex h-10 items-center gap-1.5 rounded-lg bg-primary-700 px-4 text-sm text-white shadow-primary-xs transition hover:bg-primary-800 disabled:opacity-50 lg:ml-0 ${fontMedium}`}
                >
                  {isLast ? "Review answers" : "Next question"} <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        )}

        {mode !== "edit" && (
          <div ref={scrollRef} onScroll={onScroll} className="max-h-140 overflow-y-auto px-5 py-6 md:px-10 md:py-8">
            {mode === "review" && (
              <div key="review" className="fade-up flex flex-col gap-4">
                <div className={`flex items-start gap-3 rounded-lg p-4 ${missing ? "bg-secondary-50" : "bg-primary-50"}`}>
                  <HugeiconsIcon icon={missing ? Alert02Icon : CheckmarkCircle02Icon} size={20} className={missing ? "text-secondary-600" : "text-primary-700"} aria-hidden="true" />
                  <div>
                    <p className={`text-15 text-slate-900 ${fontSemi}`}>{missing ? `${missing} ${missing === 1 ? "question has" : "questions have"} no answer` : "All questions answered"}</p>
                    <p className={`mt-0.5 text-sm text-slate-600 ${fontRegular}`}>
                      {missing ? "You can still submit, or add the missing answers first." : "Check your answers below, then submit when you're ready."}
                    </p>
                  </div>
                </div>

                {ASSIGNMENT_QUESTIONS.map((q, i) => {
                  const a = answers[i].trim();
                  return (
                    <div key={i} className="rounded-lg border border-slate-200 p-4 md:p-5">
                      <div className="flex items-start gap-3">
                        <span className={`flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-150 text-xs text-slate-700 ${fontSemi}`}>{i + 1}</span>
                        <p className={`min-w-0 flex-1 text-15 leading-6 text-slate-900 ${fontSemi}`}>{q}</p>
                        <button type="button" onClick={() => editAt(i)} className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-13 text-ai-600 transition hover:bg-ai-50 ${fontMedium}`}>
                          <HugeiconsIcon icon={PencilEdit02Icon} size={14} aria-hidden="true" /> {a ? "Edit" : "Add answer"}
                        </button>
                      </div>
                      <p className={`mt-2.5 whitespace-pre-wrap pl-9 text-sm leading-6 ${a ? "text-slate-600" : "italic text-slate-400"} ${fontRegular}`}>{a || "No answer yet"}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {mode === "result" && (
              <div key="result" className="fade-up flex flex-col gap-4">
                <div className="flex items-start gap-3 rounded-lg bg-primary-50 p-4">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} className="text-primary-700" aria-hidden="true" />
                  <div>
                    <p className={`text-15 text-slate-900 ${fontSemi}`}>Assignment submitted</p>
                    <p className={`mt-0.5 text-sm text-slate-600 ${fontRegular}`}>Your instructor reviewed each answer. Read the feedback below to improve your next submission.</p>
                  </div>
                </div>

                {ASSIGNMENT_QUESTIONS.map((q, i) => {
                  const r = ratingFor(answers[i]);
                  return (
                    <div key={i} className="overflow-hidden rounded-lg border border-slate-200">
                      <div className="p-4 md:p-5">
                        <div className="flex items-start gap-3">
                          <span className={`flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-150 text-xs text-slate-700 ${fontSemi}`}>{i + 1}</span>
                          <p className={`min-w-0 flex-1 text-15 leading-6 text-slate-900 ${fontSemi}`}>{q}</p>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ring-1 ${r.tone} ${fontMedium}`}>{r.label}</span>
                        </div>
                        <p className={`mt-2.5 whitespace-pre-wrap pl-9 text-sm leading-6 text-slate-600 ${fontRegular}`}>{answers[i].trim() || "No answer"}</p>
                      </div>
                      <div className="bg-slate-50 px-4 py-3.5 md:px-5">
                        <div className={`border-l-2 pl-3 ${r.bar}`}>
                          <p className={`text-13 text-slate-500 ${fontSemi}`}>Instructor feedback</p>
                          <p className={`mt-1 text-sm leading-6 text-slate-800 ${fontRegular}`}>{feedbackFor(answers[i], i)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {mode !== "edit" && read > 0.05 && (
          <button
            type="button"
            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="fade-up absolute bottom-5 right-6 flex size-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-xl transition hover:scale-105"
          >
            <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90" aria-hidden="true">
              <circle cx="20" cy="20" r="18" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
              <circle cx="20" cy="20" r="18" fill="none" stroke="#ffb20d" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${read * 113.1} 113.1`} />
            </svg>
            <HugeiconsIcon icon={ArrowUp02Icon} size={18} className="relative" aria-hidden="true" />
          </button>
        )}
      </div>
    </Frame>
  );
}
