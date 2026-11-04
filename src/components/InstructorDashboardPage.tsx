import { fontMedium, fontRegular, fontBold } from "../fonts";
import { load, openMessages, openMyLearning, useApp } from "../store";

const imgLogo = "/assets/9afd8.svg";
const imgBell = "/assets/13ce5.svg";
const imgPlusSmall = "/assets/51771.svg";
const imgPlus = "/assets/1a8b7.svg";
const imgEmpty = "/assets/3cf65.svg";

const navItems = [
  { label: "Course", icon: "/assets/111a0.svg" },
  { label: "Assignments", icon: "/assets/9ac67.svg" },
  { label: "Q&A", icon: "/assets/5f91c.svg" },
  { label: "Messages", icon: "/assets/33e7c.svg" },
  { label: "Reviews", icon: "/assets/d3a75.svg" },
  { label: "Report", icon: "/assets/b957e.svg" },
];

export default function InstructorDashboardPage() {
  const { user, notify } = useApp();
  const photo = load("thkee.profile", { photo: "" }).photo;
  const initials = (user?.name ?? "You")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const newCourse = () => notify("Course creation is coming soon");
  const pick = (label: string) => {
    if (label === "Messages") openMessages();
    else if (label !== "Course") notify(`${label} is coming soon`);
  };
  const toStudent = () => openMyLearning();

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-[#fffefe] md:flex-row">
      <aside className="flex shrink-0 flex-col bg-[#0f172a] md:sticky md:top-0 md:h-[100dvh] md:w-[250px]">
        <div className="px-6 py-4 md:pb-6 md:pt-12">
          <img src={imgLogo} alt="Thkee" className="h-[30px] w-[101.6px]" />
        </div>
        <nav aria-label="Instructor" className="flex overflow-x-auto md:flex-1 md:flex-col md:gap-2 md:overflow-visible">
          {navItems.map((item) => {
            const active = item.label === "Course";
            return (
              <button key={item.label} type="button" aria-current={active ? "page" : undefined} onClick={() => pick(item.label)} className={`flex h-[53px] shrink-0 items-center gap-3 border-b-4 px-6 text-left text-[14px] transition md:w-full md:border-b-0 md:border-r-4 md:pr-5 ${active ? `border-[#ffb20d] text-white ${fontMedium}` : `border-transparent text-[#94a3b8] hover:text-white ${fontMedium}`}`}>
                <img src={item.icon} alt="" width={18} height={18} className="size-[18px] shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="hidden px-6 py-7 md:block">
          <button type="button" onClick={toStudent} className={`h-[44px] w-full rounded-[8px] bg-white text-[14px] tracking-[0.5px] text-[#334155] transition hover:bg-[#f1f5f9] ${fontMedium}`}>
            Switch to Student
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[64px] items-center justify-end gap-[26px] bg-[#1e293b] px-4 shadow-[0_3px_5.5px_rgba(0,0,0,0.06)] md:px-8">
          <button type="button" onClick={toStudent} className={`text-[14px] leading-[24px] text-white transition hover:text-[#ffb20d] ${fontMedium}`}>
            Switch to Student
          </button>
          <button type="button" aria-label="Notifications" onClick={() => notify("You have no new notifications")} className="flex">
            <img src={imgBell} alt="" width={18} height={20} className="h-5 w-[18px]" />
          </button>
          {photo ? (
            <img src={photo} alt="" className="size-8 rounded-full border border-white object-cover" />
          ) : (
            <span aria-hidden="true" className={`flex size-8 items-center justify-center rounded-full bg-[#ffb20d] text-[12px] text-[#1e293b] ${fontBold}`}>
              {initials}
            </span>
          )}
        </header>
        <div className="flex flex-wrap items-center gap-6 border-b border-[#e2e8f0] bg-white px-4 py-6 md:pl-7 md:pr-[72px]">
          <h1 className="m-0 font-['Instrument_Sans:Medium'] text-[24px] font-medium leading-[32px] text-[#0f172a]" style={{ fontVariationSettings: '"wdth" 100' }}>
            Courses overview
          </h1>
          <button type="button" onClick={newCourse} className={`flex h-[36px] items-center gap-1.5 rounded-[8px] bg-[#ffb20d] px-3 text-[14px] leading-[20px] tracking-[-0.01px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
            <img src={imgPlusSmall} alt="" width={18} height={18} className="size-[18px]" />
            New Course
          </button>
        </div>
        <main className="flex flex-1 flex-col items-center justify-center gap-[29px] px-4 py-12 text-center">
          <div className="flex rounded-full bg-[#f8fafc] px-[61.6px] py-[60.4px]">
            <img src={imgEmpty} alt="" width={81} height={81} className="size-[81px]" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className={`text-[14px] leading-[24px] text-[#1e293b] ${fontBold}`}>You haven't added any courses yet.</p>
            <p className={`mt-2 max-w-[410px] text-[14px] leading-[24px] text-[#64748b] ${fontRegular}`}>To add your first online course to your students, click "new course".</p>
            <button type="button" onClick={newCourse} className={`mt-4 flex h-[44px] items-center gap-2 rounded-[8px] bg-[#ffb20d] px-5 text-[14px] leading-[20px] tracking-[-0.01px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
              <img src={imgPlus} alt="" width={20} height={20} className="size-5" />
              Create New Course
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
