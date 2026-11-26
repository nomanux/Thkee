import { useEffect, useState, type ReactNode } from "react";
import { fontMedium, fontRegular, fontSemi } from "../fonts";
import { load, openInstructorApps, save, useApp } from "../store";
import { Toggle } from "./InstructorAvailability";
import { ActionMenu } from "./Menus";
import Radio from "./Radio";
import { Shell } from "./Overlays";
import { buttonClass } from "./Button";

const imgClose = "/assets/53e9a.svg";

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
    <svg viewBox="0 0 24 24" className="size-4.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 7l2-2a4.5 4.5 0 016.5 6.5l-2 2M15 17l-2 2a4.5 4.5 0 01-6.5-6.5l2-2M9 15l6-6M4 4l2 2M20 20l-2-2" />
    </svg>
  );
}

function AppDialog({ dialog, onClose, onConfirm }: { dialog: DialogState; onClose: () => void; onConfirm: () => void }) {
  const app = appById(dialog.app);
  const connecting = dialog.kind === "connect";
  const title = connecting ? `Connect ${app.name}` : `Disconnect ${app.name}?`;
  return (
    <Shell title={title} onClose={onClose} hideHeader width="max-w-119" radius="sm:rounded-xl">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <h2 className={`text-base leading-6 text-slate-800 ${fontSemi}`}>{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="flex transition hover:opacity-70">
          <img src={imgClose} alt="" width={20} height={20} className="size-5" />
        </button>
      </div>
      <div className="flex flex-col gap-4 px-5 py-5">
        <div className="flex gap-4">
          <AppLogo app={app.id} size="size-10" />
          <div>
            <p className={`text-sm leading-5 text-slate-800 ${fontSemi}`}>{app.name}</p>
            <p className={`mt-0.5 text-sm leading-5 text-slate-700 ${fontRegular}`}>{app.description}</p>
          </div>
        </div>
        {connecting ? (
          <p className={`flex items-start gap-3 rounded-xl bg-primary-50 px-3 py-2.5 text-xs leading-4.5 text-primary-800 ${fontMedium}`}>
            <svg viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0" fill="#0d5c4b" aria-hidden="true">
              <circle cx="12" cy="12" r="11" />
              <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Your live sessions will be added to your {app.short} calendar, and busy times there will block new bookings.
          </p>
        ) : (
          <p className={`flex items-start gap-3 rounded-md bg-red-50 px-3 py-2.5 text-xs leading-4.5 text-red-700 ${fontMedium}`}>
            <svg viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0" fill="#dc2626" aria-hidden="true">
              <path d="M12 2L1 21h22L12 2z" />
              <path d="M12 9v5M12 17.5v.01" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
            If you disconnect, you will no longer get updates in your {app.name}.
          </p>
        )}
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-4">
        <button type="button" onClick={onClose} className={buttonClass("ghost", "md")}>
          {connecting ? "Cancel" : "Keep connected"}
        </button>
        <button type="button" onClick={onConfirm} className={buttonClass(connecting ? "primary" : "danger", "md")}>
          {connecting ? `Connect ${app.short}` : "Disconnect"}
        </button>
      </div>
    </Shell>
  );
}

const BENEFITS = ["Adds your live sessions to this calendar", "Blocks booking times when you're busy"];

type SoonId = "zoom" | "meet" | "teams";
const SOON: { id: SoonId; name: string; description: string }[] = [
  { id: "zoom", name: "Zoom", description: "Create a Zoom link for every live session automatically." },
  { id: "meet", name: "Google Meet", description: "Host live sessions on Google Meet without copying links." },
  { id: "teams", name: "Microsoft Teams", description: "Run your sessions in Teams with one click." },
];
const NOTIFY_KEY = "thkee.instructorApps.notify";

function SoonLogo({ app }: { app: SoonId }) {
  if (app === "zoom")
    return (
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#2d8cff" />
        <rect x="6" y="11" width="13" height="10" rx="2.5" fill="#fff" />
        <path d="M20 14.5l6-3.5v10l-6-3.5z" fill="#fff" />
      </svg>
    );
  if (app === "meet")
    return (
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#fff" stroke="#e2e8f0" />
        <rect x="6" y="10" width="14" height="12" rx="2" fill="#00ac47" />
        <path d="M20 14l6-4v12l-6-4z" fill="#ffba00" />
        <rect x="6" y="10" width="5" height="12" rx="2" fill="#2684fc" />
      </svg>
    );
  return (
    <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#5059c9" />
      <path d="M10 11h12v3h-4.5v9h-3v-9H10z" fill="#fff" />
    </svg>
  );
}

function AppStore({ state, onDialog }: { state: AppsState; onDialog: (dialog: DialogState) => void }) {
  const { notify } = useApp();
  const [notifyMe, setNotifyMe] = useState<SoonId[]>(() => load(NOTIFY_KEY, []));
  useEffect(() => save(NOTIFY_KEY, notifyMe), [notifyMe]);
  const connectedCount = APPS.filter((a) => state.connections[a.id]).length;
  const sectionTitle = `text-base leading-6 text-slate-900 ${fontSemi}`;
  const sectionText = `mt-0.5 text-sm leading-5 text-slate-500 ${fontRegular}`;

  return (
    <main className="flex flex-1 flex-col bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-4 py-6 md:px-7">
        <div className="min-w-0">
          <h1 className="m-0 font-instrument-medium text-2xl font-medium leading-8 text-slate-900" style={titleStyle}>
            App Store
          </h1>
          <p className={`mt-1 text-sm leading-5 text-slate-500 ${fontRegular}`}>Connect the tools you already use, so your live sessions and bookings stay in sync.</p>
        </div>
        <button type="button" onClick={() => openInstructorApps("installed")} className={buttonClass("secondary", "md")}>
          Installed apps
          <span className={`rounded-full bg-primary-100 px-2 py-0.5 text-11 leading-3.5 text-primary-700 ${fontSemi}`}>{connectedCount}</span>
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-7">
        <section aria-labelledby="calendar-apps">
          <h2 id="calendar-apps" className={sectionTitle}>
            Calendars
          </h2>
          <p className={sectionText}>Add sessions to your calendar and avoid double bookings.</p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {APPS.map((app) => {
              const connection = state.connections[app.id];
              return (
                <li key={app.id} className={`flex flex-col rounded-2xl border p-5 transition-colors ${connection ? "border-primary-200 bg-primary-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                  <div className="flex items-start gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200">
                      <AppLogo app={app.id} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-15 leading-5.5 text-slate-900 ${fontSemi}`}>{app.name}</h3>
                      {connection ? (
                        <p className={`mt-0.5 flex items-center gap-1.5 text-xs leading-4.5 text-primary-700 ${fontMedium}`}>
                          <span aria-hidden="true" className="size-1.5 rounded-full bg-primary-700" />
                          <span className="truncate">Connected · {connection.email}</span>
                        </p>
                      ) : (
                        <p className={`mt-0.5 text-xs leading-4.5 text-slate-500 ${fontRegular}`}>Not connected</p>
                      )}
                    </div>
                    {connection && (
                      <ActionMenu
                        label={`More actions for ${app.name}`}
                        triggerClass="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-900"
                        trigger={
                          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                            <circle cx="12" cy="5" r="1.8" />
                            <circle cx="12" cy="12" r="1.8" />
                            <circle cx="12" cy="19" r="1.8" />
                          </svg>
                        }
                        items={[{ label: "Disconnect", danger: true, icon: <UnlinkIcon />, onClick: () => onDialog({ kind: "disconnect", app: app.id, addToOnly: false }) }]}
                      />
                    )}
                  </div>
                  <p className={`mt-4 text-sm leading-5.5 text-slate-600 ${fontRegular}`}>{app.description}</p>
                  <ul className="mt-3 flex flex-1 flex-col gap-1.5">
                    {BENEFITS.map((benefit) => (
                      <li key={benefit} className={`flex items-start gap-2 text-13 leading-5 text-slate-600 ${fontRegular}`}>
                        <svg viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0 text-primary-700" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  {connection ? (
                    <button type="button" onClick={() => openInstructorApps("installed")} className={`${buttonClass("secondary", "md")} mt-5 w-full`}>
                      Manage
                    </button>
                  ) : (
                    <button type="button" onClick={() => onDialog({ kind: "connect", app: app.id, forAddTo: false })} className={`${buttonClass("primary", "md")} mt-5 w-full`}>
                      Connect
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="meeting-apps">
          <h2 id="meeting-apps" className={`flex items-center gap-2 ${sectionTitle}`}>
            Video meetings
            <span className={`rounded-full bg-slate-100 px-2 py-0.5 text-11 leading-3.5 text-slate-600 ${fontSemi}`}>Coming soon</span>
          </h2>
          <p className={sectionText}>Host live sessions in the meeting tool you prefer.</p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {SOON.map((app) => {
              const on = notifyMe.includes(app.id);
              return (
                <li key={app.id} className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 p-4">
                  <SoonLogo app={app.id} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm leading-5 text-slate-900 ${fontSemi}`}>{app.name}</p>
                    <p className={`text-xs leading-4.5 text-slate-500 ${fontRegular}`}>{app.description}</p>
                  </div>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setNotifyMe((list) => (on ? list.filter((id) => id !== app.id) : [...list, app.id]));
                      if (!on) notify(`We'll let you know when ${app.name} is ready`);
                    }}
                    className={buttonClass(on ? "soft" : "ghost", "md")}
                  >
                    {on ? "We'll notify you" : "Notify me"}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}

const dotsIcon = (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="12" cy="19" r="1.8" />
  </svg>
);
const plusIcon = (
  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/* One settings block: what it does on the left, the controls on the right (stacked on small screens). */
function SettingBlock({ id, title, text, children }: { id: string; title: string; text: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-4 border-b border-slate-200 py-8 first:pt-0 last:border-b-0 lg:grid-cols-3 lg:gap-10">
      <div>
        <h2 id={id} className={`text-base leading-6 text-slate-900 ${fontSemi}`}>
          {title}
        </h2>
        <p className={`mt-1 text-sm leading-5.5 text-slate-500 ${fontRegular}`}>{text}</p>
      </div>
      <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">{children}</div>
    </section>
  );
}

function InstalledApps({ state, setState, onDialog }: { state: AppsState; setState: (next: AppsState) => void; onDialog: (dialog: DialogState) => void }) {
  const connected = APPS.filter((a) => state.connections[a.id]);
  const notConnected = APPS.filter((a) => !state.connections[a.id]);
  const connectItems = notConnected.map((a) => ({ label: a.name, icon: <AppLogo app={a.id} size="size-4.5" />, onClick: () => onDialog({ kind: "connect", app: a.id, forAddTo: false }) }));

  const setCalendars = (id: AppId, on: (name: string, current: boolean) => boolean) => {
    const connection = state.connections[id]!;
    setState({ ...state, connections: { ...state.connections, [id]: { ...connection, calendars: connection.calendars.map((c) => ({ ...c, on: on(c.name, c.on) })) } } });
  };

  const choice = (checked: boolean, onSelect: () => void, body: ReactNode, key: string) => (
    <button
      key={key}
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${checked ? "border-primary-700 bg-primary-50 ring-1 ring-primary-700" : "border-slate-200 bg-white hover:border-slate-300"}`}
    >
      <Radio checked={checked} />
      {body}
    </button>
  );

  const connectRow = notConnected.length > 0 && (
    <ActionMenu
      alignLeft
      label="Connect another calendar"
      triggerClass={`flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 text-sm leading-5 text-slate-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 ${fontMedium}`}
      trigger={
        <>
          {plusIcon}
          Connect {connected.length ? "another" : "a"} calendar
        </>
      }
      items={connectItems}
    />
  );

  return (
    <main className="flex flex-1 flex-col bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-4 py-6 md:px-7">
        <div className="min-w-0">
          <h1 className="m-0 font-instrument-medium text-2xl font-medium leading-8 text-slate-900" style={titleStyle}>
            Installed Apps
          </h1>
          <p className={`mt-1 text-sm leading-5 text-slate-500 ${fontRegular}`}>Choose where new bookings go and which calendars block your free time.</p>
        </div>
        <button type="button" onClick={() => openInstructorApps("store")} className={buttonClass("secondary", "md")}>
          {plusIcon}
          Browse App Store
        </button>
      </div>

      <div className="flex w-full max-w-6xl flex-col px-4 py-8 md:px-7">
        <SettingBlock id="add-to-calendar" title="Add new bookings to" text="When a student books a live session, we create the event in this calendar.">
          {connected.length === 0 ? (
            <p className={`rounded-xl bg-slate-50 px-4 py-3 text-sm leading-5 text-slate-500 ${fontRegular}`}>Connect a calendar first, then pick where new bookings should go.</p>
          ) : (
            <div role="radiogroup" aria-labelledby="add-to-calendar" className="flex flex-col gap-2">
              {connected.map((app) => {
                const email = state.connections[app.id]!.email;
                const checked = state.addTo?.app === app.id;
                return choice(
                  checked,
                  () => setState({ ...state, addTo: { app: app.id, email } }),
                  <>
                    <AppLogo app={app.id} size="size-6" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={`text-sm leading-5 text-slate-900 ${checked ? fontSemi : fontMedium}`}>{app.name}</span>
                      <span className={`truncate text-xs leading-4.5 text-slate-500 ${fontRegular}`}>{email}</span>
                    </span>
                  </>,
                  app.id,
                );
              })}
              {choice(!state.addTo, () => setState({ ...state, addTo: null }), <span className={`flex-1 text-sm leading-5 text-slate-700 ${!state.addTo ? fontSemi : fontMedium}`}>Don't add bookings to a calendar</span>, "none")}
            </div>
          )}
        </SettingBlock>

        <SettingBlock id="check-conflicts" title="Check for conflicts" text="Busy times in the calendars you turn on are blocked, so students can't book over them.">
          {connected.map((app) => {
            const connection = state.connections[app.id]!;
            const onCount = connection.calendars.filter((c) => c.on).length;
            const allOn = onCount === connection.calendars.length;
            return (
              <article key={app.id} className="overflow-hidden rounded-xl border border-slate-200">
                <header className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-slate-200">
                    <AppLogo app={app.id} size="size-5.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm leading-5 text-slate-900 ${fontSemi}`}>{app.name}</p>
                    <p className={`truncate text-xs leading-4.5 text-slate-500 ${fontRegular}`}>{connection.email}</p>
                  </div>
                  <span className={`hidden rounded-full bg-primary-100 px-2 py-0.5 text-11 leading-4 text-primary-700 sm:inline ${fontSemi}`}>
                    {onCount} of {connection.calendars.length} on
                  </span>
                  <ActionMenu
                    label={`More actions for ${app.name}`}
                    triggerClass="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-900"
                    trigger={dotsIcon}
                    items={[
                      { label: allOn ? "Turn all off" : "Turn all on", onClick: () => setCalendars(app.id, () => !allOn) },
                      { label: "Disconnect", danger: true, icon: <UnlinkIcon />, onClick: () => onDialog({ kind: "disconnect", app: app.id, addToOnly: false }) },
                    ]}
                  />
                </header>
                <ul className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0">
                  {connection.calendars.map((calendar) => (
                    <li key={calendar.name} className="flex items-center justify-between gap-3 px-4 py-3 sm:border-b sm:border-slate-100 sm:odd:border-r">
                      <span className={`min-w-0 truncate text-sm leading-5 ${calendar.on ? "text-slate-800" : "text-slate-400"} ${fontRegular}`}>{calendar.name}</span>
                      <Toggle on={calendar.on} label={`Check ${calendar.name} for conflicts`} onChange={() => setCalendars(app.id, (name, on) => (name === calendar.name ? !on : on))} />
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
          {connectRow}
        </SettingBlock>
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
