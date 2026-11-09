import { useEffect, useRef, useState, type ReactNode } from "react";
import { courses, experts } from "../data";
import { fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { useApp } from "../store";
import { Card, CheckField, LinkField, SelectField, TextField, ToggleRow } from "./AccountSettingsPage";
import { MadaBadge, MastercardBadge, MethodRow, PaypalLogo, VisaBadge } from "./CheckoutPage";
import { ExpertAvatar, ExpertCard } from "./Experts";
import { BarChart, Donut, LineChart } from "./InstructorCharts";
import { ChecklistArt, InspireIcon, LaptopsArt, PresentingArt, RecordingArt, TeachIcon, TrophyIcon } from "./InstructorArt";
import { Checkbox } from "./InstructorAssignments";
import { TimeSelect, Toggle } from "./InstructorAvailability";
import { Pagination, StatusBadge } from "./InstructorCourses";
import { Stepper } from "./InstructorOnboardingPage";
import { InfoTip } from "./InstructorReports";
import { MiniCalendar } from "./InstructorSchedule";
import { ConfirmDialog, MultiSessionBadge, SingleSessionBadge } from "./InstructorSessions";
import { ActionMenu, FilterSelect } from "./Menus";
import { ClassCard } from "./MyLearningPage";
import { NoteEditor } from "./Notes";
import { CourseCard, CourseThumb, Shell } from "./Overlays";
import { CourseTile } from "./PopularCourses";
import { RefundOption } from "./RefundRequestPage";
import { ResultCard, Stars } from "./SearchPage";
import SectionHeadingBlock from "./SectionHeading";

const nav = [
  { id: "colors", label: "Colours" },
  { id: "type", label: "Typography" },
  { id: "buttons", label: "Buttons" },
  { id: "fields", label: "Form fields" },
  { id: "controls", label: "Selection controls" },
  { id: "menus", label: "Dropdowns & menus" },
  { id: "overlays", label: "Dialogs & messages" },
  { id: "badges", label: "Badges" },
  { id: "navigation", label: "Pagination & steps" },
  { id: "cards", label: "Cards" },
  { id: "display", label: "Ratings & avatars" },
  { id: "charts", label: "Charts" },
  { id: "calendar", label: "Calendar" },
  { id: "editor", label: "Text editor" },
  { id: "art", label: "Illustrations" },
  { id: "screens", label: "Full screens" },
];

const primaryScale = [
  { name: "50", hex: "#FFF9F0", swatch: "bg-primary-50" },
  { name: "100", hex: "#FFF0D7", swatch: "bg-primary-100" },
  { name: "200", hex: "#FEE3B4", swatch: "bg-primary-200" },
  { name: "300", hex: "#FDCE7C", swatch: "bg-primary-300" },
  { name: "400", hex: "#FCB740", swatch: "bg-primary-400" },
  { name: "500", hex: "#FFB20D", swatch: "bg-primary-500" },
  { name: "600", hex: "#FAA104", swatch: "bg-primary-600" },
  { name: "700", hex: "#C98003", swatch: "bg-primary-700" },
  { name: "800", hex: "#976002", swatch: "bg-primary-800" },
  { name: "900", hex: "#613F00", swatch: "bg-primary-900" },
];
// Common values still written directly in the code, not yet named in the theme.
const otherColors = [
  { name: "Brand green", hex: "#0D5C4B" },
  { name: "Slate 900", hex: "#0F172A" },
  { name: "Slate 800", hex: "#1E293B" },
  { name: "Slate 600", hex: "#475569" },
  { name: "Slate 500", hex: "#64748B" },
  { name: "Slate 400", hex: "#94A3B8" },
  { name: "Slate 200", hex: "#E2E8F0" },
  { name: "Slate 100", hex: "#F1F5F9" },
  { name: "Slate 50", hex: "#F8FAFC" },
  { name: "Error", hex: "#EF4444" },
  { name: "Success", hex: "#059669" },
];

const headingStyle = { fontVariationSettings: '"wdth" 100' };
const typeSamples = [
  { name: "Display, Instrument Sans Bold 48", className: `text-[32px] leading-[1.2] tracking-[-0.96px] md:text-[48px] ${fontHeading}`, heading: true },
  { name: "Page heading, Instrument Sans Bold 30", className: `text-[30px] leading-[36px] tracking-[-0.5px] ${fontHeading}`, heading: true },
  { name: "Page title, Instrument Sans Medium 24", className: "font-['Instrument_Sans:Medium'] text-[24px] font-medium leading-[32px]", heading: true },
  { name: "Section title, Instrument Sans Bold 20", className: `text-[20px] leading-[28px] ${fontHeading}`, heading: true },
  { name: "Body semibold, Inter 14", className: `text-[14px] leading-[22px] ${fontSemi}` },
  { name: "Body medium, Inter 14", className: `text-[14px] leading-[22px] ${fontMedium}` },
  { name: "Body, Inter 14", className: `text-[14px] leading-[22px] ${fontRegular}` },
  { name: "Small, Inter 12", className: `text-[12px] leading-[18px] ${fontRegular}` },
];

const buttonBase = `flex h-[36px] items-center justify-center rounded-[8px] px-4 text-[14px] transition disabled:cursor-not-allowed disabled:opacity-50 ${fontMedium}`;
const buttons = [
  { name: "Primary", className: "bg-primary-500 text-[#1e293b] hover:bg-primary-600" },
  { name: "Dark", className: "bg-[#1e293b] text-white hover:bg-[#0f172a]" },
  { name: "Secondary", className: "border border-[#cbd5e1] bg-white text-[#1e293b] hover:bg-[#f8fafc]" },
  { name: "Danger", className: "bg-[#dc2626] text-white hover:bg-[#b91c1c]" },
  { name: "Ghost", className: "text-[#1e293b] hover:bg-[#f1f5f9]" },
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const chartSeries = [
  { key: "revenue", label: "Revenue", color: "#ffb20d", values: [120, 180, 150, 240, 210, 300] },
  { key: "enrollments", label: "Enrollments", color: "#0d5c4b", values: [80, 110, 140, 130, 190, 220] },
];
const day = 24 * 60 * 60 * 1000;
const midnight = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();

const screens = [
  { label: "Home", hash: "" },
  { label: "Search results", hash: "#/search" },
  { label: "Course details", hash: `#/course/${courses[0].id}` },
  { label: "Course player", hash: `#/learn/${courses[0].id}` },
  { label: "Cart", hash: "#/cart" },
  { label: "Checkout", hash: "#/checkout" },
  { label: "My Learning", hash: "#/my-learning" },
  { label: "Purchase History", hash: "#/purchase-history" },
  { label: "Account Settings", hash: "#/account/profile" },
  { label: "Messages", hash: "#/messages" },
  { label: "Log in", hash: "#/login" },
  { label: "Teach on Thkee", hash: "#/teach" },
  { label: "Instructor onboarding", hash: "#/teach/start" },
  { label: "Instructor dashboard", hash: "#/instructor" },
  { label: "Instructor Q&A", hash: "#/instructor/qa" },
  { label: "Instructor reports", hash: "#/instructor/reports" },
  { label: "Instructor sessions", hash: "#/instructor/sessions" },
  { label: "Create a live class", hash: "#/instructor/create" },
];

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-[96px] border-t border-[#e2e8f0] py-10 first:border-t-0 first:pt-0">
      <h2 className={`m-0 text-[20px] leading-[28px] text-[#0f172a] ${fontHeading}`} style={headingStyle}>
        {title}
      </h2>
      {description && <p className={`mt-1 text-[14px] leading-[22px] text-[#64748b] ${fontRegular}`}>{description}</p>}
      <div className="mt-6 flex flex-col gap-8">{children}</div>
    </section>
  );
}

function Demo({ name, from, children }: { name: string; from?: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h3 className={`m-0 text-[14px] leading-[20px] text-[#0f172a] ${fontSemi}`}>{name}</h3>
        {from && <code className="font-mono text-[12px] leading-[18px] text-[#64748b]">{from}</code>}
      </div>
      <div className="rounded-[12px] border border-[#e2e8f0] p-4 md:p-6">{children}</div>
    </div>
  );
}

const row = "flex flex-wrap items-center gap-4";

function Swatch({ name, hex, swatch }: { name: string; hex: string; swatch?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={`block h-14 rounded-[8px] border border-black/5 ${swatch ?? ""}`} style={swatch ? undefined : { backgroundColor: hex }} />
      <span className={`text-[14px] leading-[20px] text-[#0f172a] ${fontMedium}`}>{name}</span>
      <span className="font-mono text-[12px] leading-[18px] text-[#64748b]">{hex}</span>
    </div>
  );
}

export default function ComponentsPage() {
  const { notify } = useApp();
  const [text, setText] = useState("Thkee");
  const [invalid, setInvalid] = useState("not-an-email");
  const [choice, setChoice] = useState("");
  const [handle, setHandle] = useState("");
  const [time, setTime] = useState(540);
  const [checked, setChecked] = useState(true);
  const [boxed, setBoxed] = useState(false);
  const [switched, setSwitched] = useState(true);
  const [smallSwitch, setSmallSwitch] = useState(true);
  const [method, setMethod] = useState("card");
  const [refund, setRefund] = useState("original");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [step, setStep] = useState(1);
  const [picked, setPicked] = useState(midnight);
  const [overlay, setOverlay] = useState<"modal" | "drawer" | "confirm" | null>(null);
  const [active, setActive] = useState(nav[0].id);
  // While a clicked section is smooth-scrolling into view, keep the clicked item selected.
  const lockUntil = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      if (Date.now() < lockUntil.current) return;
      let current = nav[0].id;
      for (const item of nav) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= 120) current = item.id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = nav[nav.length - 1].id;
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (id: string) => {
    setActive(id);
    lockUntil.current = Date.now() + 900;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "popular", label: "Most popular" },
    { value: "rated", label: "Highest rated" },
  ];

  return (
    <main className="w-full bg-white pt-[56px]">
      <div className="mx-auto flex max-w-[1272px] flex-col gap-6 px-4 pb-14 pt-8 md:flex-row md:gap-14 md:pt-10">
        <aside className="shrink-0 md:w-[232px]">
          <div className="md:sticky md:top-[112px]">
            <h1 className="m-0 font-['Instrument_Sans:Medium'] text-[24px] font-medium leading-[32px] text-[#0f172a]" style={headingStyle}>
              Components
            </h1>
            <p className={`mb-4 mt-1 text-[14px] leading-[20px] text-[#64748b] ${fontRegular}`}>The UI used across Thkee, shown live.</p>
            <nav aria-label="Component sections" className="-mx-3 flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
              {nav.map((item) => {
                const selected = item.id === active;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={selected ? "true" : undefined}
                    onClick={() => goTo(item.id)}
                    className={`flex h-[36px] shrink-0 items-center whitespace-nowrap rounded-[8px] px-3 text-left text-[14px] transition-colors ${
                      selected ? `bg-[#eef7f3] text-[#0d5c4b] ${fontMedium}` : `text-[#475569] hover:bg-[#f3f6f5] hover:text-[#0f172a] ${fontRegular}`
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <Section id="colors" title="Colours" description="The Primary scale comes from the theme in index.css, so it can be used as bg-primary-500 or text-primary-700.">
            <Demo name="Primary">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                {primaryScale.map((color) => (
                  <Swatch key={color.name} {...color} />
                ))}
              </div>
            </Demo>
            <Demo name="Other common colours">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {otherColors.map((color) => (
                  <Swatch key={color.name} {...color} />
                ))}
              </div>
            </Demo>
          </Section>

          <Section id="type" title="Typography">
            <Demo name="Text styles">
              <div className="flex flex-col gap-5">
                {typeSamples.map((sample) => (
                  <div key={sample.name} className="flex flex-col gap-1">
                    <p className={`text-[#0f172a] ${sample.className}`} style={sample.heading ? headingStyle : undefined}>
                      Learn something new today
                    </p>
                    <span className="font-mono text-[12px] leading-[18px] text-[#64748b]">{sample.name}</span>
                  </div>
                ))}
              </div>
            </Demo>
          </Section>

          <Section id="buttons" title="Buttons" description="There is no shared Button component yet. Each page writes its own styles and sizes, so these show the most common looks at 36px.">
            <Demo name="Styles">
              <div className={row}>
                {buttons.map((button) => (
                  <button key={button.name} type="button" className={`${buttonBase} ${button.className}`}>
                    {button.name}
                  </button>
                ))}
              </div>
            </Demo>
            <Demo name="Disabled">
              <div className={row}>
                {buttons.slice(0, 4).map((button) => (
                  <button key={button.name} type="button" disabled className={`${buttonBase} ${button.className}`}>
                    {button.name}
                  </button>
                ))}
              </div>
            </Demo>
          </Section>

          <Section id="fields" title="Form fields" description="All of these share the .field and .field-box styles from index.css.">
            <Demo name="TextField" from="AccountSettingsPage.tsx">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <TextField id="demo-text" label="Default" value={text} onChange={setText} />
                <TextField id="demo-hint" label="With hint" value="" onChange={() => {}} placeholder="Enter a value" hint="A short helpful note." />
                <TextField id="demo-required" label="Required" required value="" onChange={() => {}} placeholder="Enter a value" />
                <TextField id="demo-error" label="With error" value={invalid} onChange={setInvalid} error="Enter a valid email address" />
              </div>
            </Demo>
            <Demo name="SelectField" from="AccountSettingsPage.tsx">
              <div className="max-w-[340px]">
                <SelectField id="demo-select" label="Language" value={choice} onChange={setChoice} placeholder="Select a language" options={["English", "Arabic"]} />
              </div>
            </Demo>
            <Demo name="LinkField" from="AccountSettingsPage.tsx">
              <div className="max-w-[340px]">
                <LinkField
                  id="demo-link"
                  label="LinkedIn"
                  prefix="linkedin.com/in/"
                  value={handle}
                  onChange={setHandle}
                  icon={
                    <svg viewBox="0 0 24 24" className="size-4 text-[#64748b]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M3 12h18" />
                    </svg>
                  }
                />
              </div>
            </Demo>
            <Demo name=".field on a text area and a disabled input" from="index.css">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <textarea className="field" aria-label="Sample text area" placeholder="Write something" />
                <input className="field" aria-label="Sample disabled input" disabled value="Disabled" />
              </div>
            </Demo>
            <Demo name=".field-box search" from="index.css">
              <label className="field-box max-w-[340px]">
                <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-[#64748b]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
                <input aria-label="Sample search" placeholder="Search" className={`min-w-0 flex-1 bg-transparent text-[16px] text-[#0f172a] outline-none placeholder:text-slate-400 md:text-[14px] ${fontRegular}`} />
              </label>
            </Demo>
            <Demo name="TimeSelect" from="InstructorAvailability.tsx">
              <div className={row}>
                <TimeSelect label="Start time" value={time} onChange={setTime} />
                <TimeSelect label="Disabled time" value={time} onChange={setTime} disabled />
              </div>
            </Demo>
          </Section>

          <Section id="controls" title="Selection controls">
            <Demo name="CheckField" from="AccountSettingsPage.tsx">
              <CheckField checked={checked} onChange={setChecked}>
                I agree to the terms
              </CheckField>
            </Demo>
            <Demo name="Checkbox" from="InstructorAssignments.tsx">
              <Checkbox checked={boxed} onChange={() => setBoxed((b) => !b)}>
                <span className={`text-[14px] text-[#475569] ${fontRegular}`}>Select this row</span>
              </Checkbox>
            </Demo>
            <Demo name="ToggleRow" from="AccountSettingsPage.tsx">
              <ToggleRow title="Course recommendations" description="Suggested courses and helpful resources from Thkee." checked={switched} onChange={setSwitched} />
            </Demo>
            <Demo name="Toggle" from="InstructorAvailability.tsx">
              <Toggle on={smallSwitch} label="Sample switch" onChange={() => setSmallSwitch((s) => !s)} />
            </Demo>
            <Demo name="RefundOption (radio)" from="RefundRequestPage.tsx">
              <div className="divide-y divide-[#e2e8f0] overflow-hidden rounded-[8px] border border-[#e2e8f0]">
                <RefundOption checked={refund === "original"} onSelect={() => setRefund("original")} title="Original payment method" note="Takes 5 to 10 business days." />
                <RefundOption checked={refund === "credit"} onSelect={() => setRefund("credit")} title="Thkee credit" note="Available straight away." />
              </div>
            </Demo>
            <Demo name="MethodRow (payment choice)" from="CheckoutPage.tsx">
              <div className="flex flex-col gap-2">
                <MethodRow checked={method === "card"} onSelect={() => setMethod("card")} title="Credit or debit card" right={<VisaBadge />} />
                <MethodRow checked={method === "paypal"} onSelect={() => setMethod("paypal")} title="PayPal" right={<PaypalLogo />} />
              </div>
            </Demo>
          </Section>

          <Section id="menus" title="Dropdowns & menus">
            <Demo name="FilterSelect" from="Menus.tsx">
              <div className={row}>
                <FilterSelect label="Sort by" value={sort} onChange={setSort} options={sortOptions} />
                <FilterSelect large label="Sort by" value={sort} onChange={setSort} options={sortOptions} />
                <div className="w-[187px]">
                  <FilterSelect plain label="Sort by" value={sort} onChange={setSort} options={sortOptions} />
                </div>
              </div>
            </Demo>
            <Demo name="ActionMenu" from="Menus.tsx">
              <ActionMenu
                alignLeft
                label="More actions"
                triggerClass={`${buttonBase} border border-[#cbd5e1] bg-white text-[#1e293b] hover:bg-[#f8fafc]`}
                trigger="Open menu"
                items={[
                  { label: "Edit", onClick: () => notify("Edit clicked") },
                  { label: "Duplicate", disabled: true, onClick: () => {} },
                  { label: "Delete", danger: true, onClick: () => notify("Delete clicked") },
                ]}
              />
            </Demo>
          </Section>

          <Section id="overlays" title="Dialogs & messages">
            <Demo name="Shell, ConfirmDialog and toast" from="Overlays.tsx, InstructorSessions.tsx">
              <div className={row}>
                <button type="button" onClick={() => setOverlay("modal")} className={`${buttonBase} ${buttons[2].className}`}>
                  Open modal
                </button>
                <button type="button" onClick={() => setOverlay("drawer")} className={`${buttonBase} ${buttons[2].className}`}>
                  Open drawer
                </button>
                <button type="button" onClick={() => setOverlay("confirm")} className={`${buttonBase} ${buttons[2].className}`}>
                  Open confirm dialog
                </button>
                <button type="button" onClick={() => notify("This is a toast message")} className={`${buttonBase} ${buttons[2].className}`}>
                  Show toast
                </button>
              </div>
            </Demo>
          </Section>

          <Section id="badges" title="Badges">
            <Demo name="StatusBadge" from="InstructorCourses.tsx">
              <div className={row}>
                <StatusBadge status="draft" />
                <StatusBadge status="pending" />
                <StatusBadge status="rejected" />
                <StatusBadge status="published" />
              </div>
            </Demo>
            <Demo name="Session badges" from="InstructorSessions.tsx">
              <div className={row}>
                <SingleSessionBadge />
                <MultiSessionBadge />
              </div>
            </Demo>
            <Demo name="Payment badges" from="CheckoutPage.tsx">
              <div className={row}>
                <VisaBadge />
                <MastercardBadge />
                <MadaBadge />
                <PaypalLogo />
              </div>
            </Demo>
          </Section>

          <Section id="navigation" title="Pagination & steps">
            <Demo name="Pagination" from="InstructorCourses.tsx">
              <Pagination page={page} pageCount={5} start={(page - 1) * 10} shown={10} total={50} onPage={setPage} />
            </Demo>
            <Demo name="Stepper" from="InstructorOnboardingPage.tsx">
              <div className="flex flex-col items-center gap-4">
                <Stepper current={step} />
                <div className={row}>
                  {[0, 1, 2].map((n) => (
                    <button key={n} type="button" aria-pressed={step === n} onClick={() => setStep(n)} className={`${buttonBase} ${buttons[2].className}`}>
                      Step {n + 1}
                    </button>
                  ))}
                </div>
              </div>
            </Demo>
          </Section>

          <Section id="cards" title="Cards" description="These show real course data, so clicking one opens that course.">
            <Demo name="CourseTile" from="PopularCourses.tsx">
              <div className="max-w-[320px]">
                <CourseTile course={courses[0]} />
              </div>
            </Demo>
            <Demo name="CourseCard" from="Overlays.tsx">
              <div className="max-w-[320px]">
                <CourseCard course={courses[1]} />
              </div>
            </Demo>
            <Demo name="ClassCard" from="MyLearningPage.tsx">
              <div className="max-w-[320px]">
                <ClassCard course={courses[2]} />
              </div>
            </Demo>
            <Demo name="ResultCard" from="SearchPage.tsx">
              <ResultCard course={courses[3]} />
            </Demo>
            <Demo name="ExpertCard" from="Experts.tsx">
              <div className="max-w-[320px]">
                <ExpertCard expert={experts[0]} />
              </div>
            </Demo>
            <Demo name="Card (settings section)" from="AccountSettingsPage.tsx">
              <Card title="Section title" description="A short description of this section.">
                <p className={`text-[14px] text-[#475569] ${fontRegular}`}>Section content goes here.</p>
              </Card>
            </Demo>
            <Demo name="SectionHeading" from="SectionHeading.tsx">
              <SectionHeadingBlock eyebrow="Eyebrow" title="Section heading" subtitle="A supporting line of text." />
            </Demo>
          </Section>

          <Section id="display" title="Ratings & avatars">
            <Demo name="Stars" from="SearchPage.tsx">
              <div className={row}>
                <Stars value={5} />
                <Stars value={4.5} />
                <Stars value={3} size={18} />
              </div>
            </Demo>
            <Demo name="ExpertAvatar" from="Experts.tsx">
              <div className={row}>
                <ExpertAvatar expert={experts[0]} />
                <ExpertAvatar expert={experts[1]} size={40} />
              </div>
            </Demo>
            <Demo name="CourseThumb" from="Overlays.tsx">
              <div className="max-w-[260px] overflow-hidden rounded-[8px]">
                <CourseThumb course={courses[0]} className="aspect-video w-full" />
              </div>
            </Demo>
            <Demo name="InfoTip" from="InstructorReports.tsx">
              <div className={row}>
                <InfoTip text="Extra detail appears here." />
                <InfoTip text="Extra detail appears here." tone="amber" />
              </div>
            </Demo>
          </Section>

          <Section id="charts" title="Charts" description="The numbers here are samples.">
            <Demo name="LineChart" from="InstructorCharts.tsx">
              <LineChart months={months} series={chartSeries} yMax={400} ticks={[0, 100, 200, 300, 400]} markers tickLabel={(t) => String(t)} valueLabel={(v) => String(v)} />
            </Demo>
            <Demo name="BarChart" from="InstructorCharts.tsx">
              <BarChart months={months} values={chartSeries[0].values} color="#ffb20d" yMax={400} ticks={[0, 100, 200, 300, 400]} tickLabel={(t) => String(t)} valueLabel={(v) => String(v)} />
            </Demo>
            <Demo name="Donut" from="InstructorCharts.tsx">
              <Donut
                center="100"
                segments={[
                  { label: "Courses", color: "#ffb20d", value: 60 },
                  { label: "Live classes", color: "#0d5c4b", value: 30 },
                  { label: "Other", color: "#94a3b8", value: 10 },
                ]}
              />
            </Demo>
          </Section>

          <Section id="calendar" title="Calendar">
            <Demo name="MiniCalendar" from="InstructorSchedule.tsx">
              <div className="max-w-[320px]">
                <MiniCalendar selected={picked} today={midnight} marked={new Set([midnight + 2 * day, midnight + 5 * day])} onPick={setPicked} />
              </div>
            </Demo>
          </Section>

          <Section id="editor" title="Text editor">
            <Demo name="NoteEditor" from="Notes.tsx">
              <NoteEditor extras autoFocus={false} clearOnSave placeholder="Write something" onSave={() => notify("Saved")} onCancel={() => notify("Cancelled")} />
            </Demo>
          </Section>

          <Section id="art" title="Illustrations" description="Stand-in artwork drawn for the instructor pages, until the originals are exported from Figma.">
            <Demo name="Illustrations" from="InstructorArt.tsx">
              <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
                <LaptopsArt className="w-full max-w-[280px]" />
                <RecordingArt className="w-full max-w-[220px]" />
                <PresentingArt className="w-full max-w-[200px]" />
                <ChecklistArt className="w-full max-w-[200px]" />
              </div>
            </Demo>
            <Demo name="Icons" from="InstructorArt.tsx">
              <div className={row}>
                <TeachIcon />
                <InspireIcon />
                <TrophyIcon />
              </div>
            </Demo>
          </Section>

          <Section id="screens" title="Full screens" description="Page-specific pieces, like the video player, quiz and navbar, only work inside their own screen. Open them here.">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {screens.map((screen) => (
                <a key={screen.label} href={`/${screen.hash}`} className={`flex h-[36px] items-center rounded-[8px] border border-[#e2e8f0] px-3 text-[14px] text-[#1e293b] transition hover:border-[#cbd5e1] hover:bg-[#f8fafc] ${fontMedium}`}>
                  {screen.label}
                </a>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {overlay === "modal" && (
        <Shell title="Modal title" onClose={() => setOverlay(null)}>
          <p className={`p-6 text-[14px] leading-[22px] text-[#475569] ${fontRegular}`}>This is the shared modal. Press Escape or the close button to dismiss it.</p>
        </Shell>
      )}
      {overlay === "drawer" && (
        <Shell title="Drawer title" variant="drawer" onClose={() => setOverlay(null)}>
          <p className={`p-6 text-[14px] leading-[22px] text-[#475569] ${fontRegular}`}>This is the shared drawer, which slides in from the side.</p>
        </Shell>
      )}
      {overlay === "confirm" && <ConfirmDialog title="Delete this item?" body="This can't be undone." confirmLabel="Delete" onClose={() => setOverlay(null)} onConfirm={() => setOverlay(null)} />}
    </main>
  );
}
