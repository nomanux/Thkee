import { useEffect, useState } from "react";
import { fontBold, fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, openInstructorAssignments, save, useApp } from "../store";
import { ActionMenu, FilterSelect } from "./Menus";

const imgChevronLarge = "/assets/933a3.svg";
const imgChevronBack = "/assets/1ac85.svg";
const imgDotOrange = "/assets/9c881.svg";
const imgDotGray = "/assets/28674.svg";
const imgEye = "/assets/1ec2c.svg";
const imgPencil = "/assets/2787c.svg";
const imgPencilEdit = "/assets/d9f36.svg";
const imgClose = "/assets/53e9a.svg";
const imgChecked = "/assets/70227.svg";
const imgDevon = "/assets/1a400.png";

const DATABASE_ANSWER = "A database is an organised collection of data that is stored electronically and can be accessed, managed, and updated easily. Databases can store a wide variety of data, from simple text to complex records, and are used in applications ranging from websites to enterprise systems. A database is an organized collection of data that is stored electronically and can be accessed, managed, and updated easily. Databases can store a wide variety of data, from simple text to complex records, and are used in applications ranging from websites to enterprise systems.";
const DATA_TYPES_ANSWER = "A Course Database contains various types of information, such as course details (ID, title, description), instructor data, student records, class schedules, enrollment information, and grades. These elements help manage the academic structure, ensuring accurate tracking of students, courses, and instructors, which is essential for the smooth operation of an educational institution.";
const RELATIONSHIP_ANSWER = "In a Course Database, there is typically a one-to-many relationship between instructors and courses. An instructor can teach multiple courses, but each course is generally taught by one instructor. This relationship is represented by linking the Instructor ID in the Course Table, allowing for effective management of instructor assignments and course oversight.";

const QUESTIONS = [
  { question: "What is Database Management", answer: DATABASE_ANSWER },
  { question: "What types of data would you typically find in a Course Database?", answer: DATA_TYPES_ANSWER },
  { question: "What is the relationship between Courses and Instructors in a Course Database?", answer: RELATIONSHIP_ANSWER },
  { question: "What types of data would you typically find in a Course Database?", answer: DATA_TYPES_ANSWER },
  { question: "What is the relationship between Courses and Instructors in a Course Database?", answer: RELATIONSHIP_ANSWER },
];

type Submission = { id: string; student: string; photo?: string; color: string; posted: string; course: string; assignment: string };

const SUBMISSIONS: Submission[] = [
  { id: "sub-1", student: "Devon Lane", photo: imgDevon, color: "#1e293b", posted: "Posted 1 month ago", course: "Database Management Systems", assignment: "JS Assignment -01" },
  { id: "sub-2", student: "Devon Lane", photo: imgDevon, color: "#1e293b", posted: "Posted 1 month ago", course: "Object oriented Java programming", assignment: "JS Assignment -01" },
  { id: "sub-7", student: "Devon Lane", photo: imgDevon, color: "#1e293b", posted: "Posted 1 month ago", course: "Database Management Systems", assignment: "JS Assignment -02" },
  { id: "sub-3", student: "Rachel Green", color: "#7c3aed", posted: "Posted 1 month ago", course: "Database Management Systems", assignment: "JS Assignment -01" },
  { id: "sub-4", student: "Marcus Bell", color: "#0891b2", posted: "Posted 3 weeks ago", course: "Database Management Systems", assignment: "JS Assignment -01" },
  { id: "sub-5", student: "Priya Nair", color: "#db2777", posted: "Posted 2 weeks ago", course: "Object oriented Java programming", assignment: "JS Assignment -01" },
  { id: "sub-6", student: "Omar Haddad", color: "#16a34a", posted: "Posted 5 days ago", course: "Object oriented Java programming", assignment: "JS Assignment -01" },
];

const COURSES = [...new Set(SUBMISSIONS.map((s) => s.course))];

type QuestionReview = { correct?: boolean; feedback?: string; author?: string };
type SubmissionReview = { checked: boolean; questions: Record<number, QuestionReview> };
type ReviewStore = Record<string, SubmissionReview>;

const STORE_KEY = "thkee.instructorAssignments";
const EMPTY_REVIEW: SubmissionReview = { checked: false, questions: {} };

const sampleFeedback = (author: string): QuestionReview => ({ author, feedback: "This question is not written appropriately. You need to improve this. And try to write more elaborately." });
const gradedReview: SubmissionReview = {
  checked: true,
  questions: { 0: sampleFeedback("Alice Jordan"), 1: { correct: true }, 2: sampleFeedback("Alice Jordan"), 3: { correct: true }, 4: sampleFeedback("Alice Jordan") },
};
const allCorrectReview: SubmissionReview = { checked: true, questions: Object.fromEntries(QUESTIONS.map((_, i) => [i, { correct: true }])) };
const INITIAL_REVIEWS: ReviewStore = { "sub-2": gradedReview, "sub-7": gradedReview, "sub-4": allCorrectReview, "sub-6": gradedReview };

const isReviewed = (review?: QuestionReview) => Boolean(review?.correct || review?.feedback);

const countLabel = (name: string, count: number) => `${name}(${count})`;

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-[6px]">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      {checked ? <img src={imgChecked} alt="" width={16} height={16} className="size-4 shrink-0 rounded-[3.556px] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#1e293b]" /> : <span className="size-4 shrink-0 rounded-[3.556px] border border-[#cbd5e1] bg-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#1e293b]" />}
      {children}
    </label>
  );
}

function QuestionAnswer({ number, question, answer, muted }: { number: number; question: string; answer: string; muted?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <ol start={number} className={`list-decimal text-[14px] tracking-[-0.01px] ${muted ? "" : "text-[#334155]"} ${muted ? "text-[#475569]" : ""} ${fontMedium}`}>
        <li className="ms-[21px] leading-[24px]">{question}</li>
      </ol>
      <p className={`pl-5 text-[14px] leading-[24px] tracking-[-0.01px] text-[#64748b] ${fontRegular}`}>{answer}</p>
    </div>
  );
}

function CourseAndAssignment({ course, assignment, onCourse, courseClass, className = "" }: { course: string; assignment: string; onCourse: () => void; courseClass: string; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-[7px] gap-y-1 text-[12px] leading-[18px] tracking-[-0.01px] ${className}`}>
      <button type="button" onClick={onCourse} className={`text-left italic underline [font-synthesis:style] transition hover:text-[#0f172a] ${courseClass} ${fontRegular}`}>
        {course}
      </button>
      <span className={`flex items-center gap-2 text-[#64748b] ${fontRegular}`}>
        <span aria-hidden="true">•</span>
        {assignment}
      </span>
    </div>
  );
}

function StatusBadge({ checked }: { checked: boolean }) {
  return (
    <span className={`flex shrink-0 items-center justify-center gap-1.5 rounded-[8px] py-1 pl-2.5 pr-3 text-center text-[14px] leading-[20px] tracking-[-0.01px] ${checked ? "bg-[#f2f4f7] text-[#334155]" : "bg-[#fef6ee] text-[#b93815]"} ${fontMedium}`}>
      <img src={checked ? imgDotGray : imgDotOrange} alt="" width={8} height={8} className="size-2" />
      {checked ? "Checked" : "Not Checked"}
    </span>
  );
}

function SubmissionCard({ submission, checked, highlighted, onHover, onView, onCourse }: { submission: Submission; checked: boolean; highlighted: boolean; onHover: (hovering: boolean) => void; onView: () => void; onCourse: () => void }) {
  const preview = QUESTIONS.slice(0, checked ? 1 : 3);
  return (
    <article onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)} className={`relative flex max-h-[426px] w-full overflow-hidden rounded-[12px] bg-white transition-shadow ${highlighted ? "shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]" : "shadow-[0px_1px_0px_0px_rgba(27,31,35,0.04)]"}`}>
      <div className="flex w-full min-w-0 flex-col gap-6 px-6 py-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex min-h-[28px] items-center justify-between gap-4 md:h-[28px]">
            <div className="flex min-w-0 items-center gap-2.5">
              {submission.photo ? (
                <img src={submission.photo} alt="" className="size-8 shrink-0 rounded-full object-cover" />
              ) : (
                <span aria-hidden="true" className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[12px] text-white ${fontBold}`} style={{ backgroundColor: submission.color }}>
                  {submission.student
                    .split(" ")
                    .map((p) => p[0])
                    .join("")}
                </span>
              )}
              <p className="flex min-w-0 flex-wrap items-center gap-[3px]">
                <span className={`text-[12px] leading-[18px] tracking-[-0.01px] text-[#475569] ${fontSemi}`}>{submission.student}</span>
                <span aria-hidden="true" className={`text-[10px] leading-[1.6] tracking-[0.1px] text-[#94a3b8] ${fontRegular}`}>
                  •
                </span>
                <span className={`text-[10px] leading-[1.6] tracking-[0.1px] text-[#94a3b8] ${fontRegular}`}>{submission.posted}</span>
              </p>
            </div>
            <StatusBadge checked={checked} />
          </div>
          <CourseAndAssignment course={submission.course} assignment={submission.assignment} onCourse={onCourse} courseClass="text-[#64748b]" />
        </div>
        {preview.map((item, i) => (
          <QuestionAnswer key={i} number={i + 1} question={item.question} answer={item.answer} muted={highlighted} />
        ))}
      </div>
      <button
        type="button"
        onClick={onView}
        aria-label={`View submission from ${submission.student}`}
        className={`absolute inset-x-[5px] bottom-[6px] top-[85px] flex items-center justify-center rounded-[11px] bg-gradient-to-b from-[rgba(230,233,237,0.8)] via-[rgba(255,255,255,0.48)] via-[50.914%] to-[rgba(230,233,237,0.8)] px-4 transition-opacity focus-visible:opacity-100 [@media(hover:none)]:opacity-100 ${highlighted ? "opacity-100" : "opacity-0"}`}
      >
        <span className={`flex h-[64px] w-full max-w-[387px] items-center justify-center gap-2 rounded-[14px] bg-[#1e293b] px-8 py-4 text-[16px] leading-[20px] tracking-[-0.01px] text-white ${fontMedium}`}>
          <img src={imgEye} alt="" width={20} height={20} className="size-5" />
          View Submission
        </span>
      </button>
    </article>
  );
}

function SubmissionList({
  reviews,
  course,
  setCourse,
  onlyUnchecked,
  setOnlyUnchecked,
  feedbackType,
  setFeedbackType,
}: {
  reviews: ReviewStore;
  course: string;
  setCourse: (course: string) => void;
  onlyUnchecked: boolean;
  setOnlyUnchecked: (value: boolean) => void;
  feedbackType: string;
  setFeedbackType: (value: string) => void;
}) {
  const allCourses = course === "all";
  const inCourse = allCourses ? SUBMISSIONS : SUBMISSIONS.filter((s) => s.course === course);
  const isChecked = (s: Submission) => Boolean(reviews[s.id]?.checked);
  const matchesFeedback = (s: Submission) => {
    if (feedbackType === "all") return true;
    const questions = Object.values(reviews[s.id]?.questions ?? {});
    return questions.some((q) => (feedbackType === "written" ? q.feedback : q.correct));
  };
  const visible = inCourse.filter((s) => (!onlyUnchecked || !isChecked(s)) && matchesFeedback(s));
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // The overlay rests on the next submission to grade, and follows the pointer when one is hovered.
  const highlighted = visible.find((s) => s.id === hoveredId) ?? visible.find((s) => !isChecked(s));

  return (
    <>
      <div className={`flex flex-wrap items-center justify-between gap-4 px-4 ${allCourses ? "border-y border-[#e2e8f0] bg-white py-[15px] md:px-[30px]" : "pt-5 md:pl-8 md:pr-7"}`}>
        <ActionMenu
          label={`Course: ${allCourses ? "All Courses" : course}`}
          alignLeft
          triggerClass={`flex items-center gap-3 text-left text-[20px] leading-[32px] tracking-[0.15px] text-[#0f172a] ${fontHeading}`}
          trigger={
            <>
              {allCourses ? countLabel("All Courses", SUBMISSIONS.length) : countLabel(course, inCourse.length)}
              <img src={imgChevronLarge} alt="" width={24} height={24} className="size-6 shrink-0" />
            </>
          }
          items={[
            { label: countLabel("All Courses", SUBMISSIONS.length), onClick: () => setCourse("all") },
            ...COURSES.map((name) => ({ label: countLabel(name, SUBMISSIONS.filter((s) => s.course === name).length), onClick: () => setCourse(name) })),
          ]}
        />
        <div className="flex flex-wrap items-center gap-6">
          <Checkbox checked={onlyUnchecked} onChange={() => setOnlyUnchecked(!onlyUnchecked)}>
            <span className={`text-[14px] leading-[20px] tracking-[-0.01px] text-[#475569] ${fontRegular}`}>{countLabel("Unchecked", inCourse.filter((s) => !isChecked(s)).length)}</span>
          </Checkbox>
          <FilterSelect
            large
            alignRight
            label="Feedback Type"
            value={feedbackType}
            onChange={setFeedbackType}
            options={[
              { value: "all", label: "All" },
              { value: "written", label: "Written feedback" },
              { value: "correct", label: "Marked correct" },
            ]}
          />
        </div>
      </div>
      <div className={`flex flex-col gap-4 px-4 pb-8 md:pl-8 md:pr-7 ${allCourses ? "pt-8" : "pt-5"}`}>
        {visible.map((s) => (
          <SubmissionCard
            key={s.id}
            submission={s}
            checked={isChecked(s)}
            highlighted={s.id === highlighted?.id}
            onHover={(hovering) => setHoveredId(hovering ? s.id : null)}
            onView={() => openInstructorAssignments(s.id)}
            onCourse={() => {
              setCourse(s.course);
              window.scrollTo({ top: 0, behavior: "instant" });
            }}
          />
        ))}
        {visible.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-[12px] bg-white px-6 py-12 text-center">
            <p className={`text-[14px] leading-[24px] text-[#64748b] ${fontRegular}`}>No submissions match these filters.</p>
            <button
              type="button"
              onClick={() => {
                setCourse("all");
                setOnlyUnchecked(false);
                setFeedbackType("all");
              }}
              className={`text-[14px] leading-[20px] text-[#1e293b] underline ${fontMedium}`}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function QuestionReviewCard({
  number,
  question,
  answer,
  review,
  draft,
  onStartFeedback,
  onDraft,
  onCancel,
  onSave,
  onToggleCorrect,
}: {
  number: number;
  question: string;
  answer: string;
  review?: QuestionReview;
  draft?: string;
  onStartFeedback: () => void;
  onDraft: (text: string) => void;
  onCancel: () => void;
  onSave: () => void;
  onToggleCorrect: () => void;
}) {
  return (
    <article id={`review-q-${number - 1}`} className="w-full scroll-mt-4 overflow-hidden rounded-[12px] bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.06)]">
      <div className="px-6 py-4">
        <QuestionAnswer number={number} question={question} answer={answer} />
      </div>
      {draft !== undefined ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
          className="flex min-h-[64px] items-center gap-4 bg-[#f8fafc] px-6 py-2.5"
        >
          <div className="field-box min-w-0 flex-1">
            <input
              autoFocus
              value={draft}
              onChange={(e) => onDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && onCancel()}
              aria-label={`Feedback for question ${number}`}
              placeholder="Write feedback..."
              className={`min-w-0 flex-1 bg-transparent text-[14px] leading-[24px] tracking-[-0.01px] text-[#1e293b] outline-none placeholder:text-[#64748b] ${fontRegular}`}
            />
            <button type="button" onClick={onCancel} aria-label="Cancel feedback" className="flex shrink-0 rounded-full transition hover:opacity-70">
              <img src={imgClose} alt="" width={20} height={20} className="size-5" />
            </button>
          </div>
          <button type="submit" className={`flex h-[44px] shrink-0 items-center justify-center rounded-[8px] bg-[#334155] px-5 text-[16px] leading-[20px] tracking-[-0.01px] text-white transition hover:bg-[#1e293b] ${fontMedium}`}>
            Save
          </button>
        </form>
      ) : review?.feedback ? (
        <div className="flex min-h-[64px] items-center gap-4 border-t border-[#fff0d7] bg-[#fff9f0] px-6 py-2">
          <div className="min-w-0 flex-1">
            <p className={`text-[12px] leading-[18px] tracking-[-0.01px] text-[#334155] ${fontSemi}`}>{review.author}</p>
            <p className={`text-[14px] leading-[28px] tracking-[-0.01px] text-[#613f00] ${fontMedium}`}>{review.feedback}</p>
          </div>
          <button type="button" onClick={onStartFeedback} aria-label={`Edit feedback for question ${number}`} className="flex shrink-0 transition hover:opacity-70">
            <img src={imgPencilEdit} alt="" width={20} height={20} className="size-5" />
          </button>
        </div>
      ) : (
        <div className="flex min-h-[56px] flex-wrap items-center justify-between gap-3 bg-[#f8fafc] px-6 py-3">
          <button type="button" onClick={onStartFeedback} className={`flex items-center gap-2.5 rounded-[4px] text-[14px] leading-[20px] tracking-[-0.01px] text-[#1e293b] transition hover:text-[#0f172a] ${fontMedium}`}>
            <img src={imgPencil} alt="" width={20} height={20} className="size-5" />
            Add Feedback
          </button>
          <Checkbox checked={Boolean(review?.correct)} onChange={onToggleCorrect}>
            <span className={`text-[14px] leading-[20px] text-[#1e293b] ${fontSemi}`}>Mark this Correct</span>
          </Checkbox>
        </div>
      )}
    </article>
  );
}

function SubmissionReviewView({
  submission,
  review,
  onChange,
  drafts,
  setDrafts,
  onCourse,
}: {
  submission: Submission;
  review: SubmissionReview;
  onChange: (next: SubmissionReview) => void;
  drafts: Record<number, string>;
  setDrafts: (next: Record<number, string>) => void;
  onCourse: () => void;
}) {
  const { user, notify } = useApp();
  const classmates = SUBMISSIONS.filter((s) => s.course === submission.course && s.assignment === submission.assignment);

  const closeDraft = (i: number) => {
    const { [i]: _closed, ...rest } = drafts;
    setDrafts(rest);
  };
  const updateQuestion = (i: number, next: QuestionReview) => onChange({ checked: false, questions: { ...review.questions, [i]: next } });

  const saveDraft = (i: number) => {
    const text = (drafts[i] ?? "").trim();
    closeDraft(i);
    if (text === (review.questions[i]?.feedback ?? "")) return;
    updateQuestion(i, text ? { feedback: text, author: user?.name ?? "Alice Jordan" } : {});
  };

  const scrollToQuestion = (i: number) => document.getElementById(`review-q-${i}`)?.scrollIntoView({ behavior: "smooth", block: "center" });

  const submit = () => {
    const openDrafts = Object.keys(drafts).map(Number);
    if (openDrafts.length > 0) {
      notify("Save or cancel your open feedback first");
      scrollToQuestion(Math.min(...openDrafts));
      return;
    }
    const missing = QUESTIONS.map((_, i) => i).filter((i) => !isReviewed(review.questions[i]));
    if (missing.length > 0) {
      notify(`Add feedback or mark correct on ${missing.length} more ${missing.length === 1 ? "question" : "questions"}`);
      scrollToQuestion(missing[0]);
      return;
    }
    onChange({ ...review, checked: true });
    notify(`Grade submitted for ${submission.student}`);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-y border-[#e2e8f0] bg-white px-4 py-[15px] md:pl-8 md:pr-7">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => openInstructorAssignments()} aria-label="Back to submissions" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] transition hover:bg-[#e2e8f0]">
              <img src={imgChevronBack} alt="" width={18} height={18} className="size-[18px] rotate-90" />
            </button>
            <ActionMenu
              label={`Student: ${submission.student}`}
              alignLeft
              triggerClass={`flex items-center gap-3 text-left text-[20px] leading-[32px] tracking-[0.15px] text-[#0f172a] ${fontHeading}`}
              trigger={
                <>
                  {submission.student}
                  <img src={imgChevronLarge} alt="" width={24} height={24} className="size-6 shrink-0" />
                </>
              }
              items={classmates.map((s) => ({ label: s.student, disabled: s.id === submission.id, onClick: () => openInstructorAssignments(s.id) }))}
            />
          </div>
          <CourseAndAssignment course={submission.course} assignment={submission.assignment} onCourse={onCourse} courseClass="text-[#1e293b]" className="pl-[47px]" />
        </div>
        <div className="flex items-center gap-5">
          <p className={`text-[14px] italic leading-[20px] tracking-[-0.01px] text-[#64748b] [font-synthesis:style] ${fontMedium}`}>{review.checked ? "Checked" : "Not Checked"}</p>
          <button type="button" onClick={submit} disabled={review.checked} className={`flex h-[36px] items-center justify-center rounded-[8px] bg-[#ffb20d] px-5 text-[16px] leading-[20px] tracking-[-0.01px] text-[#1e293b] transition hover:bg-[#faa104] disabled:opacity-50 disabled:hover:bg-[#ffb20d] ${fontMedium}`}>
            Submit Grade
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4 px-4 pb-8 pt-5 md:pl-8 md:pr-7">
        {QUESTIONS.map((item, i) => (
          <QuestionReviewCard
            key={i}
            number={i + 1}
            question={item.question}
            answer={item.answer}
            review={review.questions[i]}
            draft={drafts[i]}
            onStartFeedback={() => setDrafts({ ...drafts, [i]: review.questions[i]?.feedback ?? "" })}
            onDraft={(text) => setDrafts({ ...drafts, [i]: text })}
            onCancel={() => closeDraft(i)}
            onSave={() => saveDraft(i)}
            onToggleCorrect={() => updateQuestion(i, { correct: !review.questions[i]?.correct })}
          />
        ))}
      </div>
    </>
  );
}

export default function InstructorAssignments({ submissionId }: { submissionId?: string }) {
  const [reviews, setReviews] = useState<ReviewStore>(() => ({ ...INITIAL_REVIEWS, ...load<ReviewStore>(STORE_KEY, {}) }));
  const [drafts, setDrafts] = useState<Record<string, Record<number, string>>>({});
  const [course, setCourse] = useState("all");
  const [onlyUnchecked, setOnlyUnchecked] = useState(false);
  const [feedbackType, setFeedbackType] = useState("all");

  useEffect(() => save(STORE_KEY, reviews), [reviews]);

  const submission = SUBMISSIONS.find((s) => s.id === submissionId);

  return (
    <main className="flex flex-1 flex-col bg-[#f1f5f9]">
      <div className="bg-white px-4 py-6 md:px-7">
        <h1 className="m-0 flex h-[42px] items-center font-['Instrument_Sans:Medium'] text-[24px] font-medium leading-[32px] text-[#0f172a]" style={{ fontVariationSettings: '"wdth" 100' }}>
          Assignments
        </h1>
      </div>
      {submission ? (
        <SubmissionReviewView
          key={submission.id}
          submission={submission}
          review={reviews[submission.id] ?? EMPTY_REVIEW}
          onChange={(next) => setReviews((r) => ({ ...r, [submission.id]: next }))}
          drafts={drafts[submission.id] ?? {}}
          setDrafts={(next) => setDrafts((d) => ({ ...d, [submission.id]: next }))}
          onCourse={() => {
            setCourse(submission.course);
            openInstructorAssignments();
          }}
        />
      ) : (
        <SubmissionList reviews={reviews} course={course} setCourse={setCourse} onlyUnchecked={onlyUnchecked} setOnlyUnchecked={setOnlyUnchecked} feedbackType={feedbackType} setFeedbackType={setFeedbackType} />
      )}
    </main>
  );
}
