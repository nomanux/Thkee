import { useEffect, useState } from "react";
import { fontBold, fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, openInstructorQa, openNewFeaturedQuestion, save, useApp } from "../store";
import { ActionMenu, FilterSelect } from "./Menus";
import { NoteBody, NoteEditor } from "./Notes";

const imgChevronLarge = "/assets/933a3.svg";
const imgPlusSmall = "/assets/51771.svg";
const imgClose = "/assets/53e9a.svg";
const imgThumb = "/assets/be57c.png";
const imgDevon = "/assets/1a400.png";

type Reply = { id: string; name: string; you?: boolean; color: string; when: string; text: string; html?: string; votes: number };
type Question = { id: string; student: string; photo?: string; color: string; posted: string; course: string; lecture: string; title: string; text: string; votes: number; featured?: boolean; replies: Reply[] };

const DB = "Database Management Systems";
const JAVA = "Object-Oriented Programming with Java";
const COURSES = [DB, JAVA];
const LECTURES = ["Lecture 1", "Lecture 2", "Lecture 3", "Lecture 4", "Lecture 5", "Lecture 6"];

const INSTRUCTOR = "Abdullah Al Noman";
const THREAD: Reply[] = [
  { id: "a", name: INSTRUCTOR, you: true, color: "#1e293b", when: "2 days ago", votes: 0, text: "Good question, Alice! The main difference is that 2NF addresses partial dependencies, while 3NF focuses on removing transitive dependencies. 2NF ensures that all non-key attributes are fully dependent on the primary key, whereas 3NF ensures no non-key attribute depends on another non-key attribute." },
  { id: "b", name: "Alice Jordan", color: "#64748b", when: "2 days ago", votes: 3, text: "So, why don’t we just keep the table like that? Isn’t it easier to manage?" },
  { id: "c", name: INSTRUCTOR, you: true, color: "#64748b", when: "2 days ago", votes: 3, text: "Is there any scenario where violating 3NF is acceptable?" },
];
const TWO_REPLIES = THREAD.slice(0, 2);
const NORMALIZATION = { title: "Database Normalization", text: "What is the main difference between 2NF and 3NF in database normalization?" };
const devon = { student: "Devon Lane", photo: imgDevon, color: "#1e293b", posted: "Posted 1 month ago", lecture: "Lecture 4", votes: 3 };

const SEED: Question[] = [
  { ...devon, ...NORMALIZATION, id: "q1", course: DB, replies: TWO_REPLIES },
  { ...devon, ...NORMALIZATION, id: "q2", course: JAVA, featured: true, replies: THREAD },
  { ...devon, ...NORMALIZATION, id: "q3", course: DB, replies: TWO_REPLIES },
  { ...devon, ...NORMALIZATION, id: "q4", course: DB, replies: TWO_REPLIES },
  { ...devon, id: "q5", course: JAVA, title: "Overloading vs Overriding", text: "What is the difference between method overloading and method overriding in Java, and in which situations should each be applied?", replies: TWO_REPLIES },
  { ...devon, id: "q6", course: JAVA, title: "Stream API", text: "Can you explain the concept of the Java Stream API and how it can be used for functional programming?", replies: TWO_REPLIES },
  { ...devon, id: "q7", course: JAVA, title: "Design Patterns", text: "What are design patterns in Java, and could you give examples of common patterns like Singleton and Factory?", replies: TWO_REPLIES },
  { ...devon, id: "q8", course: DB, title: "Indexes", text: "When does adding an index slow a database down instead of speeding it up?", votes: 1, replies: [] },
  { ...devon, id: "q9", course: JAVA, title: "Interfaces vs Abstract Classes", text: "How do I choose between an interface and an abstract class?", votes: 0, replies: [] },
];

const STORE_KEY = "thkee.instructorQa";
export const unansweredQuestionCount = () => load<Question[]>(STORE_KEY, SEED).filter((q) => q.replies.length === 0).length;
const titleClass = "m-0 flex h-[42px] items-center font-['Instrument_Sans:Medium'] text-[24px] font-medium leading-[32px] text-[#0f172a]";
const titleStyle = { fontVariationSettings: '"wdth" 100' };
const dimText = `text-[12px] leading-[18px] tracking-[-0.01px] text-[#94a3b8] ${fontRegular}`;

function Avatar({ name, photo, color, size }: { name: string; photo?: string; color: string; size: string }) {
  if (photo) return <img src={photo} alt="" className={`${size} shrink-0 rounded-full object-cover`} />;
  return (
    <span aria-hidden="true" className={`flex ${size} shrink-0 items-center justify-center rounded-full text-[10px] text-white ${fontBold}`} style={{ backgroundColor: color }}>
      {name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}

const Dots = (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="12" cy="19" r="1.7" />
  </svg>
);
const dotsClass = "flex size-7 items-center justify-center rounded-full text-[#334155] transition hover:bg-[#f1f5f9]";

function ReplyCount({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex items-center gap-1.5 transition hover:text-[#64748b] ${dimText}`}>
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 7l5 8h6M11 12l3 3-3 3M15 7l4 6-1 2" />
      </svg>
      {count} {count === 1 ? "reply" : "replies"}
    </button>
  );
}

function Upvote({ count, on, onClick }: { count: number; on: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`transition hover:text-[#64748b] ${dimText} ${on ? "!text-[#faa104]" : ""}`}>
      Upvote({count + (on ? 1 : 0)})
    </button>
  );
}

function QuestionCard({ q, allCourses, upvoted, onUpvote, onReply, onCourse, onFeature, onDelete }: { q: Question; allCourses: boolean; upvoted: boolean; onUpvote: () => void; onReply: () => void; onCourse: () => void; onFeature: () => void; onDelete: () => void }) {
  const pinned = Boolean(q.featured) && !allCourses;
  return (
    <article className="relative flex flex-col rounded-[12px] bg-white px-6 py-4 shadow-[0px_1px_0px_0px_rgba(27,31,35,0.04)]">
      {pinned && (
        <span title="Featured question" className="absolute left-0 top-0 size-10 rounded-tl-[12px] bg-[#10b981] [clip-path:polygon(0_0,100%_0,0_100%)]">
          <svg viewBox="0 0 24 24" className="absolute left-1 top-1 size-3 text-white" fill="currentColor" aria-hidden="true">
            <path d="M14 3l7 7-3 1-4 4 1 4-2 2-4-5-5 5-1-1 5-5-5-4 2-2 4 1 4-4 1-3z" />
          </svg>
          <span className="sr-only">Featured question</span>
        </span>
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={q.student} photo={q.photo} color={q.color} size="size-8" />
          <p className="flex flex-wrap items-center gap-[3px]">
            <span className={`text-[12px] leading-[18px] tracking-[-0.01px] text-[#475569] ${fontSemi}`}>{q.student}</span>
            <span aria-hidden="true" className={`text-[10px] leading-[1.6] tracking-[0.1px] text-[#94a3b8] ${fontRegular}`}>
              •
            </span>
            <span className={`text-[10px] leading-[1.6] tracking-[0.1px] text-[#94a3b8] ${fontRegular}`}>{q.posted}</span>
          </p>
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
      {allCourses && (
        <p className={`mt-2 flex flex-wrap items-center gap-x-2 text-[12px] leading-[18px] tracking-[-0.01px] text-[#64748b] ${fontRegular}`}>
          <button type="button" onClick={onCourse} className="italic underline transition [font-synthesis:style] hover:text-[#0f172a]">
            {q.course}
          </button>
          <span aria-hidden="true">•</span>
          {q.lecture}
        </p>
      )}
      <button type="button" onClick={() => openInstructorQa(q.id)} className="mt-5 flex flex-col gap-1 text-left">
        <span className={`text-[16px] leading-[24px] text-[#334155] ${fontSemi}`}>{q.title}</span>
        <span className={`text-[16px] leading-[28px] text-[#334155] ${fontRegular}`}>{q.text}</span>
      </button>
      {!pinned && (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <ReplyCount count={q.replies.length} onClick={() => openInstructorQa(q.id)} />
          <button type="button" onClick={onReply} className={`h-[26px] rounded-[4px] bg-[#f8fafc] px-2 text-[12px] leading-[18px] tracking-[-0.01px] text-[#334155] transition hover:bg-[#f1f5f9] ${fontMedium}`}>
            Give Reply
          </button>
          <Upvote count={q.votes} on={upvoted} onClick={onUpvote} />
        </div>
      )}
    </article>
  );
}

function CourseBar({ course }: { course: string }) {
  return (
    <div className="flex items-center gap-4 border-y border-[#e2e8f0] bg-white px-4 py-4 md:px-7">
      <img src={imgThumb} alt="" className="h-8 w-12 shrink-0 rounded-[4px] object-cover" />
      <p className={`text-[18px] leading-[28px] text-[#1e293b] ${fontSemi}`}>{course}</p>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`h-9 w-fit rounded-[6px] border border-[#1e293b] px-3 text-[14px] leading-[20px] text-[#1e293b] transition hover:bg-[#f8fafc] ${fontMedium}`}>
      Back
    </button>
  );
}

function Thread({ q, upvoted, focusEditor, onUpvote, onAddReply, onDeleteReply }: { q: Question; upvoted: string[]; focusEditor: boolean; onUpvote: (id: string) => void; onAddReply: (reply: Reply) => void; onDeleteReply: (id: string) => void }) {
  const { user } = useApp();
  const [hovered, setHovered] = useState<string | null>(null);
  const activeReply = hovered ?? q.replies[0]?.id;
  const focusComposer = () => document.querySelector<HTMLElement>("#qa-composer [contenteditable]")?.focus();

  return (
    <div className="flex flex-col gap-5 rounded-[12px] border border-[#e2e8f0] bg-white p-6">
      <BackButton onClick={() => openInstructorQa()} />
      <div className="flex gap-4">
        <Avatar name={q.student} photo={q.photo} color={q.color} size="size-8" />
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-[3px]">
            <span className={`text-[12px] leading-[18px] tracking-[-0.01px] text-[#475569] ${fontSemi}`}>{q.student}</span>
            <span aria-hidden="true" className={`text-[10px] leading-[1.6] text-[#94a3b8] ${fontRegular}`}>
              •
            </span>
            <span className={`text-[10px] leading-[1.6] tracking-[0.1px] text-[#94a3b8] ${fontRegular}`}>{q.posted}</span>
          </p>
          <p className={`mt-3 text-[16px] leading-[24px] text-[#334155] ${fontSemi}`}>{q.title}</p>
          <p className={`mt-1 text-[16px] leading-[28px] text-[#334155] ${fontRegular}`}>{q.text}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-4">
            <ReplyCount count={q.replies.length} onClick={() => document.getElementById("qa-replies")?.scrollIntoView({ behavior: "smooth", block: "nearest" })} />
            <button type="button" onClick={focusComposer} className={`text-[12px] leading-[18px] tracking-[-0.01px] text-[#475569] transition hover:text-[#0f172a] ${fontSemi}`}>
              Reply
            </button>
            <Upvote count={q.votes} on={upvoted.includes(q.id)} onClick={() => onUpvote(q.id)} />
          </div>
        </div>
      </div>
      <div id="qa-replies" className="flex flex-col gap-5 md:pl-12" onMouseLeave={() => setHovered(null)}>
        {q.replies.map((reply, i) => (
          <div key={reply.id} onMouseEnter={() => setHovered(reply.id)} onFocus={() => setHovered(reply.id)} className={`flex flex-col gap-2 transition-opacity ${activeReply === reply.id ? "" : "opacity-50"}`}>
            <div className="flex items-start gap-1.5">
              <Avatar name={reply.name} color={reply.color} size="size-6" />
              <div className="min-w-0 flex-1 rounded-[8px] bg-[#f8fafc] px-3 py-2">
                <p className="flex flex-wrap items-center gap-2.5">
                  <span className={`text-[12px] leading-[18px] tracking-[-0.01px] text-[#475569] ${fontMedium}`}>{reply.name}</span>
                  {reply.you && <span className={`rounded-[3px] bg-[#f97316] px-1.5 text-[10px] leading-[16px] text-white ${fontSemi}`}>You</span>}
                  <span aria-hidden="true" className="text-[#94a3b8]">
                    •
                  </span>
                  <span className={dimText}>{reply.when}</span>
                </p>
                <NoteBody note={{ text: reply.text, html: reply.html }} tone="text-[#334155]" className="mt-1 !leading-[24px]" />
              </div>
              <ActionMenu label={`More actions for reply from ${reply.name}`} trigger={Dots} triggerClass={dotsClass} items={[{ label: "Delete", onClick: () => onDeleteReply(reply.id) }]} />
            </div>
            {i > 0 && (
              <div className="flex items-center gap-4 pl-[30px]">
                <button type="button" onClick={focusComposer} className={`text-[12px] leading-[18px] tracking-[-0.01px] text-[#64748b] transition hover:text-[#0f172a] ${fontSemi}`}>
                  Reply
                </button>
                <Upvote count={reply.votes} on={upvoted.includes(reply.id)} onClick={() => onUpvote(reply.id)} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div id="qa-composer" className="flex flex-col gap-3 md:pl-12">
        <p className={`text-[12px] leading-[18px] text-[#0f172a] ${fontSemi}`}>Add your comment</p>
        <NoteEditor
          key={q.id}
          extras
          linkOnly
          toolbarTop
          clearOnSave
          autoFocus={focusEditor}
          placeholder="Add a comment...."
          saveLabel="Reply"
          onSave={(text, html) => onAddReply({ id: `reply-${Date.now()}`, name: user?.name ?? INSTRUCTOR, you: true, color: "#1e293b", when: "Just now", text, html, votes: 0 })}
        />
      </div>
    </div>
  );
}

function NewFeatured({ onCreate }: { onCreate: (lecture: string, title: string, text: string, html: string) => void }) {
  const { notify } = useApp();
  const [lecture, setLecture] = useState("");
  const [title, setTitle] = useState("");
  const [answer, setAnswer] = useState({ text: "", html: "" });
  const label = `text-[14px] leading-[20px] text-[#334155] ${fontMedium}`;

  const submit = () => {
    if (!lecture) return notify("Select a lecture first");
    if (!title.trim()) return notify("Add a question title first");
    if (!answer.text && !answer.html) return notify("Write the answer first");
    onCreate(lecture, title.trim(), answer.text, answer.html);
  };

  return (
    <div className="flex flex-col gap-6 rounded-[12px] border border-[#e2e8f0] bg-white p-6">
      <BackButton onClick={() => openInstructorQa()} />
      <h2 className={`text-[18px] leading-[28px] text-[#334155] ${fontSemi}`}>New Featured Questions</h2>
      <div className="flex max-w-[815px] flex-col gap-4">
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
            <input id="qa-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Type the question title" className={`min-w-0 flex-1 bg-transparent text-[14px] leading-[24px] text-[#1e293b] outline-none placeholder:text-[#94a3b8] ${fontRegular}`} />
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
      <button type="button" onClick={submit} className={`h-[44px] w-fit rounded-[8px] bg-[#ffb20d] px-5 text-[16px] leading-[20px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
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
  const [replyTarget, setReplyTarget] = useState<string | null>(null);

  useEffect(() => save(STORE_KEY, questions), [questions]);
  useEffect(() => save(`${STORE_KEY}.votes`, upvoted), [upvoted]);

  const toggleVote = (id: string) => setUpvoted((list) => (list.includes(id) ? list.filter((v) => v !== id) : [...list, id]));
  const updateQuestion = (id: string, next: (q: Question) => Question) => setQuestions((list) => list.map((q) => (q.id === id ? next(q) : q)));

  if (newQuestionCourse) {
    return (
      <main className="flex flex-1 flex-col bg-[#f1f5f9]">
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
              const answer: Reply = { id: `reply-${Date.now()}`, name, you: true, color: "#1e293b", when: "Just now", text, html, votes: 0 };
              setQuestions((list) => [{ id: `q-${Date.now()}`, student: name, color: "#1e293b", posted: "Posted just now", course: newQuestionCourse, lecture, title, text, votes: 0, featured: true, replies: [answer] }, ...list]);
              setCourse(newQuestionCourse);
              notify("Featured question added");
              openInstructorQa();
            }}
          />
        </div>
      </main>
    );
  }

  const open = questions.find((q) => q.id === questionId);
  if (open) {
    return (
      <main className="flex flex-1 flex-col bg-[#f1f5f9]">
        <div className="bg-white px-4 py-6 md:px-7">
          <h1 className={titleClass} style={titleStyle}>
            Question and Answers
          </h1>
        </div>
        <CourseBar course={open.course} />
        <div className="px-4 py-4 md:px-7">
          <Thread
            q={open}
            upvoted={upvoted}
            focusEditor={replyTarget === open.id}
            onUpvote={toggleVote}
            onAddReply={(reply) => updateQuestion(open.id, (q) => ({ ...q, replies: [...q.replies, reply] }))}
            onDeleteReply={(id) => updateQuestion(open.id, (q) => ({ ...q, replies: q.replies.filter((r) => r.id !== id) }))}
          />
        </div>
      </main>
    );
  }

  const allCourses = course === "all";
  const inCourse = allCourses ? questions : questions.filter((q) => q.course === course);
  const matching = inCourse.filter((q) => filter === "all" || (filter === "answered" ? q.replies.length > 0 : q.replies.length === 0));
  // Inside one course, featured questions stay on top where the pin is shown.
  const visible = allCourses ? matching : [...matching].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));

  const courseMenu = (
    <ActionMenu
      label={`Course: ${allCourses ? "All Courses" : course}`}
      alignLeft
      triggerClass={`flex items-center gap-3 text-left text-[20px] leading-[32px] tracking-[0.15px] text-[#0f172a] ${fontHeading}`}
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
    <div className="flex max-w-full overflow-x-auto">
      {[
        { key: "all", label: "All Questions" },
        { key: "unanswered", label: "Not Answered" },
        { key: "answered", label: "Answered" },
      ].map((s) => (
        <button key={s.key} type="button" aria-pressed={filter === s.key} onClick={() => setFilter(s.key)} className={`-ml-px h-9 whitespace-nowrap border px-3 text-[14px] leading-[20px] transition first:ml-0 first:rounded-l-[8px] last:rounded-r-[8px] ${filter === s.key ? "relative z-10 border-[#ffb20d] bg-[#fff9f0] text-[#faa104]" : "border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc]"} ${fontMedium}`}>
          {s.label}
        </button>
      ))}
    </div>
  );

  return (
    <main className="flex flex-1 flex-col bg-[#f1f5f9]">
      <div className="bg-white px-4 py-6 md:px-7">
        <h1 className={titleClass} style={titleStyle}>
          Question and Answers
        </h1>
      </div>
      <div className="flex flex-col gap-4 px-4 pb-8 pt-5 md:pl-8 md:pr-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            {courseMenu}
            {allCourses && (
              <p className={`mt-1 text-[12px] leading-[18px] text-[#475569] ${fontRegular}`}>
                Showing {visible.length} questions from student
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {segments}
            {!allCourses && (
              <button type="button" onClick={() => openNewFeaturedQuestion(course)} className={`flex h-9 items-center gap-1.5 rounded-[8px] bg-[#ffb20d] px-3 text-[14px] leading-[20px] tracking-[-0.01px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
                <img src={imgPlusSmall} alt="" width={18} height={18} className="size-[18px]" />
                Add Feature Question
              </button>
            )}
          </div>
        </div>
        {visible.map((q) => (
          <QuestionCard
            key={q.id}
            q={q}
            allCourses={allCourses}
            upvoted={upvoted.includes(q.id)}
            onUpvote={() => toggleVote(q.id)}
            onReply={() => {
              setReplyTarget(q.id);
              openInstructorQa(q.id);
            }}
            onCourse={() => {
              setCourse(q.course);
              window.scrollTo({ top: 0, behavior: "instant" });
            }}
            onFeature={() => updateQuestion(q.id, (item) => ({ ...item, featured: !item.featured }))}
            onDelete={() => {
              setQuestions((list) => list.filter((item) => item.id !== q.id));
              notify("Question deleted");
            }}
          />
        ))}
        {visible.length === 0 && <p className={`rounded-[12px] bg-white px-6 py-12 text-center text-[14px] text-[#64748b] ${fontRegular}`}>No questions here yet.</p>}
      </div>
    </main>
  );
}
