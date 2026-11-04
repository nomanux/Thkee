import { useEffect, useRef, useState } from "react";
import { fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, openInstructorApps, save, useApp } from "../store";
import { Toggle } from "./InstructorAvailability";
import { ActionMenu, FilterSelect } from "./Menus";
import { Shell } from "./Overlays";

const imgClose = "/assets/53e9a.svg";
const imgPlusSmall = "/assets/51771.svg";

type AppId = "google" | "outlook" | "apple";
type Connection = { email: string; calendars: { name: string; on: boolean }[] };
type AppsState = { connections: Partial<Record<AppId, Connection>>; addTo: { app: AppId; email: string } | null };
type DialogState = { kind: "connect"; app: AppId; forAddTo: boolean } | { kind: "disconnect"; app: AppId; addToOnly: boolean };

const APPS: { id: AppId; name: string; short: string; description: string; addToEmail: string; email: string; calendars: string[] }[] = [
  {
    id: "google",
    name: "Google Calendar",
    short: "Google",
    description: "Google Calendar is an online scheduling tool that syncs across devices and integrates with other Google tools.",
    addToEmail: "noman9523484@gmail.com",
    email: "demomail@gmail.com",
    calendars: ["anothermail@gmail.com", "Holidays in Saudia Arabia", "Test class Routine schedule", "conference@business.com", "Summer vacation plans", "Weekly project deadlines", "teammeeting@company.org", "Fitness goals for 2024"],
  },
  {
    id: "outlook",
    name: "Outlook Calendar",
    short: "Outlook",
    description: "Connect your Outlook account to schedule, sync, and stay aligned across all your devices.",
    addToEmail: "demomail@outlook.com",
    email: "demomail@outlook.com",
    calendars: ["Work calendar", "Team meetings"],
  },
  {
    id: "apple",
    name: "Apple Calendar",
    short: "Apple",
    description: "Integrate your Apple Calendar to keep events, reminders, and classes perfectly in sync.",
    addToEmail: "demomail@icloud.com",
    email: "demomail@icloud.com",
    calendars: ["Home", "Class reminders"],
  },
];
const appById = (id: AppId) => APPS.find((a) => a.id === id)!;
const newConnection = (id: AppId): Connection => ({ email: appById(id).email, calendars: appById(id).calendars.map((name) => ({ name, on: true })) });

const STORE_KEY = "thkee.instructorApps";
const SEED: AppsState = { connections: { google: newConnection("google") }, addTo: null };
const titleClass = "m-0 flex h-[42px] items-center font-['Instrument_Sans:Medium'] text-[24px] font-medium leading-[32px] text-[#0f172a]";
const titleStyle = { fontVariationSettings: '"wdth" 100' };

function AppLogo({ app, size = "size-8" }: { app: AppId; size?: string }) {
  if (app === "google") {
    return (
      <svg viewBox="0 0 32 32" className={`${size} shrink-0`} aria-hidden="true">
        <rect x="1" y="1" width="30" height="30" rx="3" fill="#1e88e5" />
        <path d="M24 1h4a3 3 0 013 3v20h-7z" fill="#43a047" />
        <path d="M1 24h23v7H4a3 3 0 01-3-3z" fill="#fbc02d" />
        <path d="M24 24h7l-7 7z" fill="#e53935" />
        <rect x="8" y="8" width="16" height="16" fill="#fff" />
        <text x="16" y="21" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e88e5" fontFamily="sans-serif">
          31
        </text>
      </svg>
    );
  }
  if (app === "outlook") {
    return (
      <svg viewBox="0 0 32 32" className={`${size} shrink-0`} aria-hidden="true">
        <rect x="16" y="8" width="15" height="14" rx="1" fill="#fff" stroke="#1e88e5" strokeWidth="2" />
        <path d="M16 9l7.5 6L31 9" fill="none" stroke="#1e88e5" strokeWidth="2" />
        <path d="M1 5l17-4v30L1 27z" fill="#1e88e5" />
        <ellipse cx="9.5" cy="16" rx="4" ry="5" fill="none" stroke="#fff" strokeWidth="2.4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" className={`${size} shrink-0`} aria-hidden="true">
      <rect x="1.5" y="2.5" width="29" height="28" rx="4" fill="#fff" stroke="#334155" />
      <path d="M1.5 10V6.5a4 4 0 014-4h21a4 4 0 014 4V10z" fill="#ef4444" />
      <text x="16" y="25" textAnchor="middle" fontSize="14" fill="#334155" fontFamily="sans-serif">
        31
      </text>
    </svg>
  );
}

function UnlinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 7l2-2a4.5 4.5 0 016.5 6.5l-2 2M15 17l-2 2a4.5 4.5 0 01-6.5-6.5l2-2M9 15l6-6M4 4l2 2M20 20l-2-2" />
    </svg>
  );
}

function AppDialog({ dialog, onClose, onConfirm }: { dialog: DialogState; onClose: () => void; onConfirm: () => void }) {
  const app = appById(dialog.app);
  const connecting = dialog.kind === "connect";
  const title = connecting ? "Connect to the Apps" : `Disconnect ${app.name}?`;
  return (
    <Shell title={title} onClose={onClose} hideHeader width="max-w-[476px]" radius="sm:rounded-[12px]">
      <div className="flex items-center justify-between gap-4 border-b border-[#e2e8f0] px-5 py-4">
        <h2 className={`text-[16px] leading-[24px] text-[#1e293b] ${fontSemi}`}>{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="flex transition hover:opacity-70">
          <img src={imgClose} alt="" width={20} height={20} className="size-5" />
        </button>
      </div>
      <div className="flex flex-col gap-4 px-5 py-5">
        <div className="flex gap-4">
          <AppLogo app={app.id} size="size-10" />
          <div>
            <p className={`text-[14px] leading-[20px] text-[#1e293b] ${fontSemi}`}>{app.name}</p>
            <p className={`mt-0.5 text-[14px] leading-[20px] text-[#334155] ${fontRegular}`}>{app.description}</p>
          </div>
        </div>
        {connecting ? (
          <p className={`flex items-start gap-3 rounded-[6px] bg-[#ecfdf5] px-3 py-2.5 text-[12px] leading-[18px] text-[#047857] ${fontMedium}`}>
            <svg viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0" fill="#047857" aria-hidden="true">
              <circle cx="12" cy="12" r="11" />
              <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            If you connect your {app.short} calendar to this, you will receive all updates automatically.
          </p>
        ) : (
          <p className={`flex items-start gap-3 rounded-[6px] bg-[#fef2f2] px-3 py-2.5 text-[12px] leading-[18px] text-[#b91c1c] ${fontMedium}`}>
            <svg viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0" fill="#dc2626" aria-hidden="true">
              <path d="M12 2L1 21h22L12 2z" />
              <path d="M12 9v5M12 17.5v.01" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
            If you disconnect, you will no longer get updates in your {app.name}.
          </p>
        )}
      </div>
      <div className="flex items-center justify-end gap-6 border-t border-[#e2e8f0] px-5 py-5">
        <button type="button" onClick={onClose} className={`text-[16px] leading-[24px] text-[#1e293b] transition hover:text-[#64748b] ${fontMedium}`}>
          {connecting ? "Cancel" : "Not Now"}
        </button>
        <button type="button" onClick={onConfirm} className={`h-[36px] rounded-[8px] px-4 text-[16px] leading-[20px] transition ${connecting ? "bg-[#ffb20d] text-[#1e293b] hover:bg-[#faa104]" : "bg-[#dc2626] text-white hover:bg-[#b91c1c]"} ${fontMedium}`}>
          {connecting ? "Connect Now" : "Disconnect Now"}
        </button>
      </div>
    </Shell>
  );
}

function AppStore({ state, onDialog }: { state: AppsState; onDialog: (dialog: DialogState) => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const measure = () => {
    const el = scroller.current;
    if (el) setEdges({ start: el.scrollLeft <= 1, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 });
  };
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const move = (direction: number) => scroller.current?.scrollBy({ left: direction * 415, behavior: "smooth" });
  const arrow = (on: boolean) => `flex size-9 items-center justify-center rounded-[6px] text-[#334155] transition disabled:cursor-not-allowed disabled:opacity-40 ${on ? "bg-[#f1f5f9] hover:bg-[#e2e8f0]" : "hover:bg-[#f8fafc]"}`;

  return (
    <main className="flex flex-1 flex-col bg-white">
      <div className="border-b border-[#e2e8f0] px-4 py-6 md:px-7">
        <h1 className={titleClass} style={titleStyle}>
          App Store
        </h1>
      </div>
      <div className="flex flex-1 flex-col px-4 py-6 md:px-7">
        <section className="flex-1 overflow-hidden rounded-[12px] border border-[#e2e8f0] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className={`text-[18px] leading-[28px] text-[#1e293b] ${fontSemi}`}>All calendar apps</h2>
              <p className={`mt-1 text-[14px] leading-[20px] text-[#64748b] ${fontRegular}`}>Supercharge your workflow & connect the tool you use everyday.</p>
            </div>
            <div className="flex shrink-0 gap-2.5">
              <button type="button" aria-label="Previous apps" disabled={edges.start} onClick={() => move(-1)} className={arrow(!edges.start)}>
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
              <button type="button" aria-label="Next apps" disabled={edges.end} onClick={() => move(1)} className={arrow(!edges.end)}>
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
          <div ref={scroller} onScroll={measure} className="mt-6 flex gap-8 overflow-x-auto [scrollbar-width:none]">
            {APPS.map((app) => {
              const connected = Boolean(state.connections[app.id]);
              return (
                <article key={app.id} className="flex w-[382px] max-w-full shrink-0 flex-col rounded-[12px] border border-[#e2e8f0] p-6">
                  <div className="flex items-center gap-5 pl-1">
                    <AppLogo app={app.id} />
                    <h3 className={`text-[16px] leading-[24px] text-[#1e293b] ${fontSemi}`}>{app.name}</h3>
                  </div>
                  <p className={`mt-5 min-h-[72px] flex-1 text-[14px] leading-[24px] text-[#475569] ${fontRegular}`}>{app.description}</p>
                  <button type="button" onClick={() => onDialog(connected ? { kind: "disconnect", app: app.id, addToOnly: false } : { kind: "connect", app: app.id, forAddTo: false })} className={`mt-3 h-[43px] w-full rounded-[8px] text-[16px] leading-[20px] transition ${connected ? "bg-[#f1f5f9] text-[#dc2626] hover:bg-[#e2e8f0]" : "bg-[#1e293b] text-white hover:bg-[#0f172a]"} ${fontMedium}`}>
                    {connected ? "Disconnect" : "Connect"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

const addTrigger = (
  <>
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
    Add
  </>
);

function InstalledApps({ state, setState, onDialog }: { state: AppsState; setState: (next: AppsState) => void; onDialog: (dialog: DialogState) => void }) {
  const { notify } = useApp();
  const connected = APPS.filter((a) => state.connections[a.id]);
  const notConnected = APPS.filter((a) => !state.connections[a.id]);
  const addTriggerClass = `flex h-[35px] items-center gap-2 rounded-[8px] border border-[#cbd5e1] px-3 text-[14px] leading-[20px] text-[#334155] transition hover:bg-[#f8fafc] ${fontMedium}`;
  const emailOptions = [...new Set([...(state.addTo ? [state.addTo.email] : []), ...connected.map((a) => state.connections[a.id]!.email)])];
  const sectionTitle = `text-[14px] leading-[20px] text-[#0f172a] ${fontSemi}`;
  const sectionText = `mt-1 text-[12px] leading-[18px] text-[#64748b] ${fontRegular}`;

  const toggleCalendar = (id: AppId, name: string) => {
    const connection = state.connections[id]!;
    setState({ ...state, connections: { ...state.connections, [id]: { ...connection, calendars: connection.calendars.map((c) => (c.name === name ? { ...c, on: !c.on } : c)) } } });
  };

  return (
    <main className="flex flex-1 flex-col bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2e8f0] px-4 py-6 md:px-7">
        <h1 className={titleClass} style={titleStyle}>
          Installed Apps
        </h1>
        <button type="button" onClick={() => openInstructorApps("store")} className={`flex h-[36px] items-center gap-2 rounded-[8px] bg-[#ffb20d] px-3 text-[14px] leading-[20px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
          <img src={imgPlusSmall} alt="" width={18} height={18} className="size-[18px]" />
          Connect apps
        </button>
      </div>
      <div className="flex flex-1 flex-col px-4 py-6 md:px-7">
        <section className="flex flex-1 flex-col gap-5 rounded-[12px] border border-[#e2e8f0] p-6">
          <div>
            <h2 className={`text-[18px] leading-[28px] text-[#1e293b] ${fontSemi}`}>All connected apps</h2>
            <p className={`mt-1 text-[14px] leading-[20px] text-[#64748b] ${fontRegular}`}>Supercharge your workflow & connect the tool you use everyday.</p>
          </div>

          <div className="rounded-[12px] border border-[#e2e8f0]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1f5f9] px-6 py-4">
              <div>
                <h3 className={sectionTitle}>Add to calendar</h3>
                <p className={sectionText}>Select where new events should be added when you're booked.</p>
              </div>
              {state.addTo ? (
                <div className="flex flex-wrap items-center gap-4">
                  <p className={`flex items-center gap-2.5 text-[12px] leading-[18px] text-[#94a3b8] ${fontRegular}`}>
                    <span aria-hidden="true" className="size-2 rounded-full bg-[#10b981]" />
                    <span>
                      Connected with <span className="text-[#334155]">{state.addTo.email}</span>
                    </span>
                  </p>
                  <button type="button" onClick={() => onDialog({ kind: "disconnect", app: state.addTo!.app, addToOnly: true })} className={`flex h-[32px] items-center gap-2 rounded-[8px] border border-[#fca5a5] px-3 text-[14px] leading-[20px] text-[#dc2626] transition hover:bg-[#fef2f2] ${fontSemi}`}>
                    <UnlinkIcon />
                    Disconnect
                  </button>
                </div>
              ) : (
                <ActionMenu label="Add a calendar for new events" trigger={addTrigger} triggerClass={addTriggerClass} items={APPS.map((a) => ({ label: a.name, onClick: () => onDialog({ kind: "connect", app: a.id, forAddTo: true }) }))} />
              )}
            </div>
            <div className="flex flex-col gap-2 px-6 py-5">
              <p className={`text-[14px] leading-[20px] text-[#1e293b] ${fontRegular}`}>Add events to</p>
              <div className={`[&_button[aria-haspopup]]:h-[42px] [&_ul]:w-full ${state.addTo ? "" : "pointer-events-none"}`}>
                <FilterSelect
                  plain
                  label="Add events to"
                  value={state.addTo?.email ?? ""}
                  onChange={(email) => state.addTo && setState({ ...state, addTo: { ...state.addTo, email } })}
                  options={state.addTo ? emailOptions.map((email) => ({ value: email, label: email })) : [{ value: "", label: "" }]}
                />
              </div>
            </div>
          </div>

          <div className="rounded-[12px] border border-[#e2e8f0]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1f5f9] px-6 py-4">
              <div>
                <h3 className={sectionTitle}>Check for conflicts</h3>
                <p className={sectionText}>Choose the calendar that will be used to detect conflicts and prevent overlapping bookings.</p>
              </div>
              {notConnected.length > 0 ? (
                <ActionMenu label="Add a calendar to check for conflicts" trigger={addTrigger} triggerClass={addTriggerClass} items={notConnected.map((a) => ({ label: a.name, onClick: () => onDialog({ kind: "connect", app: a.id, forAddTo: false }) }))} />
              ) : (
                <button type="button" onClick={() => notify("All calendar apps are already connected")} className={addTriggerClass}>
                  {addTrigger}
                </button>
              )}
            </div>
            <div className="flex flex-col gap-4 p-4 md:px-6">
              {connected.length === 0 && <p className={`py-6 text-center text-[14px] leading-[24px] text-[#64748b] ${fontRegular}`}>No calendars connected yet.</p>}
              {connected.map((app) => {
                const connection = state.connections[app.id]!;
                return (
                  <article key={app.id} className="rounded-[12px] border border-[#e2e8f0]">
                    <div className="flex items-center gap-5 border-b border-[#f1f5f9] px-6 py-4">
                      <AppLogo app={app.id} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-[14px] leading-[22px] text-[#1e293b] ${fontSemi}`}>{app.name}</p>
                        <p className={`truncate text-[12px] leading-[18px] text-[#64748b] ${fontRegular}`}>{connection.email}</p>
                      </div>
                      <ActionMenu
                        label={`More actions for ${app.name}`}
                        triggerClass="flex size-8 shrink-0 items-center justify-center rounded-full text-[#475569] transition hover:bg-[#f1f5f9]"
                        trigger={
                          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
                            <circle cx="12" cy="5" r="1.7" />
                            <circle cx="12" cy="12" r="1.7" />
                            <circle cx="12" cy="19" r="1.7" />
                          </svg>
                        }
                        items={[{ label: "Disconnect", danger: true, icon: <UnlinkIcon />, onClick: () => onDialog({ kind: "disconnect", app: app.id, addToOnly: false }) }]}
                      />
                    </div>
                    <div className="flex flex-col gap-4 px-6 py-5">
                      <p className={`text-[12px] leading-[18px] text-[#94a3b8] ${fontRegular}`}>Toggle the calendars to check for conflicts to prevent double bookings</p>
                      {connection.calendars.map((calendar) => (
                        <div key={calendar.name} className="flex items-center gap-2.5">
                          <Toggle on={calendar.on} label={`Check ${calendar.name} for conflicts`} onChange={() => toggleCalendar(app.id, calendar.name)} />
                          <span className={`text-[14px] leading-[20px] text-[#334155] ${fontRegular}`}>{calendar.name}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function InstructorApps({ view }: { view: "store" | "installed" }) {
  const { notify } = useApp();
  const [state, setState] = useState<AppsState>(() => load(STORE_KEY, SEED));
  const [dialog, setDialog] = useState<DialogState | null>(null);

  useEffect(() => save(STORE_KEY, state), [state]);

  const confirm = () => {
    if (!dialog) return;
    const app = appById(dialog.app);
    if (dialog.kind === "connect") {
      setState((s) => ({
        connections: s.connections[app.id] ? s.connections : { ...s.connections, [app.id]: newConnection(app.id) },
        addTo: dialog.forAddTo ? { app: app.id, email: app.addToEmail } : s.addTo,
      }));
      notify(`${app.name} connected`);
    } else if (dialog.addToOnly) {
      setState((s) => ({ ...s, addTo: null }));
      notify(`${app.name} disconnected`);
    } else {
      setState((s) => {
        const { [app.id]: _removed, ...connections } = s.connections;
        return { connections, addTo: s.addTo?.app === app.id ? null : s.addTo };
      });
      notify(`${app.name} disconnected`);
    }
    setDialog(null);
  };

  return (
    <>
      {view === "store" ? <AppStore state={state} onDialog={setDialog} /> : <InstalledApps state={state} setState={setState} onDialog={setDialog} />}
      {dialog && <AppDialog dialog={dialog} onClose={() => setDialog(null)} onConfirm={confirm} />}
    </>
  );
}
