import { useId, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { fontBold, fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { openAccount, SAVED_CARD, useApp, useStoredState } from "../store";
import { Shell } from "./Overlays";

const imgCheckboxOn = "/assets/70227.svg";
const imgCloseAccount = "/assets/8c19a.png";

const sections: { id: string; label: string; icon: ReactNode }[] = [
  {
    id: "profile",
    label: "Profile",
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
      </>
    ),
  },
  {
    id: "security",
    label: "Security",
    icon: (
      <>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </>
    ),
  },
  {
    id: "privacy",
    label: "Privacy",
    icon: <path d="M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6z" />,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: (
      <>
        <path d="M6 16V10a6 6 0 0 1 12 0v6l2 2H4z" />
        <path d="M10 21h4" />
      </>
    ),
  },
  {
    id: "payment",
    label: "Payment Methods",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
      </>
    ),
  },
  {
    id: "close",
    label: "Close Account",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5.5M12 16.5v.01" />
      </>
    ),
  },
];
const languages = ["English", "Arabic"];
const timezones = ["(GMT+03:00) Riyadh", "(GMT+04:00) Dubai", "(GMT+03:00) Kuwait", "(GMT+02:00) Cairo", "(GMT+00:00) London", "(GMT+01:00) Paris", "(GMT-05:00) New York", "(GMT+06:00) Dhaka"];
const socials = [
  { key: "linkedin", label: "LinkedIn", prefix: "linkedin.com/in/", match: /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in\/)?/i, color: "#0a66c2", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
  { key: "twitter", label: "X (Twitter)", prefix: "x.com/", match: /^(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\//i, color: "#0f172a", path: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" },
  { key: "facebook", label: "Facebook", prefix: "facebook.com/", match: /^(?:https?:\/\/)?(?:www\.)?facebook\.com\//i, color: "#1877f2", path: "M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.026 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.971h-1.513c-1.491 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" },
  { key: "youtube", label: "YouTube", prefix: "youtube.com/@", match: /^(?:https?:\/\/)?(?:www\.)?youtube\.com\//i, color: "#ff0000", path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
] as const;
const MAX_PHOTO_BYTES = 1024 * 1024;

const fieldBox = "field";
const labelClass = `text-[14px] leading-[20px] text-[#0f172a] ${fontMedium}`;
const hintClass = `text-[14px] leading-[20px] text-[#64748b] ${fontRegular}`;
const primaryButton = `h-[36px] shrink-0 rounded-[8px] bg-[#ffb20d] px-4 text-[14px] text-[#1e293b] transition hover:bg-[#faa104] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#ffb20d] ${fontMedium}`;
const secondaryButton = `h-[36px] shrink-0 rounded-[8px] border border-[#cbd5e1] bg-white px-4 text-[14px] text-[#1e293b] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white ${fontMedium}`;
const dangerButton = `h-[36px] shrink-0 rounded-[8px] bg-[#dc2626] px-4 text-[14px] text-white transition hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#dc2626] ${fontMedium}`;

const borderFor = (error?: string) => (error ? "border-[#ef4444]" : "");

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className={`text-[14px] leading-[20px] text-[#dc2626] ${fontRegular}`}>
      {message}
    </p>
  );
}

export function TextField({ id, label, value, onChange, placeholder, error, hint, type = "text", required }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder?: string; error?: string; hint?: string; type?: string; required?: boolean }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelClass}>
        {label} {required && <span className={`text-[#64748b] ${fontRegular}`}>(Required)</span>}
      </label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-invalid={!!error} aria-describedby={describedBy} className={`${fieldBox} ${borderFor(error)}`} />
      <FieldError id={id} message={error} />
      {hint && !error && (
        <p id={`${id}-hint`} className={hintClass}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function LinkField({ id, label, value, onChange, placeholder, prefix, icon, type = "text" }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder?: string; prefix?: string; icon: ReactNode; type?: string }) {
  const text = `text-[16px] leading-[20px] md:text-[14px] ${fontRegular}`;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="field-box cursor-text" onClick={(e) => e.currentTarget.querySelector("input")?.focus()}>
        <span className="flex shrink-0">{icon}</span>
        <div className="flex min-w-0 flex-1 items-center">
          {prefix && <span className={`shrink-0 text-[#64748b] ${text}`}>{prefix}</span>}
          <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`min-w-0 flex-1 bg-transparent text-[#0f172a] outline-none placeholder:text-[#94a3b8] ${text}`} />
        </div>
      </div>
    </div>
  );
}

export function SelectField({ id, label, value, onChange, placeholder, options }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder: string; options: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${fieldBox} ${value ? "" : "text-[#94a3b8]"}`}>
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o} value={o} className="text-[#0f172a]">
              {o}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function CheckField({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
  return (
    <label className={`flex cursor-pointer items-start gap-2 text-[14px] leading-[20px] tracking-[-0.01px] text-[#475569] ${fontRegular}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="mt-0.5 size-4 shrink-0 rounded-[3.5px] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#0d5c4b]">{checked ? <img src={imgCheckboxOn} alt="" width={16} height={16} className="block size-4" /> : <span className="block size-4 rounded-[3.5px] border border-[#cbd5e1] bg-white" />}</span>
      {children}
    </label>
  );
}

export function ToggleRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p id={`${id}-title`} className={labelClass}>
          {title}
        </p>
        <p id={`${id}-text`} className={`mt-0.5 ${hintClass}`}>
          {description}
        </p>
      </div>
      <button type="button" role="switch" aria-checked={checked} aria-labelledby={`${id}-title`} aria-describedby={`${id}-text`} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d5c4b] ${checked ? "bg-[#0d5c4b]" : "bg-[#cbd5e1]"}`}>
        <span className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-1 pb-6">
      <h2 className={`m-0 text-[20px] leading-[28px] text-[#0f172a] ${fontHeading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
        {title}
      </h2>
      <p className={`text-[14px] leading-[22px] text-[#64748b] ${fontRegular}`}>{subtitle}</p>
    </div>
  );
}

export function Card({ title, description, footer, danger, children }: { title: string; description?: string; footer?: ReactNode; danger?: boolean; children: ReactNode }) {
  return (
    <section className="border-t border-[#e2e8f0] py-7">
      <h3 className={`m-0 text-[14px] leading-[22px] ${danger ? "text-[#b91c1c]" : "text-[#0f172a]"} ${fontSemi}`}>{title}</h3>
      {description && <p className={`mt-0.5 ${hintClass}`}>{description}</p>}
      <div className="mt-4">
        {children}
        {footer && <div className="mt-5 flex items-center gap-3">{footer}</div>}
      </div>
    </section>
  );
}

function ProfileSection() {
  const { user, updateUser, notify } = useApp();
  const [first = "", ...rest] = user?.name.split(" ") ?? [];
  const [profile, setProfile] = useStoredState("thkee.profile", { firstName: first, lastName: rest.join(" "), headline: "", language: "", biography: "", timezone: "", website: "", twitter: "", facebook: "", linkedin: "", youtube: "", photo: "" });
  const [draft, setDraft] = useState(profile);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (key: keyof typeof draft) => (value: string) => setDraft((d) => ({ ...d, [key]: value }));
  const initials = `${draft.firstName[0] ?? ""}${draft.lastName[0] ?? ""}`.toUpperCase() || "?";
  const dirty = JSON.stringify(draft) !== JSON.stringify(profile);

  const pickPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) return notify("Please choose a .jpg, .jpeg or .png file");
    if (file.size > MAX_PHOTO_BYTES) return notify("Please choose a photo under 1 MB");
    const reader = new FileReader();
    reader.onload = () => set("photo")(String(reader.result));
    reader.readAsDataURL(file);
  };

  const save = () => {
    setProfile(draft);
    const name = `${draft.firstName} ${draft.lastName}`.trim();
    if (name) updateUser({ name });
    notify("Your profile has been saved");
  };

  return (
    <div className="flex flex-col">
      <SectionHeading title="Profile" subtitle="Manage how you appear to students and instructors on Thkee." />

      <Card title="Profile photo">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          {draft.photo ? (
            <img src={draft.photo} alt="Your profile" className="size-[72px] shrink-0 rounded-full object-cover" />
          ) : (
            <span aria-hidden="true" className={`flex size-[72px] shrink-0 items-center justify-center rounded-full bg-[#0d5c4b] text-[24px] text-white ${fontSemi}`}>
              {initials}
            </span>
          )}
          <div className="flex flex-col items-start gap-2">
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={pickPhoto} className="sr-only" tabIndex={-1} aria-label="Profile photo" />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className={secondaryButton}>
                {draft.photo ? "Change photo" : "Upload photo"}
              </button>
              {draft.photo && (
                <button type="button" onClick={() => set("photo")("")} className={`h-[36px] rounded-[8px] px-3 text-[14px] text-[#dc2626] transition hover:bg-[#fef2f2] ${fontMedium}`}>
                  Remove
                </button>
              )}
            </div>
            <p className={hintClass}>JPG or PNG, up to 1 MB.</p>
          </div>
        </div>
      </Card>

      <Card title="Personal information" description="Your name and headline are shown on your public profile.">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField id="first-name" label="First name" value={draft.firstName} onChange={set("firstName")} />
            <TextField id="last-name" label="Last name" value={draft.lastName} onChange={set("lastName")} />
          </div>
          <TextField id="headline" label="Headline" value={draft.headline} onChange={set("headline")} placeholder="e.g. Product designer and lifelong learner" />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="biography" className={labelClass}>
              Biography
            </label>
            <textarea id="biography" value={draft.biography} onChange={(e) => set("biography")(e.target.value)} placeholder="Tell others a little about yourself" aria-describedby="biography-hint" className={fieldBox} />
            <p id="biography-hint" className={hintClass}>
              A few sentences about your background and interests.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <SelectField id="language" label="Language" value={draft.language} onChange={set("language")} placeholder="Select a language" options={languages} />
            <SelectField id="timezone" label="Time zone" value={draft.timezone} onChange={set("timezone")} placeholder="Select a time zone" options={timezones} />
          </div>
        </div>
      </Card>

      <Card title="Social links" description="Add links to help people find you elsewhere.">
        <div className="flex flex-col gap-5">
          <LinkField
            id="website"
            label="Website"
            type="url"
            value={draft.website}
            onChange={set("website")}
            placeholder="https://yourwebsite.com"
            icon={
              <svg viewBox="0 0 24 24" className="size-4 text-[#64748b]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z" />
              </svg>
            }
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {socials.map(({ key, label, prefix, match, color, path }) => (
              <LinkField
                key={key}
                id={key}
                label={label}
                value={draft[key]}
                onChange={(value) => set(key)(value.trim().replace(match, "").replace(/^@/, ""))}
                prefix={prefix}
                icon={
                  <svg viewBox="0 0 24 24" className="size-3.5" fill={color} aria-hidden="true">
                    <path d={path} />
                  </svg>
                }
              />
            ))}
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-3 border-t border-[#e2e8f0] py-4">
        <button type="button" disabled={!dirty} onClick={save} className={primaryButton}>
          Save changes
        </button>
        <button type="button" disabled={!dirty} onClick={() => setDraft(profile)} className={secondaryButton}>
          Cancel
        </button>
        {dirty && <p className={hintClass}>You have unsaved changes</p>}
      </div>
    </div>
  );
}

function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const { notify } = useApp();
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [submitted, setSubmitted] = useState(false);
  const errors = {
    current: values.current ? "" : "Enter your current password",
    next: values.next.length >= 8 ? "" : "Use at least 8 characters",
    confirm: values.confirm === values.next && values.confirm ? "" : "Passwords don't match",
  };
  const show = (key: keyof typeof errors) => (submitted ? errors[key] : "");
  const set = (key: keyof typeof values) => (value: string) => setValues((v) => ({ ...v, [key]: value }));

  const update = () => {
    setSubmitted(true);
    if (errors.current || errors.next || errors.confirm) return;
    notify("Your password has been updated");
    onClose();
  };

  return (
    <Shell title="Change Password" onClose={onClose} width="max-w-[587px]" radius="sm:rounded-[12px]">
      <div className="flex flex-col gap-5 p-6">
        <p className={`text-[14px] leading-[24px] text-[#334155] ${fontRegular}`}>
          In-case you forgot your current password, proceed to{" "}
          <button
            type="button"
            onClick={() => {
              notify("A password reset link has been sent to your email");
              onClose();
            }}
            className="text-[#faa104] underline transition hover:text-[#e08f00]"
          >
            forgot password
          </button>{" "}
          instead.
        </p>
        <TextField id="current-password" label="Current Password" required type="password" placeholder="********" value={values.current} onChange={set("current")} error={show("current")} />
        <TextField id="new-password" label="New Password" required type="password" placeholder="Enter your new password" value={values.next} onChange={set("next")} error={show("next")} hint="Use at least 8 characters." />
        <TextField id="confirm-password" label="Confirm New Password" required type="password" placeholder="Enter your confirmation password" value={values.confirm} onChange={set("confirm")} error={show("confirm")} />
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-[#e2e8f0] px-6 py-4">
        <button type="button" onClick={onClose} className={secondaryButton}>
          Cancel
        </button>
        <button type="button" onClick={update} className={primaryButton}>
          Update
        </button>
      </div>
    </Shell>
  );
}

function SecuritySection() {
  const { user, updateUser, notify } = useApp();
  const [email, setEmail] = useState(user?.email ?? "");
  const [emailError, setEmailError] = useState("");
  const [changing, setChanging] = useState(false);

  const updateEmail = () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setEmailError("Enter a valid email address");
    setEmailError("");
    updateUser({ email: email.trim() });
    notify("Your email address has been updated");
  };

  return (
    <div className="flex flex-col">
      <SectionHeading title="Security" subtitle="Keep your sign-in details up to date." />
      <Card
        title="Email address"
        description="This is the email you use to sign in."
        footer={
          <button type="button" disabled={email.trim() === (user?.email ?? "")} onClick={updateEmail} className={primaryButton}>
            Update email
          </button>
        }
      >
        <div className="max-w-[420px]">
          <TextField id="email" label="Email" type="email" placeholder="you@example.com" value={email} onChange={setEmail} error={emailError} />
        </div>
      </Card>
      <Card title="Password" description="Choose a strong password that you don't use anywhere else.">
        <button type="button" onClick={() => setChanging(true)} className={secondaryButton}>
          Change password
        </button>
      </Card>
      {changing && <ChangePasswordDialog onClose={() => setChanging(false)} />}
    </div>
  );
}

function PrivacySection() {
  const { notify } = useApp();
  const [saved, setSaved] = useStoredState("thkee.privacy", { showProfile: true, showCourses: false });
  const toggle = (key: keyof typeof saved) => (value: boolean) => {
    setSaved({ ...saved, [key]: value });
    notify("Your privacy settings have been updated");
  };
  return (
    <div className="flex flex-col">
      <SectionHeading title="Privacy" subtitle="Choose what other people can see on your profile page." />
      <Card title="Profile visibility">
        <div className="divide-y divide-[#e2e8f0]">
          <ToggleRow title="Show my profile" description="Let logged-in users view your profile." checked={saved.showProfile} onChange={toggle("showProfile")} />
          <ToggleRow title="Show my courses" description="Show the courses you are taking on your profile page." checked={saved.showCourses} onChange={toggle("showCourses")} />
        </div>
      </Card>
    </div>
  );
}

function NotificationsSection() {
  const { notify } = useApp();
  const [saved, setSaved] = useStoredState("thkee.notifications", { recommendations: true, announcements: false, noPromotions: true });
  const update = (changes: Partial<typeof saved>) => {
    setSaved({ ...saved, ...changes });
    notify("Your notification settings have been updated");
  };
  return (
    <div className="flex flex-col">
      <SectionHeading title="Notifications" subtitle="Choose the updates you want to receive from Thkee." />
      <Card title="Email notifications">
        <div className="divide-y divide-[#e2e8f0]">
          <ToggleRow title="Course recommendations" description="Suggested courses and helpful resources from Thkee." checked={saved.recommendations} onChange={(recommendations) => update({ recommendations })} />
          <ToggleRow title="Instructor announcements" description={'Updates from instructors of courses you\'re enrolled in. To change this for one course, open its dashboard and click "Options".'} checked={saved.announcements} onChange={(announcements) => update({ announcements })} />
          <ToggleRow title="Promotional emails" description="Offers and promotions. You'll still get important emails like purchase receipts." checked={!saved.noPromotions} onChange={(on) => update({ noPromotions: !on })} />
        </div>
      </Card>
    </div>
  );
}

function PaymentSection() {
  const { hasSavedCard, removeSavedCard } = useApp();
  return (
    <div className="flex flex-col">
      <SectionHeading title="Payment Methods" subtitle="Manage the cards saved to your account." />
      <Card title="Saved cards">
        {hasSavedCard ? (
          <div className="flex items-center gap-3">
            <span className={`flex h-[32px] w-[48px] shrink-0 items-center justify-center rounded-[4px] bg-[#1a4c9b] text-[12px] italic tracking-[0.5px] text-white ${fontBold}`}>VISA</span>
            <div className="min-w-0 flex-1">
              <p className={labelClass}>Visa ending in {SAVED_CARD.last4}</p>
              <p className={hintClass}>Expires {SAVED_CARD.expiry}</p>
            </div>
            <button type="button" onClick={removeSavedCard} className={secondaryButton}>
              Remove
            </button>
          </div>
        ) : (
          <p className={hintClass}>You have no saved payment methods.</p>
        )}
      </Card>
    </div>
  );
}

function CloseAccountDialog({ onClose }: { onClose: () => void }) {
  const { closeAccount } = useApp();
  const [losesData, setLosesData] = useState(false);
  const [losesEmail, setLosesEmail] = useState(false);
  return (
    <Shell title="Close your account" onClose={onClose} width="max-w-[587px]" radius="sm:rounded-[12px]" hideHeader>
      <div className="flex flex-col gap-8 p-6 sm:p-10">
        <div className="flex items-start gap-[22px]">
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <p className={`text-[24px] leading-[30px] tracking-[-0.5px] text-black sm:text-[30px] sm:leading-[36px] ${fontHeading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
              Are you sure you want to close your account?
            </p>
            <p className={`text-[14px] leading-[24px] tracking-[-0.01px] text-[#64748b] ${fontRegular}`}>Continue with closing requires you to confirm the information below</p>
          </div>
          <img src={imgCloseAccount} alt="" width={149} height={130} className="hidden h-[130px] w-[149px] shrink-0 object-cover sm:block" />
        </div>
        <div className="flex flex-col gap-3">
          <CheckField checked={losesData} onChange={setLosesData}>
            I understand all my data will be lost if I close my account
          </CheckField>
          <CheckField checked={losesEmail} onChange={setLosesEmail}>
            I understand my mail address will be permanently lost and can not be reclaimed
          </CheckField>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-[#e2e8f0] px-6 py-4">
        <button type="button" onClick={onClose} className={secondaryButton}>
          Cancel
        </button>
        <button type="button" disabled={!losesData || !losesEmail} onClick={closeAccount} className={dangerButton}>
          Yes, Close Account
        </button>
      </div>
    </Shell>
  );
}

function CloseSection() {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  const start = () => {
    if (!password) return setError("Enter your current password");
    setError("");
    setConfirming(true);
  };

  return (
    <div className="flex flex-col">
      <SectionHeading title="Close Account" subtitle="Permanently close your Thkee account." />
      <Card
        danger
        title="Before you close your account"
        footer={
          <button type="button" onClick={start} className={dangerButton}>
            Close Account
          </button>
        }
      >
        <div className="flex flex-col gap-5">
          <ul className={`flex list-disc flex-col gap-1 pl-5 text-[14px] leading-[24px] text-[#475569] ${fontRegular}`}>
            <li>Closing your account is permanent and cannot be undone.</li>
            <li>Ensure you have saved any important information or data before proceeding.</li>
            <li>If you have any pending transactions or issues, please resolve them before closing your account.</li>
          </ul>
          <div className="flex max-w-[420px] flex-col gap-1.5">
            <label htmlFor="close-password" className={labelClass}>
              Current password
            </label>
            <div className="relative">
              <input id="close-password" type={visible ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!error} aria-describedby={error ? "close-password-error" : undefined} className={`${fieldBox} pr-10 ${borderFor(error)}`} />
              <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center text-[#64748b] transition hover:text-[#0f172a]">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                  {!visible && <path d="M4 4l16 16" />}
                </svg>
              </button>
            </div>
            <FieldError id="close-password" message={error} />
            <p className={hintClass}>
              If you log in with Google, set a password in{" "}
              <button type="button" onClick={() => openAccount("security")} className={`text-[#0f172a] underline ${fontMedium}`}>
                Security settings
              </button>{" "}
              first.
            </p>
          </div>
        </div>
      </Card>
      {confirming && <CloseAccountDialog onClose={() => setConfirming(false)} />}
    </div>
  );
}

export default function AccountSettingsPage({ section }: { section: string }) {
  const current = sections.some((s) => s.id === section) ? section : "profile";

  return (
    <main className="w-full bg-white pt-[72px]">
      <div className="mx-auto flex max-w-[1272px] flex-col gap-6 px-4 pb-14 pt-8 md:flex-row md:gap-14 md:pt-10">
        <aside className="shrink-0 md:w-[232px]">
          <div className="md:sticky md:top-[112px]">
            <h1 className="m-0 mb-4 font-['Instrument_Sans:Medium'] text-[24px] font-medium leading-[32px] text-[#0f172a]" style={{ fontVariationSettings: '"wdth" 100' }}>
              Account Settings
            </h1>
            <nav aria-label="Account settings" className="-mx-3 flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
              {sections.map((s) => {
                const active = s.id === current;
                const danger = s.id === "close";
                return (
                  <button key={s.id} type="button" aria-current={active ? "page" : undefined} onClick={() => openAccount(s.id)} className={`flex h-[40px] shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[8px] px-3 text-left text-[14px] transition ${active ? (danger ? `bg-[#fef2f2] text-[#b91c1c] ${fontMedium}` : `bg-[#f1f5f9] text-[#0f172a] ${fontMedium}`) : danger ? `text-[#dc2626] hover:bg-[#fef2f2] ${fontRegular}` : `text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a] ${fontRegular}`}`}>
                    <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {s.icon}
                    </svg>
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>
        <div className="min-w-0 max-w-[720px] flex-1">
          {current === "profile" && <ProfileSection />}
          {current === "security" && <SecuritySection />}
          {current === "privacy" && <PrivacySection />}
          {current === "notifications" && <NotificationsSection />}
          {current === "payment" && <PaymentSection />}
          {current === "close" && <CloseSection />}
        </div>
      </div>
    </main>
  );
}
