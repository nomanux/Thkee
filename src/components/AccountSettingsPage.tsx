import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { fontBold, fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { openAccount, SAVED_CARD, useApp, useStoredState } from "../store";
import { Shell } from "./Overlays";

const imgCheckboxOn = "/assets/70227.svg";
const imgCloseAccount = "/assets/8c19a.png";

const sections = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
  { id: "privacy", label: "Privacy" },
  { id: "notifications", label: "Notifications" },
  { id: "payment", label: "Payment Methods" },
  { id: "close", label: "Close Account" },
];
const languages = ["English", "Arabic"];
const timezones = ["(GMT+03:00) Riyadh", "(GMT+04:00) Dubai", "(GMT+03:00) Kuwait", "(GMT+02:00) Cairo", "(GMT+00:00) London", "(GMT+01:00) Paris", "(GMT-05:00) New York", "(GMT+06:00) Dhaka"];
const socials = [
  { key: "twitter", label: "Twitter", prefix: "https://www.twitter.com/" },
  { key: "facebook", label: "Facebook", prefix: "https://www.facebook.com/" },
  { key: "linkedin", label: "LinkedIn", prefix: "https://www.linkedin.com/" },
  { key: "youtube", label: "YouTube", prefix: "https://www.youtube.com/" },
] as const;
const MAX_PHOTO_BYTES = 1024 * 1024;

const fieldText = "text-[16px] text-[#0f172a] outline-none placeholder:text-[#94a3b8] md:text-[14px]";
const fieldBox = `w-full rounded-[8px] border bg-white px-4 transition focus:border-[#faa104] ${fieldText} ${fontRegular}`;
const labelClass = `text-[14px] leading-[20px] text-[#0f172a] ${fontMedium}`;
const primaryButton = `h-[44px] rounded-[8px] bg-[#ffb20d] px-5 text-[14px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`;

const borderFor = (error?: string) => (error ? "border-[#ef4444]" : "border-[#e2e8f0]");

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className={`text-[12px] leading-[18px] text-[#dc2626] ${fontRegular}`}>
      {message}
    </p>
  );
}

function TextField({ id, label, value, onChange, placeholder, error, type = "text", height = "h-[52px]", required }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder?: string; error?: string; type?: string; height?: string; required?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={labelClass}>
        {label} {required && <span className={`text-[#64748b] ${fontRegular}`}>(Required)</span>}
      </label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className={`${fieldBox} ${height} ${borderFor(error)}`} />
      <FieldError id={id} message={error} />
    </div>
  );
}

function SelectField({ id, label, value, onChange, placeholder, options }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder: string; options: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${fieldBox} h-[52px] appearance-none border-[#e2e8f0] pr-10 ${value ? "" : "!text-[#94a3b8]"}`}>
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o} value={o} className="text-[#0f172a]">
              {o}
            </option>
          ))}
        </select>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#475569]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

function CheckField({ checked, onChange, children, hint }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className={`flex cursor-pointer items-start gap-2 text-[14px] leading-[20px] tracking-[-0.01px] text-[#475569] ${fontRegular}`}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="mt-0.5 size-4 shrink-0 rounded-[3.5px] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#0d5c4b]">{checked ? <img src={imgCheckboxOn} alt="" width={16} height={16} className="block size-4" /> : <span className="block size-4 rounded-[3.5px] border border-[#cbd5e1] bg-white" />}</span>
        {children}
      </label>
      {hint && <p className={`max-w-[520px] pl-6 text-[12px] leading-[18px] text-[#94a3b8] ${fontRegular}`}>{hint}</p>}
    </div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className={`m-0 text-[20px] leading-[28px] text-[#0f172a] ${fontHeading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
        {title}
      </h2>
      {subtitle && <p className={`text-[14px] leading-[24px] text-[#94a3b8] ${fontRegular}`}>{subtitle}</p>}
    </div>
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
    <div className="flex flex-col gap-6">
      <SectionHeading title="Profile" />
      <div className="mt-6 flex flex-col gap-6 sm:flex-row">
        {draft.photo ? (
          <img src={draft.photo} alt="Your profile" className="size-[84px] shrink-0 rounded-full object-cover" />
        ) : (
          <span aria-hidden="true" className={`flex size-[84px] shrink-0 items-center justify-center rounded-full bg-[#0d5c4b] text-[24px] text-white ${fontSemi}`}>
            {initials}
          </span>
        )}
        <div className="flex flex-col items-start gap-4">
          <p className={`text-[16px] leading-[24px] text-[#0f172a] ${fontSemi}`}>Profile photo</p>
          <p className={`text-[14px] leading-[22px] text-[#475569] ${fontRegular}`}>Upload your profile photo here. Supported files are .jpg, .jpeg, or .png.</p>
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={pickPhoto} className="sr-only" tabIndex={-1} aria-label="Profile photo" />
          <button type="button" onClick={() => fileRef.current?.click()} className={primaryButton}>
            Browse Files
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
        <TextField id="first-name" label="First Name" value={draft.firstName} onChange={set("firstName")} />
        <TextField id="last-name" label="Last Name" value={draft.lastName} onChange={set("lastName")} />
        <TextField id="headline" label="Headline" value={draft.headline} onChange={set("headline")} />
        <SelectField id="language" label="Language" value={draft.language} onChange={set("language")} placeholder="Enter your language" options={languages} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="biography" className={labelClass}>
          Biography
        </label>
        <textarea id="biography" value={draft.biography} onChange={(e) => set("biography")(e.target.value)} className={`${fieldBox} h-[110px] resize-y border-[#e2e8f0] py-3 leading-[22px]`} />
      </div>
      <SelectField id="timezone" label="Time zone" value={draft.timezone} onChange={set("timezone")} placeholder="Enter your timezone" options={timezones} />

      <h3 className="m-0 mt-2 font-['Instrument_Sans:Medium'] text-[24px] font-medium leading-[32px] text-[#0f172a]" style={{ fontVariationSettings: '"wdth" 100' }}>
        Socials
      </h3>
      <TextField id="website" label="Website" value={draft.website} onChange={set("website")} type="url" />
      {socials.map(({ key, label, prefix }) => (
        <div key={key} className="flex flex-col gap-2">
          <label htmlFor={key} className={`text-[14px] leading-[20px] text-[#475569] ${fontRegular}`}>
            {label}
          </label>
          <div className="flex h-[56px] overflow-hidden rounded-[8px] border border-[#cbd5e1] transition focus-within:border-[#faa104]">
            <span className={`flex shrink-0 items-center border-r border-[#cbd5e1] bg-[#f1f5f9] px-3 text-[12px] text-[#475569] sm:text-[14px] ${fontRegular}`}>{prefix}</span>
            <input id={key} value={draft[key]} onChange={(e) => set(key)(e.target.value)} className={`min-w-0 flex-1 bg-white px-4 ${fieldText} ${fontRegular}`} />
          </div>
        </div>
      ))}
      <button type="button" onClick={save} className={`${primaryButton} mt-2 self-start`}>
        Save Changes
      </button>
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
        <TextField id="current-password" label="Current Password" required type="password" height="h-[44px]" placeholder="********" value={values.current} onChange={set("current")} error={show("current")} />
        <TextField id="new-password" label="New Password" required type="password" height="h-[44px]" placeholder="Enter your new password" value={values.next} onChange={set("next")} error={show("next")} />
        <TextField id="confirm-password" label="Confirm New Password" required type="password" height="h-[44px]" placeholder="Enter your confirmation password" value={values.confirm} onChange={set("confirm")} error={show("confirm")} />
      </div>
      <div className="flex items-center justify-end gap-4 border-t border-[#e2e8f0] px-6 py-4">
        <button type="button" onClick={onClose} className={`h-[44px] rounded-[8px] px-4 text-[14px] text-[#1e293b] transition hover:bg-[#f1f5f9] ${fontMedium}`}>
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
    <div className="flex flex-col gap-10">
      <SectionHeading title="Security" subtitle="Make sure your credentials are up to date" />
      <div className="flex max-w-[516px] flex-col items-start gap-4">
        <div className="w-full">
          <TextField id="email" label="Email Address" type="email" height="h-[44px]" placeholder="ibrahim@thkee.com" value={email} onChange={setEmail} error={emailError} />
        </div>
        <button type="button" onClick={updateEmail} className={primaryButton}>
          Update
        </button>
      </div>
      <div className="flex flex-col items-start gap-4">
        <h3 className={`m-0 text-[16px] leading-[24px] text-[#0f172a] ${fontMedium}`}>Change Password</h3>
        <p className={`max-w-[640px] text-[14px] leading-[24px] text-[#475569] ${fontRegular}`}>You can change your password by clicking the button below. Please do not forget your password as we will not be able to retrieve your raw password.</p>
        <button type="button" onClick={() => setChanging(true)} className={`h-[44px] rounded-[8px] bg-[#1e293b] px-5 text-[14px] text-white transition hover:bg-[#0f172a] ${fontMedium}`}>
          Change Password
        </button>
      </div>
      {changing && <ChangePasswordDialog onClose={() => setChanging(false)} />}
    </div>
  );
}

function PrivacySection() {
  const { notify } = useApp();
  const [saved, setSaved] = useStoredState("thkee.privacy", { showProfile: true, showCourses: false });
  const [draft, setDraft] = useState(saved);
  return (
    <div className="flex flex-col gap-8">
      <SectionHeading title="Privacy" subtitle="Set your profile page settings" />
      <div className="flex flex-col gap-3">
        <CheckField checked={draft.showProfile} onChange={(showProfile) => setDraft((d) => ({ ...d, showProfile }))}>
          Show your profile to logged-in users
        </CheckField>
        <CheckField checked={draft.showCourses} onChange={(showCourses) => setDraft((d) => ({ ...d, showCourses }))}>
          Show courses you are taking on your profile page
        </CheckField>
      </div>
      <button type="button" onClick={() => (setSaved(draft), notify("Your privacy settings have been updated"))} className={`${primaryButton} self-start`}>
        Update
      </button>
    </div>
  );
}

function NotificationsSection() {
  const { notify } = useApp();
  const [saved, setSaved] = useStoredState("thkee.notifications", { recommendations: true, announcements: false, noPromotions: true });
  const [draft, setDraft] = useState(saved);
  return (
    <div className="flex flex-col gap-8">
      <SectionHeading title="Notifications" subtitle="Set the notifications you want to receive here" />
      <div className="flex flex-col gap-3">
        <CheckField checked={draft.recommendations} onChange={(recommendations) => setDraft((d) => ({ ...d, recommendations }))}>
          Course recommendations, promotions, and helpful resources from Thkee
        </CheckField>
        <CheckField checked={draft.announcements} onChange={(announcements) => setDraft((d) => ({ ...d, announcements }))} hint={'To adjust this preference by course, leave this box checked and go to the course dashboard and click on "Options" to opt in or out of specific announcements'}>
          Announcements from instructors whose courses I'm enrolled in.
        </CheckField>
        <CheckField checked={draft.noPromotions} onChange={(noPromotions) => setDraft((d) => ({ ...d, noPromotions }))} hint="If this is checked, please note that you will continue to receive important transactional emails like purchase receipts.">
          Don't send me any promotional emails.
        </CheckField>
      </div>
      <button type="button" onClick={() => (setSaved(draft), notify("Your notification settings have been updated"))} className={`${primaryButton} self-start`}>
        Update
      </button>
    </div>
  );
}

function PaymentSection() {
  const { hasSavedCard, removeSavedCard } = useApp();
  return (
    <div className="flex flex-col gap-8">
      <SectionHeading title="Payment Methods" subtitle="Your saved payment methods" />
      {hasSavedCard ? (
        <div className="flex items-center gap-3 rounded-[6px] border border-[#e2e8f0] p-3">
          <span className={`flex h-[32px] w-[48px] shrink-0 items-center justify-center rounded-[4px] bg-[#1a4c9b] text-[12px] italic tracking-[0.5px] text-white ${fontBold}`}>VISA</span>
          <div className="min-w-0 flex-1">
            <p className={`text-[14px] leading-[20px] text-[#334155] ${fontMedium}`}>**** **** **** {SAVED_CARD.last4}</p>
            <p className={`text-[12px] leading-[18px] text-[#64748b] ${fontRegular}`}>Expiration {SAVED_CARD.expiry}</p>
          </div>
          <button type="button" onClick={removeSavedCard} className={`h-[36px] shrink-0 rounded-[8px] bg-[#f1f5f9] px-3 text-[14px] text-[#475569] transition hover:bg-[#e2e8f0] ${fontMedium}`}>
            Remove
          </button>
        </div>
      ) : (
        <p className={`text-[14px] leading-[24px] text-[#64748b] ${fontRegular}`}>You have no saved payment methods.</p>
      )}
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
            <p className={`text-[14px] leading-[24px] tracking-[-0.01px] text-[#94a3b8] ${fontRegular}`}>Continue with closing requires you to confirm the information below</p>
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
      <div className="flex items-center justify-end gap-4 border-t border-[#e2e8f0] px-6 py-4">
        <button type="button" onClick={onClose} className={`h-[44px] rounded-[8px] px-4 text-[16px] tracking-[-0.01px] text-[#1e293b] transition hover:bg-[#f1f5f9] ${fontMedium}`}>
          Cancel
        </button>
        <button type="button" disabled={!losesData || !losesEmail} onClick={closeAccount} className={`h-[44px] rounded-[8px] bg-[#ef4444] px-5 text-[16px] tracking-[-0.01px] text-white transition hover:bg-[#dc2626] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#ef4444] ${fontMedium}`}>
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
    <div className="flex flex-col gap-8">
      <SectionHeading title="Close your Account" />
      <div className="flex flex-col gap-3">
        <h3 className={`m-0 text-[14px] leading-[24px] text-[#0f172a] ${fontSemi}`}>Important Considerations:</h3>
        <ul className={`flex list-disc flex-col gap-1 pl-5 text-[14px] leading-[24px] text-[#475569] ${fontRegular}`}>
          <li>Closing your account is permanent and cannot be undone.</li>
          <li>Ensure you have saved any important information or data before proceeding.</li>
          <li>If you have any pending transactions or issues, please resolve them before closing your account.</li>
        </ul>
      </div>
      <div className="flex max-w-[516px] flex-col items-start gap-4">
        <div className="flex w-full flex-col gap-2">
          <label htmlFor="close-password" className={labelClass}>
            Current password
          </label>
          <div className="relative">
            <input id="close-password" type={visible ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!error} aria-describedby={error ? "close-password-error" : undefined} className={`${fieldBox} h-[44px] pr-11 ${borderFor(error)}`} />
            <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center text-[#64748b] transition hover:text-[#0f172a]">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
                {!visible && <path d="M4 4l16 16" />}
              </svg>
            </button>
          </div>
          <FieldError id="close-password" message={error} />
          <p className={`text-[12px] leading-[18px] text-[#94a3b8] ${fontRegular}`}>
            If you login with google you need to set a password in{" "}
            <button type="button" onClick={() => openAccount("security")} className={`text-[#0f172a] underline ${fontSemi}`}>
              Security settings
            </button>
          </p>
        </div>
        <button type="button" onClick={start} className={`h-[44px] rounded-[8px] bg-[#ef4444] px-5 text-[14px] text-white transition hover:bg-[#dc2626] ${fontMedium}`}>
          Close Account
        </button>
      </div>
      {confirming && <CloseAccountDialog onClose={() => setConfirming(false)} />}
    </div>
  );
}

export default function AccountSettingsPage({ section }: { section: string }) {
  const current = sections.some((s) => s.id === section) ? section : "profile";

  return (
    <main className="w-full bg-white pt-[72px]">
      <div className="bg-[#f1f5f9] px-4 md:px-8 xl:px-20">
        <h1 className="mx-auto m-0 flex h-[112px] max-w-[1280px] items-center font-['Instrument_Sans:Medium'] text-[24px] font-medium leading-[32px] text-[#0f172a]" style={{ fontVariationSettings: '"wdth" 100' }}>
          Account Settings
        </h1>
      </div>
      <div className="mx-auto flex max-w-[1440px] flex-col md:flex-row">
        <aside className="shrink-0 border-b border-[#e2e8f0] px-4 py-4 md:w-[260px] md:border-b-0 md:border-r md:py-6 md:pl-8 md:pr-6 xl:w-[385px] xl:pl-[104px]">
          <nav aria-label="Account settings" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            {sections.map((s) => (
              <button key={s.id} type="button" aria-current={s.id === current ? "page" : undefined} onClick={() => openAccount(s.id)} className={`flex h-[48px] shrink-0 items-center whitespace-nowrap rounded-[8px] border px-4 text-left text-[14px] transition ${s.id === current ? `border-[#f1f5f9] bg-[#f8fafc] text-[#0f172a] ${fontMedium}` : `border-transparent text-[#64748b] hover:text-[#0f172a] ${fontRegular}`}`}>
                {s.label}
              </button>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1 px-4 pb-14 pt-8 md:px-10 md:pt-12">
          <div className="max-w-[716px]">
            {current === "profile" && <ProfileSection />}
            {current === "security" && <SecuritySection />}
            {current === "privacy" && <PrivacySection />}
            {current === "notifications" && <NotificationsSection />}
            {current === "payment" && <PaymentSection />}
            {current === "close" && <CloseSection />}
          </div>
        </div>
      </div>
    </main>
  );
}
