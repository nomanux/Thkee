import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUp02Icon,
  BulbIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  CloudSavingDone01Icon,
  Comment01Icon,
  Loading03Icon,
  PencilEdit02Icon,
  SparklesIcon,
  Task01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { fontMedium, fontRegular, fontSemi } from "../fonts";

export const ASSIGNMENT_QUESTIONS = [
  "Describe one product you use every day. Who is its main user, and what problem does it solve for them?",
  "Pick a screen from that product. List two usability problems you notice and explain why they cause friction.",
  "Write a short user persona (name, goal, frustration) for the person most affected by those problems.",
  "Propose a redesign for one of the problems. What would you change in the layout, wording or flow?",
  "How would you run a quick usability test to check that your redesign works? Describe the task and what you would measure.",
];

const HINTS = [
  "Name the product, then describe the person who uses it most and the moment they reach for it.",
  "Look for slow steps, unclear labels or hidden buttons. Say what the user expects and what happens instead.",
  "Give the persona a real name, one clear goal and one frustration linked to the problems above.",
  "Describe the change as before and after. Say why the new version removes the friction.",
  "Write the task you would give a tester, then pick one number to measure, such as time on task or success rate.",
];

export type AssignmentState = { answers: string[]; submitted: boolean; submittedAt?: number };

const TARGET_WORDS = 35;
const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const total = ASSIGNMENT_QUESTIONS.length;
const blank = () => ASSIGNMENT_QUESTIONS.map(() => "");

// Answer depth: 0 empty, 1 short, 2 good, 3 detailed.
const depthOf = (answer: string): number => {
  const w = countWords(answer);
  return w === 0 ? 0 : w < 12 ? 1 : w < TARGET_WORDS ? 2 : 3;
};
const DEPTH = [
  { label: "Not started", text: "text-slate-400", pill: "bg-slate-100 text-slate-500 ring-slate-200" },
  { label: "Needs more detail", text: "text-secondary-600", pill: "bg-secondary-50 text-slate-800 ring-secondary-500" },
  { label: "Good", text: "text-slate-700", pill: "bg-slate-100 text-slate-800 ring-slate-300" },
  { label: "Excellent", text: "text-primary-700", pill: "bg-primary-100 text-primary-800 ring-primary-400" },
];

const feedbackFor = (answer: string, i: number) => {
  const d = depthOf(answer);
  if (d <= 1) return "This answer is too short to show your thinking. Expand it with a concrete example and explain your reasoning in more detail.";
  if (d === 2)
    return [
      "Good start. You identified the key point. Add one specific example from the product to make it stronger.",
      "Clear observations. Next time, link each problem to a usability principle such as consistency or feedback.",
      "Nice persona basics. Add context about where and when they use the product to make it more useful for design.",
      "Solid idea. Describe the before and after so the change is easy for the team to picture.",
      "Reasonable test plan. Define a success metric (for example, task completion rate) before you start.",
    ][i % 5];
  return "Excellent, well-reasoned answer with clear examples. This is the level of detail we look for. Keep it up!";
};

function Ring({ value, label, sub }: { value: number; label: string; sub: string }) {
  const c = 2 * Math.PI * 30;
  return (
    <div className="relative flex size-20 shrink-0 items-center justify-center">
      <svg viewBox="0 0 72 72" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="36" cy="36" r="30" fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r="30"
          fill="none"
          stroke={value >= 1 ? "#0d5c4b" : "#0f172a"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${value * c} ${c}`}
          className="transition-all duration-500"
        />
      </svg>
      <div className="text-center">
        <p className={`text-lg leading-5 text-slate-900 ${fontSemi}`}>{label}</p>
        <p className={`text-10 uppercase tracking-wider text-slate-500 ${fontMedium}`}>{sub}</p>
      </div>
    </div>
  );
}

function Chip({ icon, children }: { icon: typeof Clock01Icon; children: React.ReactNode }) {
  return (
    <span className={`flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs text-slate-700 ring-1 ring-slate-200 ${fontMedium}`}>
      <HugeiconsIcon icon={icon} size={14} aria-hidden="true" />
      {children}
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
  const [answers, setAnswers] = useState<string[]>(() => state?.answers ?? blank());
  const [mode, setMode] = useState<"edit" | "result">(state?.submitted ? "result" : "edit");
  const [active, setActive] = useState<number | null>(null);
  const [hints, setHints] = useState<boolean[]>(() => ASSIGNMENT_QUESTIONS.map(() => false));
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [read, setRead] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSaved = useRef(JSON.stringify(state?.answers ?? blank()));

  const answered = answers.filter((a) => a.trim()).length;
  const missing = total - answered;
  const allDone = missing === 0;

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

  const jumpTo = (i: number) => {
    const el = document.getElementById(`asg-${i}`);
    el?.closest("li")?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus({ preventScroll: true });
  };

  const submit = () => {
    onSave({ answers, submitted: true, submittedAt: Date.now() });
    lastSaved.current = JSON.stringify(answers);
    setMode("result");
    notify("Assignment submitted. Your feedback is ready.");
  };

  const darkBtn = `flex h-10 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-sm text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 ${fontMedium}`;
  const greenBtn = `flex h-10 items-center gap-1.5 rounded-lg bg-primary-700 px-4 text-sm text-white shadow-primary-button transition hover:bg-primary-800 ${fontMedium}`;
  const lightBtn = `flex h-10 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 ${fontMedium}`;

  const depths = answers.map(depthOf);
  const score = Math.round((depths.reduce((s, d) => s + [0, 0.3, 0.7, 1][d], 0) / total) * 100);
  const submittedOn = state?.submittedAt ? new Date(state.submittedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";

  return (
    <div className="bg-slate-100 p-3 md:p-5">
      <div className="relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        <div ref={scrollRef} onScroll={onScroll} className="max-h-140 overflow-y-auto">
          {/* Intro: what the task is, how far along the learner is. */}
          <header className="border-b border-slate-200 bg-slate-50 px-5 py-6 md:px-8">
            <div className="flex items-start gap-5">
              <div className="min-w-0 flex-1">
                <p className={`flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-500 ${fontSemi}`}>
                  <HugeiconsIcon icon={Task01Icon} size={14} aria-hidden="true" /> Assignment
                </p>
                <h2 className={`mt-1.5 text-xl text-slate-900 md:text-2xl ${fontSemi}`}>{title}</h2>
                <p className={`mt-1.5 max-w-xl text-sm leading-6 text-slate-600 ${fontRegular}`}>
                  {mode === "edit"
                    ? "Study a product you use every day, spot what slows people down and propose a better design. Answer in your own words."
                    : `Submitted${submittedOn ? ` on ${submittedOn}` : ""}. Your instructor reviewed every answer. Read the notes below to sharpen your next attempt.`}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Chip icon={Task01Icon}>{total} questions</Chip>
                  <Chip icon={Clock01Icon}>About 20 min</Chip>
                  <Chip icon={Comment01Icon}>Instructor feedback</Chip>
                </div>
              </div>
              <div className="hidden sm:block">{mode === "edit" ? <Ring value={answered / total} label={`${answered}/${total}`} sub="answered" /> : <Ring value={score / 100} label={`${score}%`} sub="score" />}</div>
            </div>

            {/* Step bar: one segment per question, click to jump. */}
            {mode === "edit" && (
              <div className="mt-5 flex gap-1.5" role="list" aria-label="Question progress">
                {ASSIGNMENT_QUESTIONS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="listitem"
                    onClick={() => jumpTo(i)}
                    aria-label={`Go to question ${i + 1}${answers[i].trim() ? ", answered" : ""}`}
                    className={`h-1.5 flex-1 rounded-full transition-all hover:opacity-80 ${answers[i].trim() ? "bg-primary-700" : active === i ? "bg-slate-500" : "bg-slate-200"}`}
                  />
                ))}
              </div>
            )}
          </header>

          {mode === "edit" ? (
            <ol key="edit" className="fade-up flex flex-col gap-4 px-3 py-5 md:px-8 md:py-6">
              {ASSIGNMENT_QUESTIONS.map((q, i) => {
                const d = depths[i];
                const words = countWords(answers[i]);
                const isActive = active === i;
                return (
                  <li
                    key={i}
                    className={`rounded-2xl bg-white p-4 transition duration-200 md:p-6 ${isActive ? "shadow-panel ring-2 ring-slate-900" : "ring-1 ring-slate-200 hover:ring-slate-300"}`}
                  >
                    <div className="flex items-start gap-3.5">
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-sm transition ${fontSemi} ${
                          answers[i].trim() ? "bg-primary-700 text-white" : isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {answers[i].trim() ? <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={2.4} aria-label="Answered" /> : i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-11 uppercase tracking-wider text-slate-400 ${fontSemi}`}>
                          Question {i + 1} of {total}
                        </p>
                        <label htmlFor={`asg-${i}`} className={`mt-1 block text-base leading-6 text-slate-900 md:text-17 md:leading-7 ${fontSemi}`}>
                          {q}
                        </label>
                        <button
                          type="button"
                          onClick={() => setHints((h) => h.map((v, j) => (j === i ? !v : v)))}
                          aria-expanded={hints[i]}
                          className={`mt-2 flex items-center gap-1 text-13 text-slate-500 transition hover:text-slate-900 ${fontMedium}`}
                        >
                          <HugeiconsIcon icon={BulbIcon} size={15} aria-hidden="true" /> {hints[i] ? "Hide hint" : "Need a hint?"}
                          <HugeiconsIcon icon={ArrowDown01Icon} size={14} className={`transition-transform ${hints[i] ? "rotate-180" : ""}`} aria-hidden="true" />
                        </button>
                        {hints[i] && <p className={`fade-up mt-2 rounded-lg bg-secondary-50 px-3.5 py-2.5 text-13 leading-5 text-slate-700 ${fontRegular}`}>{HINTS[i]}</p>}
                      </div>
                    </div>

                    <div className="mt-4 md:pl-11.5">
                      <textarea
                        id={`asg-${i}`}
                        value={answers[i]}
                        onFocus={() => setActive(i)}
                        onBlur={() => setActive((a) => (a === i ? null : a))}
                        onChange={(e) => setAnswers((a) => a.map((v, j) => (j === i ? e.target.value : v)))}
                        rows={3}
                        placeholder="Start typing your answer…"
                        className="field field-sizing-content min-h-24 bg-slate-50 leading-6 focus:bg-white"
                      />
                      <div className="mt-2.5 flex items-center gap-3">
                        <span className="flex gap-1" aria-hidden="true">
                          {[1, 2, 3].map((n) => (
                            <span key={n} className={`h-1 w-6 rounded-full transition ${d >= n ? (d === 3 ? "bg-primary-700" : d === 2 ? "bg-slate-700" : "bg-secondary-500") : "bg-slate-200"}`} />
                          ))}
                        </span>
                        <span className={`text-xs ${DEPTH[d].text} ${d ? fontMedium : fontRegular}`}>{d ? DEPTH[d].label : `Aim for ${TARGET_WORDS}+ words`}</span>
                        <span className={`ml-auto text-xs text-slate-400 ${fontRegular}`}>
                          {words} {words === 1 ? "word" : "words"}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}

              {allDone && (
                <li className="fade-up flex flex-col items-center gap-3 rounded-2xl bg-primary-50 px-6 py-8 text-center ring-1 ring-primary-300">
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary-700 text-white shadow-primary-glow">
                    <HugeiconsIcon icon={SparklesIcon} size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <p className={`text-17 text-slate-900 ${fontSemi}`}>Nice work, every question is answered</p>
                    <p className={`mt-1 text-sm text-slate-600 ${fontRegular}`}>Read through once more, then submit to get your feedback.</p>
                  </div>
                  <button type="button" onClick={submit} className={greenBtn}>
                    Submit assignment <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
                  </button>
                </li>
              )}
            </ol>
          ) : (
            <ol key="result" className="fade-up flex flex-col gap-4 px-3 py-5 md:px-8 md:py-6">
              <li className="flex flex-wrap gap-2">
                {[3, 2, 1].map((n) => {
                  const count = depths.filter((x) => (n === 1 ? x <= 1 : x === n)).length;
                  return (
                    <span key={n} className={`rounded-full px-3 py-1.5 text-xs ring-1 ${DEPTH[n].pill} ${fontMedium}`}>
                      {count} {DEPTH[n].label.toLowerCase()}
                    </span>
                  );
                })}
              </li>
              {ASSIGNMENT_QUESTIONS.map((q, i) => {
                const d = depths[i];
                return (
                  <li key={i} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                    <div className="p-4 md:p-6">
                      <div className="flex items-start gap-3.5">
                        <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-sm ${fontSemi} ${d === 3 ? "bg-primary-700 text-white" : "bg-slate-100 text-slate-600"}`}>{i + 1}</span>
                        <p className={`min-w-0 flex-1 pt-1 text-base leading-6 text-slate-900 ${fontSemi}`}>{q}</p>
                        <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs ring-1 sm:inline ${DEPTH[Math.max(d, 1)].pill} ${fontMedium}`}>{DEPTH[Math.max(d, 1)].label}</span>
                      </div>
                      <p className={`mt-3 whitespace-pre-wrap text-sm leading-6 md:pl-11.5 ${answers[i].trim() ? "text-slate-600" : "italic text-slate-400"} ${fontRegular}`}>{answers[i].trim() || "No answer"}</p>
                    </div>
                    <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-4 py-4 md:px-6">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                        <HugeiconsIcon icon={Comment01Icon} size={15} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className={`text-13 text-slate-900 ${fontSemi}`}>
                          Instructor feedback <span className={`sm:hidden ${DEPTH[Math.max(d, 1)].text}`}>· {DEPTH[Math.max(d, 1)].label}</span>
                        </p>
                        <p className={`mt-0.5 text-sm leading-6 text-slate-700 ${fontRegular}`}>{feedbackFor(answers[i], i)}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {read > 0.15 && (
          <button
            type="button"
            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="fade-up absolute bottom-20 right-6 flex size-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-popover ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <HugeiconsIcon icon={ArrowUp02Icon} size={18} aria-hidden="true" />
          </button>
        )}

        {/* Action bar: always visible under the questions. */}
        {confirming ? (
          <div role="alertdialog" aria-label="Unanswered questions" className="fade-up flex flex-wrap items-center gap-3 border-t border-secondary-500 bg-secondary-50 px-5 py-3 md:px-8">
            <HugeiconsIcon icon={Alert02Icon} size={18} className="text-secondary-600" aria-hidden="true" />
            <p className={`min-w-0 flex-1 text-sm text-slate-800 ${fontRegular}`}>
              {missing} {missing === 1 ? "question is" : "questions are"} still empty. Submit anyway?
            </p>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                jumpTo(answers.findIndex((a) => !a.trim()));
              }}
              className={lightBtn}
            >
              Keep writing
            </button>
            <button type="button" onClick={submit} className={darkBtn}>
              Submit anyway
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white px-5 py-3 md:px-8">
            {mode === "edit" ? (
              <>
                <p className={`min-w-0 flex-1 text-13 text-slate-500 ${fontRegular}`}>
                  <span className={`text-slate-900 ${fontSemi}`}>
                    {answered} of {total}
                  </span>{" "}
                  answered
                  {saving === "saving" && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      <HugeiconsIcon icon={Loading03Icon} size={13} className="animate-spin" aria-hidden="true" /> Saving…
                    </span>
                  )}
                  {saving === "saved" && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      <HugeiconsIcon icon={CloudSavingDone01Icon} size={13} aria-hidden="true" /> Draft saved
                    </span>
                  )}
                </p>
                <button type="button" onClick={allDone ? submit : () => setConfirming(true)} disabled={answered === 0} className={allDone ? greenBtn : darkBtn}>
                  Submit assignment
                </button>
              </>
            ) : (
              <>
                <p className={`flex min-w-0 flex-1 items-center gap-1.5 text-13 text-primary-700 ${fontMedium}`}>
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} aria-hidden="true" /> Submitted{submittedOn ? ` ${submittedOn}` : ""}
                </p>
                <button type="button" onClick={() => setMode("edit")} className={lightBtn}>
                  <HugeiconsIcon icon={PencilEdit02Icon} size={15} aria-hidden="true" /> Edit answers
                </button>
                {onNext && (
                  <button type="button" onClick={onNext} className={darkBtn}>
                    Next lesson <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
