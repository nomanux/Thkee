import { useEffect, useRef, useState } from "react";
import { fontMedium, fontRegular, fontSemi } from "../fonts";

export const ASSIGNMENT_QUESTIONS = [
  "Describe one product you use every day. Who is its main user, and what problem does it solve for them?",
  "Pick a screen from that product. List two usability problems you notice and explain why they cause friction.",
  "Write a short user persona (name, goal, frustration) for the person most affected by those problems.",
  "Propose a redesign for one of the problems. What would you change in the layout, wording or flow?",
  "How would you run a quick usability test to check that your redesign works? Describe the task and what you would measure.",
];

export type AssignmentState = { answers: string[]; submitted: boolean; submittedAt?: number };

const feedbackFor = (answer: string, i: number) => {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  if (words < 12) return "This answer is too short to show your thinking. Expand it with a concrete example and explain your reasoning in more detail.";
  if (words < 35)
    return [
      "Good start — you identified the key point. Add one specific example from the product to make it stronger.",
      "Clear observations. Next time, link each problem to a usability principle such as consistency or feedback.",
      "Nice persona basics. Add context about where and when they use the product to make it more useful for design.",
      "Solid idea. Sketch or describe the before/after so the change is easy for the team to picture.",
      "Reasonable test plan. Define a success metric (for example, task completion rate) before you start.",
    ][i % 5];
  return "Excellent, well-reasoned answer with clear examples. This is the level of detail we look for — keep it up!";
};

function Frame({ title, actions, children }: { title: string; actions: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-gradient-to-b from-[#5b1bf0] to-[#2a0480]">
      <div className="flex flex-wrap items-center gap-3 bg-[#2a0480] px-4 py-3 md:px-6">
        <p className={`min-w-0 flex-1 truncate text-[17px] text-white md:text-[20px] ${fontRegular}`}>{title}</p>
        {actions}
      </div>
      <div className="p-3 md:p-5">{children}</div>
    </div>
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
  const [mode, setMode] = useState<"edit" | "preview" | "result">(state?.submitted ? "result" : "edit");
  const [showAll, setShowAll] = useState(false);
  const [read, setRead] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setRead(0);
  }, [mode]);

  const answered = answers.filter((a) => a.trim()).length;
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setRead(max > 0 ? el.scrollTop / max : 0);
  };

  const cancel = () => {
    setAnswers(state?.answers ?? ASSIGNMENT_QUESTIONS.map(() => ""));
    notify("Changes discarded");
  };

  const submit = () => {
    onSave({ answers, submitted: true, submittedAt: Date.now() });
    setMode("result");
    notify("Assignment submitted — your instructor has reviewed it ✓");
  };

  const ghostBtn = `h-[38px] rounded-[6px] px-3 text-[14px] text-white transition hover:bg-white/10 ${fontMedium}`;
  const whiteBtn = `h-[38px] rounded-[6px] bg-white px-4 text-[14px] text-[#0f172a] transition hover:bg-[#f1f5f9] disabled:opacity-50 ${fontMedium}`;
  const yellowBtn = `h-[38px] rounded-[6px] bg-[#ffb20d] px-4 text-[14px] text-[#1e293b] transition hover:bg-[#faa104] disabled:opacity-50 ${fontMedium}`;

  const actions =
    mode === "edit" ? (
      <>
        <button type="button" onClick={cancel} className={ghostBtn}>
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onSave({ answers, submitted: false });
            setMode("preview");
          }}
          disabled={answered === 0}
          className={whiteBtn}
        >
          Preview
        </button>
      </>
    ) : mode === "preview" ? (
      <>
        <button type="button" onClick={() => setMode("edit")} className={whiteBtn}>
          Back to Edit
        </button>
        <button type="button" onClick={submit} className={yellowBtn}>
          Submit
        </button>
      </>
    ) : (
      <>
        <button
          type="button"
          onClick={() => {
            onSave({ answers, submitted: false });
            setMode("edit");
          }}
          className={ghostBtn}
        >
          Resubmit
        </button>
        {onNext && (
          <button type="button" onClick={onNext} className={yellowBtn}>
            Next Lecture
          </button>
        )}
      </>
    );

  const preview = showAll ? ASSIGNMENT_QUESTIONS : ASSIGNMENT_QUESTIONS.slice(0, 3);

  return (
    <Frame title={title} actions={actions}>
      <div className="relative overflow-hidden rounded-[8px] bg-white">
        <div ref={scrollRef} onScroll={onScroll} className="max-h-[560px] overflow-y-auto px-5 py-6 md:px-10 md:py-8">
          {mode === "edit" && (
            <ol key="edit" className="fade-up flex flex-col gap-8">
              {ASSIGNMENT_QUESTIONS.map((q, i) => (
                <li key={i} className="flex flex-col gap-4">
                  <label htmlFor={`asg-${i}`} className={`text-[16px] leading-[26px] text-[#1e293b] md:text-[17px] ${fontRegular}`}>
                    {i + 1}. {q}
                  </label>
                  <textarea
                    id={`asg-${i}`}
                    value={answers[i]}
                    onChange={(e) => setAnswers((a) => a.map((v, j) => (j === i ? e.target.value : v)))}
                    rows={4}
                    placeholder="Your Answer..."
                    className={`w-full resize-y rounded-[8px] border border-[#e2e8f0] px-4 py-3 text-[15px] leading-[24px] text-[#0f172a] outline-none placeholder:text-[#94a3b8] focus:border-[#5b1bf0] focus:ring-2 focus:ring-[#5b1bf0]/10 ${fontRegular}`}
                  />
                </li>
              ))}
              <p className={`text-[13px] text-[#64748b] ${fontRegular}`}>
                {answered}/{ASSIGNMENT_QUESTIONS.length} answered · Your answers are saved when you preview.
              </p>
            </ol>
          )}

          {mode === "preview" && (
            <div key="preview" className="fade-up flex flex-col gap-5">
              {preview.map((q, i) => (
                <div key={i} className="rounded-[6px] border border-dashed border-[#93c5fd] px-4 py-3">
                  <div className="grid grid-cols-[52px_1fr] gap-y-3">
                    <span className={`text-[15px] text-[#0f172a] ${fontSemi}`}>Ques:</span>
                    <span className={`text-[15px] text-[#0f172a] ${fontSemi}`}>{q}</span>
                    <span className={`text-[15px] text-[#0f172a] ${fontSemi}`}>Ans:</span>
                    <span className={`whitespace-pre-wrap text-[15px] leading-[26px] ${answers[i].trim() ? "text-[#475569]" : "italic text-[#dc2626]"} ${fontRegular}`}>
                      {answers[i].trim() || "Not answered yet"}
                    </span>
                  </div>
                </div>
              ))}
              {ASSIGNMENT_QUESTIONS.length > 3 && (
                <button type="button" onClick={() => setShowAll((v) => !v)} className={`flex h-[44px] items-center gap-2 self-center rounded-[8px] bg-[#f1f5f9] px-5 text-[15px] text-[#1e293b] hover:bg-[#e2e8f0] ${fontMedium}`}>
                  {showAll ? "Show less" : "Show more"}
                  <svg viewBox="0 0 24 24" className={`size-4 transition-transform ${showAll ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {mode === "result" && (
            <div key="result" className="fade-up flex flex-col gap-6">
              {ASSIGNMENT_QUESTIONS.map((q, i) => (
                <div key={i} className="overflow-hidden rounded-[8px] border border-[#e2e8f0]">
                  <div className="grid grid-cols-[44px_1fr] gap-y-3 bg-[#f1f5f9] px-4 py-4 md:grid-cols-[64px_1fr] md:px-6">
                    <span className={`text-[16px] text-[#0f172a] ${fontRegular}`}>Q{i + 1}:</span>
                    <span className={`text-[16px] text-[#1e293b] ${fontSemi}`}>{q}</span>
                    <span className={`text-[16px] text-[#94a3b8] ${fontRegular}`}>Ans:</span>
                    <span className={`whitespace-pre-wrap text-[15px] leading-[26px] text-[#475569] ${fontRegular}`}>{answers[i].trim() || "—"}</span>
                  </div>
                  <div className="px-4 py-4 md:px-6">
                    <div className="border-l-4 border-[#5b1bf0] pl-3">
                      <p className={`text-[15px] text-[#0f172a] ${fontSemi}`}>Instructor Feedback:</p>
                      <p className={`mt-1 text-[15px] leading-[24px] text-[#1e293b] ${fontRegular}`}>{feedbackFor(answers[i], i)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {read > 0.05 && (
          <button
            type="button"
            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="fade-up absolute bottom-5 right-6 flex size-10 items-center justify-center rounded-full bg-white text-[#0f172a] shadow-[0_6px_16px_rgba(15,23,42,0.18)] transition hover:scale-105"
          >
            <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90" aria-hidden="true">
              <circle cx="20" cy="20" r="18" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
              <circle cx="20" cy="20" r="18" fill="none" stroke="#ffb20d" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${read * 113.1} 113.1`} />
            </svg>
            <svg viewBox="0 0 24 24" className="relative size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 19V5M6 11l6-6 6 6" />
            </svg>
          </button>
        )}
      </div>
    </Frame>
  );
}
