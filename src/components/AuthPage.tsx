import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import { fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { useApp } from "../store";
import { buttonClass } from "./Button"

const CODE_LENGTH = 6;
const RESEND_SECONDS = 120;

const primaryBtn = `flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-800 text-base text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50 ${fontMedium}`;
const inputCls = "field";

function Mark() {
  return (
    <span className="flex size-14 items-center justify-center rounded-xl bg-secondary-500 shadow-xl shadow-secondary-500/52" aria-hidden="true">
      <svg width="30" height="20" viewBox="0 0 30 20" fill="none">
        <path d="M11 3L4 10l7 7" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="17.5" cy="10" r="3" fill="white" />
        <circle cx="25.5" cy="10" r="3" fill="white" />
      </svg>
    </span>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function CodeInputs({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const fill = (start: number, digits: string) => {
    const next = [...value];
    digits
      .slice(0, CODE_LENGTH - start)
      .split("")
      .forEach((d, i) => (next[start + i] = d));
    onChange(next);
    refs.current[Math.min(start + digits.length, CODE_LENGTH - 1)]?.focus();
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      e.preventDefault();
      const next = [...value];
      next[i - 1] = "";
      onChange(next);
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < CODE_LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const onPaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!digits) return;
    e.preventDefault();
    fill(i, digits);
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label="Verification code">
      {value.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={digit}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1}`}
          maxLength={CODE_LENGTH}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            if (!digits) {
              const next = [...value];
              next[i] = "";
              onChange(next);
            } else fill(i, digits.length > 1 && digit ? digits.replace(digit, "") || digits : digits);
          }}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={(e) => onPaste(i, e)}
          onFocus={(e) => e.target.select()}
          className={`size-11 rounded-lg border text-center text-lg text-slate-900 outline-none transition sm:size-11.5 ${fontMedium} ${
            digit ? "border-slate-200 bg-slate-150" : "border-transparent bg-slate-150"
          } focus:border-slate-800 focus:bg-white`}
        />
      ))}
    </div>
  );
}

export default function AuthPage() {
  const { user, lang, setLang, setOverlay, signIn, goHome } = useApp();
  const [step, setStep] = useState<"email" | "code" | "details">("email");
  const [email, setEmail] = useState("");
  const [sends, setSends] = useState(0);
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [names, setNames] = useState({ first: "", last: "" });
  const [langOpen, setLangOpen] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && step !== "details") goHome();
  }, []);

  useEffect(() => {
    if (step === "email") emailRef.current?.focus();
    if (step === "details") firstRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (step !== "code" || secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [step, secondsLeft]);

  const sendCode = () => {
    setSends((n) => n + 1);
    setCode(Array(CODE_LENGTH).fill(""));
    setSecondsLeft(RESEND_SECONDS);
  };

  const submitEmail = (e: FormEvent) => {
    e.preventDefault();
    sendCode();
    setStep("code");
  };

  const submitCode = (e: FormEvent) => {
    e.preventDefault();
    setStep("details");
  };

  const submitDetails = (e: FormEvent) => {
    e.preventDefault();
    const name = `${names.first.trim()} ${names.last.trim()}`.trim() || shownEmail.split("@")[0];
    signIn({ name, email: shownEmail });
  };

  const shownEmail = email.trim() || "you@example.com";
  const mmss = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return (
    <div className="flex min-h-dvh w-full flex-col bg-slate-25">
      <header className="mx-auto flex w-full max-w-310 items-center justify-between px-5 py-6 md:px-8 md:py-8">
        <button type="button" onClick={goHome} aria-label="Thkee home">
          <img src="/assets/logo-dark.svg" alt="Thkee" className="h-7 w-23.75" />
        </button>
        <div className="relative">
          <button type="button" aria-expanded={langOpen} onClick={() => setLangOpen((o) => !o)} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-800 hover:bg-slate-150 ${fontMedium}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
            </svg>
            {lang === "AR" ? "العربية" : "English"}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className={langOpen ? "rotate-180" : ""}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {langOpen && (
            <div className="pop-in absolute right-0 top-full mt-1.5 z-10 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-2xl">
              {(["EN", "AR"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    setLang(l);
                    setLangOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-150 ${fontMedium}`}
                >
                  {l === "AR" ? "العربية" : "English"}
                  {lang === l && <span className="text-primary-700">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-10 pt-2 sm:pt-6">
        <div key={step} className="fade-up w-full max-w-128 rounded-2xl border border-slate-150 bg-white px-6 py-9 shadow-lg sm:px-13 sm:py-10">
          {step === "email" && (
            <form onSubmit={submitEmail} noValidate className="flex flex-col">
              <div className="flex flex-col items-center gap-5">
                <Mark />
                <h1 className={`m-0 text-center text-2xl text-slate-800 ${fontHeading}`}>Get started with Thkee</h1>
              </div>
              <button
                type="button"
                onClick={() => {
                  sendCode();
                  setStep("code");
                }}
                className={`mt-8 flex h-14 w-full items-center justify-center gap-2.5 rounded-lg border border-slate-200 bg-white text-base text-slate-800 transition hover:border-slate-300 hover:bg-slate-25 ${fontMedium}`}
              >
                <GoogleIcon />
                Continue with Google
              </button>
              <div className={`my-7 flex items-center gap-4 text-xs uppercase text-slate-500 ${fontMedium}`}>
                <span className="h-px flex-1 bg-slate-200" />
                or
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <label htmlFor="auth-email" className={`mb-2 text-base text-slate-800 ${fontMedium}`}>
                Email
              </label>
              <div className="relative">
                <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
                <input
                  ref={emailRef}
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className={`${inputCls} pl-11`}
                />
              </div>
              <button type="submit" className={`${primaryBtn} mt-5`}>
                Continue With Email
              </button>
              <p className={`mt-16 text-center text-xs leading-5 text-slate-400 ${fontRegular}`}>
                You acknowledge that you read, and agree to our
                <br />
                <button type="button" onClick={() => setOverlay({ type: "info", page: "Terms of Service" })} className="text-slate-800 underline underline-offset-2">
                  Terms of Service
                </button>{" "}
                and{" "}
                <button type="button" onClick={() => setOverlay({ type: "info", page: "Privacy Policy" })} className="text-slate-800 underline underline-offset-2">
                  Privacy Policy.
                </button>
              </p>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={submitCode} noValidate className="flex flex-col items-center">
              <Mark />
              <h1 className={`m-0 mt-5 text-center text-2xl text-slate-800 ${fontHeading}`}>Verify it’s you</h1>
              <p className={`mt-5 text-center text-sm leading-5.5 text-slate-500 ${fontRegular}`}>
                we’ve sent a temporary login code to
                <br />
                <span className="break-all text-slate-900">{shownEmail}</span>{" "}
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className={`text-secondary-600 hover:underline ${fontMedium}`}
                >
                  Change
                </button>
              </p>
              <div className="mt-7 w-full">
                <CodeInputs
                  key={sends}
                  value={code}
                  onChange={setCode}
                />
              </div>
              <button type="submit" className={`${primaryBtn} mt-5`}>
                Continue
              </button>
              <p className={`mt-5 text-center text-sm text-slate-500 ${fontRegular}`}>
                Didn’t receive code?{" "}
                {secondsLeft > 0 ? (
                  <>
                    Resend in <span className="text-slate-900 tabular-nums">{mmss}</span>
                  </>
                ) : (
                  <button type="button" onClick={sendCode} className={`text-secondary-600 hover:underline ${fontMedium}`}>
                    Resend
                  </button>
                )}
              </p>

            </form>
          )}

          {step === "details" && (
            <form onSubmit={submitDetails} noValidate className="flex flex-col">
              <Mark />
              <h1 className={`m-0 mt-5 text-xl text-slate-800 sm:text-22 ${fontHeading}`}>Just a few more details to get started</h1>
              <p className={`mt-2 text-sm text-slate-600 ${fontRegular}`}>This helps personalize your experience on Thkee.</p>
              <div className={`mt-6 flex flex-wrap items-center gap-2 text-sm text-slate-700 ${fontRegular}`}>
                Signed in as
                <span className={`flex size-6.5 items-center justify-center rounded-full bg-amber-200 text-13 text-slate-800 ${fontSemi}`}>{shownEmail[0]?.toUpperCase()}</span>
                <span className={`max-w-full truncate rounded-md bg-slate-150 px-2.5 py-1 text-sm italic text-slate-900 ${fontSemi}`}>{shownEmail}</span>
              </div>
              {(["first", "last"] as const).map((key) => (
                <div key={key} className="mt-6 flex flex-col gap-2">
                  <label htmlFor={`auth-${key}`} className={`text-sm text-slate-800 ${fontMedium}`}>
                    {key === "first" ? "First Name" : "Last Name"}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={key === "first" ? firstRef : undefined}
                    id={`auth-${key}`}
                    autoComplete={key === "first" ? "given-name" : "family-name"}
                    value={names[key]}
                    onChange={(e) => setNames((n) => ({ ...n, [key]: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              ))}
              <button type="submit" className={`${buttonClass("dark", "lg")} mt-8 self-end`}>
                Save &amp; Continue
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
              <p className={`mt-10 text-xs leading-5 text-slate-500 ${fontRegular}`}>Your name is used on certificates and receipts. You can edit it anytime in Settings.</p>
            </form>
          )}
        </div>
      </main>

      <footer className={`pb-6 text-center text-xs text-slate-500 ${fontRegular}`}>Copyright © {new Date().getFullYear()} Thkee. All rights reserved.</footer>
    </div>
  );
}
