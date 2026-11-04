import { useState } from "react";
import { fontMedium, fontRegular, fontBold } from "../fonts";
import { load, openCoInstructorRequests, openInstructorAnnouncements, openInstructorApps, openInstructorAssignments, openInstructorAvailability, openInstructorCourses, openInstructorQa, openInstructorReports, openInstructorReviews, openInstructorSchedule, openInstructorSessions, openMessages, openMyLearning, useApp } from "../store";
import InstructorAnnouncements from "./InstructorAnnouncements";
import InstructorApps from "./InstructorApps";
import InstructorAssignments from "./InstructorAssignments";
import InstructorAvailability from "./InstructorAvailability";
import InstructorCoRequests from "./InstructorCoRequests";
import InstructorCourses from "./InstructorCourses";
import InstructorQa from "./InstructorQa";
import InstructorReports from "./InstructorReports";
import InstructorReviews from "./InstructorReviews";
import InstructorSchedule from "./InstructorSchedule";
import InstructorSessions from "./InstructorSessions";

const imgLogo = "/assets/4c1d1.svg";
const imgBell = "/assets/95f6b.svg";
const imgChevron = "/assets/25f78.svg";

type NavItem = { label: string; icon: string; activeIcon?: string; tall?: boolean; chevron?: boolean; children?: string[]; tinted?: boolean };

const navGroups: { heading?: string; items: NavItem[] }[] = [
  { items: [{ label: "Dashboard", icon: "/assets/7b902.svg", tall: true }] },
  {
    heading: "RECORDED COURSES",
    items: [
      { label: "Course", icon: "/assets/a8978.svg", activeIcon: "/assets/fc64e.svg" },
      { label: "Assignments", icon: "/assets/dc8e4.svg" },
      { label: "Q&A", icon: "/assets/1337a.svg" },
      { label: "Reviews", icon: "/assets/d6bae.svg" },
      { label: "Report", icon: "/assets/9109d.svg" },
    ],
  },
  {
    heading: "LIVE SESSION",
    items: [
      { label: "All Sessions", icon: "/assets/f4aec.svg" },
      { label: "Schedule", icon: "/assets/971eb.svg" },
      { label: "Availability", icon: "/assets/26384.svg", chevron: true },
      { label: "Connected Apps", icon: "/assets/9ed7f.svg", tall: true, chevron: true, children: ["App Store", "Installed Apps"] },
    ],
  },
  {
    heading: "OTHERS",
    items: [
      { label: "Messages", icon: "/assets/817aa.svg" },
      { label: "Announcements", icon: "/assets/48fdd.svg", tinted: true },
      { label: "Co-Instructor Requests", icon: "/assets/78c79.svg" },
    ],
  },
];

function NavIcon({ item, active }: { item: NavItem; active: boolean }) {
  // Figma only has a highlighted icon for Course, so other active items tint their own icon with the same colour.
  if (item.tinted || (active && !item.activeIcon)) {
    const mask = `url(${item.icon}) center / contain no-repeat`;
    return <span aria-hidden="true" className={`size-[18px] shrink-0 ${active ? "bg-[#fcb02b]" : "bg-[#94a3b8]"}`} style={{ mask, WebkitMask: mask }} />;
  }
  return <img src={active && item.activeIcon ? item.activeIcon : item.icon} alt="" width={18} height={18} className="size-[18px] shrink-0" />;
}

export default function InstructorDashboardPage({ section, submissionId, reportView, reportMonth, questionId, newQuestionCourse, announcementCourse, scheduleId, appsView, sessionSeries, sessionId, sessionCourse }: { section?: "assignments" | "reports" | "reviews" | "qa" | "co-instructors" | "announcements" | "availability" | "apps" | "sessions" | "schedule"; announcementCourse?: string; scheduleId?: string; appsView?: "store" | "installed"; sessionSeries?: string; sessionId?: string; sessionCourse?: string; submissionId?: string; reportView?: "revenue"; reportMonth?: string; questionId?: string; newQuestionCourse?: string }) {
  const { user, notify } = useApp();
  const [appsOpen, setAppsOpen] = useState(true);
  const photo = load("thkee.profile", { photo: "" }).photo;
  const initials = (user?.name ?? "You")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const pick = (label: string) => {
    if (label === "Messages") openMessages();
    else if (label === "Course") openInstructorCourses();
    else if (label === "Assignments") openInstructorAssignments();
    else if (label === "Q&A") openInstructorQa();
    else if (label === "All Sessions") openInstructorSessions();
    else if (label === "Schedule") openInstructorSchedule();
    else if (label === "App Store") openInstructorApps("store");
    else if (label === "Installed Apps") openInstructorApps("installed");
    else if (label === "Availability") openInstructorAvailability();
    else if (label === "Announcements") openInstructorAnnouncements();
    else if (label === "Co-Instructor Requests") openCoInstructorRequests();
    else if (label === "Reviews") openInstructorReviews();
    else if (label === "Report") openInstructorReports();
    else if (label === "Connected Apps") setAppsOpen((open) => !open);
    else notify(`${label} is coming soon`);
  };
  const activeLabel = section === "assignments" ? "Assignments" : section === "reports" ? "Report" : section === "reviews" ? "Reviews" : section === "qa" ? "Q&A" : section === "co-instructors" ? "Co-Instructor Requests" : section === "announcements" ? "Announcements" : section === "sessions" ? "All Sessions" : section === "schedule" ? "Schedule" : section === "availability" ? "Availability" : section === "apps" ? (appsView === "installed" ? "Installed Apps" : "App Store") : "Course";
  const toStudent = () => openMyLearning();

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-[#fffefe] md:flex-row">
      <aside className="flex shrink-0 flex-col bg-[#0f172a] md:sticky md:top-0 md:h-[100dvh] md:w-[250px]">
        <div className="flex h-[64px] shrink-0 items-center border-[#1e293b] bg-[#1e293b] px-8 md:border-b md:border-r">
          <img src={imgLogo} alt="Thkee" className="h-[28px] w-[94.837px]" />
        </div>
        <nav aria-label="Instructor" className="flex gap-1 overflow-x-auto px-3 py-2 md:min-h-0 md:flex-1 md:flex-col md:gap-3 md:overflow-y-auto md:overflow-x-visible md:pb-0 md:pt-8">
          {navGroups.map((group, i) => (
            <div key={i} className="flex shrink-0 gap-1 md:flex-col md:gap-0.5">
              {group.heading && <p className={`hidden py-1 text-[10px] leading-[1.6] tracking-[0.5px] text-[#94a3b8] md:block ${fontMedium}`}>{group.heading}</p>}
              {group.items.map((item) => {
                const active = item.label === activeLabel;
                const open = item.children && appsOpen;
                return (
                  <div key={item.label} className="flex shrink-0 gap-1 md:flex-col md:gap-0">
                    <button
                      type="button"
                      aria-current={active ? "page" : undefined}
                      aria-expanded={item.children ? appsOpen : undefined}
                      onClick={() => pick(item.label)}
                      className={`flex shrink-0 items-center gap-3 rounded-[8px] pl-4 pr-5 text-left text-[14px] leading-[20px] tracking-[-0.01px] transition md:w-full ${item.tall ? "h-10" : "h-9"} ${active ? `bg-[#334155] text-white ${fontMedium}` : `text-[#94a3b8] hover:text-white ${fontRegular}`}`}
                    >
                      <NavIcon item={item} active={active} />
                      <span className={`flex-1 whitespace-nowrap ${item.label === "Availability" ? "ml-1" : ""}`}>{item.label}</span>
                      {item.chevron && <img src={imgChevron} alt="" width={20} height={20} className={`hidden size-5 transition-transform md:block ${item.children && !appsOpen ? "-rotate-90" : ""}`} />}
                    </button>
                    {open &&
                      item.children?.map((child) => (
                        <button key={child} type="button" aria-current={child === activeLabel ? "page" : undefined} onClick={() => pick(child)} className={`flex h-10 shrink-0 items-center whitespace-nowrap rounded-[8px] pl-4 pr-5 text-left text-[14px] leading-[20px] tracking-[-0.01px] transition md:w-full md:pl-12 ${child === activeLabel ? `bg-[#334155] text-white ${fontMedium}` : `text-[#94a3b8] hover:text-white ${fontRegular}`}`}>
                          {child}
                        </button>
                      ))}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="hidden shrink-0 px-6 py-7 md:block">
          <button type="button" onClick={toStudent} className={`h-[44px] w-full rounded-[8px] bg-white text-[16px] leading-[24px] tracking-[-0.01px] text-[#334155] transition hover:bg-[#f1f5f9] ${fontMedium}`}>
            Switch to Student
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[64px] shrink-0 items-center justify-end gap-[26px] bg-[#1e293b] px-4 shadow-[0_3px_5.5px_rgba(0,0,0,0.06)] md:px-8">
          <button type="button" onClick={toStudent} className={`text-[14px] leading-[24px] text-white transition hover:text-[#ffb20d] md:text-[16px] ${fontMedium}`}>
            Switched to Student
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
        {section === "assignments" ? <InstructorAssignments submissionId={submissionId} /> : section === "reports" ? <InstructorReports view={reportView} month={reportMonth} /> : section === "reviews" ? <InstructorReviews /> : section === "qa" ? <InstructorQa questionId={questionId} newQuestionCourse={newQuestionCourse} /> : section === "co-instructors" ? <InstructorCoRequests /> : section === "announcements" ? <InstructorAnnouncements courseId={announcementCourse} /> : section === "availability" ? <InstructorAvailability scheduleId={scheduleId} /> : section === "apps" ? <InstructorApps view={appsView ?? "store"} /> : section === "sessions" ? <InstructorSessions seriesId={sessionSeries} sessionId={sessionId} courseId={sessionCourse} /> : section === "schedule" ? <InstructorSchedule /> : <InstructorCourses />}
      </div>
    </div>
  );
}
