import { useEffect, useRef, useState, type FormEvent } from "react";
import Experts from "./components/Experts";
import AuthPage from "./components/AuthPage";
import CartPage from "./components/CartPage";
import CheckoutPage from "./components/CheckoutPage";
import Hero from "./components/Hero";
import LearnPage from "./components/LearnPage";
import AccountSettingsPage from "./components/AccountSettingsPage";
import InstructorCourseEditor from "./components/InstructorCourseEditor";
import InstructorDashboardPage from "./components/InstructorDashboardPage";
import InstructorLiveCreate from "./components/InstructorLiveCreate";
import InstructorOnboardingPage from "./components/InstructorOnboardingPage";
import MessagesPage from "./components/MessagesPage";
import TeachPage from "./components/TeachPage";
import MyLearningPage from "./components/MyLearningPage";
import PurchaseHistoryPage from "./components/PurchaseHistoryPage";
import RefundRequestPage from "./components/RefundRequestPage";
import SearchPage from "./components/SearchPage";
import ComponentsPage from "./components/ComponentsPage";
import NotFoundPage from "./components/NotFoundPage";
import CourseDetailsPage from "./components/CourseDetailsPage";
import HowItWorks from "./components/HowItWorks";
import Navbar from "./components/Navbar";
import Overlays from "./components/Overlays";
import Parallax from "./components/Parallax";
import PopularCourses from "./components/PopularCourses";
import StartingSoon from "./components/StartingSoon";
import { faqs } from "./data";
import { fontHeading, fontRegular, fontSemi } from "./fonts";
import { AppProvider, scrollToId, useApp } from "./store";

const assetPathPrefix = "/assets";
const imgFrame40215 = `${assetPathPrefix}/503a2.svg`;
const imgFrame1618874388 = `${assetPathPrefix}/9f67c.png`;
const imgPaper = `${assetPathPrefix}/a0b77.png`;
const imgWeb032 = `${assetPathPrefix}/6f650.png`;
const imgGlobe02 = `${assetPathPrefix}/28db3.svg`;
const imgGroup = `${assetPathPrefix}/1ff1d.svg`;
const imgVector = `${assetPathPrefix}/94755.svg`;
const imgVector1 = `${assetPathPrefix}/b085b.svg`;
const imgClipPathGroup = `${assetPathPrefix}/89ce1.svg`;
const imgClipPathGroup1 = `${assetPathPrefix}/98a7f.svg`;
const imgClipPathGroup2 = `${assetPathPrefix}/b4513.svg`;
const imgClipPathGroup3 = `${assetPathPrefix}/23cba.svg`;
const imgClipPathGroup4 = `${assetPathPrefix}/b43af.svg`;
const imgClipPathGroup5 = `${assetPathPrefix}/7aab9.svg`;
const imgClipPathGroup6 = `${assetPathPrefix}/97cdf.svg`;
const imgClipPathGroup7 = `${assetPathPrefix}/08cae.svg`;
const imgGroup1 = `${assetPathPrefix}/7762f.svg`;
const imgClipPathGroup8 = `${assetPathPrefix}/79e84.svg`;
const imgClipPathGroup9 = `${assetPathPrefix}/f593a.svg`;
const imgClipPathGroup10 = `${assetPathPrefix}/4f7f7.svg`;
const imgClipPathGroup11 = `${assetPathPrefix}/ba29d.svg`;
const imgFrame1 = `${assetPathPrefix}/7eff7.svg`;
const imgGroup1321314403 = `${assetPathPrefix}/01a84.svg`;
const imgLiveStreaming03 = `${assetPathPrefix}/fbfde.svg`;
const imgNavigator01 = `${assetPathPrefix}/9dea5.svg`;
const imgMessage02 = `${assetPathPrefix}/2583e.svg`;
const imgPuzzle = `${assetPathPrefix}/11b7e.svg`;
const imgVector2 = `${assetPathPrefix}/1aa97.svg`;
const imgLibrary = `${assetPathPrefix}/3be03.svg`;
const imgOnlineLearning01 = `${assetPathPrefix}/ad62e.svg`;
const imgTime02 = `${assetPathPrefix}/f70af.svg`;
const imgComputerVideoCall = `${assetPathPrefix}/3771d.svg`;
const imgArtificialIntelligence04 = `${assetPathPrefix}/eb5bb.svg`;
const imgTimeManagement = `${assetPathPrefix}/2a09a.svg`;
const imgEllipse21583 = `${assetPathPrefix}/d376b.svg`;
const imgEllipse21584 = `${assetPathPrefix}/49f17.svg`;
const imgElements1 = `${assetPathPrefix}/e72ab.svg`;
const imgHeroiconsOutlineVideoCamera = `${assetPathPrefix}/c6ab5.svg`;
const imgElements2 = `${assetPathPrefix}/c32fd.svg`;
const imgFrame1618874422 = `${assetPathPrefix}/ab294.svg`;
const imgHeroiconsMiniArrowRight1 = `${assetPathPrefix}/9bfe0.svg`;
const imgHeroiconsSolidArrowUpRight = `${assetPathPrefix}/222e8.svg`;
const imgEllipse12 = `${assetPathPrefix}/6a6fb.svg`;
const imgEllipse14 = `${assetPathPrefix}/c9d6e.svg`;
const imgEllipse15 = `${assetPathPrefix}/c2e01.svg`;
const imgEllipse13 = `${assetPathPrefix}/46a4c.svg`;
const imgGroup2 = `${assetPathPrefix}/08e80.svg`;
const imgGroup3 = `${assetPathPrefix}/2cc84.svg`;
const imgGroup4 = `${assetPathPrefix}/b52d3.svg`;
const imgEllipse1914 = `${assetPathPrefix}/6716e.svg`;
const imgVector4 = `${assetPathPrefix}/99c30.svg`;
const imgEllipse1915 = `${assetPathPrefix}/734ce.svg`;
const imgVector5 = `${assetPathPrefix}/0cac7.svg`;
const imgEllipse1916 = `${assetPathPrefix}/47a9c.svg`;
const imgEllipse1918 = `${assetPathPrefix}/1927b.svg`;
const imgEllipse1919 = `${assetPathPrefix}/35954.svg`;
const imgIcon = `${assetPathPrefix}/f5510.svg`;
const imgGroup5 = `${assetPathPrefix}/06794.svg`;
const imgGroup6 = `${assetPathPrefix}/c5328.svg`;
const imgMinusSign = `${assetPathPrefix}/f41dc.svg`;
const imgAdd01 = `${assetPathPrefix}/d8aa2.svg`;
const imgGroup7 = `${assetPathPrefix}/73fde.svg`;
const imgGroup8 = `${assetPathPrefix}/53681.svg`;
const img687Cd80C0F17D680A102A7B5Key20Feature20Icon202Svg = `${assetPathPrefix}/7e7f0.svg`;
const imgGroup9 = `${assetPathPrefix}/51102.svg`;
const imgGroup10 = `${assetPathPrefix}/6c487.svg`;
const imgEllipse1899 = `${assetPathPrefix}/b8241.svg`;
const imgVector6 = `${assetPathPrefix}/f173e.svg`;
const imgEllipse1898 = `${assetPathPrefix}/e2495.svg`;
const imgAgreement02 = `${assetPathPrefix}/58026.svg`;
const imgFrame2 = `${assetPathPrefix}/13bd6.svg`;
const imgHeroiconsMiniChevronDown1 = `${assetPathPrefix}/2a423.svg`;
const imgFrame3 = `${assetPathPrefix}/67989.svg`;
const imgFrame4 = `${assetPathPrefix}/54db1.svg`;
const imgFrame5 = `${assetPathPrefix}/1e3a3.svg`;
const imgFrame6 = `${assetPathPrefix}/a4c73.svg`;
const imgLogoFooterAr1 = `${assetPathPrefix}/05dd6.svg`;
const imgFrame7 = `${assetPathPrefix}/22773.svg`;
const imgGroup7364 = `${assetPathPrefix}/1a23c.svg`;
const imgGroup11 = `${assetPathPrefix}/3113e.svg`;
const imgGroup12 = `${assetPathPrefix}/6feea.svg`;
const imgGroup13 = `${assetPathPrefix}/2a5e8.svg`;
const imgVector7 = `${assetPathPrefix}/23100.svg`;
const imgG4158 = `${assetPathPrefix}/ccc3d.svg`;
const imgGroup7368 = `${assetPathPrefix}/feeeb.svg`;
const imgGroup14 = `${assetPathPrefix}/0b939.svg`;

type StarProps = {
  className?: string;
  type?: "Five";
};

function Star({ className, type = "Five" }: StarProps) {
  return (
    <div className={className || "content-stretch flex flex-col items-start relative"}>
      <div className="h-4 relative shrink-0 w-25">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame40215} />
      </div>
    </div>
  );
}

type BackgroundMaskProps = {
  className?: string;
  direction?: "Radial center";
};

function BackgroundMask({ className, direction = "Radial center" }: BackgroundMaskProps) {
  return <div className={className || "overflow-clip relative size-160"} style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 640 640' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(-0.0000033646 32 -32 -0.0000052573 320 320)'><stop stop-color='rgba(0,0,0,1)' offset='0'/><stop stop-color='rgba(0,0,0,0)' offset='1'/></radialGradient></defs></svg>\")" }} />;
}

const testimonialCardWidth = 431;

const testimonials = [
  { name: "Jessica Smith", initials: "JS", color: "#0f5242", role: "Senior Developer · 800 learners", quote: "Thkee revolutionized my education! Engaging live classes, knowledgeable teachers, and interactive sessions simplified tough subjects. I strongly endorse this service!" },
  { name: "Thomas Greene", initials: "TG", color: "#906e24", role: "Graphic Designer · 1,600 learners", quote: "Thkee elevated my studies! The engaging live lessons, skilled educators, and interactive discussions made learning complex topics a breeze. Highly suggest it!" },
  { name: "Ava Lee", initials: "AL", color: "#00b388", role: "Content Strategist · 950 learners", quote: "Thkee enhanced my learning experience! The dynamic live sessions, expert tutors, and interactive format clarified difficult concepts. I highly recommend it!" },
  { name: "Omar Al-Harbi", initials: "OH", color: "#39aeeb", role: "Data Analyst · 1,200 learners", quote: "The personalized learning path told me exactly what to study next. I finished my AI certification in half the time I expected and felt supported throughout." },
  { name: "Layla Hassan", initials: "LH", color: "#ef4444", role: "Product Manager · 640 learners", quote: "Short, bite-sized classes fit around my work schedule perfectly. The live Q&A sessions with instructors made every concept stick." },
  { name: "Daniel Okafor", initials: "DO", color: "#f59e0c", role: "Instructor · 2,100 learners", quote: "As an instructor, the live studio tools are fantastic. Polls, whiteboards, and automatic recordings let me focus on teaching instead of logistics." },
];

const personalizedItems = [
  {
    title: "Acquire Knowledge at Your Own Pace",
    body: "Take small bite-sized classes (1-2 minutes each) so learning fits seamlessly into your busy lifestyle.",
    image: imgWeb032,
    alt: "Learner studying at their own pace",
  },
  {
    title: "Engaging in interactive learning experience",
    body: "Engage with your peers through events, live-streamed sessions, interactivity activities, and AI-powered input.",
    image: "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    alt: "Learners engaging together in a live session",
  },
  {
    title: "An Easy Learning Journey",
    body: "Stay on top of your progress in real time by tracking it carefully while getting suggestions for future actions to take.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    alt: "Progress analytics on a laptop screen",
  },
];

function PersonalizedLearning() {
  const [active, setActive] = useState(0);
  const next = () => setActive((a) => (a + 1) % personalizedItems.length);

  return (
    <div className="bg-gradient-to-b content-stretch flex flex-col from-slate-25 items-center justify-center overflow-clip px-4 md:px-8 py-16 xl:py-24 relative shrink-0 to-white w-full">
      <div className="content-stretch flex flex-col xl:flex-row gap-10 items-center justify-between relative shrink-0 w-full max-w-330">
        <div className="wrap-break-word content-stretch flex flex-col gap-10 items-start relative shrink-0 w-full xl:w-162.5">
          <div className="content-stretch flex flex-col gap-4 items-start relative shrink-0 w-full">
            <p className="font-instrument-bold font-bold leading-normal relative shrink-0 text-slate-900 text-32 md:text-40 xl:text-5xl tracking-tight w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
              Personalized Learning
            </p>
            <p className="font-inter-regular font-normal leading-5.5 not-italic text-slate-800 text-sm w-full">
              At THKEE, personalized learning goes beyond attending classes - you are creating a path toward your desired goals that are tailored specifically for you.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2" role="tablist" aria-label="Personalized learning highlights">
            {personalizedItems.map((item, i) => {
              const isActive = i === active;
              return (
                <button
                  key={item.title}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(i)}
                  className={`group relative flex w-full flex-col items-start gap-2 rounded-2xl py-5 md:py-6 pl-10 pr-5 md:pr-8 text-left transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 ${
                    isActive
                      ? "bg-white shadow-2xl shadow-primary-700/18 ring-1 ring-primary-700/10"
                      : "bg-transparent hover:translate-x-1.5 hover:bg-white/80 hover:shadow-xl"
                  }`}
                >
                  <span aria-hidden className="absolute bottom-5 left-4.5 top-5 w-1 overflow-hidden rounded-full bg-zinc-200">
                    {isActive && <span key={`fill-${active}`} className="pl-fill block h-full w-full rounded-full bg-primary-700" onAnimationEnd={next} />}
                  </span>
                  <span className={`font-instrument-bold text-xl font-bold leading-8 transition-colors duration-300 ${isActive ? "text-primary-800" : "text-slate-800 group-hover:text-primary-800"}`} style={{ fontVariationSettings: '"wdth" 100' }}>
                    {item.title}
                  </span>
                  <span className={`font-inter-regular text-sm font-normal leading-5.5 transition-colors duration-300 ${isActive ? "text-primary-700" : "text-slate-500"}`}>
                    {item.body}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <Parallax speed={-0.06} className="w-full max-w-133.25 xl:w-133.25 shrink-0">
          <div className="relative h-90 sm:h-120 xl:h-160 w-full overflow-hidden rounded-2xl border-6 border-solid border-white bg-white shadow-2xl">
            {personalizedItems.map((item, i) => (
              <img
                key={item.title}
                alt={item.alt}
                src={item.image}
                className={`pointer-events-none absolute inset-0 size-full max-w-none object-cover transition-all duration-700 ease-out ${i === active ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
              />
            ))}
          </div>
        </Parallax>
      </div>
    </div>
  );
}

const highlightText =
  "Thkee is a thriving learning platform, empowering learners and educators to connect, share knowledge, and transform lives through quality education.";
const HIGHLIGHT_SCROLL_DISTANCE = 450;

function ScrollHighlight() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const pinTop = window.innerHeight * 0.15;
      const p = (pinTop - el.getBoundingClientRect().top) / HIGHLIGHT_SCROLL_DISTANCE;
      setProgress(Math.min(1, Math.max(0, p)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const words = highlightText.split(" ");
  const lit = progress * words.length;

  return (
    <div ref={ref} className="w-full max-w-330 px-4 md:px-8 xl:px-0" style={{ height: `calc(70vh + ${HIGHLIGHT_SCROLL_DISTANCE}px)` }}>
      <div className="sticky top-vh-15 flex h-vh-70 items-center">
        <p className="wrap-break-word font-instrument-bold text-32 md:text-40 xl:text-5xl font-bold leading-normal tracking-tight" style={{ fontVariationSettings: '"wdth" 100' }}>
          {words.map((w, i) => (
            <span key={i} className="transition-colors duration-300" style={{ color: lit >= i + 1 ? "#0f172a" : "#cbd5e1" }}>
              {w}{" "}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}


function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      if (ref.current) ref.current.style.transform = `scaleX(${p})`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-110 h-0.75">
      <div ref={ref} className="h-full origin-left scale-x-0 bg-gradient-to-r from-emerald-500 via-sky-400 to-secondary-500 shadow-xs" />
    </div>
  );
}

function Faq() {
  const [audience, setAudience] = useState<"Student" | "Instructor">("Student");
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const items = faqs[audience];

  return (
    <div className="content-stretch flex flex-col gap-10 items-center relative shrink-0 w-full px-4 md:px-8">
      <div className="bg-slate-150 flex gap-2 p-1.5 rounded-full" role="tablist" aria-label="FAQ audience">
        {(["Instructor", "Student"] as const).map((a) => (
          <button
            key={a}
            type="button"
            role="tab"
            aria-selected={audience === a}
            onClick={() => {
              setAudience(a);
              setOpenIndex(0);
            }}
            className={`px-6 sm:px-8 py-2 rounded-full text-lg leading-7 transition-colors ${audience === a ? `bg-slate-700 text-white font-inter-medium font-medium` : `text-slate-700 hover:bg-white ${fontRegular}`}`}
          >
            {a}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 w-full max-w-215">
        {items.map((item, i) => {
          const open = openIndex === i;
          return (
            <div key={item.q} className={`rounded-2xl border transition-colors ${open ? "bg-slate-25 border-slate-300" : "border-transparent hover:bg-slate-25"}`}>
              <button type="button" aria-expanded={open} onClick={() => setOpenIndex(open ? null : i)} className="flex w-full items-center gap-6 px-5 md:px-8 py-5 md:py-6 text-left">
                <span className={`flex-1 text-slate-800 text-lg md:text-xl leading-7 md:leading-8 ${fontHeading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
                  {item.q}
                </span>
                <img alt="" className="size-7 md:size-8 shrink-0" src={open ? imgMinusSign : imgAdd01} />
              </button>
              <div className={`grid transition-all duration-300 ${open ? "grid-rows-expanded" : "grid-rows-collapsed"}`}>
                <div className="overflow-hidden">
                  <p className={`px-5 md:px-8 pb-6 md:pb-8 text-slate-800 text-sm leading-5.5 ${fontRegular}`}>{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Newsletter() {
  const { notify } = useApp();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "done">("idle");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setStatus("error");
    setStatus("done");
    notify(`Subscribed ${email.trim()} to Thkee updates`);
    setEmail("");
  };

  return (
    <form onSubmit={submit} noValidate className="flex w-full flex-col gap-2">
      <div className={`bg-white border border-solid flex h-15 items-center gap-3 pl-5 sm:pl-7.25 pr-1.5 relative rounded-xl shadow-2xl shadow-olive-400/12 w-full ${status === "error" ? "border-red-500" : "border-slate-200"}`}>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          placeholder="Enter your email..."
          aria-label="Email address"
          className={`flex-1 min-w-0 bg-transparent leading-6 text-slate-800 text-base placeholder:text-slate-400 focus:outline-none ${fontRegular}`}
        />
        <button type="submit" className={`bg-slate-800 px-5 py-3 rounded-lg shrink-0 leading-6 text-base text-white whitespace-nowrap transition-colors hover:bg-primary-700 ${fontSemi}`}>
          Subscribe
        </button>
      </div>
      {status === "error" && <p className={`text-sm text-red-300 ${fontRegular}`}>Please enter a valid email address.</p>}
      {status === "done" && <p className={`text-sm text-green-300 ${fontRegular}`}>Thanks! You're on the list. ✓</p>}
    </form>
  );
}

function FooterLanguage() {
  const { lang, setLang, notify } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const options = [
    { code: "EN" as const, label: "English" },
    { code: "AR" as const, label: "العربية" },
  ];

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="bg-slate-800 flex gap-2 items-center px-4 py-1.5 rounded-sm text-slate-300 text-base transition-colors hover:bg-slate-700">
        <img alt="" className="size-4" src={imgGlobe02} />
        <span className={`leading-7 ${fontSemi}`}>{options.find((o) => o.code === lang)?.label}</span>
        <img alt="" className={`size-5 transition-transform ${open ? "rotate-180" : ""}`} src={imgHeroiconsMiniChevronDown1} />
      </button>
      {open && (
        <div className="pop-in absolute bottom-full mb-1.5 left-0 z-10 w-45 rounded-lg border border-white/10 bg-slate-800 p-1 shadow-2xl">
          {options.map((o) => (
            <button
              key={o.code}
              type="button"
              onClick={() => {
                setLang(o.code);
                setOpen(false);
                notify(o.code === "AR" ? "Language set to العربية (full translation coming soon)" : "Language set to English");
              }}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-15 text-slate-200 hover:bg-white/10 ${fontSemi}`}
            >
              {o.label}
              {lang === o.code && <span className="text-secondary-600">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Site />
    </AppProvider>
  );
}

function Site() {
  const { route, user } = useApp();
  if (route.page === "learn")
    return (
      <>
        <LearnPage key={route.id} id={route.id} />
        <Overlays />
      </>
    );
  if (route.page === "instructor-start")
    return (
      <>
        <InstructorOnboardingPage />
        <Overlays />
      </>
    );
  if (route.page === "course-editor")
    return (
      <>
        <InstructorCourseEditor key={route.id} id={route.id} section={route.section} />
        <Overlays />
      </>
    );
  if (route.page === "live-create")
    return (
      <>
        <InstructorLiveCreate key={route.draftId ?? "new"} draftId={route.draftId} section={route.section} />
        <Overlays />
      </>
    );
  if (route.page === "instructor")
    return (
      <>
        <InstructorDashboardPage section={route.section} newCourse={route.newCourse} submissionId={route.submissionId} reportView={route.reportView} reportMonth={route.reportMonth} questionId={route.questionId} newQuestionCourse={route.newQuestionCourse} announcementCourse={route.announcementCourse} scheduleId={route.scheduleId} appsView={route.appsView} sessionSeries={route.sessionSeries} sessionId={route.sessionId} sessionCourse={route.sessionCourse} />
        <Overlays />
      </>
    );
  if (route.page === "login")
    return (
      <>
        <AuthPage />
        <Overlays />
      </>
    );
  return (
    <div className="flex min-h-dvh w-full flex-col items-center overflow-x-clip bg-white">
      <ScrollProgress />
      <Navbar solid={route.page !== "home"} />
      <Overlays />
      {route.page === "search" ? (
        <SearchPage key={JSON.stringify(route)} params={route} />
      ) : route.page === "checkout" ? (
        <CheckoutPage />
      ) : route.page === "cart" ? (
        <CartPage />
      ) : route.page === "my-learning" ? (
        <MyLearningPage key={route.tab ?? "all"} initialTab={route.tab === "wishlist" ? "Wishlist" : "All Courses"} />
      ) : route.page === "purchase-history" ? (
        <PurchaseHistoryPage />
      ) : route.page === "teach" ? (
        <TeachPage />
      ) : route.page === "messages" ? (
        <MessagesPage />
      ) : route.page === "not-found" ? (
        <NotFoundPage />
      ) : route.page === "components" ? (
        <ComponentsPage />
      ) : route.page === "account" ? (
        <AccountSettingsPage section={route.section} />
      ) : route.page === "refund" ? (
        <RefundRequestPage key={`${route.orderId}/${route.courseId}`} orderId={route.orderId} courseId={route.courseId} />
      ) : route.page === "course" ? (
        <CourseDetailsPage key={route.id} id={route.id} />
      ) : (
        <LandingPage />
      )}
      {!user && !personalPages.includes(route.page) && <SiteFooter />}
    </div>
  );
}

// Signed-in users get no footer; these task pages never show one, even when signed out.
const personalPages: string[] = ["components", "account", "messages", "purchase-history", "refund", "my-learning"];

function SiteFooter() {
  const { setOverlay } = useApp();
  return (
    <div className="bg-slate-900 content-stretch flex flex-col gap-16 xl:gap-25 items-center pt-16 xl:pt-25 relative shrink-0 w-full">
      <div className="content-stretch flex flex-col lg:flex-row gap-12 lg:gap-0 items-start relative shrink-0 w-full max-w-320 px-4 md:px-8 xl:px-0">
        <div className="content-stretch flex flex-col gap-5 items-start relative shrink-0 w-full lg:w-116.75">
          <div className="h-9 relative shrink-0 w-33.5">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame2} />
          </div>
          <div className="content-stretch flex flex-col gap-10 items-start relative shrink-0 w-full">
            <div className="content-stretch flex items-start p-1 relative shrink-0 w-full">
              <p className="wrap-break-word font-inter-regular font-normal leading-5.5 not-italic relative shrink-0 text-slate-200 text-sm w-full max-w-88.5">
                Founded to Innovate: Thkee transforms e-learning with personalized paths and interactive content, aiming to make quality education accessible worldwide.
              </p>
            </div>
            <FooterLanguage />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 w-full lg:w-auto lg:flex lg:grow shrink-0 basis-0 lg:gap-25 items-start min-w-px relative">
          <div className="wrap-break-word content-stretch flex grow shrink-0 basis-0 flex-col gap-6 items-start min-w-px relative">
            <p className="font-instrument-medium font-medium leading-8 relative shrink-0 text-slate-200 text-xl w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
              Company
            </p>
            <div className="content-stretch flex flex-col font-inter-regular font-normal gap-4 items-start leading-5.5 not-italic relative shrink-0 text-sm text-slate-200 w-full whitespace-nowrap">
              <button type="button" className="relative shrink-0 text-left transition-colors hover:text-secondary-600" onClick={() => setOverlay({ type: "info", page: "About us" })}>
                {"About us"}
              </button>
              <button type="button" className="relative shrink-0 text-left transition-colors hover:text-secondary-600" onClick={() => setOverlay({ type: "info", page: "Our Vision" })}>
                {"Our Vision"}
              </button>
              <button type="button" className="relative shrink-0 text-left transition-colors hover:text-secondary-600" onClick={() => setOverlay({ type: "info", page: "Career" })}>
                {"Career"}
              </button>
              <button type="button" className="relative shrink-0 text-left transition-colors hover:text-secondary-600" onClick={() => setOverlay({ type: "info", page: "Company" })}>
                {"Company"}
              </button>
            </div>
          </div>
          <div className="wrap-break-word content-stretch flex grow shrink-0 basis-0 flex-col gap-6 items-start min-w-px relative text-slate-200">
            <p className="font-instrument-medium font-medium leading-8 relative shrink-0 text-xl w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
              Services
            </p>
            <div className="content-stretch flex flex-col font-inter-regular font-normal gap-4 items-start leading-5.5 not-italic relative shrink-0 text-sm w-full whitespace-nowrap">
              <button type="button" className="relative shrink-0 text-left transition-colors hover:text-secondary-600" onClick={() => scrollToId("faq")}>
                {"Help & support"}
              </button>
              <button type="button" className="relative shrink-0 text-left transition-colors hover:text-secondary-600" onClick={() => setOverlay({ type: "instructor" })}>
                {"Teach on Thkee"}
              </button>
              <button type="button" className="relative shrink-0 text-left transition-colors hover:text-secondary-600" onClick={() => setOverlay({ type: "info", page: "Blog" })}>
                {"Blog"}
              </button>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-12 items-start relative shrink-0 col-span-2 sm:col-span-1 w-full lg:w-69.75">
            <div className="content-stretch flex flex-col gap-6 items-start relative shrink-0">
              <p className="wrap-break-word font-instrument-medium font-medium leading-8 relative shrink-0 text-slate-200 text-xl w-57.5" style={{ fontVariationSettings: '"wdth" 100' }}>
                Follow us on
              </p>
              <div className="content-stretch flex gap-3.5 items-center relative shrink-0">
                <a href="https://www.facebook.com" target="_blank" rel="noreferrer" aria-label="Thkee on Facebook" className="relative shrink-0 size-6 transition-opacity hover:opacity-70">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame3} />
                </a>
                <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="Thkee on X" className="relative shrink-0 size-6 transition-opacity hover:opacity-70">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame4} />
                </a>
                <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="Thkee on LinkedIn" className="relative shrink-0 size-6 transition-opacity hover:opacity-70">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame5} />
                </a>
                <a href="https://www.youtube.com" target="_blank" rel="noreferrer" aria-label="Thkee on YouTube" className="relative shrink-0 size-6 transition-opacity hover:opacity-70">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame6} />
                </a>
              </div>
            </div>
            <div className="h-24 relative shrink-0 w-63">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLogoFooterAr1} />
            </div>
          </div>
        </div>
      </div>
      <div className="border-slate-800 border-solid border-t content-stretch flex flex-col items-center justify-center py-4 relative shrink-0 w-full">
        <div className="content-stretch flex flex-col md:flex-row gap-4 items-center justify-between relative shrink-0 w-full max-w-320 px-4 md:px-8 xl:px-0">
          <div className="content-stretch flex gap-1.25 items-start relative shrink-0">
            <div className="bg-mada content-stretch flex h-7 items-center justify-center px-1.5 py-1.5 relative rounded-xs shrink-0 w-10.75">
              <div className="h-3.25 relative shrink-0 w-7.25">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame7} />
              </div>
            </div>
            <div className="bg-mada content-stretch flex h-7 items-center justify-center px-1.5 py-1.5 relative rounded-sm shrink-0 w-11">
              <div className="content-stretch flex h-3.25 items-center justify-center overflow-clip relative shrink-0 w-10.5">
                <div className="grid-cols-content grid-rows-content inline-grid leading-0 place-items-start relative shrink-0">
                  <div className="col-1 h-3 ml-0 mt-0 relative row-1 w-2.25">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup7364} />
                  </div>
                  <div className="col-1 grid-cols-content grid-rows-content inline-grid ml-2.5 mt-0.5 place-items-start relative row-1">
                    <div className="col-1 h-1.75 ml-3.75 mt-0 relative row-1 w-2.25">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup11} />
                    </div>
                    <div className="col-1 grid-cols-content grid-rows-content inline-grid ml-0 mt-0 place-items-start relative row-1">
                      <div className="col-1 h-1.75 ml-0 mt-0 relative row-1 w-2.25">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup12} />
                      </div>
                      <div className="col-1 h-1.5 ml-2.5 mt-0.75 relative row-1 w-1">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup13} />
                      </div>
                    </div>
                    <div className="col-1 h-1.75 ml-6.25 mt-0 relative row-1 w-0.5">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVector7} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-mada content-stretch flex h-7 items-center justify-center px-1.5 py-1.5 relative rounded-xs shrink-0 w-10.75">
              <div className="h-2.5 overflow-clip relative shrink-0 w-8">
                <div className="absolute" style={{ inset: "-0.01% 0 0.01% -0.01%" }}>
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgG4158} />
                </div>
              </div>
            </div>
            <div className="bg-mada content-stretch flex h-7 items-center justify-center px-1.5 py-1.5 relative rounded-xs shrink-0 w-10.75">
              <div className="content-stretch flex flex-col h-5 items-center justify-center overflow-clip relative shrink-0 w-9">
                <div className="h-4 relative shrink-0 w-8.75">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup7368} />
                </div>
              </div>
            </div>
            <div className="bg-mada content-stretch flex h-7 items-center justify-center px-1.25 py-1.5 relative rounded-xs shrink-0 w-10.75">
              <div className="h-2.5 overflow-clip relative shrink-0 w-8.25">
                <div className="absolute" style={{ inset: "0 0.04% 0 -0.03%" }}>
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup14} />
                </div>
              </div>
            </div>
          </div>
          <div className="grid-cols-content grid-rows-content inline-grid leading-0 place-items-start relative shrink-0">
            <div className="wrap-break-word col-1 content-stretch flex gap-1 items-center leading-4.5 ml-0 mt-0 not-italic relative row-1 text-slate-500 text-xs whitespace-nowrap">
              <p className="font-inter-medium font-medium relative shrink-0 uppercase">
                Copyright
              </p>
              <p className="font-inter-regular font-normal relative shrink-0">
                ©
              </p>
              <p className="font-inter-medium font-medium relative shrink-0 uppercase">
                2025 Thkee. All rights reserved.
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-2 items-center relative shrink-0">
            <button type="button" onClick={() => setOverlay({ type: "info", page: "Terms of Service" })} className="decoration-skip-ink-none underline-from-font wrap-break-word decoration-from-font decoration-solid font-inter-medium font-medium leading-4.5 not-italic relative shrink-0 text-slate-300 text-xs underline whitespace-nowrap transition-colors hover:text-white">
              Terms of Service
            </button>
            <div className="bg-slate-300 h-3.5 relative shrink-0 w-px" />
            <button type="button" onClick={() => setOverlay({ type: "info", page: "Privacy Policy" })} className="decoration-skip-ink-none underline-from-font wrap-break-word decoration-from-font decoration-solid font-inter-medium font-medium leading-4.5 not-italic relative shrink-0 text-slate-300 text-xs underline whitespace-nowrap transition-colors hover:text-white">
              Privacy Policy
            </button>
            <div className="bg-slate-300 h-3.5 relative shrink-0 w-px" />
            <button type="button" onClick={() => scrollToId("faq")} className="decoration-skip-ink-none underline-from-font wrap-break-word decoration-from-font decoration-solid font-inter-medium font-medium leading-4.5 not-italic relative shrink-0 text-slate-300 text-xs underline whitespace-nowrap transition-colors hover:text-white">
              FAQ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  const { setOverlay, user, openAuth } = useApp();
  const [slide, setSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [slider, setSlider] = useState({ step: testimonialCardWidth + 24, perView: 3 });

  useEffect(() => {
    const measure = () => {
      const viewport = sliderRef.current;
      const card = viewport?.firstElementChild?.firstElementChild as HTMLElement | null;
      if (!viewport || !card) return;
      const step = card.offsetWidth + 24;
      setSlider({ step, perView: Math.max(1, Math.floor((viewport.clientWidth + 24) / step)) });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const testimonialStops = testimonials.length - slider.perView + 1;
  const currentSlide = Math.min(slide, testimonialStops - 1);

  return (
    <div className="bg-white content-stretch flex flex-col items-center justify-center relative w-full overflow-x-clip">
      <Hero />
      <div className="bg-slate-25 content-stretch flex flex-col items-center overflow-clip px-4 md:px-8 xl:px-25 py-16 xl:py-24 relative shrink-0 w-full">
        <div className="content-stretch flex flex-col gap-10 items-start relative shrink-0 w-full max-w-330">
          <div className="content-stretch flex items-center justify-center relative shrink-0 w-full">
            <div className="wrap-break-word content-stretch flex grow shrink-0 basis-0 flex-col gap-4 items-center justify-center min-w-px relative text-center">
              <p className="font-instrument-bold font-bold leading-normal relative shrink-0 text-slate-900 text-32 md:text-40 xl:text-5xl tracking-tight xl:whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>{`Trusted by Saudi Arabia's Leading Institutions`}</p>
              <div className="flex flex-col font-inter-regular font-normal justify-center leading-0 not-italic relative shrink-0 text-slate-800 text-sm w-full max-w-151.5">
                <p className="leading-5.5">{`Thkee is proudly supported and validated by the Kingdom's top technology and education authorities`}</p>
              </div>
            </div>
          </div>
          <div className="gap-x-5 gap-y-5 grid grid-cols-2 lg:grid-cols-4 relative shrink-0 w-full">
            <div className="bg-white border border-slate-200 border-solid content-stretch flex flex-col items-center justify-center justify-self-stretch overflow-clip p-5 md:p-8 relative rounded-2xl self-stretch shrink-0">
              <div className="relative shrink-0 w-full" style={{ aspectRatio: "234.9985809326172/64.44535064697266" }}>
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup} />
              </div>
            </div>
            <div className="bg-white border border-slate-200 border-solid content-stretch flex flex-col items-center justify-center justify-self-stretch overflow-clip p-5 md:p-8 relative rounded-2xl self-stretch shrink-0">
              <div className="grid-rows-content inline-grid leading-0 place-items-start relative shrink-0 w-full">
                <div className="col-1 grid-rows-content inline-grid ml-0 mt-0 place-items-start relative row-1 w-full">
                  <div className="col-1 h-7 mt-13.25 relative row-1" style={{ marginLeft: "93.46%", width: "6.52%" }}>
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVector} />
                  </div>
                  <div className="col-1 h-22.75 mt-0 relative row-1" style={{ marginLeft: "90.65%", width: "9.35%" }}>
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVector1} />
                  </div>
                  <div className="col-1 grid-rows-content inline-grid mt-0 place-items-start relative row-1" style={{ marginLeft: "83.15%", width: "14.93%" }}>
                    <div className="col-1 h-20 ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup} />
                    </div>
                    <div className="col-1 h-20 ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup1} />
                    </div>
                    <div className="col-1 h-20 ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup2} />
                    </div>
                    <div className="col-1 h-20 ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup3} />
                    </div>
                  </div>
                  <div className="col-1 grid-rows-content inline-grid mt-6 place-items-start relative row-1" style={{ marginLeft: "90.63%", width: "7.47%" }}>
                    <div className="col-1 h-13.75 ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup4} />
                    </div>
                    <div className="col-1 h-13.75 ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup5} />
                    </div>
                    <div className="col-1 h-13.75 ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup6} />
                    </div>
                    <div className="col-1 h-13.75 ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup7} />
                    </div>
                  </div>
                  <div className="col-1 h-19 ml-0 mt-3.25 relative row-1" style={{ width: "77.54%" }}>
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup1} />
                  </div>
                  <div className="col-1 grid-rows-content inline-grid mt-0 place-items-start relative row-1" style={{ marginLeft: "83.15%", width: "14.93%" }}>
                    <div className="col-1 h-6 ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup8} />
                    </div>
                    <div className="col-1 h-6 ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup9} />
                    </div>
                    <div className="col-1 h-6 ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup10} />
                    </div>
                    <div className="col-1 h-6 ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup11} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 border-solid content-stretch flex flex-col items-center justify-center justify-self-stretch overflow-clip p-5 md:p-8 relative rounded-2xl self-stretch shrink-0">
              <div className="h-16.5 relative shrink-0 w-42.25">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame1} />
              </div>
            </div>
            <div className="bg-white border border-slate-200 border-solid content-stretch flex flex-col items-center justify-center justify-self-stretch overflow-clip p-5 md:p-8 relative rounded-2xl self-stretch shrink-0">
              <div className="relative shrink-0 w-full" style={{ aspectRatio: "110.97635650634766/37.70798110961914" }}>
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup1321314403} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <PopularCourses />
      <StartingSoon />
      <div className="content-stretch flex flex-col gap-10 items-center overflow-clip px-4 md:px-8 xl:px-51 py-16 xl:py-24 relative shrink-0 w-full">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute bg-mist-900 inset-0" />
          <div className="absolute inset-0 overflow-hidden">
            <Parallax speed={0.18} className="absolute inset-0">
              <img alt="" className="absolute max-w-none" style={{ height: "130%", left: "-33.06%", top: "-15%", width: "166.11%" }} src={imgFrame1618874388} />
            </Parallax>
          </div>
        </div>
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full max-w-330">
          <div className="content-stretch flex flex-col items-center px-5 relative shrink-0 w-full">
            <div className="wrap-break-word content-stretch flex flex-col gap-4 items-center md:px-5 relative shrink-0 text-center w-full max-w-229">
              <p className="font-instrument-bold font-bold leading-normal relative shrink-0 text-32 md:text-40 xl:text-5xl text-white tracking-tight xl:whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
                Find out Powerful Features Now
              </p>
              <div className="flex flex-col font-inter-regular font-normal justify-center leading-0 min-w-full not-italic relative shrink-0 text-slate-150 text-sm w-min">
                <p className="leading-5.5">{`Our platform is an advanced combination of AI technology with a user-friendly design for a fun learning experience that separates us. `}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex gap-6 items-stretch xl:items-start relative shrink-0 w-full max-w-330">
          <div className="glass-card backdrop-blur-sm border border-primary-100/6 border-solid content-stretch flex grow shrink-0 basis-0 flex-col gap-15 items-start justify-between min-w-px overflow-clip p-8 relative rounded-2xl self-stretch" style={{ backgroundImage: "linear-gradient(139.8683304199743deg, rgba(8, 32, 25, 0.05) 8.5799%, rgba(12, 252, 185, 0.05) 101.25%)" }}>
            <div className="bg-white overflow-clip relative rounded-xl ring-4 ring-slate-25/25 shadow-2xl shadow-slate-25/38 shrink-0 size-14">
              <div className="absolute left-3 size-8 top-3">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLiveStreaming03} />
              </div>
            </div>
            <div className="wrap-break-word content-stretch flex flex-col gap-4 items-start leading-0 relative shrink-0 w-full">
              <div className="flex flex-col font-instrument-bold font-bold justify-center relative shrink-0 text-2xl text-white w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-8">Live Discussions</p>
              </div>
              <div className="flex flex-col font-inter-regular font-normal justify-center not-italic relative shrink-0 text-slate-150 text-sm w-full">
                <p className="leading-5.5 mb-0">{`Participate in live Q&A sessions with your instructors and fellow students to deepen your understanding.`}</p>
                <p className="leading-5.5">​</p>
              </div>
            </div>
          </div>
          <div className="glass-card backdrop-blur-sm border border-primary-100/6 border-solid content-stretch flex grow shrink-0 basis-0 flex-col gap-15 items-start min-w-px overflow-clip p-8 relative rounded-2xl self-stretch" style={{ backgroundImage: "linear-gradient(139.8683304199743deg, rgba(8, 32, 25, 0.05) 8.5799%, rgba(12, 252, 185, 0.05) 101.25%)" }}>
            <div className="bg-white overflow-clip relative rounded-xl ring-4 ring-slate-25/25 shrink-0 size-14">
              <div className="absolute left-3 size-8 top-3">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgNavigator01} />
              </div>
            </div>
            <div className="wrap-break-word content-stretch flex flex-col gap-4 items-start leading-0 relative shrink-0 w-full">
              <div className="flex flex-col font-instrument-bold font-bold justify-center relative shrink-0 text-2xl text-white w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-8">Customized Learning Paths</p>
              </div>
              <div className="flex flex-col font-inter-regular font-normal justify-center not-italic relative shrink-0 text-slate-150 text-sm w-full">
                <p className="leading-5.5">Let our AI guide you to the best course to suit your goals and the progress you have made.</p>
              </div>
            </div>
          </div>
          <div className="glass-card backdrop-blur-sm border border-primary-100/6 border-solid content-stretch flex grow shrink-0 basis-0 flex-col gap-15 items-start min-w-px overflow-clip p-8 relative rounded-2xl self-stretch" style={{ backgroundImage: "linear-gradient(139.8683304199743deg, rgba(8, 32, 25, 0.05) 8.5799%, rgba(12, 252, 185, 0.05) 101.25%)" }}>
            <div className="bg-white overflow-clip relative rounded-xl ring-4 ring-slate-25/25 shrink-0 size-14">
              <div className="absolute left-3 size-8 top-3">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgMessage02} />
              </div>
            </div>
            <div className="wrap-break-word content-stretch flex flex-col gap-4 items-start leading-0 relative shrink-0 w-full">
              <div className="flex flex-col font-instrument-bold font-bold justify-center relative shrink-0 text-2xl text-white w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-8">Community Learning</p>
              </div>
              <div className="flex flex-col font-inter-regular font-normal justify-center not-italic relative shrink-0 text-slate-150 text-sm w-full">
                <p className="leading-5.5">Join discussions or matching group forums to share ideas and develop.</p>
              </div>
            </div>
          </div>
          <div className="glass-card backdrop-blur-sm border border-primary-100/6 border-solid content-stretch flex grow shrink-0 basis-0 flex-col gap-15 items-start min-w-px overflow-clip p-8 relative rounded-2xl self-stretch" style={{ backgroundImage: "linear-gradient(139.8683304199743deg, rgba(8, 32, 25, 0.05) 8.5799%, rgba(12, 252, 185, 0.05) 101.25%)" }}>
            <div className="bg-white overflow-clip relative rounded-xl ring-4 ring-slate-25/25 shrink-0 size-14">
              <div className="absolute left-3 size-8 top-3">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPuzzle} />
              </div>
            </div>
            <div className="wrap-break-word content-stretch flex flex-col gap-4 items-start leading-0 relative shrink-0 w-full">
              <div className="flex flex-col font-instrument-bold font-bold justify-center relative shrink-0 text-2xl text-white w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-8">Interactive Learning Tools</p>
              </div>
              <div className="flex flex-col font-inter-regular font-normal justify-center not-italic relative shrink-0 text-slate-150 text-sm w-full">
                <p className="leading-5.5">Take part in interactive tests, simulations, and other tools to allow you to stick with your learning.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-10 items-center justify-center py-24 relative shrink-0 w-full">
        <ScrollHighlight />
        <div className="content-stretch flex flex-col gap-22.5 items-center overflow-clip pb-12 md:pb-16 pt-10 md:pt-14 px-6 md:px-14 relative rounded-2xl shrink-0 w-full-minus-8 md:w-full-minus-16 max-w-330" style={{ backgroundImage: "linear-gradient(76.37165893145583deg, rgb(0, 35, 71) 2.0811%, rgb(23, 0, 92) 93.886%)" }}>
          <Parallax speed={-0.12} className="pointer-events-none absolute inset-0 hidden xl:block">
            <div className="absolute hidden xl:block h-102.75 left-269 top-89 w-72.75">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVector2} />
            </div>
          </Parallax>
          <div className="absolute inset-0">
            <div aria-hidden className="absolute bg-top-left inset-0 opacity-60 pointer-events-none" style={{ backgroundSize: "157.99999237060547px 157.99999237060547px", backgroundImage: `url("${imgPaper}")` }} />
          </div>
          <div className="content-stretch flex flex-col gap-10 items-start relative shrink-0 w-full">
            <div className="content-stretch flex items-center relative shrink-0 w-full">
              <p className="wrap-break-word grow shrink-0 basis-0 font-instrument-bold font-bold leading-normal min-w-px relative text-32 md:text-40 xl:text-5xl text-white tracking-tight" style={{ fontVariationSettings: '"wdth" 100' }}>
                Why You Should Choose Thkee
              </p>
            </div>
            <div className="content-stretch flex flex-col gap-10 items-start pt-5 relative shrink-0 w-full">
              <div className="content-stretch flex flex-col lg:flex-row gap-10 items-start justify-center relative shrink-0 w-full">
                <div className="content-stretch flex grow shrink-0 basis-0 flex-col gap-5 items-start min-w-px relative">
                  <div className="relative shrink-0 size-10">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLibrary} />
                  </div>
                  <div className="content-stretch flex flex-col gap-2 items-start relative shrink-0 w-full">
                    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full">
                      <div className="wrap-break-word flex grow shrink-0 basis-0 flex-col font-instrument-bold font-bold lg:h-8 justify-center leading-0 min-w-px relative text-xl text-white" style={{ fontVariationSettings: '"wdth" 100' }}>
                        <p className="leading-8">Quality Learning Resources</p>
                      </div>
                    </div>
                    <div className="wrap-break-word flex flex-col font-inter-regular font-normal justify-center leading-0 not-italic relative shrink-0 text-slate-300 text-sm w-full">
                      <p className="leading-5.5">Get high-quality bilingual (Arabic-English) courses designed by top trainers all over the globe.</p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex grow shrink-0 basis-0 flex-col gap-5 items-start min-w-px relative">
                  <div className="relative shrink-0 size-10">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgOnlineLearning01} />
                  </div>
                  <div className="content-stretch flex flex-col gap-2 items-start relative shrink-0 w-full">
                    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full">
                      <div className="wrap-break-word flex grow shrink-0 basis-0 flex-col font-instrument-bold font-bold lg:h-8 justify-center leading-0 min-w-px relative text-xl text-white" style={{ fontVariationSettings: '"wdth" 100' }}>
                        <p className="leading-8">Boundless Learning Management</p>
                      </div>
                    </div>
                    <div className="wrap-break-word flex flex-col font-inter-regular font-normal justify-center leading-0 not-italic relative shrink-0 text-slate-300 text-sm w-full">
                      <p className="leading-5.5">Learn anywhere, anytime, using your smartphone, tablet, desktop, or phone.</p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex grow shrink-0 basis-0 flex-col gap-5 items-start min-w-px relative">
                  <div className="relative shrink-0 size-10">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTime02} />
                  </div>
                  <div className="content-stretch flex flex-col gap-2 items-start relative shrink-0 w-full">
                    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full">
                      <div className="wrap-break-word flex grow shrink-0 basis-0 flex-col font-instrument-bold font-bold justify-center leading-0 min-w-px relative text-xl text-white" style={{ fontVariationSettings: '"wdth" 100' }}>
                        <p className="leading-8">Scalable Learning Integration</p>
                      </div>
                    </div>
                    <div className="wrap-break-word flex flex-col font-inter-regular font-normal justify-center leading-0 not-italic relative shrink-0 text-slate-300 text-sm w-full">
                      <p className="leading-5.5">Institutions incorporate our B2B-based training solutions in their existing systems to facilitate the proper development of their students or employees.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col lg:flex-row gap-10 items-start justify-center relative shrink-0 w-full">
                <div className="content-stretch flex grow shrink-0 basis-0 flex-col gap-5 items-start min-w-px relative">
                  <div className="relative shrink-0 size-10">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgComputerVideoCall} />
                  </div>
                  <div className="content-stretch flex flex-col gap-2 items-start relative shrink-0 w-full">
                    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full">
                      <div className="wrap-break-word flex grow shrink-0 basis-0 flex-col font-instrument-bold font-bold lg:h-8 justify-center leading-0 min-w-px relative text-xl text-white" style={{ fontVariationSettings: '"wdth" 100' }}>
                        <p className="leading-8">Smooth Course Management</p>
                      </div>
                    </div>
                    <div className="wrap-break-word flex flex-col font-inter-regular font-normal justify-center leading-0 not-italic relative shrink-0 text-slate-300 text-sm w-full">
                      <p className="leading-5.5">Design and run your course quickly by using AI tools that help you save time and increase productivity.</p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex grow shrink-0 basis-0 flex-col gap-5 items-start min-w-px relative">
                  <div className="relative shrink-0 size-10">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgArtificialIntelligence04} />
                  </div>
                  <div className="content-stretch flex flex-col gap-2 items-start relative shrink-0 w-full">
                    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full">
                      <div className="wrap-break-word flex grow shrink-0 basis-0 flex-col font-instrument-bold font-bold lg:h-8 justify-center leading-0 min-w-px relative text-xl text-white" style={{ fontVariationSettings: '"wdth" 100' }}>
                        <p className="leading-8">Smart Personal Learning Journeys</p>
                      </div>
                    </div>
                    <div className="wrap-break-word flex flex-col font-inter-regular font-normal justify-center leading-0 not-italic relative shrink-0 text-slate-300 text-sm w-full">
                      <p className="leading-5.5">At Thkee, no two students receive the same treatment, our innovative system adjusts to your objectives and goals while confidently guiding you step-by-step toward actual results.</p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex grow shrink-0 basis-0 flex-col gap-5 items-start min-w-px relative">
                  <div className="relative shrink-0 size-10">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTimeManagement} />
                  </div>
                  <div className="content-stretch flex flex-col gap-2 items-start relative shrink-0 w-full">
                    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full">
                      <div className="wrap-break-word flex grow shrink-0 basis-0 flex-col font-instrument-bold font-bold lg:h-8 justify-center leading-0 min-w-px relative text-xl text-white" style={{ fontVariationSettings: '"wdth" 100' }}>
                        <p className="leading-8">Supportive Learning Community</p>
                      </div>
                    </div>
                    <div className="wrap-break-word flex flex-col font-inter-regular font-normal justify-center leading-0 not-italic relative shrink-0 text-slate-300 text-sm w-full">
                      <p className="leading-5.5">{`You're never on your own at Thkee, join a vibrant community of mentors and peers who encourage, challenge, and encourage you to keep going ahead.`}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PersonalizedLearning />
      <HowItWorks />
      <div className="bg-slate-25 content-stretch flex flex-col gap-15 items-center justify-center px-4 md:px-8 py-16 xl:py-24 relative shrink-0 w-full">
        <div className="absolute bg-mist-600 blur-3xl h-104 left-1/2 -translate-x-1/2 opacity-4 top-31 w-full max-w-346.25" />
        <div className="content-stretch flex flex-col xl:flex-row gap-10 xl:gap-15 items-center relative shrink-0 w-full max-w-330">
          <Parallax speed={-0.05} className="w-full max-w-168.25 shrink-0">
            <div className="bg-white content-stretch flex flex-col items-start overflow-clip relative rounded-2xl md:rounded-3xl w-full">
              <div className="bg-slate-900 border border-slate-25/13 border-solid content-stretch flex gap-4 justify-between items-center px-4 sm:px-6.25 py-4.25 relative shrink-0 w-full">
                <div className="content-stretch flex grow shrink-0 basis-0 gap-2.75 items-center min-w-px relative">
                  <div className="content-stretch flex gap-2.5 sm:gap-4.25 items-center relative min-w-0 sm:shrink-0">
                    <div className="relative shrink-0 size-3">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse21583} />
                    </div>
                    <p className="font-inter-semibold font-semibold leading-6 not-italic relative min-w-0 truncate sm:shrink-0 text-sm sm:text-base text-white whitespace-nowrap">
                      Color Theory 101 - Live
                    </p>
                  </div>
                  <div className="content-stretch hidden sm:flex gap-2.75 items-center relative shrink-0">
                    <div className="relative shrink-0 size-1">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse21584} />
                    </div>
                    <p className="wrap-break-word font-inter-medium font-medium leading-6 not-italic relative shrink-0 text-sm text-slate-25/56 text-center whitespace-nowrap">
                      42 Learners
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex gap-1.5 items-center relative shrink-0">
                  <div className="bg-gray-800 content-stretch flex items-center overflow-clip p-2 relative rounded-md shrink-0">
                    <div className="relative shrink-0 size-4">
                      <div className="absolute" style={{ inset: "8.33% 16.67%" }}>
                        <div className="absolute" style={{ inset: "-3.75% -4.69%" }}>
                          <img alt="" className="block max-w-none size-full" src={imgElements1} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-800 content-stretch flex items-center overflow-clip p-2 relative rounded-md shrink-0">
                    <div className="relative shrink-0 size-4">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgHeroiconsOutlineVideoCamera} />
                    </div>
                  </div>
                  <div className="bg-gray-800 content-stretch flex items-center overflow-clip p-2 relative rounded-md shrink-0">
                    <div className="relative shrink-0 size-4">
                      <div className="absolute" style={{ inset: "8.33% 12.5%" }}>
                        <div className="absolute" style={{ inset: "-3.75% -4.17%" }}>
                          <img alt="" className="block max-w-none size-full" src={imgElements2} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-full">
                <div className="bg-gradient-to-b content-stretch flex grow shrink-0 basis-0 flex-col from-teal-950 from-56% gap-2.75 h-80 sm:h-101.75 items-center justify-center min-w-px p-4 relative to-slate-900">
                  <div className="absolute bottom-6 content-stretch flex gap-2 items-center left-4 sm:left-8">
                    <div className="bg-primary-700 border border-slate-25/50 border-solid content-stretch flex items-center justify-center p-2.5 relative rounded-xl shrink-0 size-10">
                      <p className="wrap-break-word font-inter-bold font-bold leading-5 not-italic relative shrink-0 text-primary-100 text-sm whitespace-nowrap">
                        MK
                      </p>
                    </div>
                    <div className="bg-sky-400 border border-slate-25/50 border-solid content-stretch flex items-center justify-center p-2.5 relative rounded-xl shrink-0 size-10">
                      <p className="wrap-break-word font-inter-bold font-bold leading-5 not-italic relative shrink-0 text-primary-100 text-sm whitespace-nowrap">
                        MK
                      </p>
                    </div>
                    <div className="bg-emerald-500 border border-slate-25/50 border-solid content-stretch flex items-center justify-center p-2.5 relative rounded-xl shrink-0 size-10">
                      <p className="wrap-break-word font-inter-bold font-bold leading-5 not-italic relative shrink-0 text-primary-100 text-sm whitespace-nowrap">
                        MK
                      </p>
                    </div>
                    <div className="bg-red-500 border border-slate-25/50 border-solid content-stretch flex items-center justify-center p-2.5 relative rounded-xl shrink-0 size-10">
                      <p className="wrap-break-word font-inter-bold font-bold leading-5 not-italic relative shrink-0 text-primary-100 text-sm whitespace-nowrap">
                        MK
                      </p>
                    </div>
                    <div className="bg-secondary-600 border border-slate-25/50 border-solid content-stretch flex items-center justify-center p-2.5 relative rounded-xl shrink-0 size-10">
                      <p className="wrap-break-word font-inter-bold font-bold leading-5 not-italic relative shrink-0 text-primary-100 text-sm whitespace-nowrap">
                        MK
                      </p>
                    </div>
                    <div className="bg-gray-800 border border-slate-25/13 border-solid content-stretch flex items-center justify-center px-1.5 py-2.5 relative rounded-xl shrink-0 size-10">
                      <p className="wrap-break-word font-inter-bold font-bold leading-5 not-italic relative shrink-0 text-primary-100 text-sm whitespace-nowrap">
                        38+
                      </p>
                    </div>
                  </div>
                  <div className="absolute h-24.75 left-1/2 -translate-x-1/2 w-54.5" style={{ top: "25.7%" }}>
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame1618874422} />
                  </div>
                </div>
                <div className="bg-slate-900 content-stretch hidden md:flex flex-col gap-2.75 h-101.75 items-start p-4 relative shrink-0 w-69.75">
                  <p className="wrap-break-word font-inter-semibold font-semibold leading-5 min-w-full not-italic relative shrink-0 text-base text-white w-min">
                    Chat
                  </p>
                  <div className="wrap-break-word bg-gray-800 content-stretch flex flex-col items-start not-italic px-4 py-2 relative rounded-xl shrink-0 w-51.25">
                    <p className="font-inter-semibold font-semibold leading-4.5 relative shrink-0 text-slate-500 text-xs w-38">
                      Aman
                    </p>
                    <p className="font-inter-regular font-normal leading-5 min-w-full relative shrink-0 text-slate-150 text-sm w-min">{`Can you please repeat the topic again ? `}</p>
                  </div>
                  <div className="wrap-break-word bg-gray-800 content-stretch flex flex-col items-start not-italic px-4 py-2 relative rounded-xl shrink-0 w-51.25">
                    <p className="font-inter-semibold font-semibold leading-4.5 relative shrink-0 text-slate-500 text-xs w-38">
                      Junko
                    </p>
                    <p className="font-inter-regular font-normal leading-5 min-w-full relative shrink-0 text-slate-150 text-sm w-min">
                      Yes, it will be better
                    </p>
                  </div>
                  <div className="wrap-break-word bg-gray-800 content-stretch flex flex-col items-start not-italic px-4 py-2 relative rounded-xl shrink-0 w-51.25">
                    <p className="font-inter-semibold font-semibold leading-4.5 relative shrink-0 text-slate-500 text-xs w-38">
                      Sofia
                    </p>
                    <p className="font-inter-regular font-normal leading-5 min-w-full relative shrink-0 text-slate-150 text-sm w-min">
                      Can we get the recording after the class?
                    </p>
                  </div>
                  <div className="content-stretch flex flex-col items-end justify-center relative shrink-0 w-full">
                    <div className="bg-gradient-to-r content-stretch flex flex-col from-primary-700 items-start px-4 py-2 relative rounded-xl shrink-0 to-teal-700 w-51.25">
                      <p className="wrap-break-word font-inter-regular font-normal leading-5 not-italic relative shrink-0 text-slate-150 text-sm w-full">
                        Recording goes out tonight :)
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-800 content-stretch flex flex-col items-start px-4 py-2 relative rounded-xl shrink-0 w-full">
                    <p className="wrap-break-word font-inter-regular font-normal leading-5 not-italic relative shrink-0 text-slate-500 text-sm whitespace-nowrap">
                      Send a message....
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Parallax>
          <div className="content-stretch flex grow shrink-0 basis-0 flex-col gap-8 items-start min-w-px relative">
            <div className="wrap-break-word content-stretch flex flex-col gap-4 items-start leading-0 relative shrink-0 w-full">
              <div className="font-instrument-bold font-bold relative shrink-0 text-slate-900 text-32 md:text-40 xl:text-5xl xl:text-center tracking-tight xl:whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-normal mb-0">Feels like the room.</p>
                <p className="leading-normal">Works like the web.</p>
              </div>
              <div className="flex flex-col font-inter-regular font-normal justify-center min-w-full not-italic relative shrink-0 text-slate-800 text-sm w-min">
                <p className="leading-5.5">{`A purpose-built live studio for teachers — not a generic meeting tool. Everything you need to run an engaging class, nothing you don't.`}</p>
              </div>
            </div>
            <div className="wrap-break-word gap-x-4 gap-y-4 grid grid-cols-1 sm:grid-cols-2 not-italic relative shrink-0 w-full">
              <div className="bg-white border border-slate-200 border-solid content-stretch flex flex-col gap-2 items-start justify-self-stretch p-4 relative rounded-2xl self-stretch shrink-0">
                <p className="font-inter-semibold font-semibold leading-5 relative shrink-0 text-slate-800 text-base whitespace-nowrap">
                  HD video + low-latency chat
                </p>
                <p className="font-inter-regular font-normal leading-6 min-w-full relative shrink-0 text-slate-500 text-sm w-min">
                  Sub-200ms across 6 continents.
                </p>
              </div>
              <div className="bg-white border border-slate-200 border-solid content-stretch flex flex-col gap-2 items-start justify-self-stretch p-4 relative rounded-2xl self-stretch shrink-0">
                <p className="font-inter-semibold font-semibold leading-5 relative shrink-0 text-slate-800 text-base whitespace-nowrap">{`Whiteboard & screen share`}</p>
                <p className="font-inter-regular font-normal leading-6 min-w-full relative shrink-0 text-slate-500 text-sm w-min">
                  Sketch ideas live, no Zoom required.
                </p>
              </div>
              <div className="bg-white border border-slate-200 border-solid content-stretch flex flex-col gap-2 items-start justify-self-stretch p-4 relative rounded-2xl self-stretch shrink-0">
                <p className="font-inter-semibold font-semibold leading-5 relative shrink-0 text-slate-800 text-base whitespace-nowrap">
                  Polls, quizzes, hand-raise
                </p>
                <p className="font-inter-regular font-normal leading-6 min-w-full relative shrink-0 text-slate-500 text-sm w-min">
                  Keep learners active, not lurking.
                </p>
              </div>
              <div className="bg-white border border-slate-200 border-solid content-stretch flex flex-col gap-2 items-start justify-self-stretch p-4 relative rounded-2xl self-stretch shrink-0">
                <p className="font-inter-semibold font-semibold leading-5 relative shrink-0 text-slate-800 text-base whitespace-nowrap">{`Auto attendance & recording`}</p>
                <p className="font-inter-regular font-normal leading-6 min-w-full relative shrink-0 text-slate-500 text-sm w-min">
                  Saved straight to the course timeline.
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setOverlay({ type: "catalog", liveOnly: true })} className="bg-secondary-500 content-stretch flex gap-2 h-14 items-center justify-center overflow-clip px-8 py-4 relative rounded-lg shrink-0 transition-colors hover:bg-secondary-600">
              <p className="wrap-break-word font-inter-semibold font-semibold leading-5 not-italic relative shrink-0 text-slate-800 text-base whitespace-nowrap">
                Explore Live Studio
              </p>
              <div className="relative shrink-0 size-5">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgHeroiconsMiniArrowRight1} />
              </div>
            </button>
          </div>
        </div>
      </div>
      <Experts />
      <div className="xl:h-101.5 overflow-clip relative shrink-0 w-full px-4 md:px-8 py-16 xl:p-0" style={{ backgroundImage: "linear-gradient(145.1440091350974deg, rgb(0, 142, 111) 24.443%, rgb(0, 81, 63) 4.7981%, rgb(0, 40, 31) 55.653%)" }}>
        <div className="relative z-10 mx-auto content-stretch flex flex-col xl:flex-row gap-8 items-start xl:items-center justify-between w-full max-w-304 xl:absolute xl:left-1/2 xl:top-1/2 xl:-translate-x-1/2 xl:-translate-y-1/2">
          <div className="wrap-break-word content-stretch flex flex-col gap-6 items-start relative shrink-0 w-full xl:w-160.75">
            <p className="font-instrument-bold font-bold leading-normal relative shrink-0 text-32 md:text-40 xl:text-5xl text-white tracking-tight w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
              🚀 Start Learning on Your Terms
            </p>
            <div className="flex flex-col font-inter-regular font-normal justify-center leading-0 not-italic relative shrink-0 text-slate-300 text-sm w-full">
              <p className="leading-5.5">{`If you're looking to switch your career, get a certification, or explore something new, THKEE allows you the flexibility to learn whenever and how you'd like to.`}</p>
            </div>
          </div>
          <div className="content-stretch flex flex-col sm:flex-row gap-4 items-stretch sm:items-start relative shrink-0 w-full sm:w-auto">
            <button type="button" onClick={() => (user ? setOverlay({ type: "catalog" }) : openAuth())} className="bg-secondary-500 content-stretch flex gap-2 h-14 items-center justify-center overflow-clip px-8 py-4 relative rounded-lg shrink-0 transition-colors hover:bg-secondary-600">
              <p className="wrap-break-word font-inter-medium font-medium leading-5 not-italic relative shrink-0 text-slate-800 text-base text-center whitespace-nowrap">
                Get Started
              </p>
              <div className="relative shrink-0 size-5">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgHeroiconsSolidArrowUpRight} />
              </div>
            </button>
            <button type="button" onClick={() => setOverlay({ type: "catalog" })} className="bg-slate-150 content-stretch flex gap-2 h-14 items-center justify-center overflow-clip px-5 py-2.5 relative rounded-lg shrink-0 transition-colors hover:bg-white">
              <p className="wrap-break-word font-inter-medium font-medium leading-5 not-italic relative shrink-0 text-slate-800 text-base whitespace-nowrap">
                Browse Courses
              </p>
              <div className="relative shrink-0 size-5">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgHeroiconsSolidArrowUpRight} />
              </div>
            </button>
          </div>
        </div>
        <Parallax speed={0.25} className="pointer-events-none absolute inset-0">
          <div className="absolute flex items-center justify-center -left-42.75 size-124 -top-76.25">
            <div className="flex-none rotate-90">
              <div className="relative size-124">
                <div className="absolute bottom-0 left-1/2 right-0 top-0">
                  <img alt="" className="block max-w-none size-full" src={imgEllipse12} />
                </div>
              </div>
            </div>
          </div>
        </Parallax>
        <Parallax speed={-0.15} className="pointer-events-none absolute inset-0">
          <div className="absolute flex items-center justify-center left-59 size-69 top-97.25">
            <div className="-rotate-90 flex-none">
              <div className="relative size-69">
                <div className="absolute bottom-0 left-1/2 right-0 top-0">
                  <img alt="" className="block max-w-none size-full" src={imgEllipse14} />
                </div>
              </div>
            </div>
          </div>
        </Parallax>
        <Parallax speed={-0.2} className="pointer-events-none absolute inset-0">
          <div className="absolute flex items-center justify-center left-236 size-65.5 -top-48">
            <div className="flex-none rotate-90">
              <div className="relative size-65.5">
                <div className="absolute bottom-0 left-1/2 right-0 top-0">
                  <img alt="" className="block max-w-none size-full" src={imgEllipse15} />
                </div>
              </div>
            </div>
          </div>
        </Parallax>
        <Parallax speed={0.15} className="pointer-events-none absolute inset-0">
          <div className="absolute flex items-center justify-center left-356 size-124 top-69.75">
            <div className="-rotate-90 -scale-y-100 flex-none">
              <div className="relative size-124">
                <div className="absolute bottom-0 left-1/2 right-0 top-0">
                  <img alt="" className="block max-w-none size-full" src={imgEllipse13} />
                </div>
              </div>
            </div>
          </div>
        </Parallax>
      </div>
      <div className="bg-amber-500/4 content-stretch flex flex-col items-center overflow-clip relative shrink-0 w-full">
        <div className="bg-gradient-to-b content-stretch flex flex-col from-olive-100 gap-15 items-center justify-center py-24 relative shrink-0 to-white w-full">
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            <div className="content-stretch flex flex-col items-center px-5 relative shrink-0 w-full">
              <div className="wrap-break-word content-stretch flex flex-col gap-4 items-center sm:px-5 relative shrink-0 text-center w-full max-w-135">
                <p className="font-instrument-bold font-bold leading-normal relative shrink-0 text-slate-900 text-32 md:text-40 xl:text-5xl tracking-tight xl:whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
                  Our well-wishers thought
                </p>
                <div className="flex flex-col font-inter-regular font-normal justify-center leading-0 min-w-full not-italic relative shrink-0 text-slate-800 text-sm w-min">
                  <p className="leading-5.5">{`At Thkee, we're proud of the successes of our students & instructors. Here's what some of them have to say`}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-10 items-center relative shrink-0 w-full">
            <div ref={sliderRef} className="h-80 sm:h-72 w-full-minus-8 max-w-335.25 overflow-hidden">
              <div className="flex h-full gap-6 transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentSlide * slider.step}px)` }}>
                {testimonials.map((t) => (
                  <div key={t.name} className="bg-white border border-slate-200 border-solid content-stretch flex flex-col gap-4 h-full items-start px-5 md:px-8 py-5 md:py-6 relative rounded-2xl shrink-0 w-full sm:w-107.75">
                    <Star className="content-stretch flex flex-col items-start relative shrink-0" />
                    <p className="wrap-break-word grow shrink-0 basis-0 font-inter-regular font-normal leading-6 min-h-px min-w-full not-italic overflow-hidden relative text-slate-800 text-sm w-min">{`“${t.quote}”`}</p>
                    <div className="content-stretch flex gap-4 items-center relative shrink-0 w-full">
                      <div className="content-stretch flex items-center justify-center p-2.5 relative rounded-3xl shrink-0 size-10" style={{ backgroundColor: t.color }}>
                        <p className="font-inter-bold font-bold leading-5 not-italic relative shrink-0 text-primary-100 text-sm whitespace-nowrap">{t.initials}</p>
                      </div>
                      <div className="wrap-break-word content-stretch flex grow shrink-0 basis-0 flex-col items-start justify-center min-w-px not-italic relative">
                        <p className="font-inter-semibold font-semibold leading-6 -mb-0.5 relative shrink-0 text-slate-800 text-sm w-full">{t.name}</p>
                        <p className="font-inter-regular font-normal leading-4.5 relative shrink-0 text-slate-400 text-xs w-full">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
              <div className="bg-slate-150 content-stretch flex flex-col items-start p-2 relative rounded-3xl shrink-0">
                <div className="content-stretch flex gap-4 items-center relative shrink-0">
                  <button type="button" aria-label="Previous testimonials" onClick={() => setSlide((currentSlide - 1 + testimonialStops) % testimonialStops)} className="flex size-13 shrink-0 items-center justify-center rounded-full bg-white text-slate-800 transition-colors hover:bg-primary-700 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                  <button type="button" aria-label="Next testimonials" onClick={() => setSlide((currentSlide + 1) % testimonialStops)} className="flex size-13 shrink-0 items-center justify-center rounded-full bg-white text-slate-800 transition-colors hover:bg-primary-700 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white content-stretch flex flex-col gap-15 items-center justify-center py-18 relative shrink-0 w-full">
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
          <div className="content-stretch flex flex-col items-center px-5 relative shrink-0 w-full">
            <div className="wrap-break-word content-stretch flex flex-col gap-4 items-center sm:px-5 relative shrink-0 text-center w-full max-w-135">
              <p className="font-instrument-bold font-bold leading-normal relative shrink-0 text-slate-900 text-32 md:text-40 xl:text-5xl tracking-tight xl:whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
                Start Your AI Learning Journey
              </p>
              <div className="flex flex-col font-inter-regular font-normal justify-center leading-0 min-w-full not-italic relative shrink-0 text-slate-800 text-sm w-min">
                <p className="leading-5.5">Learn from experts, follow guided paths, and gain real-world AI skills faster.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-300 px-4 md:px-8 xl:px-0 xl:block xl:h-125 overflow-clip shrink-0">
          <div className="relative h-48.75 xl:absolute xl:left-0 xl:right-215 xl:top-3.5">
            <div className="absolute left-0 top-0 size-15 overflow-clip">
              <div className="absolute left-0 overflow-clip size-15 top-0">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 overflow-clip size-15 top-1/2">
                  <div className="absolute contents inset-0">
                    <div className="absolute mask-alpha mask-intersect mask-no-clip mask-no-repeat" style={{ inset: "18.75% 6.25% 12.5% 12.5%", maskPosition: "-7.5px -11.25px", WebkitMaskPosition: "-7.5px -11.25px", maskSize: "60px 60px", WebkitMaskSize: "60px 60px", maskImage: `url("${imgGroup2}")` }}>
                      <div className="absolute" style={{ inset: "-2.42% -2.05%" }}>
                        <img alt="" className="block max-w-none size-full" src={imgGroup3} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="wrap-break-word absolute content-stretch flex flex-col gap-4.5 items-start leading-0 left-0 top-23.75 w-full xl:w-80.5">
              <div className="flex flex-col font-instrument-bold font-bold h-7.75 justify-center relative shrink-0 text-mist-900 text-2xl w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-8">Expert Instructors</p>
              </div>
              <div className="flex flex-col font-inter-regular font-normal h-12 justify-center not-italic relative shrink-0 text-zinc-500 text-sm w-full">
                <p className="leading-5.5">Learn from industry experts guiding you every step.</p>
              </div>
            </div>
          </div>
          <div className="absolute hidden xl:block bg-mist-300 h-px left-0 right-215 top-62.5" />
          <div className="relative h-48.75 xl:absolute xl:left-0 xl:right-215 xl:top-72.5">
            <div className="absolute left-0 top-0 size-15 overflow-clip">
              <div className="absolute left-0 overflow-clip size-15 top-0">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 overflow-clip size-15 top-1/2">
                  <div className="absolute contents inset-0">
                    <div className="absolute mask-alpha mask-intersect mask-no-clip mask-no-repeat" style={{ inset: "21.88% 3.13% 15.62% 3.13%", maskPosition: "-1.876px -13.125px", WebkitMaskPosition: "-1.876px -13.125px", maskSize: "60px 60px", WebkitMaskSize: "60px 60px", maskImage: `url("${imgGroup2}")` }}>
                      <div className="absolute" style={{ inset: "-2.67% -1.78%" }}>
                        <img alt="" className="block max-w-none size-full" src={imgGroup4} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="wrap-break-word absolute content-stretch flex flex-col gap-4.5 items-start leading-0 left-0 top-23.5 w-full xl:w-84.5">
              <div className="flex flex-col font-instrument-bold font-bold h-8 justify-center relative shrink-0 text-mist-900 text-2xl w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-8">Hands-On Practice</p>
              </div>
              <div className="flex flex-col font-inter-regular font-normal h-12 justify-center not-italic relative shrink-0 text-zinc-500 text-sm w-full">
                <p className="leading-5.5">Apply your knowledge with real projects and exercises.</p>
              </div>
            </div>
          </div>
          <div className="relative order-first md:col-span-2 h-53 sm:h-85 md:h-106 xl:contents">
          <div className="absolute left-1/2 top-0 w-148 h-106 -translate-x-1/2 scale-50 sm:scale-80 md:scale-100 origin-top bg-white overflow-clip xl:inset-hero-art xl:w-auto xl:h-auto xl:translate-x-0">
            <div className="absolute flex h-79.5 items-center justify-center left-6 top-5.5 w-125">
              <div className="flex-none -rotate-20">
                <div className="h-41.5 relative w-118">
                  <div className="live-pulse absolute" style={{ inset: "-1.32% -0.46%" }}>
                    <img alt="" className="block max-w-none size-full" src={imgEllipse1914} />
                  </div>
                </div>
              </div>
            </div>
            <div className="live-float absolute" style={{ inset: "6.09% 35.1% 20.46% 27.72%" }}>
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVector4} />
            </div>
            <div className="live-pulse absolute h-6 left-53.75 top-87.5 w-53.5">
              <div className="absolute" style={{ inset: "-110.42% -12.38%" }}>
                <img alt="" className="block max-w-none size-full" src={imgEllipse1915} />
              </div>
            </div>
            <div className="live-float absolute" style={{ inset: "6.09% 35.1% 20.46% 27.72%" }}>
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVector5} />
            </div>
            <div className="absolute flex h-61 items-center justify-center left-12.75 top-24 w-118.25">
              <div className="flex-none -rotate-20">
                <div className="h-21.75 relative w-118">
                  <div className="live-pulse absolute" style={{ inset: "0 -0.46% -2.52% -0.46%", animationDelay: "1.5s" }}>
                    <img alt="" className="block max-w-none size-full" src={imgEllipse1916} />
                  </div>
                </div>
              </div>
            </div>
            <div className="live-dot absolute left-25 size-4.5 top-53">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse1918} />
            </div>
            <div className="live-dot absolute left-47.75 size-3 top-20">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse1919} />
            </div>
            <div className="live-float absolute" style={{ inset: "25.95% 31.08% 51.87% 53.04%" }}>
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIcon} />
            </div>
            <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 size-80 -translate-x-1/2 -translate-y-1/2">
              <span className="live-ring absolute inset-15 rounded-full border border-primary-700/40" />
              <span className="live-ring absolute inset-15 rounded-full border border-primary-700/40" style={{ animationDelay: "1.6s" }} />
              <div className="live-orbit absolute inset-0">
                <span className="absolute left-1/2 top-0 size-2.5 -translate-x-1/2 rounded-full bg-secondary-500 shadow-xs shadow-secondary-500" />
              </div>
              <div className="live-orbit-rev absolute inset-10">
                <span className="absolute bottom-0 left-1/2 size-2 -translate-x-1/2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500" />
              </div>
            </div>
          </div>
          </div>
          <div className="relative h-48.75 xl:absolute xl:left-215 xl:right-0 xl:top-3.5">
            <div className="absolute left-0 xl:left-70 top-0 size-15 overflow-clip">
              <div className="absolute left-0 overflow-clip size-15 top-0">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 overflow-clip size-15 top-1/2">
                  <div className="absolute contents inset-0">
                    <div className="absolute mask-alpha mask-intersect mask-no-clip mask-no-repeat" style={{ inset: "12.5% 6.23% 15.62% 6.23%", maskPosition: "-3.74px -7.5px", WebkitMaskPosition: "-3.74px -7.5px", maskSize: "60px 60px", WebkitMaskSize: "60px 60px", maskImage: `url("${imgGroup2}")` }}>
                      <div className="absolute" style={{ inset: "-2.32% -1.9%" }}>
                        <img alt="" className="block max-w-none size-full" src={imgGroup5} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="wrap-break-word absolute content-stretch flex flex-col gap-4.5 items-start leading-0 left-0 xl:left-3.5 text-left xl:text-right top-23.75 w-full xl:w-82.25">
              <div className="flex flex-col font-instrument-bold font-bold h-7.75 justify-center relative shrink-0 text-mist-900 text-2xl w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-8">Guided Learning</p>
              </div>
              <div className="flex flex-col font-inter-regular font-normal justify-center not-italic relative shrink-0 text-zinc-500 text-sm w-full">
                <p className="leading-5.5">Clear paths that take you from beginner to confident professional.</p>
              </div>
            </div>
          </div>
          <div className="absolute hidden xl:block bg-mist-300 h-px left-215 right-0 top-62.5" />
          <div className="relative h-48.75 xl:absolute xl:left-215 xl:right-0 xl:top-72.5">
            <div className="absolute left-0 xl:left-70 top-0 size-15 overflow-clip">
              <div className="absolute left-0 overflow-clip size-15 top-0">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 overflow-clip size-15 top-1/2">
                  <div className="absolute contents inset-0">
                    <div className="absolute mask-alpha mask-intersect mask-no-clip mask-no-repeat" style={{ inset: "18.75% 12.5%", maskPosition: "-7.5px -11.25px", WebkitMaskPosition: "-7.5px -11.25px", maskSize: "60px 60px", WebkitMaskSize: "60px 60px", maskImage: `url("${imgGroup2}")` }}>
                      <div className="absolute" style={{ inset: "-2.67% -2.22%" }}>
                        <img alt="" className="block max-w-none size-full" src={imgGroup6} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="wrap-break-word absolute content-stretch flex flex-col gap-4.5 items-start leading-0 left-0 xl:left-3.5 text-left xl:text-right top-23.75 w-full xl:w-81.5">
              <div className="flex flex-col font-instrument-bold font-bold h-7.75 justify-center relative shrink-0 text-mist-900 text-2xl w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-8">AI Career Skills</p>
              </div>
              <div className="flex flex-col font-inter-regular font-normal justify-center not-italic relative shrink-0 text-zinc-500 text-sm w-full">
                <p className="leading-5.5">Master practical AI tools and build skills that grow your career.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="faq" className="scroll-mt-20 bg-white content-stretch flex flex-col gap-15 items-center justify-center py-18 relative shrink-0 w-full">
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
          <div className="content-stretch flex flex-col items-center px-5 relative shrink-0 w-full">
            <div className="wrap-break-word content-stretch flex flex-col gap-4 items-center sm:px-5 relative shrink-0 text-center w-full max-w-135">
              <p className="font-instrument-bold font-bold leading-normal relative shrink-0 text-slate-900 text-32 md:text-40 xl:text-5xl tracking-tight xl:whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
                Frequently Asked Questions
              </p>
              <div className="flex flex-col font-inter-regular font-normal justify-center leading-0 min-w-full not-italic relative shrink-0 text-slate-800 text-sm w-min">
                <p className="leading-5.5">Here are a few of the most frequent queries we get from learners and instructors.</p>
              </div>
            </div>
          </div>
        </div>
        <Faq />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-t border-primary-700 border-solid relative shrink-0 w-full">
        <div className="border-primary-700 border-b border-solid sm:even:border-l xl:[&:not(:first-child)]:border-l content-stretch flex flex-col items-center justify-center min-w-px px-6 md:px-12 py-8 xl:py-15 relative">
          <div className="content-stretch flex gap-5 items-center relative shrink-0 w-full">
            <div className="overflow-clip relative shrink-0 size-13">
              <div className="absolute left-0 overflow-clip size-13 top-0">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 overflow-clip size-13 top-1/2">
                  <div className="absolute contents inset-0">
                    <div className="absolute inset-0 mask-alpha mask-intersect mask-no-clip mask-no-repeat" style={{ maskSize: "52px 52px", WebkitMaskSize: "52px 52px", maskImage: `url("${imgGroup7}")` }}>
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup8} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="wrap-break-word content-stretch flex flex-col gap-2 items-start leading-0 relative min-w-0 flex-1">
              <div className="flex flex-col font-instrument-bold font-bold justify-center relative shrink-0 text-olive-950 text-2xl w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-8">Learn Anything</p>
              </div>
              <div className="flex flex-col font-inter-regular font-normal justify-center not-italic relative shrink-0 text-stone-600 text-sm w-full">
                <p className="leading-5.5">From beginner to advanced</p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-primary-700 border-b border-solid sm:even:border-l xl:[&:not(:first-child)]:border-l content-stretch flex flex-col items-center justify-center min-w-px px-6 md:px-12 py-8 xl:py-15 relative">
          <div className="content-stretch flex gap-5 items-center relative shrink-0 w-full">
            <div className="h-12 overflow-clip relative shrink-0 w-13">
              <div className="absolute h-12 left-0 overflow-clip top-0 w-13">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute h-12 left-1/2 top-1/2 w-13">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={img687Cd80C0F17D680A102A7B5Key20Feature20Icon202Svg} />
                </div>
              </div>
            </div>
            <div className="wrap-break-word content-stretch flex flex-col gap-2 items-start leading-0 relative min-w-0 flex-1">
              <div className="flex flex-col font-instrument-bold font-bold justify-center relative shrink-0 text-olive-950 text-2xl w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-8">Flexible Courses</p>
              </div>
              <div className="flex flex-col font-inter-regular font-normal justify-center not-italic relative shrink-0 text-stone-600 text-sm w-full">
                <p className="leading-5.5">Learn anytime, anywhere</p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-primary-700 border-b border-solid sm:even:border-l xl:[&:not(:first-child)]:border-l content-stretch flex flex-col items-center justify-center min-w-px px-6 md:px-12 py-8 xl:py-15 relative">
          <div className="content-stretch flex gap-5 items-center relative shrink-0 w-full">
            <div className="overflow-clip relative shrink-0 size-13">
              <div className="absolute left-0 overflow-clip size-13 top-0">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 overflow-clip size-13 top-1/2">
                  <div className="absolute contents inset-0">
                    <div className="absolute mask-alpha mask-intersect mask-no-clip mask-no-repeat" style={{ inset: "0 0 -0.01% 0", maskSize: "52px 52px", WebkitMaskSize: "52px 52px", maskImage: `url("${imgGroup7}")` }}>
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup9} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="wrap-break-word content-stretch flex flex-col gap-2 items-start leading-0 relative min-w-0 flex-1">
              <div className="flex flex-col font-instrument-bold font-bold justify-center relative shrink-0 text-olive-950 text-2xl w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-8">Get Certificate</p>
              </div>
              <div className="flex flex-col font-inter-regular font-normal justify-center not-italic relative shrink-0 text-stone-600 text-sm w-full">
                <p className="leading-5.5">Showcase your achievements</p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-primary-700 border-b border-solid sm:even:border-l xl:[&:not(:first-child)]:border-l content-stretch flex flex-col items-center justify-center min-w-px px-6 md:px-12 py-8 xl:py-15 relative">
          <div className="content-stretch flex gap-5 items-center relative shrink-0 w-full">
            <div className="overflow-clip relative shrink-0 size-13">
              <div className="absolute left-0 overflow-clip size-13 top-0">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 overflow-clip size-13 top-1/2">
                  <div className="absolute contents inset-0">
                    <div className="absolute inset-0 mask-alpha mask-intersect mask-no-clip mask-no-repeat" style={{ maskSize: "52px 52px", WebkitMaskSize: "52px 52px", maskImage: `url("${imgGroup7}")` }}>
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup10} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="wrap-break-word content-stretch flex flex-col gap-2 items-start leading-0 relative min-w-0 flex-1">
              <div className="flex flex-col font-instrument-bold font-bold justify-center relative shrink-0 text-olive-950 text-2xl w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-8">Expert Tutors</p>
              </div>
              <div className="flex flex-col font-inter-regular font-normal justify-center not-italic relative shrink-0 text-stone-600 text-sm w-full">
                <p className="leading-5.5">Teaching skills across categories.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-b content-stretch flex flex-col from-ai-950 xl:h-106.5 items-start relative shrink-0 to-slate-900 to-55% w-full">
        <div className="xl:grow shrink-0 basis-0 min-h-px overflow-clip relative w-full px-4 py-20 xl:p-0">
          <Parallax speed={-0.3} className="pointer-events-none absolute inset-0">
            <div className="absolute left-319.75 size-17 top-89.5">
              <div className="absolute" style={{ inset: "-425.15%" }}>
                <img alt="" className="block max-w-none size-full" src={imgEllipse1899} />
              </div>
            </div>
          </Parallax>
          <div className="absolute bottom-1 h-44.25 left-0 w-441">
            <div className="absolute" style={{ inset: "-0.21% -0.16% -0.25% -0.16%" }}>
              <img alt="" className="block max-w-none size-full" src={imgVector6} />
            </div>
          </div>
          <Parallax speed={0.3} className="pointer-events-none absolute inset-0">
            <div className="absolute left-37.75 size-17 top-68">
              <div className="absolute" style={{ inset: "-425.15%" }}>
                <img alt="" className="block max-w-none size-full" src={imgEllipse1898} />
              </div>
            </div>
          </Parallax>
          <div className="relative z-10 mx-auto content-stretch flex flex-col items-start w-full max-w-160.5 xl:absolute xl:left-1/2 xl:top-1/2 xl:-mt-0.5 xl:-translate-x-1/2 xl:-translate-y-1/2">
            <div className="content-stretch flex flex-col gap-10 items-center relative shrink-0 w-full">
              <div className="wrap-break-word content-stretch flex flex-col gap-2 items-center relative shrink-0 text-center w-full">
                <p className="font-instrument-bold font-bold leading-normal relative shrink-0 text-32 md:text-40 xl:text-5xl text-white tracking-tight w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                  Stay Connected via Thkee
                </p>
                <div className="flex flex-col font-inter-regular font-normal justify-center leading-0 not-italic relative shrink-0 text-slate-300 text-sm w-full">
                  <p className="leading-5.5">Join us on social media, get in touch with us for support.</p>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-3 items-center relative shrink-0 w-full">
                <Newsletter />
                <div className="content-stretch flex gap-2.5 items-center justify-center relative shrink-0">
                  <div className="relative shrink-0 size-6">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgAgreement02} />
                  </div>
                  <div className="wrap-break-word flex flex-col font-inter-regular font-normal justify-center leading-0 not-italic relative shrink-0 text-slate-25 text-sm text-right whitespace-nowrap">
                    <p className="leading-6">We protect your privacy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
