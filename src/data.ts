export type Course = {
  id: string;
  title: string;
  instructor: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  hours: number;
  lessons: number;
  price: number;
  rating: number;
  students: number;
  live: boolean;
  description: string;
  outcomes: string[];
};

export const categories = [
  { name: "AI & Data", colors: ["#0d5c4b", "#12b981"] },
  { name: "Design", colors: ["#7c3aed", "#ec4899"] },
  { name: "Development", colors: ["#1d4ed8", "#39aeeb"] },
  { name: "Business", colors: ["#b45309", "#ffb20d"] },
  { name: "Marketing", colors: ["#be123c", "#fb7185"] },
  { name: "Languages", colors: ["#0f172a", "#475569"] },
] as const;

export const categoryColors = (category: string) =>
  categories.find((c) => c.name === category)?.colors ?? ["#0d5c4b", "#12b981"];

export const courses: Course[] = [
  {
    id: "ai-foundations",
    title: "AI Foundations for Everyone",
    instructor: "Dr. Sara Al-Qahtani",
    category: "AI & Data",
    level: "Beginner",
    hours: 6,
    lessons: 24,
    price: 199,
    rating: 4.9,
    students: 3120,
    live: true,
    description: "Understand how modern AI works, where it is useful, and how to start applying it at work without writing code.",
    outcomes: ["Explain machine learning in plain language", "Write effective prompts", "Spot good AI use cases in your team"],
  },
  {
    id: "python-data",
    title: "Python for Data Analysis",
    instructor: "Omar Al-Harbi",
    category: "AI & Data",
    level: "Intermediate",
    hours: 14,
    lessons: 48,
    price: 349,
    rating: 4.8,
    students: 2210,
    live: false,
    description: "Clean, explore and visualise real datasets with pandas and matplotlib, finishing with a portfolio project.",
    outcomes: ["Load and clean messy data", "Build charts that tell a story", "Ship a data analysis portfolio piece"],
  },
  {
    id: "prompt-engineering",
    title: "Prompt Engineering Masterclass",
    instructor: "Layla Hassan",
    category: "AI & Data",
    level: "Intermediate",
    hours: 4,
    lessons: 16,
    price: 149,
    rating: 4.7,
    students: 1840,
    live: true,
    description: "Practical techniques for getting reliable, high-quality output from large language models.",
    outcomes: ["Structure prompts for consistency", "Chain prompts into workflows", "Evaluate model output"],
  },
  {
    id: "color-theory",
    title: "Color Theory 101",
    instructor: "Thomas Greene",
    category: "Design",
    level: "Beginner",
    hours: 3,
    lessons: 12,
    price: 99,
    rating: 4.8,
    students: 960,
    live: true,
    description: "Learn how to build harmonious palettes and use color to guide attention in any design.",
    outcomes: ["Build palettes from scratch", "Use contrast for accessibility", "Apply color psychology"],
  },
  {
    id: "ui-ux-figma",
    title: "UI/UX Design with Figma",
    instructor: "Ava Lee",
    category: "Design",
    level: "Beginner",
    hours: 10,
    lessons: 36,
    price: 299,
    rating: 4.9,
    students: 2780,
    live: false,
    description: "Go from wireframes to polished, prototyped interfaces using Figma components and auto layout.",
    outcomes: ["Wireframe and prototype apps", "Build reusable components", "Run quick usability tests"],
  },
  {
    id: "react-modern",
    title: "Modern Web Apps with React",
    instructor: "Daniel Okafor",
    category: "Development",
    level: "Intermediate",
    hours: 18,
    lessons: 60,
    price: 399,
    rating: 4.8,
    students: 3400,
    live: false,
    description: "Build fast, accessible web applications with React, TypeScript and modern tooling.",
    outcomes: ["Structure a React codebase", "Manage state and data fetching", "Deploy to production"],
  },
  {
    id: "flutter-mobile",
    title: "Mobile Apps with Flutter",
    instructor: "Junko Tanaka",
    category: "Development",
    level: "Intermediate",
    hours: 16,
    lessons: 52,
    price: 379,
    rating: 4.7,
    students: 1520,
    live: true,
    description: "Create beautiful cross-platform mobile apps for iOS and Android from a single codebase.",
    outcomes: ["Build responsive Flutter layouts", "Connect to REST APIs", "Publish to the app stores"],
  },
  {
    id: "project-management",
    title: "Agile Project Management",
    instructor: "Jessica Smith",
    category: "Business",
    level: "Beginner",
    hours: 8,
    lessons: 28,
    price: 249,
    rating: 4.6,
    students: 1190,
    live: false,
    description: "Plan, run and deliver projects with Scrum and Kanban, with templates you can reuse immediately.",
    outcomes: ["Run effective sprints", "Write clear user stories", "Report progress to stakeholders"],
  },
  {
    id: "entrepreneurship",
    title: "Launch Your Startup in Saudi Arabia",
    instructor: "Faisal Al-Mutairi",
    category: "Business",
    level: "Beginner",
    hours: 7,
    lessons: 22,
    price: 0,
    rating: 4.8,
    students: 4050,
    live: true,
    description: "From idea validation to licensing and funding — a practical guide to the local startup ecosystem.",
    outcomes: ["Validate an idea quickly", "Understand licensing steps", "Pitch to investors"],
  },
  {
    id: "digital-marketing",
    title: "Digital Marketing Essentials",
    instructor: "Sofia Martinez",
    category: "Marketing",
    level: "Beginner",
    hours: 9,
    lessons: 30,
    price: 199,
    rating: 4.7,
    students: 2630,
    live: false,
    description: "Grow an audience with SEO, social media and paid ads, and measure what actually works.",
    outcomes: ["Plan a content calendar", "Run your first ad campaign", "Read analytics dashboards"],
  },
  {
    id: "business-english",
    title: "Business English Communication",
    instructor: "Aman Verma",
    category: "Languages",
    level: "Intermediate",
    hours: 12,
    lessons: 40,
    price: 229,
    rating: 4.8,
    students: 1870,
    live: true,
    description: "Speak and write confidently in meetings, emails and presentations.",
    outcomes: ["Write professional emails", "Lead meetings in English", "Present with confidence"],
  },
  {
    id: "arabic-beginners",
    title: "Arabic for Beginners",
    instructor: "Noura Al-Saud",
    category: "Languages",
    level: "Beginner",
    hours: 10,
    lessons: 34,
    price: 0,
    rating: 4.9,
    students: 5210,
    live: false,
    description: "Read, write and hold everyday conversations in Modern Standard Arabic.",
    outcomes: ["Read the Arabic alphabet", "Introduce yourself and others", "Handle everyday conversations"],
  },
];

export type FaqItem = { q: string; a: string };

export const faqs: Record<"Student" | "Instructor", FaqItem[]> = {
  Student: [
    { q: "What is the process of live sessions?", a: "Participate in scheduled classes using our app or web browser. Chat with your instructors and fellow students in real time." },
    { q: "What do I need to do to get a certification?", a: "Complete every lesson, pass the final assessment with at least 70%, and your certificate is issued instantly to your profile." },
    { q: "Are there courses that I can access offline?", a: "Yes. Recorded lessons can be downloaded in the mobile app and watched without an internet connection." },
    { q: "Can I get a refund if a course is not for me?", a: "You can request a full refund within 14 days of purchase as long as you have completed less than 30% of the course." },
    { q: "Are courses available in Arabic?", a: "Most courses are bilingual, with Arabic and English subtitles. Look for the language badge on each course page." },
  ],
  Instructor: [
    { q: "How do I become an instructor on Thkee?", a: "Submit the instructor application. Our team reviews it within 3 business days and helps you plan your first course." },
    { q: "How much can I earn?", a: "Instructors keep 70% of every sale on courses they publish, and earn a fixed fee for each live session they host." },
    { q: "What equipment do I need for live classes?", a: "A laptop with a webcam, a decent microphone and a stable internet connection are all you need to start." },
    { q: "Who owns the content I create?", a: "You do. You grant Thkee a licence to distribute your course, and you can remove it at any time." },
    { q: "Can I teach in Arabic?", a: "Absolutely. You can teach in Arabic, English or both, and we help you add subtitles." },
  ],
};

export const infoPages: Record<string, { title: string; body: string[] }> = {
  "About us": {
    title: "About Thkee",
    body: [
      "Thkee is an AI-powered learning platform that connects learners with expert instructors across the region.",
      "We combine live classes, bite-sized lessons and personalised learning paths so anyone can build real skills on their own schedule.",
    ],
  },
  "Our Vision": {
    title: "Our Vision",
    body: [
      "To make quality, bilingual education accessible to every learner in Saudi Arabia and beyond.",
      "We believe learning should be personal, interactive and directly connected to real careers.",
    ],
  },
  Career: {
    title: "Careers at Thkee",
    body: [
      "We are a small, ambitious team of educators, engineers and designers based in Riyadh.",
      "Open roles: Senior Frontend Engineer, Learning Experience Designer, Partnerships Manager. Send your CV to careers@thkee.example.",
    ],
  },
  Company: {
    title: "Company",
    body: ["Thkee Learning Technologies, Riyadh, Kingdom of Saudi Arabia.", "Supported by the National eLearning Center."],
  },
  Blog: {
    title: "Thkee Blog",
    body: [
      "5 ways AI is changing how we learn — March 2025",
      "How to stay motivated in online courses — February 2025",
      "Meet our instructors: Dr. Sara Al-Qahtani — January 2025",
    ],
  },
  "Terms of Service": {
    title: "Terms of Service",
    body: [
      "By creating an account you agree to use Thkee for lawful, personal learning purposes.",
      "Course content is licensed to you for personal use and may not be redistributed.",
    ],
  },
  "Privacy Policy": {
    title: "Privacy Policy",
    body: [
      "We only collect the information needed to run your account and improve your learning experience.",
      "We never sell your personal data. You can request deletion of your account at any time.",
    ],
  },
};
