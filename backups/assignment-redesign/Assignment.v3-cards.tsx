import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, ArrowRight01Icon, ArrowUp02Icon, CheckmarkCircle02Icon, CloudSavingDone01Icon, Loading03Icon, PencilEdit02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
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
const total = ASSIGNMENT_QUESTIONS.length;
const empty = () => ASSIGNMENT_QUESTIONS.map(() => "");

const ratingFor = (answer: string) => {
  const words = countWords(answer);
  if (words < 12) return { label: "Needs more detail", tone: "bg-secondary-50 text-slate-800 ring-secondary-500" };
  if (words < TARGET_WORDS) return { label: "Good", tone: "bg-slate-100 text-slate-700 ring-slate-300" };
  return { label: "Excellent", tone: "bg-primary-100 text-primary-800 ring-primary-400" };
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

function NumberBadge({ n, done }: { n: number; done: boolean }) {
  return (
    <span
      className={`flex size-7 shrink-0 items-center justify-center rounded-full text-13 transition ${fontSemi} ${done ? "bg-primary-700 text-white" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"}`}
    >
      {done ? <HugeiconsIcon icon={Tick02Icon} size={14} strokeWidth={2.4} aria-label={`Question ${n} answered`} /> : n}
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
  const [answers, setAnswers] = useState<string[]>(() => state?.answers ?? empty());
  const [mode, setMode] = useState<"edit" | "result">(state?.submitted ? "result" : "edit");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [read, setRead] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSaved = useRef(JSON.stringify(state?.answers ?? empty()));

  const answered = answers.filter((a) => a.trim()).length;
  const missing = total - answered;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setRead(0);
    setConfirming(false);
  }, [mode]);

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

  const submit = () => {
    onSave({ answers, submitted: true, submittedAt: Date.now() });
    lastSaved.current = JSON.stringify(answers);
    setMode("result");
    notify("Assignment submitted. Your feedback is ready.");
  };

  const trySubmit = () => (missing > 0 ? setConfirming(true) : submit());

  const focusFirstEmpty = () => {
    setConfirming(false);
    const i = answers.findIndex((a) => !a.trim());
    const el = document.getElementById(`asg-${i}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus({ preventScroll: true });
  };

  const darkBtn = `flex h-9.5 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-sm text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 ${fontMedium}`;
  const lightBtn = `flex h-9.5 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 ${fontMedium}`;

  const submittedOn = state?.submittedAt ? new Date(state.submittedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";

  return (
    <div className="bg-slate-100 p-3 md:p-5">
      <div className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        {/* Header: title, progress and the main action stay visible while the questions scroll. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-slate-200 px-5 py-4 md:px-8">
          <div className="min-w-0 flex-1">
            <h2 className={`truncate text-17 text-slate-900 md:text-lg ${fontSemi}`}>{title}</h2>
            <div className={`mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-13 text-slate-500 ${fontRegular}`}>
              {mode === "edit" ? (
                <>
                  <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-150" aria-hidden="true">
                    <span className={`block h-full rounded-full transition-all duration-300 ${answered === total ? "bg-primary-700" : "bg-slate-800"}`} style={{ width: `${(answered / total) * 100}%` }} />
                  </span>
                  <span>
                    {answered} of {total} answered
                  </span>
                  {saving !== "idle" && <span aria-hidden="true">·</span>}
                  {saving === "saving" && (
                    <span className="flex items-center gap-1">
                      <HugeiconsIcon icon={Loading03Icon} size={13} className="animate-spin" aria-hidden="true" /> Saving…
                    </span>
                  )}
                  {saving === "saved" && (
                    <span className="flex items-center gap-1">
                      <HugeiconsIcon icon={CloudSavingDone01Icon} size={13} aria-hidden="true" /> Draft saved
                    </span>
                  )}
                </>
              ) : (
                <span className="flex items-center gap-1 text-primary-700">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} aria-hidden="true" /> Submitted{submittedOn ? ` ${submittedOn}` : ""}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mode === "edit" ? (
              <button type="button" onClick={trySubmit} disabled={answered === 0} className={darkBtn}>
                Submit
              </button>
            ) : (
              <>
                <button type="button" onClick={() => setMode("edit")} className={lightBtn}>
                  <HugeiconsIcon icon={PencilEdit02Icon} size={15} aria-hidden="true" /> Edit answers
                </button>
                {onNext && (
                  <button type="button" onClick={onNext} className={darkBtn}>
                    Next lesson <HugeiconsIcon icon={ArrowRight01Icon} size={15} aria-hidden="true" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {confirming && (
          <div role="alertdialog" aria-label="Unanswered questions" className="fade-up flex flex-wrap items-center gap-3 border-b border-secondary-500 bg-secondary-50 px-5 py-3 md:px-8">
            <HugeiconsIcon icon={Alert02Icon} size={18} className="text-secondary-600" aria-hidden="true" />
            <p className={`min-w-0 flex-1 text-sm text-slate-800 ${fontRegular}`}>
              {missing} {missing === 1 ? "question has" : "questions have"} no answer. Submit anyway?
            </p>
            <button type="button" onClick={focusFirstEmpty} className={lightBtn}>
              Keep writing
            </button>
            <button type="button" onClick={submit} className={darkBtn}>
              Submit anyway
            </button>
          </div>
        )}

        <div ref={scrollRef} onScroll={onScroll} className="max-h-140 overflow-y-auto bg-slate-50 px-3 py-4 md:px-8 md:py-6">
          {mode === "edit" ? (
            <ol key="edit" className="fade-up flex flex-col gap-3">
              {ASSIGNMENT_QUESTIONS.map((q, i) => {
                const words = countWords(answers[i]);
                return (
                  <li key={i} className="rounded-xl bg-white p-4 ring-1 ring-slate-200 transition focus-within:shadow-card focus-within:ring-slate-400 md:p-5">
                    <div className="flex items-start gap-3">
                      <NumberBadge n={i + 1} done={!!answers[i].trim()} />
                      <label htmlFor={`asg-${i}`} className={`min-w-0 flex-1 pt-0.5 text-15 leading-6 text-slate-900 ${fontSemi}`}>
                        {q}
                      </label>
                    </div>
                    <div className="mt-3 md:pl-10">
                      <textarea
                        id={`asg-${i}`}
                        value={answers[i]}
                        onChange={(e) => setAnswers((a) => a.map((v, j) => (j === i ? e.target.value : v)))}
                        rows={4}
                        placeholder="Write your answer. Use a real example to explain your thinking."
                        className="field leading-6"
                      />
                      <p className={`mt-2 text-xs ${words >= TARGET_WORDS ? `text-primary-700 ${fontMedium}` : `text-slate-400 ${fontRegular}`}`}>
                        {words} {words === 1 ? "word" : "words"}
                        {words >= TARGET_WORDS ? " · great detail" : ` · aim for ${TARGET_WORDS}+`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <ol key="result" className="fade-up flex flex-col gap-3">
              {ASSIGNMENT_QUESTIONS.map((q, i) => {
                const r = ratingFor(answers[i]);
                return (
                  <li key={i} className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
                    <div className="p-4 md:p-5">
                      <div className="flex items-start gap-3">
                        <NumberBadge n={i + 1} done={!!answers[i].trim()} />
                        <p className={`min-w-0 flex-1 pt-0.5 text-15 leading-6 text-slate-900 ${fontSemi}`}>{q}</p>
                        <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs ring-1 sm:inline ${r.tone} ${fontMedium}`}>{r.label}</span>
                      </div>
                      <p className={`mt-3 whitespace-pre-wrap text-sm leading-6 md:pl-10 ${answers[i].trim() ? "text-slate-600" : "italic text-slate-400"} ${fontRegular}`}>{answers[i].trim() || "No answer"}</p>
                    </div>
                    <div className="border-t border-slate-200 bg-slate-50 px-4 py-3.5 md:px-5 md:pl-15">
                      <div className="flex items-center gap-2">
                        <p className={`text-13 text-slate-500 ${fontSemi}`}>Instructor feedback</p>
                        <span className={`rounded-full px-2 py-0.5 text-11 ring-1 sm:hidden ${r.tone} ${fontMedium}`}>{r.label}</span>
                      </div>
                      <p className={`mt-1 text-sm leading-6 text-slate-800 ${fontRegular}`}>{feedbackFor(answers[i], i)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {read > 0.05 && (
          <button
            type="button"
            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="fade-up absolute bottom-5 right-6 flex size-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-popover transition hover:bg-slate-700"
          >
            <HugeiconsIcon icon={ArrowUp02Icon} size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
