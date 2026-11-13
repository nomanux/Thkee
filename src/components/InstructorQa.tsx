import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Comment01Icon, ThumbsUpIcon } from "@hugeicons/core-free-icons";
import { fontBold, fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, openInstructorQa, openNewFeaturedQuestion, save, useApp } from "../store";
import { ActionMenu, FilterSelect } from "./Menus";
import { NoteBody, NoteEditor } from "./Notes";
import { buttonClass } from "./Button";

const imgChevronLarge = "/assets/933a3.svg";
const imgPlusSmall = "/assets/51771.svg";
const imgClose = "/assets/53e9a.svg";
const imgThumb = "/assets/be57c.png";
const imgDevon = "/assets/1a400.png";

type Reply = { id: string; name: string; you?: boolean; color: string; when: string; text: string; html?: string; votes: number };
type Question = { id: string; student: string; photo?: string; color: string; posted: string; course: string; lecture: string; title: string; text: string; votes: number; featured?: boolean; replies: Reply[] };

const FIGMA = "UI/UX Design with Figma";
const SYSTEMS = "Design Systems in Figma";
const COURSES = [FIGMA, SYSTEMS];
const LECTURES = ["Lecture 1", "Lecture 2", "Lecture 3", "Lecture 4", "Lecture 5", "Lecture 6"];

const INSTRUCTOR = "Abdullah Al Noman";
const me = (id: string, when: string, text: string, votes = 0): Reply => ({ id, name: INSTRUCTOR, you: true, color: "#0d5c4b", when, text, votes });

const SEED: Question[] = [
  {
    id: "q8", student: "Rachel Green", color: "#7c3aed", posted: "2 hours ago", course: FIGMA, lecture: "Lecture 5", votes: 4,
    title: "Auto layout keeps squashing my text",
    text: "When I put a long label inside a horizontal auto layout button, the text gets cut off instead of wrapping. Which resizing setting should I use?",
    replies: [],
  },
  {
    id: "q9", student: "Marcus Bell", color: "#0891b2", posted: "5 hours ago", course: SYSTEMS, lecture: "Lecture 3", votes: 2,
    title: "Variants or separate components?",
    text: "For a button with primary, secondary and ghost styles plus three sizes, should I make one component with variants or separate components for each?",
    replies: [],
  },
  {
    id: "q1", student: "Devon Lane", photo: imgDevon, color: "#1e293b", posted: "2 days ago", course: FIGMA, lecture: "Lecture 4", votes: 6,
    title: "How many breakpoints should I design?",
    text: "Do I need to design every screen for mobile, tablet and desktop, or is it fine to do mobile and desktop only?",
    replies: [
      me("q1-a", "2 days ago", "Mobile and desktop is enough for most projects. Design tablet only for screens where the layout really changes, like dashboards or tables. Use auto layout so developers can see how things stretch in between.", 5),
      { id: "q1-b", name: "Alice Jordan", color: "#64748b", when: "1 day ago", votes: 2, text: "Same question here. Which widths do you use for the frames?" },
    ],
  },
  {
    id: "q5", student: "Priya Nair", color: "#db2777", posted: "4 days ago", course: SYSTEMS, lecture: "Lecture 2", votes: 3, featured: true,
    title: "Styles vs variables for colours",
    text: "Figma has both colour styles and variables now. Which one should I use for my design system?",
    replies: [
      me("q5-a", "4 days ago", "Use variables for colours. They support light and dark modes and can point to each other, like a button colour pointing to brand green. Keep styles for things variables can't hold yet, like gradients and shadows.", 8),
    ],
  },
  {
    id: "q6", student: "Omar Haddad", color: "#16a34a", posted: "1 week ago", course: FIGMA, lecture: "Lecture 6", votes: 1,
    title: "Smart animate isn't working between frames",
    text: "My prototype just jumps between two frames instead of animating the card. I set the transition to Smart animate. What am I missing?",
    replies: [
      { id: "q6-a", name: "Lina Ahmed", color: "#b45309", when: "6 days ago", votes: 1, text: "I had this too. The layers need the same name in both frames, otherwise Figma can't match them." },
    ],
  },
  {
    id: "q7", student: "Devon Lane", photo: imgDevon, color: "#1e293b", posted: "2 weeks ago", course: FIGMA, lecture: "Lecture 2", votes: 0,
    title: "How do I hand off spacing to developers?",
    text: "Developers keep asking me for padding values. What is the cleanest way to share spacing without writing it on every screen?",
    replies: [
      me("q7-a", "2 weeks ago", "Build everything with auto layout and spacing variables like space-4 and space-6. In Dev Mode, developers can then click any frame and see the exact padding and gap values."),
    ],
  },
];

const STORE_KEY = "thkee.instructorQa.v3";
export const unansweredQuestionCount = () => load<Question[]>(STORE_KEY, SEED).filter((q) => q.replies.length === 0).length;
const titleClass = "m-0 flex h-10.5 items-center font-instrument-medium text-2xl font-medium leading-8 text-slate-900";
const titleStyle = { fontVariationSettings: '"wdth" 100' };

function Avatar({ name, photo, color, size = "size-9" }: { name: string; photo?: string; color: string; size?: string }) {
  if (photo) return <img src={photo} alt="" className={`${size} shrink-0 rounded-full object-cover`} />;
  return (
    <span aria-hidden="true" className={`flex ${size} shrink-0 items-center justify-center rounded-full text-xs text-white ${fontBold}`} style={{ backgroundColor: color }}>
      {name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}

const Dots = (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="12" cy="19" r="1.8" />
  </svg>
);
const dotsClass = "flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900";
const actionCls = `flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm transition hover:bg-slate-100 ${fontMedium}`;

function Vote({ count, on, onClick }: { count: number; on: boolean; onClick: () => void }) {
  const total = count + (on ? 1 : 0);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Remove upvote, ${total} upvotes` : `Upvote, ${total} upvotes`}
      onClick={onClick}
      className={`${actionCls} tabular-nums ${on ? "text-primary-700" : "text-slate-500 hover:text-slate-800"}`}
    >
      <HugeiconsIcon icon={ThumbsUpIcon} size={16} strokeWidth={on ? 2.2 : 1.8} />
      {total}
    </button>
  );
}

function ReplyItem({ reply, voted, onVote, onReply, onDelete }: { reply: Reply; voted: boolean; onVote: () => void; onReply: () => void; onDelete: () => void }) {
  return (
    <div className="relative flex gap-3">
      <span className="absolute -left-6 top-0 h-4.5 w-5 rounded-bl-xl border-b border-l border-slate-200" aria-hidden="true" />
      <Avatar name={reply.name} color={reply.color} />
      <div className="min-w-0 flex-1">
        <div className="flex min-h-9 flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`text-sm text-slate-900 ${fontSemi}`}>{reply.name}</span>
          {reply.you && <span className={`rounded-full bg-primary-50 px-2 py-0.5 text-11 text-primary-700 ${fontSemi}`}>You</span>}
          <span className={`text-xs text-slate-400 ${fontRegular}`}>{reply.when}</span>
        </div>
        <NoteBody note={{ text: reply.text, html: reply.html }} tone="text-slate-700" />
        <div className="-ml-2 mt-1 flex items-center gap-1">
          <Vote count={reply.votes} on={voted} onClick={onVote} />
          <button type="button" onClick={onReply} className={`${actionCls} text-slate-500 hover:text-slate-800`}>
            <HugeiconsIcon icon={Comment01Icon} size={16} strokeWidth={1.8} />
            Reply
          </button>
          <ActionMenu label={`More actions for reply from ${reply.name}`} trigger={Dots} triggerClass={dotsClass} items={[{ label: "Delete", onClick: onDelete }]} />
        </div>
      </div>
    </div>
  );
}

function QuestionItem({
  q,
  showCourse,
  upvoted,
  startOpen,
  onVote,
  onCourse,
  onFeature,
  onDelete,
  onAddReply,
  onDeleteReply,
}: {
  q: Question;
  showCourse: boolean;
  upvoted: string[];
  startOpen: boolean;
  onVote: (id: string) => void;
  onCourse: () => void;
  onFeature: () => void;
  onDelete: () => void;
  onAddReply: (text: string, html: string) => void;
  onDeleteReply: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(startOpen);
  const [replying, setReplying] = useState(startOpen && q.replies.length === 0);
  const count = q.replies.length;
  const needsReply = count === 0;
  const startReply = () => {
    setExpanded(true);
    setReplying(true);
  };

  return (
    <li className="px-5 py-5 md:px-6">
      <div className="flex gap-3">
        <Avatar name={q.student} photo={q.photo} color={q.color} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className={`flex min-h-9 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 ${fontRegular}`}>
              <span className={`text-sm text-slate-900 ${fontSemi}`}>{q.student}</span>
              <span>{q.posted}</span>
              {needsReply && <span className={`rounded-full bg-secondary-50 px-2 py-0.5 text-11 text-secondary-800 ${fontSemi}`}>Needs reply</span>}
              {q.featured && <span className={`rounded-full bg-primary-50 px-2 py-0.5 text-11 text-primary-700 ${fontSemi}`}>Featured</span>}
            </div>
            <ActionMenu
              label={`More actions for ${q.title}`}
              trigger={Dots}
              triggerClass={dotsClass}
              items={[
                { label: q.featured ? "Remove from featured" : "Mark as featured", onClick: onFeature },
                { label: "Delete", onClick: onDelete },
              ]}
            />
          </div>
          <p className={`m-0 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500 ${fontRegular}`}>
            {showCourse && (
              <>
                <button type="button" onClick={onCourse} className="transition hover:text-primary-700 hover:underline">
                  {q.course}
                </button>
                <span aria-hidden="true">·</span>
              </>
            )}
            {q.lecture}
          </p>
          <h3 className={`m-0 mt-2.5 text-15 leading-snug text-slate-900 ${fontSemi}`}>{q.title}</h3>
          <p className={`m-0 mt-1 text-sm leading-relaxed text-slate-700 ${fontRegular}`}>{q.text}</p>
          <div className="-ml-2 mt-2 flex flex-wrap items-center gap-1">
            <Vote count={q.votes} on={upvoted.includes(q.id)} onClick={() => onVote(q.id)} />
            {count > 0 && (
              <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className={`${actionCls} text-slate-500 hover:text-slate-800`}>
                <HugeiconsIcon icon={Comment01Icon} size={16} strokeWidth={1.8} />
                {expanded ? "Hide replies" : `${count} ${count === 1 ? "reply" : "replies"}`}
              </button>
            )}
            <button type="button" onClick={startReply} className={`${actionCls} ${needsReply ? "text-primary-700 hover:text-primary-800" : "text-slate-500 hover:text-slate-800"}`}>
              Reply
            </button>
          </div>
        </div>
      </div>

      {((expanded && count > 0) || replying) && (
        <div className="ml-4.5 mt-2 flex flex-col gap-4 border-l border-slate-200 pl-6 pt-2">
          {expanded &&
            q.replies.map((reply) => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                voted={upvoted.includes(reply.id)}
                onVote={() => onVote(reply.id)}
                onReply={startReply}
                onDelete={() => onDeleteReply(reply.id)}
              />
            ))}
          {replying && (
            <div className="relative flex gap-3">
              <span className="absolute -left-6 top-0 h-4.5 w-5 rounded-bl-xl border-b border-l border-slate-200" aria-hidden="true" />
              <Avatar name={INSTRUCTOR} color="#0d5c4b" />
              <div className="min-w-0 flex-1">
                <NoteEditor
                  extras
                  modern
                  autoFocus
                  boxClass="min-h-24"
                  placeholder={`Reply to ${q.student.split(" ")[0]}`}
                  saveLabel="Reply"
                  saveVariant="primary"
                  onSave={(text, html) => {
                    onAddReply(text, html);
                    setReplying(false);
                    setExpanded(true);
                  }}
                  onCancel={() => setReplying(false)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function CourseBar({ course }: { course: string }) {
  return (
    <div className="flex items-center gap-4 border-y border-slate-200 bg-white px-4 py-4 md:px-7">
      <img src={imgThumb} alt="" className="h-8 w-12 shrink-0 rounded-sm object-cover" />
      <p className={`text-lg leading-7 text-slate-800 ${fontSemi}`}>{course}</p>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`${buttonClass("secondary", "md")} w-fit`}>
      Back
    </button>
  );
}

function NewFeatured({ onCreate }: { onCreate: (lecture: string, title: string, text: string, html: string) => void }) {
  const { notify } = useApp();
  const [lecture, setLecture] = useState("");
  const [title, setTitle] = useState("");
  const [answer, setAnswer] = useState({ text: "", html: "" });
  const label = `text-sm leading-5 text-slate-700 ${fontMedium}`;

  const submit = () => {
    if (!lecture) return notify("Select a lecture first");
    if (!title.trim()) return notify("Add a question title first");
    if (!answer.text && !answer.html) return notify("Write the answer first");
    onCreate(lecture, title.trim(), answer.text, answer.html);
  };

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6">
      <BackButton onClick={() => openInstructorQa()} />
      <h2 className={`text-lg leading-7 text-slate-700 ${fontSemi}`}>New Featured Questions</h2>
      <div className="flex max-w-203.75 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className={label}>Select Lecture</p>
          <div className="[&_ul]:w-full">
            <FilterSelect plain label="Select Lecture" value={lecture} onChange={setLecture} options={[{ value: "", label: "Choose value" }, ...LECTURES.map((l) => ({ value: l, label: l }))]} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="qa-title" className={label}>
            Question title
          </label>
          <div className="field-box">
            <input id="qa-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Type the question title" className={`min-w-0 flex-1 bg-transparent text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 ${fontRegular}`} />
            {title && (
              <button type="button" onClick={() => setTitle("")} aria-label="Clear question title" className="flex shrink-0 transition hover:opacity-70">
                <img src={imgClose} alt="" width={20} height={20} className="size-5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className={label}>Write the answers</p>
          <NoteEditor extras hideActions autoFocus={false} placeholder="Add a comment...." onChange={(text, html) => setAnswer({ text, html })} />
        </div>
      </div>
      <button type="button" onClick={submit} className={`${buttonClass("yellow", "lg")} w-fit`}>
        Reply
      </button>
    </div>
  );
}

export default function InstructorQa({ questionId, newQuestionCourse }: { questionId?: string; newQuestionCourse?: string }) {
  const { user, notify } = useApp();
  const [questions, setQuestions] = useState<Question[]>(() => load(STORE_KEY, SEED));
  const [upvoted, setUpvoted] = useState<string[]>(() => load(`${STORE_KEY}.votes`, []));
  const [course, setCourse] = useState("all");
  const [filter, setFilter] = useState("all");

  useEffect(() => save(STORE_KEY, questions), [questions]);
  useEffect(() => save(`${STORE_KEY}.votes`, upvoted), [upvoted]);

  const toggleVote = (id: string) => setUpvoted((list) => (list.includes(id) ? list.filter((v) => v !== id) : [...list, id]));
  const updateQuestion = (id: string, next: (q: Question) => Question) => setQuestions((list) => list.map((q) => (q.id === id ? next(q) : q)));

  if (newQuestionCourse) {
    return (
      <main className="flex flex-1 flex-col bg-slate-150">
        <div className="bg-white px-4 py-6 md:px-7">
          <h1 className={titleClass} style={titleStyle}>
            Featured Questions
          </h1>
        </div>
        <CourseBar course={newQuestionCourse} />
        <div className="px-4 py-4 md:px-7">
          <NewFeatured
            onCreate={(lecture, title, text, html) => {
              const name = user?.name ?? INSTRUCTOR;
              const answer: Reply = { id: `reply-${Date.now()}`, name, you: true, color: "#0d5c4b", when: "just now", text, html, votes: 0 };
              setQuestions((list) => [{ id: `q-${Date.now()}`, student: name, color: "#0d5c4b", posted: "just now", course: newQuestionCourse, lecture, title, text, votes: 0, featured: true, replies: [answer] }, ...list]);
              setCourse(newQuestionCourse);
              notify("Featured question added");
              openInstructorQa();
            }}
          />
        </div>
      </main>
    );
  }

  const allCourses = course === "all";
  const inCourse = allCourses ? questions : questions.filter((q) => q.course === course);
  const unanswered = inCourse.filter((q) => q.replies.length === 0).length;
  const matching = inCourse.filter((q) => filter === "all" || (filter === "answered" ? q.replies.length > 0 : q.replies.length === 0));
  // Questions waiting for a reply come first, then featured ones.
  const visible = [...matching].sort(
    (a, b) => Number(b.replies.length === 0) - Number(a.replies.length === 0) || Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
  );

  const courseMenu = (
    <ActionMenu
      label={`Course: ${allCourses ? "All Courses" : course}`}
      alignLeft
      triggerClass={`flex items-center gap-3 text-left text-xl leading-8 text-slate-900 ${fontHeading}`}
      trigger={
        <>
          {allCourses ? "All Courses" : course}
          <img src={imgChevronLarge} alt="" width={24} height={24} className="size-6 shrink-0" />
        </>
      }
      items={[{ label: "All Courses", onClick: () => setCourse("all") }, ...COURSES.map((name) => ({ label: name, onClick: () => setCourse(name) }))]}
    />
  );
  const segments = (
    <div className="flex max-w-full overflow-x-auto rounded-lg bg-slate-100 p-1">
      {[
        { key: "all", label: "All", count: inCourse.length },
        { key: "unanswered", label: "Needs reply", count: unanswered },
        { key: "answered", label: "Answered", count: inCourse.length - unanswered },
      ].map((s) => (
        <button
          key={s.key}
          type="button"
          aria-pressed={filter === s.key}
          onClick={() => setFilter(s.key)}
          className={`flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm transition ${filter === s.key ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"} ${fontMedium}`}
        >
          {s.label}
          <span className={`tabular-nums ${filter === s.key ? "text-slate-500" : "text-slate-400"}`}>{s.count}</span>
        </button>
      ))}
    </div>
  );

  return (
    <main className="flex flex-1 flex-col bg-slate-150">
      <div className="bg-white px-4 py-6 md:px-7">
        <h1 className={titleClass} style={titleStyle}>
          Question and Answers
        </h1>
      </div>
      <div className="flex flex-col gap-4 px-4 pb-8 pt-5 md:pl-8 md:pr-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            {courseMenu}
            <p className={`m-0 mt-1 text-13 text-slate-600 ${fontRegular}`}>
              {unanswered === 0 ? "All questions have a reply" : `${unanswered} ${unanswered === 1 ? "question is" : "questions are"} waiting for your reply`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {segments}
            {!allCourses && (
              <button type="button" onClick={() => openNewFeaturedQuestion(course)} className={`${buttonClass("yellow", "md")}`}>
                <img src={imgPlusSmall} alt="" width={18} height={18} className="size-4.5" />
                Add Feature Question
              </button>
            )}
          </div>
        </div>
        {visible.length === 0 ? (
          <p className={`m-0 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 ${fontRegular}`}>
            {filter === "unanswered" ? "You're all caught up. No questions are waiting." : "No questions here yet."}
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white p-0">
            {visible.map((q) => (
              <QuestionItem
                key={q.id}
                q={q}
                showCourse={allCourses}
                upvoted={upvoted}
                startOpen={q.id === questionId}
                onVote={toggleVote}
                onCourse={() => {
                  setCourse(q.course);
                  window.scrollTo({ top: 0, behavior: "instant" });
                }}
                onFeature={() => updateQuestion(q.id, (item) => ({ ...item, featured: !item.featured }))}
                onDelete={() => {
                  setQuestions((list) => list.filter((item) => item.id !== q.id));
                  notify("Question deleted");
                }}
                onAddReply={(text, html) =>
                  updateQuestion(q.id, (item) => ({
                    ...item,
                    replies: [...item.replies, { id: `reply-${Date.now()}`, name: user?.name ?? INSTRUCTOR, you: true, color: "#0d5c4b", when: "just now", text, html, votes: 0 }],
                  }))
                }
                onDeleteReply={(id) => updateQuestion(q.id, (item) => ({ ...item, replies: item.replies.filter((r) => r.id !== id) }))}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
