// Built-in "Suggest with AI" drafts for the course builder.
//
// Everything here is written from the course's own details (title, subtitle, category, level, topics, objectives)
// with templates, so it works offline with no API key. Each function is async and takes a `seed`, which is the
// shape a real model call would have: to switch to a real AI later, replace the bodies with a request to your own
// server and keep the signatures.

export type CourseContext = {
  title: string;
  subtitle: string;
  category: string;
  subCategory: string;
  level: string;
  topics: string[];
  objectives: string[];
};

export type PointKind = "objectives" | "requirements" | "audience";

const TOOLS = ["Figma", "Python", "React", "JavaScript", "TypeScript", "Excel", "Power BI", "Tableau", "SQL", "Photoshop", "Illustrator", "Canva", "ChatGPT", "Notion", "WordPress", "Flutter", "Swift", "Kotlin", "Java", "Node.js", "Django", "AWS", "Docker", "Blender", "Premiere Pro", "After Effects", "Webflow", "Shopify", "Google Ads", "HubSpot"];

// Short pause so drafts arrive like a model response instead of appearing instantly.
const think = () => new Promise((resolve) => setTimeout(resolve, 650 + Math.random() * 500));

// Deterministic shuffle: the same seed gives the same order, a new seed gives a new mix.
function shuffle<T>(items: T[], seed: number) {
  const out = [...items];
  let s = (seed * 9301 + 49297) % 233280 || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function describe(ctx: CourseContext) {
  const lead = ctx.title.split(/[:|–—-]/)[0].trim();
  const tool = TOOLS.find((t) => new RegExp(`\\b${t.replace(/[.+]/g, "\\$&")}\\b`, "i").test(`${ctx.title} ${ctx.subtitle} ${ctx.topics.join(" ")}`));
  // "UI/UX Design with Figma" -> "UI/UX design"; falls back to sub category, topic or category.
  const fromTitle = lead.replace(new RegExp(`\\s+(with|using|in|for)\\s+${tool ?? "\\b\\B"}.*$`, "i"), "").replace(/^(the\s+)?(complete|ultimate|practical|modern|learn|intro(duction)? to)\s+/i, "");
  const raw = ctx.subCategory || fromTitle || ctx.topics[0] || ctx.category || "this subject";
  const subject = raw.length > 40 ? ctx.subCategory || ctx.category || "this subject" : raw;
  const lower = /^[A-Z0-9/]+$/.test(subject.split(" ")[0]) ? subject.replace(/\s(\S)/g, (m) => m.toLowerCase()) : subject.toLowerCase();
  const level = ctx.level || "All levels";
  const beginner = level === "Beginner" || level === "All levels";
  return { subject: lower, Subject: cap(subject), tool, level, beginner, field: ctx.category || subject };
}

export async function suggestPoints(kind: PointKind, ctx: CourseContext, existing: string[], seed: number): Promise<string[]> {
  await think();
  const { subject, Subject, tool, level, beginner, field } = describe(ctx);
  const pools: Record<PointKind, string[]> = {
    objectives: [
      `Explain the core ideas of ${subject} in plain language`,
      `Build a complete ${subject} project from start to finish`,
      tool ? `Use ${tool} confidently for everyday ${subject} work` : `Choose the right tools for each ${subject} task`,
      `Apply ${subject} best practices to real-world problems`,
      `Spot and fix the most common ${subject} mistakes`,
      `Plan, create and review your own ${subject} work`,
      `Present your ${subject} work clearly to clients or teammates`,
      `Create a portfolio piece that shows your ${subject} skills`,
      tool ? `Speed up your ${tool} workflow with shortcuts and reusable parts` : `Work faster with a repeatable ${subject} process`,
      level === "Advanced" ? `Scale ${subject} work for large, complex projects` : `Know what to learn next after the basics of ${subject}`,
    ],
    requirements: [
      beginner ? `No previous ${subject} experience is needed` : level === "Intermediate" ? `Basic familiarity with ${subject}` : `Solid experience with ${subject} fundamentals`,
      "A computer with an internet connection",
      tool ? `A free ${tool} account (we set it up together in the first lesson)` : "Free tools only. We show you how to set them up",
      "About 2–3 hours a week to watch lessons and practise",
      beginner ? "Curiosity and a wish to learn. We teach you the rest" : `Comfort working on ${field.toLowerCase()} projects on your own`,
    ],
    audience: [
      `Beginners who want a practical, hands-on start in ${subject}`,
      `Professionals who want to add ${subject} to their skill set`,
      `Students preparing for a career in ${field.toLowerCase()}`,
      `Freelancers who want to offer ${subject} services to clients`,
      "Career changers looking for an in-demand, practical skill",
      `Team leads who work alongside ${Subject} specialists`,
    ],
  };
  return shuffle(pools[kind], seed)
    .filter((s) => !existing.some((e) => same(e, s)))
    .slice(0, 5);
}

export async function suggestTitles(ctx: CourseContext, seed: number): Promise<{ titles: string[]; subtitles: string[] }> {
  await think();
  const { subject, Subject, tool, level, beginner } = describe(ctx);
  const who = beginner ? "Beginners" : level === "Intermediate" ? "Growing Professionals" : "Experienced Practitioners";
  const year = new Date().getFullYear();
  const skills = (ctx.topics.length ? ctx.topics : ctx.objectives.slice(0, 3)).slice(0, 3).map((s) => s.toLowerCase());
  const skillText = skills.length > 1 ? `${skills.slice(0, -1).join(", ")} and ${skills[skills.length - 1]}` : skills[0] || `the essentials of ${subject}`;
  const titles = [
    `${Subject}${tool && !Subject.includes(tool) ? ` with ${tool}` : ""}: From Beginner to Pro`,
    `Learn ${Subject} by Building Real Projects`,
    `${Subject} for ${who}: A Practical Guide`,
    `The Complete ${Subject} Course ${year}`,
    `${Subject} Made Simple${tool && !Subject.includes(tool) ? ` with ${tool}` : ""}`,
    `Hands-on ${Subject}: Skills You Can Use at Work`,
  ];
  const subtitles = [
    `Master ${skillText} with short lessons and real projects`,
    `Go from first steps to a finished ${subject} project you can show employers`,
    `Practical ${subject} lessons with exercises, templates and a final project`,
    `Learn ${skillText} step by step, at your own pace`,
  ];
  const fit = (list: string[], max: number) => shuffle(list, seed).filter((s) => s.length <= max && !same(s, ctx.title) && !same(s, ctx.subtitle));
  return { titles: fit(titles, 60).slice(0, 3), subtitles: fit(subtitles, 120).slice(0, 3) };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function suggestDescription(ctx: CourseContext, seed: number): Promise<{ text: string; html: string }> {
  const { subject, tool, level, beginner } = describe(ctx);
  const learn = ctx.objectives.length >= 3 ? ctx.objectives.slice(0, 6) : await suggestPoints("objectives", ctx, [], seed);
  const pick = <T,>(options: T[]) => shuffle(options, seed)[0];
  const levelText = level === "All levels" ? "suitable for all levels" : `designed for ${level.toLowerCase()} learners`;

  const intro = pick([
    `${ctx.subtitle ? `${ctx.subtitle.replace(/\.$/, "")}. ` : ""}This course is a practical, step-by-step guide to ${subject}${tool ? ` using ${tool}` : ""}, ${levelText}. Instead of long theory, you learn each idea through short lessons and then use it straight away on real examples, so the skills stay with you long after the course ends.`,
    `Want to get genuinely good at ${subject}? ${ctx.subtitle ? `${ctx.subtitle.replace(/\.$/, "")}. ` : ""}This course, ${levelText}, walks you through ${subject}${tool ? ` in ${tool}` : ""} one clear step at a time. Every lesson is short and focused, and every section ends with something you build yourself.`,
  ]);
  const how = pick([
    `Each section mixes short video lessons with hands-on exercises, so you practise every idea right after you learn it. Quizzes help you check your understanding, and downloadable resources give you templates and checklists to reuse in your own work. By the end, you will have a complete project you can add to your portfolio or show to an employer.`,
    `The course is built around doing, not just watching. You follow along with real examples, complete a practical exercise at the end of every section and check your progress with short quizzes. You also get the files and templates used in the lessons, so you can apply the same process to your own projects with confidence.`,
  ]);
  const who = beginner
    ? `You do not need any previous experience with ${subject}. We start with the basics, explain every term in plain language and build up gradually, so you never feel lost.`
    : `You should already know the basics of ${subject}. We build on that foundation quickly and focus on the techniques and habits that separate good work from great work.`;
  const close = pick([
    `If you want a clear, practical path into ${subject}, this course is for you. Enroll today and start building skills you can use right away.`,
    `Join today, follow along at your own pace and finish with real ${subject} skills and a project you are proud of.`,
  ]);

  const text = [intro, "In this course you will:", ...learn.map((l) => `• ${l}`), how, who, close].join("\n\n");
  const html = `<p>${esc(intro)}</p><p><b>In this course you will:</b></p><ul>${learn.map((l) => `<li>${esc(l)}</li>`).join("")}</ul><p>${esc(how)}</p><p>${esc(who)}</p><p>${esc(close)}</p>`;
  return { text, html };
}

// ---- Lecture drafts (title and description in the lecture drawer) ----

export type LectureContext = {
  course: CourseContext;
  sectionTitle: string;
  lectureTitle: string;
  kind: "Video" | "Quiz" | "Assignment" | "Article";
  // Other lecture titles in the same section, so suggestions don't repeat them.
  siblings: string[];
};

// Names the app gives by default ("New video Lecture - 001", "Section 001 - Nov 10th, 2026") say nothing about the topic.
const isDefaultLecture = (t: string) => !t.trim() || /^new .*lecture( - \d+)?$/i.test(t.trim());
const isDefaultSection = (t: string) => !t.trim() || /^section \d+( - .*)?$/i.test(t.trim());

// Sentence case for a topic inside a sentence: keeps acronyms (UI/UX, SQL) and tool names (Figma), lowercases the rest.
const tidy = (topic: string) =>
  topic
    .replace(/^the\s+/i, "")
    .split(" ")
    .map((w) => (/[A-Z].*[A-Z]|\//.test(w) || TOOLS.some((t) => same(t, w)) ? w : w.toLowerCase()))
    .join(" ");

function lectureTopic(ctx: LectureContext) {
  const { subject } = describe(ctx.course);
  if (!isDefaultLecture(ctx.lectureTitle)) return ctx.lectureTitle.trim();
  if (!isDefaultSection(ctx.sectionTitle)) return ctx.sectionTitle.trim();
  return subject;
}

export async function suggestLectureTitles(ctx: LectureContext, seed: number): Promise<string[]> {
  await think();
  const lower = tidy(lectureTopic(ctx));
  const { tool } = describe(ctx.course);
  const pools: Record<LectureContext["kind"], string[]> = {
    Video: [
      `${cap(lower)}: a step-by-step walkthrough`,
      `Getting started with ${lower}`,
      `${cap(lower)} in practice`,
      `How ${lower} works, explained simply`,
      tool ? `${cap(lower)} in ${tool}` : `${cap(lower)}: common mistakes to avoid`,
      `Your first look at ${lower}`,
    ],
    Quiz: [`Check your knowledge: ${lower}`, `${cap(lower)} quiz`, `Quick review: ${lower}`, `Test yourself on ${lower}`],
    Assignment: [`Practice: ${lower}`, `Hands-on project: ${lower}`, `Apply it: ${lower}`, `Build it yourself: ${lower}`],
    Article: [`${cap(lower)}: a quick guide`, `${cap(lower)} cheat sheet`, `Read first: ${lower}`, `Key ideas in ${lower}`],
  };
  return shuffle(pools[ctx.kind], seed)
    .filter((title) => !ctx.siblings.some((s) => same(s, title)) && !same(title, ctx.lectureTitle))
    .slice(0, 3);
}

export async function suggestLectureDescription(ctx: LectureContext, seed: number, limit = 500): Promise<string> {
  await think();
  const lower = tidy(lectureTopic(ctx));
  const { tool, beginner } = describe(ctx.course);
  const pick = (options: string[]) => shuffle(options, seed)[0];
  const ease = beginner ? "No previous experience needed." : "Builds on what you already know.";
  const bodies: Record<LectureContext["kind"], string[]> = {
    Video: [
      `In this lecture you learn about ${lower}${tool ? ` in ${tool}` : ""}, step by step. We start with why it matters, then work through a real example together so you can see each decision. By the end you can apply the same approach to your own project. ${ease}`,
      `This video walks you through ${lower}, with a practical example${tool ? ` in ${tool}` : ""}. You see the full process from start to finish, plus the common mistakes to avoid. Follow along, pause when you need to, and try each step yourself.`,
    ],
    Quiz: [
      `A short quiz to check your understanding of ${lower}. Each question has an explanation, so you learn from every answer. Retake it as often as you like.`,
      `Test what you learned about ${lower} before you move on. The questions focus on the key ideas from this section, and you see why each answer is right or wrong.`,
    ],
    Assignment: [
      `Put ${lower} into practice. Follow the brief, create your own version and compare it with the example solution. This is where the skills from this section really stick.`,
      `A hands-on task on ${lower}. Use the steps from the previous lectures, then share your result or check it against the checklist provided.`,
    ],
    Article: [
      `A short read on ${lower}. It sums up the key ideas, gives you a quick checklist and links the terms you need for the next lectures. Keep it open while you work.`,
      `Everything important about ${lower} on one page. Use it as a reference while you practise, and come back to it whenever you need a reminder.`,
    ],
  };
  const text = pick(bodies[ctx.kind]);
  return text.length > limit ? `${text.slice(0, limit - 1).replace(/\s+\S*$/, "")}…` : text;
}

// ---- Quiz question drafts ----

export type QuizDraft = { text: string; options: { text: string; explanation: string; correct: boolean }[] };

// Tool-specific questions with known answers. Only used when the course is about that tool.
const TOOL_QUESTIONS: Record<string, QuizDraft[]> = {
  Figma: [
    { text: "Which Figma feature lets you reuse a design element and update every copy at once?", options: [
      { text: "Components", explanation: "Change the main component and every instance updates.", correct: true },
      { text: "Groups", explanation: "Groups only hold layers together. Copies don't stay linked.", correct: false },
      { text: "Frames", explanation: "Frames contain a layout but don't sync copies.", correct: false },
      { text: "Comments", explanation: "Comments are for feedback, not for reusing design.", correct: false },
    ] },
    { text: "Which Figma feature resizes a frame to fit its content automatically?", options: [
      { text: "Auto layout", explanation: "Auto layout grows and shrinks a frame with its content.", correct: true },
      { text: "Constraints", explanation: "Constraints control how layers move when the parent resizes.", correct: false },
      { text: "Layout grids", explanation: "Grids help you align, but don't resize anything.", correct: false },
      { text: "Masks", explanation: "Masks hide parts of layers.", correct: false },
    ] },
    { text: "How do you let people click from one screen to the next in Figma?", options: [
      { text: "Add prototype connections between frames", explanation: "Connections in Prototype mode link screens together.", correct: true },
      { text: "Group the screens", explanation: "Grouping doesn't create any interaction.", correct: false },
      { text: "Export the screens as PNG", explanation: "Images can't be clicked through.", correct: false },
      { text: "Rename the layers", explanation: "Layer names don't add interactions.", correct: false },
    ] },
  ],
};

export async function suggestQuizQuestions(ctx: LectureContext, count: number, seed: number, existing: string[] = []): Promise<QuizDraft[]> {
  await think();
  // "Figma basics check" -> "Figma basics", "Check your knowledge: wireframes" -> "wireframes".
  const topic = tidy(
    lectureTopic(ctx)
      .replace(/^(check your knowledge|quick review|test yourself on|quiz)\s*:?\s*/i, "")
      .replace(/\s+(knowledge\s+)?(check|quiz|test|review|assessment)$/i, "")
      .trim() || describe(ctx.course).subject,
  );
  const { tool } = describe(ctx.course);
  const general: QuizDraft[] = [
    { text: `When you start a new ${topic} task, what should you do first?`, options: [
      { text: "Define the goal and who it is for", explanation: "A clear goal guides every decision that follows.", correct: true },
      { text: "Choose colours and fonts", explanation: "Visual details come after the goal is clear.", correct: false },
      { text: "Copy a finished example exactly", explanation: "Examples help, but copying skips the thinking.", correct: false },
      { text: "Skip planning and start building", explanation: "Without a plan, you often redo work later.", correct: false },
    ] },
    { text: `What is the best way to check your ${topic} work?`, options: [
      { text: "Test it with the people it is for, then improve it", explanation: "Real feedback shows what works and what doesn't.", correct: true },
      { text: "Only review it yourself", explanation: "You can miss problems in your own work.", correct: false },
      { text: "Never change it after the first version", explanation: "Good work usually takes a few rounds.", correct: false },
      { text: "Focus only on how it looks", explanation: "How it works matters as much as how it looks.", correct: false },
    ] },
    { text: `Why do we practise ${topic} on a real example?`, options: [
      { text: "To apply each step and spot mistakes early", explanation: "Practice turns ideas into skills you keep.", correct: true },
      { text: "Because theory is not useful", explanation: "Theory helps. Practice makes it stick.", correct: false },
      { text: "To finish the course faster", explanation: "Practice takes time, but saves time later.", correct: false },
      { text: "It is only for advanced learners", explanation: "Practice helps at every level.", correct: false },
    ] },
    { text: `What should you do after you get feedback on your ${topic} work?`, options: [
      { text: "Decide which points matter most and make a new version", explanation: "Act on the feedback that helps your goal.", correct: true },
      { text: "Ignore it and keep your version", explanation: "Feedback is a quick way to improve.", correct: false },
      { text: "Change everything people mention", explanation: "Not every comment fits your goal.", correct: false },
      { text: "Start again from nothing", explanation: "You can usually improve what you have.", correct: false },
    ] },
    { text: `Which habit helps most when learning ${topic}?`, options: [
      { text: "Practising a little after every lecture", explanation: "Short, regular practice beats long, rare sessions.", correct: true },
      { text: "Watching every lecture before trying anything", explanation: "Waiting too long makes ideas fade.", correct: false },
      { text: "Learning only from one example", explanation: "Several examples show you the pattern.", correct: false },
      { text: "Avoiding mistakes at all costs", explanation: "Mistakes are part of how you learn.", correct: false },
    ] },
  ];
  const pool = [...(tool && TOOL_QUESTIONS[tool] ? TOOL_QUESTIONS[tool] : []), ...general];
  const fresh = shuffle(pool, seed).filter((q) => !existing.some((e) => same(e, q.text)));
  // Shuffle the answers too, so the correct one isn't always first.
  return fresh.slice(0, count).map((q, i) => ({ ...q, options: shuffle(q.options, seed + i + 1) }));
}

// ---- Article lecture draft ----

export async function suggestArticle(ctx: LectureContext, seed: number): Promise<{ text: string; html: string }> {
  await think();
  const topic = tidy(lectureTopic(ctx));
  // Titles that start with an action ("Set up your account") read as a how-to.
  const howTo = /^(set up|build|create|make|use|design|add|install|learn|write|plan|test|share|export|import|link|start|get started with|choose|organi[sz]e)\b/i.test(topic);
  const subject = howTo ? `how to ${topic.charAt(0).toLowerCase()}${topic.slice(1)}` : topic;
  const { tool, beginner } = describe(ctx.course);
  const where = tool && !new RegExp(`\\b${tool}\\b`, "i").test(topic) ? ` in ${tool}` : "";
  const pick = (options: string[]) => shuffle(options, seed)[0];
  const intro = pick([
    `This short read explains ${subject}${where}. Keep it open while you work through the next lectures.`,
    `Here is everything you need to know about ${subject}${where}, on one page. Use it as a quick reference whenever you need a reminder.`,
  ]);
  const points = howTo
    ? ["What you need before you start", "The steps, in order", "Common mistakes and how to avoid them", "How to check that it worked"]
    : [`What ${topic} is and why it matters`, "The key steps, in the order you will use them", "Common mistakes and how to avoid them", "A quick checklist to review your own work"];
  const tip = beginner
    ? "Tip: try each step yourself right after reading it. Short practice beats long reading."
    : "Tip: compare these steps with how you work today, and pick one habit to change this week.";
  // The title is already on the page, so the draft starts with the introduction.
  const html = `<p>${esc(intro)}</p><p><b>In this article:</b></p><ul>${points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul><p>${esc(tip)}</p>`;
  const text = [intro, "In this article:", ...points.map((p) => `• ${p}`), tip].join("\n\n");
  return { text, html };
}

// ---- Assignment drafts ----

export type AssignmentDraft = { prompt: { text: string; html: string }; model: { text: string; html: string }; answer: "text" | "textfiles" | "files" };
const rich = (lines: string[], list?: string[]) => ({
  text: [...lines, ...(list ?? []).map((l) => `• ${l}`)].join("\n"),
  html: lines.map((l) => (l.endsWith(":") ? `<p><b>${esc(l)}</b></p>` : `<p>${esc(l)}</p>`)).join("") + (list?.length ? `<ul>${list.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : ""),
});

// Titles that start with a verb ("Wireframe a food delivery app") are tasks, not topics, and need different phrasing.
const ACTION = /^(set up|build|create|make|use|design|add|install|learn|write|plan|test|share|export|import|link|start|get started with|choose|organi[sz]e|wireframe|prototype|sketch|draw|code|research|analy[sz]e|map|redesign|improve|publish|launch|present)\b/i;
function assignmentWords(ctx: LectureContext) {
  const topic = tidy(lectureTopic(ctx));
  const task = ACTION.test(topic);
  const verb = `${topic.charAt(0).toLowerCase()}${topic.slice(1)}`;
  const { tool } = describe(ctx.course);
  const where = tool && !new RegExp(`\\b${tool}\\b`, "i").test(topic) ? ` in ${tool}` : "";
  return {
    task,
    tool,
    where,
    // "how to wireframe a food delivery app" or "auto layout"
    subject: task ? `how to ${verb}` : topic,
    // "wireframe a food delivery app" or "create a small example of auto layout"
    doIt: task ? verb : `create a small example of ${topic}`,
    // "when they wireframe a food delivery app" or "with auto layout"
    mistakes: task ? `when they ${verb}` : `with ${topic}`,
    // "need to wireframe a food delivery app" or "use auto layout"
    useIn: task ? `need to ${verb}` : `use ${topic}`,
  };
}

export async function suggestAssignmentInstructions(ctx: LectureContext, seed: number): Promise<{ text: string; html: string }> {
  await think();
  const w = assignmentWords(ctx);
  const pick = (options: string[]) => shuffle(options, seed)[0];
  const intro = pick([
    `In this assignment you ${w.doIt}${w.where}. Work through each question and submit when you are done.`,
    `${w.task ? `Time to put it into practice. Your task: ${w.doIt}${w.where}.` : `Time to practise ${w.subject}${w.where}.`} Answer each question in your own words and share your work.`,
  ]);
  const rules = [
    "Answer every question. Short, clear answers are better than long ones.",
    w.tool ? `Share your ${w.tool} file or a link to it where a question asks for files.` : "Attach files where a question asks for them.",
    "Explain your choices in one or two sentences.",
    "Plan for about 30 to 45 minutes.",
  ];
  return rich([intro, "Before you start:"], rules);
}

export async function suggestAssignmentQuestions(ctx: LectureContext, count: number, seed: number, existing: string[] = []): Promise<AssignmentDraft[]> {
  await think();
  const w = assignmentWords(ctx);
  const bank: AssignmentDraft[] = [
    {
      answer: "textfiles",
      prompt: rich([`${cap(w.doIt)}${w.where}. Attach your file or a link, and describe what you made in two or three sentences.`]),
      model: rich(["A strong answer includes a working file and a short note that covers:"], ["What the work shows", "One choice you made and why", "What you would improve next"]),
    },
    {
      answer: "text",
      prompt: rich([`In your own words, explain ${w.subject} to someone new to the topic. Use one everyday example.`]),
      model: rich(["A good answer explains the idea in plain words, gives one simple real-world example and avoids jargon."]),
    },
    {
      answer: "text",
      prompt: rich([`What are two common mistakes people make ${w.mistakes}? For each one, say how to avoid it.`]),
      model: rich(["Look for two specific mistakes, each with a clear fix. For example:"], ["Skipping the planning step. Fix: sketch the idea first.", "Doing too much at once. Fix: finish one small part, then build on it."]),
    },
    {
      answer: "files",
      prompt: rich([`Take a screenshot of your finished work${w.where} and upload it.`]),
      model: rich(["The screenshot should show the finished result clearly, with labels or names that are easy to read."]),
    },
    {
      answer: "text",
      prompt: rich([`Describe a real project where you would ${w.useIn}. What would you do first?`]),
      model: rich(["A strong answer names a concrete project, explains why it fits and lists a clear first step."]),
    },
    {
      answer: "textfiles",
      prompt: rich([`Take an earlier piece of your work and improve it with what you learned about ${w.subject}. Share the before and after.`]),
      model: rich(["The best answers show both versions and point out two or three specific changes, with the reason for each."]),
    },
  ];
  return shuffle(bank, seed)
    .filter((d) => !existing.some((e) => same(e, d.prompt.text)))
    .slice(0, count);
}
