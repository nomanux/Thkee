import { useState, type FormEvent, type ReactNode } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  AlertCircleIcon,
  ArrowRight01Icon,
  BankIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  CreditCardChangeIcon,
  CustomerSupportIcon,
  Shield02Icon,
  Wallet01Icon,
  CreditCardIcon,
  GlobeIcon,
  InformationCircleIcon,
  Loading03Icon,
  LockIcon,
  Mail01Icon,
  PlayIcon,
  RefreshIcon,
  SecurityCheckIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { courses, type Course } from "../data";
import { fontBold, fontFor, fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { cardBrand, openLearning, orderTotals, useApp, type CardBrand } from "../store";
import { CourseThumb } from "./Overlays";

const sar = (n: number) => `${Math.round(n).toLocaleString()} SAR`;
const countries = ["Saudi Arabia", "United Arab Emirates", "Kuwait", "Qatar", "Bahrain", "Oman", "Egypt", "Jordan", "Pakistan", "Bangladesh", "United Kingdom", "United States"];
const headingStyle = { fontVariationSettings: '"wdth" 100' };

const label = `text-13 text-slate-700 ${fontMedium}`;
const fieldClass = (error?: string) => `field h-11 ${error ? "border-red-400" : ""}`;

type Method = "card" | "paypal" | `saved:${string}`;
type Receipt = { courses: Course[]; total: number; paidWith: string };

function Icon({ icon, size = 18, className = "" }: { icon: IconSvgElement; size?: number; className?: string }) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.8} aria-hidden="true" className={`shrink-0 ${className}`} />;
}

export function MadaBadge() {
  return (
    <span className="flex h-[20px] w-[30px] flex-col justify-center gap-[2px] rounded-[3px] bg-[#162f6a] px-[4px]" aria-label="mada">
      <span className="h-[2px] w-full bg-[#84bd00]" />
      <span className="h-[2px] w-full bg-[#00a3e0]" />
    </span>
  );
}

export function VisaBadge() {
  return <span className={`flex h-[20px] items-center rounded-[3px] bg-[#1a4c9b] px-1.5 text-[10px] italic tracking-[0.5px] text-white ${fontBold}`}>VISA</span>;
}

export function MastercardBadge() {
  return (
    <span className="relative flex h-[20px] w-[30px] items-center justify-center rounded-[3px] bg-[#111]" aria-label="Mastercard">
      <span className="absolute left-[6px] size-[11px] rounded-full bg-[#eb001b]" />
      <span className="absolute right-[6px] size-[11px] rounded-full bg-[#f79e1b] mix-blend-screen" />
    </span>
  );
}

export function PaypalLogo() {
  return (
    <span className={`text-[17px] italic tracking-[-0.3px] ${fontBold}`}>
      <span className="text-[#003087]">Pay</span>
      <span className="text-[#009cde]">Pal</span>
    </span>
  );
}

export function BrandBadge({ brand }: { brand: CardBrand }) {
  if (brand === "Visa") return <VisaBadge />;
  if (brand === "Mastercard") return <MastercardBadge />;
  return (
    <span className="flex h-[20px] w-[30px] items-center rounded-[3px] bg-[#e2e8f0] px-1" aria-hidden="true">
      <span className="h-[5px] w-[10px] rounded-[1px] bg-[#cbd5e1]" />
    </span>
  );
}

function Radio({ checked }: { checked: boolean }) {
  return (
    <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${checked ? "border-primary-700" : "border-slate-300"}`}>
      <span className={`size-2.5 rounded-full bg-primary-700 transition-transform duration-200 ${checked ? "scale-100" : "scale-0"}`} />
    </span>
  );
}

export function MethodRow({ checked, onSelect, title, right }: { checked: boolean; onSelect: () => void; title: string; right: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`flex h-14 w-full items-center gap-3 rounded-xl border px-4 text-left transition ${
        checked ? "border-primary-700 bg-primary-50 ring-1 ring-primary-700" : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <Radio checked={checked} />
      <span className={`flex-1 text-sm text-slate-900 ${checked ? fontSemi : fontMedium}`}>{title}</span>
      {right}
    </button>
  );
}

/* A payment choice with its form inside the same card, so the open option reads as one unit. */
function MethodTile({ checked, onSelect, title, sub, right, children }: { checked: boolean; onSelect: () => void; title: string; sub?: string; right: ReactNode; children?: ReactNode }) {
  return (
    <div className={`overflow-hidden rounded-2xl border bg-white transition ${checked ? "border-primary-700 ring-1 ring-primary-700 shadow-primary-tile" : "border-slate-200 hover:border-slate-300"}`}>
      <button type="button" role="radio" aria-checked={checked} onClick={onSelect} className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors ${checked ? "bg-primary-50" : ""}`}>
        <Radio checked={checked} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className={`text-sm text-slate-900 ${checked ? fontSemi : fontMedium}`}>{title}</span>
          {sub && <span className={`text-xs text-slate-500 ${fontRegular}`}>{sub}</span>}
        </span>
        {right}
      </button>
      {checked && children && <div className="fade-up border-t border-primary-200 px-4 pb-5 pt-4">{children}</div>}
    </div>
  );
}

/* Cart → Payment → Start learning. Shared by the cart and checkout pages. */
export function CheckoutSteps({ current, failed = false }: { current: 0 | 1 | 2; failed?: boolean }) {
  const steps = ["Cart", "Payment", "Start learning"];
  return (
    <ol className="flex items-center gap-2 sm:gap-3" aria-label="Checkout progress">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const error = active && failed;
        return (
          <li key={s} className="flex items-center gap-2 sm:gap-3" aria-current={active ? "step" : undefined}>
            <span className="flex items-center gap-2">
              <span
                className={`flex size-6 items-center justify-center rounded-full text-xs transition-colors ${fontSemi} ${
                  error ? "bg-red-600 text-white" : active ? "bg-primary-700 text-white shadow-primary-chip" : done ? "bg-primary-100 text-primary-700" : "bg-white text-slate-400 ring-1 ring-slate-200"
                }`}
              >
                {error ? <Icon icon={Cancel01Icon} size={13} /> : done ? <Icon icon={Tick02Icon} size={14} /> : i + 1}
              </span>
              <span className={`text-sm ${error ? `text-red-600 ${fontSemi}` : active ? `text-slate-900 ${fontSemi}` : done ? `hidden text-primary-700 sm:inline ${fontMedium}` : `hidden text-slate-400 sm:inline ${fontMedium}`}`}>
                {error ? "Payment failed" : s}
              </span>
            </span>
            {i < steps.length - 1 && <span className={`h-px w-6 sm:w-10 ${done ? "bg-primary-400" : "bg-slate-200"}`} aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

function SectionCard({ step, icon, title, sub, children }: { step: number; icon: IconSvgElement; title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="fade-up rounded-3xl border border-slate-150 bg-white p-5 shadow-card sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
          <Icon icon={icon} size={20} />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className={`text-xs uppercase tracking-label text-slate-400 ${fontSemi}`}>Step {step}</span>
          <h2 className={`m-0 text-lg text-slate-900 ${fontHeading}`} style={headingStyle}>
            {title}
          </h2>
          {sub && <p className={`text-13 leading-relaxed text-slate-500 ${fontRegular}`}>{sub}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function FieldError({ id, text }: { id: string; text?: string }) {
  if (!text) return null;
  return (
    <span id={id} className={`fade-up text-xs text-red-600 ${fontRegular}`}>
      {text}
    </span>
  );
}

/* Live preview of the card being typed. */
function CardPreview({ name, number, expiry }: { name: string; number: string; expiry: string }) {
  const digits = number.replace(/\D/g, "");
  const shown = (digits + "•".repeat(16 - digits.length)).replace(/(.{4})/g, "$1 ").trim();
  return (
    <div className="bg-video-cover relative flex aspect-video w-full max-w-xs flex-col justify-between overflow-hidden rounded-2xl p-5 text-white shadow-panel">
      <span className="absolute -right-10 -top-10 size-40 rounded-full bg-white/5" aria-hidden="true" />
      <span className="absolute -bottom-16 -left-6 size-40 rounded-full bg-white/5" aria-hidden="true" />
      <div className="relative flex items-center justify-between">
        <span className="h-7 w-10 rounded-md bg-secondary-300 ring-1 ring-secondary-200" aria-hidden="true" />
        <BrandBadge brand={cardBrand(digits)} />
      </div>
      <p className={`relative text-lg tracking-widest ${fontMedium}`}>{shown}</p>
      <div className="relative flex items-end justify-between gap-4">
        <span className="flex min-w-0 flex-col">
          <span className={`text-10 uppercase tracking-label text-white/60 ${fontMedium}`}>Card holder</span>
          <span className={`truncate text-sm uppercase ${fontSemi}`}>{name.trim() || "Your name"}</span>
        </span>
        <span className="flex flex-col">
          <span className={`text-10 uppercase tracking-label text-white/60 ${fontMedium}`}>Expires</span>
          <span className={`text-sm ${fontSemi}`}>{expiry || "MM/YY"}</span>
        </span>
      </div>
    </div>
  );
}

function Success({ receipt }: { receipt: Receipt }) {
  const { openSearch } = useApp();
  const { courses: purchased, total, paidWith } = receipt;
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex justify-center">
        <CheckoutSteps current={2} />
      </div>
      <div className="fade-up flex flex-col items-center gap-4 rounded-3xl border border-slate-150 bg-white px-6 py-10 text-center shadow-panel sm:px-10">
        <span className="relative flex size-20 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary-200 opacity-40" aria-hidden="true" />
          <span className="relative flex size-20 items-center justify-center rounded-full bg-primary-700 text-white shadow-primary-glow">
            <Icon icon={Tick02Icon} size={36} />
          </span>
        </span>
        <h1 className={`m-0 mt-2 text-3xl tracking-tight text-slate-900 ${fontHeading}`} style={headingStyle}>
          You're enrolled!
        </h1>
        <p className={`flex items-center gap-2 text-sm text-slate-500 ${fontRegular}`}>
          <Icon icon={Mail01Icon} size={16} />
          Your receipt is on its way to your email.
        </p>

        <dl className={`mt-2 grid w-full grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-left text-sm ${fontRegular}`}>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-slate-500">Amount paid</dt>
            <dd className={`text-base text-slate-900 ${fontSemi}`}>{total === 0 ? "Free" : sar(total)}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-slate-500">Paid with</dt>
            <dd className={`truncate text-base text-slate-900 ${fontSemi}`}>{paidWith}</dd>
          </div>
        </dl>

        <ul className="flex w-full flex-col gap-2 text-left">
          {purchased.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => openLearning(c.id)} className="group flex w-full items-center gap-3 rounded-2xl border border-slate-150 bg-white p-2.5 pr-4 transition hover:border-primary-300 hover:shadow-card">
                <span className="w-20 shrink-0 overflow-hidden rounded-lg">
                  <CourseThumb course={c} showTitle={false} className="aspect-video [&>span]:hidden" />
                </span>
                <span dir="auto" className={`min-w-0 flex-1 truncate text-start text-sm text-slate-900 ${fontFor(c.title, fontSemi)}`}>
                  {c.title}
                </span>
                <span className={`flex shrink-0 items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-xs text-primary-700 transition group-hover:bg-primary-700 group-hover:text-white ${fontSemi}`}>
                  <Icon icon={PlayIcon} size={12} />
                  Start
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => openLearning(purchased[0].id)}
            className={`group flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-secondary-500 text-base text-slate-900 shadow-card transition hover:bg-secondary-600 ${fontSemi}`}
          >
            Start learning now
            <Icon icon={ArrowRight01Icon} className="transition-transform group-hover:translate-x-1" />
          </button>
          <button type="button" onClick={() => openSearch({})} className={`h-12 flex-1 rounded-xl border border-slate-200 bg-white text-base text-slate-900 transition hover:border-slate-300 hover:bg-slate-50 ${fontSemi}`}>
            Browse more courses
          </button>
        </div>
      </div>
    </div>
  );
}

type Failure = { total: number; paidWith: string; reason: string };

function Failed({ failure, retrying, onRetry, onChangeMethod }: { failure: Failure; retrying: boolean; onRetry: () => void; onChangeMethod: () => void }) {
  const { setOverlay } = useApp();
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="flex justify-center">
        <CheckoutSteps current={1} failed />
      </div>
      <div role="alert" className="fade-up flex flex-col items-center gap-3 rounded-2xl border border-slate-150 bg-white px-5 py-6 text-center shadow-panel sm:px-8">
        <span className="relative flex items-center justify-center">
          <span className="absolute size-20 rounded-full bg-red-50" aria-hidden="true" />
          <img src="/illustrations/payment-failed.svg" alt="" aria-hidden="true" className="relative size-24" />
        </span>
        <span className={`flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs text-red-600 ring-1 ring-red-100 ${fontSemi}`}>
          <Icon icon={AlertCircleIcon} size={13} />
          {failure.reason}
        </span>
        <h1 className={`m-0 text-xl tracking-tight text-slate-900 ${fontHeading}`} style={headingStyle}>
          Payment failed
        </h1>
        <p className={`max-w-sm text-sm text-slate-500 ${fontRegular}`}>
          Try again or use a different payment method.
        </p>

        <div className={`flex w-full items-center gap-2.5 rounded-xl bg-primary-50 px-3 py-2 text-left text-sm text-primary-800 ${fontRegular}`}>
          <Icon icon={Shield02Icon} size={18} className="text-primary-700" />
          <span>You have not been charged.</span>
        </div>

        <dl className={`grid w-full grid-cols-2 gap-2 rounded-xl border border-slate-150 px-3 py-2.5 text-left text-sm ${fontRegular}`}>
          <div className="flex flex-col">
            <dt className="text-xs text-slate-500">Amount</dt>
            <dd className={`text-sm text-slate-900 ${fontSemi}`}>{sar(failure.total)}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs text-slate-500">Payment method</dt>
            <dd className={`truncate text-sm text-slate-900 ${fontSemi}`}>{failure.paidWith}</dd>
          </div>
        </dl>

        <div className="flex w-full flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={onChangeMethod}
            disabled={retrying}
            className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-secondary-500 text-sm text-slate-900 shadow-card transition hover:bg-secondary-600 disabled:opacity-60 ${fontSemi}`}
          >
            <Icon icon={CreditCardChangeIcon} size={16} />
            Use another method
          </button>
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-wait ${fontSemi}`}
          >
            <Icon icon={retrying ? Loading03Icon : RefreshIcon} size={16} className={retrying ? "animate-spin" : ""} />
            {retrying ? "Retrying…" : "Try again"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOverlay({ type: "info", page: "Help Center" })}
          className={`flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-primary-700 ${fontMedium}`}
        >
          <Icon icon={CustomerSupportIcon} size={14} />
          Still stuck? Contact support
        </button>
      </div>
    </div>
  );
}

function expiryError(expiry: string) {
  const m = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!m) return "Use MM/YY";
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return "Month must be 01 to 12";
  const now = new Date();
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) return "This card has expired";
  return undefined;
}

export default function CheckoutPage() {
  const { cart, promo, setPromo, credit, completePurchase, setOverlay, openSearch, notify, savedCards, addCard } = useApp();
  const [country, setCountry] = useState("Saudi Arabia");
  // Start on the default saved card when there is one, so returning buyers only need their CVV.
  const [method, setMethod] = useState<Method>(savedCards[0] ? `saved:${savedCards[0].id}` : "card");
  const savedCard = savedCards.find((c) => method === `saved:${c.id}`);
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvv: "" });
  const [savedCvv, setSavedCvv] = useState("");
  const [remember, setRemember] = useState(true);
  const [showItems, setShowItems] = useState(true);
  const [paying, setPaying] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);

  const retry = () => pay();
  const changeMethod = () => {
    setFailure(null);
    setAttempted(false);
    setCard({ name: card.name, number: "", expiry: "", cvv: "" });
    setSavedCvv("");
    setMethod(savedCards[0] ? `saved:${savedCards[0].id}` : "paypal");
    setTimeout(() => document.getElementById("payment-section")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const { subtotal, saleDiscount, promoDiscount, creditUsed, total } = orderTotals(cart, promo, credit);
  const savings = saleDiscount + promoDiscount + creditUsed;
  const needsPayment = total > 0;

  const digits = card.number.replace(/\D/g, "");
  const errors: Record<string, string | undefined> = {};
  if (needsPayment && method === "card") {
    if (!card.name.trim()) errors.name = "Enter the name on your card";
    if (digits.length < 15) errors.number = "Enter a valid card number";
    errors.expiry = expiryError(card.expiry);
    if (card.cvv.length < 3) errors.cvv = "3 or 4 digits";
  }
  if (needsPayment && savedCard && savedCvv.length < 3) errors.savedCvv = "Enter the 3 or 4 digit CVV";
  const valid = Object.values(errors).every((e) => !e);
  const show = (key: string) => (attempted ? errors[key] : undefined);

  const pay = (e?: FormEvent) => {
    e?.preventDefault();
    setAttempted(true);
    if (!valid) {
      notify("Check your payment details");
      document.getElementById("payment-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setPaying(true);
    setTimeout(() => {
      const last4 = digits.slice(-4);
      const paidWith = !needsPayment ? "Thkee credit" : method === "paypal" ? "PayPal" : savedCard ? `${savedCard.brand} •••• ${savedCard.last4}` : `${cardBrand(digits)} •••• ${last4}`;
      // Demo: a new card ending in 0002 or all zeros is declined, so the failed state can be tested.
      if (needsPayment && method === "card" && (last4 === "0002" || /^0+$/.test(digits))) {
        setPaying(false);
        setFailure({ total, paidWith, reason: "Declined by your bank" });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (needsPayment && method === "card" && remember) addCard({ brand: cardBrand(digits), last4, expiry: card.expiry, name: card.name.trim() }, false);
      const paidTotal = total;
      const ids = completePurchase(paidWith);
      setFailure(null);
      setReceipt({ courses: courses.filter((c) => ids.includes(c.id)), total: paidTotal, paidWith });
      setPaying(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      notify("Payment successful. You're enrolled! 🎉");
    }, 1100);
  };

  const setNumber = (v: string) =>
    setCard((c) => ({
      ...c,
      number: v
        .replace(/\D/g, "")
        .slice(0, 16)
        .replace(/(\d{4})(?=\d)/g, "$1 "),
    }));
  const setExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    setCard((c) => ({ ...c, expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }));
  };

  const payLabel = paying ? "Processing payment…" : needsPayment ? `Pay ${sar(total)}` : "Complete enrolment";
  const payButton = (extra: string) => (
    <button
      type="submit"
      form="checkout-form"
      disabled={paying}
      className={`group flex items-center justify-center gap-2 rounded-xl bg-secondary-500 text-slate-900 shadow-card transition hover:bg-secondary-600 active:scale-99 disabled:cursor-wait disabled:opacity-80 ${fontSemi} ${extra}`}
    >
      <Icon icon={paying ? Loading03Icon : LockIcon} size={18} className={paying ? "animate-spin" : ""} />
      {payLabel}
    </button>
  );

  return (
    <main className="w-full bg-slate-50 px-4 pb-32 pt-28 md:px-8 lg:pb-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {receipt ? (
          <Success receipt={receipt} />
        ) : failure ? (
          <Failed failure={failure} retrying={paying} onRetry={retry} onChangeMethod={changeMethod} />
        ) : (
          <>
            <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-3">
                <button type="button" onClick={() => (window.location.hash = "#/cart")} className={`flex w-fit items-center gap-1 text-sm text-slate-500 transition hover:text-primary-700 ${fontMedium}`}>
                  <Icon icon={ArrowLeft01Icon} size={16} />
                  Back to cart
                </button>
                <h1 className={`m-0 flex items-center gap-3 text-3xl tracking-tight text-slate-900 md:text-4xl ${fontHeading}`} style={headingStyle}>
                  Checkout
                  <span className={`flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs tracking-normal text-primary-700 ring-1 ring-primary-200 ${fontSemi}`}>
                    <Icon icon={LockIcon} size={13} />
                    Secure
                  </span>
                </h1>
              </div>
              {cart.length > 0 && <CheckoutSteps current={1} />}
            </header>

            {cart.length === 0 ? (
              <div className="fade-up flex flex-col items-center gap-4 rounded-3xl border border-slate-150 bg-white px-6 py-16 text-center shadow-card">
                <span className="flex size-20 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                  <Icon icon={CreditCardIcon} size={34} />
                </span>
                <h2 className={`m-0 mt-2 text-2xl text-slate-900 ${fontHeading}`} style={headingStyle}>
                  There's nothing to check out
                </h2>
                <p className={`text-sm text-slate-500 ${fontRegular}`}>Add a course to your cart first.</p>
                <button type="button" onClick={() => openSearch({})} className={`mt-2 h-12 rounded-xl bg-secondary-500 px-7 text-base text-slate-900 shadow-card transition hover:bg-secondary-600 ${fontSemi}`}>
                  Browse courses
                </button>
              </div>
            ) : (
              <form id="checkout-form" onSubmit={pay} noValidate className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
                <div className="flex flex-col gap-5 lg:col-span-7 xl:col-span-8">
                  <SectionCard step={1} icon={GlobeIcon} title="Billing country" sub="We use this to apply the right taxes for your region.">
                    <label className="flex max-w-md flex-col gap-1.5">
                      <span className={label}>Country</span>
                      <span className="relative">
                        <select value={country} onChange={(e) => setCountry(e.target.value)} className="field h-11 appearance-none pr-10">
                          {countries.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                        <Icon icon={ArrowDown01Icon} size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      </span>
                    </label>
                  </SectionCard>

                  <div id="payment-section" className="scroll-mt-28">
                    <SectionCard step={2} icon={CreditCardIcon} title="Payment method" sub={needsPayment ? "All transactions are encrypted and secure." : undefined}>
                      {!needsPayment ? (
                        <div className={`flex items-center gap-3 rounded-2xl bg-primary-50 p-4 text-sm text-primary-800 ${fontRegular}`}>
                          <Icon icon={CheckmarkCircle02Icon} size={20} className="text-primary-700" />
                          No payment needed. Your discounts and credit cover this order.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3" role="radiogroup" aria-label="Payment method">
                          {savedCards.map((c) => (
                            <MethodTile key={c.id} checked={method === `saved:${c.id}`} onSelect={() => setMethod(`saved:${c.id}`)} title={`${c.brand} •••• ${c.last4}`} sub={`Saved card · Expires ${c.expiry}`} right={<BrandBadge brand={c.brand} />}>
                              <label className="flex max-w-48 flex-col gap-1.5">
                                <span className={label}>CVV</span>
                                <input
                                  value={savedCvv}
                                  onChange={(e) => setSavedCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                  type="password"
                                  inputMode="numeric"
                                  autoComplete="cc-csc"
                                  placeholder="•••"
                                  aria-invalid={!!show("savedCvv")}
                                  aria-describedby="saved-cvv-error"
                                  className={fieldClass(show("savedCvv"))}
                                />
                                <FieldError id="saved-cvv-error" text={show("savedCvv")} />
                              </label>
                            </MethodTile>
                          ))}

                          <MethodTile
                            checked={method === "card"}
                            onSelect={() => setMethod("card")}
                            title={savedCards.length ? "New credit or debit card" : "Credit or debit card"}
                            sub="mada, Visa, Mastercard"
                            right={
                              <span className="hidden items-center gap-1.5 sm:flex">
                                <MadaBadge />
                                <VisaBadge />
                                <MastercardBadge />
                              </span>
                            }
                          >
                            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                              <div className="grid grid-cols-2 content-start gap-x-4 gap-y-4">
                                <label className="col-span-2 flex flex-col gap-1.5">
                                  <span className={label}>Card number</span>
                                  <span className="relative">
                                    <input
                                      value={card.number}
                                      onChange={(e) => setNumber(e.target.value)}
                                      placeholder="1234 5678 9012 3456"
                                      inputMode="numeric"
                                      autoComplete="cc-number"
                                      aria-invalid={!!show("number")}
                                      aria-describedby="number-error"
                                      className={`${fieldClass(show("number"))} pr-14 tracking-wide`}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                      <BrandBadge brand={cardBrand(card.number)} />
                                    </span>
                                  </span>
                                  <FieldError id="number-error" text={show("number")} />
                                </label>
                                <label className="col-span-2 flex flex-col gap-1.5">
                                  <span className={label}>Name on card</span>
                                  <input
                                    value={card.name}
                                    onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                                    placeholder="As printed on your card"
                                    autoComplete="cc-name"
                                    aria-invalid={!!show("name")}
                                    aria-describedby="name-error"
                                    className={fieldClass(show("name"))}
                                  />
                                  <FieldError id="name-error" text={show("name")} />
                                </label>
                                <label className="flex flex-col gap-1.5">
                                  <span className={label}>Expiry date</span>
                                  <input
                                    value={card.expiry}
                                    onChange={(e) => setExpiry(e.target.value)}
                                    placeholder="MM/YY"
                                    inputMode="numeric"
                                    autoComplete="cc-exp"
                                    aria-invalid={!!show("expiry")}
                                    aria-describedby="expiry-error"
                                    className={fieldClass(show("expiry"))}
                                  />
                                  <FieldError id="expiry-error" text={show("expiry")} />
                                </label>
                                <label className="flex flex-col gap-1.5">
                                  <span className={`flex items-center gap-1 ${label}`}>
                                    CVV
                                    <span title="The 3 or 4 digits on the back of your card" className="text-slate-400">
                                      <Icon icon={InformationCircleIcon} size={14} />
                                    </span>
                                  </span>
                                  <input
                                    value={card.cvv}
                                    onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                                    placeholder="•••"
                                    type="password"
                                    inputMode="numeric"
                                    autoComplete="cc-csc"
                                    aria-invalid={!!show("cvv")}
                                    aria-describedby="cvv-error"
                                    className={fieldClass(show("cvv"))}
                                  />
                                  <FieldError id="cvv-error" text={show("cvv")} />
                                </label>
                                <label className={`col-span-2 flex cursor-pointer items-center gap-2.5 text-sm text-slate-700 ${fontRegular}`}>
                                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-primary-700" />
                                  Save this card for faster checkout
                                </label>
                              </div>
                              <div className="hidden items-start justify-center xl:flex">
                                <CardPreview name={card.name} number={card.number} expiry={card.expiry} />
                              </div>
                            </div>
                          </MethodTile>

                          <MethodTile checked={method === "paypal"} onSelect={() => setMethod("paypal")} title="PayPal" sub="Pay with your PayPal balance or linked card" right={<PaypalLogo />}>
                            <p className={`flex items-start gap-3 text-sm leading-relaxed text-slate-600 ${fontRegular}`}>
                              <Icon icon={InformationCircleIcon} size={18} className="mt-0.5 text-primary-700" />
                              You'll go to PayPal to finish paying. PayPal brings you back to Thkee once the payment clears.
                            </p>
                          </MethodTile>
                        </div>
                      )}
                    </SectionCard>
                  </div>
                </div>

                <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:col-span-5 xl:col-span-4">
                  <section className="overflow-hidden rounded-3xl border border-slate-150 bg-white shadow-panel">
                    <div className="flex items-baseline justify-between px-6 pb-4 pt-6">
                      <h2 className={`m-0 text-xl text-slate-900 ${fontHeading}`} style={headingStyle}>
                        Order summary
                      </h2>
                      <button type="button" onClick={() => setShowItems((v) => !v)} aria-expanded={showItems} className={`flex items-center gap-1 text-13 text-slate-500 transition hover:text-primary-700 ${fontMedium}`}>
                        {cart.length} {cart.length === 1 ? "course" : "courses"}
                        <Icon icon={ArrowDown01Icon} size={14} className={`transition-transform duration-200 ${showItems ? "rotate-180" : ""}`} />
                      </button>
                    </div>

                    {showItems && (
                      <ul className="fade-up flex flex-col gap-3 px-6 pb-5">
                        {cart.map((c) => {
                          const onSale = !!c.originalPrice && c.originalPrice > c.price;
                          return (
                            <li key={c.id} className="flex items-center gap-3">
                              <span className="w-16 shrink-0 overflow-hidden rounded-lg">
                                <CourseThumb course={c} showTitle={false} className="aspect-video [&>span]:hidden" />
                              </span>
                              <span dir="auto" className={`line-clamp-2 min-w-0 flex-1 text-start text-13 leading-snug text-slate-800 ${fontFor(c.title, fontMedium, "font-medium")}`}>
                                {c.title}
                              </span>
                              <span className="flex shrink-0 flex-col items-end">
                                <span className={`text-13 ${c.price === 0 ? "text-primary-700" : "text-slate-900"} ${fontSemi}`}>{c.price === 0 ? "Free" : sar(c.price)}</span>
                                {onSale && <span className={`text-xs text-slate-400 line-through ${fontRegular}`}>{sar(c.originalPrice!)}</span>}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    <div className={`flex flex-col gap-3 border-t border-slate-150 px-6 py-5 text-sm ${fontRegular}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Original price</span>
                        <span className="text-slate-900">{sar(subtotal)}</span>
                      </div>
                      {saleDiscount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Sale discount</span>
                          <span className={`text-primary-700 ${fontMedium}`}>-{sar(saleDiscount)}</span>
                        </div>
                      )}
                      {promo && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-slate-500">
                            Coupon
                            <span className={`flex items-center gap-1 rounded-md bg-primary-50 py-0.5 pl-2 pr-1 text-xs text-primary-700 ${fontSemi}`}>
                              {promo}
                              <button type="button" onClick={() => setPromo(null)} aria-label={`Remove coupon ${promo}`} className="flex size-4 items-center justify-center rounded text-primary-700 transition hover:bg-primary-100 hover:text-red-600">
                                ×
                              </button>
                            </span>
                          </span>
                          <span className={`text-primary-700 ${fontMedium}`}>-{sar(promoDiscount)}</span>
                        </div>
                      )}
                      {creditUsed > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Thkee credit</span>
                          <span className={`text-primary-700 ${fontMedium}`}>-{sar(creditUsed)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-4 border-t border-slate-150 bg-slate-25 px-6 pb-6 pt-5">
                      <div className="flex items-end justify-between gap-3">
                        <span className="flex flex-col">
                          <span className={`text-base text-slate-900 ${fontSemi}`}>Total</span>
                          <span className={`text-xs text-slate-400 ${fontRegular}`}>Taxes included</span>
                        </span>
                        <span className="flex flex-col items-end gap-1">
                          <span key={total} className={`fade-up text-3xl leading-none tracking-tight text-slate-900 ${fontHeading}`} style={headingStyle}>
                            {total === 0 ? "Free" : sar(total)}
                          </span>
                          {savings > 0 && <span className={`rounded-full bg-primary-100 px-2.5 py-0.5 text-xs text-primary-700 ${fontSemi}`}>You save {sar(savings)}</span>}
                        </span>
                      </div>

                      {payButton("h-13 w-full text-base")}

                      <p className={`text-center text-xs leading-relaxed text-slate-400 ${fontRegular}`}>
                        By completing your purchase you agree to our{" "}
                        <button type="button" onClick={() => setOverlay({ type: "info", page: "Terms of Service" })} className="text-slate-700 underline underline-offset-2 transition hover:text-primary-700">
                          Terms &amp; Conditions
                        </button>
                        .
                      </p>
                    </div>
                  </section>

                  <ul className={`flex flex-col gap-3 rounded-2xl border border-slate-150 bg-white px-5 py-4 text-13 text-slate-600 ${fontRegular}`}>
                    {[
                      { icon: SecurityCheckIcon, text: "256-bit SSL encrypted payment" },
                      { icon: RefreshIcon, text: "30-day money-back guarantee" },
                    ].map((b) => (
                      <li key={b.text} className="flex items-center gap-3">
                        <span className="flex size-7 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                          <Icon icon={b.icon} size={15} />
                        </span>
                        {b.text}
                      </li>
                    ))}
                  </ul>
                </aside>
              </form>
            )}
          </>
        )}
      </div>

      {/* Phones: total and pay button stay in reach while filling in the form. */}
      {!receipt && !failure && cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-4">
            <span className="flex flex-col">
              <span className={`text-xs text-slate-500 ${fontRegular}`}>Total</span>
              <span className={`text-lg leading-tight text-slate-900 ${fontBold}`}>{total === 0 ? "Free" : sar(total)}</span>
            </span>
            {payButton("h-12 flex-1 text-15")}
          </div>
        </div>
      )}
    </main>
  );
}
