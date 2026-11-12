import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BookOpen01Icon,
  Cancel01Icon,
  Certificate01Icon,
  Clock01Icon,
  Delete02Icon,
  FavouriteIcon,
  Infinity01Icon,
  LockIcon,
  RefreshIcon,
  ShoppingCart01Icon,
  Tag01Icon,
  Tick02Icon,
  Undo02Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { courses, type Course } from "../data";
import { fontBold, fontFor, fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { AVAILABLE_CREDIT, COUPONS, formatPrice, orderTotals, useApp } from "../store";
import { CheckoutSteps, MadaBadge, MastercardBadge, VisaBadge } from "./CheckoutPage";
import { CourseThumb } from "./Overlays";
import { ResultCard } from "./SearchPage";

const sar = (n: number) => `${Math.round(n).toLocaleString()} SAR`;
const headingStyle = { fontVariationSettings: '"wdth" 100' };

function Icon({ icon, size = 18, className = "" }: { icon: IconSvgElement; size?: number; className?: string }) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.8} aria-hidden="true" className={`shrink-0 ${className}`} />;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="relative inline-flex text-sm leading-none" aria-label={`${rating.toFixed(1)} out of 5`}>
      <span className="text-slate-200">★★★★★</span>
      <span className="absolute inset-y-0 left-0 overflow-hidden text-amber-400" style={{ width: `${(rating / 5) * 100}%` }}>
        ★★★★★
      </span>
    </span>
  );
}

function CartRow({ course, leaving, onRemove }: { course: Course; leaving: boolean; onRemove: () => void }) {
  const { setOverlay, moveToWishlist } = useApp();
  const onSale = !!course.originalPrice && course.originalPrice > course.price;
  const percentOff = onSale ? Math.round(((course.originalPrice! - course.price) / course.originalPrice!) * 100) : 0;
  const open = () => setOverlay({ type: "course", id: course.id });

  const price = (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <span className={`text-xl leading-none ${course.price === 0 ? "text-primary-700" : "text-slate-900"} ${fontBold}`}>{formatPrice(course.price)}</span>
      {onSale && (
        <span className="flex items-center gap-2">
          <span className={`text-sm text-slate-400 line-through ${fontRegular}`}>{formatPrice(course.originalPrice!)}</span>
          <span className={`rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600 ${fontSemi}`}>-{percentOff}%</span>
        </span>
      )}
    </div>
  );

  return (
    <li
      className={`group flex gap-4 rounded-2xl border border-slate-150 bg-white p-3 shadow-card transition duration-300 ease-out hover:border-slate-200 hover:shadow-panel sm:gap-5 sm:p-4 ${
        leaving ? "pointer-events-none -translate-x-4 scale-98 opacity-0" : "fade-up"
      }`}
    >
      <button type="button" onClick={open} className="w-28 shrink-0 self-start overflow-hidden rounded-xl sm:w-44" aria-label={`View ${course.title}`}>
        <CourseThumb course={course} showTitle={false} className="aspect-video transition duration-500 group-hover:scale-105 [&>span]:hidden" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <button
              type="button"
              dir="auto"
              onClick={open}
              className={`line-clamp-2 text-start text-base leading-snug text-slate-900 transition-colors hover:text-primary-700 sm:text-lg ${fontFor(course.title, fontSemi)}`}
            >
              {course.title}
            </button>
            <p dir="auto" className={`truncate text-start text-sm text-slate-500 ${fontFor(course.instructor, fontRegular, "font-normal")}`}>
              by {course.instructor}
            </p>
          </div>
          <div className="hidden shrink-0 sm:block">{price}</div>
        </div>

        <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 text-13 text-slate-500 ${fontRegular}`}>
          <span className="flex items-center gap-1.5">
            <span className={`text-slate-900 ${fontSemi}`}>{course.rating.toFixed(1)}</span>
            <Stars rating={course.rating} />
            <span>({Math.round(course.students * 0.23).toLocaleString()})</span>
          </span>
          <span className="hidden items-center gap-1 sm:flex">
            <Icon icon={Clock01Icon} size={14} />
            {course.hours}h total
          </span>
          <span className="hidden items-center gap-1 sm:flex">
            <Icon icon={BookOpen01Icon} size={14} />
            {course.lessons} lessons
          </span>
          <span className={`rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 ${fontMedium}`}>{course.level}</span>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-1">
          <div className="sm:hidden">{price}</div>
          {onSale && (
            <span className={`hidden items-center gap-1.5 text-13 text-red-600 sm:flex ${fontMedium}`}>
              <Icon icon={Clock01Icon} size={15} />
              Sale ends in 5 hours
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => moveToWishlist(course.id)}
              className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-13 text-slate-600 transition hover:bg-primary-50 hover:text-primary-700 ${fontMedium}`}
            >
              <Icon icon={FavouriteIcon} size={16} />
              <span className="hidden sm:inline">Save for later</span>
            </button>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${course.title} from cart`}
              className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-13 text-slate-600 transition hover:bg-red-50 hover:text-red-600 ${fontMedium}`}
            >
              <Icon icon={Delete02Icon} size={16} />
              <span className="hidden sm:inline">Remove</span>
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

function Line({ label, value, tone = "muted", children }: { label: ReactNode; value: string; tone?: "muted" | "save"; children?: ReactNode }) {
  return (
    <div className={`flex items-center justify-between gap-3 text-sm ${fontRegular}`}>
      <span className="flex items-center gap-2 text-slate-500">
        {label}
        {children}
      </span>
      <span className={tone === "save" ? `text-primary-700 ${fontMedium}` : "text-slate-900"}>{value}</span>
    </div>
  );
}

function Switch({ checked, disabled, onChange, label }: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${checked ? "bg-primary-700" : "bg-slate-200"}`}
    >
      <span className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-card transition-transform duration-200 ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

export default function CartPage() {
  const { cart, checkout, openSearch, wishlistIds, notify, promo, setPromo, credit, setCredit, removeFromCart, addToCart } = useApp();
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [editCredit, setEditCredit] = useState(false);
  const [creditInput, setCreditInput] = useState("");
  const [creditError, setCreditError] = useState("");
  const [leaving, setLeaving] = useState<string[]>([]);
  const [removed, setRemoved] = useState<Course | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(undoTimer.current), []);

  const { subtotal, saleDiscount, promoDiscount, creditUsed, total } = orderTotals(cart, promo, credit);
  const savings = saleDiscount + promoDiscount + creditUsed;
  const savingsPercent = subtotal > 0 ? Math.round((savings / subtotal) * 100) : 0;
  const payableBeforeCredit = total + creditUsed;

  const remove = (course: Course) => {
    setLeaving((ids) => [...ids, course.id]);
    setTimeout(() => {
      removeFromCart(course.id);
      setLeaving((ids) => ids.filter((id) => id !== course.id));
      setRemoved(course);
      clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setRemoved(null), 6000);
    }, 260);
  };

  const undoRemove = () => {
    if (!removed) return;
    addToCart(removed);
    setRemoved(null);
    clearTimeout(undoTimer.current);
  };

  const applyCode = (e: FormEvent, value = codeInput) => {
    e.preventDefault();
    const code = value.trim().toUpperCase();
    if (!code) return setCodeError("Enter a coupon code first");
    if (!COUPONS[code]) return setCodeError("This coupon code is not valid");
    setCodeError("");
    setCodeInput("");
    setPromo(code);
    notify(`Coupon ${code} applied, ${COUPONS[code]}% off`);
  };

  const toggleCredit = (on: boolean) => {
    setEditCredit(false);
    setCreditError("");
    setCredit(on ? Math.min(AVAILABLE_CREDIT, payableBeforeCredit) : 0);
  };

  const applyCredit = (e: FormEvent) => {
    e.preventDefault();
    const amount = Math.round(Number(creditInput));
    if (!creditInput.trim() || !Number.isFinite(amount) || amount < 0) return setCreditError("Enter a valid amount");
    if (amount > AVAILABLE_CREDIT) return setCreditError(`You have ${AVAILABLE_CREDIT} SAR credit available`);
    setCreditError("");
    setCredit(Math.min(amount, payableBeforeCredit));
    setEditCredit(false);
  };

  const inCart = (id: string) => cart.some((x) => x.id === id);
  const wishlist = courses.filter((c) => wishlistIds.includes(c.id) && !inCart(c.id)).reverse().slice(0, 4);
  const cartCategories = new Set(cart.map((c) => c.category));
  const recommended = courses
    .filter((c) => !inCart(c.id) && !wishlistIds.includes(c.id))
    .sort((a, b) => Number(cartCategories.has(b.category)) - Number(cartCategories.has(a.category)) || b.students - a.students)
    .slice(0, 4);

  const checkoutLabel = total === 0 ? "Enrol for free" : "Proceed to checkout";

  const undoBar = removed && (
    <div role="status" className="fade-up flex items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-3">
      <p dir="auto" className={`min-w-0 truncate text-sm text-slate-600 ${fontRegular}`}>
        Removed <span className={`text-slate-900 ${fontFor(removed.title, fontSemi)}`}>{removed.title}</span>
      </p>
      <button type="button" onClick={undoRemove} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-primary-700 transition hover:bg-primary-50 ${fontSemi}`}>
        <Icon icon={Undo02Icon} size={16} />
        Undo
      </button>
    </div>
  );

  return (
    <main className="w-full bg-slate-50 px-4 pb-32 pt-28 md:px-8 lg:pb-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3">
            <button type="button" onClick={() => openSearch({})} className={`flex w-fit items-center gap-1 text-sm text-slate-500 transition hover:text-primary-700 ${fontMedium}`}>
              <Icon icon={ArrowLeft01Icon} size={16} />
              Continue shopping
            </button>
            <h1 className={`m-0 flex items-center gap-3 text-3xl tracking-tight text-slate-900 md:text-4xl ${fontHeading}`} style={headingStyle}>
              Shopping cart
              {cart.length > 0 && <span className={`rounded-full bg-white px-3 py-1 text-sm tracking-normal text-slate-600 ring-1 ring-slate-200 ${fontMedium}`}>{cart.length} {cart.length === 1 ? "course" : "courses"}</span>}
            </h1>
          </div>
          {cart.length > 0 && <CheckoutSteps current={0} />}
        </header>

        {cart.length === 0 ? (
          <div className="flex flex-col gap-4">
            {undoBar}
            <div className="fade-up flex flex-col items-center gap-4 rounded-3xl border border-slate-150 bg-white px-6 py-16 text-center shadow-card">
              <span className="flex size-20 items-center justify-center rounded-full bg-primary-50 text-primary-700 ring-8 ring-primary-50/50">
                <Icon icon={ShoppingCart01Icon} size={34} />
              </span>
              <h2 className={`m-0 mt-2 text-2xl text-slate-900 ${fontHeading}`} style={headingStyle}>
                Your cart is empty
              </h2>
              <p className={`max-w-sm text-sm leading-relaxed text-slate-500 ${fontRegular}`}>Find a course you like and add it to your cart. It will wait for you here.</p>
              <button
                type="button"
                onClick={() => openSearch({})}
                className={`group mt-2 flex h-12 items-center gap-2 rounded-xl bg-secondary-500 px-7 text-base text-slate-900 shadow-card transition hover:bg-secondary-600 ${fontSemi}`}
              >
                Browse courses
                <Icon icon={ArrowRight01Icon} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="flex flex-col gap-4 lg:col-span-8">
              {saleDiscount > 0 && (
                <div className={`flex items-center gap-3 rounded-2xl bg-primary-700 px-4 py-3 text-sm text-white shadow-primary-button ${fontRegular}`}>
                  <span className="flex size-8 items-center justify-center rounded-full bg-white/15">
                    <Icon icon={Tag01Icon} size={16} />
                  </span>
                  <span>
                    Sale prices applied. You save <span className={fontSemi}>{sar(saleDiscount)}</span> on this order.
                  </span>
                </div>
              )}
              {undoBar}
              <ul className="flex flex-col gap-4">
                {cart.map((c) => (
                  <CartRow key={c.id} course={c} leaving={leaving.includes(c.id)} onRemove={() => remove(c)} />
                ))}
              </ul>
            </div>

            <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:col-span-4">
              <section className="overflow-hidden rounded-3xl border border-slate-150 bg-white shadow-panel">
                <div className="flex items-baseline justify-between px-6 pb-4 pt-6">
                  <h2 className={`m-0 text-xl text-slate-900 ${fontHeading}`} style={headingStyle}>
                    Order summary
                  </h2>
                  <span className={`text-13 text-slate-500 ${fontRegular}`}>
                    {cart.length} {cart.length === 1 ? "item" : "items"}
                  </span>
                </div>

                {/* Coupon */}
                <div className="px-6 pb-4">
                  {promo ? (
                    <div className="fade-up flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2.5">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-white text-primary-700 shadow-card">
                        <Icon icon={Tag01Icon} size={16} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className={`text-sm tracking-wide text-slate-900 ${fontSemi}`}>{promo}</span>
                        <span className={`text-xs text-primary-700 ${fontMedium}`}>{COUPONS[promo]}% off applied</span>
                      </span>
                      <button type="button" onClick={() => setPromo(null)} aria-label="Remove coupon" className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-red-600">
                        <Icon icon={Cancel01Icon} size={16} />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={applyCode} noValidate className="flex flex-col gap-2">
                      <label htmlFor="coupon" className={`text-13 text-slate-600 ${fontMedium}`}>
                        Coupon code
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="coupon"
                          value={codeInput}
                          onChange={(e) => {
                            setCodeInput(e.target.value);
                            if (codeError) setCodeError("");
                          }}
                          placeholder="Enter code"
                          autoComplete="off"
                          aria-invalid={!!codeError}
                          aria-describedby={codeError ? "coupon-error" : undefined}
                          className={`field h-11 min-w-0 flex-1 uppercase placeholder:normal-case ${codeError ? "border-red-400" : ""}`}
                        />
                        <button
                          type="submit"
                          disabled={!codeInput.trim()}
                          className={`h-11 shrink-0 rounded-xl bg-slate-900 px-4 text-sm text-white transition hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 ${fontSemi}`}
                        >
                          Apply
                        </button>
                      </div>
                      {codeError && (
                        <p id="coupon-error" className={`fade-up text-13 text-red-600 ${fontRegular}`}>
                          {codeError}
                        </p>
                      )}
                      <p className={`flex flex-wrap items-center gap-1.5 text-xs text-slate-400 ${fontRegular}`}>
                        Try
                        {Object.keys(COUPONS).map((code) => (
                          <button
                            key={code}
                            type="button"
                            onClick={(e) => applyCode(e, code)}
                            className={`rounded-md border border-dashed border-slate-300 px-1.5 py-0.5 text-slate-600 transition hover:border-primary-500 hover:text-primary-700 ${fontMedium}`}
                          >
                            {code}
                          </button>
                        ))}
                      </p>
                    </form>
                  )}
                </div>

                {/* Credit */}
                <div className="mx-6 mb-5 rounded-xl border border-slate-150 bg-slate-25 px-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-secondary-100 text-secondary-800">
                      <Icon icon={Wallet01Icon} size={16} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={`text-sm text-slate-900 ${fontSemi}`}>Use Thkee credit</span>
                      <span className={`text-xs text-slate-500 ${fontRegular}`}>
                        {credit > 0 ? `${sar(creditUsed)} applied · ${sar(AVAILABLE_CREDIT - creditUsed)} left` : `${sar(AVAILABLE_CREDIT)} available`}
                      </span>
                    </span>
                    <Switch checked={credit > 0} disabled={payableBeforeCredit === 0 && credit === 0} onChange={toggleCredit} label="Use Thkee credit" />
                  </div>
                  {credit > 0 && !editCredit && (
                    <button
                      type="button"
                      onClick={() => {
                        setCreditInput(String(creditUsed));
                        setEditCredit(true);
                      }}
                      className={`mt-2 pl-11 text-xs text-primary-700 underline underline-offset-2 transition hover:text-primary-800 ${fontMedium}`}
                    >
                      Change amount
                    </button>
                  )}
                  {editCredit && (
                    <form onSubmit={applyCredit} noValidate className="fade-up mt-3 flex flex-col gap-1.5">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={AVAILABLE_CREDIT}
                          value={creditInput}
                          autoFocus
                          onChange={(e) => {
                            setCreditInput(e.target.value);
                            if (creditError) setCreditError("");
                          }}
                          aria-label="Credit amount in SAR"
                          aria-invalid={!!creditError}
                          className={`field h-10 min-w-0 flex-1 ${creditError ? "border-red-400" : ""}`}
                        />
                        <button type="submit" className={`h-10 shrink-0 rounded-xl bg-slate-900 px-3.5 text-sm text-white transition hover:bg-slate-700 ${fontSemi}`}>
                          Save
                        </button>
                        <button type="button" onClick={() => setEditCredit(false)} className={`h-10 shrink-0 rounded-xl px-2.5 text-sm text-slate-500 transition hover:bg-slate-100 ${fontMedium}`}>
                          Cancel
                        </button>
                      </div>
                      {creditError && <p className={`text-13 text-red-600 ${fontRegular}`}>{creditError}</p>}
                    </form>
                  )}
                </div>

                {/* Totals */}
                <div className="flex flex-col gap-3 border-t border-slate-150 px-6 py-5">
                  <Line label="Original price" value={sar(subtotal)} />
                  {saleDiscount > 0 && <Line label="Sale discount" value={`-${sar(saleDiscount)}`} tone="save" />}
                  {promoDiscount > 0 && <Line label={`Coupon (${promo})`} value={`-${sar(promoDiscount)}`} tone="save" />}
                  {creditUsed > 0 && <Line label="Thkee credit" value={`-${sar(creditUsed)}`} tone="save" />}
                </div>

                <div className="flex flex-col gap-4 border-t border-slate-150 bg-slate-25 px-6 pb-6 pt-5">
                  <div className="flex items-end justify-between gap-3">
                    <span className={`text-base text-slate-900 ${fontSemi}`}>Total</span>
                    <span className="flex flex-col items-end gap-1">
                      <span key={total} className={`fade-up text-3xl leading-none tracking-tight text-slate-900 ${fontHeading}`} style={headingStyle}>
                        {total === 0 ? "Free" : sar(total)}
                      </span>
                      {savings > 0 && (
                        <span className={`rounded-full bg-primary-100 px-2.5 py-0.5 text-xs text-primary-700 ${fontSemi}`}>
                          You save {sar(savings)} ({savingsPercent}%)
                        </span>
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={checkout}
                    className={`group flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-secondary-500 text-base text-slate-900 shadow-card transition hover:bg-secondary-600 active:scale-99 ${fontSemi}`}
                  >
                    <Icon icon={LockIcon} size={18} />
                    {checkoutLabel}
                    <Icon icon={ArrowRight01Icon} size={18} className="transition-transform group-hover:translate-x-1" />
                  </button>

                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-xs text-slate-400 ${fontRegular}`}>Secure payment with</span>
                    <MadaBadge />
                    <VisaBadge />
                    <MastercardBadge />
                  </div>
                </div>
              </section>

              <ul className={`flex flex-col gap-3 rounded-2xl border border-slate-150 bg-white px-5 py-4 text-13 text-slate-600 ${fontRegular}`}>
                {[
                  { icon: RefreshIcon, text: "30-day money-back guarantee" },
                  { icon: Infinity01Icon, text: "Full lifetime access" },
                  { icon: Certificate01Icon, text: "Certificate of completion" },
                ].map((b) => (
                  <li key={b.text} className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                      <Icon icon={b.icon} size={15} />
                    </span>
                    {b.text}
                    <Icon icon={Tick02Icon} size={16} className="ml-auto text-primary-500" />
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        )}

        {[
          { title: "Recommended for you", sub: cart.length ? "Based on the courses in your cart" : "Popular with Thkee learners", items: recommended },
          { title: "From your wishlist", sub: "Courses you saved for later", items: wishlist },
        ].map(
          (section) =>
            section.items.length > 0 && (
              <section key={section.title} className="flex flex-col gap-6 pt-10">
                <div className="flex flex-col gap-1">
                  <h2 className={`m-0 text-2xl text-slate-900 md:text-3xl ${fontHeading}`} style={headingStyle}>
                    {section.title}
                  </h2>
                  <p className={`text-sm text-slate-500 ${fontRegular}`}>{section.sub}</p>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {section.items.map((c) => (
                    <ResultCard key={c.id} course={c} />
                  ))}
                </div>
              </section>
            ),
        )}
      </div>

      {/* Phones: total and checkout stay in reach while scrolling the list. */}
      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-4">
            <span className="flex flex-col">
              <span className={`text-xs text-slate-500 ${fontRegular}`}>Total</span>
              <span className={`text-lg leading-tight text-slate-900 ${fontBold}`}>{total === 0 ? "Free" : sar(total)}</span>
            </span>
            <button
              type="button"
              onClick={checkout}
              className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-secondary-500 text-15 text-slate-900 transition hover:bg-secondary-600 active:scale-99 ${fontSemi}`}
            >
              <Icon icon={LockIcon} size={16} />
              {total === 0 ? "Enrol for free" : "Checkout"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
