import { useEffect, useState } from "react";
import { AuthCard, type AuthDetails } from "@/components/auth-card";
import { OtpCode } from "@/components/otp-code";
import { HoverPill } from "./Menus";
import { fontMedium, fontRegular } from "../fonts";
import { useApp } from "../store";

/* UI only: no real sign-in. Each action waits briefly so the card can show its busy and done motion. */
const pretend = () => new Promise<void>((resolve) => setTimeout(resolve, 1400));
// Any code works except all zeros, which shows the wrong-code state.
const checkCode = async (code: string) => {
  await new Promise((resolve) => setTimeout(resolve, 900));
  return !/^0+$/.test(code);
};
const nameFromEmail = (email: string) =>
  email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

function ThkeeMark() {
  return (
    <span className="relative flex size-12 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-secondary-400 to-secondary-600 shadow-lg shadow-secondary-600/35" aria-hidden="true">
      <span className="absolute inset-0 bg-linear-to-b from-white/35 to-transparent" />
      <svg width="26" height="18" viewBox="0 0 30 20" fill="none" className="relative">
        <path d="M11 3L4 10l7 7" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="17.5" cy="10" r="3" fill="white" />
        <circle cx="25.5" cy="10" r="3" fill="white" />
      </svg>
    </span>
  );
}

export default function AuthPage() {
  const { user, lang, setLang, setOverlay, goHome, signIn } = useApp();
  const [langOpen, setLangOpen] = useState(false);
  const [langHover, setLangHover] = useState<string | null>(null);
  const [sent, setSent] = useState<AuthDetails | null>(null);

  const sendCode = async (details: AuthDetails) => {
    await pretend();
    // Let the button show "Code sent" for a moment before the code step slides in.
    window.setTimeout(() => setSent(details), 700);
  };

  useEffect(() => {
    if (user) goHome();
  }, []);

  return (
    <div className="flex min-h-dvh w-full flex-col bg-slate-100">
      <header className="mx-auto flex w-full max-w-310 items-center justify-between px-5 py-5 md:px-8 md:py-7">
        <button type="button" onClick={goHome} aria-label="Thkee home" className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-700">
          <img src="/assets/logo-dark.svg" alt="Thkee" className="h-7 w-23.75" />
        </button>
        <div className="relative">
          <button type="button" aria-expanded={langOpen} onClick={() => setLangOpen((o) => !o)} className={`flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-sm text-slate-700 backdrop-blur transition hover:border-slate-300 hover:text-slate-900 ${fontMedium}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
            </svg>
            {lang === "AR" ? "العربية" : "English"}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className={`transition-transform ${langOpen ? "rotate-180" : ""}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {langOpen && (
            <div
              onPointerLeave={() => setLangHover(null)}
              className="pop-in absolute right-0 top-full z-10 mt-1.5 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-popover"
            >
              {(["EN", "AR"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onPointerEnter={() => setLangHover(l)}
                  onFocus={() => setLangHover(l)}
                  onClick={() => {
                    setLang(l);
                    setLangOpen(false);
                  }}
                  className={`relative flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-800 outline-none ${fontMedium}`}
                >
                  {langHover === l && <HoverPill group="auth-lang" />}
                  <span className="relative">{l === "AR" ? "العربية" : "English"}</span>
                  {lang === l && <span className="relative text-primary-700">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-2">
        {sent ? (
          <div className="flex w-full flex-col items-center">
            <OtpCode
              className="w-110 rounded-2xl shadow-panel"
              channel="email"
              destination={sent.email}
              resendAfter={25}
              autoFocus
              verify={checkCode}
              onResend={pretend}
              continueLabel="Continue to Thkee"
              onContinue={() => signIn({ name: sent.name || nameFromEmail(sent.email), email: sent.email })}
            />
            <button
              type="button"
              onClick={() => setSent(null)}
              className={`mt-4 rounded-md text-sm text-slate-600 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900 hover:decoration-slate-700 ${fontMedium}`}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <AuthCard className="shadow-panel" logo={<ThkeeMark />} onSubmit={sendCode} onSocial={pretend} />
        )}
        <p className={`mt-6 max-w-80 text-center text-xs leading-5 text-slate-500 ${fontRegular}`}>
          By continuing, you agree to our{" "}
          <button type="button" onClick={() => setOverlay({ type: "info", page: "Terms of Service" })} className="text-slate-700 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-700">
            Terms of Service
          </button>{" "}
          and{" "}
          <button type="button" onClick={() => setOverlay({ type: "info", page: "Privacy Policy" })} className="text-slate-700 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-700">
            Privacy Policy
          </button>
          .
        </p>
      </main>

      <footer className={`pb-6 text-center text-xs text-slate-400 ${fontRegular}`}>© {new Date().getFullYear()} Thkee. All rights reserved.</footer>
    </div>
  );
}
