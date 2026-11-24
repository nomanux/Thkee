import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Award01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  CloudSavingDone01Icon,
  Comment01Icon,
  Idea01Icon,
  InformationCircleIcon,
  Loading03Icon,
  PencilEdit02Icon,
  Search01Icon,
  TestTube01Icon,
  Tick02Icon,
  UserIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { fontBold, fontMedium, fontRegular, fontSemi } from "../fonts";

export const ASSIGNMENT_QUESTIONS = [
  "Describe one product you use every day. Who is its main user, and what problem does it solve for them?",
  "Pick a screen from that product. List two usability problems you notice and explain why they cause friction.",
  "Write a short user persona (name, goal, frustration) for the person most affected by those problems.",
  "Propose a redesign for one of the problems. What would you change in the layout, wording or flow?",
  "How would you run a quick usability test to check that your redesign works? Describe the task and what you would measure.",
];

export type AssignmentState = { answers: string[]; submitted: boolean; submittedAt?: number };

// Each question is one stage of the design-thinking journey.
const STAGES = [
  { name: "Observe", icon: ViewIcon, tag: "bg-sky-100 text-sky-800", dot: "bg-sky-500", tile: "bg-sky-50 text-sky-700", hint: "Name the product, then describe the person who uses it most and the moment they reach for it." },
  { name: "Analyse", icon: Search01Icon, tag: "bg-orange-100 text-orange-800", dot: "bg-orange-500", tile: "bg-orange-50 text-orange-700", hint: "Look for slow steps, unclear labels or hidden buttons. Say what the user expects and what happens instead." },
  { name: "Empathise", icon: UserIcon, tag: "bg-rose-100 text-rose-800", dot: "bg-rose-500", tile: "bg-rose-50 text-rose-700", hint: "Give the persona a real name, one clear goal and one frustration linked to the problems above." },
  { name: "Ideate", icon: Idea01Icon, tag: "bg-secondary-100 text-slate-800", dot: "bg-secondary-500", tile: "bg-secondary-50 text-secondary-600", hint: "Describe the change as before and after. Say why the new version removes the friction." },
  { name: "Test", icon: TestTube01Icon, tag: "bg-primary-200 text-primary-800", dot: "bg-primary-600", tile: "bg-primary-50 text-primary-700", hint: "Write the task you would give a tester, then pick one number to measure, such as time on task or success rate." },
];

const TARGET_WORDS = 35;
const total = ASSIGNMENT_QUESTIONS.length;
const blank = () => ASSIGNMENT_QUESTIONS.map(() => "");
const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const depthOf = (a: string): number => {
  const w = countWords(a);
  return w === 0 ? 0 : w < 12 ? 1 : w < TARGET_WORDS ? 2 : 3;
};
const DEPTH = [
  { label: "Not answered", pill: "bg-slate-100 text-slate-500", bar: "bg-slate-200" },
  { label: "Needs more detail", pill: "bg-orange-100 text-orange-800", bar: "bg-orange-500" },
  { label: "Good", pill: "bg-slate-100 text-slate-800", bar: "bg-slate-800" },
  { label: "Excellent", pill: "bg-primary-100 text-primary-800", bar: "bg-primary-600" },
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

function StageTile({ i, size = "md" }: { i: number; size?: "md" | "lg" }) {
  const s = STAGES[i];
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-xl ${s.tile} ${size === "lg" ? "size-12" : "size-9"}`}>
      <HugeiconsIcon icon={s.icon} size={size === "lg" ? 22 : 18} aria-hidden="true" />
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
  const started = (state?.answers ?? []).some((a) => a.trim());
  const [mode, setMode] = useState<"intro" | "edit" | "review" | "result">(state?.submitted ? "result" : started ? "edit" : "intro");
  const [current, setCurrent] = useState(() => {
    const i = (state?.answers ?? []).findIndex((a) => !a.trim());
    return i === -1 ? 0 : i;
  });
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSaved = useRef(JSON.stringify(state?.answers ?? blank()));

  const answered = answers.filter((a) => a.trim()).length;
  const missing = total - answered;
  const depths = answers.map(depthOf);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    if (mode === "edit") inputRef.current?.focus({ preventScroll: true });
  }, [mode, current]);

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

  const flush = () => {
    onSave({ answers, submitted: false });
    lastSaved.current = JSON.stringify(answers);
  };
  const goReview = () => {
    flush();
    setMode("review");
  };
  const next = () => (current === total - 1 ? goReview() : setCurrent((c) => c + 1));
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

  const darkBtn = `flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-15 text-white transition hover:bg-slate-700 active:scale-98 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 ${fontSemi}`;
  const greenBtn = `flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-700 px-5 text-15 text-white shadow-primary-button transition hover:bg-primary-800 active:scale-98 ${fontSemi}`;
  const ghostBtn = `flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-15 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 ${fontMedium}`;
  const outlineBtn = `flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-15 text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-50 ${fontMedium}`;

  const submittedOn = state?.submittedAt ? new Date(state.submittedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";
  const score = Math.round((depths.reduce((s, d) => s + [0, 0.3, 0.7, 1][d], 0) / total) * 100);
  const words = countWords(answers[current]);
  const d = depths[current];
  const stage = STAGES[current];

  return (
    <div className="bg-slate-100 p-3 md:p-5">
      <div className="flex h-150 flex-col overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-slate-200">
        {/* ───────── Intro ───────── */}
        {mode === "intro" && (
          <div key="intro" className="fade-up flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10 text-center">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-popover">
              <HugeiconsIcon icon={Award01Icon} size={30} aria-hidden="true" />
            </span>
            <p className={`mt-5 text-xs uppercase tracking-widest text-slate-500 ${fontSemi}`}>Practice challenge</p>
            <h2 className={`mt-2 max-w-xl text-2xl text-slate-900 md:text-3xl ${fontBold}`}>{title}</h2>
            <p className={`mt-3 max-w-lg text-15 leading-6 text-slate-600 ${fontRegular}`}>
              Pick a product you use every day and take it through five design-thinking stages. Answer in your own words. There are no wrong answers.
            </p>

            {/* Journey: the five stages joined by a line. */}
            <ol className="relative mt-8 flex w-full max-w-xl items-start justify-between">
              <span className="absolute left-6 right-6 top-6 h-0.5 bg-slate-200" aria-hidden="true" />
              {STAGES.map((s, i) => (
                <li key={s.name} className="relative flex w-16 flex-col items-center gap-2">
                  <span className="rounded-xl bg-white p-0.5">
                    <StageTile i={i} size="lg" />
                  </span>
                  <span className={`text-xs text-slate-700 ${fontMedium}`}>{s.name}</span>
                </li>
              ))}
            </ol>

            <div className={`mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-13 text-slate-500 ${fontRegular}`}>
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Clock01Icon} size={15} aria-hidden="true" /> About 20 min
              </span>
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={CloudSavingDone01Icon} size={15} aria-hidden="true" /> Saves as you type
              </span>
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Comment01Icon} size={15} aria-hidden="true" /> Instructor feedback
              </span>
            </div>

            <button type="button" onClick={() => setMode("edit")} className={`${darkBtn} mt-8 px-8`}>
              Start challenge <HugeiconsIcon icon={ArrowRight01Icon} size={18} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* ───────── One question at a time ───────── */}
        {mode === "edit" && (
          <>
            <div className="flex items-center gap-4 px-5 pt-4 md:px-8 md:pt-5">
              <div className="flex flex-1 gap-1.5" role="list" aria-label="Stages">
                {STAGES.map((s, i) => (
                  <button
                    key={s.name}
                    type="button"
                    role="listitem"
                    onClick={() => setCurrent(i)}
                    aria-label={`${s.name}${answers[i].trim() ? ", answered" : ""}`}
                    aria-current={i === current ? "step" : undefined}
                    className="group flex-1 py-2"
                  >
                    <span className={`block h-2 rounded-full transition-all duration-300 group-hover:opacity-80 ${answers[i].trim() ? "bg-primary-600" : i === current ? "bg-slate-900" : "bg-slate-200"}`} />
                  </button>
                ))}
              </div>
              <span className={`hidden shrink-0 items-center gap-1 text-xs text-slate-400 sm:flex ${fontRegular}`}>
                {saving === "saving" ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} size={13} className="animate-spin" aria-hidden="true" /> Saving…
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={CloudSavingDone01Icon} size={13} aria-hidden="true" /> {saving === "saved" ? "Saved" : "Autosave on"}
                  </>
                )}
              </span>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-8">
              <div key={current} className="fade-up mx-auto flex max-w-2xl flex-col">
                <div className="flex items-center gap-3">
                  <StageTile i={current} />
                  <span className={`rounded-full px-2.5 py-1 text-11 uppercase tracking-wider ${stage.tag} ${fontBold}`}>
                    Stage {current + 1} · {stage.name}
                  </span>
                </div>
                <label htmlFor={`asg-${current}`} className={`mt-4 text-lg leading-7 text-slate-900 md:text-xl md:leading-8 ${fontBold}`}>
                  {ASSIGNMENT_QUESTIONS[current]}
                </label>

                <div className="mt-4 flex gap-2.5 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                  <HugeiconsIcon icon={InformationCircleIcon} size={18} className="mt-0.5 shrink-0 text-slate-500" aria-hidden="true" />
                  <p className={`text-sm leading-5.5 text-slate-600 ${fontRegular}`}>{stage.hint}</p>
                </div>

                <textarea
                  ref={inputRef}
                  id={`asg-${current}`}
                  value={answers[current]}
                  onChange={(e) => setAnswers((a) => a.map((v, j) => (j === current ? e.target.value : v)))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      next();
                    }
                  }}
                  rows={5}
                  placeholder="Type your answer…"
                  className="field field-sizing-content mt-5 min-h-36 rounded-2xl px-4 py-3.5 text-base leading-7"
                />

                <div className="mt-3 flex items-center gap-3">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                    <span className={`block h-full rounded-full transition-all duration-300 ${DEPTH[d].bar}`} style={{ width: `${Math.min(words / TARGET_WORDS, 1) * 100}%` }} />
                  </span>
                  <span className={`shrink-0 text-xs ${d === 3 ? `text-primary-700 ${fontSemi}` : `text-slate-500 ${fontRegular}`}`}>
                    {d === 0 ? `Aim for ${TARGET_WORDS}+ words` : d === 3 ? `${words} words · great depth` : `${words} / ${TARGET_WORDS} words`}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-4 py-3 md:px-8">
              {current > 0 ? (
                <button type="button" onClick={() => setCurrent((c) => c - 1)} className={ghostBtn}>
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={18} aria-hidden="true" /> Back
                </button>
              ) : (
                <span />
              )}
              <span className={`mx-auto hidden text-13 text-slate-400 md:inline ${fontRegular}`}>
                {current + 1} of {total} · Ctrl + Enter to continue
              </span>
              {!answers[current].trim() && current < total - 1 && (
                <button type="button" onClick={next} className={`${ghostBtn} ml-auto md:ml-0`}>
                  Skip
                </button>
              )}
              <button type="button" onClick={next} disabled={!answers[current].trim() && current < total - 1} className={`${darkBtn} ${answers[current].trim() || current === total - 1 ? "ml-auto md:ml-0" : ""}`}>
                {current === total - 1 ? "Review answers" : "Continue"} <HugeiconsIcon icon={ArrowRight01Icon} size={18} aria-hidden="true" />
              </button>
            </div>
          </>
        )}

        {/* ───────── Review ───────── */}
        {mode === "review" && (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-7 md:px-10 md:py-9">
              <div className="fade-up mx-auto max-w-3xl">
                <p className={`text-xs uppercase tracking-widest text-slate-500 ${fontSemi}`}>Review</p>
                <h2 className={`mt-1.5 text-2xl text-slate-900 ${fontBold}`}>{missing ? "Almost there" : "Ready to submit"}</h2>
                <p className={`mt-1.5 text-15 text-slate-600 ${fontRegular}`}>
                  {missing ? `${missing} ${missing === 1 ? "stage is" : "stages are"} still empty. Fill ${missing === 1 ? "it" : "them"} in for better feedback, or submit as is.` : "You answered every stage. Give it one last read, then submit."}
                </p>

                <ol className="mt-6 grid gap-3 md:grid-cols-2">
                  {ASSIGNMENT_QUESTIONS.map((q, i) => {
                    const a = answers[i].trim();
                    return (
                      <li key={i} className={i === total - 1 ? "md:col-span-2" : ""}>
                        <button
                          type="button"
                          onClick={() => editAt(i)}
                          className={`group flex h-full w-full flex-col rounded-2xl p-4 text-left ring-1 transition hover:-translate-y-0.5 hover:shadow-panel ${a ? "bg-white ring-slate-200" : "bg-orange-50 ring-orange-200"}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <StageTile i={i} />
                            <span className={`flex-1 text-sm text-slate-900 ${fontSemi}`}>{STAGES[i].name}</span>
                            {a ? (
                              <span className="flex size-6 items-center justify-center rounded-full bg-primary-600 text-white">
                                <HugeiconsIcon icon={Tick02Icon} size={14} strokeWidth={2.4} aria-label="Answered" />
                              </span>
                            ) : (
                              <HugeiconsIcon icon={Alert02Icon} size={18} className="text-orange-600" aria-label="Not answered" />
                            )}
                          </div>
                          <p className={`mt-3 line-clamp-2 text-13 leading-5 text-slate-500 ${fontRegular}`}>{q}</p>
                          <p className={`mt-2 line-clamp-3 text-sm leading-5.5 ${a ? "text-slate-800" : "italic text-orange-700"} ${fontRegular}`}>{a || "No answer yet. Tap to add one."}</p>
                          <span className={`mt-3 flex items-center gap-1 text-13 text-slate-500 transition group-hover:text-slate-900 ${fontMedium}`}>
                            <HugeiconsIcon icon={PencilEdit02Icon} size={14} aria-hidden="true" /> {a ? "Edit" : "Add answer"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-4 py-3 md:px-8">
              <button type="button" onClick={() => editAt(current)} className={ghostBtn}>
                <HugeiconsIcon icon={ArrowLeft01Icon} size={18} aria-hidden="true" /> Keep editing
              </button>
              <button type="button" onClick={submit} className={`${missing ? darkBtn : greenBtn} ml-auto`}>
                {missing ? "Submit anyway" : "Submit assignment"}
              </button>
            </div>
          </>
        )}

        {/* ───────── Result ───────── */}
        {mode === "result" && (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              <div className="fade-up bg-slate-900 px-5 py-8 text-white md:px-10">
                <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-6">
                  <div className="relative flex size-24 shrink-0 items-center justify-center">
                    <svg viewBox="0 0 96 96" className="absolute inset-0 -rotate-90" aria-hidden="true">
                      <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                      <circle cx="48" cy="48" r="40" fill="none" stroke="#ffb20d" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(score / 100) * 251.3} 251.3`} />
                    </svg>
                    <span className={`text-2xl ${fontBold}`}>{score}%</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`flex items-center gap-1.5 text-13 text-white/60 ${fontMedium}`}>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} aria-hidden="true" /> Submitted{submittedOn ? ` ${submittedOn}` : ""}
                    </p>
                    <h2 className={`mt-1 text-2xl ${fontBold}`}>{score >= 80 ? "Outstanding work" : score >= 50 ? "Solid effort" : "Good first attempt"}</h2>
                    <p className={`mt-1 text-sm leading-5.5 text-white/70 ${fontRegular}`}>Your instructor left a note on every stage. Use it to sharpen your next attempt.</p>
                  </div>
                </div>
                <div className="mx-auto mt-6 flex max-w-3xl gap-1.5">
                  {STAGES.map((s, i) => (
                    <div key={s.name} className="flex-1">
                      <span className={`block h-1.5 rounded-full ${depths[i] === 3 ? "bg-primary-400" : depths[i] === 2 ? "bg-white" : depths[i] === 1 ? "bg-orange-500" : "bg-white/20"}`} />
                      <p className={`mt-1.5 truncate text-11 text-white/60 ${fontMedium}`}>{s.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              <ol className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-6 md:px-0">
                {ASSIGNMENT_QUESTIONS.map((q, i) => {
                  const dd = Math.max(depths[i], 1);
                  return (
                    <li key={i} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                      <div className="p-4 md:p-5">
                        <div className="flex items-center gap-2.5">
                          <StageTile i={i} />
                          <span className={`flex-1 text-sm text-slate-900 ${fontSemi}`}>{STAGES[i].name}</span>
                          <span className={`rounded-full px-2.5 py-1 text-xs ${DEPTH[dd].pill} ${fontSemi}`}>{DEPTH[dd].label}</span>
                        </div>
                        <p className={`mt-3 text-15 leading-6 text-slate-900 ${fontSemi}`}>{q}</p>
                        <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${answers[i].trim() ? "text-slate-600" : "italic text-slate-400"} ${fontRegular}`}>{answers[i].trim() || "No answer"}</p>
                      </div>
                      <div className="flex gap-3 bg-slate-50 px-4 py-4 md:px-5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                          <HugeiconsIcon icon={Comment01Icon} size={15} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className={`text-13 text-slate-900 ${fontSemi}`}>Instructor feedback</p>
                          <p className={`mt-0.5 text-sm leading-6 text-slate-700 ${fontRegular}`}>{feedbackFor(answers[i], i)}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
            <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-4 py-3 md:px-8">
              <button type="button" onClick={() => editAt(0)} className={outlineBtn}>
                <HugeiconsIcon icon={PencilEdit02Icon} size={16} aria-hidden="true" /> Improve and resubmit
              </button>
              {onNext && (
                <button type="button" onClick={onNext} className={`${darkBtn} ml-auto`}>
                  Next lesson <HugeiconsIcon icon={ArrowRight01Icon} size={18} aria-hidden="true" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
