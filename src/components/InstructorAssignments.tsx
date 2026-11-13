import { useEffect, useMemo, useState } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  PencilEdit02Icon,
  Search01Icon,
  SparklesIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { fontBold, fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, openInstructorAssignments, save, useApp } from "../store";
import { FilterSelect } from "./Menus";
import { buttonClass } from "./Button";

const imgChecked = "/assets/70227.svg";
const imgDevon = "/assets/1a400.png";

const DATABASE_ANSWER =
  "A database is an organised collection of data that is stored electronically and can be accessed, managed, and updated easily. Databases can store a wide variety of data, from simple text to complex records, and are used in applications ranging from websites to enterprise systems. A database is an organized collection of data that is stored electronically and can be accessed, managed, and updated easily. Databases can store a wide variety of data, from simple text to complex records, and are used in applications ranging from websites to enterprise systems.";
const DATA_TYPES_ANSWER =
  "A Course Database contains various types of information, such as course details (ID, title, description), instructor data, student records, class schedules, enrollment information, and grades. These elements help manage the academic structure, ensuring accurate tracking of students, courses, and instructors, which is essential for the smooth operation of an educational institution.";
const RELATIONSHIP_ANSWER =
  "In a Course Database, there is typically a one-to-many relationship between instructors and courses. An instructor can teach multiple courses, but each course is generally taught by one instructor. This relationship is represented by linking the Instructor ID in the Course Table, allowing for effective management of instructor assignments and course oversight.";

const QUESTIONS = [
  { question: "What is Database Management", answer: DATABASE_ANSWER },
  {
    question:
      "What types of data would you typically find in a Course Database?",
    answer: DATA_TYPES_ANSWER,
  },
  {
    question:
      "What is the relationship between Courses and Instructors in a Course Database?",
    answer: RELATIONSHIP_ANSWER,
  },
  {
    question:
      "What types of data would you typically find in a Course Database?",
    answer: DATA_TYPES_ANSWER,
  },
  {
    question:
      "What is the relationship between Courses and Instructors in a Course Database?",
    answer: RELATIONSHIP_ANSWER,
  },
];

type AiSuggestion = {
  verdict: "correct" | "needs-work";
  confidence: number;
  reason: string;
  feedback?: string;
};

// Mock results until the grading model is connected.
const AI_SUGGESTIONS: AiSuggestion[] = [
  {
    verdict: "needs-work",
    confidence: 84,
    reason: "The definition is right, but the same paragraph is written twice and there is no example.",
    feedback:
      "Good definition. Remove the repeated paragraph and add one real example, such as how a school stores student records.",
  },
  {
    verdict: "correct",
    confidence: 94,
    reason: "Covers course, instructor, student, schedule and enrollment data.",
  },
  {
    verdict: "correct",
    confidence: 91,
    reason: "Explains the one-to-many relationship and how the Instructor ID links the tables.",
  },
  {
    verdict: "correct",
    confidence: 93,
    reason: "Lists the main data types a course database holds.",
  },
  {
    verdict: "needs-work",
    confidence: 68,
    reason: "Mostly correct, but it says each course has one instructor. Many courses are co-taught.",
    feedback:
      "Right idea. Mention that some courses have more than one instructor, which makes it a many-to-many relationship with a linking table.",
  },
];

type AiStatus = "idle" | "checking" | "done";

type Submission = {
  id: string;
  student: string;
  photo?: string;
  color: string;
  posted: string;
  course: string;
  assignment: string;
};

const SUBMISSIONS: Submission[] = [
  {
    id: "sub-1",
    student: "Devon Lane",
    photo: imgDevon,
    color: "#1e293b",
    posted: "1 month ago",
    course: "Database Management Systems",
    assignment: "JS Assignment -01",
  },
  {
    id: "sub-2",
    student: "Devon Lane",
    photo: imgDevon,
    color: "#1e293b",
    posted: "1 month ago",
    course: "Object oriented Java programming",
    assignment: "JS Assignment -01",
  },
  {
    id: "sub-7",
    student: "Devon Lane",
    photo: imgDevon,
    color: "#1e293b",
    posted: "1 month ago",
    course: "Database Management Systems",
    assignment: "JS Assignment -02",
  },
  {
    id: "sub-3",
    student: "Rachel Green",
    color: "#7c3aed",
    posted: "1 month ago",
    course: "Database Management Systems",
    assignment: "JS Assignment -01",
  },
  {
    id: "sub-4",
    student: "Marcus Bell",
    color: "#0891b2",
    posted: "3 weeks ago",
    course: "Database Management Systems",
    assignment: "JS Assignment -01",
  },
  {
    id: "sub-5",
    student: "Priya Nair",
    color: "#db2777",
    posted: "2 weeks ago",
    course: "Object oriented Java programming",
    assignment: "JS Assignment -01",
  },
  {
    id: "sub-6",
    student: "Omar Haddad",
    color: "#16a34a",
    posted: "5 days ago",
    course: "Object oriented Java programming",
    assignment: "JS Assignment -01",
  },
];

const COURSES = [...new Set(SUBMISSIONS.map((s) => s.course))];

type QuestionReview = { correct?: boolean; feedback?: string; author?: string; ai?: boolean };
type SubmissionReview = {
  checked: boolean;
  questions: Record<number, QuestionReview>;
};
type ReviewStore = Record<string, SubmissionReview>;

const STORE_KEY = "thkee.instructorAssignments";
const EMPTY_REVIEW: SubmissionReview = { checked: false, questions: {} };

const sampleFeedback = (author: string): QuestionReview => ({
  author,
  feedback:
    "This question is not written appropriately. You need to improve this. And try to write more elaborately.",
});
const gradedReview: SubmissionReview = {
  checked: true,
  questions: {
    0: sampleFeedback("Alice Jordan"),
    1: { correct: true },
    2: sampleFeedback("Alice Jordan"),
    3: { correct: true },
    4: sampleFeedback("Alice Jordan"),
  },
};
const allCorrectReview: SubmissionReview = {
  checked: true,
  questions: Object.fromEntries(
    QUESTIONS.map((_, i) => [i, { correct: true }]),
  ),
};
const INITIAL_REVIEWS: ReviewStore = {
  "sub-2": gradedReview,
  "sub-7": gradedReview,
  "sub-4": allCorrectReview,
  "sub-6": gradedReview,
};

const loadReviews = (): ReviewStore => ({
  ...INITIAL_REVIEWS,
  ...load<ReviewStore>(STORE_KEY, {}),
});

export const uncheckedSubmissionCount = () => {
  const reviews = loadReviews();
  return SUBMISSIONS.filter((s) => !reviews[s.id]?.checked).length;
};

const isReviewed = (review?: QuestionReview) =>
  Boolean(review?.correct || review?.feedback);

// Shared checkbox, used by other instructor pages too.
export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      {checked ? (
        <img
          src={imgChecked}
          alt=""
          width={16}
          height={16}
          className="size-4 shrink-0 rounded-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-slate-800"
        />
      ) : (
        <span className="size-4 shrink-0 rounded-sm border border-slate-300 bg-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-slate-800" />
      )}
      {children}
    </label>
  );
}

function Icon({
  icon,
  size = 18,
  className = "",
}: {
  icon: IconSvgElement;
  size?: number;
  className?: string;
}) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={1.8}
      className={className}
      aria-hidden="true"
    />
  );
}

function Avatar({
  submission,
  large = false,
}: {
  submission: Submission;
  large?: boolean;
}) {
  const size = large ? "size-11 text-sm" : "size-10 text-xs";
  return submission.photo ? (
    <img
      src={submission.photo}
      alt=""
      className={`${size} shrink-0 rounded-full object-cover`}
    />
  ) : (
    <span
      aria-hidden="true"
      className={`flex ${size} shrink-0 items-center justify-center rounded-full text-white ${fontBold}`}
      style={{ backgroundColor: submission.color }}
    >
      {submission.student
        .split(" ")
        .map((p) => p[0])
        .join("")}
    </span>
  );
}

// Counts for one submission: how many questions are reviewed, marked correct, or have feedback.
function tally(review?: SubmissionReview) {
  const qs = QUESTIONS.map((_, i) => review?.questions[i]);
  return {
    reviewed: qs.filter(isReviewed).length,
    correct: qs.filter((q) => q?.correct).length,
    feedback: qs.filter((q) => q?.feedback).length,
  };
}

/* ------------------------------------------------------------------ list */

type Tab = "todo" | "done" | "all";

function SubmissionRow({
  submission,
  review,
}: {
  submission: Submission;
  review?: SubmissionReview;
}) {
  const checked = Boolean(review?.checked);
  const t = tally(review);
  const inProgress = !checked && t.reviewed > 0;
  return (
    <li>
      <button
        type="button"
        onClick={() => openInstructorAssignments(submission.id)}
        className="group flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-slate-25 md:px-5"
      >
        <Avatar submission={submission} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={`truncate text-sm text-slate-900 ${fontSemi}`}>
            {submission.student}
          </span>
          <span className={`truncate text-13 text-slate-500 ${fontRegular}`}>
            {submission.assignment} · {submission.course}
          </span>
        </span>
        <span
          className={`hidden w-32 shrink-0 items-center gap-1.5 text-13 text-slate-500 md:flex ${fontRegular}`}
        >
          <Icon icon={Clock01Icon} size={14} />
          {submission.posted}
        </span>
        <span className="hidden w-44 shrink-0 flex-col items-start gap-1 sm:flex">
          {checked ? (
            <>
              <span
                className={`flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs text-primary-700 ${fontSemi}`}
              >
                <Icon icon={Tick02Icon} size={12} />
                Reviewed
              </span>
              <span className={`text-xs text-slate-500 ${fontRegular}`}>
                {t.correct} correct
                {t.feedback ? ` · ${t.feedback} with feedback` : ""}
              </span>
            </>
          ) : (
            <>
              <span
                className={`flex items-center gap-1.5 rounded-full bg-secondary-50 px-2.5 py-0.5 text-xs text-secondary-800 ${fontSemi}`}
              >
                <span
                  className="size-1.5 rounded-full bg-secondary-500"
                  aria-hidden="true"
                />
                {inProgress ? "In progress" : "To review"}
              </span>
              <span className={`text-xs text-slate-500 ${fontRegular}`}>
                {t.reviewed} of {QUESTIONS.length} questions
              </span>
            </>
          )}
        </span>
        <span
          className={`${buttonClass(checked ? "secondary" : "yellow", "md")} w-24`}
        >
          {checked ? "View" : inProgress ? "Continue" : "Review"}
        </span>
      </button>
    </li>
  );
}

function SubmissionList({
  reviews,
  course,
  setCourse,
  tab,
  setTab,
}: {
  reviews: ReviewStore;
  course: string;
  setCourse: (course: string) => void;
  tab: Tab;
  setTab: (tab: Tab) => void;
}) {
  const [query, setQuery] = useState("");
  const isChecked = (s: Submission) => Boolean(reviews[s.id]?.checked);
  const inCourse =
    course === "all"
      ? SUBMISSIONS
      : SUBMISSIONS.filter((s) => s.course === course);
  const todo = inCourse.filter((s) => !isChecked(s));
  const done = inCourse.filter(isChecked);
  const byTab = tab === "todo" ? todo : tab === "done" ? done : inCourse;
  const q = query.trim().toLowerCase();
  const visible = q
    ? byTab.filter((s) =>
        `${s.student} ${s.assignment} ${s.course}`.toLowerCase().includes(q),
      )
    : byTab;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "todo", label: "To review", count: todo.length },
    { key: "done", label: "Reviewed", count: done.length },
    { key: "all", label: "All", count: inCourse.length },
  ];

  return (
    <div className="flex flex-col gap-5 px-4 pb-10 pt-6 md:px-7">
      {todo.length > 0 && (
        <section className="flex flex-col gap-4 rounded-2xl bg-primary-900 p-5 text-white sm:flex-row sm:items-center md:p-6">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className={`m-0 text-lg ${fontSemi}`}>
              {todo.length}{" "}
              {todo.length === 1 ? "submission is" : "submissions are"} waiting
              for you
            </p>
            {/* <p className={`m-0 text-sm text-primary-200 ${fontRegular}`}>Oldest first. Each takes about 5 minutes. Students see your feedback as soon as you submit the grade.</p> */}
          </div>
          <button
            type="button"
            onClick={() => openInstructorAssignments(todo[0].id)}
            className={buttonClass("yellow", "lg")}
          >
            Start reviewing
            <Icon icon={ArrowRight01Icon} size={16} />
          </button>
        </section>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div
          role="tablist"
          aria-label="Submissions"
          className="flex shrink-0 rounded-xl bg-slate-100 p-1"
        >
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={`flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-sm transition ${active ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"} ${active ? fontSemi : fontMedium}`}
              >
                {t.label}
                <span
                  className={`text-xs tabular-nums ${active ? "text-slate-500" : "text-slate-400"}`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
        <label className="field-box h-10 min-w-0 flex-1 lg:max-w-sm">
          <Icon
            icon={Search01Icon}
            size={16}
            className="shrink-0 text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student or assignment"
            aria-label="Search submissions"
            className={`min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 ${fontRegular}`}
          />
        </label>
        <div className="lg:ml-auto">
          <FilterSelect
            alignRight
            label="Course"
            value={course}
            onChange={setCourse}
            options={[
              { value: "all", label: "All courses" },
              ...COURSES.map((name) => ({ value: name, label: name })),
            ]}
          />
        </div>
      </div>

      {visible.length > 0 ? (
        <ul className="m-0 list-none divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0">
          {visible.map((s) => (
            <SubmissionRow key={s.id} submission={s} review={reviews[s.id]} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          {tab === "todo" && !q ? (
            <>
              <span className="flex size-12 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                <Icon icon={CheckmarkCircle02Icon} size={24} />
              </span>
              <p className={`m-0 text-base text-slate-900 ${fontSemi}`}>
                You're all caught up
              </p>
              <p className={`m-0 text-sm text-slate-500 ${fontRegular}`}>
                No submissions are waiting for review
                {course === "all" ? "" : " in this course"}.
              </p>
            </>
          ) : (
            <>
              <p className={`m-0 text-sm text-slate-500 ${fontRegular}`}>
                No submissions match these filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCourse("all");
                  setTab("all");
                  setQuery("");
                }}
                className={buttonClass("secondary", "md")}
              >
                Clear filters
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- review */

function QuestionCard({
  index,
  question,
  answer,
  review,
  draft,
  locked,
  onStartFeedback,
  onDraft,
  onCancel,
  onSave,
  onToggleCorrect,
  suggestion,
  aiChecking,
  onAcceptAi,
  onEditAi,
  onDismissAi,
  onUndo,
}: {
  index: number;
  question: string;
  answer: string;
  review?: QuestionReview;
  draft?: string;
  locked: boolean;
  onStartFeedback: () => void;
  onDraft: (text: string) => void;
  onCancel: () => void;
  onSave: () => void;
  onToggleCorrect: () => void;
  suggestion?: AiSuggestion;
  aiChecking: boolean;
  onAcceptAi: () => void;
  onEditAi: () => void;
  onDismissAi: () => void;
  onUndo: () => void;
}) {
  const state = review?.correct
    ? "correct"
    : review?.feedback
      ? "feedback"
      : "open";
  const ring =
    draft !== undefined
      ? "border-primary-300 shadow-md"
      : state === "correct"
        ? "border-primary-200"
        : state === "feedback"
          ? "border-secondary-200"
          : "border-slate-200";
  return (
    <article
      id={`review-q-${index}`}
      className={`scroll-mt-24 overflow-hidden rounded-2xl border bg-white transition ${ring}`}
    >
      <div className="flex flex-col gap-3 p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`text-xs uppercase tracking-label text-slate-500 ${fontSemi}`}
          >
            Question {index + 1}
          </span>
          {state === "correct" && (
            <span
              className={`flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs text-primary-700 ${fontSemi}`}
            >
              <Icon icon={Tick02Icon} size={12} />
              Correct
            </span>
          )}
          {state === "feedback" && (
            <span
              className={`rounded-full bg-secondary-50 px-2.5 py-0.5 text-xs text-secondary-800 ${fontSemi}`}
            >
              Feedback given
            </span>
          )}
          {state === "open" && (
            <span
              className={`rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 ${fontSemi}`}
            >
              Not reviewed
            </span>
          )}
        </div>
        <h3 className={`m-0 text-base leading-snug text-slate-900 ${fontSemi}`}>
          {question}
        </h3>
        <div className="flex flex-col gap-1.5">
          <span className={`text-xs text-slate-500 ${fontMedium}`}>
            Student's answer
          </span>
          <p
            className={`m-0 rounded-xl bg-slate-25 px-4 py-3.5 text-sm leading-6 text-slate-700 ${fontRegular}`}
          >
            {answer}
          </p>
        </div>
      </div>

      {!locked && draft === undefined && state === "open" && aiChecking && (
        <div
          className={`flex items-center gap-2.5 border-t border-ai-100 bg-ai-50 px-5 py-3.5 text-13 text-ai-800 md:px-6 ${fontMedium}`}
        >
          <Icon icon={SparklesIcon} size={16} className="animate-pulse" />
          Checking this answer…
        </div>
      )}

      {!locked && draft === undefined && state === "open" && !aiChecking && suggestion && (
        <div className="flex flex-col gap-2.5 border-t border-ai-100 bg-ai-50 px-5 py-4 md:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`flex items-center gap-1.5 text-xs text-ai-800 ${fontSemi}`}>
              <Icon icon={SparklesIcon} size={14} />
              AI suggestion
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${fontSemi} ${
                suggestion.verdict === "correct"
                  ? "bg-primary-100 text-primary-800"
                  : "bg-secondary-100 text-secondary-800"
              }`}
            >
              {suggestion.verdict === "correct" ? "Looks correct" : "Needs work"}
            </span>
            <span
              className={`text-xs tabular-nums ${suggestion.confidence < 75 ? "text-secondary-800" : "text-slate-500"} ${fontRegular}`}
            >
              {suggestion.confidence}% sure
              {suggestion.confidence < 75 ? ", please double-check" : ""}
            </span>
          </div>
          <p className={`m-0 text-sm leading-6 text-slate-700 ${fontRegular}`}>
            {suggestion.reason}
          </p>
          {suggestion.feedback && (
            <p
              className={`m-0 border-l-2 border-ai-200 pl-3 text-sm leading-6 text-slate-800 ${fontRegular}`}
            >
              {suggestion.feedback}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button type="button" onClick={onAcceptAi} className={buttonClass("ai", "md")}>
              <Icon icon={Tick02Icon} size={16} />
              {suggestion.verdict === "correct" ? "Accept, mark correct" : "Accept feedback"}
            </button>
            {suggestion.feedback && (
              <button type="button" onClick={onEditAi} className={buttonClass("secondary", "md")}>
                <Icon icon={PencilEdit02Icon} size={16} />
                Edit first
              </button>
            )}
            <button type="button" onClick={onDismissAi} className={buttonClass("ghost", "md")}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {draft !== undefined ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
          className="flex flex-col gap-3 border-t border-slate-100 bg-slate-25 px-5 py-4 md:px-6"
        >
          <label className="flex flex-col gap-1.5">
            <span className={`text-13 text-slate-700 ${fontMedium}`}>
              Feedback for the student
            </span>
            <textarea
              autoFocus
              rows={3}
              value={draft}
              onChange={(e) => onDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") onCancel();
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSave();
              }}
              placeholder="What is missing, and how can they improve it?"
              className={`field resize-none py-2.5 ${fontRegular}`}
            />
          </label>
          <div className="flex items-center justify-end gap-2">
            <span
              className={`mr-auto hidden text-xs text-slate-400 sm:block ${fontRegular}`}
            >
              Ctrl + Enter to save · Esc to cancel
            </span>
            <button
              type="button"
              onClick={onCancel}
              className={buttonClass("ghost", "md")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!draft.trim()}
              className={buttonClass("primary", "md")}
            >
              Save feedback
            </button>
          </div>
        </form>
      ) : state === "feedback" ? (
        <div className="flex items-start gap-3 border-t border-secondary-100 bg-secondary-50 px-5 py-4 md:px-6">
          <Icon
            icon={PencilEdit02Icon}
            size={18}
            className="mt-0.5 shrink-0 text-secondary-700"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className={`text-xs text-secondary-800 ${fontSemi}`}>
              Your feedback{review?.author ? ` · ${review.author}` : ""}
              {review?.ai ? " · from AI suggestion" : ""}
            </span>
            <p
              className={`m-0 text-sm leading-6 text-slate-800 ${fontRegular}`}
            >
              {review?.feedback}
            </p>
          </div>
          {!locked && (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={onStartFeedback}
                className={buttonClass("ghost", "md")}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={onUndo}
                className={buttonClass("ghost", "md")}
              >
                Undo
              </button>
            </div>
          )}
        </div>
      ) : (
        !locked && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-5 py-3.5 md:px-6">
            <button
              type="button"
              aria-pressed={state === "correct"}
              onClick={onToggleCorrect}
              className={buttonClass(
                state === "correct" ? "soft" : "secondary",
                "md",
              )}
            >
              <Icon icon={Tick02Icon} size={16} />
              {state === "correct" ? "Marked correct" : "Correct"}
            </button>
            <button
              type="button"
              onClick={onStartFeedback}
              className={buttonClass("secondary", "md")}
            >
              <Icon icon={PencilEdit02Icon} size={16} />
              Add feedback
            </button>
            {state === "correct" && (
              <button
                type="button"
                onClick={onUndo}
                className={`${buttonClass("ghost", "md")} ml-auto`}
              >
                Undo
              </button>
            )}
          </div>
        )
      )}
    </article>
  );
}

function ProgressPanel({
  review,
  nextTodo,
  onJump,
  onMarkRemaining,
  onSubmit,
  onReopen,
}: {
  review: SubmissionReview;
  nextTodo?: Submission;
  onJump: (i: number) => void;
  onMarkRemaining: () => void;
  onSubmit: () => void;
  onReopen: () => void;
}) {
  const t = tally(review);
  const remaining = QUESTIONS.length - t.reviewed;
  const pct = Math.round((t.reviewed / QUESTIONS.length) * 100);
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className={`m-0 text-sm text-slate-900 ${fontSemi}`}>
            Review progress
          </h2>
          <span className={`text-13 tabular-nums text-slate-500 ${fontMedium}`}>
            {t.reviewed} of {QUESTIONS.length}
          </span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary-700 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ol className="m-0 flex list-none flex-col gap-0.5 p-0">
        {QUESTIONS.map((q, i) => {
          const r = review.questions[i];
          const dot = r?.correct
            ? "bg-primary-700"
            : r?.feedback
              ? "bg-secondary-500"
              : "bg-slate-300";
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => onJump(i)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-50"
              >
                <span
                  className={`size-2 shrink-0 rounded-full ${dot}`}
                  aria-hidden="true"
                />
                <span
                  className={`w-5 shrink-0 text-xs tabular-nums text-slate-400 ${fontMedium}`}
                >
                  Q{i + 1}
                </span>
                <span
                  className={`min-w-0 flex-1 truncate text-13 text-slate-700 ${fontRegular}`}
                >
                  {q.question}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div
        className={`flex items-center gap-3 text-xs text-slate-500 ${fontRegular}`}
      >
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary-700" />
          Correct
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-secondary-500" />
          Feedback
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-slate-300" />
          To do
        </span>
      </div>

      {review.checked ? (
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
          <p
            className={`m-0 flex items-center gap-2 text-sm text-primary-700 ${fontSemi}`}
          >
            <Icon icon={CheckmarkCircle02Icon} size={18} />
            Grade submitted
          </p>
          {nextTodo ? (
            <button
              type="button"
              onClick={() => openInstructorAssignments(nextTodo.id)}
              className={`${buttonClass("primary", "lg")} w-full`}
            >
              Next: {nextTodo.student}
              <Icon icon={ArrowRight01Icon} size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openInstructorAssignments()}
              className={`${buttonClass("primary", "lg")} w-full`}
            >
              Back to all submissions
            </button>
          )}
          <button
            type="button"
            onClick={onReopen}
            className={`${buttonClass("ghost", "md")} w-full`}
          >
            Edit grade
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
          {remaining > 0 && (
            <button
              type="button"
              onClick={onMarkRemaining}
              className={`${buttonClass("secondary", "md")} w-full`}
            >
              <Icon icon={Tick02Icon} size={16} />
              Mark remaining {remaining} correct
            </button>
          )}
          <button
            type="button"
            onClick={onSubmit}
            disabled={remaining > 0}
            className={`${buttonClass("primary", "lg")} w-full`}
          >
            Submit grade
          </button>
          <p
            className={`m-0 text-center text-xs text-slate-500 ${fontRegular}`}
          >
            {remaining > 0
              ? `Review ${remaining} more ${remaining === 1 ? "question" : "questions"} to submit.`
              : "The student sees your feedback after you submit."}
          </p>
        </div>
      )}
    </div>
  );
}

function SubmissionReviewView({
  submission,
  reviews,
  review,
  onChange,
  drafts,
  setDrafts,
  onCourse,
}: {
  submission: Submission;
  reviews: ReviewStore;
  review: SubmissionReview;
  onChange: (next: SubmissionReview) => void;
  drafts: Record<number, string>;
  setDrafts: (next: Record<number, string>) => void;
  onCourse: () => void;
}) {
  const { user, notify } = useApp();
  const position = SUBMISSIONS.findIndex((s) => s.id === submission.id);
  const prev = SUBMISSIONS[position - 1];
  const next = SUBMISSIONS[position + 1];
  // After submitting, go to the next submission still waiting, starting after this one.
  const nextTodo = useMemo(() => {
    const after = [
      ...SUBMISSIONS.slice(position + 1),
      ...SUBMISSIONS.slice(0, position),
    ];
    return after.find((s) => !reviews[s.id]?.checked);
  }, [position, reviews]);

  const [aiStatus, setAiStatus] = useState<AiStatus>("idle");
  const [dismissed, setDismissed] = useState<number[]>([]);
  useEffect(() => {
    setAiStatus("idle");
    setDismissed([]);
  }, [submission.id]);
  useEffect(() => {
    if (aiStatus !== "checking") return;
    const timer = window.setTimeout(() => setAiStatus("done"), 1600);
    return () => window.clearTimeout(timer);
  }, [aiStatus]);

  const closeDraft = (i: number) => {
    const { [i]: _closed, ...rest } = drafts;
    setDrafts(rest);
  };
  const updateQuestion = (i: number, value: QuestionReview) =>
    onChange({
      checked: false,
      questions: { ...review.questions, [i]: value },
    });

  const saveDraft = (i: number) => {
    const text = (drafts[i] ?? "").trim();
    closeDraft(i);
    if (text === (review.questions[i]?.feedback ?? "")) return;
    updateQuestion(
      i,
      text ? { feedback: text, author: user?.name ?? "Alice Jordan" } : {},
    );
  };

  const scrollToQuestion = (i: number) =>
    document
      .getElementById(`review-q-${i}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });

  const markRemaining = () => {
    const questions = { ...review.questions };
    QUESTIONS.forEach((_, i) => {
      if (!isReviewed(questions[i]) && drafts[i] === undefined)
        questions[i] = { correct: true };
    });
    onChange({ checked: false, questions });
  };

  const submit = () => {
    const openDrafts = Object.keys(drafts).map(Number);
    if (openDrafts.length > 0) {
      notify("Save or cancel your open feedback first");
      scrollToQuestion(Math.min(...openDrafts));
      return;
    }
    const missing = QUESTIONS.map((_, i) => i).filter(
      (i) => !isReviewed(review.questions[i]),
    );
    if (missing.length > 0) {
      scrollToQuestion(missing[0]);
      return;
    }
    onChange({ ...review, checked: true });
    notify(`Grade submitted for ${submission.student}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const t = tally(review);
  const remaining = QUESTIONS.length - t.reviewed;

  const fromAi = (s: AiSuggestion): QuestionReview =>
    s.verdict === "correct"
      ? { correct: true, ai: true }
      : { feedback: s.feedback, author: user?.name ?? "Alice Jordan", ai: true };
  const aiPending = QUESTIONS.map((_, i) => i).filter(
    (i) =>
      !isReviewed(review.questions[i]) &&
      drafts[i] === undefined &&
      !dismissed.includes(i),
  );
  const acceptAllAi = () => {
    const questions = { ...review.questions };
    aiPending.forEach((i) => {
      questions[i] = fromAi(AI_SUGGESTIONS[i]);
    });
    onChange({ checked: false, questions });
    notify(`Applied ${aiPending.length} AI ${aiPending.length === 1 ? "suggestion" : "suggestions"}`);
  };
  const aiCorrect = AI_SUGGESTIONS.filter((s) => s.verdict === "correct").length;

  return (
    <>
      <div className="sticky top-16 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm md:px-7">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => openInstructorAssignments()}
            className={`${buttonClass("ghost", "md")} -ml-2 px-2`}
          >
            <Icon icon={ArrowLeft01Icon} size={18} />
            All submissions
          </button>
          <div className="ml-auto flex items-center gap-2">
            <span
              className={`text-13 tabular-nums text-slate-500 ${fontMedium}`}
            >
              {position + 1} of {SUBMISSIONS.length}
            </span>
            <button
              type="button"
              aria-label="Previous submission"
              disabled={!prev}
              onClick={() => prev && openInstructorAssignments(prev.id)}
              className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <Icon icon={ArrowLeft01Icon} size={16} />
            </button>
            <button
              type="button"
              aria-label="Next submission"
              disabled={!next}
              onClick={() => next && openInstructorAssignments(next.id)}
              className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <Icon icon={ArrowRight01Icon} size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4 pb-28 pt-6 md:px-7 lg:pb-10">
        <header className="flex flex-wrap items-center gap-4">
          <Avatar submission={submission} large />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 className={`m-0 text-xl text-slate-900 ${fontSemi}`}>
              {submission.student}
            </h2>
            <p
              className={`m-0 flex flex-wrap items-center gap-x-2 text-13 text-slate-500 ${fontRegular}`}
            >
              <span className={`text-slate-700 ${fontMedium}`}>
                {submission.assignment}
              </span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={onCourse}
                className="underline-offset-2 transition hover:text-slate-900 hover:underline"
              >
                {submission.course}
              </button>
              <span aria-hidden="true">·</span>
              Submitted {submission.posted}
            </p>
          </div>
          {review.checked ? (
            <span
              className={`flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-13 text-primary-700 ${fontSemi}`}
            >
              <Icon icon={Tick02Icon} size={14} />
              Reviewed
            </span>
          ) : (
            <span
              className={`flex items-center gap-1.5 rounded-full bg-secondary-50 px-3 py-1 text-13 text-secondary-800 ${fontSemi}`}
            >
              <span
                className="size-1.5 rounded-full bg-secondary-500"
                aria-hidden="true"
              />
              {t.reviewed > 0 ? "In progress" : "To review"}
            </span>
          )}
        </header>

        <div className="flex items-start gap-6">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {!review.checked && remaining > 0 && (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-ai-100 bg-ai-50 px-5 py-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-ai-600">
                  <Icon
                    icon={SparklesIcon}
                    size={20}
                    className={aiStatus === "checking" ? "animate-pulse" : ""}
                  />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className={`m-0 text-sm text-slate-900 ${fontSemi}`}>
                    {aiStatus === "idle"
                      ? "Check with AI"
                      : aiStatus === "checking"
                        ? `Checking ${QUESTIONS.length} answers…`
                        : `${aiCorrect} look correct, ${QUESTIONS.length - aiCorrect} need work`}
                  </p>
                  <p className={`m-0 text-13 text-slate-600 ${fontRegular}`}>
                    {aiStatus === "done"
                      ? "Review each suggestion below, or accept them all. Nothing goes to the student until you submit."
                      : "Get a suggested result and feedback for each answer. You still decide the grade."}
                  </p>
                </div>
                {aiStatus === "done" ? (
                  aiPending.length > 0 && (
                    <button type="button" onClick={acceptAllAi} className={buttonClass("ai", "md")}>
                      <Icon icon={Tick02Icon} size={16} />
                      Accept all {aiPending.length}
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    disabled={aiStatus === "checking"}
                    onClick={() => {
                      setDismissed([]);
                      setAiStatus("checking");
                    }}
                    className={buttonClass("ai", "md")}
                  >
                    <Icon icon={SparklesIcon} size={16} />
                    {aiStatus === "checking" ? "Checking…" : "Check with AI"}
                  </button>
                )}
              </div>
            )}
            {QUESTIONS.map((item, i) => (
              <QuestionCard
                key={i}
                index={i}
                question={item.question}
                answer={item.answer}
                review={review.questions[i]}
                draft={drafts[i]}
                locked={review.checked}
                onStartFeedback={() =>
                  setDrafts({
                    ...drafts,
                    [i]: review.questions[i]?.feedback ?? "",
                  })
                }
                onDraft={(text) => setDrafts({ ...drafts, [i]: text })}
                onCancel={() => closeDraft(i)}
                onSave={() => saveDraft(i)}
                onToggleCorrect={() =>
                  updateQuestion(
                    i,
                    review.questions[i]?.correct ? {} : { correct: true },
                  )
                }
                aiChecking={aiStatus === "checking"}
                suggestion={
                  aiStatus === "done" && !dismissed.includes(i)
                    ? AI_SUGGESTIONS[i]
                    : undefined
                }
                onAcceptAi={() => updateQuestion(i, fromAi(AI_SUGGESTIONS[i]))}
                onEditAi={() =>
                  setDrafts({ ...drafts, [i]: AI_SUGGESTIONS[i].feedback ?? "" })
                }
                onDismissAi={() => setDismissed([...dismissed, i])}
                onUndo={() => {
                  updateQuestion(i, {});
                  setDismissed(dismissed.filter((d) => d !== i));
                }}
              />
            ))}
          </div>
          <aside className="sticky top-36 hidden w-80 shrink-0 lg:block">
            <ProgressPanel
              review={review}
              nextTodo={nextTodo}
              onJump={scrollToQuestion}
              onMarkRemaining={markRemaining}
              onSubmit={submit}
              onReopen={() => onChange({ ...review, checked: false })}
            />
          </aside>
        </div>
      </div>

      {/* Phones and tablets: progress and the main action stay at the bottom. */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
        {review.checked ? (
          <>
            <span
              className={`flex flex-1 items-center gap-1.5 text-sm text-primary-700 ${fontSemi}`}
            >
              <Icon icon={CheckmarkCircle02Icon} size={18} />
              Grade submitted
            </span>
            <button
              type="button"
              onClick={() => openInstructorAssignments(nextTodo?.id)}
              className={buttonClass("primary", "lg")}
            >
              {nextTodo ? "Next submission" : "All submissions"}
            </button>
          </>
        ) : (
          <>
            <span className={`flex-1 text-sm text-slate-600 ${fontMedium}`}>
              {t.reviewed} of {QUESTIONS.length} reviewed
            </span>
            <button
              type="button"
              onClick={submit}
              disabled={remaining > 0}
              className={buttonClass("primary", "lg")}
            >
              Submit grade
            </button>
          </>
        )}
      </div>
    </>
  );
}

export default function InstructorAssignments({
  submissionId,
}: {
  submissionId?: string;
}) {
  const [reviews, setReviews] = useState<ReviewStore>(loadReviews);
  const [drafts, setDrafts] = useState<Record<string, Record<number, string>>>(
    {},
  );
  const [course, setCourse] = useState("all");
  const [tab, setTab] = useState<Tab>("todo");

  useEffect(() => {
    save(STORE_KEY, reviews);
  }, [reviews]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [submissionId]);

  const submission = SUBMISSIONS.find((s) => s.id === submissionId);
  const waiting = SUBMISSIONS.filter((s) => !reviews[s.id]?.checked).length;

  return (
    <main className="flex flex-1 flex-col bg-slate-25">
      {!submission && (
        <div className="flex flex-col gap-1 border-b border-slate-200 bg-white px-4 py-6 md:px-7">
          <h1
            className="m-0 font-instrument-medium text-2xl font-medium leading-8 text-slate-900"
            style={{ fontVariationSettings: '"wdth" 100' }}
          >
            Assignments
          </h1>
          <p className={`m-0 text-sm text-slate-500 ${fontRegular}`}>
            {waiting > 0
              ? `${waiting} of ${SUBMISSIONS.length} submissions need your review.`
              : "Every submission has been reviewed."}
          </p>
        </div>
      )}
      {submission ? (
        <SubmissionReviewView
          key={submission.id}
          submission={submission}
          reviews={reviews}
          review={reviews[submission.id] ?? EMPTY_REVIEW}
          onChange={(value) =>
            setReviews((r) => ({ ...r, [submission.id]: value }))
          }
          drafts={drafts[submission.id] ?? {}}
          setDrafts={(value) =>
            setDrafts((d) => ({ ...d, [submission.id]: value }))
          }
          onCourse={() => {
            setCourse(submission.course);
            setTab("all");
            openInstructorAssignments();
          }}
        />
      ) : (
        <SubmissionList
          reviews={reviews}
          course={course}
          setCourse={setCourse}
          tab={tab}
          setTab={setTab}
        />
      )}
    </main>
  );
}
