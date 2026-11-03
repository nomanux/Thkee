import { useState, type FormEvent, type ReactNode } from "react";
import { courses, type Course } from "../data";
import { fontBold, fontFor, fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { AVAILABLE_CREDIT, COUPONS, formatPrice, orderTotals, useApp } from "../store";
import { CourseThumb } from "./Overlays";
import { ResultCard } from "./SearchPage";


const sar = (n: number) => `${Math.round(n).toLocaleString()} SAR`;

function Stars({ rating }: { rating: number }) {
  return (
    <span className="relative inline-flex text-[16px] leading-none" aria-label={`${rating.toFixed(1)} out of 5`}>
      <span className="text-[#e2e8f0]">★★★★★</span>
      <span className="absolute inset-y-0 left-0 overflow-hidden text-[#f5a524]" style={{ width: `${(rating / 5) * 100}%` }}>
        ★★★★★
      </span>
    </span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CartRow({ course }: { course: Course }) {
  const { setOverlay, removeFromCart, moveToWishlist } = useApp();
  const onSale = !!course.originalPrice && course.originalPrice > course.price;
  return (
    <li className="flex flex-col gap-4 rounded-[12px] border border-[#eef2f6] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:flex-row sm:gap-5 sm:p-5">
      <button type="button" onClick={() => setOverlay({ type: "course", id: course.id })} className="shrink-0 overflow-hidden rounded-[8px] sm:w-[148px]" aria-label={`View ${course.title}`}>
        <CourseThumb course={course} showTitle={false} className="aspect-video [&>span]:hidden" />
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <button
          type="button"
          dir="auto"
          onClick={() => setOverlay({ type: "course", id: course.id })}
          className={`text-left text-[18px] leading-[26px] text-[#1e293b] transition-colors hover:text-[#0d5c4b] ${fontFor(course.title, fontSemi)}`}
        >
          {course.title}
        </button>
        <p dir="auto" className={`text-left text-[14px] text-[#94a3b8] ${fontFor(course.instructor, fontRegular, "font-normal")}`}>
          by {course.instructor}
        </p>
        <p className={`flex items-center gap-2 text-[13px] text-[#475569] ${fontRegular}`}>
          <Stars rating={course.rating} />
          {course.rating.toFixed(1)} ({Math.round(course.students * 0.23).toLocaleString()})
        </p>
      </div>
      <div className="flex shrink-0 flex-row items-end justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
        <div className="flex flex-col items-start gap-0.5 sm:items-end">
          <span className={`flex items-center gap-1.5 text-[20px] ${course.price === 0 ? "text-[#0d5c4b]" : "text-[#b91c1c]"} ${fontBold}`}>
            {formatPrice(course.price)}
            {onSale && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#c0262d" aria-hidden="true">
                <path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8zM7.5 9A1.5 1.5 0 107.5 6a1.5 1.5 0 000 3z" />
              </svg>
            )}
          </span>
          {onSale && <span className={`text-[18px] text-[#94a3b8] ${fontRegular}`}>{formatPrice(course.originalPrice!)}</span>}
          {onSale && (
            <span className={`mt-1 flex items-center gap-1.5 text-[14px] text-[#b91c1c] ${fontMedium}`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              5 hours left
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 sm:mt-auto sm:pt-3">
          <button type="button" onClick={() => moveToWishlist(course.id)} className={`text-[15px] text-[#94a3b8] underline underline-offset-4 transition-colors hover:text-[#0d5c4b] ${fontRegular}`}>
            Move to Wishlist
          </button>
          <span className="h-4 w-px bg-[#e2e8f0]" aria-hidden="true" />
          <button type="button" onClick={() => removeFromCart(course.id)} aria-label={`Remove ${course.title} from cart`} className="flex size-8 items-center justify-center rounded-[8px] text-[#64748b] transition hover:bg-[#fee2e2] hover:text-[#dc2626]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4h6v3" />
            </svg>
          </button>
        </div>
      </div>
    </li>
  );
}

function Panel({ title, status, statusClass, open, onToggle, children }: { title: string; status?: string; statusClass?: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="border-t border-dashed border-[#e2e8f0] px-6 py-5">
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full items-start justify-between gap-3 text-left">
        <span className="flex flex-col gap-1">
          <span className={`text-[16px] text-[#475569] ${fontRegular}`}>{title}</span>
          {status && <span className={`text-[14px] ${statusClass} ${fontSemi}`}>{status}</span>}
        </span>
        <span className="mt-1 text-[#0f172a]">
          <Chevron open={open} />
        </span>
      </button>
      {open && <div className="fade-up mt-4">{children}</div>}
    </div>
  );
}

export default function CartPage() {
  const { cart, checkout, openSearch, wishlistIds, notify, promo, setPromo, credit, setCredit } = useApp();
  const [couponOpen, setCouponOpen] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [creditInput, setCreditInput] = useState("50");
  const [creditError, setCreditError] = useState("");

  const { subtotal, saleDiscount, salePercent, promoDiscount, creditUsed, total } = orderTotals(cart, promo, credit);

  const applyCode = (e: FormEvent) => {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase();
    if (!code) return setCodeError("Enter a coupon code first");
    if (!COUPONS[code]) return setCodeError("Entered coupon is not valid!");
    setCodeError("");
    setPromo(code);
    setCouponOpen(false);
    notify(`Coupon ${code} applied — ${COUPONS[code]}% off`);
  };

  const applyCredit = (e: FormEvent) => {
    e.preventDefault();
    const amount = Math.round(Number(creditInput));
    if (!Number.isFinite(amount) || amount < 0) return setCreditError("Enter a valid amount");
    if (amount > AVAILABLE_CREDIT) return setCreditError(`You only have ${AVAILABLE_CREDIT} credit available`);
    setCreditError("");
    setCredit(amount);
    setCreditOpen(false);
  };

  const inCart = (id: string) => cart.some((x) => x.id === id);
  const wishlist = courses.filter((c) => wishlistIds.includes(c.id) && !inCart(c.id)).reverse().slice(0, 4);
  const cartCategories = new Set(cart.map((c) => c.category));
  const recommended = courses
    .filter((c) => !inCart(c.id) && !wishlistIds.includes(c.id))
    .sort((a, b) => Number(cartCategories.has(b.category)) - Number(cartCategories.has(a.category)) || b.students - a.students)
    .slice(0, 4);
  const smallInput = (error: string) =>
    `h-[36px] min-w-0 flex-1 rounded-[6px] border bg-white px-3 text-[14px] text-[#0f172a] outline-none transition focus:border-[#1e293b] ${error ? "border-[#ef4444]" : "border-[#cbd5e1]"} ${fontMedium}`;
  const applyBtn = `h-[36px] shrink-0 rounded-[6px] border border-[#3fb27f] px-3.5 text-[14px] text-[#3fb27f] transition hover:bg-[#3fb27f] hover:text-white ${fontMedium}`;

  return (
    <main className="w-full bg-[#f5f5f5] px-4 pb-20 pt-[112px] md:px-8">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-8">
        <h1 className={`m-0 text-[32px] tracking-[-0.8px] text-[#0f172a] md:text-[40px] ${fontHeading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
          Shopping cart
        </h1>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-[16px] border border-[#eef2f6] bg-white px-6 py-20 text-center">
            <span className="text-[56px]">🛒</span>
            <p className={`text-[22px] text-[#0f172a] ${fontHeading}`}>Your cart is empty</p>
            <p className={`max-w-[420px] text-[15px] text-[#64748b] ${fontRegular}`}>Find a course you like and add it to your cart. It will wait for you here.</p>
            <button type="button" onClick={() => openSearch({})} className={`mt-2 h-[48px] rounded-[10px] bg-[#ffb20d] px-7 text-[16px] text-[#1e293b] transition hover:bg-[#faa104] ${fontSemi}`}>
              Browse courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
            <ul className="flex flex-col gap-5">
              {cart.map((c) => (
                <CartRow key={c.id} course={c} />
              ))}
            </ul>

            <aside className="overflow-hidden rounded-[16px] border border-[#eef2f6] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] lg:sticky lg:top-[96px]">
              <div className="flex flex-col gap-5 px-6 pb-6 pt-7">
                <h2 className={`m-0 text-[24px] text-[#0f172a] ${fontHeading}`}>Payment summary</h2>
                <p className={`text-[16px] text-[#1e293b] ${fontRegular}`}>
                  You have added {cart.length} {cart.length === 1 ? "course" : "courses"} in your cart.
                </p>
              </div>

              <Panel title="Have a coupon code?" status={promo ? "1 Coupon Applied" : undefined} statusClass="text-[#16a34a]" open={couponOpen} onToggle={() => setCouponOpen((o) => !o)}>
                <form onSubmit={applyCode} noValidate className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      value={codeInput}
                      onChange={(e) => {
                        setCodeInput(e.target.value);
                        if (codeError) setCodeError("");
                      }}
                      placeholder="Enter coupon code"
                      aria-label="Coupon code"
                      aria-invalid={!!codeError}
                      className={`${smallInput(codeError)} uppercase placeholder:normal-case`}
                    />
                    <button type="submit" className={applyBtn}>
                      Apply
                    </button>
                  </div>
                  {codeError && <p className={`text-[14px] text-[#dc2626] ${fontRegular}`}>{codeError}</p>}
                  {promo && !codeError && <p className={`text-[13px] text-[#16a34a] ${fontMedium}`}>{promo} applied — {COUPONS[promo]}% off</p>}
                  <p className={`text-[12px] text-[#94a3b8] ${fontRegular}`}>Demo codes: THKEE10, LEARN15, WELCOME20</p>
                </form>
              </Panel>

              <Panel title="Apply your credit" status={credit ? `${credit} Credit Used` : `${AVAILABLE_CREDIT} credit available`} statusClass={credit ? "text-[#ea580c]" : "text-[#94a3b8]"} open={creditOpen} onToggle={() => setCreditOpen((o) => !o)}>
                <form onSubmit={applyCredit} noValidate className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={AVAILABLE_CREDIT}
                      value={creditInput}
                      onChange={(e) => {
                        setCreditInput(e.target.value);
                        if (creditError) setCreditError("");
                      }}
                      aria-label="Credit amount"
                      aria-invalid={!!creditError}
                      className={smallInput(creditError)}
                    />
                    <button type="submit" className={applyBtn}>
                      Apply
                    </button>
                  </div>
                  {creditError && <p className={`text-[14px] text-[#dc2626] ${fontRegular}`}>{creditError}</p>}
                  <p className={`text-[14px] text-[#1e293b] ${fontSemi}`}>Remaining Credit : {AVAILABLE_CREDIT - credit}</p>
                </form>
              </Panel>

              <div className={`flex flex-col gap-1 border-t border-dashed border-[#e2e8f0] px-4 py-5 text-[16px] ${fontRegular}`}>
                <div className="flex items-center justify-between px-2 py-2.5 text-[18px] text-[#1e293b]">
                  <span>Subtotal</span>
                  <span>{sar(subtotal)}</span>
                </div>
                {saleDiscount > 0 && (
                  <div className="flex items-center justify-between px-2 py-2.5 text-[#94a3b8]">
                    <span>Discount ({salePercent}%)</span>
                    <span>-{sar(saleDiscount)}</span>
                  </div>
                )}
                {promo && (
                  <div className="flex items-center justify-between px-2 py-2.5 text-[#94a3b8]">
                    <span className="flex items-center gap-3">
                      Promo Code
                      <button type="button" onClick={() => setPromo(null)} className={`text-[13px] italic text-[#dc2626] underline underline-offset-2 ${fontMedium}`}>
                        remove
                      </button>
                    </span>
                    <span>-{sar(promoDiscount)}</span>
                  </div>
                )}
                {creditUsed > 0 && (
                  <div className="flex items-center justify-between rounded-[6px] bg-[#f1f5f9] px-2 py-3 text-[#64748b]">
                    <span className="flex items-center gap-3">
                      Credit Applied
                      <button type="button" onClick={() => setCreditOpen(true)} className={`text-[13px] italic text-[#0f172a] underline underline-offset-2 ${fontMedium}`}>
                        Change
                      </button>
                    </span>
                    <span>-{sar(creditUsed)}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-dashed border-[#e2e8f0] px-6 pb-6 pt-5">
                <div className={`flex items-center justify-between pb-6 text-[20px] text-[#1e293b] ${fontRegular}`}>
                  <span>Total</span>
                  <span className={fontBold}>{total === 0 ? "Free" : sar(total)}</span>
                </div>
                <button type="button" onClick={checkout} className={`h-[44px] rounded-[8px] bg-[#ffb20d] text-[15px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
                  Proceed to Checkout
                </button>
                <button type="button" onClick={() => openSearch({})} className={`h-[44px] rounded-[8px] border border-[#1e293b] text-[15px] text-[#1e293b] transition hover:bg-[#1e293b] hover:text-white ${fontMedium}`}>
                  Continue shopping
                </button>
              </div>
            </aside>
          </div>
        )}

        {[
          { title: "Recommended For You", items: recommended },
          { title: "Recently Wishlisted Courses", items: wishlist },
        ].map(
          (section) =>
            section.items.length > 0 && (
              <section key={section.title} className="flex flex-col gap-6 pt-10">
                <h2 className={`m-0 text-[26px] text-[#0f172a] md:text-[30px] ${fontHeading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
                  {section.title}
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {section.items.map((c) => (
                    <ResultCard key={c.id} course={c} />
                  ))}
                </div>
              </section>
            ),
        )}
      </div>
    </main>
  );
}
