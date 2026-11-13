import { useId, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { uploadFile } from "../api";
import { shrinkImage } from "../imageShrink";
import { cardBrand, openAccount, useApp, useStoredState } from "../store";
import { BrandBadge } from "./CheckoutPage";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { AlertCircleIcon, CreditCardIcon, LockIcon, Notification01Icon, Shield01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { FilterSelect } from "./Menus";
import { Shell } from "./Overlays";

const imgCheckboxOn = "/assets/70227.svg";
const imgCloseAccount = "/assets/8c19a.png";

const sections: { id: string; label: string; icon: IconSvgElement }[] = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "security", label: "Security", icon: LockIcon },
  { id: "privacy", label: "Privacy", icon: Shield01Icon },
  { id: "notifications", label: "Notifications", icon: Notification01Icon },
  { id: "payment", label: "Payment Methods", icon: CreditCardIcon },
  { id: "close", label: "Close Account", icon: AlertCircleIcon },
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
const labelClass = `text-sm leading-5 text-slate-900 ${fontMedium}`;
const hintClass = `text-sm leading-5 text-slate-500 ${fontRegular}`;
// Help text under a field is smaller than the field text, so it never reads like a placeholder.
const helpClass = "field-help";
const primaryButton = `h-9 shrink-0 rounded-lg bg-secondary-500 px-4 text-sm text-slate-800 transition hover:bg-secondary-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-secondary-500 ${fontMedium}`;
const secondaryButton = `h-9 shrink-0 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white ${fontMedium}`;
const dangerButton = `h-9 shrink-0 rounded-lg bg-red-600 px-4 text-sm text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-red-600 ${fontMedium}`;


function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className={`text-sm leading-5 text-red-600 ${fontRegular}`}>
      {message}
    </p>
  );
}

export function TextField({ id, label, value, onChange, placeholder, error, hint, type = "text", required }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder?: string; error?: string; hint?: string; type?: string; required?: boolean }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelClass}>
        {label} {required && <span className={`text-slate-500 ${fontRegular}`}>(Required)</span>}
      </label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-invalid={!!error} aria-describedby={describedBy} className={fieldBox} />
      <FieldError id={id} message={error} />
      {hint && !error && (
        <p id={`${id}-hint`} className={helpClass}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function LinkField({ id, label, value, onChange, placeholder, prefix, icon, type = "text" }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder?: string; prefix?: string; icon: ReactNode; type?: string }) {
  const text = `text-base leading-5 md:text-sm ${fontRegular}`;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="field-box cursor-text" onClick={(e) => e.currentTarget.querySelector("input")?.focus()}>
        <span className="flex shrink-0">{icon}</span>
        <div className="flex min-w-0 flex-1 items-center">
          {prefix && <span className={`shrink-0 text-slate-500 ${text}`}>{prefix}</span>}
          <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400 ${text}`} />
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
      <FilterSelect plain id={id} label={label} value={value} onChange={onChange} placeholder={placeholder} options={options.map((o) => ({ value: o, label: o }))} />
    </div>
  );
}

export function CheckField({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
  return (
    <label className={`flex cursor-pointer items-start gap-2 text-sm leading-5 text-slate-600 ${fontRegular}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="mt-0.5 size-4 shrink-0 rounded-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-700">{checked ? <img src={imgCheckboxOn} alt="" width={16} height={16} className="block size-4" /> : <span className="block size-4 rounded-sm border border-slate-300 bg-white" />}</span>
      {children}
    </label>
  );
}

export function ToggleRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-6 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p id={`${id}-title`} className={labelClass}>
          {title}
        </p>
        <p id={`${id}-text`} className={`mt-0.5 ${hintClass}`}>
          {description}
        </p>
      </div>
      <button type="button" role="switch" aria-checked={checked} aria-labelledby={`${id}-title`} aria-describedby={`${id}-text`} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 ${checked ? "bg-primary-700" : "bg-slate-300"}`}>
        <span className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-0.5 pb-4">
      <h2 className={`m-0 text-lg leading-6.5 text-slate-900 ${fontHeading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
        {title}
      </h2>
      <p className={`text-sm leading-5.5 text-slate-500 ${fontRegular}`}>{subtitle}</p>
    </div>
  );
}

export function Card({ title, description, footer, danger, children }: { title: string; description?: string; footer?: ReactNode; danger?: boolean; children: ReactNode }) {
  return (
    <section className="border-t border-slate-200 py-5">
      <h3 className={`m-0 text-sm leading-5.5 ${danger ? "text-red-700" : "text-slate-900"} ${fontSemi}`}>{title}</h3>
      {description && <p className={`mt-0.5 ${hintClass}`}>{description}</p>}
      <div className="mt-3">
        {children}
        {footer && <div className="mt-4 flex items-center gap-3">{footer}</div>}
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
    // Large photos shrink automatically to under 1 MB.
    shrinkImage(file, MAX_PHOTO_BYTES)
      .then(async (small) => {
        const url = await uploadFile(small);
        if (url) return set("photo")(url);
        const reader = new FileReader();
        reader.onload = () => set("photo")(String(reader.result));
        reader.readAsDataURL(small);
      })
      .catch(() => notify("Photo upload failed. Please try again"));
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
            <img src={draft.photo} alt="Your profile" className="size-18 shrink-0 rounded-full object-cover" />
          ) : (
            <span aria-hidden="true" className={`flex size-18 shrink-0 items-center justify-center rounded-full bg-primary-700 text-2xl text-white ${fontSemi}`}>
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
                <button type="button" onClick={() => set("photo")("")} className={`h-9 rounded-lg px-3 text-sm text-red-600 transition hover:bg-red-50 ${fontMedium}`}>
                  Remove
                </button>
              )}
            </div>
            <p className={helpClass}>JPG or PNG. Large photos shrink automatically.</p>
          </div>
        </div>
      </Card>

      <Card title="Personal information" description="Your name and headline are shown on your public profile.">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField id="first-name" label="First name" value={draft.firstName} onChange={set("firstName")} />
            <TextField id="last-name" label="Last name" value={draft.lastName} onChange={set("lastName")} />
          </div>
          <TextField id="headline" label="Headline" value={draft.headline} onChange={set("headline")} placeholder="e.g. Product designer and lifelong learner" />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="biography" className={labelClass}>
              Biography
            </label>
            <textarea id="biography" value={draft.biography} onChange={(e) => set("biography")(e.target.value)} placeholder="e.g. I design mobile apps and spend my weekends learning data science." aria-describedby="biography-hint" className={fieldBox} />
            <p id="biography-hint" className={helpClass}>
              A few sentences about your background and interests.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField id="language" label="Language" value={draft.language} onChange={set("language")} placeholder="Select a language" options={languages} />
            <SelectField id="timezone" label="Time zone" value={draft.timezone} onChange={set("timezone")} placeholder="Select a time zone" options={timezones} />
          </div>
        </div>
      </Card>

      <Card title="Social links" description="Add links to help people find you elsewhere.">
        <div className="flex flex-col gap-4">
          <LinkField
            id="website"
            label="Website"
            type="url"
            value={draft.website}
            onChange={set("website")}
            placeholder="https://yourwebsite.com"
            icon={
              <svg viewBox="0 0 24 24" className="size-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z" />
              </svg>
            }
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <div className="flex items-center gap-3 border-t border-slate-200 py-4">
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
    <Shell title="Change Password" onClose={onClose} width="max-w-146.75" radius="sm:rounded-xl">
      <div className="flex flex-col gap-5 p-6">
        <p className={`text-sm leading-6 text-slate-700 ${fontRegular}`}>
          In-case you forgot your current password, proceed to{" "}
          <button
            type="button"
            onClick={() => {
              notify("A password reset link has been sent to your email");
              onClose();
            }}
            className="text-secondary-600 underline transition hover:text-amber-600"
          >
            forgot password
          </button>{" "}
          instead.
        </p>
        <TextField id="current-password" label="Current Password" required type="password" placeholder="********" value={values.current} onChange={set("current")} error={show("current")} />
        <TextField id="new-password" label="New Password" required type="password" placeholder="Enter your new password" value={values.next} onChange={set("next")} error={show("next")} hint="Use at least 8 characters." />
        <TextField id="confirm-password" label="Confirm New Password" required type="password" placeholder="Enter your confirmation password" value={values.confirm} onChange={set("confirm")} error={show("confirm")} />
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
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
        <div className="max-w-105">
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
        <div className="divide-y divide-slate-200">
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
        <div className="divide-y divide-slate-200">
          <ToggleRow title="Course recommendations" description="Suggested courses and helpful resources from Thkee." checked={saved.recommendations} onChange={(recommendations) => update({ recommendations })} />
          <ToggleRow title="Instructor announcements" description={'Updates from instructors of courses you\'re enrolled in. To change this for one course, open its dashboard and click "Options".'} checked={saved.announcements} onChange={(announcements) => update({ announcements })} />
          <ToggleRow title="Promotional emails" description="Offers and promotions. You'll still get important emails like purchase receipts." checked={!saved.noPromotions} onChange={(on) => update({ noPromotions: !on })} />
        </div>
      </Card>
    </div>
  );
}

// Standard card checksum, so obvious typos are caught before the card is saved.
function passesLuhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

function expiryError(expiry: string) {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!match) return "Enter the expiry date as MM/YY";
  const month = Number(match[1]);
  if (month < 1 || month > 12) return "Enter a month between 01 and 12";
  const now = new Date();
  const year = 2000 + Number(match[2]);
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) return "This card has expired";
  return "";
}

function AddCardDialog({ onClose }: { onClose: () => void }) {
  const { savedCards, addCard, notify } = useApp();
  const [values, setValues] = useState({ name: "", number: "", expiry: "", cvv: "" });
  const [makeDefault, setMakeDefault] = useState(savedCards.length === 0);
  const [submitted, setSubmitted] = useState(false);
  const digits = values.number.replace(/\D/g, "");
  const brand = cardBrand(digits);
  const duplicate = savedCards.some((c) => c.brand === brand && c.last4 === digits.slice(-4) && c.expiry === values.expiry);
  const errors = {
    name: values.name.trim() ? "" : "Enter the name shown on the card",
    number: digits.length < 13 || !passesLuhn(digits) ? "Enter a valid card number" : duplicate ? "This card is already saved" : "",
    expiry: expiryError(values.expiry),
    cvv: /^\d{3,4}$/.test(values.cvv) ? "" : "Enter the 3 or 4 digit code on the back of the card",
  };
  const show = (key: keyof typeof errors) => (submitted ? errors[key] : "");

  const setNumber = (v: string) =>
    setValues((s) => ({
      ...s,
      number: v
        .replace(/\D/g, "")
        .slice(0, 19)
        .replace(/(\d{4})(?=\d)/g, "$1 "),
    }));
  const setExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    setValues((s) => ({ ...s, expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }));
  };

  const save = () => {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    addCard({ brand, last4: digits.slice(-4), expiry: values.expiry, name: values.name.trim() }, makeDefault || savedCards.length === 0);
    notify(`${brand} ending in ${digits.slice(-4)} has been added`);
    onClose();
  };

  const field = (key: keyof typeof errors) => ({ "aria-invalid": !!show(key), "aria-describedby": show(key) ? `card-${key}-error` : undefined, className: fieldBox });

  return (
    <Shell title="Add a card" onClose={onClose} width="max-w-130" radius="sm:rounded-xl">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="card-name" className={labelClass}>
              Name on card
            </label>
            <input id="card-name" value={values.name} onChange={(e) => setValues((s) => ({ ...s, name: e.target.value }))} placeholder="e.g. Sara Ahmed" autoComplete="cc-name" {...field("name")} />
            <FieldError id="card-name" message={show("name")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="card-number" className={labelClass}>
              Card number
            </label>
            <div className="relative">
              <input id="card-number" value={values.number} onChange={(e) => setNumber(e.target.value)} placeholder="1234 5678 9012 3456" inputMode="numeric" autoComplete="cc-number" {...field("number")} className={`${fieldBox} pr-14`} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <BrandBadge brand={brand} />
              </span>
            </div>
            <FieldError id="card-number" message={show("number")} />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="card-expiry" className={labelClass}>
                Expiry date
              </label>
              <input id="card-expiry" value={values.expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/YY" inputMode="numeric" autoComplete="cc-exp" {...field("expiry")} />
              <FieldError id="card-expiry" message={show("expiry")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="card-cvv" className={labelClass}>
                Security code
              </label>
              <input id="card-cvv" type="password" value={values.cvv} onChange={(e) => setValues((s) => ({ ...s, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))} placeholder="CVV" inputMode="numeric" autoComplete="cc-csc" {...field("cvv")} />
              <FieldError id="card-cvv" message={show("cvv")} />
            </div>
          </div>
          {savedCards.length > 0 && (
            <CheckField checked={makeDefault} onChange={setMakeDefault}>
              Use as my default payment method
            </CheckField>
          )}
          <p className={helpClass}>We don't store your security code. You'll enter it each time you pay.</p>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button type="submit" className={primaryButton}>
            Save card
          </button>
        </div>
      </form>
    </Shell>
  );
}

function PaymentSection() {
  const { savedCards, removeCard, setDefaultCard } = useApp();
  const [adding, setAdding] = useState(false);
  return (
    <div className="flex flex-col">
      <SectionHeading title="Payment Methods" subtitle="Manage the cards saved to your account." />
      {savedCards.length === 0 ? (
        <div className="flex flex-col items-center border-t border-slate-200 px-4 py-8 text-center">
          <img src="/illustrations/credit-card.svg" alt="Credit card" width={1000} height={1000} className="float-y h-auto w-full max-w-40" />
          <h3 className={`m-0 mt-4 text-base leading-6 text-slate-900 ${fontSemi}`}>No saved cards yet</h3>
          <p className={`mt-1 max-w-90 ${hintClass}`}>Add a card to check out faster. Your default card is selected first at checkout.</p>
          <button type="button" onClick={() => setAdding(true)} className={`mt-5 ${primaryButton}`}>
            Add card
          </button>
        </div>
      ) : (
        <Card
          title="Saved cards"
          description="Your default card is selected first at checkout."
          footer={
            <button type="button" onClick={() => setAdding(true)} className={secondaryButton}>
              + Add card
            </button>
          }
        >
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
            {savedCards.map((c, i) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="flex h-8 w-12 shrink-0 items-center justify-center rounded-sm border border-slate-200 bg-white">
                  <BrandBadge brand={c.brand} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`flex items-center gap-2 ${labelClass}`}>
                    {c.brand} ending in {c.last4}
                    {i === 0 && <span className={`rounded-full bg-primary-100 px-2 py-0.5 text-xs leading-4 text-primary-700 ${fontMedium}`}>Default</span>}
                  </p>
                  <p className={hintClass}>
                    Expires {c.expiry}
                    {c.name && ` · ${c.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {i > 0 && (
                    <button type="button" onClick={() => setDefaultCard(c.id)} className={`h-9 rounded-lg px-3 text-sm text-slate-700 transition hover:bg-slate-100 ${fontMedium}`}>
                      Make default
                    </button>
                  )}
                  <button type="button" onClick={() => removeCard(c.id)} aria-label={`Remove ${c.brand} ending in ${c.last4}`} className={`h-9 rounded-lg px-3 text-sm text-red-600 transition hover:bg-red-50 ${fontMedium}`}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {adding && <AddCardDialog onClose={() => setAdding(false)} />}
    </div>
  );
}

function CloseAccountDialog({ onClose }: { onClose: () => void }) {
  const { closeAccount } = useApp();
  const [losesData, setLosesData] = useState(false);
  const [losesEmail, setLosesEmail] = useState(false);
  return (
    <Shell title="Close your account" onClose={onClose} width="max-w-146.75" radius="sm:rounded-xl" hideHeader>
      <div className="flex flex-col gap-8 p-6 sm:p-10">
        <div className="flex items-start gap-5.5">
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <p className={`text-2xl leading-7.5 tracking-tight text-black sm:text-3xl sm:leading-9 ${fontHeading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
              Are you sure you want to close your account?
            </p>
            <p className={`text-sm leading-6 text-slate-500 ${fontRegular}`}>Continue with closing requires you to confirm the information below</p>
          </div>
          <img src={imgCloseAccount} alt="" width={149} height={130} className="hidden h-32.5 w-37.25 shrink-0 object-cover sm:block" />
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
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
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
        <div className="flex flex-col gap-4">
          <ul className={`flex list-disc flex-col gap-1 pl-5 text-sm leading-6 text-slate-600 ${fontRegular}`}>
            <li>Closing your account is permanent and cannot be undone.</li>
            <li>Ensure you have saved any important information or data before proceeding.</li>
            <li>If you have any pending transactions or issues, please resolve them before closing your account.</li>
          </ul>
          <div className="flex max-w-105 flex-col gap-1.5">
            <label htmlFor="close-password" className={labelClass}>
              Current password
            </label>
            <div className="relative">
              <input id="close-password" type={visible ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!error} aria-describedby={error ? "close-password-error" : undefined} className={`${fieldBox} pr-10`} />
              <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center text-slate-500 transition hover:text-slate-900">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                  {!visible && <path d="M4 4l16 16" />}
                </svg>
              </button>
            </div>
            <FieldError id="close-password" message={error} />
            <p className={helpClass}>
              If you log in with Google, set a password in{" "}
              <button type="button" onClick={() => openAccount("security")} className={`text-slate-900 underline ${fontMedium}`}>
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
    <main className="w-full flex-1 bg-white pt-14">
      <div className="mx-auto flex max-w-318 flex-col gap-5 px-4 pb-10 pt-6 md:flex-row md:gap-10 md:pt-8">
        <aside className="shrink-0 md:w-55 md:self-start md:sticky md:top-22">
          <div>
            <h1 className="m-0 mb-3 font-instrument-medium text-xl font-medium leading-7 text-slate-900" style={{ fontVariationSettings: '"wdth" 100' }}>
              Account Settings
            </h1>
            <nav aria-label="Account settings" className="-mx-3 flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
              {sections.map((s) => {
                const active = s.id === current;
                const danger = s.id === "close";
                return (
                  <button key={s.id} type="button" aria-current={active ? "page" : undefined} onClick={() => openAccount(s.id)} className={`flex h-9 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 text-left text-sm transition-colors ${active ? (danger ? `bg-red-50 text-red-700 ${fontMedium}` : `bg-primary-100 text-primary-700 ${fontMedium}`) : danger ? `text-red-600 hover:bg-red-50 ${fontRegular}` : `text-slate-600 hover:bg-slate-100 hover:text-slate-900 ${fontRegular}`}`}>
                    <HugeiconsIcon icon={s.icon} size={18} strokeWidth={1.7} aria-hidden="true" className="shrink-0" />
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>
        <div className="min-w-0 max-w-180 flex-1">
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
