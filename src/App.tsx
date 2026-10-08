import { useEffect, useRef, useState, type FormEvent } from "react";
import Navbar from "./components/Navbar";
import Overlays from "./components/Overlays";
import { faqs } from "./data";
import { fontHeading, fontRegular, fontSemi } from "./fonts";
import { AppProvider, scrollToId, useApp } from "./store";

const assetPathPrefix = "/assets";
const imgFrame40215 = `${assetPathPrefix}/503a2.svg`;
const imgFrame1618874388 = `${assetPathPrefix}/9f67c.png`;
const imgPaper = `${assetPathPrefix}/a0b77.png`;
const imgWeb032 = `${assetPathPrefix}/6f650.png`;
const imgEllipse676 = `${assetPathPrefix}/6849e.svg`;
const imgCompoundPath = `${assetPathPrefix}/8160c.svg`;
const imgFrame1000003865 = `${assetPathPrefix}/62f49.svg`;
const imgFrame1000003866 = `${assetPathPrefix}/0c4e1.svg`;
const imgFrame1000003857 = `${assetPathPrefix}/d27a0.svg`;
const imgFrame1000003858 = `${assetPathPrefix}/1174e.svg`;
const imgFrame1000003859 = `${assetPathPrefix}/c8853.svg`;
const imgFrame1000003861 = `${assetPathPrefix}/ad0e8.svg`;
const imgFrame1000003862 = `${assetPathPrefix}/42f55.svg`;
const imgContent = `${assetPathPrefix}/72256.svg`;
const imgVertical = `${assetPathPrefix}/21927.svg`;
const imgHorizontal = `${assetPathPrefix}/319d8.svg`;
const imgFrame1000003847 = `${assetPathPrefix}/712ae.svg`;
const imgFrame1000003854 = `${assetPathPrefix}/dc392.svg`;
const imgFrame1000003849 = `${assetPathPrefix}/85a4e.svg`;
const imgEllipse168 = `${assetPathPrefix}/37b9d.svg`;
const imgEllipse2461 = `${assetPathPrefix}/17517.svg`;
const imgFrame = `${assetPathPrefix}/86db7.svg`;
const imgMortarboard02 = `${assetPathPrefix}/85dd9.svg`;
const imgHeroiconsMiniArrowRight = `${assetPathPrefix}/ae9fa.svg`;
const imgElements = `${assetPathPrefix}/8da4a.svg`;
const imgFrame1000003850 = `${assetPathPrefix}/d5325.svg`;
const imgGlobe02 = `${assetPathPrefix}/28db3.svg`;
const imgFrame1000003856 = `${assetPathPrefix}/b5d79.svg`;
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
const imgArrowLeft01 = `${assetPathPrefix}/e30fd.svg`;
const imgVector3 = `${assetPathPrefix}/7ba7e.svg`;
const imgArrowLeft2 = `${assetPathPrefix}/72b9f.svg`;
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
const imgGraduationCap = `${assetPathPrefix}/88431.svg`;

type StarProps = {
  className?: string;
  type?: "Five";
};

function Star({ className, type = "Five" }: StarProps) {
  return (
    <div className={className || "content-stretch flex flex-col items-start relative"}>
      <div className="h-[16.006px] relative shrink-0 w-[99.548px]">
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
  return <div className={className || "overflow-clip relative size-[640px]"} style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 640 640' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(-0.0000033646 32 -32 -0.0000052573 320 320)'><stop stop-color='rgba(0,0,0,1)' offset='0'/><stop stop-color='rgba(0,0,0,0)' offset='1'/></radialGradient></defs></svg>\")" }} />;
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
    <div className="bg-gradient-to-b content-stretch flex flex-col from-[#f8fafc] items-center justify-center overflow-clip px-4 md:px-8 py-[64px] xl:py-[96px] relative shrink-0 to-white w-full">
      <div className="content-stretch flex flex-col xl:flex-row gap-10 items-center justify-between relative shrink-0 w-full max-w-[1320px]">
        <div className="[word-break:break-word] content-stretch flex flex-col gap-[40px] items-start relative shrink-0 w-full xl:w-[650px]">
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
            <p className="font-['Instrument_Sans:Bold'] font-bold leading-[normal] relative shrink-0 text-[#0f172a] text-[32px] md:text-[40px] xl:text-[48px] tracking-[-0.96px] w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
              Personalized Learning
            </p>
            <p className="font-['Inter:Regular'] font-normal leading-[28px] not-italic text-[#1e293b] text-[18px] w-full">
              At THKEE, personalized learning goes beyond attending classes - you are creating a path toward your desired goals that are tailored specifically for you.
            </p>
          </div>
          <div className="flex w-full flex-col gap-[8px]" role="tablist" aria-label="Personalized learning highlights">
            {personalizedItems.map((item, i) => {
              const isActive = i === active;
              return (
                <button
                  key={item.title}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(i)}
                  className={`group relative flex w-full flex-col items-start gap-[8px] rounded-[16px] py-[20px] md:py-[24px] pl-[40px] pr-5 md:pr-[32px] text-left transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d5c4b] ${
                    isActive
                      ? "bg-white shadow-[0_10px_30px_rgba(13,92,75,0.12)] ring-1 ring-[#0d5c4b]/10"
                      : "bg-transparent hover:translate-x-[6px] hover:bg-white/80 hover:shadow-[0_6px_20px_rgba(15,23,42,0.07)]"
                  }`}
                >
                  <span aria-hidden className="absolute bottom-[20px] left-[18px] top-[20px] w-[4px] overflow-hidden rounded-full bg-[#d6e2df]">
                    {isActive && <span key={`fill-${active}`} className="pl-fill block h-full w-full rounded-full bg-[#0d5c4b]" onAnimationEnd={next} />}
                  </span>
                  <span className={`font-['Instrument_Sans:Bold'] text-[20px] font-bold leading-[32px] tracking-[0.15px] transition-colors duration-300 ${isActive ? "text-[#0b4c3e]" : "text-[#1e293b] group-hover:text-[#0b4c3e]"}`} style={{ fontVariationSettings: '"wdth" 100' }}>
                    {item.title}
                  </span>
                  <span className={`font-['Inter:Regular'] text-[16px] font-normal leading-[28px] tracking-[-0.01px] transition-colors duration-300 ${isActive ? "text-[#0d5c4b]" : "text-[#64748b]"}`}>
                    {item.body}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="relative h-[360px] sm:h-[480px] xl:h-[640px] w-full max-w-[533px] xl:w-[533px] shrink-0 overflow-hidden rounded-[20px] border-[6px] border-solid border-white bg-white shadow-[0_20px_50px_rgba(15,23,42,0.1)]">
          {personalizedItems.map((item, i) => (
            <img
              key={item.title}
              alt={item.alt}
              src={item.image}
              className={`pointer-events-none absolute inset-0 size-full max-w-none object-cover transition-all duration-700 ease-out ${i === active ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
            />
          ))}
        </div>
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
    <div ref={ref} className="w-full max-w-[1320px] px-4 md:px-8 xl:px-0" style={{ height: `calc(70vh + ${HIGHLIGHT_SCROLL_DISTANCE}px)` }}>
      <div className="sticky top-[15vh] flex h-[70vh] items-center">
        <p className="[word-break:break-word] font-['Instrument_Sans:Bold'] text-[32px] md:text-[40px] xl:text-[48px] font-bold leading-[normal] tracking-[-0.96px]" style={{ fontVariationSettings: '"wdth" 100' }}>
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
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[110] h-[3px]">
      <div ref={ref} className="h-full origin-left scale-x-0 bg-gradient-to-r from-[#12b981] via-[#39aeeb] to-[#ffb20d] shadow-[0_0_12px_rgba(57,174,235,0.8)]" />
    </div>
  );
}

function Faq() {
  const [audience, setAudience] = useState<"Student" | "Instructor">("Student");
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const items = faqs[audience];

  return (
    <div className="content-stretch flex flex-col gap-[40px] items-center relative shrink-0 w-full px-4 md:px-8">
      <div className="bg-[#f1f5f9] flex gap-[8px] p-[6px] rounded-[999px]" role="tablist" aria-label="FAQ audience">
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
            className={`px-[24px] sm:px-[32px] py-[8px] rounded-[999px] text-[18px] leading-[28px] transition-colors ${audience === a ? `bg-[#334155] text-white font-['Inter:Medium'] font-medium` : `text-[#334155] hover:bg-white ${fontRegular}`}`}
          >
            {a}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-[8px] w-full max-w-[860px]">
        {items.map((item, i) => {
          const open = openIndex === i;
          return (
            <div key={item.q} className={`rounded-[16px] border transition-colors ${open ? "bg-[#fafbfc] border-[#cbd5e1]" : "border-transparent hover:bg-[#fafbfc]"}`}>
              <button type="button" aria-expanded={open} onClick={() => setOpenIndex(open ? null : i)} className="flex w-full items-center gap-[24px] px-5 md:px-[32px] py-5 md:py-[24px] text-left">
                <span className={`flex-1 text-[#1e293b] text-[18px] md:text-[20px] leading-[28px] md:leading-[32px] tracking-[0.15px] ${fontHeading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
                  {item.q}
                </span>
                <img alt="" className="size-[28px] md:size-[32px] shrink-0" src={open ? imgMinusSign : imgAdd01} />
              </button>
              <div className={`grid transition-[grid-template-rows] duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <p className={`px-5 md:px-[32px] pb-6 md:pb-[32px] text-[#1e293b] text-[16px] leading-[28px] tracking-[-0.01px] ${fontRegular}`}>{item.a}</p>
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
      <div className={`bg-white border border-solid flex h-[60px] items-center gap-3 pl-[20px] sm:pl-[29px] pr-[6px] relative rounded-[12px] shadow-[0px_4px_87px_0px_rgba(176,176,176,0.08)] w-full ${status === "error" ? "border-[#ef4444]" : "border-[#e2e8f0]"}`}>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          placeholder="Enter your email..."
          aria-label="Email address"
          className={`flex-1 min-w-0 bg-transparent leading-[24px] text-[#1e293b] text-[16px] tracking-[-0.01px] placeholder:text-[#1e293b] focus:outline-none ${fontRegular}`}
        />
        <button type="submit" className={`bg-[#1e293b] px-[20px] py-[12px] rounded-[8px] shrink-0 leading-[24px] text-[16px] text-white whitespace-nowrap transition-colors hover:bg-[#0d5c4b] ${fontSemi}`}>
          Subscribe
        </button>
      </div>
      {status === "error" && <p className={`text-[14px] text-[#fca5a5] ${fontRegular}`}>Please enter a valid email address.</p>}
      {status === "done" && <p className={`text-[14px] text-[#86efac] ${fontRegular}`}>Thanks! You're on the list. ✓</p>}
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
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="bg-[#1e293b] flex gap-[8px] items-center px-[16px] py-[6px] rounded-[4px] text-[#cbd5e1] text-[16px] transition-colors hover:bg-[#273449]">
        <img alt="" className="size-[16px]" src={imgGlobe02} />
        <span className={`leading-[28px] ${fontSemi}`}>{options.find((o) => o.code === lang)?.label}</span>
        <img alt="" className={`size-[20px] transition-transform ${open ? "rotate-180" : ""}`} src={imgHeroiconsMiniChevronDown1} />
      </button>
      {open && (
        <div className="pop-in absolute bottom-[calc(100%+6px)] left-0 z-10 w-[180px] rounded-[8px] border border-white/10 bg-[#1e293b] p-1 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
          {options.map((o) => (
            <button
              key={o.code}
              type="button"
              onClick={() => {
                setLang(o.code);
                setOpen(false);
                notify(o.code === "AR" ? "Language set to العربية (full translation coming soon)" : "Language set to English");
              }}
              className={`flex w-full items-center justify-between rounded-[6px] px-3 py-2 text-left text-[15px] text-[#e2e8f0] hover:bg-white/10 ${fontSemi}`}
            >
              {o.label}
              {lang === o.code && <span className="text-[#faa104]">✓</span>}
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
      <LandingPage />
    </AppProvider>
  );
}

function LandingPage() {
  const { setOverlay, user } = useApp();
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
      <ScrollProgress />
      <Navbar />
      <Overlays />
      <div className="xl:h-[911px] overflow-clip relative shrink-0 w-full" style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 1728 911' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(85.45 48.828 -94.834 130.5 840 404.5)'><stop stop-color='rgba(0,109,86,1)' offset='0'/><stop stop-color='rgba(0,81,63,1)' offset='0.16038'/><stop stop-color='rgba(0,60,47,1)' offset='0.40715'/><stop stop-color='rgba(0,40,31,1)' offset='0.65391'/></radialGradient></defs></svg>\")" }}>
        <div className="absolute contents left-[482.48px] top-[44.03px]">
          <div className="absolute h-[450px] left-[482.48px] top-[44.03px] w-[475px]">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse676} />
          </div>
        </div>
        <div className="-translate-x-1/2 absolute flex h-[1498.004px] items-center justify-center left-[calc(50%-0.49px)] top-[726px] w-[1499.13px]">
          <div className="flex-none rotate-180">
            <div className="h-[1498.004px] relative w-[1499.13px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgCompoundPath} />
            </div>
          </div>
        </div>
        <div className="absolute h-[695px] left-[85px] top-[77px] w-[1573px]">
          <div className="absolute left-[337px] size-[24px] top-[462px]">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame1000003865} />
          </div>
          <div className="absolute left-[95px] size-[24px] top-[133px]">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame1000003866} />
          </div>
          <div className="absolute left-0 size-[24px] top-[12px]">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame1000003858} />
          </div>
          <div className="absolute left-[1240px] size-[16px] top-[439px]">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame1000003859} />
          </div>
        </div>
        <div className="-translate-x-1/2 absolute h-[850px] left-1/2 top-[-29px] w-[1440px]">
          <div className="-translate-x-1/2 absolute left-1/2 mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-size-[768px_768px] size-[768px] top-0" style={{ maskImage: `url("${imgContent}")` }}>
            <div className="absolute content-stretch flex flex-col items-start left-0 overflow-clip top-0">
              <div className="relative shrink-0 size-[768px]">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVertical} />
              </div>
              <div className="absolute left-0 size-[768px] top-0">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgHorizontal} />
              </div>
            </div>
            <div className="absolute left-[-92px] size-[24px] top-[386px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame1000003847} />
            </div>
            <div className="absolute left-[613px] size-[24px] top-[515px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame1000003849} />
            </div>
            <div className="absolute left-[565px] size-[24px] top-[228px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame1000003847} />
            </div>
            <div className="absolute left-[468px] size-[24px] top-[323px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame1000003847} />
            </div>
            <div className="absolute left-[286px] size-[4px] top-[334px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse168} />
            </div>
            <div className="absolute left-[478px] size-[4px] top-[238px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse168} />
            </div>
            <div className="absolute left-[527px] size-[4px] top-[430px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse168} />
            </div>
            <div className="absolute left-[142px] size-[4px] top-[382px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse168} />
            </div>
            <div className="absolute bg-[rgba(11,202,202,0.15)] h-[48px] left-[528px] top-[288px] w-[49px]" />
            <div className="absolute bg-[rgba(11,202,202,0.15)] h-[48px] left-[96px] top-[432px] w-[49px]" />
            <div className="absolute bg-[rgba(11,202,202,0.15)] h-[48px] left-[625px] top-[432px] w-[49px]" />
          </div>
          <div className="absolute bg-[rgba(211,255,255,0.16)] blur-[9.35px] h-[25px] left-[47px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[289px_-555px] mask-size-[768px_768px] top-[555px] w-[129px]" style={{ maskImage: `url("${imgContent}")` }} />
          <div className="absolute h-[485px] left-[488px] top-[183px] w-[464px]">
            <div className="absolute inset-[-92.78%_-96.98%]">
              <img alt="" className="block max-w-none size-full" src={imgEllipse2461} />
            </div>
          </div>
        </div>
        <div className="absolute h-[850px] left-0 opacity-0 top-0 w-[1440px]" />
        <div className="relative z-10 mx-auto content-stretch flex flex-col gap-[28px] items-center px-4 pt-[136px] pb-[96px] xl:p-0 xl:absolute xl:left-1/2 xl:top-[calc(50%-30px)] xl:-translate-x-1/2 xl:-translate-y-1/2">
          <div className="neon-badge bg-[#1d7461] border border-[rgba(146,227,169,0.35)] border-solid content-stretch flex gap-[12px] items-center px-[16px] py-[8px] relative rounded-[100px] shrink-0">
            <div className="relative shrink-0 size-[16px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
            </div>
            <p className="[word-break:break-word] font-['Inter:Medium'] font-medium leading-[24px] not-italic relative shrink-0 text-[14px] text-center text-white tracking-[1px] uppercase whitespace-nowrap">
              AI-Powered Learning Platform
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[40px] items-center relative shrink-0">
            <div className="[word-break:break-word] content-stretch flex flex-col gap-[16px] items-center relative shrink-0 text-center">
              <p className="bg-clip-text font-['Instrument_Sans:Bold'] font-bold leading-[normal] relative shrink-0 text-[40px] sm:text-[56px] xl:text-[72px] text-[transparent] tracking-[-0.8px] xl:tracking-[-1.44px] w-full max-w-[1024px]" style={{ fontVariationSettings: '"wdth" 100', backgroundImage: "linear-gradient(88.27507450437835deg, rgba(255, 255, 255, 0.4) 1.564%, rgb(255, 255, 255) 37.495%, rgb(255, 255, 255) 73.375%, rgba(255, 255, 255, 0.4) 97.715%)" }}>
                Connect, Learn, and
                <br aria-hidden />
                Grow Together
              </p>
              <p className="font-['Instrument_Sans:Regular'] font-normal leading-[28px] md:leading-[32px] relative shrink-0 text-[#e2e8f0] text-[18px] md:text-[24px] w-full max-w-[768px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                Discover expert-led courses, join live sessions, and learn from instructors around the world.
              </p>
            </div>
            <div className="content-stretch flex flex-col sm:flex-row gap-[16px] items-stretch sm:items-start relative shrink-0 w-full sm:w-auto">
              <button className="neon-btn bg-[#ffb20d] content-stretch flex gap-[10px] h-[48px] items-center justify-center overflow-clip px-[20px] relative rounded-[8px] shrink-0 transition-colors hover:bg-[#faa104] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white w-full sm:w-[220px]" type="button" onClick={() => setOverlay({ type: "catalog" })}>
                <span className="relative shrink-0 size-[20px]" aria-hidden="true">
                  <img alt="" className="absolute block inset-0 size-full" src={imgGraduationCap} />
                </span>
                <span className="font-['Inter:Semi_Bold'] font-semibold leading-[24px] text-[#1e293b] text-[16px] tracking-[-0.01px] whitespace-nowrap">
                  Start Learning
                </span>
              </button>
              <button className="bg-[rgba(255,255,255,0.3)] content-stretch flex gap-[12px] h-[48px] items-center justify-center overflow-clip px-[20px] relative rounded-[8px] shrink-0 transition-colors hover:bg-[rgba(255,255,255,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white w-full sm:w-[230px]" type="button" onClick={() => setOverlay({ type: "instructor" })}>
                <span className="font-['Inter:Semi_Bold'] font-semibold leading-[24px] text-[16px] text-white tracking-[-0.01px] whitespace-nowrap">
                  Become an Instructor
                </span>
                <span className="relative shrink-0 size-[20px]" aria-hidden="true">
                  <img alt="" className="absolute block brightness-0 inset-0 invert size-full" src={imgHeroiconsSolidArrowUpRight} />
                </span>
              </button>
            </div>
          </div>
          <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full">
            <div className="content-stretch flex items-start relative shrink-0">
              <div className="content-stretch flex flex-col items-start relative shrink-0">
                <p className="[word-break:break-word] font-['Inter:Regular'] font-normal leading-[28px] not-italic relative shrink-0 text-[#cbd5e1] text-[16px] sm:text-[18px] text-center max-w-[calc(100vw-32px)] sm:max-w-none sm:whitespace-nowrap">
                  ⭐ Trusted by 1000+ learners and 50+ expert instructors
                </p>
              </div>
            </div>
          </div>
          <div className="absolute hidden xl:block left-[45px] size-[24px] top-[11px]">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame1000003850} />
          </div>
        </div>
        <div className="absolute left-[1517px] size-[24px] top-[383px]">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame1000003856} />
        </div>
      </div>
      <div className="bg-[#fafbfc] content-stretch flex flex-col items-center overflow-clip px-4 md:px-8 xl:px-[100px] py-[64px] xl:py-[96px] relative shrink-0 w-full">
        <div className="content-stretch flex flex-col gap-[40px] items-start relative shrink-0 w-full max-w-[1320px]">
          <div className="content-stretch flex items-center justify-center relative shrink-0 w-full">
            <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-center justify-center min-w-px relative text-center">
              <p className="font-['Instrument_Sans:Bold'] font-bold leading-[normal] relative shrink-0 text-[#0f172a] text-[32px] md:text-[40px] xl:text-[48px] tracking-[-0.96px] xl:whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>{`Trusted by Saudi Arabia's Leading Institutions`}</p>
              <div className="flex flex-col font-['Inter:Regular'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#1e293b] text-[16px] md:text-[18px] w-full max-w-[606px]">
                <p className="leading-[28px]">{`Thkee is proudly supported and validated by the Kingdom's top technology and education authorities`}</p>
              </div>
            </div>
          </div>
          <div className="gap-x-[20px] gap-y-[20px] grid grid-cols-2 lg:grid-cols-4 relative shrink-0 w-full">
            <div className="bg-white border border-[#e2e8f0] border-solid content-stretch flex flex-col items-center justify-center justify-self-stretch overflow-clip p-5 md:p-[32px] relative rounded-[16px] self-stretch shrink-0">
              <div className="aspect-[234.9985809326172/64.44535064697266] relative shrink-0 w-full">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup} />
              </div>
            </div>
            <div className="bg-white border border-[#e2e8f0] border-solid content-stretch flex flex-col items-center justify-center justify-self-stretch overflow-clip p-5 md:p-[32px] relative rounded-[16px] self-stretch shrink-0">
              <div className="grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0 w-full">
                <div className="col-1 grid-rows-[max-content] inline-grid ml-0 mt-0 place-items-start relative row-1 w-full">
                  <div className="col-1 h-[27.436px] ml-[93.46%] mt-[53.37px] relative row-1 w-[6.52%]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVector} />
                  </div>
                  <div className="col-1 h-[90.753px] ml-[90.65%] mt-[0.03px] relative row-1 w-[9.35%]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVector1} />
                  </div>
                  <div className="col-1 grid-rows-[max-content] inline-grid ml-[83.15%] mt-0 place-items-start relative row-1 w-[14.93%]">
                    <div className="col-1 h-[79.912px] ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup} />
                    </div>
                    <div className="col-1 h-[79.912px] ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup1} />
                    </div>
                    <div className="col-1 h-[79.912px] ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup2} />
                    </div>
                    <div className="col-1 h-[79.912px] ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup3} />
                    </div>
                  </div>
                  <div className="col-1 grid-rows-[max-content] inline-grid ml-[90.63%] mt-[24.42px] place-items-start relative row-1 w-[7.47%]">
                    <div className="col-1 h-[55.266px] ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup4} />
                    </div>
                    <div className="col-1 h-[55.266px] ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup5} />
                    </div>
                    <div className="col-1 h-[55.266px] ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup6} />
                    </div>
                    <div className="col-1 h-[55.266px] ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup7} />
                    </div>
                  </div>
                  <div className="col-1 h-[76.585px] ml-0 mt-[13.31px] relative row-1 w-[77.54%]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup1} />
                  </div>
                  <div className="col-1 grid-rows-[max-content] inline-grid ml-[83.15%] mt-0 place-items-start relative row-1 w-[14.93%]">
                    <div className="col-1 h-[24.431px] ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup8} />
                    </div>
                    <div className="col-1 h-[24.431px] ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup9} />
                    </div>
                    <div className="col-1 h-[24.431px] ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup10} />
                    </div>
                    <div className="col-1 h-[24.431px] ml-0 mt-0 relative row-1 w-full">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClipPathGroup11} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-[#e2e8f0] border-solid content-stretch flex flex-col items-center justify-center justify-self-stretch overflow-clip p-5 md:p-[32px] relative rounded-[16px] self-stretch shrink-0">
              <div className="h-[66.492px] relative shrink-0 w-[169px]">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame1} />
              </div>
            </div>
            <div className="bg-white border border-[#e2e8f0] border-solid content-stretch flex flex-col items-center justify-center justify-self-stretch overflow-clip p-5 md:p-[32px] relative rounded-[16px] self-stretch shrink-0">
              <div className="aspect-[110.97635650634766/37.70798110961914] relative shrink-0 w-full">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup1321314403} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[40px] items-center overflow-clip px-4 md:px-8 xl:px-[204px] py-[64px] xl:py-[96px] relative shrink-0 w-full">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute bg-[#0c211d] inset-0" />
          <div className="absolute inset-0 overflow-hidden">
            <img alt="" className="absolute h-full left-[-33.06%] max-w-none top-0 w-[166.11%]" src={imgFrame1618874388} />
          </div>
        </div>
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full max-w-[1320px]">
          <div className="content-stretch flex flex-col items-center px-[20px] relative shrink-0 w-full">
            <div className="[word-break:break-word] content-stretch flex flex-col gap-[16px] items-center md:px-[20px] relative shrink-0 text-center w-full max-w-[916px]">
              <p className="font-['Instrument_Sans:Bold'] font-bold leading-[normal] relative shrink-0 text-[32px] md:text-[40px] xl:text-[48px] text-white tracking-[-0.96px] xl:whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
                Find out Powerful Features Now
              </p>
              <div className="flex flex-col font-['Inter:Regular'] font-normal justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#f1f5f9] text-[18px] w-[min-content]">
                <p className="leading-[28px]">{`Our platform is an advanced combination of AI technology with a user-friendly design for a fun learning experience that separates us. `}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex gap-[24px] items-stretch xl:items-start relative shrink-0 w-full max-w-[1320px]">
          <div className="glass-card backdrop-blur-[8.75px] border border-[rgba(234,251,246,0.06)] border-solid content-stretch flex flex-[1_0_0] flex-col gap-[60px] items-start justify-between min-w-px overflow-clip p-[32px] relative rounded-[16px] self-stretch" style={{ backgroundImage: "linear-gradient(139.8683304199743deg, rgba(8, 32, 25, 0.05) 8.5799%, rgba(12, 252, 185, 0.05) 101.25%)" }}>
            <div className="bg-white overflow-clip relative rounded-[12px] shadow-[0px_0px_50.4px_0px_rgba(255,255,255,0.25),0px_0px_0px_4px_rgba(255,255,255,0.25)] shrink-0 size-[56px]">
              <div className="absolute left-[12px] size-[32px] top-[12px]">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLiveStreaming03} />
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-col gap-[16px] items-start leading-[0] relative shrink-0 w-full">
              <div className="flex flex-col font-['Instrument_Sans:Bold'] font-bold justify-center relative shrink-0 text-[24px] text-white w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-[32px]">Live Discussions</p>
              </div>
              <div className="flex flex-col font-['Inter:Regular'] font-normal justify-center not-italic relative shrink-0 text-[#f1f5f9] text-[16px] tracking-[-0.01px] w-full">
                <p className="leading-[28px] mb-0">{`Participate in live Q&A sessions with your instructors and fellow students to deepen your understanding.`}</p>
                <p className="leading-[28px]">​</p>
              </div>
            </div>
          </div>
          <div className="glass-card backdrop-blur-[8.75px] border border-[rgba(234,251,246,0.06)] border-solid content-stretch flex flex-[1_0_0] flex-col gap-[60px] items-start min-w-px overflow-clip p-[32px] relative rounded-[16px] self-stretch" style={{ backgroundImage: "linear-gradient(139.8683304199743deg, rgba(8, 32, 25, 0.05) 8.5799%, rgba(12, 252, 185, 0.05) 101.25%)" }}>
            <div className="bg-white overflow-clip relative rounded-[12px] shadow-[0px_0px_0px_4px_rgba(255,255,255,0.25)] shrink-0 size-[56px]">
              <div className="absolute left-[12px] size-[32px] top-[12px]">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgNavigator01} />
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-col gap-[16px] items-start leading-[0] relative shrink-0 w-full">
              <div className="flex flex-col font-['Instrument_Sans:Bold'] font-bold justify-center relative shrink-0 text-[24px] text-white w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-[32px]">Customized Learning Paths</p>
              </div>
              <div className="flex flex-col font-['Inter:Regular'] font-normal justify-center not-italic relative shrink-0 text-[#f1f5f9] text-[16px] tracking-[-0.01px] w-full">
                <p className="leading-[28px]">Let our AI guide you to the best course to suit your goals and the progress you have made.</p>
              </div>
            </div>
          </div>
          <div className="glass-card backdrop-blur-[8.75px] border border-[rgba(234,251,246,0.06)] border-solid content-stretch flex flex-[1_0_0] flex-col gap-[60px] items-start min-w-px overflow-clip p-[32px] relative rounded-[16px] self-stretch" style={{ backgroundImage: "linear-gradient(139.8683304199743deg, rgba(8, 32, 25, 0.05) 8.5799%, rgba(12, 252, 185, 0.05) 101.25%)" }}>
            <div className="bg-white overflow-clip relative rounded-[12px] shadow-[0px_0px_0px_4px_rgba(255,255,255,0.25)] shrink-0 size-[56px]">
              <div className="absolute left-[12px] size-[32px] top-[12px]">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgMessage02} />
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-col gap-[16px] items-start leading-[0] relative shrink-0 w-full">
              <div className="flex flex-col font-['Instrument_Sans:Bold'] font-bold justify-center relative shrink-0 text-[24px] text-white w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-[32px]">Community Learning</p>
              </div>
              <div className="flex flex-col font-['Inter:Regular'] font-normal justify-center not-italic relative shrink-0 text-[#f1f5f9] text-[16px] tracking-[-0.01px] w-full">
                <p className="leading-[28px]">Join discussions or matching group forums to share ideas and develop.</p>
              </div>
            </div>
          </div>
          <div className="glass-card backdrop-blur-[8.75px] border border-[rgba(234,251,246,0.06)] border-solid content-stretch flex flex-[1_0_0] flex-col gap-[60px] items-start min-w-px overflow-clip p-[32px] relative rounded-[16px] self-stretch" style={{ backgroundImage: "linear-gradient(139.8683304199743deg, rgba(8, 32, 25, 0.05) 8.5799%, rgba(12, 252, 185, 0.05) 101.25%)" }}>
            <div className="bg-white overflow-clip relative rounded-[12px] shadow-[0px_0px_0px_4px_rgba(255,255,255,0.25)] shrink-0 size-[56px]">
              <div className="absolute left-[12px] size-[32px] top-[12px]">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPuzzle} />
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-col gap-[16px] items-start leading-[0] relative shrink-0 w-full">
              <div className="flex flex-col font-['Instrument_Sans:Bold'] font-bold justify-center relative shrink-0 text-[24px] text-white w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-[32px]">Interactive Learning Tools</p>
              </div>
              <div className="flex flex-col font-['Inter:Regular'] font-normal justify-center not-italic relative shrink-0 text-[#f1f5f9] text-[16px] tracking-[-0.01px] w-full">
                <p className="leading-[28px]">Take part in interactive tests, simulations, and other tools to allow you to stick with your learning.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[40px] items-center justify-center py-[96px] relative shrink-0 w-full">
        <ScrollHighlight />
        <div className="content-stretch flex flex-col gap-[90px] items-center overflow-clip pb-12 md:pb-[64px] pt-10 md:pt-[56px] px-6 md:px-[56px] relative rounded-[16px] shrink-0 w-[calc(100%-32px)] md:w-[calc(100%-64px)] max-w-[1320px]" style={{ backgroundImage: "linear-gradient(76.37165893145583deg, rgb(0, 35, 71) 2.0811%, rgb(23, 0, 92) 93.886%)" }}>
          <div className="absolute hidden xl:block h-[411.094px] left-[1076px] top-[356.51px] w-[290.726px]">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVector2} />
          </div>
          <div className="absolute inset-0">
            <div aria-hidden className="absolute bg-size-[157.99999237060547px_157.99999237060547px] bg-top-left inset-0 opacity-60 pointer-events-none" style={{ backgroundImage: `url("${imgPaper}")` }} />
          </div>
          <div className="content-stretch flex flex-col gap-[40px] items-start relative shrink-0 w-full">
            <div className="content-stretch flex items-center relative shrink-0 w-full">
              <p className="[word-break:break-word] flex-[1_0_0] font-['Instrument_Sans:Bold'] font-bold leading-[normal] min-w-px relative text-[32px] md:text-[40px] xl:text-[48px] text-white tracking-[-0.96px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                Why You Should Choose Thkee
              </p>
            </div>
            <div className="content-stretch flex flex-col gap-[40px] items-start pt-[20px] relative shrink-0 w-full">
              <div className="content-stretch flex flex-col lg:flex-row gap-[40px] items-start justify-center relative shrink-0 w-full">
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[20px] items-start min-w-px relative">
                  <div className="relative shrink-0 size-[40px]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLibrary} />
                  </div>
                  <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full">
                      <div className="[word-break:break-word] flex flex-[1_0_0] flex-col font-['Instrument_Sans:Bold'] font-bold lg:h-[32px] justify-center leading-[0] min-w-px relative text-[20px] text-white tracking-[0.15px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                        <p className="leading-[32px]">Quality Learning Resources</p>
                      </div>
                    </div>
                    <div className="[word-break:break-word] flex flex-col font-['Inter:Regular'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#cbd5e1] text-[16px] tracking-[-0.01px] w-full">
                      <p className="leading-[28px]">Get high-quality bilingual (Arabic-English) courses designed by top trainers all over the globe.</p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[20px] items-start min-w-px relative">
                  <div className="relative shrink-0 size-[40px]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgOnlineLearning01} />
                  </div>
                  <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full">
                      <div className="[word-break:break-word] flex flex-[1_0_0] flex-col font-['Instrument_Sans:Bold'] font-bold lg:h-[32px] justify-center leading-[0] min-w-px relative text-[20px] text-white tracking-[0.15px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                        <p className="leading-[32px]">Boundless Learning Management</p>
                      </div>
                    </div>
                    <div className="[word-break:break-word] flex flex-col font-['Inter:Regular'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#cbd5e1] text-[16px] tracking-[-0.01px] w-full">
                      <p className="leading-[28px]">Learn anywhere, anytime, using your smartphone, tablet, desktop, or phone.</p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[20px] items-start min-w-px relative">
                  <div className="relative shrink-0 size-[40px]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTime02} />
                  </div>
                  <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full">
                      <div className="[word-break:break-word] flex flex-[1_0_0] flex-col font-['Instrument_Sans:Bold'] font-bold justify-center leading-[0] min-w-px relative text-[20px] text-white tracking-[0.15px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                        <p className="leading-[32px]">Scalable Learning Integration</p>
                      </div>
                    </div>
                    <div className="[word-break:break-word] flex flex-col font-['Inter:Regular'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#cbd5e1] text-[16px] tracking-[-0.01px] w-full">
                      <p className="leading-[28px]">Institutions incorporate our B2B-based training solutions in their existing systems to facilitate the proper development of their students or employees.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col lg:flex-row gap-[40px] items-start justify-center relative shrink-0 w-full">
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[20px] items-start min-w-px relative">
                  <div className="relative shrink-0 size-[40px]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgComputerVideoCall} />
                  </div>
                  <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full">
                      <div className="[word-break:break-word] flex flex-[1_0_0] flex-col font-['Instrument_Sans:Bold'] font-bold lg:h-[32px] justify-center leading-[0] min-w-px relative text-[20px] text-white tracking-[0.15px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                        <p className="leading-[32px]">Smooth Course Management</p>
                      </div>
                    </div>
                    <div className="[word-break:break-word] flex flex-col font-['Inter:Regular'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#cbd5e1] text-[16px] tracking-[-0.01px] w-full">
                      <p className="leading-[28px]">Design and run your course quickly by using AI tools that help you save time and increase productivity.</p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[20px] items-start min-w-px relative">
                  <div className="relative shrink-0 size-[40px]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgArtificialIntelligence04} />
                  </div>
                  <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full">
                      <div className="[word-break:break-word] flex flex-[1_0_0] flex-col font-['Instrument_Sans:Bold'] font-bold lg:h-[32px] justify-center leading-[0] min-w-px relative text-[20px] text-white tracking-[0.15px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                        <p className="leading-[32px]">Smart Personal Learning Journeys</p>
                      </div>
                    </div>
                    <div className="[word-break:break-word] flex flex-col font-['Inter:Regular'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#cbd5e1] text-[16px] tracking-[-0.01px] w-full">
                      <p className="leading-[28px]">At Thkee, no two students receive the same treatment, our innovative system adjusts to your objectives and goals while confidently guiding you step-by-step toward actual results.</p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[20px] items-start min-w-px relative">
                  <div className="relative shrink-0 size-[40px]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTimeManagement} />
                  </div>
                  <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full">
                      <div className="[word-break:break-word] flex flex-[1_0_0] flex-col font-['Instrument_Sans:Bold'] font-bold lg:h-[32px] justify-center leading-[0] min-w-px relative text-[20px] text-white tracking-[0.15px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                        <p className="leading-[32px]">Supportive Learning Community</p>
                      </div>
                    </div>
                    <div className="[word-break:break-word] flex flex-col font-['Inter:Regular'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#cbd5e1] text-[16px] tracking-[-0.01px] w-full">
                      <p className="leading-[28px]">{`You're never on your own at Thkee, join a vibrant community of mentors and peers who encourage, challenge, and encourage you to keep going ahead.`}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PersonalizedLearning />
      <div className="bg-[#f8fafc] content-stretch flex flex-col gap-[60px] items-center justify-center px-4 md:px-8 py-[64px] xl:py-[96px] relative shrink-0 w-full">
        <div className="absolute bg-[#3a5c55] blur-[79.05px] h-[416px] left-1/2 -translate-x-1/2 opacity-4 top-[124.21px] w-full max-w-[1385px]" />
        <div className="content-stretch flex flex-col xl:flex-row gap-10 xl:gap-[60px] items-center relative shrink-0 w-full max-w-[1320px]">
          <div className="bg-white content-stretch flex flex-col items-start overflow-clip relative rounded-[20px] md:rounded-[32px] shrink-0 w-full max-w-[673px]">
            <div className="bg-[#0e172a] border border-[rgba(255,255,255,0.13)] border-solid content-stretch flex gap-4 justify-between items-center px-4 sm:px-[25px] py-[17px] relative shrink-0 w-full">
              <div className="content-stretch flex flex-[1_0_0] gap-[11px] items-center min-w-px relative">
                <div className="content-stretch flex gap-[10px] sm:gap-[17px] items-center relative min-w-0 sm:shrink-0">
                  <div className="relative shrink-0 size-[12px]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse21583} />
                  </div>
                  <p className="font-['Inter:Semi_Bold'] font-semibold leading-[24px] not-italic relative min-w-0 truncate sm:shrink-0 text-[14px] sm:text-[16px] text-white tracking-[-0.01px] whitespace-nowrap">
                    Color Theory 101 - Live
                  </p>
                </div>
                <div className="content-stretch hidden sm:flex gap-[11px] items-center relative shrink-0">
                  <div className="relative shrink-0 size-[4px]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse21584} />
                  </div>
                  <p className="[word-break:break-word] font-['Inter:Medium'] font-medium leading-[24px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.56)] text-center tracking-[-0.01px] whitespace-nowrap">
                    42 Learners
                  </p>
                </div>
              </div>
              <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                <div className="bg-[#1c2537] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[7px] shrink-0">
                  <div className="relative shrink-0 size-[16px]">
                    <div className="absolute inset-[8.33%_16.67%]">
                      <div className="absolute inset-[-3.75%_-4.69%]">
                        <img alt="" className="block max-w-none size-full" src={imgElements1} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#1c2537] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[7px] shrink-0">
                  <div className="relative shrink-0 size-[16px]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgHeroiconsOutlineVideoCamera} />
                  </div>
                </div>
                <div className="bg-[#1c2537] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[7px] shrink-0">
                  <div className="relative shrink-0 size-[16px]">
                    <div className="absolute inset-[8.33%_12.5%]">
                      <div className="absolute inset-[-3.75%_-4.17%]">
                        <img alt="" className="block max-w-none size-full" src={imgElements2} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-full">
              <div className="bg-gradient-to-b content-stretch flex flex-[1_0_0] flex-col from-[#073329] from-[55.86%] gap-[11px] h-[320px] sm:h-[407px] items-center justify-center min-w-px p-[16px] relative to-[#0e1729]">
                <div className="absolute bottom-[24px] content-stretch flex gap-[8px] items-center left-[16px] sm:left-[32px]">
                  <div className="bg-[#0c5c4b] border border-[rgba(255,255,255,0.5)] border-solid content-stretch flex items-center justify-center p-[10px] relative rounded-[10px] shrink-0 size-[40px]">
                    <p className="[word-break:break-word] font-['Inter:Bold'] font-bold leading-[20px] not-italic relative shrink-0 text-[#eff4f2] text-[14px] tracking-[-0.01px] whitespace-nowrap">
                      MK
                    </p>
                  </div>
                  <div className="bg-[#39aeeb] border border-[rgba(255,255,255,0.5)] border-solid content-stretch flex items-center justify-center p-[10px] relative rounded-[10px] shrink-0 size-[40px]">
                    <p className="[word-break:break-word] font-['Inter:Bold'] font-bold leading-[20px] not-italic relative shrink-0 text-[#eff4f2] text-[14px] tracking-[-0.01px] whitespace-nowrap">
                      MK
                    </p>
                  </div>
                  <div className="bg-[#12b981] border border-[rgba(255,255,255,0.5)] border-solid content-stretch flex items-center justify-center p-[10px] relative rounded-[10px] shrink-0 size-[40px]">
                    <p className="[word-break:break-word] font-['Inter:Bold'] font-bold leading-[20px] not-italic relative shrink-0 text-[#eff4f2] text-[14px] tracking-[-0.01px] whitespace-nowrap">
                      MK
                    </p>
                  </div>
                  <div className="bg-[#ef4444] border border-[rgba(255,255,255,0.5)] border-solid content-stretch flex items-center justify-center p-[10px] relative rounded-[10px] shrink-0 size-[40px]">
                    <p className="[word-break:break-word] font-['Inter:Bold'] font-bold leading-[20px] not-italic relative shrink-0 text-[#eff4f2] text-[14px] tracking-[-0.01px] whitespace-nowrap">
                      MK
                    </p>
                  </div>
                  <div className="bg-[#f59e0c] border border-[rgba(255,255,255,0.5)] border-solid content-stretch flex items-center justify-center p-[10px] relative rounded-[10px] shrink-0 size-[40px]">
                    <p className="[word-break:break-word] font-['Inter:Bold'] font-bold leading-[20px] not-italic relative shrink-0 text-[#eff4f2] text-[14px] tracking-[-0.01px] whitespace-nowrap">
                      MK
                    </p>
                  </div>
                  <div className="bg-[#273040] border border-[rgba(255,255,255,0.13)] border-solid content-stretch flex items-center justify-center px-[6px] py-[10px] relative rounded-[10px] shrink-0 size-[40px]">
                    <p className="[word-break:break-word] font-['Inter:Bold'] font-bold leading-[20px] not-italic relative shrink-0 text-[#eff4f2] text-[14px] tracking-[-0.01px] whitespace-nowrap">
                      38+
                    </p>
                  </div>
                </div>
                <div className="absolute h-[99.267px] left-1/2 -translate-x-1/2 top-[25.7%] w-[217.997px]">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame1618874422} />
                </div>
              </div>
              <div className="bg-[#0a1325] content-stretch hidden md:flex flex-col gap-[11px] h-[407px] items-start p-[16px] relative shrink-0 w-[279px]">
                <p className="[word-break:break-word] font-['Inter:Semi_Bold'] font-semibold leading-[20px] min-w-full not-italic relative shrink-0 text-[16px] text-white tracking-[-0.01px] w-[min-content]">
                  Chat
                </p>
                <div className="[word-break:break-word] bg-[#182132] content-stretch flex flex-col items-start not-italic px-[16px] py-[8px] relative rounded-[11px] shrink-0 w-[205px]">
                  <p className="font-['Inter:Semi_Bold'] font-semibold leading-[17.572px] relative shrink-0 text-[#64748b] text-[12.301px] tracking-[-0.0088px] w-[152px]">
                    Aman
                  </p>
                  <p className="font-['Inter:Regular'] font-normal leading-[20px] min-w-full relative shrink-0 text-[#f1f5f9] text-[14px] tracking-[-0.01px] w-[min-content]">{`Can you please repeat the topic again ? `}</p>
                </div>
                <div className="[word-break:break-word] bg-[#182132] content-stretch flex flex-col items-start not-italic px-[16px] py-[8px] relative rounded-[11px] shrink-0 w-[205px]">
                  <p className="font-['Inter:Semi_Bold'] font-semibold leading-[17.572px] relative shrink-0 text-[#64748b] text-[12.301px] tracking-[-0.0088px] w-[152px]">
                    Junko
                  </p>
                  <p className="font-['Inter:Regular'] font-normal leading-[20px] min-w-full relative shrink-0 text-[#f1f5f9] text-[14px] tracking-[-0.01px] w-[min-content]">
                    Yes, it will be better
                  </p>
                </div>
                <div className="[word-break:break-word] bg-[#182132] content-stretch flex flex-col items-start not-italic px-[16px] py-[8px] relative rounded-[11px] shrink-0 w-[205px]">
                  <p className="font-['Inter:Semi_Bold'] font-semibold leading-[17.572px] relative shrink-0 text-[#64748b] text-[12.301px] tracking-[-0.0088px] w-[152px]">
                    Sofia
                  </p>
                  <p className="font-['Inter:Regular'] font-normal leading-[20px] min-w-full relative shrink-0 text-[#f1f5f9] text-[14px] tracking-[-0.01px] w-[min-content]">
                    Can we get the recording after the class?
                  </p>
                </div>
                <div className="content-stretch flex flex-col items-end justify-center relative shrink-0 w-full">
                  <div className="bg-gradient-to-r content-stretch flex flex-col from-[#0d5c4b] items-start px-[16px] py-[8px] relative rounded-[11px] shrink-0 to-[#0f7a65] w-[205px]">
                    <p className="[word-break:break-word] font-['Inter:Regular'] font-normal leading-[20px] not-italic relative shrink-0 text-[#f1f5f9] text-[14px] tracking-[-0.01px] w-full">
                      Recording goes out tonight :)
                    </p>
                  </div>
                </div>
                <div className="bg-[#182132] content-stretch flex flex-col items-start px-[16px] py-[8px] relative rounded-[11px] shrink-0 w-full">
                  <p className="[word-break:break-word] font-['Inter:Regular'] font-normal leading-[20px] not-italic relative shrink-0 text-[#64748b] text-[14px] tracking-[-0.01px] whitespace-nowrap">
                    Send a message....
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[32px] items-start min-w-px relative">
            <div className="[word-break:break-word] content-stretch flex flex-col gap-[16px] items-start leading-[0] relative shrink-0 w-full">
              <div className="font-['Instrument_Sans:Bold'] font-bold relative shrink-0 text-[#0f172a] text-[32px] md:text-[40px] xl:text-[48px] xl:text-center tracking-[-0.96px] xl:whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-[normal] mb-0">Feels like the room.</p>
                <p className="leading-[normal]">Works like the web.</p>
              </div>
              <div className="flex flex-col font-['Inter:Regular'] font-normal justify-center min-w-full not-italic relative shrink-0 text-[#1e293b] text-[18px] w-[min-content]">
                <p className="leading-[28px]">{`A purpose-built live studio for teachers — not a generic meeting tool. Everything you need to run an engaging class, nothing you don't.`}</p>
              </div>
            </div>
            <div className="[word-break:break-word] gap-x-[16px] gap-y-[16px] grid grid-cols-1 sm:grid-cols-2 not-italic relative shrink-0 tracking-[-0.01px] w-full">
              <div className="bg-white border border-[#e2e8f0] border-solid content-stretch flex flex-col gap-[8px] items-start justify-self-stretch p-[16px] relative rounded-[16px] self-stretch shrink-0">
                <p className="font-['Inter:Semi_Bold'] font-semibold leading-[20px] relative shrink-0 text-[#1e293b] text-[16px] whitespace-nowrap">
                  HD video + low-latency chat
                </p>
                <p className="font-['Inter:Regular'] font-normal leading-[24px] min-w-full relative shrink-0 text-[#64748b] text-[14px] w-[min-content]">
                  Sub-200ms across 6 continents.
                </p>
              </div>
              <div className="bg-white border border-[#e2e8f0] border-solid content-stretch flex flex-col gap-[8px] items-start justify-self-stretch p-[16px] relative rounded-[16px] self-stretch shrink-0">
                <p className="font-['Inter:Semi_Bold'] font-semibold leading-[20px] relative shrink-0 text-[#1e293b] text-[16px] whitespace-nowrap">{`Whiteboard & screen share`}</p>
                <p className="font-['Inter:Regular'] font-normal leading-[24px] min-w-full relative shrink-0 text-[#64748b] text-[14px] w-[min-content]">
                  Sketch ideas live, no Zoom required.
                </p>
              </div>
              <div className="bg-white border border-[#e2e8f0] border-solid content-stretch flex flex-col gap-[8px] items-start justify-self-stretch p-[16px] relative rounded-[16px] self-stretch shrink-0">
                <p className="font-['Inter:Semi_Bold'] font-semibold leading-[20px] relative shrink-0 text-[#1e293b] text-[16px] whitespace-nowrap">
                  Polls, quizzes, hand-raise
                </p>
                <p className="font-['Inter:Regular'] font-normal leading-[24px] min-w-full relative shrink-0 text-[#64748b] text-[14px] w-[min-content]">
                  Keep learners active, not lurking.
                </p>
              </div>
              <div className="bg-white border border-[#e2e8f0] border-solid content-stretch flex flex-col gap-[8px] items-start justify-self-stretch p-[16px] relative rounded-[16px] self-stretch shrink-0">
                <p className="font-['Inter:Semi_Bold'] font-semibold leading-[20px] relative shrink-0 text-[#1e293b] text-[16px] whitespace-nowrap">{`Auto attendance & recording`}</p>
                <p className="font-['Inter:Regular'] font-normal leading-[24px] min-w-full relative shrink-0 text-[#64748b] text-[14px] w-[min-content]">
                  Saved straight to the course timeline.
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setOverlay({ type: "catalog", liveOnly: true })} className="bg-[#ffb20d] content-stretch flex gap-[8px] h-[56px] items-center justify-center overflow-clip px-[32px] py-[16px] relative rounded-[8px] shrink-0 transition-colors hover:bg-[#faa104]">
              <p className="[word-break:break-word] font-['Inter:Semi_Bold'] font-semibold leading-[20px] not-italic relative shrink-0 text-[#1e293b] text-[16px] tracking-[-0.01px] whitespace-nowrap">
                Explore Live Studio
              </p>
              <div className="relative shrink-0 size-[20px]">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgHeroiconsMiniArrowRight1} />
              </div>
            </button>
          </div>
        </div>
      </div>
      <div className="xl:h-[406px] overflow-clip relative shrink-0 w-full px-4 md:px-8 py-16 xl:p-0" style={{ backgroundImage: "linear-gradient(145.1440091350974deg, rgb(0, 142, 111) 24.443%, rgb(0, 81, 63) 4.7981%, rgb(0, 40, 31) 55.653%)" }}>
        <div className="relative z-10 mx-auto content-stretch flex flex-col xl:flex-row gap-8 items-start xl:items-center justify-between w-full max-w-[1216px] xl:absolute xl:left-1/2 xl:top-[calc(50%-0.16px)] xl:-translate-x-1/2 xl:-translate-y-1/2">
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full xl:w-[643px]">
            <p className="font-['Instrument_Sans:Bold'] font-bold leading-[normal] relative shrink-0 text-[32px] md:text-[40px] xl:text-[48px] text-white tracking-[-0.96px] w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
              🚀 Start Learning on Your Terms
            </p>
            <div className="flex flex-col font-['Inter:Regular'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#cbd5e1] text-[18px] w-full">
              <p className="leading-[28px]">{`If you're looking to switch your career, get a certification, or explore something new, THKEE allows you the flexibility to learn whenever and how you'd like to.`}</p>
            </div>
          </div>
          <div className="content-stretch flex flex-col sm:flex-row gap-[16px] items-stretch sm:items-start relative shrink-0 w-full sm:w-auto">
            <button type="button" onClick={() => setOverlay(user ? { type: "catalog" } : { type: "auth", mode: "signup" })} className="bg-[#ffb20d] content-stretch flex gap-[8px] h-[56px] items-center justify-center overflow-clip px-[32px] py-[16px] relative rounded-[8px] shrink-0 transition-colors hover:bg-[#faa104]">
              <p className="[word-break:break-word] font-['Inter:Medium'] font-medium leading-[20px] not-italic relative shrink-0 text-[#1e293b] text-[16px] text-center tracking-[-0.01px] whitespace-nowrap">
                Get Started
              </p>
              <div className="relative shrink-0 size-[20px]">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgHeroiconsSolidArrowUpRight} />
              </div>
            </button>
            <button type="button" onClick={() => setOverlay({ type: "catalog" })} className="bg-[#f1f5f9] content-stretch flex gap-[8px] h-[56px] items-center justify-center overflow-clip px-[20px] py-[10px] relative rounded-[8px] shrink-0 transition-colors hover:bg-white">
              <p className="[word-break:break-word] font-['Inter:Medium'] font-medium leading-[20px] not-italic relative shrink-0 text-[#1e293b] text-[16px] tracking-[-0.01px] whitespace-nowrap">
                Browse Courses
              </p>
              <div className="relative shrink-0 size-[20px]">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgHeroiconsSolidArrowUpRight} />
              </div>
            </button>
          </div>
        </div>
        <div className="absolute flex items-center justify-center left-[-171px] size-[496px] top-[-304.91px]">
          <div className="flex-none rotate-90">
            <div className="relative size-[496px]">
              <div className="absolute bottom-0 left-1/2 right-0 top-0">
                <img alt="" className="block max-w-none size-full" src={imgEllipse12} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex items-center justify-center left-[236px] size-[276px] top-[389px]">
          <div className="-rotate-90 flex-none">
            <div className="relative size-[276px]">
              <div className="absolute bottom-0 left-1/2 right-0 top-0">
                <img alt="" className="block max-w-none size-full" src={imgEllipse14} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex items-center justify-center left-[944px] size-[262px] top-[-192.24px]">
          <div className="flex-none rotate-90">
            <div className="relative size-[262px]">
              <div className="absolute bottom-0 left-1/2 right-0 top-0">
                <img alt="" className="block max-w-none size-full" src={imgEllipse15} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex items-center justify-center left-[1424px] size-[496px] top-[279px]">
          <div className="-rotate-90 -scale-y-100 flex-none">
            <div className="relative size-[496px]">
              <div className="absolute bottom-0 left-1/2 right-0 top-0">
                <img alt="" className="block max-w-none size-full" src={imgEllipse13} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[rgba(244,156,0,0.04)] content-stretch flex flex-col items-center overflow-clip relative shrink-0 w-full">
        <div className="bg-gradient-to-b content-stretch flex flex-col from-[#f7f4ec] gap-[60px] items-center justify-center py-[96px] relative shrink-0 to-white w-full">
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            <div className="content-stretch flex flex-col items-center px-[20px] relative shrink-0 w-full">
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[16px] items-center sm:px-[20px] relative shrink-0 text-center w-full max-w-[540px]">
                <p className="font-['Instrument_Sans:Bold'] font-bold leading-[normal] relative shrink-0 text-[#0f172a] text-[32px] md:text-[40px] xl:text-[48px] tracking-[-0.96px] xl:whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
                  Our well-wishers thought
                </p>
                <div className="flex flex-col font-['Inter:Regular'] font-normal justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#1e293b] text-[18px] w-[min-content]">
                  <p className="leading-[28px]">{`At Thkee, we're proud of the successes of our students & instructors. Here's what some of them have to say`}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[40px] items-center relative shrink-0 w-full">
            <div ref={sliderRef} className="h-[320px] sm:h-[288px] w-[calc(100%-32px)] max-w-[1341px] overflow-hidden">
              <div className="flex h-full gap-[24px] transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentSlide * slider.step}px)` }}>
                {testimonials.map((t) => (
                  <div key={t.name} className="bg-white border border-[#e2e8f0] border-solid content-stretch flex flex-col gap-[16px] h-full items-start px-5 md:px-[32px] py-5 md:py-[24px] relative rounded-[16px] shrink-0 w-full sm:w-[431px]">
                    <Star className="content-stretch flex flex-col items-start relative shrink-0" />
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Inter:Regular'] font-normal leading-[24px] min-h-px min-w-full not-italic overflow-hidden relative text-[#1e293b] text-[14px] tracking-[-0.01px] w-[min-content]">{`“${t.quote}”`}</p>
                    <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
                      <div className="content-stretch flex items-center justify-center p-[10px] relative rounded-[64px] shrink-0 size-[40px]" style={{ backgroundColor: t.color }}>
                        <p className="font-['Inter:Bold'] font-bold leading-[20px] not-italic relative shrink-0 text-[#eff4f2] text-[14px] tracking-[-0.01px] whitespace-nowrap">{t.initials}</p>
                      </div>
                      <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col items-start justify-center min-w-px not-italic relative tracking-[-0.01px]">
                        <p className="font-['Inter:Semi_Bold'] font-semibold leading-[24px] mb-[-2px] relative shrink-0 text-[#1e293b] text-[14px] w-full">{t.name}</p>
                        <p className="font-['Inter:Regular'] font-normal leading-[18px] relative shrink-0 text-[#94a3b8] text-[12px] w-full">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
              <div className="bg-[#f1f5f9] content-stretch flex flex-col items-start p-[7.846px] relative rounded-[167.385px] shrink-0">
                <div className="content-stretch flex gap-[15.692px] items-center relative shrink-0">
                  <button type="button" aria-label="Previous testimonials" onClick={() => setSlide((currentSlide - 1 + testimonialStops) % testimonialStops)} className="flex size-[52.308px] shrink-0 items-center justify-center rounded-full bg-white text-[#1e293b] transition-colors hover:bg-[#0d5c4b] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d5c4b]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                  <button type="button" aria-label="Next testimonials" onClick={() => setSlide((currentSlide + 1) % testimonialStops)} className="flex size-[52.308px] shrink-0 items-center justify-center rounded-full bg-white text-[#1e293b] transition-colors hover:bg-[#0d5c4b] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d5c4b]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white content-stretch flex flex-col gap-[60px] items-center justify-center py-[72px] relative shrink-0 w-full">
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
          <div className="content-stretch flex flex-col items-center px-[20px] relative shrink-0 w-full">
            <div className="[word-break:break-word] content-stretch flex flex-col gap-[16px] items-center sm:px-[20px] relative shrink-0 text-center w-full max-w-[540px]">
              <p className="font-['Instrument_Sans:Bold'] font-bold leading-[normal] relative shrink-0 text-[#0f172a] text-[32px] md:text-[40px] xl:text-[48px] tracking-[-0.96px] xl:whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
                Start Your AI Learning Journey
              </p>
              <div className="flex flex-col font-['Inter:Regular'] font-normal justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#1e293b] text-[18px] w-[min-content]">
                <p className="leading-[28px]">Learn from experts, follow guided paths, and gain real-world AI skills faster.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-[1200px] px-4 md:px-8 xl:px-0 xl:block xl:h-[500px] overflow-clip shrink-0">
          <div className="relative h-[195.2px] xl:absolute xl:left-0 xl:right-[860px] xl:top-[14.3px]">
            <div className="absolute left-0 top-0 size-[60px] overflow-clip">
              <div className="absolute left-0 overflow-clip size-[60px] top-0">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 overflow-clip size-[60px] top-1/2">
                  <div className="absolute contents inset-0">
                    <div className="absolute inset-[18.75%_6.25%_12.5%_12.5%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-7.5px_-11.25px] mask-size-[60px_60px]" style={{ maskImage: `url("${imgGroup2}")` }}>
                      <div className="absolute inset-[-2.42%_-2.05%]">
                        <img alt="" className="block max-w-none size-full" src={imgGroup3} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[18px] items-start leading-[0] left-0 top-[95px] w-full xl:w-[322.23px]">
              <div className="flex flex-col font-['Instrument_Sans:Bold'] font-bold h-[31.2px] justify-center relative shrink-0 text-[#0c211d] text-[24px] w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-[32px]">Expert Instructors</p>
              </div>
              <div className="flex flex-col font-['Inter:Regular'] font-normal h-[48px] justify-center not-italic relative shrink-0 text-[#606b68] text-[18px] w-full">
                <p className="leading-[28px]">Learn from industry experts guiding you every step.</p>
              </div>
            </div>
          </div>
          <div className="absolute hidden xl:block bg-[#ced3d2] h-px left-0 right-[860px] top-[249.5px]" />
          <div className="relative h-[195.2px] xl:absolute xl:left-0 xl:right-[860px] xl:top-[290.5px]">
            <div className="absolute left-0 top-0 size-[60px] overflow-clip">
              <div className="absolute left-0 overflow-clip size-[60px] top-0">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 overflow-clip size-[60px] top-1/2">
                  <div className="absolute contents inset-0">
                    <div className="absolute inset-[21.88%_3.13%_15.62%_3.13%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-1.876px_-13.125px] mask-size-[60px_60px]" style={{ maskImage: `url("${imgGroup2}")` }}>
                      <div className="absolute inset-[-2.67%_-1.78%]">
                        <img alt="" className="block max-w-none size-full" src={imgGroup4} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[18px] items-start leading-[0] left-0 top-[94.57px] w-full xl:w-[338.553px]">
              <div className="flex flex-col font-['Instrument_Sans:Bold'] font-bold h-[32px] justify-center relative shrink-0 text-[#0c211d] text-[24px] w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-[32px]">Hands-On Practice</p>
              </div>
              <div className="flex flex-col font-['Inter:Regular'] font-normal h-[48px] justify-center not-italic relative shrink-0 text-[#606b68] text-[18px] w-full">
                <p className="leading-[28px]">Apply your knowledge with real projects and exercises.</p>
              </div>
            </div>
          </div>
          <div className="relative order-first md:col-span-2 h-[212px] sm:h-[340px] md:h-[424px] xl:contents">
          <div className="absolute left-1/2 top-0 w-[592px] h-[424px] -translate-x-1/2 scale-[0.5] sm:scale-[0.8] md:scale-100 origin-top bg-white overflow-clip xl:inset-[7.62%_24.08%_7.62%_26.58%] xl:w-auto xl:h-auto xl:translate-x-0">
            <div className="absolute flex h-[318.321px] items-center justify-center left-[24.08px] top-[22.01px] w-[500.174px]">
              <div className="flex-none rotate-[-20.2deg]">
                <div className="h-[165.51px] relative w-[472.058px]">
                  <div className="live-pulse absolute inset-[-1.32%_-0.46%]">
                    <img alt="" className="block max-w-none size-full" src={imgEllipse1914} />
                  </div>
                </div>
              </div>
            </div>
            <div className="live-float absolute inset-[6.09%_35.1%_20.46%_27.72%]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVector4} />
            </div>
            <div className="live-pulse absolute h-[24px] left-[215px] top-[349.48px] w-[214px]">
              <div className="absolute inset-[-110.42%_-12.38%]">
                <img alt="" className="block max-w-none size-full" src={imgEllipse1915} />
              </div>
            </div>
            <div className="live-float absolute inset-[6.09%_35.1%_20.46%_27.72%]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVector5} />
            </div>
            <div className="absolute flex h-[244.501px] items-center justify-center left-[51.25px] top-[95.63px] w-[473.016px]">
              <div className="flex-none rotate-[-20.2deg]">
                <div className="h-[86.853px] relative w-[472.058px]">
                  <div className="live-pulse absolute inset-[0_-0.46%_-2.52%_-0.46%]" style={{ animationDelay: "1.5s" }}>
                    <img alt="" className="block max-w-none size-full" src={imgEllipse1916} />
                  </div>
                </div>
              </div>
            </div>
            <div className="live-dot absolute left-[99.41px] size-[18.575px] top-[211.89px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse1918} />
            </div>
            <div className="live-dot absolute left-[190.91px] size-[12.383px] top-[79.8px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse1919} />
            </div>
            <div className="live-float absolute inset-[25.95%_31.08%_51.87%_53.04%]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIcon} />
            </div>
            <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 size-[320px] -translate-x-1/2 -translate-y-1/2">
              <span className="live-ring absolute inset-[60px] rounded-full border border-[#0d5c4b]/40" />
              <span className="live-ring absolute inset-[60px] rounded-full border border-[#0d5c4b]/40" style={{ animationDelay: "1.6s" }} />
              <div className="live-orbit absolute inset-0">
                <span className="absolute left-1/2 top-0 size-[10px] -translate-x-1/2 rounded-full bg-[#ffb20d] shadow-[0_0_16px_#ffb20d]" />
              </div>
              <div className="live-orbit-rev absolute inset-[40px]">
                <span className="absolute bottom-0 left-1/2 size-[8px] -translate-x-1/2 rounded-full bg-[#12b981] shadow-[0_0_14px_#12b981]" />
              </div>
            </div>
          </div>
          </div>
          <div className="relative h-[195.2px] xl:absolute xl:left-[860px] xl:right-0 xl:top-[14.3px]">
            <div className="absolute left-0 xl:left-[280px] top-0 size-[60px] overflow-clip">
              <div className="absolute left-0 overflow-clip size-[60px] top-0">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 overflow-clip size-[60px] top-1/2">
                  <div className="absolute contents inset-0">
                    <div className="absolute inset-[12.5%_6.23%_15.62%_6.23%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-3.74px_-7.5px] mask-size-[60px_60px]" style={{ maskImage: `url("${imgGroup2}")` }}>
                      <div className="absolute inset-[-2.32%_-1.9%]">
                        <img alt="" className="block max-w-none size-full" src={imgGroup5} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[18px] items-start leading-[0] left-0 xl:left-[13.47px] text-left xl:text-right top-[94.77px] w-full xl:w-[328.765px]">
              <div className="flex flex-col font-['Instrument_Sans:Bold'] font-bold h-[31px] justify-center relative shrink-0 text-[#0c211d] text-[24px] w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-[32px]">Guided Learning</p>
              </div>
              <div className="flex flex-col font-['Inter:Regular'] font-normal justify-center not-italic relative shrink-0 text-[#606b68] text-[18px] w-full">
                <p className="leading-[28px]">Clear paths that take you from beginner to confident professional.</p>
              </div>
            </div>
          </div>
          <div className="absolute hidden xl:block bg-[#ced3d2] h-px left-[860px] right-0 top-[249.5px]" />
          <div className="relative h-[195.2px] xl:absolute xl:left-[860px] xl:right-0 xl:top-[290.5px]">
            <div className="absolute left-0 xl:left-[280px] top-0 size-[60px] overflow-clip">
              <div className="absolute left-0 overflow-clip size-[60px] top-0">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 overflow-clip size-[60px] top-1/2">
                  <div className="absolute contents inset-0">
                    <div className="absolute inset-[18.75%_12.5%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-7.5px_-11.25px] mask-size-[60px_60px]" style={{ maskImage: `url("${imgGroup2}")` }}>
                      <div className="absolute inset-[-2.67%_-2.22%]">
                        <img alt="" className="block max-w-none size-full" src={imgGroup6} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[18px] items-start leading-[0] left-0 xl:left-[14.22px] text-left xl:text-right top-[95px] w-full xl:w-[326.531px]">
              <div className="flex flex-col font-['Instrument_Sans:Bold'] font-bold h-[31.2px] justify-center relative shrink-0 text-[#0c211d] text-[24px] w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-[32px]">AI Career Skills</p>
              </div>
              <div className="flex flex-col font-['Inter:Regular'] font-normal justify-center not-italic relative shrink-0 text-[#606b68] text-[18px] w-full">
                <p className="leading-[28px]">Master practical AI tools and build skills that grow your career.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="faq" className="scroll-mt-[80px] bg-white content-stretch flex flex-col gap-[60px] items-center justify-center py-[72px] relative shrink-0 w-full">
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
          <div className="content-stretch flex flex-col items-center px-[20px] relative shrink-0 w-full">
            <div className="[word-break:break-word] content-stretch flex flex-col gap-[16px] items-center sm:px-[20px] relative shrink-0 text-center w-full max-w-[540px]">
              <p className="font-['Instrument_Sans:Bold'] font-bold leading-[normal] relative shrink-0 text-[#0f172a] text-[32px] md:text-[40px] xl:text-[48px] tracking-[-0.96px] xl:whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
                Frequently Asked Questions
              </p>
              <div className="flex flex-col font-['Inter:Regular'] font-normal justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#1e293b] text-[18px] w-[min-content]">
                <p className="leading-[28px]">Here are a few of the most frequent queries we get from learners and instructors.</p>
              </div>
            </div>
          </div>
        </div>
        <Faq />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-t border-[#0d5c4b] border-solid relative shrink-0 w-full">
        <div className="border-[#0d5c4b] border-b border-solid sm:even:border-l xl:[&:not(:first-child)]:border-l content-stretch flex flex-col items-center justify-center min-w-px px-6 md:px-[48px] py-8 xl:py-[60px] relative">
          <div className="content-stretch flex gap-[20px] items-center relative shrink-0 w-full">
            <div className="overflow-clip relative shrink-0 size-[52px]">
              <div className="absolute left-0 overflow-clip size-[52px] top-0">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 overflow-clip size-[52px] top-1/2">
                  <div className="absolute contents inset-0">
                    <div className="absolute inset-0 mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-size-[52px_52px]" style={{ maskImage: `url("${imgGroup7}")` }}>
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup8} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] items-start leading-[0] relative min-w-0 flex-1">
              <div className="flex flex-col font-['Instrument_Sans:Bold'] font-bold justify-center relative shrink-0 text-[#0f0f0f] text-[24px] w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-[32px]">Learn Anything</p>
              </div>
              <div className="flex flex-col font-['Inter:Regular'] font-normal justify-center not-italic relative shrink-0 text-[#585858] text-[18px] w-full">
                <p className="leading-[26px]">From beginner to advanced</p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-[#0d5c4b] border-b border-solid sm:even:border-l xl:[&:not(:first-child)]:border-l content-stretch flex flex-col items-center justify-center min-w-px px-6 md:px-[48px] py-8 xl:py-[60px] relative">
          <div className="content-stretch flex gap-[20px] items-center relative shrink-0 w-full">
            <div className="h-[48px] overflow-clip relative shrink-0 w-[52px]">
              <div className="absolute h-[48px] left-0 overflow-clip top-0 w-[52px]">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[48px] left-1/2 top-1/2 w-[52px]">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={img687Cd80C0F17D680A102A7B5Key20Feature20Icon202Svg} />
                </div>
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] items-start leading-[0] relative min-w-0 flex-1">
              <div className="flex flex-col font-['Instrument_Sans:Bold'] font-bold justify-center relative shrink-0 text-[#0f0f0f] text-[24px] w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-[32px]">Flexible Courses</p>
              </div>
              <div className="flex flex-col font-['Inter:Regular'] font-normal justify-center not-italic relative shrink-0 text-[#585858] text-[18px] w-full">
                <p className="leading-[26px]">Learn anytime, anywhere</p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-[#0d5c4b] border-b border-solid sm:even:border-l xl:[&:not(:first-child)]:border-l content-stretch flex flex-col items-center justify-center min-w-px px-6 md:px-[48px] py-8 xl:py-[60px] relative">
          <div className="content-stretch flex gap-[20px] items-center relative shrink-0 w-full">
            <div className="overflow-clip relative shrink-0 size-[52px]">
              <div className="absolute left-0 overflow-clip size-[52px] top-0">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 overflow-clip size-[52px] top-1/2">
                  <div className="absolute contents inset-0">
                    <div className="absolute inset-[0_0_-0.01%_0] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-size-[52px_52px]" style={{ maskImage: `url("${imgGroup7}")` }}>
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup9} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] items-start leading-[0] relative min-w-0 flex-1">
              <div className="flex flex-col font-['Instrument_Sans:Bold'] font-bold justify-center relative shrink-0 text-[#0f0f0f] text-[24px] w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-[32px]">Get Certificate</p>
              </div>
              <div className="flex flex-col font-['Inter:Regular'] font-normal justify-center not-italic relative shrink-0 text-[#585858] text-[18px] w-full">
                <p className="leading-[26px]">Showcase your achievements</p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-[#0d5c4b] border-b border-solid sm:even:border-l xl:[&:not(:first-child)]:border-l content-stretch flex flex-col items-center justify-center min-w-px px-6 md:px-[48px] py-8 xl:py-[60px] relative">
          <div className="content-stretch flex gap-[20px] items-center relative shrink-0 w-full">
            <div className="overflow-clip relative shrink-0 size-[52px]">
              <div className="absolute left-0 overflow-clip size-[52px] top-0">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 overflow-clip size-[52px] top-1/2">
                  <div className="absolute contents inset-0">
                    <div className="absolute inset-0 mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-size-[52px_52px]" style={{ maskImage: `url("${imgGroup7}")` }}>
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup10} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] items-start leading-[0] relative min-w-0 flex-1">
              <div className="flex flex-col font-['Instrument_Sans:Bold'] font-bold justify-center relative shrink-0 text-[#0f0f0f] text-[24px] w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-[32px]">Expert Tutors</p>
              </div>
              <div className="flex flex-col font-['Inter:Regular'] font-normal justify-center not-italic relative shrink-0 text-[#585858] text-[18px] w-full">
                <p className="leading-[26px]">Teaching skills across categories.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-b content-stretch flex flex-col from-[#11012a] xl:h-[426px] items-start relative shrink-0 to-[#0f172a] to-[54.542%] w-full">
        <div className="xl:flex-[1_0_0] min-h-px overflow-clip relative w-full px-4 py-20 xl:p-0">
          <div className="absolute left-[1279px] size-[68px] top-[358px]">
            <div className="absolute inset-[-425.15%]">
              <img alt="" className="block max-w-none size-full" src={imgEllipse1899} />
            </div>
          </div>
          <div className="absolute bottom-[3.93px] h-[177px] left-0 w-[1764px]">
            <div className="absolute inset-[-0.21%_-0.16%_-0.25%_-0.16%]">
              <img alt="" className="block max-w-none size-full" src={imgVector6} />
            </div>
          </div>
          <div className="absolute left-[151px] size-[68px] top-[272px]">
            <div className="absolute inset-[-425.15%]">
              <img alt="" className="block max-w-none size-full" src={imgEllipse1898} />
            </div>
          </div>
          <div className="relative z-10 mx-auto content-stretch flex flex-col items-start w-full max-w-[642px] xl:absolute xl:left-1/2 xl:top-[calc(50%-1.93px)] xl:-translate-x-1/2 xl:-translate-y-1/2">
            <div className="content-stretch flex flex-col gap-[40px] items-center relative shrink-0 w-full">
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] items-center relative shrink-0 text-center w-full">
                <p className="font-['Instrument_Sans:Bold'] font-bold leading-[normal] relative shrink-0 text-[32px] md:text-[40px] xl:text-[48px] text-white tracking-[-0.96px] w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                  Stay Connected via Thkee
                </p>
                <div className="flex flex-col font-['Inter:Regular'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#cbd5e1] text-[18px] w-full">
                  <p className="leading-[28px]">Join us on social media, get in touch with us for support.</p>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0 w-full">
                <Newsletter />
                <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0">
                  <div className="relative shrink-0 size-[24px]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgAgreement02} />
                  </div>
                  <div className="[word-break:break-word] flex flex-col font-['Inter:Regular'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#fafbfc] text-[14px] text-right tracking-[-0.01px] whitespace-nowrap">
                    <p className="leading-[24px]">We protect your privacy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#0f172a] content-stretch flex flex-col gap-16 xl:gap-[100px] items-center pt-16 xl:pt-[100px] relative shrink-0 w-full">
        <div className="content-stretch flex flex-col lg:flex-row gap-12 lg:gap-0 items-start relative shrink-0 w-full max-w-[1280px] px-4 md:px-8 xl:px-0">
          <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full lg:w-[467px]">
            <div className="h-[36px] relative shrink-0 w-[134.453px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame2} />
            </div>
            <div className="content-stretch flex flex-col gap-[40px] items-start relative shrink-0 w-full">
              <div className="content-stretch flex items-start p-[4px] relative shrink-0 w-full">
                <p className="[word-break:break-word] font-['Inter:Regular'] font-normal leading-[24px] not-italic relative shrink-0 text-[#e2e8f0] text-[16px] tracking-[-0.01px] w-full max-w-[354px]">
                  Founded to Innovate: Thkee transforms e-learning with personalized paths and interactive content, aiming to make quality education accessible worldwide.
                </p>
              </div>
              <FooterLanguage />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 w-full lg:w-auto lg:flex lg:flex-[1_0_0] lg:gap-[100px] items-start min-w-px relative">
            <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start min-w-px relative">
              <p className="font-['Instrument_Sans:Medium'] font-medium leading-[32px] relative shrink-0 text-[#e2e8f0] text-[20px] tracking-[0.15px] w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                Company
              </p>
              <div className="content-stretch flex flex-col font-['Inter:Regular'] font-normal gap-[16px] items-start leading-[24px] not-italic relative shrink-0 text-[16px] text-[#e2e8f0] tracking-[-0.01px] w-full whitespace-nowrap">
                <button type="button" className="relative shrink-0 text-left transition-colors hover:text-[#faa104]" onClick={() => setOverlay({ type: "info", page: "About us" })}>
                  {"About us"}
                </button>
                <button type="button" className="relative shrink-0 text-left transition-colors hover:text-[#faa104]" onClick={() => setOverlay({ type: "info", page: "Our Vision" })}>
                  {"Our Vision"}
                </button>
                <button type="button" className="relative shrink-0 text-left transition-colors hover:text-[#faa104]" onClick={() => setOverlay({ type: "info", page: "Career" })}>
                  {"Career"}
                </button>
                <button type="button" className="relative shrink-0 text-left transition-colors hover:text-[#faa104]" onClick={() => setOverlay({ type: "info", page: "Company" })}>
                  {"Company"}
                </button>
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start min-w-px relative text-[#e2e8f0]">
              <p className="font-['Instrument_Sans:Medium'] font-medium leading-[32px] relative shrink-0 text-[20px] tracking-[0.15px] w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
                Services
              </p>
              <div className="content-stretch flex flex-col font-['Inter:Regular'] font-normal gap-[16px] items-start leading-[24px] not-italic relative shrink-0 text-[16px] tracking-[-0.01px] w-full whitespace-nowrap">
                <button type="button" className="relative shrink-0 text-left transition-colors hover:text-[#faa104]" onClick={() => scrollToId("faq")}>
                  {"Help & support"}
                </button>
                <button type="button" className="relative shrink-0 text-left transition-colors hover:text-[#faa104]" onClick={() => setOverlay({ type: "instructor" })}>
                  {"Teach on Thkee"}
                </button>
                <button type="button" className="relative shrink-0 text-left transition-colors hover:text-[#faa104]" onClick={() => setOverlay({ type: "info", page: "Blog" })}>
                  {"Blog"}
                </button>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[48px] items-start relative shrink-0 col-span-2 sm:col-span-1 w-full lg:w-[279px]">
              <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0">
                <p className="[word-break:break-word] font-['Instrument_Sans:Medium'] font-medium leading-[32px] relative shrink-0 text-[#e2e8f0] text-[20px] tracking-[0.15px] w-[230px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                  Follow us on
                </p>
                <div className="content-stretch flex gap-[14.4px] items-center relative shrink-0">
                  <a href="https://www.facebook.com" target="_blank" rel="noreferrer" aria-label="Thkee on Facebook" className="relative shrink-0 size-[24px] transition-opacity hover:opacity-70">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame3} />
                  </a>
                  <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="Thkee on X" className="relative shrink-0 size-[24px] transition-opacity hover:opacity-70">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame4} />
                  </a>
                  <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="Thkee on LinkedIn" className="relative shrink-0 size-[24px] transition-opacity hover:opacity-70">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame5} />
                  </a>
                  <a href="https://www.youtube.com" target="_blank" rel="noreferrer" aria-label="Thkee on YouTube" className="relative shrink-0 size-[24px] transition-opacity hover:opacity-70">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame6} />
                  </a>
                </div>
              </div>
              <div className="h-[96.529px] relative shrink-0 w-[251.841px]">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLogoFooterAr1} />
              </div>
            </div>
          </div>
        </div>
        <div className="border-[#1e293b] border-solid border-t content-stretch flex flex-col items-center justify-center py-[16px] relative shrink-0 w-full">
          <div className="content-stretch flex flex-col md:flex-row gap-4 items-center justify-between relative shrink-0 w-full max-w-[1280px] px-4 md:px-8 xl:px-0">
            <div className="content-stretch flex gap-[5.19px] items-start relative shrink-0">
              <div className="bg-[#162f6a] content-stretch flex h-[28px] items-center justify-center px-[6.231px] py-[5.997px] relative rounded-[1.808px] shrink-0 w-[43.273px]">
                <div className="h-[12.727px] relative shrink-0 w-[29.273px]">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame7} />
                </div>
              </div>
              <div className="bg-[#162f6a] content-stretch flex h-[28px] items-center justify-center px-[6.231px] py-[5.997px] relative rounded-[2.282px] shrink-0 w-[44.545px]">
                <div className="content-stretch flex h-[12.727px] items-center justify-center overflow-clip relative shrink-0 w-[42px]">
                  <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
                    <div className="col-1 h-[11.794px] ml-0 mt-0 relative row-1 w-[9.174px]">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup7364} />
                    </div>
                    <div className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-[10.06px] mt-[1.62px] place-items-start relative row-1">
                      <div className="col-1 h-[7.112px] ml-[14.91px] mt-0 relative row-1 w-[9.318px]">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup11} />
                      </div>
                      <div className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-0 mt-0 place-items-start relative row-1">
                        <div className="col-1 h-[7.111px] ml-0 mt-0 relative row-1 w-[9.326px]">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup12} />
                        </div>
                        <div className="col-1 h-[5.689px] ml-[9.95px] mt-[2.85px] relative row-1 w-[4.349px]">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup13} />
                        </div>
                      </div>
                      <div className="col-1 h-[7.112px] ml-[24.86px] mt-0 relative row-1 w-[2.486px]">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVector7} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#162f6a] content-stretch flex h-[28px] items-center justify-center px-[6.359px] py-[5.997px] relative rounded-[1.894px] shrink-0 w-[43.273px]">
                <div className="h-[10.182px] overflow-clip relative shrink-0 w-[31.818px]">
                  <div className="absolute inset-[-0.01%_0_0.01%_-0.01%]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgG4158} />
                  </div>
                </div>
              </div>
              <div className="bg-[#162f6a] content-stretch flex h-[28px] items-center justify-center px-[6.131px] py-[5.997px] relative rounded-[1.543px] shrink-0 w-[43.273px]">
                <div className="content-stretch flex flex-col h-[20.364px] items-center justify-center overflow-clip relative shrink-0 w-[35.636px]">
                  <div className="h-[15.537px] relative shrink-0 w-[35.351px]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup7368} />
                  </div>
                </div>
              </div>
              <div className="bg-[#162f6a] content-stretch flex h-[28px] items-center justify-center px-[4.797px] py-[5.997px] relative rounded-[1.395px] shrink-0 w-[43.273px]">
                <div className="h-[10.415px] overflow-clip relative shrink-0 w-[32.847px]">
                  <div className="absolute inset-[0_0.04%_0_-0.03%]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup14} />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
              <div className="[word-break:break-word] col-1 content-stretch flex gap-[4px] items-center leading-[18px] ml-0 mt-0 not-italic relative row-1 text-[#64748b] text-[12px] whitespace-nowrap">
                <p className="font-['Inter:Medium'] font-medium relative shrink-0 tracking-[0.01px] uppercase">
                  Copyright
                </p>
                <p className="font-['Inter:Regular'] font-normal relative shrink-0 tracking-[-0.01px]">
                  ©
                </p>
                <p className="font-['Inter:Medium'] font-medium relative shrink-0 tracking-[0.01px] uppercase">
                  2025 Thkee. All rights reserved.
                </p>
              </div>
            </div>
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
              <button type="button" onClick={() => setOverlay({ type: "info", page: "Terms of Service" })} className="[text-decoration-skip-ink:none] [text-underline-position:from-font] [word-break:break-word] decoration-from-font decoration-solid font-['Inter:Medium'] font-medium leading-[18px] not-italic relative shrink-0 text-[#cbd5e1] text-[12px] tracking-[0.01px] underline whitespace-nowrap transition-colors hover:text-white">
                Terms of Service
              </button>
              <div className="bg-[#cbd5e1] h-[14px] relative shrink-0 w-px" />
              <button type="button" onClick={() => setOverlay({ type: "info", page: "Privacy Policy" })} className="[text-decoration-skip-ink:none] [text-underline-position:from-font] [word-break:break-word] decoration-from-font decoration-solid font-['Inter:Medium'] font-medium leading-[18px] not-italic relative shrink-0 text-[#cbd5e1] text-[12px] tracking-[0.01px] underline whitespace-nowrap transition-colors hover:text-white">
                Privacy Policy
              </button>
              <div className="bg-[#cbd5e1] h-[14px] relative shrink-0 w-px" />
              <button type="button" onClick={() => scrollToId("faq")} className="[text-decoration-skip-ink:none] [text-underline-position:from-font] [word-break:break-word] decoration-from-font decoration-solid font-['Inter:Medium'] font-medium leading-[18px] not-italic relative shrink-0 text-[#cbd5e1] text-[12px] tracking-[0.01px] underline whitespace-nowrap transition-colors hover:text-white">
                FAQ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
